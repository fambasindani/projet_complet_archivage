// @ts-nocheck
import api from './api';

export const fichierService = {
  list(params: Record<string, unknown> = {}) {
    return api.get('/fichiers', { params }).then((r) => r.data);
  },
  getById(id: number) {
    return api.get(`/fichiers/${id}`).then((r) => r.data);
  },
  upload(entiteType: 'archive' | 'titre_perception', entiteId: number, files: File[]) {
    const form = new FormData();
    form.append('entite_type', entiteType);
    form.append('entite_id', String(entiteId));
    files.forEach((file) => form.append('files[]', file));
    return api
      .post('/fichiers/upload', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      .then((r) => r.data);
  },
  download(id: number) {
    return api.get(`/fichiers/${id}/download`, { responseType: 'blob' }).then((r) => r.data);
  },
  runOcr(id: number) {
    return api.post(`/fichiers/${id}/ocr`).then((r) => r.data);
  },
  updateText(id: number, montext: string) {
    return api.put(`/fichiers/${id}/text`, { montext }).then((r) => r.data);
  },
  remove(id: number) {
    return api.delete(`/fichiers/${id}`).then((r) => r.data);
  },
};

export default fichierService;
