import React, { useState, useEffect } from 'react';
import { DepartmentRole, Department } from '../../../types/index.ts';
import { PERMISSION_MODULES, DEPARTMENT_CONFIGS } from './permissionModules.ts';
import {
  X,
  Shield,
  ShieldAlert,
  Check,
  CheckSquare,
  Square,
  Sparkles,
  AlertTriangle,
  Layers,
  Users,
  PhoneCall,
  Mic2,
  Mail,
  Bot,
  Send,
  Calendar,
  FileText,
  CreditCard,
  Cpu,
  Info
} from 'lucide-react';

interface RoleEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (roleData: Partial<DepartmentRole>) => Promise<void>;
  roleToEdit?: DepartmentRole | null;
  selectedDepartmentFilter?: Department | 'all';
}

const ICON_MAP: Record<string, React.FC<{ className?: string }>> = {
  Users,
  PhoneCall,
  Mic2,
  Mail,
  Bot,
  Send,
  Calendar,
  FileText,
  CreditCard,
  Cpu,
  Shield
};

const COLOR_PRESETS = [
  '#6366f1', // Indigo (Admin)
  '#10b981', // Emerald (Sales)
  '#ec4899', // Pink (Marketing)
  '#06b6d4', // Cyan (Ops)
  '#3b82f6', // Blue (SDR)
  '#f59e0b', // Amber (Support)
  '#8b5cf6', // Purple (Exec)
  '#ef4444'  // Rose/Red (Security)
];

