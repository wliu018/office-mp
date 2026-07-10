<template>
  <div style="height: 0;">
    <wd-navbar
      placeholder left-arrow safe-area-inset-top fixed title="维护申请"
      style="--wot-navbar-background:transparent;--wot-color-border-light:transparent"
      @click-left="uni.navigateBack()"
    />
  </div>
  <div :style="`height: ${navBarConfig.customNavBarHeight}px;`" />
  <div class="relative">
    <scroll-view :scroll-y="scrollY" :enable-back-to-top="true" :style="`height: calc(100vh - ${navBarConfig.customNavBarHeight}px);`">
      <view
        class="container relative box-border p-[20px]"
      >
        <view class="tickets">
          <view class="content">
            <wd-row custom-class="mb-[10px]">
              <wd-col :span="6">
                <view class="text-[#8F8F8F]">
                  编号
                </view>
              </wd-col>
              <wd-col :span="18">
                <view class="text-right text-[#303032]">
                  {{ state.coupon?.serialNumber || '-' }}
                </view>
              </wd-col>
            </wd-row>
            <wd-row custom-class="mb-[10px]">
              <wd-col :span="12">
                <view class="text-[#8F8F8F]">
                  申请人
                </view>
              </wd-col>
              <wd-col :span="12">
                <view class="text-right text-[#303032]">
                  {{ is_certified ? `${state.userInfo.department}-${state.userInfo.name}` : '-' }}
                </view>
              </wd-col>
            </wd-row>

            <wd-row custom-class="mb-[10px]">
              <wd-col :span="12">
                <view class="text-[#8F8F8F]">
                  设备编号
                </view>
              </wd-col>
              <wd-col :span="12">
                <view class="text-right text-[#303032]">
                  {{ currentLicensePlate || '-' }}
                </view>
              </wd-col>
            </wd-row>
            <wd-row custom-class="mb-[10px]">
              <wd-col :span="12">
                <view class="text-[#8F8F8F]">
                  申请日期
                </view>
              </wd-col>
              <wd-col :span="12">
                <view class="text-right text-[#303032]">
                  {{ dayjs().format('YYYYMMDD') }}
                </view>
              </wd-col>
            </wd-row>
            <wd-row custom-class="mb-[10px]">
              <wd-col :span="6">
                <view class="text-[#8F8F8F]">
                  验证码
                </view>
              </wd-col>
              <wd-col :span="18">
                <view class="text-right text-[#303032]">
                  {{ state.coupon?.code || '-' }}
                </view>
              </wd-col>
            </wd-row>

            <wd-row custom-class="mb-[10px]">
              <wd-col :span="12" :offset="12">
                <view class="mb-[10px] text-right text-[#303032]">
                  <div v-if="state.unlimitedQRCode && !licensePlateLoading" class="flex flex-col items-end">
                    <div>
                      <image :src="state.unlimitedQRCode" :show-menu-by-longpress="false" mode="widthFix" class="h-[120px] w-[120px]" alt="二维码" />
                      <div class="full-width pt-[10px] text-center text-[#999999]">
                        确认码
                      </div>
                    </div>
                  </div>
                  <view v-else class="h-[120px] w-[120px]">
                    <wd-loading type="spinner" size="50px" />
                  </view>
                </view>
              </wd-col>
            </wd-row>
          </view>
          <view class="bot">
            <wd-icon name="warning" size="16px" color="#999999" />仅限当日使用，重复提交无效
          </view>
        </view>
        <div class="mt-[50px] text-center">
          <view v-if="state.licensePlates.length > 1" class="mb-[20px]">
            <wd-radio-group v-model="currentLicensePlate" style="background: transparent;" inline shape="dot" size="large" @change="changeLicensePlate">
              <div class="flex flex-row justify-center space-x-1" style="--wot-radio-label-color: #303032;">
                <wd-radio v-for="item in state.licensePlates" :key="item.code" :value="item.code">
                  {{ item.code }}
                </wd-radio>
              </div>
            </wd-radio-group>
          </view>
          <wd-button
            :disabled="!is_certified && state.availableCoupons.length > 0 && !!licensePlate"
            custom-class="custom-shadow"
            custom-style="background: linear-gradient(115deg, #3D7DFE 8.4%, #6A59FE 52.29%, #9142FF 93.72%);"
            @click="getTicket"
          >
            提交申请
          </wd-button>
        </div>

        <div>
          <div class="normal-section">
            <div class="normal-text-title">
              维护说明
            </div>
            <div class="normal-text">
              一、请先在首页「我的」中完成认证后再使用，仅对内部员工开放。
            </div>
          </div>
        </div>
      </view>
    </scroll-view>
  </div>
  <wd-toast />
  <loadingBox :show="wdLoading" />
