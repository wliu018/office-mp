<template>
  <div class="project-header">
    <wd-navbar
      placeholder left-arrow safe-area-inset-top title="项目检索"
      style="--wot-navbar-bg: transparent"
      @click-left="uni.navigateBack()"
    />
  </div>
  <view class="project-scroll-shell" :style="`height: calc(100vh - ${navBarConfig.customNavBarHeight}px);`">
    <view class="search-panel">
      <view class="search-box" style="--wot-search-input-height: 42px; --wot-search-input-radius: 10px;">
        <wd-search variant="filled" hide-cancel placeholder="请输入项目、编号或市场" @change="searchProject" @clear="clearProjectSearch" />
      </view>
    </view>
    <scroll-view class="project-scroll" :scroll-y="scrollY" :enable-back-to-top="true" enhanced :bounces1="false" refresher-background="#F8F9FA">
      <view class="project-page">
        <view class="project-list">
          <view
            v-if="projectList.length === 0 && !wdLoading"
            class="project-empty"
          >
            <wd-empty icon="no-content" tip="暂无数据" />
          </view>
          <view
            v-for="(item, index) in projectList"
            :key="projectKey(item, index)"
            :style="`animation-delay: .${index + 2}s;`"
            class="project-card-wrap bot-title"
          >
            <wd-card
              custom-class="project-card"
              type="rectangle"
            >
              <view class="project-card-content">
                <view class="project-name-row">
                  <wd-tag class="project-year" type="warning" variant="light">
                    {{ item.projectYear ? `${item.projectYear}年` : '年份未填' }}
                  </wd-tag>
                  <view class="project-name-main" @tap.stop="copyText(item.projectName)">
                    <text class="project-name">{{ item.projectName || '-' }}</text>
                    <view class="copy-action">
                      <wd-icon name="copy" color="#6b6b6b" size="15px" />
                    </view>
                  </view>
                </view>
                <view class="project-detail-list">
                  <view class="project-code-row">
                    <view class="project-code-main" @tap.stop="copyText(item.serialNumber)">
                      <text>项目编号：{{ item.serialNumber || '-' }}</text>
                      <view class="copy-action copy-code-action">
                        <wd-icon name="copy" color="#929292" size="15px" />
                      </view>
                    </view>
                  </view>
                  <view class="project-maintenance-expire">
                    维保到期：{{ item.maintenanceExpireMonth || '-' }}
                  </view>
                  <view class="project-address">
                    <text class="project-address-name">项目地址：{{ item.projectAddress || '未填写' }}</text>
                    <wd-icon v-if="item.projectAddress" name="share-internal" color="#34c759" size="16px" @tap.stop="openProjectLocation(item)" />
                  </view>
                  <view class="project-market">
                    <text class="project-market-label">市场人员</text>
                    <text>{{ item.marketing || '未填写' }}</text>
                  </view>
                </view>
                <view class="project-card-actions">
                  <wd-button round size="small" class="project-action-button project-map-action-button" type="info" icon="location" @tap.stop="openProjectLocation(item)">
                    导航
                  </wd-button>
                  <template v-if="canEditProjectLocation">
                    <wd-button round size="small" class="project-action-button project-edit-action-button" type="info" icon="edit" @tap.stop="chooseLocation(item)">
                      编辑地址
                    </wd-button>
                    <wd-button
                      class="project-action-button project-miniapp-code-button"
                      round
                      type="info"
                      size="small"
                      icon="qrcode"
                      :disabled="generatingProjectMiniappCodeKey === projectKey(item, index)"
                      @tap.stop="generateProjectMiniappCode(item, index)"
                    >
                      {{ generatingProjectMiniappCodeKey === projectKey(item, index) ? '生成中' : '维保码' }}
                    </wd-button>
                  </template>
                </view>
              </view>
            </wd-card>
          </view>
        </view>
      </view>
    </scroll-view>
  </view>
  <wd-popup v-model="miniappCodeVisible" position="center" closeable custom-style="border-radius: 12px; overflow: hidden;">
    <snapshot id="project-miniapp-code-snapshot">
      <view class="miniapp-code-popup">
        <image class="miniapp-code-popup__image" :src="miniappCode" mode="widthFix" @longpress="saveProjectMiniappCode" />
        <text class="miniapp-code-popup__caption">{{ miniappCodeProjectName || '项目' }} - 维保码</text>
      </view>
    </snapshot>
  </wd-popup>
  <wd-toast />
  <globalLoading :show="globalLoadingShow" />
  <loadingBox :show="wdLoading" />
</template>

<script setup>
import { useToast } from '@wot-ui/ui'
import { inject, onBeforeUnmount, onMounted, ref } from 'vue'
import { simpleLoginApi } from '@/api/login/simple-login-api.js'
import { othersApi } from '@/api/others-api'
import loadingBox from '@/components/global-loading-box.vue'
import globalLoading from '@/components/global-loading.vue'
import { useUserStore } from '@/store/user'
import { debounce } from '@/utils/debounce'

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
const allProjectList = ref([])
const projectList = ref([])
const isCertified = ref(false)
const canEditProjectLocation = ref(false)
const miniappCodeVisible = ref(false)
const miniappCode = ref('')
const miniappCodeProjectName = ref('')
const generatingProjectMiniappCodeKey = ref(null)

