const models = require('../../data/models.js')

Page({
  data: {
    favoriteModels: []
  },

  onLoad() {
    this.loadFavorites()
  },

  onShow() {
    this.loadFavorites()
  },

  loadFavorites() {
    try {
      const favoriteIds = wx.getStorageSync('favorites') || []
      const favoriteModels = models.filter(model => favoriteIds.includes(model.id)).map(model => ({
        ...model,
        categoryText: this.getCategoryText(model.category)
      }))
      this.setData({ favoriteModels })
    } catch (e) {
      console.error('加载收藏失败:', e)
      this.setData({ favoriteModels: [] })
    }
  },

  getCategoryText(category) {
    const map = {
      'creature': '生物',
      'industrial': '工业模具',
      'toy': '玩具',
      'plant': '植物',
      'prop': '道具'
    }
    return map[category] || '道具'
  },

  onModelTap(e) {
    const model = e.currentTarget.dataset.model
    wx.navigateTo({
      url: `/pages/model-detail/model-detail?id=${model.id}`
    })
  },

  onRemoveFavorite() {
    const modelId = arguments[0].currentTarget.dataset.id
    
    wx.showModal({
      title: '确认取消收藏',
      content: '确定要取消收藏这个模型吗？',
      success: (res) => {
        if (res.confirm) {
          try {
            let favorites = wx.getStorageSync('favorites') || []
            favorites = favorites.filter(id => id !== modelId)
            wx.setStorageSync('favorites', favorites)
            this.loadFavorites()
            wx.showToast({ title: '已取消收藏', icon: 'success' })
          } catch (e) {
            console.error('取消收藏失败:', e)
            wx.showToast({ title: '操作失败', icon: 'none' })
          }
        }
      }
    })
  }
})