import React, { forwardRef, useEffect, useRef } from 'react';
import { useLoader, useFrame } from '@react-three/fiber';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import {
  AnimationMixer,
  Vector3
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

		const action = mixerRef.current.clipAction(model.animations[6]);
		action.timeScale = props.state.model.speed * 1.3

		if (props.state.model.walk) {
			action.reset().play();
		} else {
			action.stop();
		}

		return () => {
			action.stop();
		};
	}, [props.state.model.walk, model])

	useEffect(() => {

	}, [props.state.model.rotateRight])

	useEffect(() => {
		if (!mixerRef.current || !model.animations.length) return

		const action = mixerRef.current.clipAction(model.animations[6]);
		action.timeScale = props.state.model.speed * 1.3

		if (props.state.model.walk) {
			action.reset().play();
		} else {
			action.stop();
		}

		return () => {
			action.stop();
		};
	}, [props.state.model.walk, model])

	useEffect(() => {

	}, [props.state.model.rotateRight])

	var StandingLounge = () => {
		if (!mixerRef.current || !model.animations.length) return

		const action = mixerRef.current.clipAction(model.animations[1])

		if (props.state.model.walk == false) {
			action.reset().play();
		} else {
			action.stop();
		}

		return () => {
			action.stop();
		};
	}
	useEffect(StandingLounge, [props.state.model.walk, model])


	var x = props.state.model.position.x
	var y = props.state.model.position.y
	var z = props.state.model.position.z

	props.camera.position.set(x, y + 2, z - 5)
	props.camera.lookAt(new Vector3(x, y, z))
	
	return <primitive object={model.scene}
					  ref={ref}
					  position={[x, y, z]}
					  scale={1} />;
});

export default ModelViewer;