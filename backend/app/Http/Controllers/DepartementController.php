<?php

namespace App\Http\Controllers;

use App\Helpers\LogHelper;
use App\Models\Direction;
use App\Models\Division;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;

class DepartementController extends Controller
{
    public function index(Request $request)
    {
        $query = Division::with('direction')
            ->withCount(['users as primary_users_count', 'members as members_count']);

        if ($request->filled('search')) {
            $search = addcslashes($request->search, '%_\\');
            $query->where(function ($q) use ($search) {
                $q->where('sigle', 'like', "%{$search}%")
                    ->orWhere('nom', 'like', "%{$search}%")
                    ->orWhere('code', 'like', "%{$search}%");
            });
        }

        if ($request->filled('id_direction')) {
            $query->where('id_direction', $request->id_direction);
        }

        $divisions = $query->orderByDesc('id')->paginate($request->get('per_page', 10));
        $divisions->getCollection()->transform(function (Division $division) {
            $division->users_count = $division->members_count;
            return $division;
        });

        return response()->json([
            'success' => true,
            'data' => $divisions,
            'message' => 'Liste des divisions recuperee avec succes',
        ]);
    }

    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'sigle' => 'required|string|max:20|unique:divisions,sigle',
            'nom' => 'required|string|max:255',
            'code' => 'nullable|string|max:20|unique:divisions,code',
            'id_direction' => 'nullable|integer|exists:directions,id',
            'description' => 'nullable|string',
            'statut' => 'nullable|boolean',
        ]);

        if ($validator->fails()) {
            return response()->json(['success' => false, 'errors' => $validator->errors()], 422);
        }

        $directionId = $request->input('id_direction')
            ?: optional(Direction::where('code', 'DG')->first() ?? Direction::first())->id;

        if (!$directionId) {
            return response()->json([
                'success' => false,
                'message' => 'Aucune direction DGRAD disponible. Creez une direction avant la division.',
            ], 422);
        }

        $division = Division::create([
            'id_direction' => $directionId,
            'sigle' => strtoupper($request->sigle),
            'code' => $request->code ?: $this->uniqueCode($request->sigle),
            'nom' => $request->nom,
            'description' => $request->description,
            'statut' => $request->has('statut') ? $request->boolean('statut') : true,
        ]);

        LogHelper::create('divisions', $division->id, 'Creation de la division : ' . $division->nom);

        $division->load(['direction'])->loadCount('users');

        return response()->json([
            'success' => true,
            'data' => $division,
            'message' => 'Division creee avec succes',
        ], 201);
    }

    public function show($id)
    {
        $division = Division::with(['direction', 'users.roles', 'members.roles'])->find($id);

        if (!$division) {
            return response()->json(['success' => false, 'message' => 'Division non trouvee'], 404);
        }

        $users = $division->users
            ->merge($division->members)
            ->unique('id')
            ->values();

        $data = $division->toArray();
        $data['users'] = $users;
        $data['users_count'] = $users->count();
        $data['MonUtilisateurs'] = $users;
        $data['datecreation'] = $division->created_at;

        return response()->json(['success' => true, 'data' => $data]);
    }

    public function update(Request $request, $id)
    {
        $division = Division::find($id);

        if (!$division) {
            return response()->json(['success' => false, 'message' => 'Division non trouvee'], 404);
        }

        $validator = Validator::make($request->all(), [
            'sigle' => 'required|string|max:20|unique:divisions,sigle,' . $id,
            'nom' => 'required|string|max:255',
            'code' => 'nullable|string|max:20|unique:divisions,code,' . $id,
            'id_direction' => 'nullable|integer|exists:directions,id',
            'description' => 'nullable|string',
            'statut' => 'nullable|boolean',
        ]);

        if ($validator->fails()) {
            return response()->json(['success' => false, 'errors' => $validator->errors()], 422);
        }

        $division->update([
            'sigle' => strtoupper($request->sigle),
            'nom' => $request->nom,
            'code' => $request->code ?: $division->code,
            'id_direction' => $request->filled('id_direction') ? $request->input('id_direction') : $division->id_direction,
            'description' => $request->description,
            'statut' => $request->has('statut') ? $request->boolean('statut') : $division->statut,
        ]);

        LogHelper::update('divisions', $division->id, 'Modification de la division : ' . $division->nom);

        $division->load(['direction', 'users'])->loadCount('users');

        return response()->json([
            'success' => true,
            'data' => $division,
            'message' => 'Division mise a jour avec succes',
        ]);
    }

    public function destroy($id)
    {
        $division = Division::find($id);

        if (!$division) {
            return response()->json(['success' => false, 'message' => 'Division non trouvee'], 404);
        }

        if ($division->users()->count() > 0 || $division->members()->count() > 0) {
            return response()->json([
                'success' => false,
                'message' => 'Impossible de supprimer cette division car elle contient des utilisateurs',
            ], 403);
        }

        $division->delete();

        LogHelper::delete('divisions', $id, 'Suppression de la division : ' . $division->nom);

        return response()->json(['success' => true, 'message' => 'Division supprimee avec succes']);
    }

    public function getWithDetails($id)
    {
        return $this->show($id);
    }

    public function myDivisions(Request $request)
    {
        $user = $request->user();

        if (!$user) {
            return response()->json(['success' => false, 'message' => 'Utilisateur non authentifie'], 401);
        }

        $query = Division::with('direction')
            ->where('statut', true)
            ->orderBy('sigle');

        if (!$user->hasGlobalDivisionAccess()) {
            $divisionIds = $user->accessibleDivisionIds();

            if (empty($divisionIds)) {
                return response()->json(['success' => true, 'data' => []]);
            }

            $query->whereIn('id', $divisionIds);
        }

        return response()->json([
            'success' => true,
            'data' => $query->get(),
        ]);
    }

    public function myDirections(Request $request)
    {
        $user = $request->user();

        if (!$user) {
            return response()->json(['success' => false, 'message' => 'Utilisateur non authentifie'], 401);
        }

        $query = Direction::where('statut', true)->orderBy('sigle');

        if (!$user->hasGlobalDivisionAccess()) {
            $divisionIds = $user->accessibleDivisionIds();

            if (empty($divisionIds)) {
                return response()->json(['success' => true, 'data' => []]);
            }

            $directionIds = Division::whereIn('id', $divisionIds)
                ->where('statut', true)
                ->whereNotNull('id_direction')
                ->pluck('id_direction')
                ->unique()
                ->values();

            $query->whereIn('id', $directionIds);
        }

        return response()->json([
            'success' => true,
            'data' => $query->get(),
        ]);
    }

    public function getAvailableUsers($id)
    {
        $division = Division::find($id);

        if (!$division) {
            return response()->json(['success' => false, 'message' => 'Division non trouvee'], 404);
        }

        $availableUsers = User::with(['roles', 'division:id,sigle,nom'])
            ->where('id_division', '!=', $id)
            ->whereDoesntHave('divisions', fn ($query) => $query->where('divisions.id', $id))
            ->where('statut', 'active')
            ->select('id', 'nom', 'prenom', 'email', 'statut', 'id_division')
            ->get();

        return response()->json([
            'success' => true,
            'data' => [
                'departement' => $division,
                'division' => $division,
                'utilisateurs_disponibles' => $availableUsers,
                'nombre_affectes' => $division->members()->count(),
                'nombre_disponibles' => $availableUsers->count(),
            ],
        ]);
    }

    public function assignUser($directionId, $userId)
    {
        $division = Division::find($directionId);
        $user = User::find($userId);

        if (!$division) {
            return response()->json(['success' => false, 'message' => 'Division non trouvee'], 404);
        }
        if (!$user) {
            return response()->json(['success' => false, 'message' => 'Utilisateur non trouve'], 404);
        }

        // Acces supplementaire : la division principale de l'utilisateur n'est pas modifiee.
        $user->divisions()->syncWithoutDetaching([$division->id]);

        $division->load(['users', 'members']);

        return response()->json([
            'success' => true,
            'data' => $division,
            'message' => 'Acces a la division ajoute avec succes',
        ]);
    }

    public function removeUser($directionId, $userId)
    {
        $division = Division::find($directionId);
        $user = User::find($userId);

        if (!$division) {
            return response()->json(['success' => false, 'message' => 'Division non trouvee'], 404);
        }
        if (!$user) {
            return response()->json(['success' => false, 'message' => 'Utilisateur non trouve'], 404);
        }

        if ((int) $user->id_division === (int) $division->id) {
            return response()->json([
                'success' => false,
                'message' => 'Impossible de retirer la division principale. Modifiez d abord la division de rattachement de l utilisateur.',
            ], 422);
        }

        $user->divisions()->detach($division->id);

        return response()->json([
            'success' => true,
            'data' => $division->load('members'),
            'message' => 'Acces a la division retire',
        ]);
    }

    public function statdepartement()
    {
        $stats = DB::table('divisions')
            ->leftJoin('division_user', 'divisions.id', '=', 'division_user.division_id')
            ->leftJoin('users', 'division_user.user_id', '=', 'users.id')
            ->select(
                'divisions.id',
                'divisions.sigle',
                'divisions.nom',
                DB::raw('COUNT(DISTINCT division_user.user_id) as users_count')
            )
            ->whereNull('users.deleted_at')
            ->groupBy('divisions.id', 'divisions.sigle', 'divisions.nom')
            ->get();

        return response()->json([
            'success' => true,
            'data' => [
                'stats' => $stats,
                'total_directions' => Division::count(),
                'total_divisions' => Division::count(),
                'directions_avec_utilisateurs' => $stats->where('users_count', '>', 0)->count(),
                'divisions_avec_utilisateurs' => $stats->where('users_count', '>', 0)->count(),
                'total_affectations' => $stats->sum('users_count'),
            ],
        ]);
    }

    private function uniqueCode(string $sigle): string
    {
        $base = Str::upper(Str::slug($sigle, ''));
        $base = substr($base ?: 'DIV', 0, 15);
        $code = $base;
        $i = 2;

        while (Division::withTrashed()->where('code', $code)->exists()) {
            $code = substr($base, 0, 15) . $i++;
        }

        return $code;
    }
}
