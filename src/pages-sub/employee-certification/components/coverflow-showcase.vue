<template>
  <view class="coverflow-showcase">
    <view class="coverflow-category-stage">
      <view
        v-for="categoryItem in categoryItems"
        :key="categoryItem.key"
        class="coverflow-category-item"
        :style="getCategoryStyle(categoryItem.virtualIndex)"
      >
        <view
          class="coverflow-category-label"
          :class="{ 'coverflow-category-label--active': categoryItem.index === categoryIndex }"
        >
          {{ categoryItem.employee.department || categoryItem.employee.name || `申请${categoryItem.index + 1}` }}
        </view>
        <view
          class="coverflow-category-dot"
          :class="{ 'coverflow-category-dot--active': categoryItem.index === categoryIndex }"
        />
      </view>
      <image
        class="coverflow-category-arc"
        src="/static/employee-certification/showcase-category-curve.png"
        mode="scaleToFill"
      />
    </view>

    <view
      class="coverflow-deck"
      @touchstart.stop="handleTouchStart"
      @touchmove.stop.prevent="handleTouchMove"
      @touchend.stop="handleTouchEnd"
      @touchcancel.stop="handleTouchEnd"
    >
      <view
        v-for="(employee, index) in employees"
        :key="employee.id || employee.openId || index"
        class="coverflow-card-slot"
        :style="getCardStyle(index)"
      >
        <view class="coverflow-card">
          <image class="coverflow-card__image" :src="employee.src" mode="aspectFill" />
          <view class="coverflow-card__content">
            <view class="coverflow-card__department">
              {{ employee.department || '认证申请' }}
            </view>
            <view class="coverflow-card__name">
              {{ employee.name || '-' }}
            </view>
            <view class="coverflow-card__status">
              {{ Number(employee.type) === 2 ? '已审核' : '未审核' }}
            </view>
          </view>
        </view>
      </view>
    </view>

    <view v-if="employees.length > 1" class="coverflow-indicator">
      <view
        v-for="(employee, index) in employees"
        :key="employee.id || employee.openId || index"
        class="coverflow-indicator__dot"
        :class="{ 'coverflow-indicator__dot--active': index === currentIndex }"
      />
    </view>
  </view>
</template>

<script setup>
import { computed, onMounted, onUnmounted, ref } from 'vue'

const props = defineProps({
  employees: {
    type: Array,
    default: () => [],
  },
})

const currentIndex = ref(0)
const categoryIndex = ref(0)
const categoryPosition = ref(0)
const categoryProgress = ref(0)
const dragProgress = ref(0)
const touchStartX = ref(null)
const touchStartY = ref(null)
const horizontalGesture = ref(false)
const animationEnabled = ref(true)
const categoryAnimationEnabled = ref(true)
const isAnimating = ref(false)
const windowWidth = uni.getWindowInfo().windowWidth
let autoplayTimer = null
let animationTimer = null
let categoryAnimationTimer = null

const categoryItems = computed(() => {
  const count = props.employees.length

  if (count <= 1) {
    return props.employees.map((employee, index) => ({
      employee,
      index,
      key: `category-0-${employee.id || employee.openId || index}`,
      virtualIndex: index,
    }))
  }

  return [-1, 0, 1].flatMap(copy => props.employees.map((employee, index) => ({
    employee,
    index,
    key: `category-${copy}-${employee.id || employee.openId || index}`,
    virtualIndex: index + copy * count,
  })))
})

function getCircularOffset(index) {
  const count = props.employees.length

  if (count <= 1)
    return 0

  let offset = index - currentIndex.value
  const half = count / 2

  if (offset > half)
    offset -= count
  else if (offset < -half)
    offset += count

  return offset
}

function getVisualOffset(index) {
  return getCircularOffset(index) + dragProgress.value
}

function getCategoryOffset(virtualIndex) {
  return virtualIndex - categoryPosition.value + categoryProgress.value
}

function getCategoryStyle(virtualIndex) {
  const offset = getCategoryOffset(virtualIndex)
  const distance = Math.abs(offset)
  const curveY = Math.min(distance * distance * 8, 32)
  const opacity = distance > 2.4
    ? 0
    : Math.max(0, Math.min(1, (2.4 - distance) / 0.4))

  return {
    opacity,
    transform: `translate3d(calc(-50% + ${offset * 154}rpx), ${curveY}rpx, 0)`,
    transition: categoryAnimationEnabled.value
      ? 'transform 520ms cubic-bezier(0.65, 0, 0.35, 1), opacity 300ms ease'
      : 'none',
    zIndex: 30 - Math.round(Math.min(distance, 2) * 10),
  }
}

