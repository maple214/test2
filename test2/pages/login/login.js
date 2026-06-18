Page({

  data: {
    // 界面
    activeTab: 'sms',
    // 用户输入
    phone: '',
    code: '',
    password: '',
    // 验证状态
    isPhoneValid: false,
    canLogin: false,
    privacyAgreed: false,
    // 验证码
    codeSending: false,
    codeSent: false,
    codeText: '获取验证码',
    codeDisabled: false,
    countdown: 60,
    codeTimer: null,
    // 提交
    isSubmitting: false
  },

  /** 重新计算 canLogin */
  refreshCanLogin() {
    const { activeTab, isPhoneValid, code, password, privacyAgreed, isSubmitting } = this.data
    let ok = false
    if (isPhoneValid && privacyAgreed && !isSubmitting) {
      if (activeTab === 'sms') ok = code.length >= 4
      if (activeTab === 'pwd') ok = password.length >= 6
    }
    this.setData({ canLogin: ok })
  },

  onLoad() {
    const cachedPhone = wx.getStorageSync('loginPhone') || ''
    if (cachedPhone && /^1[3-9]\d{9}$/.test(cachedPhone)) {
      this.setData({ phone: cachedPhone, isPhoneValid: true })
    }
    this.refreshCanLogin()
  },

  onUnload() { this.clearTimer() },
  onHide()   { this.clearTimer() },

  // ────────── 返回 ──────────
  onGoBack() {
    wx.navigateBack({
      fail: () => {
        wx.switchTab({ url: '/pages/index/index' })
      }
    })
  },

  // ────────── 切换 Tab ──────────
  onSwitchTab(e) {
    this.setData({ activeTab: e.currentTarget.dataset.tab, code: '', password: '' })
    this.refreshCanLogin()
  },

  // ────────── 输入处理 ──────────
  onPhoneInput(e) {
    const phone = e.detail.value.replace(/\s/g, '')
    const valid = /^1[3-9]\d{9}$/.test(phone)
    this.setData({ phone, isPhoneValid: valid, codeSent: false })
    this.refreshCanLogin()
  },

  onCodeInput(e) {
    this.setData({ code: e.detail.value.replace(/\s/g, '') })
    this.refreshCanLogin()
  },

  onPasswordInput(e) {
    this.setData({ password: e.detail.value })
    this.refreshCanLogin()
  },

  // ────────── 隐私协议 ──────────
  onTogglePrivacy() {
    this.setData({ privacyAgreed: !this.data.privacyAgreed })
    this.refreshCanLogin()
  },

  onViewAgreement() {
    wx.showToast({ title: '协议页面开发中', icon: 'none' })
  },

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
          const msgs = {
            TOO_FREQUENT: '发送过于频繁，请稍后再试',
            PHONE_INVALID: '手机号格式错误',
            PHONE_REGISTERED: '该手机号已注册'
          }
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
        data: { phone, scene: 'login' },
        success: (res) => resolve(res.data),
        fail: () => resolve({ code: 0, msg: 'ok' })  // 开发阶段模拟成功
      })
    })
  },

  // ────────── 倒计时 ──────────
  startCountdown() {
    this.clearTimer()
    this.setData({ codeDisabled: true, countdown: 60 })
    this.data.codeTimer = setInterval(() => {
      const cd = this.data.countdown - 1
      if (cd <= 0) {
        this.clearTimer()
        this.setData({ codeDisabled: false, codeText: '重新获取', countdown: 60 })
      } else {
        this.setData({ countdown: cd, codeText: cd + 's' })
      }
    }, 1000)
  },

  clearTimer() {
    if (this.data.codeTimer) { clearInterval(this.data.codeTimer); this.data.codeTimer = null }
  },

  // ────────── 登录提交 ──────────
  onLogin() {
    const { isSubmitting, canLogin, activeTab, phone, code, password } = this.data
    if (isSubmitting || !canLogin) return

    this.setData({ isSubmitting: true })
    const params = activeTab === 'sms'
      ? { phone, code, type: 'sms' }
      : { phone, password, type: 'pwd' }

    this._login(params)
      .then((res) => {
        if (res.code === 0) return this.handleLoginSuccess(res.data)

        const errs = {
          UNREGISTERED: '该手机号尚未注册，请先注册',
          CODE_ERROR: '验证码错误',
          CODE_EXPIRED: '验证码已过期',
          PWD_ERROR: '密码错误',
          ACCOUNT_LOCKED: '账号已被锁定'
        }
        wx.showToast({ title: errs[res.msg] || res.msg || '登录失败', icon: 'none' })
      })
      .catch(() => wx.showToast({ title: '网络错误', icon: 'none' }))
      .finally(() => {
        this.setData({ isSubmitting: false })
        this.refreshCanLogin()
      })
  },

  _login(params) {
    return new Promise((resolve) => {
      wx.request({
        url: 'https://your-api-domain.com/api/login',
        method: 'POST',
        data: params,
        success: (res) => resolve(res.data),
        // 开发阶段模拟：保持数据结构完整，避免 handleLoginSuccess 收到 undefined
        fail: () => resolve({ code: 0, data: { token: 'mock_' + Date.now(), loginType: params.type } })
      })
    })
  },

  // ────────── 微信快捷登录 ─────────
  onWechatLogin() {
    const that = this
    
    // 直接调用 getUserProfile，确保是由用户点击触发
    wx.getUserProfile({
      desc: '用于完善会员资料',
      success(userRes) {
        console.log('微信授权成功:', userRes)
        const { nickName, avatarUrl } = userRes.userInfo || {}
        console.log('nickName:', nickName, 'avatarUrl:', avatarUrl)
        
        // 获取 code
        wx.login({
          success(wxRes) {
            wx.request({
              url: 'https://your-api-domain.com/api/wechatLogin',
              method: 'POST',
              data: { 
                code: wxRes.code,
                nickname: nickName,
                avatar: avatarUrl
              },
              success(apiRes) {
                console.log('API 返回:', apiRes)
                if (apiRes.data.code === 0) return that.handleLoginSuccess(apiRes.data.data)
                // 开发阶段模拟
                const mockPhone = '1' + Date.now()
                that.handleLoginSuccess({ 
                  nickname: nickName || '微信用户', 
                  avatar: avatarUrl || '', 
                  loginType: 'wechat', 
                  token: 'mock_' + Date.now(),
                  phone: mockPhone
                })
              },
              fail(apiErr) {
                console.log('API 请求失败:', apiErr)
                // 开发阶段模拟
                const mockPhone = '1' + Date.now()
                that.handleLoginSuccess({ 
                  nickname: nickName || '微信用户', 
                  avatar: avatarUrl || '', 
                  loginType: 'wechat', 
                  token: 'mock_' + Date.now(),
                  phone: mockPhone
                })
              }
            })
          },
          fail(wxErr) {
            console.log('微信登录失败:', wxErr)
            // 获取 code 失败，使用模拟数据
            const mockPhone = '1' + Date.now()
            that.handleLoginSuccess({ 
              nickname: nickName || '微信用户', 
              avatar: avatarUrl || '', 
              loginType: 'wechat', 
              token: 'mock_' + Date.now(),
              phone: mockPhone
            })
          }
        })
      },
      fail(err) {
        // 用户拒绝授权或开发者工具中无法弹出授权弹窗
        console.log('微信授权失败:', err)
        // 在开发环境下自动使用模拟数据登录
        const mockPhone = '1' + Date.now()
        that.handleLoginSuccess({ 
          nickname: '微信用户_' + Math.random().toString(36).substr(2, 6), 
          avatar: '', 
          loginType: 'wechat', 
          token: 'mock_' + Date.now(),
          phone: mockPhone
        })
      }
    })
  },

  // ────────── 登录成功 ──────────
  handleLoginSuccess(data) {
    // 防御：如果 data 为 undefined/null，用空对象兜底
    const safeData = data || {}
    const { phone } = this.data

    wx.setStorageSync('loginPhone', phone || '')
    if (safeData.token) wx.setStorageSync('token', safeData.token)

    // 确保 nickname 有值
    let nickname = safeData.nickname
    if (!nickname) {
      // 如果是手机号登录，使用手机号；如果是微信登录，使用默认昵称
      nickname = phone && phone.length === 11
        ? phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2')
        : '微信用户'
    }

    // 读取登录前用户可能已修改的信息（昵称、签名等），合并而不是覆盖
    const existing = wx.getStorageSync('userInfo') || {}
    wx.setStorageSync('userInfo', {
      ...existing,                              // 保留登录前的签名、昵称等
      nickname: safeData.nickname || existing.nickname || nickname,
      avatar: safeData.avatar || existing.avatar || '',
      signature: existing.signature || '',     // 保留登录前设置的签名
      phone: safeData.phone || phone || existing.phone || '',
      loginType: safeData.loginType || this.data.activeTab || existing.loginType,
      loginTime: Date.now()
    })

    this.clearTimer()
    wx.showToast({ title: '登录成功', icon: 'success' })
    setTimeout(() => wx.navigateBack(), 1500)
  },

  // ────────── 跳转 ──────────
  onGoRegister() { wx.navigateTo({ url: '/pages/register/register' }) },
  onGoResetPwd() { wx.navigateTo({ url: '/pages/reset-pwd/reset-pwd' }) },

  onInputFocus() {},
  onShareAppMessage() {}
})