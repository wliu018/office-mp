<template>
  <view class="time-select-page">
    <!-- 时间格子容器 -->
    <view class="time-grid-container">
      <div class="flex">
        <view style="background: linear-gradient(#fff 0, #fff 66%, rgba(246, 166, 35, 0.3) 67%, rgba(246, 166, 35, 0.3) 100%);" class="title-tip mb-1 flex flex-row items-center text-[12px] text-[rgba(0,0,0,0.39)]">
          <wd-icon name="warning" size="14px" custom-style="vertical-align: bottom" />
          滑动选择时段
        </view>
      </div>

      <view class="time-grid">
        <view
          v-for="(item, index) in selectState.timeList"
          :key="index"
          class="time-cell"
          :class="[
            item.isOccupied ? 'occupied' : '',
            item.isStart ? 'start' : '',
            item.isEnd ? 'end' : '',
            item.isInRange ? 'range' : '',
          ]"
          :data-time="item.timeStr"
          :data-index="index"
          :data-is-occupied="item.isOccupied"
          @touchstart="handleStart"
          @touchmove="handleMove"
          @touchend="handleEnd"
          @tap="handleTap"
          @touchcancel="handleEnd"
        >
          <view class="time-text">
            <text class="time-start">{{ item.timeStr.split('-')[0] }}</text>
            <text class="time-separator" />
            <text class="time-end">{{ item.timeStr.split('-')[1] }}</text>
          </view>
          <view v-if="item.isOccupied" class="occupied-indicator">
            已定
          </view>
          <view v-if="item.isStart || item.isEnd || item.isInRange" class="range-indicator">
            <wd-icon name="check1" custom-class="!font-bold" color="#05f" size="14px" />
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { getCurrentInstance, nextTick, onMounted, reactive, ref, watch } from 'vue'

// 定义props
const props = defineProps({
  timeConfig: {
    type: Object,
    default: () => ({
      start: '09:00', // 开始时间
      end: '18:30', // 结束时间
      interval: 30, // 间隔分钟数（固定30）
    }),
  },
  occupiedTimes: {
    type: Array,
    default: () => [],
  },
})

// 定义emit
const emit = defineEmits(['selection-change', 'tap-time', 'update-scroll'])

const $scope = getCurrentInstance()?.ctx || getCurrentInstance()?.proxy

// 选择状态
const selectState = reactive({
  isDragging: false, // 是否滑动中
  startTime: null, // 选中起始时间
  endTime: null, // 选中结束时间
  timeList: [], // 生成的时间格子列表
  touchIndex: -1, // 当前触摸的格子索引
})

const selectedRange = ref([])

function timeStrToTimestamp(timeStr) {
  const [hour, minute] = timeStr.split(':').map(Number)
  const date = new Date()
  date.setHours(hour, minute, 0, 0)
  return date.getTime()
}

function timestampToTimeStr(timestamp) {
  const date = new Date(timestamp)
  const hour = String(date.getHours()).padStart(2, '0')
  const minute = String(date.getMinutes()).padStart(2, '0')
  return `${hour}:${minute}`
}

function isTimeInOccupiedRange(timeStr) {
  const [startTime] = timeStr.split('-')
  const startTs = timeStrToTimestamp(startTime)

  return props.occupiedTimes.some((occupiedRange) => {
    // 检查占用格式是时间段（HH:MM-HH:MM）还是单个时间点（HH:MM）
    if (occupiedRange.includes('-')) {
      const [occupiedStart, occupiedEnd] = occupiedRange.split('-').map(t => t.trim())
      const occupiedStartTs = timeStrToTimestamp(occupiedStart)
      const occupiedEndTs = timeStrToTimestamp(occupiedEnd)
      return startTs < occupiedEndTs && occupiedStartTs < startTs + props.timeConfig.interval * 60 * 1000
    }
    else {
      const occupiedTs = timeStrToTimestamp(occupiedRange.trim())
      return startTs <= occupiedTs && occupiedTs < startTs + props.timeConfig.interval * 60 * 1000
    }
  })
}

function checkOccupiedInRangeSimple() {
  if (!selectState.startTime || !selectState.endTime)
    return false

  const startTs = timeStrToTimestamp(selectState.startTime.split('-')[0])
  const endTs = timeStrToTimestamp(selectState.endTime.split('-')[0])
  const minTs = Math.min(startTs, endTs)
  const maxTs = Math.max(startTs, endTs)

  return selectState.timeList.some((item) => {
    if (item.timestamp < minTs || item.timestamp > maxTs) {
      return false
    }

    const isBoundary = item.timeStr === selectState.startTime || item.timeStr === selectState.endTime

    // 边界时间点不检查占用（允许占用时间段的边界作为选择边界）
    if (isBoundary) {
      return false
    }

    if (item.isOccupied) {
      return true
    }

    return false
  })
}

