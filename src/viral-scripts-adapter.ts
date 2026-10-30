import { readFileSync } from 'node:fs';
import { MetadataStore } from './metadata-store.js';
import { YouTubeAdapter, type YouTubeCaseResult, type YouTubeFixtureInput } from './youtube-adapter.js';

export class ViralScriptsAdapter {
  private readonly adapter: YouTubeAdapter;

  constructor(private readonly store: MetadataStore) {
    this.adapter = new YouTubeAdapter(store);
  }

  ingestMarkdownFile(sourceId: string, filePath: string): YouTubeCaseResult[] {
    const fileContent = readFileSync(filePath, 'utf-8');
    const lines = fileContent.split(/\r?\n/);

    const results: YouTubeCaseResult[] = [];
    let currentTitle = '';
    let currentNativeId = '';
    let currentContentBuffer: string[] = [];
    let videoIndex = 0;

    const flushCurrentVideo = () => {
      if (currentTitle && currentNativeId) {
        const fixture: YouTubeFixtureInput = {
          nativeCaseId: currentNativeId,
          title: currentTitle,
          scriptContent: currentContentBuffer.join('\n').trim(),
        };
        const caseResult = this.adapter.ingestCase({ sourceId, fixture });
        results.push(caseResult);
      }
      currentTitle = '';
      currentNativeId = '';
      currentContentBuffer = [];
    };

    for (const line of lines) {
      const videoHeaderMatch = line.match(/^###?\s*🎬?\s*Video\s*\d+:\s*["']?([^"'\r\n]+)["']?/i);
      if (videoHeaderMatch) {
        flushCurrentVideo();
        videoIndex += 1;
        currentTitle = videoHeaderMatch[1].trim();
        currentNativeId = `yt-viral-video-${videoIndex}`;
        continue;
      }

      if (currentTitle) {
        currentContentBuffer.push(line);
      }
    }

    flushCurrentVideo();
    return results;
  }
}
