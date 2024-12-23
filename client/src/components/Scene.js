import React, { useRef, useEffect, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import ModelViewer from './ModelViewer';
import Planet from './Planet';

function Scene(props) {
	
	const modelRef = useRef();
	const { camera } = useThree()
	const [keys, setKeys] = useState({ w: false, s: false, a: false, d: false });
	const speed = 0.05;
	const rotationSpeed = 0.03;
	const maxTilt = 0.2; // Maximum tilt angle in radians

	function move(obj, which) {
		obj.position.z += Math.cos(obj.rotation.y) * speed;
		obj.position.x -= Math.sin(obj.rotation.y) * speed;
	}

	function moveBackward(obj) {
		obj.position.z -= Math.cos(obj.rotation.y) * speed;
		obj.position.x += Math.sin(obj.rotation.y) * speed;
	}

	var addEvents = () => {
		const handleKeyDown = (e) => {
			if (e.key.toLowerCase() == 'w') {
				props.dispatch({ type: 'START_RUN', 
					payload: {
						model: {
							...props.state.model,
							run: true,
							speed: 1
						}
					}
				})
			}
			setKeys((prevKeys) => ({ ...prevKeys, [e.key.toLowerCase()]: true }));
		};

		const handleKeyUp = (e) => {
			if (e.key.toLowerCase() == 'w') {
				props.dispatch({ type: 'STOP_RUN', 
					payload: {
						model: {
							...props.state.model,
							run: false,
							speed: 0.5
						}
					}
				})
			}
			setKeys((prevKeys) => ({ ...prevKeys, [e.key.toLowerCase()]: false }));
		};

		window.addEventListener('keydown', handleKeyDown);
		window.addEventListener('keyup', handleKeyUp);

		return () => {
			window.removeEventListener('keydown', handleKeyDown);
			window.removeEventListener('keyup', handleKeyUp);
		};
	}

	useEffect(addEvents, []);

	var controlModel = () => {
		if (!modelRef.current) return;

		if (keys.w) {
			modelRef.current.position.z += Math.cos(modelRef.current.rotation.y) * speed;
			camera.position.z -= Math.cos(camera.rotation.y) * speed;

			props.dispatch({ type: 'START_RUN',
				payload: {
					model: {
						...props.state.model,
						run: true,
						speed: 1
					}
				}
			})
		} else if (keys.s) {
			modelRef.current.position.z -= Math.cos(modelRef.current.rotation.y) * speed;
			camera.position.z += Math.cos(camera.rotation.y) * speed;
		}

		if (keys.a) {
			modelRef.current.position.x += Math.cos(modelRef.current.rotation.y) * speed;
			camera.position.x -= Math.cos(camera.rotation.y) * speed;
		}
		if (keys.d) {
			modelRef.current.position.x -= Math.cos(modelRef.current.rotation.y) * speed;
			camera.position.x += Math.cos(camera.rotation.y) * speed;
		
		}
	}

	useFrame(controlModel);

	

	const model = <ModelViewer state={props.state} dispatch={props.dispatch} ref={modelRef} position={[0, -1.5, 2]}/>



	return (
		<>

			{ model }

			<Planet position={[0, -1.5, 2]}/>
		</>
	);
}

export default Scene;