function projectKey(item, index) {
  return String(item?.id ?? item?.serialNumber ?? index)
}

function openProjectLocation(item) {
  const longitude = Number(item.longitude)
  const latitude = Number(item.latitude)
  if (!item.projectAddress || !Number.isFinite(longitude) || !Number.isFinite(latitude)) {
    toast.error('待项目经理完善地址')
    return
  }
  uni.openLocation({
    longitude,
    latitude,
    scale: 16,
    name: item.projectName || '项目地址',
    address: item.projectAddress,
  })
}

async function chooseLocation(item) {
  if (!canEditProjectLocation.value) {
    toast.error('仅管理员或项目经理可编辑项目地址')
    return
  }
  let location
  try {
    location = await uni.chooseLocation({
      longitude: Number(item.longitude) || 121.402395,
      latitude: Number(item.latitude) || 31.249450,
    })
  }
  catch (error) {
    if (error?.errMsg?.includes('cancel'))
      return
    toast.error(error?.errMsg || '打开地图失败')
    return
  }

  const projectAddress = location.name || location.address || ''
  const confirmed = await new Promise((resolve) => {
    uni.showModal({
      title: '确认修改地址',
      content: `是否将项目地址修改为：${projectAddress || '所选位置'}？`,
      confirmText: '确认修改',
      success: result => resolve(result.confirm),
      fail: () => resolve(false),
    })
  })
  if (!confirmed)
    return

  try {
    await othersApi.updateProjectLocation(item.id, {
      projectAddress,
      longitude: location.longitude,
      latitude: location.latitude,
    })
    item.projectAddress = projectAddress
    item.longitude = location.longitude
    item.latitude = location.latitude
    toast.success('项目地址已更新')
  }
  catch (error) {
    console.error('项目地址更新失败', error)
    toast.error(error?.data?.message || error?.message || '项目地址更新失败')
  }
}

async function generateProjectMiniappCode(item, index) {
  if (generatingProjectMiniappCodeKey.value !== null)
    return
  if (!item.serialNumber) {
    toast.error('项目编号为空，无法生成二维码')
    return
  }
  generatingProjectMiniappCodeKey.value = projectKey(item, index)
  try {
    const code = await othersApi.generateProjectMiniappCode(item.serialNumber)
    miniappCode.value = code
    miniappCodeProjectName.value = item.projectName || ''
    miniappCodeVisible.value = true
  }
  catch (error) {
    console.error('生成项目小程序码失败', error)
    toast.error(error?.data?.message || error?.message || '生成二维码失败')
  }
  finally {
    generatingProjectMiniappCodeKey.value = null
  }
}

function saveProjectMiniappCode() {
  uni.createSelectorQuery().select('#project-miniapp-code-snapshot').node().exec((result) => {
    const snapshot = result?.[0]?.node
    if (!snapshot) {
      toast.error('维保码图片生成失败')
      return
    }
    snapshot.takeSnapshot({
      type: 'file',
      format: 'png',
      success: ({ tempFilePath }) => {
        if (!tempFilePath) {
          toast.error('维保码图片生成失败')
          return
        }
        uni.saveImageToPhotosAlbum({
          filePath: tempFilePath,
          success: () => toast.success('维保码已保存到相册'),
          fail: () => toast.error('保存失败，请检查相册权限'),
        })
      },
      fail: () => toast.error('维保码图片生成失败'),
    })
  })
}

async function getProjectList(loading = true) {
  if (loading)
    wdLoading.value = true
  try {
    if (!isCertified.value) {
      projectList.value = []
      return
    }
    const res = await othersApi.projectList({ openId, keywords: '' })
    console.log(res)
    allProjectList.value = res || []
    projectList.value = allProjectList.value
  }
  catch (error) {
    toast.error(error.message)
  }
  finally {
    if (loading)
      wdLoading.value = false
  }
}
async function pageInit() {
  const userInfo = await simpleLoginApi.getEmployeeInfo({ openId })
  isCertified.value = userInfo?.type === 2
  try {
    canEditProjectLocation.value = isCertified.value && await othersApi.projectLocationEditable()
  }
  catch {
    canEditProjectLocation.value = false
  }
  await getProjectList()
}
const debouncedProjectSearch = debounce((keywords) => {
  wx.vibrateShort({ type: 'heavy' })
  const normalizedKeywords = String(keywords || '').trim().toLowerCase()
  projectList.value = normalizedKeywords
    ? allProjectList.value.filter(item => [item.projectName, item.serialNumber, item.marketing]
        .some(value => String(value || '').toLowerCase().includes(normalizedKeywords)))
    : allProjectList.value
}, 300)

function searchProject(e) {
  debouncedProjectSearch(e.value || '')
}

function clearProjectSearch() {
  debouncedProjectSearch.cancel()
  projectList.value = allProjectList.value
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
onBeforeUnmount(() => {
  debouncedProjectSearch.cancel()
})
</script>

<style lang="scss" scoped>
@use './scss/project.scss';
</style>

<style>
page {
  background: #ecf2ff;
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
