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
	Matrix4,
	CatmullRomCurve3,
	Object3D,
	Triangle
} from 'three'
import * as perlinNoise from 'perlin-noise';
import {
	filterSteepGeometry,
	randomInRange,
	randomPointOnTriangle,
	randomPointOnTriangleFromGrid,
	TriangleMesh
} from '../util';

// The Dandilion Curvature
let _a = 10.5;
const ra = randomInRange(_a * -0.05, _a * 0.05)
const rb = randomInRange(_a * -0.05, _a * 0.05)
const rc = randomInRange(_a * 0.01, _a * 0.01)
const rd = randomInRange(_a * 0.01, _a * 0.01)
const re = randomInRange(_a * 0.01, _a * 0.01)
const rf = randomInRange(_a * 0.1, _a * 0.1)
const rg = randomInRange(_a * -0.15, _a * 0.15)
const rh = randomInRange(_a * -0.05, _a * 0.05);
	  
function Planet(props) {
	const a = _a;
	const aa = _a;
	var i = new Date().getTime();
	var fiber = useThree();

	const twopi = Math.PI * 2;
	const halfpi = Math.PI / 2;
	const threequaterspi = Math.PI * twopi;

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
	const flowersBallsRef = useRef();
	const bladesOfGrassRef = useRef();

	useEffect(() => {
		const rows = 50;
		const cols = 50;
		const zeds = 50;

		const amplitude = 100;
		const halfAmplitude = amplitude / 2;

        const geometry = new PlaneGeometry(1000, 1000, 50, 50);
		geometry.vertexColors = true;
        const positions = geometry.attributes.position.array;
        for (var x = 0; x < positions.length; x += 3) {
        	var y = positions[x + 1];
        	positions[x + 1] = positions[x + 2];
        	positions[x + 2] = y;
        }
		const colors = [];
        const TOCENTER = props.state.model.scene.position.clone().normalize();
		

		const noise = perlinNoise.generatePerlinNoise(50, 50, {
			persistence: .005,
			amplitude
		});

		const indices = [];





		var dandelionIndex = 0;
		var bladeIndex = 0;
		var xx = [];
		for (let x = 0; x < positions.length; x += 3) {
		    const xIndex = Math.floor((x / 3) % cols);
		    const zIndex = Math.floor((x / 3) / cols) + 2;
		    const noiseValue = noise[zIndex * cols + xIndex] * amplitude;
		    const noiseOffset = noiseValue > halfAmplitude ? noiseValue - halfAmplitude : -(halfAmplitude - noiseValue);

		    positions[x] = positions[x];
		    positions[x + 1] = positions[x + 1] + noiseOffset;
		    positions[x + 2] = positions[x + 2];

		    if (xIndex < cols - 1 && zIndex < rows - 1) {
		        const topLeft = zIndex * (cols + 1) + xIndex;
		        const topRight = topLeft + 1;
		        const bottomLeft = (zIndex + 1) * (cols + 1) + xIndex;
		        const bottomRight = bottomLeft + 1;

		        // Create two triangles for the quad
		        indices.push(topLeft, bottomLeft, topRight); // Triangle 1
		        indices.push(topRight, bottomLeft, bottomRight); // Triangle 2

		        if (Math.random() < 0.33) {
			    	xx.push(x);
			    }
		    }

		    colors.push(Math.random() / 10, Math.random() / 10, Math.random() / 10);
		}

		

		for (var i = 0; i < xx.length; i++) {
			// var x = xx[i];
			// const TheDandilion = new Object3D();
			// const TheDandelionBall = new Object3D();


			// const flowerPosition = [positions[x], positions[x + 1] + a, positions[x + 2]];
			// // const flowerPosition = [rp.x, rp.y, rp.z];

			// if (Number.isNaN(flowerPosition[0]) || Number.isNaN(flowerPosition[0 + 1]) || Number.isNaN(flowerPosition[0 + 2])) {
			// console.warn(`NaN detected in positions at index ${x}`);
			// continue;
			// }

			// // const sc = randomInRange(1, 2);
			// // TheDandilion.scale.set(sc, sc, sc);
			// TheDandilion.rotation.y = randomInRange(0, twopi)
			// TheDandilion.position.set(flowerPosition[0], flowerPosition[0 + 1], flowerPosition[0 + 2]);
			// TheDandelionBall.position.set(flowerPosition[0], flowerPosition[0 + 1] + a, flowerPosition[0 + 2])
			// TheDandelionBall.updateMatrix();
			// TheDandilion.updateMatrix();

			// flowersRef.current.setMatrixAt(dandelionIndex, TheDandilion.matrix);
			// flowersRef.current.setColorAt(dandelionIndex, new Color(0, 1, 0));
			// flowersBallsRef.current.setMatrixAt(dandelionIndex, TheDandelionBall.matrix);
			// flowersBallsRef.current.setColorAt(dandelionIndex, new Color(randomInRange(0.96, 1), randomInRange(0.96, 1), randomInRange(0.96, 1)));


			// dandelionIndex++;
		}



		for (var x = 0; x < flowersBallsRef.current.geometry.attributes.position.array.length; x += 3) {
			// flowersBallsRef.current.geometry.attributes.position.array[x] += randomInRange(-a * 0.1, a * 0.1);
			// flowersBallsRef.current.geometry.attributes.position.array[x + 1] += randomInRange(-a * 0.1, a * 0.1);
			// flowersBallsRef.current.geometry.attributes.position.array[x + 2] += randomInRange(-a * 0.1, a * 0.1);
		}
		// flowersBallsRef.current.geometry.attributes.position.needsUpdate = true;

		geometry.setAttribute('color', new Float32BufferAttribute(colors, 3))
        geometry.attributes.position.needsUpdate = true;


        surfaceRef.current.geometry = geometry;

        var geometries = filterSteepGeometry(geometry, .65, 'gray');
        cliffsRef.current.geometry = geometries.steep;
        cliffsRef.current.geometry.computeBoundingBox();

        var cliffColors = [];
        var dandilionColors = [];
        const cliffUvs = [];
        var foundHobbitHole = false;
        for (var x = 0; x < cliffsRef.current.geometry.attributes.position.array.length; x += 3) {

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

        for (var i = 0; i < rows; i++) {
			for (var j = 0; j < cols; j++) {
				let a = i + j * (rows + 1);
				let b = (i + 1) + j * (rows + 1);
				let c = (i + 1) + (j + 1) * (rows + 1);
				let d = i + (j + 1) * (rows + 1);
				const TheDandilion = new Object3D();
				const TheDandelionBall = new Object3D();
				const TheBlade = new Object3D();
				

				let triangle = new Triangle(
			        new Vector3(geometries.other.attributes.position.array[a * 3], geometries.other.attributes.position.array[a * 3 + 1] + props.state.planet.radius, geometries.other.attributes.position.array[a * 3 + 2]),
			        new Vector3(geometries.other.attributes.position.array[b * 3], geometries.other.attributes.position.array[b * 3 + 1] + props.state.planet.radius, geometries.other.attributes.position.array[b * 3 + 2]),
			        new Vector3(geometries.other.attributes.position.array[c * 3], geometries.other.attributes.position.array[c * 3 + 1] + props.state.planet.radius, geometries.other.attributes.position.array[c * 3 + 2])
			    );

	
				if (Math.random() < 0.8) {
		
					var clusterCount = 33//randomInRange(3, 30);

					for (var k = 0; k < clusterCount; k++) {

						const flowerPosition = randomPointOnTriangle(triangle.a, triangle.b, triangle.c)
						// const flowerPosition = [rp.x, rp.y, rp.z];

						if (Number.isNaN(flowerPosition.x) || Number.isNaN(flowerPosition.y) || Number.isNaN(flowerPosition.z)) {
							console.warn(`NaN detected in positions at index ${x}`);
							continue;
						}

						TheDandilion.rotation.y = randomInRange(0, twopi)
						TheDandilion.position.set(flowerPosition.x, flowerPosition.y, flowerPosition.z);
						TheDandelionBall.position.set(flowerPosition.x, flowerPosition.y + aa, flowerPosition.z)
						TheDandelionBall.updateMatrix();
						TheDandilion.updateMatrix();

						flowersRef.current.setMatrixAt(dandelionIndex, TheDandilion.matrix);
						flowersRef.current.setColorAt(dandelionIndex, new Color(0, 1, 0));
						flowersBallsRef.current.setMatrixAt(dandelionIndex, TheDandelionBall.matrix);
						flowersBallsRef.current.setColorAt(dandelionIndex, new Color(randomInRange(0.96, 1), randomInRange(0.96, 1), randomInRange(0.96, 1)));


						dandelionIndex++;
					}
				}
			}
		}


		flowersRef.current.count = dandelionIndex;
		flowersRef.current.instanceColor.needsUpdate = true;
		flowersBallsRef.current.count = dandelionIndex;
		flowersBallsRef.current.instanceColor.needsUpdate = true;

        var grassesColors = [];
        // var dandelionIndex = 0;
        // var TheDandilion = new Object3D()
        for (var x = 0; x < grassesRef.current.geometry.attributes.position.array.length; x += 3) {
        	// grassesRef.current.geometry.attributes.position.array[x] += randomInRange(-0.33, 0.33)
        	// grassesRef.current.geometry.attributes.position.array[x + 1] += 0.25
        	// grassesRef.current.geometry.attributes.position.array[x + 2] += randomInRange(-0.33, 0.33)

        	const r = randomInRange(3, 7) / 255
        	const g = randomInRange(210, 252) / 255
        	const b = randomInRange(29, 100) / 255

        	grassesColors.push(r, g, b);




			// Check condition for flower placement
			// if (dandelionIndex < 300000 && (g > 0.932 && b < 0.3)) {

				
			// }
        }

        // for (var index of flowersRef.current.geometry.index.array) {
        // 	flowersRef.current.setColorAt(index, new Color(0, 1, 0));
        // }


        flowersRef.current.geometry.needsUpdate = true;
		flowersRef.current.instanceMatrix.needsUpdate = true;
		flowersBallsRef.current.geometry.needsUpdate = true;
		flowersBallsRef.current.instanceMatrix.needsUpdate = true;

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
    const seaLevel = useMemo(() => new Vector3(0, props.state.planet.radius, 0), []);
	const sphereColor = useMemo(() => 'white', []);
	const surfaceRef = useRef();
	const [lakeNodes, setLakeNodes] = useState([]);
	const waterNormalsTexture = useMemo(() => new TextureLoader().load("/waternormals.jpg"))
	const [addedWaterTexture, setAddedWaterTexture] = useState(false);

	const dandilionstemtexture = useMemo(() => new TextureLoader().load("/dandilion-stem.jpg"), texture => {
		texture.wrapS = RepeatWrapping
	    texture.wrapT = RepeatWrapping
	    texture.repeat.set(5, 10)
	})
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

		<mesh ref={surfaceRef} receiveShadow position={[0, props.state.planet.radius, 0]}>
			<planeGeometry args={[200, 200, 200, 200]} />
			<meshStandardMaterial 
				opacity={0}
				wireframe
				transparent={true}
				side={DoubleSide}
				vertexColors={true}
            	
			/>
		</mesh>

		<mesh ref={cliffsRef} receiveShadow position={[0, props.state.planet.radius, 0]}>
			<planeGeometry args={[200, 200, 200, 200]} />
			<meshStandardMaterial 
				opacity={1}
				side={DoubleSide}
				vertexColors={false}
			/>
		</mesh>

		<mesh ref={grassesRef} receiveShadow position={[0, props.state.planet.radius, 0]}>
			<planeGeometry args={[200, 200, 200, 200]} />
			<meshStandardMaterial 
				opacity={0.7}
				side={DoubleSide}
				vertexColors={true}
				transparent
			/>
		</mesh>

		<instancedMesh ref={flowersRef} args={[null, null, 300000]}>
			<tubeGeometry args={[
				new CatmullRomCurve3([
					new Vector3(ra, 0, rb),
					new Vector3(rc, a * .2, rd),
					new Vector3(re, a * .4, rf),
					new Vector3(rg, a * .6, rh),
					new Vector3(0, a * 1, 0)
				]), 
				11, // tubular segments
				a / 75, // radius
				11 // radial segments
			]} />
  			<meshStandardMaterial
  				map={dandilionstemtexture}
  				color="white" />
		</instancedMesh>

		<instancedMesh ref={flowersBallsRef} args={[null, null, 300000]}>
			<sphereGeometry args={[a * 0.1, 9, 9]} />
  			<meshBasicMaterial color="white" />
		</instancedMesh>

		<instancedMesh ref={bladesOfGrassRef} args={[null, null, 3000000]}>
			<planeGeometry args={[0.07, 0.3]} />
  			<meshBasicMaterial color="green" />
		</instancedMesh>
	</>
}

export default Planet;