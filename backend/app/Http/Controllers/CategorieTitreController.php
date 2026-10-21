<?php

namespace App\Http\Controllers;

use App\Helpers\LogHelper;
use App\Models\CategorieTitre;
use Illuminate\Http\Request;

class CategorieTitreController extends Controller
{
    public function index(Request $request)
    {
        $query = CategorieTitre::withCount('titres');

        if ($request->filled('search')) {
            $search = addcslashes($request->search, '%_\\');
            $query->where(function ($q) use ($search) {
                $q->where('code', 'like', "%{$search}%")->orWhere('libelle', 'like', "%{$search}%");
            });
        }

        if ($request->filled('statut')) {
            $query->where('statut', filter_var($request->statut, FILTER_VALIDATE_BOOLEAN));
        }

        return response()->json($query->orderBy('libelle')->paginate($request->get('per_page', 20)));
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'code' => 'required|string|max:50|unique:categories_titres,code',
            'libelle' => 'required|string|max:255',
            'description' => 'nullable|string',
            'champs_obligatoires' => 'nullable|array',
            'regle_numerotation' => 'nullable|string|max:255',
            'statut' => 'nullable|boolean',
        ]);

        $categorie = CategorieTitre::create($data + ['statut' => $data['statut'] ?? true]);
        LogHelper::create('categories_titres', $categorie->id, 'Creation de la categorie de titre : ' . $categorie->libelle);

        return response()->json(['success' => true, 'data' => $categorie], 201);
    }

    public function show($id)
    {
        return CategorieTitre::withCount('titres')->findOrFail($id);
    }

    public function update(Request $request, $id)
    {
        $categorie = CategorieTitre::findOrFail($id);

        $data = $request->validate([
            'code' => 'required|string|max:50|unique:categories_titres,code,' . $id,
            'libelle' => 'required|string|max:255',
            'description' => 'nullable|string',
            'champs_obligatoires' => 'nullable|array',
            'regle_numerotation' => 'nullable|string|max:255',
            'statut' => 'nullable|boolean',
        ]);

        $categorie->update($data);
        LogHelper::update('categories_titres', $categorie->id, 'Modification de la categorie de titre : ' . $categorie->libelle);

        return response()->json(['success' => true, 'data' => $categorie]);
    }

    public function destroy($id)
    {
        $categorie = CategorieTitre::findOrFail($id);

        if (\App\Models\TitrePerception::withTrashed()->where('id_categorie_titre', $id)->exists()) {
            return response()->json([
                'success' => false,
                'message' => 'Impossible de supprimer une categorie utilisee par des titres',
            ], 409);
        }

        $categorie->delete();
        LogHelper::delete('categories_titres', $id, 'Suppression de la categorie de titre : ' . $categorie->libelle);

        return response()->json(['success' => true, 'message' => 'Categorie supprimee']);
    }
}
