let camera, scene, renderer,
	canvas = document.querySelector('canvas.renderer');
let geometry, material, mesh;

import {} from './three.min.js';
import {} from './GLTFLoader.js';
import {vec3} from './threeCustom.js';

init();

function init() {

	new THREE.GLTFLoader().load('tube.glb', function(obj){
console.log(obj);

		camera = obj.cameras[0];

		scene = obj.scene;
		scene.getObjectByName('Plane001').visible=false;

		let tube=window.tube=scene.getObjectByName('Cylinder'),
			m0=tube.material,
			m1=new THREE.MeshPhysicalMaterial(m0);
			m1.type='MeshPhysicalMaterial';
		tube.material=m1;

		requestAnimationFrame(animate);

		(window.onresize = function () {
			renderer.setPixelRatio( window.devicePixelRatio );
			renderer.setSize( canvas.offsetWidth, canvas.offsetHeight, false );
			camera.aspect = canvas.width / canvas.height;
			camera.zoom=Math.min(1, camera.aspect);
			camera.updateProjectionMatrix();
		} )();

	});

	renderer = new THREE.WebGLRenderer( {alpha:true, antialias: true, canvas:canvas} );

}

function animate() {

	requestAnimationFrame( animate );

	//mesh.rotation.x += 0.01;
	//mesh.rotation.y += 0.02;

	renderer.render( scene, camera );

}
