// @ts-nocheck
import { useEffect, useMemo, useState } from 'react';
import {
  FaCheckCircle,
  FaClock,
  FaCloudUploadAlt,
  FaCopy,
  FaDownload,
  FaExclamationTriangle,
  FaFileAlt,
  FaFilePdf,
  FaMagic,
  FaPrint,
  FaSave,
  FaSpinner,
  FaTimes,
  FaTrash,
} from 'react-icons/fa';
import fichierService from '../services/fichier.service';
import scannerService from '../Composant/ScannerService';
import ModalHeader from '../Composant/ModalHeader';
import { API_BASE_URL } from '../config';
import ConfirmModal from './ConfirmModal';
import { toast } from '../Composant/Toast';

const formatSize = (bytes = 0) => {
  if (!bytes) return '0 o';
  const units = ['o', 'Ko', 'Mo', 'Go'];
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  return `${(bytes / 1024 ** index).toFixed(index ? 1 : 0)} ${units[index]}`;
};

const formatDate = (value) => {
  if (!value) return '—';
  try {
    return new Date(value).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '—';
  }
};

const statusTone = {
  termine: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  en_cours: 'border-blue-200 bg-blue-50 text-blue-700',
  en_attente: 'border-amber-200 bg-amber-50 text-amber-700',
  erreur: 'border-rose-200 bg-rose-50 text-rose-700',
};

const statusLabel = {
  termine: 'OCR terminé',
  en_cours: 'OCR en cours',
  en_attente: 'OCR en attente',
  erreur: 'OCR en erreur',
};

const fileIcon = () => <FaFilePdf size={15} />;

