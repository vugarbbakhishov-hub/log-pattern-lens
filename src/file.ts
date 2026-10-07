export const MAX_LOG_FILE_BYTES = 2 * 1024 * 1024

/** A newer input action invalidates both success and failure of older reads. */
export function createFileReadGuard() {
  let revision = 0
  return {
    cancel() { revision += 1 },
    async read(file: Pick<File, 'text'>, accept: (text: string) => void, reject: () => void) {
      const current = ++revision
      try {
        const text = await file.text()
        if (current === revision) accept(text)
      } catch {
        if (current === revision) reject()
      }
    },
  }
}

const supportedExtensions = ['.json', '.log', '.out', '.txt']

interface LogFileMetadata {
  name: string
  size: number
}

export function validateLogFile(file: LogFileMetadata): string | null {
  const normalizedName = file.name.toLowerCase()

  if (!supportedExtensions.some((extension) => normalizedName.endsWith(extension))) {
    return 'Choose a .log, .txt, .out or .json file.'
  }

  if (file.size > MAX_LOG_FILE_BYTES) {
    return 'Choose a file no larger than 2 MB.'
  }

  return null
}
