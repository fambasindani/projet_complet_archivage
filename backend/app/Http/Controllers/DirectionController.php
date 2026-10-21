<?php

namespace App\Http\Controllers;

use App\Helpers\LogHelper;
use App\Models\Direction;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class DirectionController extends Controller
{
    public function getAlldirection()
    {
        return Direction::withCount('divisions')
            ->where('statut', true)
            ->orderByDesc('id')
            ->get();
    }

    public function Getdirection(Request $request)
    {
        return Direction::withCount('divisions')->orderByDesc('id')->paginate($request->input('per_page', 10));
    }

    public function searchdirection(Request $request)
    {
        $search = addcslashes((string) $request->input('search'), '%_\\');

        return Direction::where(function ($q) use ($search) {
                $q->where('nom', 'like', "%{$search}%")
                    ->orWhere('sigle', 'like', "%{$search}%")
                    ->orWhere('code', 'like', "%{$search}%");
            })
            ->where('statut', true)
            ->orderByDesc('id')
            ->paginate($request->input('per_page', 10));
    }

    public function createdirection(Request $request)
    {
        $request->validate([
            'nom' => 'required|string|max:255|unique:directions,nom',
            'code' => 'nullable|string|max:20|unique:directions,code',
            'sigle' => 'nullable|string|max:20|unique:directions,sigle',
            'description' => 'nullable|string',
        ]);

        $direction = Direction::create([
            'nom' => $request->nom,
            'code' => $request->code ?: $this->uniqueCode($request->nom),
            'sigle' => $request->sigle ?: $this->uniqueSigle($request->nom),
            'description' => $request->description,
            'statut' => true,
        ]);

        LogHelper::create('directions', $direction->id, 'Creation de la direction : ' . $direction->nom);

        return response()->json([
            'success' => true,
            'data' => $direction,
            'message' => 'Direction creee avec succes',
        ], 201);
    }

    public function editdirection($id)
    {
        return Direction::with('divisions')->findOrFail($id);
    }

    public function updatedirection(Request $request, $id)
    {
        $direction = Direction::findOrFail($id);

        $request->validate([
            'nom' => 'required|string|max:255|unique:directions,nom,' . $direction->id,
            'code' => 'nullable|string|max:20|unique:directions,code,' . $direction->id,
            'sigle' => 'nullable|string|max:20|unique:directions,sigle,' . $direction->id,
            'description' => 'nullable|string',
        ]);

        $direction->update([
            'nom' => $request->nom,
            'code' => $request->code ?: $direction->code,
            'sigle' => $request->sigle ?: $direction->sigle,
            'description' => $request->description,
        ]);

        LogHelper::update('directions', $direction->id, 'Modification de la direction : ' . $direction->nom);

        return response()->json(['success' => true, 'data' => $direction, 'message' => 'Direction mise a jour']);
    }

    public function deletedirection($id)
    {
        $direction = Direction::findOrFail($id);
        $direction->update(['statut' => false]);
        $direction->delete();

        LogHelper::delete('directions', $direction->id, 'Suppression de la direction : ' . $direction->nom);

        return response()->json(['success' => true, 'message' => 'Direction desactivee avec succes']);
    }

    private function uniqueCode(string $nom): string
    {
        $base = Str::upper(Str::slug($nom, ''));
        $base = substr($base ?: 'DIR', 0, 15);
        $code = $base;
        $i = 2;

        while (Direction::withTrashed()->where('code', $code)->exists()) {
            $code = substr($base, 0, 15) . $i++;
        }

        return $code;
    }

    private function uniqueSigle(string $nom): string
    {
        $base = Str::upper(Str::slug($nom, ''));
        $base = substr($base ?: 'DIR', 0, 15);
        $sigle = $base;
        $i = 2;

        while (Direction::withTrashed()->where('sigle', $sigle)->exists()) {
            $sigle = substr($base, 0, 15) . $i++;
        }

        return $sigle;
    }
}
