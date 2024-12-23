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
    speed: 1
  },
  tasks: []
};

function sceneReducer(state, action) {
  switch (action.type) {
    case 'START_RUN':
      return { 
        ...state,
        model: {
          ...action.payload.model,
          run: true,
          speed: 1,
          animation: undefined
        }
      }
    case 'STOP_RUN':
      return { 
        ...state,
        model: {
          ...action.payload.model,
          run: false,
          speed: 0.5,
          animation: undefined
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
