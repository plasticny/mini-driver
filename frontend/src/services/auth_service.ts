import { api_check_admin } from './api'

const IS_NOT_ADMIN = 0
const IS_ADMIN = 1
const IS_ADMIN_PENDING = 2
const IS_ADMIN_UNKNOWN = 3
type TAdminStatus = 0 | 1 | 2 | 3

let is_admin : TAdminStatus = IS_ADMIN_UNKNOWN
export async function check_admin () : Promise<boolean> {
  while (is_admin === IS_ADMIN_PENDING || is_admin === IS_ADMIN_UNKNOWN) {
    if (is_admin === IS_ADMIN_UNKNOWN) {
      is_admin = IS_ADMIN_PENDING
      api_check_admin().then(res => {
        const result : boolean = res.data
        is_admin = result ? IS_ADMIN : IS_NOT_ADMIN
      })
    }
    await new Promise(resolve => setTimeout(resolve, 100))
  }
  return is_admin === IS_ADMIN
}
