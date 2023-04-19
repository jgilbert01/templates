export const EVENT = {
  Records: [
    {
      messageId: 'd7335650-d31b-4238-b64f-4a31180a3acd',
      receiptHandle: 'AQEBeNenIdvw/hqZ2akeeqM1YnVeYBf8UmcVWKMye6/6E7XdoD+dqe7jHev3FkOoq+/G/2Htja6NOZWaPGgJOvIp1aJadTEmh+YveDN4a7ibfZtf5nO30mnnw+7oj658QemvzA4PyavLp0PfVuknTmXgwXG8cWlDWFP6tlSrbwcO/d58JqEJcq11zUYG6oym7dW3qAzJU0hGxgymbZOIf5QzhbkvN6N2U1+P9tAibpQhUnyEHQ1ZLtFfC3M4jS32/6WebhK/lVwlw4xVoQ73gimSU+eUXVzSBl+oLTlBhs9toAwqGw08l/q3kT7gkcsycaPB4tyz326rxnG6szG42Hm0Jq3HQDRlu4kEFqdzVHwL8SF7OHJyYD+TklJ5Pxeh9hu/+/HZrpJvqwnTKtM9zI9Hr5GYqCsiutq9sr0ipinymkpOP7DDzAr9NKDHY51P8P1o',
      body: '{\n  "Type" : "Notification",\n  "MessageId" : "426638ab-0f00-563c-ba34-64d70b2f5477",\n  "TopicArn" : "arn:aws:sns:us-west-2:205334275447:template-s3-bff-service-stg",\n  "Subject" : "Amazon S3 Notification",\n  "Message" : "{\\"Records\\":[{\\"eventVersion\\":\\"2.1\\",\\"eventSource\\":\\"aws:s3\\",\\"awsRegion\\":\\"us-west-2\\",\\"eventTime\\":\\"2023-03-03T14:19:26.655Z\\",\\"eventName\\":\\"ObjectCreated:Put\\",\\"userIdentity\\":{\\"principalId\\":\\"AWS:AROAS7TXAMV3XQTXOQPGO:template-s3-bff-service-stg-rest\\"},\\"requestParameters\\":{\\"sourceIPAddress\\":\\"96.255.48.5\\"},\\"responseElements\\":{\\"x-amz-request-id\\":\\"2YM6N0G1XMNN4MKS\\",\\"x-amz-id-2\\":\\"t1F10zcK2mP/YlI3k1fuUt1K90l8/nLukHwD8c0H8jeKKM/JLW4+dnJ0MHxGd1v8u3QicxnGRM567SdEcSNaTpy9RIrrSCiF\\"},\\"s3\\":{\\"s3SchemaVersion\\":\\"1.0\\",\\"configurationId\\":\\"25e27fc7-e35c-4081-83ca-1feef388c5fd\\",\\"bucket\\":{\\"name\\":\\"my-template-s3-bff-service-stg-us-west-2\\",\\"ownerIdentity\\":{\\"principalId\\":\\"A2J5X61LJ23DB3\\"},\\"arn\\":\\"arn:aws:s3:::my-template-s3-bff-service-stg-us-west-2\\"},\\"object\\":{\\"key\\":\\"file/e82fa80f-0448-4a1f-a15b-bf27d56eb1ec/login-gov.png\\",\\"size\\":8913,\\"eTag\\":\\"2de9cfd92e8b288ac6ebc263471ab500\\",\\"versionId\\":\\"COE5iyDeRVsJxEkhOPkelivGhdRGxXCn\\",\\"sequencer\\":\\"00640201EE974121B6\\"}}}]}",\n  "Timestamp" : "2023-03-03T14:19:27.972Z",\n  "SignatureVersion" : "1",\n  "Signature" : "S62vOoBtGbiuKezLAEKXul254823uO6+6X399QAeT7tN4HWVyIL708uIaWqoT8+sPcO+SNJysgnwx9z1MwzFKyS5TsvPoV6TCE3HheXeIzeJ331hKZsRDoOGcFBvcRIqar8Rm42sttpYZCQqZCyUva6HFGdxVBfA5tevCg4JdBrFVCfZ/aSYwSnwgRFlLQTHhKOOe1fEqYthDmb8xeaOt51FgIc4ZZaIxqSS3M1B1dyrC9NSgWkSkz2+pNHvGsUa7Ecy85250G11jYzPJleQSXh/ZPWWsVspUuUzz6ensr5d/2eR6PHT9AVUWku2eKAmIByLM15JSNdyyue3wI2Djw==",\n  "SigningCertURL" : "https://sns.us-west-2.amazonaws.com/SimpleNotificationService-56e67fcb41f6fec09b0196692625d385.pem",\n  "UnsubscribeURL" : "https://sns.us-west-2.amazonaws.com/?Action=Unsubscribe&SubscriptionArn=arn:aws:sns:us-west-2:205334275447:template-s3-bff-service-stg:9c4f80ca-fa7d-4454-9656-e233e75c21f2"\n}',
      attributes: {
        ApproximateReceiveCount: '1',
        SentTimestamp: '1677853168010',
        SenderId: 'AIDAIYLAVTDLUXBIEIX46',
        ApproximateFirstReceiveTimestamp: '1677853168016',
      },
      messageAttributes: {},
      md5OfBody: 'e8bf74bb929055d1ca26797af8a2b81c',
      eventSource: 'aws:sqs',
      eventSourceARN: 'arn:aws:sqs:us-west-2:205334275447:template-s3-bff-service-stg-trigger',
      awsRegion: 'us-west-2',
    },
    {
      messageId: '00246ac4-5737-466c-9a87-fa74e5e56651',
      receiptHandle: 'AQEB0r5cu0jCkh/cxZiQAjYZ/AdAl8xXsjQv1IZ/xh2+6e1SvErLdOkGq0GxyLJSxL9atPcp3wF+jCTBOtIav1svbF8MYxeQ+48EVmIGqMrA7I6/HiqPAMQ9fsDtA/QvlMaLuF+tux1zEph78bCnvJ5z7w49/Te+cSQtX8AsmRlTZNEZ7JTCUDQZoUUbh209qiDl0cyh+q9HxH2zJ05jnbdiFSnrFt+g1jQ3iB2epnk+jvVFXnpuup1tnrWVKEzfUM7sEDRyxE7+FG1UgK9XK6kdTPwf79840PSAoqRYtxo5RhkGQoWEjWgGCiRuA1uomhQjehCCbdB5rY0MvGoewfmXHGLC5EVUePu5/MIPcO3c+Bk7bd17Kw51L+SK0CN9MVn+lxzXr/PeNHASd+BLJNusHdY2PPN5Ofmacrvt4iyW1YqoyTDMOjo/sOrIU0jAHkq3',
      body: '{\n  "Type" : "Notification",\n  "MessageId" : "c3d16fa2-4cca-5ead-a752-33de4808fdc0",\n  "TopicArn" : "arn:aws:sns:us-west-2:205334275447:template-s3-bff-service-stg",\n  "Subject" : "Amazon S3 Notification",\n  "Message" : "{\\"Records\\":[{\\"eventVersion\\":\\"2.1\\",\\"eventSource\\":\\"aws:s3\\",\\"awsRegion\\":\\"us-west-2\\",\\"eventTime\\":\\"2023-03-03T14:21:53.546Z\\",\\"eventName\\":\\"ObjectCreated:Put\\",\\"userIdentity\\":{\\"principalId\\":\\"AWS:AROAS7TXAMV3XQTXOQPGO:template-s3-bff-service-stg-rest\\"},\\"requestParameters\\":{\\"sourceIPAddress\\":\\"96.255.48.5\\"},\\"responseElements\\":{\\"x-amz-request-id\\":\\"77XZATS2ZKYPCWP3\\",\\"x-amz-id-2\\":\\"OyY6O59WMi0ZCpMIhHrJZtvNrzxyxxasHi7ALa0DuVk+Qi/47fXMd4OX2w3RSsCA69iVRCIahdKunUq5WZ0GxfjsUcGT4g3i\\"},\\"s3\\":{\\"s3SchemaVersion\\":\\"1.0\\",\\"configurationId\\":\\"25e27fc7-e35c-4081-83ca-1feef388c5fd\\",\\"bucket\\":{\\"name\\":\\"my-template-s3-bff-service-stg-us-west-2\\",\\"ownerIdentity\\":{\\"principalId\\":\\"A2J5X61LJ23DB3\\"},\\"arn\\":\\"arn:aws:s3:::my-template-s3-bff-service-stg-us-west-2\\"},\\"object\\":{\\"key\\":\\"file/e82fa80f-0448-4a1f-a15b-bf27d56eb1ec/login-gov.png\\",\\"size\\":8913,\\"eTag\\":\\"2de9cfd92e8b288ac6ebc263471ab500\\",\\"versionId\\":\\"KLvnFF0R8i.biiFJjwUltq5rmSATPHVc\\",\\"sequencer\\":\\"00640202817AF63B5D\\"}}}]}",\n  "Timestamp" : "2023-03-03T14:21:54.724Z",\n  "SignatureVersion" : "1",\n  "Signature" : "C6urjT9UE8lgk0ZXEFR9JPHfJPEceh8+z19oHuXMKdqoAQuXDJ6MlhJp6lgiK8KTJ9JB1DYwOmHlgcJ/anWddqCE1DqKWvkwV8i8+0A9kEK7k8moBeUVs7ferobdkJ9VAUrYDvqkm1PRCFariWLZrhSScjN01jHnrb1ikGQ0WbVf6mPU4DzsrKUfq9OWW8ZycjDEFuVsPF+K/tMo4K2CXitfLZeKSdNk+slTKc4bi2ICm2PK79hcUzFkvFC7tmwVmt79QVg70vuzej9/87ed0QZ14f8Lo2BkTkXUVr2xXuJ5JZnDwrD2p6R84KvjUfT0V4EaCqsLNR4oypN9P351Cg==",\n  "SigningCertURL" : "https://sns.us-west-2.amazonaws.com/SimpleNotificationService-56e67fcb41f6fec09b0196692625d385.pem",\n  "UnsubscribeURL" : "https://sns.us-west-2.amazonaws.com/?Action=Unsubscribe&SubscriptionArn=arn:aws:sns:us-west-2:205334275447:template-s3-bff-service-stg:9c4f80ca-fa7d-4454-9656-e233e75c21f2"\n}',
      attributes: {
        ApproximateReceiveCount: '1',
        SentTimestamp: '1677853314811',
        SenderId: 'AIDAIYLAVTDLUXBIEIX46',
        ApproximateFirstReceiveTimestamp: '1677853314825',
      },
      messageAttributes: {},
      md5OfBody: '14b3786c5c4c55cc01d5f8681e55fd78',
      eventSource: 'aws:sqs',
      eventSourceARN: 'arn:aws:sqs:us-west-2:205334275447:template-s3-bff-service-stg-trigger',
      awsRegion: 'us-west-2',
    },
    {
      messageId: '0a259fb5-24e7-4fa5-af08-275b51abea8d',
      receiptHandle: 'AQEBtNfFLFMvfoT+/JgmUi5fQctrqfKgx2bwllYCZYjnYtJ90yCKEdeYHAi4EwwJJKM/Zc6Isc8z3yo5twt7WPEFxxT2qqIqj2tpS/u2FcX3qBaSOwjYN7JR0DP/ol2EcxZ4bGH1Pt5j5f7C1fDLAk4V1ApAh9agfodD83UhSaPOwHfYQAYYjb3NEIxji6UXvXU7OLDqEKlRjbaO3vTnPdYqS9qOX+kQl8WFE4lAeIDxdMnAzb14UXgWqwGHUeqlmibTOH2lnwuZRGN1yeEHvFOZ/OC0TlVBdGXIfWtz+fYcsQ0Z9/jd535qTGHRAjCvuRRCEoDlgR0+OjlGYLzPt87PNg5zolIiGqZzGFHLYwE5dVg/1s/SGpuRe3WB8JbnXD8N5G+ItHIV3iaCclga2fRL1lceX57EEaidwRTWKgDDRToSmE+948MEr2zXlaTlj7oz',
      body: '{\n  "Type" : "Notification",\n  "MessageId" : "4f45a2dd-e489-5d45-99f8-fea1e05b8460",\n  "TopicArn" : "arn:aws:sns:us-west-2:205334275447:template-s3-bff-service-stg",\n  "Subject" : "Amazon S3 Notification",\n  "Message" : "{\\"Records\\":[{\\"eventVersion\\":\\"2.1\\",\\"eventSource\\":\\"aws:s3\\",\\"awsRegion\\":\\"us-west-2\\",\\"eventTime\\":\\"2023-03-03T14:22:09.976Z\\",\\"eventName\\":\\"ObjectRemoved:DeleteMarkerCreated\\",\\"userIdentity\\":{\\"principalId\\":\\"AWS:AROAS7TXAMV3XQTXOQPGO:template-s3-bff-service-stg-rest\\"},\\"requestParameters\\":{\\"sourceIPAddress\\":\\"172.31.0.171\\"},\\"responseElements\\":{\\"x-amz-request-id\\":\\"CKJTHNTJ3PR820A3\\",\\"x-amz-id-2\\":\\"Zw7Uy/t2ttGyKgoAavdsUNuneSNIZdJsffDf+byDut4F/EyZ/oLRDmPdoDRZoPRAKTwgjGJyXxfUneGZDcQ+yjOeADK3Hq9C\\"},\\"s3\\":{\\"s3SchemaVersion\\":\\"1.0\\",\\"configurationId\\":\\"6e48580d-a6f3-48a3-97e6-2d5b2a46f03a\\",\\"bucket\\":{\\"name\\":\\"my-template-s3-bff-service-stg-us-west-2\\",\\"ownerIdentity\\":{\\"principalId\\":\\"A2J5X61LJ23DB3\\"},\\"arn\\":\\"arn:aws:s3:::my-template-s3-bff-service-stg-us-west-2\\"},\\"object\\":{\\"key\\":\\"file/e82fa80f-0448-4a1f-a15b-bf27d56eb1ec/login-gov.png\\",\\"eTag\\":\\"d41d8cd98f00b204e9800998ecf8427e\\",\\"versionId\\":\\"6r3D2azF1Y3ndS6u9ENaE02XywDAgVO2\\",\\"sequencer\\":\\"0064020291F26CC673\\"}}}]}",\n  "Timestamp" : "2023-03-03T14:22:10.724Z",\n  "SignatureVersion" : "1",\n  "Signature" : "Ktp8VaIfbIqX05OtX82N9G9mlQjTZXqUsq2/E9DcyLVPfRC9bzRzunBlyUnRemYlMOs4uW45ow446jg1FW6FNtJqYl4/AZ0W208O1RJYehmjRSh06WMgLNuXKs9I/+UBidhvxJ6+k2SFLSZ2r8eXVtFvA1yQXCiaPSCb62wiCKlN30ti/NQwa48CfWwQlPR76pHBiLXNFoKhzcWenk3k83n0QopGKXwREHSIIw9A+N9bAEbcIUx2bo+kFvzlxwQx4xefcBxHH7NkJd2w2wwdxet+k+JflMXiyaCXoBMS2KsalzM2Ab34C+F7raAPGFBvipOdKaTHBvm9w6oUPFa/fQ==",\n  "SigningCertURL" : "https://sns.us-west-2.amazonaws.com/SimpleNotificationService-56e67fcb41f6fec09b0196692625d385.pem",\n  "UnsubscribeURL" : "https://sns.us-west-2.amazonaws.com/?Action=Unsubscribe&SubscriptionArn=arn:aws:sns:us-west-2:205334275447:template-s3-bff-service-stg:9c4f80ca-fa7d-4454-9656-e233e75c21f2"\n}',
      attributes: {
        ApproximateReceiveCount: '1',
        SentTimestamp: '1677853330751',
        SenderId: 'AIDAIYLAVTDLUXBIEIX46',
        ApproximateFirstReceiveTimestamp: '1677853330754',
      },
      messageAttributes: {},
      md5OfBody: 'a45d7b23ad413834accfc3e323585566',
      eventSource: 'aws:sqs',
      eventSourceARN: 'arn:aws:sqs:us-west-2:205334275447:template-s3-bff-service-stg-trigger',
      awsRegion: 'us-west-2',
    },
  ],
};

