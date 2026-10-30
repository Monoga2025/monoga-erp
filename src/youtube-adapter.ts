import { MetadataStore } from './metadata-store.js';

export type YouTubeFixtureInput = {
  nativeCaseId: string;
  title: string;
  scriptContent?: string;
  rightsEvidence?: string;
  timedVoiceEvidence?: string;
};

export type YouTubeCaseResult = {
  caseId: string;
  nativeCaseId: string;
  sourceId: string;
  title: string;
  readiness: 'READY' | 'BLOCKED';
  blockers: string[];
  citations: string[];
};

export class YouTubeAdapter {
  constructor(private readonly store: MetadataStore) {}

  ingestCase(input: { sourceId: string; fixture: YouTubeFixtureInput }): YouTubeCaseResult {
    const source = this.store.getSource(input.sourceId);
    if (!source || source.access === 'DENIED') {
      throw new Error('Source access is DENIED');
    }

    const { fixture, sourceId } = input;
    const nativeCaseId = fixture.nativeCaseId;

    const scriptNativeId = `${nativeCaseId}:script`;
    let scriptArtifact = this.store.getArtifactByNativeId(sourceId, scriptNativeId);

    const citations: string[] = [];

    if (!scriptArtifact) {
      scriptArtifact = this.store.createArtifact({ sourceId, nativeId: scriptNativeId });
    }
    const scriptRevision = this.store.createArtifactRevision({
      artifactId: scriptArtifact.id,
      citation: `fixture://${nativeCaseId}/script`,
    });
    citations.push(scriptRevision.citation);

    const blockers: string[] = [];

    if (fixture.rightsEvidence) {
      const rightsNativeId = `${nativeCaseId}:rights`;
      let rightsArtifact = this.store.getArtifactByNativeId(sourceId, rightsNativeId);
      if (!rightsArtifact) {
        rightsArtifact = this.store.createArtifact({ sourceId, nativeId: rightsNativeId });
      }
      const rightsRevision = this.store.createArtifactRevision({
        artifactId: rightsArtifact.id,
        citation: `fixture://${nativeCaseId}/rights`,
      });
      citations.push(rightsRevision.citation);
    } else {
      blockers.push('RIGHTS_EVIDENCE_MISSING');
    }

    if (fixture.timedVoiceEvidence) {
      const voiceNativeId = `${nativeCaseId}:voice`;
      let voiceArtifact = this.store.getArtifactByNativeId(sourceId, voiceNativeId);
      if (!voiceArtifact) {
        voiceArtifact = this.store.createArtifact({ sourceId, nativeId: voiceNativeId });
      }
      const voiceRevision = this.store.createArtifactRevision({
        artifactId: voiceArtifact.id,
        citation: `fixture://${nativeCaseId}/voice`,
      });
      citations.push(voiceRevision.citation);
    } else {
      blockers.push('TIMED_VOICE_EVIDENCE_MISSING');
    }

    const readiness = blockers.length === 0 ? 'READY' : 'BLOCKED';

    return {
      caseId: scriptArtifact.id,
      nativeCaseId,
      sourceId,
      title: fixture.title,
      readiness,
      blockers,
      citations,
    };
  }
}
