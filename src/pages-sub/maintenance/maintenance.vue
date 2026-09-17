<template>
  <div style="height: 0;">
    <wd-navbar
      placeholder
      left-arrow
      safe-area-inset-top
      fixed
      :title="isDetail ? '维保工单详情' : '新建维保单'"
      style="--wot-navbar-bg: transparent"
      @click-left="handleBack"
    />
  </div>
  <div :style="`height: ${navBarConfig.customNavBarHeight}px;`" />
  <scroll-view scroll-y :enable-back-to-top="true" :style="`height: calc(100vh - ${navBarConfig.customNavBarHeight}px);`">
    <view class="page-container" :class="{ 'create-mode': !isDetail }">
      <template v-if="isDetail">
        <view class="section-card work-order-card">
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
              <global-tip icon="info-circle-fill" :text="currentNode?.nodeName || currentNode?.nodeCode || '-'" />
              <global-tip icon="swap" color="#36bd69" text="查看流程图" @tap="openFlowStatus" />
            </view>
          </view>
          <view class="work-order-project-name">
            <text
              v-for="(character, index) in projectNameCharacters"
              :key="`${character}-${index}`"
              class="work-order-project-name-character"
              :style="{ animationDelay: `${index * 0.06}s` }"
            >
              {{ character }}
            </text>
          </view>
          <view class="info-row urgency-info-row">
            <text>紧急程度</text>
            <wd-tag v-if="form.urgency === '重要'" type="warning" custom-class="urgency-tag">
              重要
            </wd-tag>
            <wd-tag v-else-if="form.urgency === '紧急'" type="danger" custom-class="urgency-tag">
              紧急
            </wd-tag>
            <wd-tag v-else type="primary" custom-class="urgency-tag">
              一般
            </wd-tag>
          </view>
          <view class="info-row">
            <text>维护分类</text><text>{{ form.maintenanceCategory || '硬件' }}</text>
          </view>
          <view class="info-row">
            <text>服务方式</text><text>{{ isRemoteService ? '远程' : '上门' }}</text>
          </view>
          <view class="field-title">
            故障描述
          </view>
          <wd-textarea
            :model-value="form.faultDescription || '-'"
            readonly
            auto-height
            custom-class="readonly-textarea"
          />
          <view class="info-row contact-info-row">
            <text>联系人</text><text>{{ form.contactName || '-' }}</text>
          </view>
          <view class="info-row contact-info-row">
            <text>联系电话</text>
            <template v-if="form.contactPhone">
              <view class="phone-action" @tap="callPhone(form.contactPhone)">
                <wd-icon name="mobile" size="14px" color="#05f" />
                <text>{{ form.contactPhone }}</text>
              </view>
            </template>
            <text v-else>-</text>
          </view>
        </view>

        <view v-if="isArchived" class="work-order-share-below">
          <work-order-share
            :form="form"
            :history-groups="actionHistoryGroups"
            :finish-info="lastFinishGroup"
            :finish-photos="lastFinishPhotos"
            :work-order-id="runtime.instance?.id"
            :created-at="runtime.instance?.createTime"
          />
        </view>

        <view v-if="onsitePersons.length" class="section-card onsite-person-card">
          <view class="section-title">
            已选处理人员
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
                  <wd-icon name="mobile" size="14px" color="#05f" />
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
            <person-picker v-model="selectedNextCandidateIds" :candidates="nextCandidates" :multiple="false" placeholder="请选择处理人" @open="vibrateLight" @select="vibrateLight" @phone-click="callPhone" />
          </view>

          <view v-if="currentNodeCode === 'OWNER_ASSIGN'" class="field-block" style="margin-bottom: 20px;">
            <view class="field-title">
              服务方式
            </view>
            <wd-radio-group v-model="actionForm.serviceMode" size="large" class="maintenance-radio-options" direction="horizontal" type="button">
              <wd-radio value="ONSITE">
                上门
              </wd-radio>
              <wd-radio value="REMOTE">
                远程
              </wd-radio>
            </wd-radio-group>
          </view>

          <view v-if="currentNodeCode === 'OWNER_ASSIGN'" class="field-block" style="margin-bottom: 20px;">
            <view class="field-title">
              维护分类
            </view>
            <wd-radio-group v-model="actionForm.maintenanceCategory" size="large" class="maintenance-category-options maintenance-radio-options" style="--wot-radio-horizontal-margin: 0 10px 0 0;" direction="horizontal" type="button" @change="rememberMaintenanceCategory">
              <wd-radio value="硬件">
                硬件
              </wd-radio>
              <wd-radio value="软件">
                软件
              </wd-radio>
              <wd-radio value="装饰">
                装饰
              </wd-radio>
              <wd-radio value="道具">
                道具
              </wd-radio>
              <wd-radio value="模型">
                模型
              </wd-radio>
              <wd-radio value="平面">
                平面
              </wd-radio>
            </wd-radio-group>
          </view>

          <view v-if="currentNodeCode === 'OWNER_ASSIGN'" class="field-block" style="margin-bottom: 20px;">
            <view class="field-title">
              流转方式
            </view>
            <wd-radio-group v-model="ownerFlowMode" size="large" class="maintenance-radio-options" direction="horizontal" type="button">
              <wd-radio value="NEXT_NODE">
                选择处理人
              </wd-radio>
              <wd-radio value="SELF_LOOP">
                重新指派负责人
              </wd-radio>
            </wd-radio-group>
            <view v-if="ownerFlowMode === 'SELF_LOOP'" class="field-block mt-3">
              <person-picker v-model="selectedOwnerTargetIds" :candidates="ownerCandidates" :multiple="false" placeholder="请选择负责人" @phone-click="callPhone" />
            </view>
            <view v-else class="field-block mt-3">
              <person-picker v-model="selectedNextCandidateIds" :candidates="nextCandidates" :multiple="false" placeholder="请选择处理人" @open="vibrateLight" @select="vibrateLight" @phone-click="callPhone" />
            </view>
          </view>

          <view v-if="currentNodeCode === 'ONSITE_ARRIVE'" class="field-block">
            <view class="onsite-transfer-switch">
              <view class="field-title">
                重新指定处理人
              </view>
              <wd-switch v-model="onsiteTransferEnabled" />
            </view>
            <person-picker
              v-if="onsiteTransferEnabled"
              v-model="selectedOnsiteTransferUserIds"
              :candidates="onsiteTransferCandidates"
              :multiple="false"
              placeholder="请选择处理人"
              @open="vibrateLight"
              @select="vibrateLight"
              @phone-click="callPhone"
            />
          </view>

          <view v-if="currentNodeCode === 'ONSITE_ARRIVE' && !onsiteTransferEnabled && !isRemoteService" class="field-block">
            <wd-button round block type="info" custom-style="margin-top: 12px;" :loading="scanning" @click="scanOnsiteCode">
              <wd-icon name="scan" color="#37C062" size="18px" custom-style="margin-right: 6px;" />
              {{ onsiteCode ? '重新扫描现场维保码' : '扫描现场维保码' }}
            </wd-button>
            <view v-if="onsiteCodeVerified" class="scan-result onsite-code-verified">
              <wd-icon name="check-outline" color="#37C062" size="22px" />
              <text>维保码校验通过</text>
            </view>
            <view v-else-if="onsiteCodeVerificationFailed" class="scan-result onsite-code-verification-failed">
              <wd-icon name="minus-circle" color="#e34d59" size="22px" />
              <text>维保码比对错误</text>
            </view>
            <view v-if="location.longitude != null && location.latitude != null" class="scan-result">
              位置：{{ location.longitude }}, {{ location.latitude }}
            </view>
            <view v-if="location.longitude != null && location.latitude != null" class="scan-result">
              地址：{{ location.address || location.addressError || '地址解析中' }}
            </view>
          </view>

          <view v-if="currentNodeCode === 'ONSITE_FINISH'" class="field-block">
            <view class="field-title">
              解决结果
            </view>
            <wd-radio-group v-model="actionForm.solutionResult" class="solution-result-options maintenance-radio-options" direction="horizontal" type="button">
              <wd-radio :value="1" size="large">
                已恢复，保持观察
              </wd-radio>
              <wd-radio :value="2" size="large">
                未恢复，另行安排
              </wd-radio>
            </wd-radio-group>
            <view class="field-title">
              处理备注
            </view>
            <wd-textarea
              v-model="actionForm.solutionRemark"
              custom-textarea-class="compact-textarea"
              style="background: #fff; border-radius: 8px;"
              :maxlength="1000"
              show-word-limit
              clearable
              placeholder="请输入处理备注"
              placeholder-style="color: #bfbfbf;"
            />
          </view>

          <view v-if="currentNodeCode !== 'OWNER_ASSIGN' && !isOnsiteTransferMode" class="field-block">
            <view class="field-title">
              {{ attachmentLabel }}
            </view>
            <wd-upload
              v-model:file-list="actionFileList"
              :limit="9"
              :multiple="true"
              accept="media"
              image-mode="aspectFill"
              :reupload="false"
              :upload-method="customActionUpload"
              :before-preview="handleMediaPreview"
              :show-limit-num="false"
              loading-color="#5252ff"
              custom-class="maintenance-media-upload"
              custom-evoke-class="maintenance-media-upload-evoke"
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
              :disabled="submitting"
              @click="debouncedSubmitAction('RETURN')"
            >
              退回负责人
            </wd-button>
            <wd-button
              v-if="currentNodeCode !== 'ONSITE_FINISH' || actionForm.solutionResult === 1"
              type="primary"
              custom-class="flow-submit-button"
              :loading="submitting"
              :disabled="submitting"
              @click="debouncedSubmitAction(isOnsiteTransferMode ? 'TRANSFER' : isArchiveNode ? 'ARCHIVE' : 'SUBMIT')"
            >
              {{ isOnsiteTransferMode ? '重新指定' : isArchiveNode ? '归档工单' : '处理' }}
            </wd-button>
          </view>
        </view>

        <view v-if="canShowRecall" class="recall-button">
          <wd-button custom-class="recall-button-control" :loading="submitting" :disabled="submitting" @click="debouncedRecallAndReassign">
            撤回
          </wd-button>
        </view>

        <view v-if="actionHistoryGroups.length" class="section-card history-card">
          <view class="section-title">
            流程信息
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
              <view v-if="group.handlerUserName || group.remark || group.handlerPhone" class="history-node-detail">
                <text>{{ group.handlerUserName || '-' }}</text>
                <view v-if="group.handlerPhone" class="history-node-phone phone-action" @tap.stop="callPhone(group.handlerPhone)">
                  <wd-icon name="mobile" size="14px" color="#05f" />
                </view>
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
                <wd-textarea
                  v-if="item.solutionRemark"
                  :model-value="item.solutionRemark"
                  readonly
                  auto-height
                  custom-class="readonly-textarea mt-3"
                />
              </view>
              <view v-if="!canRecall && group.files.length" class="field-block mt-3">
                <view class="field-title">
                  {{ group.nodeCode === 'ONSITE_ARRIVE' ? '照片/视频(维保前)' : '照片/视频' }}
                </view>
                <wd-upload
                  :file-list="group.files"
                  :limit="9"
                  accept="media"
                  image-mode="aspectFill"
                  disabled
                  :before-preview="handleMediaPreview"
                  custom-class="maintenance-media-upload"
                />
              </view>
            </view>
          </view>
        </view>
      </template>

      <template v-else>
        <view class="create-form">
          <wd-notice-bar v-if="!isCertified" custom-class="create-certification-notice" text="仅认证通过的用户可以新建, 快去认证吧" prefix="warn-bold" />
          <wd-card type="rectangle" class="bot-title" style="animation-delay: 0.2s;" custom-class="create-form-card">
            <template #title>
              <view class="create-card-title">
                <wd-icon color="#05f" name="desktop" size="16px" />
                <text>项目信息</text>
              </view>
            </template>
            <view class="create-card-content">
              <person-picker
                v-model="selectedProjectIds"
                :candidates="projectCandidates"
                :multiple="false"
                label-key="projectName"
                :detail-keys="['contactName', 'contactPhone']"
                phone-key="contactPhone"
                :search-keys="['projectName', 'contactName', 'contactPhone']"
                title="选择项目"
                placeholder="请选择项目"
                empty-text="暂无可选项目"
                search-placeholder="搜索项目、联系人或手机"
                large-search
                checked-color="#05F"
                checkbox-size="large"
                search-prefix-width="25%"
                @open="vibrateLight"
                @select="vibrateLight"
                @phone-click="callPhone"
              >
                <template #search-prefix>
                  <view v-if="projectYearOptions.length" class="project-year-filter">
                    <picker mode="selector" :range="projectYearOptions" :value="projectYearIndex" @change="selectProjectYear">
                      <view class="project-year-picker-value">
                        <text>{{ selectedProjectYear }}</text>
                        <wd-icon name="down" size="14px" color="#667085" />
                      </view>
                    </picker>
                  </view>
                </template>
              </person-picker>
              <view v-if="selectedProject" class="customer-fieldset">
                <text class="customer-fieldset-legend">客户方</text>
                <view class="form-field-row">
                  <view class="form-field-column">
                    <view class="field-title">
                      联系人
                    </view>
                    <wd-input v-model="createForm.contactName" no-border custom-class="compact-input" placeholder="请输入" clearable />
                  </view>
                  <view class="form-field-column">
                    <view class="field-title">
                      联系电话
                    </view>
                    <wd-input v-model="createForm.contactPhone" no-border custom-class="compact-input" placeholder="请输入" clearable />
                  </view>
                </view>
              </view>
            </view>
          </wd-card>

          <wd-card type="rectangle" class="bot-title" style="animation-delay: 0.3s;" custom-class="create-form-card">
            <template #title>
              <view class="create-card-title">
                <wd-icon color="#05f" name="edit" size="16px" />
                <text>故障描述</text>
              </view>
            </template>
            <view class="create-card-content">
              <wd-textarea
                v-model="createForm.faultDescription"
                custom-textarea-class="compact-textarea"
                :maxlength="1000"
                show-word-limit
                clearable
                placeholder="请输入故障描述"
                placeholder-style="color: #bfbfbf;"
              />
            </view>
          </wd-card>

          <wd-card type="rectangle" class="bot-title" style="animation-delay: 0.4s;" custom-class="create-form-card">
            <template #title>
              <view class="create-card-title">
                <wd-icon color="#05f" name="exclamation-circle" size="16px" />
                <text>紧急程度</text>
              </view>
            </template>
            <view class="create-card-content">
              <wd-radio-group v-model="createForm.urgency" class="urgency-options maintenance-radio-options" style="--wot-radio-horizontal-margin: 0 20px 0 0;" direction="horizontal" type="button">
                <wd-radio value="一般">
                  一般
                </wd-radio>
                <wd-radio value="重要">
                  重要
                </wd-radio>
                <wd-radio value="紧急">
                  紧急
                </wd-radio>
              </wd-radio-group>
            </view>
          </wd-card>

          <wd-card type="rectangle" class="bot-title" style="animation-delay: 0.5s;" custom-class="create-form-card">
            <template #title>
              <view class="create-card-title">
                <wd-icon color="#05f" name="image" size="16px" />
                <text>照片/视频</text>
              </view>
            </template>
            <view class="create-card-content">
              <wd-upload
                v-model:file-list="fileList"
                :limit="9"
                :multiple="true"
                accept="media"
                image-mode="aspectFill"
                :reupload="false"
                :upload-method="customUpload"
                :before-preview="handleMediaPreview"
                :show-limit-num="false"
                loading-color="#5252ff"
                custom-class="maintenance-media-upload"
                custom-evoke-class="maintenance-media-upload-evoke"
                @before-upload="beforeUpload"
                @remove="deletePic"
                @change="handleChange"
              />
            </view>
          </wd-card>

          <wd-card type="rectangle" class="bot-title" style="animation-delay: 0.6s;" custom-class="create-form-card">
            <template #title>
              <view class="create-card-title">
                <wd-icon color="#05f" name="user" size="16px" />
                <text>下一节点处理人</text>
              </view>
            </template>
            <view class="create-card-content">
              <person-picker v-model="selectedNextCandidateIds" :candidates="createNextCandidates" :multiple="false" placeholder="请选择下一节点处理人" @open="vibrateLight" @select="vibrateLight" @phone-click="callPhone" />
            </view>
          </wd-card>

          <view class="create-submit-wrapper">
            <wd-button block type="primary" custom-class="flow-submit-button create-submit-button" :loading="submitting" :disabled="submitting" @click="debouncedCreateWorkOrder">
              提交维保单
            </wd-button>
          </view>
        </view>
      </template>
    </view>
  </scroll-view>
  <wd-toast />
  <flow-status-popup v-model="flowStatusVisible" :runtime="runtime" />
  <loadingBox :show="loading" />
