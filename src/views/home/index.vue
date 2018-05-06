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
            <el-button type="primary" @click="onSubmit">查询</el-button>
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
    let checkDateLength = (rule, value, callback) => {
      let timeLen = new Date(value[1]).getTime() - new Date(value[0]).getTime()
      let dataLen = timeLen / 86400000
      console.log(dataLen)
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
          { required: true, message: '请选择日期范围', trigger: 'change' },
          { validator: checkDateLength, trigger: 'change' }
        ]
      }
    }
  },
  mounted () {
    this.npmDataChart = echarts.init(document.getElementById('chart-render'), null, {renderer: 'svg'})
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
    window.onresize = this.npmDataChart.resize
  },
  methods: {
    getData () {
      let url = `https://api.npmjs.org/downloads/range/${this.queryForm.datetime[0]}:${this.queryForm.datetime[1]}/${this.queryForm.packageName}`
      this.npmDataChart.showLoading()
      fetch(url, {timeout: 5000})
        .then((response) => {
          if (response.status === 404) {
            this.npmDataChart.hideLoading()
            this.$notify({
              title: '错误',
              message: '数据获取失败！请检查包名是否正确！',
              type: 'error'
            })
            throw new Error('404')
          }
          return response.json()
        })
        .then((res) => {
          let resData = res.downloads
          let dayArr = []
          let downloadsArr = []
          let downloadCount = 0
          for (let i = 0, len = resData.length; i < len; i++) {
            dayArr.push(resData[i].day)
            downloadsArr.push(resData[i].downloads)
            downloadCount += resData[i].downloads
          }
          downloadCount = downloadCount.toLocaleString()
          this.chartOpention.title.text = `范围内总下载数：${downloadCount}`
          this.chartOpention.xAxis.data = dayArr
          this.chartOpention.series[0].data = downloadsArr
          this.npmDataChart.hideLoading()
          this.npmDataChart.setOption(this.chartOpention)
        })
        .catch((e) => {
          if (e.message !== '404') {
            this.$notify({
              title: '错误',
              message: '网络错误！',
              type: 'error'
            })
            this.npmDataChart.hideLoading()
          }
          return Promise.reject(e)
        })
    },
    onSubmit () {
      this.$refs['queryForm'].validate((valid) => {
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
