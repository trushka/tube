export let camera, scene, renderer,
	canvas = document.querySelector('canvas.renderer');
export let geometry, material, mesh, light, light1, hLight, 
	rings=[], ringMatireal, tube;

import './three.min.js';
import './GLTFLoader.js';
import {vec3} from './threeCustom.js';

init();

function init() {

	new THREE.GLTFLoader().load('tube.glb', function(obj){
console.log(obj);

		camera = obj.cameras[0];
		camera.parent.position.y=11;
		camera.lookAt(0,0,0);

		scene = obj.scene;
		scene.getObjectByName('Plane001').visible=false;

		scene.traverse(el=>{
			if (!el.isMesh) return;
			el.geometry.computeVertexNormalsFine();
			let ma=el.material;
			ma.flatShading=false;
			if (ma.name=='Material') {
				rings.push(el);
				if (!ringMatireal) ringMatireal = new THREE.MeshPhongMaterial({
					color: ma.color.multiplyScalar(.2),
					shininess: 60
					//specular: '#666'
				});
				el.material = ringMatireal;
				ma.roughness=.4;
			};
			if (el.name=='Cylinder') {
				tube=el;
				let m1=new THREE.MeshPhysicalMaterial();
				m1.color=ma.color;
				m1.roughness=.8;
				m1.metalness=.03;
				m1.transmission=1;
				m1.transparent=true;
				m1.side=THREE.DoubleSide;
				//ma.flatShading=false;
				tube.material=m1;
				tube.geometry.computeVertexNormalsFine();
			};
		})


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
