// @ts-nocheck
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../config';
import GetTokenOrRedirect from '../Composant/getTokenOrRedirect';
import ModalHeader from '../Composant/ModalHeader';
import { FaEdit, FaMapMarkerAlt, FaPlus, FaSpinner, FaTimes } from 'react-icons/fa';
import { toast } from '../Composant/Toast';

const EMPTY = {
  nom_emplacement: '',
  code: '',
  batiment: '',
  salle: '',
  etagere: '',
  description: '',
  statut: '1',
};

const ModalEmplacementScreen = ({ isOpen, onClose, emplacementToEdit = null, onSuccess }) => {
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const token = GetTokenOrRedirect();
  const isEditing = !!emplacementToEdit;

  useEffect(() => {
    if (emplacementToEdit) {
      setForm({
        nom_emplacement: emplacementToEdit.nom_emplacement || '',
        code: emplacementToEdit.code || '',
        batiment: emplacementToEdit.batiment || '',
        salle: emplacementToEdit.salle || '',
        etagere: emplacementToEdit.etagere || '',
        description: emplacementToEdit.description || '',
        statut: emplacementToEdit.statut === false || emplacementToEdit.statut === 0 ? '0' : '1',
      });
    } else {
      setForm(EMPTY);
    }
    setErrors({});
  }, [emplacementToEdit, isOpen]);

  const change = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: null }));
  };

  const submit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setErrors({});

    const payload = {
      nom_emplacement: form.nom_emplacement.trim(),
      code: form.code.trim() || null,
      batiment: form.batiment.trim() || null,
      salle: form.salle.trim() || null,
      etagere: form.etagere.trim() || null,
      description: form.description.trim() || null,
      statut: form.statut === '1',
    };

    try {
      if (isEditing) {
        await axios.put(`${API_BASE_URL}/emplacements/${emplacementToEdit.id}`, payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
        toast.success('Emplacement mis à jour');
      } else {
        await axios.post(`${API_BASE_URL}/emplacements`, payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
        toast.success('Emplacement créé');
      }
      if (onSuccess) onSuccess();
      onClose();
    } catch (error) {
      if (error.response?.status === 422) {
        setErrors(error.response.data.errors || {});
        toast.error('Veuillez vérifier les champs');
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
      <div className="relative w-full max-w-xl overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-slate-200">
        <ModalHeader
          title={isEditing ? "Modifier l'emplacement" : 'Nouvel emplacement'}
          subtitle="Localisation physique des archives"
          eyebrow="DGRAD · Archivage ordinaire"
          icon={<FaMapMarkerAlt size={15} />}
          onClose={onClose}
          closeDisabled={loading}
        />

        <form onSubmit={submit} className="space-y-4 p-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="mb-1.5 block text-xs font-bold text-slate-600">
                Nom de l'emplacement <span className="text-rose-500">*</span>
              </label>
              <input
                value={form.nom_emplacement}
                onChange={(e) => change('nom_emplacement', e.target.value)}
                required
                disabled={loading}
                placeholder="Ex. Archives centrales"
                className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:border-navy-600 focus:ring-4 focus:ring-navy-100"
              />
              {errors.nom_emplacement && <p className="mt-1.5 text-xs text-rose-600">{errors.nom_emplacement[0]}</p>}
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-bold text-slate-600">Code</label>
              <input
                value={form.code}
                onChange={(e) => change('code', e.target.value)}
                disabled={loading}
                placeholder="Ex. EMP-ARCH"
                className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:border-navy-600 focus:ring-4 focus:ring-navy-100"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-bold text-slate-600">Bâtiment</label>
              <input
                value={form.batiment}
                onChange={(e) => change('batiment', e.target.value)}
                disabled={loading}
                placeholder="Ex. Bâtiment A"
                className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:border-navy-600 focus:ring-4 focus:ring-navy-100"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-bold text-slate-600">Salle</label>
              <input
                value={form.salle}
                onChange={(e) => change('salle', e.target.value)}
                disabled={loading}
                placeholder="Ex. Salle 01"
                className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:border-navy-600 focus:ring-4 focus:ring-navy-100"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-bold text-slate-600">Étagère</label>
              <input
                value={form.etagere}
                onChange={(e) => change('etagere', e.target.value)}
                disabled={loading}
                placeholder="Ex. Étagère 3"
                className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:border-navy-600 focus:ring-4 focus:ring-navy-100"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1.5 block text-xs font-bold text-slate-600">Description</label>
              <textarea
                value={form.description}
                onChange={(e) => change('description', e.target.value)}
                rows={2}
                disabled={loading}
                className="w-full resize-none rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:border-navy-600 focus:ring-4 focus:ring-navy-100"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-bold text-slate-600">Statut</label>
              <select
                value={form.statut}
                onChange={(e) => change('statut', e.target.value)}
                disabled={loading}
                className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-navy-600 focus:ring-4 focus:ring-navy-100"
              >
                <option value="1">Actif</option>
                <option value="0">Inactif</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
            <button type="button" onClick={onClose} disabled={loading} className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50">
              Annuler
            </button>
            <button type="submit" disabled={loading || !form.nom_emplacement.trim()} className="inline-flex items-center gap-2 rounded-xl bg-navy-900 px-6 py-2.5 text-sm font-bold text-white hover:bg-navy-800 disabled:opacity-50">
              {loading ? <FaSpinner className="animate-spin" size={11} /> : isEditing ? <FaEdit size={11} /> : <FaPlus size={11} />}
              {isEditing ? 'Mettre à jour' : 'Créer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ModalEmplacementScreen;
