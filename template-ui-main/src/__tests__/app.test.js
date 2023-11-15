import React from 'react';
import { render, screen } from '@testing-library/react';
// eslint-disable-next-line import/no-unresolved
import { useAuth } from '@template-ui/auth';
import App from '../app';
// eslint-disable-next-line no-unused-vars
import Root from '../Root';

jest.mock('@template-ui/auth');
jest.mock('../Root');

describe('<App />', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('Should return Root component if authenticated', () => {
    useAuth.mockImplementation(() => {
      return {
        authenticating: false,
        isAuthenticated: true,
        failures: [],
      };
    });
    const rootMock = <div>Root</div>;
    Root.mockImplementation(() => {
      return rootMock;
    });
    render(<App />);
    expect(screen.getByText('Root')).toBeInTheDocument();
  });
});
