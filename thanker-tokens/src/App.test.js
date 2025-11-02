import { render, screen } from '@testing-library/react';
import App from './App';

test('renders ThankerTokens header', () => {
  render(<App />);
  const linkElement = screen.getByText(/ThankerTokens/i);
  expect(linkElement).toBeInTheDocument();
});
