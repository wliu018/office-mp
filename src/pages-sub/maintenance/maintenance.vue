<template>
  <div style="height: 0;">
    <wd-navbar
      placeholder
      left-arrow
      safe-area-inset-top
      fixed
      :title="isDetail ? '维保工单详情' : '新建维保单'"
      style="--wot-navbar-background: transparent; --wot-color-border-light: transparent"
      @click-left="uni.navigateBack()"
    />
  </div>
  <div :style="`height: ${navBarConfig.customNavBarHeight}px;`" />
  <scroll-view scroll-y :enable-back-to-top="true" :style="`height: calc(100vh - ${navBarConfig.customNavBarHeight}px);`">
    <view class="page-container" :class="{ 'create-mode': !isDetail }">
      <template v-if="isDetail">
        <view class="section-card work-order-card" :class="{ 'has-miniapp-code': showMiniappCode }">
          <view
            v-if="archivedSolutionStamp"
            class="work-order-stamp"
            :class="{ recovered: archivedSolutionStamp === '已恢复', loaded: stampLoaded }"
          >
            {{ archivedSolutionStamp }}
          </view>
          <view class="work-order-heading">
            <view class="section-title">
              工单信息
            </view>
            <view class="work-order-tags">
              <view class="work-order-tag">
                <wd-icon name="error-circle-filled" size="15px" color="#3d8dff" />
                <text>{{ currentNode?.nodeName || currentNode?.nodeCode || '-' }}</text>
              </view>
              <view class="work-order-tag" @tap="openFlowStatus">
                <wd-icon name="transfer" size="15px" color="#36bd69" />
                <text>查看流程图</text>
              </view>
            </view>
          </view>
          <view class="info-row">
            <text>项目</text><text>{{ form.projectName || '-' }}</text>
          </view>
          <view class="field-title">
            故障描述
          </view>
          <view class="readonly-text">
            {{ form.faultDescription || '-' }}
          </view>
          <view class="info-row contact-info-row">
            <text>联系说明</text><text>{{ form.contactRemark || '-' }}</text>
          </view>
          <view class="info-row contact-info-row">
            <text>联系电话</text>
            <template v-if="form.contactPhone">
              <view class="phone-action" @tap="callPhone(form.contactPhone)">
                <wd-icon name="phone" size="14px" color="#5b8def" />
                <text>{{ form.contactPhone }}</text>
              </view>
            </template>
            <text v-else>-</text>
          </view>
          <view class="info-row contact-info-row">
            <text>联系人</text><text>{{ form.contactName || '-' }}</text>
          </view>
          <view v-if="showMiniappCode" class="work-order-miniapp-code">
            <image :src="miniappCode" mode="aspectFit" />
            <view class="work-order-miniapp-code-label">
              维保工单码
            </view>
          </view>
        </view>

        <view v-if="isArchived" class="work-order-share-below">
          <work-order-share
            :form="form"
            :history-groups="actionHistoryGroups"
            :created-at="runtime.instance?.createTime"
            :miniapp-code="miniappCode"
          />
        </view>

        <view v-if="onsitePersons.length" class="section-card onsite-person-card">
          <view class="section-title">
            已选到场人员
          </view>
          <view v-for="person in onsitePersons" :key="person.userId" class="person-row">
            <view class="person-avatar">
              {{ (person.name || '-').slice(0, 1) }}
            </view>
            <view class="person-info">
              <text class="person-name">{{ person.name || '-' }}</text>
              <view class="person-contact">
                <text>{{ person.companyName || '-' }}</text>
                <view class="person-phone phone-action" @tap.stop="callPhone(person.phoneNumber)">
                  <wd-icon name="phone" size="14px" color="#5b8def" />
                  <text>{{ person.phoneNumber || '-' }}</text>
                </view>
              </view>
            </view>
          </view>
        </view>

        <view v-if="canEdit" class="section-card action-card">
          <view class="section-title">
            本次处理
          </view>

          <view v-if="needsTargetUser && currentNodeCode !== 'OWNER_ASSIGN'" class="field-block">
            <view class="field-title">
              下一节点处理人
            </view>
            <picker mode="selector" :range="nextCandidateNames" @change="selectNextCandidate">
              <view class="picker-value">
                <template v-if="selectedNextCandidateName">
                  {{ selectedNextCandidateName }}
                </template>
                <view v-else class="picker-placeholder">
                  <view class="picker-add-icon">
                    <wd-icon name="add" color="#fff" size="12px" />
                  </view>
                  <text>请选择处理人</text>
                </view>
              </view>
            </picker>
          </view>

          <view v-if="currentNodeCode === 'OWNER_ASSIGN'" class="field-block">
            <view class="field-title">
              流转方式
            </view>
            <wd-radio-group v-model="ownerFlowMode" inline shape="dot">
              <wd-radio value="NEXT_NODE">
                选择处理人
              </wd-radio>
              <wd-radio value="SELF_LOOP">
                重新指派负责人
              </wd-radio>
            </wd-radio-group>
            <view v-if="ownerFlowMode === 'SELF_LOOP'" class="field-block mt-3">
              <picker mode="selector" :range="ownerCandidateNames" @change="selectOwnerTarget">
                <view class="picker-value">
                  <template v-if="selectedOwnerTargetName">
                    {{ selectedOwnerTargetName }}
                  </template>
                  <view v-else class="picker-placeholder">
                    <view class="picker-add-icon">
                      <wd-icon name="add" color="#fff" size="12px" />
                    </view>
                    <text>请选择负责人</text>
                  </view>
                </view>
              </picker>
            </view>
            <view v-else class="field-block mt-3">
              <picker mode="selector" :range="nextCandidateNames" @change="selectNextCandidate">
                <view class="picker-value">
                  <template v-if="selectedNextCandidateName">
                    {{ selectedNextCandidateName }}
                  </template>
                  <view v-else class="picker-placeholder">
                    <view class="picker-add-icon">
                      <wd-icon name="add" color="#fff" size="12px" />
                    </view>
                    <text>请选择处理人</text>
                  </view>
                </view>
              </picker>
            </view>
          </view>

          <view v-if="currentNodeCode === 'OWNER_ASSIGN' && ownerFlowMode === 'NEXT_NODE'" class="field-block">
            <view class="field-title">
              计划到场人员
            </view>
            <view v-if="onsiteCandidates.length" class="onsite-picker" @click="openOnsitePicker">
              <view class="onsite-picker-summary">
                <text v-if="selectedPlannedOnsiteUserIds.length" class="onsite-picker-count">已选择 {{ selectedPlannedOnsiteUserIds.length }} 人</text>
                <view v-else class="picker-placeholder">
                  <view class="picker-add-icon">
                    <wd-icon name="add" color="#fff" size="12px" />
                  </view>
                  <text>请选择计划到场人员</text>
                </view>
                <text class="onsite-picker-arrow">›</text>
              </view>
              <view v-if="selectedPlannedOnsiteNames" class="onsite-picker-names">
                {{ selectedPlannedOnsiteNames }}
              </view>
            </view>
            <view v-else class="empty-tip">
              暂无可选到场人员
            </view>

            <wd-popup
              v-model="onsitePickerVisible"
              position="bottom"
              safe-area-inset-bottom
              custom-style="height: 72vh; border-radius: 24rpx 24rpx 0 0;"
              @close="closeOnsitePicker"
            >
              <view class="onsite-picker-panel">
                <view class="onsite-picker-header">
                  <text class="onsite-picker-title">选择计划到场人员</text>
                  <text class="onsite-picker-done" @click.stop="closeOnsitePicker">完成</text>
                </view>
                <wd-input
                  v-model="onsiteSearchKeyword"
                  clearable
                  no-border
                  placeholder="搜索姓名、公司或手机号"
                  custom-class="onsite-picker-search"
                  @click.stop
                />
                <view class="onsite-picker-toolbar">
                  <text>已选 {{ selectedPlannedOnsiteUserIds.length }} 人</text>
                  <text class="onsite-picker-select-all" @click.stop="toggleOnsiteCandidates">{{ allVisibleOnsiteSelected ? '取消全选' : '全选当前结果' }}</text>
                </view>
                <scroll-view scroll-y class="onsite-picker-list">
                  <view v-for="person in filteredOnsiteCandidates" :key="onsitePersonId(person)" class="onsite-candidate-row">
                    <wd-checkbox
                      :model-value="isOnsitePersonSelected(person)"
                      shape="square"
                      @change="toggleOnsitePerson(person)"
                    >
                      <view class="onsite-candidate-info">
                        <text class="onsite-candidate-name">{{ person.name || '-' }}</text>
                        <text class="onsite-candidate-detail">{{ person.companyName || '-' }} / {{ person.phoneNumber || '-' }}</text>
                      </view>
                    </wd-checkbox>
                  </view>
                  <view v-if="!filteredOnsiteCandidates.length" class="onsite-picker-empty">
                    未找到匹配人员
                  </view>
                </scroll-view>
              </view>
            </wd-popup>
          </view>

          <view v-if="currentNodeCode === 'ONSITE_ARRIVE'" class="field-block">
            <wd-button block type="info" custom-style="margin-top: 12px;" :loading="scanning" @click="scanOnsiteCode">
              <wd-icon name="scan" color="#37C062" size="18px" custom-style="margin-right: 6px;" />
              {{ onsiteCode ? '重新扫描现场维保码' : '扫描现场维保码' }}
            </wd-button>
            <view v-if="onsiteCode" class="scan-result">
              维保码：{{ onsiteCode }}
            </view>
            <view v-if="location.longitude != null && location.latitude != null" class="scan-result">
              位置：{{ location.longitude }}, {{ location.latitude }}
            </view>
          </view>

          <view v-if="currentNodeCode === 'ONSITE_FINISH'" class="field-block">
            <view class="field-title">
              解决结果
            </view>
            <wd-radio-group v-model="actionForm.solutionResult" inline shape="dot">
              <wd-radio :value="1" size="large">
                已恢复，保持观察
              </wd-radio>
              <wd-radio :value="2" size="large">
                未恢复，另行安排
              </wd-radio>
            </wd-radio-group>
            <view class="field-title mt-3">
              处理备注
            </view>
            <wd-textarea
              v-model="actionForm.solutionRemark"
              custom-textarea-class="compact-textarea"
              style="background: #fff; box-shadow: 0 2px 6px rgba(0,0,0,0.025); border-radius: 8px;"
              :maxlength="1000"
              show-word-limit
              clearable
              placeholder="请输入处理备注"
              placeholder-style="color: #bfbfbf;"
            />
          </view>

          <view v-if="currentNodeCode !== 'OWNER_ASSIGN' || ownerFlowMode === 'NEXT_NODE'" class="field-block">
            <view class="field-title">
              照片/视频
            </view>
            <wd-upload
              v-model:file-list="actionFileList"
              :limit="9"
              accept="media"
              :reupload="false"
              :upload-method="customActionUpload"
              :show-limit-num="false"
              custom-class="maintenance-media-upload"
              @before-upload="beforeUpload"
              @remove="deleteActionPic"
              @change="handleActionChange"
            />
          </view>

          <view class="button-row">
            <wd-button
              v-if="currentNodeCode === 'ONSITE_FINISH' && actionForm.solutionResult === 2"
              type="info"
              :loading="submitting"
              @click="submitAction(currentNodeCode === 'ONSITE_FINISH' ? 'RETURN' : 'SUBMIT')"
            >
              退回负责人
            </wd-button>
            <wd-button
              v-if="currentNodeCode !== 'ONSITE_FINISH' || actionForm.solutionResult === 1"
              type="primary"
              custom-class="flow-submit-button"
              :loading="submitting"
              @click="submitAction(currentNodeCode === 'ONSITE_FINISH' ? 'ARCHIVE' : 'SUBMIT')"
            >
              {{ currentNodeCode === 'ONSITE_FINISH' ? '归档工单' : '处理' }}
            </wd-button>
          </view>
        </view>

        <view v-if="actionHistoryGroups.length" class="section-card history-card">
          <view class="section-title">
            流程
          </view>
          <view
            v-for="(group, index) in actionHistoryGroups"
            :key="group.key"
            class="history-node"
            :class="{ 'is-last': index === actionHistoryGroups.length - 1 }"
          >
            <view class="history-node-rail">
              <view class="history-node-status">
                <wd-icon name="check" color="#fff" size="14px" />
              </view>
            </view>
            <view class="history-node-content">
              <view class="history-node-header">
                <text class="history-node-name">{{ group.label }}</text>
                <text class="history-node-time">{{ group.createTime || '-' }}</text>
              </view>
              <view v-if="group.handlerUserName || group.remark" class="history-node-detail">
                <text>{{ group.handlerUserName || '-' }}</text>
                <text v-if="group.remark" class="history-node-result">（{{ group.remark }}）</text>
              </view>
              <view v-for="item in group.solutionResults" :key="item.key" class="field-block mt-3">
                <view class="field-title">
                  解决结果
                </view>
                <view class="info-row">
                  <text>处理结果</text>
                  <text class="solution-result-badge">{{ item.resultText }}</text>
                </view>
                <view v-if="item.solutionRemark" class="readonly-text mt-3">
                  {{ item.solutionRemark }}
                </view>
              </view>
              <view v-if="group.files.length" class="field-block mt-3">
                <view class="field-title">
                  照片/视频
                </view>
                <wd-upload
                  :file-list="group.files"
                  :limit="9"
                  accept="media"
                  disabled
                  custom-class="maintenance-media-upload"
                />
              </view>
            </view>
          </view>
        </view>
      </template>

      <template v-else>
        <view class="create-form">
          <view class="field-title">
            选择项目
          </view>
          <picker mode="selector" :range="projectNames" @change="selectProject">
            <view class="picker-value">
              <template v-if="selectedProject?.projectName">
                {{ selectedProject.projectName }}
              </template>
              <view v-else class="picker-placeholder">
                <view class="picker-add-icon">
                  <wd-icon name="add" color="#fff" size="12px" />
                </view>
                <text>请选择项目</text>
              </view>
            </view>
          </picker>
          <view v-if="selectedProject?.contactName" class="info-row mt-3">
            <text>联系人</text><text>{{ selectedProject.contactName }}</text>
          </view>
          <view v-if="selectedProject?.contactPhone" class="info-row">
            <text>联系电话</text>
            <view class="phone-action" @tap="callPhone(selectedProject.contactPhone)">
              <wd-icon name="phone" size="14px" color="#5b8def" />
              <text>{{ selectedProject.contactPhone }}</text>
            </view>
          </view>
          <view v-if="selectedProject" class="field-title mt-3">
            联系人说明
          </view>
          <wd-textarea
            v-if="selectedProject"
            v-model="createForm.contactRemark"
            custom-textarea-class="compact-textarea"
            style="background: #fff; box-shadow: 0 2px 6px rgba(0,0,0,0.025); border-radius: 8px;"
            :maxlength="200"
            clearable
            placeholder="请输入联系人说明"
            placeholder-style="color: #bfbfbf;"
          />
          <view class="field-title mt-3">
            故障描述
          </view>
          <wd-textarea
            v-model="createForm.faultDescription"
            custom-textarea-class="compact-textarea"
            style="background: #fff; box-shadow: 0 2px 6px rgba(0,0,0,0.025); border-radius: 8px;"
            :maxlength="1000"
            show-word-limit
            clearable
            placeholder="请输入故障描述"
            placeholder-style="color: #bfbfbf;"
          />
          <view class="field-title mt-3">
            上传图片或视频
          </view>
          <wd-upload
            v-model:file-list="fileList"
            :limit="9"
            accept="media"
            :reupload="false"
            :upload-method="customUpload"
            :show-limit-num="false"
            custom-class="maintenance-media-upload"
            @before-upload="beforeUpload"
            @remove="deletePic"
            @change="handleChange"
          />
          <view class="field-title mt-3">
            下一节点处理人
          </view>
          <picker mode="selector" :range="nextCandidateNames" @change="selectNextCandidate">
            <view class="picker-value">
              <template v-if="selectedNextCandidateName">
                {{ selectedNextCandidateName }}
              </template>
              <view v-else class="picker-placeholder">
                <view class="picker-add-icon">
                  <wd-icon name="add" color="#fff" size="12px" />
                </view>
                <text>请选择下一节点处理人</text>
              </view>
            </view>
          </picker>
          <wd-button block type="primary" custom-class="flow-submit-button" :loading="submitting" @click="createWorkOrder">
            提交维保单
          </wd-button>
        </view>
      </template>
    </view>
  </scroll-view>
  <wd-toast />
  <flow-status-popup v-model="flowStatusVisible" :runtime="runtime" />
  <loadingBox :show="loading" />
