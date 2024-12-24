import React, {
  useState,
  useEffect,
  useReducer,
  useRef
} from 'react';
import CanvasContainer from './components/CanvasContainer';
import './styles/App.css';

const props = {
  model: {
    walk: false,
    animation: 0,
    speed: 1,
    rotation: {
      x: 0, y: 0, z: 0
    },
    position: {
      x: 0, y: -1.5, z: 2
    }
  },
  tasks: []
};

function sceneReducer(state, action) {

  switch (action.type) {
    case 'START_WALK':
      return { 
        ...state,
        model: {
          ...state.model,
          walk: true,
          position: {
            ...state.model.position,
            speed: 0.03
          },
          animation: 3
        }
      }
    case 'STOP_WALK':
      return { 
        ...state,
        model: {
          ...state.model,
          walk: false,
          speed: 0.5,
          animation: 3,
          position: {
            ...state.model.position,
            speed: 0
          },
        }
      }
    case 'START_WALK_BACK':
      return { 
        ...state,
        model: {
          ...state.model,
          walk: true,
          animation: 3,
          position: {
            ...state.model.position,
            speed: -0.03
          }
        }
      }
    case 'STOP_WALK_BACK':
      return { 
        ...state,
        model: {
          ...state.model,
          walk: false,
          position: {
            ...state.model.position,
            speed: -0.3
          },
          animation: 3
        }
      }
    case 'START_ROTATE_LEFT':
      var YRotation = state.model.rotation.y - 0.005;
      if (YRotation < 0) {
        YRotation = Math.PI * 2;
      }
      return {
        ...state,
        model: {
          ...state.model,
          rotateLeft: true,
          rotation: {
            ...state.model.rotation,
            y: YRotation
          }
        }
      }
    case 'START_ROTATE_RIGHT':
      var YRotation = state.model.rotation.y - 0.005;
      if (YRotation > Math.PI * 2) {
        YRotation = 0;
      }
      return {
        ...state,
        model: {
          ...state.model,
          rotateRight: true,
          rotation: {
            ...state.model.rotation,
            y: YRotation
          }
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
    case 'START_ROTATE_UP':
      return {
        ...state,
        model: {
          ...state.model,
          rotateUp: true
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
  }
}

function App() {

  const [state, dispatch] = useReducer(sceneReducer, props);

  return (
    <div className="App">
      <CanvasContainer 
        state={state} 
        dispatch={dispatch} />
    </div>
  );
}

export default App;
