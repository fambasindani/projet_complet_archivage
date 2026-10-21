<?php

namespace App\Http\Controllers;

use App\Models\Archive;
use App\Models\TitrePerception;
use App\Models\TraitementOcr;
use Illuminate\Http\Request;

class OcrSearchController extends Controller
{
    public function search(Request $request)
    {
        $data = $request->validate([
            'q' => 'nullable|string|max:255',
            'entite_type' => 'nullable|in:archive,titre_perception',
            'per_page' => 'nullable|integer|min:1|max:100',
        ]);

        $query = TraitementOcr::query()
            ->with(['fichier.entite'])
            ->whereNotNull('texte_extrait');

        $search = trim((string) ($data['q'] ?? ''));

        if ($search !== '') {
            $escaped = addcslashes($search, '%_\\');
            $query->where('texte_extrait', 'like', "%{$escaped}%");
        }

        if (!empty($data['entite_type'])) {
            $query->whereHas('fichier', function ($fichier) use ($data) {
                $fichier->where('entite_type', $data['entite_type']);
            });
        }

        $user = $request->user();

        if ($user && !$user->hasGlobalDivisionAccess()) {
            $divisionIds = $user->accessibleDivisionIds();

            if (empty($divisionIds)) {
                return response()->json([
                    'data' => [],
                    'current_page' => 1,
                    'last_page' => 1,
                    'per_page' => $data['per_page'] ?? 15,
                    'total' => 0,
                ]);
            }

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

        $results = $query->orderByDesc('id')->paginate($data['per_page'] ?? 15);

        $results->getCollection()->transform(function (TraitementOcr $ocr) use ($search) {
            $fichier = $ocr->fichier;
            $entite = $fichier?->entite;
            $type = $fichier?->entite_type;

            $reference = $entite->reference ?? null;
            $titre = $type === 'archive'
                ? ($entite->titre ?? null)
                : ($entite->numero_titre ?? $entite->reference ?? null);

            return [
                'id' => $ocr->id,
                'fichier_id' => $fichier?->id,
                'entite_type' => $type,
                'entite_id' => $fichier?->entite_id,
                'reference' => $reference,
                'titre' => $titre,
                'statut' => $ocr->statut,
                'moteur' => $ocr->moteur,
                'date_fin' => $ocr->date_fin,
                'nom_original' => $fichier?->nom_original,
                'extension' => $fichier?->extension,
                'taille_octets' => $fichier?->taille_octets,
                'extrait' => $this->excerpt($ocr->texte_extrait, $search),
                'longueur_texte' => mb_strlen((string) $ocr->texte_extrait),
                'entite' => $entite ? [
                    'id' => $entite->id,
                    'reference' => $entite->reference ?? null,
                    'titre' => $type === 'archive' ? ($entite->titre ?? null) : null,
                    'statut' => $entite->statut ?? null,
                    'date_enregistrement' => $entite->date_enregistrement ?? null,
                ] : null,
            ];
        });

        return response()->json($results);
    }

    private function excerpt(?string $text, string $search): string
    {
        $clean = preg_replace('/\s+/', ' ', strip_tags((string) $text));
        $clean = trim((string) $clean);

        if ($clean === '') {
            return '';
        }

        if ($search !== '') {
            $position = mb_stripos($clean, $search);

            if ($position !== false) {
                $start = max(0, $position - 110);
                $length = mb_strlen($search) + 240;
                $snippet = mb_substr($clean, $start, $length);

                return ($start > 0 ? '… ' : '') . $snippet
                    . (($start + $length) < mb_strlen($clean) ? ' …' : '');
            }
        }

        return mb_substr($clean, 0, 260) . (mb_strlen($clean) > 260 ? ' …' : '');
    }
}
