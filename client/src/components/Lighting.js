import React, { useRef, useMemo, useEffect } from 'react';
import { Vector3 } from 'three';

function Lighting(props) {


  return (
    <>
      <ambientLight position={[
        props.state.model.scene.position.x,
        props.state.model.scene.position.y,
        props.state.model.scene.position.z
      ]} intensity={0.85} />
      <directionalLight position={props.state.sun.position} intensity={1} />
    </>
  );
}

export default Lighting;