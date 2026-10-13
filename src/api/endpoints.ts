import { apiGet, apiPost, apiPut } from './client';
import type { components } from './schema';

type S = components['schemas'];
export type User = S['User'];
export type AgentRun = S['AgentRun'];
export type Metrics = S['Metrics'];
export type AuditEntry = S['AuditEntry'];

/** One function per operationId in backend/openapi.yaml. Add new ones here (new-feature.mjs scaffolds them). */
export const api = {
  login: (email: string, password: string) => apiPost<S['UserEnvelope']>('/api/v1/auth/login', { email, password }, { skipRefresh: true }),
  refresh: () => apiPost<S['UserEnvelope']>('/api/v1/auth/refresh', undefined, { skipRefresh: true }),
  logout: () => apiPost<void>('/api/v1/auth/logout', undefined, { skipRefresh: true }),
  me: () => apiGet<S['UserEnvelope']>('/api/v1/auth/me', { skipRefresh: true }),
  systemStatus: () => apiGet<S['SystemStatus']>('/api/v1/system/status', { skipRefresh: true }),
  runAgent: (name: string, input: string, idempotencyKey: string) =>
    apiPost<S['AgentRunEnvelope']>(`/api/v1/agents/${encodeURIComponent(name)}/run`, { input }, { headers: { 'Idempotency-Key': idempotencyKey }, timeoutMs: 90_000 }),
  listAgentRuns: (limit = 20) => apiGet<S['AgentRunList']>('/api/v1/agents/runs', { query: { limit } }),
  adminMetrics: () => apiGet<S['Metrics']>('/api/v1/admin/metrics'),
  adminAudit: (limit = 50) => apiGet<S['AuditList']>('/api/v1/admin/audit', { query: { limit } }),
  setMaintenance: (enabled: boolean) => apiPut<S['MaintenanceRequest']>('/api/v1/admin/maintenance', { enabled })
  // @fde:endpoints (new-feature.mjs inserts endpoint functions above this line)
};