</template>

<script setup>
import { useToast } from '@wot-ui/ui'
import { computed, inject, nextTick, reactive, ref, watch } from 'vue'
import { simpleLoginApi } from '@/api/login/simple-login-api.js'
import { othersApi } from '@/api/others-api'
import loadingBox from '@/components/global-loading-box.vue'
import PersonPicker from '@/components/person-picker.vue'
import { useUserStore } from '@/store/user'
import { debounce } from '@/utils/debounce'
import { requestWorkOrderSubscribe } from '@/utils/subscribe-message'
import FlowStatusPopup from './components/flow-status-popup.vue'
import WorkOrderShare from './components/work-order-share.vue'

const navBarConfig = inject('navBarConfig')
const apiUrl = import.meta.env.VITE_SERVER_BASEURL
const openId = useUserStore().openId
const MAINTENANCE_CATEGORY_OPTIONS = ['硬件', '软件', '装饰', '道具', '模型', '平面']
const maintenancePreferences = reactive(loadMaintenancePreferences())
const toast = useToast()
const vibrateLight = () => wx.vibrateShort({ type: 'light' })
const loading = ref(true)
const submitting = ref(false)
const instanceId = ref('')
const projects = ref([])
const projectYearGroups = ref([])
const selectedProjectYear = ref('')
const nextCandidates = ref([])
const fileList = ref([])
const actionFileList = ref([])
const selectedProject = ref(null)
const selectedNextCandidateId = ref(null)
const ownerCandidates = ref([])
const selectedOwnerTargetId = ref(null)
const ownerFlowMode = ref('NEXT_NODE')
const onsiteTransferEnabled = ref(false)
const selectedOnsiteTransferUserId = ref(null)
const onsiteCode = ref('')
const onsiteCodeVerified = ref(false)
const onsiteCodeVerificationFailed = ref(false)
const scanning = ref(false)
const flowStatusVisible = ref(false)
const stampLoaded = ref(false)
const initialized = ref(false)
const actionHandlerPhones = ref({})
const location = reactive({ longitude: null, latitude: null, address: '', addressError: '' })
const runtime = reactive({ instance: null, nodes: [], actionLogs: [], form: {} })
const createForm = reactive({
  contactName: '',
  contactPhone: '',
  contactRemark: '',
  faultDescription: '',
  urgency: '一般',
})
const actionForm = reactive({ solutionResult: 1, solutionRemark: '', maintenanceCategory: '硬件', serviceMode: 'ONSITE' })
const currentUserId = ref(null)
const isCertified = ref(false)
const scannedProjectScene = ref('')
let projectGroupsPromise

