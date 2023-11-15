const path = require("path");
const webpack = require("webpack");
const { merge } = require("webpack-merge");
const singleSpaDefaults = require("webpack-config-single-spa-react-ts");
const CopyWebpackPlugin = require("copy-webpack-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const { CleanWebpackPlugin } = require("clean-webpack-plugin");

const orgName = "template-ui";
const projectName = "nav";
const SHA = process.env.GIT_COMMIT || process.env.CI_COMMIT_SHA || `np${Date.now()}`;

const commondModules = (isProd) => {
  const useCSS = [
    MiniCssExtractPlugin.loader,
    {
      loader: require.resolve("css-loader", {
        paths: [require.resolve("webpack-config-single-spa")],
      }),
      options: {
        modules: true,
      },
    },
    "postcss-loader",
    "sass-loader",
  ];
  return [
    {
      test: /(\.scss)$/,
      exclude: /node_modules/,
      use: useCSS,
    },
  ];
  // todo: add url_loader for images and svgs
};

const commonPlugins = () => {
  const plugins = [
    new CleanWebpackPlugin(),
    new webpack.EnvironmentPlugin({
      VERSION:
        process.env.GIT_COMMIT || process.env.CI_COMMIT_SHA || "development",
      ENV: process.env.ENV,
    }),
    new CopyWebpackPlugin({
      patterns: [
        {
          from: "src/assets",
          to: "assets",
        },
        {
          from: "mfe.json",
          transform: {
            transformer(content) {
              return Buffer.from(content.toString().replace(/SHA/g, SHA));
            },
          },
        },
      ],
    }),
    new MiniCssExtractPlugin({
      filename: "[name].css",
    }),
  ];
  return plugins;
};

module.exports = (webpackConfigEnv, argv) => {
  const defaultConfig = singleSpaDefaults({
    orgName,
    projectName,
    webpackConfigEnv,
    argv,
  });

  const args = argv || {};
  const isProd = args.p || args.mode === "production";

  return merge(defaultConfig, {
    output: {
      path: path.resolve(
        process.cwd(),
        "dist",
        `${orgName}-${projectName}`,
        SHA
      ),
    },
    plugins: commonPlugins(),
    module: {
      rules: commondModules(isProd),
    },
    externals: [
      /^@template-ui\/.+/,
      "react",
      "react-dom",
      "react-bootstrap",
      // "react-bootstrap-icons",
      "react-table",
      "react-query",
    ],
  });
};
