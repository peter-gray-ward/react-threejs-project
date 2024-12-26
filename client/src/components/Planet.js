import React, { useRef } from 'react';
import { SPEED, MASS, cameraRadius, props } from '../models/constants';

function Planet(props) {

	return (
		<mesh position={props.state.planet.position} rotation={[Math.PI / 2, 0, 0]}>
			<sphereGeometry args={[
				props.state.planet.radius,
				300,
				50
			]} />
			<meshBasicMaterial wireframe color="white" />
		</mesh>
	);
}

export default Planet;