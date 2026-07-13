import { register } from '@/core'
import type { PropField } from '@/core'
import InputField from './InputField.vue'
import TextareaField from './TextareaField.vue'
import SelectField from './SelectField.vue'
import RadioField from './RadioField.vue'
import CheckboxField from './CheckboxField.vue'
import DatePickerField from './DatePickerField.vue'
import InputNumberField from './InputNumberField.vue'
import SwitchField from './SwitchField.vue'

const commonLabel: PropField = { name: 'label', label: '标签', type: 'string' }
const commonRequired: PropField = { name: 'required', label: '必填', type: 'boolean' }
const commonPlaceholder: PropField = { name: 'placeholder', label: '占位提示', type: 'string' }
const optionsField: PropField = { name: 'options', label: '选项', type: 'textarea' }
const colSpan: PropField = { name: 'colSpan', label: '跨列数', type: 'number', default: 1 }

export function registerFormFields() {
  register(
    {
      type: 'Input',
      group: '表单字段',
      label: '单行文本',
      propsSchema: [
        commonLabel,
        commonPlaceholder,
        commonRequired,
        { name: 'maxLength', label: '最大长度', type: 'number' },
        colSpan,
      ],
    },
    InputField,
  )
  register(
    { type: 'Textarea', group: '表单字段', label: '多行文本', propsSchema: [commonLabel, commonPlaceholder, commonRequired, colSpan] },
    TextareaField,
  )
  register(
    { type: 'Select', group: '表单字段', label: '下拉选择', propsSchema: [commonLabel, commonRequired, optionsField, colSpan] },
    SelectField,
  )
  register(
    { type: 'Radio', group: '表单字段', label: '单选', propsSchema: [commonLabel, optionsField, colSpan] },
    RadioField,
  )
  register(
    { type: 'Checkbox', group: '表单字段', label: '多选', propsSchema: [commonLabel, optionsField, colSpan] },
    CheckboxField,
  )
  register(
    { type: 'DatePicker', group: '表单字段', label: '日期', propsSchema: [commonLabel, commonRequired, colSpan] },
    DatePickerField,
  )
  register(
    { type: 'InputNumber', group: '表单字段', label: '数字', propsSchema: [commonLabel, commonRequired, colSpan] },
    InputNumberField,
  )
  register(
    { type: 'Switch', group: '表单字段', label: '开关', propsSchema: [commonLabel, colSpan] },
    SwitchField,
  )
}
