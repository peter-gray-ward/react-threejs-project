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
		]
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
	camera.near = 0.1;
	camera.far = Infinity

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
	
	const starsGeometries = useMemo(() => {
		var _starGeometries = []
		for (var i = 0; i < RECORD.star.categories; i++) {
			props.dispatch({ type: 'ADD_SCENE', scene })

			var starsGeometry = new BufferGeometry()
			
			var positions = []
			var colors = []
			var stars = [];
			var startCount = 100000
			var minRadius = props.state.planet.radius * 2;
			var planetCenter = new Vector3(...props.state.planet.position);
			for (var j = 0; j < startCount; j++) {
				const phi = 2 * Math.PI * Math.random(); // Azimuthal angle
				const costheta = 2 * Math.random() - 1; // cos(theta) for polar angle
				const theta = Math.acos(costheta);
				const radius = minRadius * Math.random() * 20; // Add variation to radius

				const x = planetCenter.x + radius * Math.sin(theta) * Math.cos(phi);
				const y = planetCenter.y + radius * Math.sin(theta) * Math.sin(phi);
				const z = planetCenter.z + radius * Math.cos(theta);
				positions.push(x, y, z);

				var r = 1.7 + Math.random() * (1 - 1.87)
				var g = 1.7 + Math.random() * (1 - 1.87)
				var b = 1.7 + Math.random() * (1 - 1.87)

				colors.push(r, g, b);
			}
			starsGeometry.setAttribute('color', new Float32BufferAttribute(colors, 3));
			starsGeometry.setAttribute('position', new Float32BufferAttribute(positions, 3));
			_starGeometries.push(starsGeometry);
		}
		return _starGeometries;
		return ;
	}, [scene]);



	const manageInteractions = () => {
	}



  	useFrame(manageInteractions, [
  		props.state.model,
  		props.state.planet
  	]);


	return (
		<>
			<ModelViewer camera={camera} {...props} />
			<Planet {...props} />
			{ props.state.model.dial }
			<group>
				{
					starsGeometries.map((starGeometry, i) => {
						return <points key={i} args={[starGeometry, starsMaterials[i]]} />
					})
				}
			</group>
			<mesh position={[...props.state.planet.position]} rotation={[Math.PI / 2, 0, 0]}>
				<planeGeometry args={[props.state.planet.radius * 2.2, props.state.planet.radius * 2.2, 50, 50]} />
				<meshBasicMaterial transparent side={DoubleSide} opacity={0.5} color="red" />
			</mesh>
		</>
	);
}

export default Scene;