import React, { useEffect, useState } from 'react';

type CaseResult = {
  caseId: string;
  nativeCaseId: string;
  sourceId: string;
  title: string;
  readiness: 'READY' | 'BLOCKED';
  blockers: string[];
  citations: string[];
};

type SourceItem = {
  id: string;
  name: string;
  access: 'DENIED' | 'METADATA_ONLY';
};

export default function YouTubeCasesView() {
  const [sources, setSources] = useState<SourceItem[]>([]);
  const [selectedSourceId, setSelectedSourceId] = useState<string>('');
  const [cases, setCases] = useState<CaseResult[]>([]);
  const [title, setTitle] = useState('');
  const [nativeCaseId, setNativeCaseId] = useState('');
  const [scriptContent, setScriptContent] = useState('');
  const [rightsEvidence, setRightsEvidence] = useState('');
  const [timedVoiceEvidence, setTimedVoiceEvidence] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/v1/sources')
      .then((res) => res.json())
      .then((json) => {
        setSources(json.sources || []);
        const active = json.sources.find((s: SourceItem) => s.access === 'METADATA_ONLY');
        if (active) setSelectedSourceId(active.id);
        else if (json.sources.length > 0) setSelectedSourceId(json.sources[0].id);
      })
      .catch(() => {});
  }, []);

  const handleCatalogCase = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSourceId) {
      setFormError('Please select a source');
      return;
    }
    if (!nativeCaseId || !title) {
      setFormError('Native Case ID and Title are required');
      return;
    }

    setSubmitting(true);
    setFormError(null);

    fetch('/api/v1/youtube/cases', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sourceId: selectedSourceId,
        fixture: {
          nativeCaseId,
          title,
          scriptContent: scriptContent || undefined,
          rightsEvidence: rightsEvidence || undefined,
          timedVoiceEvidence: timedVoiceEvidence || undefined,
        },
      }),
    })
      .then((res) => {
        if (!res.ok) return res.json().then((j) => { throw new Error(j.error?.message || `HTTP ${res.status}`); });
        return res.json();
      })
      .then((json) => {
        setCases((prev) => [json.case, ...prev]);
        setTitle('');
        setNativeCaseId('');
        setScriptContent('');
        setRightsEvidence('');
        setTimedVoiceEvidence('');
        setSubmitting(false);
      })
      .catch((err) => {
        setFormError(err.message);
        setSubmitting(false);
      });
  };

  return (
    <div>
      <div className="section-card">
        <div className="section-title">
          <span>Catalog New YouTube Case</span>
          <span className="badge badge-metadata">Metadata Adapter</span>
        </div>

        <form onSubmit={handleCatalogCase}>
          {formError && (
            <div style={{ marginBottom: '1rem' }}>
              <span className="badge badge-blocked">{formError}</span>
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
            <div>
              <label className="metric-label">Target Source</label>
              <select
                className="search-input"
                style={{ marginBottom: 0 }}
                value={selectedSourceId}
                onChange={(e) => setSelectedSourceId(e.target.value)}
              >
                {sources.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.access})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="metric-label">Native Case ID</label>
              <input
                className="search-input"
                style={{ marginBottom: 0 }}
                placeholder="e.g. yt-case-101"
                value={nativeCaseId}
                onChange={(e) => setNativeCaseId(e.target.value)}
              />
            </div>
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label className="metric-label">Case Title</label>
            <input
              className="search-input"
              style={{ marginBottom: 0 }}
              placeholder="e.g. Monoga OS Local Architecture Overview"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
            <div>
              <label className="metric-label">Rights Evidence (Optional for test)</label>
              <input
                className="search-input"
                style={{ marginBottom: 0 }}
                placeholder="e.g. Permission verified by owner"
                value={rightsEvidence}
                onChange={(e) => setRightsEvidence(e.target.value)}
              />
            </div>

            <div>
              <label className="metric-label">Timed Voice Evidence (Optional for test)</label>
              <input
                className="search-input"
                style={{ marginBottom: 0 }}
                placeholder="e.g. 15 min audio recording verified"
                value={timedVoiceEvidence}
                onChange={(e) => setTimedVoiceEvidence(e.target.value)}
              />
            </div>
          </div>

          <button className="btn" type="submit" disabled={submitting}>
            {submitting ? 'Cataloging...' : 'Catalog YouTube Case'}
          </button>
        </form>
      </div>

      <div className="section-card">
        <div className="section-title">
          <span>Ingested YouTube Cases</span>
          <span className="badge badge-metadata">{cases.length} Ingested</span>
        </div>

        {cases.length === 0 ? (
          <p style={{ color: 'var(--text-muted)' }}>No YouTube cases ingested in this session yet.</p>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Native ID</th>
                <th>Readiness</th>
                <th>Blockers</th>
                <th>Citations</th>
              </tr>
            </thead>
            <tbody>
              {cases.map((c) => (
                <tr key={c.caseId}>
                  <td><strong>{c.title}</strong></td>
                  <td><code>{c.nativeCaseId}</code></td>
                  <td>
                    {c.readiness === 'READY' ? (
                      <span className="badge badge-ready">READY</span>
                    ) : (
                      <span className="badge badge-blocked">BLOCKED</span>
                    )}
                  </td>
                  <td>
                    {c.blockers.length === 0 ? (
                      <span style={{ color: 'var(--text-muted)' }}>None</span>
                    ) : (
                      <div style={{ display: 'flex', gap: '0.25rem', flexWrap: 'wrap' }}>
                        {c.blockers.map((b) => (
                          <span key={b} className="badge badge-blocked">{b}</span>
                        ))}
                      </div>
                    )}
                  </td>
                  <td>
                    {c.citations.map((cit) => (
                      <div key={cit}><code>{cit}</code></div>
                    ))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
