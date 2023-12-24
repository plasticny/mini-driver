import { FileObject, Folder } from '@/structs'
import { Ref, ref, reactive } from 'vue'
import { api_get_folder_info, ws_file_list } from './api'

/* === current viewing folder === */
export const folder : Ref<Folder> = ref({ id: 0, name: 'Root', type: 'folder', path: [{ id: 0, name: 'Root' }] })

/* === file objects in the folder === */
export const file_obj_ls : Array<FileObject> = reactive([])

/* === websocket for updating file object list === */
const file_obj_ls_ws = ws_file_list(folder.value)
file_obj_ls_ws.onmessage = (evt) => {
  while (file_obj_ls.length > 0) { file_obj_ls.pop() }

  const msg_list : Array<FileObject> = JSON.parse(evt.data)
  msg_list.sort((a, b) => {
    if (a.type !== b.type) {
      return a.type === 'folder' ? -1 : 1
    }
    return a.name.localeCompare(b.name)
  }).forEach((file_obj) => {
    file_obj_ls.push(file_obj)
  })
}

/* === public functions === */
export function set_folder (id : number) : void {
  api_get_folder_info(id).then(res => {
    folder.value = res.data
  })
  if (file_obj_ls_ws.readyState === WebSocket.OPEN) {
    file_obj_ls_ws.send(JSON.stringify({ action: 'change_folder', id }))
  }
}
