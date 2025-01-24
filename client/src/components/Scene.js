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
	        starGroupRef.current.rotation.x += 0.0001; // Rotate around the Y-axis
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

	// useEffect(() => {
	//   if (cloudsRef.current) {
	//     const count = 3000; // Total number of points
	//     const clusterCount = 100; // Number of cloud clusters
	//     const pointsPerCluster = Math.floor(count / clusterCount);
	//     const radius = props.state.planet.radius;
	//     var Cloud_Clusters = []; // Center Cloud_Clusters of clusters

	//     // Generate cluster centers
	//     for (let i = 0; i < clusterCount; i++) {
	//       const x = randomInRange(-100000, 100000);
	//       const y = randomInRange(radius + 1000, radius + 5000); // Clouds above the surface
	//       const z = randomInRange(-100000, 100000);
	      
	//       Cloud_Clusters.push({ 
	// 		center: [x, y, z], 
	// 		points: [], 
	// 		colors: [], 
	// 		uvs: [], 
	// 		scales: [] 
	// 	  }); // Each cluster has a center, points, colors, uvs, scales
	//     }


	//     // Assign points to clusters with vertical flattening
	//     Cloud_Clusters.forEach((cluster, clusterIndex) => {
	//       const { center } = cluster;
	//       for (let i = 0; i < pointsPerCluster; i++) {
	//         const x = randomInRange(center[0] - randomInRange(0, 5000), center[0] + randomInRange(0, 5000)); // Cluster radius
	//         const z = randomInRange(center[2] - randomInRange(0, 5000), center[2] + randomInRange(0, 5000));
	//         const y =
	//           center[1] +
	//           randomInRange(100, 3000) + // Upward trending
	//           Math.abs(randomInRange(-100, 100)); // Flatten at bottom
	//         const scale = randomInRange(.5, 1000)

	//         cluster.scales.push([scale, scale, scale]);
	//         cluster.points.push([x, y, z]);
	//         cluster.colors.push([1, 0, 0]);
	//         cluster.uvs.push(
	//         	[Math.random(),
	//         	Math.random()]
	//         )
	     
	//       	const cloudPointIndex = Cloud_Clusters.slice(0, clusterIndex).length + i;
	//         cloudsRef.current.setColorAt(cloudPointIndex, new Color(0.09994, 0.09995, 0.9996));
	//       }
	//     });

	//     // Create geometry for points
	//     const geometry = new SphereGeometry(1, 8, 8); // Base geometry
	//     const positionAttribute = geometry.attributes.position;

	//     // Apply random noise to vertices to make them billowy
	//     for (let i = 0; i < positionAttribute.count; i++) {
	//       const vertex = new Vector3().fromBufferAttribute(positionAttribute, i);

	//       vertex.x += randomInRange(-0.5, 0.5); // Add randomness
	//       vertex.y += randomInRange(-0.5, 0.5);
	//       vertex.z += randomInRange(-0.5, 0.5);

	//       positionAttribute.setXYZ(i, vertex.x, vertex.y, vertex.z);
	//     }
	//     positionAttribute.needsUpdate = true;

	//     // Apply transformations to each instance
	//     const cloud = new Object3D();
	//     let index = 0;

	//     Cloud_Clusters = Cloud_Clusters.forEach((cluster) => {
	//       cluster.points.forEach((point, pointIndex) => {
	//         cloud.position.set(point[0], point[1], point[2]);
	//         const scale = cluster.scales[pointIndex];
	//         cloud.geometry.setColorAt(?, new Color(randomInRange(.9,1),randomInRange(.9,1),randomInRange(.9,1)))
	//         cloud.scale.set(scale[0], scale[1], scale[1]);
	//         const uv = cluster.uvs[pointIndex];
	//         cloud.uv.set(uv[0], uv[1], uv[2])
	//         cloud.updateMatrix();
	//         var cloudWire = cloud.clone();
	//         cloudsRef.current.setMatrixAt(index, cloud.matrix);
	//         cloudsRefWire.current.setMatrixAt(index, cloudWire.matrix);
	//         index++;
	//       });
	//       return Cloud_Clusters;
	//     });

	//     cloudsRef.current.instanceMatrix.needsUpdate = true;
	//     cloudsRefWire.current.instanceMatrix.needsUpdate = true;
	//   }
	// }, []);
	useEffect(() => {
	  if (cloudsRef.current) {
	    const count = 3000; // Total number of points
	    const clusterCount = 100; // Number of clusters
	    const pointsPerCluster = Math.floor(count / clusterCount);
	    const radius = props.state.planet.radius;
	    var Cloud_Clusters = []; // Cloud clusters

	    // Generate cluster centers
	    for (let i = 0; i < clusterCount; i++) {
	      const x = randomInRange(-100000, 100000);
	      const y = randomInRange(radius + 1000, radius + 5000); // Above the surface
	      const z = randomInRange(-100000, 100000);

	      Cloud_Clusters.push({
	        center: [x, y, z],
	        points: [],
	        scales: [],
	        colors: [],
	        uvs: []
	      });
	    }

	    var uvs = []
	    var colors = []

	    // Generate points for each cluster
	    Cloud_Clusters.forEach((cluster) => {
	      const { center } = cluster;
	      for (let i = 0; i < pointsPerCluster; i++) {
	        const x = randomInRange(center[0] - 5000, center[0] + 5000);
	        const z = randomInRange(center[2] - 5000, center[2] + 5000);
	        const y = center[1] + randomInRange(100, 3000); // Vertical offset
	        const scale = randomInRange(100, 1900); // Scale variation
	        const color = [Math.random(), Math.random(), Math.random()]; // Random color

	        cluster.points.push([x, y, z]);

	        uvs.push(Math.random(), Math.random());
	        colors.push(color[0], color[1])
	      }
	    });

	    const tempObject = new Object3D();
	    const tempColor = new Color();

	    let index = 0;


	    Cloud_Clusters.forEach((cluster) => {
	      cluster.points.forEach((point, pointIndex) => {
	        const [x, y, z] = point;
	        const scale = randomInRange(100, 3000)
	        tempObject.position.set(x, y, z);
	        tempObject.scale.set(scale, scale, scale);
	        tempObject.updateMatrix();
	        cloudsRef.current.setMatrixAt(index, tempObject.matrix);

	        cloudsRef.current.setColorAt(index, 
	        	new Color(
					randomInRange(0.64, 1), 
					randomInRange(0.64, 1), 
					randomInRange(0.64, 1)
	        	)
	        )

	        index++;
	      });
	    });
	    cloudsRef.current.geometry.needsUpdate = true;
	    cloudsRef.current.instanceMatrix.needsUpdate = true;


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
				// cloudsRefWire.current.setMatrixAt(i, cloud.matrix);

				cloudsRef.current.instanceMatrix.needsUpdate = true
				// cloudsRefWire.current.instanceMatrix.needsUpdate = true

				// if (new Vector3(...cloud.matrix.elements.slice(12, 14)).distanceTo(props.state.model.scene.position) > 50025) {
				// 	cloudsRefWire.current.material.opacity = 0;
				// 	cloudsRefWire.current.material.needsUpdate = true;
				// } else if (cloudsRefWire.current.material.opacity == 0) {
				// 	cloudsRefWire.current.material.opacity = 1;
				// }
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
				<sphereGeometry 
					args={[1.2, 9, 9]} />
      			<meshBasicMaterial color="white" />
			</instancedMesh>

			
		</>
	);
}

export default Scene;