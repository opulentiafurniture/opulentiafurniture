"use client";

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import { TransformControls, useGLTF } from '@react-three/drei';
import { Object3D, Box3, Vector3, MeshStandardMaterial, MathUtils, CanvasTexture, RepeatWrapping, SRGBColorSpace } from 'three';

export type CameraSide = 'north' | 'south' | 'east' | 'west';


type MeshLike = Object3D & { isMesh?: boolean; castShadow?: boolean; receiveShadow?: boolean };

export function getCameraSide(x: number, z: number): CameraSide {
  const absX = Math.abs(x);
  const absZ = Math.abs(z);
  return absX > absZ ? (x > 0 ? 'east' : 'west') : z > 0 ? 'north' : 'south';
}

type OrbitControlsRef = { target: { set: (x: number, y: number, z: number) => void }; update: () => void };

export function SceneCamera({ roomWidth, roomLength, wallHeight, orbitRef }: { roomWidth: number; roomLength: number; wallHeight: number; orbitRef: React.RefObject<OrbitControlsRef> }) {
  const { camera } = useThree();

  useEffect(() => {
    const maxDim = Math.max(roomWidth, roomLength, 1);
    const distance = maxDim * 0.9;
    const height = Math.max(wallHeight * 1.5, maxDim * 0.35);

    camera.position.set(distance, height, distance);
    camera.lookAt(0, 0, 0);
    // eslint-disable-next-line react-hooks/immutability
    camera.far = Math.max(200, maxDim * 10);
    camera.updateProjectionMatrix();

    if (orbitRef.current) {
      orbitRef.current.target.set(0, 0, 0);
      orbitRef.current.update();
    }
  }, [roomWidth, roomLength, wallHeight, camera, orbitRef]);

  return null;
}

export function CameraSideTracker({ onChange }: { onChange: (value: CameraSide) => void }) {
  const { camera } = useThree();
  const last = useRef<CameraSide | null>(null);

  useFrame(() => {
    const side = getCameraSide(camera.position.x, camera.position.z);
    if (side !== last.current) {
      last.current = side;
      onChange(side);
    }
  });

  return null;
}

export function WallSegment({
  side,
  activeSide,
  position,
  rotation,
  size,
  color,
}: {
  side: CameraSide;
  activeSide: CameraSide;
  position: [number, number, number];
  rotation?: [number, number, number];
  size: [number, number, number];
  color: string;
}) {
  const matRef = useRef<MeshStandardMaterial | null>(null);

  useFrame(() => {
    if (!matRef.current) return;
    const target = side === activeSide ? 0 : 0.65;
    matRef.current.opacity = MathUtils.lerp(matRef.current.opacity, target, 0.15);
  });

  return (
    <mesh position={position} rotation={rotation}>
      <boxGeometry args={size} />
      <meshStandardMaterial
        ref={matRef}
        color={color}
        side={1}
        transparent
        opacity={0.65}
        depthWrite={false}
      />
    </mesh>
  );
}

export function RoomWalls({ roomWidth, roomLength, wallHeight, wallColor, hiddenSide }: { roomWidth: number; roomLength: number; wallHeight: number; wallColor: string; hiddenSide: CameraSide }) {
  return (
    <group position={[0, wallHeight / 2, 0]}>
      <WallSegment
        side="south"
        activeSide={hiddenSide}
        position={[0, 0, -roomLength / 2]}
        rotation={[0, Math.PI, 0]}
        size={[roomWidth, wallHeight, 0.01]}
        color={wallColor}
      />
      <WallSegment
        side="north"
        activeSide={hiddenSide}
        position={[0, 0, roomLength / 2]}
        size={[roomWidth, wallHeight, 0.01]}
        color={wallColor}
      />
      <WallSegment
        side="west"
        activeSide={hiddenSide}
        position={[-roomWidth / 2, 0, 0]}
        rotation={[0, Math.PI / 2, 0]}
        size={[roomLength, wallHeight, 0.01]}
        color={wallColor}
      />
      <WallSegment
        side="east"
        activeSide={hiddenSide}
        position={[roomWidth / 2, 0, 0]}
        rotation={[0, -Math.PI / 2, 0]}
        size={[roomLength, wallHeight, 0.01]}
        color={wallColor}
      />
    </group>
  );
}

