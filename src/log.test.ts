import { describe, expect, it } from 'vitest'
import { analyzeLogs, normalizePattern, parseLogLines } from './log'

describe('parseLogLines', () => {
  it('detects timestamps, levels and normalized message patterns', () => {
    const entries = parseLogLines(
      '2026-09-21T08:14:04Z ERROR payment failed order_id=900012 code=502 trace_id=6f1a2c3d-1111-4b22-8c33-998877665544',
    )

    expect(entries[0]).toMatchObject({
      lineNumber: 1,
      endLineNumber: 1,
      timestamp: '2026-09-21T08:14:04Z',
      level: 'error',
    })
    expect(entries[0].pattern).toBe('payment failed order_id=<number> code=502 trace_id=<uuid>')
  })

  it('marks lines without a level as unknown', () => {
    expect(parseLogLines('worker started without a level')[0].level).toBe('unknown')
  })

  it('folds stack frames into the previous log entry', () => {
    const entries = parseLogLines(`2026-09-21T08:14:04Z ERROR payment failed order_id=900012
    at chargeCustomer (checkout.ts:42:7)
    at async runJob (worker.ts:88:3)
2026-09-21T08:14:08Z WARN retry scheduled order_id=900012`)

    expect(entries).toHaveLength(2)
    expect(entries[0]).toMatchObject({
      lineNumber: 1,
      endLineNumber: 3,
      level: 'error',
      continuationLines: 2,
      stackTraceLines: 2,
      pattern: 'payment failed order_id=<number> <stack-trace>',
    })
    expect(entries[1]).toMatchObject({ lineNumber: 4, level: 'warn' })
  })
})

describe('normalizePattern', () => {
  it('replaces volatile identifiers while keeping the stable message shape', () => {
    expect(normalizePattern('GET /users/12345 failed from 10.2.0.4 in 812ms')).toBe(
      'GET /users/<number> failed from <ip> in <duration>',
    )
  })
})

describe('analyzeLogs', () => {
  it('counts levels, timestamps and repeated patterns', () => {
    const analysis = analyzeLogs(`2026-09-21T08:14:01Z INFO api ok request_id=req-1
2026-09-21T08:14:04Z ERROR payment failed order_id=900012
2026-09-21T08:14:05Z ERROR payment failed order_id=900013
WARN retry scheduled order_id=900013`)

    expect(analysis.parsedLines).toBe(4)
    expect(analysis.timestampedLines).toBe(3)
    expect(analysis.levelCounts).toMatchObject({ error: 2, warn: 1, info: 1 })
    expect(analysis.firstTimestamp).toBe('2026-09-21T08:14:01Z')
    expect(analysis.lastTimestamp).toBe('2026-09-21T08:14:05Z')
    expect(analysis.topPatterns[0]).toMatchObject({
      pattern: 'payment failed order_id=<number>',
      count: 2,
      firstLine: 2,
    })
  })

  it('counts continuation lines without inflating level totals', () => {
    const analysis = analyzeLogs(`2026-09-21T08:14:04Z ERROR payment failed order_id=900012
TypeError: Cannot read properties of undefined
    at chargeCustomer (checkout.ts:42:7)
2026-09-21T08:14:05Z ERROR payment failed order_id=900013
TypeError: Cannot read properties of undefined
    at chargeCustomer (checkout.ts:42:7)`)

    expect(analysis.totalLines).toBe(6)
    expect(analysis.parsedLines).toBe(2)
    expect(analysis.continuationLines).toBe(4)
    expect(analysis.stackTraceLines).toBe(4)
    expect(analysis.levelCounts.error).toBe(2)
    expect(analysis.topPatterns[0]).toMatchObject({
      pattern: 'payment failed order_id=<number> <stack-trace>',
      count: 2,
      continuationLines: 4,
      stackTraceLines: 4,
    })
  })
})
