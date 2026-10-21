<?php

namespace App\Http\Controllers;

use App\Helpers\LogHelper;
use App\Models\TypeDocument;
use Illuminate\Http\Request;

class TypeDocumentController extends Controller
{
    public function index(Request $request)
    {
        $query = TypeDocument::query();

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
            'code' => 'required|string|max:50|unique:types_documents,code',
            'libelle' => 'required|string|max:255',
            'description' => 'nullable|string',
            'duree_conservation_mois' => 'nullable|integer|min:0',
            'statut' => 'nullable|boolean',
        ]);

        $type = TypeDocument::create($data + ['statut' => $data['statut'] ?? true]);
        LogHelper::create('types_documents', $type->id, 'Creation du type de document : ' . $type->libelle);

        return response()->json(['success' => true, 'data' => $type], 201);
    }

    public function show($id)
    {
        return TypeDocument::findOrFail($id);
    }

    public function update(Request $request, $id)
    {
        $type = TypeDocument::findOrFail($id);

        $data = $request->validate([
            'code' => 'required|string|max:50|unique:types_documents,code,' . $id,
            'libelle' => 'required|string|max:255',
            'description' => 'nullable|string',
            'duree_conservation_mois' => 'nullable|integer|min:0',
            'statut' => 'nullable|boolean',
        ]);

        $type->update($data);
        LogHelper::update('types_documents', $type->id, 'Modification du type de document : ' . $type->libelle);

        return response()->json(['success' => true, 'data' => $type]);
    }

    public function destroy($id)
    {
        $type = TypeDocument::findOrFail($id);
        $type->delete();
        LogHelper::delete('types_documents', $id, 'Suppression du type de document : ' . $type->libelle);

        return response()->json(['success' => true, 'message' => 'Type de document supprime']);
    }
}
