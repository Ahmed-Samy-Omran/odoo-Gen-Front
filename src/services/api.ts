export interface GeneratorPayload {
  moduleName: string;
  description: string;
  version: string;
  author: string;
  category: string;
  depends: string[];
  features: string[];
  models: ModelDefinition[];
  deploymentStrategy: 'github' | 'local_zip';
  repositoryUrl?: string;
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
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface ChatResponse {
  reply: string;
  ready_to_generate: boolean;
  requirements_summary: string;
}

export type ProgressCallback = (status: JobStatus) => void;

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
const POLL_INTERVAL_MS = 2500;

const ZIP_RESPONSE_ERROR =
  'Backend returned a ZIP file instead of a job ID. Restart the backend (main.py) so it uses the async job API.';

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
  const lines: string[] = [
    `Create an Odoo ${payload.version} module named "${payload.moduleName}".`,
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
  return {
    modules: [
      {
        module_name: payload.moduleName,
        module_description: payload.description,
        depends: payload.depends,
        git_deploy_target: payload.deploymentStrategy,
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

export async function sendChatMessage(messages: ChatMessage[]): Promise<ChatResponse> {
  const response = await fetch(`${API_BASE_URL}/chat/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({ messages }),
  });

  if (!response.ok) {
    const errorData = await safeJsonResponse<{ detail?: string }>(response).catch(() => ({}));
    throw new Error(errorData?.detail || `Chat failed: ${response.statusText}`);
  }

  return safeJsonResponse<ChatResponse>(response);
}

async function startPromptJob(prompt: string): Promise<JobStatus> {
  const response = await fetch(`${API_BASE_URL}/analyze-requirements/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({ prompt }),
  });

  if (!response.ok) {
    const errorData = await safeJsonResponse<Record<string, string>>(response).catch(() => ({}));
    throw new Error(errorData?.detail || errorData?.message || `Request failed: ${response.statusText}`);
  }

  return safeJsonResponse<JobStatus>(response);
}

async function startConfigJob(payload: GeneratorPayload): Promise<JobStatus> {
  const response = await fetch(`${API_BASE_URL}/generate-module/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(toBackendPayload(payload)),
  });

  if (!response.ok) {
    const errorData = await safeJsonResponse<Record<string, string>>(response).catch(() => ({}));
    throw new Error(errorData?.detail || errorData?.message || `Request failed: ${response.statusText}`);
  }

  return safeJsonResponse<JobStatus>(response);
}

export async function pollJob(jobId: string): Promise<JobStatus> {
  const response = await fetch(`${API_BASE_URL}/job/${jobId}`, {
    headers: { Accept: 'application/json' },
  });
  if (!response.ok) {
    const errorData = await safeJsonResponse<Record<string, string>>(response).catch(() => ({}));
    throw new Error(errorData?.detail || `Polling failed: ${response.statusText}`);
  }
  return safeJsonResponse<JobStatus>(response);
}

export async function fetchJobFiles(jobId: string): Promise<GeneratedFile[]> {
  const response = await fetch(`${API_BASE_URL}/job/${jobId}/files`, {
    headers: { Accept: 'application/json' },
  });
  if (!response.ok) {
    const errorData = await safeJsonResponse<Record<string, string>>(response).catch(() => ({}));
    throw new Error(errorData?.detail || `Failed to fetch files: ${response.statusText}`);
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
      throw new Error(status.error || 'Generation failed');
    }

    await sleep(POLL_INTERVAL_MS);
  }
}

export async function generateModule(
  payload: GeneratorPayload,
  onProgress?: ProgressCallback,
): Promise<GenerationResult> {
  try {
    if (!payload?.moduleName) {
      throw new Error('Module name is required');
    }

    const hasStructuredModels = payload.models?.some((m) => m.fields?.length > 0);
    const initialJob = hasStructuredModels
      ? await startConfigJob(payload)
      : await startPromptJob(buildPrompt(payload));

    onProgress?.(initialJob);

    const finalJob = await waitForJob(initialJob.job_id, onProgress);
    const files = await fetchJobFiles(finalJob.job_id);

    const downloadUrl = finalJob.download_url
      ? `${API_BASE_URL}${finalJob.download_url}`
      : undefined;

    return {
      success: true,
      message: finalJob.message || 'Generation successful',
      files,
      downloadUrl,
      repositoryUrl: finalJob.github_url || payload.repositoryUrl,
      deploymentMethod: finalJob.github_url ? 'github' : payload.deploymentStrategy,
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
    const response = await fetch(`${API_BASE_URL}/health`, {
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
