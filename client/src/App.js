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
    run: false,
    animation: 0,
    speed: 1,
    rotation: {
      x: 0, y: 0, z: 0
    },
    position: {
      x: 0, y: 1, z: 2
    }
  },
  tasks: []
};

function sceneReducer(state, action) {

  switch (action.type) {
    case 'START_RUN':
      return { 
        ...state,
        model: {
          ...state.model,
          run: true,
          speed: 1,
          animation: 3
        }
      }
    case 'STOP_RUN':
      return { 
        ...state,
        model: {
          ...state.model,
          run: false,
          speed: 0.5,
          animation: 3
        }
      }
    case 'START_RUN_BACK':
      return { 
        ...state,
        model: {
          ...state.model,
          run: true,
          speed: -1,
          animation: 3
        }
      }
    case 'STOP_RUN_BACK':
      return { 
        ...state,
        model: {
          ...state.model,
          run: false,
          speed: -0.5,
          animation: 3
        }
      }
    case 'ROTATE_LEFT':
      var YRotation = state.model.rotation.y - 0.005;
      if (YRotation < 0) {
        YRotation = Math.PI * 2;
      }
      return {
        ...state,
        model: {
          ...state.model,
          rotation: {
            ...state.model.rotation,
            y: YRotation
          }
        }
      }
    case 'ROTATE_RIGHT':
      var YRotation = state.model.rotation.y + 0.005;
      if (YRotation > Math.PI * 2) {
        YRotation = 0;
      }
      return {
        ...state,
        model: {
          ...state.model,
          rotation: {
            ...state.model.rotation,
            y: YRotation
          }
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
