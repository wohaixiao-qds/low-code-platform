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

// JNPF 风格的通用展示/校验属性
const commonClearable: PropField = { name: 'clearable', label: '可清除', type: 'boolean', default: true, group: '基本' }
const commonReadonly: PropField = { name: 'readonly', label: '只读', type: 'boolean', group: '基本' }
const commonDisabled: PropField = { name: 'disabled', label: '禁用', type: 'boolean', group: '基本' }
const commonFilterable: PropField = { name: 'filterable', label: '可搜索', type: 'boolean', group: '基本' }
const commonShowCount: PropField = { name: 'showCount', label: '字数统计', type: 'boolean', group: '基本' }
const commonMaxlength: PropField = { name: 'maxlength', label: '最大长度', type: 'number', group: '校验' }

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
        commonClearable,
        commonReadonly,
        commonDisabled,
        commonMaxlength,
        commonShowCount,
        commonRequired,
        colSpan,
      ],
    },
    InputField,
  )
  register(
    {
      type: 'Textarea',
      group: '表单字段',
      label: '多行文本',
      icon: '📄',
      propsSchema: [
        commonLabel,
        commonPlaceholder,
        commonClearable,
        commonReadonly,
        commonDisabled,
        commonMaxlength,
        commonShowCount,
        commonRequired,
        colSpan,
      ],
    },
    TextareaField,
  )
  register(
    { type: 'Password', group: '表单字段', label: '密码', icon: '🔑', propsSchema: [commonLabel, commonPlaceholder, commonMaxlength, commonRequired, colSpan] },
    PasswordField,
  )
  register(
    {
      type: 'InputNumber',
      group: '表单字段',
      label: '数字',
      icon: '🔢',
      propsSchema: [
        commonLabel,
        commonPlaceholder,
        commonDisabled,
        commonRequired,
        colSpan,
        { name: 'min', label: '最小值', type: 'number', group: '布局' },
        { name: 'max', label: '最大值', type: 'number', group: '布局' },
        { name: 'step', label: '步长', type: 'number', default: 1, group: '布局' },
        { name: 'precision', label: '小数位数', type: 'number', group: '布局' },
      ],
    },
    InputNumberField,
  )
  register(
    {
      type: 'Switch',
      group: '表单字段',
      label: '开关',
      icon: '🔘',
      propsSchema: [
        commonLabel,
        commonDisabled,
        colSpan,
        { name: 'activeText', label: '开启文案', type: 'string', group: '基本' },
        { name: 'inactiveText', label: '关闭文案', type: 'string', group: '基本' },
      ],
    },
    SwitchField,
  )
  register(
    {
      type: 'Radio',
      group: '表单字段',
      label: '单选',
      icon: '🔘',
      propsSchema: [
        commonLabel,
        commonDisabled,
        colSpan,
        optionsField,
        {
          name: 'direction',
          label: '排列方向',
          type: 'select',
          default: 'horizontal',
          options: [
            { label: '横向', value: 'horizontal' },
            { label: '纵向', value: 'vertical' },
          ],
          group: '布局',
        },
      ],
    },
    RadioField,
  )
  register(
    {
      type: 'Checkbox',
      group: '表单字段',
      label: '多选',
      icon: '☑️',
      propsSchema: [
        commonLabel,
        commonDisabled,
        colSpan,
        optionsField,
        {
          name: 'direction',
          label: '排列方向',
          type: 'select',
          default: 'horizontal',
          options: [
            { label: '横向', value: 'horizontal' },
            { label: '纵向', value: 'vertical' },
          ],
          group: '布局',
        },
      ],
    },
    CheckboxField,
  )
  register(
    {
      type: 'Select',
      group: '表单字段',
      label: '下拉选择',
      icon: '📋',
      propsSchema: [
        commonLabel,
        commonPlaceholder,
        commonClearable,
        commonFilterable,
        commonDisabled,
        commonRequired,
        colSpan,
        optionsField,
        { name: 'multiple', label: '多选', type: 'boolean', group: '基本' },
      ],
    },
    SelectField,
  )
  register(
    {
      type: 'Cascader',
      group: '表单字段',
      label: '级联选择',
      icon: '🗂️',
      propsSchema: [commonLabel, commonPlaceholder, commonClearable, commonFilterable, commonDisabled, commonRequired, colSpan, optionsField],
    },
    CascaderField,
  )
  register(
    {
      type: 'TreeSelect',
      group: '表单字段',
      label: '树选择',
      icon: '🌳',
      propsSchema: [commonLabel, commonPlaceholder, commonClearable, commonFilterable, commonDisabled, commonRequired, colSpan, optionsField],
    },
    TreeSelectField,
  )
  register(
    {
      type: 'DatePicker',
      group: '表单字段',
      label: '日期',
      icon: '📅',
      propsSchema: [commonLabel, commonPlaceholder, commonClearable, commonDisabled, commonRequired, colSpan, { name: 'format', label: '格式', type: 'string', default: 'YYYY-MM-DD', group: '基本' }],
    },
    DatePickerField,
  )
  register(
    {
      type: 'TimePicker',
      group: '表单字段',
      label: '时间',
      icon: '⏰',
      propsSchema: [commonLabel, commonPlaceholder, commonClearable, commonDisabled, commonRequired, colSpan, { name: 'format', label: '格式', type: 'string', default: 'HH:mm:ss', group: '基本' }],
    },
    TimePickerField,
  )
  register(
    {
      type: 'Rate',
      group: '表单字段',
      label: '评分',
      icon: '⭐',
      propsSchema: [
        commonLabel,
        commonDisabled,
        colSpan,
        { name: 'count', label: '星星数', type: 'number', default: 5, group: '布局' },
        { name: 'allowHalf', label: '允许半选', type: 'boolean', group: '基本' },
      ],
    },
    RateField,
  )
  register(
    {
      type: 'Slider',
      group: '表单字段',
      label: '滑块',
      icon: '🎚️',
      propsSchema: [
        commonLabel,
        commonDisabled,
        colSpan,
        { name: 'min', label: '最小值', type: 'number', default: 0, group: '布局' },
        { name: 'max', label: '最大值', type: 'number', default: 100, group: '布局' },
        { name: 'step', label: '步长', type: 'number', default: 1, group: '布局' },
      ],
    },
    SliderField,
  )
}
