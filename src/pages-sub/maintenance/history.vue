<template>
  <div style="height: 0;">
    <wd-navbar
      placeholder left-arrow safe-area-inset-top fixed title="流程列表"
      style="--wot-navbar-bg: transparent"
      @click-left="uni.navigateBack()"
    />
  </div>
  <div :style="`height: ${navBarConfig.customNavBarHeight}px;`" />
  <scroll-view
    class="workflow-list-scroll-view"
    scroll-y
    :enable-back-to-top="true"
    :style="`height: calc(100vh - ${navBarConfig.customNavBarHeight}px);`"
    @scrolltolower="loadMoreWorkflows"
  >
    <view class="page-container">
      <view class="section-title">
        <wd-icon name="organization" size="15px" color="#36bd69" />
        {{ filterTitle }}
      </view>
      <view v-if="loadmoreState === 'finished' && workflows.length === 0" class="empty-state">
        暂无流程
      </view>
      <view
        v-for="(item, index) in workflows"
        :key="item.id"
        class="workflow-card"
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
              icon="info-circle-fill"
              :text="item.currentNodeName || item.currentNodeId || '-'"
            />
            <global-tip
              v-if="['重要', '紧急'].includes(item.urgency)"
              icon="exclamation-circle-fill"
              :color="urgencyTipColor(item.urgency)"
              :text="item.urgency || '一般'"
            />
          </view>
        </view>
        <view class="workflow-card-detail-row">
          <view class="card-detail workflow-card-detail-column">
            <text class="card-detail-label">处理结果</text>
            <text class="card-detail-value" :class="{ 'solution-result-badge': item.lastSolutionResult }">
              {{ item.lastSolutionResult || '处理中' }}
            </text>
          </view>
          <view class="card-detail workflow-card-detail-column">
            <text class="card-detail-label">当前处理人</text>
            <view class="card-detail-value current-handler">
              <text>{{ item.currentHandlerName || '-' }}</text>
              <view v-if="item.currentHandlerPhone" class="current-handler-phone" @tap.stop="callPhone(item.currentHandlerPhone)">
                <wd-icon name="mobile" size="14px" color="#05f" />
                <text>{{ item.currentHandlerPhone }}</text>
              </view>
            </view>
          </view>
        </view>
        <view class="workflow-card-detail-row">
          <view class="card-detail workflow-card-detail-column">
            <text class="card-detail-label">创建时间</text>
            <text class="card-detail-value">{{ formatCreateDate(item.createTime) || '-' }}</text>
          </view>
          <view class="card-detail workflow-card-detail-column workflow-card-avatar-column">
            <wd-avatar-group v-if="item.avatars?.length" class="workflow-card-avatars" size="30px" :max-count="5">
              <wd-avatar
                v-for="(avatar, avatarIndex) in item.avatars"
                :key="avatarIndex"
                :class="{ 'workflow-name-avatar': !avatar.startsWith('http') }"
                :src="avatar.startsWith('http') ? avatar : ''"
                :text="avatar.startsWith('http') ? '' : avatar.charAt(0)"
              />
            </wd-avatar-group>
          </view>
        </view>
        <view v-if="item.workflowProgress != null" class="workflow-progress" aria-label="流程进度">
          <view class="workflow-progress-track">
            <view class="workflow-progress-completed" :style="{ width: `${item.workflowProgress}%` }" />
            <view class="workflow-progress-pending" :style="{ left: `${item.workflowProgress}%` }" />
          </view>
        </view>
      </view>
      <wd-loading v-if="loadmoreState === 'loading'" type="dots" />
      <wd-loadmore
        v-else-if="loadmoreState === 'finished' || loadmoreState === 'error'"
        :state="loadmoreState"
        finished-text="没有更多数据了"
        error-text="加载失败"
        @reload="loadWorkflows"
      />
    </view>
  </scroll-view>
</template>

<script setup>
import { computed, inject, ref } from 'vue'
import { othersApi } from '@/api/others-api'
import { useUserStore } from '@/store/user'

const navBarConfig = inject('navBarConfig')
const openId = useUserStore().openId
const loadmoreState = ref('')
const currentPage = ref(1)
const pageSize = 5
const isLoading = ref(false)
const skipNextShowRefresh = ref(false)
const workflows = ref([])
const filter = ref('all')

const filterTitle = computed(() => ({
  pending: '待处理流程',
  processed: '已处理流程',
  all: '全部流程',
}[filter.value] || '全部流程'))

definePage({
  style: {
    navigationStyle: 'custom',
    navigationBarTitleText: '流程列表',
    disableScroll: true,
    renderer: 'skyline',
    disableABTest: true,
    sdkVersionBegin: '2.30.4',
    sdkVersionEnd: '15.255.255',
  },
})

