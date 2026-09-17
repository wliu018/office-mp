<template>
  <div class="page">
    <view class="container">
      <view class="content">
        <div
          class="user-wrapper"
          style="padding: 10px; background-color: #fff"
          @click="openAvatarModal()"
        >
          <div class="avatar-wrapper" style="position: relative">
            <!-- <image src="/static/images/icon-preview.png" mode="aspectFill" style="opacity: 0.2;position: absolute;left:0;top:0;width: 100%; height: 100%; z-index: 1;" /> -->
            <div class="avatar" style="background-color: #fff; z-index: 2">
              <image :src="avatar" />
              <view v-if="avatar !== '/static/images/avatar.png'" class="avatar-edit-icon">
                <wd-icon name="edit" size="14" color="#fff" />
              </view>
            </div>
            <!-- <div class="edit">
              <wd-icon name="refresh" color="#05f" size="12" />
            </div> -->
          </div>
        </div>

        <!-- <div class="section">
          <div>
            <wd-tag type="warning" size="large" mark variant="plain">
              {{ type === 0 ? '未认证' : '已认证' }}
            </wd-tag>
          </div>
          <div class="flex items-center p-[10px] pl-0 pr-0">
            <wd-icon stop bold name="user" size="18" color="#999" />
            <div class="w-full pl-[10px] text-[18px]">
              <wd-input v-model="name" size="large" :readonly="type !== 0" type="text" placeholder="请输入姓名" />
            </div>
          </div>
          <div class="flex items-center p-[10px] pl-0 pr-0">
            <wd-icon stop bold name="organization" size="18" color="#999" />
            <div class="w-full pl-[10px]">
              <wd-input v-model="department" size="large" :readonly="type !== 0" type="text" placeholder="请输入所属部门" />
            </div>
          </div>

          <div v-if="type === 0" class="flex items-center p-[20px] pl-0 pr-0">
            <div class="align-center w-full flex justify-center pl-[10px]">
              <wd-button round icon="check-circle-fill" custom-class="submit-btn">
                {{ type === 0 ? '提交认证' : '保存修改' }}
              </wd-button>
            </div>
          </div>
        </div> -->
        <div
          class="section relative bg-white"
          style="--wot-input-disabled-color: #a3a2a2"
        >
          <div class="flex pl-[15px]">
            <wd-tag
              v-if="type === 1"
              custom-class="tag-custom-class"
              type="warning"
              size="large"
              variant="plain"
            >
              审核中
            </wd-tag>
            <wd-tag
              v-else-if="type === 2"
              custom-class="tag-custom-class"
              type="success"
              size="large"
              variant="plain"
            >
              已认证
            </wd-tag>
            <wd-tag
              v-else-if="type === 3"
              custom-class="tag-custom-class"
              type="danger"
              size="large"
              variant="plain"
            >
              认证未通过
            </wd-tag>
            <wd-tag
              v-else
              custom-class="tag-custom-class"
              type="primary"
              size="large"
              variant="plain"
            >
              未认证
            </wd-tag>
          </div>
          <wd-form
            ref="form"
            :model="model"
            :schema="certificationSchema"
            error-type="toast"
            size="large"
            title-width="100px"
          >
            <wd-cell-group border>
              <wd-form-item
                style="--wot-cell-padding: 12px"
                title="姓名"
                prop="name"
                required
              >
                <wd-input
                  v-model="model.name"
                  no-border
                  :disabled="!canSubmitCertification"
                  custom-style="--wot-input-inner-font-size: 16px"
                  custom-input-class="username-custom-input-class"
                  clearable
                  placeholder="请输入姓名"
                />
              </wd-form-item>

              <wd-cell
                v-if="canSubmitCertification && !hasPhoneNumber"
                title-width="0px"
              >
                <div class="flex items-center p-[20px] pl-0 pr-0">
                  <div
                    class="align-center w-full flex justify-center pl-[10px]"
                  >
                    <wd-button
                      round
                      block
                      type="primary"
                      open-type="getPhoneNumber"
                      @getphonenumber="getphonenumber"
                    >
                      授权手机号
                    </wd-button>
                  </div>
                </div>
              </wd-cell>

              <wd-form-item
                v-if="hasPhoneNumber || !canSubmitCertification"
                style="--wot-cell-padding: 12px"
                title="公司"
                required
              >
                <picker
                  :value="selectedCompanyIndex"
                  :disabled="!canSubmitCertification"
                  :range="companyList"
                  range-key="name"
                  @change="bindCompanyChange($event)"
                >
                  <view class="picker text-align-left">
                    <view
                      class="!text-right"
                      :class="!canSubmitCertification ? '!text-[#C5C5C5]' : ''"
                    >
                      {{ model.companyName || "请选择公司" }}
                      <wd-icon
                        name="right"
                        size="18"
                        color="rgba(0, 0, 0, 0.25)"
                      />
                    </view>
                  </view>
                </picker>
              </wd-form-item>

              <wd-form-item
                v-if="
                  (hasPhoneNumber || !canSubmitCertification)
                    && model.companyName
                "
                style="--wot-cell-padding: 12px"
                title="部门"
                required
              >
                <picker
                  :value="selectedDepartmentIndex"
                  :disabled="!canSubmitCertification"
                  :range="selectedDepartmentList"
                  range-key="name"
                  @change="bindPickerChange($event)"
                >
                  <view class="picker text-align-left">
                    <view
                      class="!text-right"
                      :class="!canSubmitCertification ? '!text-[#C5C5C5]' : ''"
                    >
                      {{ selectedDepartmentName || "请选择部门" }}
                      <wd-icon
                        name="right"
                        size="18"
                        color="rgba(0, 0, 0, 0.25)"
                      />
                    </view>
                  </view>
                </picker>
              </wd-form-item>

              <template
                v-if="
                  showLicensePlates
                    && (hasPhoneNumber || !canSubmitCertification)
                "
              >
                <wd-form-item
                  v-for="(item, index) in model.code"
                  :key="item.key"
                  :value="item.value"
                  :title="`车牌号${index + 1}`"
                  is-link
                  @click="showKeyBoard2(index)"
                />
                <wd-keyboard
                  v-for="(item, index) in model.code"
                  :key="item.key"
                  v-model="item.value"
                  v-model:visible="item.visible"
                  custom-style1="margin-bottom: 100px;"
                  :modal="true"
                  root-portal
                  mode="car"
                  auto-switch-lang
                  @input="onInput(index, $event)"
                  @delete="onDelete(index, $event)"
                />
                <wd-cell title-width="0px">
                  <view class="footer">
                    <wd-button
                      round
                      size="small"
                      type="info"
                      icon="plus-circle"
                      @click="addCode"
                    >
                      添加车牌号
                    </wd-button>
                    <wd-button
                      round
                      size="small"
                      type="info"
                      icon="minus-circle"
                      @click="removeCode"
                    >
                      删除
                    </wd-button>
                  </view>
                </wd-cell>
              </template>
              <wd-cell
                v-if="canSubmitCertification && hasPhoneNumber"
                title-width="0px"
              >
                <div class="flex items-center p-[20px] pl-0 pr-0">
                  <div
                    class="align-center w-full flex justify-center pl-[10px]"
                  >
                    <wd-button
                      round
                      icon="check-circle-fill"
                      custom-class="submit-btn !w-[80%] !h-[45px]"
                      custom-style="background: linear-gradient(115deg, #3D7DFE 8.4%, #6A59FE 52.29%, #9142FF 93.72%);"
                      @click="submit"
                    >
                      提交认证
                    </wd-button>
                  </div>
                </div>
              </wd-cell>
            </wd-cell-group>
          </wd-form>
        </div>
      </view>
    </view>
    <wd-toast ref="uToastRef" />
    <authModal
      v-model:show-auth="showAuth"
      :txt="avatarModalText"
      @login-callback="handleAvatarUploaded"
      @hide="authModalHide"
    />
    <loadingBox :show="wdLoading" />
  </div>
