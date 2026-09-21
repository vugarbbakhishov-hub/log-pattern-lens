import type { LogAnalysis, LogLevel } from './log'

export type ReportFormat = 'csv' | 'json'

export interface ReportMeta {
  source: string
  generatedAt: string
}

export interface ReportPreview {
  text: string
  totalLines: number
  visibleLines: number
  hiddenLines: number
  previewLines: number
  truncated: boolean
}

function escapeCsv(value: string | number): string {
  const text = String(value)
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text
}

function row(values: Array<string | number>): string {
  return values.map(escapeCsv).join(',')
}

const levels: LogLevel[] = ['error', 'warn', 'info', 'debug', 'trace', 'unknown']

export function buildJsonReport(analysis: LogAnalysis, meta: ReportMeta): string {
  return `${JSON.stringify(
    {
      tool: 'log-pattern-lens',
      source: meta.source,
      generatedAt: meta.generatedAt,
      summary: {
        totalLines: analysis.totalLines,
        parsedLines: analysis.parsedLines,
        timestampedLines: analysis.timestampedLines,
        continuationLines: analysis.continuationLines,
        stackTraceLines: analysis.stackTraceLines,
        firstTimestamp: analysis.firstTimestamp,
        lastTimestamp: analysis.lastTimestamp,
      },
      levelCounts: analysis.levelCounts,
      topPatterns: analysis.topPatterns,
    },
    null,
    2,
  )}\n`
}

export function buildCsvReport(analysis: LogAnalysis, meta: ReportMeta): string {
  const summary = [
    ['Log Pattern Lens report'],
    ['Source', meta.source],
    ['Generated', meta.generatedAt],
    ['Total lines', analysis.totalLines],
    ['Parsed entries', analysis.parsedLines],
    ['Timestamped entries', analysis.timestampedLines],
    ['Continuation lines', analysis.continuationLines],
    ['Stack trace lines', analysis.stackTraceLines],
    ['First timestamp', analysis.firstTimestamp ?? ''],
    ['Last timestamp', analysis.lastTimestamp ?? ''],
  ]
  const levelRows = [
    ['Level', 'Count'],
    ...levels.map((level) => [level, analysis.levelCounts[level]]),
  ]
  const patternRows = [
    ['Pattern', 'Count', 'Levels', 'First line', 'Continuation lines', 'Stack trace lines', 'Example'],
    ...analysis.topPatterns.map((pattern) => [
      pattern.pattern,
      pattern.count,
      pattern.levels.join(' | '),
      pattern.firstLine,
      pattern.continuationLines,
      pattern.stackTraceLines,
      pattern.examples[0] ?? '',
    ]),
  ]

  return [
    ...summary.map(row),
    '',
    ...levelRows.map(row),
    '',
    ...patternRows.map(row),
  ].join('\n')
}


export function buildReportPreviewDetails(
  analysis: LogAnalysis,
  meta: ReportMeta,
  format: ReportFormat,
  maxLines = 18,
): ReportPreview {
  const fullReport = format === 'csv' ? buildCsvReport(analysis, meta) : buildJsonReport(analysis, meta)
  const lines = fullReport.trimEnd().split('\n')
  const limit = Math.max(1, maxLines)
  const visible = lines.slice(0, limit)
  const hiddenLines = lines.length - visible.length
  const previewLines = hiddenLines > 0 ? [...visible, `... ${hiddenLines} more line${hiddenLines === 1 ? '' : 's'}`] : visible

  return {
    text: previewLines.join('\n'),
    totalLines: lines.length,
    visibleLines: visible.length,
    hiddenLines,
    previewLines: previewLines.length,
    truncated: hiddenLines > 0,
  }
}

export function buildReportPreview(
  analysis: LogAnalysis,
  meta: ReportMeta,
  format: ReportFormat,
  maxLines = 18,
): string {
  return buildReportPreviewDetails(analysis, meta, format, maxLines).text
}

export function reportFileName(source: string, format: ReportFormat): string {
  const safe = source
    .replace(/\.[^./\\]+$/, '')
    .replace(/[^\w.-]+/g, '-')
    .replace(/^[-.]+|[-.]+$/g, '')
  return `${safe || 'logs'}-patterns.${format}`
}

export function reportMimeType(format: ReportFormat): string {
  return format === 'csv' ? 'text/csv;charset=utf-8' : 'application/json;charset=utf-8'
}
