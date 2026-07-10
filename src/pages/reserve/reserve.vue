<script setup>
import dayjs from 'dayjs'
import { nextTick, onMounted, reactive, ref } from 'vue'
import { useMessage, useToast } from 'wot-design-uni'
import { othersApi } from '@/api/others-api'
import TimeGrid from '@/components/time-grid.vue'
import { useUserStore } from '@/store/user'

const openId = useUserStore().openId
const toast = useToast()
const dateValue = ref(0)
const message = useMessage()

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
// 注入全局属性
const navBarConfig = inject('navBarConfig')
const windowHeight = ref(0)
const scrollY = ref(true)

// 被占用的时间数组
// eslint-disable-next-line prefer-const
let occupied = ref(['09:00-09:30'])
const occupied_times = ref([])

// 选中的时间范围（展示用）
const selectedRange = ref([])

const timeGridRef = ref(null)

function handleSelectionChange(data) {
  const { startTime, endTime, selectedRange: newSelectedRange } = data
  console.log('handleSelectionChange', { startTime, endTime, selectedRange: newSelectedRange })
  if (newSelectedRange.length > 0) {
    selectedRange.value = [newSelectedRange[0].split('-')[0], newSelectedRange[newSelectedRange.length - 1].split('-')[1]]
  }
  else {
    selectedRange.value = []
  }
}

function handleUpdateScroll(enabled) {
  scrollY.value = enabled
}

function clearAllSelection() {
  timeGridRef.value?.clearAllSelection()
}

function handleTap(data) {
  console.log('handleTap===========>', data)
  // go2details()
}

function back() {
  console.log('---------------> back')
  uni.navigateBack()
}

function convertMinutesToHoursAndMinutes(range) {
  const startTime = range[0]
  const endTime = range[range.length - 1]
  const parseTimeToMinutes = (timeStr) => {
    const [hours, minutes] = timeStr.split(':').map(Number)
    return hours * 60 + minutes
  }
  const startMinutes = parseTimeToMinutes(startTime)
  const endMinutes = parseTimeToMinutes(endTime)
  const totalMinutes = endMinutes - startMinutes
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
  const result = await othersApi.getMeetingRoomInfo({ openId, reserveDate: currentDate.value })
  console.log('result ===>', result)
  if (result.userInfo.type === 2) {
    is_certified.value = true
    booker.value = `${result.userInfo.department}-${result.userInfo.name}`
  }
  // 合并默认占用时段
  occupied_times.value = [...occupied.value, ...result.alreadyReserve]
  await nextTick()
  // timeGridRef.value?.generateTimeList && timeGridRef.value.generateTimeList()
}

// ---------------------- 生命周期函数 ------------------------
onShow(async () => {
  await uni.$onLaunched
  initReserveDays()
})
onMounted(() => {
  pageInit()
})
onBeforeMount(() => {
  const { windowHeight: _windowHeight } = uni.getSystemInfoSync()
  windowHeight.value = _windowHeight
})

// ---------- 表单逻辑 ----------
const reserveDays = ref([])
function getWeekday(date) {
  const dayjsDate = dayjs(date)
  if (!dayjsDate.isValid()) {
    throw new Error('传入的日期格式无效，请检查！')
  }
  const weekdayNum = dayjsDate.day()
  const weekdayCnMap = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
  return weekdayCnMap[weekdayNum]
}
function initReserveDays() {
  const today = dayjs().format('YYYY-MM-DD')
  const tomorrow = dayjs().add(1, 'day').format('YYYY-MM-DD')
  const days = [{
    num: 0,
    txt: '预定今天',
    date: today,
    weekday: getWeekday(today),
  }, {
    num: 1,
    txt: '预定明天',
    date: tomorrow,
    weekday: getWeekday(tomorrow),
  }]
  reserveDays.value = days
  console.log('reserveDays ===>', reserveDays.value)
}

