import * as THREE from '../libs/three.module.js';
import { EffectComposer } from '../libs/EffectComposer.js';
import { RenderPass } from '../libs/RenderPass.js';
import { ShaderPass } from '../libs/ShaderPass.js';
import { BloomPass } from '../libs/BloomPass.js';
import { FilmPass } from '../libs/FilmPass.js';
import { FocusShader } from '../libs/FocusShader.js';
import { OBJLoader } from '../libs/OBJLoader.js';

let composer;
let mesh;
let parent;
let meshes = [];
let clonemeshes = [];
let clock = new THREE.Clock();

init();
animate();

function init() {
	let scene = new THREE.Scene();
	scene.background = new THREE.Color( 0x000104 );
	scene.fog = new THREE.FogExp2( 0x000104, 0.0000675 );

	let camera = new THREE.PerspectiveCamera( 
		9, 
		window.innerWidth / window.innerHeight, 
		1, 
		50000 );
	camera.position.set( 0, 700, 7000 );
	camera.lookAt( scene.position );

	let container = document.querySelector( '#scene' );
	let renderer = new THREE.WebGLRenderer();
	renderer.setPixelRatio( window.devicePixelRatio );
	renderer.setSize( window.innerWidth, window.innerHeight );
	renderer.autoClear = false;
	container.appendChild( renderer.domElement );

	let loader = new OBJLoader();
	loader.load( 'male02.obj',
		function ( object ) {
			const positions = combineBuffer( object, 'position' );
			createMesh( positions, scene, 4.05, - 500, - 350, 0, 0xe86400 );
		} 
	);
	loader.load( 'female02.obj',
		function ( object ) {
			const positions = combineBuffer( object, 'position' );
			createMesh( positions, scene, 4.05, - 600, - 350, 0, 0xe89600 );
			}
	);

	parent = new THREE.Object3D();
	scene.add( parent );
	
	let grid = new THREE.Points( 
		new THREE.PlaneBufferGeometry( 15000, 15000, 256, 256 ), 
		new THREE.PointsMaterial({ color: 0xc3dbe5, size: 30 }));
	grid.position.y = -400;
	grid.rotation.x = Math.PI / 2;

	let x = 0;
	let y = 0;
	let heartShape = new THREE.Shape();
	heartShape.moveTo( x + 5, y + 5 );
	heartShape.bezierCurveTo( x + 5, y + 5, x + 4, y, x, y );
	heartShape.bezierCurveTo( x - 6, y, x - 6, y + 7,x - 6, y + 7 );
	heartShape.bezierCurveTo( x - 6, y + 11, x - 3, y + 15.4, x + 5, y + 19 );
	heartShape.bezierCurveTo( x + 12, y + 15.4, x + 16, y + 11, x + 16, y + 7 );
	heartShape.bezierCurveTo( x + 16, y + 7, x + 16, y, x + 10, y );
	heartShape.bezierCurveTo( x + 7, y, x + 5, y + 5, x + 5, y + 5 );
	let extrudeSettings = {
		steps: 0,
		depth: 0,
		bevelEnabled: true,
		bevelThickness: 15,
		bevelSize: 3,
		bevelOffset: 0,
		bevelSegments: 100,
		curveSegments: 100 };
	let heartGeom = new THREE.ExtrudeBufferGeometry( heartShape, extrudeSettings );
	let heartMaterial = new THREE.PointsMaterial({ 
		color: 0xe400e8,
		side: THREE.DoubleSide,
		size: 0.1 });
	let heart = new THREE.Points( heartGeom, heartMaterial ) ;
	heart.position.set( -650, 400, -130 );
	heart.rotation.z = -3;
	heart.scale.set( 38, 38, 38 );

	parent.add(
		grid,
		heart );
	// postprocessing
	let renderModel = new RenderPass( scene, camera );
	let effectBloom = new BloomPass( 0.75 );
	let effectFilm = new FilmPass( 0.5, 0.5, 1448, false );
	let effectFocus = new ShaderPass( FocusShader );
	effectFocus.uniforms[ "screenWidth" ].value = window.innerWidth * window.devicePixelRatio;
	effectFocus.uniforms[ "screenHeight" ].value = window.innerHeight * window.devicePixelRatio;
	composer = new EffectComposer( renderer );
	composer.addPass( renderModel );
	composer.addPass( effectBloom );
	composer.addPass( effectFilm );
	composer.addPass( effectFocus );

	window.addEventListener( 'resize', onWindowResize, false );
}
function onWindowResize() {
	camera.aspect = window.innerWidth / window.innerHeight;
	camera.updateProjectionMatrix();
	camera.lookAt( scene.position );
	renderer.setSize( window.innerWidth, window.innerHeight );
	composer.setSize( window.innerWidth, window.innerHeight );
	effectFocus.uniforms[ "screenWidth" ].value = window.innerWidth * window.devicePixelRatio;
	effectFocus.uniforms[ "screenHeight" ].value = window.innerHeight * window.devicePixelRatio;
}
function combineBuffer( model, bufferName ) {
	let count = 0;
	model.traverse( function ( child ) {
		if ( child.isMesh ) {
			let buffer = child.geometry.attributes[ bufferName ];
			count += buffer.array.length;
		}
	} );
	let combined = new Float32Array( count );
	let offset = 0;
	model.traverse( function ( child ) {
		if ( child.isMesh ) {
			let buffer = child.geometry.attributes[ bufferName ];
			combined.set( buffer.array, offset );
			offset += buffer.array.length;
		}
	} );
	return new THREE.BufferAttribute( combined, 3 );
}
function createMesh( positions, scene, scale, x, y, z, color ) {
	let geometry = new THREE.BufferGeometry();
	geometry.setAttribute( 'position', positions.clone() );
	geometry.setAttribute( 'initialPosition', positions.clone() );
	geometry.attributes.position.setUsage( THREE.DynamicDrawUsage );
	let clones = [
		[ 5000, 0, - 3000 ],
		[ 4000, 0, 0 ],
		[ 1000, 0, 4000 ],
		[ 1000, 0, - 5000 ],
		[ 4000, 0, 2000 ],
		[ 900, 0, - 900 ],
		[ 800, 0, 800 ],
		[ -900, 0, - 500 ],
		[ -2000, 0, 300 ],
		[ - 4000, 0, 1000 ],
		[ - 5000, 0, - 5000 ],
		[ 0, 0, 0 ]
	];
	for ( let i = 0; i < clones.length; i ++ ) {
		let c = ( i < clones.length - 1 ) ? 0x4500d1 : color;
		mesh = new THREE.Points( geometry, new THREE.PointsMaterial( { size: 20, color: c } ) );
		mesh.scale.x = mesh.scale.y = mesh.scale.z = scale;
		mesh.position.x = x + clones[ i ][ 0 ];
		mesh.position.y = y + clones[ i ][ 1 ];
		mesh.position.z = z + clones[ i ][ 2 ];
		parent.add( mesh );
		clonemeshes.push( { mesh: mesh, speed: 0.03 + Math.random() } );
	}
	meshes.push({
		mesh: mesh, verticesDown: 0, verticesUp: 0, direction: 0, speed: 15, delay: Math.floor( 200 + 200 * Math.random() ),
		start: Math.floor( 500 + 200 * Math.random() ),
	});
}
function animate() {
	requestAnimationFrame( animate );
	render();
}
function render() {
	let delta = 10 * clock.getDelta();
	delta = delta < 2 ? delta : 2;
	parent.rotation.y += - 0.005 * delta;

	for ( let j = 0; j < meshes.length; j ++ ) {
		let data = meshes[ j ];
		let positions = data.mesh.geometry.attributes.position;
		let initialPositions = data.mesh.geometry.attributes.initialPosition;
		let count = positions.count;
		if ( data.start > 0 ) {
			data.start -= 1;
		} else {
				if ( data.direction === 0 ) {
					data.direction = - 1;
				}
		}
		for ( let i = 0; i < count; i ++ ) {
			let px = positions.getX( i );
			let py = positions.getY( i );
			let pz = positions.getZ( i );
			// falling down
			if ( data.direction < 0 ) {
				if ( py > 0 ) {
					positions.setXYZ(
						i,
						px + 1.5 * ( 0.30 - Math.random() ) * data.speed * delta,
						py + 3.0 * ( 0.35 - Math.random() ) * data.speed * delta,
						pz + 1.5 * ( 0.30 - Math.random() ) * data.speed * delta
					);
				} else {
					data.verticesDown += 1;
				}
			}
			// rising up
			if ( data.direction > 0 ) {
				let ix = initialPositions.getX( i );
				let iy = initialPositions.getY( i );
				let iz = initialPositions.getZ( i );
				let dx = Math.abs( px - ix );
				let dy = Math.abs( py - iy );
				let dz = Math.abs( pz - iz );
				let d = dx + dy + dx;
				if ( d > 1 ) {
					positions.setXYZ(
						i,
						px - ( px - ix ) / dx * data.speed * delta * ( 0.85 - Math.random() ),
						py - ( py - iy ) / dy * data.speed * delta * ( 0.95 + Math.random() ),
						pz - ( pz - iz ) / dz * data.speed * delta * ( 0.85 - Math.random() )
					);
				} else {
					data.verticesUp += 1;
				}
			}
		}
		// all vertices down
		if ( data.verticesDown >= count ) {
			if ( data.delay <= 0 ) {
				data.direction = 1;
				data.speed = 2;
				data.verticesDown = 0;
				data.delay = 120;
			} else {
				data.delay -= 1;
			}
		}
		// all vertices up
		if ( data.verticesUp >= count ) {
			if ( data.delay <= 0 ) {
				data.direction = - 1;
				data.speed = 2;
				data.verticesUp = 0;
				data.delay = 120;
			} else {
				data.delay -= 1;
			}
		}
		positions.needsUpdate = true;
	}
	composer.render( 0.01 );
}