import React from 'react';
import { render } from '@testing-library/react';
import App from '../components/App';

test('renders Hello World header', () => {
  const { getByText } = render(<App />);
  const header = getByText("Hello World");
  expect(header).toBeInTheDocument();
});
