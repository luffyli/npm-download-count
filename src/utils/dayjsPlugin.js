// 扩展 dayjs() 实例
export default (option, dayjsClass, dayjsFactory) => {
  // dayjs.week() 当前时间是本年第几周
  dayjsFactory.week = (arg = '') => {
    let today = new Date(arg)
    let firstDay = new Date(today.getFullYear(), 0, 1)
    let dayOfWeek = firstDay.getDay()
    let spendDay = 1
    if (dayOfWeek !== 0) {
      // 周日是一周的开始
      spendDay = 7 - dayOfWeek
    }
    firstDay = new Date(today.getFullYear(), 0, 1 + spendDay)
    let d = Math.ceil((today.valueOf() - firstDay.valueOf()) / 86400000)
    let result = Math.ceil(d / 7)
    return result + 1
  }
}
