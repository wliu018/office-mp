<script setup>
import dayjs from 'dayjs'
import { computed, nextTick, onMounted, reactive, ref } from 'vue'
import { useToast } from 'wot-design-uni'
import { othersApi } from '@/api/others-api'
// 引入时间选择网格组件
import TimeGrid from '@/components/time-grid.vue'

import { useUserStore } from '@/store/user'

const openId = useUserStore().openId
const currentDate = dayjs().format('YYYY-MM-DD')
const toast = useToast()

definePage({
  style: {
    navigationStyle: 'custom',
    navigationBarTitleText: '会议室预订',
    disableScroll: true,
    renderer: 'skyline',
    disableABTest: true,
    sdkVersionBegin: '2.30.4', // 基础库最低版本
    sdkVersionEnd: '15.255.255', // 填最大值，表示无版本限制
  },
})
// ---------------------
const titleHeight = ref(0)
const menuButtonInfo = uni.getMenuButtonBoundingClientRect()
const sysInfo = uni.getSystemInfoSync()
const navBarHeight = menuButtonInfo.top + menuButtonInfo.height + (sysInfo.statusBarHeight - menuButtonInfo.top) * 2
titleHeight.value = navBarHeight
titleHeight.value = sysInfo.statusBarHeight * 2

const windowHeight = ref(0)
const scrollY = ref(true)

// 被占用的时间数组
const OCCUPIED_TIMES = ['17:00-17:30', '18:00-19:30']
const selectedRange = ref([])
const timeGridRef = ref(null)

// 返回函数
function back() {
  console.log('---------------> back')
  uni.navigateBack()
}

function convertMinutesToHoursAndMinutes(totalMinutes) {
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60
  if (hours === 0)
    return `${minutes}分钟`
  if (minutes === 0)
    return `${hours}小时`
  return `${hours}小时${minutes}分钟`
}

const is_certified = ref(false)
const booker = ref('')
async function pageInit() {
  const result = await othersApi.getMeetingRoomInfo({ openId })
  console.log('result ===>', result)
  if (result.userInfo.type === 1) {
    is_certified.value = true
    booker.value = `${result.userInfo.department}-${result.userInfo.name}`
  }
  // OCCUPIED_TIMES = result.alreadyReserve
  // 确保时间网格组件更新
  await nextTick()
  timeGridRef.value?.generateTimeList && timeGridRef.value.generateTimeList()
}

// ---------------------- 生命周期函数 ------------------------
onShow(async () => {
  await uni.$onLaunched
})
onMounted(() => {
  pageInit()
})
onBeforeMount(() => {
  const { windowHeight: _windowHeight } = uni.getSystemInfoSync()
  windowHeight.value = _windowHeight
})

// ========== 表单参数 ==========
const meetingName = ref('默认主题')

const show = ref(false)
const actions = ref([
  {
    id: 1,
    name: '大会议室',
    subname: '三层',
    active: true,
  },
  {
    id: 2,
    name: '中会议室',
    subname: '三层',
    active: false,
  },
  {
    id: 3,
    name: '小会议室',
    subname: '三层',
    active: false,
  },
  {
    id: 4,
    name: '大会议室',
    subname: '二层',
    active: false,
  },
  {
    id: 5,
    name: '多功能会议室',
    subname: '二层',
    active: false,
  },
  {
    id: 6,
    name: '小会议室',
    subname: '二层',
    active: false,
  },
])

const pickedMeetingRoom = computed(() => {
  return actions.value.find(i => i.active)
})

function showActions() {
  show.value = true
}

function close() {
  show.value = false
}

function selectMeetingRoom({ item, index }) {
  wx.vibrateShort({ type: 'heavy' })
  console.log('selectMeetingRoom', actions.value[index])
  toast.show(`切换会议室: ${actions.value[index].name}-${actions.value[index].subname}`)
  const prev = actions.value.find(i => i.active)
  prev.active = false
  actions.value[index].active = true
  //
  othersApi.getAlreadyReserveByRoomId({ roomId: actions.value[index].id }).then((alreadyReserve) => {
    console.log('getAlreadyReserveByRoomId alreadyReserve ===>', alreadyReserve)
    // OCCUPIED_TIMES = alreadyReserve
    // 确保时间网格组件更新
    nextTick(() => {
      timeGridRef.value?.generateTimeList && timeGridRef.value.generateTimeList()
    })
  })
}

