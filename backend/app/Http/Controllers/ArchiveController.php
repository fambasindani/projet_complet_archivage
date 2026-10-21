<?php

namespace App\Http\Controllers;

use App\Helpers\LogHelper;
use App\Models\Archive;
use App\Models\FichierDocument;
use App\Models\MotCle;
use Illuminate\Http\Request;

class ArchiveController extends Controller
{
    public function index(Request $request)
    {
        $query = Archive::with(['typeDocument', 'division.direction', 'classeur', 'emplacement', 'createur', 'motsCles'])
            ->withCount('fichiers');

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
                    ->orWhere('titre', 'like', "%{$search}%")
                    ->orWhere('objet', 'like', "%{$search}%")
                    ->orWhere('numero_dossier', 'like', "%{$search}%")
                    ->orWhereHas('fichiers.traitementsOcr', fn ($ocr) => $ocr->where('texte_extrait', 'like', "%{$search}%"));
            });
        }

        foreach (['id_division', 'id_classeur', 'id_type_document', 'id_emplacement', 'statut'] as $filter) {
            if ($request->filled($filter)) {
                $query->where($filter, $request->input($filter));
            }
        }

        if ($request->filled('date_debut')) {
            $query->whereDate('date_document', '>=', $request->date_debut);
        }
        if ($request->filled('date_fin')) {
            $query->whereDate('date_document', '<=', $request->date_fin);
        }

        return response()->json($query->orderByDesc('id')->paginate($request->get('per_page', 20)));
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'reference' => 'nullable|string|max:100|unique:archives,reference',
            'titre' => 'required|string|max:255',
            'objet' => 'nullable|string',
            'id_type_document' => 'nullable|integer|exists:types_documents,id',
            'id_division' => 'nullable|integer|exists:divisions,id',
            'id_classeur' => 'nullable|integer|exists:classeurs,id',
            'id_emplacement' => 'nullable|integer|exists:emplacements,id',
            'date_document' => 'nullable|date',
            'date_enregistrement' => 'nullable|date',
            'numero_dossier' => 'nullable|string|max:100',
            'statut' => 'nullable|in:brouillon,actif,archive,inactif',
            'mots_cles' => 'nullable|array',
            'mots_cles.*' => 'string|max:100',
            'mots_cle_ids' => 'nullable|array',
            'mots_cle_ids.*' => 'exists:mots_cles,id',
        ]);

        $data['id_division'] = $data['id_division'] ?? optional($request->user())->id_division;
        $data['id_user_createur'] = optional($request->user())->id;
        $data['statut'] = $data['statut'] ?? 'actif';
        $data['date_enregistrement'] = $data['date_enregistrement'] ?? now()->toDateString();

        $archive = Archive::create($data);
        $this->syncMotsCles($archive, $request);

        LogHelper::create('archives', $archive->id, 'Creation de l archive : ' . $archive->reference);

        return response()->json([
            'success' => true,
            'data' => $archive->load(['typeDocument', 'division', 'classeur', 'emplacement', 'createur', 'motsCles']),
        ], 201);
    }

    public function show(Request $request, $id)
    {
        $archive = Archive::with([
            'typeDocument', 'division.direction', 'classeur', 'emplacement',
            'createur', 'modificateur', 'motsCles', 'fichiers.traitementsOcr',
        ])->findOrFail($id);

        if (!$request->user()?->hasPermission('ocr.view')) {
            $archive->fichiers->each(function (FichierDocument $fichier) {
                $fichier->makeHidden(['montext', 'ocr_status', 'ocr_method']);
                $fichier->unsetRelation('traitementsOcr');
            });
        }

        return response()->json(['success' => true, 'data' => $archive]);
    }

    public function update(Request $request, $id)
    {
        $archive = Archive::findOrFail($id);

        $data = $request->validate([
            'reference' => 'nullable|string|max:100|unique:archives,reference,' . $id,
            'titre' => 'required|string|max:255',
            'objet' => 'nullable|string',
            'id_type_document' => 'nullable|integer|exists:types_documents,id',
            'id_division' => 'nullable|integer|exists:divisions,id',
            'id_classeur' => 'nullable|integer|exists:classeurs,id',
            'id_emplacement' => 'nullable|integer|exists:emplacements,id',
            'date_document' => 'nullable|date',
            'date_enregistrement' => 'nullable|date',
            'numero_dossier' => 'nullable|string|max:100',
            'statut' => 'nullable|in:brouillon,actif,archive,inactif',
            'mots_cles' => 'nullable|array',
            'mots_cles.*' => 'string|max:100',
            'mots_cle_ids' => 'nullable|array',
            'mots_cle_ids.*' => 'exists:mots_cles,id',
        ]);

        $data['id_user_modificateur'] = optional($request->user())->id;
        $archive->update($data);
        $this->syncMotsCles($archive, $request);

        LogHelper::update('archives', $archive->id, 'Modification de l archive : ' . $archive->reference);

        return response()->json([
            'success' => true,
            'data' => $archive->load(['typeDocument', 'division', 'classeur', 'emplacement', 'motsCles']),
        ]);
    }

    public function destroy($id)
    {
        $archive = Archive::findOrFail($id);
        $archive->delete();

        LogHelper::delete('archives', $id, 'Suppression de l archive : ' . $archive->reference);

        return response()->json(['success' => true, 'message' => 'Archive supprimee']);
    }

    private function syncMotsCles(Archive $archive, Request $request): void
    {
        if ($request->has('mots_cle_ids')) {
            $archive->motsCles()->sync($request->input('mots_cle_ids', []));
            return;
        }

        if ($request->has('mots_cles')) {
            $ids = collect($request->input('mots_cles', []))
                ->filter()
                ->map(fn ($libelle) => MotCle::firstOrCreate(['libelle' => trim($libelle)])->id)
                ->all();

            $archive->motsCles()->sync($ids);
        }
    }
}
