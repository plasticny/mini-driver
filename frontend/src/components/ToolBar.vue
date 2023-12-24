<template>
  <div id="c_tool_bar">
    <font-awesome-icon icon="file-circle-plus" class="tool_button" @click="upload_clicked"/>
    <font-awesome-icon icon="folder-plus" class="tool_button"
      v-if="is_admin" @click="add_folder_clicked"/>

    <!-- add folder dialog -->
    <dialog ref="dg_add_folder" id="dg_add_folder">
      <div>Enter the name of new folder:</div>
      <form method="dialog">
          <div><input type="text" ref="dg_add_folder_nm"></div>
          <div>
              <button class="submit" @click="dg_add_folder_submit">
                Add
              </button>
              <button class="cancel" ref="dg_add_folder_cancel">Cancel</button>
          </div>
      </form>
    </dialog>
  </div>
</template>

<script setup lang="ts">
import { getCurrentInstance, ref } from 'vue'
import { api_add_folder } from '@/services/api'
import { check_admin } from '@/services/auth_service'

// === stores === //
import { file_upload_helper } from '@/services/upload_file_service'
import { folder } from '@/services/folder_store'

// === reactive objects === //
const is_admin = ref(false)

// === variables === //
const instasnce = getCurrentInstance()!

// === init === //
check_admin().then((result) => {
  is_admin.value = result
})

// === methods === //
function upload_clicked () {
  const input = document.createElement('input')
  input.type = 'file'
  input.multiple = true
  input.onchange = () => {
    for (const file of input.files!) {
      file_upload_helper.add_upload(file, folder.value)
    }
  }
  input.click()
}

function add_folder_clicked () {
  const dg_add_folder = instasnce.refs.dg_add_folder as HTMLDialogElement
  dg_add_folder.showModal()

  const dg_add_folder_nm = instasnce.refs.dg_add_folder_nm as HTMLInputElement
  dg_add_folder_nm.value = 'New Folder'
  dg_add_folder_nm.focus()
}
function dg_add_folder_submit () {
  const dg_add_folder_nm = instasnce.refs.dg_add_folder_nm as HTMLInputElement
  api_add_folder(folder.value, dg_add_folder_nm.value)
  dg_add_folder_nm.value = ''

  // close dialog
  const dg_add_folder = instasnce.refs.dg_add_folder as HTMLDialogElement
  dg_add_folder.close()
}
</script>

<style>
@import url("../assets/css/ToolBar.css");
</style>
