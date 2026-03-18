import '@testing-library/jest-dom';
import React from 'react';

// Mock next/image in tests if used
jest.mock('next/image', () => ({
  __esModule: true,
  default: (props: any) => React.createElement('img', props),
}));