function getCardStyle(index) {
  const offset = getVisualOffset(index)
  const distance = Math.min(Math.abs(offset), 2.4)
  const sideDistance = Math.min(distance, 1)
  const farDistance = Math.max(distance - 1, 0)
  const scale = 1 - sideDistance * 0.22 - farDistance * 0.05
  const translateX = offset > 0 ? offset * 390 : offset * 470
  const verticalOrder = Math.max(-1, Math.min(1, offset))
  const translateY = verticalOrder <= 0
    ? (verticalOrder + 1) * 70
    : 70 + verticalOrder * 150 + farDistance * 10
  const rotate = offset < 0
    ? Math.max(-10, offset * 10)
    : Math.max(-14, offset * -12)
  const layerOffset = Math.max(-2, Math.min(2, offset))

  return {
    opacity: distance > 1.7 ? 0 : Math.max(0.72, 1 - distance * 0.04),
    pointerEvents: distance < 0.5 ? 'auto' : 'none',
    transform: `translate3d(calc(-50% + ${translateX}rpx), ${translateY}rpx, 0) scale(${scale}) rotate(${rotate}deg)`,
    transition: animationEnabled.value
      ? 'transform 650ms cubic-bezier(0.65, 0, 0.35, 1), opacity 650ms ease'
      : 'none',
    zIndex: 1000 + Math.round(layerOffset * 100),
  }
}

function clearAutoplay() {
  if (autoplayTimer !== null) {
    clearTimeout(autoplayTimer)
    autoplayTimer = null
  }
}

function restartAutoplay() {
  clearAutoplay()

  if (props.employees.length <= 1)
    return

  autoplayTimer = setTimeout(() => {
    slideTo(1)
  }, 2400)
}

function finishCategorySlide(direction, nextIndex) {
  const count = props.employees.length

  categoryAnimationEnabled.value = false
  categoryPosition.value += direction
  categoryProgress.value = 0
  categoryIndex.value = nextIndex

  if (categoryPosition.value >= count)
    categoryPosition.value -= count
  else if (categoryPosition.value < 0)
    categoryPosition.value += count

  setTimeout(() => {
    categoryAnimationEnabled.value = true
    isAnimating.value = false
    restartAutoplay()
  }, 20)
}

function startCategorySlide(direction, nextIndex) {
  categoryAnimationEnabled.value = true
  categoryIndex.value = nextIndex
  categoryProgress.value = direction > 0 ? -1 : 1

  clearTimeout(categoryAnimationTimer)
  categoryAnimationTimer = setTimeout(
    () => finishCategorySlide(direction, nextIndex),
    520,
  )
}

function finishSlide(direction) {
  const count = props.employees.length
  const nextIndex = (currentIndex.value + direction + count) % count

  animationEnabled.value = false
  currentIndex.value = nextIndex
  dragProgress.value = 0

  setTimeout(() => {
    animationEnabled.value = true
    startCategorySlide(direction, nextIndex)
  }, 20)
}

function slideTo(direction) {
  if (isAnimating.value || props.employees.length <= 1)
    return

  clearAutoplay()
  isAnimating.value = true
  animationEnabled.value = true
  dragProgress.value = direction > 0 ? -1 : 1

  clearTimeout(animationTimer)
  animationTimer = setTimeout(() => finishSlide(direction), 650)
}

function resetGesture() {
  touchStartX.value = null
  touchStartY.value = null
  horizontalGesture.value = false
}

function handleTouchStart(event) {
  if (isAnimating.value)
    return

  clearAutoplay()
  touchStartX.value = Number(event.touches?.[0]?.clientX)
  touchStartY.value = Number(event.touches?.[0]?.clientY)
  horizontalGesture.value = false
  animationEnabled.value = false
}

function handleTouchMove(event) {
  if (isAnimating.value || !Number.isFinite(touchStartX.value) || !Number.isFinite(touchStartY.value))
    return

  const currentX = Number(event.touches?.[0]?.clientX)
  const currentY = Number(event.touches?.[0]?.clientY)
  const distanceX = currentX - touchStartX.value
  const distanceY = currentY - touchStartY.value

  if (!horizontalGesture.value && Math.max(Math.abs(distanceX), Math.abs(distanceY)) >= 8)
    horizontalGesture.value = Math.abs(distanceX) > Math.abs(distanceY)

  if (!horizontalGesture.value)
    return

  dragProgress.value = Math.max(-1, Math.min(1, distanceX / (windowWidth * 0.72)))
}

