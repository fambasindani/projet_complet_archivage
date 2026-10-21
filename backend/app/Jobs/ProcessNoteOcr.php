<?php

namespace App\Jobs;

use App\Models\FichierDocument;
use App\Models\TraitementOcr;
use App\Services\OcrService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class ProcessNoteOcr implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 1;
    public int $timeout = 300;

    protected int $documentId;
    protected string $filePath;

    public function __construct(int $documentId, string $filePath)
    {
        $this->documentId = $documentId;
        $this->filePath = $filePath;
    }

    public function handle(): void
    {
        $document = FichierDocument::find($this->documentId);

        if (!$document) {
            return;
        }

        $ocr = TraitementOcr::firstOrCreate(
            ['id_fichier' => $document->id],
            ['statut' => 'en_attente']
        );
        $ocr->update(['statut' => 'en_cours', 'date_debut' => now(), 'tentatives' => $ocr->tentatives + 1]);

        try {
            $result = (new OcrService())->extractText($this->filePath);

            if (!empty($result['success'])) {
                $ocr->update([
                    'statut' => 'termine',
                    'moteur' => $result['method'] ?? null,
                    'texte_extrait' => strip_tags($result['text']),
                    'message_erreur' => null,
                    'date_fin' => now(),
                ]);
            } else {
                $ocr->update([
                    'statut' => 'erreur',
                    'message_erreur' => $result['message'] ?? 'OCR echoue',
                    'date_fin' => now(),
                ]);
            }
        } catch (\Throwable $e) {
            $ocr->update([
                'statut' => 'erreur',
                'message_erreur' => $e->getMessage(),
                'date_fin' => now(),
            ]);

            Log::error('ProcessNoteOcr error', ['error' => $e->getMessage()]);
        }
    }
}
