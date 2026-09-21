import { describe, expect, it } from 'vitest'
import { analyzeLogs } from './log'
import { buildCsvReport, buildJsonReport, reportFileName, reportMimeType } from './report'

const analysis = analyzeLogs(`2026-09-21T08:14:01Z INFO api ok request_id=req-1
2026-09-21T08:14:04Z ERROR payment failed order_id=900012
2026-09-21T08:14:05Z ERROR payment failed order_id=900013`)
const meta = { source: 'incident.log', generatedAt: '2026-09-21T10:00:00.000Z' }

describe('buildJsonReport', () => {
  it('serializes the summary, level counts and top patterns', () => {
    const report = JSON.parse(buildJsonReport(analysis, meta))

    expect(report.tool).toBe('log-pattern-lens')
    expect(report.summary.parsedLines).toBe(3)
    expect(report.levelCounts.error).toBe(2)
    expect(report.topPatterns[0].pattern).toBe('payment failed order_id=<number>')
  })
})

describe('buildCsvReport', () => {
  it('keeps summary, level counts and patterns in readable blocks', () => {
    const lines = buildCsvReport(analysis, meta).split('\n')

    expect(lines).toContain('Source,incident.log')
    expect(lines).toContain('error,2')
    expect(lines).toContain('Pattern,Count,Levels,First line,Example')
  })
})

describe('reportFileName and reportMimeType', () => {
  it('creates safe report file names', () => {
    expect(reportFileName('prod incident.log', 'json')).toBe('prod-incident-patterns.json')
    expect(reportFileName('***', 'csv')).toBe('logs-patterns.csv')
  })

  it('returns download media types', () => {
    expect(reportMimeType('csv')).toBe('text/csv;charset=utf-8')
    expect(reportMimeType('json')).toBe('application/json;charset=utf-8')
  })
})