function clearAllSelection() {
  selectState.startTime = null
  selectState.endTime = null
  selectState.touchIndex = -1
  selectState.timeList.forEach((item) => {
    item.isStart = false
    item.isEnd = false
    item.isInRange = false
  })
  selectedRange.value = []
  emit('selection-change', { startTime: null, endTime: null, selectedRange: [] })
}

function generateTimeList() {
  const { start, end, interval } = props.timeConfig
  const startTimeStamp = timeStrToTimestamp(start)
  const endTimeStamp = timeStrToTimestamp(end)
  const timeList = []

  let currentTimeStamp = startTimeStamp
  while (currentTimeStamp <= endTimeStamp) {
    const timeStr = timestampToTimeStr(currentTimeStamp)
    const isOccupied = isTimeInOccupiedRange(timeStr)

    // 计算结束时间
    const endTimeStamp = currentTimeStamp + props.timeConfig.interval * 60 * 1000
    const endTimeStr = timestampToTimeStr(endTimeStamp)

    timeList.push({
      timeStr: `${timeStr}-${endTimeStr}`,
      timestamp: currentTimeStamp,
      endTimeStamp,
      isOccupied,
      isStart: false,
      isEnd: false,
      isInRange: false,
    })
    currentTimeStamp += interval * 60 * 1000
  }

  selectState.timeList = timeList
  updateSelectStyle()
}

function updateSelectStyle() {
  if (!selectState.startTime || !selectState.endTime)
    return

  const hasOccupied = checkOccupiedInRangeSimple()
  if (hasOccupied) {
    clearAllSelection()
    uni.showToast({
      title: '选中范围包含已占用时间段，已取消选择',
      icon: 'none',
      duration: 2000,
    })
    return
  }

  const startTs = timeStrToTimestamp(selectState.startTime.split('-')[0])
  const endTs = timeStrToTimestamp(selectState.endTime.split('-')[0])
  const minTs = Math.min(startTs, endTs)
  const maxTs = Math.max(startTs, endTs)

  selectState.timeList.forEach((item) => {
    const inRange = item.timestamp >= minTs && item.timestamp <= maxTs

    item.isStart = item.timeStr === selectState.startTime && inRange
    item.isEnd = item.timeStr === selectState.endTime && inRange
    item.isInRange = inRange && !item.isStart && !item.isEnd
  })

  const startItem = selectState.timeList.find(item => item.timeStr === selectState.startTime)
  const endItem = selectState.timeList.find(item => item.timeStr === selectState.endTime)

  if (startItem && endItem) {
    const startIndex = selectState.timeList.indexOf(startItem)
    const endIndex = selectState.timeList.indexOf(endItem)

    const minIndex = Math.min(startIndex, endIndex)
    const maxIndex = Math.max(startIndex, endIndex)

    selectedRange.value = selectState.timeList
      .slice(minIndex, maxIndex + 1)
      .map(item => item.timeStr)

    emit('selection-change', {
      startTime: selectState.startTime,
      endTime: selectState.endTime,
      selectedRange: selectedRange.value,
    })
  }
  else {
    selectedRange.value = []
  }
}

function handleStart(e) {
  e.preventDefault && e.preventDefault()
  wx.vibrateShort({ type: 'heavy' })

  const dataset = e.currentTarget ? e.currentTarget.dataset : e.target.dataset
  if (!dataset || !dataset.time) {
    return
  }

  const timeStr = dataset.time
  const index = dataset.index

  const timeItem = selectState.timeList[index]
  const isOccupied = timeItem.isOccupied

  if (isOccupied) {
    uni.showToast({
      title: '该时间段已被占用',
      icon: 'none',
      duration: 1000,
    })
    return
  }

  // 更新滚动控制
  emit('update-scroll', false)
  selectState.isDragging = true
  selectState.startTime = timeStr
  selectState.endTime = timeStr
  selectState.touchIndex = index
  updateSelectStyle()
}

