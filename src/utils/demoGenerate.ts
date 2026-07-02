import { DEMO_MODULE_CONFIG, schemaFromRawConfig } from '../data/demoModuleConfig';
import type { GeneratorPayload } from '../services/api';
import { deriveModuleName } from './promptValidation';

function basePayload(
  moduleName: string,
  description: string,
  extra?: Partial<GeneratorPayload>,
): GeneratorPayload {
  return {
    moduleName,
    description,
    version: '17.0',
    author: 'Coregen',
    category: 'Tools',
    depends: ['base'],
    features: [],
    models: [],
    deploymentStrategy: 'local_zip',
    ...extra,
  };
}

export function buildDemoPayload(): GeneratorPayload {
  const config = DEMO_MODULE_CONFIG;
  return basePayload(
    config.modules[0].module_name,
    config.modules[0].module_description || 'Demo gym module',
    { rawConfig: { modules: [...DEMO_MODULE_CONFIG.modules] } },
  );
}

/**
 * Supports two JSON formats:
 * 1. { "prompt": "..." }  → AI analyze (needs API keys)
 * 2. { "modules": [...] } → direct generate (no AI)
 */
export function buildPayloadFromJson(jsonText: string): GeneratorPayload | null {
  try {
    const parsed = JSON.parse(jsonText.trim()) as Record<string, unknown>;
    if (!parsed || typeof parsed !== 'object') return null;

    // Old format: { "prompt": "Gym module: ..." }
    if (typeof parsed.prompt === 'string' && parsed.prompt.trim()) {
      const promptText = parsed.prompt.trim();
      const deploy =
        parsed.git_deploy_target === 'github' ? 'github' as const : 'local_zip' as const;
      return basePayload(deriveModuleName(promptText), promptText, {
        aiPrompt: promptText,
        deploymentStrategy: deploy,
      });
    }

    // Full config: { "modules": [...] }
    const modules = parsed.modules;
    if (Array.isArray(modules) && modules.length > 0) {
      const first = modules[0] as { module_name?: string; module_description?: string; git_deploy_target?: string };
      const deploy =
        first.git_deploy_target === 'github' ? 'github' as const : 'local_zip' as const;
      return basePayload(
        first.module_name || 'custom_module',
        first.module_description || jsonText.trim(),
        { rawConfig: { modules }, deploymentStrategy: deploy },
      );
    }

    return null;
  } catch {
    return null;
  }
}

export { DEMO_MODULE_CONFIG, schemaFromRawConfig };
export type { RawModuleConfig } from '../data/demoModuleConfig';
