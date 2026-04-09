// Lazy imports — these native modules crash at import time if the binary
// was built without them (e.g. stale dev client). Deferring the require
// to call-time keeps the rest of the app functional.
const getPrint = () =>
  require('expo-print') as typeof import('expo-print');
const getSharing = () =>
  require('expo-sharing') as typeof import('expo-sharing');
const getFileSystem = () =>
  require('expo-file-system/legacy') as typeof import('expo-file-system/legacy');
import type { AnalyticsComparisonResponse } from '@/hooks/useAnalytics';
import type { AnalyticsData } from '@/types/alert';
import type { IntelligenceBrief, ReportConfig } from '@/types/report';
import { REPORT_TEMPLATES } from '@/types/report';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const escapeHtml = (value: string | number | null | undefined) =>
  String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

const csvCell = (value: string | number | null | undefined) =>
  `"${String(value ?? '').replace(/"/g, '""')}"`;

const buildFileBaseName = (templateLabel: string, period: string) => {
  const date = new Date().toISOString().slice(0, 10);
  return `TrailSense_${templateLabel.replace(/\s+/g, '')}_${period}_${date}`;
};

const renderTable = (
  title: string,
  rows: Array<[string, string | number]>,
  headers?: [string, string]
) => `
  <h2>${escapeHtml(title)}</h2>
  <table>
    ${headers ? `<thead><tr><th>${escapeHtml(headers[0])}</th><th>${escapeHtml(headers[1])}</th></tr></thead>` : ''}
    <tbody>
      ${rows
        .map(
          ([label, value]) =>
            `<tr><td>${escapeHtml(label)}</td><td>${escapeHtml(value)}</td></tr>`
        )
        .join('')}
    </tbody>
  </table>
`;

const renderMetrics = (
  items: Array<{ label: string; value: string | number }>
) => `
  <div class="metrics">
    ${items
      .map(
        item =>
          `<div class="metric"><div class="metric-value">${escapeHtml(item.value)}</div><div class="metric-label">${escapeHtml(item.label)}</div></div>`
      )
      .join('')}
  </div>
`;

const HTML_STYLE = `
  @page { margin: 40px 36px; }
  * { box-sizing: border-box; }
  body {
    font-family: -apple-system, 'Helvetica Neue', Helvetica, Arial, sans-serif;
    padding: 0; margin: 0; color: #1a1a2e;
    font-size: 13px; line-height: 1.5;
  }

  /* Header bar */
  .report-header {
    background: linear-gradient(135deg, #1a1a2e 0%, #2d2d44 100%);
    color: #fff; padding: 28px 32px 22px; margin: -40px -36px 28px;
  }
  .report-header h1 { margin: 0 0 2px; font-size: 22px; font-weight: 700; letter-spacing: -0.3px; }
  .report-header .subtitle { color: #a0a0b8; font-size: 12px; margin: 0; }
  .report-header .meta { color: #7a7a96; font-size: 11px; margin-top: 8px; }
  .brand { color: #d4a853; font-weight: 600; }

  /* Section headings */
  h2 {
    font-size: 14px; font-weight: 700; text-transform: uppercase;
    letter-spacing: 0.8px; color: #6b6b4e; margin: 24px 0 10px;
    padding-bottom: 6px; border-bottom: 2px solid #e8e4d8;
  }
  h3 { font-size: 13px; font-weight: 600; color: #1a1a2e; margin: 14px 0 6px; }

  /* Body text */
  p { color: #4a4a5a; margin: 0 0 8px; line-height: 1.6; }

  /* Metric cards row */
  .metrics {
    display: flex; gap: 10px; flex-wrap: wrap; margin: 12px 0 18px;
  }
  .metric {
    flex: 1; min-width: 100px;
    background: #f8f7f4; border: 1px solid #e8e4d8;
    border-radius: 8px; padding: 12px 14px;
  }
  .metric-value { font-size: 22px; font-weight: 700; color: #1a1a2e; }
  .metric-label {
    font-size: 9px; font-weight: 600; text-transform: uppercase;
    letter-spacing: 0.6px; color: #8a8a7a; margin-top: 2px;
  }

  /* Tables */
  table { width: 100%; border-collapse: collapse; margin: 6px 0 16px; }
  thead th {
    text-align: left; font-size: 10px; font-weight: 600;
    text-transform: uppercase; letter-spacing: 0.5px; color: #8a8a7a;
    padding: 6px 8px; border-bottom: 2px solid #e8e4d8;
  }
  thead th:last-child { text-align: right; }
  td {
    padding: 8px; border-bottom: 1px solid #f0ede6;
    font-size: 13px; color: #3a3a4a;
  }
  td:last-child { text-align: right; font-weight: 600; color: #1a1a2e; }
  tr:last-child td { border-bottom: none; }

  /* Findings list */
  .finding {
    padding: 10px 14px; margin-bottom: 8px;
    border-left: 3px solid #ccc; background: #fafaf8;
    border-radius: 0 6px 6px 0;
  }
  .finding.critical { border-left-color: #ef4444; background: #fef2f2; }
  .finding.warning { border-left-color: #f59e0b; background: #fffbeb; }
  .finding.info { border-left-color: #3b82f6; background: #eff6ff; }
  .finding-title { font-weight: 600; font-size: 13px; color: #1a1a2e; margin: 0; }
  .finding-desc { font-size: 12px; color: #6b6b7a; margin: 2px 0 0; }
  .finding-metric { font-size: 11px; color: #8a8a7a; margin-top: 4px; font-style: italic; }

  /* Modality cards */
  .modality { background: #f8f7f4; border: 1px solid #e8e4d8; border-radius: 8px; padding: 12px 14px; margin-bottom: 8px; }
  .modality-title { font-weight: 700; font-size: 13px; margin: 0 0 4px; }
  .modality-detail { font-size: 12px; color: #6b6b7a; margin: 0; }

  /* Footer */
  .footer {
    margin-top: 32px; padding-top: 12px; border-top: 1px solid #e8e4d8;
    font-size: 10px; color: #a0a0a0; text-align: center;
  }
`;

