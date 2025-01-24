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
  Color,
  Mesh
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
  VisualizeQuaternion,
  pointOnSphere,
  findRayIntersection
} from './util';

let __dispatch__ = '';

let hidden = []

Array.prototype.contains = function(str) {
  for (var i = 0 ;i < this.length; i++) {
    if (this[i] == str) {
      return true
    }
  }
  return false
}

Array.prototype.removeLast = function(str) {
  var removalIndex = -1;
  for (var i = this.length - 1; i > -1; --i) {
    if (this[i] == str) {
      removalIndex = i;
      break;
    }
  }
  if (removalIndex > -1) {
    this.splice(removalIndex, 1);
  }
}

var keyed = {
  'START_WALK': false,
  'START_WALK_BACK': false
}

var keys = [];


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
      var result = { 
        ...state,
        animations: Array.from(new Set([
          ...state.animations,
          'walk'
        ])),
        model: {
          ...state.model,
          walk: !action.shift,
          walking: false,
          run: action.shift
        }
      }
      if (action.shift) {
        result.model.speed.run = SPEED.WALK * 1.95
      } else {
        result.model.speed.walk = SPEED.WALK
      }
      return result
    case 'STOP_WALK':
      return { 
        ...state,
        animations: state.animations.filter((animation)=>{
          return animation !== 'walk';
        }),
        model: {
          ...state.model,
          walk: keyed.START_WALK,
          walking: false,
          run: false,
          lounge: true,
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
          walking: true
        }
      }
    
    case 'START_WALK_BACK':
      var result = { 
        ...state,
        animations: Array.from(new Set([
          ...state.animations,
          'walk'
        ])),
        model: {
          ...state.model,
          walking: false,
          walk: !action.shift,
          run: action.shift,
          speed: {
            ...state.model.speed,
            walk: state.model.run ? -SPEED.WALK * 1.5 : -SPEED.WALK
          }
        }
      }
      if (action.shift) {
        result.model.speed.run = -SPEED.WALK * 1.95
      } else {
        result.model.speed.walk = -SPEED.WALK
      }
      return result
    case 'STOP_WALK_BACK':
      var result = { 
        ...state,
        animations: state.animations.filter((animation)=>{
          return animation !== 'walk';
        }),
        model: {
          ...state.model,
          walk: false,
          run: false,
          walking: false,
          speed: {
            ...state.model.speed,
            walk: 0
          }
        }
      }

      return result
      
    case 'START_STRAFE_RIGHT':
      var result = { 
        ...state,
        animations: Array.from(new Set([
          ...state.animations,
          'strafe'
        ])),
        model: {
          ...state.model,
          strafe: true,
          run: action.shift
        }
      }
      if (action.shift) {
        result.model.speed.strafe = SPEED.STRAFE * 1.95
      } else {
        result.model.speed.strafe = SPEED.STRAFE
      }
      return result
    case 'STOP_STRAFE_RIGHT':
      return { 
        ...state,
        animations: state.animations.filter((animation)=>{
          return animation !== 'strafe';
        }),
        model: {
          ...state.model,
          strafe: keyed.START_STRAFE_LEFT || keyed.START_STRAFE_RIGHT,
          strafing: false,
          run: action.shift,
          lounge: true,
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
        animations: Array.from(new Set([
          ...state.animations,
          'strafe'
        ])),
        model: {
          ...state.model,
          strafe: true,
          run: action.shift,
          speed: {
            ...state.model.speed,
            strafe: -SPEED.STRAFE * (keyed.shift ? 1.5 : 1)
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
          strafe: keyed.START_STRAFE_LEFT || keyed.START_STRAFE_RIGHT,
          strafing: false,
          lounge: true,
          run: action.shift,
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
        rotationIncrement = rotationIncrement - Math.PI * 2;
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
        rotationIncrement = Math.PI * 2 + rotationIncrement
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
          lounge: true,
          rotateLeft: false
        }
      }
    case 'STOP_ROTATE_RIGHT':
      return {
        ...state,
        model: {
          ...state.model,
          lounge: true,
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
      if (cameraTheta < Math.PI * 2 - 0.25) {
        cameraTheta += 0.13;
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
      
      if (cameraTheta > 0) {
        if (cameraTheta > Math.PI * 1.9) {
          cameraTheta -= 0.033;
        } else {
          cameraTheta -= 0.15;
        }
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
        animations: Array.from(new Set([
          ...state.animations,
          'jump'
        ])),
        model: {
          ...state.model,
          jump: true,
          jumping: false,
          falling: false,
          velocity: {
            ...state.model.velocity,
            y: SPEED.JUMP
          }
        }
      }
    case 'GRAVITY':     
      return {
          ...state,
          model: {
              ...state.model,
              falling: true,
              velocity: {
                  ...state.model.velocity,
                  y: state.model.velocity.y + action.velocity
              }
          }
      };

    case 'STOP_JUMP':
      return {
        ...state,
        animations: state.animations.filter((animation) => animation !== 'jump'),
        model: {
          ...state.model,
          jump: false,
          jumping: false,
          lounge: true,
          change: new Vector3(0, 0, 0),
          velocity: {
              ...state.model.velocity,
              y: 0
          }
        }
      };
    case 'STOP_FALLING':
      return {
        ...state
      }
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
          if (time - interaction.date > 300) {
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
    case 'LOAD_GROUND':
      return {
        ...state,
        planet: {
          ...state.planet,
          surfaceGeometry: action.surfaceGeometry,
          planetGeometry: action.planetGeometry
        }
      }
    case 'LOAD_SUN':
      return {
        ...state,
        sun: {
          ...state.sun,
          ...action.sun
        }
      };
    case 'FILL_OCEAN':
      return {
        ...state,
        planet: {
          ...state.planet,
          oceansFilled: true,
          lakes: action.lakes ? action.lakes : state.planet.lakes,
          lakeNodes: action.lakeNodes ? action.lakeNodes : state.planet.lakeNodes,
          lands: action.lands,
        }
      }
    case 'LOAD_THE_STARS':
      return {
        ...state,
        starBuffer: action.starBuffer
      }
    case 'LOAD_THE_SUN':
      return {
        ...state,
        sunPosition: action.sunPosition
      }
    case 'SCENE_ROTATION':
      return {
        ...state,
        x: action.x
      }
    default:
      return state;
  }

}





function App() {

  const [ state, dispatch ] = useReducer(sceneReducer, props);
  const model = useLoader(GLTFLoader, '/Xbot.glb');
  const [appKeys, setAppKeys] = useState();



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
    model.scene.position.set(20, state.planet.radius + 20, 0)
    model.scene.castShadow = true;
    model.scene.receiveShadow = true;
    model.scene.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });

    dispatch({ type: 'MODEL_LOADED', model, dial })
  }, []);


  var addEvents = () => {
    const handleKeyDown = (e) => {
      const key = e.key.toLowerCase();
      if (key == 'w') {
        if (!keyed.START_WALK) {
          keys.push('walk')
          keyed.START_WALK = true;
          dispatch({ type: 'START_WALK', shift: keyed.SHIFT });
        }
      }
      if (key == 's') {
        if (!keyed.START_WALK_BACK) {
          keyed.START_WALK_BACK = true;
          keys.push('walk')
          dispatch({ type: 'START_WALK_BACK', shift: keyed.SHIFT });
        }
      }
      if (key == 'a') {
        if (!keyed.START_STRAFE_LEFT) {
          keyed.START_STRAFE_LEFT = true;
          keys.push('strafe')
          dispatch({ type: 'START_STRAFE_LEFT', shift: keyed.SHIFT });
        }
      }
      if (key == 'd') {
        if (!keyed.START_STRAFE_RIGHT) {
          keyed.START_STRAFE_RIGHT = true;
          keys.push('strafe')
          dispatch({ type: 'START_STRAFE_RIGHT', shift: keyed.SHIFT });
        }
      }
      if (key == 'arrowleft') {
        if (!keyed.START_ROTATE_LEFT) {
          keyed.START_ROTATE_LEFT = true;
          dispatch({ type: 'START_ROTATE_LEFT' })
        }
      }
      if (key == 'arrowright') {
        if (!keyed.START_ROTATE_RIGHT) {
          keyed.START_ROTATE_RIGHT = true;
          dispatch({ type: 'START_ROTATE_RIGHT' })
        }
      }
      if (key == 'arrowup') {
        if (!keyed.START_ROTATE_UP) {
          keyed.START_ROTATE_UP = true;
          dispatch({ type: 'START_ROTATE_UP' })
        }
      }
      if (key == 'arrowdown') {
        if (!keyed.START_ROTATE_DOWN) {
          keyed.ROTATE_DOWN = true;
          dispatch({ type: 'START_ROTATE_DOWN' })
        }
      }
      if (key.trim() == '') {
        // if (!keyed.START_JUMP) {
        //   keyed.START_JUMP = true;
          dispatch({ type: 'START_JUMP' })
        // }
      }
      if (key == 'enter') {
        dispatch({ type: 'MODEL_LOADED', model })
      }
      if (key == 'shift') {
        keyed.SHIFT = true;
        if (keyed.START_WALK) {
          dispatch({ type: 'START_WALK', shift: keyed.SHIFT })
        } else if (keyed.START_WALK_BACK) {
          dispatch({ type: 'START_WALK_BACK', shift: keyed.SHIFT })
        } else if (keyed.START_STRAFE_LEFT) {
          dispatch({ type: 'START_STRAFE_LEFT', shift: keyed.SHIFT })
        } else if (keyed.START_STRAFE_RIGHT) {
          dispatch({ type: 'START_STRAFE_RIGHT', shift: keyed.SHIFT })
        }
      }
    };

    const handleKeyUp = (e) => {
      const key = e.key.toLowerCase();

      if (key == 'w') {
        keyed.START_WALK = false;
        keys.removeLast('walk')
        dispatch({ type: 'STOP_WALK' })

        if (keys.contains('walk')) {
          dispatch({ type: 'START_WALK', shift: keyed.SHIFT });
        } 
        if (keys.contains('strafe') && keyed.START_STRAFE_RIGHT) {
          dispatch({ type: 'START_STRAFE_RIGHT', shift: keyed.SHIFT });
        }
        if (keys.contains('walk') && keyed.START_WALK_BACK) {
          dispatch({ type: 'START_WALK_BACK', shift: keyed.SHIFT });
        }
      }
      if (key == 's') {
        keyed.START_WALK_BACK = false;
        keys.removeLast('walk')
        dispatch({ type: 'STOP_WALK_BACK' })


        if (keys.contains('walk') && keyed.START_WALK) {
          dispatch({ type: 'START_WALK', shift: keyed.SHIFT });
        }
        if (keys.contains('strafe') && keyed.START_STRAFE_RIGHT) {
          dispatch({ type: 'START_STRAFE_RIGHT', shift: keyed.SHIFT });
        }
        if (keys.contains('walk') && keyed.START_WALK) {
          dispatch({ type: 'START_WALK', shift: keyed.SHIFT });
        }
      }
      if (key == 'a') {
        keyed.START_STRAFE_LEFT = false;
        keys.removeLast('strafe')
        dispatch({ type: 'STOP_STRAFE_LEFT' })
        
        if (keys.contains('strafe') && keyed.START_STRAFE_RIGHT) {
          dispatch({ type: 'START_STRAFE_RIGHT', shift: keyed.SHIFT });
        }
        if (keys.contains('walk') && keyed.START_WALK) {
          dispatch({ type: 'START_WALK', shift: keyed.SHIFT });
        }
        if (keys.contains('walk') && keyed.START_WALK_BACK) {
          dispatch({ type: 'START_WALK_BACK', shift: keyed.SHIFT });
        }
      }
      if (key == 'd') {
        keyed.START_STRAFE_RIGHT = false;
        keys.removeLast('strafe')

        dispatch({ type: 'STOP_STRAFE_RIGHT' });

        if (keys.contains('strafe') && keyed.START_STRAFE_LEFT) {
          dispatch({ type: 'START_STRAFE_LEFT', shift: keyed.SHIFT });
        }
        if (keys.contains('strafe') && keyed.START_WALK_BACK) {
          dispatch({ type: 'START_WALK_BACK', shift: keyed.SHIFT });
        }
        if (keys.contains('walk') && keyed.START_WALK) {
          dispatch({ type: 'START_WALK', shift: keyed.SHIFT });
        }
       
      }
      if (key == 'arrowleft') {
        keyed.START_ROTATE_LEFT = false;
        dispatch({ type: 'STOP_ROTATE_LEFT' })
      }
      if (key == 'arrowright') {
        keyed.START_ROTATE_RIGHT = false;
        dispatch({ type: 'STOP_ROTATE_RIGHT' })
      }
      if (key == 'arrowup') {
        keyed.START_ROTATE_UP = false;
        dispatch({ type: 'STOP_ROTATE_UP' })
      }
      if (key == 'arrowdown') {
        keyed.START_ROTATE_DOWN = false;
        dispatch({ type: 'STOP_ROTATE_DOWN' })
      }
      if (key.trim() == '') {
        keyed.START_JUMP = false;
        // dispatch({ type: 'STOP_JUMP' })
      }
      if (key == 'shift') {
        keyed.SHIFT = false;
        if (keyed.START_WALK) { // if walking
          dispatch({ type: 'START_WALK', shift: keyed.SHIFT })
        }
        if (keyed.START_WALK_BACK) { // if walking back
          dispatch({ type: 'START_WALK_BACK', shift: keyed.SHIFT })
        }
        if (keyed.START_STRAFE_RIGHT) {
          dispatch({ type: 'START_STRAFE_RIGHT', shift: keyed.SHIFT })
        }
        if (keyed.START_STRAFE_LEFT) {
          dispatch({ type: 'START_STRAFE_LEFT', shift: keyed.SHIFT })
        }
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
  useEffect(() => {}, [keyed, state.interactions])

  if (!state.model.scene) {
    return <div className="App"></div>
  }

  const planetCenter = new Vector3(...state.planet.position);
  const coordinates = coords(state.model.scene);

  const q = VisualizeQuaternion(state.model.scene.quaternion, 1, .3);

  var eventCollection = true


  return (

    eventCollection ?
    <div className="App">
      <div id="stats">
        <pre>walk:<div className="boolean">{new String(state.model.walk)}</div>
        walking:<div className="boolean">{new String(state.model.walking)}</div>
        strafe:<div className="boolean">{new String(state.model.strafe)}</div>
        strafing:<div className="boolean">{new String(state.model.strafing)}</div></pre>
        <section>
          <ol>
            {
              keys.map(k => <li>{k}</li>)
            }
          </ol>
        </section>
      </div>
      <CanvasContainer 
        state={state}
        keys={keys}
        dispatch={dispatch} />
    </div>
    :
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

                <br />
                <i><h2>{state.model.floor.type} floor</h2></i>
                <span className="number"><big>{new Number(state.model.floor.x).toFixed(2)}</big>
                  ,<big>{new Number(state.model.floor.y).toFixed(2)}</big>
                  <big>{new Number(state.model.floor.z).toFixed(2)}</big></span>

                <i><h2>Surface Distance</h2></i>
                <span className="number"><big>{state.model.intersectsSurface}</big></span>

                <br />
                <i><h2>Sun:</h2></i>
                <span className="number">{new Number(state.sunPosition[0]).toFixed(2)},</span> 
                <span className="number">{new Number(state.sunPosition[1]).toFixed(2)},</span> 
                <span className="number">{new Number(state.sunPosition[2]).toFixed(2)}</span>

                <span className="number">{new Number(state.x).toFixed(2)}</span>
                <br />

              </section>
            </li>
            <li>walk speed...<span className="number">{state.model.speed.walk}</span></li>
            <li>run <span className="boolean">{new String(state.model.run)}</span> speed...<span className="number">{state.model.speed.run}</span></li>
            <li>strafe <span className="boolean">{new String(state.model.strafe)}</span> speed...<span className="number">{state.model.speed.strafe}</span></li>
            <li>camera theta...<span className="number">{state.cameraTheta}</span></li>
            <li>walking...<span className="boolean">{new String(state.model.walk)}</span></li>
            <li>strafing...<span className="boolean">{new String(state.model.strafe)}</span></li>
            <li>jumping...<span className="boolean">{new String(state.model.jump)}</span></li>
            <li>
              gravity distance {state.planet.distanceTo}
            </li>
           <li>
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
            </li>

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
