import { PromptTemplate } from './PromptTemplate';
import type { AnalyticsData } from '@/types/alert';
import type { AnalyticsComparisonResponse } from '@/hooks/useAnalytics';

interface BriefContext {
  analytics: AnalyticsData;
  comparison?: AnalyticsComparisonResponse | null;
  period: string;
}

export class BriefTemplate extends PromptTemplate {
  constructor() {
    super(`You are an intelligence analyst for TrailSense, a passive RF detection platform for rural and off-grid properties.

Rules:
- Stay grounded in the provided metrics.
- Write an executive summary in 2 short paragraphs.
- Surface 3 to 5 findings.
- Findings must be practical and specific.
- Do not mention cameras or video.
- Output exactly:
SUMMARY:
<summary text>
FINDINGS:
<JSON array of finding objects with title, description, severity, metric?>`);
  }

  buildPrompt(context: BriefContext) {
    const payload = this.truncateText(this.formatContext(context), 1500);

    return this
      .buildFullPrompt(`Generate an intelligence brief for this property.

Period: ${context.period}

Context:
${payload}`);
  }
}

export default BriefTemplate;
