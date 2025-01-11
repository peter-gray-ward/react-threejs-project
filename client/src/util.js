import {
	Vector3,
	Quaternion,
	Group,
	ArrowHelper,
	Raycaster
} from 'three';


const planetCenter = new Vector3(0, 0, 0);

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

// export const coordsToVector3 = ({ radialDistance, polarAngle, azimuthalAngle }) => { 
// 	const x = radialDistance * Math.sin(polarAngle) * Math.cos(azimuthalAngle); 
// 	const y = radialDistance * Math.sin(polarAngle) * Math.sin(azimuthalAngle); 
// 	const z = radialDistance * Math.cos(polarAngle); 
// 	var vector = new Vector3(x, y, z);
// 	vector.add(planetCenter);
// 	return vector;
// }
export const coordsToVector3 = ({ radialDistance, polarAngle, azimuthalAngle, originalDirection, planetCenter }) => { // Step 1: Convert spherical to Cartesian coordinates 
	const x = radialDistance * Math.sin(polarAngle) * Math.cos(azimuthalAngle); 
	const y = radialDistance * Math.sin(polarAngle) * Math.sin(azimuthalAngle); 
	const z = radialDistance * Math.cos(polarAngle); var vector = new Vector3(x, y, z); vector.add(planetCenter); // Adjust for planet center // Step 2: Align with the original direction 
	const targetVector = vector.clone().normalize(); 
	const initialVector = new Vector3(0, 1, 0); // Assuming original "up" was y-axis 
	const rotationAxis = new Vector3().crossVectors(initialVector, originalDirection).normalize(); 
	const rotationAngle = Math.acos(initialVector.dot(originalDirection)); 
	const rotationQuaternion = new Quaternion().setFromAxisAngle(rotationAxis, rotationAngle); 
	vector.applyQuaternion(rotationQuaternion); 
	return vector; 
};