</template>

<script>
import { loginApi } from '@/api/login/login-api.js'
import { simpleLoginApi } from '@/api/login/simple-login-api.js'

import { authModal } from '@/components/auth-modal.vue'
import loadingBox from '@/components/global-loading-box.vue'
import { useUserStore } from '@/store/user'
import { requestWorkOrderSubscribe } from '@/utils/subscribe-message'

const openId = useUserStore().openId
const app = getApp()

definePage({
  style: {
    navigationBarTitleText: '我的',
  },
})

const certificationSchema = {
  validate(model) {
    return model.name ? [] : [{ path: ['name'], message: '请填写姓名' }]
  },
  isRequired(path) {
    return path === 'name'
  },
}

export default {
  components: {
    authModal,
    loadingBox,
  },
  data() {
    return {
      wdLoading: true,
      showAuth: false,
      avatarModalText: '修改头像',
      showLicensePlates: false,
      avatar: '/static/images/avatar.png',
      name: '',
      type: 0,
      department: '',
      list: [],
      nameEdit: false,
      contactEdit: false,
      phoneNumber: '',
      phoneAuthorized: false,
      certificationSchema,
      model: {
        name: '',
        companyName: '',
        department: '',
        openId,
        code: [
          {
            key: Date.now(),
            value: '',
            visible: false,
          },
        ],
      },
      companyList: [],
      departmentList: [],
    }
  },
  computed: {
    canSubmitCertification() {
      return this.type === 0 || this.type === 3
    },
    hasPhoneNumber() {
      return this.phoneAuthorized || Boolean(this.phoneNumber?.trim())
    },
    selectedCompanyIndex() {
      return this.companyList.findIndex(
        item => item.name === this.model.companyName,
      )
    },
    selectedDepartmentList() {
      const company = this.companyList[this.selectedCompanyIndex]
      if (!company) {
        return []
      }
      return this.departmentList.filter(
        item => String(item.companyId) === String(company.id),
      )
    },
    selectedDepartmentIndex() {
      return this.selectedDepartmentList.findIndex(
        item => String(item.id) === String(this.model.department),
      )
    },
    selectedDepartmentName() {
      return (
        this.selectedDepartmentList[this.selectedDepartmentIndex]?.name || ''
      )
    },
  },
  async onShow() {
    await uni.$onLaunched
    this.pageInit()
  },
  mounted() {
    console.log('---------------')
    this.pageInit()
  },
  methods: {
    openAvatarModal(text = '修改头像', allowBeforeCertification = false) {
      if (this.type === 0 && !allowBeforeCertification) {
        return
      }
      this.avatarModalText = text
      this.showAuth = true
    },
    bindPickerChange(e) {
      console.log('bindPickerChange', e)
      this.model.department
        = this.selectedDepartmentList[e.detail.value]?.id || ''
    },
    bindCompanyChange(e) {
      this.model.companyName = this.companyList[e.detail.value]?.name || ''
      this.model.department = ''
      if (this.model.companyName === '其他') {
        this.model.department = this.selectedDepartmentList[0]?.id || ''
      }
    },
    onInput(index, value) {
      console.log('onInput', index, value)
      this.model.code[index].value = value
    },
    onDelete(index, value) {
      console.log('onDelete', index, value)
      this.model.code[index].value = value
    },
    showKeyBoard2(index) {
      this.model.code[index].visible = true
      console.log('showKeyBoard2', index)
    },
    removeCode() {
      this.model.code.splice(this.model.code.length - 1, 1)
    },
    addCode() {
      if (this.model.code.length < 3) {
        this.model.code.push({
          key: Date.now(),
          value: '',
          visible: false,
        })
      }
      else {
        uni.showToast({
          title: '最多添加3个车牌号',
          duration: 1000,
          icon: 'none',
        })
      }
    },
    reset() {
      this.$refs.form.reset()
    },
    async submit() {
      if (this.avatar === '/static/images/avatar.png') {
        this.openAvatarModal('上传头像', true)
        return
      }
      if (this.canSubmitCertification && !(await requestWorkOrderSubscribe()))
        return
      try {
        await this.getCertificationLocation()
      }
      catch {
        uni.showToast({
          title: '未获取位置，无法提交认证',
          icon: 'none',
        })
        return
      }
      this.$refs.form.validate().then(async (valid) => {
        if (valid.valid) {
          console.log('submit', valid)
          console.log('submit', this.model)
          const department = this.selectedDepartmentName
          if (!this.model.companyName) {
            uni.showToast({
              title: '请选择公司',
              duration: 1000,
              icon: 'none',
            })
            return
          }
          if (!department) {
            uni.showToast({
              title: '请选择部门',
              duration: 1000,
              icon: 'none',
            })
            return
          }
          const licensePlates = this.model.code
            .map(i => i.value)
            .filter(i => i !== '')
          const params = { ...this.model, code: licensePlates, department }
          console.log('params', params)
          const result = await simpleLoginApi.updateEmployeeInfo(params)
          if (result) {
            this.type = 1
            uni.showToast({
              title: '保存成功',
              duration: 1000,
            })
          }
        }
      })
    },
    async nameEditClick(type) {
      if (type === 1) {
        this.nameEdit = true
      }
      else {
        await this.getname()
      }
    },
    async contactEditClick(type) {
      if (type === 1) {
        this.contactEdit = true
      }
      else {
        await this.confirm()
      }
    },
    async confirm() {
      // eslint-disable-next-line ts/no-this-alias
      const _this = this
      const value = this.contact
      const result = test.mobile(value)
      console.log('confirm', value)
      if (result) {
        const { openId } = useUserStore()
        await simpleLoginApi
          .updatePhoneNumber({
            openId,
            phoneNumber: value,
          })
          .then((r) => {
            if (r) {
              uni.showToast({
                title: '保存成功',
                duration: 1000,
              })
            }
          })
          .finally(() => {
            _this.contactEdit = false
          })
      }
      else {
        uni.showToast({
          title: '请输入正确的手机号码',
          duration: 1000,
          icon: 'none',
        })
      }
    },
    async getname() {
      // eslint-disable-next-line ts/no-this-alias
      const _this = this
      const value = this.name
      const { openId } = useUserStore()
      if (value) {
        this.name = value
        await simpleLoginApi
          .updateNickname({
            openId,
            nickname: value,
          })
          .then((result) => {
            if (result) {
              uni.showToast({
                title: '保存成功',
                duration: 1000,
              })
            }
          })
          .finally(() => {
            _this.nameEdit = false
          })
      }
      else {
        uni.showToast({
          title: '请输入昵称',
          duration: 1000,
          icon: 'none',
        })
      }
    },
    authModalHide() {
      console.log('authModalHide')
      this.showAuth = false
    },
    getCertificationLocation() {
      return new Promise((resolve, reject) => {
        uni.getSetting({
          success: (setting) => {
            const locationAuth = setting.authSetting?.['scope.userLocation']
            const getPosition = () =>
              uni.getLocation({
                type: 'gcj02',
                success: resolve,
                fail: reject,
              })
            if (locationAuth === false) {
              uni.showModal({
                title: '位置权限未开启',
                content: '认证需要获取您的位置，请前往设置开启位置权限',
                confirmText: '去设置',
                success: (modal) => {
                  if (!modal.confirm) {
                    reject(new Error('location permission denied'))
                    return
                  }
                  uni.openSetting({
                    success: (result) => {
                      if (result.authSetting?.['scope.userLocation'])
                        getPosition()
                      else reject(new Error('location permission denied'))
                    },
                    fail: reject,
                  })
                },
                fail: reject,
              })
              return
            }
            getPosition()
          },
          fail: reject,
        })
      })
    },
    async handleAvatarUploaded(avatarUrl) {
      const { openId } = useUserStore()
      this.avatar = await this.cacheAvatar(avatarUrl, openId)
      this.showAuth = false
    },
    avatarCacheKey(openId) {
      return `me-avatar:${openId}`
    },
    async loadCachedAvatar(openId) {
      const cacheKey = this.avatarCacheKey(openId)
      const cachedAvatar = uni.getStorageSync(cacheKey)
      if (!cachedAvatar?.path) {
        return ''
      }
      try {
        await new Promise((resolve, reject) => {
          uni.getFileInfo({
            filePath: cachedAvatar.path,
            success: resolve,
            fail: reject,
          })
        })
        return cachedAvatar.path
      }
      catch {
        uni.removeStorageSync(cacheKey)
        return ''
      }
    },
    async cacheAvatar(avatarUrl, openId) {
      if (!avatarUrl) {
        return ''
      }
      const cacheKey = this.avatarCacheKey(openId)
      const cachedAvatar = uni.getStorageSync(cacheKey)
      if (cachedAvatar?.url === avatarUrl) {
        const localAvatar = await this.loadCachedAvatar(openId)
        if (localAvatar) {
          return localAvatar
        }
      }
      try {
        const downloadResult = await new Promise((resolve, reject) => {
          uni.downloadFile({
            url: avatarUrl,
            success: resolve,
            fail: reject,
          })
        })
        if (downloadResult.statusCode !== 200) {
          return avatarUrl
        }
        const saveResult = await new Promise((resolve, reject) => {
          uni.saveFile({
            tempFilePath: downloadResult.tempFilePath,
            success: resolve,
            fail: reject,
          })
        })
        if (cachedAvatar?.path) {
          uni.removeSavedFile({ filePath: cachedAvatar.path })
        }
        uni.setStorageSync(cacheKey, {
          url: avatarUrl,
          path: saveResult.savedFilePath,
        })
        return saveResult.savedFilePath
      }
      catch {
        return avatarUrl
      }
    },
    async pageInit() {
      const { openId } = useUserStore()
      console.log(openId)
      const localAvatar = await this.loadCachedAvatar(openId)
      if (localAvatar) {
        this.avatar = localAvatar
      }
      const [companyDepartmentOptions, userInfo] = await Promise.all([
        simpleLoginApi.getCompanyDepartmentOptions(),
        simpleLoginApi.getEmployeeInfo({ openId }),
      ])
      this.companyList = companyDepartmentOptions?.companies || []
      this.departmentList = companyDepartmentOptions?.departments || []
      this.wdLoading = false
      this.nameEdit = false
      this.contactEdit = false
      const {
        src,
        name,
        companyName,
        department,
        type,
        phoneNumber,
        licensePlates,
      } = userInfo
      console.log(userInfo)
      if (src) {
        this.avatar = await this.cacheAvatar(src, openId)
      }
      if (name) {
        this.model.name = name
      }
      this.model.companyName = companyName || ''
      if (department) {
        const company = this.companyList.find(
          item => item.name === this.model.companyName,
        )
        this.model.department
          = this.departmentList.find(
            item =>
              String(item.companyId) === String(company?.id)
              && item.name === department,
          )?.id || ''
      }
      if (type) {
        this.type = type
      }
      this.phoneNumber = phoneNumber || ''
      this.phoneAuthorized
        = this.phoneAuthorized || Boolean(this.phoneNumber.trim())
      if (licensePlates?.length > 0) {
        this.model.code = licensePlates.map((value, index) => ({
          key: Date.now() + index,
          value: value.code,
          visible: false,
        }))
      }
    },
    async getphonenumber(res) {
      const detail = res?.detail || res
      console.log(detail)
      const { openId } = useUserStore()
      // 是否已经获取过手机号码
      console.log('==================')
      console.log(openId)
      if (detail?.errMsg === 'getPhoneNumber:ok') {
        const params = {
          openId,
          phoneCode: detail?.code,
        }
        const result = await loginApi.getPhoneNumber(params)
        console.log('result', result)
        if (Number(result) > 0) {
          await this.loginSuccessCallback()
        }
        else {
          uni.showToast({
            title: '手机授权失败，请重试',
            icon: 'none',
          })
        }
      }
      else {
        uni.showToast({
          title: '您拒绝手机授权，系统无法登录',
          icon: 'none',
        })
        return false
      }
    },
    async loginSuccessCallback() {
      this.phoneAuthorized = true
      await this.pageInit()
    },
  },
}
</script>

<style>
page {
  background-color: #eef1f6;
  height: 100vh;
  overflow: hidden;
}
.wd-cell__left {
  width: 100px !important;
  flex: none !important;
  margin-right: 15px !important;
}

.wd-cell__wrapper {
  padding-right: 15px !important;
}

.username-custom-input-class {
  text-align: right !important;
  padding-right: 25px !important;
}

.avatar-edit-icon {
  position: absolute;
  right: -2px;
  bottom: -2px;
  display: flex;
  width: 20px;
  height: 20px;
  align-items: center;
  justify-content: center;
  background: #05f;
  border: 2px solid #fff;
  border-radius: 50%;
}

.tag-custom-class {
  padding: 3px 6px !important;
  font-size: 14px !important;
  border-radius: 3px !important;
}
</style>

<style lang="scss" scoped>
@use './scss/me.scss';
</style>
