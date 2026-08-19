import React, { useState, useEffect } from 'react';
import { User, DepartmentRole, Department, UserRole } from '../../../types/index.ts';
import { DEPARTMENT_CONFIGS } from './permissionModules.ts';
import {
  X,
  UserCheck,
  Mail,
  Shield,
  Briefcase,
  KeyRound,
  Check,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

interface UserEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (userData: Partial<User>) => Promise<void>;
  userToEdit?: User | null;
  availableRoles: DepartmentRole[];
  selectedDepartmentFilter?: Department | 'all';
}

export const UserEditorModal: React.FC<UserEditorModalProps> = ({
  isOpen,
  onClose,
  onSave,
  userToEdit,
  availableRoles,
  selectedDepartmentFilter
}) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [department, setDepartment] = useState<Department>('sales');
  const [selectedRoleId, setSelectedRoleId] = useState<string>('');
  const [active, setActive] = useState(true);
  const [mfaEnabled, setMfaEnabled] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (userToEdit) {
      setName(userToEdit.name);
      setEmail(userToEdit.email);
      setJobTitle(userToEdit.jobTitle || '');
      setDepartment(userToEdit.department || 'sales');
      setSelectedRoleId(userToEdit.customRoleId || '');
      setActive(userToEdit.active);
      setMfaEnabled(userToEdit.mfaEnabled ?? false);
    } else {
      const defaultDept = selectedDepartmentFilter && selectedDepartmentFilter !== 'all'
        ? selectedDepartmentFilter
        : 'sales';
      setName('');
      setEmail('');
      setJobTitle('');
      setDepartment(defaultDept);
      setActive(true);
      setMfaEnabled(false);

      // Pick first matching role in this department
      const matchingRole = availableRoles.find(r => r.department === defaultDept);
      setSelectedRoleId(matchingRole ? matchingRole.id : availableRoles[0]?.id || '');
    }
  }, [userToEdit, isOpen, selectedDepartmentFilter, availableRoles]);

  if (!isOpen) return null;

  const handleDepartmentChange = (newDept: Department) => {
    setDepartment(newDept);
    // Find matching role in the new department
    const matchingRole = availableRoles.find(r => r.department === newDept);
    if (matchingRole) {
      setSelectedRoleId(matchingRole.id);
    }
  };

  const selectedRoleObj = availableRoles.find(r => r.id === selectedRoleId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return;

    setIsSaving(true);
    try {
      // Map base UserRole
      let baseRole: UserRole = 'staff';
      if (department === 'admin' || selectedRoleObj?.department === 'admin') {
        baseRole = 'super_admin';
      } else if (department === 'sales') {
        baseRole = 'sales_user';
      } else if (department === 'operations') {
        baseRole = 'manager';
      }

      await onSave({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        jobTitle: jobTitle.trim(),
        department,
        role: baseRole,
        customRoleId: selectedRoleId,
        customRoleName: selectedRoleObj?.name || 'Custom Role',
        active,
        mfaEnabled
      });
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  const rolesForCurrentDept = availableRoles.filter(r => r.department === department);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div
        id="user-editor-modal"
        className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden my-8"
      >
        {/* Modal Header */}
        <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/20 text-blue-400 flex items-center justify-center font-bold">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-100">
                {userToEdit ? `Edit Team Member: ${userToEdit.name}` : 'Provision New Team Member'}
              </h2>
              <p className="text-xs text-slate-400">
                Assign user identity, department authorization, and granular RBAC role.
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
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                Full Name <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="e.g. Sarah Jenkins"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                Corporate Email <span className="text-rose-400">*</span>
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="sarah@businesshub.app"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Job Title</label>
              <input
                type="text"
                value={jobTitle}
                onChange={e => setJobTitle(e.target.value)}
                placeholder="e.g. Head of Enterprise Sales"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                Primary Department <span className="text-rose-400">*</span>
              </label>
              <select
                value={department}
                onChange={e => handleDepartmentChange(e.target.value as Department)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-blue-500 capitalize"
              >
                {(['sales', 'marketing', 'admin', 'operations', 'support', 'executive'] as Department[]).map(dept => (
                  <option key={dept} value={dept}>
                    {DEPARTMENT_CONFIGS[dept]?.label || dept}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Role Selection */}
          <div>
            <label className="block text-slate-300 font-semibold mb-1">
              Assigned RBAC Role <span className="text-rose-400">*</span>
            </label>
            <select
              value={selectedRoleId}
              onChange={e => setSelectedRoleId(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-blue-500 font-medium"
            >
              <optgroup label={`${DEPARTMENT_CONFIGS[department]?.label} Roles`}>
                {rolesForCurrentDept.map(role => (
                  <option key={role.id} value={role.id}>
                    {role.name} ({role.permissions.includes('*') ? 'All Permissions' : `${role.permissions.length} perms`})
                  </option>
                ))}
              </optgroup>
              <optgroup label="Other Department Roles">
                {availableRoles
                  .filter(r => r.department !== department)
                  .map(role => (
                    <option key={role.id} value={role.id}>
                      [{role.department.toUpperCase()}] {role.name}
                    </option>
                  ))}
              </optgroup>
            </select>
          </div>

          {/* Role Preview Card */}
          {selectedRoleObj && (
            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: selectedRoleObj.color || '#3b82f6' }}
                  />
                  <span className="font-bold text-slate-200">{selectedRoleObj.name}</span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-400 capitalize">
                    {selectedRoleObj.department}
                  </span>
                </div>
                <span className="text-[11px] text-blue-400 font-semibold">
                  {selectedRoleObj.permissions.includes('*')
                    ? 'Unrestricted Access (*)'
                    : `${selectedRoleObj.permissions.length} permissions granted`}
                </span>
              </div>
              <p className="text-[11px] text-slate-400">{selectedRoleObj.description}</p>
            </div>
          )}

          {/* Security & Access Toggles */}
          <div className="grid grid-cols-2 gap-3 pt-2">
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
              <div>
                <div className="font-semibold text-slate-200">Account Status</div>
                <div className="text-[10px] text-slate-400">Permit workspace login</div>
              </div>
              <input
                type="checkbox"
                checked={active}
                onChange={e => setActive(e.target.checked)}
                className="w-4 h-4 rounded border-slate-700 text-blue-600 focus:ring-0 cursor-pointer"
              />
            </div>

            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
              <div>
                <div className="font-semibold text-slate-200">MFA Enforced</div>
                <div className="text-[10px] text-slate-400">Two-Factor Authentication</div>
              </div>
              <input
                type="checkbox"
                checked={mfaEnabled}
                onChange={e => setMfaEnabled(e.target.checked)}
                className="w-4 h-4 rounded border-slate-700 text-indigo-600 focus:ring-0 cursor-pointer"
              />
            </div>
          </div>

          {/* Modal Footer */}
          <div className="pt-4 flex items-center justify-end gap-2 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving || !name.trim() || !email.trim()}
              className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold shadow-md shadow-blue-600/25 transition cursor-pointer"
            >
              <Check className="w-3.5 h-3.5" />
              <span>{isSaving ? 'Saving...' : userToEdit ? 'Update Member' : 'Provision Member'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