const isDetail = computed(() => !!instanceId.value)
const detailForm = computed(() => runtime.form || {})
const form = computed(() => detailForm.value.form || {})
const projectNameCharacters = computed(() => (form.value.projectName || '-').split(''))
const isRemoteService = computed(() => form.value.serviceMode === 'REMOTE')
const files = computed(() => detailForm.value.files || [])
const onsitePersons = computed(() => detailForm.value.onsitePersons || [])
const onsiteTransferCandidates = computed(() => (detailForm.value.onsiteCandidates || [])
  .filter(item => Number(item.id) !== Number(currentUserId.value)))
const solutionResults = computed(() => detailForm.value.solutionResults || [])
const isArchived = computed(() => runtime.instance?.status === 'ARCHIVED')
const archivedSolutionStamp = computed(() => {
  const lastResult = solutionResults.value[solutionResults.value.length - 1]?.solutionResult
  return Number(lastResult) === 1 ? '已恢复' : Number(lastResult) === 2 ? '未恢复' : ''
})
const actionHistoryGroups = computed(() => {
  const actionLogs = runtime.actionLogs || []
  const actionLogIdFor = (item) => {
    if (item.actionLogId == null)
      return null
    const actionIndex = actionLogs.findIndex(log => String(log.id) === String(item.actionLogId))
    const matchedAction = actionLogs[actionIndex]
    const linkedAction = String(matchedAction?.nodeId) === String(item.nodeId)
      ? matchedAction
      : actionLogs.slice(0, Math.max(actionIndex, 0)).reverse().find(log => String(log.nodeId) === String(item.nodeId))
    return linkedAction?.id || item.actionLogId
  }
  const filesByActionLog = new Map()
  const unlinkedFiles = []
  files.value.forEach((file) => {
    const actionLogId = actionLogIdFor(file)
    if (actionLogId == null) {
      unlinkedFiles.push(file)
      return
    }
    const key = String(actionLogId)
    filesByActionLog.set(key, [...(filesByActionLog.get(key) || []), file])
  })
  const solutionsByActionLog = new Map()
  const unlinkedSolutions = []
  solutionResults.value.forEach((item) => {
    const actionLogId = actionLogIdFor(item)
    if (actionLogId == null) {
      unlinkedSolutions.push(item)
      return
    }
    const key = String(actionLogId)
    solutionsByActionLog.set(key, [...(solutionsByActionLog.get(key) || []), item])
  })
  const nodesById = new Map((runtime.nodes || []).map(item => [String(item.nodeId || item.id), item]))
  const groups = actionLogs.map((log, index) => {
    const key = String(log.id)
    const actionFiles = filesByActionLog.get(key) || []
    const actionSolutions = solutionsByActionLog.get(key) || []
    const node = nodesById.get(String(actionSolutions[0]?.nodeId || actionFiles[0]?.nodeId || log.nodeId))
    return {
      key: log.id || `action-${index}`,
      nodeCode:
        node?.nodeType || node?.nodeCode || log.nodeCode || log.nodeType,
      label: log.nodeName || node?.nodeName || log.nodeType || '流程节点',
      actionType: log.actionType,
      handlerUserName: log.handlerUserName,
      handlerPhone: actionHandlerPhones.value[String(log.handlerUserId)] || '',
      createTime: log.createTime,
      roundNo: log.roundNo,
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
const lastFinishGroup = computed(() => [...actionHistoryGroups.value]
  .reverse()
  .find(group => group.nodeCode === 'ONSITE_FINISH')
  || null)
const lastFinishPhotos = computed(() => lastFinishGroup.value
  ?.files
  .map(file => file.url)
  .filter(Boolean) || [])
const currentNode = computed(() => (runtime.nodes || []).find(item => item.current))
const currentNodeCode = computed(() => currentNode.value?.nodeType || currentNode.value?.nodeCode || '')
const isArchiveNode = computed(() => ['ONSITE_FINISH', 'ARCHIVE'].includes(currentNodeCode.value))
const isOnsiteTransferMode = computed(() => currentNodeCode.value === 'ONSITE_ARRIVE' && onsiteTransferEnabled.value)
const attachmentLabel = computed(() => currentNodeCode.value === 'ONSITE_ARRIVE'
  ? '照片/视频(维保前)'
  : '照片/视频')
const canEdit = computed(() => runtime.instance?.status === 'RUNNING'
  && Number(runtime.instance?.currentHandlerUserId) === Number(currentUserId.value))
const creatorUserId = computed(() => {
  return (runtime.actionLogs || []).find(item => item.actionType === 'START')?.handlerUserId
})
const canRecall = computed(() => runtime.instance?.status === 'RUNNING'
  && currentNodeCode.value === 'OWNER_ASSIGN'
  && Number(creatorUserId.value) === Number(currentUserId.value)
  && !(runtime.actionLogs || []).some(item => item.actionType === 'RECALL'))
const canShowRecall = computed(() => canRecall.value)
const needsTargetUser = computed(() => currentNodeCode.value === 'CREATE' || currentNodeCode.value === 'OWNER_ASSIGN')
const selectedProjectIds = computed({
  get: () => selectedProject.value?.id == null ? [] : [String(selectedProject.value.id)],
  set: (value) => {
    selectedProject.value = projects.value.find(item => String(item.id) === String(value[0])) || null
    if (selectedProject.value)
      rememberRecentSelection('recentProjectIds', selectedProject.value.id)
    resetCreateContact()
  },
})
const projectYearOptions = computed(() => {
  const years = projectYearGroups.value.map(group => group.projectYear == null ? '未设置年份' : String(group.projectYear))
  return years.length ? ['全部', ...years] : years
})
const projectYearIndex = computed(() => Math.max(projectYearOptions.value.indexOf(selectedProjectYear.value), 0))
const projectCandidates = computed(() => {
  const candidates = selectedProjectYear.value === '全部'
    ? projects.value
    : projectYearGroups.value
      .find(group => String(group.projectYear ?? '未设置年份') === selectedProjectYear.value)
      ?.projects || []
  return sortByRecentSelection(candidates, maintenancePreferences.recentProjectIds)
})
const createNextCandidates = computed(() => sortByRecentSelection(nextCandidates.value, maintenancePreferences.recentNextHandlerIds))
const selectedNextCandidateIds = computed({
  get: () => selectedNextCandidateId.value == null ? [] : [String(selectedNextCandidateId.value)],
  set: (value) => {
    selectedNextCandidateId.value = value[0] ?? null
    if (!isDetail.value && selectedNextCandidateId.value != null)
      rememberRecentSelection('recentNextHandlerIds', selectedNextCandidateId.value)
  },
})
const selectedOwnerTargetIds = computed({
  get: () => selectedOwnerTargetId.value == null ? [] : [String(selectedOwnerTargetId.value)],
  set: (value) => { selectedOwnerTargetId.value = value[0] ?? null },
})
const selectedOnsiteTransferUserIds = computed({
  get: () => selectedOnsiteTransferUserId.value == null ? [] : [String(selectedOnsiteTransferUserId.value)],
  set: (value) => { selectedOnsiteTransferUserId.value = value[0] ?? null },
})
const previousOwnerUserId = computed(() => (runtime.actionLogs || [])
  .filter(item => (item.nodeCode || item.nodeType) === 'OWNER_ASSIGN' && item.handlerUserId != null)
  .at(-1)
  ?.handlerUserId ?? null)

function createDefaultMaintenancePreferences() {
  return {
    recentProjectIds: [],
    recentNextHandlerIds: [],
    maintenanceCategory: '',
  }
}

function normalizePreferenceIds(value) {
  if (!Array.isArray(value))
    return []
  return [...new Set(value
    .map(item => String(item ?? '').trim())
    .filter(Boolean))]
}

function maintenancePreferencesStorageKey() {
  return openId ? `maintenance-preferences:${openId}` : ''
}

function loadMaintenancePreferences() {
  const defaults = createDefaultMaintenancePreferences()
  const storageKey = maintenancePreferencesStorageKey()
  if (!storageKey)
    return defaults
  try {
    const stored = uni.getStorageSync(storageKey)
    if (!stored || typeof stored !== 'object')
      return defaults
    return {
      recentProjectIds: normalizePreferenceIds(stored.recentProjectIds),
      recentNextHandlerIds: normalizePreferenceIds(stored.recentNextHandlerIds),
      maintenanceCategory: MAINTENANCE_CATEGORY_OPTIONS.includes(stored.maintenanceCategory)
        ? stored.maintenanceCategory
        : '',
    }
  }
  catch {
    return defaults
  }
}

function saveMaintenancePreferences() {
  const storageKey = maintenancePreferencesStorageKey()
  if (!storageKey)
    return
  try {
    uni.setStorageSync(storageKey, {
      recentProjectIds: [...maintenancePreferences.recentProjectIds],
      recentNextHandlerIds: [...maintenancePreferences.recentNextHandlerIds],
      maintenanceCategory: maintenancePreferences.maintenanceCategory,
    })
  }
  catch {}
}

function rememberRecentSelection(key, value) {
  const id = String(value ?? '').trim()
  if (!id)
    return
  maintenancePreferences[key] = [id, ...maintenancePreferences[key].filter(item => item !== id)]
  saveMaintenancePreferences()
}

function sortByRecentSelection(items, recentIds) {
  const recentIndex = new Map(recentIds.map((id, index) => [String(id), index]))
  return (items || [])
    .map((item, index) => ({
      item,
      index,
      recentIndex: recentIndex.get(String(item?.id ?? item?.userId ?? '')),
    }))
    .sort((left, right) => {
      const leftRecentIndex = left.recentIndex ?? Number.MAX_SAFE_INTEGER
      const rightRecentIndex = right.recentIndex ?? Number.MAX_SAFE_INTEGER
      return leftRecentIndex - rightRecentIndex || left.index - right.index
    })
    .map(entry => entry.item)
}

function rememberMaintenanceCategory(event) {
  const category = event?.value
  if (!MAINTENANCE_CATEGORY_OPTIONS.includes(category))
    return
  maintenancePreferences.maintenanceCategory = category
  saveMaintenancePreferences()
}

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
  isCertified.value = Number(info?.type) === 2
  return info
}

async function initCreate() {
  const projectGroups = await preloadProjectGroups()
  projectYearGroups.value = projectGroups || []
  projects.value = projectYearGroups.value.flatMap(group => group.projects || [])
  selectedProjectYear.value = projectYearOptions.value[0] || ''
  await selectScannedProject()
  loadNextCandidates()
}

async function loadNextCandidates() {
  try {
    const nodes = await othersApi.workflowNodeList()
    const ownerAssignNode = (nodes || []).find(item => item.nodeCode === 'OWNER_ASSIGN' || item.nodeType === 'OWNER_ASSIGN')
    nextCandidates.value = ownerAssignNode?.id ? await othersApi.workflowNodeCandidates(ownerAssignNode.id) || [] : []
  }
  catch (error) {
    console.error('[维保单] 下一节点处理人加载失败', error)
  }
}

function preloadProjectGroups() {
  projectGroupsPromise ||= othersApi.projectListGroupByYear()
  return projectGroupsPromise
}

async function selectScannedProject() {
  if (!isCertified.value || !scannedProjectScene.value)
    return
  try {
    const projectId = await othersApi.resolveProjectMiniappCode(scannedProjectScene.value)
    const project = projects.value.find(item => String(item.id) === String(projectId))
    if (!project)
      throw new Error('项目不存在或已不在维保期内')
    selectedProjectYear.value = project.projectYear == null ? '未设置年份' : String(project.projectYear)
    await nextTick()
    selectedProjectIds.value = [String(project.id)]
  }
  catch (error) {
    uni.showToast({ title: error?.message || '项目码解析失败', icon: 'none' })
  }
}

watch(selectedProjectYear, () => {
  selectedProject.value = null
  resetCreateContact()
})

function selectProjectYear(event) {
  selectedProjectYear.value = projectYearOptions.value[Number(event.detail.value)] || ''
  uni.hideKeyboard()
}

function resetCreateContact() {
  createForm.contactName = ''
  createForm.contactPhone = ''
  createForm.contactRemark = ''
}

function resetActionState() {
  actionFileList.value = []
  selectedOwnerTargetId.value = null
  ownerFlowMode.value = 'NEXT_NODE'
  onsiteTransferEnabled.value = false
  selectedOnsiteTransferUserId.value = null
  onsiteCode.value = ''
  onsiteCodeVerified.value = false
  onsiteCodeVerificationFailed.value = false
  location.longitude = null
  location.latitude = null
  location.address = ''
  location.addressError = ''
  actionForm.solutionResult = 1
  actionForm.solutionRemark = ''
  actionForm.maintenanceCategory = maintenancePreferences.maintenanceCategory || '硬件'
  actionForm.serviceMode = 'ONSITE'
}

async function initDetail() {
  stampLoaded.value = false
  const result = await othersApi.workflowInstanceRuntime(instanceId.value)
  Object.assign(runtime, result || {})
  await loadActionHandlerPhones()
  await nextTick()
  if (archivedSolutionStamp.value)
    setTimeout(() => { stampLoaded.value = true }, 200)
  actionFileList.value = []
  fileList.value = normalizeFiles(files.value)
  onsiteCode.value = detailForm.value.form?.onsiteMaintenanceCode || ''
  onsiteCodeVerified.value = false
  onsiteCodeVerificationFailed.value = false
  location.longitude = detailForm.value.form?.longitude ?? null
  location.latitude = detailForm.value.form?.latitude ?? null
  location.address = detailForm.value.form?.address || ''
  location.addressError = ''
  actionForm.solutionResult = 1
  actionForm.solutionRemark = ''
  actionForm.maintenanceCategory = detailForm.value.form?.maintenanceCategory || maintenancePreferences.maintenanceCategory || '硬件'
  actionForm.serviceMode = detailForm.value.form?.serviceMode || 'ONSITE'
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
    }
  }
}

async function loadActionHandlerPhones() {
  actionHandlerPhones.value = {}
  const handlerUserIds = [...new Set((runtime.actionLogs || [])
    .map(item => item.handlerUserId)
    .filter(userId => userId != null))]
  const phoneEntries = await Promise.all(handlerUserIds.map(async (userId) => {
    try {
      const phoneNumber = (await othersApi.userInfoById(userId))?.phoneNumber || ''
      return [String(userId), phoneNumber]
    }
    catch {
      return [String(userId), '']
    }
  }))
  actionHandlerPhones.value = Object.fromEntries(phoneEntries)
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

function openFlowStatus() {
  if (isDetail.value)
    flowStatusVisible.value = true
}

function callPhone(phoneNumber) {
  if (phoneNumber) {
    uni.vibrateShort()
    uni.makePhoneCall({ phoneNumber: String(phoneNumber) })
  }
}

function handleBack() {
  if (getCurrentPages().length > 1) {
    uni.navigateBack()
    return
  }
  uni.reLaunch({ url: '/pages/index/index' })
}

function formatSolutionResult(value) {
  if (Number(value) === 1)
    return '已恢复，保持观察'
  if (Number(value) === 2)
    return '未恢复，另行安排'
  return '-'
}

async function createWorkOrder() {
  if (submitting.value)
    return
  wx.vibrateShort({ type: 'light' })
  if (!isCertified.value)
    return toast.error({ msg: '仅认证通过的用户可以新建维保单' })
  if (!selectedProject.value)
    return toast.error({ msg: '请选择项目' })
  if (!createForm.contactName.trim())
    return toast.error({ msg: '请输入联系人' })
  if (!createForm.faultDescription.trim())
    return toast.error({ msg: '请输入故障描述' })
  if (!uploadedCodes().length)
    return toast.error({ msg: '请上传图片或视频' })
  if (!selectedNextCandidateId.value)
    return toast.error({ msg: '请选择下一节点处理人' })
  submitting.value = true
  let submitted = false
  try {
    if (!await requestWorkOrderSubscribe())
      return
    const result = await othersApi.workflowInstanceStart({
      bizType: 'WORK_ORDER',
      bizId: '30001',
      handlerUserId: currentUserId.value,
      remark: '创建维保工单',
      form: {
        projectId: selectedProject.value.id,
        contactName: createForm.contactName,
        contactPhone: createForm.contactPhone,
        contactRemark: createForm.contactRemark,
        faultDescription: createForm.faultDescription,
        urgency: createForm.urgency,
        fileCodes: uploadedCodes(),
      },
    })
    await othersApi.workflowInstanceSubmit({
      instanceId: result.instanceId,
      targetUserId: selectedNextCandidateId.value,
      expectedCurrentNodeId: result.currentNodeId,
      expectedCurrentHandlerUserId: result.currentHandlerUserId,
      expectedCurrentRoundNo: result.currentRoundNo,
      actionType: 'SUBMIT',
      remark: '创建后提交负责人',
    })
    submitted = true
    toast.success({ msg: '提交成功' })
    setTimeout(() => uni.redirectTo({ url: '/pages-sub/maintenance/list' }), 500)
  }
  catch (error) {
    toast.error({ msg: error?.message || '提交失败' })
  }
  finally {
    if (!submitted)
      submitting.value = false
  }
}

function buildActionForm() {
  const payload = {}
  if (currentNodeCode.value !== 'OWNER_ASSIGN' && currentNodeCode.value !== 'ARCHIVE')
    payload.fileCodes = actionUploadedCodes()
  if (currentNodeCode.value === 'OWNER_ASSIGN' && ownerFlowMode.value === 'NEXT_NODE')
    payload.onsitePersons = [{ userId: selectedNextCandidateId.value }]
  if (currentNodeCode.value === 'OWNER_ASSIGN') {
    payload.maintenanceCategory = actionForm.maintenanceCategory
    payload.serviceMode = actionForm.serviceMode
  }
  if (currentNodeCode.value === 'ONSITE_ARRIVE' && !isRemoteService.value) {
    payload.onsiteMaintenanceCode = onsiteCode.value
    payload.longitude = location.longitude
    payload.latitude = location.latitude
    payload.address = location.address
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
  wx.vibrateShort({ type: 'light' })
  if (actionType === 'TRANSFER' && !selectedOnsiteTransferUserId.value)
    return toast.error({ msg: '请选择重新指定的处理人' })
  if (actionType !== 'TRANSFER' && currentNodeCode.value !== 'OWNER_ASSIGN' && currentNodeCode.value !== 'ARCHIVE' && !actionUploadedCodes().length)
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
  if (currentNodeCode.value === 'ONSITE_FINISH' && !actionForm.solutionRemark.trim())
    return toast.error({ msg: '请填写处理备注' })
  submitting.value = true
  let submitted = false
  try {
    if (actionType !== 'TRANSFER' && currentNodeCode.value === 'ONSITE_ARRIVE' && !isRemoteService.value) {
      if (!onsiteCodeVerified.value)
        return toast.error({ msg: '请先扫描并校验现场维保码' })
      if (location.longitude == null || location.latitude == null)
        return toast.error({ msg: '请获取当前位置' })
      let verified
      try {
        verified = await othersApi.workflowInstanceVerifyOnsiteCode(instanceId.value, onsiteCode.value)
      }
      catch (error) {
        return toast.error({ msg: error?.message || '维保码校验失败' })
      }
      if (!verified) {
        onsiteCode.value = ''
        onsiteCodeVerified.value = false
        onsiteCodeVerificationFailed.value = true
        return toast.error({ msg: '维保码比对错误' })
      }
    }
    if (!await requestWorkOrderSubscribe())
      return
    const payload = {
      instanceId: Number(instanceId.value),
      expectedCurrentNodeId: runtime.instance?.currentNodeId,
      expectedCurrentHandlerUserId: runtime.instance?.currentHandlerUserId,
      expectedCurrentRoundNo: runtime.instance?.currentRoundNo,
      openId,
      actionType,
      remark: actionType === 'TRANSFER' ? '重新指定处理人' : actionType === 'ARCHIVE' ? '归档工单' : '处理',
    }
    if (actionType === 'TRANSFER') {
      payload.targetUserId = selectedOnsiteTransferUserId.value
    }
    else {
      payload.form = buildActionForm()
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
    submitted = true
    toast.success({ msg: '提交成功' })
    setTimeout(() => uni.redirectTo({ url: '/pages-sub/maintenance/list' }), 500)
  }
  catch (error) {
    if (currentNodeCode.value === 'ONSITE_ARRIVE' && error?.message?.includes('维保码比对错误')) {
      onsiteCodeVerified.value = false
      onsiteCodeVerificationFailed.value = true
    }
    toast.error({ msg: error?.message || '提交失败' })
    if (error?.message?.includes('当前节点已发生变化'))
      await initDetail()
  }
  finally {
    if (!submitted)
      submitting.value = false
  }
}

watch(onsiteTransferEnabled, (enabled) => {
  if (!enabled)
    selectedOnsiteTransferUserId.value = null
})

async function recallAndReassign() {
  if (submitting.value)
    return
  wx.vibrateShort({ type: 'light' })
  if (!canRecall.value)
    return toast.error({ msg: '流程已进入下一节点' })
  submitting.value = true
  if (!await requestWorkOrderSubscribe()) {
    submitting.value = false
    return
  }
  try {
    await othersApi.workflowInstanceSubmit({
      instanceId: Number(instanceId.value),
      expectedCurrentNodeId: runtime.instance?.currentNodeId,
      expectedCurrentHandlerUserId: runtime.instance?.currentHandlerUserId,
      expectedCurrentRoundNo: runtime.instance?.currentRoundNo,
      actionType: 'RECALL',
      remark: '创建人撤回',
      form: {},
    })
    toast.success({ msg: '已撤回至创建节点' })
    await initDetail()
  }
  catch (error) {
    toast.error({ msg: error?.message || '撤回失败' })
    if (error?.message?.includes('当前节点已发生变化'))
      await initDetail()
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
  return (items || []).map((item) => {
    const originalUrl = item.originalUrl || item.src || item.url
    const isVideo = isVideoFile({ ...item, url: originalUrl })
    return {
      id: item.fileId || item.id || item.code,
      name: item.name || item.originalName || '',
      type: item.type || '',
      url: isVideo ? originalUrl : buildMediaThumbnailUrl(originalUrl),
      originalUrl,
      thumb: isVideo ? (item.thumb || '') : '',
      status: 'success',
    }
  })
}

const mediaThumbnailQuery = 'x-oss-process=image/resize,m_fill,w_300,h_300/format,webp'

function buildMediaThumbnailUrl(url) {
  if (!url || url.startsWith('wxfile://') || url.startsWith('file://'))
    return url
  return `${url}${url.includes('?') ? '&' : '?'}${mediaThumbnailQuery}`
}

function isVideoFile(file) {
  const type = String(file?.type || '').toLowerCase()
  const url = String(file?.originalUrl || file?.url || file?.name || '')
  return type.startsWith('video/') || /\.(?:ogm|webm|ogv|asx|m4v|mp4|mpg|mpeg|dat|asf|avi|rm|rmvb|mov|wmv|flv|mkv|video)(?=$|[?#])/i.test(url)
}

function handleMediaPreview({ file, fileList }) {
  if (!file?.originalUrl || isVideoFile(file))
    return true
  const imageFiles = (fileList || []).filter(item => !isVideoFile(item))
  const urls = imageFiles.map(item => item.originalUrl || item.url).filter(Boolean)
  const current = file.originalUrl
  if (!urls.length)
    return true
  uni.previewImage({
    urls,
    current,
  })
  return false
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
      const originalUrl = fileInfo.src || item.url
      const isVideo = isVideoFile({ ...item, url: originalUrl })
      targetList.value.push({
        ...item,
        status: 'success',
        id: fileInfo.code,
        url: isVideo ? originalUrl : buildMediaThumbnailUrl(originalUrl),
        originalUrl,
        thumb: isVideo ? (item.thumb || '') : '',
      })
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

function getRecommendedAddress(latitude, longitude) {
  return new Promise((resolve, reject) => {
    wx.request({
      url: `https://apis.map.qq.com/ws/geocoder/v1/?location=${latitude},${longitude}&key=DR2BZ-TXMEV-WTNPD-5TVTY-CKXM2-QYFUW`,
      success(resp) {
        if (resp.data?.status === 0) {
          const address = resp.data.result?.formatted_addresses?.recommend || resp.data.result?.address || ''
          if (address) {
            resolve(address)
            return
          }
          reject(new Error('腾讯地图未返回地址'))
          return
        }
        reject(new Error(resp.data?.message || '地址解析失败'))
      },
      fail: error => reject(new Error(error?.errMsg || '地址解析请求失败')),
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
    const scene = scanResult.path?.match(/[?&]scene=([^&]+)/)?.[1]
    const md5Value = (scene ? decodeURIComponent(scene) : scanResult.result || '').toLowerCase()
    if (!/^[a-f0-9]{32}$/i.test(md5Value))
      throw new Error('请扫描有效的维保码')

    const verified = await othersApi.workflowInstanceVerifyOnsiteCode(instanceId.value, md5Value)
    if (!verified) {
      onsiteCode.value = ''
      onsiteCodeVerified.value = false
      onsiteCodeVerificationFailed.value = true
      throw new Error('维保码比对错误')
    }

    onsiteCode.value = md5Value.toLowerCase()
    onsiteCodeVerified.value = true
    onsiteCodeVerificationFailed.value = false
    const position = await getLocation()
    location.longitude = position.longitude
    location.latitude = position.latitude
    location.address = ''
    location.addressError = ''
    try {
      location.address = await getRecommendedAddress(position.latitude, position.longitude)
    }
    catch (error) {
      location.address = ''
      location.addressError = error?.message?.includes('url not in domain list')
        ? '请配置腾讯地图请求合法域名'
        : '地址解析失败'
      console.warn('地址解析失败', error)
    }
  }
  catch (error) {
    if (error?.errMsg?.includes('cancel'))
      return
    if (error?.message === '请扫描有效的维保码' || error?.message === '维保码比对错误') {
      onsiteCode.value = ''
      onsiteCodeVerified.value = false
      onsiteCodeVerificationFailed.value = error.message === '维保码比对错误'
    }
    const permissionDenied = error?.message?.includes('location permission denied')
      || error?.errMsg?.includes('permission')
      || error?.errMsg?.includes('auth deny')
    toast.error({ msg: permissionDenied ? '请在小程序设置中允许位置权限' : error?.message || error?.errMsg || '扫描或获取位置失败' })
  }
  finally {
    scanning.value = false
  }
}

const debouncedCreateWorkOrder = debounce(createWorkOrder, 500, { edges: ['leading'] })
const debouncedSubmitAction = debounce(submitAction, 500, { edges: ['leading'] })
const debouncedRecallAndReassign = debounce(recallAndReassign, 500, { edges: ['leading'] })

onLoad((options) => {
  instanceId.value = options?.instanceId || ''
  scannedProjectScene.value = getScanScene(options)
  if (!instanceId.value)
    preloadProjectGroups()
})

function getScanScene(options) {
  const scene = options?.scene || options?.q?.match(/[?&]scene=([^&]+)/)?.[1] || ''
  try {
    return decodeURIComponent(scene)
  }
  catch {
    return scene
  }
}

onShow(async () => {
  await uni.$onLaunched
  if (initialized.value)
    return
  initialized.value = true
  await init()
})
</script>

<style lang="scss" scoped>
@use './scss/maintenance.scss';

.onsite-code-verified {
  display: flex;
  align-items: center;
  gap: 6px;
  color: #37c062;
  font-weight: 600;
}

.onsite-transfer-switch {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.onsite-transfer-switch .field-title {
  margin-bottom: 0;
}

:deep(.create-certification-notice) {
  margin-bottom: 10px;
}

.onsite-code-verification-failed {
  display: flex;
  align-items: center;
  gap: 6px;
  color: #e34d59;
  font-weight: 600;
}

.project-year-filter {
  width: 100%;
  min-width: 0;
  margin: 20px 0;
}

.project-year-filter picker {
  display: block;
  width: 100%;
}

.project-year-picker-value {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  height: 38px;
  padding: 0 10px;
  border-radius: 8px;
  box-sizing: border-box;
  background: #f5f6f8;
  color: #333;
  font-size: 14px;
  white-space: nowrap;
}

.solution-result-options {
  margin: 16px 0 20px;
}

:deep(.urgency-options) {
  --wot-radio-button-margin: 0 20px 0 0;

  background: transparent !important;
}

:deep(.readonly-textarea) {
  --wot-textarea-bg: #fff6eb;
  --wot-textarea-padding: 12px 16px;

  border-radius: 8px;
}

.recall-button {
  display: flex;
  justify-content: center;
  margin: 6px 0 14px;
}

:deep(.recall-button-control) {
  width: 150px;
  height: 40px;
  border: 1px solid #d0d5dd !important;
  border-radius: 8px;
  background: #f2f4f7 !important;
  color: #667085 !important;
  font-size: 14px;
}

:deep(.maintenance-media-upload .wd-upload__evoke.is-disabled) {
  display: none !important;
}
</style>

<style>
page {
  background: #f8f9fa;
}

.wd-textarea__count {
  width: 100%;
  text-align: right;
  white-space: nowrap;
}

.page-container .wd-input,
.page-container .wd-input__inner,
.page-container .wd-textarea,
.page-container .wd-textarea__inner,
.page-container .picker-value,
.page-container .person-picker {
  box-shadow: none !important;
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
  background: #fff;
  overflow: hidden;
  border-radius: inherit;
}

.maintenance-media-upload .wd-upload__progress-txt {
  display: none;
}

.maintenance-media-upload-evoke {
  background-color: #fff !important;
}

.maintenance-media-upload .wd-upload__picture,
.maintenance-media-upload .wd-upload__video,
.maintenance-media-upload .wd-upload__file {
  border-radius: inherit;
}

.maintenance-media-upload .wd-upload__video video {
  object-fit: cover;
}

.compact-textarea {
  height: 72px;
}

.action-card .wd-textarea,
.action-card .person-picker {
  border: 1px solid #e7e9ee;
  border-radius: 8px;
}

:deep(.compact-input) {
  padding: 12px 15px;
  border-radius: 8px;
  background: #f5f6f8;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.025);
}

.create-form .maintenance-media-upload .wd-upload__preview,
.create-form .maintenance-media-upload .wd-upload__evoke,
.action-card .maintenance-media-upload .wd-upload__preview,
.action-card .maintenance-media-upload .wd-upload__evoke {
  border-radius: 8px;
}

.action-card .maintenance-media-upload .wd-upload__preview .wd-upload__status-content,
.action-card .maintenance-media-upload .wd-upload__evoke {
  background: #f6f6f7 !important;
}

.create-form .maintenance-media-upload-evoke {
  background: #f7f8fa !important;
  border: 0 !important;
}

.history-card .maintenance-media-upload .wd-upload__preview,
.history-card .maintenance-media-upload .wd-upload__picture,
.history-card .maintenance-media-upload .wd-upload__video,
.history-card .maintenance-media-upload .wd-upload__file {
  background: #f6f6f7;
}
</style>
