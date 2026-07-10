/*
 *  预约等api
 */
import {
  getRequest,
  postRequest,
} from '@/http/smart-request'

export const othersApi = {
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
