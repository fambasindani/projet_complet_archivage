import api from './api';
import type { Division, PaginatedData } from '../types';

export interface DivisionPayload {
  id_direction: number;
  code?: string;
  sigle: string;
  nom: string;
  description?: string | null;
  statut?: boolean;
}

export const divisionService = {
  list(params: { search?: string; id_direction?: number | string; page?: number; per_page?: number } = {}) {
    return api.get<{ success: boolean; data: PaginatedData<Division> }>('/divisions', { params }).then((r) => r.data);
  },
  getById(id: number) {
    return api.get<{ success: boolean; data: Division }>(`/divisions/${id}`).then((r) => r.data);
  },
  availableUsers(id: number) {
    return api.get(`/divisions/${id}/available-users`).then((r) => r.data);
  },
  stats() {
    return api.get('/divisions/stats').then((r) => r.data);
  },
  create(payload: DivisionPayload) {
    return api.post<{ success: boolean; data: Division }>('/divisions', payload).then((r) => r.data);
  },
  update(id: number, payload: Partial<DivisionPayload>) {
    return api.put<{ success: boolean; data: Division }>(`/divisions/${id}`, payload).then((r) => r.data);
  },
  remove(id: number) {
    return api.delete(`/divisions/${id}`).then((r) => r.data);
  },
  assignUser(divisionId: number, userId: number) {
    return api.post(`/divisions/${divisionId}/assign-user/${userId}`).then((r) => r.data);
  },
  removeUser(divisionId: number, userId: number) {
    return api.post(`/divisions/${divisionId}/remove-user/${userId}`).then((r) => r.data);
  },
};

export default divisionService;
