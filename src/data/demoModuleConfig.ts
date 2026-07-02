/** Ready-to-use module config — no AI required. POST directly to /generate-module/ */
import { buildCrudUseCases, actorForMenu } from '../utils/diagramBuilder';

export const DEMO_MODULE_CONFIG = {
  modules: [
    {
      module_name: 'fitzone',
      module_description: 'Gym management demo module',
      depends: ['base'],
      git_deploy_target: 'local_zip',
      models: [
        {
          name: 'fitzone.member',
          description: 'Gym Member',
          rec_name: 'name',
          fields: [
            { name: 'name', type: 'char', label: 'Full Name', required: true },
            { name: 'phone', type: 'char', label: 'Phone' },
            { name: 'email', type: 'char', label: 'Email' },
            {
              name: 'plan_id',
              type: 'many2one',
              label: 'Subscription Plan',
              relation: 'fitzone.plan',
            },
            {
              name: 'membership_ids',
              type: 'one2many',
              label: 'Memberships',
              relation: 'fitzone.membership',
              inverse_name: 'member_id',
            },
          ],
          tree_view_fields: ['name', 'phone', 'plan_id'],
          form_view_fields: ['name', 'phone', 'email', 'plan_id'],
        },
        {
          name: 'fitzone.plan',
          description: 'Subscription Plan',
          rec_name: 'name',
          fields: [
            { name: 'name', type: 'char', label: 'Plan Name', required: true },
            { name: 'price', type: 'float', label: 'Price' },
            { name: 'duration_days', type: 'integer', label: 'Duration (days)' },
          ],
          tree_view_fields: ['name', 'price', 'duration_days'],
          form_view_fields: ['name', 'price', 'duration_days'],
        },
        {
          name: 'fitzone.membership',
          description: 'Member Subscription',
          rec_name: 'name',
          fields: [
            { name: 'name', type: 'char', label: 'Reference', required: true },
            {
              name: 'member_id',
              type: 'many2one',
              label: 'Member',
              relation: 'fitzone.member',
              required: true,
            },
            {
              name: 'plan_id',
              type: 'many2one',
              label: 'Plan',
              relation: 'fitzone.plan',
              required: true,
            },
            { name: 'start_date', type: 'date', label: 'Start Date' },
            { name: 'end_date', type: 'date', label: 'End Date' },
            {
              name: 'state',
              type: 'selection',
              label: 'Status',
              selection_options: [
                ['active', 'Active'],
                ['expired', 'Expired'],
                ['cancelled', 'Cancelled'],
              ],
            },
          ],
          tree_view_fields: ['name', 'member_id', 'plan_id', 'state'],
          form_view_fields: ['name', 'member_id', 'plan_id', 'start_date', 'end_date', 'state'],
        },
      ],
      actions: [
        {
          name: 'Members',
          res_model: 'fitzone.member',
          view_mode: 'tree,form',
          help_text: 'Manage gym members',
        },
        {
          name: 'Plans',
          res_model: 'fitzone.plan',
          view_mode: 'tree,form',
        },
      ],
      menus: [
        { name: 'FitZone', sequence: 10 },
        {
          name: 'Members',
          parent_xml_id: 'fitzone.menu_fitzone',
          action_xml_id: 'fitzone.members_action',
          sequence: 10,
        },
        {
          name: 'Plans',
          parent_xml_id: 'fitzone.menu_fitzone',
          action_xml_id: 'fitzone.plans_action',
          sequence: 20,
        },
      ],
    },
  ],
};

export type RawModuleConfig = typeof DEMO_MODULE_CONFIG;

export function isRawModuleConfig(value: unknown): value is RawModuleConfig {
  if (!value || typeof value !== 'object') return false;
  const modules = (value as { modules?: unknown }).modules;
  return Array.isArray(modules) && modules.length > 0 && typeof modules[0] === 'object';
}

export function schemaFromRawConfig(config: RawModuleConfig) {
  const mod = config.modules[0];
  const models = mod.models.map((m) => ({
    name: m.name,
    module_name: mod.module_name,
    description: m.description,
    fields: m.fields.map((f) => ({
      name: f.name,
      type: f.type,
      required: Boolean('required' in f && f.required),
      relation: 'relation' in f ? (f as { relation?: string }).relation : undefined,
    })),
  }));

  const use_cases: { name: string; actor: string; model?: string }[] = [];
  for (const model of models) {
    use_cases.push(...buildCrudUseCases(model.name));
  }
  for (const menu of mod.menus || []) {
    use_cases.push({ name: menu.name, actor: actorForMenu(menu) });
  }

  return {
    module_name: mod.module_name,
    models,
    actors: ['User', 'Administrator'],
    use_cases,
  };
}
