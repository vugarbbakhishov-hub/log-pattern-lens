import { describe, expect, it } from 'vitest'
import { analyzeLogs, redactSensitiveValues } from './log'
import {
  buildCsvReport,
  buildJsonReport,
  buildReportPreview,
  buildReportPreviewDetails,
  reportFileName,
  reportMimeType,
} from './report'

const analysis = analyzeLogs(`2026-09-21T08:14:01Z INFO api ok request_id=req-1
2026-09-21T08:14:04Z ERROR payment failed order_id=900012
TypeError: Cannot read properties of undefined
    at chargeCustomer (checkout.ts:42:7)
2026-09-21T08:14:05Z ERROR payment failed order_id=900013`)
const meta = { source: 'incident.log', generatedAt: '2026-09-21T10:00:00.000Z' }

it('exports original sensitive line numbers after blank continuation lines', () => {
  const result = analyzeLogs('INFO config\n\n  password=fake-value')
  expect(JSON.parse(buildJsonReport(result, meta)).sensitiveFindings[0].firstLine).toBe(3)
  expect(buildCsvReport(result, meta).split('\n')).toContain('API key or password assignment,1,3')
})

it.each([
  ['2026-10-08T11:00:00Z INFO later\n2026-10-08T10:00:00Z INFO earlier', 'chronological', '2026-10-08T10:00:00Z', '2026-10-08T11:00:00Z'],
  ['23:59:59 INFO first\n00:00:01 INFO last', 'input', '23:59:59', '00:00:01'],
  ['INFO ready', 'none', undefined, undefined],
])('exports explicit timestamp order for %s', (input, order, first, last) => {
  const result = analyzeLogs(input)
  expect(JSON.parse(buildJsonReport(result, meta)).summary).toMatchObject({ timestampOrder: order })
  expect(JSON.parse(buildJsonReport(result, meta)).summary.firstTimestamp).toBe(first)
  expect(JSON.parse(buildJsonReport(result, meta)).summary.lastTimestamp).toBe(last)
  const csv = buildCsvReport(result, meta).split('\n')
  expect(csv).toContain(`Timestamp order,${order}`)
  expect(csv).toContain(`First timestamp,${first ?? ''}`)
  expect(csv).toContain(`Last timestamp,${last ?? ''}`)
})

it('does not retain masked JSON credentials in exported examples or patterns', () => {
  const input = 'INFO config {"password":"fake secret with spaces","token":"fake_token_value"}'
  const masked = redactSensitiveValues(input)
  expect(masked.replacementCount).toBe(2)
  const safeAnalysis = analyzeLogs(masked.text)
  for (const report of [buildCsvReport(safeAnalysis, meta), buildJsonReport(safeAnalysis, meta)]) {
    expect(report).not.toContain('fake secret with spaces')
    expect(report).not.toContain('fake_token_value')
  }
  expect(safeAnalysis.sensitiveLineCount).toBe(0)
})

describe('buildJsonReport', () => {
  it('serializes the summary, level counts and top patterns', () => {
    const report = JSON.parse(buildJsonReport(analysis, meta))

    expect(report.tool).toBe('log-pattern-lens')
    expect(report.summary.parsedLines).toBe(3)
    expect(report.summary.continuationLines).toBe(2)
    expect(report.summary.stackTraceLines).toBe(2)
    expect(report.summary.sensitiveLineCount).toBe(0)
    expect(report.levelCounts.error).toBe(2)
    expect(report.topPatterns[0].pattern).toBe('api ok request_id=req-1')
  })
})

describe('buildCsvReport', () => {
  it.each(['=1+1', '+1+1', '-1+1', '@SUM(1)', '  =1+1', '\tvalue', '\rvalue', '\nvalue', '＝1+1'])('prefixes formula-like text %j without changing JSON', (value) => {
    const result = analyzeLogs('INFO ready')
    result.topPatterns[0].pattern = value
    result.topPatterns[0].examples = [value]
    const metadata = { source: value, generatedAt: value }
    const cell = `"'${value.replace(/"/g, '""')}"`
    const csv = buildCsvReport(result, metadata)
    expect(csv).toContain(`Source,${cell}\nGenerated,${cell}\n`)
    expect(csv).toContain(`${cell},1,info,1,0,0,${cell}`)
    const json = JSON.parse(buildJsonReport(result, metadata))
    expect(json.source).toBe(value)
    expect(json.topPatterns[0].pattern).toBe(value)
    expect(json.topPatterns[0].examples).toEqual([value])
  })

  it('quotes commas, double quotes and multiline examples while leaving numeric counts intact', () => {
    const result = analyzeLogs('INFO ready')
    result.topPatterns[0].examples = ['message, "quoted"\nsecond line']
    expect(buildCsvReport(result, { ...meta, source: 'prod, "east".log' })).toContain('Source,"prod, ""east"".log"')
    expect(buildCsvReport(result, meta)).toContain('ready,1,info,1,0,0,"message, ""quoted""\nsecond line"')
  })

  it('keeps summary, level counts and patterns in readable blocks', () => {
    const lines = buildCsvReport(analysis, meta).split('\n')

    expect(lines).toContain('Source,incident.log')
    expect(lines).toContain('Continuation lines,2')
    expect(lines).toContain('Stack trace lines,2')
    expect(lines).toContain('Possible sensitive lines,0')
    expect(lines).toContain('Sensitive finding,Count,First line')
    expect(lines).toContain('error,2')
    expect(lines).toContain('Pattern,Count,Levels,First line,Continuation lines,Stack trace lines,Example')
  })
})


describe('buildReportPreview', () => {
  it('returns a bounded preview with a remaining line count', () => {
    const details = buildReportPreviewDetails(analysis, meta, 'json', 5)
    const preview = details.text.split('\n')

    expect(preview).toHaveLength(6)
    expect(preview[0]).toBe('{')
    expect(preview.at(-1)).toMatch(/\.\.\. \d+ more lines/)
    expect(details).toMatchObject({
      visibleLines: 5,
      previewLines: 6,
      truncated: true,
    })
    expect(details.hiddenLines).toBeGreaterThan(0)
  })

  it('does not append a remaining count when the report fits', () => {
    const details = buildReportPreviewDetails(analysis, meta, 'csv', 100)

    expect(details.text).toContain('Source,incident.log')
    expect(details.text).not.toContain('more lines')
    expect(details.hiddenLines).toBe(0)
    expect(details.previewLines).toBe(details.totalLines)
    expect(details.truncated).toBe(false)
  })

  it('keeps the string helper as a convenient wrapper', () => {
    expect(buildReportPreview(analysis, meta, 'json', 5)).toBe(
      buildReportPreviewDetails(analysis, meta, 'json', 5).text,
    )
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