const FichiersDocumentsModal = ({ isOpen, onClose, entiteType, entiteId, onChanged }) => {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [selected, setSelected] = useState(null);
  const [texte, setTexte] = useState('');
  const [savingText, setSavingText] = useState(false);
  const [confirmFile, setConfirmFile] = useState(null);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [ocrLoadingId, setOcrLoadingId] = useState(null);
  const [scanning, setScanning] = useState(false);

  const load = async () => {
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
      toast.error('Impossible de charger les fichiers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, entiteType, entiteId]);

  useEffect(() => {
    if (!selected) {
      setTexte('');
      return;
    }
    const ocr = selected.traitements_ocr?.[0];
    setTexte(selected.montext || ocr?.texte_extrait || '');
  }, [selected]);

  const counts = useMemo(() => {
    const done = files.filter((file) => file.traitements_ocr?.[0]?.statut === 'termine').length;
    const pending = files.filter((file) => !file.traitements_ocr?.[0] || file.traitements_ocr?.[0]?.statut !== 'termine').length;
    return { done, pending };
  }, [files]);

  const words = useMemo(
    () => texte.trim().split(/\s+/).filter(Boolean).length,
    [texte]
  );

  if (!isOpen) return null;

  const upload = async (pickedFiles) => {
    const picked = Array.from(pickedFiles || []);
    if (!picked.length) return;

    const allowed = ['pdf'];
    const oversized = picked.filter((file) => file.size > 200 * 1024 * 1024);
    const invalid = picked.filter((file) => !allowed.includes((file.name.split('.').pop() || '').toLowerCase()));

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
      await fichierService.upload(entiteType, entiteId, picked);
      toast.success(`${picked.length} fichier(s) ajoute(s)`);
      await load();
      onChanged?.();
    } catch (error) {
      const validation = error.response?.data?.errors;
      const firstError = validation ? Object.values(validation)[0]?.[0] : null;
      toast.error(firstError || error.response?.data?.message || "Erreur lors de l'upload");
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
        idClasseur: 0,
        nom_fichier: `${entiteType === 'archive' ? 'archive' : 'titre'}-${entiteId}`,
        uploadType: entiteType === 'titre_perception' ? 'note' : 'document',
        entiteType,
        idMinistere: 0,
      });

      if (result?.success === false) {
        toast.error(result?.message || 'Scan échoué');
        return;
      }

      toast.success('Scan terminé, récupération du document...');
      setTimeout(load, 1200);
      setTimeout(load, 3000);
      onChanged?.();
    } catch (error) {
      toast.error(error.message || 'Erreur pendant le scan');
    } finally {
      setScanning(false);
    }
  };

  const download = async (file) => {
    try {
      const blob = await fichierService.download(file.id);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.nom_original;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error('Telechargement impossible');
    }
  };

  const runOcr = async (file) => {
    setOcrLoadingId(file.id);
    try {
      const response = await fichierService.runOcr(file.id);
      if (response?.data) {
        setSelected(response.data);
      }
      if (response?.success === false) {
        toast.error(response.message || 'OCR echoue');
      } else {
        toast.success('OCR termine');
      }
      await load();
    } catch (error) {
      const payload = error.response?.data;
      if (payload?.data) setSelected(payload.data);
      toast.error(payload?.message || "Impossible de lancer l'OCR");
      await load();
    } finally {
      setOcrLoadingId(null);
    }
  };

  const saveText = async () => {
    if (!selected) return;
    setSavingText(true);
    try {
      await fichierService.updateText(selected.id, texte);
      toast.success('Texte OCR enregistre');
      await load();
    } catch {
      toast.error("Impossible d'enregistrer le texte");
    } finally {
      setSavingText(false);
    }
  };

  const copyText = async () => {
    try {
      await navigator.clipboard.writeText(texte || '');
      toast.success('Texte copié');
    } catch {
      toast.error('Copie impossible');
    }
  };

  const remove = async () => {
    if (!confirmFile) return;
    setConfirmLoading(true);
    try {
      await fichierService.remove(confirmFile.id);
      toast.success('Fichier supprime');
      if (selected?.id === confirmFile.id) setSelected(null);
      setConfirmFile(null);
      await load();
      onChanged?.();
    } catch {
      toast.error('Suppression impossible');
    } finally {
      setConfirmLoading(false);
    }
  };

  const ocrOf = (file) => file.traitements_ocr?.[0] || null;
  const selectedOcr = selected ? ocrOf(selected) : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-navy-950/65 backdrop-blur-sm" onClick={onClose} />

      <div className="relative flex max-h-[94vh] w-full max-w-6xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl ring-1 ring-slate-200">
        <ModalHeader
          title="Fichiers & OCR"
          subtitle={`${entiteType === 'archive' ? 'Archive' : 'Titre de perception'} #${entiteId} · ${files.length} document(s)`}
          eyebrow="DGRAD · Pièces justificatives"
          icon={<FaFileAlt size={15} />}
          onClose={onClose}
          right={
            <div className="hidden items-center gap-2 md:flex">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-[10px] font-bold text-emerald-700">
                <FaCheckCircle size={9} /> {counts.done} traité(s)
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 text-[10px] font-bold text-amber-700">
                <FaClock size={9} /> {counts.pending} en attente
              </span>
            </div>
          }
        />

        <div className="grid min-h-0 flex-1 grid-cols-1 overflow-hidden lg:grid-cols-[390px_minmax(0,1fr)]">
          <aside className="flex min-h-0 flex-col border-b border-slate-200 bg-slate-50/50 lg:border-b-0 lg:border-r">
            <div className="p-4">
              <label
                className={`flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed px-4 py-5 text-center transition ${
                  dragging
                    ? 'border-navy-700 bg-navy-50'
                    : 'border-slate-300 bg-white hover:border-navy-300 hover:bg-navy-50/30'
                }`}
                onDragEnter={(event) => { event.preventDefault(); setDragging(true); }}
                onDragOver={(event) => event.preventDefault()}
                onDragLeave={() => setDragging(false)}
                onDrop={(event) => {
                  event.preventDefault();
                  setDragging(false);
                  upload(event.dataTransfer.files);
                }}
              >
                {uploading ? (
                  <FaSpinner className="animate-spin text-navy-700" size={22} />
                ) : (
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-navy-50 text-navy-700 ring-1 ring-navy-100">
                    <FaCloudUploadAlt size={18} />
                  </span>
                )}
                <p className="mt-2.5 text-xs font-bold text-slate-800">
                  {uploading ? 'Envoi en cours...' : 'Déposer un PDF'}
                </p>
                <p className="mt-1 text-[10px] text-slate-400">PDF uniquement · 200 Mo max</p>
                <input
                  type="file"
                  multiple
                  accept=".pdf"
                  className="hidden"
                  onChange={(event) => {
                    upload(event.target.files);
                    event.target.value = '';
                  }}
                  disabled={uploading}
                />
              </label>

              <button
                type="button"
                onClick={startScan}
                disabled={scanning || uploading}
                className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-[11px] font-bold text-slate-700 transition hover:border-navy-300 hover:bg-navy-50/40 disabled:opacity-60"
              >
                {scanning ? (
                  <><FaSpinner className="animate-spin text-gold-600" size={11} /> Scan en cours...</>
                ) : (
                  <><FaPrint size={11} className="text-gold-600" /> Scanner un document</>
                )}
              </button>
            </div>

            <div className="flex items-center justify-between px-4 pb-2">
              <p className="text-[9px] font-extrabold uppercase tracking-[0.18em] text-slate-400">
                Documents
              </p>
              <span className="font-mono text-[10px] font-bold text-slate-500">{files.length}</span>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-3 pb-4">
              {loading ? (
                <div className="flex items-center justify-center py-16 text-slate-400">
                  <FaSpinner className="animate-spin" />
                </div>
              ) : files.length === 0 ? (
                <div className="px-4 py-12 text-center">
                  <FaFileAlt className="mx-auto text-2xl text-slate-200" />
                  <p className="mt-3 text-xs font-semibold text-slate-500">Aucun document</p>
                  <p className="mt-1 text-[10px] text-slate-400">Ajoutez un fichier pour commencer.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {files.map((file) => {
                    const ocr = ocrOf(file);
                    const active = selected?.id === file.id;
                    return (
                      <button
                        key={file.id}
                        type="button"
                        onClick={() => setSelected(file)}
                        className={`group flex w-full items-start gap-3 rounded-xl border px-3 py-3 text-left transition ${
                          active
                            ? 'border-navy-200 bg-white shadow-sm ring-1 ring-navy-100'
                            : 'border-transparent bg-white/70 hover:border-slate-200 hover:bg-white'
                        }`}
                      >
                        <span
                          className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
                            active ? 'bg-navy-900 text-white' : 'bg-slate-100 text-slate-500'
                          }`}
                        >
                          {fileIcon(file)}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-[12px] font-bold text-slate-800">
                            {file.nom_original}
                          </span>
                          <span className="mt-0.5 block text-[10px] text-slate-400">
                            {formatSize(file.taille_octets)} · .{file.extension}
                          </span>
                          <span
                            className={`mt-1.5 inline-flex rounded-md border px-1.5 py-0.5 text-[8.5px] font-extrabold uppercase tracking-wider ${
                              statusTone[ocr?.statut] || 'border-slate-200 bg-slate-50 text-slate-500'
                            }`}
                          >
                            {statusLabel[ocr?.statut] || 'Sans OCR'}
                          </span>
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </aside>

          <section className="flex min-h-0 flex-col">
            {!selected ? (
              <div className="flex flex-1 flex-col items-center justify-center px-8 py-16 text-center">
                <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-50 text-slate-300 ring-1 ring-slate-200">
                  <FaFileAlt size={24} />
                </span>
                <p className="mt-4 text-sm font-bold text-slate-700">Sélectionnez un document</p>
                <p className="mt-1 max-w-sm text-xs leading-5 text-slate-400">
                  Choisissez un fichier à gauche pour consulter ou corriger son texte OCR.
                </p>
              </div>
            ) : (
              <>
                <div className="shrink-0 border-b border-slate-100 px-5 py-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex min-w-0 items-start gap-3">
                      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-rose-50 text-rose-600 ring-1 ring-rose-100">
                        {fileIcon(selected)}
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-extrabold text-slate-900">{selected.nom_original}</p>
                        <p className="mt-1 text-[10px] text-slate-400">
                          {formatSize(selected.taille_octets)} · {selected.type_mime}
                          {selected.created_at ? ` · ${formatDate(selected.created_at)}` : ''}
                        </p>
                        <span
                          className={`mt-2 inline-flex rounded-full border px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wider ${
                            statusTone[selectedOcr?.statut] || 'border-slate-200 bg-slate-50 text-slate-500'
                          }`}
                        >
                          {statusLabel[selectedOcr?.statut] || 'Sans OCR'}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5">
                      <button
                        onClick={() => download(selected)}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-[10px] font-bold text-slate-700 transition hover:bg-slate-50"
                      >
                        <FaDownload size={9} /> Télécharger
                      </button>
                      <button
                        onClick={() => setConfirmFile(selected)}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-rose-200 bg-white px-3 py-1.5 text-[10px] font-bold text-rose-600 transition hover:bg-rose-50"
                      >
                        <FaTrash size={9} /> Supprimer
                      </button>
                    </div>
                  </div>

                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <button
                      onClick={() => runOcr(selected)}
                      disabled={ocrLoadingId === selected.id}
                      className="inline-flex items-center gap-2 rounded-lg bg-navy-900 px-3.5 py-2 text-[10px] font-bold text-white transition hover:bg-navy-800 disabled:opacity-60"
                    >
                      {ocrLoadingId === selected.id ? (
                        <><FaSpinner className="animate-spin" size={9} /> OCR en cours...</>
                      ) : (
                        <><FaMagic size={9} /> Lancer OCR</>
                      )}
                    </button>
                    <button
                      onClick={copyText}
                      className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-[10px] font-bold text-slate-700 transition hover:bg-slate-50"
                    >
                      <FaCopy size={9} /> Copier
                    </button>
                    <button
                      onClick={saveText}
                      disabled={savingText}
                      className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-[10px] font-bold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
                    >
                      {savingText ? <FaSpinner className="animate-spin" size={9} /> : <FaSave size={9} />}
                      Enregistrer
                    </button>
                  </div>
                </div>

                <div className="flex min-h-0 flex-1 flex-col p-5">
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <label className="text-[9px] font-extrabold uppercase tracking-[0.18em] text-slate-400">
                      Texte extrait / corrigé
                    </label>
                    <span className="font-mono text-[9px] text-slate-400">
                      {texte.length} caractères · {words} mots
                    </span>
                  </div>

                  <textarea
                    value={texte}
                    onChange={(event) => setTexte(event.target.value)}
                    className="min-h-[260px] flex-1 resize-none rounded-xl border border-slate-200 bg-slate-50/60 p-4 font-mono text-[12px] leading-6 text-slate-700 outline-none transition focus:border-navy-600 focus:bg-white focus:ring-4 focus:ring-navy-100"
                    placeholder="Aucun texte OCR pour ce fichier. Cliquez sur « Lancer OCR » pour extraire le contenu."
                  />

                  <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-[9px] text-slate-400">
                    <span>
                      {selectedOcr?.moteur ? `Moteur : ${selectedOcr.moteur}` : 'Moteur OCR non renseigné'}
                      {selectedOcr?.date_fin ? ` · Terminé le ${formatDate(selectedOcr.date_fin)}` : ''}
                    </span>
                    {selectedOcr?.statut === 'erreur' && selectedOcr?.message_erreur && (
                      <span className="inline-flex items-center gap-1 font-semibold text-rose-600">
                        <FaExclamationTriangle size={9} /> {selectedOcr.message_erreur}
                      </span>
                    )}
                  </div>
                </div>
              </>
            )}
          </section>
        </div>

        <footer className="flex shrink-0 items-center justify-between border-t border-slate-200 bg-slate-50 px-6 py-3">
          <p className="text-[10px] text-slate-400">
            Les fichiers restent rattachés au dossier après fermeture.
          </p>
          <button
            onClick={onClose}
            className="rounded-xl bg-navy-900 px-5 py-2.5 text-[11px] font-bold text-white transition hover:bg-navy-800"
          >
            Fermer
          </button>
        </footer>
      </div>

      <ConfirmModal
        isOpen={!!confirmFile}
        onClose={() => setConfirmFile(null)}
        onConfirm={remove}
        title="Supprimer le fichier ?"
        message={
          confirmFile
            ? `Voulez-vous supprimer définitivement « ${confirmFile.nom_original} » ?`
            : ''
        }
        confirmText="Oui, supprimer"
        variant="danger"
        loading={confirmLoading}
      />
    </div>
  );
};

export default FichiersDocumentsModal;
