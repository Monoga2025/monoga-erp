import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import AdminDashboardShell, { ADMIN_NAVIGATION } from '../src/client/components/AdminDashboardShell.js';

describe('admin dashboard shell', () => {
  it('exports one honest enabled destination for every existing view', () => {
    const enabled = ADMIN_NAVIGATION.filter((item) => !item.disabled);

    expect(enabled.map((item) => item.id)).toEqual(['dashboard', 'sources', 'youtube', 'search', 'jarvis']);
    expect(new Set(enabled.map((item) => item.destination)).size).toBe(enabled.length);
  });

  it('renders one default current page and disabled demo entries', () => {
    const markup = renderToStaticMarkup(
      React.createElement(AdminDashboardShell, { activeTab: 'dashboard', onNavigate: () => {} })
    );

    expect((markup.match(/aria-current="page"/g) ?? []).length).toBe(1);
    expect(markup).toContain('aria-disabled="true"');
    expect(markup).toContain('Demo');
  });

  it('wires the Search button to the Search destination', () => {
    const navigation = vi.fn();
    const tree = AdminDashboardShell({ activeTab: 'dashboard', onNavigate: navigation });
    const searchButton = findButton(tree, 'Search workspace');

    expect(searchButton).toBeDefined();
    expect(searchButton?.props.onClick).toEqual(expect.any(Function));
    searchButton?.props.onClick();
    expect(navigation).toHaveBeenCalledTimes(1);
    expect(navigation).toHaveBeenCalledWith('search');
    expect(renderToStaticMarkup(tree)).toContain('Search workspace');
  });

  it('keeps the complete legacy stylesheet prefix and uses namespaced shell selectors', () => {
    const stylesheet = readFileSync(resolve(process.cwd(), 'src/client/styles.css'), 'utf8');
    const legacyPrefix = stylesheet.split('/* Admin dashboard shell */')[0];
    const baselineDigest = 'edd2b4af26fa1870acff07487549e6b5978ee999d7db991db81a1e4f6009c46d';

    const normalizedLegacyPrefix = legacyPrefix.replace(/\r\n/g, '\n');

    expect(createHash('sha256').update(normalizedLegacyPrefix).digest('hex')).toBe(baselineDigest);
    expect(stylesheet).toContain('/* Admin dashboard shell */');
    expect(stylesheet).toMatch(/\.admin-shell[^,{]*/);
  });
});

function findButton(element: React.ReactElement, label: string): React.ReactElement | undefined {
  const children = React.Children.toArray(element.props.children);

  for (const child of children) {
    if (!React.isValidElement(child)) continue;
    if (child.type === 'button' && child.props['aria-label'] === label) return child;
    const nested = findButton(child, label);
    if (nested) return nested;
  }

  return undefined;
}