const wrapHtml = (title: string, description: string, body: string) => {
  const now = new Date();
  const dateStr = now.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  const timeStr = now.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });

  return `<html><head><meta charset="utf-8"><style>${HTML_STYLE}</style></head>
<body>
  <div class="report-header">
    <h1>${escapeHtml(title)}</h1>
    <p class="subtitle">${escapeHtml(description)}</p>
    <p class="meta"><span class="brand">TrailSense</span> &middot; ${escapeHtml(dateStr)} at ${escapeHtml(timeStr)}</p>
  </div>
  ${body}
  <div class="footer">Generated by TrailSense &middot; Property Intrusion Detection System</div>
</body></html>`;
};

// ---------------------------------------------------------------------------
// HTML builders – one per template, mirroring preview sections
// ---------------------------------------------------------------------------

function buildSecuritySummaryHtml(
  analytics: AnalyticsData,
  config: ReportConfig,
  comparison?: AnalyticsComparisonResponse | null
) {
  const sections: string[] = [];

  // Property-wide metrics
  sections.push(
    renderMetrics([
      { label: 'Total Detections', value: analytics.totalAlerts },
      { label: 'Unique Devices', value: analytics.uniqueDevices },
      { label: 'Avg Confidence', value: `${analytics.avgConfidence}%` },
      {
        label: 'Closest Approach',
        value: `${Math.round(analytics.closestApproachMeters)} m`,
      },
    ])
  );

  // Threat distribution (filtered)
  sections.push(
    renderTable(
      'Threat Distribution',
      analytics.threatLevelDistribution
        .filter(item => config.threatLevels.includes(item.level as any))
        .map(item => [item.level, item.count]),
      ['Threat Level', 'Count']
    )
  );

  // Detection types (filtered)
  sections.push(
    renderTable(
      'Detection Types',
      analytics.detectionTypeDistribution
        .filter(item => config.detectionTypes.includes(item.type as any))
        .map(item => [item.type, item.count]),
      ['Type', 'Count']
    )
  );

  // Top devices
  sections.push(
    renderTable(
      'Top Detected Devices',
      analytics.topDetectedDevices
        .slice(0, 5)
        .map(item => [
          `${item.fingerprintHash.slice(0, 12)}...`,
          `${item.count} detections`,
        ]),
      ['Device Fingerprint', 'Detections']
    )
  );

  // Detections by sensor (filtered by deviceIds)
  const sensorTotals = analytics.perSensorTrend
    .flatMap(entry => entry.sensors)
    .filter(sensor => config.deviceIds.includes(sensor.deviceId))
    .reduce<Record<string, { name: string; count: number }>>((acc, sensor) => {
      const cur = acc[sensor.deviceId] || { name: sensor.deviceName, count: 0 };
      cur.count += sensor.count;
      acc[sensor.deviceId] = cur;
      return acc;
    }, {});

  if (Object.keys(sensorTotals).length > 0) {
    sections.push(
      renderTable(
        'Detections by Sensor',
        Object.values(sensorTotals).map(s => [s.name, s.count])
      )
    );
  }

  // Period comparison
  if (comparison?.percentageChange) {
    sections.push(
      renderTable('Period Comparison', [
        ['Total detections', `${comparison.percentageChange.totalDetections}%`],
        ['Unknown devices', `${comparison.percentageChange.unknownDevices}%`],
        [
          'Avg response time',
          `${comparison.percentageChange.avgResponseTime}%`,
        ],
      ])
    );
  }

  return sections.join('');
}

