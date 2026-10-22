<?php

namespace App\Http\Controllers;

use App\Models\ArticleBudgetaire;
use App\Models\Assujetti;
use App\Models\CentreOrdonnancement;
use App\Models\Emplacement;
use App\Models\NotePerception;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;

class DashboardNoteController extends Controller
{
    private function notCancelled()
    {
        return NotePerception::where('statut', '!=', 'annule');
    }

    public function statistics(Request $request)
    {
        $base = $this->scopedTitres($request);
        $active = fn () => (clone $base)->where('statut', '!=', 'annule');

        $totalNotes = $active()->count();

        $topCentres = $active()
            ->select('id_centre_ordonnancement', DB::raw('count(*) as total'), DB::raw('MAX(created_at) as dernier_ajout'))
            ->with('centre:id,nom,description')
            ->whereNotNull('id_centre_ordonnancement')
            ->groupBy('id_centre_ordonnancement')
            ->orderByDesc('total')
            ->limit(5)
            ->get()
            ->map(fn ($item) => [
                'id' => $item->id_centre_ordonnancement,
                'nom' => $item->centre->nom ?? 'N/A',
                'description' => $item->centre->description ?? '',
                'total' => $item->total,
                'dernier_ajout' => $item->dernier_ajout,
            ]);

        $topArticles = $active()
            ->whereNotNull('id_article_budgetaire')
            ->select('id_article_budgetaire', DB::raw('count(*) as total'))
            ->with('articleBudgetaire:id,article_budgetaire,nom')
            ->groupBy('id_article_budgetaire')
            ->orderByDesc('total')
            ->limit(5)
            ->get()
            ->map(fn ($item) => [
                'id' => $item->id_article_budgetaire,
                'code' => $item->articleBudgetaire->article_budgetaire ?? null,
                'nom' => $item->articleBudgetaire->nom ?? 'Article inconnu',
                'total' => $item->total,
            ]);

        $topAssujettis = $active()
            ->whereNotNull('id_assujetti')
            ->select('id_assujetti', DB::raw('count(*) as total'))
            ->with('assujetti:id,nom_raison_sociale,numero_nif')
            ->groupBy('id_assujetti')
            ->orderByDesc('total')
            ->limit(5)
            ->get()
            ->map(fn ($item) => [
                'id' => $item->id_assujetti,
                'nom' => $item->assujetti->nom_raison_sociale ?? 'N/A',
                'nif' => $item->assujetti->numero_nif ?? 'N/A',
                'total' => $item->total,
            ]);

        $parClasseur = $active()
            ->whereNotNull('id_classeur')
            ->select('id_classeur', DB::raw('count(*) as total'))
            ->with('classeur:id,nom_classeur')
            ->groupBy('id_classeur')
            ->orderByDesc('total')
            ->get()
            ->map(fn ($item) => [
                'id' => $item->id_classeur,
                'nom' => $item->classeur->nom_classeur ?? 'N/A',
                'total' => $item->total,
            ]);

        return response()->json([
            'success' => true,
            'data' => [
                'total_notes' => $totalNotes,
                'total_centres' => CentreOrdonnancement::where('statut', true)->count(),
                'total_articles' => ArticleBudgetaire::where('statut', true)->count(),
                'total_assujettis' => Assujetti::where('statut', true)->count(),
                'total_emplacements' => Emplacement::where('statut', true)->count(),
                'notes_actives' => (clone $base)->where('statut', 'actif')->count(),
                'notes_archivees' => (clone $base)->where('statut', 'archive')->count(),
                'notes_brouillons' => (clone $base)->where('statut', 'brouillon')->count(),
                'montant_total' => (float) $active()->sum('montant'),
                'montant_mois' => (float) $active()
                    ->whereMonth('created_at', Carbon::now()->month)
                    ->whereYear('created_at', Carbon::now()->year)
                    ->sum('montant'),
                'notes_aujourdhui' => $active()->whereDate('created_at', Carbon::today())->count(),
                'notes_semaine' => $active()->whereBetween('created_at', [Carbon::now()->startOfWeek(), Carbon::now()->endOfWeek()])->count(),
                'notes_mois' => $active()->whereMonth('created_at', Carbon::now()->month)->whereYear('created_at', Carbon::now()->year)->count(),
                'notes_annee' => $active()->whereYear('created_at', Carbon::now()->year)->count(),
                'top_centres' => $topCentres,
                'top_articles' => $topArticles,
                'top_assujettis' => $topAssujettis,
                'par_classeur' => $parClasseur,
            ],
        ]);
    }

