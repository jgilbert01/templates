import { errorHandler, now, roundToNearestMinute } from '../../../src/utils';

class Response {
  constructor() {
    this.status = jest.fn().mockReturnValue(this);
    this.json = jest.fn((data) => data);
  }
}

describe('utils/index.js', () => {
  afterEach(jest.restoreAllMocks);

  it('should be now', () => {
    jest.spyOn(Date, 'now').mockReturnValue(1600144863435);
    expect(now()).toEqual(1600144863435);
  });

  it('should roundToNearestMinute', () => {
    jest.spyOn(Date, 'now').mockReturnValue(1600144863435);
    expect(roundToNearestMinute(now())).toEqual(1600144860000);
  });


  it('should handle errors', () => {
    const resp1 = new Response();
    const next = jest.fn();
    errorHandler({ code: 404, message: 'm1' }, undefined, resp1, next);
    expect(resp1.status).toHaveBeenCalledWith(404);
    expect(resp1.json).toHaveBeenCalledWith({ Message: 'm1' });
    expect(next).toHaveBeenCalled;

    const resp2 = new Response();
    errorHandler({ message: 'm2' }, undefined, resp2, next);
    expect(resp2.status).not.toHaveBeenCalledWith(500);
    expect(resp2.json).not.toHaveBeenCalledWith({ Message: 'm2' });
    expect(next).toHaveBeenCalled;
  });
});
