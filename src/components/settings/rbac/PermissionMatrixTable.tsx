import React, { useState } from 'react';
import { DepartmentRole, Department } from '../../../types/index.ts';
import { PERMISSION_MODULES, DEPARTMENT_CONFIGS } from './permissionModules.ts';
import {
  Check,
  X,
  Layers,
  Shield,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';

interface PermissionMatrixTableProps {
  roles: DepartmentRole[];
  selectedDepartmentFilter: Department | 'all';
}

export const PermissionMatrixTable: React.FC<PermissionMatrixTableProps> = ({
  roles,
  selectedDepartmentFilter
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedModule, setSelectedModule] = useState<string>('all');

  const filteredRoles = selectedDepartmentFilter === 'all'
    ? roles
    : roles.filter(r => r.department === selectedDepartmentFilter);

  const filteredModules = PERMISSION_MODULES.filter(m => {
    if (selectedModule !== 'all' && m.id !== selectedModule) return false;
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      m.name.toLowerCase().includes(q) ||
      m.permissions.some(p => p.label.toLowerCase().includes(q) || p.key.toLowerCase().includes(q))
    );
  });

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
      {/* Matrix Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div>
          <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wider flex items-center gap-2">
            <Layers className="w-4 h-4 text-blue-400" />
            Side-by-Side Department Permission Matrix
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Audit and compare capability grants across {filteredRoles.length} active roles.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Search permissions..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500 w-44"
            />
          </div>

          <select
            value={selectedModule}
            onChange={e => setSelectedModule(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
          >
            <option value="all">All Modules ({PERMISSION_MODULES.length})</option>
            {PERMISSION_MODULES.map(m => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Responsive Matrix Table */}
      <div className="overflow-x-auto rounded-xl border border-slate-800">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-950 border-b border-slate-800">
              <th className="p-3.5 text-slate-400 font-semibold uppercase tracking-wider text-[11px] min-w-[240px] sticky left-0 bg-slate-950 z-10 border-r border-slate-800">
                Permission Capability / Action
              </th>
              {filteredRoles.map(role => {
                const deptCfg = DEPARTMENT_CONFIGS[role.department] || DEPARTMENT_CONFIGS.admin;
                return (
                  <th
                    key={role.id}
                    className="p-3 text-center min-w-[130px] border-r border-slate-800 last:border-r-0"
                  >
                    <div className="flex flex-col items-center gap-1">
                      <span
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ backgroundColor: role.color || '#3b82f6' }}
                      />
                      <span className="font-bold text-slate-200 truncate max-w-[120px]">{role.name}</span>
                      <span
                        className={`text-[9px] px-1.5 py-0.2 rounded border ${deptCfg.bg} ${deptCfg.color} ${deptCfg.border} uppercase font-semibold`}
                      >
                        {role.department}
                      </span>
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {filteredModules.map(module => (
              <React.Fragment key={module.id}>
                {/* Module Category Row */}
                <tr className="bg-slate-950/60 font-bold text-slate-300">
                  <td
                    colSpan={filteredRoles.length + 1}
                    className="p-2.5 px-3.5 text-[11px] text-blue-400 uppercase tracking-wider bg-slate-950 sticky left-0 z-10 border-y border-slate-800"
                  >
                    {module.name}
                  </td>
                </tr>

                {/* Individual Permission Rows */}
                {module.permissions.map(perm => (
                  <tr key={perm.key} className="hover:bg-slate-850/50 transition">
                    <td className="p-3 pl-6 sticky left-0 bg-slate-900/95 z-10 border-r border-slate-800">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-slate-200">{perm.label}</span>
                        {perm.isHighRisk && (
                          <span className="px-1.5 py-0.2 rounded bg-rose-500/20 text-rose-400 text-[9px] font-semibold border border-rose-500/30">
                            High Risk
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-slate-500 font-mono mt-0.5">{perm.key}</div>
                    </td>

                    {filteredRoles.map(role => {
                      const hasPerm = role.permissions.includes('*') || role.permissions.includes(perm.key);
                      return (
                        <td
                          key={role.id}
                          className="p-3 text-center border-r border-slate-800 last:border-r-0"
                        >
                          {hasPerm ? (
                            <div className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 font-bold border border-emerald-500/30">
                              <Check className="w-3.5 h-3.5" />
                            </div>
                          ) : (
                            <div className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-slate-950 text-slate-700">
                              <X className="w-3 h-3" />
                            </div>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
