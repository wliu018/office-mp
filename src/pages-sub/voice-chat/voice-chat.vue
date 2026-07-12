<template>
  <wd-navbar
    placeholder left-arrow safe-area-inset-top fixed title="语音助手"
    style="--wot-navbar-background:transparent;--wot-color-border-light:transparent"
    @click-left="uni.navigateBack()"
  />
  <view class="voice-chat-container">
    <!-- 对话区域 -->
    <scroll-view
      :scroll-y="true"
      :scroll-into-view="scrollIntoView"
      :scroll-with-animation="true"
      class="chat-scroll-view"
    >
      <view class="chat-messages">
        <view
          v-for="(item, index) in messages"
          :id="`msg-${index}`"
          :key="index"
          class="message-item"
          :class="item.type === 'user' ? 'user-message' : 'assistant-message'"
        >
          <view class="message-bubble">
            <view class="message-content">
              {{ item.content }}
            </view>
            <view class="message-time">
              {{ item.time }}
            </view>
          </view>
        </view>
        <!-- 正在识别提示 -->
        <view v-if="isRecognizing" class="message-item assistant-message">
          <view class="message-bubble recognizing">
            <wd-icon name="loading" size="16px" />
            <text class="ml-2">正在识别语音...</text>
          </view>
        </view>
        <!-- 正在回复提示 -->
        <view v-if="isWaitingResponse" class="message-item assistant-message">
          <view class="message-bubble waiting">
            <wd-icon name="loading" size="16px" />
            <text class="ml-2">正在获取回复...</text>
          </view>
        </view>
      </view>
    </scroll-view>

    <!-- 语音输入提示 -->
    <view v-if="isRecording" class="recording-indicator">
      <view class="recording-animation">
        <view class="wave-bar" :style="{ height: waveHeight1 }" />
        <view class="wave-bar" :style="{ height: waveHeight2 }" />
        <view class="wave-bar" :style="{ height: waveHeight3 }" />
        <view class="wave-bar" :style="{ height: waveHeight4 }" />
        <view class="wave-bar" :style="{ height: waveHeight5 }" />
      </view>
      <text class="recording-text">正在录音...</text>
      <text class="recording-duration">{{ recordingDuration }}s</text>
    </view>

    <!-- 底部麦克风按钮 -->
    <view class="mic-button-area">
      <view
        class="mic-button"
        :class="{ recording: isRecording }"
        @touchstart="startRecording"
        @touchend="stopRecording"
        @touchcancel="stopRecording"
        @click="isPcMode ? showSimulateInputDialog() : null"
        @longpress.prevent
      >
        <wd-icon
          :name="isRecording ? 'chart-bar' : 'service'"
          size="32px"
          :color="isRecording ? '#fff' : '#666'"
        />
      </view>
      <text class="mic-hint">{{ isPcMode ? '点击输入文字（PC调试模式）' : '按住说话，松开发送' }}</text>
    </view>
  </view>
  <wd-toast />
  <wd-popup v-model="showInputDialog" position="bottom" custom-style="border-radius: 24rpx 24rpx 0 0;">
    <view class="input-dialog">
      <view class="input-dialog-title">
        文本输入（PC端调试）
      </view>
      <wd-input
        v-model="inputText"
        placeholder="请输入要发送的消息"
        clearable
        custom-style="margin: 20rpx 0;"
      />
      <view class="input-dialog-actions">
        <wd-button size="small" @click="showInputDialog = false">
          取消
        </wd-button>
        <wd-button type="primary" size="small" @click="sendInputText">
          发送
        </wd-button>
      </view>
    </view>
  </wd-popup>
</template>

<script setup>
import { nextTick, onMounted, ref } from 'vue'
import { useToast } from 'wot-design-uni'
import { othersApi } from '@/api/others-api'
import { useUserStore } from '@/store/user'

definePage({
  style: {
    navigationStyle: 'custom',
    navigationBarTitleText: '语音助手',
    disableScroll: true,
  },
})

const toast = useToast()

// 消息列表
const messages = ref([])
const scrollIntoView = ref('')
const isRecording = ref(false)
const isRecognizing = ref(false)
const isWaitingResponse = ref(false)

// 文本输入对话框（PC端调试）
const showInputDialog = ref(false)
const inputText = ref('')
const isPcMode = ref(false)

// 录音相关
const recorderManager = ref(null)
const recordingDuration = ref(0)
const recordingTimer = ref(null)
const waveHeight1 = ref('8px')
const waveHeight2 = ref('12px')
const waveHeight3 = ref('16px')
const waveHeight4 = ref('12px')
const waveHeight5 = ref('8px')
const waveTimer = ref(null)

// 初始化录音管理器
onMounted(() => {
  // 检测运行平台
  const systemInfo = uni.getSystemInfoSync()
  const platform = systemInfo.platform
  isPcMode.value = platform === 'windows' || platform === 'mac' || platform === 'devtools'

  // 添加欢迎消息
  const welcomeMsg = isPcMode.value
    ? '您好！当前处于PC调试模式，点击麦克风按钮可以输入文字进行测试。真机环境下可使用语音功能。'
    : '您好！按住底部麦克风按钮开始说话，松开后会自动识别并发送。'
  addMessage('assistant', welcomeMsg)

  recorderManager.value = uni.getRecorderManager()

  // 录音结束回调
  recorderManager.value.onStop((res) => {
    console.log('录音结束', res)
    if (res.duration < 500) {
      toast.show({ msg: '录音时间太短', icon: 'error' })
      return
    }
    // 上传语音进行识别
    uploadAndRecognize(res.tempFilePath)
  })

  // 录音错误回调
  recorderManager.value.onError((err) => {
    console.error('录音错误', err)
    toast.show({ msg: '录音失败', icon: 'error' })
    stopRecordingState()
  })
})

