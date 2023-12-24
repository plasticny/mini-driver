import { IncomingForm } from 'formidable'
import { Request, Response } from 'express'
import { file_manager as fm, TEMP_PATH } from '../FileManager/FileManager'
import { log, log_err } from '../logger'
import { broadcast as broardcast_file_list } from '../ws/file_list_ws'
import { RetFolder } from '../FileManager/Folder'
import { get_admin_ip, localhost, RET_PW } from '../config'

function __check_auth(req : Request, res : Response, allow_pw : boolean = false) : boolean {
  const is_admin = req.ip == get_admin_ip() || req.ip == localhost
  const is_pw_correct = allow_pw && req.query.pw == RET_PW
  if (is_admin || is_pw_correct) {
    return true
  } else {
    log(`Unauthorized access from ${req.ip}`)
    res.sendStatus(401).end()
    return false
  }
}

export function downloadFile(req : Request, res : Response) {
  try {
    const id = parseInt(String(req.query.id))
    const file_path = fm.get_file_path(id)

    // lock file when download
    fm.add_file_lock(id)
    req.on('close', () => { fm.release_file_lock(id) })

    res.download(file_path)
  } catch(e) {
    console.log(e)
    res.sendStatus(500).end()
  }
}

export function uploadFile(req : Request, res : Response) {
  const form = new IncomingForm({
    multiples: true,
    uploadDir: TEMP_PATH,
    maxFileSize: 6 * 1024 * 1024 * 1024 * 8
  })

  form.on('aborted', () => {
    log(`The upload from ${req.ip} is aborted`)
  })

  form.parse(req, (err, fields, files) => {
    if(err) {
      // if upload is not aborted
      if (err.code != 1002)
        log_err(err)
      return
    }

    try {
      const folder_id = parseInt(fields.folder_id[0])
      const file_nm = fm.store_temp_file(files.file[0], folder_id)
      broardcast_file_list(folder_id)
      res.status(200).send({ file_nm })
    } catch(e) {
      log_err(e)
      res.sendStatus(500).end()
    }
  })
}

export function deleteFileObj(req : Request, res : Response) {
  /*
    Args:
      id: id of the file object
      pw: password
  */

  if (!__check_auth(req, res, true)) {
    res.sendStatus(401).end()
    return
  }

  try {
    const folder_id = fm.get_folder_id(parseInt(String(req.query.id)))
    fm.delete_obj(parseInt(String(req.query.id)))
    broardcast_file_list(folder_id)
    res.sendStatus(200).end()
  } catch(e) {
    log_err(e)
    res.sendStatus(500).end()
  }
}

export function addFolder (req : Request, res : Response) {
  /*
    Args:
      id: id of the parent folder
      name: name of the new folder
  */

  if (!__check_auth(req, res)) {
    res.sendStatus(401).end()
    return
  }

  try {
    const id : number = parseInt(String(req.query.id)) // id of the parent folder
    const name : string = String(req.query.name) // name of the new folder
    const folder : RetFolder = fm.add_folder(id, name)
    broardcast_file_list(id)
    res.send(JSON.stringify(folder))
  } catch(e) {
    console.log(e)
    res.sendStatus(500).end()
  }
}

export function checkFileObjLock (req : Request, res : Response) {
  try {
    const id : number = parseInt(String(req.query.id))
    const is_lock = fm.check_lock(id)
    res.send(JSON.stringify(is_lock))
  } catch(e) {
    console.log(e)
    res.sendStatus(500).end()
  }
}
