import React from 'react';
import { Canvas } from '@react-three/fiber';
import Scene from './Scene';
import Lighting from './Lighting';

function CanvasContainer() {
	return (
		<Canvas camera={{ position: [0, 1, 5] }}>
			<Lighting />
			<Scene />
		</Canvas>
	);
}

export default CanvasContainer;