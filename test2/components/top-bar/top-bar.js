Component({
  properties: {
    title: {
      type: String,
      value: ''
    },
    showBack: {
      type: Boolean,
      value: false
    }
  },

  methods: {
    onBack() {
      wx.navigateBack()
    }
  }
})