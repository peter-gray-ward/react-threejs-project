import React, { forwardRef, useEffect, useRef, useMemo, useState } from 'react';
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

Array.prototype.contains = function(str) {
	for (var i = 0; i < this.length; i++) {
		if (this[i] == str) {
			return true;
		}
	}
	return false;
}

function ModelViewer(props) {
	const [actions, setActions] = useState({});
	const mixerRef = useRef(null);

    useEffect(() => {
        if (props.state.model?.scene) {
            mixerRef.current = new AnimationMixer(props.state.model.scene);
        }
        return () => {
            // Clean up mixer on unmount
            mixerRef.current?.stopAllAction();
            mixerRef.current = null;
        };
    }, []);
	


	const startAnimation = (which) => {
        if (!mixerRef.current) return null;

        let animationIndex;
        switch (which) {
            case 'walk':
            case 'strafe':
                animationIndex = 6;
                break;
            case 'lounge':
                animationIndex = 1;
                break;
            case 'jump':
                animationIndex = 5;
                break;
            default:
                return null;
        }

        const action = mixerRef.current.clipAction(props.state.model.animations[animationIndex]);
        action.reset().play();
        return action;
    };

    useFrame(() => {
        const actionAnimations = { ...actions };

        ['walk', 'strafe', 'lounge', 'jump'].forEach((action) => {
            if (props.state.model[action] && !actionAnimations[action]) {
                actionAnimations[action] = startAnimation(action);
            } else if (!props.state.model[action] && actionAnimations[action]) {
                actionAnimations[action].stop();
                delete actionAnimations[action];
                if (Object.keys(actionAnimations).length) {
                	const lastActionName = Object.keys(actionAnimations)[Object.keys(actionAnimations).length - 1];
                	actionAnimations[lastActionName] = startAnimation(lastActionName);
                }
            }
        });

        setActions(actionAnimations);
        

        mixerRef.current?.update(props.state.deltaTime || 0.016); // Assuming a default frame time of ~16ms
    });

	// useMemo(start_walk, [props.state.model])
	// useMemo(start_standing_lounge, [props.state.model])
	// useMemo(start_strafe, [props.state.model])
	// useMemo(start_jump, [props.state.model.jump])

	useFrame((state, delta) => {
	    if (mixerRef && mixerRef.current) {
	        mixerRef.current.update(delta);
	    }

	    if (!props.state.model) return;

	    const { model, planet } = props.state;
	    if (!model || !planet) return;

	    const sphereCenter = new Vector3(...planet.position);
	    const sphereRadius = planet.radius;
	    const distanceToCenter = props.state.model.scene.position.distanceTo(sphereCenter);
	    var directionToCenter = props.state.model.scene.position.clone().sub(sphereCenter).normalize();

	    if (distanceToCenter !== sphereRadius) {
	        const correctedPosition = directionToCenter.multiplyScalar(sphereRadius).add(sphereCenter);
	        props.state.model.scene.position.copy(correctedPosition);
	    }

	    // Handle strafing
	    var forwardDirection = props.state.model.scene.getWorldDirection(new Vector3()).normalize();
        const localUp = directionToCenter.clone(); // Up is the radial vector
		const localRight = new Vector3().crossVectors(localUp, forwardDirection).normalize();


		if (props.state.model.strafe) {
		    localRight.multiplyScalar(props.state.model.speed.strafe);
		    props.state.model.scene.position.add(localRight.negate());
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