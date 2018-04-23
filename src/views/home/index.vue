<template>
  <div>
    <el-container>
      <el-header>npm包下载统计</el-header>
      <el-main>
        <el-form :inline="true" :model="queryForm" :rules="rules" ref="queryForm" class="query-form-inline">
          <el-form-item label="npm包名" prop="packageName">
            <el-input v-model="queryForm.packageName" placeholder="请输入包名"></el-input>
          </el-form-item>
          <el-form-item label="日期范围" prop="datetime">
            <el-date-picker v-model="queryForm.datetime" type="daterange" align="right" value-format="yyyy-MM-dd" unlink-panels range-separator="至" start-placeholder="开始日期"
                end-placeholder="结束日期" :picker-options="pickerOptions">
            </el-date-picker>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="onSubmit('queryForm')">查询</el-button>
          </el-form-item>
        </el-form>
        <div id="chart-render"></div>
      </el-main>
    </el-container>
  </div>
</template>

<script>
import echarts from 'echarts'
import fetch from 'isomorphic-fetch'

export default {
  data () {
    return {
      queryForm: {
        packageName: '',
        datetime: ''
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
        packageName: [
          { required: true, message: '请输入包名', trigger: 'blur' }
        ],
        datetime: [
          { required: true, message: '请选择日期范围', trigger: 'change' }
        ]
      }
    }
  },
  mounted () {
    this.npmDataChart = echarts.init(document.getElementById('chart-render'))
    this.chartOpention = {
      title: {
        left: 'center',
        text: ''
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
        bottom: '3%',
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
      series: [{
        data: [],
        type: 'line',
        itemStyle: {
          normal: {
            color: '#58c8da'
          }
        },
        smooth: true
      }]
    }
  },
  methods: {
    async getData () {
      let that = this
      that.npmDataChart.showLoading()
      await fetch(`https://api.npmjs.org/downloads/range/${this.queryForm.datetime[0]}:${this.queryForm.datetime[1]}/${this.queryForm.packageName}`, {timeout: 5000})
        .then(function (response) {
          if (response.status >= 400) {
            that.npmDataChart.hideLoading()
            that.$notify.error({
              title: '错误',
              message: '数据获取失败！请检查包名是否正确！'
            })
            throw new Error('数据获取失败！')
          }
          return response.json()
        })
        .then(function (res) {
          let resData = res.downloads
          let dayArr = []
          let downloadsArr = []
          let downloadCount = 0
          for (let i = 0, len = resData.length; i < len; i++) {
            dayArr.push(resData[i].day)
            downloadsArr.push(resData[i].downloads)
            downloadCount += resData[i].downloads
          }
          that.chartOpention.title.text = `范围内总下载数：${downloadCount}`
          that.chartOpention.xAxis.data = dayArr
          that.chartOpention.series[0].data = downloadsArr
          that.npmDataChart.hideLoading()
          that.npmDataChart.setOption(that.chartOpention)
        })
        .catch(function (e) {
          that.$notify.error({
            title: '错误',
            message: '网络错误！'
          })
          that.npmDataChart.hideLoading()
          return Promise.reject(e)
        })
    },
    onSubmit (formName) {
      this.$refs[formName].validate((valid) => {
        if (valid) {
          this.getData()
        } else {
          console.log('error submit!!')
          return false
        }
      })
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
    height: 550px;
    margin: 0 auto;
  }
  .query-form-inline {
    text-align: center;
  }
</style>
