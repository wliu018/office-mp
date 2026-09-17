<template>
  <div style="height: 0;">
    <wd-navbar
      placeholder
      left-arrow
      safe-area-inset-top
      fixed
      title="最新认证申请"
      style="--wot-navbar-bg: transparent"
      @click-left="uni.navigateBack()"
    />
  </div>
  <swiper
    class="employee-certification-content"
    vertical
    :duration="520"
    easing-function="easeInOutCubic"
  >
    <swiper-item class="employee-page-slide">
      <view
        v-if="employees.length"
        class="employee-swiper-center"
        style="height: 100vh;"
      >
        <view class="employee-swiper-heading">
          <view class="employee-swiper-heading__title">
            最新认证申请
          </view>
          <view class="employee-swiper-heading__subtitle">
            展示最新5个认证申请
          </view>
        </view>
        <swiper
          class="employee-swiper"
          next-margin="230rpx"
          :circular="employees.length > 1"
          :autoplay="employees.length > 1"
          :duration="500"
          :interval="3000"
          easing-function="easeOutCubic"
          @touchstart.capture="handleSwiperTouchStart"
          @touchmove.capture="handleSwiperTouchMove"
          @touchend.capture="handleSwiperTouchEnd"
          @change="handleSwiperChange"
          @animationfinish="handleSwiperAnimationFinish"
        >
          <swiper-item
            v-for="(employee, index) in employees"
            :key="employee.id || employee.openId || index"
            class="employee-swiper-item"
          >
            <view
              class="employee-card"
              :class="{ 'employee-card--active': index === incomingEmployeeIndex || (index === transitionOriginIndex && swipeDirection !== -1) }"
            >
              <image class="employee-image" :src="employee.src" mode="aspectFill" />
              <view class="employee-name">
                {{ index + 1 }}. {{ employee.department || '-' }} {{ '-' }} {{ employee.name || '-' }}
              </view>
              <view class="employee-type" style="display: none;">
                {{ isCurrentEmployeeCertified ? '已审核' : '未审核' }}
              </view>
            </view>
          </swiper-item>
        </swiper>
        <view v-if="employees.length > 1" class="employee-swiper-indicator">
          <view
            v-for="(employee, index) in employees"
            :key="employee.id || employee.openId || index"
            class="employee-swiper-indicator-dot"
            :class="{ 'employee-swiper-indicator-dot--active': index === currentEmployeeIndex }"
          />
        </view>
      </view>
    </swiper-item>
    <swiper-item v-if="employees.length" class="employee-page-slide">
      <CoverflowShowcase :employees="employees" />
    </swiper-item>
  </swiper>
</template>

<script setup>
import { computed, inject, ref } from 'vue'
import { simpleLoginApi } from '@/api/login/simple-login-api'
import CoverflowShowcase from './components/coverflow-showcase.vue'

definePage({
  style: {
    navigationStyle: 'custom',
    navigationBarTitleText: '员工认证',
    disableScroll: true,
    renderer: 'skyline',
    disableABTest: true,
    sdkVersionBegin: '2.30.4',
    sdkVersionEnd: '15.255.255',
  },
})

const navBarConfig = inject('navBarConfig')
const employees = ref([])
const currentEmployeeIndex = ref(0)
const transitionOriginIndex = ref(0)
const incomingEmployeeIndex = ref(null)
const touchStartX = ref(null)
const gestureDirection = ref(null)
const swipeDirection = ref(null)
const swipeActivationDistance = uni.getWindowInfo().windowWidth * 0.5
const currentEmployee = computed(() => employees.value[currentEmployeeIndex.value])
const isCurrentEmployeeCertified = computed(() => Number(currentEmployee.value?.type) === 2)

async function loadEmployees() {
  try {
    const result = await simpleLoginApi.employeeCertificationPage()
    employees.value = result?.records || []
    currentEmployeeIndex.value = 0
    transitionOriginIndex.value = 0
    incomingEmployeeIndex.value = null
    touchStartX.value = null
    gestureDirection.value = null
    swipeDirection.value = null
  }
  catch {
    employees.value = []
  }
}

function handleSwiperTouchStart(event) {
  touchStartX.value = Number(event.touches?.[0]?.clientX)
  transitionOriginIndex.value = currentEmployeeIndex.value
  incomingEmployeeIndex.value = null
  gestureDirection.value = null
  swipeDirection.value = null
}

