<?php

namespace App\Http\Controllers;

use App\Helpers\LogHelper;
use App\Models\CategorieTitre;
use App\Models\FichierDocument;
use App\Models\MotCle;
use App\Models\TitrePerception;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class TitrePerceptionController extends Controller
{
    public function index(Request $request)
    {
        $query = TitrePerception::with([
            'categorieTitre', 'assujetti', 'division.direction', 'centre',
            'articleBudgetaire', 'classeur', 'emplacement', 'createur', 'motsCles',
        ])->withCount('fichiers');

        $user = $request->user();
        if ($user && !$user->hasGlobalDivisionAccess()) {
            $divisionIds = $user->accessibleDivisionIds();

            if (!empty($divisionIds)) {
                $query->where(function ($scope) use ($divisionIds) {
                    $scope->whereIn('id_division', $divisionIds)->orWhereNull('id_division');
                });
            }
        }

        if ($request->filled('search')) {
            $search = addcslashes($request->search, '%_\\');
            $query->where(function ($q) use ($search) {
                $q->where('reference', 'like', "%{$search}%")
                    ->orWhere('numero_titre', 'like', "%{$search}%")
                    ->orWhere('reference_dossier', 'like', "%{$search}%")
                    ->orWhere('reference_declaration', 'like', "%{$search}%")
                    ->orWhereHas('assujetti', fn ($sq) => $sq->where('nom_raison_sociale', 'like', "%{$search}%"))
                    ->orWhereHas('fichiers.traitementsOcr', fn ($sq) => $sq->where('texte_extrait', 'like', "%{$search}%"));
            });
        }

        foreach ([
            'id_categorie_titre', 'id_assujetti', 'id_division', 'id_centre_ordonnancement',
            'id_article_budgetaire', 'id_classeur', 'id_emplacement', 'statut', 'devise',
        ] as $filter) {
            if ($request->filled($filter)) {
                $query->where($filter, $request->input($filter));
            }
        }

        if ($request->filled('date_debut')) {
            $query->whereDate('date_titre', '>=', $request->date_debut);
        }
        if ($request->filled('date_fin')) {
            $query->whereDate('date_titre', '<=', $request->date_fin);
        }

        return response()->json($query->orderByDesc('id')->paginate($request->get('per_page', 20)));
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'reference' => 'nullable|string|max:100|unique:titres_perception,reference',
            'numero_titre' => 'nullable|string|max:100|unique:titres_perception,numero_titre',
            'id_categorie_titre' => 'required|integer|exists:categories_titres,id',
            'id_assujetti' => 'nullable|integer|exists:assujettis,id',
            'id_division' => 'nullable|integer|exists:divisions,id',
            'id_centre_ordonnancement' => 'nullable|integer|exists:centre_ordonnancements,id',
            'id_article_budgetaire' => 'nullable|integer|exists:articles_budgetaires,id',
            'id_classeur' => 'nullable|integer|exists:classeurs,id',
            'id_emplacement' => 'nullable|integer|exists:emplacements,id',
            'reference_dossier' => 'nullable|string|max:100',
            'reference_declaration' => 'nullable|string|max:100',
            'date_titre' => 'nullable|date',
            'date_enregistrement' => 'nullable|date',
            'date_ordonnancement' => 'nullable|date',
            'montant' => 'nullable|numeric|min:0',
            'devise' => 'nullable|string|max:10',
            'objet' => 'nullable|string',
            'observations' => 'nullable|string',
            'statut' => 'nullable|in:brouillon,actif,archive,annule',
            'mots_cles' => 'nullable|array',
            'mots_cles.*' => 'string|max:100',
            'mots_cle_ids' => 'nullable|array',
            'mots_cle_ids.*' => 'exists:mots_cles,id',
        ]);

        $data['id_division'] = $data['id_division'] ?? optional($request->user())->id_division;
        $data['id_user_createur'] = optional($request->user())->id;
        $data['date_enregistrement'] = $data['date_enregistrement'] ?? now()->toDateString();
        $data['statut'] = $data['statut'] ?? 'brouillon';

        $categorie = CategorieTitre::findOrFail($data['id_categorie_titre']);
        $this->enforceCategoryRules($categorie, $data);
        $data['reference'] = $data['reference'] ?? $this->generateReference($categorie);

        $titre = TitrePerception::create($data);
        $this->syncMotsCles($titre, $request);

        LogHelper::create('titres_perception', $titre->id, 'Creation du titre : ' . $titre->reference);

        return response()->json([
            'success' => true,
            'data' => $titre->load(['categorieTitre', 'assujetti', 'division', 'centre', 'articleBudgetaire', 'motsCles']),
        ], 201);
    }

    public function show(Request $request, $id)
    {
        $titre = TitrePerception::with([
            'categorieTitre', 'assujetti', 'division.direction', 'centre', 'articleBudgetaire',
            'classeur', 'emplacement', 'createur', 'modificateur', 'validateur', 'motsCles',
            'fichiers.traitementsOcr',
        ])->findOrFail($id);

        if (!$request->user()?->hasPermission('ocr.view')) {
            $titre->fichiers->each(function (FichierDocument $fichier) {
                $fichier->makeHidden(['montext', 'ocr_status', 'ocr_method']);
                $fichier->unsetRelation('traitementsOcr');
            });
        }

        return response()->json(['success' => true, 'data' => $titre]);
    }

    public function update(Request $request, $id)
    {
        $titre = TitrePerception::findOrFail($id);

        $data = $request->validate([
            'reference' => 'nullable|string|max:100|unique:titres_perception,reference,' . $id,
            'numero_titre' => 'nullable|string|max:100|unique:titres_perception,numero_titre,' . $id,
            'id_categorie_titre' => 'required|integer|exists:categories_titres,id',
            'id_assujetti' => 'nullable|integer|exists:assujettis,id',
            'id_division' => 'nullable|integer|exists:divisions,id',
            'id_centre_ordonnancement' => 'nullable|integer|exists:centre_ordonnancements,id',
            'id_article_budgetaire' => 'nullable|integer|exists:articles_budgetaires,id',
            'id_classeur' => 'nullable|integer|exists:classeurs,id',
            'id_emplacement' => 'nullable|integer|exists:emplacements,id',
            'reference_dossier' => 'nullable|string|max:100',
            'reference_declaration' => 'nullable|string|max:100',
            'date_titre' => 'nullable|date',
            'date_enregistrement' => 'nullable|date',
            'date_ordonnancement' => 'nullable|date',
            'montant' => 'nullable|numeric|min:0',
            'devise' => 'nullable|string|max:10',
            'objet' => 'nullable|string',
            'observations' => 'nullable|string',
            'statut' => 'nullable|in:brouillon,actif,archive,annule',
            'mots_cles' => 'nullable|array',
            'mots_cles.*' => 'string|max:100',
            'mots_cle_ids' => 'nullable|array',
            'mots_cle_ids.*' => 'exists:mots_cles,id',
        ]);

        $data['id_user_modificateur'] = optional($request->user())->id;

        $categorie = CategorieTitre::findOrFail($data['id_categorie_titre']);
        $this->enforceCategoryRules($categorie, array_merge($titre->toArray(), $data));

        $titre->update($data);
        $this->syncMotsCles($titre, $request);

        LogHelper::update('titres_perception', $titre->id, 'Modification du titre : ' . $titre->reference);

        return response()->json([
            'success' => true,
            'data' => $titre->load(['categorieTitre', 'assujetti', 'division', 'centre', 'articleBudgetaire', 'motsCles']),
        ]);
    }

    public function validateTitre(Request $request, $id)
    {
        $titre = TitrePerception::findOrFail($id);

        $titre->update([
            'statut' => 'actif',
            'id_user_validateur' => optional($request->user())->id,
            'date_validation' => now(),
        ]);

        LogHelper::update('titres_perception', $titre->id, 'Validation du titre : ' . $titre->reference);

        return response()->json(['success' => true, 'data' => $titre]);
    }

    public function destroy($id)
    {
        $titre = TitrePerception::findOrFail($id);
        $titre->update(['statut' => 'annule']);
        $titre->delete();

        LogHelper::delete('titres_perception', $id, 'Annulation du titre : ' . $titre->reference);

        return response()->json(['success' => true, 'message' => 'Titre annule']);
    }

    private function enforceCategoryRules(CategorieTitre $categorie, array $data): void
    {
        $champs = $categorie->champs_obligatoires ?? [];

        if (!is_array($champs)) {
            return;
        }

        $erreurs = [];

        foreach ($champs as $champ) {
            $valeur = $data[$champ] ?? null;

            if ($valeur === null || $valeur === '' || (is_array($valeur) && empty($valeur))) {
                $erreurs[$champ] = "Le champ « {$champ} » est obligatoire pour la categorie {$categorie->libelle}.";
            }
        }

        if (!empty($erreurs)) {
            throw ValidationException::withMessages($erreurs);
        }
    }

    private function generateReference(CategorieTitre $categorie): string
    {
        $regle = $categorie->regle_numerotation ?: 'TP-{YYYY}-{SEQ}';
        $sequence = (int) TitrePerception::withTrashed()
            ->where('id_categorie_titre', $categorie->id)
            ->max('id') + 1;

        do {
            $reference = str_replace(
                ['{YYYY}', '{SEQ}', '{CAT}'],
                [date('Y'), str_pad((string) $sequence, 6, '0', STR_PAD_LEFT), $categorie->code],
                $regle
            );
            $sequence++;
        } while (TitrePerception::withTrashed()->where('reference', $reference)->exists());

        return $reference;
    }

    private function syncMotsCles(TitrePerception $titre, Request $request): void
    {
        if ($request->has('mots_cle_ids')) {
            $titre->motsCles()->sync($request->input('mots_cle_ids', []));
            return;
        }

        if ($request->has('mots_cles')) {
            $ids = collect($request->input('mots_cles', []))
                ->filter()
                ->map(fn ($libelle) => MotCle::firstOrCreate(['libelle' => trim($libelle)])->id)
                ->all();

            $titre->motsCles()->sync($ids);
        }
    }
}
