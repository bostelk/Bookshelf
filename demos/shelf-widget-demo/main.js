import * as THREE from 'three';


const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );

const renderer = new THREE.WebGLRenderer();
renderer.setSize( window.innerWidth, window.innerHeight );
document.body.appendChild( renderer.domElement );

const geometry = new THREE.BoxGeometry( 1, 10, 5 );

var images = [
"IMG_9608-rotated-3_crop_1.jpg",
"IMG_9608-rotated-3_crop_10.jpg",
"IMG_9608-rotated-3_crop_11.jpg",
"IMG_9608-rotated-3_crop_12.jpg",
"IMG_9608-rotated-3_crop_13.jpg",
"IMG_9608-rotated-3_crop_14.jpg",
"IMG_9608-rotated-3_crop_15.jpg",
"IMG_9608-rotated-3_crop_16.jpg",
"IMG_9608-rotated-3_crop_17.jpg",
"IMG_9608-rotated-3_crop_18.jpg",
"IMG_9608-rotated-3_crop_19.jpg",
"IMG_9608-rotated-3_crop_2.jpg",
"IMG_9608-rotated-3_crop_20.jpg",
"IMG_9608-rotated-3_crop_21.jpg",
"IMG_9608-rotated-3_crop_22.jpg",
"IMG_9608-rotated-3_crop_23.jpg",
"IMG_9608-rotated-3_crop_24.jpg",
"IMG_9608-rotated-3_crop_25.jpg",
"IMG_9608-rotated-3_crop_26.jpg",
"IMG_9608-rotated-3_crop_27.jpg",
"IMG_9608-rotated-3_crop_3.jpg",
"IMG_9608-rotated-3_crop_4.jpg",
"IMG_9608-rotated-3_crop_5.jpg",
"IMG_9608-rotated-3_crop_6.jpg",
"IMG_9608-rotated-3_crop_7.jpg",
"IMG_9608-rotated-3_crop_8.jpg",
"IMG_9608-rotated-3_crop_9.jpg",
];


var cubes = []
for(var i = 0; i < images.length; i++) {
	const loader = new THREE.TextureLoader();
	const texture = loader.load( images[i] );
	texture.colorSpace = THREE.SRGBColorSpace;

	const material = new THREE.MeshBasicMaterial({
	  color: 0xFFFFFF,
	  map: texture,
	});

	const cube = new THREE.Mesh( geometry, material );
	cube.position.set( i, 0, 0 );
	scene.add( cube );

	cubes.push(cube)
}

camera.position.x = images.length / 2;
camera.position.z = 22;

const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();

function onPointerMove( event ) {

	// calculate pointer position in normalized device coordinates
	// (-1 to +1) for both components

	pointer.x = ( event.clientX / window.innerWidth ) * 2 - 1;
	pointer.y = - ( event.clientY / window.innerHeight ) * 2 + 1;

}

function render() {


}

window.addEventListener( 'pointermove', onPointerMove );
//window.requestAnimationFrame(render);

function animate() {

	// update the picking ray with the camera and pointer position
	raycaster.setFromCamera( pointer, camera );

	// calculate objects intersecting the picking ray
	const intersects = raycaster.intersectObjects( scene.children );

	for ( let i = 0; i < cubes.length; i ++ ) {
		cubes[i].material.color.set(0xffffff);	
		cubes[ i ].rotation.set(0,0,0);

		let p = cubes[ i ].position;
		cubes[ i ].position.set(p.x,p.y,0)
	}
	
	for ( let i = 0; i < intersects.length; i ++ ) {
		intersects[ i ].object.material.color.set( .8,.8,.8 );
		intersects[ i ].object.rotation.set(Math.PI /10,0,0);
		let p = intersects[ i ].object.position;
		intersects[ i ].object.position.set(p.x,p.y,2)
		//intersects[ i ].object.rotation.set(new THREE.Vector3( Math.PI / 4,0,0));		
		break;
	}

	renderer.render( scene, camera );
}
renderer.setAnimationLoop( animate );
