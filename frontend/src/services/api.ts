import axios from 'axios'
import { File, FileObject, Folder } from '@/structs'

// for development
// export const api_address = 'localhost:3000'
// for production
export const api_address = window.location.host

/* === file operation api === */
export function api_download_file (file : File) : void {
  window.location.href = `http://${api_address}/f/downloadFile?id=${file.id}`
}
export function api_add_folder (folder : Folder, name : string) : Promise<{ data: Folder }> {
  /*
    Args:
      folder: the folder to add the new folder to
      name: the name of the new folder
  */
  return axios.get(`http://${api_address}/f/addFolder`, { params: { id: folder.id, name: name } })
}
export function api_delete_file_obj (file_obj : FileObject, pw? : string) : Promise<{ data: null }> {
  return axios.get(`http://${api_address}/f/deleteFileObj`, { params: { id: file_obj.id, pw: pw } })
}
export function api_check_file_obj_lock (file_obj : FileObject) : Promise<{ data: boolean }> {
  return axios.get(`http://${api_address}/f/checkFileObjLock`, { params: { id: file_obj.id } })
}

/* === webpage function api === */
export function api_check_admin () : Promise<{ data: boolean }> {
  return axios.get(`http://${api_address}/w/checkAdmin`)
}
export function api_get_admin_pass (password : string) : Promise<{ data: string | boolean }> {
  return axios.get(`http://${api_address}/w/getAdminPass`, { params: { pw: password } })
}
export function api_get_folder_info (folder_id : number) : Promise<{ data: Folder }> {
  return axios.get(`http://${api_address}/w/getFolderInfo`, { params: { id: folder_id } })
}

/* === websocket === */
export function ws_file_list (folder : Folder) {
  return new WebSocket(`ws://${api_address}/ws/fileList?id=${folder.id}`)
}
