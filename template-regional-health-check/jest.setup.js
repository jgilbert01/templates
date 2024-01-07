// add all jest-extended matchers
import * as matchers from 'jest-extended';
import { enableFetchMocks } from 'jest-fetch-mock';
import AWS from 'aws-sdk-mock';
import Promise from 'bluebird';

AWS.Promise = Promise;
enableFetchMocks();
expect.extend(matchers);
