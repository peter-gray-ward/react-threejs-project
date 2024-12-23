import React, { useRef } from 'react';

function Planet(props) {
	const meshRef = useRef();


	return (
		<mesh ref={meshRef} {...props} rotation={[Math.PI / 2, 0, 0]}>
			<planeGeometry args={[100, 100, 100, 100]}/>
			<meshBasicMaterial wireframe color="white" />
		</mesh>
	);
}

export default Planet;