// @ts-nocheck
import api from './api';
import type { CreateTitrePayload } from '../types';

export const titreService = {
  list(params: Record<string, unknown> = {}) {
    return api.get('/titres', { params }).then((r) => r.data);
  },
  getById(id: number) {
    return api.get(`/titres/${id}`).then((r) => r.data);
  },
  create(payload: CreateTitrePayload) {
    return api.post('/titres', payload).then((r) => r.data);
  },
  update(id: number, payload: Partial<CreateTitrePayload>) {
    return api.put(`/titres/${id}`, payload).then((r) => r.data);
  },
  validate(id: number) {
    return api.post(`/titres/${id}/validate`).then((r) => r.data);
  },
  remove(id: number) {
    return api.delete(`/titres/${id}`).then((r) => r.data);
  },
};

export default titreService;
