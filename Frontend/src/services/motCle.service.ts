// @ts-nocheck
import api from './api';

export const motCleService = {
  list(params: Record<string, unknown> = {}) {
    return api.get('/mots-cles', { params }).then((r) => r.data);
  },
  create(payload: { libelle: string }) {
    return api.post('/mots-cles', payload).then((r) => r.data);
  },
  update(id: number, payload: { libelle: string }) {
    return api.put(`/mots-cles/${id}`, payload).then((r) => r.data);
  },
  remove(id: number) {
    return api.delete(`/mots-cles/${id}`).then((r) => r.data);
  },
};

export default motCleService;
