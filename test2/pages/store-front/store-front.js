const merchantsData = require('../../data/merchants.js')
const modelsData = require('../../data/models.js')

Page({
  data: {
    merchant: null,
    models: []
  },

  onLoad(options) {
    const id = options.id
    const merchant = merchantsData.find(m => m.id === id)
    if (!merchant) {
      wx.showToast({ title: '店铺未找到', icon: 'none' })
      wx.navigateBack()
      return
    }

    // 内置模型
    const builtIn = modelsData
      .filter(m => m.merchantId === id)
      .map(m => ({ ...m, isCustom: false }))

    // 自定义模型（从 storage 读取）
    let custom = []
    try {
      custom = wx.getStorageSync('shop_models_' + id) || []
    } catch (e) {
      custom = []
    }

    // 上架状态
    let listedMap = {}
    try {
      listedMap = wx.getStorageSync('model_listed_' + id) || {}
    } catch (e) {
      listedMap = {}
    }

    // 合并并只显示已上架的
    const all = [...builtIn, ...custom]
      .filter(m => listedMap[m.id] !== undefined ? listedMap[m.id] : true)
      .map(m => ({
        ...m,
        name: m.name || '',
        description: m.description || '',
        thumbnail: m.thumbnail || '',
        category: m.category || 'prop',
        merchantName: merchant.name,
        merchantAvatar: merchant.avatar
      }))

    this.setData({ merchant, models: all })
  },

  onGoBack() {
    wx.navigateBack({
      fail: () => {
        wx.switchTab({ url: '/pages/index/index' })
      }
    })
  },

  onCardTap(e) {
    const model = e.detail.model
    if (!model || !model.id) {
      wx.showToast({ title: '模型信息错误', icon: 'none' })
      return
    }
    wx.navigateTo({
      url: `/pages/model-detail/model-detail?id=${model.id}`
    })
  },

  onContactMerchant() {
    const merchant = this.data.merchant
    if (!merchant) return
    const contact = merchant.contact
    wx.showActionSheet({
      itemList: [`微信: ${contact.wechat}`, `电话: ${contact.phone}`, `邮箱: ${contact.email}`],
      success(res) {
        if (res.tapIndex === 1) {
          wx.makePhoneCall({ phoneNumber: contact.phone.replace(/-/g, '') })
        }
      }
    })
  }
})
