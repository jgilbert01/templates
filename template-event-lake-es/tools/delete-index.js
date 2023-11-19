'use strict';

const _ = require('lodash');
const AWS = require('aws-sdk');

AWS.config.region = 'us-east-1';

const host = 'tbd.us-east-1.es.amazonaws.com';

const client = require('elasticsearch').Client({
  hosts: [`https://${host}`],
  connectionClass: require('http-aws-es'),
  log: 'trace',
});

client.indices.delete({
  index: [
    // 'events-2019-09-03',
  ]
})
  .then(response => console.log(response));

