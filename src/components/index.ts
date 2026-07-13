import { registerFormFields } from './form-fields/materials'
import { registerLayout } from './layout/materials'
import { registerList } from './list/materials'
import { registerDetail } from './detail/materials'

export function registerAll() {
  registerFormFields()
  registerLayout()
  registerList()
  registerDetail()
}
