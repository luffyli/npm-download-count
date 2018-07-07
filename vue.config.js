module.exports = {
  baseUrl: process.env.NODE_ENV === 'production' ? './npm-download-count' : '/',
  outputDir: 'docs',
  assetsDir: 'static',
  lintOnSave: true,
  productionSourceMap: false
}
