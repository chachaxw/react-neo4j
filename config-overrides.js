/* config-overrides.js */
const {
  override,
  addLessLoader,
  fixBabelImports
} = require('customize-cra');
const reactHotLoader = require('react-app-rewire-hot-loader');

// Webpack config overrides
module.exports = override(
  fixBabelImports('import', {
    libraryName: 'antd',
    libraryDirectory: 'es',
    style: true,
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
