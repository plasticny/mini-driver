/* provide service for uploading file */

import { UploadingFile, Folder } from '@/structs'
import { reactive } from 'vue'
import axios from 'axios'
import { api_address } from './api'

class FileUploadHelper {
  // file that the uploading is processing
  private __upload_file : UploadingFile | undefined
  // file list uploading
  private __uploading_file_ls : UploadingFile[] = reactive([])

  private async __start_upload (abort_controller : AbortController) {
    if (this.__upload_file) return

    while (this.__uploading_file_ls.length > 0) {
      this.__upload_file = this.__uploading_file_ls[0]
      const form_data = new FormData()
      form_data.append('file', this.__upload_file.file)
      form_data.append('folder_id', this.__upload_file.folder_id.toString())
      try {
        await axios.post(
          `http://${api_address}/f/uploadFile`,
          form_data,
          {
            headers: { 'Content-Type': 'multipart/form-data' },
            signal: abort_controller.signal,
            onUploadProgress: ({ total, loaded }) => {
              this.__upload_file!.progress = Math.floor(loaded / total! * 100)
            }
          }
        )
        this.__uploading_file_ls.shift()
      } catch (e) { /* catch cancel error */ }
    }
    this.__upload_file = undefined
  }

  public get uploading_file_ls () {
    return this.__uploading_file_ls
  }

  public add_upload (file : globalThis.File, folder : Folder) {
    const abort_controller = new AbortController()
    this.__uploading_file_ls.push(new UploadingFile(file, folder, abort_controller))
    this.__start_upload(abort_controller)
  }

  public cancel_upload (file : UploadingFile) {
    file.abort_controller.abort()
    this.__uploading_file_ls.splice(this.__uploading_file_ls.indexOf(file), 1)
  }
}
export const file_upload_helper = new FileUploadHelper()
