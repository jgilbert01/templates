import { mapper } from '../utils';

export const MAPPER = mapper();

class Model {
  constructor({
    debug,
    connector,
    claims = { username: 'system' },
  } = {}) {
    this.debug = debug;
    this.connector = connector;
    this.claims = claims;
  }

  query({
    last, limit, discriminator, entityId,
  }) {
    let Prefix;
    if (discriminator && !entityId) Prefix = `${discriminator}/`;
    if (discriminator && entityId) Prefix = `${discriminator}/${entityId}/`;

    return this.connector
      .listObjects({
        last,
        limit,
        Delimiter: '/',
        Prefix,
      })
      .then(async ({ last, data }) => ({ // eslint-disable-line no-shadow
        last,
        data: await Promise.all(data.CommonPrefixes?.length
          ? data.CommonPrefixes.map(async (p) => ({
            Key: p.Prefix,
            Type: 'folder',
          }))
          : data.Contents
            .filter((c) => c.Key !== Prefix)
            .map(async ({ Key, LastModified, Size }) => ({
              Key,
              LastModified,
              Size,
              SignedUrl: await this.connector.getSignedUrl('getObject', Key),
              Type: Key.split('.').pop(),
              ...(await this.connector.headObject({
                Key,
              })),
            }))),
      }));
  }

  get({
    last, limit, discriminator, entityId, fileId,
  }) {
    return this.connector.listObjectVersions({
      last,
      limit,
      Prefix: `${discriminator}/${entityId}/${fileId}`,
    })
      .then(async ({ last, data }) => ({ // eslint-disable-line no-shadow
        last,
        data: await Promise.all(data.Versions
          .map(async ({
            Key, VersionId, LastModified, Size,
          }) => ({
            Key,
            VersionId,
            LastModified,
            Size,
            SignedUrl: await this.connector.getSignedUrl('getObject', Key, { VersionId }),
            Type: Key.split('.').pop(),
            ...(await this.connector.headObject({
              Key: `${discriminator}/${entityId}/${fileId}`,
              VersionId,
            })),
          }))),
      }));
  }

  getSignedUrl({
    discriminator, entityId, fileId,
  }) {
    return this.connector.getSignedUrl('getObject', `${discriminator}/${entityId}/${fileId}`);
  }

  save({
    discriminator, entityId, fileId, headers, body, isBase64Encoded,
  }) {
    return this.connector.getSignedUrl(
      'putObject',
      `${discriminator}/${entityId}/${fileId}`,
      {
        ACL: 'private',
        ContentType: headers['content-type'],
        ContentDisposition: headers['cache-disposition'] || `inline; filename="${fileId}"`,
        CacheControl: 'private, max-age=300',
        Metadata: {
          // s3 returns these in lowercase
          discriminator,
          entityId,
          fileId,
          lastmodifiedby: this.claims.email || this.claims.username,
          awsregion: process.env.AWS_REGION,
        },
      },
    )
      .then((signedUrl) => ({
        signedUrl,
        headers: {
          'Content-Type': headers['content-type'],
          'Content-Disposition': headers['cache-disposition'] || `inline; filename="${fileId}"`,
          'Cache-Control': 'private, max-age=300',
          'x-amz-meta-discriminator': discriminator,
          'x-amz-meta-entityid': entityId,
          'x-amz-meta-fileid': fileId,
          'x-amz-meta-lastmodifiedby': this.claims.email || this.claims.username,
          'x-amz-meta-awsregion': process.env.AWS_REGION,
          'x-amz-acl': 'private',
        },
      }));
  }

  delete({
    discriminator, entityId, fileId, versionId,
  }) {
    return this.connector.deleteObject({
      Key: `${discriminator}/${entityId}/${fileId}`,
      VersionId: versionId,
    });
  }
}

export default Model;
