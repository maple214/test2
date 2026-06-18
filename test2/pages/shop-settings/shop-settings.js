const merchantsData = require('../../data/merchants.js')
const modelsData = require('../../data/models.js')

Page({
  data: {
    merchantId: '',
    form: {
      avatar: '',
      cover: '',
      name: '',
      description: '',
      wechat: '',
      phone: '',
      email: ''
    },
    // 模型管理
    models: [],            // 该店铺的所有模型
    showAddModal: false,   // 是否显示添加模型弹窗
    newModel: {            // 添加模型表单
      name: '',
      description: '',
      thumbnail: '',
      modelUrl: '',
      category: 'prop',
      tags: ''
    },
    categories: [
      { key: 'creature', label: '生物' },
      { key: 'industrial', label: '工业模具' },
      { key: 'toy', label: '玩具' },
      { key: 'plant', label: '植物' },
      { key: 'prop', label: '道具' }
    ]
  },

  onLoad(options) {
    const id = options.id
    if (!id) {
      wx.showToast({ title: '缺少店铺ID', icon: 'none' })
      return
    }

    const merchant = merchantsData.find(m => m.id === id)
    if (!merchant) {
      wx.showToast({ title: '店铺未找到', icon: 'none' })
      return
    }

    this.setData({
      merchantId: id,
      form: {
        avatar: merchant.avatar || '',
        cover: merchant.cover || '',
        name: merchant.name || '',
        description: merchant.description || '',
        wechat: (merchant.contact && merchant.contact.wechat) || '',
        phone: (merchant.contact && merchant.contact.phone) || '',
        email: (merchant.contact && merchant.contact.email) || ''
      }
    })

    this.loadModels()
  },

  // ─── 加载模型列表：内置模型 + 自定义模型 ───
  loadModels() {
    const { merchantId } = this.data

    // 内置模型（属于该商家）
    const builtIn = modelsData
      .filter(m => m.merchantId === merchantId)
      .map(m => ({ ...m, isCustom: false }))

    // 自定义模型（从 storage 读取）
    let custom = []
    try {
      custom = wx.getStorageSync('shop_models_' + merchantId) || []
    } catch (e) {
      custom = []
    }

    // 读取上架/下架状态
    let listedMap = {}
    try {
      listedMap = wx.getStorageSync('model_listed_' + merchantId) || {}
    } catch (e) {
      listedMap = {}
    }

    // 默认内置模型全部上架，自定义模型全部上架
    const all = [...builtIn, ...custom].map(m => ({
      ...m,
      listed: listedMap[m.id] !== undefined ? listedMap[m.id] : true
    }))

    this.setData({ models: all })
  },

  // ─── 上架/下架切换 ───
  onToggleModel(e) {
    const modelId = e.currentTarget.dataset.id
    const { merchantId, models } = this.data
    const idx = models.findIndex(m => m.id === modelId)
    if (idx === -1) return

    const newListed = !models[idx].listed
    models[idx].listed = newListed
    this.setData({ models })

    // 持久化
    try {
      const map = wx.getStorageSync('model_listed_' + merchantId) || {}
      map[modelId] = newListed
      wx.setStorageSync('model_listed_' + merchantId, map)
    } catch (e) {
      console.error('保存上架状态失败:', e)
    }

    wx.showToast({
      title: newListed ? '已上架' : '已下架',
      icon: 'none'
    })
  },

  // ─── 添加模型 ───
  onShowAddModal() {
    this.setData({
      showAddModal: true,
      newModel: {
        name: '',
        description: '',
        thumbnail: '',
        modelUrl: '',
        category: 'prop',
        tags: ''
      }
    })
  },

  onHideAddModal() {
    this.setData({ showAddModal: false })
  },

  onNewModelInput(e) {
    const field = e.currentTarget.dataset.field
    this.setData({ ['newModel.' + field]: e.detail.value })
  },

  onNewModelCategory(e) {
    const cat = e.currentTarget.dataset.cat
    this.setData({ 'newModel.category': cat })
  },

  onChooseModelThumb() {
    const that = this
    wx.chooseImage({
      count: 1,
      sizeType: ['compressed'],
      sourceType: ['album'],
      success(res) {
        that.setData({ 'newModel.thumbnail': res.tempFilePaths[0] })
      }
    })
  },

  onSubmitNewModel() {
    const { newModel, merchantId, form } = this.data

    if (!newModel.name.trim()) {
      wx.showToast({ title: '请输入模型名称', icon: 'none' })
      return
    }
    if (!newModel.thumbnail) {
      wx.showToast({ title: '请上传缩略图', icon: 'none' })
      return
    }

    const id = 'custom-' + Date.now()
    const tags = newModel.tags
      ? newModel.tags.split(/[,，]/).map(t => t.trim()).filter(Boolean)
      : []

    const model = {
      id,
      name: newModel.name.trim(),
      description: newModel.description.trim() || newModel.name.trim(),
      thumbnail: newModel.thumbnail,
      modelUrl: newModel.modelUrl.trim() || '',
      category: newModel.category,
      tags,
      faces: 0,
      format: '',
      merchantId,
      merchantName: form.name,
      merchantAvatar: form.avatar,
      views: 0,
      favorites: 0,
      isCustom: true,
      listed: true
    }

    // 保存到 storage
    let custom = []
    try {
      custom = wx.getStorageSync('shop_models_' + merchantId) || []
    } catch (e) {
      custom = []
    }
    custom.unshift(model)
    wx.setStorageSync('shop_models_' + merchantId, custom)

    // 更新上架状态
    try {
      const map = wx.getStorageSync('model_listed_' + merchantId) || {}
      map[id] = true
      wx.setStorageSync('model_listed_' + merchantId, map)
    } catch (e) {}

    this.setData({
      showAddModal: false,
      models: [model, ...this.data.models]
    })

    wx.showToast({ title: '添加成功', icon: 'success' })
  },

  // ─── 删除自定义模型 ───
  onDeleteModel(e) {
    const modelId = e.currentTarget.dataset.id
    const model = this.data.models.find(m => m.id === modelId)
    if (!model || !model.isCustom) {
      wx.showToast({ title: '内置模型不可删除', icon: 'none' })
      return
    }

    const that = this
    wx.showModal({
      title: '删除模型',
      content: `确定要删除「${model.name}」吗？`,
      confirmText: '删除',
      confirmColor: '#ff4757',
      cancelText: '取消',
      success(res) {
        if (res.confirm) {
          const { merchantId } = that.data
          // 从 storage 移除
          let custom = []
          try {
            custom = wx.getStorageSync('shop_models_' + merchantId) || []
          } catch (e) {}
          custom = custom.filter(m => m.id !== modelId)
          wx.setStorageSync('shop_models_' + merchantId, custom)

          // 更新列表
          const models = that.data.models.filter(m => m.id !== modelId)
          that.setData({ models })
          wx.showToast({ title: '已删除', icon: 'success' })
        }
      }
    })
  },

  // ─── 表单 ───
  onInput(e) {
    const field = e.currentTarget.dataset.field
    const value = e.detail.value
    this.setData({ [`form.${field}`]: value })
  },

  onChooseAvatar() {
    const that = this
    wx.chooseImage({
      count: 1,
      sizeType: ['compressed'],
      sourceType: ['album'],
      success(res) {
        that.setData({ 'form.avatar': res.tempFilePaths[0] })
        wx.showToast({ title: '头像已更新', icon: 'success' })
      }
    })
  },

  onChooseCover() {
    const that = this
    wx.chooseImage({
      count: 1,
      sizeType: ['compressed'],
      sourceType: ['album'],
      success(res) {
        that.setData({ 'form.cover': res.tempFilePaths[0] })
        wx.showToast({ title: '封面已更新', icon: 'success' })
      }
    })
  },

  onGoBack() {
    wx.navigateBack({
      fail: () => {
        wx.switchTab({ url: '/pages/profile/profile' })
      }
    })
  },

  onSave() {
    const { form } = this.data
    if (!form.name.trim()) {
      wx.showToast({ title: '请输入店铺名称', icon: 'none' })
      return
    }
    wx.showToast({ title: '保存成功', icon: 'success' })
    setTimeout(() => wx.navigateBack(), 1500)
  }
})
