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
	}
}

function Scene(props) {
	const { camera, scene } = useThree();
	const starGroupRef = useRef();
	const randomStarSeeds = useMemo(() => {
		return Array.from({ length: RECORD.star.categories * 1000 })
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
				const phi = randomInRange(Math.PI, Math.PI * 2, randomStarSeeds[j + j * i]) // Azimuthal angle from 0 to 2π
				const theta = randomInRange(Math.PI, Math.PI * 2, randomStarSeeds[j + j * i + 1]); // Calculate theta from costheta
				const radius = minRadius//minRadius + Math.random() * (maxRadius - minRadius); // Random radius between minRadius and maxRadius

				const x = userCenter.x + radius * Math.sin(theta) * Math.cos(phi);
				const y = userCenter.y + radius * Math.sin(theta) * Math.sin(phi);
				const z = userCenter.z + radius * Math.cos(theta);

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
		return _starGeometries;
		return ;
	}, [props.state.model.change.x,props.state.model.change.y,props.state.model.change.z]);

	useFrame(() => {
		if (false && starGroupRef.current) {
			starGroupRef.current.children.forEach((points) => {
				const geometry = points.geometry;
				const positionArray = geometry.attributes.position.array;
	
				for (let i = 0; i < positionArray.length; i += 3) {
					positionArray[i] += props.state.model.change.x;   // Update X
					// positionArray[i + 1] += props.state.model.change.y; // Update Y
					positionArray[i + 2] += props.state.model.change.z; // Update Z
				}
	
				geometry.attributes.position.needsUpdate = true; // Notify Three.js of changes
			});
		}
	});
	
	
	return (
		<>
			<ModelViewer camera={camera} {...props} />
			<Planet {...props} />
			{ props.state.model.dial }
			<group ref={starGroupRef}>
				{
					starsGeometries.map((starGeometry, i) => {
						for (let i = 0; i <  starGeometry.attributes.position.array.length; i += 3) {
							starGeometry.attributes.position.array[i] += props.state.model.change.x; 
							starGeometry.attributes.position.array[i + 1] += props.state.model.change.y;
							starGeometry.attributes.position.array[i + 2] += props.state.model.change.z;
					   	}
						return <points key={i} args={[starGeometry, starsMaterials[i]]} />
					})
				}
			</group>
			{/* <mesh position={[...props.state.planet.position]} rotation={[Math.PI / 2, 0, 0]}>
				<planeGeometry args={[props.state.planet.radius * 2.2, props.state.planet.radius * 2.2, 50, 50]} />
				<meshBasicMaterial transparent side={DoubleSide} opacity={0.5} color="red" />
			</mesh> */}
		</>
	);
}

export default Scene;