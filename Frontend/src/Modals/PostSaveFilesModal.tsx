// @ts-nocheck
import { useEffect, useState } from 'react';
import {
  FaCheck,
  FaCheckCircle,
  FaClock,
  FaCloudUploadAlt,
  FaFileAlt,
  FaFilePdf,
  FaMagic,
  FaPrint,
  FaSpinner,
  FaTimes,
} from 'react-icons/fa';
import fichierService from '../services/fichier.service';
import scannerService from '../Composant/ScannerService';
import { API_BASE_URL } from '../config';
import { toast } from '../Composant/Toast';

const formatSize = (bytes = 0) => {
  if (!bytes) return '0 o';
  const units = ['o', 'Ko', 'Mo'];
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  return `${(bytes / 1024 ** index).toFixed(index ? 1 : 0)} ${units[index]}`;
};

const statusLabel = {
  termine: 'OCR terminé',
  en_cours: 'OCR en cours',
  en_attente: 'OCR en attente',
  erreur: 'OCR en erreur',
};

const statusTone = {
  termine: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  en_cours: 'border-blue-200 bg-blue-50 text-blue-700',
  en_attente: 'border-amber-200 bg-amber-50 text-amber-700',
  erreur: 'border-rose-200 bg-rose-50 text-rose-700',
};

const fileIcon = () => <FaFilePdf size={14} />;

