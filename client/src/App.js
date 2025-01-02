import React, {
  useState,
  useEffect,
  useReducer,
  useRef
} from 'react';
import {
  Box3,
  Vector3,
  Sphere,
  Quaternion,
  Color
} from 'three';
import { 
  useLoader, 
  useFrame, 
  useThree 
} from '@react-three/fiber';
import CanvasContainer from './components/CanvasContainer';
import './styles/App.css';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { SPEED, MASS, cameraRadius, props } from './models/constants';
import Planet from './components/Planet';
import { 
  coords, 
  child, 
  coordsToVector3,
  coordsToQuaternion,
  VisualizeQuaternion
} from './util';

let __dispatch__ = '';
let hidden = ['ENGAGE_INTERACTIONS']
Array.prototype.contains = function(str) {
  for (var i = 0 ;i < this.length; i++) {
    if (this[i] == str) {
      return true
    }
  }
  return false
}
function sceneReducer(state, action) {
  __dispatch__ = action.type;
  if (!hidden.contains(__dispatch__)) {
    state.interactions.add(JSON.stringify({
      dispatch: __dispatch__,
      date: new Date().getTime()
    }));
  }
  switch (action.type) {
    case 'MODEL_LOADED':
      action.model.scene.boundingBox = new Box3().setFromObject(action.model.scene);
      return {
        ...state,
        model: {
          height: action.model.scene.boundingBox.max.y - action.model.scene.boundingBox.min.y,
          dial: action.dial,
          scene: action.scene,
          loaded: true,
          ...action.model,
          ...state.model
        }
      }
    case 'START_WALK':
      return { 
        ...state,
        animations: [
          ...state.animations,
          'walk'
        ],
        model: {
          ...state.model,
          walk: true,
          walking: false,
          speed: {
            ...state.model.speed,
            walk: SPEED.WALK
          }
        }
      }
    case 'STOP_WALK':
      return { 
        ...state,
        animations: state.animations.filter((animation)=>{
          return animation !== 'walk';
        }),
        model: {
          ...state.model,
          walk: false,
          walking: false,
           speed: {
            ...state.model.speed,
            walk: 0
          }
        }
      }
    case 'WALK':
      return {
        ...state,
        model: {
          ...state.model,
          walk: true,
          walking: true
        }
      }
    case 'START_WALK_BACK':
      return { 
        ...state,
        animations: [
          ...state.animations,
          'walk'
        ],
        model: {
          ...state.model,
          walk: true,
          speed: {
            ...state.model.speed,
            walk: -SPEED.WALK
          }
        }
      }
    case 'STOP_WALK_BACK':
      return { 
        ...state,
        animations: state.animations.filter((animation)=>{
          return animation !== 'walk';
        }),
        model: {
          ...state.model,
          walk: false,
          speed: {
            ...state.model.speed,
            walk: 0
          }
        }
      }
    case 'START_STRAFE_RIGHT':
      return { 
        ...state,
        animations: [
          ...state.animations,
          'strafe'
        ],
        model: {
          ...state.model,
          strafe: true,
          speed: {
            ...state.model.speed,
            strafe:SPEED.STRAFE
          }
        }
      }
    case 'STOP_STRAFE_RIGHT':
      return { 
        ...state,
        animations: state.animations.filter((animation)=>{
          return animation !== 'strafe';
        }),
        model: {
          ...state.model,
          strafe: false,
          strafing: false,
          speed: {
            ...state.model.speed,
            strafe: 0
          }
        }
      }
    case 'STRAFE':
      return {
        ...state,
        model: {
          ...state.model,
          strafing: true
        }
      }
    case 'START_STRAFE_LEFT':
      return { 
        ...state,
        animations: [
          ...state.animations,
          'strafe'
        ],
        model: {
          ...state.model,
          strafe: true,
          speed: {
            ...state.model.speed,
            strafe: -SPEED.STRAFE
          }
        }
      }
    case 'STOP_STRAFE_LEFT':
      return { 
        ...state,
        animations: state.animations.filter((animation)=>{
          return animation !== 'strafe';
        }),
        model: {
          ...state.model,
          strafe: false,
          strafing: false,
          speed: {
            ...state.model.speed,
            strafe: 0
          }
        }
      }
    case 'START_ROTATE_LEFT':
      return {
        ...state,
        model: {
          ...state.model,
          rotateLeft: true,
          speed: {
            ...state.model.speed,
            rotate: -SPEED.ROTATE
          }
        }
      }
    case 'START_ROTATE_RIGHT':
      return {
        ...state,
        model: {
          ...state.model,
          rotateRight: true,
          speed: {
            ...state.model.speed,
            rotate: SPEED.ROTATE
          }
        }
      }
    case 'ROTATE_LEFT':
      var rotationIncrement = action.state.model.rotationIncrement;
      rotationIncrement += 0.1;
      if (rotationIncrement > Math.PI * 2) {
        rotationIncrement = 0;
      }
      return {
        ...state,
        model: {
          ...state.model,
          rotationIncrement
        }
      }
    case 'ROTATE_RIGHT':
      var rotationIncrement = action.state.model.rotationIncrement;
      rotationIncrement -= 0.1;
      if (rotationIncrement < 0) {
        rotationIncrement = Math.PI * 2
      }
      return {
        ...state,
        model: {
          ...state.model,
          rotationIncrement
        }
      }
    case 'STOP_ROTATE_LEFT':
      return {
        ...state,
        model: {
          ...state.model,
          rotateLeft: false,
        }
      }
    case 'STOP_ROTATE_RIGHT':
      return {
        ...state,
        model: {
          ...state.model,
          rotateRight: false
        }
      }
    case 'START_ROTATE_DOWN':
      return {
        ...state,
        model: {
          ...state.model,
          rotateDown: true,
          rotatingDown: true
        }
      }
    case 'ROTATE_DOWN':
      var cameraTheta = action.state.cameraTheta;
      cameraTheta += 0.05;
      if (cameraTheta >= Math.PI * 2) {
        cameraTheta = Math.PI * 2
      }
      return {
        ...state,
        cameraTheta
      }
    case 'START_ROTATE_UP':
      return {
        ...state,
        model: {
          ...state.model,
          rotateUp: true,
          rotatingUp: true
        }
      }
    case 'ROTATE_UP':
      var cameraTheta = action.state.cameraTheta;
      cameraTheta -= 0.05;
      if (cameraTheta <= 0) {
        cameraTheta = 0
      }
      return {
        ...state,
        cameraTheta
      }

      
    case 'STOP_ROTATE_UP':
      return {
        ...state,
        model: {
          ...state.model,
          rotateUp: false,
          rotatingUp: false
        }
      }
    case 'STOP_ROTATE_DOWN':
      return {
        ...state,
        model: {
          ...state.model,
          rotateDown: false,
          rotatingDown: false
        }
      }
    case 'START_JUMP':
      return {
        ...state,
        animations: [
          ...state.animations,
          'jump'
        ],
        model: {
          ...state.model,
          jump: true,
          jumping: false,
          lounge: false,
          velocity: {
            ...state.model.velocity,
            y: SPEED.JUMP
          },
          force: {
            ...state.model.force,
            y: SPEED.JUMP
          }
        }
      }
    case 'JUMP':
      const currentVelocityY = action.model.velocity.y;
      const currentForceY = state.model.force.y;

      // Reduce the upward force over time
      const decliningForceY = Math.max(0, currentForceY - SPEED.GRAVITY);

      // Calculate the new velocity with the declining force
      const newVelocityY = currentVelocityY + decliningForceY - SPEED.GRAVITY;

      return {
          ...state,
          model: {
              ...state.model,
              jumping: true,
              force: {
                  ...state.model.force,
                  y: decliningForceY 
              },
              velocity: {
                  ...state.model.velocity,
                  y: newVelocityY
              }
          }
      };

    case 'STOP_JUMP':
      return {
        ...state,
        animations: state.animations.filter((animation) => animation !== 'jump'),
        model: {
          ...state.model,
          jumping: false,
          lounge: true,
          velocity: {
              ...state.model.velocity,
              y: 0
          }
        }
      };
    case 'START_PLANET':
      return {
        ...state,
        planet: {
          ...state.planet,
          ...action.planet
        }
      }
    case 'ADD_PLANET':
      return {
        ...state,
        planet: {
          ...state.planet,
          planetElement: action.planetElement
        }
      }
    
    case 'ENGAGE_PLANET':
      return {
        ...state,
        planet: {
          ...state.planet,
          distanceTo: action.distanceTo
        }
      }
    case 'ADD_SCENE':
      return {
        ...state,
        scene: action.scene
      }
    case 'LOAD_STARS':
      return {
        ...state,
        stars: action.stars
      }
    case 'SET_PLANET_VERTICES':
      return {
        ...state,
        planet: {
          ...state.planet,
          vertices: action.vertices
        }
      };
    case 'ENGAGE_INTERACTIONS':
      return {
        ...state,
        interactions: new Set([...state.interactions].filter(interaction => {
          interaction = JSON.parse(interaction);
          var time = new Date().getTime();
          if (time - interaction.date > 1000) {
            return false;
          }
          return JSON.stringify(interaction);
        })),
        interaction: new Date().getTime(),
        planet: {
          ...state.planet,
          distanceTo: action.distanceTo
        }
      }
    case 'POP_ANIMATION':
      return {
        ...state,
        animations: state.animations.map(animation => {
          return animation !== action.animation
        })
      }
    
    default:
      return state;
  }
}


