import { WebsocketRequestHandler } from 'express-ws'
import WebSocket from 'ws'
import { log } from '../logger'
import { file_manager as fm } from '../FileManager/FileManager'

/* === data types === */
type WSType = {
  ws : WebSocket,
  folder_id : number
}
type ReceiveMsgType = {
  action : string,
  id : number
}

// map of websocket connections with folder id
const __ws_map = new Map<number, Set<WebSocket>>()

function __add_ws(ws_data : WSType) {
  if (!__ws_map.has(ws_data.folder_id))
    __ws_map.set(ws_data.folder_id, new Set())
  __ws_map.get(ws_data.folder_id).add(ws_data.ws)
}

function __remove_ws(ws_data : WSType) {
  if (!__ws_map.has(ws_data.folder_id))
    throw new Error(`folder ${ws_data.folder_id} not found`)
  __ws_map.get(ws_data.folder_id).delete(ws_data.ws)
  ws_data = null
}

/* change the listening folder of `ws` to the folder with `target_id` */
function __ws_change_folder (ws_data : WSType, target_id : number) {
  const old_folder_id = ws_data.folder_id
  // update ws_data
  ws_data.folder_id = target_id

  // move to new folder in the map
  __ws_map.get(old_folder_id).delete(ws_data.ws)
  __add_ws(ws_data)
  // update ws's file list
  ws_data.ws.send(JSON.stringify(fm.read_folder(target_id)))
}

export const handler : WebsocketRequestHandler = (ws, req) => {
  log(`WS ${req.ip} ${decodeURI(req.url)}`)

  // store ws
  const ws_data : WSType = { ws, folder_id: parseInt(String(req.query.id)) }
  __add_ws(ws_data)

  ws
    // event handlers
    .on('message', (msg : string) => {
      log(`WS ${req.ip} ${decodeURI(req.url)} ${msg}`)
      const data : ReceiveMsgType = JSON.parse(msg)
      
      if (data.action === 'change_folder') {
        __ws_change_folder(ws_data, parseInt(String(data.id)))
      }
    })
    .on('close', () => { __remove_ws(ws_data) })
    // send file list
    .send(JSON.stringify(fm.read_folder(ws_data.folder_id)))  
}

export function broadcast(folder_id : number) {
  if (!__ws_map.has(folder_id))
    throw new Error(`folder ${folder_id} not found`)

  log(`WS broadcast folder ${folder_id}`)

  const msg = JSON.stringify(fm.read_folder(folder_id))
  __ws_map.get(folder_id).forEach((ws) => {
    ws.send(msg)
  })
}
