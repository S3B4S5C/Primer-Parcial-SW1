import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({ providedIn: 'root' })
export class VersionsApiService {
  constructor(private http: HttpClient) {}
  listBranches(projectId: string) { return this.http.get<any[]>(`/api/projects/${projectId}/branches`); }
  createBranch(projectId: string, body: { name: string; fromVersionId?: string }) {
    return this.http.post(`/api/projects/${projectId}/branches`, body);
  }
  listVersions(projectId: string, branchId: string, take = 50) {
    return this.http.get<any[]>(`/api/projects/${projectId}/branches/${branchId}/versions?take=${take}`);
  }
  diff(projectId: string, from: string, to: string) {
    return this.http.get<any>(`/api/projects/${projectId}/diff?from=${from}&to=${to}`);
  }
  restore(projectId: string, versionId: string, message?: string) {
    return this.http.post<any>(`/api/projects/${projectId}/restore`, { versionId, message });
  }
  merge(projectId: string, body: { sourceBranchId: string; targetBranchId: string; sourceVersionId: string; targetVersionId: string }) {
    return this.http.post<any>(`/api/projects/${projectId}/merge`, body);
  }
}
