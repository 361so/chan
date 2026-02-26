import { defineStore } from 'pinia'
import QQMapWX from 'qqmap-wx-jssdk'

export const useLocationStore = defineStore('location', {
  state: () => ({
    latitude: 0,
    longitude: 0,
    address: '定位中...',
    error: null
  }),
  actions: {
    updateLocation() {
      return new Promise((resolve, reject) => {
        // 实例化API核心类
        // 申请地址：https://lbs.qq.com/dev/console/key/manage
        const qqmapsdk = new QQMapWX({
            key: 'LWHBZ-LKJ34-HABUE-X55XF-BZNPK-2VF7I' // 这是一个示例Key，请替换为您在腾讯位置服务申请的Key
        });

        uni.getLocation({
          type: 'gcj02',
          isHighAccuracy: true,
          // geocode: true, // 小程序中通常无效，需使用SDK
          success: (res) => {
            
            this.latitude = res.latitude;
            this.longitude = res.longitude;
            this.error = null;
            
            // 腾讯地图逆地理编码
            qqmapsdk.reverseGeocoder({
              location: {
                latitude: res.latitude,
                longitude: res.longitude
              },
              success: (geoRes) => {
                if (geoRes.result && geoRes.result.formatted_addresses && geoRes.result.formatted_addresses.recommend) {
                   this.address = geoRes.result.formatted_addresses.recommend;
                } else if (geoRes.result && geoRes.result.address) {
                   this.address = geoRes.result.address;
                } else {
                   this.address = `Lat: ${res.latitude.toFixed(4)}, Lng: ${res.longitude.toFixed(4)}`;
                }
                resolve(res);
              },
              fail: (err) => {
                console.error('QQMap reverseGeocoder failed', err);
                this.address = `Lat: ${res.latitude.toFixed(4)}, Lng: ${res.longitude.toFixed(4)}`;
                resolve(res);
              }
            });
          },
          fail: (err) => {
            this.error = err.errMsg;
            this.address = '定位失败';
            reject(err);
          }
        });
      });
    },
    setAddress(addr) {
      this.address = addr
    },
    setLatitude(lat) {
      this.latitude = lat
    },
    setLongitude(lng) {
      this.longitude = lng
    }
  }
})