</template>

<script setup>
import { computed, inject, nextTick, reactive, ref } from 'vue'
import { useToast } from 'wot-design-uni'
import { simpleLoginApi } from '@/api/login/simple-login-api.js'
import { othersApi } from '@/api/others-api'
import loadingBox from '@/components/global-loading-box.vue'
import { useUserStore } from '@/store/user'
import FlowStatusPopup from './components/flow-status-popup.vue'
import WorkOrderShare from './components/work-order-share.vue'

const navBarConfig = inject('navBarConfig')
const apiUrl = import.meta.env.VITE_SERVER_BASEURL
const openId = useUserStore().openId
const toast = useToast()
const loading = ref(true)
const submitting = ref(false)
const instanceId = ref('')
const projects = ref([])
const nextCandidates = ref([])
const fileList = ref([])
const actionFileList = ref([])
const selectedProject = ref(null)
const selectedNextCandidateId = ref(null)
const ownerCandidates = ref([])
const selectedOwnerTargetId = ref(null)
const ownerFlowMode = ref('NEXT_NODE')
const onsiteCandidates = ref([])
const selectedPlannedOnsiteUserIds = ref([])
const onsitePickerVisible = ref(false)
const onsiteSearchKeyword = ref('')
const onsiteCode = ref('')
const scanning = ref(false)
const flowStatusVisible = ref(false)
const stampLoaded = ref(false)
const initialized = ref(false)
const miniappCode = ref('')
const location = reactive({ longitude: null, latitude: null })
const runtime = reactive({ instance: null, nodes: [], actionLogs: [], form: {} })
const createForm = reactive({ faultDescription: '', contactRemark: '' })
const actionForm = reactive({ solutionResult: null, solutionRemark: '' })
const currentUserId = ref(null)