async function loadWorkflows(reset = false) {
  if (isLoading.value || (!reset && loadmoreState.value === 'finished'))
    return
  if (reset) {
    currentPage.value = 1
    workflows.value = []
  }
  isLoading.value = true
  loadmoreState.value = 'loading'
  try {
    let page
    if (filter.value === 'pending') {
      page = await othersApi.workflowInstancePageByOpenId(openId, currentPage.value, pageSize)
    }
    else if (filter.value === 'processed') {
      page = await othersApi.workflowInstanceProcessedPageByOpenId(openId, currentPage.value, pageSize)
    }
    else {
      page = await othersApi.workflowInstanceAllPageByOpenId(openId, currentPage.value, pageSize)
    }
    const records = await withWorkflowCardInfo(page?.records || [])
    workflows.value.push(...records)
    currentPage.value += 1
    loadmoreState.value = workflows.value.length >= Number(page?.total || 0) ? 'finished' : ''
  }
  catch (error) {
    loadmoreState.value = 'error'
    uni.showToast({ title: error?.message || '流程列表加载失败', icon: 'none' })
  }
  finally {
    isLoading.value = false
  }
}

function loadMoreWorkflows() {
  if (isLoading.value || loadmoreState.value === 'finished')
    return
  uni.vibrateShort()
  loadWorkflows()
}

async function withWorkflowCardInfo(items) {
  return Promise.all(items.map(async (item) => {
    try {
      const runtime = await othersApi.workflowInstanceRuntime(item.id)
      const solutionResults = runtime?.form?.solutionResults || []
      const solutionResult = solutionResults[solutionResults.length - 1]?.solutionResult
      const nodes = [...(runtime?.nodes || [])].sort((a, b) => (a.sortNo || 0) - (b.sortNo || 0))
      const currentNodeId = runtime?.instance?.currentNodeId || item.currentNodeId
      const currentNodeIndex = nodes.findIndex(node => node.current || String(node.nodeId || node.id) === String(currentNodeId))
      const currentNode = nodes[currentNodeIndex]
      const isArchived = currentNode?.nodeCode === 'ARCHIVE' || currentNode?.nodeType === 'ARCHIVE' || runtime?.instance?.status === 'ARCHIVED'
      let currentHandlerPhone = ''
      if (item.currentHandlerUserId) {
        try {
          currentHandlerPhone = (await othersApi.userInfoById(item.currentHandlerUserId))?.phoneNumber || ''
        }
        catch {}
      }
      return {
        ...item,
        urgency: item.urgency || '一般',
        lastSolutionResult: formatSolutionResult(solutionResult),
        currentHandlerPhone,
        workflowProgress: currentNodeIndex < 0 || !nodes.length || isArchived ? null : Math.round((currentNodeIndex + 1) / nodes.length * 100),
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

function formatSolutionResult(value) {
  if (Number(value) === 1)
    return '已恢复，保持观察'
  if (Number(value) === 2)
    return '未恢复，另行安排'
  return ''
}

function formatCreateDate(value) {
  if (!value)
    return ''
  const [year, month, day] = String(value).slice(0, 10).split('-')
  return year && month && day ? `${year}年${Number(month)}月${Number(day)}日` : String(value)
}

function openWorkOrder(instanceId) {
  skipNextShowRefresh.value = true
  wx.navigateTo({
    url: `/pages-sub/maintenance/maintenance?instanceId=${instanceId}`,
    routeType: 'wx://cupertino-modal-inside',
  })
}

function callPhone(phoneNumber) {
  if (phoneNumber) {
    uni.vibrateShort()
    uni.makePhoneCall({ phoneNumber: String(phoneNumber) })
  }
}

onLoad((options) => {
  filter.value = ['pending', 'processed', 'all'].includes(options?.filter) ? options.filter : 'all'
})

onShow(async () => {
  await uni.$onLaunched
  if (skipNextShowRefresh.value) {
    skipNextShowRefresh.value = false
    return
  }
  loadWorkflows(true)
})
</script>

<style lang="scss" scoped>
@use './scss/list.scss';

.workflow-card {
  margin-bottom: 20px;
}

.solution-result-badge {
  align-self: flex-start;
  display: inline-block;
  padding: 4px 8px;
  border-radius: 2px;
  background: #fff7e6;
  color: #f57f00 !important;
  font-weight: 600;
  font-size: 13px;
  line-height: 1.2;
  width: fit-content;
}

.current-handler {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 4px 8px;
}

.current-handler-phone {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  color: #05f;
  font-size: 13px;
}

.workflow-card-detail-row {
  display: flex;
  gap: 12px;
}

.card-title + .workflow-card-detail-row .card-detail {
  margin-top: 0;
}

.workflow-card-detail-column {
  flex: 1;
  min-width: 0;
  width: 0;
}

.workflow-card-avatar-column {
  justify-content: flex-end;
}
</style>
