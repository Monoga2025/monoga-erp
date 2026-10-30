import React, { useEffect, useState } from 'react';

type SearchItem = {
  artifactId: string;
  sourceId: string;
  nativeId: string;
  citation: string;
  createdAt: string;
};

export default function SearchView() {
  const [query, setQuery] = useState('');
  const [principal, setPrincipal] = useState<'OWNER' | 'COLLABORATOR'>('OWNER');
  const [results, setResults] = useState<SearchItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    const url = `/api/v1/search?q=${encodeURIComponent(query)}`;
    fetch(url, {
      headers: { 'x-principal-kind': principal },
    })
      .then((res) => res.json())
      .then((json) => {
        setResults(json.results || []);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, [query, principal]);

  return (
    <div className="section-card">
      <div className="section-title">
        <span>Permission-Filtered Global Search</span>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <span className="metric-label" style={{ margin: 0 }}>Simulated Principal:</span>
          <button
            className={`btn ${principal === 'OWNER' ? '' : 'btn-secondary'}`}
            onClick={() => setPrincipal('OWNER')}
          >
            OWNER
          </button>
          <button
            className={`btn ${principal === 'COLLABORATOR' ? '' : 'btn-secondary'}`}
            onClick={() => setPrincipal('COLLABORATOR')}
          >
            COLLABORATOR
          </button>
        </div>
      </div>

      <input
        className="search-input"
        placeholder="Type to search artifacts, native IDs, or citations (e.g. yt-case)..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />

      {loading ? (
        <p style={{ color: 'var(--text-muted)' }}>Searching catalog...</p>
      ) : results.length === 0 ? (
        <div style={{ padding: '1rem', backgroundColor: 'var(--bg-primary)', borderRadius: '0.5rem' }}>
          <p style={{ color: 'var(--text-muted)' }}>
            {principal === 'COLLABORATOR'
              ? 'No permitted results found (COLLABORATOR principal is denied access to METADATA_ONLY sources server-side).'
              : 'No matching artifacts found.'}
          </p>
        </div>
      ) : (
        <table className="data-table">
          <thead>
            <tr>
              <th>Native ID</th>
              <th>Citation Reference</th>
              <th>Source ID</th>
              <th>Created At</th>
            </tr>
          </thead>
          <tbody>
            {results.map((item) => (
              <tr key={item.artifactId + item.citation}>
                <td><code>{item.nativeId}</code></td>
                <td><code>{item.citation}</code></td>
                <td><code>{item.sourceId}</code></td>
                <td>{new Date(item.createdAt).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