const isDetail = computed(() => !!instanceId.value)
const detailForm = computed(() => runtime.form || {})
const form = computed(() => detailForm.value.form || {})
const files = computed(() => detailForm.value.files || [])
const onsitePersons = computed(() => detailForm.value.onsitePersons || [])
const solutionResults = computed(() => detailForm.value.solutionResults || [])
const isArchived = computed(() => runtime.instance?.status === 'ARCHIVED')
const archivedSolutionStamp = computed(() => {
  const lastResult = solutionResults.value[solutionResults.value.length - 1]?.solutionResult
  return Number(lastResult) === 1 ? '已恢复' : Number(lastResult) === 2 ? '未恢复' : ''
})
const actionHistoryGroups = computed(() => {
  const filesByActionLog = new Map()
  const unlinkedFiles = []
  files.value.forEach((file) => {
    if (file.actionLogId == null) {
      unlinkedFiles.push(file)
      return
    }
    const key = String(file.actionLogId)
    filesByActionLog.set(key, [...(filesByActionLog.get(key) || []), file])
  })
  const solutionsByActionLog = new Map()
  const unlinkedSolutions = []
  solutionResults.value.forEach((item) => {
    if (item.actionLogId == null) {
      unlinkedSolutions.push(item)
      return
    }
    const key = String(item.actionLogId)
    solutionsByActionLog.set(key, [...(solutionsByActionLog.get(key) || []), item])
  })
  const nodesById = new Map((runtime.nodes || []).map(item => [String(item.nodeId || item.id), item]))
  const groups = (runtime.actionLogs || []).map((log, index) => {
    const key = String(log.id)
    const actionFiles = filesByActionLog.get(key) || []
    const actionSolutions = solutionsByActionLog.get(key) || []
    const node = nodesById.get(String(actionSolutions[0]?.nodeId || actionFiles[0]?.nodeId || log.nodeId))
    return {
      key: log.id || `action-${index}`,
      label: `${node?.nodeName || log.nodeName || log.nodeType || '流程节点'}${Number(log.roundNo) > 1 ? `（第${log.roundNo}轮）` : ''}`,
      actionType: log.actionType,
      handlerUserName: log.handlerUserName,
      createTime: log.createTime,
      remark: log.remark,
      files: normalizeFiles(actionFiles),
      solutionResults: actionSolutions.map((item, solutionIndex) => ({
        ...item,
        key: item.id || `${log.id}-solution-${solutionIndex}`,
        resultText: formatSolutionResult(item.solutionResult),
      })),
    }
  })
  if (unlinkedFiles.length || unlinkedSolutions.length) {
    groups.push({
      key: 'unlinked-history',
      label: '未关联动作的历史数据',
      files: normalizeFiles(unlinkedFiles),
      solutionResults: unlinkedSolutions.map((item, index) => ({
        ...item,
        key: item.id || `unlinked-solution-${index}`,
        resultText: formatSolutionResult(item.solutionResult),
      })),
    })
  }
  return groups
})
const currentNode = computed(() => (runtime.nodes || []).find(item => item.current))
const currentNodeCode = computed(() => currentNode.value?.nodeType || currentNode.value?.nodeCode || '')
const showMiniappCode = computed(() => currentNodeCode.value !== 'CREATE' && !!miniappCode.value)
const canEdit = computed(() => runtime.instance?.status === 'RUNNING' && Number(runtime.instance?.currentHandlerUserId) === Number(currentUserId.value))
const needsTargetUser = computed(() => currentNodeCode.value === 'CREATE' || currentNodeCode.value === 'OWNER_ASSIGN')
const projectNames = computed(() => projects.value.map(item => item.projectName || item.name || '-'))
const nextCandidateNames = computed(() => nextCandidates.value.map(item => item.name || '-'))
const ownerCandidateNames = computed(() => ownerCandidates.value.map(item => item.name || '-'))
const selectedOwnerTargetName = computed(() => ownerCandidates.value.find(item => Number(item.id) === Number(selectedOwnerTargetId.value))?.name || '')
const selectedNextCandidateName = computed(() => nextCandidates.value.find(item => Number(item.id) === Number(selectedNextCandidateId.value))?.name || '')
const previousOwnerUserId = computed(() => {
  const logs = (runtime.actionLogs || []).filter(item => (item.nodeCode || item.nodeType) === 'OWNER_ASSIGN' && item.handlerUserId != null)
  return logs.length ? logs[logs.length - 1].handlerUserId : null
})
const filteredOnsiteCandidates = computed(() => {
  const keyword = onsiteSearchKeyword.value.trim().toLowerCase()
  if (!keyword)
    return onsiteCandidates.value
  return onsiteCandidates.value.filter(item => [item.name, item.companyName, item.phoneNumber]
    .some(value => String(value || '').toLowerCase().includes(keyword)))
})
const selectedPlannedOnsiteNames = computed(() => onsiteCandidates.value
  .filter(item => selectedPlannedOnsiteUserIds.value.includes(onsitePersonId(item)))
  .map(item => item.name || '-')
  .slice(0, 3)
  .join(', '))
