export type LogLevel = 'error' | 'warn' | 'info' | 'debug' | 'trace' | 'unknown'

export interface LogEntry {
  lineNumber: number
  raw: string
  timestamp?: string
  level: LogLevel
  message: string
  pattern: string
}

export interface LevelCounts {
  error: number
  warn: number
  info: number
  debug: number
  trace: number
  unknown: number
}

export interface PatternSummary {
  pattern: string
  count: number
  levels: LogLevel[]
  firstLine: number
  examples: string[]
}

export interface LogAnalysis {
  totalLines: number
  parsedLines: number
  timestampedLines: number
  levelCounts: LevelCounts
  firstTimestamp?: string
  lastTimestamp?: string
  topPatterns: PatternSummary[]
}

const timestampPatterns = [
  /^\[?(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:?\d{2})?)\]?/,
  /^\[?(\d{4}-\d{2}-\d{2}[ T]\d{2}:\d{2}:\d{2}(?:[.,]\d{3})?)\]?/,
  /^\[?(\d{2}:\d{2}:\d{2}(?:[.,]\d{3})?)\]?/,
]

const levelPatterns: Array<[LogLevel, RegExp]> = [
  ['error', /\b(fatal|error|err|exception|panic)\b/i],
  ['warn', /\b(warn|warning)\b/i],
  ['info', /\b(info|notice)\b/i],
  ['debug', /\bdebug\b/i],
  ['trace', /\btrace\b/i],
]

function detectTimestamp(line: string): string | undefined {
  for (const pattern of timestampPatterns) {
    const match = line.match(pattern)
    if (match) return match[1]
  }
  return undefined
}

function detectLevel(line: string): LogLevel {
  for (const [level, pattern] of levelPatterns) {
    if (pattern.test(line)) return level
  }
  return 'unknown'
}

function stripMetadata(line: string, timestamp: string | undefined, level: LogLevel): string {
  let message = line.trim()
  if (timestamp) message = message.replace(timestamp, ' ')
  if (level !== 'unknown') {
    message = message.replace(new RegExp(`\\b${level}\\b`, 'i'), ' ')
    if (level === 'error') message = message.replace(/\b(fatal|err|exception|panic)\b/i, ' ')
    if (level === 'warn') message = message.replace(/\bwarning\b/i, ' ')
  }

  return message
    .replace(/[()[\]{}]/g, ' ')
    .replace(/^[\s:|,.-]+|[\s:|,.-]+$/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

export function normalizePattern(message: string): string {
  return message
    .replace(/\b[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\b/gi, '<uuid>')
    .replace(/\b(?:\d{1,3}\.){3}\d{1,3}\b/g, '<ip>')
    .replace(/\b0x[0-9a-f]+\b/gi, '<hex>')
    .replace(/\b\d{4,}\b/g, '<number>')
    .replace(/\b\d+ms\b/gi, '<duration>')
    .replace(/\s+/g, ' ')
    .trim()
}

export function parseLogLines(input: string): LogEntry[] {
  return input
    .split(/\r?\n/)
    .map((raw, index) => ({ raw, lineNumber: index + 1 }))
    .filter((line) => line.raw.trim().length > 0)
    .map(({ raw, lineNumber }) => {
      const timestamp = detectTimestamp(raw)
      const level = detectLevel(raw)
      const message = stripMetadata(raw, timestamp, level) || raw.trim()
      return {
        lineNumber,
        raw,
        timestamp,
        level,
        message,
        pattern: normalizePattern(message),
      }
    })
}

function emptyCounts(): LevelCounts {
  return { error: 0, warn: 0, info: 0, debug: 0, trace: 0, unknown: 0 }
}

export function analyzeLogs(input: string): LogAnalysis {
  const lines = input.split(/\r?\n/)
  const entries = parseLogLines(input)
  const levelCounts = emptyCounts()
  const timestamps = entries.flatMap((entry) => (entry.timestamp ? [entry.timestamp] : []))
  const patterns = new Map<string, PatternSummary>()

  for (const entry of entries) {
    levelCounts[entry.level] += 1
    const existing = patterns.get(entry.pattern)
    if (existing) {
      existing.count += 1
      if (!existing.levels.includes(entry.level)) existing.levels.push(entry.level)
      if (existing.examples.length < 2 && !existing.examples.includes(entry.message)) {
        existing.examples.push(entry.message)
      }
    } else {
      patterns.set(entry.pattern, {
        pattern: entry.pattern,
        count: 1,
        levels: [entry.level],
        firstLine: entry.lineNumber,
        examples: [entry.message],
      })
    }
  }

  return {
    totalLines: lines.length === 1 && lines[0] === '' ? 0 : lines.length,
    parsedLines: entries.length,
    timestampedLines: timestamps.length,
    levelCounts,
    firstTimestamp: timestamps[0],
    lastTimestamp: timestamps.at(-1),
    topPatterns: Array.from(patterns.values()).sort(
      (left, right) => right.count - left.count || left.firstLine - right.firstLine,
    ),
  }
}
