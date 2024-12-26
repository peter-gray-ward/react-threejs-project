import React, { useRef, useEffect, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import ModelViewer from './ModelViewer';
import Planet from './Planet'
import { Vector3 } from 'three'

function Scene(props) {
	const { camera, scene } = useThree();

	useEffect(() => {
		props.dispatch({ type: 'ADD_SCENE', scene })
	}, [])

	const manageInteractions = () => {
	}



  	useFrame(manageInteractions, [
  		props.state.model,
  		props.state.planet
  	]);




	return (
		<>
			<ModelViewer camera={camera} {...props} />
			<Planet {...props} />
			{ props.state.model.dial }
		</>
	);
}

export default Scene;