const allVisibleOnsiteSelected = computed(() => filteredOnsiteCandidates.value.length > 0
  && filteredOnsiteCandidates.value.every(item => selectedPlannedOnsiteUserIds.value.includes(onsitePersonId(item))))

definePage({
  style: {
    navigationStyle: 'custom',
    navigationBarTitleText: '新建维保单',
    disableScroll: true,
  },
})

async function getCurrentUser() {
  const info = await simpleLoginApi.getEmployeeInfo({ openId })
  currentUserId.value = info?.id
  return info
}

async function initCreate() {
  const [projectList, nodes] = await Promise.all([othersApi.projectList({ openId }), othersApi.workflowNodeList()])
  projects.value = projectList || []
  const ownerAssignNode = (nodes || []).find(item => item.nodeCode === 'OWNER_ASSIGN' || item.nodeType === 'OWNER_ASSIGN')
  nextCandidates.value = ownerAssignNode?.id ? await othersApi.workflowNodeCandidates(ownerAssignNode.id) || [] : []
}

function resetActionState() {
  actionFileList.value = []
  selectedPlannedOnsiteUserIds.value = []
  selectedOwnerTargetId.value = null
  ownerFlowMode.value = 'NEXT_NODE'
  onsiteCode.value = ''
  location.longitude = null
  location.latitude = null
  actionForm.solutionResult = null
  actionForm.solutionRemark = ''
}

