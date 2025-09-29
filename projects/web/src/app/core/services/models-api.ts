import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({ providedIn: 'root' })
export class ModelsApiService {
  constructor(private http: HttpClient) {}
  getCurrent(projectId: string, branchId?: string) {
    const q = branchId ? `?branchId=${branchId}` : '';
    return this.http.get<{ branchId: string; versionId: string; content: any }>(`/api/models/${projectId}${q}`);
  }
  save(projectId: string, body: { branchId?: string; message?: string; content: any }) {
    return this.http.post<{ versionId: string; createdAt: string }>(`/api/models/${projectId}/versions`, body);
  }
}