// 开始录音
function startRecording() {
  if (!recorderManager.value) {
    toast.show({ msg: '录音功能初始化失败', icon: 'error' })
    return
  }

  // 检查是否在PC端，PC端不支持录音
  const systemInfo = uni.getSystemInfoSync()
  const platform = systemInfo.platform
  if (platform === 'windows' || platform === 'mac' || platform === 'devtools') {
    toast.show({ msg: '录音功能需要在手机上使用，请真机调试', icon: 'error', duration: 3000 })
    // PC端可以模拟输入，方便开发调试
    showSimulateInputDialog()
    return
  }

  wx.vibrateShort({ type: 'light' })
  isRecording.value = true
  recordingDuration.value = 0

  // 开始计时
  recordingTimer.value = setInterval(() => {
    recordingDuration.value++
    // 最长60秒
    if (recordingDuration.value >= 60) {
      stopRecording()
    }
  }, 1000)

  // 波浪动画
  waveTimer.value = setInterval(() => {
    const heights = ['8px', '20px', '32px', '16px', '24px', '12px', '28px', '8px']
    const randomHeights = heights.slice().sort(() => Math.random() - 0.5)
    waveHeight1.value = randomHeights[0]
    waveHeight2.value = randomHeights[1]
    waveHeight3.value = randomHeights[2]
    waveHeight4.value = randomHeights[3]
    waveHeight5.value = randomHeights[4]
  }, 150)

  // 开始录音
  recorderManager.value.start({
    duration: 60000,
    sampleRate: 16000,
    numberOfChannels: 1,
    encodeBitRate: 96000,
    format: 'mp3',
  })
}

// 停止录音
function stopRecording() {
  if (!isRecording.value)
    return

  wx.vibrateShort({ type: 'light' })
  stopRecordingState()

  if (recorderManager.value) {
    recorderManager.value.stop()
  }
}

// 停止录音状态（清理定时器等）
function stopRecordingState() {
  isRecording.value = false

  if (recordingTimer.value) {
    clearInterval(recordingTimer.value)
    recordingTimer.value = null
  }

  if (waveTimer.value) {
    clearInterval(waveTimer.value)
    waveTimer.value = null
  }

  // 重置波浪高度
  waveHeight1.value = '8px'
  waveHeight2.value = '12px'
  waveHeight3.value = '16px'
  waveHeight4.value = '12px'
  waveHeight5.value = '8px'
}

// 上传并识别语音
async function uploadAndRecognize(filePath) {
  isRecognizing.value = true
  console.log('开始上传并识别语音')
  try {
    const baseUrl = import.meta.env.VITE_SERVER_BASEURL
    // 上传语音文件
    const uploadRes = await new Promise((resolve, reject) => {
      uni.uploadFile({
        url: `${baseUrl}/ai/voiceRecognitionByFile`,
        filePath,
        name: 'file',
        header: {
          token: useUserStore().token,
        },
        formData: {
          openId: useUserStore().openId,
          user: useUserStore().openId,
        },
        success: (res) => {
          console.log('识别结果', res)
          if (res.statusCode === 200) {
            const { data } = JSON.parse(res.data)
            resolve(data)
          }
          else {
            reject(new Error('上传失败'))
          }
        },
        fail: err => reject(err),
      })
    })
    console.log('识别结果', uploadRes.text)
    // 获取识别的文本
    const recognizedText = uploadRes?.text || ''

    if (recognizedText) {
      // 添加用户消息
      addMessage('user', recognizedText)
      isRecognizing.value = false

      // 发送到后台获取回复
      await getAssistantResponse(recognizedText)
    }
    else {
      toast.show({ msg: '未能识别语音内容', icon: 'error' })
      isRecognizing.value = false
    }
  }
  catch (error) {
    console.error('语音识别失败', error)
    toast.show({ msg: '语音识别失败', icon: 'error' })
    isRecognizing.value = false
  }
}

// 获取后台回复
async function getAssistantResponse(userText) {
  isWaitingResponse.value = true

  try {
    const res = await othersApi.appointmentChat({
      content: userText,
      userId: useUserStore().openId,
    })
    console.log('助手回复', res)
    const replyText = res?.intentResponse.missingFieldsText || '抱歉，我暂时无法回答这个问题。'
    // 添加助手回复消息
    addMessage('assistant', replyText)
  }
  catch (error) {
    console.error('获取回复失败', error)
    addMessage('assistant', `收到您的消息："${userText}"。`)
  }
  finally {
    isWaitingResponse.value = false
  }
}

// 添加消息
function addMessage(type, content) {
  const now = new Date()
  const time = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`

  messages.value.push({
    type,
    content,
    time,
  })

  // 滚动到最后一条消息
  nextTick(() => {
    scrollIntoView.value = `msg-${messages.value.length - 1}`
  })
}

// PC端调试：显示文本输入对话框
function showSimulateInputDialog() {
  inputText.value = ''
  showInputDialog.value = true
}

// PC端调试：发送文本输入
async function sendInputText() {
  if (!inputText.value.trim()) {
    toast.show({ msg: '请输入消息内容', icon: 'error' })
    return
  }

  showInputDialog.value = false
  const text = inputText.value.trim()

  // 添加用户消息
  addMessage('user', text)

  // 发送到后台获取回复
  await getAssistantResponse(text)
}
</script>

<style lang="scss" scoped>
@import './scss/voice-chat.scss';
</style>

<style>
page {
  background: linear-gradient(180deg, #f5f7fa 0%, #e4e8ed 100%);
}
</style>
