<template>
  <div class="page">
    <view class="container">
      <view class="content">
        <div
          class="user-wrapper"
          style="padding: 10px;background-color: #fff;"
          @click="showAuth = true"
        >
          <div class="avatar-wrapper" style="position: relative;">
            <image src="/static/images/icon-preview.png" mode="aspectFill" style="opacity: 0.2;position: absolute;left:0;top:0;width: 100%; height: 100%; z-index: 1;" />
            <div class="avatar" style="background-color: #fff;z-index: 2;">
              <image :src="avatar" />
            </div>
            <!-- <div class="edit">
              <wd-icon name="refresh" color="#05f" size="12" />
            </div> -->
          </div>
        </div>

        <!-- <div class="section">
          <div>
            <wd-tag type="warning" size="large" mark plain>
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
            <wd-icon stop bold name="fork" size="18" color="#999" />
            <div class="w-full pl-[10px]">
              <wd-input v-model="department" size="large" :readonly="type !== 0" type="text" placeholder="请输入所属部门" />
            </div>
          </div>

          <div v-if="type === 0" class="flex items-center p-[20px] pl-0 pr-0">
            <div class="align-center w-full flex justify-center pl-[10px]">
              <wd-button icon="check-circle-filled" custom-class="submit-btn">
                {{ type === 0 ? '提交认证' : '保存修改' }}
              </wd-button>
            </div>
          </div>
        </div> -->
        <div class="section relative bg-white" style="--wot-input-disabled-color: #a3a2a2">
          <div class="flex pl-[15px]">
            <wd-tag v-if="type === 1" custom-class="tag-custom-class" type="warning" size="large" plain>
              审核中
            </wd-tag>
            <wd-tag v-else-if="type === 2" custom-class="tag-custom-class" type="success" size="large" plain>
              已认证
            </wd-tag>
            <wd-tag v-else custom-class="tag-custom-class" type="primary" size="large" plain>
              未认证
            </wd-tag>
          </div>
          <wd-form ref="form" :model="model" error-type="toast">
            <wd-cell-group border>
              <wd-input
                v-model="model.name"
                label="姓名"
                label-width="100px"
                size="large"
                prop="name"
                :disabled="type !== 0"
                custom-input-class="username-custom-input-class"
                clearable
                placeholder="请输入姓名"
                :rules="[{ required: true, message: '请填写姓名' }]"
              />

              <wd-input
                v-model="model.companyName"
                label="公司"
                label-width="100px"
                size="large"
                prop="companyName"
                custom-input-class="username-custom-input-class"
                :disabled="type !== 0"
                :rules="[{ required: true, message: '请填写公司' }]"
              />

              <wd-cell v-if="model.companyName === '丝路视觉'" style="--wot-cell-padding: 12px" width="100px" title="部门" size="large" required prop="department">
                <picker :value="model.department" :disabled="type !== 0" :range="departmentList" range-key="name" @change="bindPickerChange($event)">
                  <view class="picker text-align-left">
                    <view class="!text-right" :class="[type !== 0 ? '!text-[#C5C5C5]' : '', departmentList[model.department] ? '' : '']">
                      {{ departmentList[model.department] ? departmentList[model.department].name : '请选择部门' }}
                      <wd-icon name="arrow-right" size="18" color="rgba(0, 0, 0, 0.25)" />
                    </view>
                  </view>
                </picker>
              </wd-cell>

              <template v-if="showLicensePlates">
                <wd-cell
                  v-for="(item, index) in model.code"
                  :key="item.key"
                  :value="item.value"
                  :title="`车牌号${index + 1}`"
                  :prop="`code.${index}.value`"
                  label-width="100px"
                  size="large" is-link @click="showKeyBoard2(index)"
                />
                <wd-keyboard
                  v-for="(item, index) in model.code"
                  :key="item.key" v-model="item.value" v-model:visible="item.visible"
                  custom-style1="margin-bottom: 100px;" :modal="true"
                  root-portal mode="car" auto-switch-lang @input="onInput(index, $event)" @delete="onDelete(index, $event)"
                />
                <wd-cell title-width="0px">
                  <view class="footer">
                    <wd-button size="small" type="info" icon="add-circle1" @click="addCode">
                      添加车牌号
                    </wd-button>
                    <wd-button size="small" type="info" icon="minus-circle" @click="removeCode">
                      删除
                    </wd-button>
                  </view>
                </wd-cell>
              </template>
              <wd-cell v-if="type === 0" title-width="0px">
                <div class="flex items-center p-[20px] pl-0 pr-0">
                  <div
                    class="align-center w-full flex justify-center pl-[10px]"
                  >
                    <wd-button
                      icon="check-circle-filled" custom-class="submit-btn !w-[80%] !h-[45px]" custom-style="background: linear-gradient(115deg, #3D7DFE 8.4%, #6A59FE 52.29%, #9142FF 93.72%);"
                      open-type="getPhoneNumber"
                      @getphonenumber="getphonenumber"
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
    <authModal :show-auth="showAuth" @login-callback="pageInit" @hide="authModalHide" />
    <loadingBox :show="wdLoading" />
  </div>
