import React, { useRef, useEffect, useState,
	useMemo 
} from 'react';
import { useFrame, useThree, Canvas } from '@react-three/fiber';
import ModelViewer from './ModelViewer';
import Planet from './Planet'
import { 
	Vector3,
	Point,
	Points,
	Matrix4,
	InstancedMesh,
	BufferGeometry,
	SphereGeometry,
	PointsMaterial,
	Color,
	BufferAttribute,
	Object3D,
	MeshBasicMaterial,
	Float32BufferAttribute,
	Group,
	DoubleSide
} from 'three'
import {
	pointOnSphere,
	randomInRange
} from '../util';
import {
	starRadius,
	angularSize
} from '../models/constants';

var RECORD = {
	star: {
		categories: 11,
		sizes: Array.from({ length: 11 }, () => randomInRange(angularSize * starRadius * 0.009, angularSize * starRadius * 1.01))
	},
	terrain: {
		categories: 11,
		sizes: [
			0.01, 0.1, 0.2, 1.3, 0.5, 0.7, 0.77, 0.85, 1.23, 1.5, 2, 1
		]
	},
	sky: {
		categories: 2,
		size: 1000,
		panelCount: 20000
	}
}

function Scene(props) {
	const { camera, scene } = useThree();
	const starGroupRef = useRef();
	const skyGroupRef = useRef();
	const sunRef = useRef();
	const cloudsRef = useRef();
	const cloudsRefWire = useRef();
	const randomStarSeeds = useMemo(() => {
		scene.background = new Color(0, 0, 0);
		return Array.from({ length: RECORD.star.categories * RECORD.star.count })
		.flatMap(n => {
			return [Math.random(), Math.random()]
		});
	}, []);
	const randomSkySeeds = useMemo(() => {
		return Array.from({ length: RECORD.sky.categories * RECORD.sky.count })
		.flatMap(n => {
			return [Math.random(), Math.random()]
		});
	}, []);
	camera.near = 0.1;
	camera.far = starRadius * 2
	camera.updateProjectionMatrix();

	const starsMaterials = useMemo(() => {
		var materials = []
		for (var i = 0; i < RECORD.star.categories; i++) {
			materials.push(new PointsMaterial({ 
				vertexColors: true,
				size: RECORD.star.sizes[i]
			}));
		}
		return materials;
	}, []);
	
	var starsGeometries = useMemo(() => {
		var _starGeometries = []
		for (var i = 0; i < RECORD.star.categories; i++) {
			props.dispatch({ type: 'ADD_SCENE', scene })

			var starsGeometry = new BufferGeometry()		
			var positions = []
			var colors = []
			var startCount = 500
			var minRadius = starRadius; // Minimum radius

			var userCenter = new Vector3(...props.state.model.scene.position);
			for (var j = 0; j < startCount; j++) {
				const phi = randomInRange(0, Math.PI * 2)//, randomStarSeeds[j + j * i]) // Azimuthal angle from 0 to 2π
				const theta = Math.acos(2 * Math.random() - 1);//, randomStarSeeds[j + j * i + 1]); // Calculate theta from costheta
				const radius = minRadius//minRadius + Math.random() * (maxRadius - minRadius); // Random radius between minRadius and maxRadius

				const x = radius * Math.sin(theta) * Math.cos(phi);
				const y = radius * Math.sin(theta) * Math.sin(phi);
				const z = radius * Math.cos(theta);

				const starDistance = new Vector3(x, y, z).distanceTo(new Vector3(0, 0, 0));
		        if (Math.abs(starDistance - starRadius) > 10) {
		        	debugger
		        }

				positions.push(x, y, z);

				var r = 1//Math.random() * (1 - 1.87);
				var g = 1//Math.random() * (1 - 1.87);
				var b = 1//Math.random() * (1 - 1.87);


				colors.push(r, g, b);
			}

			starsGeometry.setAttribute('color', new Float32BufferAttribute(colors, 3));
			starsGeometry.setAttribute('position', new Float32BufferAttribute(positions, 3));

			props.dispatch({ type: 'LOAD_THE_STARS', starBuffer: positions })

			_starGeometries.push(starsGeometry);
		}


		return _starGeometries;
	}, []);


	useFrame(() => {
	    if (starGroupRef.current) {
	        starGroupRef.current.rotation.x += 0.001; // Rotate around the Y-axis
	        // 
	        if (starGroupRef.current.rotation.x > Math.PI * 2) {
	            starGroupRef.current.rotation.x = 0
	        }
	        props.dispatch({ type: 'SCENE_ROTATION', x: starGroupRef.current.rotation.x })
	       
	    }
	});

	useEffect(() => {
	    const isNight = props.state.x > Math.PI / 2 && props.state.x < Math.PI * 1.5;

	    // Check current background color and update accordingly
	    if (isNight && scene.background?.getHex() !== 0x000000) {
	      scene.background = new Color('black');
	    } else if (!isNight && scene.background?.getHex() !== 0x87ceeb) { // Skyblue hex
	      scene.background = new Color('skyblue');
	    }
	  }, [props.state.x, scene]);

	useFrame(() => {
		if (!starGroupRef.current) {
			return null;
		}
        // Sun's spherical coordinates
	    const sunPhi = Math.PI / 2; // Azimuthal angle (constant here)
	   	const sunTheta = Math.PI / 2// Polar angle (based on rotation)
	    const sunRadius = starRadius; // Radius of the sun

	    // Convert to Cartesian coordinates
	    const sunX = sunRadius * Math.sin(sunTheta) * Math.cos(sunPhi);
	    const sunY = sunRadius * Math.sin(sunTheta) * Math.sin(sunPhi);
	    const sunZ = sunRadius * Math.cos(sunTheta);

	    // Create the sun's position vector
	    const sunPosition = new Vector3(sunX, sunY, sunZ);
	    const rotationMatrix = new Matrix4().makeRotationX(starGroupRef.current.rotation.x);

        // Apply the rotation to the sun's position
        sunPosition.sub(new Vector3(0, props.state.planet.radius, 0)); // Translate to the origin
        sunPosition.applyMatrix4(rotationMatrix); // Apply rotation
        sunPosition.add(new Vector3(0, props.state.planet.radius, 0)); // Translate back to the group's center

        if (sunRef.current) {
        	sunRef.current.position.copy(sunPosition)
        }


		props.state.sunPosition = [sunPosition.x, sunPosition.y, sunPosition.z]

		props.dispatch({ type: 'LOAD_THE_SUN', sunPosition: [sunPosition.x,sunPosition.y,sunPosition.z] })
	    
	});

	useEffect(() => {
	  if (cloudsRef.current) {
	    const count = 3000; // Total number of points
	    const clusterCount = 100; // Number of cloud clusters
	    const pointsPerCluster = Math.floor(count / clusterCount);
	    const radius = props.state.planet.radius;
	    const positions = []; // Center positions of clusters
	    const scales = []; // Scale for cloud deformation

	    const randomInRange = (min, max) => Math.random() * (max - min) + min;

	    // Generate cluster centers
	    for (let i = 0; i < clusterCount; i++) {
	      const x = randomInRange(-100000, 100000);
	      const y = randomInRange(radius + 1000, radius + 3000); // Clouds above the surface
	      const z = randomInRange(-100000, 100000);
	      positions.push({ center: [x, y, z], points: [] }); // Each cluster has a center and points
	    }

	    // Assign points to clusters with vertical flattening
	    positions.forEach((cluster) => {
	      const { center } = cluster;
	      for (let i = 0; i < pointsPerCluster; i++) {
	        const x = randomInRange(center[0] - randomInRange(0, 5000), center[0] + randomInRange(0, 5000)); // Cluster radius
	        const z = randomInRange(center[2] - randomInRange(0, 5000), center[2] + randomInRange(0, 5000));
	        const y =
	          center[1] +
	          randomInRange(100, 3000) + // Upward trending
	          Math.abs(randomInRange(-100, 100)); // Flatten at bottom

	        cluster.points.push([x, y, z]);
	        scales.push(randomInRange(.5, 1000)); // Vary scale for each point
	      }
	    });

	    // Create geometry for points
	    const geometry = new SphereGeometry(1, 8, 8); // Base geometry
	    const positionAttribute = geometry.attributes.position;

	    // Apply random noise to vertices to make them billowy
	    for (let i = 0; i < positionAttribute.count; i++) {
	      const vertex = new Vector3().fromBufferAttribute(positionAttribute, i);

	      vertex.x += randomInRange(-0.5, 0.5); // Add randomness
	      vertex.y += randomInRange(-0.5, 0.5);
	      vertex.z += randomInRange(-0.5, 0.5);

	      positionAttribute.setXYZ(i, vertex.x, vertex.y, vertex.z);
	    }
	    positionAttribute.needsUpdate = true;

	    // Apply transformations to each instance
	    const cloud = new Object3D();
	    let index = 0;

	    positions.forEach((cluster) => {
	      cluster.points.forEach((point) => {
	        cloud.position.set(...point);
	        const scale = scales[index];
	        cloud.scale.set(scale * 2, scale, scale * 2);
	        // cloud.rotation.set(randomInRange(0,0),randomInRange(0, Math.PI * 2),randomInRange(0, 0))
	        cloud.updateMatrix();
	        var cloudWire = cloud.clone();
	        // cloudWire.position.y -= 100;
	        cloudsRef.current.setMatrixAt(index, cloud.matrix);
	        cloudsRefWire.current.setMatrixAt(index, cloudWire.matrix);
	        index++;
	      });
	    });

	    cloudsRef.current.instanceMatrix.needsUpdate = true;
	    cloudsRefWire.current.instanceMatrix.needsUpdate = true;
	  }
	}, []);

	useFrame(() => {
		if (cloudsRef.current) {
			const cloud = new Object3D();
			const windDirection = new Vector3(0.1, 0, 0.05);
			for (var i = 0; i < 3000; i++) {
				// Get the current matrix of the instance
				cloudsRef.current.getMatrixAt(i, cloud.matrix);

				cloud.matrix.elements[12] += randomInRange(1, 11)
				if (cloud.matrix.elements[12] > 100000) {
					cloud.matrix.elements[12] = -100000
				}

				// // Update the instance's matrix in the instanced mesh
				cloudsRef.current.setMatrixAt(i, cloud.matrix);
				cloudsRefWire.current.setMatrixAt(i, cloud.matrix);

				cloudsRef.current.instanceMatrix.needsUpdate = true
				cloudsRefWire.current.instanceMatrix.needsUpdate = true
			}
		}
	})


	
	return (
		<>
			<ModelViewer camera={camera} {...props} />
			<Planet {...props} />

			{/*{ props.state.model.dial }*/}
			<group ref={starGroupRef} position={[...props.state.model.scene.position]}>
				{

					starsGeometries.map((starGeometryOfCategory, i) => {
		
						return <points key={i} args={[starGeometryOfCategory, starsMaterials[i]]}/>
					}) 
				}
			</group>

			<instancedMesh ref={cloudsRef} args={[null, null, 3000]}>
				<sphereGeometry args={[1.2, 9, 9]} /> {/* Sphere for each point */}
      			<meshBasicMaterial color="white" />
			</instancedMesh>

			<instancedMesh ref={cloudsRefWire} args={[null, null, 3000]}>
				<sphereGeometry args={[1.2, 9, 9]} /> {/* Sphere for each point */}
      			<meshBasicMaterial color="black" wireframe transparent opacity={0.1} />
			</instancedMesh>
			
		</>
	);
}

export default Scene;