// BackgroundHills.jsx
import * as THREE from "three";
import { useMemo } from "react";

function makeHillShape({
  width = 1200,
  height = 180,
  undulations = 4,
  amp = 60,
  seed = 0,
}) {
  // Simple seeded PRNG so each layer is stable between renders
  let s = seed || 1;
  const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647;

  const shape = new THREE.Shape();
  const half = width / 2;

  // start at left base
  shape.moveTo(-half, 0);

  // build a wavy ridge using quadratic curves
  const steps = undulations * 2;
  for (let i = 1; i <= steps; i++) {
    const t = i / steps;
    const x = THREE.MathUtils.lerp(-half, half, t);
    // base ridge height (gentle big hill) + smaller wiggles
    const base = Math.sin(t * Math.PI) * height;
    const wiggle = 0//(Math.sin(t * Math.PI * 2 + rnd() * Math.PI * 2) * amp) / 2;
    const y = Math.max(8, base + wiggle);
    // control point halfway between previous and current
    const px = THREE.MathUtils.lerp(-half, x, 0.5);
    const py = Math.max(6, Math.sin((t - 0.5 / steps) * Math.PI) * height + wiggle * 0.6);
    shape.quadraticCurveTo(px, py, x, y);
  }

  // close to the base to make a filled silhouette
  shape.lineTo(half, -80);
  shape.lineTo(-half, -80);
  shape.closePath();

  return shape;
}

export default function BackgroundHills({
  size = 350,          // your terrain size (square)
  margin = 70,         // gap from terrain edge
  layersPerSide = 4,   // how many silhouettes per side
  colors = [
    "#F4E5B6", // pale sand
    "#E9D58D", // wheat
    "#C7D8A5", // sage
    "#9FBF96", // pickle
    "#7FA7A6", // teal-grey
  ],
  altitude
}) {
  // Prebuild hill geometries per “depth” layer
  const layerData = useMemo(() => {
    const arr = [];
    for (let i = 0; i < layersPerSide; i++) {
      const depth = i; // 0 is nearest
      const width = 120 + i * 120;
      const height = i * 1;
      const amp = 50 + i * 8;
      const und = 3 + (i % 2);
      const shape = makeHillShape({
        width,
        height,
        undulations: und,
        amp,
        seed: 101 + i * 97,
      });
      const geom = new THREE.ShapeGeometry(shape, 64);
      const color = colors[Math.min(i, colors.length - 1)];
      const opacity = THREE.MathUtils.clamp(0.82 - i * 0.14, 0.32, 0.9);
      arr.push({ geom, color, opacity, width });
    }
    return arr;
  }, [layersPerSide, colors]);

  // Positions for four sides that “surround” the square terrain
  const half = size / 2;
  const offset = half;

  const sides = [
    { name: "north", pos: [0, 0,  offset], rotY: 0 },
    { name: "south", pos: [0, 0, -offset], rotY: Math.PI },
    { name: "east",  pos: [ offset, 0, 0], rotY: -Math.PI / 2 },
    { name: "west",  pos: [-offset, 0, 0], rotY:  Math.PI / 2 },
  ];

  return (
    <group name="BackgroundHills">
      {/* Soft sky card behind everything */}
     {/* <mesh
        name="sky"
        position={[0, altitude, -offset - 1]} // behind north side
        rotation={[0, 0, 0]}
      >
        <planeGeometry args={[1000, 1400]} />
        <meshBasicMaterial color="#CFE7FF" depthWrite={false} />
      </mesh>
*/}
      {/* Four sides */}
      {sides.map((side, sIdx) => (
        <group
          key={side.name}
          position={side.pos}
          rotation={[0, side.rotY, 0]}
        >
          {layerData.map((layer, i) => (
            <mesh
              key={`${side.name}-layer-${i}`}
              geometry={layer.geom}
              position={[0, altitude + 40 + i * 18, -i * 4]} // slight z offset for sorting
            >
              <meshBasicMaterial
                // color={layer.color}
                transparent={false}
                // opacity={layer.opacity}
                depthTest
                depthWrite={false}
                map={new THREE.TextureLoader().load("/cloud-2421760.png")}
                side={THREE.DoubleSide}
              />
            </mesh>
          ))}
        </group>
      ))}
    </group>
  );
}
