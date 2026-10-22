<?php

namespace App\Http\Controllers;

use App\Models\Archive;
use App\Models\MonUtilisateur;
use App\Models\TitrePerception;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Storage;

class ProfilController extends Controller
{
    /**
     * Afficher le profil de l'utilisateur connecté
     */
    public function monProfil(Request $request)
    {
        $utilisateur = $request->user();

        return response()->json([
            'success' => true,
            'data' => $this->profileData($utilisateur),
        ]);
    }

    private function profileData($user): array
    {
        $user->loadMissing(['division.direction', 'divisions.direction', 'roles.permissions']);

        $division = $user->division;
        $divisions = $user->divisions->sortBy('sigle')->values();

        if ($division && !$divisions->contains(fn ($item) => (int) $item->id === (int) $division->id)) {
            $divisions->prepend($division);
        }

        $archives = Archive::where('id_user_createur', $user->id)->count();
        $titres = TitrePerception::where('id_user_createur', $user->id)->count();
        $archivesMois = Archive::where('id_user_createur', $user->id)
            ->whereMonth('created_at', now()->month)
            ->whereYear('created_at', now()->year)
            ->count();
        $titresMois = TitrePerception::where('id_user_createur', $user->id)
            ->whereMonth('created_at', now()->month)
            ->whereYear('created_at', now()->year)
            ->count();

        $lastArchive = Archive::where('id_user_createur', $user->id)->max('updated_at');
        $lastTitre = TitrePerception::where('id_user_createur', $user->id)->max('updated_at');
        $lastActivity = collect([$lastArchive, $lastTitre])->filter()->sortDesc()->first();

        return [
            'id' => $user->id,
            'nom' => $user->nom,
            'prenom' => $user->prenom,
            'full_name' => $user->full_name,
            'email' => $user->email,
            'matricule' => $user->matricule,
            'telephone' => $user->telephone,
            'statut' => $user->statut,
            'avatar' => $user->avatar,
            'avatar_url' => $user->avatar ? url('api/profil/avatar/' . $user->avatar) : null,
            'initiales' => $this->getInitiales($user),
            'couleur_avatar' => $this->getCouleurAvatar($user->id),
            'datecreation' => $user->created_at,
            'dernierconnection' => $user->derniere_connexion,
            'acces_direction' => (bool) $user->acces_direction,
            'divisions' => $divisions,
            'division' => $division,
            'direction' => $division?->direction,
            'roles' => $user->roles,
            'permissions' => $user->roles->flatMap(fn ($role) => $role->permissions->pluck('code'))->unique()->values(),
            'stats' => [
                'total_documents' => $archives + $titres,
                'archives' => $archives,
                'titres' => $titres,
                'documents_mois' => $archivesMois + $titresMois,
                'dernier_activite' => $lastActivity,
            ],
            'created_at' => $user->created_at,
            'updated_at' => $user->updated_at,
        ];
    }

