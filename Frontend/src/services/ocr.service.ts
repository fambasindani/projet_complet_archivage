// @ts-nocheck
import api from './api';

export const ocrService = {
  search(params: { q?: string; entite_type?: string; page?: number; per_page?: number } = {}) {
    return api.get('/ocr/recherche', { params }).then((r) => r.data);
  },
};

export default ocrService;
