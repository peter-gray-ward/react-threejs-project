import React, { useCallback, forwardRef, useEffect, useRef, useMemo, useState } from 'react';
import { useThree, useLoader, useFrame, Canvas } from '@react-three/fiber';
import {
  AnimationMixer,
  Vector3,
  Box3,
  LoopRepeat,
  Quaternion,
  Sphere,
  MeshBasicMaterial,
  Matrix4
} from 'three'
import { SPEED } from '../models/constants'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader';
import { 
    coordsToQuaternion,
    coords,
    VisualizeQuaternion,
    findRayIntersection,
    pointOnSphere,
    randomInRange
} from '../util';

Array.prototype.contains = function(str) {
    for (var i = 0; i < this.length; i++) {
        if (this[i] == str) {
            return true;
        }
    }
    return false;
}

function computeSceneStats(scene) {
  let stats = {
    counts: {
      meshes: 0,
      vertices: 0,
      triangles: 0,
      instancedMeshes: 0,
      instances: 0,
    }
  };

  scene.traverse(object => {
      if (!object.visible || !object.isMesh) return;

      stats.counts.meshes++;

      const geometry = object.geometry;
      if (!geometry) return;

      const vertexCount = geometry.attributes.position
        ? geometry.attributes.position.count
        : 0;
      const triangleCount = geometry.index
        ? geometry.index.count / 3
        : vertexCount / 3;

      if (object.isInstancedMesh) {
        stats.counts.instancedMeshes++;
        stats.counts.instances += object.count;
        stats.counts.vertices += vertexCount * object.count;
        stats.counts.triangles += triangleCount * object.count;
      } else {
        stats.counts.vertices += vertexCount;
        stats.counts.triangles += triangleCount;
      }
    });


  return stats;
}


