<?php

namespace App\Http\Controllers;

use App\Helpers\LogHelper;
use App\Jobs\ProcessDocumentOcr;
use App\Jobs\ProcessNoteOcr;
use App\Models\Archive;
use App\Models\FichierDocument;
use App\Models\TitrePerception;
use App\Services\OcrService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class FichierDocumentController extends Controller
{
    public function index(Request $request)
    {
        $query = FichierDocument::with(['uploader', 'traitementsOcr']);

        if ($request->filled('entite_type')) {
            $query->where('entite_type', $request->entite_type);
        }
        if ($request->filled('entite_id')) {
            $query->where('entite_id', $request->entite_id);
        }
        if ($request->filled('search')) {
            $search = addcslashes($request->search, '%_\\');
            $query->where(function ($q) use ($search) {
                $q->where('nom_original', 'like', "%{$search}%")
                    ->orWhere('nom_stocke', 'like', "%{$search}%");
            });
        }

        $documents = $query->orderByDesc('id')->paginate($request->get('per_page', 20));

        if (!$request->user()?->hasPermission('ocr.view')) {
            $documents->getCollection()->transform(function (FichierDocument $document) {
                $document->makeHidden(['montext', 'ocr_status', 'ocr_method']);
                $document->unsetRelation('traitementsOcr');

                return $document;
            });
        }

        return response()->json($documents);
    }

    public function upload(Request $request)
    {
        $data = $request->validate([
            'entite_type' => 'required|in:archive,titre_perception',
            'entite_id' => 'required|integer',
        ]);

        $files = [];
        $flatten = function ($items) use (&$flatten, &$files) {
            foreach ((array) $items as $item) {
                if (is_array($item)) {
                    $flatten($item);
                } elseif ($item instanceof \Illuminate\Http\UploadedFile) {
                    $files[] = $item;
                }
            }
        };

        // On accepte le champ "files", "files[]" ou tout autre nom de champ.
        $flatten($request->allFiles());

        if (empty($files)) {
            throw \Illuminate\Validation\ValidationException::withMessages([
                'files' => ['Aucun fichier recu. Verifiez que le formulaire est envoye en multipart/form-data.'],
            ]);
        }

        if (count($files) > 20) {
            throw \Illuminate\Validation\ValidationException::withMessages([
                'files' => ['Vous ne pouvez pas ajouter plus de 20 fichiers a la fois.'],
            ]);
        }

        $extensions = ['pdf'];
        foreach ($files as $file) {
            $extension = strtolower($file->getClientOriginalExtension());
            if (!in_array($extension, $extensions, true)) {
                throw \Illuminate\Validation\ValidationException::withMessages([
                    'files' => ["Le fichier {$file->getClientOriginalName()} doit etre un fichier PDF."],
                ]);
            }
            if (!$file->isValid()) {
                throw \Illuminate\Validation\ValidationException::withMessages([
                    'files' => ["Le fichier {$file->getClientOriginalName()} n a pas pu etre transfere."],
                ]);
            }
            if ($file->getSize() > 204800 * 1024) {
                throw \Illuminate\Validation\ValidationException::withMessages([
                    'files' => ["Le fichier {$file->getClientOriginalName()} depasse la taille maximale de 200 Mo."],
                ]);
            }
        }

        $entite = $data['entite_type'] === 'archive'
            ? Archive::find($data['entite_id'])
            : TitrePerception::find($data['entite_id']);

        if (!$entite) {
            return response()->json(['success' => false, 'message' => 'Entite introuvable'], 404);
        }

        $documents = [];

        foreach ($files as $file) {
            $extension = strtolower($file->getClientOriginalExtension() ?: 'pdf');
            $nomStocke = Str::uuid() . '.' . $extension;
            $dossier = $data['entite_type'] === 'archive'
                ? 'document_declaration/' . (($entite->id_classeur ?? 0) + 100)
                : 'document_noteperception/' . (($entite->id_classeur ?? 0) + 100);
            $file->storeAs($dossier, $nomStocke);
            $chemin = $dossier . '/' . $nomStocke;

            $document = FichierDocument::create([
                'entite_type' => $data['entite_type'],
                'entite_id' => $entite->id,
                'nom_original' => $file->getClientOriginalName(),
                'nom_stocke' => $nomStocke,
                'extension' => $extension,
                'type_mime' => $file->getMimeType() ?: 'application/octet-stream',
                'taille_octets' => $file->getSize(),
                'chemin_stockage' => $chemin,
                'hash_sha256' => hash_file('sha256', $file->getRealPath()) ?: null,
                'id_user_upload' => optional($request->user())->id,
            ]);

            $documents[] = $document;

            LogHelper::create('fichiers_documents', $document->id, 'Upload du fichier : ' . $document->nom_original);

            $job = $data['entite_type'] === 'archive' ? ProcessDocumentOcr::class : ProcessNoteOcr::class;
            $job::dispatch($document->id, storage_path('app/' . $chemin));
        }

        return response()->json(['success' => true, 'documents' => $documents], 201);
    }

    public function show(Request $request, $id)
    {
        $document = FichierDocument::with(['entite', 'uploader', 'traitementsOcr'])->findOrFail($id);

        if (!$request->user()?->hasPermission('ocr.view')) {
            $document->makeHidden(['montext', 'ocr_status', 'ocr_method']);
            $document->unsetRelation('traitementsOcr');
        }

        return response()->json([
            'success' => true,
            'data' => $document,
        ]);
    }

    public function download($id)
    {
        $document = FichierDocument::findOrFail($id);

        if (!Storage::exists($document->chemin_stockage)) {
            return response()->json(['success' => false, 'message' => 'Fichier introuvable'], 404);
        }

        return response()->download(
            storage_path('app/' . $document->chemin_stockage),
            $document->nom_original,
            ['Content-Type' => $document->type_mime]
        );
    }

    public function updateText(Request $request, $id)
    {
        $data = $request->validate([
            'montext' => 'nullable|string|max:500000',
            'texte' => 'nullable|string|max:500000',
        ]);

        $document = FichierDocument::findOrFail($id);
        $texte = $data['montext'] ?? $data['texte'] ?? '';

        $ocr = $document->traitementsOcr()->latest('id')->first()
            ?: new \App\Models\TraitementOcr(['id_fichier' => $document->id]);

        $ocr->texte_extrait = $texte;
        $ocr->statut = 'termine';
        $ocr->date_fin = now();
        $ocr->save();

        $document->touch();

        LogHelper::update('fichiers_documents', $document->id, 'Correction du texte OCR : ' . $document->nom_original);

        return response()->json([
            'success' => true,
            'message' => 'Texte OCR mis a jour',
            'data' => $document->fresh(['traitementsOcr']),
        ]);
    }

    public function runOcr($id)
    {
        $document = FichierDocument::findOrFail($id);
        $path = storage_path('app/' . $document->chemin_stockage);

        if (!file_exists($path)) {
            return response()->json(['success' => false, 'message' => 'Fichier physique introuvable'], 404);
        }

        set_time_limit(300);

        $ocr = $document->traitementsOcr()->latest('id')->first()
            ?: new \App\Models\TraitementOcr(['id_fichier' => $document->id]);

        $ocr->statut = 'en_cours';
        $ocr->date_debut = now();
        $ocr->tentatives = (int) $ocr->tentatives + 1;
        $ocr->message_erreur = null;
        $ocr->save();

        try {
            $result = (new OcrService())->extractText($path);

            if (!empty($result['success'])) {
                $ocr->statut = 'termine';
                $ocr->moteur = $result['method'] ?? null;
                $ocr->texte_extrait = strip_tags((string) ($result['text'] ?? ''));
                $ocr->message_erreur = null;
                $ocr->date_fin = now();
                $ocr->save();

                LogHelper::log('OCR', 'fichiers_documents', $document->id, 'OCR termine : ' . $document->nom_original);

                return response()->json([
                    'success' => true,
                    'message' => 'OCR termine',
                    'data' => $document->fresh(['traitementsOcr', 'entite']),
                ]);
            }

            $ocr->statut = 'erreur';
            $ocr->message_erreur = $result['message'] ?? 'OCR echoue';
            $ocr->date_fin = now();
            $ocr->save();

            return response()->json([
                'success' => false,
                'message' => $result['message'] ?? 'OCR echoue',
                'data' => $document->fresh(['traitementsOcr', 'entite']),
            ], 422);
        } catch (\Throwable $e) {
            $ocr->statut = 'erreur';
            $ocr->message_erreur = $e->getMessage();
            $ocr->date_fin = now();
            $ocr->save();

            Log::error('OCR synchrone error', ['document' => $document->id, 'error' => $e->getMessage()]);

            return response()->json([
                'success' => false,
                'message' => 'OCR indisponible : ' . $e->getMessage(),
                'data' => $document->fresh(['traitementsOcr', 'entite']),
            ], 500);
        }
    }

    public function destroy($id)
    {
        $document = FichierDocument::findOrFail($id);

        if (Storage::exists($document->chemin_stockage)) {
            Storage::delete($document->chemin_stockage);
        }

        LogHelper::delete('fichiers_documents', $document->id, 'Suppression du fichier : ' . $document->nom_original);

        $document->delete();

        return response()->json(['success' => true, 'message' => 'Fichier supprime']);
    }
}
