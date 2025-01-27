import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useFrame, useThree, InstancedMesh, useLoader } from '@react-three/fiber'
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
	Raycaster,
	Float32BufferAttribute,
	SphereGeometry,
	TextureLoader,
	Color,
	MeshStandardMaterial,
	CylinderGeometry,
	BufferGeometry,
	Group,
	VSMShadowMap,
	PCFSoftShadowMap,
	ArrowHelper,
	Quaternion,
	TubeGeometry,
	Matrix4,
	CatmullRomCurve3,
	Object3D,
	Triangle,
	RepeatWrapping,
	Shape
} from 'three';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader';
import * as perlinNoise from 'perlin-noise';
import {
	filterSteepGeometry,
	randomInRange,
	randomPointOnTriangle,
	randomPointOnTriangleFromGrid,
	TriangleMesh,
	size,
	interpolateNoise
} from '../util';

// The Dandilion Curvature
let _a = 3.5;
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
	const sword = useLoader(OBJLoader, '/sword.obj');
	const swordRef = useRef();
	let swordHasBeenPlaced = false;
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
	const normalSphereRef = useRef();

	useEffect(() => {
		const rows = 50;
		const cols = 50;
		const zeds = 50;

		const amplitude = 100;
		const halfAmplitude = amplitude / 2;


        const geometry = new PlaneGeometry(1000, 1000, rows, cols);
		geometry.vertexColors = true;


        for (var x = 0; x < geometry.attributes.position.array.length; x += 3) {
        	var y = geometry.attributes.position.array[x + 1];
        	geometry.attributes.position.array[x + 1] = geometry.attributes.position.array[x + 2];
        	geometry.attributes.position.array[x + 2] = y;
        }

		geometry.attributes.position.needsUpdate = true;

		const positions = geometry.attributes.position.array;
        
        surfaceRef.current.geometry = geometry;
        grassesRef.current.geometry = geometry;

        const TOCENTER = props.state.model.scene.position.clone().normalize();
		const noise = perlinNoise.generatePerlinNoise(rows, cols, {
			persistence: .005,
			amplitude
		});

		const indices = [];

		var grassesColors = []
		var cliffColors = [];
        var dandilionColors = [];
        const cliffUvs = [];
        const grassUvs = [];
        var foundHobbitHole = false;
		var dandelionIndex = 0;
		var normalSphereIndex = 0;
		var bladeIndex = 0;
		var grassesIj = {}

		var currentNoiseOffset = 0;
		for (let x = 0; x < positions.length; x += 3) {
		    const xIndex = Math.floor((x / 3) % rows);
		    const zIndex = Math.floor((x / 3) / cols) + 2;
		    const noiseValue = noise[zIndex * cols + xIndex] * amplitude;
		    let noiseOffset = noiseValue > halfAmplitude ? noiseValue - halfAmplitude : -(halfAmplitude - noiseValue);

		    if ((noiseOffset !== 0 && !noiseOffset) || Number.isNaN(noiseOffset)) {
		    	noiseOffset = currentNoiseOffset
		    } else {
		    	currentNoiseOffset = noiseOffset
		    }

		    positions[x] = positions[x];
		    positions[x + 1] = positions[x + 1] + noiseOffset;
		    positions[x + 2] = positions[x + 2];

	        const topLeft = zIndex * (cols + 1) + xIndex;
	        const topRight = topLeft + 1;
	        const bottomLeft = (zIndex + 1) * (cols + 1) + xIndex;
	        const bottomRight = bottomLeft + 1;

	        // Create two triangles for the quad
	        indices.push(topLeft, bottomLeft, topRight); // Triangle 1
	        indices.push(topRight, bottomLeft, bottomRight); // Triangle 2
		}

		
		// style the dandilions
		for (var x = 0; x < flowersBallsRef.current.geometry.attributes.position.array.length; x += 3) {
			flowersBallsRef.current.geometry.attributes.position.array[x] += randomInRange(-a * 0.1, a * 0.1);
			flowersBallsRef.current.geometry.attributes.position.array[x + 1] += randomInRange(-a * 0.1, a * 0.1);
			flowersBallsRef.current.geometry.attributes.position.array[x + 2] += randomInRange(-a * 0.1, a * 0.1);
		}
		flowersBallsRef.current.geometry.attributes.position.needsUpdate = true;

		

        


        

        var TerrainInstance = filterSteepGeometry(geometry, .65, 'gray');
        var TheNormalSphere = new Object3D();

        for (var x = 0; x < TerrainInstance.steepGeometry.attributes.normal.array.length; x += 3) {
        	const normalX = TerrainInstance.steepGeometry.attributes.normal.array[x];
        	const normalY = TerrainInstance.steepGeometry.attributes.normal.array[x + 1];
        	const normalZ = TerrainInstance.steepGeometry.attributes.normal.array[x + 2];


        	for (var yyy = 25; yyy < 75; yyy += 5) {
	        	
        		if (Math.random() < 0.1) {
		        	for (var jjj = 0; jjj < 1; jjj++) {
		        		TheNormalSphere.position.set(
			        		TerrainInstance.steepGeometry.attributes.position.array[x],
			        		TerrainInstance.steepGeometry.attributes.position.array[x + 1] + props.state.planet.radius,
			        		TerrainInstance.steepGeometry.attributes.position.array[x + 2]
			        	).add(new Vector3(
				        		normalX * -yyy, 
				        		normalY * -yyy, 
				        		normalZ * -yyy
			        		)
			        	);

			
		        		
		        		TheNormalSphere.position.y -= a * 2;
			       		TheNormalSphere.updateMatrix();

			        	normalSphereRef.current.setMatrixAt(normalSphereIndex, TheNormalSphere.matrix);


			        	normalSphereIndex++;


			        	for (var jj = 0; jj < 1; jj++) {
			        		TheNormalSphere.position.set(
				        		TerrainInstance.steepGeometry.attributes.position.array[x],
				        		TerrainInstance.steepGeometry.attributes.position.array[x + 1] + props.state.planet.radius,
				        		TerrainInstance.steepGeometry.attributes.position.array[x + 2]
				        	).add(new Vector3(
					        		(normalX * -yyy) + randomInRange(-randomInRange(-a * 20, a * 20), randomInRange(-a * 20, a * 20)), 
					        		normalY * -yyy, 
					        		(normalZ * -yyy) + randomInRange(-randomInRange(-a * 20, a * 20), randomInRange(-a * 20, a * 20))
				        		)
				        	);
			        		TheNormalSphere.position.y -= a * 2;
				       		TheNormalSphere.updateMatrix();

				        	normalSphereRef.current.setMatrixAt(normalSphereIndex, TheNormalSphere.matrix);
				        	normalSphereRef.current.setColorAt(normalSphereIndex, new Color(0, 1, 0));


				        	normalSphereIndex++;
			        	}
			        }
			    }
	        }
        }


        cliffsRef.current.geometry = TerrainInstance.steepGeometry;

        cliffsRef.current.geometry.computeBoundingBox();

        
        for (var x = 0; x < cliffsRef.current.geometry.attributes.position.array.length; x += 3) {

        	cliffColors.push(141 / 255, 148 / 255, 144 / 255);
        	cliffUvs.push(
        		(cliffsRef.current.geometry.attributes.position.array[x] - cliffsRef.current.geometry.boundingBox.min.x) / cliffsRef.current.geometry.boundingBox.max.x,
        		(cliffsRef.current.geometry.attributes.position.array[x + 2] - cliffsRef.current.geometry.boundingBox.min.z) / cliffsRef.current.geometry.boundingBox.max.z
        	);

        }


        cliffsRef.current.geometry.setAttribute('uv', new Float32BufferAttribute(cliffUvs, 2));
        cliffsRef.current.material.map = cliffTexture()
        cliffsRef.current.geometry.attributes.position.needsUpdate = true

        grassesRef.current.geometry = TerrainInstance.otherGeometry;


        var triangles = []
        var dists = new Set()

        for (var i = 0; i < rows; i++) {
			for (var j = 0; j < cols; j++) {
				let a = i + j * (rows + 1);
				let b = (i + 1) + j * (rows + 1);
				let c = (i + 1) + (j + 1) * (rows + 1);
				let d = i + (j + 1) * (rows + 1);
				

				const TheDandilion = new Object3D();
				const TheDandelionBall = new Object3D();
				const TheBlade = new Object3D();
				
				const ta = new Vector3(
		        	surfaceRef.current.geometry.attributes.position.array[a * 3],
	        		surfaceRef.current.geometry.attributes.position.array[a * 3 + 1] + props.state.planet.radius,
		        	surfaceRef.current.geometry.attributes.position.array[a * 3 + 2]
		        )
		        const tb = new Vector3(
		        	surfaceRef.current.geometry.attributes.position.array[b * 3],
	        		surfaceRef.current.geometry.attributes.position.array[b * 3 + 1] + props.state.planet.radius,
		        	surfaceRef.current.geometry.attributes.position.array[b * 3 + 2]
		        )
		        const tc = new Vector3(
		        	surfaceRef.current.geometry.attributes.position.array[c * 3],
	        		surfaceRef.current.geometry.attributes.position.array[c * 3 + 1] + props.state.planet.radius,
		        	surfaceRef.current.geometry.attributes.position.array[c * 3 + 2]
		        )

		        const td = new Vector3(
		        	surfaceRef.current.geometry.attributes.position.array[d * 3],
	        		surfaceRef.current.geometry.attributes.position.array[d * 3 + 1] + props.state.planet.radius,
		        	surfaceRef.current.geometry.attributes.position.array[d * 3 + 2]
		        )

		        

				let triangle = new Triangle(
			        ta, tb, tc
			    );

			    let otherTriangle = new Triangle(
			    	tb, tc, td
			    );

			    if (ta.x < 6 && ta.z < 6) {

				    if (!swordHasBeenPlaced && i > 45 && j > 45 && i < 55 && j < 55) {
				    	swordRef.current.position.set(new Vector3(
				    		Math.max(triangle.a.x, triangle.b.x, triangle.c.x) - Math.min(triangle.a.x, triangle.b.x, triangle.c.x),
				    		Math.max(triangle.a.y, triangle.b.y, triangle.c.y) - Math.min(triangle.a.y, triangle.b.y, triangle.c.y),
				    		Math.max(triangle.a.z, triangle.b.z, triangle.c.z) - Math.min(triangle.a.z, triangle.b.z, triangle.c.z)
				    	))
				    	swordHasBeenPlaced = true;
				    }
		
			
						
				}

				if (i > 23 && i < 30 && j > 23 && j < 30) {
					if (true) {
						var clusterCount = randomInRange(3, 30);

						for (var k = 0; k < clusterCount; k++) {

							[triangle, otherTriangle].forEach(triangle => {
								const flowerPosition = randomPointOnTriangle(triangle.a, triangle.b, triangle.c)
								// const flowerPosition = [triangle.a.x, triangle.a.y, triangle.a.z];

								if (Number.isNaN(flowerPosition.x) || Number.isNaN(flowerPosition.y) || Number.isNaN(flowerPosition.z)) {
									
									return;
								}

								TheDandilion.rotation.y = randomInRange(0, twopi)
								TheDandilion.position.set(flowerPosition.x, flowerPosition.y, flowerPosition.z);

								const scale = randomInRange(0.03, 0.5)

								
								TheDandilion.scale.set(scale, scale)
								TheDandelionBall.position.set(flowerPosition.x, flowerPosition.y + (aa * scale), flowerPosition.z)
								TheDandelionBall.scale.set(scale, scale, scale)
								TheDandelionBall.updateMatrix();
								TheDandilion.updateMatrix();

								flowersRef.current.setMatrixAt(dandelionIndex, TheDandilion.matrix);
					
								flowersRef.current.setColorAt(dandelionIndex, new Color(randomInRange(0, 0.1), randomInRange(0.9, 1), 0));
								flowersBallsRef.current.setColorAt(dandelionIndex, 
									new Color(
										randomInRange(0.7, 1), 
										Math.random(),
										Math.random()
									)
								);
								normalSphereRef.current.setColorAt(dandelionIndex, 
									new Color(
										randomInRange(0.7, 1), 
										Math.random(),
										Math.random()
									)
								);
								flowersBallsRef.current.setMatrixAt(dandelionIndex, TheDandelionBall.matrix);
								

								dandelionIndex++;
							})
						}
					}
				} else if (Math.random() < 0.23) {
					var clusterCount = 3//randomInRange(3, 30);

					for (var k = 0; k < clusterCount; k++) {

						[triangle, otherTriangle].forEach(triangle => {
							const flowerPosition = randomPointOnTriangle(triangle.a, triangle.b, triangle.c)
							// const flowerPosition = [triangle.a.x, triangle.a.y, triangle.a.z];

							if (Number.isNaN(flowerPosition.x) || Number.isNaN(flowerPosition.y) || Number.isNaN(flowerPosition.z)) {
								
								return;
							}

							TheDandilion.rotation.y = randomInRange(0, twopi)
							TheDandilion.position.set(flowerPosition.x, flowerPosition.y, flowerPosition.z);

							const scale = randomInRange(0.03, 23)

							
							TheDandilion.scale.set(scale, scale)
							TheDandelionBall.position.set(flowerPosition.x, flowerPosition.y + (aa * scale), flowerPosition.z)
							TheDandelionBall.scale.set(scale, scale, scale)
							TheDandelionBall.updateMatrix();
							TheDandilion.updateMatrix();

							flowersRef.current.setMatrixAt(dandelionIndex, TheDandilion.matrix);
							if (scale > 2) {
								flowersRef.current.setColorAt(dandelionIndex, new Color(0.2, 0.2, 0.2))
								TheDandelionBall.scale.set(randomInRange(scale, scale * 2), randomInRange(scale, scale * 1.2), randomInRange(scale, scale * 2))
								TheDandelionBall.updateMatrix();
							    flowersBallsRef.current.setColorAt(
							    	dandelionIndex,
							    	new Color(
							    		randomInRange(0, 0.5),
							    		randomInRange(0.5, 1),
							    		randomInRange(0.35, 0.65)
							    	)
							    );
							} else {
								flowersRef.current.setColorAt(dandelionIndex, new Color(randomInRange(0, 0.1), randomInRange(0.9, 1), 0));
								flowersBallsRef.current.setColorAt(dandelionIndex, 
									new Color(
										randomInRange(0.7, 1), 
										Math.random(),
										Math.random()
									)
								);
							}
							flowersBallsRef.current.setMatrixAt(dandelionIndex, TheDandelionBall.matrix);
							



							dandelionIndex++;
						})
					}


						
					 
				}
				

				// [triangle, otherTriangle].forEach(triangle => {
				// 	for (var g = 0; g < 100; g++) {
				// 		var pos = randomPointOnTriangle(triangle.a, triangle.b, triangle.c)
				// 		TheBlade.position.set(pos.x, pos.y, pos.z)
				// 		TheBlade.rotation.set(randomInRange(Math.PI - 0.1, Math.PI + 0.1), randomInRange(0, Math.PI * 2), randomInRange(Math.PI - 0.1, Math.PI + 0.1))
				// 		TheBlade.scale.set(randomInRange(1, 10),randomInRange(1, 10),randomInRange(1, 10))
				// 		TheBlade.updateMatrix();
				// 		bladesOfGrassRef.current.setMatrixAt(bladeIndex, TheBlade.matrix);
				// 		bladesOfGrassRef.current.setColorAt(bladeIndex, new Color(
				// 				7 * randomInRange(3, 7) / 255,
				// 	        	7 * randomInRange(210, 252) / 255,
				// 	        	7 * randomInRange(29, 100) / 255
				// 			)
				// 		);

				// 		bladeIndex++;
				// 	}
				// })
			}
		}

		flowersRef.current.count = dandelionIndex;
		flowersRef.current.instanceColor.needsUpdate = true;
		flowersBallsRef.current.count = dandelionIndex;
		flowersBallsRef.current.instanceColor.needsUpdate = true;
		normalSphereRef.current.count = normalSphereIndex
		normalSphereRef.current.instanceColor.needsUpdate = true;
		// bladesOfGrassRef.current.count = bladeIndex;
		// bladesOfGrassRef.current.instanceColor.needsUpdate = true;

        // var dandelionIndex = 0;
        // var TheDandilion = new Object3D()
        for (var x = 0; x < grassesRef.current.geometry.attributes.position.array.length; x += 3) {

        	const r = randomInRange(3, 7) / 255
        	const g = randomInRange(210, 252) / 255
        	const b = randomInRange(29, 100) / 255

        	grassesColors.push(r, g, b);
        }

        grassesRef.current.geometry.setAttribute('color', new Float32BufferAttribute(grassesColors, 3));
        grassesRef.current.geometry.needsUpdate = true;
        // for (var index of flowersRef.current.geometry.index.array) {
        // 	flowersRef.current.setColorAt(index, new Color(0, 1, 0));
        // }


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
			planetGeometry: sphereRef.current,
			triangles
		});



    }, []); // happens once
	
	
	useEffect(() => {
		if (normalSphereRef.current) {
			const TheNormalSphere = new Object3D();
			const TheNormalSphereMatrix = new Matrix4();
			const TheNormalSpherePosition = new Vector3();

			const TheFlowerStem = new Object3D();
			const TheFlowerStemPosition = new Vector3();
			const TheFlowerStemRotation = new Quaternion();
			const TheFlowerStemScale = new Vector3();
			const TheFlowerStemMatrix = new Matrix4();

			const TheFlowerBall = new Object3D();
			const TheFlowerBallPosition = new Vector3();
			const TheFlowerBallRotation = new Quaternion();
			const TheFlowerBallMatrix = new Matrix4();
			const TheFlowerBallScale = new Vector3();

			for (var i = 0; i < normalSphereRef.current.count; i++) {
				flowersRef.current.getMatrixAt(i, TheFlowerStemMatrix);
				TheFlowerStemMatrix.decompose(TheFlowerStemPosition, TheFlowerStemRotation, TheFlowerStemScale);
				flowersBallsRef.current.getMatrixAt(i, TheFlowerBallMatrix);
				TheFlowerStemMatrix.decompose(TheFlowerBallPosition, TheFlowerBallRotation, TheFlowerBallScale);

				normalSphereRef.current.getMatrixAt(i, TheNormalSphereMatrix);
				TheNormalSphereMatrix.decompose(TheNormalSpherePosition, new Quaternion(), new Vector3());
				const raycaster = new Raycaster();

				raycaster.set(TheNormalSpherePosition, new Vector3(0, -1, 0).normalize());

				const intersects = raycaster.intersectObject(surfaceRef.current, true);
				if (intersects.length > 0) {
					const scale = randomInRange(.09, .5);

					TheNormalSphere.position.set(intersects[0].point.x, intersects[0].point.y + props.state.planet.radius, intersects[0].point.z);
					TheNormalSphere.updateMatrix();

					TheFlowerStem.position.copy(TheNormalSphere.position);
					
					var sc = scale * randomInRange(1, 11);
					TheNormalSphere.scale.set(sc, sc, sc)
					TheNormalSphere.position.y = props.state.planet.radius + 21;
					TheNormalSphere.updateMatrix();

					TheFlowerStem.scale.set(scale, scale, scale);
					TheFlowerStem.updateMatrix();


					let balladdition = new Vector3(0, aa * scale, 0);
					TheFlowerBall.position.copy(TheFlowerStem.position).add(balladdition);
					TheFlowerBall.scale.set(scale, scale, scale);
					TheFlowerBall.updateMatrix();

				    flowersRef.current.setMatrixAt(i, TheFlowerStem.matrix);
				    flowersBallsRef.current.setMatrixAt(i, TheFlowerBall.matrix);
				    normalSphereRef.current.setMatrixAt(i,new Matrix4());
				}
			}


			// for (var x = 0; x < normalSphereRef.current.geometry.attributes.position.array.length; x += 3) {
			// 	normalSphereRef.current.geometry.attributes.position.array[x] += randomInRange(
			// 		-randomInRange(1, 5), randomInRange(1, 5)
			// 	)
			// 	normalSphereRef.current.geometry.attributes.position.array[x + 1] = props.state.planet.radius + 21
			// 	normalSphereRef.current.geometry.attributes.position.array[x + 1] += randomInRange(
			// 		-randomInRange(1, 5), randomInRange(1, 5)
			// 	)
			// }

			// normalSphereRef.current.geometry.attributes.position.needsUpdate = true;
		}

	}, []) // happens once


    const planetCenter = useMemo(() => new Vector3(0, 0, 0), []);
    const seaLevel = useMemo(() => new Vector3(0, props.state.planet.radius, 0), []);
	const sphereColor = useMemo(() => 'white', []);
	const surfaceRef = useRef();
	const [lakeNodes, setLakeNodes] = useState([]);
	const waterNormalsTexture = useMemo(() => new TextureLoader().load("/waternormals.jpg"))
	const [addedWaterTexture, setAddedWaterTexture] = useState(false);
	const [roofR, setRoofR] = useState(0)
	var [roofG, setRoofG] = useState(1)
	const [roofB, setRoofB] = useState(0)
	const dandilionstemtexture = useMemo(() => new TextureLoader().load("/dandilion-stem.jpg"), texture => {
		texture.wrapS = RepeatWrapping
	    texture.wrapT = RepeatWrapping
	    texture.repeat.set(5, 10)
	})
    const offSceneSpherePosition = useMemo(() => {
    	return [0, -99999999, 0];
    }, []);

    useFrame(() => {
	    roofG += Math.random() < 0.5 ? 0.001 : -0.001;
	    if (roofG > 1) {
	    	roofG = 0;
	    } else if (roofG < 0) {
	    	roofG = 1 + roofG;
	    }
	    setRoofG(roofG)
    })

	return <>

		<mesh ref={sphereRef} position={offSceneSpherePosition}>
            <sphereGeometry args={[props.state.planet.radius, 11, 100]} />
            <meshBasicMaterial 
            	opacity={0}
            	transparent={true}
            	side={DoubleSide}
            	vertexColors={false}
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
				side={DoubleSide}
				vertexColors
			/>
		</mesh>

		<instancedMesh ref={flowersRef} args={[null, null, 100000]}>
			<tubeGeometry args={[
				new CatmullRomCurve3([
					new Vector3(ra, 0, rb),
					new Vector3(rc, a * .2, rd),
					new Vector3(re, a * .4, rf),
					new Vector3(rg, a * .6, rh),
					new Vector3(0, a * 1, 0)
				]), 
				11, // tubular segments
				a / 50, // radius
				11 // radial segments
			]} />
  			<meshStandardMaterial
  				map={dandilionstemtexture}
  				color="white" />
		</instancedMesh>

		<primitive ref={swordRef} object={sword} />

		<instancedMesh castShadow receiveShadow ref={flowersBallsRef} args={[null, null, 1000000]}>
			<sphereGeometry args={[a * 0.1, 9, 9]} />
  			<meshStandardMaterial 
  				transparent
  				opacity={1}
  				color="white" />
		</instancedMesh>

		<instancedMesh castShadow ref={normalSphereRef} args={[null, null, 1000000]}>
			<sphereGeometry args={[18, 9, 9]} />
  			<meshStandardMaterial 
  				side={DoubleSide}/>
		</instancedMesh>
	</>
}

export default Planet;