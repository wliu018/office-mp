<template>
  <view v-if="candidates.length" class="person-picker" @click="open">
    <view class="person-picker-summary">
      <view class="person-picker-add-icon">
        <wd-icon name="add" color="#fff" size="12px" />
      </view>
      <text v-if="selectedNames" class="person-picker-selected">{{ selectedNames }}</text>
      <text v-else class="person-picker-placeholder">{{ placeholder }}</text>
    </view>
  </view>
  <view v-else class="person-picker-empty-tip">
    {{ emptyText }}
  </view>

  <wd-popup
    v-model="visible"
    position="bottom"
    safe-area-inset-bottom
    custom-style="height: 72vh; border-radius: 24rpx 24rpx 0 0;"
    @close="close"
  >
    <view class="person-picker-panel">
      <view class="person-picker-header">
        <text class="person-picker-title">{{ title }}</text>
        <text class="person-picker-done" @click.stop="close">完成</text>
      </view>
      <view class="person-picker-search-row">
        <view v-if="$slots['search-prefix']" class="person-picker-search-prefix" :style="{ flex: `0 0 ${searchPrefixWidth}`, width: searchPrefixWidth }">
          <slot name="search-prefix" />
        </view>
        <wd-input
          v-model="keyword"
          clearable
          no-border
          :placeholder="searchPlaceholder"
          :custom-class="largeSearch ? 'person-picker-search person-picker-search--large' : 'person-picker-search'"
          @click.stop
        />
      </view>
      <view class="person-picker-toolbar">
        <text v-if="multiple" class="person-picker-select-all" @click.stop="toggleAll">{{ allVisibleSelected ? '取消全选' : '全选当前结果' }}</text>
      </view>
      <scroll-view scroll-y class="person-picker-list">
        <view v-for="person in filteredCandidates" :key="personId(person)" class="person-picker-row">
          <wd-checkbox :model-value="selected(person)" :checked-color="checkedColor" :size="checkboxSize" shape="square" @change="toggle(person)">
            <view class="person-picker-info">
              <view class="person-picker-avatar">
                {{ itemLabel(person).slice(0, 1) }}
              </view>
              <view class="person-picker-card-content">
                <text class="person-picker-name">{{ itemLabel(person) }}</text>
                <view v-if="itemDetail(person) || itemPhone(person)" class="person-picker-detail">
                  <text v-if="itemDetail(person)">{{ itemDetail(person) }}</text>
                  <view v-if="itemPhone(person)" class="person-picker-phone" @tap.stop="emit('phone-click', itemPhone(person))">
                    <wd-icon name="phone" size="13px" color="#05f" />
                    <text>{{ itemPhone(person) }}</text>
                  </view>
                </view>
              </view>
            </view>
          </wd-checkbox>
        </view>
        <view v-if="!filteredCandidates.length" class="person-picker-no-result">
          未找到匹配数据
        </view>
      </scroll-view>
    </view>
  </wd-popup>
</template>

<script setup>
import { computed, ref } from 'vue'

const props = defineProps({
  modelValue: { type: Array, default: () => [] },
  candidates: { type: Array, default: () => [] },
  multiple: { type: Boolean, default: true },
  labelKey: { type: String, default: 'name' },
  detailKeys: { type: Array, default: () => ['companyName', 'phoneNumber'] },
  phoneKey: { type: String, default: 'phoneNumber' },
  searchKeys: { type: Array, default: () => [] },
  title: { type: String, default: '选择人员' },
  placeholder: { type: String, default: '请选择人员' },
  searchPlaceholder: { type: String, default: '搜索姓名、公司或手机号' },
  largeSearch: { type: Boolean, default: false },
  checkedColor: { type: String, default: '' },
  checkboxSize: { type: String, default: '' },
  searchPrefixWidth: { type: String, default: '25%' },
  emptyText: { type: String, default: '暂无可选人员' },
})
const emit = defineEmits(['update:modelValue', 'phone-click'])
const visible = ref(false)
const keyword = ref('')

const personId = person => String(person?.id ?? person?.userId ?? '')
const itemLabel = item => String(item?.[props.labelKey] ?? item?.name ?? '-')
function itemDetail(item) {
  return props.detailKeys
    .filter(key => key !== props.phoneKey)
    .map(key => item?.[key])
    .filter(Boolean)
    .join(' / ')
}