async function initDetail() {
  stampLoaded.value = false
  const result = await othersApi.workflowInstanceRuntime(instanceId.value)
  Object.assign(runtime, result || {})
  miniappCode.value = ''
  if (currentNodeCode.value && currentNodeCode.value !== 'CREATE') {
    try {
      miniappCode.value = await othersApi.workflowInstanceMiniappCode(instanceId.value)
    }
    catch (error) {
      console.warn('获取流程小程序码失败', error)
    }
  }
  await nextTick()
  if (archivedSolutionStamp.value)
    setTimeout(() => { stampLoaded.value = true }, 200)
  actionFileList.value = []
  fileList.value = files.value.map(item => ({ id: item.fileId, url: item.src, status: 'success' }))
  onsiteCode.value = detailForm.value.form?.onsiteMaintenanceCode || ''
  location.longitude = detailForm.value.form?.longitude ?? null
  location.latitude = detailForm.value.form?.latitude ?? null
  actionForm.solutionResult = null
  actionForm.solutionRemark = ''
  const current = currentNode.value
  if (current?.nodeId) {
    if (currentNodeCode.value === 'CREATE' || currentNodeCode.value === 'OWNER_ASSIGN') {
      const next = (runtime.nodes || []).find(item => item.sortNo > current.sortNo)
      nextCandidates.value = next?.nodeId ? await othersApi.workflowNodeCandidates(next.nodeId) || [] : []
    }
    if (currentNodeCode.value === 'OWNER_ASSIGN') {
      ownerFlowMode.value = 'NEXT_NODE'
      selectedNextCandidateId.value = null
      selectedOwnerTargetId.value = null
      ownerCandidates.value = await othersApi.workflowNodeCandidates(current.nodeId) || []
      onsiteCandidates.value = await othersApi.workflowOnsiteCandidates() || []
      selectedPlannedOnsiteUserIds.value = (detailForm.value.onsitePersons || detailForm.value.form?.onsitePersons || [])
        .map(item => onsitePersonId(item))
        .filter(Boolean)
    }
  }
}

