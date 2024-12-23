import React, { forwardRef, useEffect, useRef } from 'react';
import { useLoader, useFrame } from '@react-three/fiber';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import {
  AnimationMixer
} from 'three'


const ModelViewer = forwardRef((props, ref) => {
	console.log("inside the model viewer")

	const model = useLoader(GLTFLoader, '/Xbot.glb');
	const mixerRef = useRef(null)

	useEffect(() => {
		if (model && model.scene) {
			const modelAnimationMixer = new AnimationMixer(model.scene);
			mixerRef.current = modelAnimationMixer
		}
	}, [model])

	useFrame((state, delta) => {
		if (mixerRef.current) {
			mixerRef.current.update(delta);
		}
	});

	
	useEffect(() => {
		if (!mixerRef.current || !model.animations.length) return

		const action = mixerRef.current.clipAction(model.animations[3]);
		

		if (props.state.model.run) {
			action.reset().play();
		} else {
			action.stop();
		}

		return () => {
			action.stop();
		};
	}, [props.state.model.run, model])
	

	return <primitive object={model.scene}
					  ref={ref}
					  position={props.position}
					  rotation={[0, Math.PI, 0]}
					  scale={1} />;
});

export default ModelViewer;