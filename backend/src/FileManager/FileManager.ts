import { existsSync, mkdirSync, renameSync, unlinkSync, rmSync, readdirSync } from 'fs'
import { dirname } from 'path'
import { File as form_file } from 'formidable'

import { AFileObject, ARetFileObject } from './FileObject'
import { AFolder, Folder, RetFolder } from './Folder'
import { root } from './Folder'
import { File } from './File'

// default asset folder
export const DEFAULT_ASSET_PATH = `${dirname(dirname(require.main.filename))}\\asset`
// folder to store temp file
export const TEMP_PATH = `${dirname(dirname(require.main.filename))}\\temp`

class FileManager {
  // map file object with internal id
  private __file_obj_map : Map<number, AFileObject> = new Map()

  constructor() {
    // create nessecery folders
    if (!existsSync(DEFAULT_ASSET_PATH))
      mkdirSync(DEFAULT_ASSET_PATH)
    if (!existsSync(TEMP_PATH))
      mkdirSync(TEMP_PATH)

    // clear temp folder
    readdirSync(TEMP_PATH).forEach((file) => {
      unlinkSync(`${TEMP_PATH}\\${file}`)
    })
    
    // add all file objects to the map
    this.__add_obj(root)
    const file_objs = root.file_objs
    while (file_objs.length > 0) {
      const file_obj = file_objs.pop()
      this.__add_obj(file_obj)
      if (file_obj instanceof AFolder) {
        file_objs.push(...file_obj.file_objs)
      }
    }
  }

  /* ================= File object map ================= */
  private __get_obj(id: number) : AFileObject {
    const obj = this.__file_obj_map.get(id)
    if (obj === undefined) {
      throw `Object with id ${id} does not exist`
    }
    return obj
  }
  /* get file object with type check */
  private __get_file(id : number) : File {
    const obj = this.__get_obj(id)
    if (obj instanceof File) {
      return obj
    } else {
      throw `Object with id ${id} is not a file`
    }
  }

  /* store a file object with a internal id */
  private __add_obj(obj : AFileObject) {
    this.__file_obj_map.set(obj.id, obj)
  }
  private __add_file(name : string, folder : AFolder) {
    const file = new File(name, folder)
    this.__add_obj(file)
  }
  /* Get folder object with type check */
  private __get_folder(id: number) : AFolder {
    const obj = this.__get_obj(id)
    if (obj instanceof AFolder) {
      return obj
    } else {
      throw `Object with id ${id} is not a folder`
    }
  }

  /* Check if file object with id `id` is locked */
  public check_lock(id : number) : boolean {
    return this.__get_obj(id).is_lock()
  }
  public delete_obj(id : number) {
    /* Delete a file object */
    const file_obj = this.__get_obj(id)
    if (file_obj.is_lock()) {
      throw `File object ${file_obj.name} is locked`
    }

    // remove from parent folder memory
    file_obj.folder.remove_obj(id)

    // remove file object
    if (file_obj instanceof AFolder) {
      rmSync(file_obj.path, { recursive: true })
    } else {
      unlinkSync(file_obj.path)
    }
    this.__file_obj_map.delete(id)
  }
  /* ================= File object map ================= */

  /* ================= Folder ================= */
  /* read and return a dict of items in the folder with `id` */
  public read_folder(id : number) : Array<ARetFileObject> {
    return this.__get_folder(id).read()
  }
  /* Get the id of folder that contains the file object with id `id` */
  public get_folder_id(obj_id : number) : number {
    const file_obj = this.__get_obj(obj_id)
    if (file_obj.folder === null) {
      throw `File object ${file_obj.name} is not in any folder`
    }
    return file_obj.folder.id
  }
  /* Get the info of folder */
  public get_folder_info(id : number) : RetFolder {
    return this.__get_folder(id).ret_obj
  }
  /* add folder */
  public add_folder(parent_id : number, name : string) : RetFolder {
    const parent = this.__get_folder(parent_id)

    let folder_nm = ''
    // esacpe special charater
    for(const c of name) {
      folder_nm += (c == '\\' || c == '/' || c == '／' || c == '?' || c == '？' || c == '!' || c == ' ' || c == '！') ? '_' : c
    }

    // add suffix if file name already exist
    if (existsSync(`${parent.path}\\${folder_nm}`)) {
      let i = 1
      while (existsSync(`${parent.path}\\${folder_nm}_(${i})`)) {
        i++
      }
      folder_nm += `_${i}`
    }

    // create folder
    mkdirSync(`${parent.path}\\${folder_nm}`)
    const folder = new Folder(folder_nm, parent)

    parent.add_obj(folder)
    this.__add_obj(folder)
    return folder.ret_obj
  }
  /* ================= Folder ================= */

  /* ================= File ================= */
  public get_file_path(id : number) : string {
    /* Get path of file object */
    return this.__get_file(id).path
  }
  public add_file_lock(id : number) {
    /* increase file lock */
    this.__get_file(id).add_lock()
  }
  public release_file_lock(id : number) {
    /* release file lock */
    this.__get_file(id).release_lock()
  }
  /* 
    Move a file from temp to the folder with id `folder_id`,
    then store into file object map
  */
  public store_temp_file(file : form_file, folder_id : number) : string {
    /* 
      Args:
        `file`: a file object from formidable.IncomingForm.parse
      Return:
        (string) the name of file stored to target folder
    */
    // separate file name and extension
    const last_dot_idx = file.originalFilename.lastIndexOf('.')
    const original_file_nm = file.originalFilename.slice(0, last_dot_idx)
    const file_ext = file.originalFilename.slice(last_dot_idx+1)

    let file_nm = ''
    // esacpe special charater
    for(const c of original_file_nm) {
      file_nm += (c == '\\' || c == '/' || c == '／' || c == '?' || c == '？' || c == '!' || c == ' ' || c == '！') ? '_' : c
    }

    // add suffix if file name already exist
    if (existsSync(`${this.__get_folder(folder_id).path}\\${file_nm}.${file_ext}`)) {
      let i = 1
      while (existsSync(`${this.__get_folder(folder_id).path}\\${file_nm}_${i}.${file_ext}`)) {
        i++
      }
      file_nm += `_${i}`
    }

    const folder = this.__get_folder(folder_id)
    const full_file_nm = `${file_nm}.${file_ext}`
    // move to the target folder
    renameSync(file.filepath, `${folder.path}\\${full_file_nm}`)
    // store to the map
    this.__add_file(full_file_nm, folder)

    return full_file_nm
  }
  // ================= File ================= //
}
export const file_manager = new FileManager()