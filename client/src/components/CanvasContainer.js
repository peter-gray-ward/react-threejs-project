import React from 'react';
import { Canvas } from '@react-three/fiber';
import Scene from './Scene';
import Lighting from './Lighting';

function CanvasContainer(props) {
	return (
		<Canvas camera={{ position: [0, 1, 5] }}>
			<Lighting />
			<Scene state={props.state} dispatch={props.dispatch} />
		</Canvas>
	);
}

export default CanvasContainer;