function handleMove(e) {
  if (!selectState.isDragging)
    return
  e.preventDefault && e.preventDefault()
  if (!selectState.isDragging)
    return

  const touch = e.touches ? e.touches[0] : e

  nextTick(() => {
    uni.createSelectorQuery()
      .in($scope)
      .selectAll('.time-cell')
      .boundingClientRect((rects) => {
        if (!rects.length)
          return

        let targetIndex = -1
        for (let i = 0; i < rects.length; i++) {
          const rect = rects[i]
          if (touch.clientX >= rect.left && touch.clientX <= rect.right && touch.clientY >= rect.top && touch.clientY <= rect.bottom) {
            targetIndex = i
            break
          }
        }

        if (targetIndex > -1) {
          const item = selectState.timeList[targetIndex]

          if (item.isOccupied) {
            return
          }

          selectState.endTime = item.timeStr
          selectState.touchIndex = targetIndex
          updateSelectStyle()
        }
      })
      .exec()
  })
}

/**
 * 选择结束
 */
function handleEnd() {
  if (selectState.isDragging) {
    emit('update-scroll', true)
    wx.vibrateShort({ type: 'heavy' })
    selectState.isDragging = false
    selectState.touchIndex = -1

    if (!selectState.startTime || !selectState.endTime) {
      if (selectedRange.value.length === 0) {
        uni.showToast({
          title: '请选择可用的时间段',
          icon: 'none',
        })
      }
    }
  }
}

function handleTap(e) {
  const dataset = e.currentTarget ? e.currentTarget.dataset : e.target.dataset
  if (!dataset || !dataset.time) {
    return
  }

  const timeStr = dataset.time
  const index = dataset.index

  // 触发点击事件
  emit('tap-time', { time: timeStr, index })

  const timeItem = selectState.timeList[index]
  const isOccupied = timeItem.isOccupied

  if (isOccupied) {
    return
  }
}

watch(() => props.occupiedTimes, () => {
  generateTimeList()
}, { immediate: true })

watch(() => props.timeConfig, () => {
  generateTimeList()
}, { deep: true })

onMounted(() => {
  generateTimeList()
})

defineExpose({
  clearAllSelection,
  generateTimeList,
  selectedRange,
  selectState,
})
</script>

<style lang="scss">
.time-select-page {
  box-sizing: border-box;
}

.time-grid-container {
  overflow-y: auto;
  background-color: #fff;
  border-radius: 12rpx;
}

.title-tip {
  margin-bottom: 8px;
}

/* 时间格子布局 */
.time-grid {
  display: flex;
  flex-wrap: wrap;
  flex-direction: row;
  justify-content: space-between;
  width: 100%;

  .time-cell {
    width: calc(100% / 4 - 5px);
  }
}

.time-cell {
  font-size: 14px;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 8px;
  border-radius: 6px;
  background-color: #f7f8fc;
  transition: all 0.35s ease-in-out;
  margin-bottom: 8px;
  box-sizing: border-box;
  position: relative;
  color: #333;
  &.occupied {
    background-color: rgba(255, 242, 240, 0.8);
    color: #ff4d4f;
  }

  &.start {
    background: rgba(240, 242, 254, 0.8);
    color: #4e6ef2;
  }

  &.end {
    background: rgba(240, 242, 254, 0.8);
    color: #4e6ef2;
  }

  &.range {
    background: rgba(240, 242, 254, 0.8);
    color: #4e6ef2;
  }
  .time-text {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    .time-start,
    .time-end {
      font-size: 13px;
      font-weight: 500;
    }
    .time-separator {
    }
  }
}
.range-indicator {
  position: absolute;
  top: -5px;
  right: -2px;
  font-size: 8px;
  line-height: 1;
  z-index: 200;
  animation-name: bounce;
  transform-origin: center bottom;
  animation-duration: 0.5s;
}

.occupied-indicator {
  position: absolute;
  top: 0px;
  right: -2px;
  transform: translateY(-50%);
  font-size: 8px;
  color: #ff4d4f;
  line-height: 1;
  z-index: 200;
  font-weight: bold;
  padding: 2px 5px;
  background-color: #fa4350;
  border-radius: 99px;
  border: 2px solid #fff;
  color: #fff;
}

@keyframes bounce {
  0%,
  20%,
  53%,
  to {
    animation-timing-function: cubic-bezier(0.215, 0.61, 0.355, 1);
    transform: translateZ(0);
  }

  40%,
  43% {
    animation-timing-function: cubic-bezier(0.755, 0.05, 0.855, 0.06);
    transform: translate3d(0, -7px, 0) scaleY(1.1);
  }

  70% {
    animation-timing-function: cubic-bezier(0.755, 0.05, 0.855, 0.06);
    transform: translate3d(0, -4px, 0) scaleY(1.05);
  }

  80% {
    transform: translateZ(0) scaleY(0.95);
    transition-timing-function: cubic-bezier(0.215, 0.61, 0.355, 1);
  }

  90% {
    transform: translate3d(0, -1px, 0) scaleY(1.02);
  }
}
</style>
