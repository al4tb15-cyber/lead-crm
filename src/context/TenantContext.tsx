import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Tenant, User, UserRole } from '../types/index.ts';
import { api } from '../api/client.ts';

interface Toast {
  id: string;
  type: 'success' | 'info' | 'warning' | 'error';
  title: string;
  message?: string;
}

interface TenantContextType {
  tenants: Tenant[];
  activeTenant: Tenant | null;
  currentUser: User | null;
  users: User[];
  isLoading: boolean;
  isImpersonating: boolean;
  impersonatedBy: string | null;
  toasts: Toast[];
  isAuthenticated: boolean;
  login: (credentials: { email?: string; role?: string; tenantId?: string }) => Promise<void>;
  logout: () => void;
  setActiveTenantId: (id: string) => void;
  switchUser: (userId: string) => void;
  startImpersonation: (tenantId: string) => void;
  stopImpersonation: () => void;
  refreshTenantData: () => Promise<void>;
  addToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
}

const TenantContext = createContext<TenantContextType | null>(null);

export const TenantProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [activeTenant, setActiveTenant] = useState<Tenant | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isImpersonating, setIsImpersonating] = useState<boolean>(false);
  const [impersonatedBy, setImpersonatedBy] = useState<string | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(true);

  const addToast = useCallback((toast: Omit<Toast, 'id'>) => {
    const id = 'toast_' + Math.random().toString(36).substr(2, 9);
    setToasts(prev => [...prev, { ...toast, id }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4500);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const loadInitialData = useCallback(async () => {
    setIsLoading(true);
    try {
      const fetchedTenants = await api.getTenants();
      setTenants(fetchedTenants);
      
      const bh = fetchedTenants.find(t => t.isPlatformOwner) || fetchedTenants[0];
      if (bh) {
        api.setTenantId(bh.id);
        setActiveTenant(bh);
      }

      const fetchedUsers = await api.getUsers();
      setUsers(fetchedUsers);
      const superAdmin = fetchedUsers.find(u => u.role === 'super_admin') || fetchedUsers[0];
      setCurrentUser(superAdmin || null);
    } catch (err: any) {
      console.error('Failed to load tenants:', err);
      addToast({
        type: 'error',
        title: 'Connection Error',
        message: 'Could not connect to backend server.'
      });
    } finally {
      setIsLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  const login = useCallback(async (credentials: { email?: string; role?: string; tenantId?: string }) => {
    setIsLoading(true);
    try {
      const res = await api.login(credentials);
      if (res.user) {
        setCurrentUser(res.user);
        setIsAuthenticated(true);
        if (res.tenant) {
          api.setTenantId(res.tenant.id);
          setActiveTenant(res.tenant);
        }
        addToast({
          type: 'success',
          title: 'Authenticated Successfully',
          message: `Logged in as ${res.user.name} (${res.user.role.toUpperCase()}) on portal.businesshub.app.`
        });
      }
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Authentication Failed',
        message: err.message
      });
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [addToast]);

  const logout = useCallback(() => {
    setIsAuthenticated(false);
    addToast({
      type: 'info',
      title: 'Logged Out',
      message: 'You have safely signed out of your session.'
    });
  }, [addToast]);

  const setActiveTenantId = useCallback((id: string) => {
    const found = tenants.find(t => t.id === id);
    if (found) {
      api.setTenantId(id);
      setActiveTenant(found);
      addToast({
        type: 'info',
        title: 'Tenant Switched',
        message: `Active workspace changed to ${found.name}`
      });
    }
  }, [tenants, addToast]);

  const switchUser = useCallback((userId: string) => {
    const u = users.find(user => user.id === userId);
    if (u) {
      setCurrentUser(u);
      addToast({
        type: 'info',
        title: 'Role & Persona Switched',
        message: `Switched session to ${u.name} (${u.role.replace('_', ' ').toUpperCase()})`
      });
    }
  }, [users, addToast]);

  const startImpersonation = useCallback((targetTenantId: string) => {
    const target = tenants.find(t => t.id === targetTenantId);
    if (!target) return;
    
    setIsImpersonating(true);
    setImpersonatedBy(currentUser?.name || 'Alexander Ross');
    api.setTenantId(targetTenantId);
    setActiveTenant(target);

    addToast({
      type: 'warning',
      title: 'Support Impersonation Mode Active',
      message: `You are now operating inside ${target.name}'s workspace in read/write support mode.`
    });
  }, [tenants, currentUser, addToast]);

  const stopImpersonation = useCallback(() => {
    const bh = tenants.find(t => t.isPlatformOwner) || tenants[0];
    if (bh) {
      setIsImpersonating(false);
      setImpersonatedBy(null);
      api.setTenantId(bh.id);
      setActiveTenant(bh);
      addToast({
        type: 'success',
        title: 'Exited Impersonation',
        message: 'Returned to Business HUB Platform Management.'
      });
    }
  }, [tenants, addToast]);

  const refreshTenantData = useCallback(async () => {
    try {
      const fetchedTenants = await api.getTenants();
      setTenants(fetchedTenants);
      if (activeTenant) {
        const updatedActive = fetchedTenants.find(t => t.id === activeTenant.id);
        if (updatedActive) setActiveTenant(updatedActive);
      }
    } catch (e) {
      console.error(e);
    }
  }, [activeTenant]);

  return (
    <TenantContext.Provider
      value={{
        tenants,
        activeTenant,
        currentUser,
        users,
        isLoading,
        isImpersonating,
        impersonatedBy,
        toasts,
        isAuthenticated,
        login,
        logout,
        setActiveTenantId,
        switchUser,
        startImpersonation,
        stopImpersonation,
        refreshTenantData,
        addToast,
        removeToast
      }}
    >
      {children}
    </TenantContext.Provider>
  );
};

export const useTenant = () => {
  const context = useContext(TenantContext);
  if (!context) throw new Error('useTenant must be used within TenantProvider');
  return context;
};
