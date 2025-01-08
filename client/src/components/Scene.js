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

var RECORD = {
	star: {
		categories: 11,
		sizes: [
			0.01, 0.1, 0.2, 1.3, 0.5, 0.7, 0.77, 0.85, 1.23, 1.5, 2, 1
		].map(n => n * 100.1)
	},
	terrain: {
		categories: 11,
		sizes: [
			0.01, 0.1, 0.2, 1.3, 0.5, 0.7, 0.77, 0.85, 1.23, 1.5, 2, 1
		]
	},
	sky: {
		categories: 11,
		size: 1000,
		panelCount: 11
	}
}

function Scene(props) {
	const { camera, scene } = useThree();
	const starGroupRef = useRef();
	const skyGroupRef = useRef();
	const randomStarSeeds = useMemo(() => {
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
	camera.far = 1000000
	camera.updateProjectionMatrix();

	const starsMaterials = useMemo(() => {
		var materials = []
		for (var i = 0; i < RECORD.star.categories; i++) {
			materials.push(new PointsMaterial({ 
				vertexColors: true,
				size: RECORD.star.sizes[i]
			}));
		}
		materials.push(new PointsMaterial({ 
			vertexColors: true,
			size: RECORD.star.sizes[i] * 50
		}));
		return materials;
	}, []);
	
	var starsGeometries = useMemo(() => {
		var _starGeometries = []
		console.log("randomSeed", randomStarSeeds[0])
		for (var i = 0; i < RECORD.star.categories; i++) {
			props.dispatch({ type: 'ADD_SCENE', scene })

			var starsGeometry = new BufferGeometry()		
			var positions = []
			var colors = []
			var startCount = 500
			var minRadius = 50000; // Minimum radius
			var maxRadius = 100000; // Maximum radius

			var userCenter = new Vector3(...props.state.model.scene.position);
			for (var j = 0; j < startCount; j++) {
				const phi = randomInRange(0, Math.PI * 2, randomStarSeeds[j + j * i]) // Azimuthal angle from 0 to 2π
				const theta = randomInRange(0, Math.PI, randomStarSeeds[j + j * i + 1]); // Calculate theta from costheta
				const radius = minRadius//minRadius + Math.random() * (maxRadius - minRadius); // Random radius between minRadius and maxRadius

				const x = radius * Math.sin(theta) * Math.cos(phi);
				const y = radius * Math.sin(theta) * Math.sin(phi);
				const z = radius * Math.cos(theta);

				positions.push(x, y, z);

				var r = 1//Math.random() * (1 - 1.87);
				var g = 1//Math.random() * (1 - 1.87);
				var b = 1//Math.random() * (1 - 1.87);

				colors.push(r, g, b);
			}


			starsGeometry.setAttribute('color', new Float32BufferAttribute(colors, 3));
			starsGeometry.setAttribute('position', new Float32BufferAttribute(positions, 3));

			_starGeometries.push(starsGeometry);
		}

		var sunGeometry = new BufferGeometry();
		var sunPhi = Math.PI / 2;
		var sunTheta = Math.PI / 2;
		const sunRadius = 50000;
		const sunX = sunRadius * Math.sin(sunTheta) * Math.cos(sunPhi);
		const sunY = sunRadius * Math.sin(sunTheta) * Math.sin(sunPhi);
		const sunZ = sunRadius * Math.cos(sunTheta);
		sunGeometry.setAttribute('color', new Float32BufferAttribute([1,1,1], 3));
		sunGeometry.setAttribute('position', new Float32BufferAttribute([sunX, sunY, sunZ], 3));
		_starGeometries.push(sunGeometry);

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

		for (var i = 0; i < RECORD.sky.categories; i++) {
			var skyGeometry = new BufferGeometry();
			var positions = [];
			var colors = [];

			for (var j = 0; j < RECORD.sky.panelCount; j++) {
				const phi = randomInRange(Math.PI, Math.PI * 2, randomSkySeeds[j + j * i]);
				const theta = randomInRange(Math.PI, Math.PI * 2, randomSkySeeds[j + j * i + 1]);
				const radius = 50000 - 11;
				var x = props.state.model.scene.position.x + radius * Math.sin(theta) * Math.cos(phi);
				const y = props.state.model.scene.position.y + radius * Math.sin(theta) * Math.sin(phi);
				const z = props.state.model.scene.position.z + radius * Math.cos(theta);

				positions.push(x, y, z);

				var r = randomInRange(0, .25);
				var g = randomInRange(0, .85);
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
	        if (starGroupRef.current.rotation.x > Math.PI * 2) {
	            starGroupRef.current.rotation.x -= Math.PI * 2;
	        }
	    }
	});


	
	return (
		<>
			<ModelViewer camera={camera} {...props} />
			<Planet {...props} />
			{ props.state.model.dial }
			<group ref={starGroupRef} position={[...props.state.model.scene.position]}>
				{

					starsGeometries.map((starGeometryOfCategory, i) => <points key={i} args={[starGeometryOfCategory, starsMaterials[i]]} />)
				}
			</group>

		{/*	<group ref={skyGroupRef}>
				{

					skyGeometries.map((skyGeometryOfCategory, i) => <points key={i} args={[skyGeometryOfCategory, skyMaterials[i]]} />)
				}
			</group>*/}
			
			{/* <mesh position={[...props.state.planet.position]} rotation={[Math.PI / 2, 0, 0]}>
				<planeGeometry args={[props.state.planet.radius * 2.2, props.state.planet.radius * 2.2, 50, 50]} />
				<meshBasicMaterial transparent side={DoubleSide} opacity={0.5} color="red" />
			</mesh> */}
		</>
	);
}

export default Scene;