    public function centres(Request $request)
    {
        $query = CentreOrdonnancement::where('statut', true);

        if ($request->filled('search')) {
            $search = addcslashes($request->search, '%_\\');
            $query->where(function ($q) use ($search) {
                $q->where('nom', 'like', "%{$search}%")->orWhere('description', 'like', "%{$search}%");
            });
        }

        $centres = $query->withCount(['notes as total' => function ($q) use ($request) {
            $q->where('statut', '!=', 'annule');
            if ($request->filled('numero_article')) {
                $q->where('reference_declaration', $request->numero_article);
            }
            if ($request->filled('id_classeur')) {
                $q->where('id_classeur', $request->id_classeur);
            }
            if ($request->filled('id_assujetti')) {
                $q->where('id_assujetti', $request->id_assujetti);
            }
            $this->applyPeriod($q, $request->periode);
        }])->orderByDesc('total')->paginate($request->get('per_page', 12));

        foreach ($centres as $centre) {
            $derniere = NotePerception::where('id_centre_ordonnancement', $centre->id)
                ->where('statut', '!=', 'annule')
                ->orderByDesc('created_at')
                ->first();

            $centre->derniere_note = $derniere ? $derniere->created_at : null;
            $centre->dernier_numero = $derniere ? $derniere->numero_serie : null;
            $centre->total = $centre->total ?? 0;
            $centre->repartition_articles = NotePerception::where('id_centre_ordonnancement', $centre->id)
                ->where('statut', '!=', 'annule')
                ->whereNotNull('id_article_budgetaire')
                ->select('id_article_budgetaire', DB::raw('count(*) as total'))
                ->with('articleBudgetaire:id,article_budgetaire,nom')
                ->groupBy('id_article_budgetaire')
                ->orderByDesc('total')
                ->limit(3)
                ->get()
                ->map(fn ($item) => [
                    'code' => $item->articleBudgetaire->article_budgetaire ?? null,
                    'nom' => $item->articleBudgetaire->nom ?? 'N/A',
                    'total' => $item->total,
                ]);
        }

        return response()->json(['success' => true, 'data' => $centres]);
    }

