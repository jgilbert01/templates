/* eslint-disable no-param-reassign */
/* eslint-disable class-methods-use-this */
const fs = require('fs');

const customPaths = [
  '/systemjs@6.12.1/dist/system.min.js',
  '/systemjs@6.12.1/dist/extras/amd.min.js',
  '/systemjs@6.12.1/dist/extras/global.min.js',
  '/import-map-overrides@2.2.0/dist/import-map-overrides.js',
  '/regenerator-runtime@0.13.9/runtime.js',
  '/single-spa@5.9.3/lib/system/single-spa.dev.js',
  '/react@17.0.2/umd/react.development.js',
  '/react-dom@17.0.2/umd/react-dom.development.js',
];

class MetadataPlugin {
  constructor(isProd) {
    this.prod = isProd;
  }

  apply(compiler) {
    const { webpack } = compiler;
    const { RawSource } = webpack.sources;
    // eslint-disable-next-line global-require
    const rawMetadata = require('./mfe.json');

    const importsKeys = Object.keys(rawMetadata.imports);
    const keysWithExternalLinks = importsKeys.filter(
      key => rawMetadata.imports[key].lastIndexOf('@') > 3
    );
    compiler.hooks.compilation.tap('MetadataPlugin', compilation => {
      compilation.hooks.additionalAssets.tapAsync(
        'MetadataPlugin',
        callback => {
          [...keysWithExternalLinks, ...customPaths].forEach(key => {
            const externalPathValue = rawMetadata.imports[key] || key;
            const indexOfSemVer = externalPathValue.lastIndexOf('@');
            const indexOfEndSemVer = externalPathValue.indexOf(
              '/',
              indexOfSemVer
            );
            const filePath =
              externalPathValue.substring(0, indexOfSemVer) +
              externalPathValue.substring(indexOfEndSemVer);
            const file = fs.readFileSync(`node_modules${filePath}`);
            compilation.assets[`../..${externalPathValue}`] = new RawSource(
              file,
              true
            );
          });
          callback();
        }
      );
    });
  }
}

module.exports = MetadataPlugin;
