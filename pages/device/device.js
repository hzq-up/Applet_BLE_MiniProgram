const app = getApp()
Page({
  data: {
    inputText: 'Hello World!',
    receiveText: '',
    name: '',
    connectedDeviceId: '',
    services: {},
    characteristics: {},
    connected: true,
    serviceIndex: 0,
    notify: false,
    write: false,
    read: false
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
        serviceId: app.BLEInformation.writeServiceId,
        characteristicId: app.BLEInformation.writeCharaterId,
        value: buffer,
        success: function (res) {
          console.log('发送成功')
        }
      })
    } else {
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
    var index = that.data.serviceIndex;
    var notify = that.data.notify;
    var write = that.data.write;
    var read = that.data.read;
    wx.getBLEDeviceCharacteristics({
      deviceId: that.data.connectedDeviceId,
      serviceId: that.data.services[index].uuid,
      success: function (res) {
        // console.log(res.characteristics)
        for (var i = 0; i < res.characteristics.length; ++i) {
          var properties = res.characteristics[i].properties;
          var charaterId = res.characteristics[i].uuid;

          if (!notify) {
            if (properties.notify) {
              app.BLEInformation.notifyCharaterId = charaterId;
              app.BLEInformation.notifyServiceId = that.data.services[index].uuid;
              notify = true;
            }
          }
          if (!write) {
            if (properties.write) {
              app.BLEInformation.writeCharaterId = charaterId;
              app.BLEInformation.writeServiceId = that.data.services[index].uuid;
              write = true;
            }
          }
          if (!read) {
            if (properties.read) {
              app.BLEInformation.readCharaterId = charaterId;
              app.BLEInformation.readServiceId = that.data.services[index].uuid;
              read = true;
            }
          }
        }
        if (!write || !notify || !read) {
          index++
          that.setData({
            write: write,
            read: read,
            notify: notify,
            serviceIndex: index
          })
          if (index == that.data.services.length) {
            // that.setData({
            //   write: false,
            //   read: false,
            //   notify: false,
            //   serviceIndex: 0
            // })
            wx.showModal({
              title: '提示',
              content: '找不到该读写的特征值',
            })
          } else {
            that.getCharacteristics();
          }
        } else {
          console.log(res.characteristics);
          console.log("write:"+app.BLEInformation.writeCharaterId)
          console.log("read:"+app.BLEInformation.readCharaterId)
          console.log("notify:"+app.BLEInformation.notifyCharaterId)
          that.monitorCharacteristicValueChange();
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
        wx.onBLECharacteristicValueChange(function (r) {
          console.log(r)
          var receiveText = app.buf2string(r.value)
          console.log('接收到数据：' + receiveText)
          that.setData({
            receiveText: receiveText
          })
        })
        // setTimeout(function () {
        //   wx.onBLECharacteristicValueChange(function (r) {
        //     console.log(r)
        //     var receiveText = app.buf2string(r.value)
        //     console.log('接收到数据：' + receiveText)
        //     that.setData({
        //       receiveText: receiveText
        //     })
        //   })
        // }, 1000);
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