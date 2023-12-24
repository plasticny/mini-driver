import express from 'express'
import expressWs from 'express-ws'
import cors from 'cors'

import { WHITELIST_ENABELED, WHITELIST_IP, PORT }  from './config'
import { log } from './logger'

import * as file_api from './api/file_operation'
import * as webpage_api from './api/webpage_function'
import { handler as file_list_ws } from './ws/file_list_ws'

async function __start() {
  const app = expressWs(express()).app

  // webpage static for production
  if (process.env.NODE_ENV === 'production') {
    app
      .use(express.static('frontend_dist'))
      .use('/', express.Router()
        .get('', (_, res) => {
          console.log('render index')
          res.render('index') 
        })
      )
  }

  // cors for development
  if (process.env.NODE_ENV === 'development') {
    app
      .use(cors({
        origin:['http://localhost:8080'],
        methods:['GET','POST'],
      }))
      .all('*', (_, res, next) => {
        res.header('Access-Control-Allow-Origin', '*')
        res.header('Access-Control-Allow-Headers', '*')
        res.header('Access-Control-Allow-Methods', '*')
        next()
      })
  }

  app
    // logger and whitelist
    .use('', (req, res, next) => {
      // check whitelist
      if (WHITELIST_ENABELED && !WHITELIST_IP.has(req.ip)) {
        log(`REJECT ${req.ip} ${decodeURI(req.url)}`)
        res.status(403).send(`You are not authorized<br>${req.ip}`).end()
        return
      }
      // log
      log(`${req.ip} ${decodeURI(req.url)}`)
      next()
    })

    // router for file operation api
    .use('/f', express.Router()
      .post('/uploadFile',      file_api.uploadFile)
      .get('/downloadFile',     file_api.downloadFile)
      .get('/deleteFileObj',    file_api.deleteFileObj)
      .get('/addFolder',        file_api.addFolder)
      .get('/checkFileObjLock', file_api.checkFileObjLock)
    )

    // router for webpage function api
    .use('/w', express.Router()
      .get('/getFileInDir',   webpage_api.getFileInDir)
      .get('/getAdminPass',   webpage_api.getAdminPass)
      .get('/checkAdmin',     webpage_api.checkAdmin)
      .get('/getServerQrUrl', webpage_api.getServerQrUrl)
      .get('/getFolderInfo',  webpage_api.getFolderInfo)
    )

    // websocket for update client file list
    .ws('/ws/fileList', file_list_ws)

  // start web app
  app.listen(PORT, () => {
    console.log(`Mini driver backend listening at http://localhost:${PORT}`)
  })
}

console.log('env:', process.env.NODE_ENV)
__start()