export const RoleEditorModal: React.FC<RoleEditorModalProps> = ({
  isOpen,
  onClose,
  onSave,
  roleToEdit,
  selectedDepartmentFilter
}) => {
  const [name, setName] = useState('');
  const [department, setDepartment] = useState<Department>('sales');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState('#10b981');
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [isSuperAdminRole, setIsSuperAdminRole] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (roleToEdit) {
      setName(roleToEdit.name);
      setDepartment(roleToEdit.department);
      setDescription(roleToEdit.description);
      setColor(roleToEdit.color || '#6366f1');
      if (roleToEdit.permissions.includes('*')) {
        setIsSuperAdminRole(true);
        setSelectedPermissions(['*']);
      } else {
        setIsSuperAdminRole(false);
        setSelectedPermissions(roleToEdit.permissions || []);
      }
    } else {
      const defaultDept = selectedDepartmentFilter && selectedDepartmentFilter !== 'all'
        ? selectedDepartmentFilter
        : 'sales';
      setDepartment(defaultDept);
      setName('');
      setDescription('');
      setColor(DEPARTMENT_CONFIGS[defaultDept]?.color.replace('text-', '#') || '#10b981');
      setIsSuperAdminRole(defaultDept === 'admin');
      if (defaultDept === 'admin') {
        setSelectedPermissions(['*']);
      } else {
        setSelectedPermissions(DEPARTMENT_CONFIGS[defaultDept]?.defaultPermissions || []);
      }
    }
  }, [roleToEdit, isOpen, selectedDepartmentFilter]);

  if (!isOpen) return null;

  const handleDepartmentChange = (dept: Department) => {
    setDepartment(dept);
    if (!roleToEdit) {
      if (dept === 'admin') {
        setIsSuperAdminRole(true);
        setSelectedPermissions(['*']);
        setColor('#6366f1');
      } else {
        setIsSuperAdminRole(false);
        setSelectedPermissions(DEPARTMENT_CONFIGS[dept]?.defaultPermissions || []);
        if (dept === 'sales') setColor('#10b981');
        else if (dept === 'marketing') setColor('#ec4899');
        else if (dept === 'operations') setColor('#06b6d4');
        else if (dept === 'support') setColor('#f59e0b');
        else if (dept === 'executive') setColor('#8b5cf6');
      }
    }
  };

  const togglePermission = (key: string) => {
    if (isSuperAdminRole) return;
    if (selectedPermissions.includes(key)) {
      setSelectedPermissions(selectedPermissions.filter(p => p !== key));
    } else {
      setSelectedPermissions([...selectedPermissions, key]);
    }
  };

  const toggleModulePermissions = (modulePermissions: string[]) => {
    if (isSuperAdminRole) return;
    const allSelected = modulePermissions.every(k => selectedPermissions.includes(k));
    if (allSelected) {
      setSelectedPermissions(selectedPermissions.filter(p => !modulePermissions.includes(p)));
    } else {
      const newPerms = new Set([...selectedPermissions, ...modulePermissions]);
      setSelectedPermissions(Array.from(newPerms));
    }
  };

  const applyDepartmentPreset = () => {
    if (department === 'admin') {
      setIsSuperAdminRole(true);
      setSelectedPermissions(['*']);
    } else {
      setIsSuperAdminRole(false);
      setSelectedPermissions(DEPARTMENT_CONFIGS[department]?.defaultPermissions || []);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSaving(true);
    try {
      await onSave({
        name: name.trim(),
        department,
        description: description.trim(),
        color,
        permissions: isSuperAdminRole ? ['*'] : selectedPermissions
      });
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  // Compute high-risk count
  const allPermDefs = PERMISSION_MODULES.flatMap(m => m.permissions);
  const activeHighRiskCount = isSuperAdminRole
    ? allPermDefs.filter(p => p.isHighRisk).length
    : selectedPermissions.filter(key => allPermDefs.find(p => p.key === key)?.isHighRisk).length;

  const filteredModules = PERMISSION_MODULES.filter(mod => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      mod.name.toLowerCase().includes(q) ||
      mod.description.toLowerCase().includes(q) ||
      mod.permissions.some(p => p.label.toLowerCase().includes(q) || p.key.toLowerCase().includes(q))
    );
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div
        id="role-editor-modal"
        className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden my-8 flex flex-col max-h-[90vh]"
      >
        {/* Modal Header */}
        <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-slate-900/90 sticky top-0 z-10 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center shadow-md text-white font-bold text-lg"
              style={{ backgroundColor: color }}
            >
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                {roleToEdit ? `Edit Role: ${roleToEdit.name}` : 'Create Department Role'}
                {roleToEdit?.isSystemDefault && (
                  <span className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-400 text-[10px] font-mono uppercase tracking-wider">
                    System Preset
                  </span>
                )}
              </h2>
              <p className="text-xs text-slate-400">
                Define granular RBAC permissions and department boundaries for this role.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center hover:bg-slate-700 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Top Form Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Role Name <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="e.g. Senior Sales Closer, SDR Lead, Growth Director"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Target Department <span className="text-rose-400">*</span>
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                {(['sales', 'marketing', 'admin', 'operations', 'support', 'executive'] as Department[]).map(dept => {
                  const isSelected = department === dept;
                  return (
                    <button
                      key={dept}
                      type="button"
                      onClick={() => handleDepartmentChange(dept)}
                      className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold capitalize transition cursor-pointer border ${
                        isSelected
                          ? 'bg-blue-600/20 border-blue-500 text-blue-300 shadow-sm'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                      }`}
                    >
                      {dept}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Role Description
              </label>
              <input
                type="text"
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Briefly describe what responsibilities and scope this role encompasses..."
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="md:col-span-2 flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl bg-slate-950 border border-slate-800">
              <div className="flex items-center gap-3">
                <span className="text-xs text-slate-400 font-semibold">Badge Color:</span>
                <div className="flex items-center gap-1.5">
                  {COLOR_PRESETS.map(c => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setColor(c)}
                      className={`w-6 h-6 rounded-full border-2 transition cursor-pointer ${
                        color === c ? 'border-white scale-110 shadow-md' : 'border-transparent opacity-70 hover:opacity-100'
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={applyDepartmentPreset}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition cursor-pointer"
                >
                  <Sparkles className="w-3 h-3 text-amber-400" />
                  <span>Apply {DEPARTMENT_CONFIGS[department]?.label} Defaults</span>
                </button>

                <label className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-950/40 border border-indigo-500/30 text-indigo-300 text-xs cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isSuperAdminRole}
                    onChange={e => {
                      setIsSuperAdminRole(e.target.checked);
                      if (e.target.checked) setSelectedPermissions(['*']);
                    }}
                    className="rounded border-slate-700 text-indigo-600 focus:ring-0"
                  />
                  <span className="font-semibold">Unrestricted Super Admin (*)</span>
                </label>
              </div>
            </div>
          </div>

          {/* Granular Permission Modules */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wider flex items-center gap-2">
                  <Layers className="w-4 h-4 text-blue-400" />
                  Granular Permission Matrix
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  {isSuperAdminRole
                    ? 'Super Admin bypass: all permissions across all modules are permanently enabled.'
                    : `${selectedPermissions.length} total permissions active across ${PERMISSION_MODULES.length} modules.`}
                </p>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <input
                  type="text"
                  placeholder="Filter permissions..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1 text-xs text-slate-200 focus:outline-none focus:border-blue-500 w-full sm:w-48"
                />
              </div>
            </div>

            {/* High-risk Banner if any high-risk selected */}
            {activeHighRiskCount > 0 && (
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-center gap-2.5">
                <ShieldAlert className="w-4 h-4 shrink-0 text-amber-400" />
                <div>
                  <span className="font-bold">{activeHighRiskCount} High-Risk Privileges Granted:</span>{' '}
                  Includes critical actions such as record deletion, prompt overwrites, DNCR compliance overrides, or billing plan modifications.
                </div>
              </div>
            )}

            {/* Modules Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredModules.map(module => {
                const IconComponent = ICON_MAP[module.icon] || Layers;
                const modPermKeys = module.permissions.map(p => p.key);
                const allSelected = isSuperAdminRole || modPermKeys.every(k => selectedPermissions.includes(k));
                const someSelected = isSuperAdminRole || modPermKeys.some(k => selectedPermissions.includes(k));

                return (
                  <div
                    key={module.id}
                    className={`rounded-xl border p-4 transition-all ${
                      someSelected
                        ? 'bg-slate-950/80 border-slate-700/80 shadow-md'
                        : 'bg-slate-950/40 border-slate-800/60 opacity-80 hover:opacity-100'
                    }`}
                  >
                    {/* Module Header */}
                    <div className="flex items-start justify-between gap-2 mb-3 pb-2 border-b border-slate-800/80">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-slate-800 text-blue-400 flex items-center justify-center shrink-0">
                          <IconComponent className="w-3.5 h-3.5" />
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-slate-200">{module.name}</h4>
                          <p className="text-[10px] text-slate-400 leading-tight">{module.description}</p>
                        </div>
                      </div>

                      {!isSuperAdminRole && (
                        <button
                          type="button"
                          onClick={() => toggleModulePermissions(modPermKeys)}
                          className="text-[11px] text-blue-400 hover:text-blue-300 font-medium px-2 py-0.5 rounded bg-blue-500/10 hover:bg-blue-500/20 transition cursor-pointer shrink-0"
                        >
                          {allSelected ? 'Clear All' : 'Select All'}
                        </button>
                      )}
                    </div>

                    {/* Permission Items */}
                    <div className="space-y-2">
                      {module.permissions.map(perm => {
                        const isChecked = isSuperAdminRole || selectedPermissions.includes(perm.key);
                        return (
                          <div
                            key={perm.key}
                            onClick={() => togglePermission(perm.key)}
                            className={`p-2 rounded-lg flex items-start gap-2.5 transition cursor-pointer ${
                              isChecked
                                ? 'bg-slate-900 border border-slate-700/80'
                                : 'bg-slate-900/30 border border-transparent hover:border-slate-800'
                            }`}
                          >
                            <div className="mt-0.5 text-slate-400">
                              {isChecked ? (
                                <CheckSquare className="w-3.5 h-3.5 text-blue-400" />
                              ) : (
                                <Square className="w-3.5 h-3.5 text-slate-600" />
                              )}
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="text-xs font-medium text-slate-200">{perm.label}</span>
                                {perm.isHighRisk && (
                                  <span className="px-1.5 py-0.2 rounded bg-rose-500/20 text-rose-300 text-[9px] font-semibold border border-rose-500/30">
                                    High Risk
                                  </span>
                                )}
                                <span className="text-[9px] text-slate-500 font-mono">({perm.key})</span>
                              </div>
                              <p className="text-[10px] text-slate-400 leading-tight mt-0.5">{perm.description}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </form>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-900 flex items-center justify-between">
          <div className="text-xs text-slate-400 flex items-center gap-2">
            <Info className="w-4 h-4 text-blue-400" />
            <span>
              Changes immediately apply to all users assigned to{' '}
              <strong className="text-slate-200">{name || 'this role'}</strong>.
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={isSaving || !name.trim()}
              onClick={handleSubmit}
              className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold text-xs shadow-md shadow-blue-600/25 transition-all cursor-pointer"
            >
              <Check className="w-3.5 h-3.5" />
              <span>{isSaving ? 'Saving...' : roleToEdit ? 'Update Role' : 'Create Role'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
