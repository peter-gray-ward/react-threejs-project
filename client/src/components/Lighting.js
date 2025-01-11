import React, { useRef, useMemo, useEffect } from 'react';
import { Vector3, Color, Object3D } from 'three';

function Sunlight({ state }) {
  const directionalLightRef = useRef();
  const targetRef = useRef(new Object3D());

  useEffect(() => {
    if (directionalLightRef.current && targetRef.current) {
      // Update the target position to match `centerStage`
      targetRef.current.position.set(state.centerStage.x, state.centerStage.y, state.centerStage.z);
      directionalLightRef.current.target = targetRef.current;

      // Update the target's position in the scene
      directionalLightRef.current.target.updateMatrixWorld();

      directionalLightRef.current.shadow.mapSize.width = 1024;
      directionalLightRef.current.shadow.mapSize.height = 1024;

      // Configure the shadow camera for the directional light (this affects shadow casting area)
      directionalLightRef.current.shadow.camera.near = 0.005;
      directionalLightRef.current.shadow.camera.far = 9900;
      directionalLightRef.current.shadow.camera.left = -100;
      directionalLightRef.current.shadow.camera.right = 100;
      directionalLightRef.current.shadow.camera.top = 100;
      directionalLightRef.current.shadow.camera.bottom = -100;
    }
  }, [state.centerStage]); // Runs when `centerStage` changes

  const sunIsLow = state.x > Math.PI;

  return (
    <>
      {/* Directional Light directed toward the target */}
      <directionalLight
        ref={directionalLightRef}
        position={state.sunPosition}
        intensity={2}
      />
      <primitive object={targetRef.current} />
      
      {/* Ambient Light */}
      <ambientLight
        position={new Vector3(state.centerStage.x, state.centerStage.y + 100, state.centerStage.z)}
        color={0xfcfcfc}
        intensity={1}
      />
      
      {/* Point Light representing the Sun */}
      <pointLight
        key="The Sun"
        position={state.sunPosition}
        intensity={sunIsLow ? 0 : 3}
        color={0xffffff}
      />
    </>
  );
}

function Lighting(props) {
  return (
    <>
      <Sunlight state={props.state} />
    </>
  );
}

export default Lighting;
