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
    const response = await fetch(`${API_BASE_URL}/api/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`Generation failed: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Generation error:', error);
    throw error;
  }
}

export async function checkHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/health`);
    return response.ok;
  } catch {
    return false;
  }
}
