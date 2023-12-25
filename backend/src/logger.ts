import { dirname } from 'path'
import { appendFileSync, existsSync, mkdirSync } from 'fs'

const date = new Date()

export const LOG_FOLDER_PATH = `${dirname(dirname(require.main.filename))}/log`
export const LOG_FILE_NM = `${date.getFullYear()}${date.getMonth()+1}${date.getDate()}.txt`
export const LOG_FILE_PATH = `${LOG_FOLDER_PATH}/${LOG_FILE_NM}`

export function log(msg : string) {
  msg = `[${new Date().toLocaleString()}] ${msg}`
  console.log(msg)
  appendFileSync(LOG_FILE_PATH, `${msg}\n`)
}
export function log_err(msg : string) {
  msg = `ERROR [${new Date().toLocaleString()}] ${msg}`
  console.log(msg)
  appendFileSync(LOG_FILE_PATH, `${msg}\n`)
}

// create log folder if not exist
if (!existsSync(LOG_FOLDER_PATH)) {
  mkdirSync(LOG_FOLDER_PATH)
}
// create log file
appendFileSync(LOG_FILE_PATH, '')
