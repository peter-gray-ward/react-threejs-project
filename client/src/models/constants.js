import {
  Vector3,
  Curve
} from 'three';

export class CustomSinCurve extends Curve {

  constructor( scale = 1 ) {
    super();
    this.scale = scale;
  }

  getPoint( t, optionalTarget = new Vector3() ) {

    const tx = t * 3 - 1.5;
    const ty = Math.sin( 2 * Math.PI * t );
    const tz = 0;

    return optionalTarget.set( tx, ty, tz ).multiplyScalar( this.scale );
  }
}


export const SPEED = {
  GRAVITY: 0.055, 
  WALK: .15 * 4,     
  RUN: 3.8 * 5,
  STRAFE: .15 * 4,    
  CAMERA: {
    SIN: 0.5,   
  },
  JUMP: 0.35,     
  ROTATE: 0.05,
  ROTATE_DOWN: 0.413,
  ROTATE_UP: 0.415
};


export const MASS = {
  sun: {
    radius: 120
  },
  planet: {
    radius: 100000,
    position: [
      0,
      0,
      0
    ]
  }
}

export const starRadius = 1000000//736;
export const angularSize = 0.00345;
// export const cameraRadius = starRadius * 2
export const cameraRadius = 1 * 3.5

export const props = {
  firstPerson: false,
  keys: { 
    w: false,
    s: false,
    a: false,
    d: false 
  },
  scenes: {
    after_weathertop: `The hills now began to shut them in...Trees with old and twisted 
      roots hung over cliffs, and piled up behind into mounting slopes of pine-wood.`
  },
  x: 0,
  cameraTheta: Math.PI * 1.7,
  cameraPhi: Math.PI / 2,
  cameraRadius,
  starRadius,
  sunPosition: [0,0,0],
  starBuffer: [],
  cameraPoint: new Vector3(0,0,0),
  interaction: new Date().getTime(),
  animations: [],
  centerStage: new Vector3(0, MASS.planet.radius, 0),
  setSurface: false,
  model: {
    floor: new Vector3(0,0,0),
    walk: false,
    walking: false,
    strafe: false,
    strafing: false,
    lounge: true,
    lounging: false,
    jump: false,
    jumping: false,
    fall: true,
    falling: true,
    rotatingCamera: false,
    animation: 0,
    change: new Vector3(0,0,0),
    gravity: SPEED.GRAVITY,
    floorRadius: MASS.planet.radius,
    force: {
      y: SPEED.JUMP,
      x: 0,
      z: 0
    },
    speed: {
      rotate: SPEED.ROTATE,
      walk: SPEED.WALK,
      run: SPEED.RUN
    },
    velocity: {
      x: 0,
      y: 0, 
      z: 0
    },
    rotation: 0,
    weight:  0.5,
    rotationIncrement: 10.1
  },
  tasks: [],
  planet: {
    radius: MASS.planet.radius,
    position: MASS.planet.position,
    distanceTo: undefined,
    vertices: [],
    lakeNodes: []
  },
  sun: {
    radius: MASS.sun.radius
  },
  interactions: new Set()
};