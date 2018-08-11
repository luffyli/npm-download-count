<template>
  <div>
    <el-container>
      <el-header>
        <span>npm包下载数统计</span>
        <a href="https://github.com/luffyli/npm-download-count" target="_blank" class="header-github-link">
          <svg height="60" width="28" viewBox="0 0 16 16" version="1.1" aria-hidden="true" class="octicon octicon-mark-github">
            <path fill-rule="evenodd" d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0 0 16 8c0-4.42-3.58-8-8-8z"></path>
          </svg>
        </a>
      </el-header>
      <el-main>
        <el-form :inline="true" :model="queryForm" :rules="rules" ref="queryForm" class="query-form-inline">
          <el-form-item prop="name">
            <el-input placeholder="请输入" v-model="queryForm.name" class="input-with-select">
              <el-select v-model="queryForm.searchType" slot="prepend" placeholder="请选择">
                <el-option label="包名" value="packageName"></el-option>
                <el-option label="用户名" value="userName"></el-option>
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
        <el-card class="box-card" v-show="this.chartOption.day.xAxisData.length > 0">
          <div slot="header" class="clearfix">
            <span>日下载统计</span>
          </div>
          <div class="chart-container" id="day_chart"></div>
        </el-card>
        <el-card class="box-card" v-show="this.chartOption.day.xAxisData.length > 7">
          <div slot="header" class="clearfix">
            <span>周下载统计</span>
          </div>
          <div class="chart-container" id="week_chart"></div>
        </el-card>
        <el-card class="box-card" v-show="this.chartOption.day.xAxisData.length > 30">
          <div slot="header" class="clearfix">
            <span>月下载统计</span>
          </div>
          <div class="chart-container" id="month_chart"></div>
        </el-card>
        <el-card class="box-card" v-show="this.chartOption.day.xAxisData.length > 365">
          <div slot="header" class="clearfix">
            <span>年下载统计</span>
          </div>
          <div class="chart-container" id="year_chart"></div>
        </el-card>
        <el-card class="box-card" v-show="this.chartOption.day.xAxisData.length > 0">
          <div slot="header" class="clearfix">
            <span>范围内下载总数统计</span>
          </div>
          <div class="chart-container" id="total_chart"></div>
        </el-card>
      </el-main>
    </el-container>
  </div>
</template>

<script>
import * as http from '@/api'
import { initChart, totalChartSeries } from '@/utils/chartConfig'
import dayjs from 'dayjs'
import dayjsCusdomPlugin from '@/utils/dayjsPlugin'
dayjs.extend(dayjsCusdomPlugin)