function buildActivityReportHtml(
  analytics: AnalyticsData,
  config: ReportConfig
) {
  const sections: string[] = [];
  const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Daily trend
  sections.push(
    renderTable(
      'Daily Trend',
      analytics.dailyTrend.map(item => [item.date, item.count])
    )
  );

  // Hourly distribution
  const hourlyCounts = (analytics.hourlyDayOfWeekDistribution || []).reduce<
    Record<number, number>
  >((acc, entry) => {
    acc[entry.hour] = (acc[entry.hour] || 0) + entry.count;
    return acc;
  }, {});
  sections.push(
    renderTable(
      'Hourly Distribution',
      Array.from({ length: 24 }, (_, h) => [`${h}:00`, hourlyCounts[h] || 0])
    )
  );

  // Day of week
  sections.push(
    renderTable(
      'Day of Week Distribution',
      (analytics.dayOfWeekDistribution || []).map(item => [
        dayLabels[item.day] || `Day ${item.day}`,
        item.count,
      ])
    )
  );

  // Nighttime activity
  sections.push(
    renderMetrics([
      {
        label: 'Nighttime Share',
        value: `${Math.round(analytics.nighttimeActivity.percentOfTotal)}%`,
      },
      { label: 'Nighttime Count', value: analytics.nighttimeActivity.count },
    ])
  );

  // Activity by sensor (filtered)
  const sensorRows = analytics.perSensorTrend
    .slice(-7)
    .flatMap(entry =>
      entry.sensors
        .filter(sensor => config.deviceIds.includes(sensor.deviceId))
        .map(
          sensor =>
            [`${entry.date} · ${sensor.deviceName}`, sensor.count] as [
              string,
              number,
            ]
        )
    );
  if (sensorRows.length > 0) {
    sections.push(renderTable('Activity by Sensor', sensorRows));
  }

  return sections.join('');
}

