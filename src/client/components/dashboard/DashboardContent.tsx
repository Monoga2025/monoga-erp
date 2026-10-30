import React from 'react';
import { dashboardDemoData as demo } from '../../data/dashboardDemoData.js';

type HomeData = { status: string; summary: { totalProjects: number; totalSources: number; activeSources: number; deniedSources: number }; recentArtifacts: Array<Record<string, unknown>> };
export type LiveState = { loading: boolean; error: string | null; data: HomeData | null };

type Props = { liveState: LiveState; launcherState?: { status: 'idle' | 'loading' | 'success' | 'error'; message?: string }; onOpenYouTubeContentOs?: () => void };
const lines = (value: string) => value.split('\n').map((line, index) => <React.Fragment key={line}>{index > 0 && <br />}{line}</React.Fragment>);

export default function DashboardContent({ liveState, launcherState = { status: 'idle' }, onOpenYouTubeContentOs = () => undefined }: Props) {
  return <div className="admin-dashboard">
    <section className="admin-dashboard__hero"><div><p>{demo.hero.greeting}</p><h1>{demo.hero.title}</h1><p>{demo.hero.subtitle}</p></div><article><small>{demo.hero.quoteLabel}</small><strong>{demo.hero.quote}</strong></article></section>
    <p className="admin-dashboard__disclosure">{demo.disclosure}</p>
    <section className="admin-dashboard__module-grid" aria-label="Workspace modules">
      <button type="button" className="admin-dashboard__module" onClick={onOpenYouTubeContentOs} disabled={launcherState.status === 'loading'} aria-describedby="youtube-content-os-status">
        <span className="admin-dashboard__launcher-icon" aria-hidden="true">▶</span>
        <span className="admin-dashboard__launcher-eyebrow">Workspace module</span>
        <strong id="youtube-content-os-title">YouTube Content OS</strong>
        <span>Open in Windows Explorer</span>
        <span className="admin-dashboard__module-action">{launcherState.status === 'loading' ? 'Opening…' : 'Open YouTube Content OS'}</span>
      </button>
      <p id="youtube-content-os-status" className="admin-dashboard__launcher-status" aria-live="polite">{launcherState.message ?? 'Ready to open the workspace.'}</p>
    </section>
    <div className="admin-dashboard__grid admin-dashboard__grid--top"><section className="admin-dashboard__card"><h2>▣ { 'Carpetas y proyectos'}</h2><p>Accede rápidamente a tus proyectos y carpetas de trabajo.</p><div className="admin-dashboard__folders">{demo.folders.map(([name, description, count, tone]) => <article className={`admin-dashboard__folder admin-dashboard__folder--${tone}`} key={name}><span aria-hidden="true">▣</span><h3>{name}</h3><p>{description}</p><small>{count}</small></article>)}</div></section><section className="admin-dashboard__card"><h2>☑ Mis pendientes</h2><p>Tareas y próximos pasos para mantener el enfoque.</p><ul className="admin-dashboard__tasks">{demo.tasks.map(([label, priority, date, tone]) => <li key={label}><span aria-hidden="true">□</span><span>{label}</span><b className={`admin-dashboard__badge admin-dashboard__badge--${tone}`}>{priority}</b><time>{date}</time></li>)}</ul></section></div>
    <div className="admin-dashboard__grid admin-dashboard__grid--bottom"><section className="admin-dashboard__card"><h2>▣ Horario de la semana</h2><p>{demo.schedule.subtitle}</p><table className="admin-dashboard__schedule"><thead><tr><th scope="col">Hora</th>{demo.schedule.days.map((day) => <th scope="col" key={day}>{lines(day)}</th>)}</tr></thead><tbody>{demo.schedule.slots.map((slot, row) => <tr key={slot}><th scope="row">{slot}</th>{demo.schedule.days.map((day, col) => <td key={day}>{demo.schedule.events[row * 3 + col] ? lines(demo.schedule.events[row * 3 + col]) : ''}</td>)}</tr>)}</tbody></table></section><section className="admin-dashboard__card"><h2>♙ Clientes</h2><p>Gestiona tus clientes y proyectos activos.</p><ul className="admin-dashboard__clients">{demo.clients.map(([name, detail, status]) => <li key={name}><strong>{name}</strong><span>{detail}</span><b>{status}</b></li>)}</ul></section><section className="admin-dashboard__card"><h2>▤ Notas rápidas</h2><p>Ideas, recordatorios y cosas por hacer.</p><ul className="admin-dashboard__notes">{demo.notes.map((note) => <li key={note}>{note}</li>)}</ul></section></div>
    <section className="admin-dashboard__card admin-dashboard__live"><h2>Live backend status / evidence</h2>{liveState.loading ? <p>Loading live backend status...</p> : liveState.error ? <p role="alert">{liveState.error}</p> : !liveState.data ? <p>No live backend data.</p> : <><p>Status: <strong>{liveState.data.status}</strong></p><div className="admin-dashboard__metrics">{Object.entries(liveState.data.summary).map(([label, value]) => <span key={label}><small>{label}</small><strong>{value}</strong></span>)}</div>{liveState.data.recentArtifacts.length === 0 ? <p>No recent artifacts.</p> : <ul>{liveState.data.recentArtifacts.map((artifact, index) => <li key={String(artifact.artifactId ?? index)}>{String(artifact.title ?? artifact.kind ?? 'Artifact')} · nativeId: {String(artifact.nativeId ?? '')} · sourceId: {String(artifact.sourceId ?? '')} · revision: {String(artifact.revision ?? '')}</li>)}</ul>}</>}</section>
  </div>;
}
