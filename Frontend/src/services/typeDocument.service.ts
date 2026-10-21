// @ts-nocheck
import api from './api';

export const typeDocumentService = {
  list(params: Record<string, unknown> = {}) {
    return api.get('/types-documents', { params }).then((r) => r.data);
  },
  getById(id: number) {
    return api.get(`/types-documents/${id}`).then((r) => r.data);
  },
  create(payload: Record<string, unknown>) {
    return api.post('/types-documents', payload).then((r) => r.data);
  },
  update(id: number, payload: Record<string, unknown>) {
    return api.put(`/types-documents/${id}`, payload).then((r) => r.data);
  },
  remove(id: number) {
    return api.delete(`/types-documents/${id}`).then((r) => r.data);
  },
};

export default typeDocumentService;
