import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({ providedIn: 'root' })
export class CollaboratorsService {
  constructor(private http: HttpClient) {}
  list(projectId: string) {
    return this.http.get<any[]>(`/api/projects/${projectId}/collaborators`);
  }
  add(projectId: string, body: { role: 'OWNER'|'EDITOR'|'READER'; userId?: string; email?: string }) {
    return this.http.post(`/api/projects/${projectId}/collaborators`, body);
  }
  updateRole(projectId: string, memberId: string, role: 'OWNER'|'EDITOR'|'READER') {
    return this.http.patch(`/api/projects/${projectId}/collaborators/${memberId}/role`, { role });
  }
  remove(projectId: string, memberId: string) {
    return this.http.delete(`/api/projects/${projectId}/collaborators/${memberId}`);
  }
  search(projectId: string, q: string) {
    return this.http.get<any[]>(`/api/projects/${projectId}/collaborators/search?q=${encodeURIComponent(q)}`);
  }
  audit(projectId: string) {
    return this.http.get<any[]>(`/api/projects/${projectId}/collaborators/audit`);
  }
}
