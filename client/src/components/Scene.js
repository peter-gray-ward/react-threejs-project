import React, { useRef, useEffect, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import ModelViewer from './ModelViewer';
import Planet from './Planet';
import { Vector3 } from 'three'

function Scene(props) {
	const { camera } = useThree()


	return (
		<>
			<ModelViewer camera={camera} state={props.state} dispatch={props.dispatch} />
			<Planet {...props} />
		</>
	);
}

export default Scene;