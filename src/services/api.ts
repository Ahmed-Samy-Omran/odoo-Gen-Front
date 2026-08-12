export interface GeneratorPayload {
  moduleName: string;
  description: string;
  version: string;
  odoo_version?: string;
  author: string;
  category: string;
  depends: string[];
  features: string[];
  models: ModelDefinition[];
  deploymentStrategy: 'github' | 'local_zip';
  repositoryUrl?: string;
  job_id?: string;
  /** When set, skips AI and posts directly to /generate-module/ */
  rawConfig?: { modules: unknown[] };
  /** When set, sends this text directly to /analyze-requirements/ (old JSON format) */
  aiPrompt?: string;
}

export interface ModelDefinition {
  name: string;
  fields: FieldDefinition[];
}

export interface FieldDefinition {
  name: string;
  type: string;
  required: boolean;
}

export interface GenerationResult {
  success: boolean;
  message: string;
  files?: GeneratedFile[];
  downloadUrl?: string;
  repositoryUrl?: string;
  deploymentMethod: 'github' | 'local_zip';
  jobId?: string;
}

export interface GeneratedFile {
  name: string;
  path: string;
  content: string;
}

export interface JobStatus {
  job_id: string;
  status: 'pending' | 'running' | 'done' | 'error';
  progress: number;
  message: string;
  elapsed_sec: number;
  estimated_remaining_sec?: number | null;
  download_url?: string | null;
  github_url?: string | null;
  error?: string | null;
  schema_preview?: SchemaPreview | null;
}

export interface SchemaField {
  name: string;
  type: string;
  required: boolean;
  relation?: string | null;
  default?: string | null;
  unique?: boolean;
}

export interface SchemaModel {
  name: string;
  module_name: string;
  description?: string;
  fields: SchemaField[];
}

export interface SchemaUseCase {
  name: string;
  actor: string;
  model?: string;
}

export interface SchemaPreview {
  module_name: string;
  models: SchemaModel[];
  actors: string[];
  use_cases: SchemaUseCase[];
  positions?: Record<string, { x: number; y: number }>;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  status?: 'sending' | 'sent';
  createdAt?: string;
}

export interface ChatResponse {
  reply: string;
  ready_to_generate: boolean;
  requirements_summary: string;
}

export type ProgressCallback = (status: JobStatus) => void;

function resolveApiBaseUrl(): string {
  const configured = import.meta.env.VITE_API_URL?.trim();
  if (configured) return configured.replace(/\/$/, '');

  if (typeof window !== 'undefined') {
    const protocol = window.location.protocol || 'http:';
    const hostname = window.location.hostname || '127.0.0.1';
    return `${protocol}//${hostname}:8000`;
  }

  return 'http://127.0.0.1:8000';
}

export const API_BASE_URL = resolveApiBaseUrl();
const POLL_INTERVAL_MS = 2500;

const TOKEN_KEY = 'odoo_access_token';

export const AUTH_LOGOUT_EVENT = 'odoo:auth:logout';

export function getToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

function setToken(token: string): void {
  try {
    localStorage.setItem(TOKEN_KEY, token);
  } catch {
    // ignore
  }
}

export function clearToken(): void {
  try {
    localStorage.removeItem(TOKEN_KEY);
  } catch {
    // ignore
  }
}

export function isAuthenticated(): boolean {
  return Boolean(getToken());
}

export interface LoginResult {
  access_token: string;
  token_type: string;
  username: string;
  expires_in: number;
  role: 'admin' | 'user' | 'guest';
}

const ROLE_KEY = 'odoo_role';

export function getRole(): 'admin' | 'user' | 'guest' | null {
  try {
    const role = localStorage.getItem(ROLE_KEY);
    return role === 'admin' || role === 'user' || role === 'guest' ? role : null;
  } catch {
    return null;
  }
}

export function isAdmin(): boolean {
  return getRole() === 'admin';
}

export async function login(username: string, password: string): Promise<LoginResult> {
  const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({ username, password }),
  });

  if (!response.ok) {
    const errorData = await safeJsonResponse<ApiErrorBody>(response).catch(() => ({} as ApiErrorBody));
    throw apiError(response.status, errorData, `Login failed: ${response.statusText}`);
  }

  const result = await safeJsonResponse<LoginResult>(response);
  setToken(result.access_token);
  setRole(result.role);
  return result;
}

