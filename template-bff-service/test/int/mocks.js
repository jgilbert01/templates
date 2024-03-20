// eslint-disable-next-line no-unused-vars
import * as sinon from 'sinon';
import Replay from 'replay';
import * as utils from '../../src/utils';

// ==========================
// Mock dates, uuids, etc
// ==========================
sinon.stub(utils, 'now').returns(1653877763001); // TODO update when re-recording

// ==========================
// VCR - https://github.com/assaf/node-replay
// ==========================
Replay.mode = process.env.REPLAY;
console.log(`Replay mode = ${Replay.mode}`);

// typical headers
Replay.headers = [/^x-amz-target/].concat(Replay.headers.filter((header) => !header.test('authorization') && !header.test('x-')));

// monkey patch replay to avoid immediate max retries and ultimately timeout
const rproxy = require('replay/lib/proxy');

rproxy.prototype.setTimeout = () => { };
