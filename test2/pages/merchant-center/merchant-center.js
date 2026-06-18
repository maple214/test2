Page({
  data: {
    messages: [
      {
        id: 'msg-1',
        icon: '📢',
        title: '系统通知',
        preview: '您的店铺套餐即将到期，请及时续费',
        time: '10分钟前',
        unread: 2
      },
      {
        id: 'msg-2',
        icon: '👤',
        title: '星河模型工坊',
        preview: '您关注的商家发布了新模型',
        time: '1小时前',
        unread: 1
      },
      {
        id: 'msg-3',
        icon: '💬',
        title: '平台客服',
        preview: '您的问题已收到，我们会尽快处理',
        time: '昨天',
        unread: 0
      },
      {
        id: 'msg-4',
        icon: '💰',
        title: '支付通知',
        preview: '您的订单支付成功',
        time: '2天前',
        unread: 0
      }
    ]
  },

  onMessageTap(e) {
    const id = e.currentTarget.dataset.id
    wx.showToast({
      title: `查看消息 ${id}`,
      icon: 'none'
    })
  }
})
