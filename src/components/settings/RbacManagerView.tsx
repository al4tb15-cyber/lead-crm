import React, { useState, useEffect } from 'react';
import { DepartmentRole, User, Department, RbacAuditLog } from '../../types/index.ts';
import { api } from '../../api/client.ts';
import { useTenant } from '../../context/TenantContext.tsx';
import { DEPARTMENT_CONFIGS, PERMISSION_MODULES } from './rbac/permissionModules.ts';
import { RbacRoleCard } from './rbac/RbacRoleCard.tsx';
import { RoleEditorModal } from './rbac/RoleEditorModal.tsx';
import { UserEditorModal } from './rbac/UserEditorModal.tsx';
import { PermissionMatrixTable } from './rbac/PermissionMatrixTable.tsx';
import { RbacAuditLogView } from './rbac/RbacAuditLogView.tsx';
import {
  Shield,
  ShieldCheck,
  Users,
  Plus,
  Search,
  Filter,
  Layers,
  Activity,
  UserCheck,
  CheckCircle2,
  Lock,
  Sparkles,
  ChevronRight,
  TrendingUp,
  AlertTriangle,
  KeyRound,
  Edit2,
  Trash2,
  RefreshCw
} from 'lucide-react';

export const RbacManagerView: React.FC = () => {
  const { activeTenant, addToast } = useTenant();

  const [roles, setRoles] = useState<DepartmentRole[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [auditLogs, setAuditLogs] = useState<RbacAuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters & Sub-view modes
  const [selectedDeptFilter, setSelectedDeptFilter] = useState<Department | 'all'>('all');
  const [activeSubTab, setActiveSubTab] = useState<'roles' | 'users' | 'matrix' | 'audit'>('roles');
  const [userSearchQuery, setUserSearchQuery] = useState('');

  // Modals
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [roleToEdit, setRoleToEdit] = useState<DepartmentRole | null>(null);

  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [userToEdit, setUserToEdit] = useState<User | null>(null);

  const loadRbacData = async () => {
    try {
      setLoading(true);
      const [fetchedRoles, fetchedUsers, fetchedLogs] = await Promise.all([
        api.getDepartmentRoles(),
        api.getUsers(),
        api.getRbacAuditLogs()
      ]);
      setRoles(fetchedRoles);
      setUsers(fetchedUsers);
      setAuditLogs(fetchedLogs);
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'RBAC Load Failed',
        message: err.message || 'Could not fetch role-based permissions.'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRbacData();
  }, [activeTenant?.id]);

  // Handle Role CRUD
  const handleSaveRole = async (roleData: Partial<DepartmentRole>) => {
    try {
      if (roleToEdit) {
        await api.updateDepartmentRole(roleToEdit.id, roleData);
        addToast({
          type: 'success',
          title: 'Role Updated',
          message: `Permissions updated for '${roleData.name}'.`
        });
      } else {
        await api.createDepartmentRole(roleData);
        addToast({
          type: 'success',
          title: 'Role Created',
          message: `New department role '${roleData.name}' created.`
        });
      }
      await loadRbacData();
    } catch (err: any) {
      addToast({ type: 'error', title: 'Role Save Error', message: err.message });
    }
  };

  const handleDuplicateRole = (role: DepartmentRole) => {
    setRoleToEdit({
      ...role,
      id: '',
      name: `${role.name} (Copy)`,
      isSystemDefault: false
    });
    setIsRoleModalOpen(true);
  };

  const handleDeleteRole = async (roleId: string) => {
    if (!confirm('Are you sure you want to delete this custom role? Assigned users will need re-assignment.')) return;
    try {
      await api.deleteDepartmentRole(roleId);
      addToast({
        type: 'success',
        title: 'Role Removed',
        message: 'The custom department role has been deleted.'
      });
      await loadRbacData();
    } catch (err: any) {
      addToast({ type: 'error', title: 'Delete Failed', message: err.message });
    }
  };

  // Handle User CRUD
  const handleSaveUser = async (userData: Partial<User>) => {
    try {
      if (userToEdit) {
        await api.updateRbacUser(userToEdit.id, userData);
        addToast({
          type: 'success',
          title: 'Member Updated',
          message: `User permissions and department updated for ${userData.name}.`
        });
      } else {
        await api.createRbacUser(userData);
        addToast({
          type: 'success',
          title: 'Member Invited',
          message: `Provisioned account for ${userData.email} in ${userData.department?.toUpperCase()}.`
        });
      }
      await loadRbacData();
    } catch (err: any) {
      addToast({ type: 'error', title: 'User Save Error', message: err.message });
    }
  };

  const handleDeleteUser = async (userId: string, userName: string) => {
    if (!confirm(`Are you sure you want to revoke access for ${userName}?`)) return;
    try {
      await api.deleteRbacUser(userId);
      addToast({
        type: 'success',
        title: 'Access Revoked',
        message: `Account for ${userName} has been removed.`
      });
      await loadRbacData();
    } catch (err: any) {
      addToast({ type: 'error', title: 'Revoke Failed', message: err.message });
    }
  };

  const handleToggleUserStatus = async (user: User) => {
    try {
      await api.updateRbacUser(user.id, { active: !user.active });
      addToast({
        type: 'success',
        title: user.active ? 'User Suspended' : 'User Activated',
        message: `${user.name} is now ${user.active ? 'inactive' : 'active'}.`
      });
      await loadRbacData();
    } catch (err: any) {
      addToast({ type: 'error', title: 'Status Toggle Error', message: err.message });
    }
  };

  // Filtered Roles & Users
  const filteredRoles = selectedDeptFilter === 'all'
    ? roles
    : roles.filter(r => r.department === selectedDeptFilter);

  const filteredUsers = users.filter(u => {
    if (selectedDeptFilter !== 'all' && u.department !== selectedDeptFilter) return false;
    if (!userSearchQuery.trim()) return true;
    const q = userSearchQuery.toLowerCase();
    return (
      u.name.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      (u.jobTitle && u.jobTitle.toLowerCase().includes(q)) ||
      (u.customRoleName && u.customRoleName.toLowerCase().includes(q))
    );
  });

  const deptList: (Department | 'all')[] = ['all', 'sales', 'marketing', 'admin', 'operations', 'support', 'executive'];

  return (
    <div className="space-y-6">
      {/* Top Banner & Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Total Members</div>
            <div className="text-2xl font-bold text-slate-100 mt-1">{users.length}</div>
            <div className="text-[11px] text-emerald-400 mt-0.5">
              {users.filter(u => u.active).length} Active accounts
            </div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center">
            <Users className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Defined Roles</div>
            <div className="text-2xl font-bold text-slate-100 mt-1">{roles.length}</div>
            <div className="text-[11px] text-indigo-400 mt-0.5">
              Across 6 departments
            </div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center">
            <Shield className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-400 font-semibold uppercase tracking-wider">MFA Protected</div>
            <div className="text-2xl font-bold text-slate-100 mt-1">
              {users.filter(u => u.mfaEnabled).length}/{users.length}
            </div>
            <div className="text-[11px] text-emerald-400 mt-0.5">
              Enforced for high-risk roles
            </div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
            <KeyRound className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Security Audits</div>
            <div className="text-2xl font-bold text-slate-100 mt-1">{auditLogs.length}</div>
            <div className="text-[11px] text-purple-400 mt-0.5">
              Latest policy synced
            </div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center">
            <Activity className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Main Section Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
        {/* Navigation & Action Bar */}
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 border-b border-slate-800 pb-5">
          {/* Sub Tab Navigation */}
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-950 border border-slate-800 text-xs">
            <button
              onClick={() => setActiveSubTab('roles')}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg font-bold transition cursor-pointer ${
                activeSubTab === 'roles'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/25'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Shield className="w-3.5 h-3.5" />
              <span>Department Roles ({filteredRoles.length})</span>
            </button>

            <button
              onClick={() => setActiveSubTab('users')}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg font-bold transition cursor-pointer ${
                activeSubTab === 'users'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/25'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Team Members ({filteredUsers.length})</span>
            </button>

            <button
              onClick={() => setActiveSubTab('matrix')}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg font-bold transition cursor-pointer ${
                activeSubTab === 'matrix'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/25'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Permission Matrix</span>
            </button>

            <button
              onClick={() => setActiveSubTab('audit')}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg font-bold transition cursor-pointer ${
                activeSubTab === 'audit'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/25'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              <span>Security Audit Trail</span>
            </button>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={loadRbacData}
              title="Refresh Data"
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>

            <button
              onClick={() => {
                setUserToEdit(null);
                setIsUserModalOpen(true);
              }}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs transition cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 text-blue-400" />
              <span>Invite Team Member</span>
            </button>

            <button
              onClick={() => {
                setRoleToEdit(null);
                setIsRoleModalOpen(true);
              }}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md shadow-blue-600/25 transition cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create Custom Role</span>
            </button>
          </div>
        </div>

        {/* Department Filter Chips */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <span className="text-xs text-slate-500 font-semibold shrink-0">Department:</span>
          {deptList.map(dept => {
            const isSelected = selectedDeptFilter === dept;
            const config = dept !== 'all' ? DEPARTMENT_CONFIGS[dept] : null;
            const count = dept === 'all'
              ? roles.length
              : roles.filter(r => r.department === dept).length;
            const userCount = dept === 'all'
              ? users.length
              : users.filter(u => u.department === dept).length;

            return (
              <button
                key={dept}
                onClick={() => setSelectedDeptFilter(dept)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold capitalize transition cursor-pointer shrink-0 border flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-blue-600/20 border-blue-500 text-blue-300 shadow-sm'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                }`}
              >
                <span>{dept === 'all' ? 'All Departments' : config?.label || dept}</span>
                <span
                  className={`px-1.5 py-0.2 rounded-md text-[10px] font-mono ${
                    isSelected ? 'bg-blue-500 text-white' : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {userCount} users
                </span>
              </button>
            );
          })}
        </div>

        {/* Tab 1: Roles Grid */}
        {activeSubTab === 'roles' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredRoles.map(role => {
                const assigned = users.filter(u => u.customRoleId === role.id);
                return (
                  <RbacRoleCard
                    key={role.id}
                    role={role}
                    assignedUsers={assigned}
                    onEdit={r => {
                      setRoleToEdit(r);
                      setIsRoleModalOpen(true);
                    }}
                    onDuplicate={handleDuplicateRole}
                    onDelete={handleDeleteRole}
                  />
                );
              })}
            </div>

            {filteredRoles.length === 0 && (
              <div className="p-12 text-center text-slate-500 text-xs bg-slate-950/40 rounded-2xl border border-slate-800">
                No roles found in the selected department. Click "Create Custom Role" above to define one.
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Users Table */}
        {activeSubTab === 'users' && (
          <div className="space-y-4">
            {/* Search Bar */}
            <div className="flex items-center justify-between gap-3">
              <div className="relative flex-1 max-w-md">
                <Search className="w-3.5 h-3.5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  placeholder="Search team members by name, email, role, or title..."
                  value={userSearchQuery}
                  onChange={e => setUserSearchQuery(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="text-xs text-slate-400">
                Showing <strong className="text-slate-200">{filteredUsers.length}</strong> members
              </div>
            </div>

            {/* Users Table */}
            <div className="overflow-x-auto rounded-xl border border-slate-800">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-950 border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
                    <th className="p-3.5 pl-4">Team Member</th>
                    <th className="p-3.5">Department</th>
                    <th className="p-3.5">Assigned Role</th>
                    <th className="p-3.5">Security & MFA</th>
                    <th className="p-3.5">Status</th>
                    <th className="p-3.5 pr-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredUsers.map(user => {
                    const userRole = roles.find(r => r.id === user.customRoleId);
                    const deptCfg = user.department ? DEPARTMENT_CONFIGS[user.department] : DEPARTMENT_CONFIGS.admin;

                    return (
                      <tr key={user.id} className="hover:bg-slate-850/50 transition">
                        <td className="p-3.5 pl-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-blue-600/30 text-blue-400 font-bold text-xs flex items-center justify-center uppercase shrink-0 border border-blue-500/30">
                              {user.name.slice(0, 2)}
                            </div>
                            <div>
                              <div className="font-bold text-slate-200 flex items-center gap-2">
                                <span>{user.name}</span>
                                {user.role === 'super_admin' && (
                                  <span className="px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-300 text-[9px] font-mono font-semibold border border-indigo-500/30">
                                    OWNER
                                  </span>
                                )}
                              </div>
                              <div className="text-[11px] text-slate-400">{user.email}</div>
                              {user.jobTitle && (
                                <div className="text-[10px] text-slate-500 mt-0.5">{user.jobTitle}</div>
                              )}
                            </div>
                          </div>
                        </td>

                        <td className="p-3.5">
                          <span
                            className={`px-2.5 py-1 rounded-md text-[11px] font-semibold capitalize border ${deptCfg?.bg} ${deptCfg?.color} ${deptCfg?.border}`}
                          >
                            {deptCfg?.label || user.department || 'General'}
                          </span>
                        </td>

                        <td className="p-3.5">
                          <div className="flex items-center gap-2">
                            <span
                              className="w-2.5 h-2.5 rounded-full shrink-0"
                              style={{ backgroundColor: userRole?.color || '#3b82f6' }}
                            />
                            <div>
                              <div className="font-semibold text-slate-200">
                                {user.customRoleName || userRole?.name || user.role}
                              </div>
                              <div className="text-[10px] text-slate-400">
                                {userRole?.permissions.includes('*')
                                  ? 'Unrestricted (*)'
                                  : `${userRole?.permissions.length || 0} permissions`}
                              </div>
                            </div>
                          </div>
                        </td>

                        <td className="p-3.5">
                          {user.mfaEnabled ? (
                            <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 font-medium">
                              <KeyRound className="w-3 h-3" />
                              <span>MFA Active</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[11px] text-slate-500 bg-slate-800/40 px-2 py-0.5 rounded font-medium">
                              <span>Password Only</span>
                            </span>
                          )}
                        </td>

                        <td className="p-3.5">
                          <button
                            onClick={() => handleToggleUserStatus(user)}
                            className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider transition cursor-pointer ${
                              user.active
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/20'
                                : 'bg-rose-500/10 text-rose-400 border border-rose-500/30 hover:bg-rose-500/20'
                            }`}
                          >
                            {user.active ? 'Active' : 'Suspended'}
                          </button>
                        </td>

                        <td className="p-3.5 pr-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => {
                                setUserToEdit(user);
                                setIsUserModalOpen(true);
                              }}
                              className="p-1.5 rounded-lg bg-blue-600/20 text-blue-400 hover:bg-blue-600/30 transition cursor-pointer"
                              title="Edit Member Role"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>

                            {user.role !== 'super_admin' && (
                              <button
                                onClick={() => handleDeleteUser(user.id, user.name)}
                                className="p-1.5 rounded-lg bg-rose-600/20 text-rose-400 hover:bg-rose-600/30 transition cursor-pointer"
                                title="Revoke Access"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 3: Permission Matrix */}
        {activeSubTab === 'matrix' && (
          <PermissionMatrixTable
            roles={roles}
            selectedDepartmentFilter={selectedDeptFilter}
          />
        )}

        {/* Tab 4: Security Audit Trail */}
        {activeSubTab === 'audit' && (
          <RbacAuditLogView logs={auditLogs} />
        )}
      </div>

      {/* Role Editor Modal */}
      <RoleEditorModal
        isOpen={isRoleModalOpen}
        onClose={() => setIsRoleModalOpen(false)}
        onSave={handleSaveRole}
        roleToEdit={roleToEdit}
        selectedDepartmentFilter={selectedDeptFilter}
      />

      {/* User Editor Modal */}
      <UserEditorModal
        isOpen={isUserModalOpen}
        onClose={() => setIsUserModalOpen(false)}
        onSave={handleSaveUser}
        userToEdit={userToEdit}
        availableRoles={roles}
        selectedDepartmentFilter={selectedDeptFilter}
      />
    </div>
  );
};
