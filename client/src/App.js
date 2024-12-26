import React, {
  useState,
  useEffect,
  useReducer,
  useRef
} from 'react';
import {
  Box3,
  Vector3
} from 'three';
import { useLoader } from '@react-three/fiber';
import CanvasContainer from './components/CanvasContainer';
import './styles/App.css';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { SPEED, MASS, cameraRadius, props } from './models/constants';

let __dispatch__ = '';


function sceneReducer(state, action) {
  __dispatch__ = action.type;
  switch (action.type) {
    case 'MODEL_LOADED':
      return {
        ...state,
        model: {
          loaded: true,
          ...action.model,
          ...state.model
        }
      }
    case 'START_WALK':
      return { 
        ...state,
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
          walking: true,
          speed: {
            ...state.model.speed,
            walk: SPEED.WALK
          }
        }
      }
    case 'START_WALK_BACK':
      return { 
        ...state,
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
        model: {
          ...state.model,
          strafe: 1,
          speed: {
            ...state.model.speed,
            strafe: SPEED.STRAFE
          }
        }
      }
    case 'STOP_STRAFE_RIGHT':
      return { 
        ...state,
        model: {
          ...state.model,
          strafe: 0,
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
          strafing: true,
          speed: {
            ...state.model.speed,
            strafe: SPEED.STRAFE
          }
        }
      }
    case 'START_STRAFE_LEFT':
      return { 
        ...state,
        model: {
          ...state.model,
          strafe: -1,
          speed: {
            ...state.model.speed,
            strafe: SPEED.STRAFE
          }
        }
      }
    case 'STOP_STRAFE_LEFT':
      return { 
        ...state,
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
          rotateLeft: true
        }
      }
    case 'START_ROTATE_RIGHT':
      return {
        ...state,
        model: {
          ...state.model,
          rotateRight: true
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
          rotateDown: true
        }
      }
    case 'START_ROTATE_UP':
      return {
        ...state,
        model: {
          ...state.model,
          rotateUp: true
        }
      }
    case 'STOP_ROTATE_UP':
      return {
        ...state,
        model: {
          ...state.model,
          rotateUp: true
        }
      }
    case 'STOP_ROTATE_DOWN':
      return {
        ...state,
        model: {
          ...state.model,
          rotateDown: true
        }
      }
    case 'START_JUMP':
      return {
        ...state,
        model: {
          ...state.model,
          jump: true,
          jump_velocity: SPEED.JUMP,
          gravity: SPEED.GRAVITY,
          weight: 0.5,
          jumpFloor: false
        }
      }
    case 'JUMP':
      return {
        ...state,
        model: {
          ...state.model,
          jump: true,
          jump_velocity: state.model.jump_velocity + state.model.weight * state.model.gravity
        }
      }
    case 'STOP_JUMP':
      return {
        ...state,
        model: {
          ...state.model,
          jump: false,
          jump_velocity: SPEED.JUMP
        }
      }
    default:
      return state;
  }
}


var done = {
  'START_WALK': false,
  'START_WALK_BACK': false
}


function scaleModelToHeight(model, desiredHeight) {
    const boundingBox = new Box3().setFromObject(model.scene);
    const size = new Vector3();
    boundingBox.getSize(size);

    const height = size.y; // Current height of the model
    const scaleFactor = desiredHeight / height; // Calculate scaling factor

    model.scene.scale.set(scaleFactor, scaleFactor, scaleFactor);

    const center = new Vector3();
    boundingBox.getCenter(center);
    model.scene.position.sub(center.setY(0)); 
}

function App() {

  const [ state, dispatch ] = useReducer(sceneReducer, props);
  const model = useLoader(GLTFLoader, '/Xbot.glb')
  
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
        dispatch({ type: 'START_ROTATE_LEFT' })
      }
      if (key == 'arrowright') {
        dispatch({ type: 'START_ROTATE_RIGHT' })
      }
      if (key == 'arrowup') {
        dispatch({ type: 'START_ROTATE_UP' })
      }
      if (key == 'arrowdown') {
        dispatch({ type: 'START_ROTATE_DOWN' })
      }
      if (key.trim() == '') {
        dispatch({ type: 'START_JUMP' })
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
        dispatch({ type: 'STOP_ROTATE_LEFT' })
      }
      if (key == 'arrowright') {
        dispatch({ type: 'STOP_ROTATE_RIGHT' })
      }
      if (key == 'arrowup') {
        dispatch({ type: 'STOP_ROTATE_UP' })
      }
      if (key == 'arrowdown') {
        dispatch({ type: 'STOP_ROTATE_DOWN' })
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
  useEffect(() => {}, [done])

  if (!state.model.scene) {
    return <div className="App"></div>
  }

  return (
    <div className="App">
      <div id="stats">
        <div>
          <ul>
            <li><div>Planet:</div>
              <section>
                <i>position: </i>
                <span className="number">{new Number(state.planet.position[0]).toFixed(2)}</span>,
                <span className="number">{new Number(state.planet.position[1]).toFixed(2)}</span>,
                <span className="number">{new Number(state.planet.position[2]).toFixed(2)}</span>
                <br/>
                <i>radius: <strong>{MASS.planet.radius}</strong></i>
              </section>
            </li>
            <li><div>Model:</div>
              <section>
                <i>position: </i>
                <span className="number">{new Number(state.model.scene.position.x).toFixed(2)}</span>, 
                <span className="number">{new Number(state.model.scene.position.y).toFixed(2)}</span>, 
                <span className="number">{new Number(state.model.scene.position.z).toFixed(2)}</span>
              
                <br/>
                
                <i>rotation: </i>
                <span className="number">{new Number(state.model.scene.rotation._x).toFixed(2)}</span>, 
                <span className="number">{new Number(state.model.scene.rotation._y).toFixed(2)}</span>, 
                <span className="number">{new Number(state.model.scene.rotation._z).toFixed(2)}</span>
              </section>
            </li>
            <li>walking...<span className="boolean">{new String(state.model.walk)}</span></li>
          </ul>
        </div>
        <div>
          <article>
            <h3>{__dispatch__}</h3>
          </article>
          <article>
            <ul>  
              <li><i>strafing: </i>{state.model.strafe}</li>
            </ul> 
          </article>
        </div>
      </div>
      <CanvasContainer 
        state={state}
        dispatch={dispatch} />
    </div>
  );
}

export default App;