export function createWoodTexture() {
  // Guard against server-side rendering (no document available)
  if (typeof document === 'undefined') return null;

  const canvas = document.createElement('canvas');
  const size = 512;
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  // Base tone (darker)
  ctx.fillStyle = '#7a4f2a';
  ctx.fillRect(0, 0, size, size);

  // Plank bands with subtle variation
  const plankWidth = 64;
  for (let x = 0; x < size; x += plankWidth) {
    const variance = Math.floor(Math.random() * 20) - 10;
    ctx.fillStyle = `rgba(${120 + variance}, ${78 + variance / 2}, ${45 + variance / 3}, 0.18)`;
    ctx.fillRect(x, 0, plankWidth, size);
  }

  // Plank seams
  ctx.fillStyle = 'rgba(40, 25, 15, 0.35)';
  for (let x = 0; x <= size; x += plankWidth) {
    ctx.fillRect(x - 1, 0, 2, size);
  }

  // Subtle board-wide noise to break uniformity
  for (let i = 0; i < 4000; i++) {
    const x = Math.random() * size;
    const y = Math.random() * size;
    const alpha = 0.03 + Math.random() * 0.05;
    ctx.fillStyle = `rgba(0,0,0,${alpha})`;
    ctx.fillRect(x, y, 2, 2);
  }

  // Irregular grain lines (vary spacing, thickness, and tone)
  let y = 0;
  while (y < size) {
    const step = 2 + Math.random() * 6;
    const thickness = 1 + Math.floor(Math.random() * 2);
    const shade = 95 + Math.floor(Math.random() * 70);
    ctx.fillStyle = `rgb(${shade}, ${shade - 30}, ${shade - 45})`;
    ctx.fillRect(0, y, size, thickness);
    y += step;
  }

  // Subtle knots
  for (let i = 0; i < 14; i++) {
    const x = Math.random() * size;
    const y = Math.random() * size;
    const r = 10 + Math.random() * 30;
    ctx.strokeStyle = 'rgba(90, 60, 40, 0.35)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(x, y, r, r * 0.6, 0, 0, Math.PI * 2);
    ctx.stroke();
  }

  const texture = new CanvasTexture(canvas);
  texture.wrapS = RepeatWrapping;
  texture.wrapT = RepeatWrapping;
  texture.colorSpace = SRGBColorSpace;
  texture.needsUpdate = true;
  return texture;
}

export interface FurnitureProps {
  url: string;
  position: [number, number, number];
  mode: 'translate' | 'rotate';
  isSelected: boolean;
  onSelect: () => void;
  onUpdatePosition: (newPos: [number, number, number]) => void;
  setOrbitEnabled: (enabled: boolean) => void;
  floorY: number;
  roomWidth: number;
  roomLength: number;
  // Additional styling overrides from the scene state
  color?: string;
}

// After
export function Furniture({ url, position, mode, isSelected, onSelect, onUpdatePosition, setOrbitEnabled, floorY, roomWidth, roomLength, color }: FurnitureProps) {
  const { scene } = useGLTF(url);
  const groupRef = useRef<Object3D>(null);
  const [transformObject, setTransformObject] = useState<Object3D | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const controlsRef = useRef<any>(null);
  const globalScale = 2.0;
  const setGroupRef = useCallback((node: Object3D | null) => {
    groupRef.current = node;
    setTransformObject(node);
  }, []);

  const clonedScene = React.useMemo(() => {
    const clone = scene.clone(true);

    // Center and normalize scale so models don't spawn far away or huge/tiny.
    const box = new Box3().setFromObject(clone);
    const size = new Vector3();
    const center = new Vector3();
    box.getSize(size);
    box.getCenter(center);

    // Move model to origin (centered).
    clone.position.sub(center);

    // Apply a global scale and lift so the model sits on the floor.
    clone.scale.multiplyScalar(globalScale);
    const box2 = new Box3().setFromObject(clone);
    clone.position.y -= box2.min.y;

    clone.traverse((obj: Object3D) => {
      const mesh = obj as MeshLike;
      if (!mesh.isMesh) return;

      mesh.castShadow = true;
      mesh.receiveShadow = true;
    });

    return clone;
  }, [scene]);

  useEffect(() => {
    clonedScene.scale.setScalar(globalScale);

    if (!color) return;

    type MaterialWithColor = {
      color?: {
        set: (value: string) => void;
      };
    };
    const applyColor = (material: unknown) => {
      const mat = material as MaterialWithColor;
      if (mat?.color?.set) {
        mat.color.set(color);
      }
    };

    clonedScene.traverse((obj: Object3D) => {
      const mesh = obj as MeshLike;
      if (!mesh.isMesh) return;
      if (Array.isArray(mesh.material)) {
        mesh.material.forEach(applyColor);
      } else {
        applyColor(mesh.material);
      }
    });
  }, [clonedScene, color]);

  useEffect(() => {
    const controls = controlsRef.current;
    if (!controls) return;

    const handleDraggingChanged = (e: { value: boolean }) => setOrbitEnabled(!e.value);
    controls.addEventListener('dragging-changed', handleDraggingChanged);
    return () => controls.removeEventListener('dragging-changed', handleDraggingChanged);
  }, [setOrbitEnabled, controlsRef]);

  return (
    <group>
      {isSelected && transformObject ? (
        <TransformControls
          ref={controlsRef}
          object={transformObject}
          mode={mode}
          showY={mode !== 'translate'}
          translationSnap={0.1}
          rotationSnap={Math.PI / 8}
          onMouseUp={() => {
            if (groupRef.current) {
              // Clamp furniture within room boundaries.
              const padding = 0.5;
              const maxX = roomWidth / 2 - padding;
              const maxZ = roomLength / 2 - padding;
              const clampedX = Math.min(Math.max(groupRef.current.position.x, -maxX), maxX);
              const clampedZ = Math.min(Math.max(groupRef.current.position.z, -maxZ), maxZ);

              groupRef.current.position.x = clampedX;
              groupRef.current.position.z = clampedZ;

              onUpdatePosition([clampedX, floorY, clampedZ]);
            }
          }}
        />
      ) : null}

      <group
        ref={setGroupRef}
        position={[position[0], floorY, position[2]]}
        onClick={(e: React.MouseEvent) => {
          e.stopPropagation();
          onSelect();
        }}
      >
        <primitive object={clonedScene} castShadow />
      </group>
    </group>
  );
}
