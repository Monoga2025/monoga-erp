import React from 'react';

export type AdminTab = 'jarvis' | 'dashboard' | 'youtube' | 'sources' | 'search';

type NavigationItem = {
  id: AdminTab | 'demo-folders' | 'demo-tasks';
  label: string;
  destination?: AdminTab;
  disabled?: boolean;
};

export const ADMIN_NAVIGATION: NavigationItem[] = [
  { id: 'dashboard', label: 'Dashboard', destination: 'dashboard' },
  { id: 'sources', label: 'Sources', destination: 'sources' },
  { id: 'youtube', label: 'YouTube Cases', destination: 'youtube' },
  { id: 'search', label: 'Search', destination: 'search' },
  { id: 'jarvis', label: 'JARVIS HUD', destination: 'jarvis' },
  { id: 'demo-folders', label: 'Demo · Folders', disabled: true },
  { id: 'demo-tasks', label: 'Demo · Tasks', disabled: true },
];

type Props = {
  activeTab: AdminTab;
  onNavigate: (tab: AdminTab) => void;
  children?: React.ReactNode;
};

export default function AdminDashboardShell({ activeTab, onNavigate, children }: Props) {
  return (
    <div className="admin-shell">
      <aside className="admin-shell__sidebar" aria-label="Primary navigation">
        <div className="admin-shell__brand">
          <span className="admin-shell__brand-mark" aria-hidden="true">◇</span>
          <span>
            <strong>Monoga</strong>
            <small>ERP workspace</small>
          </span>
        </div>
        <nav className="admin-shell__nav">
          {ADMIN_NAVIGATION.map((item) => {
            const isActive = !item.disabled && item.destination === activeTab;
            return (
              <button
                key={item.id}
                type="button"
                className={`admin-shell__nav-item${isActive ? ' admin-shell__nav-item--active' : ''}`}
                onClick={() => item.destination && onNavigate(item.destination)}
                disabled={item.disabled}
                aria-disabled={item.disabled || undefined}
                aria-current={isActive ? 'page' : undefined}
              >
                <span className="admin-shell__nav-icon" aria-hidden="true">{item.disabled ? '·' : '•'}</span>
                {item.label}
              </button>
            );
          })}
        </nav>
        <div className="admin-shell__promo">
          <strong>Focused workspace</strong>
          <p>Keep live ERP views close and clearly separated from future modules.</p>
        </div>
      </aside>
      <div className="admin-shell__main">
        <header className="admin-shell__topbar">
          <button
            className="admin-shell__search-button"
            type="button"
            onClick={() => onNavigate('search')}
            aria-label="Search workspace"
          >
            <span aria-hidden="true">⌕</span>
            Search workspace
          </button>
          <div className="admin-shell__profile" aria-label="Signed-in profile">
            <span className="admin-shell__avatar" aria-hidden="true">M</span>
            <span><strong>Monoga operator</strong><small>Local workspace</small></span>
          </div>
        </header>
        <main className="admin-shell__content">{children}</main>
      </div>
    </div>
  );
}
