import {
  Vector3
} from 'three';

export const SPEED = {
  GRAVITY: 0.01, // Slightly faster gravitational pull for a realistic fall speed (2 m/s², not Earth-like 9.8 m/s² but game-friendly)
  WALK: .15,      // Average human walking speed ~2.5 meters per second
  RUN: 0.8,
  STRAFE: .1,    // Strafing is typically slower than walking forward
  CAMERA: {
    SIN: 0.05,    // Reduced sinusoidal camera effect for subtle motion
  },
  JUMP: 0.11,        // Realistic jump height considering gravity (parabolic arc ~1.25 meters with these values)
  ROTATE: 0.05    // Reduced rotation speed for smoother turning (~2.86 degrees per frame at 60fps)
};


export const MASS = {
  syl: {

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

export const cameraRadius = 2.5

export const props = {
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
  cameraTheta: Math.PI * 1.7,
  cameraPhi: Math.PI * 2,
  cameraRadius,
  interaction: new Date().getTime(),
  animations: [],
  model: {
    walk: false,
    walking: false,
    strafe: false,
    strafing: false,
    lounge: true,
    lounging: true,
    jump: false,
    jumping: false,
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
    rotationIncrement: 0.1
  },
  tasks: [],
  planet: {
    radius: MASS.planet.radius,
    position: MASS.planet.position,
    distanceTo: undefined,
    vertices: []
  },
  interactions: new Set()
};