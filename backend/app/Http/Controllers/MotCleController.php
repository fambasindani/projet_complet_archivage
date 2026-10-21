<?php

namespace App\Http\Controllers;

use App\Models\MotCle;
use Illuminate\Http\Request;

class MotCleController extends Controller
{
    public function index(Request $request)
    {
        $query = MotCle::query();

        if ($request->filled('search')) {
            $search = addcslashes($request->search, '%_\\');
            $query->where('libelle', 'like', "%{$search}%");
        }

        return response()->json($query->orderBy('libelle')->paginate($request->get('per_page', 50)));
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'libelle' => 'required|string|max:100|unique:mots_cles,libelle',
        ]);

        return response()->json(['success' => true, 'data' => MotCle::create($data)], 201);
    }

    public function show($id)
    {
        return MotCle::findOrFail($id);
    }

    public function update(Request $request, $id)
    {
        $motCle = MotCle::findOrFail($id);
        $data = $request->validate([
            'libelle' => 'required|string|max:100|unique:mots_cles,libelle,' . $id,
        ]);
        $motCle->update($data);

        return response()->json(['success' => true, 'data' => $motCle]);
    }

    public function destroy($id)
    {
        MotCle::findOrFail($id)->delete();

        return response()->json(['success' => true, 'message' => 'Mot-cle supprime']);
    }
}
