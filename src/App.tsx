import React, { useState } from 'react';
import { TenantProvider, useTenant } from './context/TenantContext.tsx';
import { Header } from './components/layout/Header.tsx';
import { Sidebar } from './components/layout/Sidebar.tsx';
import { OverviewDashboard } from './components/dashboard/OverviewDashboard.tsx';
import { CrmView } from './components/crm/CrmView.tsx';
import { LeadDiscoveryView } from './components/leadgen/LeadDiscoveryView.tsx';
import { AgentsHubView } from './components/agents/AgentsHubView.tsx';
import { OmnichannelInbox } from './components/communications/OmnichannelInbox.tsx';
import { VoiceCenterView } from './components/voice/VoiceCenterView.tsx';
import { VoiceStudioView } from './components/voice/VoiceStudioView.tsx';
import { CalendarBookingsView } from './components/calendar/CalendarBookingsView.tsx';
import { KnowledgeBaseView } from './components/knowledge/KnowledgeBaseView.tsx';
import { CampaignsView } from './components/campaigns/CampaignsView.tsx';
import { AnalyticsView } from './components/analytics/AnalyticsView.tsx';
import { PlatformAdminView } from './components/admin/PlatformAdminView.tsx';
import { SettingsView } from './components/settings/SettingsView.tsx';
import { PaymentPipelineView } from './components/billing/PaymentPipelineView.tsx';
import { CloudApiAndBridgeView } from './components/admin/CloudApiAndBridgeView.tsx';
import { RemoteAgentWorkspaceView } from './components/bridges/RemoteAgentWorkspaceView.tsx';
import { ClientPortalView } from './components/client-portal/ClientPortalView.tsx';
import { LoginView } from './components/auth/LoginView.tsx';
import { PublicChatWidgetModal } from './components/chat-widget/PublicChatWidgetModal.tsx';
import { PublicBookingModal } from './components/booking-page/PublicBookingModal.tsx';
import { ToastContainer } from './components/common/ToastContainer.tsx';
import { Lead } from './types/index.ts';

