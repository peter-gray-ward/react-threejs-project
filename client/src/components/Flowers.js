import {
  TubeGeometry,
  MeshBasicMaterial,
  Vector3,
  Curve
} from 'three';
import {
  useRef
} from 'react';


function CustomSinCurve(length) {
  // Define a custom curve for the TubeGeometry
  this.length = length;
}
CustomSinCurve.prototype = Object.create(Curve.prototype);
CustomSinCurve.prototype.constructor = CustomSinCurve;
CustomSinCurve.prototype.getPoint = function (t) {
  const tx = t * this.length;
  const ty = Math.sin(2 * Math.PI * t) * 2; // Sine wave pattern
  const tz = 0;
  return new Vector3(tx, ty, tz);
};

export default function Flowers(props) {
  const flowersRef = useRef();

  // Custom geometry and material
  const path = new CustomSinCurve(10);
  const geometry = new TubeGeometry(path, 20, 2, 8, false);
  const material = new MeshBasicMaterial({ color: 0x00ff00 });

  return (
    <instancedMesh
      ref={flowersRef}
      args={[geometry, material, 10]} // Specify 10 instances
      receiveShadow
      position={[0, props.state.planet.radius, 0]}
      rotation={[Math.PI / 2, 0, 0]}
    />
  );
}