</template>

<script>
import {
  loginApi,
} from '@/api/login/login-api.js'
import {
  simpleLoginApi,
} from '@/api/login/simple-login-api.js'

import {
  authModal,
} from '@/components/auth-modal.vue'
import loadingBox from '@/components/global-loading-box.vue'
import {
  useUserStore,
} from '@/store/user'

const openId = useUserStore().openId
const app = getApp()

definePage({
  style: {
    navigationBarTitleText: '我的',
  },
})

export default {
  components: {
    authModal,
    loadingBox,
  },
  data() {
    return {
      wdLoading: true,
      showAuth: false,
      showLicensePlates: false,
      avatar: '/static/images/avatar.png',
      name: '',
      type: 0,
      department: '',
      list: [],
      nameEdit: false,
      contactEdit: false,
      model: {
        name: '',
        companyName: '丝路视觉',
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
      departmentList: [{ name: '总经办' }, { name: '人力资源部' }, { name: '行政部' }, { name: '信息部' }, { name: '财务部' }, { name: '采购部' }, { name: '市场中心' }, { name: '工程中心' }, { name: '造价部' }, { name: '数字中心' }, { name: '新媒体' }],
    }
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
    bindPickerChange(e) {
      console.log('bindPickerChange', e)
      this.model.department = e.detail.value
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
    submit() {
      this.$refs.form.validate().then(async (valid) => {
        if (valid.valid) {
          console.log('submit', valid)
          console.log('submit', this.model)
          const department = this.departmentList[this.model.department]?.name || ''
          if (this.model.companyName === '丝路视觉' && !department) {
            uni.showToast({
              title: '请选择部门',
              duration: 1000,
              icon: 'none',
            })
            return
          }
          const licensePlates = this.model.code.map(i => i.value).filter(i => i !== '')
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
        const {
          openId,
        } = useUserStore()
        await simpleLoginApi.updatePhoneNumber({
          openId,
          phoneNumber: value,
        }).then((r) => {
          if (r) {
            uni.showToast({
              title: '保存成功',
              duration: 1000,
            })
          }
        }).finally(() => {
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
      const {
        openId,
      } = useUserStore()
      if (value) {
        this.name = value
        await simpleLoginApi.updateNickname({
          openId,
          nickname: value,
        }).then((result) => {
          if (result) {
            uni.showToast({
              title: '保存成功',
              duration: 1000,
            })
          }
        }).finally(() => {
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
    async pageInit() {
      const {
        openId,
      } = useUserStore()
      console.log(openId)
      const userInfo = await simpleLoginApi.getEmployeeInfo({
        openId,
      })
      this.wdLoading = false
      this.nameEdit = false
      this.contactEdit = false
      const {
        src,
        name,
        companyName,
        department,
        type,
        licensePlates,
      } = userInfo
      console.log(userInfo)
      if (src) {
        this.avatar = src
      }
      if (name) {
        this.model.name = name
      }
      this.model.companyName = companyName || '丝路视觉'
      if (department) {
        this.model.department = this.departmentList.findIndex(i => i.name === department)
      }
      if (type) {
        this.type = type
      }
      if (licensePlates?.length > 0) {
        this.model.code = licensePlates.map((value, index) => ({
          key: Date.now() + index,
          value: value.code,
          visible: false,
        }))
      }
    },
    async getphonenumber(res) {
      console.log(res)
      const {
        openId,
      } = useUserStore()
      // 是否已经获取过手机号码
      console.log('==================')
      console.log(openId)
      if (res?.errMsg === 'getPhoneNumber:ok') {
        const params = {
          openId,
          phoneCode: res?.code,
        }
        const result = await loginApi.getPhoneNumber(params)
        console.log('result', result)
        if (result === 1) {
          setTimeout(() => {
            this.loginSuccessCallback(result)
          }, 200)
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
    loginSuccessCallback(result) {
      this.submit()
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

.tag-custom-class {
  padding: 3px 6px !important;
  font-size: 14px !important;
  border-radius: 2px !important;
}
</style>

<style lang="scss" scoped>
@import './scss/me.scss';
</style>
