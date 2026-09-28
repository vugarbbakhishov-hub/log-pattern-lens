import { describe, expect, it } from 'vitest'
import { MAX_LOG_FILE_BYTES, validateLogFile } from './file'

describe('validateLogFile', () => {
  it.each(['incident.log', 'server.TXT', 'trace.out', 'events.json'])(
    'accepts supported file %s',
    (name) => {
      expect(validateLogFile({ name, size: 128 })).toBeNull()
    },
  )

  it('rejects unsupported file types', () => {
    expect(validateLogFile({ name: 'incident.csv', size: 128 })).toBe(
      'Choose a .log, .txt, .out or .json file.',
    )
  })

  it('rejects files over the local processing limit', () => {
    expect(validateLogFile({ name: 'large.log', size: MAX_LOG_FILE_BYTES + 1 })).toBe(
      'Choose a file no larger than 2 MB.',
    )
  })
})