export default {
  data () {
    let checkDateLength = (rule, value, callback) => {
      let timeDiff = dayjs(value[1]).diff(dayjs(value[0]), 'days')
      if (timeDiff > 546) { // 超过546天
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
      fullscreenLoading: true,
      packageName: '',
      queryForm: {
        searchType: '',
        name: '',
        datetime: []
      },
      chartOption: {
        legendData: [],
        day: {
          xAxisData: [],
          series: []
        },
        week: {
          xAxisData: [],
          series: []
        },
        month: {
          xAxisData: [],
          series: []
        },
        year: {
          xAxisData: [],
          series: []
        },
        total: {
          xAxisData: [],
          seriesData: []
        }
      },
      pickerOptions: {
        shortcuts: [{
          text: '最近一周',
          onClick (picker) {
            picker.$emit('pick', [dayjs().subtract(7, 'day').toDate(), dayjs().toDate()])
          }
        }, {
          text: '最近一个月',
          onClick (picker) {
            picker.$emit('pick', [dayjs().subtract(1, 'month').toDate(), dayjs().toDate()])
          }
        }, {
          text: '最近三个月',
          onClick (picker) {
            picker.$emit('pick', [dayjs().subtract(3, 'month').toDate(), dayjs().toDate()])
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
    let urlQuery = this.$route.query
    this.queryForm = {
      searchType: urlQuery.searchType || 'packageName',
      name: urlQuery.name || 'vue',
      datetime: (urlQuery.datetime && urlQuery.datetime.split(',')) || [dayjs().subtract(1, 'month').format('YYYY-MM-DD'), dayjs().format('YYYY-MM-DD')]
    }
    if (this.queryForm.searchType === 'userName') {
      this.getUserData()
    } else {
      this.packageName = this.queryForm.name
      this.getPackageData()
    }
  },
  methods: {
    getPackageData () {
      http.getPackageData(this.queryForm.datetime, this.packageName)
        .then((res) => {
          if (res.status === 200) {
            this.resetData()
            let data = res.data
            let packageArr = this.packageName.split(',')
            if (packageArr.length > 1) {
              for (let value of Object.entries(data)) {
                if (value[0]) {
                  this.dataHandle(value[0], value[1].downloads, true)
                }
              }
            } else {
              this.dataHandle(this.packageName, data.downloads, false)
            }
            this.fullscreenLoading = false
            try {
              this.showChart()
            } catch (error) {
              this.$notify({
                title: '错误',
                message: error.message,
                type: 'error'
              })
            }
          }
        })
        .catch((e) => {
          console.log(e)
          let is404 = e.message.indexOf('404') !== -1
          let is400 = e.message.indexOf('400') !== -1
          let timeout = e.message.indexOf('timeout') !== -1
          if (timeout) {
            this.$notify({
              title: '错误',
              message: '请求超时！',
              type: 'error'
            })
          } else if (!is404 && !is400) {
            this.$notify({
              title: '错误',
              message: '网络错误！',
              type: 'error'
            })
          } else if (is404) {
            this.$notify({
              title: '错误',
              message: '数据获取失败！请检查名称是否正确！',
              type: 'error'
            })
          } else if (is400) {
            this.$notify({
              title: '错误',
              message: '批量查询不能超过365天！',
              type: 'error'
            })
          }
          this.fullscreenLoading = false
        })
    },
    getUserData () {
      http.getUserData(this.queryForm.name)
        .then((res) => {
          if (res.status === 200) {
            let data = res.data
            if (data.total === 0) {
              this.fullscreenLoading = false
              this.$notify({
                title: '提示',
                message: '此用户不存在或此用户下没有npm包！',
                type: 'warning'
              })
              return
            }
            let packageArr = [].concat(data.results.map(x => x.package))
            let packageName = []
            let scopePackage = []
            packageArr.forEach((item) => {
              // 是否含有作用域包
              if (item.name.indexOf('/') === -1) {
                packageName.push(item.name)
              } else {
                scopePackage.push(item.name)
              }
            })
            if (scopePackage.length) {
              this.$notify({
                title: '提示',
                message: '批量查询不支持作用域包！不支持的包为：' + scopePackage.toString(),
                type: 'warning'
              })
            }
            this.packageName = packageName.join()
            this.getPackageData()
          }
        })
        .catch((e) => {
          this.fullscreenLoading = false
          this.$notify({
            title: '错误',
            message: '网络错误！',
            type: 'error'
          })
        })
    },
    showChart () {
      var dayChart = initChart({
        id: 'day_chart',
        legendData: this.chartOption.legendData,
        xAxisData: this.chartOption.day.xAxisData,
        series: this.chartOption.day.series,
        queryForm: null
      })
      var totalChart = initChart({
        id: 'total_chart',
        legendData: [],
        xAxisData: (this.chartOption.legendData.length > 0 ? this.chartOption.legendData : this.chartOption.total.xAxisData),
        series: totalChartSeries(this.chartOption.total.seriesData),
        queryForm: null
      })
      if (this.chartOption.day.xAxisData.length > 7) {
        var weekChart = initChart({
          id: 'week_chart',
          legendData: this.chartOption.legendData,
          xAxisData: this.chartOption.week.xAxisData,
          series: this.chartOption.week.series,
          queryForm: this.queryForm
        })
      }
      if (this.chartOption.day.xAxisData.length > 30) {
        var monthChart = initChart({
          id: 'month_chart',
          legendData: this.chartOption.legendData,
          xAxisData: this.chartOption.month.xAxisData,
          series: this.chartOption.month.series,
          queryForm: this.queryForm
        })
      }
      if (this.chartOption.day.xAxisData.length > 365) {
        var yearChart = initChart({
          id: 'year_chart',
          legendData: this.chartOption.legendData,
          xAxisData: this.chartOption.year.xAxisData,
          series: this.chartOption.year.series,
          queryForm: this.queryForm
        })
      }
      window.onresize = () => {
        dayChart.resize()
        totalChart.resize()
        weekChart && weekChart.resize()
        monthChart && monthChart.resize()
        yearChart && yearChart.resize()
      }
    },
    dataHandle (seriesName, dataArr, isBatch) {
      let downloadsArr = []
      let dayArr = []
      let totalDownload = 0
      for (let dwValue of dataArr) {
        dayArr.push(dwValue.day)
        downloadsArr.push(dwValue.downloads)
        totalDownload += dwValue.downloads
      }
      this.chartOption.day.series.push({
        name: seriesName,
        type: 'line',
        data: downloadsArr,
        smooth: true
      })
      if (this.chartOption.day.xAxisData.length === 0) {
        this.chartOption.day.xAxisData = dayArr
      }
      if (isBatch) {
        this.chartOption.legendData.push(seriesName)
      } else {
        this.chartOption.total.xAxisData.push(seriesName)
      }
      this.chartOption.total.seriesData.push(totalDownload)
      this.getSumData(seriesName, dayArr, downloadsArr, 'week')
      this.getSumData(seriesName, dayArr, downloadsArr, 'month')
      this.getSumData(seriesName, dayArr, downloadsArr, 'year')
    },
    getSumData (seriesName, dayArr, downloadsArr, type) {
      let oldNum = null
      let downloadSum = 0
      let dateArr = []
      let downloadSumArr = []
      for (let i = 0, dayLen = dayArr.length; i < dayLen; i++) {
        let num = 0
        if (type === 'week') {
          num = dayjs.week(dayArr[i])
        } else if (type === 'month') {
          num = dayjs(dayArr[i]).month()
        } else if (type === 'year') {
          num = dayjs(dayArr[i]).year()
        }
        if (num !== oldNum && oldNum !== null) {
          dateArr.push(dayArr[i - 1])
          downloadSumArr.push(downloadSum)
          downloadSum = 0
        }
        downloadSum += downloadsArr[i] || 0
        oldNum = num
        if (i === (dayLen - 1)) {
          dateArr.push(dayArr[i])
          downloadSumArr.push(downloadSum)
        }
      }
      downloadSum = null
      if (type === 'week') {
        this.chartOption.week.series.push({
          name: seriesName,
          type: 'line',
          data: downloadSumArr,
          smooth: true
        })
        if (this.chartOption.week.xAxisData.length === 0) {
          this.chartOption.week.xAxisData = dateArr
        }
      } else if (type === 'month') {
        this.chartOption.month.series.push({
          name: seriesName,
          type: 'line',
          data: downloadSumArr,
          smooth: true
        })
        if (this.chartOption.month.xAxisData.length === 0) {
          this.chartOption.month.xAxisData = dateArr
        }
      } else if (type === 'year') {
        this.chartOption.year.series.push({
          name: seriesName,
          type: 'line',
          data: downloadSumArr,
          smooth: true
        })
        if (this.chartOption.year.xAxisData.length === 0) {
          this.chartOption.year.xAxisData = dateArr
        }
      }
    },
    resetData () {
      this.chartOption = {
        legendData: [],
        day: {
          xAxisData: [],
          series: []
        },
        week: {
          xAxisData: [],
          series: []
        },
        month: {
          xAxisData: [],
          series: []
        },
        year: {
          xAxisData: [],
          series: []
        },
        total: {
          xAxisData: [],
          seriesData: []
        }
      }
    },
    onSubmit () {
      this.$refs['queryForm'].validate((valid) => {
        if (valid) {
          this.fullscreenLoading = true
          let oQuery = { ...this.queryForm }
          oQuery.datetime = this.queryForm.datetime.join()
          this.$router.push({ name: 'home', query: { ...oQuery } })
          if (this.queryForm.searchType === 'packageName') {
            this.packageName = this.queryForm.name
            this.getPackageData()
          } else {
            this.getUserData()
          }
        } else {
          return false
        }
      })
    }
  }
}
</script>

<style>
  .el-header {
    background-color: #eee;
    color: #333;
    text-align: center;
    line-height: 60px;
  }
  .header-github-link {
    float: right;
    line-height: 0;
  }
  .el-main {
    width: 100%;
    max-width: 1920px;
    padding: 20px 6%;
    margin: 0 auto;
  }
  .chart-container {
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
  .el-card {
    margin-bottom: 35px;
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
