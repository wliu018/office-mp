const WORK_ORDER_TEMPLATE_ID = 'XXxou1-0AnbBds-5jVuSsut8sou6LkjWkxAqF8nYPwU'

export function requestWorkOrderSubscribe() {
  return new Promise((resolve) => {
    // #ifdef MP-WEIXIN
    console.info('[订阅消息] 请求授权', WORK_ORDER_TEMPLATE_ID)
    if (!uni.canIUse('requestSubscribeMessage')) {
      console.error('[订阅消息] 当前基础库不支持 requestSubscribeMessage')
      uni.showModal({
        title: '当前微信版本不支持订阅消息',
        content: '请升级微信后重试。',
        showCancel: false,
      })
      resolve(false)
      return
    }
    uni.requestSubscribeMessage({
      tmplIds: [WORK_ORDER_TEMPLATE_ID],
      success: (result) => {
        console.info('[订阅消息] 授权结果', result)
        const status = result[WORK_ORDER_TEMPLATE_ID]
        if (status === 'accept') {
          resolve(true)
          return
        }
        console.warn('[订阅消息] 用户未同意', result)
        if (status === 'ban') {
          uni.showModal({
            title: '订阅消息未开启',
            content: '请在小程序设置页开启“维保工单提醒”后重试。',
            confirmText: '打开设置',
            success: (modal) => {
              if (modal.confirm)
                uni.openSetting({ withSubscriptions: true })
            },
          })
        }
        else {
          uni.showToast({ title: '您未开启维保工单提醒', icon: 'none' })
        }
        resolve(false)
      },
      fail: (error) => {
        console.error('[订阅消息] 请求失败', error)
        uni.showModal({
          title: '无法打开订阅授权',
          content: '请确认在微信小程序中点击操作，并在开发者工具控制台查看订阅消息错误详情。',
          showCancel: false,
        })
        resolve(false)
      },
    })
    // #endif

    // #ifndef MP-WEIXIN
    resolve(true)
    // #endif
  })
}
