<template>
  <div id="c_file_list">
    <section id="header">
      <span id="folder_nm">
        <span v-for="{ id, name } in folder.path" :key="id">
          <span class="folder_nm_item" @click="set_folder(id)">{{ name }}</span>
          <span class="spliter">/</span>
        </span>
      </span>
      <div id="file_operation" v-show="selected_file_obj_set.size > 0">
        <span>{{ selected_file_obj_set.size }} file</span>
        <font-awesome-icon icon="download" class='btn_download'
          @click="download_multi_file" v-show="check_only_file_selected()"/>
        <font-awesome-icon icon="trash" class='btn_delete'
          @click="delete_multi_file"/>
      </div>
    </section>

    <div id="file_drop_area"
      @dragover="evt => evt.preventDefault()"
      @drop="evt => drop_upload(evt)"
      @click="selected_file_obj_set.clear()">
      <!-- files in the folder -->
      <div v-for="file_obj in file_obj_ls" :key="file_obj.id"
        class="file_obj" :class="selected_file_obj_set.has(file_obj) ? 'selected' : ''"
        @click="evt => select_file_obj(evt, file_obj)"
        @dblclick="dblclick_file_obj(file_obj)">
        <div>
          <font-awesome-icon :icon="file_obj.type"/>
        </div>
        <span class="file_name">{{ file_obj.name }}</span>
        <font-awesome-icon icon="signal" class='icon_using'
          v-if="file_obj.type === 'file' && (file_obj as _File).is_lock"/>
      </div>

      <!-- uploading files -->
      <div v-for="uploading_file in file_upload_helper.uploading_file_ls" :key="uploading_file.internal_id"
        class="file_obj uploading">
        <div>
          <font-awesome-icon icon="spinner" class="icon_uploading"/>
          <font-awesome-icon icon="times" class="icon_cancel" @click="cancel_upload(uploading_file)"/>
        </div>
        <progress :value="uploading_file.progress" max="100"></progress>
        <span class="file_name">{{ uploading_file.name }}</span>
      </div>
    </div>

    <!-- login dialog -->
    <dialog ref="dg_login_admin" id="dg_login_admin">
      <div>Please enter the admin password:</div>
      <form method="dialog">
          <div><input type="text" ref="dg_login_pw" v-model="password"></div>
          <div>
              <button class="submit"
                @click="evt => dg_login_submit(evt)">
                Login
              </button>
              <button class="cancel" ref="dg_login_cancel">Cancel</button>
          </div>
      </form>
    </dialog>
  </div>
</template>

<script setup lang="ts">
import { FileObject, File as _File, UploadingFile } from '@/structs'
import { reactive, getCurrentInstance, ref } from 'vue'
import {
  api_download_file, api_delete_file_obj, api_get_admin_pass,
  api_check_file_obj_lock
} from '@/services/api'
import { folder, file_obj_ls, set_folder } from '@/services/folder_store'
import { check_admin } from '@/services/auth_service'

// === store === //
import { file_upload_helper } from '@/services/upload_file_service'

// === reactive objects === //
const selected_file_obj_set : Set<FileObject> = reactive(new Set())
const is_admin = ref(false)
const password = ref('')

// === variables === //
const instance = getCurrentInstance()!
let admin_pass : string | boolean | undefined

// === init === //
check_admin().then((result) => {
  is_admin.value = result
})

// === methods === //
function select_file_obj (evt : MouseEvent, file_obj : FileObject) {
  evt.stopPropagation()
  const item_selected = selected_file_obj_set.has(file_obj)
  const holding_ctrl = evt.ctrlKey
  const multi_selecting = selected_file_obj_set.size >= 2

  if (!holding_ctrl) {
    selected_file_obj_set.clear()
  }

  if (!item_selected || (multi_selecting && item_selected && !holding_ctrl)) {
    selected_file_obj_set.add(file_obj)
  } else {
    selected_file_obj_set.delete(file_obj)
  }
}
function dblclick_file_obj (file_obj : FileObject) {
  if (file_obj.type === 'folder') {
    set_folder(file_obj.id)
  } else {
    api_download_file(file_obj as _File)
  }
}

function check_only_file_selected () {
  for (const file_obj of selected_file_obj_set) {
    if (file_obj.type === 'folder') {
      return false
    }
  }
  return true
}
function download_multi_file () {
  // download multiple files
  // wait for 0.1 second for each file
  if (!check_only_file_selected()) return
  const selected_file_obj = selected_file_obj_set as Set<_File>

  let i = 0
  for (const file of selected_file_obj) {
    setTimeout(() => {
      api_download_file(file)
    }, i++ * 100)
  }
}
async function delete_multi_file () {
  if (!check_admin_pass()) return

  for (const file_obj of selected_file_obj_set.values()) {
    const is_lock = (await api_check_file_obj_lock(file_obj)).data
    if (is_lock) continue

    api_delete_file_obj(file_obj, admin_pass as string)
    selected_file_obj_set.delete(file_obj)
  }
}

/* drop file into drop area to upload */
function drop_upload (evt : DragEvent) {
  evt.preventDefault()
  for (const file of evt.dataTransfer!.files) {
    file_upload_helper.add_upload(file, folder.value)
  }
}
/* cancel uploading file */
function cancel_upload (uploading_file : UploadingFile) {
  file_upload_helper.cancel_upload(uploading_file)
}

function check_admin_pass () {
  if (!is_admin.value && admin_pass === undefined) {
    (instance.refs.dg_login_admin as HTMLDialogElement).showModal()

    const dg_login_pw = instance.refs.dg_login_pw as HTMLInputElement
    dg_login_pw.value = ''
    dg_login_pw.focus()

    return false
  }
  return true
}
function dg_login_submit (evt : UIEvent) {
  evt.preventDefault()
  api_get_admin_pass(password.value).then((result) => {
    if (result.data !== false) {
      (instance.refs.dg_login_cancel as HTMLButtonElement).click()
      admin_pass = result.data as string
    } else {
      alert('Wrong password')
    }
  })
}
</script>

<style>
@import url("../assets/css/FileList.css");
</style>
