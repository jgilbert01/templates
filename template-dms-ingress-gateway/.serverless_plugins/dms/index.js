'use strict';

const Promise = require('bluebird');
const _ = require('lodash');
const AWS = require('aws-sdk');
AWS.config.setPromisesDependency(Promise);

class Plugin {
  constructor(serverless, options) {
    this.hooks = {
      'before:deploy:deploy': stopReplicationTask.bind(null, serverless, options),
      'after:deploy:deploy': startReplicationTask.bind(null, serverless, options)
    };
  }
}

module.exports = Plugin;

const stopReplicationTask = (serverless) => {
  if (process.env.REPLICATION_TASK_ENABLED === 'false') return;

  const baseResources = serverless.service.provider.compiledCloudFormationTemplate;
  // console.log('baseResources: %s', JSON.stringify(baseResources, null, 2));

  return serverless.getProvider('aws').request('DMS', 'describeReplicationTasks', {
  })
    .then((data) => {
      const newMappings = baseResources.Resources.ReplicationTask.Properties.TableMappings;

      const id = baseResources.Resources.ReplicationTask.Properties.ReplicationTaskIdentifier;
      const task = data.ReplicationTasks.find(t => t.ReplicationTaskIdentifier === id);

      // console.log('newMappings: ', newMappings);
      const oldMappings = task ? task.TableMappings : undefined;
      // // console.log('oldMappings: ', oldMappings);
      // console.log('mappings changes: ', newMappings !== oldMappings);
      return {
        ...data,
        task,
        mappingsChanged: task && newMappings !== oldMappings,
        restart: task && process.env.RESTART === 'true',
      };
    })
    .then(tap('describeReplicationTasks: %s'))
    .then((data) => {
      if ((data.mappingsChanged || process.env.RESTART === 'true') && data.task.Status === 'running') {

        const poll = () => {
          return Promise.delay(5000)
            .then(() => {
              return serverless.getProvider('aws').request('DMS', 'describeReplicationTasks', {});
            })
            .then((data) => {
              const id = baseResources.Resources.ReplicationTask.Properties.ReplicationTaskIdentifier;
              const task = data.ReplicationTasks.find(t => t.ReplicationTaskIdentifier === id);

              return {
                ...data,
                task,
              };
            })
            .tap((data) => {
              console.log('status: %s', data.task.Status);
              return data;
            })
            .then((data) => {
              if (data.task.Status !== 'stopped') {
                return poll();
              }
              return data;
            });
        };

        return serverless.getProvider('aws').request('DMS', 'stopReplicationTask', {
          ReplicationTaskArn: data.task.ReplicationTaskArn,
        })
          .then(tap('stopReplicationTask: %s'))
          .then(() => poll());
      }
    });
};

const startReplicationTask = (serverless) => {
  if (process.env.REPLICATION_TASK_ENABLED === 'false') return;

  return serverless.getProvider('aws').request('DMS', 'describeReplicationTasks', {
  })
    .then(tap('describeReplicationTasks: %s'))
    .then((data) => {
      const baseResources = serverless.service.provider.compiledCloudFormationTemplate;
      const id = baseResources.Resources.ReplicationTask.Properties.ReplicationTaskIdentifier;
      const task = data.ReplicationTasks.find(t => t.ReplicationTaskIdentifier === id);

      if (['stopped', 'ready'].includes(task.Status)) {
        return serverless.getProvider('aws').request('DMS', 'startReplicationTask', {
          ReplicationTaskArn: task.ReplicationTaskArn,
          StartReplicationTaskType: 'resume-processing',
        })
          .then(tap('startReplicationTask: %s'));
      }
    });
};

const tap = msg => (data) => {
  console.log(`${msg}: ${JSON.stringify(data, null, 2)}`);
  return data;
};
