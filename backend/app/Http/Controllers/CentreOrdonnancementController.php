<?php

namespace App\Http\Controllers;

use App\Helpers\LogHelper;
use App\Models\CentreOrdonnancement;
use App\Models\Direction;
use Illuminate\Http\Request;

class CentreOrdonnancementController extends Controller
{
    public function getAll(Request $request)
    {
        return CentreOrdonnancement::with('direction')
            ->where('statut', true)
            ->orderByDesc('id')
            ->paginate($request->input('per_page', 10));
    }

    public function getcentre()
    {
        return CentreOrdonnancement::with('direction')
            ->where('statut', true)
            ->orderByDesc('id')
            ->paginate(10);
    }

    public function searchcentre(Request $request)
    {
        $query = CentreOrdonnancement::with('direction')->where('statut', true);

        if ($request->filled('search')) {
            $search = addcslashes($request->search, '%_\\');
            $query->where('nom', 'like', "%{$search}%");
        }

        return $query->orderByDesc('id')->paginate($request->input('per_page', 10));
    }

    public function addcentre(Request $request)
    {
        $idDirection = $request->input('id_direction', $request->input('id_ministere'));

        $request->validate([
            'nom' => 'required|string|max:255|unique:centre_ordonnancements,nom',
            'code' => 'nullable|string|max:20',
            'description' => 'nullable|string|max:255',
            'id_direction' => 'nullable|integer|exists:directions,id',
            'id_ministere' => 'nullable|integer|exists:directions,id',
            'statut' => 'nullable|boolean',
        ]);

        if (!$idDirection) {
            $idDirection = optional(Direction::first())->id;
        }

        $centre = CentreOrdonnancement::create([
            'nom' => $request->nom,
            'code' => $request->code,
            'description' => $request->description,
            'statut' => $request->has('statut') ? $request->boolean('statut') : true,
            'id_direction' => $idDirection,
        ]);

        LogHelper::create('centre_ordonnancements', $centre->id, 'Creation du centre ordonnancement : ' . $centre->nom);

        return response()->json(['success' => true, 'data' => $centre, 'message' => 'Centre ordonnancement ajoute'], 201);
    }

    public function updateCentre(Request $request, $id)
    {
        $centre = CentreOrdonnancement::findOrFail($id);

        $request->validate([
            'nom' => 'required|string|max:255|unique:centre_ordonnancements,nom,' . $id,
            'code' => 'nullable|string|max:20',
            'description' => 'nullable|string|max:255',
            'id_direction' => 'nullable|integer|exists:directions,id',
            'id_ministere' => 'nullable|integer|exists:directions,id',
            'statut' => 'nullable|boolean',
        ]);

        $centre->update([
            'nom' => $request->nom,
            'code' => $request->input('code', $centre->code),
            'description' => $request->description,
            'id_direction' => $request->filled('id_direction')
                ? $request->input('id_direction')
                : ($request->filled('id_ministere') ? $request->input('id_ministere') : $centre->id_direction),
            'statut' => $request->has('statut') ? $request->boolean('statut') : $centre->statut,
        ]);

        LogHelper::update('centre_ordonnancements', $centre->id, 'Modification du centre ordonnancement : ' . $centre->nom);

        return response()->json(['success' => true, 'data' => $centre, 'message' => 'Centre ordonnancement mis a jour']);
    }

    public function editcentre($id)
    {
        return CentreOrdonnancement::with('direction')->findOrFail($id);
    }

    public function supprimercentre($id)
    {
        $centre = CentreOrdonnancement::findOrFail($id);
        $centre->delete();

        LogHelper::delete('centre_ordonnancements', $centre->id, 'Suppression du centre ordonnancement : ' . $centre->nom);

        return response()->json(['success' => true, 'message' => 'Centre supprime avec succes']);
    }
}
