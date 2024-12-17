import { useEffect } from 'react';

export const useSceneSetup = () => {
	useEffect(() => {
		console.log("Scene initialized!");

		return () = > {
			console.log("Cleanup scene.");
		}
	}, []);
};