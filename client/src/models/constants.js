export const SPEED = {
  GRAVITY: -0.007,
  WALK: 1,
  STRAFE: 0.035,
  CAMERA: {
    SIN: .1
  },
  JUMP: 0.09,
  ROTATE: 0.05
}

export const MASS = {
  syl: {

  },
  planet: {
    radius: 129,
    position: [
      0,
      -129,
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
  cameraPhi: Math.PI * 2,
  cameraRadius,
  interaction: new Date().getTime(),
  model: {
    walk: false,
    walking: false,
    strafe: false,
    strafing: false,
    jump: false,
    animation: 0,
    speed: {
      rotation: SPEED.ROTATE,
      walk: SPEED.WALK
    },
    weight:  0.5
  },
  tasks: [],
  planet: {
    radius: MASS.planet.radius,
    position: [
      0, 
      -MASS.planet.radius, 
      0
    ],
    distanceTo: undefined
  },
  interactions: new Set()
};