import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { EventSalesStore, PIPELINE_STAGES, SYNTHETIC_FIXTURES, validateProspect } from '../src/event-sales/model.js';
import { createLocalDemoHarness } from '../src/event-sales/demo-harness.js';

describe('Luque Business Summit local sales model', () => {
  it('captures a synthetic prospect and moves through every supported stage', () => {
    const store = new EventSalesStore(() => '2026-11-17T10:00:00.000Z');
    const prospect = store.create(SYNTHETIC_FIXTURES[0]);
    expect(prospect.stage).toBe('new');
    for (const stage of PIPELINE_STAGES) expect(store.move(prospect.id, stage).stage).toBe(stage);
    expect(store.list()).toHaveLength(1);
  });
  it('seeds deterministically and reset clears data and restarts IDs', () => {
    const harness = createLocalDemoHarness(() => '2026-11-17T10:00:00.000Z');
    expect(harness.seed().map(({ id, contact }) => ({ id, contact }))).toEqual([
      { id: 'summit-1', contact: 'Ana Torres' },
      { id: 'summit-2', contact: 'Luis Gómez' },
    ]);
    harness.reset();
    expect(harness.list()).toEqual([]);
    expect(harness.seed()[0].id).toBe('summit-1');
  });
  it('repeats the prospect pipeline walkthrough without external services', () => {
    const harness = createLocalDemoHarness(() => '2026-11-17T10:00:00.000Z');
    expect(harness.runProspectPipelineDemo()[0].stage).toBe('follow-up');
    expect(harness.runProspectPipelineDemo()[0].id).toBe('summit-1');
  });
  it('creates a consented proposal draft and requires human approval order', () => {
    const store = new EventSalesStore(() => '2026-11-17T10:00:00.000Z');
    const prospect = store.create(SYNTHETIC_FIXTURES[0]);
    const proposal = store.createProposal({ prospectId: prospect.id, title: 'Synthetic proposal', scope: 'Review workflow.', verifiedEvidence: ['Observed synthetic pain.'], evidenceProvenance: { source: 'synthetic', location: 'local' }, consent: 'granted' });
    expect(proposal.approvalState).toBe('draft');
    expect(() => store.updateProposalApproval(proposal.id, 'approved')).toThrow('human review');
    expect(() => store.updateProposalApproval(proposal.id, 'pending-human-review')).not.toThrow();
    expect(() => store.updateProposalApproval(proposal.id, 'pending-human-review')).toThrow('approved or declined');
    expect(store.updateProposalApproval(proposal.id, 'approved', { reviewerId: 'reviewer-1', reviewedAt: '2026-11-17T10:05:00.000Z' }).approvalState).toBe('approved');
    expect(store.getProposal(proposal.id)).toMatchObject({ reviewerId: 'reviewer-1', reviewedAt: '2026-11-17T10:05:00.000Z' });
    expect(() => store.updateProposalApproval(proposal.id, 'declined')).toThrow('already decided');
  });
  it('requires consent and verified evidence for local proposal drafts', () => {
    const store = new EventSalesStore();
    const prospect = store.create(SYNTHETIC_FIXTURES[0]);
    expect(() => store.createProposal({ prospectId: prospect.id, title: 'Synthetic', scope: 'Scope', verifiedEvidence: ['Evidence'], evidenceProvenance: { source: 'synthetic', location: 'local' }, consent: 'unknown' })).not.toThrow();
    const unknownProspect = store.create(SYNTHETIC_FIXTURES[1]);
    expect(() => store.createProposal({ prospectId: unknownProspect.id, title: 'Synthetic', scope: 'Scope', verifiedEvidence: ['Evidence'], evidenceProvenance: { source: 'synthetic', location: 'local' }, consent: 'granted' })).toThrow('linked prospect consent');
    const declinedProspect = store.create({ ...SYNTHETIC_FIXTURES[0], consent: 'declined' });
    expect(() => store.createProposal({ prospectId: declinedProspect.id, title: 'Synthetic', scope: 'Scope', verifiedEvidence: ['Evidence'], evidenceProvenance: { source: 'synthetic', location: 'local' }, consent: 'granted' })).toThrow('linked prospect consent');
    expect(() => store.createProposal({ prospectId: prospect.id, title: 'Synthetic', scope: 'Scope', verifiedEvidence: [], evidenceProvenance: { source: 'synthetic', location: 'local' }, consent: 'granted' })).toThrow('verifiedEvidence');
    expect(() => store.createProposal({ prospectId: prospect.id, title: 'Synthetic', scope: 'Scope', verifiedEvidence: ['Evidence'], evidenceProvenance: undefined as never, consent: 'granted' })).toThrow('provenance');
    expect(() => store.createProposal({ prospectId: 'missing', title: 'Synthetic', scope: 'Scope', verifiedEvidence: ['Evidence'], evidenceProvenance: { source: 'synthetic', location: 'local' }, consent: 'granted' })).toThrow('Prospect not found');
  });
  it('enforces declined terminal state and valid review timestamps', () => {
    const store = new EventSalesStore(() => '2026-11-17T10:00:00.000Z');
    const prospect = store.create(SYNTHETIC_FIXTURES[0]);
    const proposal = store.createProposal({ prospectId: prospect.id, title: 'Synthetic', scope: 'Scope', verifiedEvidence: ['Evidence'], evidenceProvenance: { source: 'synthetic', location: 'local' }, consent: 'granted' });
    store.updateProposalApproval(proposal.id, 'pending-human-review');
    expect(() => store.updateProposalApproval(proposal.id, 'declined', { reviewerId: 'reviewer-1', reviewedAt: 'not-a-timestamp' })).toThrow('valid ISO timestamp');
    expect(() => store.updateProposalApproval(proposal.id, 'declined')).toThrow('reviewerId');
    store.updateProposalApproval(proposal.id, 'declined', { reviewerId: 'reviewer-1', reviewedAt: '2026-11-17T10:05:00.000Z' });
    expect(() => store.updateProposalApproval(proposal.id, 'declined', { reviewerId: 'reviewer-2', reviewedAt: '2026-11-17T10:06:00.000Z' })).toThrow('already decided');
  });
  it('runs the proposal draft harness offline and deterministically', () => {
    const harness = createLocalDemoHarness(() => '2026-11-17T10:00:00.000Z');
    expect(harness.runProposalDraftDemo()).toMatchObject({ id: 'proposal-1', approvalState: 'draft', prospectId: 'summit-1', evidenceProvenance: { source: 'synthetic', location: 'local' } });
  });
  it('rejects missing consent-safe follow-up data', () => {
    expect(() => validateProspect({ ...SYNTHETIC_FIXTURES[0], consent: 'granted', followUpDate: 'tomorrow' })).toThrow('followUpDate');
  });
  it('keeps the T3 demo catalog exact and evidence-safe', () => {
    const catalog = readFileSync(resolve(import.meta.dirname, '../src/event-sales/demo-catalog.md'), 'utf8');
    expect((catalog.match(/^## \d+\./gm) ?? [])).toHaveLength(4);
    for (const required of ['Diagnóstico de crecimiento', 'Automatización comercial / CRM', 'Web funnel', 'Sistema operativo empresarial inspirado en ReferenceCo', 'Estado:', 'Se puede mostrar:', 'No se puede afirmar:', 'Prerrequisitos:', 'Ruta de 3 minutos:', '`prototype`', '`blocked`', 'datos sintéticos', '09 revenue automation', '13 sales engine']) expect(catalog).toContain(required);
    expect(catalog).not.toContain('funcionalmente verificado');
  });
  it('keeps the T6 isolated MVP boundary structural and evidence-safe', () => {
    const boundary = readFileSync(resolve(import.meta.dirname, '../src/event-sales/monoga-mvp-boundary.md'), 'utf8');
    for (const required of ['## Límite del MVP', '### Dentro', '### Fuera', '## Datos y propiedad', '## Fixtures sintéticos mínimos', '## Revisión humana', '## Seguridad y secretos', '## Flujo de demo', '## Criterio para llamarlo funcional', 'No copiar datos', 'no autoriza copiar ReferenceCo', '`prototype`', '`blocked`']) expect(boundary).toContain(required);
    expect(boundary).not.toMatch(/https?:\/\//);
    expect(boundary).not.toMatch(/(?:API[_ -]?KEY|token|password|contraseña)\s*[:=]/i);
  });
  it('keeps the T8 deployment-readiness checklist local and structurally complete', () => {
    const checklist = readFileSync(resolve(import.meta.dirname, '../src/event-sales/deployment-readiness-checklist.md'), 'utf8');
    for (const required of ['## Regla de autorización', '## Ficha por demo', '## Datos, secretos y consentimiento', '## Salud, rollback y operación', '## Coste y ownership', '## Go/no-go explícito', 'sintético→real', 'health checks', 'rollback', 'GO', 'NO-GO', 'Railway', 'CRM externo']) expect(checklist).toContain(required);
    expect(checklist).not.toMatch(/https?:\/\//);
    expect(checklist).not.toMatch(/(?:API[_ -]?KEY|token|password|contraseña)\s*[:=]/i);
  });
  it('keeps T5 collateral structurally complete and evidence-safe', () => {
    const root = resolve(import.meta.dirname, '../src/event-sales');
    const collateral = [
      ['service-catalog.md', ['## 1.', '## 2.', '## 3.', '## 4.', 'Dolor', 'Siguiente paso', '`prototype`', '`blocked`', 'Consentimiento']],
      ['event-handoff-one-pager.md', ['## Dolor expresado', '## Estado de evidencia', '## Siguiente paso acordado', '## Consentimiento', '`granted`', '`declined`', '`unknown`']],
      ['qr-destination-form-copy.md', ['## Texto de destino', '## Campos del formulario', '## Consentimiento obligatorio', '## Límites de evidencia', '`prototype`', '`blocked`']],
      ['proposal-template.md', ['## 1.', '## 2.', '## 3.', '## 4.', '## 5.', '## 6.', '## 7.', 'Consentimiento', '`prototype`', '`blocked`']],
    ] as const;
    for (const [file, required] of collateral) {
      const content = readFileSync(resolve(root, file), 'utf8');
      for (const section of required) expect(content, file).toContain(section);
      expect(content, file).toContain('No afirmar');
      expect(content, file).not.toMatch(/\b(?:COP|USD)\s*\d/);
      expect(content, file).not.toMatch(/https?:\/\//);
    }
  });
  it('keeps the T2 playbook structurally complete and evidence-safe', () => {
    const playbook = readFileSync(resolve(import.meta.dirname, '../src/event-sales/playbook.md'), 'utf8');
    for (const required of ['## 1. Apertura', '## 2. Diagnóstico', '## 3. Transición a demo', '## 4. Objeciones', '## 5. CTA y cadencia', '## 6. Consentimiento', '## 7. Claims no verificados', 'Mismo día', '24 h', '3 días', '7 días', '14 días', 'No se usan listas de asistentes']) expect(playbook).toContain(required);
    expect(playbook).toContain('datos sintéticos');
  });
});
