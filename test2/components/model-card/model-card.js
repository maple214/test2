Component({
  properties: {
    model: {
      type: Object,
      value: {}
    }
  },

  data: {
    isFavorite: false,
    facesText: '',
    categoryText: ''
  },

  observers: {
    'model': function(model) {
      if (model) {
        this.loadFavoriteStatus(model.id)
        this.setData({ 
          facesText: model.faces ? ((model.faces / 1000).toFixed(1) + 'K面') : '',
          categoryText: this.getCategoryText(model.category)
        })
      }
    }
  },

  methods: {
    onTap() {
      this.triggerEvent('tap', { model: this.properties.model })
    },

    loadFavoriteStatus(modelId) {
      try {
        const favorites = wx.getStorageSync('favorites') || []
        this.setData({ isFavorite: favorites.includes(modelId) })
      } catch (e) {
        console.error('加载收藏状态失败:', e)
        this.setData({ isFavorite: false })
      }
    },

    onFavorite() {
      const modelId = this.properties.model.id
      let favorites = []
      
      try {
        favorites = wx.getStorageSync('favorites') || []
      } catch (e) {
        console.error('读取收藏失败:', e)
      }
      
      let newFavorites
      let isFavorite
      
      if (favorites.includes(modelId)) {
        newFavorites = favorites.filter(id => id !== modelId)
        isFavorite = false
        wx.showToast({ title: '已取消收藏', icon: 'none' })
      } else {
        newFavorites = [...favorites, modelId]
        isFavorite = true
        wx.showToast({ title: '收藏成功', icon: 'success' })
      }
      
      try {
        wx.setStorageSync('favorites', newFavorites)
      } catch (e) {
        console.error('保存收藏失败:', e)
      }
      
      this.setData({ isFavorite })
      this.triggerEvent('favorite', { modelId, isFavorite })
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
    }
  }
})