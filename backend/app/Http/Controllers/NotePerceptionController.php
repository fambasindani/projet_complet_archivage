<?php

namespace App\Http\Controllers;

use App\Helpers\LogHelper;
use App\Models\CategorieTitre;
use App\Models\Division;
use App\Models\NotePerception;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class NotePerceptionController extends Controller
{
    private function baseQuery()
    {
        return NotePerception::with([
            'classeur',
            'centre',
            'assujetti',
            'emplacement',
            'utilisateur',
            'articleBudgetaire',
        ])->where('statut', '!=', 'annule');
    }

    public function getNote(Request $request)
    {
        return $this->baseQuery()
            ->orderByDesc('id')
            ->paginate($request->input('per_page', 20));
    }

    public function getNote_centre($id)
    {
        return $this->baseQuery()
            ->where('id_centre_ordonnancement', $id)
            ->orderByDesc('id')
            ->paginate(10);
    }

    public function searchnote(Request $request)
    {
        $search = addcslashes((string) $request->input('search'), '%_\\');

        return $this->baseQuery()
            ->where(function ($query) use ($search) {
                $query->where('numero_titre', 'like', "%{$search}%")
                    ->orWhere('reference', 'like', "%{$search}%")
                    ->orWhere('reference_declaration', 'like', "%{$search}%")
                    ->orWhereHas('classeur', fn ($q) => $q->where('nom_classeur', 'like', "%{$search}%"))
                    ->orWhereHas('centre', fn ($q) => $q->where('nom', 'like', "%{$search}%"))
                    ->orWhereHas('emplacement', fn ($q) => $q->where('nom_emplacement', 'like', "%{$search}%"))
                    ->orWhereHas('assujetti', fn ($q) => $q->where('nom_raison_sociale', 'like', "%{$search}%"));
            })
            ->orderByDesc('id')
            ->paginate($request->input('per_page', 20));
    }

    public function searchnote_id(Request $request, $id)
    {
        $search = addcslashes((string) $request->input('search'), '%_\\');

        return $this->baseQuery()
            ->where('id_centre_ordonnancement', $id)
            ->where(function ($query) use ($search) {
                $query->where('numero_titre', 'like', "%{$search}%")
                    ->orWhere('reference', 'like', "%{$search}%")
                    ->orWhereHas('assujetti', fn ($q) => $q->where('nom_raison_sociale', 'like', "%{$search}%"));
            })
            ->orderByDesc('id')
            ->paginate(10);
    }

    public function searchnote_idcentre(Request $request, $id)
    {
        return $this->searchnote_id($request, $id);
    }

    public function createnote(Request $request)
    {
        $validated = $request->validate([
            'id_ministere' => 'required|integer|exists:articles_budgetaires,id',
            'numero_serie' => 'required|string|max:100',
            'numero_article' => 'nullable|string|max:100',
            'date_ordonnancement' => 'required|date',
            'date_enregistrement' => 'required|date',
            'id_classeur' => 'required|integer|exists:classeurs,id',
            'id_centre_ordonnancement' => 'required|integer|exists:centre_ordonnancements,id',
            'id_assujetti' => 'required|integer|exists:assujettis,id',
            'id_emplacement' => 'required|integer|exists:emplacements,id',
            'id_categorie_titre' => 'nullable|integer|exists:categories_titres,id',
            'reference' => 'nullable|string|max:100|unique:titres_perception,reference',
            'montant' => 'nullable|numeric',
            'devise' => 'nullable|string|max:10',
            'objet' => 'nullable|string',
            'observations' => 'nullable|string',
        ], [
            'id_ministere.required' => 'Le champ ministere est obligatoire.',
        ]);

        $categorie = $this->resolveCategorie($request->input('id_categorie_titre'));
        $divisionId = $request->user()->id_division
            ?? optional(Division::first())->id;

        $titre = NotePerception::create([
            'reference' => $validated['reference'] ?? null,
            'numero_titre' => $validated['numero_serie'],
            'id_categorie_titre' => $categorie->id,
            'id_assujetti' => $validated['id_assujetti'],
            'id_division' => $divisionId,
            'id_centre_ordonnancement' => $validated['id_centre_ordonnancement'],
            'id_article_budgetaire' => $validated['id_ministere'],
            'id_classeur' => $validated['id_classeur'],
            'id_emplacement' => $validated['id_emplacement'],
            'reference_declaration' => $validated['numero_article'] ?? null,
            'date_titre' => $validated['date_ordonnancement'],
            'date_ordonnancement' => $validated['date_ordonnancement'],
            'date_enregistrement' => $validated['date_enregistrement'],
            'montant' => $validated['montant'] ?? null,
            'devise' => $validated['devise'] ?? 'CDF',
            'objet' => $validated['objet'] ?? null,
            'observations' => $validated['observations'] ?? null,
            'statut' => 'actif',
            'id_user_createur' => $request->user()->id,
        ]);

        LogHelper::create('titres_perception', $titre->id, 'Creation du titre de perception : ' . $titre->numero_titre);

        return response()->json([
            'success' => true,
            'message' => 'Note enregistree avec succes',
            'data' => $titre->load(['classeur', 'centre', 'assujetti', 'emplacement', 'utilisateur', 'articleBudgetaire']),
        ], 201);
    }

    public function editnote($id)
    {
        return NotePerception::with(['classeur', 'centre', 'assujetti', 'emplacement', 'utilisateur', 'articleBudgetaire'])
            ->findOrFail($id);
    }

    public function note(Request $request, $id)
    {
        $note = NotePerception::findOrFail($id);

        $validated = $request->validate([
            'id_ministere' => 'required|integer|exists:articles_budgetaires,id',
            'numero_serie' => 'required|string|max:100',
            'numero_article' => 'nullable|string|max:100',
            'date_ordonnancement' => 'required|date',
            'date_enregistrement' => 'required|date',
            'id_classeur' => 'required|integer|exists:classeurs,id',
            'id_centre_ordonnancement' => 'required|integer|exists:centre_ordonnancements,id',
            'id_assujetti' => 'required|integer|exists:assujettis,id',
            'id_emplacement' => 'required|integer|exists:emplacements,id',
            'id_categorie_titre' => 'nullable|integer|exists:categories_titres,id',
            'montant' => 'nullable|numeric',
            'devise' => 'nullable|string|max:10',
            'objet' => 'nullable|string',
            'observations' => 'nullable|string',
        ]);

        $note->update([
            'numero_titre' => $validated['numero_serie'],
            'id_categorie_titre' => $request->input('id_categorie_titre', $note->id_categorie_titre),
            'id_assujetti' => $validated['id_assujetti'],
            'id_centre_ordonnancement' => $validated['id_centre_ordonnancement'],
            'id_article_budgetaire' => $validated['id_ministere'],
            'id_classeur' => $validated['id_classeur'],
            'id_emplacement' => $validated['id_emplacement'],
            'reference_declaration' => $validated['numero_article'] ?? null,
            'date_titre' => $validated['date_ordonnancement'],
            'date_ordonnancement' => $validated['date_ordonnancement'],
            'date_enregistrement' => $validated['date_enregistrement'],
            'id_user_modificateur' => $request->user()->id,
        ]);

        if ($request->filled('montant')) {
            $note->montant = $request->montant;
        }
        if ($request->filled('devise')) {
            $note->devise = $request->devise;
        }
        if ($request->has('objet')) {
            $note->objet = $request->objet;
        }
        if ($request->has('observations')) {
            $note->observations = $request->observations;
        }
        $note->save();

        LogHelper::update('titres_perception', $note->id, 'Modification du titre de perception : ' . $note->numero_titre);

        return response()->json([
            'message' => 'Note modifiee avec succes',
            'data' => $note->load(['classeur', 'centre', 'assujetti', 'emplacement', 'utilisateur']),
        ]);
    }

    public function deletenote($id)
    {
        $note = NotePerception::findOrFail($id);
        $note->update(['statut' => 'annule']);

        LogHelper::delete('titres_perception', $note->id, 'Annulation du titre de perception : ' . $note->numero_titre);

        return response()->json(['message' => 'Note desactivee']);
    }

    public function advancedSearch(Request $request)
    {
        try {
            $query = $request->input('query');
            $idClasseur = $request->input('id_classeur');
            $idAssujetti = $request->input('id_assujetti');
            $numeroArticle = $request->input('numero_article');
            $dateDebut = $request->input('date_debut');
            $dateFin = $request->input('date_fin');
            $page = (int) $request->input('page', 1);
            $perPage = max(5, min((int) $request->input('per_page', 10), 100));
            $sortBy = $request->input('sort_by', 'date_ordonnancement');
            $sortOrder = $request->input('sort_order', 'desc');

            $qb = $this->baseQuery();

            if ($query) {
                $escaped = addcslashes($query, '%_\\');
                $qb->where(function ($q) use ($escaped) {
                    $q->where('titres_perception.numero_titre', 'like', "%{$escaped}%")
                        ->orWhere('titres_perception.reference', 'like', "%{$escaped}%")
                        ->orWhere('titres_perception.reference_declaration', 'like', "%{$escaped}%")
                        ->orWhereHas('assujetti', fn ($sq) => $sq->where('nom_raison_sociale', 'like', "%{$escaped}%"))
                        ->orWhereHas('classeur', fn ($sq) => $sq->where('nom_classeur', 'like', "%{$escaped}%"))
                        ->orWhereHas('fichiers.traitementsOcr', function ($sq) use ($escaped) {
                            $sq->where('texte_extrait', 'like', "%{$escaped}%");
                        });
                });
            }

            if ($idClasseur) {
                $qb->where('titres_perception.id_classeur', $idClasseur);
            }
            if ($idAssujetti) {
                $qb->where('titres_perception.id_assujetti', $idAssujetti);
            }
            if ($numeroArticle) {
                $qb->where('titres_perception.reference_declaration', 'like', "%{$numeroArticle}%");
            }
            if ($dateDebut) {
                $qb->whereDate('titres_perception.date_ordonnancement', '>=', $dateDebut);
            }
            if ($dateFin) {
                $qb->whereDate('titres_perception.date_ordonnancement', '<=', $dateFin);
            }

            $sortColumn = in_array($sortBy, ['date_ordonnancement', 'numero_titre', 'reference'], true)
                ? 'titres_perception.' . $sortBy
                : 'titres_perception.date_ordonnancement';

            $notes = $qb->orderBy($sortColumn, $sortOrder === 'asc' ? 'asc' : 'desc')
                ->paginate($perPage, ['*'], 'page', $page);

            $notes->getCollection()->transform(function ($note) use ($query) {
                $documents = $note->fichiers;
                $bestDoc = null;

                if ($query && $documents->count() > 0) {
                    $bestDoc = $documents->first(function ($doc) use ($query) {
                        return stripos($doc->montext ?? '', $query) !== false
                            || stripos($doc->nom_native ?? '', $query) !== false;
                    });
                }
                $bestDoc = $bestDoc ?: $documents->first();

                $note->doc_id = $bestDoc ? $bestDoc->id : null;
                $note->nom_fichier = $bestDoc ? $bestDoc->nom_fichier : null;
                $note->nom_native = $bestDoc ? $bestDoc->nom_native : null;
                $note->montext = $bestDoc ? $bestDoc->montext : null;
                $note->taille = $bestDoc ? $bestDoc->taille : null;
                $note->assujetti_nom = $note->assujetti->nom_raison_sociale ?? '--';
                $note->classeur_nom = $note->classeur->nom_classeur ?? '--';

                $montext = $bestDoc ? $bestDoc->montext : null;
                if ($query && $montext) {
                    $pos = stripos($montext, $query);
                    if ($pos !== false) {
                        $start = max(0, $pos - 60);
                        $note->extrait = '...' . substr($montext, $start, 120) . '...';
                    } else {
                        $note->extrait = substr($montext, 0, 150) . '...';
                    }
                }

                $note->note_info = [
                    'id' => $note->id,
                    'numero_serie' => $note->numero_serie,
                    'numero_article' => $note->numero_article,
                    'date_ordonnancement' => $note->date_ordonnancement,
                    'id_assujetti' => $note->id_assujetti,
                    'id_classeur' => $note->id_classeur,
                    'id_centre' => $note->id_centre_ordonnancement,
                ];

                return $note;
            });

            return response()->json([
                'success' => true,
                'data' => $notes->items(),
                'pagination' => [
                    'current_page' => $notes->currentPage(),
                    'last_page' => $notes->lastPage(),
                    'per_page' => $notes->perPage(),
                    'total' => $notes->total(),
                ],
            ]);
        } catch (\Throwable $e) {
            Log::error('Erreur recherche notes: ' . $e->getMessage(), ['trace' => $e->getTraceAsString()]);

            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la recherche: ' . $e->getMessage(),
            ], 500);
        }
    }

    private function resolveCategorie(?int $id): CategorieTitre
    {
        if ($id) {
            return CategorieTitre::findOrFail($id);
        }

        return CategorieTitre::firstOrCreate(
            ['code' => 'NOTE_PERCEPTION'],
            [
                'libelle' => 'Note de perception',
                'regle_numerotation' => 'TP-{YYYY}-{SEQ}',
                'statut' => true,
            ]
        );
    }
}
