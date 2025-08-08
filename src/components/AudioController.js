import { useMemo, useRef, useEffect } from 'react'

export default function AudioController(props) {
	var genericMeadowMusic = useMemo(() => '/Relaxing Nature Ambience Meditation 🌼 8h GOOD MORNING SPRING NATURE THERAPY🌷 Meadow Healing Sounds.mp3', []);
	// var genericMeadowMusic = useMemo(() => '/Castle_Outskirts_Music_Atmosphere.mp3', []);
	
	var genericMeadowMusicRef = useRef();
	var gameMusicRef = useRef();

	var start = props.start;

	useEffect(() => {
		if (start) {
			if (props.play.genericMeadowMusic) {
				if (genericMeadowMusicRef.current) {
					genericMeadowMusicRef.current.play()
				}
			}
		}
	}, [genericMeadowMusicRef, gameMusicRef, start, props.play]);
	
	return <>
		<audio ref={genericMeadowMusicRef} src={genericMeadowMusic} controls></audio>
	</>
}