function buildSignalAnalysisHtml(
  analytics: AnalyticsData,
  config: ReportConfig
) {
  const sections: string[] = [];

  // RSSI distribution + stats
  sections.push(
    renderMetrics([
      { label: 'Median RSSI', value: `${analytics.medianRssi} dBm` },
      { label: 'Peak RSSI', value: `${analytics.peakRssi} dBm` },
    ])
  );
  sections.push(
    renderTable(
      'RSSI Distribution',
      analytics.rssiDistribution.map(item => [
        `${item.bucketMin} to ${item.bucketMax} dBm`,
        item.count,
      ])
    )
  );

  // Proximity zones
  sections.push(
    renderTable(
      'Proximity Zones',
      analytics.proximityZoneDistribution.map(item => [item.zone, item.count])
    )
  );

  // Modality breakdown (filtered by detectionTypes)
  const modalitySections: string[] = [];
  if (config.detectionTypes.includes('wifi')) {
    const w = analytics.modalityBreakdown.wifi;
    modalitySections.push(
      `<div class="modality"><p class="modality-title" style="color:#3b82f6">WiFi</p><p class="modality-detail">${w.count} detections &middot; ${w.channelsActive} active channels &middot; ${w.probeRequestPercent}% probe requests</p></div>`
    );
  }
  if (config.detectionTypes.includes('bluetooth')) {
    const b = analytics.modalityBreakdown.ble;
    modalitySections.push(
      `<div class="modality"><p class="modality-title" style="color:#7c3aed">Bluetooth</p><p class="modality-detail">${b.count} detections &middot; ${b.phonePercent}% phones &middot; ${b.applePercent}% Apple &middot; ${b.beaconPercent}% beacons</p></div>`
    );
  }
  if (config.detectionTypes.includes('cellular')) {
    const c = analytics.modalityBreakdown.cellular;
    modalitySections.push(
      `<div class="modality"><p class="modality-title" style="color:#ea580c">Cellular</p><p class="modality-detail">${c.count} detections &middot; ${c.avgPeakDbm} dBm peak &middot; ${c.avgBurstDurationMs}ms burst</p></div>`
    );
  }
  if (modalitySections.length > 0) {
    sections.push(`<h2>Modality Breakdown</h2>${modalitySections.join('')}`);
  }

  // Cross-modal correlation
  sections.push(
    renderMetrics([
      {
        label: 'WiFi ↔ BLE Links',
        value: analytics.crossModalStats.wifiBleLinks,
      },
      {
        label: 'Link Confidence',
        value: `${Math.round(analytics.crossModalStats.avgLinkConfidence)}%`,
      },
      {
        label: 'Phantom Merges',
        value: analytics.crossModalStats.phantomMerges,
      },
    ])
  );

  // Signal strength trend (filtered)
  if (analytics.rssiTrend.length > 0) {
    const trendRows = analytics.rssiTrend.map(point => {
      const values: string[] = [];
      if (config.detectionTypes.includes('wifi'))
        values.push(`WiFi ${point.wifiAvgRssi ?? '-'}`);
      if (config.detectionTypes.includes('bluetooth'))
        values.push(`BLE ${point.bleAvgRssi ?? '-'}`);
      if (config.detectionTypes.includes('cellular'))
        values.push(`Cell ${point.cellularAvgRssi ?? '-'}`);
      return [point.date, values.join(' · ')] as [string, string];
    });
    sections.push(renderTable('Signal Strength Trend', trendRows));
  }

  return sections.join('');
}

// ---------------------------------------------------------------------------
// CSV builders – one per template, mirroring preview sections
// ---------------------------------------------------------------------------

function buildSecuritySummaryCsv(
  analytics: AnalyticsData,
  config: ReportConfig,
  comparison?: AnalyticsComparisonResponse | null
) {
  const lines: string[] = [];

  // Summary
  lines.push('summary');
  lines.push(
    [
      'period',
      'total_detections',
      'unique_devices',
      'avg_confidence',
      'closest_approach_m',
    ]
      .map(csvCell)
      .join(',')
  );
  lines.push(
    [
      analytics.period,
      analytics.totalAlerts,
      analytics.uniqueDevices,
      analytics.avgConfidence,
      analytics.closestApproachMeters,
    ]
      .map(csvCell)
      .join(',')
  );
  lines.push('');

  // Threat distribution
  lines.push('threat_distribution');
  lines.push(['threat_level', 'count'].map(csvCell).join(','));
  analytics.threatLevelDistribution
    .filter(item => config.threatLevels.includes(item.level as any))
    .forEach(item =>
      lines.push([item.level, item.count].map(csvCell).join(','))
    );
  lines.push('');

  // Detection types
  lines.push('detection_types');
  lines.push(['type', 'count'].map(csvCell).join(','));
  analytics.detectionTypeDistribution
    .filter(item => config.detectionTypes.includes(item.type as any))
    .forEach(item =>
      lines.push([item.type, item.count].map(csvCell).join(','))
    );
  lines.push('');

  // Top devices
  lines.push('top_devices');
  lines.push(['fingerprint', 'count'].map(csvCell).join(','));
  analytics.topDetectedDevices
    .slice(0, 5)
    .forEach(item =>
      lines.push([item.fingerprintHash, item.count].map(csvCell).join(','))
    );
  lines.push('');

  // Per-sensor
  const sensorTotals = analytics.perSensorTrend
    .flatMap(e => e.sensors)
    .filter(s => config.deviceIds.includes(s.deviceId))
    .reduce<Record<string, { name: string; count: number }>>((acc, s) => {
      const cur = acc[s.deviceId] || { name: s.deviceName, count: 0 };
      cur.count += s.count;
      acc[s.deviceId] = cur;
      return acc;
    }, {});
  if (Object.keys(sensorTotals).length > 0) {
    lines.push('detections_by_sensor');
    lines.push(['device_name', 'count'].map(csvCell).join(','));
    Object.values(sensorTotals).forEach(s =>
      lines.push([s.name, s.count].map(csvCell).join(','))
    );
    lines.push('');
  }

  // Comparison
  if (comparison?.percentageChange) {
    lines.push('comparison');
    lines.push(['metric', 'percent_change'].map(csvCell).join(','));
    lines.push(
      ['total_detections', comparison.percentageChange.totalDetections]
        .map(csvCell)
        .join(',')
    );
    lines.push(
      ['unknown_devices', comparison.percentageChange.unknownDevices]
        .map(csvCell)
        .join(',')
    );
    lines.push(
      ['avg_response_time', comparison.percentageChange.avgResponseTime]
        .map(csvCell)
        .join(',')
    );
  }

  return lines.join('\n');
}

