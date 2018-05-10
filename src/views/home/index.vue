<template>
  <div>
    <el-container>
      <el-header>npm包下载统计</el-header>
      <el-main>
        <el-form :inline="true" :model="queryForm" :rules="rules" ref="queryForm" class="query-form-inline">
          <el-form-item prop="name">
            <el-input placeholder="请输入" v-model="queryForm.name" class="input-with-select">
              <el-select v-model="searchType" slot="prepend" placeholder="请选择">
                <el-option label="包名" value="1"></el-option>
                <el-option label="用户名" value="2"></el-option>
              </el-select>
            </el-input>
          </el-form-item>
          <el-form-item label="日期范围" prop="datetime">
            <el-date-picker v-model="queryForm.datetime" type="daterange" align="right" value-format="yyyy-MM-dd" unlink-panels range-separator="至" start-placeholder="开始日期"
                end-placeholder="结束日期" :picker-options="pickerOptions">
            </el-date-picker>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="onSubmit" v-loading.fullscreen.lock="fullscreenLoading">查询</el-button>
          </el-form-item>
        </el-form>
        <el-card class="box-card" v-show="packageInfo.length > 0">
          <div slot="header" class="clearfix">
            <div class="total-download-tag">
              <span>范围内下载总数：</span>
              <el-tag v-for="(item, index) in packageInfo" :key="index"><a class="link_to_npm" :href="`https://www.npmjs.com/package/${item.name}`" target="_blank">{{ item.name }}</a>：{{ item.total }}</el-tag>
            </div>
          </div>
          <div id="chart-render"></div>
        </el-card>
      </el-main>
    </el-container>
  </div>
</template>

<script>
import * as echarts from 'echarts/lib/echarts'
import 'echarts/lib/chart/line'
import 'echarts/lib/component/tooltip'
// import 'echarts/lib/component/title'
import 'echarts/lib/component/legend'
import 'echarts/lib/component/dataZoom'
import fetch from 'isomorphic-fetch'

