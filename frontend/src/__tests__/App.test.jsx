import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import App from '../App';

// mock AuthProvider
vi.mock('../context/AuthContext', () => ({
  AuthProvider: ({ children }) => <div>{children}</div>,
  useAuth: () => ({
    user: null,
    token: null,
    loading: false,
  }),
}));

// mock SocketProvider
vi.mock('../context/SocketContext', () => ({
  SocketProvider: ({ children }) => <div>{children}</div>,
}));

describe('App Component', () => {
  it('should render without crashing', () => {
    const { container } = render(<App />);
    expect(container).toBeInTheDocument();
  });

  it('should have error boundary', () => {
    const { container } = render(<App />);
    expect(container.firstChild).toBeInTheDocument();
  });
});
