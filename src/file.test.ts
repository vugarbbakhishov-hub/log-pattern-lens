import { describe, expect, it, vi } from 'vitest'
import { createFileReadGuard, MAX_LOG_FILE_BYTES, validateLogFile } from './file'

function deferredFile() {
  let resolve!: (text: string) => void
  let reject!: (error: Error) => void
  const promise = new Promise<string>((yes, no) => { resolve = yes; reject = no })
  return { text: () => promise, resolve, reject }
}

describe('file read ordering', () => {
  it('keeps the newest file when the old read finishes last', async () => {
    const guard = createFileReadGuard()
    const old = deferredFile()
    const latest = deferredFile()
    const accept = vi.fn()
    const reject = vi.fn()
    const first = guard.read(old, accept, reject)
    const second = guard.read(latest, accept, reject)
    latest.resolve('new logs')
    await second
    old.resolve('old logs')
    await first
    expect(accept.mock.calls).toEqual([['new logs']])
    expect(reject).not.toHaveBeenCalled()
  })

  it('does not restore unmasked input after cancellation', async () => {
    const guard = createFileReadGuard()
    const file = deferredFile()
    const accept = vi.fn()
    const read = guard.read(file, accept, vi.fn())
    guard.cancel()
    file.resolve('api_key=fake_test_value')
    await read
    expect(accept).not.toHaveBeenCalled()
  })

  it('ignores stale failures after a new input action', async () => {
    const guard = createFileReadGuard()
    const file = deferredFile()
    const reject = vi.fn()
    const read = guard.read(file, vi.fn(), reject)
    guard.cancel()
    file.reject(new Error('old failure'))
    await read
    expect(reject).not.toHaveBeenCalled()
  })

  it('reports current errors and permits a successful retry', async () => {
    const guard = createFileReadGuard()
    const reject = vi.fn()
    await guard.read({ text: async () => { throw new Error('unreadable') } }, vi.fn(), reject)
    expect(reject).toHaveBeenCalledOnce()
    const accept = vi.fn()
    await guard.read({ text: async () => 'recovered' }, accept, reject)
    expect(accept).toHaveBeenCalledWith('recovered')
  })
})

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
