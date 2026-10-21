<?php

namespace App\Http\Controllers;

use App\Jobs\ProcessNoteOcr;
use App\Models\FichierDocument;
use App\Models\TitrePerception;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class DocumentNotePerceptionController extends Controller
{
    private function titreFiles()
    {
        return FichierDocument::where('entite_type', 'titre_perception');
    }

    public function getallpdf($id_titre)
    {
        return $this->titreFiles()
            ->where('entite_id', $id_titre)
            ->orderByDesc('id')
            ->get();
    }

    public function uploadMultiple(Request $request)
    {
        $request->validate([
            'files' => 'required|array',
            'files.*' => 'file|mimes:pdf|max:51200',
            'id_note_perception' => 'required|integer|exists:titres_perception,id',
            'id_classeur' => 'required|integer|exists:classeurs,id',
            'id_ministere' => 'nullable|integer|exists:articles_budgetaires,id',
        ]);

        $documents = [];

        foreach ($request->file('files') as $file) {
            $document = $this->storeTitreFile(
                $file,
                (int) $request->id_note_perception,
                (int) $request->id_classeur,
                optional($request->user())->id
            );

            $documents[] = $document;
            ProcessNoteOcr::dispatch($document->id, storage_path('app/' . $document->chemin_stockage));
        }

        return response()->json([
            'success' => true,
            'message' => count($documents) . ' fichier(s) uploade(s) avec OCR',
            'documents' => $documents,
        ], 201);
    }

    public function uploadRaw(Request $request)
    {
        $idNote = $request->query('id_note_perception');
        $idClasseur = $request->query('id_classeur');
        $nomNative = $request->query('nom_fichier', 'scan.pdf');

        if (!$idNote || !$idClasseur) {
            return response()->json(['success' => false, 'message' => 'Parametres manquants'], 422);
        }
        if (!TitrePerception::find($idNote)) {
            return response()->json(['success' => false, 'message' => 'Titre introuvable'], 422);
        }

        $content = $request->getContent();
        if (!$content) {
            return response()->json(['success' => false, 'message' => 'Fichier vide'], 422);
        }

        $nomStocke = Str::uuid() . '.pdf';
        $dossier = 'document_noteperception/' . ((int) $idClasseur + 100);
        $chemin = $dossier . '/' . $nomStocke;
        Storage::put($chemin, $content);

        $document = FichierDocument::create([
            'entite_type' => 'titre_perception',
            'entite_id' => $idNote,
            'nom_original' => $nomNative,
            'nom_stocke' => $nomStocke,
            'extension' => 'pdf',
            'type_mime' => 'application/pdf',
            'taille_octets' => strlen($content),
            'chemin_stockage' => $chemin,
            'hash_sha256' => hash('sha256', $content),
            'id_user_upload' => optional($request->user())->id,
        ]);

        ProcessNoteOcr::dispatch($document->id, storage_path('app/' . $chemin));

        return response()->json(['success' => true, 'documents' => [$document]], 201);
    }

    public function download($id)
    {
        $document = $this->titreFiles()->findOrFail($id);

        if (!Storage::exists($document->chemin_stockage)) {
            return response()->json(['error' => 'Fichier introuvable'], 404);
        }

        return response(Storage::get($document->chemin_stockage), 200, [
            'Content-Type' => $document->type_mime ?: 'application/pdf',
            'Content-Disposition' => 'inline; filename="' . addslashes($document->nom_original) . '"',
            'Access-Control-Allow-Origin' => '*',
        ]);
    }

    public function updateOCRText(Request $request, $id)
    {
        $document = $this->titreFiles()->find($id);

        if (!$document) {
            return response()->json(['error' => 'Document non trouve'], 404);
        }

        $document->montext = $request->input('montext');
        $document->ocr_status = 'termine';
        $document->save();

        return response()->json(['success' => true, 'message' => 'Texte OCR enregistre']);
    }

    public function deleteDocument($id)
    {
        $document = $this->titreFiles()->find($id);

        if (!$document) {
            return response()->json(['message' => 'Document non trouve'], 404);
        }

        if ($document->chemin_stockage && Storage::exists($document->chemin_stockage)) {
            Storage::delete($document->chemin_stockage);
        }

        $document->delete();

        return response()->json(['message' => 'Document supprime avec succes']);
    }

    private function storeTitreFile($file, int $titreId, int $classeurId, ?int $userId): FichierDocument
    {
        $extension = strtolower($file->getClientOriginalExtension() ?: 'pdf');
        $nomStocke = Str::uuid() . '.' . $extension;
        $dossier = 'document_noteperception/' . ($classeurId + 100);
        $file->storeAs($dossier, $nomStocke);
        $chemin = $dossier . '/' . $nomStocke;

        return FichierDocument::create([
            'entite_type' => 'titre_perception',
            'entite_id' => $titreId,
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
}
