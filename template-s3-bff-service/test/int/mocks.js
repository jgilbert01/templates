// eslint-disable-next-line no-unused-vars
import * as sinon from 'sinon';
import * as utils from '../../src/utils';
import S3Connector from '../../src/connectors/s3';

sinon.stub(utils, 'now').returns(1653877763001); // TODO update when re-recording

sinon.stub(S3Connector.prototype, 'getSignedUrl').resolves('https://123/456');
