<?php

namespace App\Http\Controllers;

use App\Models\Archive;
use App\Models\Declaration;
use App\Models\FichierDocument;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class DeclarationController extends Controller
{
    private function baseQuery()
    {
        return Declaration::with(['departement.direction', 'emplacement', 'classeur', 'utilisateur'])
            ->where('statut', '!=', 'brouillon');
    }

    private function present($item): Declaration
    {
        $item->nom_direction = $item->departement->nom ?? null;
        $item->nom_direction_sigle = $item->departement->sigle ?? null;
        $item->nom_emplacement = $item->emplacement->nom_emplacement ?? null;

        return $item;
    }

    public function editdeclaration($id)
    {
        return $this->present(
            Declaration::with(['departement.direction', 'emplacement', 'classeur', 'utilisateur'])
                ->findOrFail($id)
        );
    }

    public function getlistedocument(Request $request, $id)
    {
        $query = $this->baseQuery()->where('id_classeur', $id);

        if ($request->filled('direction_ids')) {
            $ids = is_string($request->direction_ids)
                ? explode(',', $request->direction_ids)
                : (array) $request->direction_ids;
            $query->whereIn('id_division', array_filter(array_map('intval', $ids)));
        }

        $declarations = $query->orderByDesc('id')->paginate(20);
        $declarations->getCollection()->transform(fn ($item) => $this->present($item));

        return response()->json($declarations);
    }

    public function searchDeclarationsfiltre(Request $request, $id = null)
    {
        $search = addcslashes((string) $request->input('search', ''), '%_\\');
        $directionIds = $request->input('direction_ids');

        if (!$directionIds && $id) {
            $directionIds = [(int) $id];
        }

        if (!$directionIds || empty($directionIds)) {
            return response()->json([
                'success' => true,
                'data' => [
                    'data' => [],
                    'current_page' => 1,
                    'last_page' => 1,
                    'total' => 0,
                    'per_page' => 20,
                ],
                'filtered_by' => 'none',
            ]);
        }

        if (is_string($directionIds)) {
            $directionIds = explode(',', $directionIds);
        }
        $directionIds = array_values(array_filter(array_map('intval', (array) $directionIds)));

        $query = $this->baseQuery()
            ->whereIn('id_division', $directionIds)
            ->where(function ($q) use ($search) {
                $q->where('titre', 'like', "%{$search}%")
                    ->orWhere('reference', 'like', "%{$search}%")
                    ->orWhere('objet', 'like', "%{$search}%")
                    ->orWhere('numero_dossier', 'like', "%{$search}%");
            });

        $declarations = $query->orderByDesc('id')->paginate(20);
        $declarations->getCollection()->transform(fn ($item) => $this->present($item));

        return response()->json([
            'success' => true,
            'data' => $declarations,
            'filtered_by' => $directionIds,
        ]);
    }

    public function searchDeclarationsfiltrexxx(Request $request, $id)
    {
        return $this->searchDeclarationsfiltre($request, $id);
    }

    public function listedocumentdirectionall(Request $request, $id)
    {
        $declarations = $this->baseQuery()
            ->where('id_classeur', $id)
            ->where('id_division', $request->input('id_direction'))
            ->orderByDesc('id')
            ->paginate(20);

        $declarations->getCollection()->transform(fn ($item) => $this->present($item));

        return response()->json($declarations);
    }

    public function getDeclarationsttt()
    {
        $declarations = $this->baseQuery()->orderByDesc('id')->paginate(20);
        $declarations->getCollection()->transform(fn ($item) => $this->present($item));

        return response()->json($declarations);
    }

    public function getDeclarations(Request $request)
    {
        $query = $this->baseQuery();

        if ($request->filled('direction_ids')) {
            $ids = is_string($request->direction_ids)
                ? explode(',', $request->direction_ids)
                : (array) $request->direction_ids;
            $ids = array_filter(array_map('intval', $ids));
            if (!empty($ids)) {
                $query->whereIn('id_division', $ids);
            }
        }

        $perPage = max(5, min((int) $request->input('per_page', 20), 100));
        $declarations = $query->orderByDesc('id')->paginate($perPage);
        $declarations->getCollection()->transform(fn ($item) => $this->present($item));

        return response()->json([
            'success' => true,
            'data' => $declarations,
            'filtered_by' => $request->input('direction_ids', 'all'),
        ]);
    }

    public function searchDeclarations(Request $request)
    {
        $search = addcslashes((string) $request->input('search', ''), '%_\\');
        $page = max(1, (int) $request->input('page', 1));

        $declarations = $this->baseQuery()
            ->where(function ($q) use ($search) {
                $q->where('titre', 'like', "%{$search}%")
                    ->orWhere('reference', 'like', "%{$search}%")
                    ->orWhere('objet', 'like', "%{$search}%")
                    ->orWhere('numero_dossier', 'like', "%{$search}%");
            })
            ->orderByDesc('id')
            ->paginate(20, ['*'], 'page', $page);

        $declarations->getCollection()->transform(fn ($item) => $this->present($item));

        return response()->json($declarations);
    }

    public function createdeclaration(Request $request)
    {
        $validated = $request->validate([
            'id_direction' => 'nullable|integer|exists:divisions,id',
            'id_division' => 'nullable|integer|exists:divisions,id',
            'id_emplacement' => 'required|integer|exists:emplacements,id',
            'id_classeur' => 'required|integer|exists:classeurs,id',
            'date_creation' => 'required|date',
            'date_enregistrement' => 'required|date',
            'intitule' => 'required|string|max:255',
            'num_reference' => 'required|string|max:100|unique:archives,reference',
            'mot_cle' => 'nullable|string',
            'num_declaration' => 'nullable|string|max:100',
        ]);

        $divisionId = $validated['id_division']
            ?? $validated['id_direction']
            ?? optional($request->user())->id_division;

        if (!$divisionId) {
            return response()->json([
                'success' => false,
                'message' => 'La division de rattachement est obligatoire.',
            ], 422);
        }

        try {
            $declaration = Declaration::create([
                'id_division' => $divisionId,
                'id_emplacement' => $validated['id_emplacement'],
                'id_classeur' => $validated['id_classeur'],
                'date_document' => $validated['date_creation'],
                'date_enregistrement' => $validated['date_enregistrement'],
                'titre' => $validated['intitule'],
                'reference' => $validated['num_reference'],
                'objet' => $validated['mot_cle'] ?? null,
                'numero_dossier' => $validated['num_declaration'] ?? null,
                'statut' => 'actif',
                'id_user_createur' => $request->user()->id,
            ]);

            return response()->json([
                'success' => true,
                'id' => $declaration->id,
                'declaration' => $declaration,
                'message' => 'Declaration creee avec succes.',
            ], 201);
        } catch (\Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la creation de la declaration',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    public function createdeclarations(Request $request)
    {
        $validated = $request->validate([
            'id_direction' => 'required|integer|exists:divisions,id',
            'id_emplacement' => 'required|integer|exists:emplacements,id',
            'id_classeur' => 'required|integer|exists:classeurs,id',
            'date_creation' => 'required|date',
            'date_enregistrement' => 'required|date',
            'intitule' => 'required|string|max:255',
            'num_reference' => 'required|string|max:100|unique:archives,reference',
            'mot_cle' => 'nullable|string',
            'num_declaration' => 'nullable|string|max:100',
            'files' => 'nullable|array',
            'files.*' => 'file|mimes:pdf|max:51200',
        ]);

        DB::beginTransaction();

        try {
            $declaration = Declaration::create([
                'id_division' => $validated['id_direction'],
                'id_emplacement' => $validated['id_emplacement'],
                'id_classeur' => $validated['id_classeur'],
                'date_document' => $validated['date_creation'],
                'date_enregistrement' => $validated['date_enregistrement'],
                'titre' => $validated['intitule'],
                'reference' => $validated['num_reference'],
                'objet' => $validated['mot_cle'] ?? null,
                'numero_dossier' => $validated['num_declaration'] ?? null,
                'statut' => 'actif',
                'id_user_createur' => $request->user()->id,
            ]);

            $documents = [];

            foreach ($request->file('files', []) as $file) {
                $extension = strtolower($file->getClientOriginalExtension() ?: 'pdf');
                $nomStocke = Str::uuid() . '.' . $extension;
                $dossier = 'document_declaration/' . ($request->id_classeur + 100);
                $file->storeAs($dossier, $nomStocke);

                $documents[] = $declaration->documents()->create([
                    'nom_original' => $file->getClientOriginalName(),
                    'nom_stocke' => $nomStocke,
                    'extension' => $extension,
                    'type_mime' => $file->getMimeType() ?: 'application/pdf',
                    'taille_octets' => $file->getSize(),
                    'chemin_stockage' => $dossier . '/' . $nomStocke,
                    'id_user_upload' => $request->user()->id,
                ]);
            }

            DB::commit();

            return response()->json([
                'declaration' => $declaration,
                'documents' => $documents,
                'message' => 'Declaration creee et fichiers uploades avec succes.',
            ], 201);
        } catch (\Throwable $e) {
            DB::rollBack();

            return response()->json([
                'message' => 'Erreur lors de la creation de la declaration ou de l upload',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    public function updatedeclaration(Request $request, $id)
    {
        $declaration = Declaration::findOrFail($id);

        $validated = $request->validate([
            'id_direction' => 'nullable|integer|exists:divisions,id',
            'id_division' => 'nullable|integer|exists:divisions,id',
            'id_emplacement' => 'required|integer|exists:emplacements,id',
            'id_classeur' => 'required|integer|exists:classeurs,id',
            'date_creation' => 'required|date',
            'date_enregistrement' => 'required|date',
            'intitule' => 'required|string|max:255',
            'num_reference' => 'required|string|max:100|unique:archives,reference,' . $declaration->id,
            'mot_cle' => 'nullable|string',
            'num_declaration' => 'nullable|string|max:100',
        ]);

        $declaration->update([
            'id_division' => $validated['id_division'] ?? $validated['id_direction'] ?? $declaration->id_division,
            'id_emplacement' => $validated['id_emplacement'],
            'id_classeur' => $validated['id_classeur'],
            'date_document' => $validated['date_creation'],
            'date_enregistrement' => $validated['date_enregistrement'],
            'titre' => $validated['intitule'],
            'reference' => $validated['num_reference'],
            'objet' => $validated['mot_cle'] ?? null,
            'numero_dossier' => $validated['num_declaration'] ?? null,
            'id_user_modificateur' => $request->user()->id,
        ]);

        return response()->json($this->present($declaration->load(['departement', 'emplacement', 'classeur'])));
    }

    public function destroy($id)
    {
        $declaration = Declaration::findOrFail($id);
        $declaration->update(['statut' => 'inactif']);

        return response()->json(['message' => 'Declaration desactivee avec succes']);
    }
}
