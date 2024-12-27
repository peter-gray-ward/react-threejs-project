import React, { useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber'
import { SPEED, MASS, cameraRadius, props } from '../models/constants';
import { 
	Box3,
	Sphere,
	Vector3
} from 'three'

var bi = new Date().getTime();

function Planet(props) {
	const planet = <mesh position={props.state.planet.position}>
		<sphereGeometry args={[
			props.state.planet.radius,
			300,
			50
		]} />
		<meshBasicMaterial wireframe color="white" />
	</mesh>;

	var i = new Date().getTime();
	useEffect(() => {
		function engageInteractions(a) {
			if (Math.floor(a) % 2 == 0) {
				if (props.state.model.scene && props.state.planet) {
					const modelBoundingBox = new Box3().setFromObject(props.state.model.scene); // Calculate the bounding box
					const modelBoundingSphere = new Sphere(); // Create a sphere object
					const planet = new Sphere(new Vector3(0, -props.state.planet.radius, 0), props.state.planet.radius);


					const distance = props.state.model.scene.position.distanceTo(planet.center) // Calculate distance to the planet

					props.dispatch({ type: 'ENGAGE_INTERACTIONS', distanceTo: distance });
				}
			}

			if (props.state.model.walk) {
				props.dispatch({ type: 'WALK' });
			}
			window.requestAnimationFrame(engageInteractions);
		}
		engageInteractions();
	}, []);


	return planet;
}

export default Planet;