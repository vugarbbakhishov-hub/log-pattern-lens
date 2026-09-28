export const MAX_LOG_FILE_BYTES = 2 * 1024 * 1024

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
