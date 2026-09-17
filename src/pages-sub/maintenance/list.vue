<template>
  <div style="height: 0;">
    <wd-navbar
      placeholder left-arrow safe-area-inset-top fixed title="维保工单列表"
      style="--wot-navbar-bg: transparent"
      @click-left="uni.navigateBack()"
    />
  </div>
  <div :style="`height: ${navBarConfig.customNavBarHeight}px;`" />
  <scroll-view
    class="workflow-list-scroll-view"
    scroll-y
    :enable-back-to-top="true"
    refresher-enabled
    :refresher-triggered="refreshing"
    :style="`height: calc(100vh - ${navBarConfig.customNavBarHeight}px);`"
    @refresherrefresh="refreshWorkflows"
  >
    <view class="page-container">
      <view class="statistics-card">
        <view class="statistics-heading">
          <view class="statistics-title">
            流程统计
          </view>
          <view class="statistics-actions">
            <view class="create-work-order-shine">
              <wd-button size="small" custom-class="create-work-order-button" custom-style="border-radius: 6px; background: linear-gradient(115deg, #3D7DFE 8.4%, #6A59FE 52.29%, #9142FF 93.72%); color: #fff; font-size: 13px; font-weight: 600;" @click="createWorkOrder">
                <view class="create-work-order-button-content">
                  <wd-icon name="plus-circle" color="#fff" size="18px" custom-style="font-weight: bold;" />
                  <text>新建维保单</text>
                </view>
              </wd-button>
            </view>
          </view>
        </view>
        <view class="statistics-grid">
          <view class="statistics-item pending" @click="openWorkflowList('pending')">
            <text>待处理</text>
            <text class="statistics-count">{{ statistics.pending }}</text>
          </view>
          <view class="statistics-item processed" @click="openWorkflowList('processed')">
            <text>已处理</text>
            <text class="statistics-count">{{ statistics.processed }}</text>
          </view>
          <view class="statistics-item all" @click="openWorkflowList('all')">
            <text>所有</text>
            <text class="statistics-count">{{ statistics.all }}</text>
          </view>
        </view>
      </view>

      <view class="section-title">
        <wd-icon name="organization" size="15px" color="#36bd69" /> 当前待处理流程
      </view>
      <view v-if="!loading && workflows.length === 0" class="empty-state pending-empty-state">
        暂无待处理维保单
      </view>
      <view
        v-for="(item, index) in workflows"
        :key="item.id"
        class="workflow-card bot-title"
        :style="{ animationDelay: `${0.2 + index * 0.1}s` }"
        @click="openWorkOrder(item.id)"
      >
        <view class="card-title">
          <view class="card-title-left">
            <view class="workflow-order-number">
              {{ index + 1 }}
            </view>
            <text class="card-project-name">{{ item.projectName || '-' }}</text>
            <text class="card-id">#{{ item.id }}</text>
          </view>
          <view class="card-title-tags">
            <global-tip
              v-if="['重要', '紧急'].includes(item.urgency)"
              icon="exclamation-circle-fill"
              :color="urgencyTipColor(item.urgency)"
              :text="item.urgency || '一般'"
            />
          </view>
        </view>
        <wd-avatar-group v-if="item.avatars?.length" class="workflow-card-avatars" size="30px" :max-count="5">
          <wd-avatar
            v-for="(avatar, avatarIndex) in item.avatars"
            :key="avatarIndex"
            :class="{ 'workflow-name-avatar': !avatar.startsWith('http') }"
            :src="avatar.startsWith('http') ? avatar : ''"
            :text="avatar.startsWith('http') ? '' : avatar.charAt(0)"
          />
        </wd-avatar-group>
        <view v-if="item.workflowProgress != null" class="workflow-progress" aria-label="流程进度">
          <view class="workflow-progress-track">
            <view class="workflow-progress-completed" :style="{ width: `${item.workflowProgress}%` }" />
            <view class="workflow-progress-pending" :style="{ left: `${item.workflowProgress}%` }" />
          </view>
        </view>
      </view>
    </view>
  </scroll-view>
</template>

<script setup>
import { inject, ref } from 'vue'
import { othersApi } from '@/api/others-api'
import { useUserStore } from '@/store/user'

const navBarConfig = inject('navBarConfig')
const openId = useUserStore().openId
const loading = ref(true)
const refreshing = ref(false)
const workflows = ref([])
const statistics = ref({ pending: 0, processed: 0, all: 0 })
const pendingEmptyStateCharacters = '暂无待处理维保单'.split('')

definePage({
  style: {
    navigationStyle: 'custom',
    navigationBarTitleText: '维保工单列表',
    disableScroll: true,
    renderer: 'skyline',
    disableABTest: true,
    sdkVersionBegin: '2.30.4',
    sdkVersionEnd: '15.255.255',
  },
})

async function loadWorkflows() {
  loading.value = true
  try {
    const [pending, result] = await Promise.all([
      othersApi.workflowInstanceListByOpenId(openId),
      othersApi.workflowInstanceStatisticsByOpenId(openId),
    ])
    workflows.value = await withWorkflowProgress(pending || [])
    statistics.value = result || { pending: 0, processed: 0, all: 0 }
  }
  catch (error) {
    workflows.value = []
    statistics.value = { pending: 0, processed: 0, all: 0 }
    uni.showToast({ title: error?.message || '流程列表加载失败', icon: 'none' })
  }
  finally {
    loading.value = false
  }
}

async function refreshWorkflows() {
  if (refreshing.value)
    return
  refreshing.value = true
  uni.vibrateShort()
  await loadWorkflows()
  refreshing.value = false
}

async function withWorkflowProgress(items) {
  return Promise.all(items.map(async (item) => {
    try {
      const runtime = await othersApi.workflowInstanceRuntime(item.id)
      const nodes = [...(runtime?.nodes || [])].sort((a, b) => (a.sortNo || 0) - (b.sortNo || 0))
      const currentNodeId = runtime?.instance?.currentNodeId || item.currentNodeId
      const currentNodeIndex = nodes.findIndex(node => node.current || String(node.nodeId || node.id) === String(currentNodeId))
      if (currentNodeIndex < 0 || !nodes.length)
        return item
      const currentNode = nodes[currentNodeIndex]
      const isArchived = currentNode?.nodeCode === 'ARCHIVE' || currentNode?.nodeType === 'ARCHIVE' || runtime?.instance?.status === 'ARCHIVED'
      return {
        ...item,
        urgency: item.urgency || '一般',
        workflowProgress: isArchived ? null : Math.round((currentNodeIndex + 1) / nodes.length * 100),
      }
    }
    catch {
      return item
    }
  }))
}

function urgencyTipColor(urgency) {
  if (urgency === '紧急')
    return '#fa4350'
  if (urgency === '重要')
    return '#f57f00'
  return '#3d8dff'
}

function createWorkOrder() {
  uni.navigateTo({ url: '/pages-sub/maintenance/maintenance' })
}

function openWorkOrder(instanceId) {
  uni.navigateTo({ url: `/pages-sub/maintenance/maintenance?instanceId=${instanceId}` })
}

function openWorkflowList(filter) {
  navigateWithZoom(`/pages-sub/maintenance/history?filter=${filter}`)
}

function navigateWithZoom(url) {
  wx.navigateTo({ url, routeType: 'wx://zoom' })
}

onShow(async () => {
  await uni.$onLaunched
  loadWorkflows()
})
</script>

<style lang="scss" scoped>
@use './scss/list.scss';
</style>
