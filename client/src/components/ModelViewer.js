import React, { forwardRef, useEffect, useRef } from 'react';
import { useLoader, useFrame } from '@react-three/fiber';
import {
  AnimationMixer,
  Vector3,
  Box3,
  LoopRepeat,
  Quaternion
} from 'three'

function ModelViewer(props) {
	let mixerRef = useRef(null);
	const modelAnimationMixer = new AnimationMixer(props.state.model.scene);

	useEffect(() => {
		mixerRef.current = modelAnimationMixer;
	}, [])

	var start_walk = () => {
		if (!mixerRef.current || !props.state.model || !props.state.model.animations.length) return
		const action = mixerRef.current.clipAction(props.state.model.animations[6]);
		if (props.state.model.walk && !props.state.model.walking) {
			action.reset().play();
		} else {
			action.stop();
		}
		return () => {
			action.stop();
		};
	}

	var start_strafe = () => {
		if (!mixerRef.current || !props.state.model || !props.state.model.animations.length) return
		const action = mixerRef.current.clipAction(props.state.model.animations[6]);
		if (props.state.model.strafe && !props.state.model.strafeing) {
			action.reset().play();
		} else {
			action.stop();
		}
		return () => {
			action.stop();
		};
	}
	
	var start_standing_lounge = () => {
		if (!mixerRef.current || !props.state.model || !props.state.model.animations.length) return
		const action = mixerRef.current.clipAction(props.state.model.animations[1])
		if (props.state.model.walk == false) {
			action.reset().play();
		} else {
			action.stop();
		}
		return () => {
			action.stop();
		};
	}

	var start_jump = () => {
		if (!mixerRef.current || !props.state.model.animations.length) return
		const action = mixerRef.current.clipAction(props.state.model.animations[5]);
		action.timeScale = props.state.model.speed * .05
		if (props.state.model.jump) {
			action.reset().play();
		} else {
			action.stop();
		}		
		return () => {
			action.stop();
		};
	}

	var rotate = () => {
	}

	useEffect(start_walk, [props.state.model.walk])
	useEffect(start_standing_lounge, [props.state.model.walk])
	useEffect(start_strafe, [props.state.model.strafe])
	useEffect(start_jump, [props.state.model.jump])

	useFrame((state, delta) => {
		if (mixerRef && mixerRef.current) {
			mixerRef.current.update(delta);
		}

		if (!props.state.model) return;

    var forwardDirection = props.state.model.scene.getWorldDirection(new Vector3());
		const backwardDirection = forwardDirection.clone().negate();
		const { cameraRadius, cameraTheta } = props.state;
		const cameraOffset = backwardDirection.multiplyScalar(cameraRadius);


		function modelHittingTheFloor() {
			if (props.state.model) {
				props.state.model.jumpFloor = true
				props.state.model.jump = false
			}
		}

	
		const { model, planet } = props.state;
		if (!model || !planet) return;

    const sphereCenter = new Vector3(...planet.position);
    const sphereRadius = planet.radius;

   	const distanceToCenter = model.scene.position.distanceTo(sphereCenter);
   	var directionToCenter = model.scene.position.clone().sub(sphereCenter).normalize();
		if (distanceToCenter !== sphereRadius) {
		    const correctedPosition = directionToCenter.multiplyScalar(sphereRadius).add(sphereCenter);
		    model.scene.position.copy(correctedPosition);

		  	// model.scene.lookAt(...planet.position);
		  	// model.scene.quaternion.copy

				props.camera.quaternion.copy(model.scene.quaternion);
		    forwardDirection = model.scene.getWorldDirection(new Vector3());
		}

		directionToCenter = model.scene.position.clone().sub(sphereCenter).normalize();

		if (props.state.model.rotateLeft || props.state.model.rotateRight) {
		    const rotationStep = 0.01; 
		    const radialUp = directionToCenter; 
		    const rotationQuaternion = new Quaternion();
		    if (props.state.model.rotateLeft) {
		        rotationQuaternion.setFromAxisAngle(radialUp, rotationStep);
		    }
		    if (props.state.model.rotateRight) {
		        rotationQuaternion.setFromAxisAngle(radialUp, -rotationStep);
		    }
		    model.scene.quaternion.premultiply(rotationQuaternion);
		}

		if (props.state.model.strafe) {
			const rightDirection = new Vector3();
    	rightDirection.crossVectors(new Vector3(0, 1, 0), forwardDirection).normalize();
			rightDirection.multiplyScalar(-1 * props.state.model.strafe * props.state.model.speed.strafe);
		  props.state.model.scene.position.add(rightDirection);
		}

		if (props.state.model.walk) {
		    forwardDirection.multiplyScalar(props.state.model.speed.walk);
		    props.state.model.scene.position.add(forwardDirection);
		}


		const cameraPosition = new Vector3()
		  .copy(props.state.model.scene.position)
		  .add(cameraOffset);

		props.camera.position.copy(cameraPosition);
		const lookPosition = new Vector3()
		  .copy(props.state.model.scene.position)
		  .add(new Vector3(0, 0, 0));

		props.camera.lookAt(lookPosition);
		props.camera.position.y += 1.5
	});


	return <primitive object={props.state.model.scene} />;
}

export default ModelViewer;