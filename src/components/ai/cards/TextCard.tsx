import React from 'react';
import { BriefingContainer } from './BriefingContainer';

interface TextCardProps {
  assessment: string;
  assessmentUnavailable?: boolean;
  onCopy?: () => void;
  onFeedback?: (positive: boolean) => void;
}

export const TextCard: React.FC<TextCardProps> = ({
  assessment,
  assessmentUnavailable,
  onCopy,
  onFeedback,
}) => (
  <BriefingContainer
    label="RESPONSE"
    assessment={assessment}
    assessmentUnavailable={assessmentUnavailable}
    assessmentLabel="RESPONSE"
    onCopy={onCopy}
    onFeedback={onFeedback}
  >
    {null}
  </BriefingContainer>
);
