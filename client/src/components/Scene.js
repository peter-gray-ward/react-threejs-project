import React, { useRef, useEffect, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import ModelViewer from './ModelViewer';
import Planet from './Planet';
import { Vector3 } from 'three'

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
				props.dispatch({ type: 'START_WALK', 
					payload: {
						model: {
							...props.state.model,
							walk: true,
							speed: 1
						}
					}
				})

			}
      if (e.key.toLowerCase() == 's') {
        props.dispatch({ type: 'START_WALK_BACK', 
          payload: {
            model: {
              ...props.state.model,
              walk: true,
              speed: -1
            }
          }
        })
      }
      if (e.key.toLowerCase() == 'arrowleft') {
        props.dispatch({ type: 'START_ROTATE_LEFT' })
      }
      if (e.key.toLowerCase() == 'arrowright') {
        props.dispatch({ type: 'START_ROTATE_RIGHT' })
      }
      if (e.key.toLowerCase() == 'arrowup') {
        props.dispatch({ type: 'START_ROTATE_UP' })
      }
      if (e.key.toLowerCase() == 'arrowdown') {
        props.dispatch({ type: 'START_ROTATE_DOWN' })
      }
			setKeys((prevKeys) => ({ ...prevKeys, [e.key.toLowerCase()]: true }));
		};

		const handleKeyUp = (e) => {
			if (e.key.toLowerCase() == 'w') {
				props.dispatch({ type: 'STOP_WALK', 
					payload: {
						model: {
							...props.state.model,
							walk: false,
							speed: 0.5
						}
					}
				})
			}
      if (e.key.toLowerCase() == 's') {
        props.dispatch({ type: 'STOP_WALK_BACK', 
          payload: {
            model: {
              ...props.state.model,
              walk: false,
              speed: -1
            }
          }
        })
      }
      if (e.key.toLowerCase() == 'arrowleft') {
        props.dispatch({ type: 'STOP_ROTATE_LEFT' })
      }
      if (e.key.toLowerCase() == 'arrowright') {
        props.dispatch({ type: 'STOP_ROTATE_RIGHT' })
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

		if (keys.a || keys.w || keys.d || keys.s || keys.arrowleft || keys.arrowright) {
      const forwardDirection = modelRef.current.getWorldDirection(new Vector3())
      const rightDirection = new Vector3().crossVectors(
        forwardDirection,
        new Vector3(0, 1, 0)
      ).normalize();
      const movement = new Vector3();
      if (keys.a) {
        movement.add(rightDirection.multiplyScalar(-0.03));
      }
      if (keys.w) {
        movement.add(forwardDirection.multiplyScalar(props.state.model.position.speed));
      }
      if (keys.d) {
        movement.add(rightDirection.multiplyScalar(0.03));
      }
      if (keys.s) {
        movement.add(forwardDirection.multiplyScalar(props.state.model.position.speed));
      }
      modelRef.current.position.add(movement);

      if (keys.arrowleft) {
        modelRef.current.rotation.y += 0.05;
      }
      if (keys.arrowright) {
        modelRef.current.rotation.y += -0.05;
      }
    }

    var cameraOffset = new Vector3(0, 2, -3);
    var cameraPosition = new Vector3()
      .copy(modelRef.current.position)
      .add(cameraOffset.applyQuaternion(modelRef.current.quaternion))
    camera.position.copy(cameraPosition);
    var lookPosition = new Vector3()
      .copy(modelRef.current.position)
      .add(new Vector3(0, 2, 0))
    camera.lookAt(lookPosition)
	}

	useFrame(controlModel);

	

	const model = <ModelViewer camera={camera} state={props.state} dispatch={props.dispatch} ref={modelRef} />



	return (
		<>

			{ model }

			<Planet position={[0, -1.5, 2]}/>
		</>
	);
}

export default Scene;