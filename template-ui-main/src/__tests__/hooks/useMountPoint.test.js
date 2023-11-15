import { renderHook } from '@testing-library/react-hooks';
import nock from 'nock';
import useMountPoint from '../../hooks/useMountPoint';

const mockResponse = JSON.stringify({
  mountPoint1: [
    {
      key: 'keyt1',
    },
  ],
  mountPoint2: [
    {
      key: 'keyt2',
    },
  ],
});

describe('useMountPoint hook', () => {
  process.env.MOUNT_POINT_METADATA = 'http://localhost/mount-points.json';

  it('should fetch mount points and return success result', async () => {
    nock('http://localhost').get('/mount-points.json').reply(200, mockResponse);
    const { result, waitForNextUpdate } = renderHook(() =>
      useMountPoint('mountPoint1')
    );
    expect(result.current.loading).toBeTruthy();
    // expect(result.current.error).toBeUndefined;
    expect(result.current.items).toEqual([]);
    await waitForNextUpdate();
    expect(result.current.loading).toBeFalsy();
    // expect(result.current.error).toBeUndefined;
    expect(result.current.items).toEqual([{ key: 'keyt1' }]);
  });

  it('should fetch mount points and return failure result', async () => {
    nock('http://localhost').get('/mount-points.json').replyWithError('failed');
    const { result, waitForNextUpdate } = renderHook(() =>
      useMountPoint('mountPoint1', true)
    );
    expect(result.current.loading).toBeTruthy();
    // expect(result.current.error).toBeUndefined;
    expect(result.current.items).toEqual([]);
    await waitForNextUpdate();
    expect(result.current.loading).toBeFalsy();
    expect(result.current.error).toHaveProperty(
      'message',
      'Network request failed'
    );
    expect(result.current.items).toEqual([]);
  });
});
