import React from 'react';
import { useLoader } from '@react-three/fiber';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';

function ModelViewer() {
	const model = useLoader(GLTFLoader, '/Xbot.glb');

	return <primitive object={model.scene}
					  position={[0, -1.5, 2]}
					  rotation={[0, Math.PI, 0]}
					  scale={1} />;
}

export default ModelViewer;