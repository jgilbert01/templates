/* eslint import/no-extraneous-dependencies: ["error", {"devDependencies": true}] */
import { config, S3 } from 'aws-sdk';
import Promise from 'bluebird';

config.setPromisesDependency(Promise);

class Connector {
  constructor(
    debug,
    bucketName,
    timeout = Number(process.env.S3_TIMEOUT) || Number(process.env.TIMEOUT) || 1000,
  ) {
    this.debug = (msg) => debug('%j', msg);
    this.bucketName = bucketName || /* istanbul ignore next */ 'undefined';
    const options = {
      httpOptions: {
        timeout,
        // agent: sslAgent,
      },
      logger: { log: /* istanbul ignore next */ (msg) => debug('%s', msg.replace(/\n/g, '\r')) },
    };
    this.s3 = new S3(options);
  }

  listObjects({
    last, limit, Bucket, Prefix, Delimiter,
  }) {
    const params = {
      Bucket: Bucket || this.bucketName,
      Prefix,
      Delimiter,
      MaxKeys: limit,
      ContinuationToken: last
        ? /* istanbul ignore next */ JSON.parse(Buffer.from(last, 'base64').toString())
        : undefined,
    };

    return this.s3.listObjectsV2(params).promise()
      .tap(this.debug)
      .tapCatch(this.debug)
      .then((data) => ({
        last: data.IsTruncated
          ? /* istanbul ignore next */ Buffer.from(JSON.stringify(data.NextContinuationToken)).toString('base64')
          : undefined,
        data,
      }));
  }

  getSignedUrl(operation, Key, other = {}) {
    const params = {
      Bucket: this.bucketName,
      Key,
      ...other,
    };

    return new Promise((resolve, reject) => {
      this.s3.getSignedUrl(operation, params, (error, url) => {
        /* istanbul ignore if */
        if (error) {
          reject(error);
        } else {
          resolve(url);
        }
      });
    })
      .tap(this.debug)
      .tapCatch(this.debug);
  }

  listObjectVersions({
    last, limit, Bucket, Prefix,
  }) {
    const params = {
      Bucket: Bucket || this.bucketName,
      Prefix,
      MaxKeys: limit,
      ...(last
        ? /* istanbul ignore next */ JSON.parse(Buffer.from(last, 'base64').toString())
        : {}),
    };

    return this.s3.listObjectVersions(params).promise()
      .tap(this.debug)
      .tapCatch(this.debug)
      .then((data) => ({
        last: data.IsTruncated
          ? /* istanbul ignore next */ Buffer.from(JSON.stringify({
            KeyMarker: data.NextKeyMarker,
            VersionIdMarker: data.NextVersionIdMarker,
          })).toString('base64')
          : undefined,
        data,
      }));
  }

  headObject({ Bucket, Key, VersionId }) {
    const params = {
      Bucket: Bucket || this.bucketName,
      Key,
      VersionId,
    };

    return this.s3.headObject(params).promise()
      .tap(this.debug)
      .tapCatch(this.debug);
  }

  deleteObject({ Bucket, Key, VersionId }) {
    const params = {
      Bucket: Bucket || this.bucketName,
      Key,
      VersionId,
    };

    return this.s3.deleteObject(params).promise()
      .tap(this.debug)
      .tapCatch(this.debug);
  }
}

export default Connector;