    public function notesByCentre($id, Request $request)
    {
        $centre = CentreOrdonnancement::findOrFail($id);

        $query = NotePerception::where('id_centre_ordonnancement', $id)
            ->where('statut', '!=', 'annule')
            ->with(['classeur:id,nom_classeur', 'assujetti:id,nom_raison_sociale,numero_nif', 'emplacement:id,nom_emplacement', 'articleBudgetaire']);

        if ($request->filled('numero_article')) {
            $query->where('reference_declaration', $request->numero_article);
        }
        if ($request->filled('id_assujetti')) {
            $query->where('id_assujetti', $request->id_assujetti);
        }
        if ($request->filled('id_classeur')) {
            $query->where('id_classeur', $request->id_classeur);
        }
        if ($request->filled('numero_serie')) {
            $query->where('numero_titre', 'like', '%' . $request->numero_serie . '%');
        }
        $this->applyPeriod($query, $request->periode);

        $notes = $query->orderByDesc('created_at')->paginate($request->get('per_page', 15));

        $notes->getCollection()->transform(function ($note) {
            $note->article_info = $note->articleBudgetaire ? [
                'id' => $note->articleBudgetaire->id,
                'code' => $note->articleBudgetaire->article_budgetaire,
                'nom' => $note->articleBudgetaire->nom,
            ] : null;

            return $note;
        });

        $stats = [
            'total_notes' => NotePerception::where('id_centre_ordonnancement', $id)->where('statut', '!=', 'annule')->count(),
            'par_article' => NotePerception::where('id_centre_ordonnancement', $id)
                ->where('statut', '!=', 'annule')
                ->whereNotNull('id_article_budgetaire')
                ->select('id_article_budgetaire', DB::raw('count(*) as total'))
                ->with('articleBudgetaire:id,article_budgetaire,nom')
                ->groupBy('id_article_budgetaire')
                ->orderByDesc('total')
                ->get()
                ->map(fn ($item) => [
                    'code' => $item->articleBudgetaire->article_budgetaire ?? null,
                    'nom' => $item->articleBudgetaire->nom ?? 'N/A',
                    'total' => $item->total,
                ]),
            'par_assujetti' => NotePerception::where('id_centre_ordonnancement', $id)
                ->where('statut', '!=', 'annule')
                ->select('id_assujetti', DB::raw('count(*) as total'))
                ->with('assujetti:id,nom_raison_sociale')
                ->groupBy('id_assujetti')
                ->orderByDesc('total')
                ->limit(5)
                ->get(),
            'par_classeur' => NotePerception::where('id_centre_ordonnancement', $id)
                ->where('statut', '!=', 'annule')
                ->select('id_classeur', DB::raw('count(*) as total'))
                ->with('classeur:id,nom_classeur')
                ->groupBy('id_classeur')
                ->orderByDesc('total')
                ->limit(5)
                ->get(),
            'evolution_mensuelle' => NotePerception::where('id_centre_ordonnancement', $id)
                ->where('statut', '!=', 'annule')
                ->where('created_at', '>=', Carbon::now()->subMonths(6))
                ->select(DB::raw('DATE_FORMAT(created_at, "%Y-%m") as mois'), DB::raw('count(*) as total'))
                ->groupBy('mois')
                ->orderBy('mois')
                ->get(),
        ];

        return response()->json([
            'success' => true,
            'data' => [
                'centre' => ['id' => $centre->id, 'nom' => $centre->nom, 'description' => $centre->description],
                'notes' => $notes,
                'statistiques' => $stats,
            ],
        ]);
    }

