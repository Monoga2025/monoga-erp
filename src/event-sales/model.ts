export const PIPELINE_STAGES = ['new', 'contacted', 'pain-identified', 'diagnosis', 'demo', 'proposal', 'follow-up', 'won', 'lost', 'nurture'] as const;
export type PipelineStage = typeof PIPELINE_STAGES[number];
export type Consent = 'unknown' | 'granted' | 'declined';

export interface ProspectInput {
  contact: string; company: string; role: string; industry: string; pain: string;
  urgency: string; decisionAuthority: string; budget: string; consent: Consent;
  stage?: PipelineStage; nextAction: string; followUpDate: string; notes: string;
}
export interface Prospect extends ProspectInput { id: string; stage: PipelineStage; createdAt: string; updatedAt: string; }

export const PROPOSAL_APPROVAL_STATES = ['draft', 'pending-human-review', 'approved', 'declined'] as const;
export type ProposalApprovalState = typeof PROPOSAL_APPROVAL_STATES[number];

export interface EvidenceProvenance {
  source: 'synthetic';
  location: 'local';
}

export interface ProposalDraftInput {
  prospectId: string;
  title: string;
  scope: string;
  verifiedEvidence: string[];
  evidenceProvenance: EvidenceProvenance;
  consent: Consent;
}
export interface ProposalDraft extends ProposalDraftInput {
  id: string;
  approvalState: ProposalApprovalState;
  reviewerId?: string;
  reviewedAt?: string;
  createdAt: string;
  updatedAt: string;
}

const text = (value: string, field: string) => {
  if (typeof value !== 'string' || !value.trim()) throw new Error(`${field} is required`);
  return value.trim();
};

const isIsoTimestamp = (value: string): boolean =>
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/.test(value) && Number.isFinite(Date.parse(value));

export function validateProspect(input: ProspectInput): ProspectInput {
  const result = { ...input, stage: input.stage ?? 'new' };
  for (const field of ['contact', 'company', 'role', 'industry', 'pain', 'urgency', 'decisionAuthority', 'budget', 'nextAction', 'followUpDate', 'notes'] as const) text(result[field], field);
  if (!PIPELINE_STAGES.includes(result.stage)) throw new Error('stage is invalid');
  if (!['unknown', 'granted', 'declined'].includes(result.consent)) throw new Error('consent is invalid');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(result.followUpDate)) throw new Error('followUpDate must be YYYY-MM-DD');
  return result;
}

export const SYNTHETIC_FIXTURES: ProspectInput[] = [
  { contact: 'Ana Torres', company: 'Café Andino', role: 'Operations lead', industry: 'Hospitality', pain: 'Manual follow-up after inquiries', urgency: 'This month', decisionAuthority: 'Influencer', budget: 'To qualify', consent: 'granted', stage: 'new', nextAction: 'Ask about current workflow', followUpDate: '2026-11-18', notes: 'Synthetic summit fixture.' },
  { contact: 'Luis Gómez', company: 'Norte Logistics', role: 'Founder', industry: 'Logistics', pain: 'Slow quote turnaround', urgency: 'This quarter', decisionAuthority: 'Decision maker', budget: 'COP 5–10M', consent: 'unknown', stage: 'contacted', nextAction: 'Schedule diagnosis', followUpDate: '2026-11-19', notes: 'Synthetic summit fixture.' },
];

export class EventSalesStore {
  private readonly prospects = new Map<string, Prospect>();
  private readonly proposals = new Map<string, ProposalDraft>();
  private sequence = 0;
  private proposalSequence = 0;
  constructor(private readonly now: () => string = () => new Date().toISOString()) {}
  create(input: ProspectInput): Prospect { const valid = validateProspect(input); const timestamp = this.now(); const prospect = { ...valid, id: `summit-${++this.sequence}`, stage: valid.stage!, createdAt: timestamp, updatedAt: timestamp }; this.prospects.set(prospect.id, prospect); return prospect; }
  list(): Prospect[] { return [...this.prospects.values()]; }
  get(id: string): Prospect { const found = this.prospects.get(id); if (!found) throw new Error('Prospect not found'); return found; }
  move(id: string, stage: PipelineStage, nextAction?: string): Prospect { const prospect = this.get(id); if (!PIPELINE_STAGES.includes(stage)) throw new Error('stage is invalid'); prospect.stage = stage; if (nextAction !== undefined) prospect.nextAction = text(nextAction, 'nextAction'); prospect.updatedAt = this.now(); return prospect; }
  createProposal(input: ProposalDraftInput): ProposalDraft {
    const prospect = this.prospects.get(input.prospectId);
    if (!prospect) throw new Error('Prospect not found');
    text(input.title, 'title'); text(input.scope, 'scope');
    if (prospect.consent !== 'granted') throw new Error('linked prospect consent is required');
    if (!Array.isArray(input.verifiedEvidence) || input.verifiedEvidence.length === 0 || input.verifiedEvidence.some((item) => typeof item !== 'string' || !item.trim())) throw new Error('verifiedEvidence is required');
    if (input.evidenceProvenance?.source !== 'synthetic' || input.evidenceProvenance.location !== 'local') throw new Error('synthetic local evidence provenance is required');
    const timestamp = this.now();
    const proposal = { ...input, consent: prospect.consent, id: `proposal-${++this.proposalSequence}`, approvalState: 'draft' as const, createdAt: timestamp, updatedAt: timestamp };
    this.proposals.set(proposal.id, proposal); return proposal;
  }
  getProposal(id: string): ProposalDraft { const found = this.proposals.get(id); if (!found) throw new Error('Proposal not found'); return found; }
  listProposals(): ProposalDraft[] { return [...this.proposals.values()]; }
  updateProposalApproval(id: string, state: Exclude<ProposalApprovalState, 'draft'>, audit?: { reviewerId: string; reviewedAt: string }): ProposalDraft {
    const proposal = this.getProposal(id);
    if (proposal.approvalState === 'approved' || proposal.approvalState === 'declined') throw new Error('proposal is already decided');
    if (proposal.approvalState === 'draft' && state !== 'pending-human-review') throw new Error('proposal must enter human review first');
    if (proposal.approvalState === 'pending-human-review' && state !== 'approved' && state !== 'declined') throw new Error('proposal must be approved or declined');
    if ((state === 'approved' || state === 'declined') && (!audit || !audit.reviewerId.trim() || !audit.reviewedAt.trim())) throw new Error('reviewerId and reviewedAt are required');
    if (audit && !isIsoTimestamp(audit.reviewedAt.trim())) throw new Error('reviewedAt must be a valid ISO timestamp');
    proposal.approvalState = state;
    if (audit) { proposal.reviewerId = text(audit.reviewerId, 'reviewerId'); proposal.reviewedAt = text(audit.reviewedAt, 'reviewedAt'); }
    proposal.updatedAt = this.now(); return proposal;
  }
}
