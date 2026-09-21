export type LogLevel = 'error' | 'warn' | 'info' | 'debug' | 'trace' | 'unknown'
export type SensitiveType = 'api-key' | 'aws-access-key' | 'bearer-token' | 'email-address' | 'jwt'

export interface LogEntry {
  lineNumber: number
  endLineNumber: number
  raw: string
  timestamp?: string
  level: LogLevel
  message: string
  pattern: string
  continuationLines: number
  stackTraceLines: number
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
  continuationLines: number
  stackTraceLines: number
  examples: string[]
}

export interface SensitiveFinding {
  type: SensitiveType
  label: string
  count: number
  firstLine: number
}

export interface LogAnalysis {
  totalLines: number
  parsedLines: number
  timestampedLines: number
  continuationLines: number
  stackTraceLines: number
  sensitiveLineCount: number
  sensitiveFindings: SensitiveFinding[]
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

const sensitivePatterns: Array<{ type: SensitiveType; label: string; pattern: RegExp }> = [
  { type: 'api-key', label: 'API key or password assignment', pattern: /\b(?:api[_-]?key|access[_-]?token|client[_-]?secret|password|passwd|pwd|secret|token)\s*[:=]\s*["']?[^\s"',;]+/i },
  { type: 'aws-access-key', label: 'AWS access key ID', pattern: /\bAKIA[0-9A-Z]{16}\b/ },
  { type: 'bearer-token', label: 'Bearer token', pattern: /\bBearer\s+[A-Za-z0-9._~+/-]+=*/i },
  { type: 'jwt', label: 'JWT-like token', pattern: /\beyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\b/ },
  { type: 'email-address', label: 'Email address', pattern: /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i },
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

function detectSensitiveFindings(line: string): Array<{ type: SensitiveType; label: string }> {
  return sensitivePatterns
    .filter(({ pattern }) => pattern.test(line))
    .map(({ type, label }) => ({ type, label }))
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

function isStackTraceLine(line: string): boolean {
  const trimmed = line.trim()

  return (
    /^at\s+\S+/i.test(trimmed) ||
    /^\s+at\s+\S+/i.test(line) ||
    /^Caused by:/i.test(trimmed) ||
    /^Suppressed:/i.test(trimmed) ||
    /^Exception in thread /i.test(trimmed) ||
    /^Traceback \(most recent call last\):/i.test(trimmed) ||
    /^File "[^"]+", line \d+/i.test(trimmed) ||
    /^panic:/i.test(trimmed) ||
    /^goroutine \d+ \[[^\]]+\]:/i.test(trimmed) ||
    /^[\w./-]+\.[A-Za-z_$][\w$]*(?:\([^)]*\))?$/.test(trimmed) ||
    /^\S.*\.(?:go|rs|py|js|ts|tsx|jsx):\d+(?::\d+)?\b/.test(trimmed) ||
    /^\.\.\. \d+ (more|common frames omitted)/i.test(trimmed) ||
    /^[A-Za-z_$][\w.$]*(Error|Exception):\s+/.test(trimmed)
  )
}

function shouldAttachToPrevious(line: string, timestamp: string | undefined, level: LogLevel): boolean {
  if (timestamp) return false
  if (isStackTraceLine(line)) return true
  return /^\s+/.test(line) && level === 'unknown'
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

function normalizeEntryPattern(entry: LogEntry): string {
  const [firstMessage] = entry.message.split(/\r?\n/)
  const genericContinuationLines = entry.continuationLines - entry.stackTraceLines
  const markers = []

  if (entry.stackTraceLines > 0) markers.push('<stack-trace>')
  if (genericContinuationLines > 0) markers.push('<continuation>')

  return normalizePattern([firstMessage, ...markers].join(' '))
}

function addContinuation(entry: LogEntry, raw: string, lineNumber: number): void {
  const text = raw.trim()

  entry.raw = `${entry.raw}\n${raw}`
  entry.endLineNumber = lineNumber
  entry.continuationLines += 1
  if (isStackTraceLine(raw)) entry.stackTraceLines += 1
  if (text.length > 0) entry.message = `${entry.message}\n${text}`
  entry.pattern = normalizeEntryPattern(entry)
}

export function parseLogLines(input: string): LogEntry[] {
  const entries: LogEntry[] = []

  for (const { raw, lineNumber } of input
    .split(/\r?\n/)
    .map((raw, index) => ({ raw, lineNumber: index + 1 }))
    .filter((line) => line.raw.trim().length > 0)) {
    const timestamp = detectTimestamp(raw)
    const level = detectLevel(raw)
    const previous = entries.at(-1)

    if (previous && shouldAttachToPrevious(raw, timestamp, level)) {
      addContinuation(previous, raw, lineNumber)
      continue
    }

    const message = stripMetadata(raw, timestamp, level) || raw.trim()
    const entry: LogEntry = {
      lineNumber,
      endLineNumber: lineNumber,
      raw,
      timestamp,
      level,
      message,
      pattern: '',
      continuationLines: 0,
      stackTraceLines: 0,
    }
    entry.pattern = normalizeEntryPattern(entry)
    entries.push(entry)
  }

  return entries
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
  const sensitiveFindings = new Map<SensitiveType, SensitiveFinding>()
  let continuationLines = 0
  let stackTraceLines = 0
  let sensitiveLineCount = 0

  for (const entry of entries) {
    levelCounts[entry.level] += 1
    continuationLines += entry.continuationLines
    stackTraceLines += entry.stackTraceLines

    for (const [offset, rawLine] of entry.raw.split(/\r?\n/).entries()) {
      const findings = detectSensitiveFindings(rawLine)
      if (findings.length === 0) continue

      sensitiveLineCount += 1
      for (const finding of findings) {
        const existingFinding = sensitiveFindings.get(finding.type)
        if (existingFinding) {
          existingFinding.count += 1
        } else {
          sensitiveFindings.set(finding.type, {
            type: finding.type,
            label: finding.label,
            count: 1,
            firstLine: entry.lineNumber + offset,
          })
        }
      }
    }

    const existing = patterns.get(entry.pattern)
    if (existing) {
      existing.count += 1
      existing.continuationLines += entry.continuationLines
      existing.stackTraceLines += entry.stackTraceLines
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
        continuationLines: entry.continuationLines,
        stackTraceLines: entry.stackTraceLines,
        examples: [entry.message],
      })
    }
  }

  return {
    totalLines: lines.length === 1 && lines[0] === '' ? 0 : lines.length,
    parsedLines: entries.length,
    timestampedLines: timestamps.length,
    continuationLines,
    stackTraceLines,
    sensitiveLineCount,
    sensitiveFindings: Array.from(sensitiveFindings.values()).sort(
      (left, right) => right.count - left.count || left.firstLine - right.firstLine,
    ),
    levelCounts,
    firstTimestamp: timestamps[0],
    lastTimestamp: timestamps.at(-1),
    topPatterns: Array.from(patterns.values()).sort(
      (left, right) => right.count - left.count || left.firstLine - right.firstLine,
    ),
  }
}
