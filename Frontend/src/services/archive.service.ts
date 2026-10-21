// @ts-nocheck
import api from './api';
import type { Archive, CreateArchivePayload } from '../types';

export const archiveService = {
  list(params: Record<string, unknown> = {}) {
    return api.get('/archives', { params }).then((r) => r.data);
  },
  getById(id: number) {
    return api.get(`/archives/${id}`).then((r) => r.data);
  },
  create(payload: CreateArchivePayload) {
    return api.post('/archives', payload).then((r) => r.data);
  },
  update(id: number, payload: Partial<CreateArchivePayload>) {
    return api.put(`/archives/${id}`, payload).then((r) => r.data);
  },
  remove(id: number) {
    return api.delete(`/archives/${id}`).then((r) => r.data);
  },
};

export default archiveService;