/** Exchange a Supabase session access token for an app JWT (role: user). */
export async function loginWithSupabase(accessToken: string): Promise<LoginResult> {
  const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({ provider: 'supabase', access_token: accessToken }),
  });

  if (!response.ok) {
    const errorData = await safeJsonResponse<ApiErrorBody>(response).catch(() => ({} as ApiErrorBody));
    throw apiError(response.status, errorData, `Supabase login failed: ${response.statusText}`);
  }

  const result = await safeJsonResponse<LoginResult>(response);
  setToken(result.access_token);
  setRole(result.role);
  return result;
}

function setRole(role: 'admin' | 'user' | 'guest'): void {
  try {
    localStorage.setItem(ROLE_KEY, role);
  } catch {
    // ignore
  }
}

export function logout(): void {
  clearToken();
  try {
    localStorage.removeItem(ROLE_KEY);
  } catch {
    // ignore
  }
  window.dispatchEvent(new Event(AUTH_LOGOUT_EVENT));
}

/** Fetch wrapper that attaches the JWT and signs the app out on 401. */
export async function apiFetch(input: RequestInfo | URL, init: RequestInit = {}): Promise<Response> {
  const token = getToken();
  const headers = new Headers(init.headers);
  if (token) headers.set('Authorization', `Bearer ${token}`);

  const response = await fetch(input, { ...init, headers });

  if (response.status === 401) {
    clearToken();
    try {
      localStorage.removeItem(ROLE_KEY);
    } catch {
      // ignore
    }
    window.dispatchEvent(new Event(AUTH_LOGOUT_EVENT));
  }
  return response;
}

/** Identity + daily quota state returned by ``GET /api/auth/me``. */
export interface CurrentUserInfo {
  sub: string;
  email: string | null;
  role: 'admin' | 'user' | 'guest';
  is_guest: boolean;
  is_admin: boolean;
  token_limit: number | null;
  tokens_used_today: number;
  requests_used_today: number;
}

export async function fetchCurrentUser(): Promise<CurrentUserInfo> {
  const response = await apiFetch(`${API_BASE_URL}/api/auth/me`, {
    headers: { Accept: 'application/json' },
  });

  if (!response.ok) {
    const errorData = await safeJsonResponse<ApiErrorBody>(response).catch(() => ({} as ApiErrorBody));
    throw apiError(response.status, errorData, `Failed to fetch profile: ${response.statusText}`);
  }

  return safeJsonResponse<CurrentUserInfo>(response);
}

const ZIP_RESPONSE_ERROR =
  'Backend returned a ZIP file instead of a job ID. Restart the backend (main.py) so it uses the async job API.';

type ApiErrorBody = { detail?: string; message?: string };

function getApiErrorMessage(errorData: ApiErrorBody, fallback: string): string {
  return errorData.detail || errorData.message || fallback;
}

/** Error carrying the HTTP status so callers can react to 401/403 (quota). */
export class ApiError extends Error {
  readonly status?: number;

