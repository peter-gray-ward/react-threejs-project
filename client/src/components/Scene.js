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
	Float32BufferAttribute
} from 'three'
import {
	pointOnSphere
} from '../util';

function Scene(props) {
	const { camera, scene } = useThree();
	camera.near = 0.1;
	camera.far = Infinity

	const starsMaterial = useMemo(() => {
		return new PointsMaterial({ 
			vertexColors: true,
			size: .05 + Math.random() * ((Math.random() * 2 + 1.2) - .05)
		});
	}, []);
	const starsGeometry = useMemo(() => {
		props.dispatch({ type: 'ADD_SCENE', scene })

		var starsGeometry = new BufferGeometry()
		
		var positions = []
		var colors = []
		var stars = [];
		var startCount = 3333
		var minRadius = props.state.planet.radius * 2;
		var planetCenter = new Vector3(...props.state.planet.position);
		for (var i = 0; i < startCount; i++) {
			var v = pointOnSphere(planetCenter, minRadius);
			positions.push(v.x, v.y, v.z);
			var r = 1.7 + Math.random() * (1 - 1.87)
			var g = 1.7 + Math.random() * (1 - 1.87)
			var b = 1.7 + Math.random() * (1 - 1.87)
			colors.push(r, g, b);
		}
		starsGeometry.setAttribute('color', new Float32BufferAttribute(colors, 3));
		starsGeometry.setAttribute('position', new Float32BufferAttribute(positions, 3));
		return starsGeometry;
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
			<points args={[starsGeometry, starsMaterial]} /> 
		</>
	);
}

export default Scene;