function handleTouchEnd() {
  if (isAnimating.value)
    return

  const progress = dragProgress.value
  const shouldChange = horizontalGesture.value && Math.abs(progress) >= 0.18

  animationEnabled.value = true
  resetGesture()

  if (shouldChange) {
    slideTo(progress < 0 ? 1 : -1)
    return
  }

  dragProgress.value = 0
  restartAutoplay()
}

onMounted(restartAutoplay)

onUnmounted(() => {
  clearAutoplay()
  clearTimeout(animationTimer)
  clearTimeout(categoryAnimationTimer)
})
</script>

<style lang="scss" scoped>
.coverflow-showcase {
  position: relative;
  min-height: 100vh;
  padding: 310rpx 0 80rpx;
  box-sizing: border-box;
  overflow: hidden;
  background: #f5f2e9;
}

.coverflow-category-stage {
  position: relative;
  height: 174rpx;
  overflow: hidden;
}

.coverflow-category-item {
  position: absolute;
  top: 4rpx;
  left: 50%;
  width: 180rpx;
  height: 154rpx;
  transition:
    transform 520ms cubic-bezier(0.65, 0, 0.35, 1),
    opacity 300ms ease;
  will-change: transform;
}

.coverflow-category-label {
  color: #b8a250;
  font-size: 26rpx;
  font-weight: 500;
  line-height: 44rpx;
  text-align: center;
  white-space: nowrap;
  transition:
    color 520ms ease,
    font-size 520ms ease;
}

.coverflow-category-label--active {
  color: #1759a9;
  font-size: 34rpx;
  font-weight: 700;
}

.coverflow-category-dot {
  position: absolute;
  top: 116rpx;
  left: 50%;
  display: block;
  width: 10rpx;
  height: 10rpx;
  border-radius: 50%;
  background: #e2d8a7;
  transform: translate(-50%, -50%);
  transition:
    width 520ms ease,
    height 520ms ease,
    background-color 520ms ease,
    box-shadow 520ms ease;
}

.coverflow-category-dot--active {
  width: 20rpx;
  height: 20rpx;
  background: #1b5eae;
  box-shadow: 0 2rpx 5rpx rgba(27, 94, 174, 0.28);
}

.coverflow-category-arc {
  position: absolute;
  right: 0;
  bottom: 0;
  left: 0;
  display: block;
  width: 100%;
  height: 38rpx;
}

.coverflow-deck {
  position: relative;
  width: 100%;
  height: 780rpx;
  margin-top: 6rpx;
  overflow: visible;
}

.coverflow-card-slot {
  position: absolute;
  top: 18rpx;
  left: 50%;
  width: 580rpx;
  height: 660rpx;
  transform-origin: center top;
  will-change: transform;
}

.coverflow-card {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
  border: 6rpx solid rgba(255, 255, 255, 0.92);
  border-radius: 42rpx;
  background: #fff;
  box-shadow: 0 18rpx 42rpx rgba(70, 70, 70, 0.16);
}

.coverflow-card__image {
  display: block;
  width: 100%;
  height: 78%;
}

.coverflow-card__content {
  position: relative;
  height: 22%;
  padding: 22rpx 118rpx 18rpx 28rpx;
  box-sizing: border-box;
  background: #fff;
}

.coverflow-card__department {
  overflow: hidden;
  color: #194f94;
  font-size: 30rpx;
  font-weight: 700;
  line-height: 40rpx;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.coverflow-card__name {
  overflow: hidden;
  margin-top: 4rpx;
  color: #4a4f59;
  font-size: 25rpx;
  line-height: 34rpx;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.coverflow-card__status {
  position: absolute;
  top: 28rpx;
  right: 24rpx;
  padding: 8rpx 14rpx;
  border-radius: 999rpx;
  background: #225eaa;
  color: #fff;
  font-size: 21rpx;
  line-height: 30rpx;
}

.coverflow-indicator {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10rpx;
  height: 12rpx;
  margin-top: 12rpx;
}

.coverflow-indicator__dot {
  width: 8rpx;
  height: 8rpx;
  border-radius: 999rpx;
  background: rgba(52, 111, 199, 0.45);
  transition:
    width 300ms ease,
    background-color 300ms ease;
}

.coverflow-indicator__dot--active {
  width: 30rpx;
  background: #1959a8;
}
</style>
