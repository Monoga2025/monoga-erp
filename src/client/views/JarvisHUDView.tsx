import React, { useEffect, useState } from 'react';

type TelemetryData = {
  status: string;
  timestamp: string;
  telemetry: {
    projectsCount: number;
    sourcesCount: number;
    activeSourcesCount: number;
    promptsCount: number;
    projects: Array<{
      id: string;
      name: string;
      status: string;
      createdAt: string;
    }>;
  };
};

type PromptItem = {
  id: string;
  slug: string;
  category: string;
  title: string;
  content: string;
  variablesJson?: string;
};

type QueryPlanResponse = {
  plan: {
    planId: string;
    planHash: string;
    purpose: string;
    budgetCap: number;
    createdAt: string;
  };
};

export default function JarvisHUDView() {
  const [telemetry, setTelemetry] = useState<TelemetryData | null>(null);
  const [prompts, setPrompts] = useState<PromptItem[]>([]);
  const [selectedPrompt, setSelectedPrompt] = useState<PromptItem | null>(null);
  const [varValues, setVarValues] = useState<Record<string, string>>({});
  const [copied, setCopied] = useState(false);
  const [queryPlan, setQueryPlan] = useState<QueryPlanResponse['plan'] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>('ALL');
  const [currentTime, setCurrentTime] = useState<string>(new Date().toLocaleTimeString());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date().toLocaleTimeString()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    Promise.all([
      fetch('/api/v1/jarvis/telemetry').then((r) => r.json()),
      fetch('/api/v1/prompts').then((r) => r.json()),
    ])
      .then(([telemRes, promptsRes]) => {
        setTelemetry(telemRes);
        const fetchedPrompts: PromptItem[] = promptsRes.prompts || [];
        setPrompts(fetchedPrompts);
        if (fetchedPrompts.length > 0) {
          setSelectedPrompt(fetchedPrompts[0]);
        }
        setLoading(false);
      })
      .catch((err) => {
        setError((err as Error).message);
        setLoading(false);
      });
  }, []);

  // Extract {{variable}} placeholders from prompt content
  const extractVariables = (text: string): string[] => {
    const matches = text.match(/\{\{([^}]+)\}\}/g) || [];
    return Array.from(new Set(matches.map((m) => m.replace(/[\{\}]/g, '').trim())));
  };

  const currentVariables = selectedPrompt ? extractVariables(selectedPrompt.content) : [];

  const getHydratedPrompt = (): string => {
    if (!selectedPrompt) return '';
    let text = selectedPrompt.content;
    currentVariables.forEach((v) => {
      const val = varValues[v] || `{{${v}}}`;
      text = text.replaceAll(`{{${v}}}`, val);
    });
    return text;
  };

  const handleCopyPrompt = () => {
    const hydrated = getHydratedPrompt();
    void navigator.clipboard.writeText(hydrated);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExecuteAiPlan = async () => {
    if (!selectedPrompt) return;
    try {
      const res = await fetch('/api/v1/ai/query-plans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          purpose: `Execute Prompt: ${selectedPrompt.title}`,
          promptId: selectedPrompt.id,
          budgetCap: 1.0,
        }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = (await res.json()) as QueryPlanResponse;
      setQueryPlan(json.plan);
    } catch (err) {
      alert(`Plan forecast failed: ${(err as Error).message}`);
    }
  };

  const categories = Array.from(new Set(['ALL', ...prompts.map((p) => p.category)]));
  const filteredPrompts = activeCategory === 'ALL' ? prompts : prompts.filter((p) => p.category === activeCategory);

  if (loading) {
    return (
      <div className="section-card" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
        <div style={{ fontSize: '2.5rem', marginBottom: '1rem', animation: 'spin 2s linear infinite' }}>⚡</div>
        <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.25rem', color: 'var(--accent-cyan)' }}>
          SYNCHRONIZING JARVIS EXECUTIVE MATRIX
        </h3>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.5rem' }}>
          Querying local loopback telemetry and 12+ workspace projects...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="section-card" style={{ borderColor: 'rgba(244, 63, 94, 0.4)' }}>
        <p className="badge badge-blocked">HUD Offline: {error}</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Hero Arc Reactor & Armor Telemetry Cockpit */}
      <div
        className="section-card"
        style={{
          background: 'linear-gradient(135deg, rgba(13, 18, 30, 0.85) 0%, rgba(8, 14, 26, 0.95) 100%)',
          border: '1px solid rgba(56, 189, 248, 0.25)',
          boxShadow: '0 0 40px rgba(56, 189, 248, 0.08), var(--shadow-luxury)',
          position: 'relative',
        }}
      >
        {/* Top Header Bar of Hero */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            {/* Arc Reactor Glowing Orb */}
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '50%',
                background: 'radial-gradient(circle, #00f2fe 10%, #0284c7 60%, rgba(0,0,0,0.8) 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 0 25px #00f2fe, inset 0 0 10px #ffffff',
                border: '2px solid rgba(255, 255, 255, 0.6)',
              }}
            >
              <div
                style={{
                  width: '16px',
                  height: '16px',
                  borderRadius: '50%',
                  background: '#ffffff',
                  boxShadow: '0 0 10px #ffffff',
                }}
              />
            </div>
            <div>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.35rem', fontWeight: 800, letterSpacing: '-0.02em' }}>
                JARVIS EXECUTIVE COMMAND COCKPIT
              </h2>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                <span className="beacon-dot" />
                <span style={{ color: 'var(--accent-emerald)', fontWeight: 600 }}>AUTONOMOUS READY</span>
                <span>•</span>
                <span>Local Time: <strong style={{ color: 'var(--text-main)', fontFamily: 'var(--font-mono)' }}>{currentTime}</strong></span>
                <span>•</span>
                <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent-blue)' }}>127.0.0.1:3001</span>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span className="brand-badge" style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', color: '#34d399', borderColor: 'rgba(16, 185, 129, 0.3)' }}>
              ⚡ MARK 85 RUNTIME
            </span>
          </div>
        </div>

        {/* 4 Luxury KPI Stat Cards */}
        <div className="card-grid" style={{ marginBottom: 0 }}>
          <div className="metric-card" style={{ borderTop: '2px solid var(--accent-blue)' }}>
            <div className="metric-label">Active Workspace Projects</div>
            <div className="metric-value" style={{ color: '#38bdf8' }}>
              {telemetry?.telemetry.projectsCount || 0}
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
              Indexed in Local SQLite
            </div>
          </div>

          <div className="metric-card" style={{ borderTop: '2px solid var(--accent-emerald)' }}>
            <div className="metric-label">Prompt Vault Matrix</div>
            <div className="metric-value" style={{ color: '#34d399' }}>
              {telemetry?.telemetry.promptsCount || 0}
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
              Templates with Variable Injection
            </div>
          </div>

          <div className="metric-card" style={{ borderTop: '2px solid var(--accent-amber)' }}>
            <div className="metric-label">Active Evidence Sources</div>
            <div className="metric-value" style={{ color: '#fbbf24' }}>
              {telemetry?.telemetry.activeSourcesCount || 0}
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
              YouTube & Metadata Adapters
            </div>
          </div>

          <div className="metric-card" style={{ borderTop: '2px solid var(--accent-purple)' }}>
            <div className="metric-label">Arc Reactor Health</div>
            <div className="metric-value" style={{ color: '#c084fc' }}>
              99.9%
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
              Zero Token Leakage Shield
            </div>
          </div>
        </div>
      </div>

      {/* Main Split Grid: Prompt Vault Matrix & 12+ Projects Radar */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '1.5rem' }}>
        {/* Left Column: Prompt Vault Matrix & Studio */}
        <div className="section-card">
          <div className="section-title">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ color: 'var(--accent-blue)', fontSize: '1.2rem' }}>🎯</span>
              <span>PROMPT VAULT & VARIABLE INJECTION MATRIX</span>
            </div>
            <span className="badge badge-metadata">Interactive Vault</span>
          </div>

          {/* Category Filter Pills */}
          <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
            {categories.map((cat) => (
              <button
                key={cat}
                className={`btn ${activeCategory === cat ? '' : 'btn-secondary'}`}
                style={{ fontSize: '0.75rem', padding: '0.35rem 0.75rem', borderRadius: '9999px' }}
                onClick={() => setActiveCategory(cat)}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Prompt Selector Dropdown */}
          {filteredPrompts.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', padding: '1rem 0' }}>No prompts found for `{activeCategory}`.</p>
          ) : (
            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.4rem', fontWeight: 600 }}>
                SELECT ACTIVE PROMPT STRATEGY:
              </label>
              <select
                className="search-input"
                style={{ margin: 0, fontWeight: 600 }}
                value={selectedPrompt?.id || ''}
                onChange={(e) => {
                  const p = prompts.find((item) => item.id === e.target.value);
                  if (p) {
                    setSelectedPrompt(p);
                    setVarValues({});
                    setQueryPlan(null);
                  }
                }}
              >
                {filteredPrompts.map((p) => (
                  <option key={p.id} value={p.id}>
                    [{p.category}] {p.title} ({p.slug})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Dynamic Variable Input Form */}
          {selectedPrompt && currentVariables.length > 0 && (
            <div
              style={{
                backgroundColor: 'rgba(6, 9, 16, 0.6)',
                border: '1px solid rgba(56, 189, 248, 0.2)',
                padding: '1.15rem',
                borderRadius: '0.75rem',
                marginBottom: '1.25rem',
              }}
            >
              <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--accent-cyan)', marginBottom: '0.75rem', letterSpacing: '0.05em' }}>
                ⚡ INJECT DYNAMIC VARIABLES ({currentVariables.length}):
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: currentVariables.length > 2 ? '1fr 1fr' : '1fr', gap: '0.75rem' }}>
                {currentVariables.map((v) => (
                  <div key={v}>
                    <label style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem', fontFamily: 'var(--font-mono)' }}>
                      {`{{${v}}}`}
                    </label>
                    <input
                      type="text"
                      className="search-input"
                      style={{ margin: 0, padding: '0.45rem 0.65rem', fontSize: '0.85rem' }}
                      placeholder={`Value for ${v}...`}
                      value={varValues[v] || ''}
                      onChange={(e) => setVarValues({ ...varValues, [v]: e.target.value })}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Live Hydrated Preview & Code Output */}
          {selectedPrompt && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>HYDRATED PROMPT OUTPUT:</span>
                <span style={{ fontSize: '0.72rem', color: 'var(--accent-blue)', fontFamily: 'var(--font-mono)' }}>
                  {getHydratedPrompt().length} characters
                </span>
              </div>
              <textarea
                readOnly
                rows={7}
                style={{
                  width: '100%',
                  backgroundColor: 'rgba(6, 9, 16, 0.9)',
                  border: '1px solid var(--border-color)',
                  color: 'var(--text-main)',
                  padding: '0.85rem',
                  borderRadius: '0.65rem',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.82rem',
                  lineHeight: 1.5,
                  resize: 'vertical',
                }}
                value={getHydratedPrompt()}
              />

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem', flexWrap: 'wrap' }}>
                <button className="btn" onClick={handleCopyPrompt}>
                  {copied ? '✓ Copied to Clipboard!' : '📋 Copy Hydrated Prompt'}
                </button>
                <button className="btn btn-secondary" onClick={handleExecuteAiPlan}>
                  🛡️ Forecast Arc Reactor Plan ($1.00 Cap)
                </button>
              </div>

              {/* Arc Reactor AI Query Plan Forecast Card */}
              {queryPlan && (
                <div
                  style={{
                    marginTop: '1.25rem',
                    padding: '1rem',
                    backgroundColor: 'rgba(16, 185, 129, 0.08)',
                    border: '1px solid rgba(16, 185, 129, 0.3)',
                    borderRadius: '0.75rem',
                    fontSize: '0.82rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.35rem',
                  }}
                >
                  <div style={{ color: '#34d399', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <span>✓</span>
                    <span>ARC REACTOR AI QUERY PLAN GOVERNED & SECURED</span>
                  </div>
                  <div style={{ color: 'var(--text-muted)' }}>
                    Purpose: <strong style={{ color: 'var(--text-main)' }}>{queryPlan.purpose}</strong>
                  </div>
                  <div style={{ color: 'var(--text-muted)' }}>
                    Plan ID: <code style={{ color: 'var(--accent-cyan)' }}>{queryPlan.planId}</code>
                  </div>
                  <div style={{ color: 'var(--text-muted)', wordBreak: 'break-all' }}>
                    SHA256 Hash: <code style={{ color: '#c084fc', fontSize: '0.72rem' }}>{queryPlan.planHash}</code>
                  </div>
                  <div style={{ marginTop: '0.25rem' }}>
                    <span className="badge badge-ready">
                      Budget Shield Active: Max ${queryPlan.budgetCap.toFixed(2)} USD
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Column: 12+ Workspace Projects Radar Grid */}
        <div className="section-card">
          <div className="section-title">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ color: 'var(--accent-cyan)', fontSize: '1.2rem' }}>📡</span>
              <span>WORKSPACE RADAR (12+ PROJECTS)</span>
            </div>
            <span className="badge badge-ready">{telemetry?.telemetry.projects.length || 0} Synced</span>
          </div>

          <div style={{ maxHeight: '560px', overflowY: 'auto', paddingRight: '0.25rem' }}>
            {telemetry?.telemetry.projects.map((proj) => (
              <div
                key={proj.id}
                style={{
                  backgroundColor: 'rgba(6, 9, 16, 0.65)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '0.75rem',
                  padding: '0.85rem 1rem',
                  marginBottom: '0.65rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(56, 189, 248, 0.35)';
                  e.currentTarget.style.backgroundColor = 'rgba(13, 18, 30, 0.9)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border-color)';
                  e.currentTarget.style.backgroundColor = 'rgba(6, 9, 16, 0.65)';
                }}
              >
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <span style={{ color: 'var(--accent-cyan)' }}>⚡</span>
                    {proj.name}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-subtle)', fontFamily: 'var(--font-mono)', marginTop: '0.2rem' }}>
                    ID: {proj.id.substring(0, 16)}...
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.3rem' }}>
                  <span className="badge badge-ready" style={{ fontSize: '0.65rem', padding: '0.15rem 0.5rem' }}>
                    ONLINE
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