function itemPhone(item) {
  return item?.[props.phoneKey] ? String(item[props.phoneKey]) : ''
}
const filteredCandidates = computed(() => {
  const search = keyword.value.trim().toLowerCase()
  if (!search)
    return props.candidates
  const keys = props.searchKeys.length ? props.searchKeys : [props.labelKey, ...props.detailKeys]
  return props.candidates.filter(person => keys
    .some(key => String(person?.[key] || '').toLowerCase().includes(search)))
})
const selectedNames = computed(() => props.candidates
  .filter(person => props.modelValue.includes(personId(person)))
  .map(itemLabel)
  .join(', '))
const allVisibleSelected = computed(() => filteredCandidates.value.length > 0
  && filteredCandidates.value.every(selected))

function open() {
  keyword.value = ''
  visible.value = true
}

function close() {
  visible.value = false
  keyword.value = ''
}

function selected(person) {
  return props.modelValue.includes(personId(person))
}

function toggle(person) {
  const id = personId(person)
  if (!id)
    return
  if (!props.multiple) {
    emit('update:modelValue', selected(person) ? [] : [id])
    return
  }
  emit('update:modelValue', selected(person)
    ? props.modelValue.filter(item => item !== id)
    : [...props.modelValue, id])
}

function toggleAll() {
  if (!props.multiple)
    return
  const ids = filteredCandidates.value.map(personId).filter(Boolean)
  emit('update:modelValue', allVisibleSelected.value
    ? props.modelValue.filter(id => !ids.includes(id))
    : [...new Set([...props.modelValue, ...ids])])
}
</script>

<style lang="scss" scoped>
.person-picker {
  padding: 12px;
  border-radius: 8px;
  background: #fff;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.025);
}

.person-picker-summary,
.person-picker-header,
.person-picker-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.person-picker-selected {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  font-size: 14px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.person-picker-summary {
  gap: 8px;
  justify-content: flex-start;
}

.person-picker-avatar {
  display: flex;
  flex: none;
  align-items: center;
  justify-content: center;
  width: 42px;
  height: 42px;
  border-radius: 50%;
  background: #fff8d9;
  color: #f39a23;
  font-size: 18px;
  font-weight: 600;
}

.person-picker-placeholder {
  color: #bfbfbf;
  font-size: 14px;
}

.person-picker-add-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: #37c062;
}

.person-picker-empty-tip {
  color: #8b95a7;
  font-size: 14px;
}
.person-picker-panel {
  height: 100%;
  padding: 18px 16px 0;
  box-sizing: border-box;
}
.person-picker-title {
  color: #1f2937;
  font-size: 17px;
  font-weight: 600;
}
.person-picker-done,
.person-picker-select-all {
  color: #2563eb;
  font-size: 14px;
}
:deep(.person-picker-search) {
  flex: 1;
  min-width: 0;
  margin: 20px 0;
  border-radius: 8px;
  background: #f7f8fa;
}

:deep(.person-picker-search--large) {
  min-height: 48px;
  border-radius: 5px;
  background: #f6f6f7;
}

.person-picker-search-row {
  display: flex;
  align-items: center;
}

.person-picker-search-prefix {
  margin-right: 12px;
}
.person-picker-toolbar {
  padding: 12px 2px 8px;
  color: #8b95a7;
  font-size: 14px;
}
.person-picker-list {
  height: calc(72vh - 150px);
}
.person-picker-row {
  padding: 10px 0;
  border-bottom: 1px solid #f0f2f5;
}

:deep(.person-picker-row .wd-checkbox__label) {
  flex: 1;
  min-width: 0;
}

.person-picker-info {
  display: flex;
  align-items: center;
  min-height: 58px;
  width: calc(100vw - 180rpx);
  margin-left: 8px;
  gap: 10px;
  vertical-align: middle;
}

.person-picker-card-content {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-width: 0;
  gap: 4px;
}

.person-picker-name {
  overflow: hidden;
  color: #1f1f1f;
  font-size: 16px;
  font-weight: 600;
  line-height: 1.3;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.person-picker-detail {
  display: flex;
  align-items: center;
  gap: 16px;
  overflow: hidden;
  color: #999;
  font-size: 13px;
  line-height: 1.3;
  white-space: nowrap;
}

.person-picker-phone {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  color: #05f;
}

.person-picker-no-result {
  color: #8b95a7;
  font-size: 12px;
}
.person-picker-no-result {
  padding: 32px 0;
  text-align: center;
}
</style>