function buildActivityReportCsv(
  analytics: AnalyticsData,
  config: ReportConfig
) {
  const lines: string[] = [];
  const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Daily trend
  lines.push('daily_trend');
  lines.push(['date', 'count'].map(csvCell).join(','));
  analytics.dailyTrend.forEach(item =>
    lines.push([item.date, item.count].map(csvCell).join(','))
  );
  lines.push('');

  // Hourly distribution
  const hourlyCounts = (analytics.hourlyDayOfWeekDistribution || []).reduce<
    Record<number, number>
  >((acc, entry) => {
    acc[entry.hour] = (acc[entry.hour] || 0) + entry.count;
    return acc;
  }, {});
  lines.push('hourly_distribution');
  lines.push(['hour', 'count'].map(csvCell).join(','));
  for (let h = 0; h < 24; h++) {
    lines.push([`${h}:00`, hourlyCounts[h] || 0].map(csvCell).join(','));
  }
  lines.push('');

  // Day of week
  lines.push('day_of_week');
  lines.push(['day', 'count'].map(csvCell).join(','));
  (analytics.dayOfWeekDistribution || []).forEach(item =>
    lines.push(
      [dayLabels[item.day] || `${item.day}`, item.count].map(csvCell).join(',')
    )
  );
  lines.push('');

  // Nighttime
  lines.push('nighttime_activity');
  lines.push(['nighttime_count', 'nighttime_percent'].map(csvCell).join(','));
  lines.push(
    [
      analytics.nighttimeActivity.count,
      analytics.nighttimeActivity.percentOfTotal,
    ]
      .map(csvCell)
      .join(',')
  );
  lines.push('');

  // Per-sensor trend
  const sensorRows = analytics.perSensorTrend
    .slice(-7)
    .flatMap(entry =>
      entry.sensors
        .filter(s => config.deviceIds.includes(s.deviceId))
        .map(s => [entry.date, s.deviceId, s.deviceName, s.count])
    );
  if (sensorRows.length > 0) {
    lines.push('activity_by_sensor');
    lines.push(
      ['date', 'device_id', 'device_name', 'count'].map(csvCell).join(',')
    );
    sensorRows.forEach(row => lines.push(row.map(csvCell).join(',')));
  }

  return lines.join('\n');
}

