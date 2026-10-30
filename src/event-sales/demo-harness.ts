import { EventSalesStore, PIPELINE_STAGES, SYNTHETIC_FIXTURES, type Prospect } from './model.js';

/** Local-only, deterministic harness. It has no network or service adapters. */
export class LocalDemoHarness {
  private store: EventSalesStore;

  constructor(private readonly now: () => string = () => new Date().toISOString()) {
    this.store = new EventSalesStore(now);
  }

  /** Remove all records and restart IDs at summit-1. */
  reset(): void {
    this.store = new EventSalesStore(this.now);
  }

  /** Reset first, then load fresh copies of the synthetic fixtures. */
  seed(): Prospect[] {
    this.reset();
    return SYNTHETIC_FIXTURES.map((fixture) => this.store.create({ ...fixture }));
  }

  list(): Prospect[] { return this.store.list(); }

  /** Repeatable prospect-pipeline walkthrough used in the live demo. */
  runProspectPipelineDemo(): Prospect[] {
    this.seed();
    const first = this.store.list()[0];
    for (const stage of PIPELINE_STAGES.slice(1, 7)) this.store.move(first.id, stage);
    return this.list();
  }

  /** Build a synthetic proposal locally; approval remains an explicit human action. */
  runProposalDraftDemo() {
    this.seed();
    const prospect = this.store.list()[0];
    return this.store.createProposal({
      prospectId: prospect.id,
      title: 'Synthetic workflow review',
      scope: 'Review the stated follow-up workflow and identify next steps.',
      verifiedEvidence: ['Prospect supplied a stated manual follow-up pain.'],
      evidenceProvenance: { source: 'synthetic', location: 'local' },
      consent: prospect.consent,
    });
  }
}

export function createLocalDemoHarness(now?: () => string): LocalDemoHarness {
  return new LocalDemoHarness(now);
}
