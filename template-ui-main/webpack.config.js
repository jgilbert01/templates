const path = require('path');
const webpack = require('webpack');
const { merge } = require('webpack-merge');
const singleSpaDefaults = require('webpack-config-single-spa-react');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyPlugin = require('copy-webpack-plugin');
const { InjectManifest } = require('workbox-webpack-plugin');
const MetadataPlugin = require('./metadata-plugin');

const orgName = 'template-ui';
const projectName = 'main';
const SHA =
  process.env.GIT_COMMIT || process.env.CI_COMMIT_SHA || `np${Date.now()}`;

const getPlugins = isProd => {
  const copyPluginPatterns = [
    { from: 'public/**', to: '../../' },
    // CAN BE USED TO FIX THIS FILE
    // { from: 'fixtures/all-mfe.json', to: '../../' },
    {
      from: 'mfe.json',
      transform: {
        transformer(content) {
          return Buffer.from(content.toString().replace(/SHA/g, SHA));
        },
      },
    },
  ];
  if (!isProd) {
    copyPluginPatterns.push({
      from: 'fixtures',
      to: 'fixtures',
    });
  }
  const copyPlugin = new CopyPlugin({
    patterns: copyPluginPatterns,
  });

  const plugins = [new MetadataPlugin(isProd)];

  plugins.push(
    ...[
      new webpack.EnvironmentPlugin({
        CLIENT_ID: 'template-ui',
        MICRO_APP_METADATA: '/apps.json',
        MOUNT_POINT_METADATA: '/mount-points.json',
        IMPORTMAP_METADATA: '/importmap.json',
        VERSION: process.env.GIT_COMMIT || 'development',
        ENV: 'np',
        AWS_REGION: process.env.AWS_REGION,
      }),
      new HtmlWebpackPlugin({
        inject: false,
        // in prod don't include map overrides
        template: path.resolve(
          process.cwd(),
          process.env.ENV === 'prd' ? 'src/index.prod.ejs' : 'src/index.ejs'
        ),
        templateParameters: {
          importmapUrl: process.env.IMPORTMAP_METADATA || '/importmap.json',
          manifestUrl: isProd ? 'public/manifest.json' : 'manifest.json',
          faviconUrl: isProd ? 'public/logo.png' : 'logo.png',
          orgName,
        },
        filename: isProd ? '../../index.html' : 'index.html',
      }),
      copyPlugin,
      // new GenerateSW({
      //   clientsClaim: true,
      //   skipWaiting: true,
      //   swDest: '../../service-worker.js',
      // }),
      new InjectManifest({
        swSrc: './src/service-worker.js',
        swDest: '../../service-worker.js',
      }),
    ]
  );
  return plugins;
};

const devServer = {
  server: {
    type: 'http',
  },
  client: {
    overlay: {
      warnings: false,
      errors: true,
    },
  },
};

module.exports = (webpackConfigEnv, argv) => {
  const args = argv || {};
  const isProd =
    args.p || args.mode === 'production' || args.node_env === 'production';
  const defaultConfig = singleSpaDefaults({
    orgName,
    projectName,
    webpackConfigEnv,
    argv,
    disableHtmlGeneration: true,
  });

  return merge(defaultConfig, {
    // modify the webpack config however you'd like to by adding to this object
    externals: [
      '@template-ui/auth',
      '@fortawesome/fontawesome-svg-core',
      '@fortawesome/free-solid-svg-icons',
      '@fortawesome/react-fontawesome',
      'react',
      'react-dom',
      'react-bootstrap',
      'react-bootstrap-typeahead',
      'react-datepicker',
      'react-hook-form',
      'react-query',
      'react-table',
      'moment',
      'single-spa',
      'import-map-overrides',
      'regenerator-runtime',
      'systemjs',
    ],
    output: {
      path: path.resolve(
        process.cwd(),
        'dist',
        `${orgName}-${projectName}`,
        SHA
      ),
    },
    plugins: getPlugins(isProd),
    devServer: isProd ? {} : devServer,
  });
};
