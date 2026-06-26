import React, { useState } from 'react';
import {
  X,
  Eye,
  FileText,
  Shield,
  Users,
  Plus,
  Trash2,
  ChevronDown,
  ChevronRight,
  Printer,
  LayoutGrid,
  Calendar,
  List,
  Search,
  ToggleLeft,
  ToggleRight,
} from 'lucide-react';
import { ViewConfig, QWebReport, AccessRule, UserGroup } from '../services/api';

interface ModelSettingsPanelProps {
  isOpen: boolean;
  modelName: string | null;
  moduleName: string | null;
  views: ViewConfig[];
  reports: QWebReport[];
  accessRules: AccessRule[];
  userGroups: UserGroup[];
  onClose: () => void;
  onUpdateViews: (views: ViewConfig[]) => void;
  onUpdateReports: (reports: QWebReport[]) => void;
  onUpdateAccessRules: (rules: AccessRule[]) => void;
  onUpdateUserGroups: (groups: UserGroup[]) => void;
}

type ActiveTab = 'views' | 'reports' | 'security';

const viewIcons: Record<string, React.ReactNode> = {
  tree: <List className="w-4 h-4" />,
  form: <FileText className="w-4 h-4" />,
  kanban: <LayoutGrid className="w-4 h-4" />,
  calendar: <Calendar className="w-4 h-4" />,
  dashboard: <Eye className="w-4 h-4" />,
  search: <Search className="w-4 h-4" />,
};

