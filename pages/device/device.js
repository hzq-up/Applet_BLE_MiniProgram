const app = getApp()
Page({
  data: {
    inputText: 'Hello World!',
    receiveText: '',
    name: '',
    connectedDeviceId: '',
    services: {},
    characteristics: {},
    connected: true
  },
  bindInput: function (e) {
    this.setData({
      inputText: e.detail.value
    })
    console.log(e.detail.value)
  },
  //向蓝牙发送消息
  Send: function () {
    var that = this
    if (that.data.connected) {
      var buffer = new ArrayBuffer(that.data.inputText.length)
      var dataView = new Uint8Array(buffer)
      for (var i = 0; i < that.data.inputText.length; i++) {
        dataView[i] = that.data.inputText.charCodeAt(i)
      }

      wx.writeBLECharacteristicValue({
        deviceId: that.data.connectedDeviceId,
        serviceId: that.data.services[1].uuid,
        characteristicId: that.data.characteristics[3].uuid,
        value: buffer,
        success: function (res) {
          console.log('发送成功')
        }
      })
    }
    else {
      wx.showModal({
        title: '提示',
        content: '蓝牙已断开',
        showCancel: false,
        success: function (res) {
          that.setData({
            searching: false
          })
        }
      })
    }
  },
  // 获取支持 notify 或者 indicate 的特征值id
  getNotifyCharaterId: function () {
    var that = this;
    wx.getBLEDeviceServices({
      deviceId: that.data.connectedDeviceId,
      success: function (res) {
        console.log(res.services)
        console.log("service 服务特征值")
        that.setData({
          services: res.services
          // service 服务特征值
        })
        that.getCharacteristics();
      }
    })
  },
  // 获取蓝牙设备某个服务中支持notify 或者 indicate的特征值
  getCharacteristics: function () {
    var that = this;
    var index = 0;
    var notify = false;
    wx.getBLEDeviceCharacteristics({
      deviceId: that.data.connectedDeviceId,
      serviceId: that.data.services[index].uuid,
      success: function (res) {
        console.log(res.characteristics)
        // console.log(that.data.services)
        // that.setData({
        //   characteristics: res.characteristics
        // })

        for (var i = 0; i < res.characteristics.length; ++i) {
          var properties = res.characteristics[i].properties;
          var notifyCharaterId = res.characteristics[i].uuid;
          if (properties.notify) {
            app.BLEInformation.notifyCharaterId = notifyCharaterId;
            notify = true;
            break;
          }else {
            // if(index == that.data.services.length) {
            notify = false
            // }
          }
        }
        if(notify) {
          app.BLEInformation.notifyServiceId = that.data.services[index].uuid;
        }else {
          index++;
          that.getCharacteristics();
          if(index == that.data.services.length) {
            wx.showModal({
              title: '提示',
              content: '找不到该读写的特征值',
            })
          }
        }

      }
    })
  },
  // 监听蓝牙设备发送的数据
  monitorCharacteristicValueChange: function () {
    var that = this;
    wx.notifyBLECharacteristicValueChange({
      state: true,
      deviceId: that.data.connectedDeviceId,
      // serviceId: that.data.services[1].uuid,
      serviceId: app.BLEInformation.notifyServiceId,
      // characteristicId: that.data.characteristics[2].uuid,
      characteristicId: app.BLEInformation.notifyCharaterId,
      success: function (res) {
        // console.log('启用notify成功')
        console.log('notifyBLECharacteristicValueChange success', res);
        wx.onBLECharacteristicValueChange(function (res) {
          console.log(res)
          var receiveText = app.buf2string(res.value)
          console.log('接收到数据：' + receiveText)
          that.setData({
            receiveText: receiveText
          })
        })
      }
    })
  },
  onLoad: function (options) {
    var that = this
    console.log(options)
    that.setData({
      name: options.name,
      connectedDeviceId: options.connectedDeviceId
    })
    that.getNotifyCharaterId();
    // 监听蓝牙设备发送的数据
    that.monitorCharacteristicValueChange();
    wx.onBLEConnectionStateChange(function (res) {
      console.log(res.connected)
      that.setData({
        connected: res.connected
      })
    })
    // wx.onBLECharacteristicValueChange(function (res) {
    //   console.log(res)
    //   var receiveText = app.buf2string(res.value)
    //   console.log('接收到数据：' + receiveText)
    //   that.setData({
    //     receiveText: receiveText
    //   })
    // })

  },
  onReady: function () {

  },
  onShow: function () {

  },
  onHide: function () {

  }
})