export const HEAD_OBJECT_RESPONSE = {
  AcceptRanges: 'bytes',
  LastModified: '2023-03-03T14:19:27.000Z',
  ContentLength: 8913,
  ETag: '2de9cfd92e8b288ac6ebc263471ab500',
  VersionId: 'COE5iyDeRVsJxEkhOPkelivGhdRGxXCn',
  CacheControl: 'private, max-age=300',
  ContentDisposition: 'inline; filename="login-gov.png"',
  ContentType: 'image/png',
  ServerSideEncryption: 'AES256',
  Metadata: {
    awsregion: 'us-west-2',
    discriminator: 'file',
    fileid: 'login-gov.png',
    entityid: 'e82fa80f-0448-4a1f-a15b-bf27d56eb1ec',
    lastmodifiedby: 'john.gilbert@example.com',
  },
};

export const LIST_OBJECT_VERSIONS_RESPONSE = [
  {
    data: {
      IsTruncated: false,
      KeyMarker: '',
      VersionIdMarker: '',
      Versions: [
        {
          ETag: '"2de9cfd92e8b288ac6ebc263471ab500"',
          ChecksumAlgorithm: [],
          Size: 8913,
          StorageClass: 'STANDARD',
          Key: 'file/e82fa80f-0448-4a1f-a15b-bf27d56eb1ec/login-gov.png',
          VersionId: 'KLvnFF0R8i.biiFJjwUltq5rmSATPHVc',
          IsLatest: false,
          LastModified: '2023-03-03T14:21:54.000Z',
          Owner: {
            DisplayName: 'devcloud',
            ID: '0ecfe16b9b36ebbff8f6c9f00f1ef001a1a5617056e2e7c768be62c4f4a35c22',
          },
        },
      ],
      DeleteMarkers: [
      ],
      Name: 'my-template-s3-bff-service-stg-us-west-2',
      Prefix: 'file/e82fa80f-0448-4a1f-a15b-bf27d56eb1ec/login-gov.png',
      MaxKeys: 1000,
      CommonPrefixes: [],
    },
  },
  {
    data: {
      IsTruncated: false,
      KeyMarker: '',
      VersionIdMarker: '',
      Versions: [
        {
          ETag: '"2de9cfd92e8b288ac6ebc263471ab500"',
          ChecksumAlgorithm: [],
          Size: 8913,
          StorageClass: 'STANDARD',
          Key: 'file/e82fa80f-0448-4a1f-a15b-bf27d56eb1ec/login-gov.png',
          VersionId: 'KLvnFF0R8i.biiFJjwUltq5rmSATPHVc',
          IsLatest: false,
          LastModified: '2023-03-03T14:21:54.000Z',
          Owner: {
            DisplayName: 'devcloud',
            ID: '0ecfe16b9b36ebbff8f6c9f00f1ef001a1a5617056e2e7c768be62c4f4a35c22',
          },
        },
        {
          ETag: '"2de9cfd92e8b288ac6ebc263471ab500"',
          ChecksumAlgorithm: [],
          Size: 8913,
          StorageClass: 'STANDARD',
          Key: 'file/e82fa80f-0448-4a1f-a15b-bf27d56eb1ec/login-gov.png',
          VersionId: 'COE5iyDeRVsJxEkhOPkelivGhdRGxXCn',
          IsLatest: false,
          LastModified: '2023-03-03T14:19:27.000Z',
          Owner: {
            DisplayName: 'devcloud',
            ID: '0ecfe16b9b36ebbff8f6c9f00f1ef001a1a5617056e2e7c768be62c4f4a35c22',
          },
        },
      ],
      DeleteMarkers: [
      ],
      Name: 'my-template-s3-bff-service-stg-us-west-2',
      Prefix: 'file/e82fa80f-0448-4a1f-a15b-bf27d56eb1ec/login-gov.png',
      MaxKeys: 1000,
      CommonPrefixes: [],
    },
  },
  {
    data: {
      IsTruncated: false,
      KeyMarker: '',
      VersionIdMarker: '',
      Versions: [
        {
          ETag: '"2de9cfd92e8b288ac6ebc263471ab500"',
          ChecksumAlgorithm: [],
          Size: 8913,
          StorageClass: 'STANDARD',
          Key: 'file/e82fa80f-0448-4a1f-a15b-bf27d56eb1ec/login-gov.png',
          VersionId: 'KLvnFF0R8i.biiFJjwUltq5rmSATPHVc',
          IsLatest: false,
          LastModified: '2023-03-03T14:21:54.000Z',
          Owner: {
            DisplayName: 'devcloud',
            ID: '0ecfe16b9b36ebbff8f6c9f00f1ef001a1a5617056e2e7c768be62c4f4a35c22',
          },
        },
        {
          ETag: '"2de9cfd92e8b288ac6ebc263471ab500"',
          ChecksumAlgorithm: [],
          Size: 8913,
          StorageClass: 'STANDARD',
          Key: 'file/e82fa80f-0448-4a1f-a15b-bf27d56eb1ec/login-gov.png',
          VersionId: 'COE5iyDeRVsJxEkhOPkelivGhdRGxXCn',
          IsLatest: false,
          LastModified: '2023-03-03T14:19:27.000Z',
          Owner: {
            DisplayName: 'devcloud',
            ID: '0ecfe16b9b36ebbff8f6c9f00f1ef001a1a5617056e2e7c768be62c4f4a35c22',
          },
        },
      ],
      DeleteMarkers: [
        {
          Owner: {
            DisplayName: 'devcloud',
            ID: '0ecfe16b9b36ebbff8f6c9f00f1ef001a1a5617056e2e7c768be62c4f4a35c22',
          },
          Key: 'file/e82fa80f-0448-4a1f-a15b-bf27d56eb1ec/login-gov.png',
          VersionId: '6r3D2azF1Y3ndS6u9ENaE02XywDAgVO2',
          IsLatest: true,
          LastModified: '2023-03-03T14:22:10.000Z',
        },
      ],
      Name: 'my-template-s3-bff-service-stg-us-west-2',
      Prefix: 'file/e82fa80f-0448-4a1f-a15b-bf27d56eb1ec/login-gov.png',
      MaxKeys: 1000,
      CommonPrefixes: [],
    },
  },
];
