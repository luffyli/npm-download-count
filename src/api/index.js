import axios from 'axios'

const service = axios.create({
  timeout: 10000
})

// 获取包下载量
export const getPackageData = (datetime, packageName) => {
  let url = `https://api.npmjs.org/downloads/range/${datetime[0]}:${datetime[1]}/${packageName}`
  return service.get(url)
}

// 获取用户名下发布的包信息
export const getUserData = (username) => {
  let offset = 0
  let size = 18 // 默认获取的包数
  let url = `https://api.npms.io/v2/search?q=maintainer:${username}&size=${size}&from=${offset}`
  return service.get(url)
}
