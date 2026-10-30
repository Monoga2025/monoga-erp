import React, { useEffect, useState } from 'react';

type SourceItem = {
  id: string;
  projectId: string;
  name: string;
  access: 'DENIED' | 'METADATA_ONLY';
  createdAt: string;
};

export default function SourcesView() {
  const [sources, setSources] = useState<SourceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSources = () => {
    fetch('/api/v1/sources')
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((json) => {
        setSources(json.sources);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchSources();
  }, []);

  const toggleAccess = (sourceId: string, currentAccess: 'DENIED' | 'METADATA_ONLY') => {
    const nextAccess = currentAccess === 'DENIED' ? 'METADATA_ONLY' : 'DENIED';
    fetch(`/api/v1/sources/${sourceId}/activation-requests`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ access: nextAccess }),
    })
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then(() => {
        fetchSources();
      })
      .catch((err) => {
        alert(`Failed to update access: ${err.message}`);
      });
  };

  if (loading) {
    return <div className="section-card"><p>Loading sources list...</p></div>;
  }

  if (error) {
    return (
      <div className="section-card">
        <p className="badge badge-blocked">Error loading sources: {error}</p>
      </div>
    );
  }

  return (
    <div className="section-card">
      <div className="section-title">
        <span>Sources & Access Control</span>
        <span className="badge badge-metadata">{sources.length} Total Sources</span>
      </div>

      {sources.length === 0 ? (
        <p style={{ color: 'var(--text-muted)' }}>No sources registered yet.</p>
      ) : (
        <table className="data-table">
          <thead>
            <tr>
              <th>Source Name</th>
              <th>Source ID</th>
              <th>Access Level</th>
              <th>Created At</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {sources.map((source) => (
              <tr key={source.id}>
                <td><strong>{source.name}</strong></td>
                <td><code>{source.id}</code></td>
                <td>
                  {source.access === 'METADATA_ONLY' ? (
                    <span className="badge badge-metadata">METADATA_ONLY</span>
                  ) : (
                    <span className="badge badge-denied">DENIED</span>
                  )}
                </td>
                <td>{new Date(source.createdAt).toLocaleString()}</td>
                <td>
                  <button
                    className={`btn ${source.access === 'METADATA_ONLY' ? 'btn-secondary' : ''}`}
                    onClick={() => toggleAccess(source.id, source.access)}
                  >
                    {source.access === 'METADATA_ONLY' ? 'Revoke to DENIED' : 'Activate to METADATA_ONLY'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
