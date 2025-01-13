import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber'
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
	SphereGeometry,
	TextureLoader,
	Color,
	MeshStandardMaterial,
	CylinderGeometry,
	Group
} from 'three'
import * as perlinNoise from 'perlin-noise';
import {
	randomInRange
} from '../util';

var bi = new Date().getTime();

function Planet(props) {
	var i = new Date().getTime();
	var { scene } = useThree();
	useEffect(() => {
		function engageInteractions(a) {
			if (props.state.model.scene && props.state.planet) {
				const modelBoundingBox = new Box3().setFromObject(props.state.model.scene); // Calculate the bounding box
				const modelBoundingSphere = new Sphere(); // Create a sphere object
				const planet = new Sphere(new Vector3(0, -props.state.planet.radius, 0), props.state.planet.radius);


				const distance = props.state.model.scene.position.distanceTo(planet.center) // Calculate distance to the planet

				props.dispatch({ type: 'ENGAGE_INTERACTIONS', distanceTo: distance });
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
			const zIndex = Math.floor((x / 3) / cols) + 2;
			const noiseValue = noise[zIndex * cols + xIndex] * amplitude
			const noiseOffset = noiseValue > 50 ? noiseValue - 50 : -(50 - noiseValue)
	
            positions[x] = vector.x;
            positions[x + 1] = vector.y
            positions[x + 2] = noiseOffset



			colors.push(Math.random() / 10, Math.random() / 10, Math.random() / 10);
        }



		geometry.setAttribute('color', new Float32BufferAttribute(colors, 3))
        geometry.attributes.position.needsUpdate = true;


        surfaceRef.current.geometry = geometry;

        const oceanGeometry = new SphereGeometry(props.state.planet.radius, 11, 100);
        const planetOceanPositions = oceanGeometry.attributes.position.array;
        const planetOceanColors = [];
        for (var x = 0; x < planetOceanPositions.length; x += 3) {
        	planetOceanColors.push(1, 1, 1);
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
    const seaLevel = useMemo(() => new Vector3(0, props.state.planet.radius, 0));
	const sphereColor = useMemo(() => 'white', []);
	const surfaceRef = useRef();
	const [lakeNodes, setLakeNodes] = useState([]);
	const waterNormalsTexture = useMemo(() => new TextureLoader().load("/waternormals.jpg"))
	const [addedWaterTexture, setAddedWaterTexture] = useState(false);


    const offSceneSpherePosition = useMemo(() => {
    	return [0, 0, 0];
    }, []);

	return <group>
	{/*	<mesh position={props.state.planet.position}>
			<sphereGeometry args={[
				props.state.planet.radius,
				11,
				props.state.planet.radius * 0.25
			]} />
			<meshBasicMaterial wireframe side={DoubleSide} color="royalblue" />
		</mesh>*/}

		<mesh ref={sphereRef} position={offSceneSpherePosition}>
            <sphereGeometry args={[props.state.planet.radius, 11, 100]} />
            <meshBasicMaterial 
            	opacity={0}
            	transparent={true}
            	side={DoubleSide}
            	vertexColors={true}
            />
        </mesh>

		<mesh ref={surfaceRef} position={[0, props.state.planet.radius, 0]} rotation={[Math.PI / 2, 0, 0]}>
			<planeGeometry args={[200, 200, 200, 200]} />
			<meshStandardMaterial 
				opacity={1} 
				transparent={false} 
				side={DoubleSide}
				vertexColors={true}
            	
			/>
		</mesh>


	</group>
}

export default Planet;