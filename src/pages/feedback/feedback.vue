<template>
  <div style="height: 0;">
    <wd-navbar
      placeholder left-arrow safe-area-inset-top fixed title="意见反馈"
      style="--wot-navbar-background:transparent;--wot-color-border-light:transparent"
      @click-left="uni.navigateBack()"
    />
  </div>
  <div :style="`height: ${navBarConfig.customNavBarHeight}px;`" />
  <div class="relative">
    <scroll-view :scroll-y="false" :enable-back-to-top="true" :style="`height: calc(100vh - ${navBarConfig.customNavBarHeight}px);`">
      <view
        class="container relative box-border p-[20px]"
      >
        <wd-form ref="uForm" :model="model">
          <div class="feedback-title mb-[10px] text-[15px] text-[#333]">
            意见或建议<span class="text-[#FF0000]">*</span>
          </div>
          <wd-textarea
            v-model="model.content"
            style="box-shadow: 0 5px 10px rgba(0,0,0,0.05); border-radius: 2px; "
            :maxlength="200"
            show-word-limit
            prop="content" clearable placeholder="请输入意见或建议" :rules="[{ required: true, message: '请输入意见或建议' }]"
          />
          <div class="feedback-title mb-[10px] mt-[10px] text-[15px] text-[#333]">
            上传图片
          </div>
          <wd-upload
            v-model:file-list="fileList"
            :limit="1"
            :reupload="false"
            :upload-method="customUpload"
            :show-limit-num="false"
            @before-upload="beforeUpload"
            @remove="deletePic"
            @change="handleChange"
          />
          <view class="footer">
            <wd-button type="primary" size="large" block custom-style="background: linear-gradient(115deg, #3D7DFE 8.4%, #6A59FE 52.29%, #9142FF 93.72%);" @click="submitFeedback">
              提交
            </wd-button>
          </view>
        </wd-form>
      </view>
    </scroll-view>
  </div>
  <wd-toast />
  <loadingBox :show="wdLoading" />
</template>

<script setup>
import { inject, reactive, ref } from 'vue'
import { useToast } from 'wot-design-uni'
import { othersApi } from '@/api/others-api'
import loadingBox from '@/components/global-loading-box.vue'
import { useUserStore } from '@/store/user'

// 注入全局属性
const navBarConfig = inject('navBarConfig')

const apiUrl = import.meta.env.VITE_SERVER_BASEURL

const openId = useUserStore().openId
const toast = useToast()
const globalLoadingShow = ref(false)
const wdLoading = ref(false)

definePage({
  style: {
    navigationStyle: 'custom',
    navigationBarTitleText: '意见反馈',
  },
})

const fileList = ref([])
const uploadFilePath = ref(`${apiUrl}/file/fileUpload`)
function beforeUpload({ files, fileList, resolve }) {
  console.log('beforeUpload beforeUpload beforeUpload')
  console.log(files, 'files')
  console.log(fileList, 'fileList')
  return false
}

function handleChange(fileList) {
  console.log(fileList, 'fileList')
  fileList.value = fileList
}
const model = reactive({
  content: '',
  openId,
})

const { success: showSuccess } = useToast()

const uForm = ref()

async function submitFeedback() {
  uForm.value.validate().then((valid) => {
    console.log('valid', valid)
    if (valid.valid) {
      if (fileList.value.length > 0) {
        model.imgId = fileList.value?.[0]?.id
      }
      othersApi.addFeedback(model).then((result) => {
        console.log('提交反馈结果', result)
        if (result) {
          uni.showToast({
            title: '提交成功',
            icon: 'success',
          })
          setTimeout(() => {
            uni.navigateBack()
          }, 1000)
        }
      })
    }
  })
}

async function customUpload(file, formData, options) {
  // 当设置 mutiple 为 true 时, file 为数组格式，否则为对象格式
  fileList.value = []
  const lists = [].concat(file)
  console.log('file', file)
  let fileListLen = fileList.value.length
  console.log('fileListLen', fileListLen)
  if (fileListLen >= 1) {
    fileList.value.splice(1, 1)
    file.status = 'success'
    console.log('fileList', fileList.value)
    return true
  }
  else {
    lists.forEach((item) => {
      fileList.value.push({
        ...item,
      })
    })
    console.log('lists', lists)
    for (let i = 0; i < lists.length; i++) {
      const result = await uploadFilePromise(lists[i].url)
      const res = JSON.parse(result)
      console.log('JSON.parse(result)', res)
      const item = fileList.value[fileListLen]
      fileList.value.splice(fileListLen, 1, {
        ...item,
        status: 'success',
        message: '',
        id: res[0].code,
        url: res[0].src,
      })
      fileListLen++
    }
    console.log('fileList', fileList.value[0].id)
  }
}
async function uploadFilePromise(url) {
  console.log('uploadFilePath', uploadFilePath.value)
  console.log('uploadFilePromise', url)
  return new Promise((resolve) => {
    uni.uploadFile({
      url: uploadFilePath.value,
      filePath: url,
      name: 'file',
      formData: {
        user: openId,
        openId,
      },
      success: (res) => {
        console.log('res', res)
        setTimeout(() => {
          resolve(res.data)
        }, 1000)
      },
    })
  })
}

// 删除图片
function deletePic({ file }) {
  fileList.value = []
}
</script>

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
.wd-textarea__count {
  width: 60px;
  justify-content: flex-end;
}
</style>

<style lang="scss" scoped>
@import './scss/feedback.scss';
</style>
