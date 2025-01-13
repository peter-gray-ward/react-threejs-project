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

		var lakes = new Set()

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

            if (noiseOffset > 0) {
            	var lake = new Vector3(positions[x], positions[x + 2] + props.state.planet.radius, positions[x + 1]);
            	lake.height = Math.abs(noiseOffset);
            	lakes.add(lake)
            }


			colors.push(Math.random() / 10, Math.random() / 10, Math.random() / 10);
        }


        props.dispatch({ type: 'FILL_OCEAN', lakes });

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

	useFrame(({ clock }) => {
        if (sphereRef.current) {
        	if (!addedWaterTexture) {
        		// sphereRef.current.material.map = waterNormalsTexture;
        		surfaceRef.current.material.castShadow = true;
        		surfaceRef.current.material.receiveShadow = true;
        		setAddedWaterTexture(true)
        	}
            const time = clock.getElapsedTime();
            const geometry = sphereRef.current.geometry;
            const positionAttribute = geometry.attributes.position;

            const waveAmplitude = 0.5; // Amplitude of the sine wave
            const waveFrequency = 1; // Frequency of the sine wave
            var transforms = []

            for (let i = 0; i < positionAttribute.count; i++) {
                const x = positionAttribute.getX(i);
                const z = positionAttribute.getZ(i);
                const y = positionAttribute.getY(i);

                if (y > props.state.planet.radius) {
                	continue;
                }

                // Apply sine wave animation to the y-coordinate
                const waveOffset = Math.sin(waveFrequency * (x + time)) * waveAmplitude;
                positionAttribute.setY(i, y + waveOffset);
                transforms.push(waveOffset)
            }

            positionAttribute.needsUpdate = true; // Notify Three.js of changes


            if (props.state.planet.lakes) {
			    var added = false;
			    var lakes = Array.from(props.state.planet.lakes);
			    var center = new Vector3(0, props.state.planet.radius, 0); // Center of rotation


			    for (var i = 0; i < lakes.length; i++) {

			        if (!lakeNodes[i]) {
			            added = true;


			            // Calculate initial position of the node
			            var waterColumnHeight = lakes[i].height
			            const position = new Vector3(lakes[i].x, lakes[i].z - waterColumnHeight, lakes[i].y)

			            // Create a new mesh for the lake
			            var node = new Mesh(new CylinderGeometry(
		            		20,
		            		10,
			            	waterColumnHeight,
			            	9
			            ), new MeshStandardMaterial({
			                opacity: 0.7,
			                transparent: true,
			                vertexColors: true
			            }));

			            var watercolors = []
			            for (var k = 0; k < node.geometry.attributes.position.array.length; k += 3) {
			            	watercolors.push(0, randomInRange(0.2, .7), 1)
			            }
			            node.geometry.setAttribute('color', new Float32BufferAttribute(watercolors, 3));
			            node.geometry.needsUpdate = true;

			            // Define the angle of rotation (e.g., 45 degrees for demonstration)
			            // var angle = Math.PI / 2; // Rotate by 45 degrees
			            // var axis = new Vector3(1, 0, 0); // Rotate around Y-axis

			            // // Rotate position around the center
			            // position.sub(center); // Translate to origin
			            // position.applyAxisAngle(axis, angle); // Apply rotation
			            // position.add(center); // Translate back
			            // position.add(new Vector3(0, props.state.planet.radius, 0))

			            // Set the rotated position
			            // var y = position.y;
			            // position.y = position.z;
			            // position.z = y;
			            var z = position.z;
			            position.z = position.y;
			            position.y = seaLevel.y - waterColumnHeight / 2
			            console.log('cylinder', position)
			            node.position.copy(position);
			            node.children = [];

			            
			            // for (var j = 0; j < 3; j++) {
			            // 	var sphereRadius = randomInRange(1, 12)
			            // 	var sphereYOffset = randomInRange(sphereRadius, waterColumnHeight * 2)
			            // 	var sphereY = node.position.y - sphereYOffset
			            // 	var sphere = new Mesh(new CylinderGeometry(
			            // 		randomInRange(1, 16),
			            // 		randomInRange(1, 16),
				        //     	randomInRange(waterColumnHeight / 2, waterColumnHeight)
				        //     ), new MeshStandardMaterial({
				        //         opacity: 0.7,
				        //         transparent: true,
				        //         map: waterNormalsTexture
				        //     }))
			            // 	sphere.radius = sphereRadius
			            // 	sphere.y = sphereY
			            // 	sphere.yOffset = sphereYOffset
			            // 	sphere.position.set(position.x, sphereY, position.z);

			            // 	for (var x = 0; x < sphere.geometry.attributes.position.array.length; x += 3) {
			            // 		sphere.geometry.attributes.position.array[x] += randomInRange(-1, 1)
			            // 		sphere.geometry.attributes.position.array[x + 1] += randomInRange(-1, 1)
			            // 		sphere.geometry.attributes.position.array[x + 2] += randomInRange(-1, 1)
			            // 	}
			            // 	scene.add(sphere);
			            // 	node.children.push(sphere)
			            // }

			            // Add node to the scene
			            scene.add(node);

			            // group.add(node)

			            lakeNodes[i] = node
			        } else if (lakeNodes[i]) {
			        	// lakeNodes[i].rotation.x = randomInRange(0, Math.PI * 2);
			        	lakeNodes[i].rotation.needsUpdate = true
			        	lakeNodes[i].position.y += transforms[i] * 0.02
			        	lakeNodes[i].position.needsUpdate = true;
			        	lakeNodes[i].children.forEach(child => {
			        		// child.position.y = props.state.planet.radius + transforms[i] - child.yOffset
			        		child.position.needsUpdate = true;
			        	})
				        	
			        	props.dispatch({ type: 'FILL_OCEAN', lakeNodes });
			        }
			    }

			    if (added) {
			    	setLakeNodes(lakeNodes)
			        props.dispatch({ type: 'FILL_OCEAN', lakes: new Set(lakes), lakeNodes });
			    }
			}

        }
    })

    const offSceneSpherePosition = useMemo(() => {
    	return [0, -1000000, 0];
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