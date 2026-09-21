import { useMemo, useState } from 'react'
import { analyzeLogs } from './log'
import {
  buildCsvReport,
  buildJsonReport,
  buildReportPreview,
  reportFileName,
  reportMimeType,
  type ReportFormat,
} from './report'

const sampleLogs = `2026-09-21T08:14:01Z INFO api request completed request_id=req-1001 user_id=4281 duration=132ms
2026-09-21T08:14:04Z ERROR payment failed order_id=900012 code=502 trace_id=6f1a2c3d-1111-4b22-8c33-998877665544
TypeError: Cannot read properties of undefined
    at chargeCustomer (checkout.ts:42:7)
    at async runJob (worker.ts:88:3)
2026-09-21T08:14:05Z ERROR payment failed order_id=900013 code=502 trace_id=7a2b3c4d-2222-4c33-9d44-887766554433
TypeError: Cannot read properties of undefined
    at chargeCustomer (checkout.ts:42:7)
    at async runJob (worker.ts:88:3)
2026-09-21T08:14:12Z DEBUG cache warmed key=plans region=eu
2026-09-21T08:14:18Z WARN payment retry scheduled order_id=900013 reason=timeout`

function App() {
  const [logText, setLogText] = useState(sampleLogs)
  const [sourceName, setSourceName] = useState('sample-stack.log')
  const [previewFormat, setPreviewFormat] = useState<ReportFormat>('csv')
  const [copyStatus, setCopyStatus] = useState('')
  const analysis = useMemo(() => analyzeLogs(logText), [logText])
  const repeatedPatterns = analysis.topPatterns.filter((pattern) => pattern.count > 1)
  const primaryPattern = analysis.topPatterns[0]
  const reportPreview = useMemo(
    () => buildReportPreview(analysis, { source: sourceName, generatedAt: 'preview' }, previewFormat),
    [analysis, previewFormat, sourceName],
  )

  const loadSample = () => {
    setLogText(sampleLogs)
    setSourceName('sample-stack.log')
    setCopyStatus('')
  }

  const clear = () => {
    setLogText('')
    setSourceName('pasted-logs.log')
    setCopyStatus('')
  }

  const downloadReport = (format: ReportFormat) => {
    const meta = { source: sourceName, generatedAt: new Date().toISOString() }
    const body = format === 'csv' ? buildCsvReport(analysis, meta) : buildJsonReport(analysis, meta)
    const url = URL.createObjectURL(new Blob([body], { type: reportMimeType(format) }))
    const link = document.createElement('a')

    link.href = url
    link.download = reportFileName(sourceName, format)
    document.body.append(link)
    link.click()
    link.remove()
    URL.revokeObjectURL(url)
  }

  const copyPreview = async () => {
    try {
      await navigator.clipboard.writeText(reportPreview)
      setCopyStatus('Copied preview')
    } catch {
      setCopyStatus('Copy unavailable')
    }
  }

  return (
    <main>
      <header className="site-header">
        <a className="brand" href="#top" aria-label="Log Pattern Lens home">
          <span className="brand-mark" aria-hidden="true">L</span>
          <span>Log Pattern Lens</span>
        </a>
        <span className="privacy-pill"><span aria-hidden="true">?</span> Browser only</span>
      </header>

      <section className="hero" id="top">
        <div>
          <p className="eyebrow">Private log triage</p>
          <h1>Find the pattern hiding inside noisy logs.</h1>
          <p className="hero-copy">
            Paste a log excerpt and get level counts, repeated error patterns, folded stack traces and
            the observed time range. Everything stays in this browser tab.
          </p>
        </div>
        <div className="hero-card">
          <span>Top repeated pattern</span>
          <strong>{primaryPattern ? primaryPattern.pattern : 'No log lines yet'}</strong>
          <small>{primaryPattern ? `${primaryPattern.count} occurrence${primaryPattern.count === 1 ? '' : 's'}` : 'Paste logs to start'}</small>
        </div>
      </section>

      <section className="workspace" aria-labelledby="workspace-title">
        <div className="panel input-panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Input</p>
              <h2 id="workspace-title">Paste logs</h2>
            </div>
            <input
              aria-label="Source name"
              className="source-name"
              value={sourceName}
              onChange={(event) => setSourceName(event.target.value)}
            />
          </div>

          <textarea
            aria-label="Log input"
            value={logText}
            onChange={(event) => {
              setLogText(event.target.value)
              setCopyStatus('')
            }}
            spellCheck={false}
          />
          <div className="actions">
            <button className="primary" type="button" onClick={loadSample}>Load sample</button>
            <button type="button" onClick={clear}>Clear</button>
            <button type="button" onClick={() => downloadReport('csv')}>Download CSV report</button>
            <button type="button" onClick={() => downloadReport('json')}>Download JSON report</button>
          </div>
        </div>

        <div className="panel results-panel" aria-live="polite">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Overview</p>
              <h2>Incident snapshot</h2>
            </div>
          </div>

          <div className="metric-grid">
            <article><strong>{analysis.parsedLines}</strong><span>Parsed entries</span></article>
            <article><strong>{analysis.levelCounts.error}</strong><span>Errors</span></article>
            <article><strong>{analysis.stackTraceLines}</strong><span>Stack trace lines</span></article>
            <article><strong>{analysis.continuationLines}</strong><span>Folded lines</span></article>
            <article><strong>{analysis.levelCounts.warn}</strong><span>Warnings</span></article>
            <article><strong>{repeatedPatterns.length}</strong><span>Repeated patterns</span></article>
          </div>

          <div className="time-range">
            <span>Observed range</span>
            <strong>{analysis.firstTimestamp && analysis.lastTimestamp ? `${analysis.firstTimestamp} -> ${analysis.lastTimestamp}` : 'No timestamps detected'}</strong>
          </div>

          <div className="level-list">
            {Object.entries(analysis.levelCounts).map(([level, count]) => (
              <div key={level}>
                <span>{level}</span>
                <meter min="0" max={Math.max(analysis.parsedLines, 1)} value={count}>{count}</meter>
                <strong>{count}</strong>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="patterns panel" aria-labelledby="patterns-title">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">Patterns</p>
            <h2 id="patterns-title">Top normalized messages</h2>
          </div>
          <span>{analysis.topPatterns.length} pattern{analysis.topPatterns.length === 1 ? '' : 's'}</span>
        </div>

        <div className="pattern-list">
          {analysis.topPatterns.slice(0, 8).map((pattern) => (
            <article key={`${pattern.firstLine}-${pattern.pattern}`}>
              <div>
                <strong>{pattern.pattern}</strong>
                <p>{pattern.examples[0]}</p>
                <small className="pattern-meta">
                  line {pattern.firstLine}
                  {pattern.stackTraceLines > 0 ? ` - ${pattern.stackTraceLines} stack trace line${pattern.stackTraceLines === 1 ? '' : 's'}` : ''}
                  {pattern.continuationLines > pattern.stackTraceLines ? ` - ${pattern.continuationLines - pattern.stackTraceLines} folded continuation line${pattern.continuationLines - pattern.stackTraceLines === 1 ? '' : 's'}` : ''}
                </small>
              </div>
              <span>{pattern.count}x</span>
            </article>
          ))}
          {analysis.topPatterns.length === 0 && <p className="empty-state">Paste logs to see repeated patterns.</p>}
        </div>
      </section>

      <section className="report-preview panel" aria-labelledby="report-preview-title">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">Report preview</p>
            <h2 id="report-preview-title">Review before downloading</h2>
          </div>
          <span>{previewFormat.toUpperCase()}</span>
        </div>

        <div className="preview-toolbar" aria-label="Report preview format">
          <button type="button" aria-pressed={previewFormat === 'csv'} onClick={() => setPreviewFormat('csv')}>
            CSV preview
          </button>
          <button type="button" aria-pressed={previewFormat === 'json'} onClick={() => setPreviewFormat('json')}>
            JSON preview
          </button>
          <button type="button" onClick={copyPreview}>Copy preview</button>
          {copyStatus && <span role="status">{copyStatus}</span>}
        </div>

        <pre>{reportPreview || 'Paste logs to preview a report.'}</pre>
      </section>

      <footer><p>Built for quick local log review. No uploads, no analytics.</p></footer>
    </main>
  )
}

export default App
