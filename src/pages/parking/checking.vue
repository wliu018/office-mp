<template>
  <div style="height: 0;">
    <wd-navbar
      placeholder left-arrow safe-area-inset-top fixed title="验票结果"
      style="--wot-navbar-background:transparent;--wot-color-border-light:transparent"
      @click-left="uni.navigateBack()"
    />
  </div>
  <div :style="`height: ${navBarConfig.customNavBarHeight}px;`" />
  <div class="relative">
    <scroll-view :scroll-y="scrollY" :enable-back-to-top="true" :style="`height: calc(100vh - ${navBarConfig.customNavBarHeight}px);`">
      <view
        class="container relative box-border p-[20px]"
        :class="showResult ? 'loaded' : ''"
      >
        <view class="tickets">
          <view class="content">
            <div class="stamp" :class="validateResult === '有效' ? 'valid' : ''">
              {{ validateResult }}
            </div>
            <wd-row custom-class="mb-[10px]">
              <wd-col :span="6">
                <view class="text-[#8F8F8F]">
                  当日序号
                </view>
              </wd-col>
              <wd-col :span="18">
                <view class="text-right text-[#303032]">
                  {{ ticketRecord.serial_number || '-' }}
                </view>
              </wd-col>
            </wd-row>
            <wd-row custom-class="mb-[10px]">
              <wd-col :span="12">
                <view class="text-[#8F8F8F]">
                  取票人
                </view>
              </wd-col>
              <wd-col :span="12">
                <view class="text-right text-[#303032]">
                  {{ `${ticketRecord.department}-${ticketRecord.name}` || '-' }}
                </view>
              </wd-col>
            </wd-row>

            <wd-row custom-class="mb-[10px]">
              <wd-col :span="12">
                <view class="text-[#8F8F8F]">
                  车牌号
                </view>
              </wd-col>
              <wd-col :span="12">
                <view class="text-right text-[#303032]">
                  <wd-tag type="primary" custom-class="!text-[14px] !font-600" plain>
                    {{ ticketRecord.license_plate_number }}
                  </wd-tag>
                </view>
              </wd-col>
            </wd-row>
            <wd-row custom-class="mb-[10px]">
              <wd-col :span="12">
                <view class="text-[#8F8F8F]">
                  有效日期
                </view>
              </wd-col>
              <wd-col :span="12">
                <view class="text-right text-[#303032]">
                  {{ ticketRecord.validityDate || '-' }}
                </view>
              </wd-col>
            </wd-row>
            <wd-row custom-class="mb-[10px]">
              <wd-col :span="6">
                <view class="text-[#8F8F8F]">
                  券码
                </view>
              </wd-col>
              <wd-col :span="18">
                <view class="text-right text-[#303032]">
                  {{ ticketRecord.code }}
                </view>
              </wd-col>
            </wd-row>

            <wd-row custom-class="mb-[10px]">
              <wd-col :span="12" :offset="12">
                <view class="mb-[10px] text-right text-[#303032]">
                  <div v-if="ticketRecord.unlimitedQRCode" class="flex flex-col items-end">
                    <div>
                      <image :src="ticketRecord.unlimitedQRCode" show-menu-by-longpress mode="widthFix" class="h-[120px] w-[120px]" alt="二维码" />
                      <div class="full-width pt-[10px] text-center text-[#999999]">
                        核验码
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
            <wd-icon name="warning" size="16px" color="#999999" />仅限当日使用
          </view>
        </view>

        <div>
          <div class="normal-section">
            <div class="normal-text-title">
              当前时间
            </div>
            <div class="normal-text">
              {{ timeTxt }}
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
import { useToast } from 'wot-design-uni'
import { othersApi } from '@/api/others-api'
import loadingBox from '@/components/global-loading-box.vue'
import { useUserStore } from '@/store/user'

// 注入全局属性
const navBarConfig = inject('navBarConfig')

const openId = useUserStore().openId
const toast = useToast()
const globalLoadingShow = ref(false)
const wdLoading = ref(true)
const validateResult = ref('过期')

definePage({
  style: {
    navigationStyle: 'custom',
    navigationBarTitleText: '验票结果',
    disableScroll: true,
  },
})
// ---------------------1----------------------

const scrollY = ref(true)

async function pageInit() {

}

const ticketRecord = ref({})
const showResult = ref(false)

// ---------------------- 生命周期函数 ------------------------
onLoad(async (options) => {
  console.log('接收的参数对象：', options)
  const { code, openId, scene } = options
  const result = await othersApi.getTicketRecordByOpenIdAndTicketCode({ openId, ticketCode: scene || code })
  ticketRecord.value = result
  wdLoading.value = false
  // result.validityDate 在今日则有效
  isWithinValidityPeriod()
})
onShow(async () => {
  await uni.$onLaunched
  isWithinValidityPeriod()
})
onMounted(() => {
  pageInit()
})

// 计算当前时间是否有效
function isWithinValidityPeriod() {
  if (ticketRecord.value.validityDate) {
    validateResult.value = ticketRecord.value.validityDate === dayjs().format('YYYY-MM-DD') ? '有效' : '无效'
    if (ticketRecord.value.status !== 1) {
      validateResult.value = '已使用'
    }
    setTimeout(() => {
      showResult.value = true
    }, 200)
  }
}

const timeTxt = ref('')
function updateTime() {
  const formattedTime = dayjs().format('YYYY-MM-DD HH:mm:ss.SSS')
  timeTxt.value = formattedTime
}
updateTime()
const timer = setInterval(() => updateTime(), 100)

onUnload(() => {
  clearInterval(timer)
})
</script>

<style lang="scss" scoped>
@import './scss/parking.scss';
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

  background:
    linear-gradient(158deg, #fffced 17.46%, rgba(255, 252, 237, 0) 87.82%), linear-gradient(0deg, #ebfbff, #ebfbff),
    linear-gradient(102deg, #f0f6ff 35.5%, #eeebff 78.79%);
}
</style>

<style lang="scss" scoped>
.stamp {
  position: relative;

  border: solid 0.1em #999;
  border-radius: 0.2em;
  color: #999;
  font-size: 39px;
  font-weight: bold;
  line-height: 1;
  opacity: 0;
  position: absolute;
  padding: 0.1em 0.5em;
  margin: 0 auto;
  top: 10%;
  left: 10%;
  text-transform: uppercase;
  opacity: 0;
}

.stamp.valid {
  color: #d00;
  border: solid 0.1em #d00;
  transform-origin: 50% 50%;
  transform: rotate(-2deg) scale(5);
  transition: all 0.3s cubic-bezier(0.6, 0.04, 0.98, 0.335);
}

.loaded .stamp {
  opacity: 0.75;
  transform: rotate(-15deg) scale(1);
  z-index: 1;
}
</style>