    public function advancedSearch(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'nom_centre' => 'nullable|string|max:255',
            'numero_article' => 'nullable|string|max:255',
            'id_classeur' => 'nullable|exists:classeurs,id',
            'id_assujetti' => 'nullable|exists:assujettis,id',
            'numero_serie' => 'nullable|string|max:255',
            'periode' => 'nullable|in:all,today,week,month,year',
            'date_debut' => 'nullable|date',
            'date_fin' => 'nullable|date|after_or_equal:date_debut',
        ]);

        if ($validator->fails()) {
            return response()->json(['success' => false, 'errors' => $validator->errors()], 422);
        }

        $query = $this->notCancelled()->with([
            'centre:id,nom',
            'classeur:id,nom_classeur',
            'assujetti:id,nom_raison_sociale,numero_nif',
            'articleBudgetaire',
        ]);

        if ($request->filled('nom_centre')) {
            $query->whereHas('centre', fn ($q) => $q->where('nom', 'like', '%' . $request->nom_centre . '%'));
        }
        if ($request->filled('numero_article')) {
            $query->where('reference_declaration', 'like', '%' . $request->numero_article . '%');
        }
        if ($request->filled('id_classeur')) {
            $query->where('id_classeur', $request->id_classeur);
        }
        if ($request->filled('id_assujetti')) {
            $query->where('id_assujetti', $request->id_assujetti);
        }
        if ($request->filled('numero_serie')) {
            $query->where('numero_titre', 'like', '%' . $request->numero_serie . '%');
        }
        $this->applyPeriod($query, $request->periode);
        if ($request->filled('date_debut')) {
            $query->whereDate('created_at', '>=', $request->date_debut);
        }
        if ($request->filled('date_fin')) {
            $query->whereDate('created_at', '<=', $request->date_fin);
        }

        $results = $query->orderByDesc('created_at')->paginate($request->get('per_page', 12));

        $results->getCollection()->transform(function ($note) {
            $note->article_info = $note->articleBudgetaire ? [
                'code' => $note->articleBudgetaire->article_budgetaire,
                'nom' => $note->articleBudgetaire->nom,
            ] : null;

            return $note;
        });

        $grouped = $results->getCollection()->groupBy('id_centre_ordonnancement')->map(function ($items, $key) {
            $centre = $items->first()->centre;

            return [
                'id' => $key,
                'id_centre' => $key,
                'nom_centre' => $centre->nom ?? 'N/A',
                'total' => $items->count(),
                'notes' => $items->map(fn ($note) => [
                    'id' => $note->id,
                    'numero_serie' => $note->numero_serie,
                    'numero_article' => $note->numero_article,
                    'article_info' => $note->article_info,
                    'date_ordonnancement' => $note->date_ordonnancement,
                    'date_enregistrement' => $note->date_enregistrement,
                    'classeur' => $note->classeur->nom_classeur ?? null,
                    'assujetti' => $note->assujetti ? [
                        'nom' => $note->assujetti->nom_raison_sociale,
                        'nif' => $note->assujetti->numero_nif,
                    ] : null,
                    'created_at' => $note->created_at,
                ]),
            ];
        })->values();

        return response()->json([
            'success' => true,
            'data' => [
                'centres' => $grouped,
                'pagination' => [
                    'current_page' => $results->currentPage(),
                    'last_page' => $results->lastPage(),
                    'per_page' => $results->perPage(),
                    'total' => $results->total(),
                ],
            ],
        ]);
    }

    public function centreStats($id)
    {
        $centre = CentreOrdonnancement::findOrFail($id);

        $parArticle = NotePerception::where('id_centre_ordonnancement', $id)
            ->where('statut', '!=', 'annule')
            ->whereNotNull('id_article_budgetaire')
            ->select('id_article_budgetaire', DB::raw('count(*) as total'))
            ->with('articleBudgetaire:id,article_budgetaire,nom')
            ->groupBy('id_article_budgetaire')
            ->orderByDesc('total')
            ->get()
            ->map(fn ($item) => [
                'code' => $item->articleBudgetaire->article_budgetaire ?? null,
                'nom' => $item->articleBudgetaire->nom ?? 'N/A',
                'total' => $item->total,
            ]);

        return response()->json([
            'success' => true,
            'data' => [
                'centre' => ['id' => $centre->id, 'nom' => $centre->nom, 'description' => $centre->description],
                'total_notes' => NotePerception::where('id_centre_ordonnancement', $id)->where('statut', '!=', 'annule')->count(),
                'notes_par_mois' => NotePerception::where('id_centre_ordonnancement', $id)
                    ->where('statut', '!=', 'annule')
                    ->select(DB::raw('YEAR(created_at) as annee'), DB::raw('MONTH(created_at) as mois'), DB::raw('count(*) as total'))
                    ->groupBy('annee', 'mois')
                    ->orderByDesc('annee')
                    ->orderByDesc('mois')
                    ->limit(12)
                    ->get(),
                'par_article' => $parArticle,
                'par_assujetti' => NotePerception::where('id_centre_ordonnancement', $id)
                    ->where('statut', '!=', 'annule')
                    ->select('id_assujetti', DB::raw('count(*) as total'))
                    ->with('assujetti:id,nom_raison_sociale')
                    ->groupBy('id_assujetti')
                    ->orderByDesc('total')
                    ->limit(10)
                    ->get(),
                'par_classeur' => NotePerception::where('id_centre_ordonnancement', $id)
                    ->where('statut', '!=', 'annule')
                    ->select('id_classeur', DB::raw('count(*) as total'))
                    ->with('classeur:id,nom_classeur')
                    ->groupBy('id_classeur')
                    ->orderByDesc('total')
                    ->get(),
                'evolution' => NotePerception::where('id_centre_ordonnancement', $id)
                    ->where('statut', '!=', 'annule')
                    ->where('created_at', '>=', Carbon::now()->subMonths(12))
                    ->select(DB::raw('DATE_FORMAT(created_at, "%Y-%m") as mois'), DB::raw('count(*) as total'))
                    ->groupBy('mois')
                    ->orderBy('mois')
                    ->get(),
            ],
        ]);
    }

    public function articleStats($id)
    {
        $article = ArticleBudgetaire::findOrFail($id);

        return response()->json([
            'success' => true,
            'data' => [
                'article' => $article,
                'total' => NotePerception::where('id_article_budgetaire', $id)->where('statut', '!=', 'annule')->count(),
                'par_centre' => NotePerception::where('id_article_budgetaire', $id)
                    ->where('statut', '!=', 'annule')
                    ->select('id_centre_ordonnancement', DB::raw('count(*) as total'))
                    ->with('centre:id,nom')
                    ->groupBy('id_centre_ordonnancement')
                    ->orderByDesc('total')
                    ->get(),
            ],
        ]);
    }

    public function recentActivities(Request $request)
    {
        $activities = $this->scopedTitres($request)
            ->where('statut', '!=', 'annule')
            ->with(['centre:id,nom', 'classeur:id,nom_classeur', 'assujetti:id,nom_raison_sociale', 'articleBudgetaire'])
            ->orderByDesc('created_at')
            ->limit(20)
            ->get()
            ->map(fn ($note) => [
                'id' => $note->id,
                'type' => 'note',
                'action' => 'Creation',
                'numero_serie' => $note->numero_serie,
                'centre' => $note->centre->nom ?? 'N/A',
                'article' => $note->articleBudgetaire
                    ? $note->articleBudgetaire->article_budgetaire . ' - ' . $note->articleBudgetaire->nom
                    : ($note->numero_article ?? 'N/A'),
                'classeur' => $note->classeur->nom_classeur ?? 'N/A',
                'assujetti' => $note->assujetti->nom_raison_sociale ?? 'N/A',
                'date_ordonnancement' => $note->date_ordonnancement,
                'created_at' => $note->created_at,
                'created_at_humain' => optional($note->created_at)->diffForHumans(),
            ]);

        return response()->json(['success' => true, 'data' => $activities]);
    }

    public function getArticles()
    {
        return response()->json([
            'success' => true,
            'data' => ArticleBudgetaire::where('statut', true)
                ->select('id', 'article_budgetaire as code', 'nom')
                ->orderBy('article_budgetaire')
                ->get(),
        ]);
    }

    public function getAssujettis()
    {
        return response()->json([
            'success' => true,
            'data' => Assujetti::where('statut', true)
                ->select('id', 'nom_raison_sociale as nom', 'numero_nif')
                ->orderBy('nom_raison_sociale')
                ->get(),
        ]);
    }

    public function getClasseurs()
    {
        return response()->json([
            'success' => true,
            'data' => DB::table('classeurs')
                ->where('statut', true)
                ->select('id', 'nom_classeur as nom')
                ->orderBy('nom_classeur')
                ->get(),
        ]);
    }

    private function scopedTitres(Request $request)
    {
        $query = NotePerception::query();
        $user = $request->user();

        if ($user && !$user->hasGlobalDivisionAccess()) {
            $divisionIds = $user->accessibleDivisionIds();

            if (empty($divisionIds)) {
                return $query->whereRaw('1 = 0');
            }

            $query->whereIn('id_division', $divisionIds);
        }

        return $query;
    }

    private function applyPeriod($query, $periode): void
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
