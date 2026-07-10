import {
  useUserStore,
} from '@/store/user'

const baseUrl = import.meta.env.VITE_SERVER_BASEURL
const MAX_RETRIES = 1

function getUserToken() {
  let token = useUserStore().token
  console.log('getUserToken', token)
  if (token) {
    return token
  }
  return ''
}

let isRefreshing = false
let requestsQueue = []

/**
 * 处理返回的消息
 */
async function handleResponse(config, response, resolve, reject) {
  const res = response.data
  switch (res.code) {
    case 0:
      resolve(res.data)
      break
    case 4001: // refresh token过期 或缺少
      useUserStore().clearUserLoginInfo()
      break
    case 4002: // 缺少token
    case 4003:
      // 尝试无感刷新
      console.log('res.code >', res.code)
      if (!isRefreshing) {
        isRefreshing = true
        try {
          await useUserStore().silentLogin()
          // 重试原请求
          const retryRes = await request({
            ...config,
          })
          resolve(retryRes)
          // 执行队列中等待的请求
          requestsQueue.forEach(cb => cb())
          requestsQueue = []
        }
        finally {
          isRefreshing = false
        }
      }
      else {
        // 当前请求不是第一个触发 4003 的请求，则将当前为4003（token过期的请求）添加到请求队列中
        console.log('当前请求不是第一个触发')
        return new Promise((resolve) => {
          requestsQueue.push(() => {
            resolve(request(config))
          })
        })
      }
      break
    default:
      // 服务器异常
      uni.showToast({
        title: '服务器开小差了~',
        icon: 'none',
      })
      reject(response)
      break
  }
}

/**
 * 通用请求封装
 */
export function request(config) {
  return new Promise((resolve, reject) => {
    const contentType = config.method !== 'POST'
      ? 'application/x-www-form-urlencoded'
      : 'application/json'
    uni.request({
      url: baseUrl + config.url,
      data: config.data,
      method: config.method || 'GET',
      header: {
        'Content-Type': contentType,
        'token': getUserToken(),
      },
      success: async (response) => {
        await handleResponse(config, response, resolve, reject)
      },
      fail: (error) => {
        reject(error)
      },
    })
  })
}

/**
 * get请求
 */
export function getRequest(url, data, config = {}) {
  console.log(`config: ${JSON.stringify(config)}`)
  return request({
    ...config,
    url,
    data,
    method: 'GET',

  })
}
/**
 * post请求
 */
export function postRequest(url, data, config = {}) {
  return request({
    ...config,
    url,
    data,
    method: 'POST',
  })
}

/**
 * put请求
 */
export function putRequest(url, data, config = {}) {
  console.log(`config: ${JSON.stringify(config)}`)
  return request({
    ...config,
    url,
    data,
    method: 'PUT',
  })
}

// ================================= 文件 =================================

export function uploadRequest(filePath, folder) {
  return new Promise((resolve, reject) => {
    uni.uploadFile({
      url: `${baseUrl}/support/file/upload`,
      filePath,
      header: {
        Authorization: `Bearer ${getUserToken()}`,
      },
      name: 'file',
      formData: {
        folder,
      },
      success: (response) => {
        response.data = JSON.parse(response.data.replace('\uFEFF', ''))
        // handleResponse(response, resolve, reject);
      },
      fail: (error) => {
        reject(error)
      },
    })
  })
}
