import React, { useState } from 'react';
import { DepartmentRole, User } from '../../../types/index.ts';
import { DEPARTMENT_CONFIGS, PERMISSION_MODULES } from './permissionModules.ts';
import {
  Shield,
  Edit2,
  Trash2,
  Users,
  ChevronDown,
  ChevronUp,
  Check,
  Lock,
  Copy,
  AlertTriangle
} from 'lucide-react';

interface RbacRoleCardProps {
  role: DepartmentRole;
  assignedUsers: User[];
  onEdit: (role: DepartmentRole) => void;
  onDuplicate: (role: DepartmentRole) => void;
  onDelete: (roleId: string) => void;
}

export const RbacRoleCard: React.FC<RbacRoleCardProps> = ({
  role,
  assignedUsers,
  onEdit,
  onDuplicate,
  onDelete
}) => {
  const [expanded, setExpanded] = useState(false);
  const deptConfig = DEPARTMENT_CONFIGS[role.department] || DEPARTMENT_CONFIGS.admin;
  const isSuperAdmin = role.permissions.includes('*');

  // Find all permission defs that this role has
  const allPermDefs = PERMISSION_MODULES.flatMap(m => m.permissions);
  const activePermDefs = isSuperAdmin
    ? allPermDefs
    : allPermDefs.filter(p => role.permissions.includes(p.key));

  const highRiskCount = activePermDefs.filter(p => p.isHighRisk).length;

  return (
    <div
      id={`role-card-${role.id}`}
      className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4 hover:border-slate-700 transition-all flex flex-col justify-between"
    >
      <div className="space-y-3">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold shadow-md shrink-0"
              style={{ backgroundColor: role.color || '#3b82f6' }}
            >
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-sm font-bold text-slate-100">{role.name}</h3>
                {role.isSystemDefault && (
                  <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-400 text-[10px] font-mono uppercase tracking-wider">
                    System Preset
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                <span
                  className={`px-2 py-0.5 rounded-md text-[11px] font-semibold capitalize border ${deptConfig.bg} ${deptConfig.color} ${deptConfig.border}`}
                >
                  {deptConfig.label}
                </span>
                {highRiskCount > 0 && (
                  <span className="flex items-center gap-1 text-[10px] text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/30 font-medium">
                    <AlertTriangle className="w-3 h-3" />
                    {highRiskCount} High Risk
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => onDuplicate(role)}
              title="Duplicate this role"
              className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-700 transition cursor-pointer"
            >
              <Copy className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onEdit(role)}
              title="Edit Permissions"
              className="p-1.5 rounded-lg bg-blue-600/20 text-blue-400 hover:bg-blue-600/30 transition cursor-pointer"
            >
              <Edit2 className="w-3.5 h-3.5" />
            </button>
            {!role.isSystemDefault && (
              <button
                onClick={() => onDelete(role.id)}
                title="Delete Role"
                className="p-1.5 rounded-lg bg-rose-600/20 text-rose-400 hover:bg-rose-600/30 transition cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Description */}
        <p className="text-xs text-slate-400 leading-relaxed min-h-[36px]">
          {role.description || 'Custom department role with selected permission boundaries.'}
        </p>

        {/* Metrics Bar */}
        <div className="grid grid-cols-2 gap-2 pt-1 text-xs">
          <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
            <span className="text-slate-400 text-[11px]">Assigned Members</span>
            <div className="flex items-center gap-1 font-bold text-slate-200">
              <Users className="w-3.5 h-3.5 text-blue-400" />
              <span>{assignedUsers.length}</span>
            </div>
          </div>

          <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
            <span className="text-slate-400 text-[11px]">Active Grants</span>
            <span className="font-bold text-slate-200 font-mono">
              {isSuperAdmin ? 'ALL (*)' : `${role.permissions.length} perms`}
            </span>
          </div>
        </div>

        {/* Assigned Users Avatars preview */}
        {assignedUsers.length > 0 && (
          <div className="flex items-center gap-2 pt-1">
            <div className="flex -space-x-2 overflow-hidden">
              {assignedUsers.slice(0, 4).map(u => (
                <div
                  key={u.id}
                  title={`${u.name} (${u.jobTitle || u.role})`}
                  className="inline-block h-6 w-6 rounded-full ring-2 ring-slate-900 bg-blue-600 text-[10px] text-white font-bold flex items-center justify-center uppercase"
                >
                  {u.name.slice(0, 2)}
                </div>
              ))}
            </div>
            <span className="text-[11px] text-slate-400">
              {assignedUsers.map(u => u.name.split(' ')[0]).slice(0, 2).join(', ')}
              {assignedUsers.length > 2 && ` +${assignedUsers.length - 2} more`}
            </span>
          </div>
        )}

        {/* Expandable Permissions List */}
        {expanded && (
          <div className="mt-3 pt-3 border-t border-slate-800 space-y-2 text-xs">
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Active Permission Grants ({activePermDefs.length})
            </div>
            <div className="grid grid-cols-1 gap-1.5 max-h-48 overflow-y-auto pr-1">
              {activePermDefs.map(perm => (
                <div
                  key={perm.key}
                  className="p-1.5 rounded-lg bg-slate-950 border border-slate-800/80 flex items-center justify-between gap-2"
                >
                  <div className="flex items-center gap-1.5 min-w-0">
                    <Check className="w-3 h-3 text-emerald-400 shrink-0" />
                    <span className="text-[11px] text-slate-300 font-medium truncate">{perm.label}</span>
                  </div>
                  <span className="text-[9px] text-slate-500 font-mono shrink-0">({perm.key})</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Footer toggle */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full pt-2 flex items-center justify-center gap-1 text-[11px] font-medium text-slate-400 hover:text-slate-200 transition cursor-pointer border-t border-slate-800/60"
      >
        <span>{expanded ? 'Collapse Matrix' : 'Inspect Permissions Matrix'}</span>
        {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
      </button>
    </div>
  );
};
