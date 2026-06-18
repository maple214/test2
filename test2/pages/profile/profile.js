Page({
  data: {
    userInfo: {
      avatar: '',
      nickname: '',
      signature: ''
    },
    isMerchant: false,  // 是否商家
    isLoggedIn: false,  // 是否已登录
    menus: [
      { key: 'merchant', label: '商家入驻', icon: '🏪', desc: '成为商家，租赁展示位' },
      { key: 'history', label: '浏览记录', icon: '🕐', desc: '最近查看的模型' },
      { key: 'favorites', label: '我的收藏', icon: '⭐', desc: '收藏的模型' },
      { key: 'about', label: '关于平台', icon: 'ℹ️', desc: '了解3D模型展示平台' }
    ]
  },

  onLoad() {
    this.loadUserInfo()
    this.updateMenus()
  },

  onShow() {
    this.loadUserInfo()
    this.updateMenus()
  },

  loadUserInfo() {
    try {
      const stored = wx.getStorageSync('userInfo') || {}
      const token = wx.getStorageSync('token') || ''
      // 双重判断：有 phone 或有 token 即认为已登录
      const isLoggedIn = !!(stored.phone || token)

      const userInfo = isLoggedIn
        ? {
            avatar: stored.avatar || '',
            nickname: stored.nickname || '',
            signature: stored.signature || '',
            phone: stored.phone || '',
            merchantId: stored.merchantId || ''
          }
        : {
            avatar: '',
            nickname: '',
            signature: '',
            phone: '',
            merchantId: stored.merchantId || ''
          }

      const isMerchant = !!stored.merchantId
      this.setData({ userInfo, isMerchant, isLoggedIn })
      this.updateMenus()
    } catch (e) {
      console.error('加载用户信息失败:', e)
    }
  },

  // 根据是否商家动态更新菜单
  updateMenus() {
    const menuItems = this.data.isMerchant
      ? [
          { key: 'shop', label: '我的店铺', icon: '🏪', desc: '管理店铺信息和展示位' },
          { key: 'history', label: '浏览记录', icon: '🕐', desc: '最近查看的模型' },
          { key: 'favorites', label: '我的收藏', icon: '⭐', desc: '收藏的模型' },
          { key: 'about', label: '关于平台', icon: 'ℹ️', desc: '了解3D模型展示平台' }
        ]
      : [
          { key: 'merchant', label: '商家入驻', icon: '🏪', desc: '成为商家，租赁展示位' },
          { key: 'history', label: '浏览记录', icon: '🕐', desc: '最近查看的模型' },
          { key: 'favorites', label: '我的收藏', icon: '⭐', desc: '收藏的模型' },
          { key: 'about', label: '关于平台', icon: 'ℹ️', desc: '了解3D模型展示平台' }
        ]
    this.setData({ menus: menuItems })
  },

  // 跳转登录（统一入口）
  goLogin() {
    wx.navigateTo({ url: '/pages/login/login' })
  },

  onChooseAvatar() {
    if (!this.data.isLoggedIn) { this.goLogin(); return }

    wx.chooseImage({
      count: 1,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        const tempFilePath = res.tempFilePaths[0]
        this.setData({ 'userInfo.avatar': tempFilePath })
        this.saveUserInfo()
        wx.showToast({ title: '头像设置成功', icon: 'success' })
      },
      fail: () => {
        wx.showToast({ title: '取消选择', icon: 'none' })
      }
    })
  },

  onEditNickname() {
    if (!this.data.isLoggedIn) { this.goLogin(); return }

    const that = this
    wx.showModal({
      title: '修改昵称',
      editable: true,
      placeholderText: '请输入新昵称',
      confirmText: '保存',
      cancelText: '取消',
      success: (res) => {
        if (res.confirm && res.content && res.content.trim()) {
          const newNickname = res.content.trim()
          that.setData({
            'userInfo.nickname': newNickname
          })
          that.saveUserInfo()
          wx.showToast({ title: '昵称修改成功', icon: 'success' })
        }
      }
    })
  },

  onEditSignature() {
    if (!this.data.isLoggedIn) { this.goLogin(); return }

    const that = this
    wx.showModal({
      title: '修改签名',
      editable: true,
      placeholderText: '请输入签名',
      confirmText: '保存',
      cancelText: '取消',
      success: (res) => {
        if (res.confirm) {
          that.setData({
            'userInfo.signature': res.content ? res.content.trim() : ''
          })
          that.saveUserInfo()
          wx.showToast({ title: '签名修改成功', icon: 'success' })
        }
      }
    })
  },

  onLogin() {
    wx.navigateTo({ url: '/pages/login/login' })
  },

  onGuest() {
    wx.showToast({ title: '已进入游客模式', icon: 'none' })
  },

  onSettings() {
    wx.showToast({ title: '设置功能', icon: 'none' })
  },

  onContact() {
    wx.showToast({ title: '客服功能', icon: 'none' })
  },

  saveUserInfo() {
    try {
      // 先读取现有的存储数据，保留所有字段
      const stored = wx.getStorageSync('userInfo') || {}
      // 合并当前数据和存储数据，保留原有字段
      const mergedData = {
        ...stored,
        nickname: this.data.userInfo.nickname,
        avatar: this.data.userInfo.avatar,
        signature: this.data.userInfo.signature
      }
      wx.setStorageSync('userInfo', mergedData)
    } catch (e) {
      console.error('保存用户信息失败:', e)
    }
  },

  onMenuTap(e) {
    const key = e.currentTarget.dataset.key
    if (key === 'merchant') {
      // 普通用户 → 入驻流程
      this.doMerchantRegister()
    } else if (key === 'shop') {
      // 商家 → 进入店铺设置
      const merchantId = this.data.userInfo.merchantId
      if (merchantId) {
        wx.navigateTo({ url: `/pages/shop-settings/shop-settings?id=${merchantId}` })
      } else {
        wx.showToast({ title: '店铺信息异常', icon: 'none' })
      }
    } else if (key === 'favorites') {
      wx.navigateTo({ url: '/pages/favorites/favorites' })
    } else if (key === 'logout') {
      this.onLogout()
    } else {
      wx.showToast({ title: '功能开发中', icon: 'none' })
    }
  },

  // 商家入驻
  doMerchantRegister() {
    if (!this.data.isLoggedIn) { this.goLogin(); return }
    const merchantsData = require('../../data/merchants.js')
    const merchants = merchantsData
    const randomMerchant = merchants[Math.floor(Math.random() * merchants.length)]

    wx.showModal({
      title: '商家入驻',
      content: `将使用「${randomMerchant.name}」作为您的店铺，确认入驻？`,
      confirmText: '确认入驻',
      cancelText: '暂不',
      success: (res) => {
        if (res.confirm) {
          const stored = wx.getStorageSync('userInfo') || {}
          wx.setStorageSync('userInfo', {
            ...stored,
            merchantId: randomMerchant.id,
            merchantName: randomMerchant.name
          })
          this.setData({
            isMerchant: true,
            'userInfo.merchantId': randomMerchant.id
          })
          this.updateMenus()
          wx.showToast({ title: '入驻成功！', icon: 'success' })
        }
      }
    })
  },

  onLogout() {
    wx.showModal({
      title: '退出登录',
      content: '确定要退出当前账号吗？',
      confirmText: '确定',
      cancelText: '取消',
      success: (res) => {
        if (res.confirm) {
          // 清除本地存储
          wx.removeStorageSync('userInfo')
          wx.removeStorageSync('token')
          // 重置用户信息
          this.setData({
            isMerchant: false,
            isLoggedIn: false,
            userInfo: {
              avatar: '',
              nickname: '',
              signature: '',
              phone: '',
              merchantId: ''
            }
          })
          this.updateMenus()
          wx.showToast({ title: '已退出登录', icon: 'success' })
        }
      }
    })
  }
})
