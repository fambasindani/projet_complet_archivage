// @ts-nocheck
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../config';
import GetTokenOrRedirect from '../Composant/getTokenOrRedirect';
import { FaBuilding, FaEdit, FaPlus, FaSpinner, FaTimes } from 'react-icons/fa';

const EMPTY = { nom: '', code: '', sigle: '', description: '', statut: '1' };

const ModalDirectionScreen = ({ isOpen, onClose, directionToEdit = null, onSuccess }) => {
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const token = GetTokenOrRedirect();
  const isEditing = !!directionToEdit;

  useEffect(() => {
    if (directionToEdit) {
      setForm({
        nom: directionToEdit.nom || '',
        code: directionToEdit.code || '',
        sigle: directionToEdit.sigle || '',
        description: directionToEdit.description || '',
        statut: directionToEdit.statut === false || directionToEdit.statut === 0 ? '0' : '1',
      });
    } else {
      setForm(EMPTY);
    }
    setErrors({});
  }, [directionToEdit, isOpen]);

  const change = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: null }));
  };

  const submit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setErrors({});

    const payload = {
      nom: form.nom.trim(),
      code: form.code.trim() || undefined,
      sigle: form.sigle.trim().toUpperCase() || undefined,
      description: form.description.trim() || null,
      statut: form.statut === '1',
    };

    try {
      if (isEditing) {
        await axios.put(`${API_BASE_URL}/directions/${directionToEdit.id}`, payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
      } else {
        await axios.post(`${API_BASE_URL}/directions`, payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
      }
      if (onSuccess) onSuccess();
      onClose();
    } catch (error) {
      if (error.response?.status === 422) setErrors(error.response.data.errors || {});
      else if (error.response?.status === 401) {
        localStorage.clear();
        window.location.href = '/archive/';
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
        <div className="flex items-center justify-between bg-navy-900 px-6 py-4 text-white">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10">
              <FaBuilding size={13} />
            </span>
            <div>
              <h3 className="font-display text-sm font-extrabold">
                {isEditing ? 'Modifier la direction' : 'Nouvelle direction'}
              </h3>
              <p className="text-[10px] text-slate-300">Référentiel organisationnel DGRAD</p>
            </div>
          </div>
          <button onClick={onClose} disabled={loading} className="rounded-lg bg-white/10 p-2 text-slate-200 hover:bg-white/15">
            <FaTimes size={12} />
          </button>
        </div>

        <form onSubmit={submit} className="space-y-5 p-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label className="mb-1.5 block text-xs font-bold text-slate-600">Code</label>
              <input
                value={form.code}
                onChange={(e) => change('code', e.target.value)}
                disabled={loading}
                placeholder="Ex. DANTIC"
                className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:border-navy-600 focus:ring-4 focus:ring-navy-100"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-bold text-slate-600">Sigle</label>
              <input
                value={form.sigle}
                onChange={(e) => change('sigle', e.target.value.toUpperCase())}
                disabled={loading}
                placeholder="Ex. DANTIC"
                className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm font-bold uppercase tracking-wide outline-none focus:border-navy-600 focus:ring-4 focus:ring-navy-100"
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
                <option value="1">Active</option>
                <option value="0">Inactive</option>
              </select>
            </div>
            <div className="sm:col-span-3">
              <label className="mb-1.5 block text-xs font-bold text-slate-600">
                Nom de la direction <span className="text-rose-500">*</span>
              </label>
              <input
                value={form.nom}
                onChange={(e) => change('nom', e.target.value)}
                required
                disabled={loading}
                placeholder="Ex. Direction des Archives et des Nouvelles Technologies"
                className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:border-navy-600 focus:ring-4 focus:ring-navy-100"
              />
              {errors.nom && <p className="mt-1.5 text-xs text-rose-600">{errors.nom[0]}</p>}
            </div>
            <div className="sm:col-span-3">
              <label className="mb-1.5 block text-xs font-bold text-slate-600">Description</label>
              <textarea
                value={form.description}
                onChange={(e) => change('description', e.target.value)}
                rows={3}
                disabled={loading}
                className="w-full resize-none rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:border-navy-600 focus:ring-4 focus:ring-navy-100"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
            <button type="button" onClick={onClose} disabled={loading} className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50">
              Annuler
            </button>
            <button type="submit" disabled={loading} className="inline-flex items-center gap-2 rounded-xl bg-navy-900 px-6 py-2.5 text-sm font-bold text-white hover:bg-navy-800 disabled:opacity-50">
              {loading ? <FaSpinner className="animate-spin" size={11} /> : isEditing ? <FaEdit size={11} /> : <FaPlus size={11} />}
              {isEditing ? 'Mettre à jour' : 'Créer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ModalDirectionScreen;