function buildSignalAnalysisCsv(
  analytics: AnalyticsData,
  config: ReportConfig
) {
  const lines: string[] = [];

  // RSSI summary
  lines.push('rssi_summary');
  lines.push(['rssi_median', 'rssi_peak'].map(csvCell).join(','));
  lines.push([analytics.medianRssi, analytics.peakRssi].map(csvCell).join(','));
  lines.push('');

  // RSSI distribution
  lines.push('rssi_distribution');
  lines.push(
    ['rssi_bucket_min', 'rssi_bucket_max', 'count'].map(csvCell).join(',')
  );
  analytics.rssiDistribution.forEach(item =>
    lines.push(
      [item.bucketMin, item.bucketMax, item.count].map(csvCell).join(',')
    )
  );
  lines.push('');

  // Proximity zones
  lines.push('proximity_zones');
  lines.push(['zone', 'count'].map(csvCell).join(','));
  analytics.proximityZoneDistribution.forEach(item =>
    lines.push([item.zone, item.count].map(csvCell).join(','))
  );
  lines.push('');

  // Confidence tiers
  lines.push('confidence_distribution');
  lines.push(['tier', 'count'].map(csvCell).join(','));
  analytics.confidenceDistribution.forEach(item =>
    lines.push([item.tier, item.count].map(csvCell).join(','))
  );
  lines.push('');

  // Modality breakdown (filtered)
  lines.push('modality_breakdown');
  lines.push(['modality', 'count', 'detail'].map(csvCell).join(','));
  if (config.detectionTypes.includes('wifi')) {
    const w = analytics.modalityBreakdown.wifi;
    lines.push(
      [
        'wifi',
        w.count,
        `${w.channelsActive} channels, ${w.probeRequestPercent}% probe`,
      ]
        .map(csvCell)
        .join(',')
    );
  }
  if (config.detectionTypes.includes('bluetooth')) {
    const b = analytics.modalityBreakdown.ble;
    lines.push(
      [
        'bluetooth',
        b.count,
        `${b.phonePercent}% phone, ${b.applePercent}% apple, ${b.beaconPercent}% beacon`,
      ]
        .map(csvCell)
        .join(',')
    );
  }
  if (config.detectionTypes.includes('cellular')) {
    const c = analytics.modalityBreakdown.cellular;
    lines.push(
      [
        'cellular',
        c.count,
        `${c.avgPeakDbm} dBm peak, ${c.avgBurstDurationMs}ms burst`,
      ]
        .map(csvCell)
        .join(',')
    );
  }
  lines.push('');

  // Cross-modal
  lines.push('cross_modal');
  lines.push(
    ['wifi_ble_links', 'avg_link_confidence', 'phantom_merges']
      .map(csvCell)
      .join(',')
  );
  lines.push(
    [
      analytics.crossModalStats.wifiBleLinks,
      analytics.crossModalStats.avgLinkConfidence,
      analytics.crossModalStats.phantomMerges,
    ]
      .map(csvCell)
      .join(',')
  );
  lines.push('');

  // RSSI trend (filtered)
  if (analytics.rssiTrend.length > 0) {
    const headers = ['date'];
    if (config.detectionTypes.includes('wifi')) headers.push('wifi_avg_rssi');
    if (config.detectionTypes.includes('bluetooth'))
      headers.push('ble_avg_rssi');
    if (config.detectionTypes.includes('cellular'))
      headers.push('cellular_avg_rssi');
    lines.push('rssi_trend');
    lines.push(headers.map(csvCell).join(','));
    analytics.rssiTrend.forEach(point => {
      const row: (string | number | null)[] = [point.date];
      if (config.detectionTypes.includes('wifi')) row.push(point.wifiAvgRssi);
      if (config.detectionTypes.includes('bluetooth'))
        row.push(point.bleAvgRssi);
      if (config.detectionTypes.includes('cellular'))
        row.push(point.cellularAvgRssi);
      lines.push(row.map(csvCell).join(','));
    });
  }

  return lines.join('\n');
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export const buildReportHtml = ({
  config,
  analytics,
  comparison,
}: {
  config: ReportConfig;
  analytics: AnalyticsData;
  comparison?: AnalyticsComparisonResponse | null;
}) => {
  const template = REPORT_TEMPLATES[config.template];
  let body: string;

  switch (config.template) {
    case 'security-summary':
      body = buildSecuritySummaryHtml(analytics, config, comparison);
      break;
    case 'activity-report':
      body = buildActivityReportHtml(analytics, config);
      break;
    case 'signal-analysis':
      body = buildSignalAnalysisHtml(analytics, config);
      break;
  }

  return wrapHtml(template.name, template.description, body);
};

export const buildReportCsv = ({
  config,
  analytics,
  comparison,
}: {
  config: ReportConfig;
  analytics: AnalyticsData;
  comparison?: AnalyticsComparisonResponse | null;
}) => {
  switch (config.template) {
    case 'security-summary':
      return buildSecuritySummaryCsv(analytics, config, comparison);
    case 'activity-report':
      return buildActivityReportCsv(analytics, config);
    case 'signal-analysis':
      return buildSignalAnalysisCsv(analytics, config);
  }
};

export const buildBriefHtml = (brief: IntelligenceBrief) => {
  const periodLabel =
    brief.period === 'day'
      ? 'Last 24 Hours'
      : brief.period === 'week'
        ? 'Last 7 Days'
        : brief.period === 'month'
          ? 'Last 30 Days'
          : 'Last Year';

  const findingsHtml = brief.findings
    .map(
      finding =>
        `<div class="finding ${finding.severity}">
          <p class="finding-title">${escapeHtml(finding.title)}</p>
          <p class="finding-desc">${escapeHtml(finding.description)}</p>
          ${finding.metric ? `<p class="finding-metric">${escapeHtml(finding.metric)}</p>` : ''}
        </div>`
    )
    .join('');

  const summaryParagraphs = brief.summary
    .split('\n')
    .filter(p => p.trim())
    .map(p => `<p>${escapeHtml(p.trim())}</p>`)
    .join('');

  return wrapHtml(
    'Intelligence Brief',
    `${periodLabel} Analysis`,
    `
    <h2>Executive Summary</h2>
    ${summaryParagraphs}
    <h2>Key Findings</h2>
    ${findingsHtml || '<p style="color:#8a8a7a">No notable findings for this period.</p>'}
    `
  );
};

export const buildBriefCsv = (brief: IntelligenceBrief) => {
  const lines = [
    ['title', 'description', 'severity', 'metric'].map(csvCell).join(','),
  ];
  brief.findings.forEach(finding => {
    lines.push(
      [
        finding.title,
        finding.description,
        finding.severity,
        finding.metric || '',
      ]
        .map(csvCell)
        .join(',')
    );
  });
  return lines.join('\n');
};

export const sharePdf = async (html: string, fileBaseName: string) => {
  const Print = getPrint();
  const Sharing = getSharing();
  const { uri } = await Print.printToFileAsync({ html });
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(uri, {
      mimeType: 'application/pdf',
      dialogTitle: fileBaseName,
      UTI: 'com.adobe.pdf',
    });
  }
  return uri;
};