function ModelViewer(props) {
    const animations = useMemo(() => (['run', 'walk', 'strafe', 'lounge', 'jump']), [])
    const { camera, scene } = useThree();
    const [actions, setActions] = useState({});
    const [floorDistances, setFloorDistances] = useState({})
    const sphereRef = useRef()
    const mixerRef = useRef(null);
    
    useEffect(() => {

        if (props.state.model?.scene) {
            mixerRef.current = new AnimationMixer(props.state.model.scene);
        }

        let count = 0;
        // todo
        props.dispatch({ type: 'COUNT_VERTICES', stats: computeSceneStats(scene) })

        return () => {
            // Clean up mixer on unmount
            mixerRef.current?.stopAllAction();
            mixerRef.current = null;
        };
    }, []);
    
    const planetCenter = useMemo(() => {
        return new Vector3(0, 0, 0)
    }, [])

    const animationTimers = useMemo(() => {
        var r = {
            walk: new Date().getTime()
        }
        for (let animation of animations) {
            if (!r[animation]) r[animation] = new Date().getTime()
        }
        return r
    }, []);
    const animationSounds = useMemo(() => {
        var r = {
            walk: props.walkingInGrassAudio,
            run: props.walkingInGrassAudio,
            strafe: props.walkingInGrassAudio
        }
        for (let animation of animations) {
            if (!r[animation]) r[animation] = { play: () => {} }
        }
        return r
    }, [props.walkingInGrassAudio]);


    const startAnimation = useCallback((which) => {
        if (!mixerRef.current) return null;

        let animationIndex;
        let speedFactor = 0.5;

        switch (which) {
            case 'run':
                animationIndex = 3;
                break;
            case 'walk':
                animationIndex = 6;
                speedFactor = props.state.model.run ? 0.1 : 0.8;
                break;
            case 'strafe':
                animationIndex = 6
                break;
            case 'lounge':
                animationIndex = 1;
                speedFactor = 0.00;
                break;
            case 'jump':
                animationIndex = 5;
                speedFactor = 0.2;
                break;
            default:
                return null;
        }

        const action = mixerRef.current.clipAction(props.state.model.animations[animationIndex]);
        action.reset().play();
        action.setEffectiveTimeScale(speedFactor); // Set the speed factor for the animation

        return action;
    }, [props.walkingInGrassAudio]);

    useFrame(() => {
        const actionAnimations = { ...actions };
        const now = new Date().getTime();
        var playWalkSound = false;

        animations.forEach((action) => {
            const actionLengthMs = 300
            if (props.state.model[action] && !actionAnimations[action]) {
                for (var animation in actionAnimations) {
                    actionAnimations[animation].stop();
                }
                actionAnimations[action] = startAnimation(action);
                playWalkSound = true;
                animationTimers[action] = new Date().getTime();
            } else if (!props.state.model[action] && actionAnimations[action]) {
                actionAnimations[action].stop();
                delete actionAnimations[action];
                if (Object.keys(actionAnimations).length) {
                    const lastActionName = Object.keys(actionAnimations)[Object.keys(actionAnimations).length - 1];
                    actionAnimations[lastActionName] = startAnimation(lastActionName);
                }
            }
        });

        setActions(actionAnimations);

        props.dispatch({ type: 'FIRST_PERSON_ANIMATE' });
        

        mixerRef.current?.update(props.state.deltaTime || 0.016); // Assuming a default frame time of ~16ms






        // document.getElementById('stats').innerHTML = now - animationTimers.walk + ' vs ' + animationTimers.walk
        // +  `<table>
        //     <h1>play walk Sound: ${playWalkSound}</h1>
        //     <tr>
        //         <th>now</th>
        //         <th>walk</th>
        //         <th>now - walk</th>
        //     </tr>
        //     <tr>
        //         <td>${now}</td>
        //         <td>${animationTimers.walk}</td>
        //         <th>${now - animationTimers.walk}</th>
        //     </tr>
        // </table>`    
    });

    useFrame((state, delta) => {
        if (mixerRef && mixerRef.current) {
            mixerRef.current.update(delta);
        }

        if (!props.state.model) return;

        const { model, planet } = props.state;
        if (!model || !planet) return;


        const currentPosition = props.state.model.scene.position.clone();
        const sphereCenter = new Vector3(...planet.position);
        const sphereRadius = planet.radius;
        const distanceToCenter = props.state.model.scene.position.distanceTo(sphereCenter);
        var TOCENTER = props.state.model.scene.position.clone().sub(sphereCenter).normalize();

        // apply gravity
        const gravity = props.state.model.gravity;
        const targetPosition = TOCENTER.multiplyScalar(sphereRadius).add(sphereCenter);


        // if (!currentPosition.equals(targetPosition)) {
        const stepDirection = targetPosition.clone().sub(currentPosition).normalize();
        const step = stepDirection.multiplyScalar(
            props.state.model.jump || props.state.model.jumping
             ? Math.abs(gravity) * props.state.model.velocity.y 
             : 0
        );

        if (props.state.model.jump) {
            props.state.model.jump = false;
            props.dispatch({ type: 'MODEL_LOADED', model: props.state.model })
        }

        // Update the position by the step or clamp to the target position
        const newPosition = currentPosition.clone().add(step);
        const distanceToTarget = newPosition.distanceTo(targetPosition);

        props.state.model.scene.position.copy(newPosition);

        // Handle strafing
        var forwardDirection = props.state.model.scene.getWorldDirection(new Vector3()).normalize();
        const localUp = TOCENTER.clone().normalize(); // Up is the radial vector
        const localRight = new Vector3().crossVectors(localUp, forwardDirection).normalize();


        if (props.state.model.strafe || props.keys.contains('strafe')) {
            localRight.multiplyScalar(props.state.model.speed.strafe);
            props.state.model.scene.position.add(localRight.negate());
            props.dispatch({ type: "STRAFE" })
        }

        // Handle walking
        if (props.state.model.run) {
            forwardDirection.multiplyScalar(props.state.model.speed.run);
            props.state.model.scene.position.add(forwardDirection);
            
            props.dispatch({ type: "WALK" })
        } else if (props.keys.contains('walk')) {
            var speed = props.state.model.speed.walk
            if (props.state.model.walkSlow) {
                speed *= 0.23
            }
            forwardDirection.multiplyScalar(speed);
            props.state.model.scene.position.add(forwardDirection);
            
            props.dispatch({ type: "WALK" })

        }



        // Update position based on velocity and direction
        var jumpUp = localUp.multiplyScalar(props.state.model.velocity.y);
        let aboveTheFloor = false;
        props.state.model.scene.position.add(jumpUp);
        let waterFloor;
        let grassFloor;
        let velocity = 0;
        var minSurfaceDist = Infinity
        var triangleFloor = null

        if (props.state.planet.surfaceGeometry) {
            const userPosition = new Box3().setFromObject(props.state.model.scene)

            var userbox = new Box3().setFromObject(props.state.model.scene);
            
            props.state.planet.triangles
                .filter(t => t.a.distanceTo(props.state.model.scene.position) < 15)
                .forEach(triangle => {

                    var intersects = userbox.intersectsTriangle(triangle)
                    
                    if (intersects) {
                        triangleFloor = triangle.center;
                    }
                });

            var surfaceFloor = findRayIntersection(
                props.state.model.scene.position.clone(), 
                planetCenter, 
                props.state.planet.surfaceGeometry
            ); 

            if (triangleFloor) {
                if (props.state.model.scene.position) {
                    const dist = triangleFloor.distanceTo(props.state.model.scene.position);
                    props.state.model.intersectsSurface = dist;
                }
                props.state.model.floor = triangleFloor
                props.state.model.floor.type = 'surface'
                if (props.state.animations.contains("jump")) {
                    props.dispatch({ type: 'LOAD_MODEL', model: props.state.model })
                    props.dispatch({ type: 'STOP_JUMP '});
                }
            
                
            } else if (surfaceFloor) {
                if (props.state.model.scene.position) {
                    const dist = surfaceFloor.distanceTo(props.state.model.scene.position);
                    props.state.model.intersectsSurface = dist;
                }
                props.state.model.floor = surfaceFloor
                props.state.model.floor.type = 'surface'
                if (props.state.animations.contains("jump")) {
                    props.dispatch({ type: 'LOAD_MODEL', model: props.state.model })
                    props.dispatch({ type: 'STOP_JUMP '});
                }
            } 

            if (waterFloor) {
                props.state.model.floor = waterFloor
                props.state.model.floor.type = 'water'
                props.dispatch({ type: 'LOAD_MODEL', model: props.state.model })
            }

            
            // props.state.planet.lakeNodes.forEach(lakeNode => {
            //  // var xdiff = lakeNode.position.x - props.state.model.scene.position.x
            //  // var ydiff = lakeNode.position.x - props.state.model.scene.position.y
            //  // var zdiff = lakeNode.position.x - props.state.model.scene.position.z
            //  // if (Math.abs(xdiff + zdiff) < 9.5 && ydiff < 1) {
                    
            //  // }
            // });
                
        }

        var onGround = true;

        if (props.state.model.jump && !props.state.model.jumping) {
            velocity += SPEED.JUMP;
            props.state.model.scene.position.y += SPEED.JUMP;
            props.dispatch({ type: 'MODEL_LOADED', model: { 
                ...props.state.model,
                jumping: true 
            }});
            onGround = false
        }


        if (props.state.model.floor) { // is there gravity
            const distToCore = props.state.model.scene.position.distanceTo(planetCenter);
            aboveTheFloor = +distToCore.toFixed(8) > +props.state.model.floor.y.toFixed(8);
            
            if (aboveTheFloor) {
                velocity -= SPEED.GRAVITY;
                onGround = false
            } else {
                props.state.model.scene.position.copy(props.state.model.floor);
                // if (props.state.animations.contains("jump")) {
                //  props.dispatch({ type: 'STOP_JUMP' });
                // }
                velocity = 0;
            }
        }


        if (onGround) {
            const extended = (rot) => rot > 0.9;
            const rightLeg = scene.getObjectByName('mixamorigRightLeg');
            const leftLeg = scene.getObjectByName('mixamorigLeftLeg');
            const isJumping = props.state.model.jump || props.state.model.jumping;

            if (!isJumping && (extended(rightLeg.rotation.x) || extended(leftLeg.rotation.x))) {
                props.walkingInGrassAudio.volume = 0.33
                props.walkingInGrassAudio.play()
                console.log(props.state.model.jumping, 'playing')
            }
        }

        

       
        


        // Get the forward direction of the model
        forwardDirection = props.state.model.scene.getWorldDirection(new Vector3()).normalize();

        // Calculate the quaternion for the model's orientation
        const quaternion = coordsToQuaternion({
            ...coords(props.state.model.scene),
            initialVector: forwardDirection,
            planetCenter: new Vector3(...props.state.planet.position),
        });

        // Calculate the local Y-axis based on the model's quaternion
        const localYAxis = new Vector3(0, 1, 0).applyQuaternion(quaternion);

        // Handle rotation increments
        if (props.state.model.rotateLeft) {
            props.dispatch({ type: 'ROTATE_LEFT', state: props.state })
        }

        if (props.state.model.rotateRight) {
            props.dispatch({ type: 'ROTATE_RIGHT', state: props.state })
        }

        const incrementalRotation = new Quaternion().setFromAxisAngle(localYAxis, props.state.model.rotationIncrement);
        quaternion.premultiply(incrementalRotation);

        // Apply the quaternion to the model's scene
        props.state.model.scene.quaternion.copy(quaternion);

        // Calculate the camera's position
        let radius = props.state.cameraRadius; // Distance from the model
        let cameraTheta = props.state.cameraTheta; // Vertical angle
        const cameraPhi = props.state.cameraPhi || 0; // Horizontal angle

        if (props.state.model.rotatingUp) {
            props.dispatch({ type: 'ROTATE_UP', state: props.state });
        }

        if (props.state.model.rotatingDown) {
            props.dispatch({ type: 'ROTATE_DOWN', state: props.state });
        }

        // Smoothly approach a radius of 1.5 when cameraTheta < 5
        //cameraTheta = cameraTheta < 5 ? 5 : cameraTheta;
        radius = 0.5 + (radius - 0.5) * (cameraTheta / 5)


        // Compute position on the sphere in the y-up coordinate system
        const x = radius * Math.sin(cameraTheta) * Math.cos(cameraPhi); // Horizontal plane (x-axis)
        const z = radius * Math.sin(cameraTheta) * Math.sin(cameraPhi); // Horizontal plane (z-axis)
        const y = radius * Math.cos(cameraTheta);                      // Vertical motion (y-axis)

        let point = new Vector3(x, y, z);
        

        // Get the model's forward direction
        forwardDirection = props.state.model.scene.getWorldDirection(new Vector3());

        // Rotate the forwardDirection by Math.PI (180 degrees)
        const rotationQuaternion = new Quaternion();
        rotationQuaternion.setFromAxisAngle(new Vector3(0, 1, 0), Math.PI); // Rotate around the y-axis
        forwardDirection.applyQuaternion(rotationQuaternion);

        // Align the point to the rotated forward direction
        const defaultDirection = new Vector3(0, 0, -1); // Default forward direction (-z axis)
        const alignmentQuaternion = new Quaternion();
        alignmentQuaternion.setFromUnitVectors(defaultDirection, forwardDirection.clone().normalize());
        point.applyQuaternion(alignmentQuaternion);

        // Translate the point to the sphere's center (model's position)
        const center = props.state.model.scene.position.clone();
        point.add(center);
        point.y += props.state.firstPerson ? 10 : 10

        props.camera.position.copy(point);
        if (props.state.firstPerson) {
            props.camera.position.y += 0.65
        }

        // Define the look-at position based on the model's height and TOCENTER
        const lookPosition = props.state.model.scene.position.clone();
        const upDirection = TOCENTER.clone().normalize();
        lookPosition.add(upDirection.multiplyScalar(props.state.model.height * (
            props.state.firstPerson ? 1 : .75)));

        // Make the camera look at the adjusted position
        props.camera.lookAt(lookPosition);

        
        if (velocity && aboveTheFloor) {
            props.dispatch({ type: 'GRAVITY', model: props.state.model, velocity });
        }

    });

    const q = VisualizeQuaternion(props.state.model.scene.quaternion, 1, .3);



    return (<>
        <primitive object={props.state.model.scene} />

        <mesh ref={sphereRef} position={[
            props.state.cameraPoint.x,
            props.state.cameraPoint.y,
            props.state.cameraPoint.z
        ]}>
            <sphereGeometry args={[0.25, 10, 10]} />
            <meshStandardMaterial color="red" />
        </mesh> 

        {/* <group
            position={[
                props.state.model.scene.position.x,
                props.state.model.scene.position.y,
                props.state.model.scene.position.z
            ]}
        >
             <primitive object={q.group} />
        </group>

        */}
        {/*<mesh position={[
            props.state.model.scene.position.x,
            props.state.model.scene.position.y,
            props.state.model.scene.position.z
        ]}>
            <sphereGeometry args={[
                0.5,
                300,
                50
            ]} />
            <meshBasicMaterial wireframe color="lawngreen" />
        </mesh>*/}

    </>)
}

export default ModelViewer