const ModelSettingsPanel: React.FC<ModelSettingsPanelProps> = ({
  isOpen,
  modelName,
  moduleName,
  views,
  reports,
  accessRules,
  userGroups,
  onClose,
  onUpdateViews,
  onUpdateReports,
  onUpdateAccessRules,
  onUpdateUserGroups,
}) => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('views');
  const [expandedViewType, setExpandedViewType] = useState<string | null>(null);

  if (!isOpen || !modelName) return null;

  const getViewByType = (type: string) => views.find((v) => v.type === type);

  const handleToggleView = (type: ViewConfig['type']) => {
    const existingIndex = views.findIndex((v) => v.type === type);
    if (existingIndex >= 0) {
      const updatedViews = views.map((v, i) =>
        i === existingIndex ? { ...v, enabled: !v.enabled } : v
      );
      onUpdateViews(updatedViews);
    } else {
      onUpdateViews([...views, { type, enabled: true, priority: views.length + 1 }]);
    }
  };

  const handleUpdateViewPriority = (type: string, priority: number) => {
    const updatedViews = views.map((v) =>
      v.type === type ? { ...v, priority } : v
    );
    onUpdateViews(updatedViews);
  };

  const handleUpdateViewArch = (type: string, custom_arch: string) => {
    const updatedViews = views.map((v) =>
      v.type === type ? { ...v, custom_arch } : v
    );
    onUpdateViews(updatedViews);
  };

  const handleAddReport = () => {
    const newReport: QWebReport = {
      name: 'New Report',
      report_name: `${moduleName || 'module'}.report_name`,
      report_type: 'qweb-pdf',
      model: modelName,
      menu_item: false,
      print_button: true,
    };
    onUpdateReports([...reports, newReport]);
  };

  const handleUpdateReport = (index: number, updates: Partial<QWebReport>) => {
    const updated = reports.map((r, i) => (i === index ? { ...r, ...updates } : r));
    onUpdateReports(updated);
  };

  const handleRemoveReport = (index: number) => {
    onUpdateReports(reports.filter((_, i) => i !== index));
  };

  const handleAddAccessRule = () => {
    const newRule: AccessRule = {
      group_id: 'base.group_user',
      perm_read: true,
      perm_write: false,
      perm_create: false,
      perm_unlink: false,
    };
    onUpdateAccessRules([...accessRules, newRule]);
  };

  const handleUpdateAccessRule = (index: number, updates: Partial<AccessRule>) => {
    const updated = accessRules.map((r, i) => (i === index ? { ...r, ...updates } : r));
    onUpdateAccessRules(updated);
  };

  const handleRemoveAccessRule = (index: number) => {
    onUpdateAccessRules(accessRules.filter((_, i) => i !== index));
  };

  const handleAddUserGroup = () => {
    const newGroup: UserGroup = {
      name: 'New Group',
      category: moduleName || 'Module',
      implied_groups: [],
    };
    onUpdateUserGroups([...userGroups, newGroup]);
  };

  const handleUpdateUserGroup = (index: number, updates: Partial<UserGroup>) => {
    const updated = userGroups.map((g, i) => (i === index ? { ...g, ...updates } : g));
    onUpdateUserGroups(updated);
  };

  const handleRemoveUserGroup = (index: number) => {
    onUpdateUserGroups(userGroups.filter((_, i) => i !== index));
  };

  const tabs: { id: ActiveTab; label: string; icon: React.ReactNode }[] = [
    { id: 'views', label: 'Views', icon: <Eye className="w-4 h-4" /> },
    { id: 'reports', label: 'Reports', icon: <Printer className="w-4 h-4" /> },
    { id: 'security', label: 'Security', icon: <Shield className="w-4 h-4" /> },
  ];

  const viewTypes: ViewConfig['type'][] = ['tree', 'form', 'kanban', 'calendar', 'dashboard', 'search'];

  return (
    <div className="fixed right-0 top-0 h-full w-[480px] glass-card border-l border-glass-border slide-in-right z-50 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-glass-border">
        <div>
          <div className="flex items-center gap-2">
            <Eye className="w-4 h-4 text-white/70" />
            <span className="text-sm font-medium text-white/90">Model Settings</span>
          </div>
          <p className="text-xs text-white/40 mt-1 font-mono">{modelName}</p>
        </div>
        <button
          onClick={onClose}
          className="w-8 h-8 rounded-lg flex items-center justify-center text-white/40 hover:text-white/80 hover:bg-white/5 transition-all"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-glass-border">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 px-4 py-3 flex items-center justify-center gap-2 text-sm transition-all ${
              activeTab === tab.id
                ? 'text-white/90 border-b-2 border-white/50 bg-white/5'
                : 'text-white/40 hover:text-white/60 hover:bg-white/[0.02]'
            }`}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Views Tab */}
        {activeTab === 'views' && (
          <div className="space-y-4">
            <p className="text-xs text-white/40 uppercase tracking-wider">Configure the views available for this model</p>

            <div className="space-y-2">
              {viewTypes.map((viewType) => {
                const view = getViewByType(viewType);
                const isEnabled = view?.enabled ?? false;
                const isExpanded = expandedViewType === viewType;
                const isOptional = ['kanban', 'calendar', 'dashboard'].includes(viewType);

                return (
                  <div
                    key={viewType}
                    className={`p-4 rounded-lg border transition-all ${
                      isEnabled
                        ? 'bg-white/[0.03] border-white/15'
                        : 'bg-white/[0.01] border-white/[0.06]'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                          isEnabled ? 'bg-white/10' : 'bg-white/5'
                        }`}>
                          {viewIcons[viewType]}
                        </div>
                        <div>
                          <p className={`text-sm font-medium capitalize ${
                            isEnabled ? 'text-white/80' : 'text-white/40'
                          }`}>
                            {viewType} View
                          </p>
                          {isOptional && (
                            <p className="text-xs text-white/25">Optional</p>
                          )}
                        </div>
                      </div>

                      <button
                        onClick={() => handleToggleView(viewType)}
                        className="toggle-switch-container"
                      >
                        {isEnabled ? (
                          <ToggleRight className="w-6 h-6 text-green-400" />
                        ) : (
                          <ToggleLeft className="w-6 h-6 text-white/30" />
                        )}
                      </button>
                    </div>

                    {isEnabled && (
                      <div className="mt-4 pt-4 border-t border-white/10 space-y-3">
                        <div className="flex items-center gap-3">
                          <label className="text-xs text-white/40 w-20">Priority:</label>
                          <input
                            type="number"
                            value={view?.priority || 1}
                            onChange={(e) => handleUpdateViewPriority(viewType, parseInt(e.target.value) || 1)}
                            className="w-20 px-3 py-1 text-sm cyber-input"
                            min="1"
                            max="100"
                          />
                        </div>

                        <button
                          onClick={() => setExpandedViewType(isExpanded ? null : viewType)}
                          className="text-xs text-white/50 hover:text-white/70 flex items-center gap-1"
                        >
                          {isExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                          Custom Architecture
                        </button>

                        {isExpanded && (
                          <textarea
                            value={view?.custom_arch || ''}
                            onChange={(e) => handleUpdateViewArch(viewType, e.target.value)}
                            placeholder={`<${viewType} string="${modelName}">...</${viewType}>`}
                            rows={4}
                            className="w-full px-3 py-2 font-mono text-xs cyber-input resize-y"
                          />
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Reports Tab */}
        {activeTab === 'reports' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-xs text-white/40 uppercase tracking-wider">QWeb Reports</p>
              <button
                onClick={handleAddReport}
                className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-white/60 hover:text-white/90 hover:border-white/20 flex items-center gap-1 text-sm transition-all"
              >
                <Plus className="w-4 h-4" />
                Add Report
              </button>
            </div>

            {/* Checkbox for QWeb report generation */}
            <div className="p-4 rounded-lg bg-blue-500/5 border border-blue-500/20">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={reports.length > 0}
                  onChange={(e) => {
                    if (e.target.checked && reports.length === 0) {
                      handleAddReport();
                    } else if (!e.target.checked) {
                      onUpdateReports([]);
                    }
                  }}
                  className="w-5 h-5 rounded border-white/20 bg-black/50 text-blue-500 focus:ring-blue-500/30"
                />
                <div>
                  <p className="text-sm text-white/70">Enable QWeb Report Generation</p>
                  <p className="text-xs text-white/40">Generate printable PDF/HTML reports for this model</p>
                </div>
              </label>
            </div>

            {/* Report list */}
            <div className="space-y-3">
              {reports.map((report, index) => (
                <div key={index} className="p-4 rounded-lg bg-white/[0.03] border border-white/10 space-y-3">
                  <div className="flex items-center justify-between">
                    <input
                      type="text"
                      value={report.name}
                      onChange={(e) => handleUpdateReport(index, { name: e.target.value })}
                      placeholder="Report Name"
                      className="flex-1 px-3 py-2 text-sm cyber-input"
                    />
                    <button
                      onClick={() => handleRemoveReport(index)}
                      className="ml-2 p-2 text-red-400/60 hover:text-red-400 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-white/40 block mb-1">Report ID</label>
                      <input
                        type="text"
                        value={report.report_name}
                        onChange={(e) => handleUpdateReport(index, { report_name: e.target.value })}
                        placeholder="module.report_name"
                        className="w-full px-3 py-2 text-xs font-mono cyber-input"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-white/40 block mb-1">Type</label>
                      <select
                        value={report.report_type}
                        onChange={(e) => handleUpdateReport(index, { report_type: e.target.value as 'qweb-pdf' | 'qweb-html' })}
                        className="w-full px-3 py-2 text-xs cyber-input cursor-pointer"
                      >
                        <option value="qweb-pdf" className="bg-black">PDF</option>
                        <option value="qweb-html" className="bg-black">HTML</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={report.print_button}
                        onChange={(e) => handleUpdateReport(index, { print_button: e.target.checked })}
                        className="w-4 h-4 rounded border-white/20 bg-black/50 text-green-500"
                      />
                      <span className="text-xs text-white/60">Print Button</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={report.menu_item}
                        onChange={(e) => handleUpdateReport(index, { menu_item: e.target.checked })}
                        className="w-4 h-4 rounded border-white/20 bg-black/50 text-green-500"
                      />
                      <span className="text-xs text-white/60">Menu Item</span>
                    </label>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Security Tab */}
        {activeTab === 'security' && (
          <div className="space-y-6">
            {/* User Groups Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-white/50" />
                  <p className="text-xs text-white/40 uppercase tracking-wider">User Groups</p>
                </div>
                <button
                  onClick={handleAddUserGroup}
                  className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-white/60 hover:text-white/90 hover:border-white/20 flex items-center gap-1 text-sm transition-all"
                >
                  <Plus className="w-4 h-4" />
                  Add Group
                </button>
              </div>

              <div className="space-y-2">
                {userGroups.map((group, index) => (
                  <div key={index} className="p-4 rounded-lg bg-white/[0.03] border border-white/10 space-y-3">
                    <div className="flex items-center gap-3">
                      <input
                        type="text"
                        value={group.name}
                        onChange={(e) => handleUpdateUserGroup(index, { name: e.target.value })}
                        placeholder="Group Name"
                        className="flex-1 px-3 py-2 text-sm cyber-input"
                      />
                      <button
                        onClick={() => handleRemoveUserGroup(index)}
                        className="p-2 text-red-400/60 hover:text-red-400 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <input
                      type="text"
                      value={group.category}
                      onChange={(e) => handleUpdateUserGroup(index, { category: e.target.value })}
                      placeholder="Category"
                      className="w-full px-3 py-2 text-xs cyber-input"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Access Rules Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-white/50" />
                  <p className="text-xs text-white/40 uppercase tracking-wider">Access Rules</p>
                </div>
                <button
                  onClick={handleAddAccessRule}
                  className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-white/60 hover:text-white/90 hover:border-white/20 flex items-center gap-1 text-sm transition-all"
                >
                  <Plus className="w-4 h-4" />
                  Add Rule
                </button>
              </div>

              <p className="text-xs text-white/30">
                Maps groups to model permissions. Format: id,name,model_id:id,group_id:id,perm_read,perm_write,perm_create,perm_unlink
              </p>

              <div className="space-y-2">
                {accessRules.map((rule, index) => (
                  <div key={index} className="p-4 rounded-lg bg-white/[0.03] border border-white/10">
                    <div className="flex items-center gap-3 mb-3">
                      <input
                        type="text"
                        value={rule.group_id}
                        onChange={(e) => handleUpdateAccessRule(index, { group_id: e.target.value })}
                        placeholder="group_id (e.g., module.group_user)"
                        className="flex-1 px-3 py-2 text-xs font-mono cyber-input"
                      />
                      <button
                        onClick={() => handleRemoveAccessRule(index)}
                        className="p-2 text-red-400/60 hover:text-red-400 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="grid grid-cols-4 gap-2">
                      {(['perm_read', 'perm_write', 'perm_create', 'perm_unlink'] as const).map((perm) => (
                        <label
                          key={perm}
                          className="flex flex-col items-center gap-1 p-2 rounded-lg bg-black/30 border border-white/5 cursor-pointer hover:border-white/20 transition-all"
                        >
                          <input
                            type="checkbox"
                            checked={rule[perm]}
                            onChange={(e) => handleUpdateAccessRule(index, { [perm]: e.target.checked })}
                            className="w-4 h-4 rounded border-white/20 bg-black/50 text-green-500"
                          />
                          <span className="text-[10px] text-white/50 capitalize">
                            {perm.replace('perm_', '')}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-6 py-4 border-t border-glass-border space-y-2">
        <button className="cyber-button-primary w-full py-3">Apply Settings</button>
        <button
          onClick={onClose}
          className="w-full py-3 text-white/40 hover:text-white/70 text-sm transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );
};

export default ModelSettingsPanel;