// ========== 表单参数 ==========
const meetingName = ref('')

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
  // toast.show(`切换会议室: ${actions.value[index].name}-${actions.value[index].subname}`)
  const prev = actions.value.find(i => i.active)
  prev.active = false
  actions.value[index].active = true
  //
  othersApi.getAlreadyReserveByRoomId({ roomId: actions.value[index].id, reserveDate: currentDate.value }).then(async (alreadyReserve) => {
    console.log('getAlreadyReserveByRoomId alreadyReserve ===>', alreadyReserve)
    // 清空上次选中的时间
    selectedRange.value = []
    // 调用组件方法清空选中状态
    timeGridRef.value?.clearAllSelection()
    // 合并默认占用时段和API返回的时段
    occupied_times.value = [...occupied.value, ...alreadyReserve]
    await nextTick()
    // timeGridRef.value?.generateTimeList && timeGridRef.value.generateTimeList()
  })
}

// 计算当前选择的日期
const currentDate = computed(() => {
  if (dateValue.value === 0) {
    return dayjs().format('YYYY-MM-DD')
  }
  else {
    return dayjs().add(1, 'day').format('YYYY-MM-DD')
  }
})
function changeDate(value) {
  const currentAction = actions.value.find(i => i.active)
  othersApi.getAlreadyReserveByRoomId({ roomId: currentAction.id, reserveDate: currentDate.value }).then(async (alreadyReserve) => {
    console.log('getAlreadyReserveByRoomId alreadyReserve ===>', alreadyReserve)
    selectedRange.value = []
    timeGridRef.value?.clearAllSelection()
    occupied_times.value = [...occupied.value, ...alreadyReserve]
  })
}

function sureSubmit() {
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
  const reserveTimeSlot = `${selectedRange.value[0]}-${selectedRange.value[selectedRange.value.length - 1]}`
  message
    .confirm({
      msg: reserveTimeSlot,
      title: '确认预订?',
    })
    .then(() => {
      handleSubmit()
    })
    .catch(() => {
    })
}

