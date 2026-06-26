const API_BASE_URL = 'http://127.0.0.1:8000';

export interface SelectionOption {
  value: string;
  label: string;
}

export interface FieldDefinition {
  name: string;
  type: string;
  required: boolean;
  indexed: boolean;
  relation?: string;
  is_compute?: boolean;
  compute_code?: string;
  depends_fields?: string[];
  selection_options?: SelectionOption[];
  help?: string;
  default_value?: string;
}

export interface ViewConfig {
  type: 'tree' | 'form' | 'kanban' | 'calendar' | 'dashboard' | 'search';
  enabled: boolean;
  priority?: number;
  custom_arch?: string;
}

export interface QWebReport {
  name: string;
  report_name: string;
  report_type: 'qweb-pdf' | 'qweb-html';
  model: string;
  menu_item?: boolean;
  print_button?: boolean;
}

export interface AccessRule {
  group_id: string;
  perm_read: boolean;
  perm_write: boolean;
  perm_create: boolean;
  perm_unlink: boolean;
}

export interface UserGroup {
  name: string;
  category: string;
  implied_groups?: string[];
  users?: string[];
}

export interface ModelDefinition {
  name: string;
  module: string;
  fields: FieldDefinition[];
  description?: string;
  views?: ViewConfig[];
  reports?: QWebReport[];
  access_rules?: AccessRule[];
  constraints?: string[];
  sql_constraints?: string[];
}

export interface ModuleDefinition {
  name: string;
  technical_name: string;
  description: string;
  models: ModelDefinition[];
  dependencies?: string[];
  user_groups?: UserGroup[];
  menus?: string[];
}

export interface AnalyzeResponse {
  modules: ModuleDefinition[];
  prompt: string;
  timestamp: string;
}

export type ErrorType = 'NETWORK_ERROR' | 'INVALID_JSON' | 'STORAGE_ERROR' | 'UNKNOWN_ERROR';

export interface ApiErrorResponse {
  success: false;
  error_type: ErrorType;
  message: string;
  debug_details: string;
}

export class ApiException extends Error {
  public readonly errorType: ErrorType;
  public readonly debugDetails: string;

  constructor(response: ApiErrorResponse) {
    super(response.message);
    this.name = 'ApiException';
    this.errorType = response.error_type;
    this.debugDetails = response.debug_details;
  }
}