async function init() {
  loading.value = true
  try {
    await getCurrentUser()
    resetActionState()
    if (isDetail.value)
      await initDetail()
    else
      await initCreate()
  }
  catch (error) {
    uni.showToast({ title: error?.message || '页面加载失败', icon: 'none' })
  }
  finally {
    loading.value = false
  }
}

function selectProject(event) {
  selectedProject.value = projects.value[Number(event.detail.value)] || null
  createForm.contactRemark = selectedProject.value?.contactRemark || ''
}

function openFlowStatus() {
  if (isDetail.value)
    flowStatusVisible.value = true
}

function callPhone(phoneNumber) {
  if (phoneNumber)
    uni.makePhoneCall({ phoneNumber: String(phoneNumber) })
}

function selectNextCandidate(event) {
  selectedNextCandidateId.value = nextCandidates.value[Number(event.detail.value)]?.id || null
}

function selectOwnerTarget(event) {
  selectedOwnerTargetId.value = ownerCandidates.value[Number(event.detail.value)]?.id || null
}

function formatSolutionResult(value) {
  if (Number(value) === 1)
    return '已恢复，保持观察'
  if (Number(value) === 2)
    return '未恢复，另行安排'
  return '-'
}

function openOnsitePicker() {
  onsiteSearchKeyword.value = ''
  onsitePickerVisible.value = true
}

function closeOnsitePicker() {
  onsitePickerVisible.value = false
  onsiteSearchKeyword.value = ''
}

function onsitePersonId(person) {
  return String(person?.id ?? person?.userId ?? '')
}

function isOnsitePersonSelected(person) {
  return selectedPlannedOnsiteUserIds.value.includes(onsitePersonId(person))
}

function toggleOnsitePerson(person) {
  const id = onsitePersonId(person)
  if (!id)
    return
  if (isOnsitePersonSelected(person)) {
    selectedPlannedOnsiteUserIds.value = selectedPlannedOnsiteUserIds.value.filter(item => item !== id)
    return
  }
  selectedPlannedOnsiteUserIds.value = [...selectedPlannedOnsiteUserIds.value, id]
}

function toggleOnsiteCandidates() {
  const visibleIds = filteredOnsiteCandidates.value.map(onsitePersonId).filter(Boolean)
  if (allVisibleOnsiteSelected.value) {
    selectedPlannedOnsiteUserIds.value = selectedPlannedOnsiteUserIds.value.filter(id => !visibleIds.includes(id))
    return
  }
  selectedPlannedOnsiteUserIds.value = [...new Set([...selectedPlannedOnsiteUserIds.value, ...visibleIds])]
}

