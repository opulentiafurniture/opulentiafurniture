import React from 'react';
import { render, screen } from '@testing-library/react';
import { buildSegments, buildShape, LoadingLogo } from '../app/Visualization/visualizationUtils';

// Note: Visualization exports default component; we import LoadingLogo in a separate test by requiring it from the file.
// For this test suite, we focus on small helper functions and simple presentational pieces.

describe('Visualization helpers', () => {
  it('builds correct segments for a triangle', () => {
    const points = [
      { x: 0, z: 0 },
      { x: 1, z: 0 },
      { x: 0, z: 1 },
    ];

    expect(buildSegments(points)).toEqual([
      { x1: 0, z1: 0, x2: 1, z2: 0 },
      { x1: 1, z1: 0, x2: 0, z2: 1 },
      { x1: 0, z1: 1, x2: 0, z2: 0 },
    ]);
  });

  it('builds a valid three.js Shape from points', () => {
    const points = [
      { x: 0, z: 0 },
      { x: 1, z: 0 },
      { x: 1, z: 1 },
      { x: 0, z: 1 },
    ];

    const shape = buildShape(points);

    expect(shape.getPoints).toBeDefined();
    expect(shape.getPoints(4).length).toBeGreaterThan(0);
  });
});

describe('LoadingLogo', () => {
  it('renders the logo image', () => {
    render(<LoadingLogo />);
    const img = screen.getByRole('img', { name: /loading/i });
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute('src', '/logo-no-bg.png');
  });
});
