<template>
  <wd-popup
    v-model="showAuthModel" :close-on-click-modal="true"
    custom-style="border-radius: 20px" bg-color="#fff" safe-area-inset-bottom
    closeable position="bottom" @open="open"
    @close="close"
  >
    <div class="login-content">
      <view class="auth-modal">
        <div class="title-wrap">
          <div class="ticon">
            <button
              class="auth-button" style="background: transparent; border: 1rpx solid #f9f0e7"
              type="info" round :disabled="registered" open-type="chooseAvatar" @chooseavatar="getAvatar"
            >
              <div class="icons">
                <image :src="userAvatarUrl ? userAvatarUrl : defaultUrl" mode="aspectFill" />
              </div>
            </button>
          </div>
          <view class="title" :style="`visibility: ${!userAvatarUrl ? '' : 'hidden;'}`">
            <div class="">
              {{ props.txt ? props.txt : '修改头像' }}
            </div>
          </view>
        </div>
        <view class="login-btn">
          <up-button
            type="success" text="取消" color="#05f" shape="circle" size="large"
            :custom-style="{
              'fontWeight': 'blod',
              'font-size': '22px',
            }" @click="emit('hide')"
          />
        </view>
      </view>
    </div>
  </wd-popup>
</template>

<script setup>
import {
  ref,
  useModel,
} from 'vue'
import {
  simpleLoginApi,
} from '@/api/login/simple-login-api'
import {
  useUserStore,
} from '@/store/user'

const props = defineProps({
  showAuth: Boolean,
  txt: String,
})
const emit = defineEmits(['loginCallback', 'hide'])
const app = getApp()
const apiUrl = import.meta.env.VITE_SERVER_BASEURL
const uploadFilePath = `${apiUrl}/file/fileUpload`

//  ----------------  ---------------
const showAuthModel = useModel(props, 'showAuth')
const btnLoading = ref(false)
const defaultUrl = ref('/static/images/avatar.png')
const userAvatarUrl = ref('')
const avatarId = ref('')
const registered = ref(false)

// ------------------  showAuth --------------

async function open() {
  console.log('触发 open')
}
async function close() {
  emit('hide')
}

function successCallback() {
  btnLoading.value = false
  // 登录回调
  console.log('调用登录回调---------------')
  emit('hide')
  emit('loginCallback')
}

// ------------------ wx接口函数 获取手机号码 -------------
async function getAvatar(e) {
  const {
    avatarUrl,
  } = e.detail
  console.log(avatarUrl)
  console.log('-------------->')
  wx.uploadFile({
    url: uploadFilePath,
    filePath: avatarUrl,
    name: 'image',
    async success(res) {
      const result = JSON.parse(res.data)
      console.log(result)
      if (result[0].src) {
        userAvatarUrl.value = result[0].src
        avatarId.value = result[0].code
        // openId avatarId
        const openId = useUserStore().openId
        const row = await simpleLoginApi.updateAvatar({
          openId,
          avatarId: avatarId.value,
        })
        if (row) {
          successCallback()
        }
      }
    },
    fail(e) {
      uni.showToast({
        title: '头像上传失败',
        icon: 'none',
      })
    },
  })
}

// --------- pageInit ---------
function initDefaultData() {
  avatarId.value = ''
}
async function pageInit() {}
</script>

<style lang="scss" scoped>
.auth-button:after {
  border: none;
}

.login-content {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 50vh;

  .auth-modal {
    max-width: 350px;
    min-width: 300px;
    padding: 40px 20px;

    .title-wrap {
      display: flex;
      align-items: center;
      flex-direction: column;
      justify-content: center;

      .ticon {
        display: flex;
        align-items: center;
        justify-content: center;

        .icons {
          width: 65px;
          height: 65px;

          image {
            width: 100%;
            height: 100%;
            border-radius: 50%;
          }
        }
      }

      .title {
        text-align: center;
        color: #817769;
        font-size: 14px;
        line-height: 1.5em;
        margin: 10px 0 30px;
      }

      .nickname-wrap {
        width: 80%;
        margin-bottom: 30px;

        .nickname {
          height: 40px;
          border-radius: 100px;
          padding: 2px 15px;
          border: 1px solid #9b8a72;
        }
      }
    }
  }
}

:deep(.u-button__text) {
  font-size: 18px;
  font-weight: bold;
  letter-spacing: 1.5px;
}
</style>