const PostSaveFilesModal = ({
  isOpen,
  entiteType,
  entiteId,
  reference,
  idClasseur,
  onClose,
  onFinish,
}) => {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [ocrLoadingId, setOcrLoadingId] = useState(null);

  const loadFiles = async () => {
    if (!isOpen || !entiteId) return;
    setLoading(true);
    try {
      const response = await fichierService.list({
        entite_type: entiteType,
        entite_id: entiteId,
        per_page: 100,
      });
      setFiles(response?.data || []);
    } catch {
      // silencieux
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFiles();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, entiteId, entiteType]);

  if (!isOpen) return null;

  const uploadFiles = async (pickedFiles) => {
    const list = Array.from(pickedFiles || []);
    if (!list.length) return;

    const allowed = ['pdf'];
    const oversized = list.filter((file) => file.size > 200 * 1024 * 1024);
    const invalid = list.filter((file) => !allowed.includes((file.name.split('.').pop() || '').toLowerCase()));

    if (oversized.length) {
      toast.error(`Fichier trop volumineux (200 Mo max) : ${oversized.map((f) => f.name).join(', ')}`);
      return;
    }
    if (invalid.length) {
      toast.error(`Seuls les fichiers PDF sont acceptés : ${invalid.map((f) => f.name).join(', ')}`);
      return;
    }

    setUploading(true);
    try {
      await fichierService.upload(entiteType, entiteId, list);
      toast.success(`${list.length} document(s) ajouté(s)`);
      await loadFiles();
    } catch (error) {
      const validation = error.response?.data?.errors;
      const firstError = validation ? Object.values(validation)[0]?.[0] : null;
      toast.error(firstError || error.response?.data?.message || "Erreur lors de l'import");
    } finally {
      setUploading(false);
    }
  };

  const startScan = async () => {
    setScanning(true);
    try {
      const connection = await scannerService.testConnectionWithInstructions();
      if (!connection.connected) {
        toast.error(connection.message || 'Scanner non connecté');
        return;
      }

      const result = await scannerService.scanAndUpload({
        apiUrl: API_BASE_URL,
        token: localStorage.getItem('token'),
        idDeclaration: entiteId,
        idClasseur: idClasseur || 0,
        nom_fichier: reference || `scan-${entiteId}`,
        uploadType: entiteType === 'titre_perception' ? 'note' : 'document',
        entiteType,
        idMinistere: 0,
      });

      if (result?.success === false) {
        toast.error(result?.message || 'Scan échoué');
        return;
      }

      toast.success('Scan terminé, récupération du document...');
      setTimeout(loadFiles, 1200);
      setTimeout(loadFiles, 3000);
    } catch (error) {
      toast.error(error.message || 'Erreur pendant le scan');
    } finally {
      setScanning(false);
    }
  };

  const runOcr = async (file) => {
    setOcrLoadingId(file.id);
    try {
      const response = await fichierService.runOcr(file.id);
      if (response?.success === false) {
        toast.error(response.message || 'OCR échoué');
      } else {
        toast.success('OCR terminé');
      }
      await loadFiles();
    } catch (error) {
      toast.error(error.response?.data?.message || "Impossible de lancer l'OCR");
      await loadFiles();
    } finally {
      setOcrLoadingId(null);
    }
  };

  const finish = () => {
    if (onFinish) onFinish();
    else onClose?.();
  };

  const ocrOf = (file) => file.traitements_ocr?.[0] || null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-navy-950/65 backdrop-blur-sm" />

      <div className="relative flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl ring-1 ring-slate-200">
        <header className="shrink-0 border-b border-slate-200 bg-[#fcfbf7]">
          <div className="flex h-1">
            <span className="w-24 bg-navy-900" />
            <span className="w-10 bg-gold-400" />
            <span className="flex-1 bg-slate-200" />
          </div>
          <div className="flex items-center justify-between gap-4 px-6 py-4">
            <div className="flex min-w-0 items-center gap-4">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-navy-900 text-white shadow-sm">
                <FaFilePdf size={15} />
              </span>
              <div className="min-w-0">
                <p className="font-mono text-[9px] font-bold uppercase tracking-[0.22em] text-gold-600">
                  DGRAD · Pièces justificatives
                </p>
                <h3 className="mt-0.5 font-serif text-xl font-semibold text-navy-900">
                  Dossier enregistré
                </h3>
                <p className="mt-0.5 text-[10px] font-medium text-slate-400">
                  {reference || `Dossier #${entiteId}`}
                </p>
              </div>
            </div>
            <button onClick={finish} className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-400 transition hover:bg-slate-50 hover:text-slate-700">
              <FaTimes size={13} />
            </button>
          </div>

          <div className="flex items-center gap-2 border-t border-slate-100 px-6 py-2.5">
            {[
              { label: 'Enregistré', done: true },
              { label: 'Pièces jointes', done: files.length > 0 },
              { label: 'OCR', done: files.some((file) => ocrOf(file)?.statut === 'termine') },
            ].map((step, index) => (
              <div key={step.label} className="flex items-center gap-2">
                <span className={`flex h-5 w-5 items-center justify-center rounded-full text-[8px] font-extrabold ${step.done ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-400'}`}>
                  {step.done ? <FaCheck size={7} /> : index + 1}
                </span>
                <span className={`text-[9.5px] font-bold uppercase tracking-wider ${step.done ? 'text-emerald-700' : 'text-slate-400'}`}>
                  {step.label}
                </span>
                {index < 2 && <span className="mx-1 h-px w-5 bg-slate-200" />}
              </div>
            ))}
          </div>
        </header>

        <div className="flex-1 overflow-y-auto px-6 py-5">
          <p className="text-xs leading-5 text-slate-500">
            Le dossier est enregistré. Joignez maintenant le PDF original ou scannez le document
            papier. Vous pourrez lancer l’OCR directement depuis la liste ci-dessous.
          </p>

          <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label
              className={`flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed px-5 py-6 text-center transition ${
                dragging ? 'border-navy-700 bg-navy-50' : 'border-slate-300 bg-slate-50/60 hover:border-navy-300 hover:bg-white'
              }`}
              onDragEnter={(event) => { event.preventDefault(); setDragging(true); }}
              onDragOver={(event) => event.preventDefault()}
              onDragLeave={() => setDragging(false)}
              onDrop={(event) => {
                event.preventDefault();
                setDragging(false);
                uploadFiles(event.dataTransfer.files);
              }}
            >
              {uploading ? (
                <FaSpinner className="animate-spin text-navy-700" size={22} />
              ) : (
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-navy-50 text-navy-700 ring-1 ring-navy-100">
                  <FaCloudUploadAlt size={18} />
                </span>
              )}
              <p className="mt-2.5 text-sm font-bold text-slate-800">
                {uploading ? 'Envoi en cours...' : 'Importer un PDF'}
              </p>
              <p className="mt-1 text-[10px] text-slate-400">PDF uniquement · 200 Mo max</p>
              <input
                type="file"
                multiple
                accept=".pdf"
                className="hidden"
                disabled={uploading}
                onChange={(event) => {
                  uploadFiles(event.target.files);
                  event.target.value = '';
                }}
              />
            </label>

            <button
              type="button"
              onClick={startScan}
              disabled={scanning}
              className="flex flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white px-5 py-6 text-center transition hover:border-navy-300 hover:bg-navy-50/40 disabled:opacity-60"
            >
              {scanning ? (
                <FaSpinner className="animate-spin text-gold-600" size={22} />
              ) : (
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gold-100 text-gold-700 ring-1 ring-gold-200">
                  <FaPrint size={18} />
                </span>
              )}
              <p className="mt-2.5 text-sm font-bold text-slate-800">
                {scanning ? 'Scan en cours...' : 'Scanner un document'}
              </p>
              <p className="mt-1 text-[10px] text-slate-400">Utilise le scanner de la station</p>
            </button>
          </div>

          <div className="mt-6">
            <div className="flex items-center justify-between">
              <h4 className="text-[9px] font-extrabold uppercase tracking-[0.18em] text-slate-400">
                Documents attachés
              </h4>
              <span className="font-mono text-[10px] font-bold text-slate-500">{files.length}</span>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-10 text-slate-400">
                <FaSpinner className="animate-spin" size={16} />
              </div>
            ) : files.length === 0 ? (
              <div className="mt-3 rounded-2xl border border-slate-100 bg-slate-50 px-4 py-10 text-center">
                <FaFileAlt className="mx-auto text-2xl text-slate-200" />
                <p className="mt-2 text-xs font-semibold text-slate-500">Aucun document attaché</p>
                <p className="mt-1 text-[10px] text-slate-400">Importez ou scannez une pièce pour continuer.</p>
              </div>
            ) : (
              <div className="mt-3 space-y-2">
                {files.map((file) => {
                  const ocr = ocrOf(file);
                  return (
                    <div key={file.id} className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 sm:flex-row sm:items-center">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-rose-50 text-rose-600">
                        {fileIcon(file)}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-bold text-slate-800">{file.nom_original}</p>
                        <p className="mt-0.5 flex flex-wrap items-center gap-2 text-[10px] text-slate-400">
                          <span>{formatSize(file.taille_octets)}</span>
                          <span>·</span>
                          <span className={`inline-flex rounded-md border px-1.5 py-0.5 text-[8.5px] font-extrabold uppercase tracking-wider ${statusTone[ocr?.statut] || 'border-slate-200 bg-slate-50 text-slate-500'}`}>
                            {statusLabel[ocr?.statut] || 'OCR en attente'}
                          </span>
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        {ocr?.statut === 'termine' ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600">
                            <FaCheckCircle size={10} /> Texte prêt
                          </span>
                        ) : (
                          <button
                            onClick={() => runOcr(file)}
                            disabled={ocrLoadingId === file.id}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-[10px] font-bold text-navy-700 transition hover:bg-navy-50 disabled:opacity-60"
                          >
                            {ocrLoadingId === file.id ? (
                              <><FaSpinner className="animate-spin" size={9} /> OCR...</>
                            ) : (
                              <><FaMagic size={9} /> Lancer OCR</>
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <footer className="flex shrink-0 items-center justify-between border-t border-slate-200 bg-slate-50 px-6 py-3">
          <p className="flex items-center gap-1.5 text-[10px] text-slate-400">
            <FaClock size={9} /> Vous pourrez compléter les pièces plus tard depuis le dossier.
          </p>
          <button
            type="button"
            onClick={finish}
            className="inline-flex items-center gap-2 rounded-xl bg-navy-900 px-5 py-2.5 text-[11px] font-bold text-white transition hover:bg-navy-800"
          >
            <FaCheckCircle size={10} /> Terminer
          </button>
        </footer>
      </div>
    </div>
  );
};

export default PostSaveFilesModal;
