import React, { useEffect, useState } from 'react';

type HudResults = {
  query: string;
  projects: Array<{ id: string; name: string }>;
  prompts: Array<{ id: string; slug: string; category: string; title: string; content: string }>;
  artifacts: Array<{ artifactId: string; nativeId: string; citation: string }>;
};

type Props = {
  onSelectPrompt?: (promptContent: string) => void;
};

export default function JarvisOmnibar({ onSelectPrompt }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<HudResults | null>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      } else if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    fetch(`/api/v1/jarvis/hud?q=${encodeURIComponent(query)}`)
      .then((res) => res.json())
      .then((json) => setResults(json))
      .catch(() => {});
  }, [query, isOpen]);

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(3, 7, 18, 0.82)',
        backdropFilter: 'blur(16px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        paddingTop: '6rem',
      }}
      onClick={() => setIsOpen(false)}
    >
      <div
        style={{
          backgroundColor: 'rgba(13, 18, 30, 0.95)',
          border: '1px solid rgba(56, 189, 248, 0.35)',
          borderRadius: '1rem',
          width: '100%',
          maxWidth: '680px',
          boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.8), 0 0 30px rgba(56, 189, 248, 0.15)',
          overflow: 'hidden',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            padding: '1.15rem 1.35rem',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.85rem',
            backgroundColor: 'rgba(6, 9, 16, 0.5)',
          }}
        >
          <span style={{ color: 'var(--accent-cyan)', fontWeight: 800, fontSize: '1.1rem', fontFamily: 'var(--font-display)' }}>
            ⚡ JARVIS
          </span>
          <input
            autoFocus
            className="search-input"
            style={{
              margin: 0,
              border: 'none',
              background: 'transparent',
              padding: '0.25rem 0.5rem',
              fontSize: '1rem',
              boxShadow: 'none',
            }}
            placeholder="Search code files, prompt vault, 3D assets, viral scripts..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <span
            style={{
              fontSize: '0.7rem',
              color: 'var(--text-subtle)',
              fontFamily: 'var(--font-mono)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              padding: '0.2rem 0.4rem',
              borderRadius: '0.3rem',
            }}
          >
            ESC to close
          </span>
        </div>

        <div style={{ maxHeight: '420px', overflowY: 'auto', padding: '1.25rem' }}>
          {results?.prompts && results.prompts.length > 0 && (
            <div style={{ marginBottom: '1.25rem' }}>
              <div className="metric-label" style={{ color: 'var(--accent-cyan)' }}>
                Prompt Matrix ({results.prompts.length})
              </div>
              {results.prompts.map((p) => (
                <div
                  key={p.id}
                  style={{
                    padding: '0.65rem 0.85rem',
                    backgroundColor: 'rgba(20, 27, 45, 0.6)',
                    border: '1px solid rgba(255, 255, 255, 0.05)',
                    borderRadius: '0.5rem',
                    marginBottom: '0.4rem',
                    cursor: 'pointer',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    transition: 'all 0.15s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(56, 189, 248, 0.4)';
                    e.currentTarget.style.backgroundColor = 'rgba(30, 41, 69, 0.8)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.05)';
                    e.currentTarget.style.backgroundColor = 'rgba(20, 27, 45, 0.6)';
                  }}
                  onClick={() => {
                    if (onSelectPrompt) onSelectPrompt(p.content);
                    setIsOpen(false);
                  }}
                >
                  <div>
                    <strong style={{ color: 'var(--text-main)' }}>{p.title}</strong>{' '}
                    <code style={{ color: 'var(--accent-blue)', fontSize: '0.75rem' }}>[{p.category}]</code>
                  </div>
                  <span className="badge badge-metadata" style={{ fontSize: '0.68rem' }}>Use Prompt ⚡</span>
                </div>
              ))}
            </div>
          )}

          {results?.projects && results.projects.length > 0 && (
            <div style={{ marginBottom: '1.25rem' }}>
              <div className="metric-label" style={{ color: '#34d399' }}>
                Workspace Projects ({results.projects.length})
              </div>
              {results.projects.map((proj) => (
                <div
                  key={proj.id}
                  style={{
                    padding: '0.65rem 0.85rem',
                    backgroundColor: 'rgba(20, 27, 45, 0.6)',
                    border: '1px solid rgba(255, 255, 255, 0.05)',
                    borderRadius: '0.5rem',
                    marginBottom: '0.4rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                  }}
                >
                  <span style={{ color: 'var(--accent-cyan)' }}>⚡</span>
                  <strong style={{ color: 'var(--text-main)', fontSize: '0.9rem' }}>{proj.name}</strong>
                </div>
              ))}
            </div>
          )}

          {results?.artifacts && results.artifacts.length > 0 && (
            <div>
              <div className="metric-label" style={{ color: '#fbbf24' }}>
                Indexed Evidence Citations ({results.artifacts.length})
              </div>
              {results.artifacts.map((a) => (
                <div
                  key={a.artifactId + a.citation}
                  style={{
                    padding: '0.65rem 0.85rem',
                    backgroundColor: 'rgba(20, 27, 45, 0.6)',
                    border: '1px solid rgba(255, 255, 255, 0.05)',
                    borderRadius: '0.5rem',
                    marginBottom: '0.4rem',
                  }}
                >
                  <code style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{a.citation}</code>
                </div>
              ))}
            </div>
          )}

          {!results?.prompts?.length && !results?.projects?.length && !results?.artifacts?.length && (
            <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', textAlign: 'center', margin: '2rem 0' }}>
              No matches found for &quot;{query}&quot;. Try searching for <i>coding</i>, <i>stark</i>, or <i>sales</i>.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
