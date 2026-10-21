// @ts-nocheck
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../config';
import GetTokenOrRedirect from '../Composant/getTokenOrRedirect';
import { FaBuilding, FaEdit, FaPlus, FaSpinner, FaTimes } from 'react-icons/fa';
import { toast } from '../Composant/Toast';

const EMPTY = { nom: '', code: '', id_direction: '', description: '', statut: '1' };

const ModalCentre = ({ isOpen, onClose, centreToEdit = null, directions = [], ministeres = [], onSuccess }) => {
  const options = directions.length ? directions : ministeres;
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const token = GetTokenOrRedirect();
  const isEditing = !!centreToEdit;

  useEffect(() => {
    if (centreToEdit) {
      setForm({
        nom: centreToEdit.nom || '',
        code: centreToEdit.code || '',
        id_direction: String(centreToEdit.id_direction || centreToEdit.id_ministere || ''),
        description: centreToEdit.description || '',
        statut: centreToEdit.statut === false || centreToEdit.statut === 0 ? '0' : '1',
      });
    } else {
      setForm(EMPTY);
    }
    setErrors({});
  }, [centreToEdit, isOpen]);

  const submit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setErrors({});

    const payload = {
      nom: form.nom.trim(),
      code: form.code.trim() || null,
      id_direction: Number(form.id_direction),
      description: form.description.trim() || null,
      statut: form.statut === '1',
    };

    try {
      if (isEditing) {
        await axios.put(`${API_BASE_URL}/centre_ordonnancements/${centreToEdit.id}`, payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
        toast.success('Centre mis à jour');
      } else {
        await axios.post(`${API_BASE_URL}/centre_ordonnancements`, payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
        toast.success('Centre créé');
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
      <div className="relative w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-slate-200">
        <div className="flex items-center justify-between bg-navy-900 px-6 py-4 text-white">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10">
              <FaBuilding size={13} />
            </span>
            <div>
              <h3 className="font-display text-sm font-extrabold">
                {isEditing ? 'Modifier le centre' : 'Nouveau centre'}
              </h3>
              <p className="text-[10px] text-slate-300">Centre d'ordonnancement</p>
            </div>
          </div>
          <button onClick={onClose} disabled={loading} className="rounded-lg bg-white/10 p-2 text-slate-200 hover:bg-white/15">
            <FaTimes size={12} />
          </button>
        </div>

        <form onSubmit={submit} className="space-y-4 p-6">
          <div>
            <label className="mb-1.5 block text-xs font-bold text-slate-600">
              Direction de rattachement <span className="text-rose-500">*</span>
            </label>
            <select
              value={form.id_direction}
              onChange={(e) => setForm({ ...form, id_direction: e.target.value })}
              required
              disabled={loading}
              className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-navy-600 focus:ring-4 focus:ring-navy-100"
            >
              <option value="">Sélectionner une direction...</option>
              {options.map((direction) => (
                <option key={direction.id} value={direction.id}>
                  {direction.sigle ? `${direction.sigle} — ` : ''}
                  {direction.nom}
                </option>
              ))}
            </select>
            {(errors.id_direction || errors.id_ministere) && (
              <p className="mt-1.5 text-xs text-rose-600">
                {(errors.id_direction || errors.id_ministere)[0]}
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs font-bold text-slate-600">
                Nom du centre <span className="text-rose-500">*</span>
              </label>
              <input
                value={form.nom}
                onChange={(e) => setForm({ ...form, nom: e.target.value })}
                required
                disabled={loading}
                placeholder="Ex. Centre d'ordonnancement DPFC"
                className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:border-navy-600 focus:ring-4 focus:ring-navy-100"
              />
              {errors.nom && <p className="mt-1.5 text-xs text-rose-600">{errors.nom[0]}</p>}
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-bold text-slate-600">Code</label>
              <input
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value })}
                disabled={loading}
                placeholder="Ex. CO-DPFC"
                className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:border-navy-600 focus:ring-4 focus:ring-navy-100"
              />
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

          <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
            <button type="button" onClick={onClose} disabled={loading} className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50">
              Annuler
            </button>
            <button type="submit" disabled={loading || !form.nom.trim() || !form.id_direction} className="inline-flex items-center gap-2 rounded-xl bg-navy-900 px-6 py-2.5 text-sm font-bold text-white hover:bg-navy-800 disabled:opacity-50">
              {loading ? <FaSpinner className="animate-spin" size={11} /> : isEditing ? <FaEdit size={11} /> : <FaPlus size={11} />}
              {isEditing ? 'Mettre à jour' : 'Créer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ModalCentre;
