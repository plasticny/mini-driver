export interface FileObject {
  readonly id: number
  readonly type: 'file' | 'folder'
  name: string
}

export interface File extends FileObject {
  readonly type: 'file'
  is_lock: boolean
}

export interface Folder extends FileObject {
  readonly type: 'folder'
  readonly path: Array<{ id: number, name: string }>
}

export class UploadingFile {
  readonly internal_id : number = Date.now()
  readonly file : globalThis.File
  readonly folder_id : number
  readonly abort_controller : AbortController
  progress = 0

  constructor (file : globalThis.File, folder : Folder, abort_controller : AbortController) {
    this.file = file
    this.folder_id = folder.id
    this.abort_controller = abort_controller
  }

  public get name () { return this.file.name }
}