async function createWorkOrder() {
  if (submitting.value)
    return
  if (!selectedProject.value)
    return toast.error({ msg: '请选择项目' })
  if (!createForm.faultDescription.trim())
    return toast.error({ msg: '请输入故障描述' })
  if (!uploadedCodes().length)
    return toast.error({ msg: '请上传图片或视频' })
  if (!selectedNextCandidateId.value)
    return toast.error({ msg: '请选择下一节点处理人' })
  submitting.value = true
  try {
    const result = await othersApi.workflowInstanceStart({
      bizType: 'WORK_ORDER',
      bizId: '30001',
      handlerUserId: currentUserId.value,
      remark: '创建维保工单',
      form: {
        projectId: selectedProject.value.id,
        contactName: selectedProject.value.contactName,
        contactPhone: selectedProject.value.contactPhone,
        contactRemark: createForm.contactRemark,
        faultDescription: createForm.faultDescription,
        fileCodes: uploadedCodes(),
      },
    })
    await othersApi.workflowInstanceSubmit({
      instanceId: result.instanceId,
      targetUserId: selectedNextCandidateId.value,
      actionType: 'SUBMIT',
      remark: '创建后提交负责人',
    })
    toast.success({ msg: '提交成功' })
    setTimeout(() => uni.redirectTo({ url: `/pages-sub/maintenance/maintenance?instanceId=${result.instanceId}` }), 500)
  }
  catch (error) {
    toast.error({ msg: error?.message || '提交失败' })
  }
  finally {
    submitting.value = false
  }
}

function buildActionForm() {
  const payload = { fileCodes: actionUploadedCodes() }
  if (currentNodeCode.value === 'OWNER_ASSIGN' && ownerFlowMode.value === 'NEXT_NODE') {
    payload.onsitePersons = onsiteCandidates.value
      .filter(item => selectedPlannedOnsiteUserIds.value.includes(onsitePersonId(item)))
      .map(item => ({ userId: item.id }))
  }
  if (currentNodeCode.value === 'ONSITE_ARRIVE') {
    payload.onsiteMaintenanceCode = onsiteCode.value
    payload.longitude = location.longitude
    payload.latitude = location.latitude
  }
  if (currentNodeCode.value === 'ONSITE_FINISH') {
    if (actionForm.solutionResult || actionForm.solutionRemark.trim()) {
      payload.solutionResult = actionForm.solutionResult
      payload.solutionRemark = actionForm.solutionRemark
    }
  }
  return payload
}

async function submitAction(actionType) {
  if (submitting.value)
    return
  if ((currentNodeCode.value !== 'OWNER_ASSIGN' || ownerFlowMode.value === 'NEXT_NODE') && !actionUploadedCodes().length)
    return toast.error({ msg: '请上传图片或视频' })
  if (currentNodeCode.value === 'CREATE' && !selectedNextCandidateId.value)
    return toast.error({ msg: '请选择下一节点处理人' })
  if (actionType === 'RETURN' && !previousOwnerUserId.value)
    return toast.error({ msg: '未找到上一次负责人，无法退回' })
  if (currentNodeCode.value === 'OWNER_ASSIGN') {
    if (ownerFlowMode.value === 'SELF_LOOP') {
      if (!selectedOwnerTargetId.value)
        return toast.error({ msg: '请选择重新指派的负责人' })
    }
    else if (!selectedNextCandidateId.value) {
      return toast.error({ msg: '请选择下一节点处理人' })
    }
  }
  if (currentNodeCode.value === 'OWNER_ASSIGN' && ownerFlowMode.value === 'NEXT_NODE' && !selectedPlannedOnsiteUserIds.value.length)
    return toast.error({ msg: '请选择计划到场人员' })
  if (currentNodeCode.value === 'ONSITE_ARRIVE') {
    if (!onsiteCode.value)
      return toast.error({ msg: '请先扫描现场维保码' })
    if (location.longitude == null || location.latitude == null)
      return toast.error({ msg: '请获取当前位置' })
  }
  if (currentNodeCode.value === 'ONSITE_FINISH' && !actionForm.solutionRemark.trim())
    return toast.error({ msg: '请填写处理备注' })
  submitting.value = true
  try {
    const payload = {
      instanceId: Number(instanceId.value),
      openId,
      actionType,
      remark: actionType === 'ARCHIVE' ? '归档工单' : '处理',
      form: buildActionForm(),
    }
    if (actionType === 'RETURN') {
      payload.targetUserId = previousOwnerUserId.value
    }
    else if (currentNodeCode.value === 'CREATE') {
      payload.targetUserId = selectedNextCandidateId.value
    }
    else if (currentNodeCode.value === 'OWNER_ASSIGN') {
      if (ownerFlowMode.value === 'SELF_LOOP')
        payload.targetUserId = selectedOwnerTargetId.value
      else
        payload.nextTargetUserId = selectedNextCandidateId.value
    }
    await othersApi.workflowInstanceSubmit(payload)
    toast.success({ msg: '提交成功' })
    await initDetail()
  }
  catch (error) {
    toast.error({ msg: error?.message || '提交失败' })
  }
  finally {
    submitting.value = false
  }
}

function uploadedCodes() {
  return fileList.value.map(item => item.id || item.code).filter(Boolean)
}

function actionUploadedCodes() {
  return actionFileList.value.map(item => item.id || item.code).filter(Boolean)
}

function normalizeFiles(items) {
  return (items || []).map(item => ({
    id: item.fileId || item.id || item.code,
    url: item.src || item.url,
    status: 'success',
  }))
}

function beforeUpload() {
  return false
}

function handleChange(list) {
  fileList.value = list
}

async function customUpload(file) {
  return uploadToList(file, fileList)
}

async function customActionUpload(file) {
  return uploadToList(file, actionFileList)
}

