import React, { useRef, useMemo, useEffect } from 'react';
import { Vector3 } from 'three';

function Lighting(props) {


  return (
    <>
      <ambientLight intensity={0.5} />
      <directionalLight position={props.state.sun.position} intensity={1} />
    </>
  );
}

export default Lighting;