function updateSwiperGesture(currentX) {
  const employeeCount = employees.value.length

  if (employeeCount <= 1 || !Number.isFinite(touchStartX.value) || !Number.isFinite(currentX))
    return

  const distanceX = currentX - touchStartX.value

  if (Math.abs(distanceX) >= 1)
    gestureDirection.value = distanceX < 0 ? 1 : -1

  if (Math.abs(distanceX) < swipeActivationDistance)
    return

  const incomingIndex = (transitionOriginIndex.value + gestureDirection.value + employeeCount) % employeeCount

  swipeDirection.value = gestureDirection.value

  if (incomingEmployeeIndex.value !== incomingIndex)
    incomingEmployeeIndex.value = incomingIndex
}

function handleSwiperTouchMove(event) {
  updateSwiperGesture(Number(event.touches?.[0]?.clientX))
}

function handleSwiperTouchEnd(event) {
  updateSwiperGesture(Number(event.changedTouches?.[0]?.clientX))
}

function handleSwiperChange(event) {
  const nextIndex = event.detail.current

  if (swipeDirection.value === null)
    swipeDirection.value = gestureDirection.value

  currentEmployeeIndex.value = nextIndex
  incomingEmployeeIndex.value = nextIndex
}

function handleSwiperAnimationFinish(event) {
  currentEmployeeIndex.value = event.detail.current
  transitionOriginIndex.value = event.detail.current
  incomingEmployeeIndex.value = null
  touchStartX.value = null
  gestureDirection.value = null
  swipeDirection.value = null
}

onShow(async () => {
  await uni.$onLaunched
  loadEmployees()
})
</script>

<style lang="scss" scoped>
.employee-certification-content {
  position: relative;
  width: 100%;
  height: 100vh;
  background: #f1f3f7;
}

.employee-page-slide {
  width: 100%;
  height: 100vh;
  overflow: hidden;
}

.employee-confirm-heading {
  position: absolute;
  right: 0;
  bottom: calc(50% + 24.5vh + 28px);
  left: 0;
  color: #16181d;
  font-size: 24px;
  font-weight: 600;
  line-height: 1.4;
  text-align: center;
}

.employee-swiper {
  width: 92vw;
  height: calc(560rpx + 20px);
  margin-left: 8vw;
  overflow: visible;
  transform: translateY(-50px);
}

.employee-swiper-center {
  position: relative;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.employee-swiper-heading {
  position: absolute;
  top: calc(50% - 280rpx - 134px);
  left: calc(8vw + 8rpx);
  z-index: 1;
}

.employee-swiper-heading__title {
  color: #171717;
  font-size: 20px;
  font-weight: 700;
  line-height: 28px;
}

.employee-swiper-heading__subtitle {
  color: #999;
  font-size: 14px;
  line-height: 20px;
}

.employee-swiper-indicator {
  position: absolute;
  top: calc(50% + 280rpx - 60px);
  left: calc(8vw + 8px);
  display: flex;
  align-items: center;
  gap: 10rpx;
  height: 8rpx;
}

.employee-swiper-indicator-dot {
  width: 8rpx;
  height: 8rpx;
  border-radius: 999px;
  background: #0055ff67;
  transition:
    width 300ms ease,
    background-color 300ms ease;
}

.employee-swiper-indicator-dot--active {
  width: 28rpx;
  background: #0055ff;
}

.employee-card {
  position: relative;
  width: 50vw;
  height: calc(100% - 40px);
  overflow: hidden;
  border-radius: 12px;
  background: #fff;
  box-shadow: 0 5px 10px rgba(23, 30, 45, 0.12);
  transform: translateY(25px);
  transition: transform 500ms cubic-bezier(0.22, 1, 0.36, 1);
  will-change: transform;
}

.employee-card--active {
  transform: translateY(0);
}

.employee-swiper-item {
  display: flex;
  justify-content: flex-start;
  padding: 0 8rpx;
  box-sizing: border-box;
  overflow: visible;
  border-radius: 12px;
}

.employee-image {
  display: block;
  width: 100%;
  height: 79%;
}

.employee-name {
  display: flex;
  align-items: center;
  height: 21%;
  padding: 0 16px;
  box-sizing: border-box;
  background: #fff;
  color: #303032;
  font-size: 17px;
  font-weight: 600;
  text-align: left;
}

.employee-status-tag {
  width: 40vw !important;
  height: 42px !important;
  font-size: 16px !important;
  font-weight: 600;
}

:deep(.employee-status-tag) {
  position: fixed;
  top: 20%;
  left: 0%;
  display: flex !important;
  align-items: center;
  justify-content: center;
  width: 40vw !important;
  height: 42px !important;
}
</style>

<style>
page {
  background: #f1f3f7;
}
</style>