    /**
     * Afficher le profil d'un utilisateur spécifique
     */
    public function show(Request $request, $id)
    {
        $auth = $request->user();
        if (!$auth || ((int) $auth->id !== (int) $id && !$auth->hasRole('Admin'))) {
            return response()->json(['success' => false, 'message' => 'Acces non autorise'], 403);
        }

        $utilisateur = MonUtilisateur::find($id);

        if (!$utilisateur) {
            return response()->json([
                'success' => false,
                'message' => 'Utilisateur non trouvé'
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $this->profileData($utilisateur),
        ]);
    }

    /**
     * Modifier le profil d'un utilisateur
     */
  public function modifierProfil(Request $request, $id)
{
    $user = MonUtilisateur::find($id);
    
    if (!$user) {
        return response()->json([
            'success' => false,
            'message' => 'Utilisateur non trouvé'
        ], 404);
    }

    $auth = $request->user();
    if (!$auth || ((int) $auth->id !== (int) $id && !$auth->hasRole('Admin'))) {
        return response()->json(['success' => false, 'message' => 'Acces non autorise'], 403);
    }

    // ✅ Validation avec ancien mot de passe obligatoire si nouveau mot de passe fourni
    $rules = [
        'nom' => 'sometimes|string|max:50',
        'prenom' => 'sometimes|string|max:50',
        'email' => 'sometimes|email|unique:users,email,' . $id,
        'telephone' => 'nullable|string|max:30',
        'avatar' => 'nullable|image|mimes:jpeg,png,jpg,gif,webp|max:5048',
    ];

    // 🔐 Si un nouveau mot de passe est fourni, l'ancien devient obligatoire
    if ($request->filled('password')) {
        $rules['current_password'] = 'required|string';
        $rules['password'] = 'required|string|min:6|confirmed';
    }

    $validator = Validator::make($request->all(), $rules);

    if ($validator->fails()) {
        return response()->json([
            'success' => false,
            'errors' => $validator->errors()
        ], 422);
    }

    try {
        // 🔐 VÉRIFICATION DE L'ANCIEN MOT DE PASSE
        if ($request->filled('password')) {
            // Récupérer le mot de passe actuel de l'utilisateur
            $currentPassword = $user->password;
            
            // Vérifier si l'ancien mot de passe correspond
            if (!Hash::check($request->current_password, $currentPassword)) {
                return response()->json([
                    'success' => false,
                    'errors' => [
                        'current_password' => ['L\'ancien mot de passe est incorrect']
                    ]
                ], 401); // 401 Unauthorized
            }
        }

        // 🔹 Données à mettre à jour
        $updateData = [];

        if ($request->has('nom')) {
            $updateData['nom'] = $request->nom;
        }
        if ($request->has('prenom')) {
            $updateData['prenom'] = $request->prenom;
        }
        if ($request->has('email')) {
            $updateData['email'] = $request->email;
        }
        if ($request->has('telephone')) {
            $updateData['telephone'] = $request->telephone;
        }
        
        // 🔐 Mise à jour du mot de passe uniquement si fourni ET après vérification
        if ($request->filled('password')) {
            $updateData['password'] = Hash::make($request->password);
        }

        // 🔥 GESTION DE L'IMAGE - DOSSIER app/avatar
        if ($request->hasFile('avatar')) {
            // Supprimer l'ancienne image
            if ($user->avatar) {
                Storage::disk('local')->delete('avatar/' . $user->avatar);
            }
            
            // Générer un nom unique avec le format: id_timestamp.extension
            $file = $request->file('avatar');
            $extension = $file->getClientOriginalExtension();
            $filename = $id . '_' . time() . '.' . $extension;
            
            // Stocker dans app/avatar
            $file->storeAs('avatar', $filename, 'local');
            
            // Sauvegarder le nom dans la BD
            $updateData['avatar'] = $filename;
        }

        // Mise à jour
        $user->update($updateData);
        
        // 🔥 Recharger l'utilisateur
        $user = MonUtilisateur::find($id);
        
        // 🔥 URL complète avec le prefix API
        $user->avatar_url = $user->avatar 
            ? url('api/profil/avatar/' . $user->avatar)
            : null;

        return response()->json([
            'success' => true,
            'data' => $this->profileData($user),
            'message' => 'Profil mis à jour avec succès'
        ], 200);

    } catch (\Exception $e) {
        return response()->json([
            'success' => false,
            'message' => 'Erreur: ' . $e->getMessage()
        ], 500);
    }
}

    /**
     * Afficher le profil d'un utilisateur avec toutes ses relations
     */
    public function afficherProfil(Request $request, $id)
    {
        $auth = $request->user();
        if (!$auth || ((int) $auth->id !== (int) $id && !$auth->hasRole('Admin'))) {
            return response()->json(['success' => false, 'message' => 'Acces non autorise'], 403);
        }

        $user = MonUtilisateur::find($id);

        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'Utilisateur non trouvé'
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $this->profileData($user),
            'message' => 'Profil récupéré avec succès'
        ], 200);
    }

    /**
 * Servir les fichiers avatar depuis storage/app/avatar/ - sécurisé
 */
public function getAvatar($filename)
{
    try {
        // Sécurisation path traversal
        $filename = basename($filename);
        if (!preg_match('/^[a-zA-Z0-9_\-]+\.(jpg|jpeg|png|gif|webp)$/i', $filename)) {
            return response()->json([
                'success' => false,
                'message' => 'Nom de fichier invalide'
            ], 400);
        }
        $path = storage_path('app/avatar/' . $filename);

        if (!file_exists($path)) {
            \Log::error('Avatar non trouvé', [
                'filename' => $filename,
                'path' => $path,
                'exists' => false
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Image non trouvée: ' . $filename
            ], 404);
        }

        return response()->file($path);

    } catch (\Exception $e) {

        \Log::error('Erreur lors de la récupération de l’avatar', [
            'filename' => $filename,
            'error' => $e->getMessage()
        ]);

        return response()->json([
            'success' => false,
            'message' => 'Une erreur est survenue lors de la récupération de l’image.'
        ], 500);
    }
}

















    // ===========================================
    // 🔥 MÉTHODES UTILITAIRES
    // ===========================================

    /**
     * Générer les initiales à partir du nom et prénom
     */
    private function getInitiales($user)
    {
        $initials = '';
        if ($user->prenom) {
            $initials .= mb_substr($user->prenom, 0, 1);
        }
        if ($user->nom) {
            $initials .= mb_substr($user->nom, 0, 1);
        }
        return strtoupper($initials);
    }

    /**
     * Générer une couleur pour l'avatar basée sur l'ID
     */
    private function getCouleurAvatar($id)
    {
        $colors = ['primary', 'success', 'warning', 'info', 'danger', 'purple', 'pink', 'indigo'];
        $index = crc32($id) % count($colors);
        return $colors[$index];
    }
}
