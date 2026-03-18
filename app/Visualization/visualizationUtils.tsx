import React from 'react';
import { Shape } from 'three';

export function buildShape(points: Array<{ x: number; z: number }>) {
  const shape = new Shape();
  shape.moveTo(points[0].x, points[0].z);
  for (let i = 1; i < points.length; i++) {
    shape.lineTo(points[i].x, points[i].z);
  }
  shape.closePath();
  return shape;
}

export function buildSegments(points: Array<{ x: number; z: number }>) {
  const segments: Array<{ x1: number; z1: number; x2: number; z2: number }> = [];
  for (let i = 0; i < points.length; i++) {
    const p1 = points[i];
    const p2 = points[(i + 1) % points.length];
    segments.push({ x1: p1.x, z1: p1.z, x2: p2.x, z2: p2.z });
  }
  return segments;
}

export function LoadingLogo({ className }: { className?: string }) {
  return (
    <div className={`loading-logo ${className || ''}`}>
      <img src="/logo-no-bg.png" alt="Loading" className="w-12 h-12 object-contain" />
    </div>
  );
}
