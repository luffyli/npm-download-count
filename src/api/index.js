import fetch from 'isomorphic-fetch'

// 超时时间
const timeout = 10000

// 获取包下载量
export const getPackageData = (datetime, packageName) => {
  let url = `https://api.npmjs.org/downloads/range/${datetime[0]}:${datetime[1]}/${packageName}`
  return fetch(url, { timeout })
}

// 获取用户名下发布的包信息
export const getUserData = (username) => {
  let offset = 0
  let size = 20
  let url = `https://api.npms.io/v2/search?q=maintainer:${username}&size=${size}&from=${offset}`
  return fetch(url, { timeout })
}
