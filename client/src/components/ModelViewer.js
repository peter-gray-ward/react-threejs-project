import React, { forwardRef, useEffect, useRef, useMemo, useState } from 'react';
import { useLoader, useFrame, Canvas } from '@react-three/fiber';
import {
  AnimationMixer,
  Vector3,
  Box3,
  LoopRepeat,
  Quaternion,
  Sphere,
  MeshBasicMaterial
} from 'three'
import { SPEED } from '../models/constants'
import { 
	coordsToQuaternion,
	coords,
	VisualizeQuaternion,
	findRayIntersection,
	pointOnSphere
} from '../util';
import { floor } from 'three/webgpu';

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

	const sphereRef = useRef()
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
	
	const planetCenter = useMemo(() => {
		return new Vector3(0, 0, 0)
	}, [])


	const startAnimation = (which) => {
        if (!mixerRef.current) return null;

        let animationIndex;
        let speedFactor = 0.5; // Adjust this value to slow down the animation (0.5 = half speed)

        switch (which) {
			case 'run':
				animationIndex = 3;
				break;
            case 'walk':
                animationIndex = 6;
                break;
            case 'strafe':
                animationIndex = 6; // Assuming strafe uses the same animation as walk
                break;
            case 'lounge':
                animationIndex = 1;
				speedFactor = 0.00;
                break;
            case 'jump':
                animationIndex = 5;
				speedFactor = 0.2;
                break;
            default:
                return null;
        }

        const action = mixerRef.current.clipAction(props.state.model.animations[animationIndex]);
        action.reset().play();
        action.setEffectiveTimeScale(speedFactor); // Set the speed factor for the animation
        return action;
    };

    useFrame(() => {
        const actionAnimations = { ...actions };

        ['run', 'walk', 'strafe', 'lounge', 'jump'].forEach((action) => {
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

	    props.state.model.scene.position.copy(newPosition);

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
	    if (props.state.model.walk || props.state.model.run) {
	        forwardDirection.multiplyScalar(props.state.model.walk ? props.state.model.speed.walk
				: props.state.model.speed.run
			);
	        props.state.model.scene.position.add(forwardDirection);
	        
	        props.dispatch({ type: "WALK" })

	    }


		// Update position based on velocity and direction
		var jumpUp = localUp.multiplyScalar(props.state.model.velocity.y);
		let aboveTheFloor = false;
		props.state.model.scene.position.add(jumpUp);

		let velocity = 0;

		if (props.state.planet.geometry) {
			const floor = findRayIntersection(props.state.model.scene.position.clone(), planetCenter, props.state.planet.geometry);
			if (floor) {
				props.state.model.floor = floor
				// sphereRef.current.position.set(floor.x, floor.y, floor.z)
			}
		}

		if (props.state.model.jump) {
			velocity += SPEED.JUMP;
			props.state.model.scene.position.y += SPEED.JUMP;
		}

		if (props.state.model.floor) { // is there gravity
			const distToCore = props.state.model.scene.position.distanceTo(planetCenter);
			aboveTheFloor = +distToCore.toFixed(2) > +props.state.model.floor.y.toFixed(2);
			
			if (aboveTheFloor) {
				velocity -= SPEED.GRAVITY;
			} else {
				props.state.model.scene.position.copy(props.state.model.floor);
				if (props.state.model.jump) {
					props.dispatch({ type: 'STOP_JUMP' });
				}
				velocity = 0;
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
		let radius = props.state.cameraRadius; // Distance from the model
		let cameraTheta = props.state.cameraTheta; // Vertical angle
		const cameraPhi = props.state.cameraPhi || 0; // Horizontal angle

		if (props.state.model.rotatingUp) {
		    props.dispatch({ type: 'ROTATE_UP', state: props.state });
		}

		if (props.state.model.rotatingDown) {
		    props.dispatch({ type: 'ROTATE_DOWN', state: props.state });
		}

		// Smoothly approach a radius of 1.5 when cameraTheta < 5
		radius = cameraTheta < 5 
		    ? 0.5 + (props.state.cameraRadius - 0.5) * (cameraTheta / 5)
		    : props.state.cameraRadius;

		cameraTheta = cameraTheta < 5 ? 5 : cameraTheta;

		// Compute position on the sphere in the y-up coordinate system
		const x = radius * Math.sin(cameraTheta) * Math.cos(cameraPhi); // Horizontal plane (x-axis)
		const z = radius * Math.sin(cameraTheta) * Math.sin(cameraPhi); // Horizontal plane (z-axis)
		const y = radius * Math.cos(cameraTheta);                      // Vertical motion (y-axis)

        let point = new Vector3(x, y, z);

        // Get the model's forward direction
        forwardDirection = props.state.model.scene.getWorldDirection(new Vector3());

        // Rotate the forwardDirection by Math.PI (180 degrees)
        const rotationQuaternion = new Quaternion();
        rotationQuaternion.setFromAxisAngle(new Vector3(0, 1, 0), Math.PI); // Rotate around the y-axis
        forwardDirection.applyQuaternion(rotationQuaternion);

        // Align the point to the rotated forward direction
        const defaultDirection = new Vector3(0, 0, -1); // Default forward direction (-z axis)
        const alignmentQuaternion = new Quaternion();
        alignmentQuaternion.setFromUnitVectors(defaultDirection, forwardDirection.clone().normalize());
        point.applyQuaternion(alignmentQuaternion);

        // Translate the point to the sphere's center (model's position)
        const center = props.state.model.scene.position.clone();
        point.add(center);

		props.camera.position.copy(point);

		// Define the look-at position based on the model's height and TOCENTER
		const lookPosition = props.state.model.scene.position.clone();
		const upDirection = TOCENTER.clone().normalize();
		lookPosition.add(upDirection.multiplyScalar(props.state.model.height * .75));

		// Make the camera look at the adjusted position
		props.camera.lookAt(lookPosition);

		
		if (velocity && aboveTheFloor) {
			props.dispatch({ type: 'GRAVITY', model: props.state.model, velocity });
		}


		

	});

	const q = VisualizeQuaternion(props.state.model.scene.quaternion, 1, .3);

	// useEffect(() => {
	//     if (props.state.model.scene) {
	//         let theta = 0; // Start angle for vertical motion
	//         const phi = Math.PI / 2; // Keep phi constant for fixed horizontal direction

	//         const interval = setInterval(() => {
	            

	//             // Update sphere position
	//             sphereRef.current.position.set(point.x, point.y, point.z);

	//             // Increment theta for vertical motion
	//             theta += 0.1; // Adjust speed as needed
	//             if (theta > Math.PI * 2) {
	//                 theta = 0; // Reset after a full rotation
	//             }
	//         }, 50); // Adjust interval for smoother motion

	//         return () => clearInterval(interval); // Cleanup interval on unmount
	//     }
	// }, [props.state.model.scene, props.state.cameraRadius]);




	return (<>
		<primitive object={props.state.model.scene} />

		<mesh ref={sphereRef} position={[
			props.state.cameraPoint.x,
			props.state.cameraPoint.y,
			props.state.cameraPoint.z
		]}>
			<sphereGeometry args={[0.25, 10, 10]} />
			<meshStandardMaterial color="red" />
		</mesh> 

		{/* <group
		    position={[
		        props.state.model.scene.position.x,
		        props.state.model.scene.position.y,
		        props.state.model.scene.position.z
		    ]}
		>
		     <primitive object={q.group} />
		</group>

		*/}
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