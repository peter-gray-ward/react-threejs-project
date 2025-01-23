import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useFrame, useThree, InstancedMesh } from '@react-three/fiber'
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
	BufferGeometry,
	Group,
	VSMShadowMap,
	RepeatWrapping,
	PCFSoftShadowMap,
	ArrowHelper,
	Quaternion,
	TubeGeometry,
	Matrix4
} from 'three'
import * as perlinNoise from 'perlin-noise';
import {
	filterSteepGeometry,
	randomInRange
} from '../util';
import Flowers from './Flowers';

	  
function Planet(props) {
	var i = new Date().getTime();
	var fiber = useThree();
	const cliffTexture = useMemo(() => () => new TextureLoader().load("/cliff.jpg", texture => {
		texture.wrapS = RepeatWrapping
	    texture.wrapT = RepeatWrapping
	    texture.repeat.set(2, 1)
	}), []);
	useEffect(() => {
		fiber.gl.shadowMap.enabled = true;
        fiber.gl.shadowMap.type = PCFSoftShadowMap;
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
	const cliffsRef = useRef();
	const grassesRef = useRef();
	const flowersRef = useRef();

	useEffect(() => {
		const rows = 50;
		const cols = 50;
        const geometry = new PlaneGeometry(1000, 1000, 50, 50);
		geometry.vertexColors = true;
        const positions = geometry.attributes.position.array;
		const colors = [];
        const TOCENTER = props.state.model.scene.position.clone().normalize();
		var amplitude = 100

		const noise = perlinNoise.generatePerlinNoise(50, 50, {
			persistence: .005,
			amplitude
		});

		const indices = [];


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

			if (xIndex < cols - 1 && zIndex < rows - 1) {
				const topLeft = zIndex * (cols + 1) + xIndex;
				const topRight = topLeft + 1;
				const bottomLeft = (zIndex + 1) * (cols + 1) + xIndex;
				const bottomRight = bottomLeft + 1;

				// Create two triangles for the quad
				indices.push(topLeft, bottomLeft, topRight); // Triangle 1
				indices.push(topRight, bottomLeft, bottomRight); // Triangle 2
			}


			colors.push(Math.random() / 10, Math.random() / 10, Math.random() / 10);
        }



		geometry.setAttribute('color', new Float32BufferAttribute(colors, 3))
        geometry.attributes.position.needsUpdate = true;


        surfaceRef.current.geometry = geometry;

        var geometries = filterSteepGeometry(geometry, .65, 'gray');
        cliffsRef.current.geometry = geometries.steep;
        cliffsRef.current.geometry.computeBoundingBox();

        var cliffColors = [];
        const cliffUvs = [];
        var foundHobbitHole = false;
        for (var x = 0; x < cliffsRef.current.geometry.attributes.position.array.length; x += 3) {
        	// cliffsRef.current.geometry.attributes.position.array[x] += randomInRange(-0.33, 0.33)
        	// cliffsRef.current.geometry.attributes.position.array[x + 1] += 0.25
        	// cliffsRef.current.geometry.attributes.position.array[x + 2] += randomInRange(-0.33, 0.33)
        	cliffColors.push(141 / 255, 148 / 255, 144 / 255);
        	cliffUvs.push(
        		(cliffsRef.current.geometry.attributes.position.array[x] - cliffsRef.current.geometry.boundingBox.min.x) / cliffsRef.current.geometry.boundingBox.max.x,
        		(cliffsRef.current.geometry.attributes.position.array[x + 2] - cliffsRef.current.geometry.boundingBox.min.z) / cliffsRef.current.geometry.boundingBox.max.z
        	);


        	/*
        	const hobbitHoleCondition = Math.abs((x / cliffsRef.current.children[0].geometry.attributes.position.array.length % 0.1) - 0.1).toFixed(2) == '0.01';
        	if (hobbitHoleCondition) {
			    const v0 = new Vector3(
			        cliffsRef.current.children[0].geometry.attributes.position.array[x],
			        cliffsRef.current.children[0].geometry.attributes.position.array[x + 1],
			        cliffsRef.current.children[0].geometry.attributes.position.array[x + 2]
			    );
			    const v1 = new Vector3(
			        cliffsRef.current.children[0].geometry.attributes.position.array[x + 3],
			        cliffsRef.current.children[0].geometry.attributes.position.array[x + 4],
			        cliffsRef.current.children[0].geometry.attributes.position.array[x + 5]
			    );
			    const v2 = new Vector3(
			        cliffsRef.current.children[0].geometry.attributes.position.array[x + 6],
			        cliffsRef.current.children[0].geometry.attributes.position.array[x + 7],
			        cliffsRef.current.children[0].geometry.attributes.position.array[x + 8]
			    );

			    var lowestPoint = v0;
			    if (v1.z < lowestPoint.z) {
			    	lowestPoint = v1;
			    }
			    if (v2.z < lowestPoint.z) {
			    	lowestPoint = v2;
			    }

			    [v0, v1, v2].forEach(v => {
			    	var m = new Mesh(new SphereGeometry(1, 20, 20),
			    		new MeshBasicMaterial({ color: 0xff0000 }));
			    	m.position.copy(v);
			    	cliffsRef.current.add(m);
			    })


			    // Compute two vectors
			    const edge1 = new Vector3().subVectors(v1, v0);
			    const edge2 = new Vector3().subVectors(v2, v0);

			    // Compute the normal using cross product
			    const normal = new Vector3().crossVectors(edge1, edge2).normalize();

			    // Render the normal vector using a line
			    const normalLine = new ArrowHelper(
			        normal, // Direction of the arrow
			        lowestPoint,     // Starting point
			        5,      // Length of the arrow
			        0xff0000 // Color of the arrow (red)
			    );
			    cliffsRef.current.add(normalLine);

			    // Create a door and orient it to face along the normal
			    var door = new Mesh(
			        new CylinderGeometry(2, 2, 0.15, 20),
			        new MeshBasicMaterial({
			            map: new TextureLoader().load(Math.random() < 0.5 ? "/door-yellow.png" : "/door-green.png"),
			        })
			    );

			    door.position.copy(lowestPoint);
			    

			    // Align the door's orientation to face the normal
			    const up = new Vector3(0, 1, 0); // Default up vector
			    const rotationQuaternion = new Quaternion().setFromUnitVectors(up, normal);
			    door.quaternion.copy(rotationQuaternion);

			    cliffsRef.current.add(door);

			    if (!foundHobbitHole) {
			    	props.state.model.scene.position.set(
			    		door.position.x,
			    		door.position.z + seaLevel.y,
			    		door.position.y
			    	);
			    	props.state.model.scene.position.y += 10;
			    	foundHobbitHole = true;
			    }
			}
			*/

        }
        // cliffsRef.current.geometry.setAttribute('color', new Float32BufferAttribute(cliffColors, 3))
        cliffsRef.current.geometry.setAttribute('uv', new Float32BufferAttribute(cliffUvs, 2));
        cliffsRef.current.material.map = cliffTexture()
        cliffsRef.current.geometry.attributes.position.needsUpdate = true

        grassesRef.current.geometry = geometries.other

        var grassesColors = [];
        for (var x = 0; x < grassesRef.current.geometry.attributes.position.array.length; x += 3) {
        	grassesRef.current.geometry.attributes.position.array[x] += randomInRange(-0.33, 0.33)
        	grassesRef.current.geometry.attributes.position.array[x + 1] += 0.25
        	grassesRef.current.geometry.attributes.position.array[x + 2] += randomInRange(-0.33, 0.33)

        	const r = randomInRange(3, 7) / 255
        	const g = randomInRange(210, 252) / 255
        	const b = randomInRange(29, 100) / 255
        	grassesColors.push(r, g, b);

			// Check condition for flower placement
			if (g > 0.862 && b < 0.3) {
				console.log('flower', x);

				// Calculate flower position
				const flowerPosition = new Vector3(
				  grassesRef.current.geometry.attributes.position.array[x],
				  grassesRef.current.geometry.attributes.position.array[x + 2],
				  grassesRef.current.geometry.attributes.position.array[x + 1]
				);

				// Set flower matrix in instancedMesh
				if (flowersRef.current) {
				  const matrix = new Matrix4();
				  matrix.setPosition(flowerPosition);
				  const instanceId = flowersRef.current.count || 0; // Count instances
				  flowersRef.current.setMatrixAt(instanceId, matrix);
				  flowersRef.current.count = instanceId + 1; // Increment instance count
				}
			}
        }
        grassesRef.current.geometry.setAttribute('color', new Float32BufferAttribute(grassesColors, 3))
        grassesRef.current.geometry.attributes.position.needsUpdate = true

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
		});
    }, []); // Add dependencies if needed

    const planetCenter = useMemo(() => new Vector3(0, 0, 0), []);
    const seaLevel = useMemo(() => new Vector3(0, props.state.planet.radius, 0));
	const sphereColor = useMemo(() => 'white', []);
	const surfaceRef = useRef();
	const [lakeNodes, setLakeNodes] = useState([]);
	const waterNormalsTexture = useMemo(() => new TextureLoader().load("/waternormals.jpg"))
	const [addedWaterTexture, setAddedWaterTexture] = useState(false);


    const offSceneSpherePosition = useMemo(() => {
    	return [0, -99999999, 0];
    }, []);

	return <>
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

		<mesh ref={surfaceRef} receiveShadow position={[0, props.state.planet.radius, 0]} rotation={[Math.PI / 2, 0, 0]}>
			<planeGeometry args={[200, 200, 200, 200]} />
			<meshStandardMaterial 
				opacity={1}
				wireframe
				transparent={true}
				side={DoubleSide}
				vertexColors={true}
            	
			/>
		</mesh>

		<mesh ref={cliffsRef} receiveShadow position={[0, props.state.planet.radius, 0]} rotation={[Math.PI / 2, 0, 0]}>
			<planeGeometry args={[200, 200, 200, 200]} />
			<meshStandardMaterial 
				opacity={1}
				side={DoubleSide}
				vertexColors={false}
			/>
		</mesh>

		<mesh ref={grassesRef} receiveShadow position={[0, props.state.planet.radius, 0]} rotation={[Math.PI / 2, 0, 0]}>
			<planeGeometry args={[200, 200, 200, 200]} />
			<meshStandardMaterial 
				opacity={1}
				side={DoubleSide}
				vertexColors={true}
			/>
		</mesh>

		<Flowers ref={flowersRef} 
			{...props}
			receiveShadow 
			position={[0, props.state.planet.radius, 0]} 
			rotation={[Math.PI / 2, 0, 0]}>	
		</Flowers>	


	</>
}

export default Planet;