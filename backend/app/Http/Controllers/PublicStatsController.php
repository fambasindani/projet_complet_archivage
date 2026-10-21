<?php

namespace App\Http\Controllers;

use App\Models\Archive;
use App\Models\CentreOrdonnancement;
use App\Models\Division;
use App\Models\TitrePerception;
use Illuminate\Support\Facades\DB;

class PublicStatsController extends Controller
{
    public function getHomeStats()
    {
        try {
            $totalArchives = Archive::count();
            $totalTitres = TitrePerception::where('statut', '!=', 'annule')->count();
            $archivesThisMonth = Archive::whereMonth('created_at', now()->month)->whereYear('created_at', now()->year)->count();
            $titresThisMonth = TitrePerception::whereMonth('created_at', now()->month)->whereYear('created_at', now()->year)->count();

            return response()->json([
                'success' => true,
                'data' => [
                    'total_archives' => $totalArchives + $totalTitres,
                    'archivages_mois' => $archivesThisMonth + $titresThisMonth,
                    'documents_traitement' => Archive::where('statut', 'actif')->count(),
                    'taux_disponibilite' => 99.8,
                    'modules' => [
                        'ad' => ['total' => $totalArchives, 'monthly' => $archivesThisMonth, 'label' => 'Archivage Ordinaire'],
                        'np' => ['total' => $totalTitres, 'monthly' => $titresThisMonth, 'label' => 'Titres de Perception'],
                    ],
                    'timestamp' => now(),
                ],
            ]);
        } catch (\Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la recuperation des statistiques',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    public function getAdStats()
    {
        try {
            $topDirections = Division::withCount(['declarations as declarations_count' => fn ($q) => $q->where('statut', 'actif')])
                ->having('declarations_count', '>', 0)
                ->orderByDesc('declarations_count')
                ->limit(5)
                ->get(['id', 'nom', 'sigle'])
                ->map(fn ($direction) => [
                    'id' => $direction->id,
                    'nom' => $direction->nom,
                    'sigle' => $direction->sigle,
                    'total' => $direction->declarations_count,
                ]);

            return response()->json([
                'success' => true,
                'data' => [
                    'total_documents' => Archive::count(),
                    'documents_actifs' => Archive::where('statut', 'actif')->count(),
                    'documents_archives' => Archive::where('statut', 'archive')->count(),
                    'documents_aujourdhui' => Archive::whereDate('created_at', today())->count(),
                    'documents_semaine' => Archive::whereBetween('created_at', [now()->startOfWeek(), now()->endOfWeek()])->count(),
                    'documents_mois' => Archive::whereMonth('created_at', now()->month)->whereYear('created_at', now()->year)->count(),
                    'top_directions' => $topDirections,
                ],
            ]);
        } catch (\Throwable $e) {
            return response()->json(['success' => false, 'message' => 'Erreur statistiques AD: ' . $e->getMessage()], 500);
        }
    }

    public function getNpStats()
    {
        try {
            $topCentres = CentreOrdonnancement::withCount(['notes as notes_count' => fn ($q) => $q->where('statut', '!=', 'annule')])
                ->orderByDesc('notes_count')
                ->limit(5)
                ->get(['id', 'nom'])
                ->map(fn ($centre) => ['id' => $centre->id, 'nom' => $centre->nom, 'total' => $centre->notes_count]);

            $statsParArticle = TitrePerception::select('id_article_budgetaire', DB::raw('count(*) as total'))
                ->whereNotNull('id_article_budgetaire')
                ->where('statut', '!=', 'annule')
                ->groupBy('id_article_budgetaire')
                ->orderByDesc('total')
                ->limit(5)
                ->get();

            return response()->json([
                'success' => true,
                'data' => [
                    'total_notes' => TitrePerception::where('statut', '!=', 'annule')->count(),
                    'notes_actives' => TitrePerception::where('statut', 'actif')->count(),
                    'notes_archivees' => TitrePerception::where('statut', 'archive')->count(),
                    'notes_aujourdhui' => TitrePerception::whereDate('created_at', today())->where('statut', '!=', 'annule')->count(),
                    'notes_semaine' => TitrePerception::whereBetween('created_at', [now()->startOfWeek(), now()->endOfWeek()])->where('statut', '!=', 'annule')->count(),
                    'notes_mois' => TitrePerception::whereMonth('created_at', now()->month)->whereYear('created_at', now()->year)->where('statut', '!=', 'annule')->count(),
                    'notes_annee' => TitrePerception::whereYear('created_at', now()->year)->where('statut', '!=', 'annule')->count(),
                    'top_centres' => $topCentres,
                    'top_articles' => $statsParArticle,
                ],
            ]);
        } catch (\Throwable $e) {
            return response()->json(['success' => false, 'message' => 'Erreur statistiques NP: ' . $e->getMessage()], 500);
        }
    }

    public function getModulesInfo()
    {
        return response()->json([
            'success' => true,
            'data' => [
                [
                    'type' => 'ad',
                    'title' => 'Archivage Ordinaire',
                    'description' => 'Gestion des documents administratifs courants, correspondances, rapports et documents generaux',
                    'color' => '#2E86C1',
                    'icon' => 'archive',
                    'stats' => [
                        'total' => Archive::count(),
                        'monthly' => Archive::whereMonth('created_at', now()->month)->whereYear('created_at', now()->year)->count(),
                    ],
                ],
                [
                    'type' => 'np',
                    'title' => 'Archivage Titres de Perception',
                    'description' => 'Gestion des titres de perception, notes, quittances et pieces comptables',
                    'color' => '#28B463',
                    'icon' => 'file-invoice',
                    'stats' => [
                        'total' => TitrePerception::where('statut', '!=', 'annule')->count(),
                        'monthly' => TitrePerception::whereMonth('created_at', now()->month)->whereYear('created_at', now()->year)->count(),
                    ],
                ],
            ],
        ]);
    }

    public function getRecentActivity()
    {
        $recentDeclarations = Archive::with('division')
            ->latest()
            ->limit(5)
            ->get()
            ->map(fn ($archive) => [
                'id' => $archive->id,
                'type' => 'declaration',
                'titre' => $archive->titre,
                'reference' => $archive->reference,
                'direction' => $archive->division?->nom,
                'date' => $archive->created_at,
                'statut' => $archive->statut,
            ]);

        $recentNotes = TitrePerception::with('centre')
            ->where('statut', '!=', 'annule')
            ->latest()
            ->limit(5)
            ->get()
            ->map(fn ($titre) => [
                'id' => $titre->id,
                'type' => 'note',
                'titre' => 'Titre N ' . $titre->numero_titre,
                'centre' => $titre->centre?->nom,
                'date' => $titre->created_at,
                'statut' => $titre->statut,
            ]);

        return response()->json([
            'success' => true,
            'data' => $recentDeclarations->concat($recentNotes)->sortByDesc('date')->values()->take(8),
        ]);
    }

    public function getSystemHealth()
    {
        $databaseStatus = 'connected';

        try {
            DB::connection()->getPdo();
        } catch (\Throwable $e) {
            $databaseStatus = 'error';
        }

        return response()->json([
            'success' => true,
            'data' => [
                'status' => 'healthy',
                'database' => $databaseStatus,
                'timestamp' => now(),
                'version' => '2.0.0',
            ],
        ]);
    }
}
