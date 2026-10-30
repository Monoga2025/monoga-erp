import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import DashboardContent from '../src/client/components/dashboard/DashboardContent';
import { dashboardDemoData } from '../src/client/data/dashboardDemoData';

const populated = {
  status: 'ok',
  summary: { totalProjects: 2, totalSources: 3, activeSources: 2, deniedSources: 1 },
  recentArtifacts: [{ artifactId: 'a1', kind: 'NOTE', nativeId: 'native-1', sourceId: 'source-7', revision: 4 }],
};

const html = (liveState = { loading: false, error: null, data: populated }) =>
  renderToStaticMarkup(React.createElement(DashboardContent, { liveState }));

describe('admin dashboard content', () => {
  it('renders every reference section and visible demo disclosure', () => {
    const output = html();
    ['Carpetas y proyectos', 'Mis pendientes', 'Horario de la semana', 'Clientes', 'Notas rápidas', 'Presentación de referencia'].forEach((text) => {
      expect(output).toContain(text);
    });
  });

  it('uses a semantic schedule table and no enabled demo controls', () => {
    const output = html();
    expect(output).toContain('<table');
    expect(output).toContain('<thead>');
    expect(output).toContain('<tbody>');
    expect(output).toContain('Open YouTube Content OS');
    expect(output).not.toMatch(/<input[^>]*>/);
    expect(output).not.toMatch(/<a(?:\s|>)[^>]*>/);
  });

  it('distinguishes loading, error, empty, zero, and populated live evidence', () => {
    expect(html({ loading: true, error: null, data: null })).toContain('Loading live backend status');
    expect(html({ loading: false, error: 'Network unavailable', data: null })).toContain('Network unavailable');
    expect(html({ loading: false, error: null, data: { ...populated, recentArtifacts: [] } })).toContain('No recent artifacts');
    expect(html({ loading: false, error: null, data: { ...populated, summary: { totalProjects: 0, totalSources: 0, activeSources: 0, deniedSources: 0 } } })).toContain('0');
    expect(html()).toContain('source-7');
    expect(html()).toContain('native-1');
    expect(html()).toContain('NOTE');
  });

  it('renders an accessible YouTube Content OS launcher module', () => {
    expect(html()).toContain('YouTube Content OS');
    expect(html()).toContain('Open YouTube Content OS');
    expect(html()).toContain('admin-dashboard__module-grid');
    expect(html()).toContain('admin-dashboard__module');
    expect(html()).toContain('aria-live="polite"');
  });

  it('renders idle, loading, success, and error launcher feedback', () => {
    expect(html()).toContain('Ready to open the workspace.');
    expect(renderToStaticMarkup(React.createElement(DashboardContent, { liveState: { loading: false, error: null, data: populated }, launcherState: { status: 'loading', message: 'Opening…' } }))).toContain('disabled');
    expect(renderToStaticMarkup(React.createElement(DashboardContent, { liveState: { loading: false, error: null, data: populated }, launcherState: { status: 'success', message: 'opened' } }))).toContain('opened');
    expect(renderToStaticMarkup(React.createElement(DashboardContent, { liveState: { loading: false, error: null, data: populated }, launcherState: { status: 'error', message: 'failed' } }))).toContain('failed');
  });

  it('keeps presentation facts in the isolated demo data module', () => {
    expect(dashboardDemoData.hero.title).toBe('Panel administrativo');
    expect(dashboardDemoData.folders.length).toBeGreaterThan(0);
    expect(dashboardDemoData.schedule.days.length).toBeGreaterThan(0);
    expect(html()).toContain(dashboardDemoData.hero.greeting);
  });
});
