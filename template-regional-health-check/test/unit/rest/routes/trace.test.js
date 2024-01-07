import Model from '../../../../src/models/trace';
import { check } from '../../../../src/rest/routes/trace';

class Response {
  constructor() {
    this.status = jest.fn().mockReturnValue(this);
    this.header = jest.fn().mockReturnValue(this);
    this.json = jest.fn((data) => data);
  }
}

describe('rest/routes/trace.js', () => {
  afterEach(jest.restoreAllMocks);

  it('should check', async () => {
    const stub = jest.spyOn(Model.prototype, 'check').mockResolvedValue({
      statusCode: 200,
      timestamp: 1668251778001,
      region: 'us-west-2',
    });

    const request = {
      namespace: {
        models: {
          trace: new Model(),
        },
      },
    };
    const response = new Response();

    const data = await check(request, response);

    expect(stub).toHaveBeenCalledWith();

    expect(response.status).toHaveBeenCalledWith(200);
    expect(response.json).toHaveBeenCalledWith({
      statusCode: 200,
      timestamp: 1668251778001,
      region: 'us-west-2',
    });
    expect(data).toEqual({
      statusCode: 200,
      timestamp: 1668251778001,
      region: 'us-west-2',
    });
  });
});
