/*
 *  登录API
 */
import {
  getRequest,
  postRequest,
} from '@/http/smart-request'

export const simpleLoginApi = {

  /**
   * 是否已登录 @author
   */
  loggedIn: (params) => {
    return getRequest(`/simpleLogin/loggedIn`)
  },

  /**
   * 登录 !exists ? insert : '', 并返回token
   */
  login: (params) => {
    return getRequest(`/simpleLogin/${params.code}`)
  },

  avatar: (params) => {
    return getRequest(`/simpleLogin/avatar/${params.openId}`)
  },

  updateAvatar: (params) => {
    return getRequest(`/simpleLogin/updateAvatar/${params.openId}/${params.avatarId}`)
  },

  updateEmployeeInfo: (params) => {
    return postRequest(`/simpleLogin/updateEmployeeInfo`, params)
  },

  getEmployeeInfo: (params) => {
    return getRequest(`/simpleLogin/getEmployeeInfo/${params.openId}`)
  },

  getCompanyDepartmentOptions: () => {
    return getRequest(`/admin/booking/company-employees/options`)
  },

  isMarketPersonnel: (params) => {
    return getRequest(`/simpleLogin/is-market-personnel/${params.openId}`)
  },
}
