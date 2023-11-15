// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom;
import 'jest-localstorage-mock';
import '@testing-library/jest-dom/extend-expect';
import { configure } from 'enzyme';
import enableHooks from 'jest-react-hooks-shallow';
import Adapter from '@wojtekmaj/enzyme-adapter-react-17';

configure({ adapter: new Adapter() });
enableHooks(jest);

const fetchPolifill = require('whatwg-fetch');

global.fetch = fetchPolifill.fetch;
global.Request = fetchPolifill.Request;
global.Headers = fetchPolifill.Headers;
global.Response = fetchPolifill.Respons;