function handleSubmit() {
  console.log('提交表单')
  // 检查表单字段是否填写完整
  if (!meetingName.value.trim()) {
    toast.show('请输入会议主题')
    return
  }

  if (!booker.value.trim()) {
    toast.show('请输入预订人')
    return
  }

  if (selectedRange.value.length < 1) {
    toast.show('请选择预订时间')
    return
  }

  console.log('预订信息:', {
    meetingName: meetingName.value,
    booker: booker.value,
    timeRange: {
      start: selectedRange.value[0],
      end: selectedRange.value[selectedRange.value.length - 1],
    },
  })

  // 提交会议室预订请求
  uni.showLoading({
    title: '提交中...',
  })

  const roomName = `${pickedMeetingRoom.value.subname}-${pickedMeetingRoom.value.name}`
  console.log('roomName ===>', roomName)
  othersApi.reserve({
    openId,
    roomId: pickedMeetingRoom.value.id,
    roomName,
    booker: booker.value,
    reserveTimeSlot: `${selectedRange.value[0]}-${selectedRange.value[selectedRange.value.length - 1]}`,
  }).then((res) => {
    console.log('reserve res ===>', res)
    uni.hideLoading()
    if (res.status === 2) {
      toast.show('预约时间段已被占用')
      clearAllSelection()
      // 重新生成时间列表
      // OCCUPIED_TIMES = res.alreadyReserve
      // 确保时间网格组件更新
      nextTick(() => {
        timeGridRef.value?.generateTimeList && timeGridRef.value.generateTimeList()
      })
    }
    if (res.status === 1) {
      toast.success({
        msg: '预订成功',
        closed: () => {
          // 重置表单
          meetingName.value = ''
          booker.value = ''
          clearAllSelection()
          uni.navigateBack()
        },
      })
    }
  })
}

const defaultCustomRouteConfig = {
  opaque: false,
  maintainState: true,
  transitionDuration: 300,
  reverseTransitionDuration: 300,
  barrierColor: 'rgba(0, 0, 0, 0.4)',
  barrierDismissible: true,
  barrierLabel: '',
  canTransitionTo: true,
  canTransitionFrom: true,
  allowEnterRouteSnapshotting: true,
  allowExitRouteSnapshotting: true,
  fullscreenDrag: true,
  popGestureDirection: 'horizontal', // vertical, horizontal, both
}
const routeType = reactive(['wx://bottom-sheet', 'wx://upwards', 'wx://zoom', 'wx://cupertino-modal', 'wx://cupertino-modal-inside', 'wx://modal-navigation', 'wx://modal'])

// 处理时间网格选择变化
function handleSelectionChange(data) {
  const { startTime, endTime, selectedRange: newSelectedRange } = data
  console.log('handleSelectionChange', { startTime, endTime, selectedRange: newSelectedRange })
  // 只保留开始和结束时间
  if (newSelectedRange.length > 0) {
    selectedRange.value = [newSelectedRange[0].split('-')[0], newSelectedRange[newSelectedRange.length - 1].split('-')[1]]
  }
  else {
    selectedRange.value = []
  }
}

// 处理时间网格滚动更新
function handleUpdateScroll(enabled) {
  scrollY.value = enabled
}

// 清空所有选中状态
function clearAllSelection() {
  timeGridRef.value?.clearAllSelection()
}

// 处理时间格子点击
function handleTap(data) {
  console.log('handleTap===========>', data)
  // 如果时间格子被占用，跳转到详情页面
  // go2details()
}

function go2details(i = 6) {
  const params = {
    id: 3,
    routeType: routeType[i],
    nextRouteType: routeType[i],
    fullscreen: 1,
    content: 'Zoom',
  }
  wx.navigateTo({
    url: `/pages/reserve/detail`,
    routeType: params.routeType,
    routeConfig: defaultCustomRouteConfig,
  })
}
</script>

