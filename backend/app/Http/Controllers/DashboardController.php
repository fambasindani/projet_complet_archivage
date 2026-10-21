<?php

namespace App\Http\Controllers;

use App\Models\Archive;
use App\Models\Classeur;
use App\Models\Division;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    private function activeArchives()
    {
        return Archive::where('statut', '!=', 'brouillon');
    }

    public function getNotePerceptionCountByCentre()
    {
        return response()->json(
            DB::table('titres_perception')
                ->join('centre_ordonnancements', 'titres_perception.id_centre_ordonnancement', '=', 'centre_ordonnancements.id')
                ->where('titres_perception.statut', '!=', 'annule')
                ->select(
                    'centre_ordonnancements.id as id_centre',
                    'centre_ordonnancements.nom as centre_ordonnancement',
                    DB::raw('COUNT(titres_perception.id) as total')
                )
                ->groupBy('centre_ordonnancements.id', 'centre_ordonnancements.nom')
                ->orderByDesc('total')
                ->get()
        );
    }

    public function getNotePerceptionCountByCentre_id($id)
    {
        return response()->json(
            DB::table('titres_perception')
                ->join('centre_ordonnancements', 'titres_perception.id_centre_ordonnancement', '=', 'centre_ordonnancements.id')
                ->where('titres_perception.statut', '!=', 'annule')
                ->where('titres_perception.id_article_budgetaire', $id)
                ->select(
                    'centre_ordonnancements.id as id_centre',
                    'centre_ordonnancements.nom as centre_ordonnancement',
                    'titres_perception.id_article_budgetaire as id_ministere',
                    DB::raw('COUNT(titres_perception.id) as total')
                )
                ->groupBy('centre_ordonnancements.id', 'centre_ordonnancements.nom', 'titres_perception.id_article_budgetaire')
                ->orderByDesc('total')
                ->get()
        );
    }

    public function getDeclarationSummary()
    {
        return response()->json(
            DB::table('archives')
                ->join('classeurs', 'archives.id_classeur', '=', 'classeurs.id')
                ->select(
                    'classeurs.id as id_classeur',
                    'classeurs.nom_classeur',
                    DB::raw('COUNT(archives.id) as total'),
                    DB::raw('MAX(archives.created_at) as last_created_at')
                )
                ->groupBy('classeurs.id', 'classeurs.nom_classeur')
                ->orderByDesc('total')
                ->get()
                ->map(fn ($item) => [
                    'nom_classeur' => $item->nom_classeur,
                    'id_classeur' => $item->id_classeur,
                    'created_at' => $item->last_created_at,
                    'total' => $item->total,
                ])
        );
    }

    public function Searchdeclaration(Request $request)
    {
        $query = DB::table('archives')
            ->join('classeurs', 'archives.id_classeur', '=', 'classeurs.id')
            ->join('divisions', 'archives.id_division', '=', 'divisions.id')
            ->select(
                'divisions.id as id_direction',
                'classeurs.nom_classeur',
                'classeurs.id as id_classeur',
                'divisions.nom as nom_direction',
                DB::raw('COUNT(archives.id) as total')
            )
            ->groupBy('divisions.id', 'classeurs.nom_classeur', 'classeurs.id', 'divisions.nom');

        if ($request->filled('direction_id')) {
            $query->where('archives.id_division', $request->direction_id);
        }
        if ($request->filled('classeur_id')) {
            $query->where('archives.id_classeur', $request->classeur_id);
        }
        if ($request->filled('nom_classeur')) {
            $query->where('classeurs.nom_classeur', 'like', '%' . $request->nom_classeur . '%');
        }

        return response()->json($query->orderByDesc('total')->get());
    }

    public function declarationSearch(Request $request)
    {
        return $this->Searchdeclaration($request);
    }

    public function statistics()
    {
        $totalDocuments = Archive::count();
        $documentsActifs = Archive::where('statut', 'actif')->count();
        $documentsArchives = Archive::where('statut', 'archive')->count();

        $topClassificateurs = Archive::select('id_classeur', DB::raw('count(*) as total'), DB::raw('MAX(created_at) as dernier_ajout'))
            ->with('classeur:id,nom_classeur,created_at')
            ->groupBy('id_classeur')
            ->orderByDesc('total')
            ->limit(5)
            ->get()
            ->map(fn ($item) => [
                'id' => $item->id_classeur,
                'nom' => $item->classeur->nom_classeur ?? 'N/A',
                'total' => $item->total,
                'dernier_ajout' => $item->dernier_ajout,
                'created_at' => $item->classeur->created_at ?? null,
            ]);

        $topDirections = Archive::select('id_division', DB::raw('count(*) as total'))
            ->with('division:id,nom,sigle')
            ->groupBy('id_division')
            ->orderByDesc('total')
            ->limit(5)
            ->get()
            ->map(fn ($item) => [
                'id' => $item->id_division,
                'nom' => $item->division->nom ?? 'N/A',
                'sigle' => $item->division->sigle ?? 'N/A',
                'total' => $item->total,
            ]);

        return response()->json([
            'success' => true,
            'data' => [
                'total_documents' => $totalDocuments,
                'total_classificateurs' => Classeur::whereHas('archives')->count(),
                'total_directions' => Division::count(),
                'documents_actifs' => $documentsActifs,
                'documents_archives' => $documentsArchives,
                'documents_aujourdhui' => Archive::whereDate('created_at', Carbon::today())->count(),
                'documents_semaine' => Archive::whereBetween('created_at', [Carbon::now()->startOfWeek(), Carbon::now()->endOfWeek()])->count(),
                'documents_mois' => Archive::whereMonth('created_at', Carbon::now()->month)->whereYear('created_at', Carbon::now()->year)->count(),
                'top_classificateurs' => $topClassificateurs,
                'top_directions' => $topDirections,
            ],
        ]);
    }

    public function classifiers(Request $request)
    {
        $query = Classeur::whereHas('archives');

        if ($request->filled('search')) {
            $query->where('nom_classeur', 'like', '%' . $request->search . '%');
        }

        if ($request->filled('id_direction')) {
            $query->whereHas('archives', fn ($q) => $q->where('id_division', $request->id_direction));
        }

        $classificateurs = $query
            ->withCount(['archives as total' => function ($q) use ($request) {
                if ($request->filled('id_direction')) {
                    $q->where('id_division', $request->id_direction);
                }
                $this->applyPeriodFilter($q, $request->periode);
            }])
            ->with(['archives.division'])
            ->orderByDesc('total')
            ->paginate($request->get('per_page', 12));

        foreach ($classificateurs as $classeur) {
            $dernierQuery = Archive::where('id_classeur', $classeur->id);
            if ($request->filled('id_direction')) {
                $dernierQuery->where('id_division', $request->id_direction);
            }
            $this->applyPeriodFilter($dernierQuery, $request->periode);
            $dernier = $dernierQuery->orderByDesc('created_at')->first();
            $classeur->dernier_document = $dernier ? $dernier->created_at->toIso8601String() : null;
            $classeur->total = $classeur->total ?? 0;

            $divisions = Archive::where('id_classeur', $classeur->id)
                ->with('division')
                ->select('id_division')
                ->distinct()
                ->get()
                ->pluck('division')
                ->filter();

            $classeur->directions = $divisions->values();
            $classeur->directions_count = $divisions->count();
            $classeur->directions_noms = $divisions->pluck('nom')->implode(', ');
        }

        return response()->json(['success' => true, 'data' => $classificateurs]);
    }

    public function classifiersByDirection($id)
    {
        $division = Division::findOrFail($id);

        $classificateurs = Classeur::withCount(['archives as total' => fn ($q) => $q->where('id_division', $id)])
            ->having('total', '>', 0)
            ->orderByDesc('total')
            ->get()
            ->map(fn ($classeur) => [
                'id' => $classeur->id,
                'nom' => $classeur->nom_classeur,
                'total' => $classeur->total ?? 0,
            ]);

        return response()->json([
            'success' => true,
            'data' => [
                'direction' => ['id' => $division->id, 'nom' => $division->nom, 'sigle' => $division->sigle],
                'classificateurs' => $classificateurs,
                'total' => $classificateurs->count(),
            ],
        ]);
    }

    public function advancedSearch(Request $request)
    {
        $validator = validator($request->all(), [
            'nom_classeur' => 'nullable|string|max:255',
            'id_direction' => 'nullable|exists:divisions,id',
            'periode' => 'nullable|in:all,today,week,month,year',
            'statut' => 'nullable|in:actif,archive,inactif,brouillon,tous',
            'date_debut' => 'nullable|date',
            'date_fin' => 'nullable|date|after_or_equal:date_debut',
        ]);

        if ($validator->fails()) {
            return response()->json(['success' => false, 'errors' => $validator->errors()], 422);
        }

        $query = Archive::with(['classeur', 'division', 'utilisateur']);

        if ($request->filled('nom_classeur')) {
            $query->whereHas('classeur', fn ($q) => $q->where('nom_classeur', 'like', '%' . $request->nom_classeur . '%'));
        }
        if ($request->filled('id_direction')) {
            $query->where('id_division', $request->id_direction);
        }
        if ($request->filled('statut') && $request->statut !== 'tous') {
            $query->where('statut', $request->statut);
        }
        $this->applyPeriodFilter($query, $request->periode);
        if ($request->filled('date_debut')) {
            $query->whereDate('created_at', '>=', $request->date_debut);
        }
        if ($request->filled('date_fin')) {
            $query->whereDate('created_at', '<=', $request->date_fin);
        }

        $results = $query->orderByDesc('created_at')->paginate($request->get('per_page', 12));

        $grouped = $results->getCollection()->groupBy('id_classeur')->map(function ($items, $key) {
            $classeur = $items->first()->classeur;

            return [
                'id' => $key,
                'id_classeur' => $key,
                'nom_classeur' => $classeur->nom_classeur ?? 'N/A',
                'total' => $items->count(),
                'documents' => $items->map(fn ($doc) => [
                    'id' => $doc->id,
                    'intitule' => $doc->intitule,
                    'num_reference' => $doc->num_reference,
                    'num_declaration' => $doc->num_declaration,
                    'date_creation' => $doc->date_creation,
                    'direction' => $doc->division->nom ?? null,
                    'utilisateur' => $doc->utilisateur ? $doc->utilisateur->full_name : null,
                ]),
            ];
        })->values();

        return response()->json([
            'success' => true,
            'data' => [
                'classificateurs' => $grouped,
                'pagination' => [
                    'current_page' => $results->currentPage(),
                    'last_page' => $results->lastPage(),
                    'per_page' => $results->perPage(),
                    'total' => $results->total(),
                ],
            ],
        ]);
    }

    public function directionStats($id)
    {
        $division = Division::findOrFail($id);

        $documentsParMois = Archive::where('id_division', $id)
            ->select(DB::raw('YEAR(created_at) as annee'), DB::raw('MONTH(created_at) as mois'), DB::raw('count(*) as total'))
            ->groupBy('annee', 'mois')
            ->orderByDesc('annee')
            ->orderByDesc('mois')
            ->limit(6)
            ->get();

        $topClasseurs = Archive::where('id_division', $id)
            ->select('id_classeur', DB::raw('count(*) as total'))
            ->with('classeur:id,nom_classeur')
            ->groupBy('id_classeur')
            ->orderByDesc('total')
            ->limit(5)
            ->get()
            ->map(fn ($item) => [
                'id' => $item->id_classeur,
                'nom' => $item->classeur->nom_classeur ?? 'N/A',
                'total' => $item->total,
            ]);

        $utilisateursActifs = Archive::where('id_division', $id)
            ->select('id_user_createur', DB::raw('count(*) as total'))
            ->with('utilisateur:id,nom,prenom,email')
            ->groupBy('id_user_createur')
            ->orderByDesc('total')
            ->limit(5)
            ->get()
            ->map(fn ($item) => [
                'id' => $item->id_user_createur,
                'nom' => $item->utilisateur->nom ?? 'N/A',
                'prenom' => $item->utilisateur->prenom ?? 'N/A',
                'email' => $item->utilisateur->email ?? 'N/A',
                'total' => $item->total,
            ]);

        return response()->json([
            'success' => true,
            'data' => [
                'direction' => ['id' => $division->id, 'nom' => $division->nom, 'sigle' => $division->sigle],
                'total_documents' => Archive::where('id_division', $id)->count(),
                'documents_par_mois' => $documentsParMois,
                'top_classeurs' => $topClasseurs,
                'utilisateurs_actifs' => $utilisateursActifs,
            ],
        ]);
    }

    public function recentActivities()
    {
        $activities = Archive::with(['utilisateur', 'classeur', 'division'])
            ->orderByDesc('created_at')
            ->limit(15)
            ->get()
            ->map(fn ($declaration) => [
                'id' => $declaration->id,
                'type' => 'document',
                'action' => 'Creation',
                'document' => $declaration->intitule ?? 'Sans titre',
                'reference' => $declaration->num_reference,
                'classeur' => $declaration->classeur->nom_classeur ?? 'N/A',
                'direction' => $declaration->division->sigle ?? 'N/A',
                'direction_nom' => $declaration->division->nom ?? 'N/A',
                'utilisateur' => $declaration->utilisateur ? $declaration->utilisateur->full_name : 'N/A',
                'created_at' => $declaration->created_at,
                'created_at_humain' => optional($declaration->created_at)->diffForHumans(),
            ]);

        return response()->json(['success' => true, 'data' => $activities]);
    }

    private function applyPeriodFilter($query, $periode): void
    {
        if (empty($periode) || $periode === 'all') {
            return;
        }

        switch ($periode) {
            case 'today':
                $query->whereDate('created_at', Carbon::today());
                break;
            case 'week':
                $query->whereBetween('created_at', [Carbon::now()->startOfWeek(), Carbon::now()->endOfWeek()]);
                break;
            case 'month':
                $query->whereMonth('created_at', Carbon::now()->month)->whereYear('created_at', Carbon::now()->year);
                break;
            case 'year':
                $query->whereYear('created_at', Carbon::now()->year);
                break;
        }
    }
}

