import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { useFrame, useThree, useLoader } from '@react-three/fiber'
import { SPEED, MASS, cameraRadius, props } from '../models/constants';
import { 
  Box3,
  BoxGeometry,
  MeshBasicMaterial,
  InstancedMesh,
  AnimationMixer,
  Mesh,
  Sphere,
  InstancedBufferAttribute,
  Vector3,
  DoubleSide,
  PlaneGeometry,
  Raycaster,
  Float32BufferAttribute,
  SphereGeometry,
  TextureLoader,
  Color,
  MeshStandardMaterial,
  CylinderGeometry,
  BufferGeometry,
  Group,
  VSMShadowMap,
  PCFSoftShadowMap,
  ArrowHelper,
  Quaternion,
  TubeGeometry,
  Matrix4,
  CatmullRomCurve3,
  Object3D,
  Triangle,
  RepeatWrapping,
  Shape
} from 'three';

import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader';
import * as perlinNoise from 'perlin-noise';
import {
  generateTerrainInstance,
  computeSteepness,
  randomInRange,
  randomPointOnTriangle,
  randomPointOnTriangleFromGrid,
  TriangleMesh,
  size,
  interpolateNoise
} from '../util';

import BackgroundHills from './BackgroundHills'

// The Dandilion Curvature
let _a = 3.5;
const ra = randomInRange(_a * -0.05, _a * 0.05)
const rb = randomInRange(_a * -0.05, _a * 0.05)
const rc = randomInRange(_a * 0.01, _a * 0.01)
const rd = randomInRange(_a * 0.01, _a * 0.01)
const re = randomInRange(_a * 0.01, _a * 0.01)
const rf = randomInRange(_a * 0.1, _a * 0.1)
const rg = randomInRange(_a * -0.15, _a * 0.15)
const rh = randomInRange(_a * -0.05, _a * 0.05);
    
