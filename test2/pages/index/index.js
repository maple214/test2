const modelsData = require('../../data/models.js')
const bannersData = require('../../data/banners.js')

Page({
  data: {
    banners: [],
    hotModels: [],
    displayHotModels: [],
    hotExpanded: false,
    featuredModels: [],
    categories: [
      { key: 'creature', label: '生物' },
      { key: 'industrial', label: '工业模具' },
      { key: 'toy', label: '玩具' },
      { key: 'plant', label: '植物' },
      { key: 'prop', label: '道具' }
    ]
  },

  onLoad() {
    const hotModels = this.calculateHotModels()
    this.setData({
      banners: bannersData,
      hotModels: hotModels,
      displayHotModels: hotModels.slice(0, 2),
      featuredModels: modelsData.slice(0, 4)
    })
  },

  calculateHotModels() {
    const weightViews = 0.4
    const weightFavorites = 0.6
    
    return modelsData
      .map(model => ({
        ...model,
        hotScore: model.views * weightViews + model.favorites * weightFavorites * 10
      }))
      .sort((a, b) => b.hotScore - a.hotScore)
  },

  onExpandHot() {
    this.setData({
      displayHotModels: this.data.hotModels,
      hotExpanded: true
    })
  },

  onCollapseHot() {
    this.setData({
      displayHotModels: this.data.hotModels.slice(0, 2),
      hotExpanded: false
    })
  },

  onCardTap(e) {
    const model = e.detail?.model || e.currentTarget?.dataset?.model
    if (!model) return
    
    wx.navigateTo({
      url: `/pages/model-detail/model-detail?id=${model.id}`
    })
  },

  onBannerTap(e) {
    const link = e.currentTarget.dataset.link
    if (link) {
      wx.navigateTo({ url: link })
    }
  },

  onCategoryTap(e) {
    const cat = e.currentTarget.dataset.category
    wx.switchTab({ url: '/pages/model-list/model-list' })
    wx.setStorageSync('activeCategory', cat)
  },

  onGoBrowse() {
    wx.switchTab({ url: '/pages/model-list/model-list' })
  },

  onGoMerchant() {
    wx.switchTab({ url: '/pages/merchant-center/merchant-center' })
  }
})