<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Assujetti;

class AssujettiController extends Controller
{
    
    public function getassujetti(Request $request)
    {
        $perPage = min(max((int) $request->input('per_page', 10), 1), 500);

        return Assujetti::where('statut', 1)->orderBy('id', 'desc')->paginate($perPage);
    }

    public function searchassujetti(Request $request)
    {
        $search = addcslashes((string) $request->input('search'), '%_\\');
        $perPage = min(max((int) $request->input('per_page', 10), 1), 500);

        return Assujetti::where(function ($q) use ($search) {
                            $q->where('nom_raison_sociale', 'like', "%{$search}%")
                                ->orWhere('numero_nif', 'like', "%{$search}%")
                                ->orWhere('email', 'like', "%{$search}%")
                                ->orWhere('telephone', 'like', "%{$search}%");
                        })
                        ->where('statut', 1)
                        ->orderBy('id', 'desc')
                        ->paginate($perPage);
    }

    public function  createassujetti(Request $request)
    {
        $request->validate([
        'nom_raison_sociale' => 'required|string|max:255',
        'telephone' => 'required|string|max:50',
        'bp' => 'nullable|string|max:50',
        'numero_nif' => 'nullable|string|max:50',
            'email' => 'nullable|email|string|max:255',
        'type_personne' => 'nullable|in:physique,morale',
        'adresse' => 'nullable|string',
        'statut' => 'nullable|boolean',
]);


        Assujetti::create($request->all());

        return response()->json(['message' => 'Assujetti ajouté avec succès']);
    }

    public function editassujetti($id)
    {
        return Assujetti::findOrFail($id);
    }

    public function updateassujetti(Request $request, $id)
    {
        $assujetti = Assujetti::findOrFail($id);

        $request->validate([
            'nom_raison_sociale' => 'required|string|max:255',
            'telephone' => 'required|string|max:50',
            'bp' => 'nullable|string|max:50',
            'numero_nif' => 'nullable|string|max:50',
        'email' => 'nullable|email|string|max:255',
            'type_personne' => 'nullable|in:physique,morale',
            'adresse' => 'nullable|string',
            'statut' => 'nullable|boolean',

        ]);

        $assujetti->update($request->all());

        return response()->json(['message' => 'Assujetti mis à jour avec succès']);
    }

    public function supprimerassujetti($id)
    {
        $assujetti = Assujetti::findOrFail($id);
        $assujetti->update(['statut' => 0]);

        return response()->json(['message' => 'Assujetti désactivé']);
    }























}

