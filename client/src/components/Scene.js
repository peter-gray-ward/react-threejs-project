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
	PointsMaterial,
	Color,
	BufferAttribute,
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

	var skyMaterials = useMemo(() => {
		var materials = [];
		for (var i = 0; i < RECORD.sky.categories; i++) {
			materials.push(new PointsMaterial({
				vertexColors: true,
				size: randomInRange(RECORD.sky.size, RECORD.sky.size * 11)
			}));

		}
		return materials;
	}, []);

	var skyGeometries = useMemo(() => {
	    var geometries = [];
	    const radius = props.state.planet.radius;

	    for (var i = 0; i < RECORD.sky.categories; i++) {
	        var skyGeometry = new BufferGeometry();
	        var positions = [];
	        var colors = [];

	        // Define grid resolution
	        const panelResolution = Math.sqrt(RECORD.sky.panelCount); // Grid size
	        const phiStep = (Math.PI * 2) / panelResolution; // Azimuthal angle step
	        const thetaStep = Math.PI / panelResolution; // Polar angle step (half sphere)

	        for (var j = 0; j < RECORD.sky.panelCount; j++) {
	            // Calculate grid indices
	            const row = Math.floor(j / panelResolution);
	            const col = j % panelResolution;

	            // Calculate phi and theta systematically
	            const phi = col * phiStep; // Horizontal division
	            const theta = row * thetaStep; // Vertical division

	            // Convert spherical coordinates to Cartesian
	            var x = props.state.model.scene.position.x + radius * Math.sin(theta) * Math.cos(phi);
	            const y = props.state.model.scene.position.y + radius * Math.sin(theta) * Math.sin(phi);
	            const z = props.state.model.scene.position.z + radius * Math.cos(theta);

	            positions.push(x, y, z);

	            // Color logic (keep or modify as needed)
	            var r = col / panelResolution; // Gradient based on column
	            var g = row / panelResolution; // Gradient based on row
	            var b = 1;

	            colors.push(r, g, b);
	        }

	        skyGeometry.setAttribute('position', new Float32BufferAttribute(positions, 3));
	        skyGeometry.setAttribute('color', new Float32BufferAttribute(colors, 3));

	        geometries.push(skyGeometry);
	    }

	    return geometries;
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

	    // Log the updated sun position

        skyGroupRef.current.children.forEach((skyCategory) => {
		    if (!skyCategory.geometry || !skyCategory.geometry.attributes.position) return;

		    const positions = skyCategory.geometry.attributes.position.array;
		    const colors = skyCategory.geometry.attributes.color ? skyCategory.geometry.attributes.color.array : null;

		    let maxDist = -Infinity;
		    let minDist = Infinity;

		    // First pass: Calculate min and max distances
		    for (let i = 0; i < positions.length; i += 3) {
		        const vertex = new Vector3(
		            positions[i],
		            positions[i + 1],
		            positions[i + 2]
		        );
		        const distanceToSun = sunPosition.distanceTo(vertex);
		        maxDist = Math.max(maxDist, distanceToSun);
		        minDist = Math.min(minDist, distanceToSun);
		    }

		    // Calculate the step size based on the range
		   

		    // Define colors for different intervals (customize as needed)
		   const spectrumColors = [
			    [0.8, 0.8, 1],  // Noon (light blue)
			    [0.6, 0.6, 0.8], // Afternoon (fading blue)
			    [0.4, 0.4, 0.6], // Sunset
			    [0.2, 0.2, 0.4], // Twilight
			    [0.1, 0.1, 0.2], // Early night
			    [0, 0, 0.1],     // Midnight (very dark blue)
			    [0, 0, 0]        // Deep night (black)
			].reverse();


		    // Normalize distance and map to spectrumColors
			for (let i = 0; i < positions.length; i += 3) {
			    const vertex = new Vector3(
			        positions[i],
			        positions[i + 1],
			        positions[i + 2]
			    );
			    const distanceToSun = sunPosition.distanceTo(vertex);

			    // Normalize distance to a range [0, 1]
			    const normalizedDistance = (distanceToSun - minDist) / (maxDist - minDist);

			    // Calculate the index in the spectrumColors array
			    const spectrumIndex = Math.min(
			        Math.floor(normalizedDistance * (spectrumColors.length - 1)),
			        spectrumColors.length - 1
			    );

			    // Get the corresponding color
			    const color = spectrumColors[0];

			    // Assign the calculated color
			    if (colors) {
			        colors[i] = color[0];     // Red
			        colors[i + 1] = color[1]; // Green
			        colors[i + 2] = color[2]; // Blue
			    }
			}


		    // Update the geometry colors if modified
		    if (colors) {
		    	skyCategory.geometry.setAttribute('color', new Float32BufferAttribute(colors, 3));
		        skyCategory.geometry.attributes.color.needsUpdate = true;
		    }

		    
		});


		// props.dispatch({ type: 'LOAD_SUN', sun: {
		// 	x: sunX,
		// 	y: sunY,
		// 	z: sunZ
		// } });

		props.state.sunPosition = [sunX, sunY, sunZ]

		props.dispatch({ type: 'LOAD_THE_SUN', sunPosition: [sunPosition.x,sunPosition.y,sunPosition.z] })
	    
	});


	
	return (
		<>
			<ModelViewer camera={camera} {...props} />
			<Planet {...props} />
			<group ref={sunRef} position={props.state.sunPosition}>

				<mesh>
		            <sphereGeometry args={[RECORD.star.sizes[3] * 35, 11, 100]} />
		            <meshBasicMaterial
		            	color={0xffffff}
		            	side={DoubleSide}
		            />
		        </mesh>


			</group>
			{ props.state.model.dial }
			<group ref={starGroupRef} position={[...props.state.model.scene.position]}>
				{

					starsGeometries.map((starGeometryOfCategory, i) => {
		
						return <points key={i} args={[starGeometryOfCategory, starsMaterials[i]]}/>
					}) 
				}
			</group>
			<group ref={skyGroupRef}>
		{/*		{

					skyGeometries.map((skyGeometryOfCategory, i) => <points key={i} args={[skyGeometryOfCategory, skyMaterials[i]]} />)
				}*/}
			</group>
			
		</>
	);
}

export default Scene;