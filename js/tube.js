export let camera, scene, renderer,
	canvas = document.querySelector('canvas.renderer');
export let geometry, material, mesh, light, light1, hLight;

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

		scene.traverse(el=>{
			if (!el.isMesh) return;
			el.geometry.computeVertexNormalsFine();
			let ma=el.material;
			ma.flatShading=false;
			if (ma.name=='Material') {
				ma.color.multiplyScalar(1.4);
				ma.roughness=.4;
			}
		})

		let tube=window.tube=scene.getObjectByName('Cylinder'),
			m0=tube.material;
		let m1=new THREE.MeshPhysicalMaterial();
		m1.color=m0.color;
		m1.roughness=.8;
		m1.metalness=.03;
		m1.transmission=1;
		m1.transparent=true;
		m1.side=THREE.DoubleSide;
		m0.flatShading=false;
		console.log(m0);
		tube.material=m1;
		tube.geometry.computeVertexNormalsFine();

		light = scene.getObjectByName('Sun_Orientation');
		light.intensity=.3;
		light.rotation.y=-.95;

		light1 = scene.getObjectByName('Sun001_Orientation');
		light1.intensity=4;
		light1.rotation.set(-1.47, 0.45, 0);
		//light.rotation.x=-1.07;

		scene.add(hLight=new THREE.HemisphereLight('#adf', '#fff', 3));
		hLight.groundColor.multiplyScalar(-1);
		hLight.position.set(1,1,3)

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