  constructor(message: string, status?: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

function apiError(status: number, data: ApiErrorBody, fallback: string): ApiError {
  return new ApiError(getApiErrorMessage(data, fallback), status);
}

/** Event dispatched whenever a backend 403 "quota exceeded" is received. */
export const QUOTA_EXCEEDED_EVENT = 'odoo:quota-exceeded';

export function notifyQuotaExceeded(): void {
  window.dispatchEvent(new Event(QUOTA_EXCEEDED_EVENT));
}

/** True when the error is a 403 with a quota-related message (daily limit spent). */
export function isQuotaExceededError(error: unknown): boolean {
  const status = error instanceof ApiError ? error.status : undefined;
  const message = error instanceof Error ? error.message : String(error ?? '');
  return status === 403 && /quota/i.test(message) && /exceeded|sign up|upgrade|spent/i.test(message);
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function safeJsonResponse<T>(response: Response): Promise<T> {
  const contentType = response.headers.get('content-type') || '';
  const text = await response.text();

  if (
    contentType.includes('zip') ||
    contentType.includes('octet-stream') ||
    text.startsWith('PK')
  ) {
    throw new Error(ZIP_RESPONSE_ERROR);
  }

  try {
    return JSON.parse(text) as T;
  } catch {
    throw new Error(
      `Server returned non-JSON (${response.status}): ${text.slice(0, 120)}`,
    );
  }
}

export function buildPrompt(payload: GeneratorPayload): string {
  const selectedVersion = payload.odoo_version || payload.version || '17.0';
  const lines: string[] = [
    `Create an Odoo ${selectedVersion} module named "${payload.moduleName}".`,
  ];

  if (payload.description?.trim()) {
    lines.push(`Requirements: ${payload.description.trim()}`);
  }

  if (payload.author?.trim()) {
    lines.push(`Author: ${payload.author.trim()}`);
  }

  if (payload.category?.trim()) {
    lines.push(`Category: ${payload.category.trim()}`);
  }

  if (payload.depends?.length) {
    lines.push(`Dependencies: ${payload.depends.join(', ')}`);
  }

  if (payload.models?.length) {
    lines.push('Models:');
    for (const model of payload.models) {
      const fields = model.fields
        ?.map((f) => `${f.name} (${f.type}${f.required ? ', required' : ''})`)
        .join(', ');
      lines.push(`- ${model.name}${fields ? `: ${fields}` : ''}`);
    }
  }

  if (payload.deploymentStrategy === 'github') {
    lines.push('Deploy the result to GitHub (git_deploy_target: github).');
    if (payload.repositoryUrl?.trim()) {
      lines.push(`Target repository: ${payload.repositoryUrl.trim()}`);
    }
  } else {
    lines.push('Prepare the result as a local ZIP download (git_deploy_target: local_zip).');
  }

  return lines.join('\n');
}

function toBackendPayload(payload: GeneratorPayload) {
  const resolvedVersion = payload.odoo_version || payload.version || '17.0';
  return {
    odoo_version: resolvedVersion,
    modules: [
      {
        module_name: payload.moduleName,
        module_description: payload.description,
        depends: payload.depends,
        git_deploy_target: payload.deploymentStrategy,
        repository_url: payload.deploymentStrategy === 'github' ? payload.repositoryUrl?.trim() || undefined : undefined,
        odoo_version: resolvedVersion,
        models: (payload.models || []).map((m) => ({
          name: m.name,
          fields: (m.fields || []).map((f) => ({
            name: f.name,
            type: f.type,
            required: f.required,
          })),
        })),
      },
    ],
  };
}

export async function sendChatMessage(messages: ChatMessage[], jobId?: string | null, options?: { preferred_language?: 'english' | 'arabic' }): Promise<ChatResponse> {
  const body: any = {
    messages: messages.map((message) => ({
      role: message.role,
      content: message.content,
    })),
    job_id: jobId || null,
  };
  if (options?.preferred_language) body.preferred_language = options.preferred_language;

  const response = await apiFetch(`${API_BASE_URL}/chat/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorData = await safeJsonResponse<ApiErrorBody>(response).catch(() => ({} as ApiErrorBody));
    throw apiError(response.status, errorData, `Chat failed: ${response.statusText}`);
  }

  return safeJsonResponse<ChatResponse>(response);
}

async function startPromptJob(prompt: string, jobId?: string, payload?: GeneratorPayload): Promise<JobStatus> {
  const body: any = { prompt };
  if (jobId) body.job_id = jobId;
  body.odoo_version = (payload?.odoo_version || payload?.version || '17.0');

  const response = await apiFetch(`${API_BASE_URL}/analyze-requirements/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorData = await safeJsonResponse<ApiErrorBody>(response).catch(() => ({} as ApiErrorBody));
    throw apiError(response.status, errorData, `Request failed: ${response.statusText}`);
  }

  return safeJsonResponse<JobStatus>(response);
}

async function startConfigJob(payload: GeneratorPayload, jobId?: string): Promise<JobStatus> {
  const rawModules = Array.isArray(payload.rawConfig?.modules) ? payload.rawConfig.modules : [];
  const body: any = payload.rawConfig
    ? {
        ...payload.rawConfig,
        modules: rawModules.map((module) => {
          if (module && typeof module === 'object') {
            const moduleData = { ...(module as Record<string, unknown>) };
            if (payload.deploymentStrategy === 'github') {
              moduleData.git_deploy_target = 'github';
              const repoUrl = payload.repositoryUrl?.trim();
              if (repoUrl) {
                moduleData.repository_url = repoUrl;
              }
            } else {
              moduleData.git_deploy_target = 'local_zip';
            }
            return moduleData;
          }
          return module;
        }),
      }
    : toBackendPayload(payload);
  if (jobId) body.job_id = jobId;

  const response = await apiFetch(`${API_BASE_URL}/generate-module/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorData = await safeJsonResponse<ApiErrorBody>(response).catch(() => ({} as ApiErrorBody));
    throw apiError(response.status, errorData, `Request failed: ${response.statusText}`);
  }

  return safeJsonResponse<JobStatus>(response);
}

export async function fetchJobRestore(jobId: string): Promise<{ job_id: string; status: string; progress: number; message: string; chat_history?: ChatMessage[]; module_config?: unknown; schema_preview?: SchemaPreview | null; odoo_version?: string | null }> {
  const response = await apiFetch(`${API_BASE_URL}/job/${jobId}/restore`, {
    headers: { Accept: 'application/json' },
  });
  if (!response.ok) {
    const errorData: ApiErrorBody = await safeJsonResponse<ApiErrorBody>(response).catch(() => ({} as ApiErrorBody));
    throw apiError(response.status, errorData, 'Failed to restore session');
  }
  return safeJsonResponse(response);
}

export async function syncJobConfig(
  jobId: string,
  moduleConfig: Record<string, unknown>,
  schemaPreview?: SchemaPreview | null,
  odooVersion?: string,
): Promise<{ status: string; message: string }> {
  const response = await apiFetch(`${API_BASE_URL}/job/${jobId}/sync-config`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({
      module_config: moduleConfig,
      schema_preview: schemaPreview ?? null,
      odoo_version: odooVersion ?? null,
    }),
  });

  if (!response.ok) {
    const errorData: ApiErrorBody = await safeJsonResponse<ApiErrorBody>(response).catch(() => ({} as ApiErrorBody));
    throw apiError(response.status, errorData, 'Failed to sync changes to cloud');
  }

  return safeJsonResponse<{ status: string; message: string }>(response);
}

export async function pollJob(jobId: string): Promise<JobStatus> {
  const response = await apiFetch(`${API_BASE_URL}/job/${jobId}`, {
    headers: { Accept: 'application/json' },
  });
  if (!response.ok) {
    const errorData = await safeJsonResponse<ApiErrorBody>(response).catch(() => ({} as ApiErrorBody));
    throw apiError(response.status, errorData, `Polling failed: ${response.statusText}`);
  }
  return safeJsonResponse<JobStatus>(response);
}

export async function fetchJobFiles(jobId: string): Promise<GeneratedFile[]> {
  const response = await apiFetch(`${API_BASE_URL}/job/${jobId}/files`, {
    headers: { Accept: 'application/json' },
  });
  if (!response.ok) {
    const errorData = await safeJsonResponse<ApiErrorBody>(response).catch(() => ({} as ApiErrorBody));
    throw apiError(response.status, errorData, `Failed to fetch files: ${response.statusText}`);
  }
  const data = await safeJsonResponse<{ files?: GeneratedFile[] }>(response);
  return Array.isArray(data?.files) ? data.files : [];
}

async function waitForJob(jobId: string, onProgress?: ProgressCallback): Promise<JobStatus> {
  while (true) {
    const status = await pollJob(jobId);
    onProgress?.(status);

    if (status.status === 'done') {
      return status;
    }

    if (status.status === 'error') {
      throw new Error(status.error || status.message || 'Generation failed');
    }

    await sleep(POLL_INTERVAL_MS);
  }
}

export async function generateModule(
  payload: GeneratorPayload,
  onProgress?: ProgressCallback,
  jobId?: string,
): Promise<GenerationResult> {
  try {
    if (!payload?.moduleName) {
      throw new Error('Module name is required');
    }

    const hasRawConfig = Boolean(payload.rawConfig?.modules?.length);
    const hasStructuredModels = payload.models?.some((m) => m.fields?.length > 0);
    const initialJob = hasRawConfig || hasStructuredModels
      ? await startConfigJob(payload, jobId)
      : await startPromptJob(payload.aiPrompt?.trim() || buildPrompt(payload), jobId, payload);

    onProgress?.(initialJob);

    const finalJob = await waitForJob(initialJob.job_id, onProgress);
    const files = await fetchJobFiles(finalJob.job_id);

    const downloadUrl = finalJob.download_url
      ? `${API_BASE_URL}${finalJob.download_url}`
      : undefined;

    // Persist active job id locally so App can reuse it for edits
    try {
      localStorage.setItem('odoo_active_job', finalJob.job_id);
    } catch {
      // ignore
    }

    return {
      success: true,
      message: finalJob.message || 'Generation successful',
      files,
      downloadUrl,
      repositoryUrl: finalJob.github_url || payload.repositoryUrl,
      deploymentMethod: finalJob.github_url ? 'github' : payload.deploymentStrategy,
      jobId: finalJob.job_id,
    };
  } catch (error) {
    console.error('Generation error:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'An unexpected error occurred',
      deploymentMethod: payload.deploymentStrategy,
    };
  }
}

export async function checkHealth(): Promise<boolean> {
  try {
    const response = await apiFetch(`${API_BASE_URL}/health`, {
      signal: AbortSignal.timeout(5000),
      headers: { Accept: 'application/json' },
    });
    if (!response.ok) return false;
    const data = await safeJsonResponse<{ status?: string }>(response);
    return data?.status === 'ok';
  } catch {
    return false;
  }
}

export async function deleteJob(jobId: string): Promise<void> {
  const response = await apiFetch(`${API_BASE_URL}/job/${jobId}`, {
    method: "DELETE",
    headers: { Accept: "application/json" },
  });
  if (!response.ok) {
    const errorData = await safeJsonResponse<ApiErrorBody>(response).catch(() => ({} as ApiErrorBody));
    throw apiError(response.status, errorData, `Delete failed: ${response.statusText}`);
  }
}

export interface UsageProviderStat {
  requests: number;
  success: number;
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
}

export interface UsageModelStat extends UsageProviderStat {
  provider?: string | null;
}

export interface UsageDailyStat {
  date: string;
  requests: number;
  success: number;
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
  providers: Record<string, UsageProviderStat>;
  models: Record<string, UsageProviderStat>;
}

export interface UsageTotals {
  requests: number;
  success: number;
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
  providers: Record<string, UsageProviderStat>;
  models: Record<string, UsageProviderStat>;
}

export interface QuotaStatus {
  model_name: string;
  current_usage: number;
  limit: number;
  unit: 'Requests' | 'Tokens';
  percent_used: number;
}

export interface ModelIntelligence {
  model_name: string;
  today_usage: number;
  success_rate: number;
  remaining_quota: number;
  unit: 'Requests' | 'Tokens';
  percent_used: number;
  /** Requests made in the selected window (for card ranking by usage). */
  requests?: number;
  /** Total tokens consumed in the selected window. */
  total_tokens?: number;
  /** Today-only request count. */
  today_requests?: number;
  /** Today-only token count. */
  today_tokens?: number;
  /** Today-only success rate. */
  today_success_rate?: number;
  /** Today-only usage against the plain daily limit. */
  today_remaining_quota?: number;
  today_percent_used?: number;
}

export interface UsageStatsResponse {
  success: boolean;
  days: number;
  model?: string | null;
  /** 'global' when an admin requested include_all=true, otherwise 'personal'. */
  scope?: 'global' | 'personal';
  /** Quota-tracked models with today's usage for the Model Intelligence Cards. */
  models: ModelIntelligence[];
  /** Distinct model names seen in the window (for the filter dropdown). */
  model_names: string[];
  models_breakdown: Record<string, UsageModelStat>;
  quota_status: QuotaStatus[];
  daily: UsageDailyStat[];
  totals: UsageTotals;
}

export async function fetchUsageStats(
  days = 30,
  model?: string | null,
  options?: { includeAll?: boolean },
): Promise<UsageStatsResponse> {
  const params = new URLSearchParams({ days: String(days) });
  if (model) params.set('model', model);
  // The backend only honours include_all for admin callers anyway, so a regular
  // user can never read global usage even if the flag is passed.
  const includeAll = options?.includeAll ?? isAdmin();
  if (includeAll) params.set('include_all', 'true');

  const response = await apiFetch(`${API_BASE_URL}/api/stats/usage?${params.toString()}`, {
    headers: { Accept: 'application/json' },
  });

  if (!response.ok) {
    const errorData = await safeJsonResponse<ApiErrorBody>(response).catch(() => ({} as ApiErrorBody));
    throw apiError(response.status, errorData, `Failed to fetch usage stats: ${response.statusText}`);
  }

  return safeJsonResponse<UsageStatsResponse>(response);
}

export interface ClearTestDataResponse {
  success: boolean;
  deleted: number;
  provider: string;
}

export async function clearTestUsageData(provider = 'test_usage_tracking'): Promise<ClearTestDataResponse> {
  const params = new URLSearchParams({ provider });
  const response = await apiFetch(`${API_BASE_URL}/api/stats/usage/test-data?${params.toString()}`, {
    method: 'DELETE',
    headers: { Accept: 'application/json' },
  });

  if (!response.ok) {
    const errorData = await safeJsonResponse<ApiErrorBody>(response).catch(() => ({} as ApiErrorBody));
    throw apiError(response.status, errorData, `Failed to clear test data: ${response.statusText}`);
  }

  return safeJsonResponse<ClearTestDataResponse>(response);
}
