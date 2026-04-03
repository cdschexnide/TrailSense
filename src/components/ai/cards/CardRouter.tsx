import React from 'react';
import type { StructuredCardData } from '@/types/cardData';
import { AlertBriefingCard } from './AlertBriefingCard';
import { DeviceStatusCard } from './DeviceStatusCard';
import { TimelineCard } from './TimelineCard';
import { SitrepCard } from './SitrepCard';
import { PatternCard } from './PatternCard';
import { TextCard } from './TextCard';

interface CardRouterProps {
  structuredData: StructuredCardData;
  assessment: string;
  assessmentUnavailable?: boolean;
  onCopy?: () => void;
  onFeedback?: (positive: boolean) => void;
}

export const CardRouter: React.FC<CardRouterProps> = ({
  structuredData,
  assessment,
  assessmentUnavailable,
  onCopy,
  onFeedback,
}) => {
  const common = { assessment, assessmentUnavailable, onCopy, onFeedback };

  switch (structuredData.type) {
    case 'alert_query':
      return <AlertBriefingCard data={structuredData} {...common} />;
    case 'device_query':
      return <DeviceStatusCard data={structuredData} {...common} />;
    case 'time_query':
      return <TimelineCard data={structuredData} {...common} />;
    case 'status_overview':
      return <SitrepCard data={structuredData} {...common} />;
    case 'pattern_query':
      return <PatternCard data={structuredData} {...common} />;
    case 'help':
    case 'unknown':
    default:
      return <TextCard {...common} />;
  }
};
