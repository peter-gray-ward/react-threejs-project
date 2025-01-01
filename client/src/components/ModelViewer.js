import React, { forwardRef, useEffect, useRef } from 'react';
import { useLoader, useFrame, Canvas } from '@react-three/fiber';
import {
  AnimationMixer,
  Vector3,
  Box3,
  LoopRepeat,
  Quaternion,
  Sphere
} from 'three'
import { getUpAndBackwardVector,
	spin180,
	coordsToQuaternion,
	coords,
	coordsToVector3,
	child,
	VisualizeQuaternion
} from '../util';

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

    const { model, planet } = props.state;
    if (!model || !planet) return;

    const sphereCenter = new Vector3(...planet.position);
    const sphereRadius = planet.radius;

    // Correct the position if it's not on the sphere
    const distanceToCenter = props.state.model.scene.position.distanceTo(sphereCenter);
    var directionToCenter = props.state.model.scene.position.clone().sub(sphereCenter).normalize();

    if (distanceToCenter !== sphereRadius) {
        const correctedPosition = directionToCenter.multiplyScalar(sphereRadius).add(sphereCenter);
        props.state.model.scene.position.copy(correctedPosition);
    }

    // Handle strafing
    var forwardDirection = props.state.model.scene.getWorldDirection(new Vector3()).normalize();
    if (props.state.model.strafe) {
        const rightDirection = new Vector3();
        rightDirection.crossVectors(new Vector3(0, 1, 0), forwardDirection).normalize();
        rightDirection.multiplyScalar(props.state.model.speed.strafe);
        console.log(props.state.model.speed.strafe)
        props.state.model.scene.position.add(rightDirection.negate());
    }

    // Handle walking
    if (props.state.model.walk) {
        forwardDirection.multiplyScalar(props.state.model.speed.walk);
        props.state.model.scene.position.add(forwardDirection);
        	  
    }


    

    const dial = props.state.scene ? child(props.state.scene, "dial") : null;	
    if (dial && props.state.model.scene) {
    	forwardDirection = props.state.model.scene.getWorldDirection(new Vector3()).normalize();
	    var quaternion = coordsToQuaternion({ 
	    	...coords(props.state.model.scene),
	    	initialVector: forwardDirection,
	    	planetCenter: new Vector3(...props.state.planet.position) 
	   	});
	   	const localYAxis = new Vector3(0, 1, 0).applyQuaternion(quaternion);
	   	if (props.state.model.rotateLeft || props.state.model.rotateRight) {
	   		var inc = props.state.model.rotateLeft ? props.state.model.speed.rotate : -props.state.model.speed.rotate;
	   		props.state.model.rotationIncrement += inc;
	   	}
		const incrementalRotation = new Quaternion().setFromAxisAngle(localYAxis, props.state.model.rotationIncrement);
		quaternion.premultiply(incrementalRotation)

	    dial.quaternion.copy(quaternion);

	    props.state.model.scene.quaternion.copy(quaternion);

		const cameraOffset = new Vector3(0, 2, -5.75).applyQuaternion(props.state.model.scene.quaternion);
		props.camera.position.copy(props.state.model.scene.position.clone().add(cameraOffset));
		props.camera.lookAt(props.state.model.scene.position);
		props.camera.quaternion.copy(dial.quaternion);
		spin180(props.camera.quaternion)

		
	  }
    
	});

	const q = VisualizeQuaternion(props.state.model.scene.quaternion, 1, .3);



	return (<>
		<primitive object={props.state.model.scene} />

		<group
		    position={[
		        props.state.model.scene.position.x,
		        props.state.model.scene.position.y,
		        props.state.model.scene.position.z
		    ]}
		>
		     <primitive object={q.group} />
		</group>
		{/*<mesh position={[
			props.state.model.scene.position.x,
			props.state.model.scene.position.y,
			props.state.model.scene.position.z
		]}>
			<sphereGeometry args={[
				0.5,
				300,
				50
			]} />
			<meshBasicMaterial wireframe color="lawngreen" />
		</mesh>*/}
		</>
	)
}

export default ModelViewer;