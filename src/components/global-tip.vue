<template>
  <view
    class="global-tip"
    :style="{ background: backgroundColor, border, color: textColor }"
  >
    <wd-icon v-if="icon" :name="icon" :size="iconSize" :color="color" />
    <text>{{ text }}</text>
  </view>
</template>

<script setup lang="ts">
withDefaults(defineProps<{
  /** Wot Design 图标名称；不传时不显示图标 */
  icon?: string
  /** 图标颜色 */
  color?: string
  /** 提示文字 */
  text: string
  /** 图标尺寸 */
  iconSize?: string
  /** 背景色 */
  backgroundColor?: string
  /** 文字颜色 */
  textColor?: string
  /** 边框样式，例如 1px solid #e7e9ee 或 none */
  border?: string
}>(), {
  color: '#3d8dff',
  iconSize: '15px',
  backgroundColor: '#fff',
  textColor: '#333',
  border: '1px solid #e7e9ee',
})
</script>

<style scoped lang="scss">
.global-tip {
  display: inline-flex;
  flex: none;
  align-items: center;
  gap: 4px;
  height: 32px;
  padding: 0 8px;
  border: 1px solid #e7e9ee;
  border-radius: 8px;
  box-sizing: border-box;
  color: #333;
  font-size: 12px;
  line-height: 1.2;
}

.global-tip text {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