</template>

<script setup>
import dayjs from 'dayjs'
import { inject, nextTick, onMounted, reactive, ref } from 'vue'
import { useMessage, useToast } from 'wot-design-uni'
import { othersApi } from '@/api/others-api'
import loadingBox from '@/components/global-loading-box.vue'
import { useUserStore } from '@/store/user'

// 注入全局属性
const navBarConfig = inject('navBarConfig')

const openId = useUserStore().openId
const toast = useToast()
const message = useMessage()
const globalLoadingShow = ref(false)
const wdLoading = ref(true)
const is_certified = ref(false)
const licensePlateLoading = ref(false)

definePage({
  style: {
    navigationStyle: 'custom',
    navigationBarTitleText: '维护申请',
    disableScroll: true,
  },
})
// ---------------------1----------------------

const scrollY = ref(true)
const currentLicensePlate = ref('-')

const state = reactive({
  availableCoupons: [],
  userInfo: {},
  unlimitedQRCode: '',
  licensePlates: [],
  coupon: {},
})

async function pageInit(seconds = false) {
  wdLoading.value = true
  const result = await othersApi.parkingInit({ openId })
  console.log(result)
  const { availableCoupons, userInfo, unlimitedQRCode, licensePlates, coupon } = result
  state.availableCoupons = availableCoupons
  state.userInfo = userInfo
  state.unlimitedQRCode = unlimitedQRCode

  state.coupon = coupon
  if (userInfo.type === 2) {
    is_certified.value = true
  }
  if (!seconds) {
    state.licensePlates = licensePlates
    if (state.licensePlates.length > 0) {
      let defaultLicensePlate = state.licensePlates.find(item => item.default === 1)
      console.log('defaultLicensePlate', defaultLicensePlate)
      if (!defaultLicensePlate) {
        defaultLicensePlate = state.licensePlates[0]
      }
      currentLicensePlate.value = defaultLicensePlate?.code || '-'
    }
  }
  wdLoading.value = false
}

// ---------------------- 生命周期函数 ------------------------
onShow(async () => {
  await uni.$onLaunched
})
onMounted(() => {
  pageInit()
})

function changeLicensePlate(value) {
  console.log(value)
}

// 提交申请
function getTicket() {
  message
    .confirm({
      msg: '确认提交？',
      title: '提示',
    })
    .then(() => {
      takeTicket()
    })
    .catch(() => {
      console.log('取消提交')
    })
}
async function takeTicket() {
  if (!is_certified.value) {
    message.alert({ msg: '请先进行认证' })
    return
  }
  if (!currentLicensePlate?.value) {
    message.alert({ msg: '请完善设备编号' })
    return
  }
  toast.loading({
    loadingType: 'ring',
    msg: '提交中',
  })
  if (!state.coupon) {
    await new Promise(resolve => setTimeout(resolve, 1000))
    toast.error({ msg: '暂无可用维护额度' })
    return
  }
  const params = { openId, licensePlateNumber: currentLicensePlate.value, code: state.coupon.code }
  const result = await othersApi.takeTicket(params)
  console.log(result)
  if (result === 1) {
    toast.close()
    message
      .alert({
        msg: '提交成功',
        title: '提示',
      })
      .then(() => {
        uni.navigateBack()
      })
  }
  else {
    toast.error({ msg: '该额度已被使用，请重新获取', closed: () => {
      pageInit(true)
    } })
  }
}
</script>

<style lang="scss" scoped>
@import './scss/maintenance.scss';
</style>

<style>
page {
  background: linear-gradient(
    99deg,
    rgba(255, 91, 145, 0.08) 2%,
    rgba(63, 169, 245, 0.1) 51.48%,
    rgba(58, 175, 246, 0.1) 57.25%,
    rgba(46, 193, 248, 0.1) 65.5%,
    rgba(25, 222, 251, 0.1) 74.57%,
    rgba(0, 255, 255, 0.1) 82.82%
  );
}
</style>