function Planet(props) {
  const a = _a;
  const aa = _a;
  var i = new Date().getTime();
  var fiber = useThree();

  const surfaceRef = useRef();

  const twopi = Math.PI * 2;
  const halfpi = Math.PI / 2;
  const threequaterspi = Math.PI * twopi;

  const cliffTexture = useMemo(() => new TextureLoader().load("/cliff.jpg", texture => {
    texture.wrapS = RepeatWrapping
      texture.wrapT = RepeatWrapping
      texture.repeat.set(2, 1)
  }), []);

  const tree1 = useLoader(FBXLoader, '/tree1.fbx');

  useEffect(() => {
    tree1.children[0].material = new MeshStandardMaterial({
      side: DoubleSide,
      transparent: true,
      alphaTest: 0.5,
      vertexColors: true,
      depthWrite: true
    });
    tree1.children[0].material.side = DoubleSide
    tree1.children[0].material.transparent = false
  }, [tree1]);

  useEffect(() => {
    fiber.gl.shadowMap.enabled = true;
    fiber.gl.shadowMap.type = PCFSoftShadowMap;
    function engageInteractions(a) {
      if (props.state.model.scene && props.state.planet) {
        const modelBoundingBox = new Box3().setFromObject(props.state.model.scene); // Calculate the bounding box
        const modelBoundingSphere = new Sphere(); // Create a sphere object
        const planet = new Sphere(new Vector3(0, -props.state.planet.radius, 0), props.state.planet.radius);


        const distance = props.state.model.scene.position.distanceTo(planet.center) // Calculate distance to the planet

        props.dispatch({ type: 'ENGAGE_INTERACTIONS', distanceTo: distance, interactions: props.state.interactions });
      }
      window.requestAnimationFrame(engageInteractions);
    }
    engageInteractions();
  }, []);
  
  const sphereRef = useRef();
  const cliffsRef = useRef();
  const grassesRef = useRef();
  const flowersRef = useRef();
  const flowersBallsRef = useRef();
  const bladesOfGrassRef = useRef();
  const normalSphereRef = useRef();
  const triangles = useMemo(() => ([]), []);

  let grass2 = useLoader(FBXLoader, '/grass2.fbx')
  let [grass2Position, setGrass2Position] = useState([]);
  let grass3 = useLoader(FBXLoader, '/grass2.fbx')
  let grass1 = useLoader(FBXLoader, '/grass1.fbx')
  let statue = useLoader(FBXLoader, '/Thai_Female_Sandstone_V2.2.fbx')
  let grassUserPosRef = useRef(props.state.model.scene.position.clone());
  var statuecount = 0

  const makeGrass = useCallback(() => {
    if (!surfaceRef.current) return
    const rows = 30;
    const cols = 30;
    const zeds = 30;
    var dists = new Set()
    var growing = false
    var grown = 0
    let grassInstances = []
    let grassInstanceIndex = 0;
    var shadesOfGrass = ['#a5b53e','#bdca51','#899b29','#788d1c','#88981a','#b4c454','#b4cc4e']
    for (var i = 0; i < rows; i++) {
      var onrun = false
      var runcount = 0
      for (var j = 0; j < cols; j++) {
        let a = i + j * (rows + 1);
        let b = (i + 1) + j * (rows + 1);
        let c = (i + 1) + (j + 1) * (rows + 1);
        let d = i + (j + 1) * (rows + 1);
                
        const ta = new Vector3(
          surfaceRef.current.geometry.attributes.position.array[a * 3],
          surfaceRef.current.geometry.attributes.position.array[a * 3 + 1] + props.state.planet.radius,
          surfaceRef.current.geometry.attributes.position.array[a * 3 + 2]
        )
        const tb = new Vector3(
          surfaceRef.current.geometry.attributes.position.array[b * 3],
          surfaceRef.current.geometry.attributes.position.array[b * 3 + 1] + props.state.planet.radius,
          surfaceRef.current.geometry.attributes.position.array[b * 3 + 2]
        )
        const tc = new Vector3(
          surfaceRef.current.geometry.attributes.position.array[c * 3],
          surfaceRef.current.geometry.attributes.position.array[c * 3 + 1] + props.state.planet.radius,
          surfaceRef.current.geometry.attributes.position.array[c * 3 + 2]
        )

        const td = new Vector3(
          surfaceRef.current.geometry.attributes.position.array[d * 3],
          surfaceRef.current.geometry.attributes.position.array[d * 3 + 1] + props.state.planet.radius,
          surfaceRef.current.geometry.attributes.position.array[d * 3 + 2]
        )

            
        let triangle = new Triangle(
            ta, tb, tc
        );

        let otherTriangle = new Triangle(
          ta, tc, td
        );

        var sa = computeSteepness(ta, tb, tc)
        var sb = computeSteepness(tb, tc, td)



        if (sa < 0.75 || sb < 0.75) continue

        var inSOI = tb.distanceTo(props.state.model.scene.position) < 350
        if (inSOI) {
          if (true) {
            if (!onrun) {
              runcount = 0
            }
            onrun = true
            runcount++
            var pos;
            var green = false
            var clusterCount = Math.random() < 0.33 ? randomInRange(100, 200) : Math.floor(randomInRange(100, 150))//smallGrass ? Math.floor(randomInRange(80, 10)) : 1
            if (Math.random() < 0.15) {
              clusterCount = randomInRange(10, 50)
              green = true
            }
            for (var t of [triangle, otherTriangle]) {
              for (var cc = 0; cc < clusterCount; cc++) {

                if (green && Math.random() < 0.1) continue

                if (Math.random() < 0.5) continue
                
                pos = randomPointOnTriangle(t.a, t.b, t.c)

                let s = !green ? randomInRange(0.01, randomInRange(0.02, 0.05)) : 0.02//randomInRange(0.01, 0.03)

                // if (Math.random() < 0.01) {
                //   s = randomInRange(0.05, 0.06)
                // }

                // if (Math.random() < 0.01 && Math.random() < 0.1) {
                //   s = randomInRange(0.06, 0.07)
                // }

                const dummy = new Object3D();
                dummy.position.copy(pos);
                dummy.scale.set(s, s, s);
                dummy.rotation.y = Math.random() * Math.PI * 2;
                dummy.updateMatrix();

                var cl = new Color(shadesOfGrass[Math.random() * shadesOfGrass.length])
                // cl.g = 1

                grassInstances.push({
                  dummy,
                  instanceIndex: grassInstanceIndex,
                  color: Math.random() < 0.5 ? new Color('#90b529') : (Math.random() < 0.9 ? new Color('#74ac1e') : new Color('#729b18'))
                })

                grassInstanceIndex++;
              }
            }
          }

          var hasTree = false

          if (Math.random() < 0.02 && Math.random() > 0.7) {
            hasTree = true
            pos = randomPointOnTriangle(triangle.a, triangle.b, triangle.c)

            // if (pos.distanceTo(props.state.model.scene.position) > 60) continue;

            var tree = tree1.clone();
            console.log("a new tree", tree)
            tree.position.copy(pos);
            var scale = randomInRange(0.3, 1);
            tree.position.y -= 3
            tree.scale.set(scale, scale, scale)
            tree.rotation.y = randomInRange(0, Math.PI * 2);
            tree.children[0].material.side  = DoubleSide
            tree.children[0].castShadow = true;
            tree.children[0].receiveShadow = true;

            // First group (green, e.g., leaves)
            for (let i = 0; i < tree.children[0].geometry.groups[0].count; i++) {
                let index = (tree.children[0].geometry.groups[0].start + i) * 3;
                tree.children[0].geometry.attributes.color.array[index] = randomInRange(0, 0.5);   // Red (brownish)
                tree.children[0].geometry.attributes.color.array[index + 1] = randomInRange(0, 0.25); // Green (dark brown)
                tree.children[0].geometry.attributes.color.array[index + 2] = 0; // Blue
            }

            // Second group (brown, e.g., trunk)
            var yellow = Math.random() < 0.33;
            var paints = 0;
            for (let i = 0; i < tree.children[0].geometry.groups[1].count; i++) {
              let index = (tree.children[0].geometry.groups[1].start + i) * 3;

              
              
              tree.children[0].geometry.attributes.color.array[index] = (yellow && paints < 2) ? 1 : 0;     // Red
              tree.children[0].geometry.attributes.color.array[index + 1] = (yellow && paints < 2) ? 1 : 1; // Green
              tree.children[0].geometry.attributes.color.array[index + 2] = (yellow && paints < 2) ? 0 : 0; // Blue
              paints++

              if (paints == 2) {
                yellow = Math.random() < 0.33;
                paints = 0
              }
            }

            // Mark as needing an update
            tree.children[0].geometry.attributes.color.needsUpdate = true;

            // Ensure the material uses vertex colors
            tree.children[0].material.vertexColors = true;

            fiber.scene.add(tree);
          }

          if (i > 10 && j > 10 && i < rows - 10 && j < cols - 10 && !hasTree) {
            if (Math.random() < 0.1 && statuecount < 1) {
              var s = statue.clone();
              s.position.copy(triangle.a)
              s.rotation.y = Math.random() * Math.PI * 2
              s.castShadow = true

              if (s.children.length) {
                s.children[0].castShadow = true
                s.children[0].position.y -= 3
                s.children[0].material.map = cliffTexture
              }
              fiber.scene.add(s)
              statuecount++
            }
          }
        }
          
      }
    }

    const baseGrassMesh = grass2.children[0];
    const grassGeometry = baseGrassMesh.geometry.clone();
    const grassMaterial = baseGrassMesh.material.clone()
    const grassInstanceCount = grassInstances.length;
    const grassesInstanceMesh = new InstancedMesh(grassGeometry, grassMaterial, grassInstanceCount);
    
    grassesInstanceMesh.instanceColor = new InstancedBufferAttribute(new Float32Array(grassInstanceCount * 3), 3);
    grassesInstanceMesh.castShadow = false;
    grassesInstanceMesh.receiveShadow = true;

    for (var grassInstance of grassInstances) {
      grassesInstanceMesh.setMatrixAt(grassInstance.instanceIndex, grassInstance.dummy.matrix);
      grassesInstanceMesh.setColorAt(grassInstance.instanceIndex, grassInstance.color);
    }

    grassesInstanceMesh.name = 'grass'
    fiber.scene.add(grassesInstanceMesh);
  }, [surfaceRef, props.state.model.scene.position])

  useEffect(() => {
    const rows = 30;
    const cols = 30;
    const zeds = 30;

    const amplitude = 70;
    const halfAmplitude = amplitude / 2;


    const geometry = new PlaneGeometry(350, 350, rows, cols);
    geometry.vertexColors = true;


    for (var x = 0; x < geometry.attributes.position.array.length; x += 3) {
      var y = geometry.attributes.position.array[x + 1];
      geometry.attributes.position.array[x + 1] = geometry.attributes.position.array[x + 2];
      geometry.attributes.position.array[x + 2] = y;
    }

    geometry.attributes.position.needsUpdate = true;

    const positions = geometry.attributes.position.array;
        
    surfaceRef.current.geometry = geometry;
    grassesRef.current.geometry = geometry;

    const TOCENTER = props.state.model.scene.position.clone().normalize();
    const noise = perlinNoise.generatePerlinNoise(
      rows, 
      cols, 
      {
        persistence: .005,
        amplitude
      }
    );

    const indices = [];

    var grassesColors = []
    var cliffColors = [];
    var dandilionColors = [];
    const cliffUvs = [];
    const grassUvs = [];
    var foundHobbitHole = false;
    var dandelionIndex = 0;
    var normalSphereIndex = 0;
    var bladeIndex = 0;
    var grassesIj = {}

    var currentNoiseOffset = 0;
    for (let x = 0; x < positions.length; x += 3) {
      const xIndex = Math.floor((x / 3) % rows);
      const zIndex = Math.floor((x / 3) / cols) + 2;
      const noiseValue = noise[zIndex * cols + xIndex] * amplitude;
      let noiseOffset = noiseValue > halfAmplitude ? noiseValue - halfAmplitude : -(halfAmplitude - noiseValue);

      if ((noiseOffset !== 0 && !noiseOffset) || Number.isNaN(noiseOffset)) {
        noiseOffset = currentNoiseOffset
      } else {
        currentNoiseOffset = noiseOffset
      }

      positions[x] = positions[x];
      positions[x + 1] = positions[x + 1] + noiseOffset;
      positions[x + 2] = positions[x + 2];

      const topLeft = zIndex * (cols + 1) + xIndex;
      const topRight = topLeft + 1;
      const bottomLeft = (zIndex + 1) * (cols + 1) + xIndex;
      const bottomRight = bottomLeft + 1;

      // Create two triangles for the quad
      indices.push(topLeft, bottomLeft, topRight); // Triangle 1
      indices.push(topRight, bottomLeft, bottomRight); // Triangle 2
    }
     

    var TerrainInstance = generateTerrainInstance(geometry, .65, 'gray');
    var TheNormalSphere = new Object3D();
    
    props.state.model.scene.position.set(
      TerrainInstance.otherGeometry.attributes.position.array[105],
      TerrainInstance.otherGeometry.attributes.position.array[106] + props.state.planet.radius + 10,
      TerrainInstance.otherGeometry.attributes.position.array[107]
    );

    for (var x = 0; x < TerrainInstance.steepGeometry.attributes.normal.array.length; x += 3) {
      const normalX = TerrainInstance.steepGeometry.attributes.normal.array[x];
      const normalY = TerrainInstance.steepGeometry.attributes.normal.array[x + 1];
      const normalZ = TerrainInstance.steepGeometry.attributes.normal.array[x + 2];
    }


    cliffsRef.current.geometry = TerrainInstance.steepGeometry;
    cliffsRef.current.geometry.computeBoundingBox();

    
    for (var x = 0; x < cliffsRef.current.geometry.attributes.position.array.length; x += 3) {
      cliffColors.push(141 / 255, 148 / 255, 144 / 255);
      cliffUvs.push(
        (cliffsRef.current.geometry.attributes.position.array[x] - cliffsRef.current.geometry.boundingBox.min.x) / cliffsRef.current.geometry.boundingBox.max.x,
        (cliffsRef.current.geometry.attributes.position.array[x + 2] - cliffsRef.current.geometry.boundingBox.min.z) / cliffsRef.current.geometry.boundingBox.max.z
      );
    }


    cliffsRef.current.geometry.setAttribute('uv', new Float32BufferAttribute(cliffUvs, 2));
    cliffsRef.current.material.map = cliffTexture
    cliffsRef.current.geometry.attributes.position.needsUpdate = true

    grassesRef.current.geometry = TerrainInstance.otherGeometry;


    

    makeGrass()

    

    grassesRef.current.geometry.computeBoundingBox();
    grassesRef.current.geometry.computeBoundingSphere();
    grassesRef.current.geometry.computeVertexNormals();

    const oceanGeometry = new SphereGeometry(props.state.planet.radius, 11, 100);
    const planetOceanPositions = oceanGeometry.attributes.position.array;
    const planetOceanColors = [];

    for (var x = 0; x < planetOceanPositions.length; x += 3) {
      planetOceanColors.push(1, 1, 1);
    }


    oceanGeometry.setAttribute('color', new Float32BufferAttribute(planetOceanColors, 3));

    sphereRef.current.geometry = oceanGeometry;

    props.dispatch({ 
      type: 'LOAD_GROUND',
      surfaceGeometry: surfaceRef.current,
      planetGeometry: sphereRef.current,
      triangles
    });



  }, []);
  
  

  const planetCenter = useMemo(() => new Vector3(0, 0, 0), []);
  const seaLevel = useMemo(() => new Vector3(0, props.state.planet.radius, 0), []);
  const sphereColor = useMemo(() => 'white', []);
  const [lakeNodes, setLakeNodes] = useState([]);
  const waterNormalsTexture = useMemo(() => new TextureLoader().load("/waternormals.jpg"), [])
  const [addedWaterTexture, setAddedWaterTexture] = useState(false);


  const offSceneSpherePosition = useMemo(() => {
    return [0, -99999999, 0];
  }, []);
  const mossTexture = useMemo(() => new TextureLoader().load("/moss.jpg", (texture) => {
    texture.wrapS = RepeatWrapping
    texture.wrapT = RepeatWrapping
    texture.repeat.set(3, 3)
  }), []);
  const groundTexture = useMemo(() => new TextureLoader().load("/ground-0.jpg", (texture) => {
    texture.wrapS = RepeatWrapping
    texture.wrapT = RepeatWrapping
    texture.repeat.set(9, 9)
  }), []);


  return <>

    <mesh ref={sphereRef} position={offSceneSpherePosition}>
      <sphereGeometry args={[props.state.planet.radius, 11, 100]} />
      <meshBasicMaterial 
        opacity={0}
        transparent={true}
        side={DoubleSide}
        vertexColors={false}
      />
    </mesh>


    <mesh ref={surfaceRef} receiveShadow position={[0, props.state.planet.radius, 0]}>
      <planeGeometry />
      <meshStandardMaterial 
        side={DoubleSide}
        wireframe
      />
    </mesh>

    <mesh ref={cliffsRef} receiveShadow position={[0, props.state.planet.radius, 0]}>
      <planeGeometry />
      <meshStandardMaterial 
        opacity={1}
        side={DoubleSide}
        vertexColors={false}
      />
    </mesh>

    <mesh ref={grassesRef} receiveShadow position={[0, props.state.planet.radius, 0]}>
      <planeGeometry />
      <meshStandardMaterial 
        side={DoubleSide}
        color={new Color(0.5, 0.9, 0)}
        map={groundTexture}
      />
    </mesh>


    <instancedMesh ref={normalSphereRef} args={[null, null, 1000000]}>
      <sphereGeometry args={[3, 9, 9]} />
        <meshBasicMaterial 
          wireframe
          transparent
          opacity={0}
          color="red" />
    </instancedMesh>

  </>
}

export default Planet;