var done = {
  'START_WALK': false,
  'START_WALK_BACK': false
}


function App() {

  const [ state, dispatch ] = useReducer(sceneReducer, props);
  const model = useLoader(GLTFLoader, '/Xbot.glb');

  useEffect(() => {
    
    const dial = <mesh name="dial" position={state.planet.position}>
        <boxGeometry args={[
          .2,
          state.planet.radius * 2.05,
          .2,
          1
        ]} />
        <meshBasicMaterial transparent opacity={0.5} color="blue" />
      </mesh>
  console.log(model)
    model.scene.position.set(0, state.planet.radius, 0)
    dispatch({ type: 'MODEL_LOADED', model, dial })
  }, []);


  var addEvents = () => {
    const handleKeyDown = (e) => {
      const key = e.key.toLowerCase();
      if (key == 'w') {
        if (!done.START_WALK) {
          done.START_WALK = true;
          dispatch({ type: 'START_WALK' });
        }
      }
      if (key == 's') {
        if (!done.START_WALK_BACK) {
          done.START_WALK_BACK = true;
          dispatch({ type: 'START_WALK_BACK' });
        }
      }
      if (key == 'a') {
        if (!done.START_STRAFE_LEFT) {
          done.START_STRAFE_LEFT = true;
          dispatch({ type: 'START_STRAFE_LEFT' });
        }
      }
      if (key == 'd') {
        if (!done.START_STRAFE_RIGHT) {
          done.START_STRAFE_RIGHT = true;
          dispatch({ type: 'START_STRAFE_RIGHT' });
        }
      }
      if (key == 'arrowleft') {
        if (!done.START_ROTATE_LEFT) {
          done.START_ROTATE_LEFT = true;
          dispatch({ type: 'START_ROTATE_LEFT' })
        }
      }
      if (key == 'arrowright') {
        if (!done.START_ROTATE_RIGHT) {
          done.START_ROTATE_RIGHT = true;
          dispatch({ type: 'START_ROTATE_RIGHT' })
        }
      }
      if (key == 'arrowup') {
        if (!done.START_ROTATE_UP) {
          done.START_ROTATE_UP = true;
          dispatch({ type: 'START_ROTATE_UP' })
        }
      }
      if (key == 'arrowdown') {
        if (!done.START_ROTATE_DOWN) {
          done.ROTATE_DOWN = true;
          dispatch({ type: 'START_ROTATE_DOWN' })
        }
      }
      if (key.trim() == '') {
        if (!done.START_JUMP) {
          done.START_JUMP = true;
          dispatch({ type: 'START_JUMP' })
        }
      }
      if (key == 'enter') {
        dispatch({ type: 'MODEL_LOADED', model })
      }
    };

    const handleKeyUp = (e) => {
      const key = e.key.toLowerCase();

      if (key == 'w') {
        done.START_WALK = false;
        dispatch({ type: 'STOP_WALK' })
      }
      if (key == 's') {
        done.START_WALK_BACK = false;
        dispatch({ type: 'STOP_WALK_BACK' })
      }
      if (key == 'a') {
        done.START_STRAFE_LEFT = false;
        dispatch({ type: 'STOP_STRAFE_LEFT' })
      }
      if (key == 'd') {
        done.START_STRAFE_RIGHT = false;
        dispatch({ type: 'STOP_STRAFE_RIGHT' })
      }
      if (key == 'arrowleft') {
        done.START_ROTATE_LEFT = false;
        dispatch({ type: 'STOP_ROTATE_LEFT' })
      }
      if (key == 'arrowright') {
        done.START_ROTATE_RIGHT = false;
        dispatch({ type: 'STOP_ROTATE_RIGHT' })
      }
      if (key == 'arrowup') {
        done.START_ROTATE_UP = false;
        dispatch({ type: 'STOP_ROTATE_UP' })
      }
      if (key == 'arrowdown') {
        done.START_ROTATE_DOWN = false;
        dispatch({ type: 'STOP_ROTATE_DOWN' })
      }
      if (key.trim() == '') {
        done.START_JUMP = false;
        dispatch({ type: 'STOP_JUMP' })
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }

  useEffect(addEvents, []);
  useEffect(() => {}, [done, state.interactions])

  if (!state.model.scene) {
    return <div className="App"></div>
  }

  const planetCenter = new Vector3(...state.planet.position);
  const coordinates = coords(state.model.scene);

  const q = VisualizeQuaternion(state.model.scene.quaternion, 1, .3);


  return (
    <div className="App">
      <div id="stats">
        <div>
          <ul>
            <li><div>Planet:</div>
              <section>
                <i>position: </i>
                <span className="number">{new Number(state.planet.position[0]).toFixed(2)},</span>
                <span className="number">{new Number(state.planet.position[1]).toFixed(2)},</span>
                <span className="number">{new Number(state.planet.position[2]).toFixed(2)}</span>
                <br/>
                <i>radius: <strong>{MASS.planet.radius}</strong></i>
              </section>
            </li>
            <li><div>Model:</div>
              <section>
                <i>position: </i>
                <span className="number">{new Number(state.model.scene.position.x).toFixed(2)},</span> 
                <span className="number">{new Number(state.model.scene.position.y).toFixed(2)},</span> 
                <span className="number">{new Number(state.model.scene.position.z).toFixed(2)}</span>
              
                <br/>
                
                <i>velocity: </i>
                <span className="number">{new Number(state.model.velocity.x).toFixed(2)},</span> 
                <span className="number">{new Number(state.model.velocity.y).toFixed(2)},</span> 
                <span className="number">{new Number(state.model.velocity.z).toFixed(2)}</span>

                <br />

                <i>quaternion: </i>
                <span className="number">{new Number(q.quaternion.w).toFixed(2)},</span> 
                <span className="number">{new Number(q.quaternion.x).toFixed(2)},</span> 
                <span className="number">{new Number(q.quaternion.y).toFixed(2)},</span> 
                <span className="number">{new Number(q.quaternion.z).toFixed(2)}</span>


              </section>
            </li>
            <li>camera theta...<span className="number">{state.cameraTheta}</span></li>
            <li>walking...<span className="boolean">{new String(state.model.walking)}</span></li>
            <li>strafing...<span className="boolean">{new String(state.model.strafing)}</span></li>
            <li>jumping...<span className="boolean">{new String(state.model.jumping)}</span></li>
            <li>
              gravity distance {state.planet.distanceTo}
            </li>
            { (state.model.scene && state.planet.position) ?
              <li>
                <i>(radial distance, polar angle, azimuthal angle)</i><br/>
                (<span className="number">{new Number(coordinates.radialDistance).toFixed(3)},</span>
                  <span className="number">{new Number(coordinates.polarAngle).toFixed(3)},</span>
                  <span className="number">{new Number(coordinates.azimuthalAngle).toFixed(3)}</span>)
              </li> : null
            }
           {/* <li>
              <i>DISPATCHES</i>
              <ol id="interactions">
                {
                  Array.from(new Set(Array.from(state.interactions).map(interaction => {
                    var i = JSON.parse(interaction);
                    delete i.date;
                    return JSON.stringify(i);
                  }))).sort().map((interaction, i) => {
                    return <li key={i}>{interaction}</li>
                  })
                }
              </ol>
            </li>*/}

            <li>
              <i>animations</i>
              <ol id="interactions">
                {
                  state.animations.map((animation, i) => {
                    return <li key={i}>{animation}</li>
                  })
                }
              </ol>
            </li>
            
          </ul>
        </div>
      </div>
      <CanvasContainer 
        state={state}
        dispatch={dispatch} />
    </div>
  );
}

export default App;
