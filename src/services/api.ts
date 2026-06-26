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

export interface JobStatus {
  job_id: string;
  status: 'pending' | 'running' | 'done' | 'error';
  progress: number;
  message: string;
  elapsed_sec: number;
  estimated_remaining_sec?: number;
  downloadUrl?: string;
  githubUrl?: string;
  error?: string;
  generated_files?: GeneratedFile[];
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

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export async function createGenerationJob(payload: GeneratorPayload): Promise<JobStatus> {
  try {
    // Basic validation before sending
    if (!payload?.moduleName) {
      throw new Error('Module name is required');
    }

    const response = await fetch(`${API_BASE_URL}/generate-module/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData?.message || `Generation failed: ${response.statusText}`);
    }

    const data = await response.json();
    
    // Ensure the response matches the expected structure
    return data as JobStatus;
  } catch (error) {
    console.error('Generation error:', error);
    return {
      job_id: 'error',
      status: 'error',
      progress: 0,
      message: error instanceof Error ? error.message : 'An unexpected error occurred',
      elapsed_sec: 0,
    };
  }
}

export async function getJobStatus(jobId: string): Promise<JobStatus> {
  try {
    const response = await fetch(`${API_BASE_URL}/job/${jobId}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch job status: ${response.statusText}`);
    }
    const data = await response.json();
    return data as JobStatus;
  } catch (error) {
    console.error(`Error fetching job status for ${jobId}:`, error);
    return {
      job_id: jobId,
      status: 'error',
      progress: 0,
      message: error instanceof Error ? error.message : 'An unexpected error occurred',
      elapsed_sec: 0,
    };
  }
}

export async function checkHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/health`, { signal: AbortSignal.timeout(5000) });
    return response.ok;
  } catch {
    return false;
  }
}
