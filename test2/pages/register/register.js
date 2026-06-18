Page({

  data: {
    phone: '',
    code: '',
    password: '',
    confirmPwd: '',
    isPhoneValid: false,
    privacyAgreed: false,
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
    const { isPhoneValid, code, password, confirmPwd, privacyAgreed, isSubmitting } = this.data
    const ok = isPhoneValid && privacyAgreed && !isSubmitting &&
      code.length >= 4 && password.length >= 6 && password === confirmPwd
    this.setData({ canSubmit: ok })
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
  onCodeInput(e)   { this.setData({ code: e.detail.value.replace(/\s/g, '') }); this.refreshCanSubmit() },
  onPwdInput(e)    { this.setData({ password: e.detail.value }); this.refreshCanSubmit() },
  onConfirmPwdInput(e) { this.setData({ confirmPwd: e.detail.value }); this.refreshCanSubmit() },

  onTogglePrivacy() { this.setData({ privacyAgreed: !this.data.privacyAgreed }); this.refreshCanSubmit() },

  // ────────── 获取验证码 ──────────
  onGetCode() {
    const { phone, isPhoneValid, codeSending } = this.data
    if (!isPhoneValid) return wx.showToast({ title: '请输入正确的手机号', icon: 'none' })
    if (codeSending) return
    this.setData({ codeSending: true })
    this._sendSms(phone)
      .then((res) => {
        if (res.code === 0) {
          this.setData({ codeSent: true })
          this.startCountdown()
          wx.showToast({ title: '验证码已发送', icon: 'success' })
        } else {
          const msgs = { TOO_FREQUENT: '发送过于频繁', PHONE_INVALID: '手机号格式错误', PHONE_EXISTS: '该手机号已注册' }
          wx.showToast({ title: msgs[res.msg] || res.msg || '发送失败', icon: 'none' })
        }
      })
      .catch(() => wx.showToast({ title: '网络错误', icon: 'none' }))
      .finally(() => this.setData({ codeSending: false }))
  },

  _sendSms(phone) {
    return new Promise((resolve) => {
      wx.request({
        url: 'https://your-api-domain.com/api/sendSms',
        method: 'POST',
        data: { phone, scene: 'register' },
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

  // ────────── 注册提交 ──────────
  onRegister() {
    const { isSubmitting, canSubmit, phone, code, password } = this.data
    if (isSubmitting || !canSubmit) return

    this.setData({ isSubmitting: true })
    this._register({ phone, code, password })
      .then((res) => {
        if (res.code === 0) {
          const nickname = phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2')
          wx.setStorageSync('userInfo', { nickname, avatar: '', phone, loginType: 'phone', loginTime: Date.now() })
          if (res.data && res.data.token) wx.setStorageSync('token', res.data.token)
          wx.setStorageSync('loginPhone', phone)
          this.clearTimer()
          wx.showToast({ title: '注册成功', icon: 'success' })
          setTimeout(() => wx.navigateBack({ delta: 2 }), 1500)
        } else {
          wx.showToast({ title: res.msg || '注册失败', icon: 'none' })
        }
      })
      .catch(() => wx.showToast({ title: '网络错误', icon: 'none' }))
      .finally(() => { this.setData({ isSubmitting: false }); this.refreshCanSubmit() })
  },

  _register(params) {
    return new Promise((resolve) => {
      wx.request({
        url: 'https://your-api-domain.com/api/register',
        method: 'POST',
        data: params,
        success: (res) => resolve(res.data),
        fail: () => resolve({ code: 0, msg: 'ok' })
      })
    })
  },

  // ────────── 微信注册 ──────────
  onWechatRegister() {
    const that = this
    wx.login({
      success(wxRes) {
        wx.request({
          url: 'https://your-api-domain.com/api/wechatRegister',
          method: 'POST',
          data: { code: wxRes.code },
          success(apiRes) {
            if (apiRes.data.code === 0) {
              const d = apiRes.data.data
              wx.setStorageSync('userInfo', { nickname: d.nickname || '微信用户', avatar: d.avatar || '', loginType: 'wechat', token: d.token })
              wx.setStorageSync('token', d.token)
              wx.showToast({ title: '注册成功', icon: 'success' })
              setTimeout(() => wx.navigateBack({ delta: 2 }), 1500)
            } else {
              that._mockWechatReg()
            }
          },
          fail() { that._mockWechatReg() }
        })
      },
      fail() { wx.showToast({ title: '微信授权失败', icon: 'none' }) }
    })
  },

  _mockWechatReg() {
    wx.setStorageSync('userInfo', { nickname: '微信用户', avatar: '', loginType: 'wechat', token: 'mock_' + Date.now(), loginTime: Date.now() })
    wx.setStorageSync('token', 'mock_' + Date.now())
    wx.showToast({ title: '注册成功', icon: 'success' })
    setTimeout(() => wx.navigateBack({ delta: 2 }), 1500)
  },

  onGoLogin() { wx.navigateBack() },
  onInputFocus() {},
  onShareAppMessage() {}
})