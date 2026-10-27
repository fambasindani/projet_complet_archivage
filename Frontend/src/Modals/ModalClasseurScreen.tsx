// @ts-nocheck
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../config';
import GetTokenOrRedirect from '../Composant/getTokenOrRedirect';
import ModalHeader from '../Composant/ModalHeader';
import { FaEdit, FaFolder, FaPlus, FaSpinner, FaTimes } from 'react-icons/fa';
import { toast } from '../Composant/Toast';

const EMPTY = { nom_classeur: '', code: '', description: '', statut: '1' };

const ModalClasseurScreen = ({ isOpen, onClose, classeurToEdit = null, onSuccess }) => {
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const token = GetTokenOrRedirect();
  const isEditing = !!classeurToEdit;

  useEffect(() => {
    if (classeurToEdit) {
      setForm({
        nom_classeur: classeurToEdit.nom_classeur || '',
        code: classeurToEdit.code || '',
        description: classeurToEdit.description || '',
        statut: classeurToEdit.statut === false || classeurToEdit.statut === 0 ? '0' : '1',
      });
    } else {
      setForm(EMPTY);
    }
    setErrors({});
  }, [classeurToEdit, isOpen]);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});
    const payload = {
      nom_classeur: form.nom_classeur.trim(),
      code: form.code.trim() || null,
      description: form.description.trim() || null,
      statut: form.statut === '1',
    };
    try {
      if (isEditing) {
        await axios.put(`${API_BASE_URL}/classeurs/${classeurToEdit.id}`, payload, { headers: { Authorization: `Bearer ${token}` } });
        toast.success('Classeur mis à jour');
      } else {
        await axios.post(`${API_BASE_URL}/classeurs`, payload, { headers: { Authorization: `Bearer ${token}` } });
        toast.success('Classeur créé');
      }
      if (onSuccess) onSuccess();
      onClose();
    } catch (error) {
      if (error.response?.status === 422) {
        setErrors(error.response.data.errors || {});
      } else if (error.response?.status === 403) {
        toast.error(error.response.data.message || 'Permission refusée');
      } else {
        toast.error(error.response?.data?.message || "Erreur lors de l'enregistrement");
      }
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-navy-950/55 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-slate-200">
        <ModalHeader
          title={isEditing ? 'Modifier le classeur' : 'Nouveau classeur'}
          subtitle="Référentiel des classeurs"
          eyebrow="DGRAD · Archivage ordinaire"
          icon={<FaFolder size={15} />}
          onClose={onClose}
          closeDisabled={loading}
        />

        <form onSubmit={submit} className="space-y-4 p-6">
          <div>
            <label className="mb-1.5 block text-xs font-bold text-slate-600">Nom du classeur <span className="text-rose-500">*</span></label>
            <input
              value={form.nom_classeur}
              onChange={(e) => setForm({ ...form, nom_classeur: e.target.value })}
              required
              disabled={loading}
              placeholder="Ex. Déclarations fiscales"
              className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:border-navy-600 focus:ring-4 focus:ring-navy-100"
            />
            {errors.nom_classeur && <p className="mt-1.5 text-xs text-rose-600">{errors.nom_classeur[0]}</p>}
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs font-bold text-slate-600">Code</label>
              <input
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value })}
                disabled={loading}
                placeholder="Ex. CL-DECL"
                className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:border-navy-600 focus:ring-4 focus:ring-navy-100"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-bold text-slate-600">Statut</label>
              <select
                value={form.statut}
                onChange={(e) => setForm({ ...form, statut: e.target.value })}
                disabled={loading}
                className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-navy-600 focus:ring-4 focus:ring-navy-100"
              >
                <option value="1">Actif</option>
                <option value="0">Inactif</option>
              </select>
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-bold text-slate-600">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={3}
              disabled={loading}
              className="w-full resize-none rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:border-navy-600 focus:ring-4 focus:ring-navy-100"
            />
          </div>

          <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
            <button type="button" onClick={onClose} disabled={loading} className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50">Annuler</button>
            <button type="submit" disabled={loading || !form.nom_classeur.trim()} className="inline-flex items-center gap-2 rounded-xl bg-navy-900 px-6 py-2.5 text-sm font-bold text-white hover:bg-navy-800 disabled:opacity-50">
              {loading ? <FaSpinner className="animate-spin" size={11} /> : isEditing ? <FaEdit size={11} /> : <FaPlus size={11} />}
              {isEditing ? 'Mettre à jour' : 'Créer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ModalClasseurScreen;
