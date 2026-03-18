import { buildSegments, buildShape } from '../app/Visualization/visualizationUtils';

describe('performance', () => {
  it('builds segments quickly for a large polygon', () => {
    const points = Array.from({ length: 2000 }, (_, i) => ({ x: Math.cos(i), z: Math.sin(i) }));
    const start = performance.now();
    const segments = buildSegments(points);
    const duration = performance.now() - start;

    expect(segments).toHaveLength(points.length);
    // Allow generous time for CI environments
    expect(duration).toBeLessThan(500);
  });

  it('builds a three.js Shape quickly for a large polygon', () => {
    const points = Array.from({ length: 1200 }, (_, i) => ({ x: Math.cos(i), z: Math.sin(i) }));
    const start = performance.now();
    const shape = buildShape(points);
    const duration = performance.now() - start;

    expect(shape.getPoints().length).toBeGreaterThan(0);
    expect(duration).toBeLessThan(500);
  });
});
