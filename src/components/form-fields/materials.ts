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
import PasswordField from './PasswordField.vue'
import CascaderField from './CascaderField.vue'
import TimePickerField from './TimePickerField.vue'
import SliderField from './SliderField.vue'
import RateField from './RateField.vue'
import TreeSelectField from './TreeSelectField.vue'

const commonLabel: PropField = { name: 'label', label: '标签', type: 'string', group: '基本' }
const commonRequired: PropField = { name: 'required', label: '必填', type: 'boolean', group: '校验' }
const commonPlaceholder: PropField = { name: 'placeholder', label: '占位提示', type: 'string', group: '基本' }
const optionsField: PropField = { name: 'options', label: '选项', type: 'textarea', group: '基本' }
const colSpan: PropField = { name: 'colSpan', label: '跨列数', type: 'number', default: 1, group: '布局' }

export function registerFormFields() {
  register(
    {
      type: 'Input',
      group: '表单字段',
      label: '单行文本',
      icon: '📝',
      propsSchema: [
        commonLabel,
        commonPlaceholder,
        commonRequired,
        { name: 'maxLength', label: '最大长度', type: 'number', group: '校验' },
        colSpan,
      ],
    },
    InputField,
  )
  register(
    { type: 'Textarea', group: '表单字段', label: '多行文本', icon: '📄', propsSchema: [commonLabel, commonPlaceholder, commonRequired, colSpan] },
    TextareaField,
  )
  register(
    { type: 'Select', group: '表单字段', label: '下拉选择', icon: '📋', propsSchema: [commonLabel, commonRequired, optionsField, colSpan] },
    SelectField,
  )
  register(
    { type: 'Radio', group: '表单字段', label: '单选', icon: '🔘', propsSchema: [commonLabel, optionsField, colSpan] },
    RadioField,
  )
  register(
    { type: 'Checkbox', group: '表单字段', label: '多选', icon: '☑️', propsSchema: [commonLabel, optionsField, colSpan] },
    CheckboxField,
  )
  register(
    { type: 'DatePicker', group: '表单字段', label: '日期', icon: '📅', propsSchema: [commonLabel, commonRequired, colSpan] },
    DatePickerField,
  )
  register(
    { type: 'InputNumber', group: '表单字段', label: '数字', icon: '🔢', propsSchema: [commonLabel, commonRequired, colSpan] },
    InputNumberField,
  )
  register(
    { type: 'Switch', group: '表单字段', label: '开关', icon: '🔘', propsSchema: [commonLabel, colSpan] },
    SwitchField,
  )
  register(
    { type: 'Password', group: '表单字段', label: '密码', icon: '🔑', propsSchema: [commonLabel, commonPlaceholder, commonRequired, colSpan] },
    PasswordField,
  )
  register(
    { type: 'Cascader', group: '表单字段', label: '级联选择', icon: '🗂️', propsSchema: [commonLabel, commonRequired, optionsField, colSpan] },
    CascaderField,
  )
  register(
    { type: 'TimePicker', group: '表单字段', label: '时间', icon: '⏰', propsSchema: [commonLabel, commonPlaceholder, commonRequired, colSpan] },
    TimePickerField,
  )
  register(
    {
      type: 'Slider',
      group: '表单字段',
      label: '滑块',
      icon: '🎚️',
      propsSchema: [
        commonLabel,
        { name: 'min', label: '最小值', type: 'number', default: 0, group: '布局' },
        { name: 'max', label: '最大值', type: 'number', default: 100, group: '布局' },
        { name: 'step', label: '步长', type: 'number', default: 1, group: '布局' },
        colSpan,
      ],
    },
    SliderField,
  )
  register(
    {
      type: 'Rate',
      group: '表单字段',
      label: '评分',
      icon: '⭐',
      propsSchema: [commonLabel, { name: 'max', label: '最大值', type: 'number', default: 5, group: '布局' }, colSpan],
    },
    RateField,
  )
  register(
    { type: 'TreeSelect', group: '表单字段', label: '树选择', icon: '🌳', propsSchema: [commonLabel, commonRequired, optionsField, colSpan] },
    TreeSelectField,
  )
}