<template>
  <div style="height: 0;">
    <wd-navbar placeholder left-arrow safe-area-inset-top fixed title="会议室预订" @click-left="back" />
  </div>
  <wd-action-sheet v-model="show" :actions="actions" @close="close" @select="selectMeetingRoom" />
  <div :style="`height: ${titleHeight}px;`" />
  <div class="relative">
    <scroll-view :scroll-y="scrollY" :enable-back-to-top="true" :style="`height: calc(100vh - ${titleHeight}px);`">
      <view class="container" style="padding-top: 10px;">
        <wd-card type="rectangle" class="bot-title" style="animation-delay: 0.2s;">
          <template #title>
            <view class="flex flex-row items-center">
              <wd-icon custom-style="font-weight: bold;" color="#05f" name="computer" size="16px" />
              <text class="ml-1 text-[15px]">{{ `${pickedMeetingRoom.subname}-${pickedMeetingRoom.name}` }}</text>
            </view>
          </template>
          <view class="content">
            <image
              src="/static/images/reserve/L3D722S41ENDOUE4TKYUWIAU6LUFX6W45QY8.jpg"
              style="border-radius: 4px; width: 100%; height: auto;"
              mode="widthFix"
            />
          </view>

          <template #footer>
            <view>
              <wd-button size="small" custom-class="background-05f" color="#05f" @click="showActions">
                更换会议室
              </wd-button>
            </view>
          </template>
        </wd-card>

        <wd-card type="rectangle" class="bot-title" style="animation-delay: 0.3s;">
          <template #title>
            <view class="title">
              <view class="flex flex-row items-center">
                <wd-icon custom-style="font-weight: bold;" color="#05f" name="edit-outline" size="16px" />
                <text class="ml-1 text-[15px]">会议主题</text>
              </view>
            </view>
          </template>
          <view class="content">
            <view style="color: rgba(0,0,0,0.85);">
              <wd-input v-model="meetingName" clearable no-border custom-input-class="custom-input-class" :maxlength="30" show-word-limit size="middle" type="text" placeholder="请输入会议主题" />
            </view>
          </view>
        </wd-card>

        <wd-card type="rectangle" class="bot-title" style="animation-delay: 0.4s;">
          <template #title>
            <view class="title">
              <view class="flex flex-row items-center">
                <wd-icon custom-style="font-weight: bold;" color="#05f" name="user" size="16px" /><text class="ml-1 text-[15px]">预订人</text>
              </view>
            </view>
          </template>
          <view class="content">
            <view style="color: rgba(0,0,0,0.85);">
              <wd-input
                v-model="booker"
                readonly no-border custom-input-class="custom-input-class"
                :maxlength="10" size="middle" type="text" placeholder="请输入预订人"
              />
            </view>
          </view>
        </wd-card>

        <wd-card type="rectangle" class="bot-title" style="animation-delay: 0.5s;">
          <template #title>
            <view class="flex flex-row">
              <view class="title mr-1">
                <view class="flex flex-row items-center">
                  <wd-icon custom-style="font-weight: bold;" color="#05f" name="time" size="16px" /><text class="ml-1 text-[15px]">预订时间</text>
                </view>
              </view>
            </view>
          </template>
          <view class="content">
            <view class="text-[rgba(0,0,0,0.85)]">
              <!-- 选中结果展示 -->
              <view class="selected-result">
                <text class="result-label">已选择：</text>
                <template v-if="selectedRange.length">
                  <text class="result-label">{{ currentDate }}</text>
                  <text class="result-value"> {{ selectedRange[0] }}-{{ selectedRange[selectedRange.length - 1] }}</text>
                  <text class="result-desc display-none">共{{ convertMinutesToHoursAndMinutes(selectedRange.length * 30) }}</text>
                </template>
              </view>
            </view>
          </view>

          <template #footer>
            <view>
              <TimeGrid
                ref="timeGridRef"
                :occupied-times="OCCUPIED_TIMES"
                @selection-change="handleSelectionChange"
                @tap-time="handleTap"
                @update-scroll="handleUpdateScroll"
              />
            </view>
          </template>
        </wd-card>

        <div class="btn-wrapper">
          <div v-if="is_certified" class="btn-area" @click="handleSubmit">
            <div class="next-step btn">
              预订
            </div>
          </div>
          <div v-else class="btn-area">
            <div class="next-step btn opacity-50">
              请进行员工认证后使用
            </div>
          </div>
        </div>
      </view>
    </scroll-view>
  </div>
  <wd-toast />
</template>

<style lang="scss" scoped>
@import 'scss/test.scss';
</style>

<style>
page {
  background: #edf1f6;
  box-sizing: border-box;
}
.custom-input-class {
  font-size: 15px !important;
  line-height: 15px !important;
}
.background-05f {
  background-color: #05f !important;
}
.wd-input__suffix {
  display: flex !important;
  align-items: center !important;
}
</style>
