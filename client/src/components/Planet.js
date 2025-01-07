import React, { useRef, useEffect, useMemo } from 'react';
import { useFrame } from '@react-three/fiber'
import { SPEED, MASS, cameraRadius, props } from '../models/constants';
import { 
	Box3,
	Sphere,
	Vector3,
	DoubleSide,
	PlaneGeometry,
	Float32BufferAttribute
} from 'three'
import * as perlinNoise from 'perlin-noise';
import {
	randomInRange
} from '../util';

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
	
	const sphereRef = useRef();

	useEffect(() => {
        const geometry = new PlaneGeometry(1000, 1000, 50, 50);
		geometry.vertexColors = true;
        const positions = geometry.attributes.position.array;
		const colors = [];
        const TOCENTER = props.state.model.scene.position.clone().normalize();
		var amplitude = 100

		const noise = perlinNoise.generatePerlinNoise(50, 50, {
			persistence: .005,
			amplitude
		})

        for (let x = 0; x < positions.length; x += 3) {
            const vector = new Vector3(positions[x], positions[x + 1], positions[x + 2]);
            const direction = vector.clone().normalize();
			const cols = 50;
			const xIndex = Math.floor((x / 3) % cols);
			const yIndex = Math.floor((x / 3) / cols);
			const noiseValue = noise[yIndex * cols + xIndex] * amplitude

	
            positions[x] = vector.x;
            positions[x + 1] = vector.y
            positions[x + 2] = vector.z + noiseValue

			colors.push(Math.random() / 10, Math.random() / 10, Math.random() / 10);
        }

        console.log(positions)

		geometry.setAttribute('color', new Float32BufferAttribute(colors, 3))
        geometry.attributes.position.needsUpdate = true;

        surfaceMeshRef.current.geometry = geometry;



		props.dispatch({ type: 'LOAD_GROUND', geometry: surfaceMeshRef.current })

    }, []); // Add dependencies if needed

	const sphereColor = useMemo(() => 'white', []);
	const surfaceMeshRef = useRef();

	return <group>
		{/* <mesh position={props.state.planet.position}>
			<sphereGeometry args={[
				props.state.planet.radius,
				11,
				props.state.planet.radius * 0.25
			]} />
			<meshBasicMaterial wireframe side={DoubleSide} color="royalblue" />
		</mesh> */}

		{/* <mesh ref={sphereRef} position={props.state.planet.position}>
            <sphereGeometry args={[props.state.planet.radius, 11, props.state.planet.radius * 0.25]} />
            <meshStandardMaterial wireframe color={sphereColor} />
        </mesh> */}

		<mesh ref={surfaceMeshRef} position={[0, props.state.planet.radius, 0]} rotation={[Math.PI / 2, 0, 0]}>
			<planeGeometry args={[200, 200, 200, 200]} />
			<meshStandardMaterial 
				opacity={1} 
				transparent={true} 
				side={DoubleSide} 
				vertexColors={true} // Enable vertex colors
			/>
		</mesh>


	</group>
}

export default Planet;