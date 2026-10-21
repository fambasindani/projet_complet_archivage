<?php

namespace App\Http\Controllers;

use App\Helpers\LogHelper;
use App\Models\Classeur;
use Illuminate\Http\Request;

class ClasseurController extends Controller
{
    public function getAllclasseur()
    {
        return Classeur::where('statut', true)->orderByDesc('id')->get();
    }

    public function getAll(Request $request)
    {
        return Classeur::orderByDesc('id')->paginate($request->input('per_page', 10));
    }

    public function searchClasseur(Request $request)
    {
        $query = Classeur::where('statut', true);

        if ($request->filled('search')) {
            $search = addcslashes($request->search, '%_\\');
            $query->where('nom_classeur', 'like', "%{$search}%");
        }

        return $query->orderByDesc('id')->paginate($request->input('per_page', 10));
    }

    public function addClasseur(Request $request)
    {
        $data = $request->validate([
            'nom_classeur' => 'required|string|max:255|unique:classeurs,nom_classeur',
            'code' => 'nullable|string|max:50',
            'description' => 'nullable|string',
            'statut' => 'nullable|boolean',
        ]);

        $classeur = Classeur::create([
            'nom_classeur' => $data['nom_classeur'],
            'code' => $data['code'] ?? null,
            'description' => $data['description'] ?? null,
            'statut' => $data['statut'] ?? true,
        ]);

        LogHelper::create('classeurs', $classeur->id, 'Creation du classeur : ' . $classeur->nom_classeur);

        return response()->json([
            'success' => true,
            'data' => $classeur,
            'message' => 'Classeur ajoute avec succes',
        ], 201);
    }

    public function updateClasseur(Request $request, $id)
    {
        $classeur = Classeur::findOrFail($id);

        $data = $request->validate([
            'nom_classeur' => 'required|string|max:255|unique:classeurs,nom_classeur,' . $id,
            'code' => 'nullable|string|max:50',
            'description' => 'nullable|string',
            'statut' => 'nullable|boolean',
        ]);

        $classeur->update([
            'nom_classeur' => $data['nom_classeur'],
            'code' => $data['code'] ?? $classeur->code,
            'description' => $data['description'] ?? $classeur->description,
            'statut' => $data['statut'] ?? $classeur->statut,
        ]);

        LogHelper::update('classeurs', $classeur->id, 'Modification du classeur : ' . $classeur->nom_classeur);

        return response()->json([
            'success' => true,
            'data' => $classeur,
            'message' => 'Classeur mis a jour avec succes',
        ]);
    }

    public function editClasseur($id)
    {
        return Classeur::findOrFail($id);
    }

    public function supprimerClasseur($id)
    {
        $classeur = Classeur::findOrFail($id);
        $classeur->delete();

        LogHelper::delete('classeurs', $classeur->id, 'Suppression du classeur : ' . $classeur->nom_classeur);

        return response()->json(['success' => true, 'message' => 'Classeur supprime avec succes']);
    }
}