export default {
  data () {
    let checkDateLength = (rule, value, callback) => {
      let timeLen = new Date(value[1]).getTime() - new Date(value[0]).getTime()
      let dataLen = timeLen / 86400000
      if (dataLen > 546) { // 超过546天
        this.$notify({
          title: '提示',
          message: '日期范围超出546天跨度，超出部分的数据不显示！',
          type: 'warning'
        })
        callback()
      } else {
        callback()
      }
    }
    return {
      fullscreenLoading: false,
      packageInfo: [],
      packageName: 'vue',
      searchType: '1',
      queryForm: {
        name: 'vue',
        datetime: ['2018-04-09', '2018-05-09']
      },
      npmDataChart: '',
      chartOpention: '',
      pickerOptions: {
        shortcuts: [{
          text: '最近一周',
          onClick (picker) {
            const end = new Date()
            const start = new Date()
            start.setTime(start.getTime() - 3600 * 1000 * 24 * 7)
            picker.$emit('pick', [start, end])
          }
        }, {
          text: '最近一个月',
          onClick (picker) {
            const end = new Date()
            const start = new Date()
            start.setTime(start.getTime() - 3600 * 1000 * 24 * 30)
            picker.$emit('pick', [start, end])
          }
        }, {
          text: '最近三个月',
          onClick (picker) {
            const end = new Date()
            const start = new Date()
            start.setTime(start.getTime() - 3600 * 1000 * 24 * 90)
            picker.$emit('pick', [start, end])
          }
        }]
      },
      rules: {
        name: [
          { required: true, message: '请输入', trigger: 'blur' }
        ],
        datetime: [
          { required: true, message: '请选择日期范围', trigger: 'change' },
          { validator: checkDateLength, trigger: 'change' }
        ]
      }
    }
  },
  mounted () {
    this.npmDataChart = echarts.init(document.getElementById('chart-render'), null, {renderer: 'svg'})
    this.initChartOption()
    this.getPackageData()
    window.onresize = this.npmDataChart.resize
  },
  methods: {
    getPackageData () {
      let url = `https://api.npmjs.org/downloads/range/${this.queryForm.datetime[0]}:${this.queryForm.datetime[1]}/${this.packageName}`
      this.fullscreenLoading = true
      fetch(url, {timeout: 10000})
        .then((response) => {
          if (response.status === 404) {
            this.fullscreenLoading = false
            this.$notify({
              title: '错误',
              message: '数据获取失败！请检查名称是否正确！',
              type: 'error'
            })
            throw new Error('404')
          } else if (response.status === 400) {
            this.$notify({
              title: '错误',
              message: '批量查询超过了365天！',
              type: 'error'
            })
            throw new Error('400')
          }
          return response.json()
        })
        .then((res) => {
          this.initChartOption()
          this.packageInfo = []
          let packageArr = this.packageName.split(',')
          if (packageArr.length > 1) {
            for (let value of Object.entries(res)) {
              if (value[0]) {
                this.dataHandle(value[0], value[1].downloads, true)
              }
            }
          } else {
            this.dataHandle(this.packageName, res.downloads, false)
          }
          this.fullscreenLoading = false
          this.npmDataChart.setOption(this.chartOpention, true)
          setTimeout(() => {
            this.npmDataChart.resize()
          }, 0)
        })
        .catch((e) => {
          if (e.message !== '404' && e.message !== '400') {
            this.$notify({
              title: '错误',
              message: '网络错误！',
              type: 'error'
            })
          }
          this.fullscreenLoading = false
          return Promise.reject(e)
        })
    },
    getUserData () {
      let offset = 0
      let size = 20
      let url = `https://api.npms.io/v2/search?q=maintainer:${this.queryForm.name}&size=${size}&from=${offset}`
      var packageArr = []
      fetch(url, {timeout: 10000})
        .then((response) => {
          return response.json()
        })
        .then((res) => {
          if (res.total === 0) {
            this.$notify({
              title: '提示',
              message: '此用户不存在或此用户下没有包！',
              type: 'warning'
            })
            return
          }
          packageArr = packageArr.concat(res.results.map(x => x.package))
          let packageName = []
          packageArr.forEach((item) => {
            packageName.push(item.name)
          })
          this.packageName = packageName.toString()
          this.getPackageData()
        })
        .catch((e) => {
          console.log(e)
        })
    },
    dataHandle (seriesName, dataArr, isBatch) {
      let downloadsArr = []
      let dayArr = []
      let totalDownload = 0
      for (let dwValue of Array.values(dataArr)) {
        dayArr.push(dwValue.day)
        downloadsArr.push(dwValue.downloads)
        totalDownload += dwValue.downloads
      }
      this.chartOpention.series.push({
        name: seriesName,
        type: 'line',
        data: downloadsArr,
        smooth: true
      })
      this.chartOpention.xAxis.data = dayArr
      if (isBatch) {
        this.chartOpention.legend.data.push(seriesName)
        totalDownload = totalDownload.toLocaleString()
        this.packageInfo.push({
          name: seriesName,
          total: totalDownload
        })
      } else {
        totalDownload = totalDownload.toLocaleString()
        this.packageInfo.push({
          name: seriesName,
          total: totalDownload
        })
      }
    },
    onSubmit () {
      this.$refs['queryForm'].validate((valid) => {
        if (valid) {
          if (this.searchType === '1') {
            this.packageName = this.queryForm.name
            this.getPackageData()
          } else {
            this.getUserData()
          }
        } else {
          return false
        }
      })
    },
    initChartOption () {
      this.chartOpention = {
        title: {
          left: '3%',
          text: '',
          textStyle: {
            fontSize: 14,
            fontWeight: 500
          }
        },
        legend: {
          data: []
        },
        tooltip: {
          trigger: 'axis'
        },
        dataZoom: [{
          type: 'inside'
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
          data: []
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
          }
        },
        series: []
      }
    }
  }
}
</script>

<style>
  .el-header {
    background-color: #b3c0d1;
    color: #333;
    text-align: center;
    line-height: 60px;
  }
  #chart-render {
    width: 100%;
    height: 400px;
    margin: 0 auto;
  }
  .query-form-inline {
    text-align: center;
  }
  .el-tag {
    margin-left: 10px;
    margin-bottom: 5px;
  }
  .el-card__header {
    padding: 10px 20px;
  }
  .total-download-tag span {
    font-size: 14px;
  }
  .link_to_npm {
    color: inherit;
    text-decoration: none;
  }
  .link_to_npm:hover {
    text-decoration: underline;
  }
  .el-select .el-input {
    width: 90px;
  }
</style>
