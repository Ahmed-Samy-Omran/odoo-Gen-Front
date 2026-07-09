import type { Node, Edge } from '@xyflow/react';

export interface SchemaField {
  name: string;
  type: string;
  required: boolean;
  relation?: string | null;
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

export function generateErdFromSchema(schema: SchemaPreview): { nodes: Node[]; edges: Edge[] } {
  const nodes: Node[] = [];
  const edges: Edge[] = [];

  const cols = Math.max(2, Math.ceil(Math.sqrt(schema.models.length)));
  const xGap = 380;
  const yGap = 320;

  schema.models.forEach((model, index) => {
    const col = index % cols;
    const row = Math.floor(index / cols);
    const savedPosition = schema.positions?.[model.name];

    nodes.push({
      id: model.name,
      type: 'tableNode',
      position: savedPosition ?? { x: 80 + col * xGap, y: 60 + row * yGap },
      data: {
        label: model.name,
        modelName: model.name,
        moduleName: model.module_name,
        fields: model.fields,
      },
    });
  });

  const nodeIds = new Set(nodes.map((n) => n.id));

  nodes.forEach((node) => {
    const fields = (node.data.fields as SchemaField[]) || [];
    fields.forEach((field) => {
      if (!field.relation || !nodeIds.has(field.relation) || field.relation === node.id) {
        return;
      }
      const lowerType = (field.type || '').toLowerCase();
      edges.push({
        id: `e-${node.id}-${field.name}-${field.relation}`,
        source: node.id,
        sourceHandle: `${field.name}-source`,
        target: field.relation,
        targetHandle: 'id-target',
        type: 'customEdge',
        animated: true,
        label: lowerType === 'one2one' ? '1:1' : lowerType === 'one2many' ? '1..N' : lowerType === 'many2one' ? 'N..1' : 'relation',
        style: { stroke: 'rgba(120, 180, 255, 0.25)', strokeWidth: 2 },
        data: {
          relationType: lowerType,
          sourceFieldName: field.name,
        },
      });
    });
  });

  return { nodes, edges };
}

export interface GroupedUseCase {
  id: string;
  label: string;
  actor: string;
  actions: string[];
  model?: string;
}

export function groupUseCasesForDisplay(useCases: SchemaUseCase[]): {
  grouped: GroupedUseCase[];
  standalone: SchemaUseCase[];
} {
  const byModel = new Map<string, GroupedUseCase>();
  const standalone: SchemaUseCase[] = [];

  for (const uc of useCases) {
    const match = uc.name.match(/^(Create|View|Edit|Delete)\s+(.+)$/i);
    if (match && uc.model) {
      const modelName = match[2];
      if (!byModel.has(uc.model)) {
        byModel.set(uc.model, {
          id: uc.model,
          label: modelName,
          actor: uc.actor,
          actions: [],
          model: uc.model,
        });
      }
      const group = byModel.get(uc.model)!;
      if (!group.actions.includes(match[1])) {
        group.actions.push(match[1]);
      }
    } else {
      standalone.push(uc);
    }
  }

  const actionOrder = ['Create', 'View', 'Edit', 'Delete'];
  const grouped = Array.from(byModel.values()).map((g) => ({
    ...g,
    actions: g.actions.sort(
      (a, b) => actionOrder.indexOf(a) - actionOrder.indexOf(b),
    ),
  }));

  return { grouped, standalone };
}

export function buildCrudUseCases(modelName: string): SchemaUseCase[] {
  return [
    { name: `Create ${modelName}`, actor: 'User', model: modelName },
    { name: `View ${modelName}`, actor: 'User', model: modelName },
    { name: `Edit ${modelName}`, actor: 'User', model: modelName },
    { name: `Delete ${modelName}`, actor: 'Administrator', model: modelName },
  ];
}

export function actorForMenu(menu: { name: string; parent_xml_id?: string | null }): string {
  return menu.parent_xml_id ? 'User' : 'Administrator';
}

export function buildSchemaFromPayload(
  moduleName: string,
  models: { name: string; fields: { name: string; type: string; required: boolean }[] }[],
): SchemaPreview {
  const schemaModels: SchemaModel[] = models.map((m) => ({
    name: m.name,
    module_name: moduleName,
    fields: m.fields.map((f) => ({
      name: f.name,
      type: f.type,
      required: f.required,
    })),
  }));

  const use_cases: SchemaUseCase[] = [];
  for (const model of schemaModels) {
    use_cases.push(...buildCrudUseCases(model.name));
  }

  return {
    module_name: moduleName,
    models: schemaModels,
    actors: ['User', 'Administrator'],
    use_cases,
  };
}
