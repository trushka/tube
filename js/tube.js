export let camera, scene, renderer,
	canvas = document.querySelector('canvas.renderer');
export let geometry, material, mesh, light, hLight;

import './three.min.js';
import './GLTFLoader.js';
import {vec3} from './threeCustom.js';

init();

function init() {

	new THREE.GLTFLoader().load('tube.glb', function(obj){
console.log(obj);

		camera = obj.cameras[0];

		scene = obj.scene;
		scene.getObjectByName('Plane001').visible=false;

		let tube=window.tube=scene.getObjectByName('Cylinder'),
			m0=tube.material;
		let m1=new THREE.MeshPhysicalMaterial();
		m1.color=m0.color;
		m1.roughness=.7;
		m1.metalness=.34;
		m1.transmission=1;
		m1.opacity=.7;
		m1.transparent=true;
		m1.side=THREE.DoubleSide;
		m0.flatShading=false;
		console.log(m0);
		tube.material=m1;
		tube.geometry.computeVertexNormalsFine();

		light = scene.getObjectByName('Sun_Orientation');
		light.rotation.x=-1.07;
		
		scene.add(hLight=new THREE.HemisphereLight('#adf', '#fff', 3));
		hLight.groundColor.multiplyScalar(-1);
		hLight

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
