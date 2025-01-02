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
import { 
	getUpAndBackwardVector,
	spin180,
	coordsToQuaternion,
	coords,
	coordsToVector3,
	child,
	VisualizeQuaternion,
	pointOnSphereBehindAndUp,
	pointOnSphere,
	rotateCameraOffset
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
            	animationIndex = 6;
            	break;
            case 'strafe':
                animationIndex = 6;
                break;
            case 'lounge':
                animationIndex = 1;
                break;
            case 'jump':
                animationIndex = 2;
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
            	for (var animation in actionAnimations) {
            		actionAnimations[animation].stop();
            	}
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

	useFrame((state, delta) => {
	    if (mixerRef && mixerRef.current) {
	        mixerRef.current.update(delta);
	    }

	    if (!props.state.model) return;

	    const { model, planet } = props.state;
	    if (!model || !planet) return;


		const currentPosition = props.state.model.scene.position.clone();
	    const sphereCenter = new Vector3(...planet.position);
	    const sphereRadius = planet.radius;
	    const distanceToCenter = props.state.model.scene.position.distanceTo(sphereCenter);
	    var TOCENTER = props.state.model.scene.position.clone().sub(sphereCenter).normalize();

	    // apply gravity
	   	const gravity = props.state.model.gravity;
		const targetPosition = TOCENTER.multiplyScalar(sphereRadius).add(sphereCenter);


		// if (!currentPosition.equals(targetPosition)) {
	    const stepDirection = targetPosition.clone().sub(currentPosition).normalize();
	    const step = stepDirection.multiplyScalar(
	    	props.state.model.jumping ? Math.abs(gravity) * props.state.model.velocity.y : 0
	    );

	    // Update the position by the step or clamp to the target position
	    const newPosition = currentPosition.clone().add(step);
	    const distanceToTarget = newPosition.distanceTo(targetPosition);

	    if (props.state.model.jumping && distanceToTarget < 0.5) {
	        // Clamp to the target position if within the gravity step
	        props.state.model.scene.position.copy(targetPosition);
	        props.dispatch({ type: 'STOP_JUMP' })
	    } else {
	        // Move incrementally
	        props.state.model.scene.position.copy(newPosition);
	    }


	    // Handle strafing
	    var forwardDirection = props.state.model.scene.getWorldDirection(new Vector3()).normalize();
        const localUp = TOCENTER.clone().normalize(); // Up is the radial vector
		const localRight = new Vector3().crossVectors(localUp, forwardDirection).normalize();


		if (props.state.model.strafe) {
		    localRight.multiplyScalar(props.state.model.speed.strafe);
		    props.state.model.scene.position.add(localRight.negate());
		    props.dispatch({ type: "STRAFE" })
		}

	    // Handle walking
	    if (props.state.model.walk) {
	        forwardDirection.multiplyScalar(props.state.model.speed.walk);
	        props.state.model.scene.position.add(forwardDirection);
	        
	        if (!props.state.model.walking) {
	        	props.dispatch({ type: "WALK" })
	        }
	    }

	    if (props.state.model.jump) {
			// Update position based on velocity and direction
			props.state.model.scene.position.add(
			    localUp.multiplyScalar(props.state.model.velocity.y)
			);

			// Dispatch JUMP action to update velocity
			props.dispatch({ type: 'JUMP', model: props.state.model });

			// Stop jump if the model reaches or falls below the sphere radius
			if (props.state.model.scene.position.y <= sphereRadius) {
			    props.dispatch({ type: 'STOP_JUMP' });
			}
		}


		// Get the forward direction of the model
		forwardDirection = props.state.model.scene.getWorldDirection(new Vector3()).normalize();

		// Calculate the quaternion for the model's orientation
		const quaternion = coordsToQuaternion({
		    ...coords(props.state.model.scene),
		    initialVector: forwardDirection,
		    planetCenter: new Vector3(...props.state.planet.position),
		});

		// Calculate the local Y-axis based on the model's quaternion
		const localYAxis = new Vector3(0, 1, 0).applyQuaternion(quaternion);

		// Handle rotation increments
		if (props.state.model.rotateLeft) {
		    props.dispatch({ type: 'ROTATE_LEFT', state: props.state })
		}

		if (props.state.model.rotateRight) {
		    props.dispatch({ type: 'ROTATE_RIGHT', state: props.state })
		}

		const incrementalRotation = new Quaternion().setFromAxisAngle(localYAxis, props.state.model.rotationIncrement);
		quaternion.premultiply(incrementalRotation);

		// Apply the quaternion to the model's scene
		props.state.model.scene.quaternion.copy(quaternion);

		// Calculate the camera's position
		const radius = props.state.cameraRadius; // Distance from the model
		const cameraTheta = props.state.cameraTheta; // Vertical angle
		const cameraPhi = props.state.cameraPhi || 0; // Horizontal angle


		if (props.state.model.rotatingUp) {
			props.dispatch({ type: 'ROTATE_UP', state: props.state })
		}

		if (props.state.model.rotatingDown) {
			props.dispatch({ type: 'ROTATE_DOWN', state: props.state })
		}

		// Spherical coordinates for camera adjustment
		const sphericalX = 0//radius * Math.sin(cameraTheta) * Math.cos(cameraPhi);
		const sphericalY = radius * Math.cos(cameraTheta);
		const sphericalZ = 0//radius * Math.sin(cameraTheta) * Math.sin(cameraPhi);

		// Set the camera position behind the model, adjusted by spherical coordinates
		props.camera.position.copy(
		    props.state.model.scene.position.clone()
		        .add(forwardDirection.multiplyScalar(-radius)) // Always stay behind
		        .add(new Vector3(sphericalX, sphericalY, sphericalZ)) // Apply spherical adjustments
		);

		// Define the look-at position based on the model's height and TOCENTER
		const lookPosition = props.state.model.scene.position.clone();
		const upDirection = TOCENTER.clone().normalize();
		lookPosition.add(upDirection.multiplyScalar(props.state.model.height / 2));

		// Make the camera look at the adjusted position
		props.camera.lookAt(lookPosition);


		

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