const AppContent: React.FC = () => {
  const { isLoading, isAuthenticated, currentUser } = useTenant();
  const [currentView, setCurrentView] = useState<string>('dashboard');
  const [isChatModalOpen, setIsChatModalOpen] = useState<boolean>(false);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState<boolean>(false);
  const [activeVoiceLead, setActiveVoiceLead] = useState<Lead | null>(null);
  const [activeInboxLead, setActiveInboxLead] = useState<Lead | null>(null);

  const handleStartVoiceCall = (lead: Lead) => {
    setActiveVoiceLead(lead);
    setCurrentView('voice');
  };

  const handleOpenInboxForLead = (lead: Lead) => {
    setActiveInboxLead(lead);
    setCurrentView('inbox');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#020617] relative overflow-hidden flex items-center justify-center text-white font-sans">
        {/* Ambient background glow orbs */}
        <div className="absolute -top-40 -left-40 w-[500px] h-[500px] bg-indigo-600/30 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute top-60 -right-20 w-[450px] h-[450px] bg-purple-600/20 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute -bottom-20 left-1/3 w-[400px] h-[400px] bg-blue-500/20 rounded-full blur-[100px] pointer-events-none" />

        <div className="relative z-10 flex flex-col items-center gap-4 p-8 rounded-3xl backdrop-blur-xl bg-white/5 border border-white/10 shadow-2xl">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center animate-pulse text-white font-black text-xl shadow-lg shadow-indigo-500/30">
            BH
          </div>
          <p className="text-xs font-semibold uppercase tracking-widest text-white/70">
            Initializing Revenue Operating System (portal.businesshub.app)...
          </p>
        </div>
      </div>
    );
  }

  // If unauthenticated, display the multi-role login screen
  if (!isAuthenticated) {
    return (
      <>
        <LoginView onSuccess={() => setCurrentView('dashboard')} />
        <ToastContainer />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-[#020617] text-white font-sans flex flex-col selection:bg-indigo-500 selection:text-white relative overflow-x-hidden">
      {/* Dynamic Frosted Ambient Glow Orbs */}
      <div className="fixed -top-40 -left-40 w-[600px] h-[600px] bg-indigo-600/25 rounded-full blur-[130px] pointer-events-none -z-10" />
      <div className="fixed top-60 -right-20 w-[500px] h-[500px] bg-purple-600/20 rounded-full blur-[110px] pointer-events-none -z-10" />
      <div className="fixed -bottom-20 left-1/4 w-[450px] h-[450px] bg-blue-500/20 rounded-full blur-[110px] pointer-events-none -z-10" />
      <div className="fixed bottom-1/3 right-1/4 w-[350px] h-[350px] bg-emerald-500/15 rounded-full blur-[100px] pointer-events-none -z-10" />

      {/* Top Header Bar with Frosted Glass */}
      <Header
        currentView={currentView}
        onNavigate={setCurrentView}
        onOpenChatModal={() => setIsChatModalOpen(true)}
        onOpenBookingModal={() => setIsBookingModalOpen(true)}
      />

      {/* Main Workspace: Frosted Sidebar + View Port */}
      <div className="flex flex-1 min-h-[calc(100vh-61px)] relative">
        <Sidebar
          currentView={currentView}
          onNavigate={setCurrentView}
        />

        <main className="flex-1 overflow-y-auto min-w-0 z-0">
          {currentView === 'dashboard' && <OverviewDashboard onNavigate={setCurrentView} />}
          {currentView === 'crm' && (
            <CrmView
              onStartVoiceCall={handleStartVoiceCall}
              onOpenInboxForLead={handleOpenInboxForLead}
            />
          )}
          {currentView === 'billing' && <PaymentPipelineView />}
          {currentView === 'cloud_apis' && (
            <CloudApiAndBridgeView
              onOpenBridgeWorkspace={() => setCurrentView('remote_agent_workspace')}
            />
          )}
          {currentView === 'remote_agent_workspace' && (
            <RemoteAgentWorkspaceView
              onNavigateToCrm={() => setCurrentView('crm')}
              onNavigateToBilling={() => setCurrentView('billing')}
            />
          )}
          {currentView === 'client_portal' && <ClientPortalView />}
          {currentView === 'discovery' && (
            <LeadDiscoveryView
              onNavigateToCrm={() => setCurrentView('crm')}
              onStartVoiceCall={handleStartVoiceCall}
            />
          )}
          {currentView === 'agents' && <AgentsHubView />}
          {currentView === 'inbox' && <OmnichannelInbox initialLead={activeInboxLead} />}
          {currentView === 'voice' && (
            <VoiceCenterView
              initialLead={activeVoiceLead}
              onNavigateToVoiceStudio={() => setCurrentView('voice_studio')}
            />
          )}
          {currentView === 'voice_studio' && <VoiceStudioView />}
          {currentView === 'calendar' && <CalendarBookingsView />}
          {currentView === 'knowledge' && <KnowledgeBaseView />}
          {currentView === 'campaigns' && <CampaignsView />}
          {currentView === 'analytics' && <AnalyticsView />}
          {currentView === 'admin' && <PlatformAdminView />}
          {currentView === 'settings' && <SettingsView />}
        </main>
      </div>

      {/* Global Modals & Notifications */}
      <PublicChatWidgetModal
        isOpen={isChatModalOpen}
        onClose={() => setIsChatModalOpen(false)}
      />
      <PublicBookingModal
        isOpen={isBookingModalOpen}
        onClose={() => setIsBookingModalOpen(false)}
      />
      <ToastContainer />
    </div>
  );
};

export default function App() {
  return (
    <TenantProvider>
      <AppContent />
    </TenantProvider>
  );
}
