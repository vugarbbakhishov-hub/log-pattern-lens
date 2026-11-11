# Try Log Pattern Lens in two minutes

Open the [live demo](https://vugarbbakhishov-hub.github.io/log-pattern-lens/).
The built-in presets contain fictional data, so you can try the workflow
without opening your own logs. Each preset is analyzed immediately.

## Find repeated slow requests

1. Choose **Latency burst** above the log input.
2. Check the overview: **5 parsed entries**, **1 error**, **3 warnings** and
   **1 repeated pattern**. All levels together show four pattern groups.
3. Select **WARN** under **Pattern level**. Two groups match: the slow request
   occurs twice, and the scheduled retry occurs once. `req-78` and `req-79`
   share the same normalized slow-request pattern; the examples keep their IDs.
4. Choose **Download JSON report**. Its `summary.parsedLines` is `5`,
   `levelCounts` includes ERROR, WARN and INFO, and `topPatterns` has four
   groups. The level filter changes the visible cards; the report covers all
   input. Pattern normalization does not redact the original examples.
5. Select **DEBUG**. The empty-result message should explain that no groups
   contain DEBUG entries. The overview still describes all five entries.

The filter searches every group before showing at most eight cards. A group
can contain several log levels; its count, first line and example describe the
whole group, not only entries at the selected level.

## Check a folded stack trace

Choose **Stack trace**. The filter returns to **All levels**. Expect:

| Result | Expected value |
| --- | ---: |
| Parsed entries | 5 |
| Errors | 2 |
| Warnings | 1 |
| Stack trace lines | 6 |
| Folded lines | 6 |
| Repeated patterns | 1 |

The two payment failures form one group with two occurrences. Their stack
frames stay attached to those entries instead of being counted as more errors.

## Share what happened

Use **Share feedback** or **Report a problem** in the demo footer. Each link
opens GitHub in a new tab, keeping your current analysis open. GitHub sign-in is
required to submit; submitted issues are public. The app does not attach your
logs, source name or report to the form.

For feedback, name the preset, what you wanted to check, whether you completed
the task and what was confusing. For an incorrect result, include the steps,
selected level, expected result, actual result and browser. Use a built-in
preset or the smallest fictional example; do not attach private logs or reports.