export async function analyzeRequirements(prompt: string): Promise<AnalyzeResponse> {
  const response = await fetch(`${API_BASE_URL}/analyze-requirements/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ prompt }),
  });

  if (!response.ok) {
    try {
      const errorResponse: ApiErrorResponse = await response.json();
      throw new ApiException(errorResponse);
    } catch (e) {
      if (e instanceof ApiException) {
        throw e;
      }
      throw new ApiException({
        success: false,
        error_type: 'UNKNOWN_ERROR',
        message: `Server error (${response.status}). Please try again.`,
        debug_details: `HTTP ${response.status}: Failed to parse error response`,
      });
    }
  }

  return response.json();
}

export const mockAnalyzeResponse: AnalyzeResponse = {
  modules: [
    {
      name: 'Gym Core',
      technical_name: 'gym_core',
      description: 'Core module for gym management containing member and trainer models',
      models: [
        {
          name: 'gym.member',
          module: 'gym_core',
          description: 'Gym member model',
          fields: [
            { name: 'id', type: 'Integer', required: true, indexed: true },
            { name: 'name', type: 'Char', required: true, indexed: false },
            { name: 'email', type: 'Char', required: true, indexed: true },
            { name: 'phone', type: 'Char', required: false, indexed: false },
            { name: 'trainer_id', type: 'Many2one', required: false, indexed: false, relation: 'gym.trainer' },
            { name: 'membership_start', type: 'Date', required: false, indexed: false },
            { name: 'membership_end', type: 'Date', required: false, indexed: false },
            { name: 'active', type: 'Boolean', required: false, indexed: false },
            {
              name: 'membership_days',
              type: 'Integer',
              required: false,
              indexed: false,
              is_compute: true,
              compute_code: 'for record in self:\n    if record.membership_start and record.membership_end:\n        record.membership_days = (record.membership_end - record.membership_start).days',
              depends_fields: ['membership_start', 'membership_end']
            },
            {
              name: 'status',
              type: 'Selection',
              required: true,
              indexed: false,
              selection_options: [
                { value: 'active', label: 'Active' },
                { value: 'expired', label: 'Expired' },
                { value: 'pending', label: 'Pending' },
              ]
            },
          ],
          views: [
            { type: 'tree', enabled: true, priority: 1 },
            { type: 'form', enabled: true, priority: 1 },
            { type: 'kanban', enabled: true, priority: 2 },
            { type: 'calendar', enabled: true, priority: 3 },
            { type: 'search', enabled: true, priority: 1 },
          ],
          reports: [
            { name: 'Member Card', report_name: 'gym_core.report_member_card', report_type: 'qweb-pdf', model: 'gym.member', print_button: true },
          ],
          access_rules: [
            { group_id: 'gym_core.group_gym_user', perm_read: true, perm_write: false, perm_create: false, perm_unlink: false },
            { group_id: 'gym_core.group_gym_manager', perm_read: true, perm_write: true, perm_create: true, perm_unlink: true },
          ],
        },
        {
          name: 'gym.trainer',
          module: 'gym_core',
          description: 'Gym trainer model',
          fields: [
            { name: 'id', type: 'Integer', required: true, indexed: true },
            { name: 'name', type: 'Char', required: true, indexed: false },
            { name: 'email', type: 'Char', required: true, indexed: true },
            { name: 'phone', type: 'Char', required: false, indexed: false },
            { name: 'specialization', type: 'Char', required: false, indexed: false },
            { name: 'hire_date', type: 'Date', required: false, indexed: false },
            { name: 'active', type: 'Boolean', required: false, indexed: false },
          ],
          views: [
            { type: 'tree', enabled: true, priority: 1 },
            { type: 'form', enabled: true, priority: 1 },
            { type: 'kanban', enabled: false, priority: 2 },
          ],
          access_rules: [
            { group_id: 'gym_core.group_gym_user', perm_read: true, perm_write: false, perm_create: false, perm_unlink: false },
            { group_id: 'gym_core.group_gym_manager', perm_read: true, perm_write: true, perm_create: true, perm_unlink: true },
          ],
        },
      ],
      user_groups: [
        { name: 'Gym User', category: 'Gym Management', implied_groups: [] },
        { name: 'Gym Manager', category: 'Gym Management', implied_groups: ['gym_core.group_gym_user'] },
        { name: 'Gym Administrator', category: 'Gym Management', implied_groups: ['gym_core.group_gym_manager'] },
      ],
      dependencies: ['base'],
    },
    {
      name: 'Gym Shop',
      technical_name: 'gym_shop',
      description: 'Shop module for gym products and orders',
      models: [
        {
          name: 'gym.product',
          module: 'gym_shop',
          description: 'Gym product model',
          fields: [
            { name: 'id', type: 'Integer', required: true, indexed: true },
            { name: 'name', type: 'Char', required: true, indexed: false },
            { name: 'price', type: 'Float', required: true, indexed: false },
            { name: 'category', type: 'Selection', required: false, indexed: false, selection_options: [
              { value: 'supplements', label: 'Supplements' },
              { value: 'equipment', label: 'Equipment' },
              { value: 'apparel', label: 'Apparel' },
              { value: 'accessories', label: 'Accessories' },
            ]},
            { name: 'stock', type: 'Integer', required: false, indexed: false },
          ],
          views: [
            { type: 'tree', enabled: true, priority: 1 },
            { type: 'form', enabled: true, priority: 1 },
            { type: 'kanban', enabled: true, priority: 2 },
          ],
        },
        {
          name: 'gym.order',
          module: 'gym_shop',
          description: 'Gym order model',
          fields: [
            { name: 'id', type: 'Integer', required: true, indexed: true },
            { name: 'member_id', type: 'Many2one', required: true, indexed: false, relation: 'gym.member' },
            { name: 'product_id', type: 'Many2one', required: true, indexed: false, relation: 'gym.product' },
            { name: 'quantity', type: 'Integer', required: true, indexed: false },
            { name: 'total', type: 'Float', required: false, indexed: false, is_compute: true, compute_code: 'for record in self:\n    if record.product_id and record.quantity:\n        record.total = record.product_id.price * record.quantity', depends_fields: ['product_id', 'quantity'] },
            { name: 'order_date', type: 'Date', required: false, indexed: true },
            { name: 'state', type: 'Selection', required: true, indexed: false, selection_options: [
              { value: 'draft', label: 'Draft' },
              { value: 'confirmed', label: 'Confirmed' },
              { value: 'shipped', label: 'Shipped' },
              { value: 'delivered', label: 'Delivered' },
              { value: 'cancelled', label: 'Cancelled' },
            ]},
          ],
          views: [
            { type: 'tree', enabled: true, priority: 1 },
            { type: 'form', enabled: true, priority: 1 },
            { type: 'calendar', enabled: true, priority: 2, custom_arch: '<calendar date_start="order_date" color="member_id">' },
          ],
          reports: [
            { name: 'Invoice', report_name: 'gym_shop.report_order_invoice', report_type: 'qweb-pdf', model: 'gym.order', print_button: true },
          ],
        },
      ],
      dependencies: ['base', 'gym_core'],
    },
  ],
  prompt: 'Create a gym management system',
  timestamp: new Date().toISOString(),
};

export const ODOO_SYNTAX_RULES = `
# Critical Odoo Syntax Rules for AI Generation

## Compute Fields
- Always use @api.depends decorator before compute method
- Syntax: @api.depends('field1', 'field2')
- Compute method must use 'for record in self' pattern for multi-record support
- Compute fields should be stored=False unless store=True is explicitly needed
- Example:
  @api.depends('start_date', 'end_date')
  def _compute_duration(self):
      for record in self:
          if record.start_date and record.end_date:
              record.duration = (record.end_date - record.start_date).days
          else:
              record.duration = 0

## Selection Fields
- Selection options MUST be provided as list of tuples: [(value, label), ...]
- Or as list of objects with value/label: [{value: '', label: ''}, ...]
- Example: selection=[('draft', 'Draft'), ('done', 'Done')]
- Always include a default value for required selection fields

## Relations
- Many2one: comodel_name='model.name' (required)
- One2many: comodel_name='model.name', inverse_name='field_name'
- Many2many: comodel_name='model.name', relation='table_name', column1='id1', column2='id2'

## Views
- Tree views: mandatory for every model
- Form views: mandatory for every model
- Kanban views: optional, requires kanban_state field for stages
- Calendar views: require date_start field, optional date_stop
- Search views: define filters for tree view filtering

## Security (ir.model.access.csv)
- Format: id,name,model_id:id,group_id:id,perm_read,perm_write,perm_create,perm_unlink
- Use base.group_user for internal users
- Create custom groups for role-based access
- Always define access for each model-group combination

## QWeb Reports
- Report template inherits from report layout
- Use report_type="qweb-pdf" or "qweb-html"
- Bind to model via model attribute
- Add print button in form view: <button name="%(report_id)d" type="action" string="Print" />

## Python Constraints
- Use @api.constrains for field-level validation
- Use _sql_constraints for database-level unique checks
- Raise ValidationError with user-friendly message

## Model Naming
- Use dot notation: module.model_name (e.g., gym.member)
- Technical names must be lowercase with underscores
- Description field provides human-readable name
`;

export const SYSTEM_PROMPT = `You are an expert Odoo developer and architect. When analyzing requirements to generate Odoo module structures, strictly follow these Odoo syntax rules:

${ODOO_SYNTAX_RULES}

IMPORTANT:
1. For any Selection field, ALWAYS include selection_options as an array of {value, label} objects
2. For compute fields, ALWAYS include is_compute=true, compute_code with valid Python code, and depends_fields listing dependencies
3. Include views array with at minimum tree, form, and search views enabled
4. Include user_groups for each module with proper role hierarchy
5. Include access_rules for each model mapping groups to permissions
6. Add reports array if the model needs printable documents

Return the response in the exact JSON schema format expected by the frontend.`;
