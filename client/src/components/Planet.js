import React, { useRef } from 'react';

const MASS = {
  syl: {

  },
  planet: {
    radius: 3000
  }
}

function Planet(props) {
	const meshRef = useRef();


	return (
		<mesh ref={meshRef} {...props} rotation={[Math.PI / 2, 0, 0]}>
			<sphereGeometry arg={[
				MASS.planet.radius,
				230,
				230
			]} />
			<meshBasicMaterial wireframe color="white" />
		</mesh>
	);
}

export default Planet;