export const coordsToQuaternion = ({ initialVector, radialDistance, polarAngle, azimuthalAngle }) => { // Step 1: Convert spherical to Cartesian coordinates 
	const x = radialDistance * Math.sin(polarAngle) * Math.cos(azimuthalAngle); 
	const y = radialDistance * Math.sin(polarAngle) * Math.sin(azimuthalAngle); 
	const z = radialDistance * Math.cos(polarAngle); // Create a Vector3 from the calculated coordinates 
	const vector = new Vector3(x, y, z); // Step 2: Calculate the rotation angles and axis // Assuming that the orientation starts aligned with the x-axis 
	const targetVector = vector.clone().normalize(); // Direction vector 
	initialVector = new Vector3(0, 1, 0).normalize(); // Initial direction (aligned with x-axis) 
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


export const pointOnSphere = (center, radius, theta, phi, direction) => {
    const x = radius * Math.cos(theta) * Math.sin(phi); // Horizontal plane
	const z = radius * Math.sin(theta) * Math.sin(phi); // Horizontal plane
	const y = radius * Math.cos(theta);                // Vertical position


    const point = new Vector3(x, y, z);

    // Step 2: Apply rotation using the direction vector
    const defaultDirection = new Vector3(0, 1, 0); // Default "up" is y-axis
    const quaternion = new Quaternion();
    quaternion.setFromUnitVectors(defaultDirection, direction.clone().normalize()); // Rotate y-axis to match direction

    point.applyQuaternion(quaternion); // Rotate the point by the quaternion

    // Step 3: Translate the point to the sphere's center
    point.add(center);

    return point;
};


export const pointOnSphereBehindAndUp = (center, radius, forwardDirection, upOffset = 0.1) => {
    // Normalize the forward direction
    const forward = forwardDirection.clone().normalize();
    
    // Generate a random angle for rotation around the forward vector
    const theta = Math.PI; // Angle away from the forward direction
    const phi = Math.PI * 2; // Azimuthal angle

    // Calculate spherical coordinates relative to "behind" the forward direction
    const x = radius * Math.sin(theta) * Math.cos(phi);
    const y = radius * Math.sin(theta) * Math.sin(phi) + upOffset * radius; // Slightly "up"
    const z = -radius * Math.cos(theta); // Negative z for "behind"

    // Create the point
    const vector = new Vector3(x, y, z);

    // Rotate the point to align it with the actual forward direction
    vector.applyQuaternion(new Quaternion().setFromUnitVectors(new Vector3(0, 0, -1), forward));

    // Translate the point to the sphere's center
    vector.add(center);

    return vector;
};

export function randomInRange(from, to, randomSeed, startDistance = 0) {
   const min = Math.min(from, to) + startDistance;
   const max = Math.max(from, to) + startDistance;
   const val = (randomSeed || Math.random()) * (max - min) + min;
   return val;
}

export const spin180 = (quaternion, angle) => { 
	const upAxis = new Vector3(0, 1, 0); // The y-axis 
	const rotationAngle = angle || Math.PI; // Default to 180 degrees (π radians) 
	const rotationQuaternion = new Quaternion().setFromAxisAngle(upAxis, rotationAngle); 
	quaternion.multiply(rotationQuaternion);
	return quaternion;
};

export const rotateCameraOffset = (offset, theta) => {
    // Rotate around the X-axis (up/down arc)
    const xAxis = new Vector3(1, 0, 0); // Local X-axis for arc motion
    const rotationQuaternion = new Quaternion().setFromAxisAngle(xAxis, theta);
    return offset.clone().applyQuaternion(rotationQuaternion);
};

/**
 * Creates a visual representation of a quaternion.
 *
 * @param {Quaternion} quaternion - The quaternion to visualize.
 * @param {number} size - The length of the arrows (default: 1).
 * @param {number} arrowThickness - The thickness of the arrows (default: 0.1).
 * @returns {Group} A Three.js Group containing the arrows for visualization.
 */
var i = 0;
export function VisualizeQuaternion(quaternion, size = 1, arrowThickness = 0.1) {
    const group = new Group();

    // Base vectors representing the local axes
    const axes = {
        x: new Vector3(1, 0, 0), // Local X-axis
        y: new Vector3(0, 1, 0), // Local Y-axis
        z: new Vector3(0, 0, 1), // Local Z-axis
    };

    const transformedAxes = {
        x: axes.x.clone().applyQuaternion(quaternion).normalize(),
        y: axes.y.clone().applyQuaternion(quaternion).normalize(),
        z: axes.z.clone().applyQuaternion(quaternion).normalize(),
    };

    const xArrow = new ArrowHelper(transformedAxes.x, new Vector3(0, 0, 0), size, 0xff0000, size * arrowThickness, size * arrowThickness); // Red
    const yArrow = new ArrowHelper(transformedAxes.y, new Vector3(0, 0, 0), size, 0x00ff00, size * arrowThickness, size * arrowThickness); // Green
    const zArrow = new ArrowHelper(transformedAxes.z, new Vector3(0, 0, 0), size, 0x0000ff, size * arrowThickness, size * arrowThickness); // Blue

    // Add arrows to the group
    group.add(xArrow);
    group.add(yArrow);
    group.add(zArrow);

    return { quaternion, group }
}

export function findRayIntersection(modelPosition, objectCenter, objectMesh) {
    
    const stepDirection = new Vector3(0, 1, 0);
    const rayDirection = new Vector3().subVectors(objectCenter, modelPosition).normalize();
    const raycaster = new Raycaster();

    raycaster.set(modelPosition, rayDirection);

    let intersects = raycaster.intersectObject(objectMesh, true);
    let modelPositionUp = modelPosition.clone()
    let modelPositionDown = modelPosition.clone()

    try {
         var i = 0;
        while (intersects.length === 0) {
            // Move the ray origin slightly along the step direction
            modelPositionUp.add(rayDirection.negate().clone().multiplyScalar(0.05));

            raycaster.set(modelPositionUp, rayDirection);
            var upIntersects = raycaster.intersectObject(objectMesh, true);
            raycaster.set(modelPositionDown, rayDirection.negate());
            var downIntersects = raycaster.intersectObject(objectMesh, true);

            if (downIntersects.length) {
                intersects = downIntersects;
            } else if (upIntersects.length) {
                intersects = upIntersects;
            }

            if (i++ > 1000) {
                return null;
            }
        }

        if (!intersects || !intersects.length) {
            return null; // No intersection found
        }

    } catch (err) {
        console.error(err)
        debugger
    }
    // // Reduce floating-point drift in the intersection point
    // intersects[0].point.x = +intersects[0].point.x.toFixed(8);
    // intersects[0].point.y = +intersects[0].point.y.toFixed(8);
    // intersects[0].point.z = +intersects[0].point.z.toFixed(8);

    return intersects[0].point;
}


// Helper to check if a point is inside a triangle using barycentric coordinates
export function isPointInTriangle(p, a, b, c) {
    const area = (b.y - c.y) * (a.x - c.x) + (c.x - b.x) * (a.y - c.y);
    const w1 = ((b.y - c.y) * (p.x - c.x) + (c.x - b.x) * (p.y - c.y)) / area;
    const w2 = ((c.y - a.y) * (p.x - c.x) + (a.x - c.x) * (p.y - c.y)) / area;
    const w3 = 1 - w1 - w2;
    return w1 >= 0 && w2 >= 0 && w3 >= 0;
}
