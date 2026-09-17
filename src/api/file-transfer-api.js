import { postRequest } from '@/http/smart-request'

export const fileTransferApi = {
  authorize: scene => postRequest('/file-transfer/authorize', { scene }, { showError: false }),
}