export const shareCsv = async (csv: string, fileBaseName: string) => {
  const FileSystem = getFileSystem();
  const Sharing = getSharing();
  const directory = FileSystem.cacheDirectory || FileSystem.documentDirectory;
  const uri = `${directory}${fileBaseName}.csv`;
  await FileSystem.writeAsStringAsync(uri, csv, {
    encoding: FileSystem.EncodingType.UTF8,
  });
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(uri, {
      mimeType: 'text/csv',
      dialogTitle: fileBaseName,
      UTI: 'public.comma-separated-values-text',
    });
  }
  return uri;
};

export const exportReportPdf = async (args: {
  config: ReportConfig;
  analytics: AnalyticsData;
  comparison?: AnalyticsComparisonResponse | null;
}) => {
  const fileBaseName = buildFileBaseName(
    REPORT_TEMPLATES[args.config.template].name,
    args.config.period
  );
  return sharePdf(buildReportHtml(args), fileBaseName);
};

export const exportReportCsv = async (args: {
  config: ReportConfig;
  analytics: AnalyticsData;
  comparison?: AnalyticsComparisonResponse | null;
}) => {
  const fileBaseName = buildFileBaseName(
    REPORT_TEMPLATES[args.config.template].name,
    args.config.period
  );
  return shareCsv(buildReportCsv(args), fileBaseName);
};

export const exportBriefPdf = async (brief: IntelligenceBrief) => {
  return sharePdf(
    buildBriefHtml(brief),
    buildFileBaseName('IntelligenceBrief', brief.period)
  );
};

export const exportBriefCsv = async (brief: IntelligenceBrief) => {
  return shareCsv(
    buildBriefCsv(brief),
    buildFileBaseName('IntelligenceBrief', brief.period)
  );
};
