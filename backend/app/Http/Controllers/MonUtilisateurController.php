<?php

namespace App\Http\Controllers;

use App\Helpers\LogHelper;
use App\Models\Direction;
use App\Models\Division;
use App\Models\Role;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;

class MonUtilisateurController extends Controller
{
    public function login(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'email' => 'required|email',
            'password' => 'required|string',
        ]);

        if ($validator->fails()) {
            return response()->json(['success' => false, 'errors' => $validator->errors()], 422);
        }

        $user = User::where('email', $request->email)->first();

        if (!$user || !Hash::check($request->password, $user->password)) {
            return response()->json([
                'success' => false,
                'message' => 'Email ou mot de passe incorrect',
            ], 401);
        }

        if ($user->statut !== 'active') {
            return response()->json([
                'success' => false,
                'message' => 'Votre compte est ' . $user->statut . '. Contactez l administrateur.',
            ], 403);
        }

        $user->load([
            'roles.permissions',
            'division.direction',
        ]);

        $permissionCodes = [];
        $permissionDetails = [];
        $seen = [];

        foreach ($user->roles as $role) {
            foreach ($role->permissions as $permission) {
                $permissionCodes[] = $permission->code;
                if (!isset($seen[$permission->id])) {
                    $permissionDetails[] = [
                        'id' => $permission->id,
                        'code' => $permission->code,
                        'description' => $permission->description,
                        'module' => $permission->module,
                    ];
                    $seen[$permission->id] = true;
                }
            }
        }

        $permissionCodes = array_values(array_unique($permissionCodes));

        $user->forceFill(['derniere_connexion' => now()])->save();
        $token = $user->createToken('auth_token', $permissionCodes)->plainTextToken;

        LogHelper::login('Connexion reussie : ' . $user->full_name);

        $division = $user->division;

        return response()->json([
            'success' => true,
            'message' => 'Connexion reussie',
            'data' => [
                'user' => [
                    'id' => $user->id,
                    'nom' => $user->nom,
                    'prenom' => $user->prenom,
                    'full_name' => $user->full_name,
                    'email' => $user->email,
                    'matricule' => $user->matricule,
                    'telephone' => $user->telephone,
                    'statut' => $user->statut,
                    'id_division' => $user->id_division,
                    'division' => $division,
                    'datecreation' => $user->created_at,
                    'dernierconnection' => $user->derniere_connexion,
                    'avatar' => $user->avatar,
                    'created_at' => $user->created_at,
                    'updated_at' => $user->updated_at,
                ],
                'roles' => $user->roles->map(function ($role) {
                    return [
                        'id' => $role->id,
                        'nom' => $role->nom,
                        'description' => $role->description,
                        'created_at' => $role->created_at,
                        'updated_at' => $role->updated_at,
                        'permissions' => $role->permissions,
                        'permissions_count' => $role->permissions->count(),
                    ];
                }),
                'permissions' => [
                    'codes' => $permissionCodes,
                    'details' => $permissionDetails,
                ],
                'divisions' => $division ? [[
                    'id' => $division->id,
                    'sigle' => $division->sigle,
                    'nom' => $division->nom,
                    'code' => $division->code,
                    'id_direction' => $division->id_direction,
                    'direction' => $division->direction,
                    'datecreation' => $division->created_at,
                    'created_at' => $division->created_at,
                    'updated_at' => $division->updated_at,
                ]] : [],
                'token' => $token,
                'token_type' => 'Bearer',
                'stats' => [
                    'roles_count' => $user->roles->count(),
                    'permissions_count' => count($permissionCodes),
                    'divisions_count' => $division ? 1 : 0,
                ],
            ],
        ]);
    }

    public function logout(Request $request)
    {
        LogHelper::logout('Deconnexion de : ' . optional($request->user())->full_name);

        $request->user()->currentAccessToken()->delete();

        return response()->json(['success' => true, 'message' => 'Deconnexion reussie']);
    }

    public function index(Request $request)
    {
        $query = User::with(['roles', 'division.direction', 'divisions.direction']);

        if ($request->filled('search')) {
            $search = addcslashes($request->search, '%_\\');
            $query->where(function ($q) use ($search) {
                $q->where('nom', 'like', "%{$search}%")
                    ->orWhere('prenom', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%")
                    ->orWhere('matricule', 'like', "%{$search}%");
            });
        }

        if ($request->filled('statut') && $request->statut !== 'all') {
            $statut = $request->statut === 'bloqué' || $request->statut === 'bloquǸ'
                ? 'bloque'
                : $request->statut;
            $query->where('statut', $statut);
        }

        if ($request->filled('id_division')) {
            $divisionId = $request->id_division;
            $query->where(function ($scope) use ($divisionId) {
                $scope->where('id_division', $divisionId)
                    ->orWhereHas('divisions', fn ($division) => $division->where('divisions.id', $divisionId));
            });
        }

        $perPage = max(5, min((int) $request->get('per_page', 15), 100));
        $users = $query->orderByDesc('id')->paginate($perPage);

        return response()->json([
            'success' => true,
            'data' => $users,
            'message' => 'Liste des utilisateurs recuperee avec succes',
        ]);
    }

    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'nom' => 'required|string|max:255',
            'prenom' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email',
            'password' => 'required|string|min:6',
            'statut' => 'required|in:active,inactive,bloque,bloqué,bloquǸ',
            'id_division' => 'nullable|integer|exists:divisions,id',
            'acces_direction' => 'nullable|boolean',
            'matricule' => 'nullable|string|max:50|unique:users,matricule',
            'telephone' => 'nullable|string|max:30',
            'role_ids' => 'array',
            'role_ids.*' => 'exists:roles,id',
            'direction_ids' => 'array',
            'direction_ids.*' => 'exists:divisions,id',
            'division_ids' => 'array',
            'division_ids.*' => 'exists:divisions,id',
        ]);

        if ($validator->fails()) {
            return response()->json(['success' => false, 'errors' => $validator->errors()], 422);
        }

        $divisionId = $request->input('id_division')
            ?? (is_array($request->input('direction_ids')) ? $request->input('direction_ids')[0] ?? null : null)
            ?? $request->user()->id_division;

        if (!$divisionId || !Division::whereKey($divisionId)->exists()) {
            return response()->json([
                'success' => false,
                'message' => 'Une division valide est obligatoire.',
            ], 422);
        }

        DB::beginTransaction();
        try {
            $user = User::create([
                'nom' => $request->nom,
                'prenom' => $request->prenom,
                'email' => $request->email,
                'password' => Hash::make($request->password),
                'statut' => $request->statut,
                'id_division' => $divisionId,
                'acces_direction' => $request->boolean('acces_direction'),
                'matricule' => $request->matricule,
                'telephone' => $request->telephone,
                'email_verified_at' => now(),
            ]);

            if ($request->filled('role_ids')) {
                $user->roles()->sync($request->role_ids);
            }

            $divisionIds = array_values(array_unique(array_merge(
                [(int) $divisionId],
                array_map('intval', (array) $request->input('division_ids', []))
            )));
            $user->divisions()->sync($divisionIds);

            DB::commit();

            $user->load(['roles', 'division.direction', 'divisions.direction']);
            LogHelper::create('users', $user->id, 'Creation de l utilisateur : ' . $user->full_name);

            return response()->json([
                'success' => true,
                'data' => $this->presentUser($user),
                'message' => 'Utilisateur cree avec succes',
            ], 201);
        } catch (\Throwable $e) {
            DB::rollBack();

            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la creation: ' . $e->getMessage(),
            ], 500);
        }
    }

    public function show($id)
    {
        $user = User::with(['roles.permissions', 'division.direction'])->find($id);

        if (!$user) {
            return response()->json(['success' => false, 'message' => 'Utilisateur non trouve'], 404);
        }

        return response()->json(['success' => true, 'data' => $this->presentUser($user)]);
    }

    public function update(Request $request, $id)
    {
        $user = User::find($id);

        if (!$user) {
            return response()->json(['success' => false, 'message' => 'Utilisateur non trouve'], 404);
        }

        $validator = Validator::make($request->all(), [
            'nom' => 'required|string|max:255',
            'prenom' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email,' . $id,
            'password' => 'nullable|string|min:6',
            'statut' => 'required|in:active,inactive,bloque,bloqué,bloquǸ',
            'id_division' => 'nullable|integer|exists:divisions,id',
            'acces_direction' => 'nullable|boolean',
            'matricule' => 'nullable|string|max:50|unique:users,matricule,' . $id,
            'telephone' => 'nullable|string|max:30',
            'role_ids' => 'array',
            'role_ids.*' => 'exists:roles,id',
            'direction_ids' => 'array',
            'direction_ids.*' => 'exists:divisions,id',
            'division_ids' => 'array',
            'division_ids.*' => 'exists:divisions,id',
        ]);

        if ($validator->fails()) {
            return response()->json(['success' => false, 'errors' => $validator->errors()], 422);
        }

        DB::beginTransaction();
        try {
            $updateData = [
                'nom' => $request->nom,
                'prenom' => $request->prenom,
                'email' => $request->email,
                'statut' => $request->statut,
                'acces_direction' => $request->boolean('acces_direction'),
                'matricule' => $request->matricule,
                'telephone' => $request->telephone,
            ];

            if ($request->filled('id_division')) {
                $updateData['id_division'] = $request->id_division;
            } elseif (is_array($request->input('direction_ids')) && count($request->input('direction_ids')) > 0) {
                $updateData['id_division'] = $request->input('direction_ids')[0];
            }

            if ($request->filled('password')) {
                $updateData['password'] = Hash::make($request->password);
            }

            $user->update($updateData);

            if ($request->has('role_ids')) {
                $user->roles()->sync($request->role_ids ?? []);
            }

            if ($request->has('division_ids')) {
                $divisionIds = array_values(array_unique(array_merge(
                    [(int) $user->id_division],
                    array_map('intval', (array) $request->input('division_ids', []))
                )));
                $user->divisions()->sync($divisionIds);
            }

            DB::commit();

            $user->load(['roles', 'division.direction', 'divisions.direction']);
            LogHelper::update('users', $user->id, 'Modification de l utilisateur : ' . $user->full_name);

            return response()->json([
                'success' => true,
                'data' => $this->presentUser($user),
                'message' => 'Utilisateur mis a jour avec succes',
            ]);
        } catch (\Throwable $e) {
            DB::rollBack();

            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la mise a jour: ' . $e->getMessage(),
            ], 500);
        }
    }

    public function destroy($id)
    {
        $user = User::find($id);

        if (!$user) {
            return response()->json(['success' => false, 'message' => 'Utilisateur non trouve'], 404);
        }

        if ($user->id === auth()->id()) {
            return response()->json([
                'success' => false,
                'message' => 'Vous ne pouvez pas supprimer votre propre compte',
            ], 403);
        }

        $userName = $user->full_name;
        $user->roles()->detach();
        $user->delete();

        LogHelper::delete('users', $id, 'Suppression de l utilisateur : ' . $userName);

        return response()->json(['success' => true, 'message' => 'Utilisateur supprime avec succes']);
    }

    public function assignRoles(Request $request, $id)
    {
        $user = User::find($id);

        if (!$user) {
            return response()->json(['success' => false, 'message' => 'Utilisateur non trouve'], 404);
        }

        $validator = Validator::make($request->all(), [
            'role_ids' => 'required|array|min:1',
            'role_ids.*' => 'exists:roles,id',
        ]);

        if ($validator->fails()) {
            return response()->json(['success' => false, 'errors' => $validator->errors()], 422);
        }

        $user->roles()->syncWithoutDetaching($request->role_ids);
        $user->load(['roles', 'division.direction']);

        return response()->json([
            'success' => true,
            'data' => $this->presentUser($user),
            'message' => 'Roles assignes avec succes',
        ]);
    }

    public function removeRole($userId, $roleId)
    {
        $user = User::find($userId);

        if (!$user) {
            return response()->json(['success' => false, 'message' => 'Utilisateur non trouve'], 404);
        }

        $role = Role::find($roleId);

        if (!$role) {
            return response()->json(['success' => false, 'message' => 'Role non trouve'], 404);
        }

        if ($role->nom === 'Admin') {
            $adminUsers = User::whereHas('roles', function ($query) {
                $query->where('nom', 'Admin');
            })->count();

            if ($adminUsers <= 1 && $user->hasRole('Admin')) {
                return response()->json([
                    'success' => false,
                    'message' => 'Impossible de retirer le role Admin du dernier administrateur',
                ], 403);
            }
        }

        $user->roles()->detach($roleId);
        $user->load(['roles', 'division.direction']);

        return response()->json([
            'success' => true,
            'data' => $this->presentUser($user),
            'message' => 'Role retire avec succes',
        ]);
    }

    public function assignDirections(Request $request, $id)
    {
        $user = User::find($id);

        if (!$user) {
            return response()->json(['success' => false, 'message' => 'Utilisateur non trouve'], 404);
        }

        $validator = Validator::make($request->all(), [
            'direction_ids' => 'required|array|min:1',
            'direction_ids.*' => 'exists:divisions,id',
        ]);

        if ($validator->fails()) {
            return response()->json(['success' => false, 'errors' => $validator->errors()], 422);
        }

        $user->update(['id_division' => $request->direction_ids[0]]);
        $user->divisions()->sync(array_values(array_unique(array_map('intval', $request->direction_ids))));
        $user->load(['roles', 'division.direction', 'divisions.direction']);

        return response()->json([
            'success' => true,
            'data' => $this->presentUser($user),
            'message' => 'Division assignee avec succes',
        ]);
    }

    public function removeDirection($userId, $directionId)
    {
        $user = User::find($userId);

        if (!$user) {
            return response()->json(['success' => false, 'message' => 'Utilisateur non trouve'], 404);
        }

        if ((int) $user->id_division === (int) $directionId) {
            return response()->json([
                'success' => false,
                'message' => 'Un utilisateur doit conserver une division de rattachement.',
            ], 422);
        }

        $user->divisions()->detach($directionId);
        $user->load(['roles', 'division.direction', 'divisions.direction']);

        return response()->json(['success' => true, 'data' => $this->presentUser($user)]);
    }

    public function getWithDetails($id)
    {
        return $this->show($id);
    }

    public function stats()
    {
        return response()->json([
            'success' => true,
            'data' => [
                'total' => User::count(),
                'active' => User::where('statut', 'active')->count(),
                'inactive' => User::where('statut', 'inactive')->count(),
                'blocked' => User::where('statut', 'bloque')->count(),
            ],
        ]);
    }

    public function dashboardStats()
    {
        $roleStats = DB::table('roles')
            ->leftJoin('user_role', 'roles.id', '=', 'user_role.role_id')
            ->select('roles.id', 'roles.nom', DB::raw('COUNT(user_role.user_id) as users_count'))
            ->groupBy('roles.id', 'roles.nom')
            ->get();

        $divisionStats = DB::table('divisions')
            ->leftJoin('division_user', 'divisions.id', '=', 'division_user.division_id')
            ->leftJoin('users', 'division_user.user_id', '=', 'users.id')
            ->select('divisions.id', 'divisions.sigle', DB::raw('COUNT(DISTINCT division_user.user_id) as users_count'))
            ->whereNull('users.deleted_at')
            ->groupBy('divisions.id', 'divisions.sigle')
            ->get();

        $recentUsers = User::with(['roles', 'division.direction'])
            ->orderByDesc('created_at')
            ->limit(5)
            ->get()
            ->map(fn (User $user) => $this->presentUser($user));

        return response()->json([
            'success' => true,
            'data' => [
                'users' => $this->stats()->getData()->data,
                'roles' => $roleStats,
                'directions' => $divisionStats,
                'recent_users' => $recentUsers,
                'total_roles' => Role::count(),
                'total_directions' => Division::count(),
                'total_directions_globales' => Direction::count(),
                'directions_with_users' => $divisionStats->where('users_count', '>', 0)->count(),
            ],
        ]);
    }

    public function recentUsers()
    {
        $users = User::with(['roles', 'division.direction'])
            ->orderByDesc('created_at')
            ->limit(10)
            ->get()
            ->map(fn (User $user) => $this->presentUser($user));

        return response()->json(['success' => true, 'data' => $users]);
    }

    private function presentUser(User $user): array
    {
        $data = $user->toArray();
        $division = $user->division;
        $divisions = $user->relationLoaded('divisions')
            ? $user->divisions
            : $user->divisions()->with('direction')->get();

        if ($division && !$divisions->contains(fn ($item) => (int) $item->id === (int) $division->id)) {
            $divisions->prepend($division);
        }

        $data['division'] = $division;
        $data['divisions'] = $divisions->values();
        $data['direction'] = $division?->direction;
        $data['statut'] = $user->statut;
        $data['datecreation'] = $user->created_at;
        $data['dernierconnection'] = $user->derniere_connexion;

        return $data;
    }
}
