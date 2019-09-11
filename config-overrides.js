/* config-overrides.js */
const {
  override,
  addLessLoader,
  fixBabelImports
} = require('customize-cra');
const reactHotLoader = require('react-app-rewire-hot-loader');

// Webpack 默认配置覆盖操作，慎改!!!
module.exports = override(
  fixBabelImports('import', {
    libraryName: 'antd',
    libraryDirectory: 'es',
    style: 'css',
  }),
  // AntDesign theme customize
  addLessLoader({
    javascriptEnabled: true,
    modifyVars: {
      '@primary-color': '#065dab',
    },
  }),
  // React hot loader
  reactHotLoader,
);
