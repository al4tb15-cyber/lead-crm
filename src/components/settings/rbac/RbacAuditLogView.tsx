import React, { useState } from 'react';
import { RbacAuditLog } from '../../../types/index.ts';
import {
  ShieldAlert,
  Clock,
  User,
  Shield,
  Search,
  Filter,
  Activity,
  CheckCircle,
  FileText
} from 'lucide-react';

interface RbacAuditLogViewProps {
  logs: RbacAuditLog[];
}

export const RbacAuditLogView: React.FC<RbacAuditLogViewProps> = ({ logs }) => {
  const [search, setSearch] = useState('');
  const [filterAction, setFilterAction] = useState<string>('all');

  const filteredLogs = logs.filter(log => {
    if (filterAction !== 'all' && log.action !== filterAction) return false;
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      log.actorName.toLowerCase().includes(q) ||
      log.targetName.toLowerCase().includes(q) ||
      log.details.toLowerCase().includes(q) ||
      log.action.toLowerCase().includes(q)
    );
  });

  const getActionBadge = (action: string) => {
    switch (action) {
      case 'create_role':
        return <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-semibold">ROLE CREATED</span>;
      case 'update_permissions':
      case 'update_role':
        return <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20 text-[10px] font-semibold">PERMISSIONS MODIFIED</span>;
      case 'delete_role':
        return <span className="px-2 py-0.5 rounded bg-rose-500/10 text-rose-400 border border-rose-500/20 text-[10px] font-semibold">ROLE REMOVED</span>;
      case 'assign_role':
        return <span className="px-2 py-0.5 rounded bg-purple-500/10 text-purple-400 border border-purple-500/20 text-[10px] font-semibold">ROLE ASSIGNED</span>;
      case 'user_invited':
        return <span className="px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 text-[10px] font-semibold">USER PROVISIONED</span>;
      case 'user_status_changed':
        return <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[10px] font-semibold">STATUS UPDATED</span>;
      default:
        return <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-[10px] font-semibold">{action.toUpperCase()}</span>;
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div>
          <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wider flex items-center gap-2">
            <Activity className="w-4 h-4 text-purple-400" />
            RBAC Governance & Policy Audit Trail
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Immutable log of role alterations, permission grants, user assignments, and security gate events.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Search audit trail..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500 w-44"
            />
          </div>

          <select
            value={filterAction}
            onChange={e => setFilterAction(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
          >
            <option value="all">All Actions</option>
            <option value="create_role">Role Created</option>
            <option value="update_permissions">Permissions Modified</option>
            <option value="assign_role">Role Assigned</option>
            <option value="user_invited">User Provisioned</option>
            <option value="delete_role">Role Removed</option>
          </select>
        </div>
      </div>

      {/* Logs Timeline */}
      <div className="space-y-3">
        {filteredLogs.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-xs">
            No audit records match your current filter criteria.
          </div>
        ) : (
          filteredLogs.map(log => (
            <div
              key={log.id}
              className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs"
            >
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-300 font-bold shrink-0 mt-0.5 sm:mt-0">
                  <Shield className="w-4 h-4 text-blue-400" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    {getActionBadge(log.action)}
                    <span className="font-bold text-slate-200">{log.targetName}</span>
                    <span className="text-[10px] text-slate-500">by</span>
                    <span className="text-slate-300 font-semibold">{log.actorName}</span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">{log.details}</p>
                </div>
              </div>

              <div className="flex items-center gap-1.5 text-slate-500 text-[11px] font-mono shrink-0 pl-11 sm:pl-0">
                <Clock className="w-3 h-3" />
                <span>{new Date(log.timestamp).toLocaleString()}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
