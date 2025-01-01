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
			window.requestAnimationFrame(engageInteractions);
		}
		engageInteractions();
	}, []);


	return <group>
		<mesh position={props.state.planet.position}>
			<sphereGeometry args={[
				props.state.planet.radius,
				props.state.planet.radius * 0.25,
				props.state.planet.radius * 0.75
			]} />
			<meshBasicMaterial wireframe color="lawngreen" />
		</mesh>
		<mesh position={[props.state.planet.position.x, props.state.planet.radius, props.state.planet.position.z]}
				rotation={[Math.PI / 2,0,0]}>
			<planeGeometry args={[300,300,100]} />
			<meshBasicMaterial wireframe color="blue" />
		</mesh>
	</group>
}

export default Planet;