import _ from 'highland';

import { toKinesisRecords, UNKNOWN_KINESIS_EVENT_TYPE } from 'aws-lambda-stream';

import { handle, Handler } from '../../../../src/trigger/kinesis';

describe('trigger/kinesis/index.js', () => {
  afterEach(jest.restoreAllMocks);

  it('should verify Handler', (done) => {
    new Handler()
      .handle(UNKNOWN_KINESIS_EVENT_TYPE)
      .collect()
      .tap((collected) => {
        expect(collected.length).toEqual(0);
      })
      .done(done);
  });

  it('should test successful handle call', async () => {
    const spy = jest.spyOn(Handler.prototype, 'handle').mockReturnValue(_.of({}));

    const res = await handle({}, {});

    expect(spy).toHaveBeenCalledWith({});
    expect(res).toEqual('Success');
  });

  it('should test unsuccessful handle call', async () => {
    const spy = jest.spyOn(Handler.prototype, 'handle').mockReturnValue(_.fromError(Error()));

    try {
      await handle({}, {});
      expect.fail('expected error');
    } catch (e) {
      expect(spy).toHaveBeenCalledWith({});
    }
  });
});