function handleSubmit() {
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
  const reserveTimeSlot = `${selectedRange.value[0]}-${selectedRange.value[selectedRange.value.length - 1]}`
  othersApi.reserve({
    openId,
    roomId: pickedMeetingRoom.value.id,
    roomName,
    booker: booker.value,
    reserveDate: currentDate.value,
    reserveTimeSlot,
    topic: meetingName.value,
  }).then((res) => {
    console.log('reserve res ===>', res)
    uni.hideLoading()
    if (res.status === 2) {
      toast.show('预约时间段已被占用')
      clearAllSelection()
      // 重新生成时间列表
      // 合并默认占用时段
      occupied_times.value = [...occupied.value, ...res.alreadyReserve]
      // 确保时间网格组件更新
      nextTick(() => {
        // timeGridRef.value?.generateTimeList && timeGridRef.value.generateTimeList()
      })
    }
    if (res.status === 1) {
      wx.vibrateShort({ type: 'heavy' })
      const close = () => {
        // 重置表单
        meetingName.value = ''
        booker.value = ''
        clearAllSelection()
        uni.navigateBack()
      }
      message
        .alert({
          msg: reserveTimeSlot,
          title: '预订成功',
        })
        .then(() => {
          close()
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
  <div :style="`height: ${navBarConfig.customNavBarHeight}px;`" />
  <div class="relative">
    <scroll-view :scroll-y="scrollY" :enable-back-to-top="true" :style="`height: calc(100vh - ${navBarConfig.customNavBarHeight}px);`">
      <view class="container" style="padding-top: 10px;">
        <wd-card type="rectangle" class="bot-title" style="animation-delay: 0.2s;">
          <template #title>
            <view class="flex flex-row items-center">
              <wd-icon custom-style="font-weight: bold;" color="#05f" name="computer" size="16px" />
              <text class="ml-1 text-[15px] text-[#999]">{{ `${pickedMeetingRoom.subname}-${pickedMeetingRoom.name}` }}</text>
            </view>
          </template>
          <view class="content flex flex-col items-center">
            <image
              src="/static/images/reserve/L3D722S41ENDOUE4TKYUWIAU6LUFX6W45QY8.jpg"
              style="border-radius: 4px; width: 90%; height: auto;"
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
                <text class="ml-1 text-[15px] text-[#999]">会议主题</text>
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
                <wd-icon custom-style="font-weight: bold;" color="#05f" name="user" size="16px" /><text class="ml-1 text-[15px] text-[#999]">预订人</text>
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

        <wd-card type="rectangle" custom-content-class="custom-content-class" class="bot-title" style="animation-delay: 0.5s;">
          <template #title>
            <view class="flex flex-row">
              <view class="title mr-1">
                <view class="flex flex-row items-center">
                  <wd-icon custom-style="font-weight: bold;" color="#05f" name="time" size="16px" /><text class="ml-1 text-[15px] text-[#999]">预订时间</text>
                </view>
              </view>
            </view>
          </template>
          <view class="content">
            <!-- <view class="text-[rgba(0,0,0,0.85)]">
              <view class="selected-result">
                <text class="result-label">已选择：</text>
                <template v-if="selectedRange.length">
                  <text class="result-label">{{ currentDate }}</text>
                  <text class="result-value"> {{ selectedRange[0] }}-{{ selectedRange[selectedRange.length - 1] }}</text>
                  <text class="result-desc display-none">共{{ convertMinutesToHoursAndMinutes(selectedRange) }}</text>
                </template>
              </view>
            </view> -->
            <view>
              <wd-radio-group v-model="dateValue" inline shape="dot" @change="changeDate">
                <div class="align-items-center flex flex-row pb-2 space-x-1">
                  <wd-radio v-for="item in reserveDays" :key="item.num" :value="item.num">
                    <div class="flex flex-row items-center">
                      {{ `${item.txt}` }}
                      <span class="color-[#999]">{{ `(${item.weekday})` }}</span>
                    </div>
                  </wd-radio>
                </div>
              </wd-radio-group>
            </view>
            <view>
              <TimeGrid
                ref="timeGridRef"
                :occupied-times="occupied_times"
                @selection-change="handleSelectionChange"
                @tap-time="handleTap"
                @update-scroll="handleUpdateScroll"
              />
            </view>
          </view>

          <template #footer />
        </wd-card>

        <div v-show="!is_certified" class="pb-3 pt-1">
          <wd-notice-bar text="请在首页「我的」中进行认证后使用, 仅对丝路上海内部员工开放" type="info" prefix="warn-bold" />
        </div>

        <div class="btn-wrapper">
          <div v-if="is_certified" class="btn-area" @click="sureSubmit">
            <div class="next-step btn">
              预订
            </div>
          </div>
          <div v-else class="btn-area">
            <div class="next-step btn opacity-50">
              预订
            </div>
          </div>
        </div>
      </view>
    </scroll-view>
  </div>
</template>

<style lang="scss" scoped>
 @import 'scss/reserve.scss';
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
.wd-checkbox.is-checked .wd-checkbox__shape {
  background-color: #05f !important;
  border-color: #05f !important;
}
.wd-radio.is-dot.is-checked .wd-radio__shape {
  background-color: #5c7eee !important;
  border-color: #5c7eee !important;
  margin-top: 0 !important;
}
.wd-radio.is-inline.is-dot .wd-radio__shape {
  margin-top: 0 !important;
}
.wd-radio {
  display: flex !important;
  justify-content: flex-start !important;
  padding: 5px !important;
}
.wd-radio__label {
  padding-right: 5px !important;
}
.custom-content-class {
}
.wd-message-custom-class {
  border-radius: 20px !important;
  overflow: hidden !important;
}
</style>
