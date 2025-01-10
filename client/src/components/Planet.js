import React, { useRef, useEffect, useMemo } from 'react';
import { useFrame } from '@react-three/fiber'
import { SPEED, MASS, cameraRadius, props } from '../models/constants';
import { 
	Box3,
	BoxGeometry,
	MeshBasicMaterial,
	Mesh,
	Sphere,
	Vector3,
	DoubleSide,
	PlaneGeometry,
	Float32BufferAttribute,
	SphereGeometry
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
		try {
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


        surfaceRef.current.geometry = geometry;

        const oceanGeometry = new SphereGeometry(props.state.planet.radius, 11, 100);
        const planetOceanPositions = oceanGeometry.attributes.position.array;
        const planetOceanColors = [];
        for (var x = 0; x < planetOceanPositions.length; x += 3) {
        	planetOceanColors.push(0, randomInRange(0, 0.5), randomInRange(0.9, 1));
        }


        oceanGeometry.setAttribute('color', new Float32BufferAttribute(planetOceanColors, 3));

        sphereRef.current.geometry = oceanGeometry;

		props.dispatch({ 
			type: 'LOAD_GROUND',
			surfaceGeometry: surfaceRef.current,
			planetGeometry: sphereRef.current
		})
		} catch (err) {
			debugger
		}
    }, []); // Add dependencies if needed

    const planetCenter = useMemo(() => new Vector3(0, 0, 0), []);

    useFrame(() => {
        if (sphereRef.current && surfaceRef.current && !props.state.planet.oceansFilled) {
            const sphere = sphereRef.current;
            const surface = surfaceRef.current;

            // Get lakes
            const lakes = new Set();
            const lands = new Set();
            

            for (var x = 0; x < surface.geometry.attributes.position.array.length; x += 3) {
            	var v = new Vector3(surface.geometry.attributes.position.array[x], surface.geometry.attributes.position.array[x + 1], surface.geometry.attributes.position.array[x + 2]);
            	if (v.distanceTo(planetCenter) < props.state.planet.radius) {
            		lakes.add(v);
            	} else {
            		lands.add(v);
            	}
            }

            console.log("FILL_OCEAN", lakes, lands, surface.geometry.attributes.position.array.length / 3);

            // Mark oceans as filled
            props.dispatch({ type: 'FILL_OCEAN', lakes });
        }
    });

	const sphereColor = useMemo(() => 'white', []);
	const surfaceRef = useRef();

	return <group>
	{/*	<mesh position={props.state.planet.position}>
			<sphereGeometry args={[
				props.state.planet.radius,
				11,
				props.state.planet.radius * 0.25
			]} />
			<meshBasicMaterial wireframe side={DoubleSide} color="royalblue" />
		</mesh>*/}

		<mesh ref={sphereRef} position={props.state.planet.position}>
            <sphereGeometry args={[props.state.planet.radius, 11, 100]} />
            <meshBasicMaterial 
            	opacity={0.5}
            	transparent={true}
            	side={DoubleSide}
            	vertexColors={true}
            />
        </mesh>

		<mesh ref={surfaceRef} position={[0, props.state.planet.radius + 50, 0]} rotation={[Math.PI / 2, 0, 0]}>
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