import React, { useState } from 'react';
import AdminDashboardShell, { type AdminTab } from './components/AdminDashboardShell.js';
import DashboardView from './views/DashboardView.js';
import SourcesView from './views/SourcesView.js';
import YouTubeCasesView from './views/YouTubeCasesView.js';
import SearchView from './views/SearchView.js';
import JarvisHUDView from './views/JarvisHUDView.js';
import JarvisOmnibar from './components/JarvisOmnibar.js';

export default function App() {
  const [activeTab, setActiveTab] = useState<AdminTab>('dashboard');

  return (
    <AdminDashboardShell activeTab={activeTab} onNavigate={setActiveTab}>
      {activeTab === 'jarvis' && <JarvisHUDView />}
      {activeTab === 'dashboard' && <DashboardView />}
      {activeTab === 'youtube' && <YouTubeCasesView />}
      {activeTab === 'sources' && <SourcesView />}
      {activeTab === 'search' && <SearchView />}
      <JarvisOmnibar />
    </AdminDashboardShell>
  );
}
