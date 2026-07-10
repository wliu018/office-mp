/*
 *  登录API
 */
import {
  getRequest,
} from '@/http/smart-request'

export const loginApi = {

  /**
   * 获取手机号码并注册登录
   */
  getPhoneNumber: (params) => {
    return getRequest(`/login/getPhoneInfo/${params.openId
    }/${params.phoneCode}`)
  },

}
