<?php

namespace App\Http\Controllers;

use App\Helpers\LogHelper;
use App\Models\Emplacement;
use Illuminate\Http\Request;

class EmplacementController extends Controller
{
    public function getAllemplacement()
    {
        return Emplacement::where('statut', true)->orderByDesc('id')->get();
    }

    public function getAll(Request $request)
    {
        return Emplacement::where('statut', true)
            ->orderByDesc('id')
            ->paginate($request->input('per_page', 10));
    }

    public function searchEmplacement(Request $request)
    {
        $query = Emplacement::where('statut', true);

        if ($request->filled('search')) {
            $search = addcslashes($request->search, '%_\\');
            $query->where(function ($q) use ($search) {
                $q->where('nom_emplacement', 'like', "%{$search}%")
                    ->orWhere('code', 'like', "%{$search}%")
                    ->orWhere('batiment', 'like', "%{$search}%")
                    ->orWhere('salle', 'like', "%{$search}%");
            });
        }

        return $query->orderByDesc('id')->paginate($request->input('per_page', 10));
    }

    public function addEmplacement(Request $request)
    {
        $data = $request->validate([
            'nom_emplacement' => 'required|string|max:255|unique:emplacements,nom_emplacement',
            'code' => 'nullable|string|max:50',
            'batiment' => 'nullable|string|max:100',
            'salle' => 'nullable|string|max:100',
            'etagere' => 'nullable|string|max:100',
            'description' => 'nullable|string',
            'statut' => 'nullable|boolean',
        ]);

        $emplacement = Emplacement::create([
            'nom_emplacement' => $data['nom_emplacement'],
            'code' => $data['code'] ?? null,
            'batiment' => $data['batiment'] ?? null,
            'salle' => $data['salle'] ?? null,
            'etagere' => $data['etagere'] ?? null,
            'description' => $data['description'] ?? null,
            'statut' => $data['statut'] ?? true,
        ]);

        LogHelper::create('emplacements', $emplacement->id, 'Creation de l emplacement : ' . $emplacement->nom_emplacement);

        return response()->json([
            'success' => true,
            'data' => $emplacement,
            'message' => 'Emplacement ajoute avec succes',
        ], 201);
    }

    public function editEmplacement($id)
    {
        return Emplacement::findOrFail($id);
    }

    public function updateEmplacement(Request $request, $id)
    {
        $emplacement = Emplacement::findOrFail($id);

        $data = $request->validate([
            'nom_emplacement' => 'required|string|max:255|unique:emplacements,nom_emplacement,' . $id,
            'code' => 'nullable|string|max:50',
            'batiment' => 'nullable|string|max:100',
            'salle' => 'nullable|string|max:100',
            'etagere' => 'nullable|string|max:100',
            'description' => 'nullable|string',
            'statut' => 'nullable|boolean',
        ]);

        $emplacement->update([
            'nom_emplacement' => $data['nom_emplacement'],
            'code' => $data['code'] ?? $emplacement->code,
            'batiment' => $data['batiment'] ?? $emplacement->batiment,
            'salle' => $data['salle'] ?? $emplacement->salle,
            'etagere' => $data['etagere'] ?? $emplacement->etagere,
            'description' => $data['description'] ?? $emplacement->description,
            'statut' => $data['statut'] ?? $emplacement->statut,
        ]);

        LogHelper::update('emplacements', $emplacement->id, 'Modification de l emplacement : ' . $emplacement->nom_emplacement);

        return response()->json([
            'success' => true,
            'data' => $emplacement,
            'message' => 'Emplacement mis a jour avec succes',
        ]);
    }

    public function supprimerEmplacement($id)
    {
        $emplacement = Emplacement::findOrFail($id);
        $emplacement->delete();

        LogHelper::delete('emplacements', $emplacement->id, 'Suppression de l emplacement : ' . $emplacement->nom_emplacement);

        return response()->json(['success' => true, 'message' => 'Emplacement supprime avec succes']);
    }
}
