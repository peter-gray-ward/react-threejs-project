import React, { useRef, useMemo, useEffect } from 'react';
import { Vector3, Color, Object3D, DoubleSide } from 'three';
import { starRadius } from '../models/constants';

function Sunlight({ state }) {
  const sunRef = useRef();
  const targetRef = useRef(() => new Object3D()); // Ensure it's created once
  const sphereGeometryArgs = useMemo(() => [starRadius / 80, 100, 100], []);
  const isNight = state.x > Math.PI / 2 && state.x < Math.PI * 1.5;

  return (
    <>
      <directionalLight
        position={state.sunPosition}
        castShadow
        receiveShadow
        // shadow-bias={-0.0001}
        shadow-mapSize-width={starRadius}
        shadow-mapSize-height={starRadius}
        shadow-camera-near={0.001}
        shadow-camera-far={starRadius * 200}
        shadow-camera-left={-500}
        shadow-camera-right={500}
        shadow-camera-top={500}
        shadow-camera-bottom={-500}
        target={state.planet.surfaceGeometry}
        intensity={isNight ? 0 : 3}
      />
      <mesh ref={sunRef} position={state.sunPosition}>
        <sphereGeometry args={sphereGeometryArgs} />
        <meshBasicMaterial color={0xffffff} side={DoubleSide} />
      </mesh>
      <ambientLight
        position={[0, state.planet.radius + 100, 0]}
        color={0xffffff}
        intensity={isNight ? 0.9 : 0.15}
      />
    </>
  );
}

function Lighting({ state }) {
  return (
    <>
      <Sunlight state={state} />
    </>
  );
}

export default Lighting;
