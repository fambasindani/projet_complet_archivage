<?php

namespace App\Http\Controllers;

use App\Models\Archive;
use App\Models\AuditLog;
use App\Models\TitrePerception;
use App\Models\TraitementOcr;
use Illuminate\Http\Request;

class NotificationController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();
        $divisionIds = $user->hasGlobalDivisionAccess() ? null : $user->accessibleDivisionIds();
        $items = collect();
        $actionCount = 0;

        if ($user->hasPermission('titres.view')) {
            $query = TitrePerception::with(['assujetti:id,nom_raison_sociale'])
                ->where('statut', 'brouillon');

            if ($divisionIds !== null) {
                if (empty($divisionIds)) {
                    $query->whereRaw('1 = 0');
                } else {
                    $query->whereIn('id_division', $divisionIds);
                }
            }

            $brouillonsCount = (clone $query)->count();
            $actionCount += $brouillonsCount;

            $brouillons = $query->orderByDesc('updated_at')
                ->limit(8)
                ->get()
                ->map(fn (TitrePerception $titre) => [
                    'id' => 'titre-' . $titre->id,
                    'type' => 'titre_brouillon',
                    'level' => 'warning',
                    'title' => 'Titre à valider',
                    'message' => trim(($titre->reference ?? '') . ' · ' . ($titre->assujetti->nom_raison_sociale ?? 'Sans assujetti')),
                    'date' => $titre->updated_at ?? $titre->created_at,
                    'link' => '/titres/' . $titre->id . '/modifier',
                ]);

            $items = $items->concat($brouillons);
        }

        if ($user->hasPermission('ocr.view')) {
            $query = TraitementOcr::with(['fichier.entite'])
                ->whereIn('statut', ['en_attente', 'erreur']);

            if ($divisionIds !== null) {
                if (empty($divisionIds)) {
                    $query->whereRaw('1 = 0');
                } else {
                    $archiveIds = Archive::whereIn('id_division', $divisionIds)->select('id');
                    $titreIds = TitrePerception::whereIn('id_division', $divisionIds)->select('id');

                    $query->whereHas('fichier', function ($fichier) use ($archiveIds, $titreIds) {
                        $fichier->where(function ($scope) use ($archiveIds, $titreIds) {
                            $scope->where(function ($archive) use ($archiveIds) {
                                $archive->where('entite_type', 'archive')
                                    ->whereIn('entite_id', $archiveIds);
                            })->orWhere(function ($titre) use ($titreIds) {
                                $titre->where('entite_type', 'titre_perception')
                                    ->whereIn('entite_id', $titreIds);
                            });
                        });
                    });
                }
            }

            $ocrCount = (clone $query)->count();
            $actionCount += $ocrCount;

            $ocrs = $query->orderByDesc('updated_at')
                ->limit(8)
                ->get()
                ->map(function (TraitementOcr $ocr) {
                    $fichier = $ocr->fichier;
                    $entite = $fichier?->entite;
                    $isTitre = $fichier?->entite_type === 'titre_perception';

                    return [
                        'id' => 'ocr-' . $ocr->id,
                        'type' => 'ocr_issue',
                        'level' => $ocr->statut === 'erreur' ? 'danger' : 'warning',
                        'title' => $ocr->statut === 'erreur' ? 'OCR en erreur' : 'OCR en attente',
                        'message' => trim(($fichier?->nom_original ?? 'Fichier') . ' · ' . ($entite?->reference ?? '')),
                        'date' => $ocr->updated_at ?? $ocr->created_at,
                        'link' => $fichier
                            ? ($isTitre
                                ? '/titres/' . $fichier->entite_id . '/modifier'
                                : '/archives/' . $fichier->entite_id . '/modifier')
                            : '/recherche-ocr',
                    ];
                });

            $items = $items->concat($ocrs);
        }

        if ($user->hasPermission('audit.view')) {
            $logs = AuditLog::with('user:id,nom,prenom')
                ->orderByDesc('created_at')
                ->limit(6)
                ->get()
                ->map(fn (AuditLog $log) => [
                    'id' => 'audit-' . $log->id,
                    'type' => 'audit',
                    'level' => 'info',
                    'title' => $log->action . ' · ' . $log->entite,
                    'message' => $log->description ?: 'Action enregistrée',
                    'date' => $log->created_at,
                    'link' => '/gestion-utilisateurs/journal',
                ]);

            $items = $items->concat($logs);
        }

        $items = $items
            ->filter(fn ($item) => !empty($item['date']))
            ->sortByDesc(fn ($item) => strtotime((string) $item['date']))
            ->values()
            ->take(12);

        return response()->json([
            'success' => true,
            'data' => [
                'items' => $items,
                'count' => $actionCount,
                'generated_at' => now(),
            ],
        ]);
    }
}
