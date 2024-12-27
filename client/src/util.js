import {
	Vector3,
	Quaternion
} from 'three';

const planetCenter = new Vector3(0, -129, 0);

export const coords = object => {
	const objectPosition = object.position.clone().sub(planetCenter);
	const radialDistance = objectPosition.length();
	const azimuthalAngle = Math.atan2(
			objectPosition.y,
			objectPosition.x
		)
	return {
		radialDistance,
		polarAngle: Math.acos(
			objectPosition.z /
			radialDistance
		),
		azimuthalAngle
	}
}

export const coordsToVector3 = ({ radialDistance, polarAngle, azimuthalAngle }) => { 
	const x = radialDistance * Math.sin(polarAngle) * Math.cos(azimuthalAngle); 
	const y = radialDistance * Math.sin(polarAngle) * Math.sin(azimuthalAngle); 
	const z = radialDistance * Math.cos(polarAngle); 
	var vector = new Vector3(x, y, z);
	vector.add(planetCenter);
	return vector;
}

export const coordsToQuaternion = ({ radialDistance, polarAngle, azimuthalAngle }) => { // Step 1: Convert spherical to Cartesian coordinates 
	const x = radialDistance * Math.sin(polarAngle) * Math.cos(azimuthalAngle); 
	const y = radialDistance * Math.sin(polarAngle) * Math.sin(azimuthalAngle); 
	const z = radialDistance * Math.cos(polarAngle); // Create a Vector3 from the calculated coordinates 
	const vector = new Vector3(x, y, z); // Step 2: Calculate the rotation angles and axis // Assuming that the orientation starts aligned with the x-axis 
	const targetVector = vector.clone().normalize(); // Direction vector 
	const initialVector = new Vector3(0, 1, 0); // Initial direction (aligned with x-axis) 
	const rotationAxis = new Vector3().crossVectors(initialVector, targetVector).normalize(); 
	const rotationAngle = Math.acos(initialVector.dot(targetVector)); // Step 3: Convert to a quaternion 
	const quaternion = new Quaternion().setFromAxisAngle(rotationAxis, rotationAngle); 
	return quaternion;
};

export const getUpAndBackwardVector = (modelScene) => { // Step 1: Get the model's position and quaternion 
	const modelPosition = modelScene.position.clone(); 
	const modelQuaternion = modelScene.quaternion.clone(); // Step 2: Calculate the "up" vector using the quaternion 
	const upVector = new Vector3(0, 1, 0).applyQuaternion(modelQuaternion); // Step 3: Calculate the "backward" vector using the quaternion 
	const forwardVector = new Vector3(0, 0, 1).applyQuaternion(modelQuaternion); 
	forwardVector.add(modelPosition)
	const backwardVector = forwardVector; // Step 4: Combine "up" and "backward" vectors 
	const upAndBackwardVector = upVector.add(backwardVector).normalize(); 
	return { upVector, backwardVector, upAndBackwardVector }; 
};

export const moveObjectAlongGlobe = (object, normalizedDistanceVector) => {
	const coodinates = coords(object);

}

export const child = (scene, name) => {
	for (var child of scene.children) {
		if (child.name == name) {
			return child;
		}
	}
	return null;
}


export const pointOnSphere = (center, radius) => {
	const theta = Math.acos(2 * Math.random() - 1); 
	const phi = 2 * Math.PI * Math.random(); 
	const x = radius * Math.sin(theta) * Math.cos(phi); 
	const y = radius * Math.sin(theta) * Math.sin(phi); 
	const z = radius * Math.cos(theta);
	const vector = new Vector3(x, y, z);
	vector.add(center);
	return vector;
}
