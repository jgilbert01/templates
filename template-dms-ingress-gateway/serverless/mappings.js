module.exports.tableMappings = JSON.stringify({
  rules: [
    ...[
      'THINGS',
    ]
    .map((name, i) => ({
      'rule-type': 'selection',
      'rule-id': `${1000 + i}`,
      'rule-name': `${1000 + i}-include`,
      'object-locator': {
        'schema-name': 'MY',
          'table-name': name,
        },
        'rule-action': 'include',
      })),
      ...[
        'THINGS2',
      ]
      .map((name, i) => ({
        'rule-type': 'selection',
        'rule-id': `${2000 + i}`,
        'rule-name': `${2000 + i}-include`,
        'object-locator': {
          'schema-name': 'MY2',
          'table-name': name,
        },
        'rule-action': 'include',
      })),
  ],
});

module.exports.replicationTaskSettings = JSON.stringify({
  // 'TargetMetadata': {
  //   'TargetSchema': '',
  //   'SupportLobs': true,
  //   'FullLobMode': false,
  //   'LobChunkSize': 64,
  //   'LimitedSizeLobMode': true,
  //   'LobMaxSize': 32,
  //   'InlineLobMaxSize': 0,
  //   'LoadMaxFileSize': 0,
  //   'ParallelLoadThreads': 0,
  //   'ParallelLoadBufferSize': 0,
  //   'ParallelLoadQueuesPerThread': 1,
  //   'ParallelApplyThreads': 0,
  //   'ParallelApplyBufferSize': 50,
  //   'ParallelApplyQueuesPerThread': 1,
  //   'BatchApplyEnabled': false,
  //   'TaskRecoveryTableEnabled': false
  // },
  // 'FullLoadSettings': {
  //   'TargetTablePrepMode': 'DO_NOTHING',
  //   'CreatePkAfterFullLoad': false,
  //   'StopTaskCachedChangesApplied': false,
  //   'StopTaskCachedChangesNotApplied': false,
  //   'MaxFullLoadSubTasks': 8,
  //   'TransactionConsistencyTimeout': 600,
  //   'CommitRate': 10000
  // },
  Logging: {
    EnableLogging: true,
  },
  // 'ControlTablesSettings': {
  //   'ControlSchema': '',
  //   'HistoryTimeslotInMinutes': 5,
  //   'HistoryTableEnabled': false,
  //   'SuspendedTablesTableEnabled': false,
  //   'StatusTableEnabled': false
  // },
  // 'StreamBufferSettings': {
  //   'StreamBufferCount': 3,
  //   'StreamBufferSizeInMB': 8
  // },
  // 'ChangeProcessingTuning': {
  //   'BatchApplyPreserveTransaction': true,
  //   'BatchApplyTimeoutMin': 1,
  //   'BatchApplyTimeoutMax': 30,
  //   'BatchApplyMemoryLimit': 500,
  //   'BatchSplitSize': 0,
  //   'MinTransactionSize': 1000,
  //   'CommitTimeout': 1,
  //   'MemoryLimitTotal': 1024,
  //   'MemoryKeepTime': 60,
  //   'StatementCacheSize': 50
  // },
  // 'ChangeProcessingDdlHandlingPolicy': {
  //   'HandleSourceTableDropped': true,
  //   'HandleSourceTableTruncated': true,
  //   'HandleSourceTableAltered': true
  // },
  // 'LoopbackPreventionSettings': {
  //   'EnableLoopbackPrevention': true,
  //   'SourceSchema': 'LOOP-DATA',
  //   'TargetSchema': 'loop-data'
  // },
  // 'ValidationSettings': {
  //   'EnableValidation': true,
  //   'FailureMaxCount': 10000,
  //   'HandleCollationDiff': false,
  //   'RecordFailureDelayLimitInMinutes': 0,
  //   'SkipLobColumns': false,
  //   'TableFailureMaxCount': 1000,
  //   'ThreadCount': 5,
  //   'ValidationOnly': false,
  //   'ValidationPartialLobSize': 0
  // },
  // 'CharacterSetSettings': {
  //   'CharacterReplacements': [{
  //     'SourceCharacterCodePoint': 35,
  //     'TargetCharacterCodePoint': 52
  //   }, {
  //     'SourceCharacterCodePoint': 37,
  //     'TargetCharacterCodePoint': 103
  //   }
  //   ],
  //   'CharacterSetSupport': {
  //     'CharacterSet': 'UTF16_PlatformEndian',
  //     'ReplaceWithCharacterCodePoint': 0
  //   }
  // },
  'BeforeImageSettings': {
    'EnableBeforeImage': true,
    'FieldName': 'beforeImage',
    'ColumnFilter': 'non-lob'
  },
  // 'ErrorBehavior': {
  //   'DataErrorPolicy': 'LOG_ERROR',
  //   'DataTruncationErrorPolicy': 'LOG_ERROR',
  //   'DataErrorEscalationPolicy': 'SUSPEND_TABLE',
  //   'DataErrorEscalationCount': 50,
  //   'TableErrorPolicy': 'SUSPEND_TABLE',
  //   'TableErrorEscalationPolicy': 'STOP_TASK',
  //   'TableErrorEscalationCount': 50,
  //   'RecoverableErrorCount': 0,
  //   'RecoverableErrorInterval': 5,
  //   'RecoverableErrorThrottling': true,
  //   'RecoverableErrorThrottlingMax': 1800,
  //   'ApplyErrorDeletePolicy': 'IGNORE_RECORD',
  //   'ApplyErrorInsertPolicy': 'LOG_ERROR',
  //   'ApplyErrorUpdatePolicy': 'LOG_ERROR',
  //   'ApplyErrorEscalationPolicy': 'LOG_ERROR',
  //   'ApplyErrorEscalationCount': 0,
  //   'FullLoadIgnoreConflicts': true
  // }
});