async function uploadToList(file, targetList) {
  const filesToUpload = [].concat(file)
  for (const item of filesToUpload) {
    try {
      const result = JSON.parse(await uploadFilePromise(item.url))
      const uploaded = result?.data || result
      const fileInfo = Array.isArray(uploaded) ? uploaded[0] : uploaded
      targetList.value.push({ ...item, status: 'success', id: fileInfo.code, url: fileInfo.src || item.url })
    }
    catch (error) {
      toast.error({ msg: '文件上传失败' })
    }
  }
}

function uploadFilePromise(url) {
  return new Promise((resolve, reject) => {
    uni.uploadFile({
      url: `${apiUrl}/file/fileUpload`,
      filePath: url,
      name: 'file',
      formData: { user: openId, openId },
      success: res => resolve(res.data),
      fail: reject,
    })
  })
}

function deletePic({ file }) {
  fileList.value = fileList.value.filter(item => item !== file)
}

function handleActionChange(list) {
  actionFileList.value = list
}

function deleteActionPic({ file }) {
  actionFileList.value = actionFileList.value.filter(item => item !== file)
}

function getLocation() {
  return new Promise((resolve, reject) => {
    uni.getSetting({
      success: (setting) => {
        const locationAuth = setting.authSetting?.['scope.userLocation']
        if (locationAuth === false) {
          uni.showModal({
            title: '位置权限未开启',
            content: '需要位置权限才能使用该功能，请前往设置开启',
            confirmText: '去设置',
            success: (modal) => {
              if (!modal.confirm) {
                reject(new Error('location permission denied'))
                return
              }
              uni.openSetting({
                success: (result) => {
                  if (result.authSetting?.['scope.userLocation'])
                    getLocation().then(resolve).catch(reject)
                  else
                    reject(new Error('location permission denied'))
                },
                fail: reject,
              })
            },
            fail: reject,
          })
          return
        }

        const getPosition = () => uni.getLocation({ type: 'gcj02', success: resolve, fail: reject })
        if (locationAuth) {
          getPosition()
          return
        }
        uni.authorize({ scope: 'scope.userLocation', success: getPosition, fail: reject })
      },
      fail: reject,
    })
  })
}

async function scanOnsiteCode() {
  if (scanning.value)
    return
  scanning.value = true
  try {
    const scanResult = await new Promise((resolve, reject) => {
      uni.scanCode({ success: resolve, fail: reject })
    })
    onsiteCode.value = scanResult.result || ''
    const position = await getLocation()
    location.longitude = position.longitude
    location.latitude = position.latitude
  }
  catch (error) {
    if (error?.errMsg?.includes('cancel'))
      return
    const permissionDenied = error?.message?.includes('location permission denied')
      || error?.errMsg?.includes('permission')
      || error?.errMsg?.includes('auth deny')
    toast.error({ msg: permissionDenied ? '请在小程序设置中允许位置权限' : error?.errMsg || '扫描或获取位置失败' })
  }
  finally {
    scanning.value = false
  }
}

onLoad((options) => {
  instanceId.value = options?.instanceId || ''
})

onShow(async () => {
  await uni.$onLaunched
  if (initialized.value)
    return
  initialized.value = true
  await init()
})
</script>

<style lang="scss" scoped>
@import './scss/maintenance.scss';

:deep(.maintenance-media-upload .wd-upload__evoke.is-disabled) {
  display: none !important;
}
</style>

<style>
page {
  background: linear-gradient(
    99deg,
    rgba(255, 91, 145, 0.08) 2%,
    rgba(63, 169, 245, 0.1) 51.48%,
    rgba(0, 255, 255, 0.1) 82.82%
  );
}

.wd-textarea__count {
  width: 60px;
  justify-content: flex-end;
}

.maintenance-media-upload {
  display: grid !important;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 24rpx;
}

.maintenance-media-upload .wd-upload__preview,
.maintenance-media-upload .wd-upload__evoke {
  width: auto !important;
  height: auto !important;
  min-width: 0;
  margin: 0 !important;
  aspect-ratio: 1;
  border-radius: 10px;
}

.maintenance-media-upload .wd-upload__preview .wd-upload__status-content,
.maintenance-media-upload .wd-upload__evoke {
  overflow: hidden;
  border-radius: inherit;
}

.maintenance-media-upload .wd-upload__picture,
.maintenance-media-upload .wd-upload__video,
.maintenance-media-upload .wd-upload__file {
  border-radius: inherit;
}

.compact-textarea {
  height: 72px;
}

.create-form .maintenance-media-upload .wd-upload__preview,
.create-form .maintenance-media-upload .wd-upload__evoke,
.action-card .maintenance-media-upload .wd-upload__preview,
.action-card .maintenance-media-upload .wd-upload__evoke {
  border-radius: 8px;
}

.history-card .maintenance-media-upload .wd-upload__preview,
.history-card .maintenance-media-upload .wd-upload__picture,
.history-card .maintenance-media-upload .wd-upload__video,
.history-card .maintenance-media-upload .wd-upload__file {
  background: #f6f6f7;
}
</style>
