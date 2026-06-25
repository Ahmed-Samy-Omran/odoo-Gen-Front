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

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export async function generateModule(payload: GeneratorPayload): Promise<GenerationResult> {
  try {
    // Basic validation before sending
    if (!payload?.moduleName) {
      throw new Error('Module name is required');
    }

    const response = await fetch(`${API_BASE_URL}/api/generate`, {
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
    return {
      success: data?.success ?? true,
      message: data?.message ?? 'Success',
      files: Array.isArray(data?.files) ? data.files : [],
      downloadUrl: data?.downloadUrl ?? data?.download_url ?? null,
      repositoryUrl: data?.repositoryUrl ?? data?.repository_url ?? payload.repositoryUrl,
      deploymentMethod: data?.deploymentMethod ?? payload.deploymentStrategy
    };
  } catch (error) {
    console.error('Generation error:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'An unexpected error occurred',
      deploymentMethod: payload.deploymentStrategy
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
