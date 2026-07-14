<template>
  <component :is="icon" />
</template>

<script setup lang="ts">
import { computed } from 'vue'
import {
  AppstoreOutlined,
  EditOutlined,
  AlignLeftOutlined,
  UnorderedListOutlined,
  CheckCircleOutlined,
  CheckSquareOutlined,
  CalendarOutlined,
  FieldNumberOutlined,
  PoweroffOutlined,
  LockOutlined,
  ApartmentOutlined,
  ClockCircleOutlined,
  SlidersOutlined,
  StarOutlined,
  PartitionOutlined,
  BlockOutlined,
  CheckOutlined,
  MinusOutlined,
  WarningOutlined,
  TableOutlined,
  SearchOutlined,
  ProfileOutlined,
} from '@ant-design/icons-vue'

// 物料 type → antd 图标的唯一映射（集中维护）。未命中的兜底 AppstoreOutlined。
const ICON_MAP: Record<string, unknown> = {
  // 表单字段
  Input: EditOutlined,
  Textarea: AlignLeftOutlined,
  Select: UnorderedListOutlined,
  Radio: CheckCircleOutlined,
  Checkbox: CheckSquareOutlined,
  DatePicker: CalendarOutlined,
  InputNumber: FieldNumberOutlined,
  Switch: PoweroffOutlined,
  Password: LockOutlined,
  Cascader: ApartmentOutlined,
  TimePicker: ClockCircleOutlined,
  Slider: SlidersOutlined,
  Rate: StarOutlined,
  TreeSelect: PartitionOutlined,
  // 布局
  Row: BlockOutlined,
  FormActions: CheckOutlined,
  Divider: MinusOutlined,
  Alert: WarningOutlined,
  // 列表 / 详情
  Table: TableOutlined,
  SearchForm: SearchOutlined,
  Descriptions: ProfileOutlined,
}

const props = defineProps<{ type: string }>()
const icon = computed(() => ICON_MAP[props.type] ?? AppstoreOutlined)
</script>
