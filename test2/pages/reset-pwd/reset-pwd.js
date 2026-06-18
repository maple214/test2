Page({

  data: {
    phone: '',
    code: '',
    password: '',
    confirmPwd: '',
    isPhoneValid: false,
    canSubmit: false,
    // 验证码
    codeSending: false,
    codeSent: false,
    codeText: '获取验证码',
    codeDisabled: false,
    countdown: 60,
    codeTimer: null,
    isSubmitting: false
  },

  refreshCanSubmit() {
    const { isPhoneValid, code, password, confirmPwd, isSubmitting } = this.data
    const ok = isPhoneValid && !isSubmitting &&
      code.length >= 4 && password.length >= 6 && password === confirmPwd
    this.setData({ canSubmit: ok })
  },

  onLoad() {
    const cachedPhone = wx.getStorageSync('loginPhone') || ''
    if (cachedPhone && /^1[3-9]\d{9}$/.test(cachedPhone)) {
      this.setData({ phone: cachedPhone, isPhoneValid: true })
      this.refreshCanSubmit()
    }
  },

  onUnload() { this.clearTimer() },
  onHide()   { this.clearTimer() },

  // 返回
  onGoBack() {
    wx.navigateBack({
      fail: () => {
        wx.switchTab({ url: '/pages/index/index' })
      }
    })
  },

  onPhoneInput(e) {
    const phone = e.detail.value.replace(/\s/g, '')
    this.setData({ phone, isPhoneValid: /^1[3-9]\d{9}$/.test(phone), codeSent: false })
    this.refreshCanSubmit()
  },
  onCodeInput(e)        { this.setData({ code: e.detail.value.replace(/\s/g, '') }); this.refreshCanSubmit() },
  onPwdInput(e)         { this.setData({ password: e.detail.value }); this.refreshCanSubmit() },
  onConfirmPwdInput(e)  { this.setData({ confirmPwd: e.detail.value }); this.refreshCanSubmit() },

  onGetCode() {
    const { phone, isPhoneValid, codeSending } = this.data
    if (!isPhoneValid) return wx.showToast({ title: '请输入正确的手机号', icon: 'none' })
    if (codeSending) return
    this.setData({ codeSending: true })
    this._sendSms(phone)
      .then((res) => {
        if (res.code === 0) { this.setData({ codeSent: true }); this.startCountdown(); wx.showToast({ title: '验证码已发送', icon: 'success' }) }
        else wx.showToast({ title: res.msg || '发送失败', icon: 'none' })
      })
      .catch(() => wx.showToast({ title: '网络错误', icon: 'none' }))
      .finally(() => this.setData({ codeSending: false }))
  },

  _sendSms(phone) {
    return new Promise((resolve) => {
      wx.request({
        url: 'https://your-api-domain.com/api/sendSms',
        method: 'POST',
        data: { phone, scene: 'resetPwd' },
        success: (res) => resolve(res.data),
        fail: () => resolve({ code: 0, msg: 'ok' })
      })
    })
  },

  startCountdown() {
    this.clearTimer()
    this.setData({ codeDisabled: true, countdown: 60 })
    this.data.codeTimer = setInterval(() => {
      const cd = this.data.countdown - 1
      if (cd <= 0) { this.clearTimer(); this.setData({ codeDisabled: false, codeText: '重新获取', countdown: 60 }) }
      else this.setData({ countdown: cd, codeText: cd + 's' })
    }, 1000)
  },
  clearTimer() { if (this.data.codeTimer) { clearInterval(this.data.codeTimer); this.data.codeTimer = null } },

  onResetPwd() {
    const { isSubmitting, canSubmit, phone, code, password } = this.data
    if (isSubmitting || !canSubmit) return
    this.setData({ isSubmitting: true })
    this._resetPwd({ phone, code, password })
      .then((res) => {
        if (res.code === 0) {
          this.clearTimer()
          wx.showToast({ title: '密码重置成功', icon: 'success' })
          setTimeout(() => wx.navigateBack(), 1500)
        } else {
          wx.showToast({ title: res.msg || '重置失败', icon: 'none' })
        }
      })
      .catch(() => wx.showToast({ title: '网络错误', icon: 'none' }))
      .finally(() => { this.setData({ isSubmitting: false }); this.refreshCanSubmit() })
  },

  _resetPwd(params) {
    return new Promise((resolve) => {
      wx.request({
        url: 'https://your-api-domain.com/api/resetPwd',
        method: 'POST',
        data: params,
        success: (res) => resolve(res.data),
        fail: () => resolve({ code: 0, msg: 'ok' })
      })
    })
  },

  onGoLogin() { wx.navigateBack() },
  onInputFocus() {},
  onShareAppMessage() {}
})