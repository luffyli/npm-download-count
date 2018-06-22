import * as echarts from 'echarts/lib/echarts'
import 'echarts/lib/chart/line'
import 'echarts/lib/chart/bar'
import 'echarts/lib/component/tooltip'
import 'echarts/lib/component/legend'
import 'echarts/lib/component/dataZoom'
import dayjs from 'dayjs'

var charts = {}

export const initChart = (id, legendData, xAxisData, series, queryForm) => {
  charts[id] = echarts.init(document.getElementById(id), null, {renderer: 'svg'})
  let chartOpention = {
    title: {
      left: '3%',
      text: '',
      textStyle: {
        fontSize: 14,
        fontWeight: 500
      }
    },
    legend: {
      data: legendData
    },
    tooltip: {
      trigger: 'axis',
      formatter: (params) => {
        let sTip = ''
        if (id === 'total_chart') {
          sTip = `<b>${params[0].name}</b><br/>`
          for (let i = 0, len = params.length; i < len; i++) {
            if (i < len - 1) {
              sTip += params[i].marker + '<b>' + params[i].seriesName + '</b>：<b>' + params[i].value + '</b><br/>'
            } else {
              sTip += params[i].marker + '<b>' + params[i].seriesName + '</b>：<b>' + params[i].value + '</b>'
            }
          }
        } else {
          switch (id) {
            case 'day_chart':
              sTip = params[0].axisValue + '<br/>'
              break
            case 'week_chart':
              if (params[0].dataIndex === 0) {
                sTip = queryForm.datetime[0] + ' 至 ' + params[0].axisValue + '<br/>'
              } else {
                sTip = dayjs(params[0].axisValue).startOf('week').format('YYYY-MM-DD') + ' 至 ' + params[0].axisValue + '<br/>'
              }
              break
            case 'month_chart':
              if (params[0].dataIndex === 0) {
                sTip = queryForm.datetime[0] + ' 至 ' + params[0].axisValue + '<br/>'
              } else {
                sTip = dayjs(params[0].axisValue).startOf('month').format('YYYY-MM-DD') + ' 至 ' + params[0].axisValue + '<br/>'
              }
              break
            case 'year_chart':
              if (params[0].dataIndex === 0) {
                sTip = queryForm.datetime[0] + ' 至 ' + params[0].axisValue + '<br/>'
              } else {
                sTip = dayjs(params[0].axisValue).startOf('year').format('YYYY-MM-DD') + ' 至 ' + params[0].axisValue + '<br/>'
              }
              break
          }
          for (let i = 0, len = params.length; i < len; i++) {
            if (i < len - 1) {
              sTip += params[i].marker + '<b>' + params[i].seriesName + '</b>：<b>' + params[i].value + '</b><br/>'
            } else {
              sTip += params[i].marker + '<b>' + params[i].seriesName + '</b>：<b>' + params[i].value + '</b>'
            }
          }
        }
        return sTip
      }
    },
    dataZoom: [{
      type: 'inside',
      zoomOnMouseWheel: false
    }, {
      handleSize: '80%',
      handleStyle: {
        color: '#fff',
        shadowBlur: 3,
        shadowColor: 'rgba(0, 0, 0, 0.6)',
        shadowOffsetX: 2,
        shadowOffsetY: 2
      }
    }],
    grid: {
      left: '3%',
      right: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      axisTick: {
        show: false
      },
      axisLine: {
        lineStyle: {
          color: '#609ee9'
        }
      },
      data: xAxisData
    },
    yAxis: {
      type: 'value',
      splitLine: {
        lineStyle: {
          color: ['#D4DFF5']
        }
      },
      axisLine: {
        lineStyle: {
          color: '#609ee9'
        }
      },
      axisLabel: {
        formatter: function (val) {
          if (val >= 1000000) {
            val = (val / 1000000) + 'M'
          } else if (val >= 1000) {
            val = (val / 1000) + 'K'
          }
          return val
        }
      }
    },
    series: series
  }
  charts[id].setOption(chartOpention, true)
  setTimeout(() => {
    charts[id].resize()
  }, 0)
  return charts[id]
}
