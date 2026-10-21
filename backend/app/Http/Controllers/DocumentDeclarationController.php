<?php

namespace App\Http\Controllers;

use App\Jobs\ProcessDocumentOcr;
use App\Models\Archive;
use App\Models\FichierDocument;
use App\Services\OcrService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class DocumentDeclarationController extends Controller
{
    private function archiveFiles()
    {
        return FichierDocument::where('entite_type', 'archive');
    }

    private function storeArchiveFile($file, int $archiveId, int $classeurId, ?int $userId): FichierDocument
    {
        $extension = strtolower($file->getClientOriginalExtension() ?: 'pdf');
        $nomStocke = Str::uuid() . '.' . $extension;
        $dossier = 'document_declaration/' . ($classeurId + 100);
        $file->storeAs($dossier, $nomStocke);
        $chemin = $dossier . '/' . $nomStocke;

        return FichierDocument::create([
            'entite_type' => 'archive',
            'entite_id' => $archiveId,
            'nom_original' => $file->getClientOriginalName(),
            'nom_stocke' => $nomStocke,
            'extension' => $extension,
            'type_mime' => $file->getMimeType() ?: 'application/pdf',
            'taille_octets' => $file->getSize(),
            'chemin_stockage' => $chemin,
            'hash_sha256' => hash_file('sha256', $file->getRealPath()) ?: null,
            'id_user_upload' => $userId,
        ]);
    }

    public function getallpdf($id_declaration)
    {
        return $this->archiveFiles()
            ->where('entite_id', $id_declaration)
            ->orderByDesc('id')
            ->get();
    }

    public function deleteDocument($id)
    {
        $document = $this->archiveFiles()->find($id);

        if (!$document) {
            return response()->json(['message' => 'Document non trouve'], 404);
        }

        $this->deletePhysicalFile($document);
        $document->delete();

        return response()->json(['message' => 'Document supprime avec succes']);
    }

    public function uploadMultiplex(Request $request)
    {
        return $this->uploadMultiple($request);
    }

    public function uploadRaw(Request $request)
    {
        $idDeclaration = $request->query('id_declaration');
        $idClasseur = $request->query('id_classeur');
        $nomNative = $request->query('nom_fichier', 'scan.pdf');

        if (!$idDeclaration || !$idClasseur) {
            return response()->json(['success' => false, 'message' => 'Parametres manquants'], 422);
        }
        if (!Archive::find($idDeclaration)) {
            return response()->json(['success' => false, 'message' => 'Declaration introuvable'], 422);
        }
        if (!\App\Models\Classeur::find($idClasseur)) {
            return response()->json(['success' => false, 'message' => 'Classeur introuvable'], 422);
        }

        $content = $request->getContent();
        if (!$content) {
            return response()->json(['success' => false, 'message' => 'Fichier vide'], 422);
        }

        $nomStocke = Str::uuid() . '.pdf';
        $dossier = 'document_declaration/' . ((int) $idClasseur + 100);
        $chemin = $dossier . '/' . $nomStocke;
        Storage::put($chemin, $content);

        $document = FichierDocument::create([
            'entite_type' => 'archive',
            'entite_id' => $idDeclaration,
            'nom_original' => $nomNative,
            'nom_stocke' => $nomStocke,
            'extension' => 'pdf',
            'type_mime' => 'application/pdf',
            'taille_octets' => strlen($content),
            'chemin_stockage' => $chemin,
            'hash_sha256' => hash('sha256', $content),
            'id_user_upload' => optional($request->user())->id,
        ]);

        ProcessDocumentOcr::dispatch($document->id, storage_path('app/' . $chemin));

        return response()->json(['success' => true, 'documents' => [$document]], 201);
    }

    public function uploadMultiple(Request $request)
    {
        $request->validate([
            'files' => 'required|array|max:10',
            'files.*' => 'file|mimes:pdf|max:51200',
            'id_declaration' => 'required|integer|exists:archives,id',
            'id_classeur' => 'required|integer|exists:classeurs,id',
        ]);

        $documents = [];

        foreach ($request->file('files') as $file) {
            $document = $this->storeArchiveFile(
                $file,
                (int) $request->id_declaration,
                (int) $request->id_classeur,
                optional($request->user())->id
            );

            $documents[] = $document;
            ProcessDocumentOcr::dispatch($document->id, storage_path('app/' . $document->chemin_stockage));
        }

        return response()->json([
            'success' => true,
            'message' => count($documents) . ' fichier(s) uploade(s) avec OCR',
            'documents' => $documents,
        ], 201);
    }

    public function download($id)
    {
        $document = $this->archiveFiles()->findOrFail($id);

        if (!Storage::exists($document->chemin_stockage)) {
            return response()->json(['error' => 'Fichier introuvable'], 404);
        }

        $content = Storage::get($document->chemin_stockage);

        return response($content, 200, [
            'Content-Type' => $document->type_mime ?: 'application/pdf',
            'Content-Disposition' => 'inline; filename="' . addslashes($document->nom_original) . '"',
            'Access-Control-Allow-Origin' => '*',
        ]);
    }

    public function updateOCRText(Request $request, $id)
    {
        $request->validate(['montext' => 'nullable|string|max:500000']);

        $document = $this->archiveFiles()->findOrFail($id);
        $document->montext = $request->montext ? strip_tags($request->montext) : null;
        $document->ocr_status = 'termine';
        $document->save();

        return response()->json([
            'success' => true,
            'message' => 'Texte OCR mis a jour avec succes',
            'data' => [
                'id' => $document->id,
                'montext_length' => strlen($document->montext ?? ''),
            ],
        ]);
    }

    public function getDocumentText($id)
    {
        $document = $this->archiveFiles()->findOrFail($id);

        return response()->json([
            'success' => true,
            'montext' => $document->montext,
            'nom' => $document->nom_original,
        ]);
    }

    public function advancedSearch(Request $request, $id_direction)
    {
        $query = $request->input('query');
        $idDeclaration = $request->input('id_declaration');
        $idClasseur = $request->input('id_classeur');
        $dateDebut = $request->input('date_debut');
        $dateFin = $request->input('date_fin');
        $directionIds = $request->input('direction_ids');
        $page = max(1, (int) $request->input('page', 1));
        $perPage = max(5, min((int) $request->input('per_page', 10), 100));
        $sortBy = $request->input('sort_by', 'created_at');
        $sortOrder = $request->input('sort_order', 'desc');

        $allDirectionIds = [(int) $id_direction];
        if ($directionIds) {
            $ids = is_string($directionIds) ? explode(',', $directionIds) : (array) $directionIds;
            $allDirectionIds = array_merge($allDirectionIds, array_map('intval', $ids));
        }
        $allDirectionIds = array_values(array_unique(array_filter($allDirectionIds)));

        $qb = FichierDocument::where('entite_type', 'archive')
            ->whereHas('entite', function ($q) use ($allDirectionIds) {
                $q->whereIn('id_division', $allDirectionIds);
            });

        if ($query) {
            $escaped = addcslashes($query, '%_\\');
            $qb->where(function ($q) use ($escaped) {
                $q->where('nom_original', 'like', "%{$escaped}%")
                    ->orWhere('nom_stocke', 'like', "%{$escaped}%")
                    ->orWhereHas('traitementsOcr', fn ($sq) => $sq->where('texte_extrait', 'like', "%{$escaped}%"));
            });
        }

        if ($idDeclaration) {
            $qb->where('entite_id', $idDeclaration);
        }
        if ($idClasseur) {
            $qb->whereHas('entite', fn ($q) => $q->where('id_classeur', $idClasseur));
        }
        if ($dateDebut) {
            $qb->whereDate('created_at', '>=', $dateDebut);
        }
        if ($dateFin) {
            $qb->whereDate('created_at', '<=', $dateFin);
        }

        if (in_array($sortBy, ['created_at', 'nom_original', 'taille_octets'], true)) {
            $qb->orderBy($sortBy, $sortOrder === 'asc' ? 'asc' : 'desc');
        } else {
            $qb->orderByDesc('created_at');
        }

        $documents = $qb->with(['entite.division', 'entite.classeur', 'traitementsOcr'])
            ->paginate($perPage, ['*'], 'page', $page);

        $documents->getCollection()->transform(function ($doc) use ($query, $id_direction) {
            $archive = $doc->entite;

            if ($archive) {
                $doc->direction_id = $archive->id_division;
                $doc->direction_nom = $archive->division->nom ?? null;
                $doc->classeur_nom = $archive->classeur->nom_classeur ?? null;
            }

            if ($query && $doc->montext) {
                $pos = stripos($doc->montext, $query);
                $doc->extrait = $pos !== false
                    ? '...' . substr($doc->montext, max(0, $pos - 60), 120) . '...'
                    : substr($doc->montext, 0, 150) . '...';
            }

            $doc->stats_texte = [
                'longueur' => strlen($doc->montext ?? ''),
                'mots' => str_word_count($doc->montext ?? ''),
                'pages_approx' => (int) ceil(strlen($doc->montext ?? '') / 3000),
            ];
            $doc->filtre_direction_utilisateur = $id_direction;
            $doc->declaration = $archive;

            return $doc;
        });

        return response()->json([
            'success' => true,
            'data' => $documents->items(),
            'pagination' => [
                'current_page' => $documents->currentPage(),
                'last_page' => $documents->lastPage(),
                'per_page' => $documents->perPage(),
                'total' => $documents->total(),
            ],
            'filters_applied' => [
                'user_direction' => $id_direction,
                'query' => $query,
                'direction_ids' => $directionIds,
            ],
            'stats' => [
                'total_documents' => $documents->total(),
                'direction_filtree' => $id_direction,
            ],
        ]);
    }

    public function getOCRStats(Request $request)
    {
        $query = $this->archiveFiles();

        if ($request->filled('id_declaration')) {
            $query->where('entite_id', $request->id_declaration);
        }

        $total = (clone $query)->count();
        $avecTexte = (clone $query)
            ->whereHas('traitementsOcr', fn ($q) => $q->whereNotNull('texte_extrait'))
            ->count();
        $sansTexte = $total - $avecTexte;

        $tailleMoyenne = (clone $query)
            ->join('traitements_ocr', 'fichiers_documents.id', '=', 'traitements_ocr.id_fichier')
            ->whereNotNull('traitements_ocr.texte_extrait')
            ->selectRaw('AVG(LENGTH(traitements_ocr.texte_extrait)) as moyenne')
            ->value('moyenne');

        return response()->json([
            'success' => true,
            'data' => [
                'total_documents' => $total,
                'documents_avec_texte' => $avecTexte,
                'documents_sans_texte' => $sansTexte,
                'pourcentage_texte' => $total > 0 ? round(($avecTexte / $total) * 100, 2) : 0,
                'taille_moyenne_texte' => round((float) $tailleMoyenne, 2) . ' caracteres',
            ],
        ]);
    }

    public function ocrDocument($id)
    {
        $document = $this->archiveFiles()->find($id);

        if (!$document) {
            return response()->json(['success' => false, 'message' => 'Document non trouve'], 404);
        }

        $filePath = storage_path('app/' . $document->chemin_stockage);

        if (!file_exists($filePath)) {
            return response()->json(['success' => false, 'message' => 'Fichier physique introuvable'], 404);
        }

        $ocrService = new OcrService();
        $result = $ocrService->extractText($filePath);

        if (!$result['success']) {
            return response()->json(['success' => false, 'message' => $result['message']], 500);
        }

        $document->montext = strip_tags($result['text']);
        $document->ocr_status = 'termine';
        $document->ocr_method = $result['method'] ?? null;
        $document->save();

        return response()->json([
            'success' => true,
            'message' => 'OCR termine avec succes',
            'data' => [
                'text_length' => strlen($document->montext),
                'method' => $result['method'] ?? null,
                'pages' => $result['pages'] ?? null,
                'processing_time' => $result['processing_time'] ?? null,
            ],
        ]);
    }

    public function ocrHealth()
    {
        $healthy = (new OcrService())->checkHealth();

        return response()->json([
            'status' => $healthy ? 'ok' : 'unavailable',
            'service' => 'ocr',
        ], $healthy ? 200 : 503);
    }

    public function destroy($id)
    {
        return $this->deleteDocument($id);
    }

    private function deletePhysicalFile(FichierDocument $document): void
    {
        if ($document->chemin_stockage && Storage::exists($document->chemin_stockage)) {
            Storage::delete($document->chemin_stockage);
        }
    }
}
