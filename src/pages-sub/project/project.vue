<template>
  <div>
    <wd-navbar
      placeholder left-arrow safe-area-inset-top title="项目检索"
      style="--wot-navbar-background:transparent;--wot-color-border-light:transparent"
      @click-left="uni.navigateBack()"
    />
  </div>
  <scroll-view :scroll-y="scrollY" :enable-back-to-top="true" :style="`height: calc(100vh - ${navBarConfig.customNavBarHeight}px);`">
    <view class="project-page">
      <view class="search-panel">
        <view class="search-copy">
          <text class="search-heading">项目检索</text>
          <text class="search-subtitle">快速定位项目编号、名称或市场</text>
        </view>
        <view class="search-box" style="--wot-search-input-height: 42px; --wot-search-input-radius: 8px">
          <wd-search custom-input-class="search-custom-class" placeholder="请输入项目、编号或市场" cancel-txt="搜索" @clear="getProjectList()" @cancel="searchProject" />
        </view>
      </view>
      <view class="project-list">
        <view
          v-for="(item, index) in projectList"
          :key="index"
          class="project-card-wrap"
          @tap="selectProject(item, index)"
        >
          <wd-card
            :custom-class="selectedProjectKey === projectKey(item, index) ? 'project-card project-card-selected' : 'project-card'"
            :custom-style="cardStyle(item, index)"
            type="rectangle"
          >
            <view class="project-card-content">
              <view class="project-name-row">
                <text class="project-name">{{ item.projectName || '-' }}</text>
                <view class="copy-action" @tap.stop="copyText(item.projectName)">
                  <wd-icon name="file-copy" color="#6b6b6b" size="15px" />
                  <text>复制</text>
                </view>
              </view>
              <view class="project-code-row">
                <text>项目编号：{{ item.serialNumber || '-' }}</text>
                <view class="copy-action copy-code-action" @tap.stop="copyText(item.serialNumber)">
                  <wd-icon name="file-copy" color="#929292" size="15px" />
                  <text>复制</text>
                </view>
              </view>
              <view class="project-market">
                {{ item.marketing || '未标注市场' }}
              </view>
            </view>
          </wd-card>
        </view>
      </view>
    </view>
  </scroll-view>
  <wd-toast />
  <globalLoading :show="globalLoadingShow" />
  <loadingBox :show="wdLoading" />
</template>

<script setup>
import { inject, onMounted, ref } from 'vue'
import { useToast } from 'wot-design-uni'
import { othersApi } from '@/api/others-api'
import loadingBox from '@/components/global-loading-box.vue'
import globalLoading from '@/components/global-loading.vue'
import { useUserStore } from '@/store/user'

// 注入全局属性
const navBarConfig = inject('navBarConfig', { customNavBarHeight: 0 })

const openId = useUserStore().openId
const toast = useToast()
const globalLoadingShow = ref(false)
const wdLoading = ref(true)

definePage({
  style: {
    navigationStyle: 'custom',
    navigationBarTitleText: '项目检索',
    disableScroll: true,
    renderer: 'skyline',
    disableABTest: true,
    sdkVersionBegin: '2.30.4',
    sdkVersionEnd: '15.255.255',
  },
})
const scrollY = ref(true)
const projectList = ref([])
const selectedProjectKey = ref(null)

function projectKey(item, index) {
  return String(item?.id ?? item?.serialNumber ?? index)
}

function cardStyle(item, index) {
  const selected = selectedProjectKey.value === projectKey(item, index)
  return `border: 1px solid ${selected ? '#3f3f3f' : '#e5e5e5'}; border-radius: 16px; overflow: hidden;`
}

function selectProject(item, index) {
  selectedProjectKey.value = projectKey(item, index)
}

async function getProjectList(keywords = '', loading = true) {
  if (loading)
    wdLoading.value = true
  try {
    const res = await othersApi.projectList({ openId, keywords })
    console.log(res)
    projectList.value = res || []
    selectedProjectKey.value = projectList.value.length ? projectKey(projectList.value[0], 0) : null
  }
  catch (error) {
    toast.error(error.message)
  }
  finally {
    if (loading)
      wdLoading.value = false
  }
}
function pageInit() {
  getProjectList('')
}
function searchProject(e) {
  wx.vibrateShort({ type: 'heavy' })
  getProjectList(e.value)
}
function copyText(data) {
  wx.vibrateShort({ type: 'light' })
  uni.setClipboardData({ data })
  console.log('复制成功')
}
// ---------------------- 生命周期函数 ------------------------
onShow(async () => {
  await uni.$onLaunched
})
onMounted(() => {
  pageInit()
})
</script>

<style lang="scss" scoped>
@import './scss/project.scss';
</style>

<style>
page {
  background: #fff;
}
@keyframes slowRotate {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}
.search-custom-class {
}
</style>
