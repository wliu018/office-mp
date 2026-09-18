/*
 *  预约等api
 */
import {
  getRequest,
  postRequest,
  putRequest,
} from '@/http/smart-request'

export const othersApi = {
  weatherCondition: (params) => {
    return getRequest(`/weather/condition`, params)
  },
  getMeetingRoomInfo: (params) => {
    return getRequest(`/common/getMeetingRoomInfo`, params)
  },
  reserve: (params) => {
    return postRequest(`/common/reserve`, params)
  },
  getAlreadyReserveByRoomId: (params) => {
    return getRequest(`/common/getAlreadyReserveByRoomId`, params)
  },
  projectList: (params) => {
    return getRequest(`/project/list`, params)
  },
  projectListGroupByYear: () => {
    return getRequest(`/project/list-group-by-year`)
  },
  updateProjectLocation: (id, params) => {
    return putRequest(`/project/${id}/location`, params)
  },
  projectLocationEditable: () => {
    return getRequest(`/project/location-editable`)
  },
  generateProjectMiniappCode: (serialNumber) => {
    return getRequest(`/project/miniapp-code/miniapp`, { serialNumber })
  },
  resolveProjectMiniappCode: (scene) => {
    return getRequest(`/project/miniapp-code/resolve`, { scene })
  },
  workflowInstanceListByOpenId: (openId) => {
    return getRequest(`/workflow/instance/list-by-open-id`, { openId })
  },
  workflowInstancePageByOpenId: (openId, currentPage, pageSize) => {
    return getRequest(`/workflow/instance/page-by-open-id`, { openId, currentPage, pageSize })
  },
  workflowInstanceProcessedListByOpenId: (openId) => {
    return getRequest(`/workflow/instance/list-processed-by-open-id`, { openId })
  },
  workflowInstanceProcessedPageByOpenId: (openId, currentPage, pageSize) => {
    return getRequest(`/workflow/instance/page-processed-by-open-id`, { openId, currentPage, pageSize })
  },
  workflowInstanceAllListByOpenId: (openId) => {
    return getRequest(`/workflow/instance/list-all-by-open-id`, { openId })
  },
  workflowInstanceAllPageByOpenId: (openId, currentPage, pageSize) => {
    return getRequest(`/workflow/instance/page-all-by-open-id`, { openId, currentPage, pageSize })
  },
  workflowInstanceStatisticsByOpenId: (openId) => {
    return getRequest(`/workflow/instance/statistics-by-open-id`, { openId })
  },
  workflowInstanceStart: (params) => {
    return postRequest(`/workflow/instance`, params)
  },
  workflowInstanceRuntime: (instanceId) => {
    return getRequest(`/workflow/instance/${instanceId}/runtime`)
  },
  workflowInstanceVerifyOnsiteCode: (instanceId, code) => {
    return getRequest(`/workflow/instance/${instanceId}/verify-onsite-code`, { code })
  },
  workflowInstanceMiniappCode: (instanceId) => {
    return getRequest(`/workflow/instance/${instanceId}/miniapp-code`)
  },
  workflowInstanceSubmit: (params) => {
    return postRequest(`/workflow/instance/submit`, params)
  },
  workflowFormUpdateServiceMode: (instanceId, params) => {
    return putRequest(`/workflow/form/${instanceId}/service-mode`, params)
  },
  workflowOnsiteCandidates: () => {
    return getRequest(`/workflow/form/onsite-candidates`)
  },
  workflowNodeCandidates: (nodeId) => {
    return getRequest(`/workflow/node/${nodeId}/candidate-users`)
  },
  workflowNodeList: () => {
    return getRequest(`/workflow/node/list`)
  },
  userInfoById: (userId) => {
    return getRequest(`/userinfo/selById/${userId}`)
  },
  parkingInit: (params) => {
    return getRequest(`/officeParkingCoupon/init`, params)
  },
  takeTicket: (params) => {
    return postRequest(`/officeParkingCoupon/takeTicket`, params)
  },
  surplusTicket: (params) => {
    return getRequest(`/officeParkingCoupon/surplusTicket`, params)
  },
  getTicketRecord: (params) => {
    return getRequest(`/officeParkingCoupon/getTicketRecord`, params)
  },
  getReserveList: (params) => {
    return getRequest(`/common/getReserveList`, params)
  },
  addFeedback: (params) => {
    return getRequest(`/common/addFeedback`, params)
  },
  getTicketRecordByOpenIdAndTicketCode: (params) => {
    return getRequest(`/officeParkingCoupon/getTicketRecordByOpenIdAndTicketCode`, params)
  },
  getTop50ReserveList: (params) => {
    return getRequest(`/common/getTop50ReserveList`, params)
  },
  getTop50TicketRecord: (params) => {
    return getRequest(`/officeParkingCoupon/getTop50TicketRecord`, params)
  },
  voiceRecognition: (params) => {
    return postRequest(`/ai/voiceRecognition`, params)
  },
  appointmentChat: (params) => {
    return postRequest(`/ai/appointmentChat`, params)
  },
}
