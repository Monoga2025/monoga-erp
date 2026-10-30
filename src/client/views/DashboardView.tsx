import React, { useEffect, useState } from 'react';
import DashboardContent, { LiveState } from '../components/dashboard/DashboardContent.js';

type HomeData = NonNullable<LiveState['data']>;

export default function DashboardView() {
  const [data, setData] = useState<HomeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [launcherState, setLauncherState] = useState<{ status: 'idle' | 'loading' | 'success' | 'error'; message?: string }>({ status: 'idle' });

  useEffect(() => {
    fetch('/api/v1/home', { headers: { 'x-principal-kind': 'OWNER' } })
      .then((res) => { if (!res.ok) throw new Error(`HTTP ${res.status}`); return res.json(); })
      .then((json) => { setData(json); setLoading(false); })
      .catch((err) => { setError(err.message); setLoading(false); });
  }, []);

  const openYouTubeContentOs = async () => {
    setLauncherState({ status: 'loading', message: 'Opening YouTube Content OS…' });
    try {
      const response = await fetch('/api/v1/workspace-folders/open', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ id: 'youtube-content-os' }) });
      if (!response.ok) throw new Error('The workspace folder is unavailable.');
      setLauncherState({ status: 'success', message: 'YouTube Content OS opened in Explorer.' });
    } catch (err) {
      setLauncherState({ status: 'error', message: err instanceof Error ? err.message : 'Unable to open the workspace folder.' });
    }
  };

  return <DashboardContent liveState={{ loading, error, data }} launcherState={launcherState} onOpenYouTubeContentOs={openYouTubeContentOs} />;
}
