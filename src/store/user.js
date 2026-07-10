/*
 * 登录用户
 *
 */
import _ from 'lodash'
import {
  defineStore,
} from 'pinia'
import {
  simpleLoginApi,
} from '@/api/login/simple-login-api.js'

const defaultUserInfo = {
  // openId
  openId: '',
  token: '',
  // 头像
  avatar: '',
  // 登录名
  name: '',
  // 手机号
  phone: '',
}

export const useUserStore = defineStore({
  id: 'userStore',
  state: () => ({
    ...defaultUserInfo,
  }),
  getters: {},

  actions: {
    logout() {
      this.token = null
      this.setUserLoginInfo(defaultUserInfo)
      console.log(333)
    },
    // 设置登录信息
    setUserLoginInfo(data) {
      // 用户基本信息
      this.name = data.name
      this.avatar = data.avatar
      this.openId = data.openId
      this.token = data.token
    },
    async silentLogin() {
      const loggedIn = await simpleLoginApi.loggedIn()
      if (!loggedIn) {
        const code = await this.getAPPCode()
        const res = await simpleLoginApi.login({
          code,
        })
        if (res.status !== -1) {
          useUserStore().setUserLoginInfo(res)
          console.log('=========> 静默登录成功')
        }
        else {
          uni.showToast({
            icon: 'none',
            title: 'code异常',
          })
        }
      }
      else {
        console.log('=========> 已静默登录')
      }
    },
    async getAPPCode() {
      return new Promise((reslove, reject) => {
        wx.login({
          success(res) {
            reslove(res.code)
          },
        })
      })
    },
  },
  persist: {
    enabled: true,
  },
})
