import React from 'react';
import { Canvas } from '@react-three/fiber';
import Scene from './Scene';
import Lighting from './Lighting';

function CanvasContainer(props) {
	return (
		<Canvas shadows camera={{ position: [0, 1, 5] }}>
			<Lighting {...props} />
			<Scene {...props} />
		</Canvas>
	);
}

export default CanvasContainer;