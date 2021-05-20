import './three.min.js'

import {vec3} from './threeCustom.js'
import { RoomEnvironment } from './RoomEnvironment.js';
export {vec3}

export const PI=Math.PI,
	geometry=new THREE.IcosahedronGeometry(.45),
	r=geometry.vertices[1].clone().sub(geometry.vertices[0]).length()/1.95,
	material=new THREE.MeshStandardMaterial({roughness: .2, metalness: .1, color: '#78f'}),
	balls=new THREE.Group,
	satellites=new THREE.Group,
	hLight=new THREE.HemisphereLight('#fff', 0, .3),

	scene=new THREE.Scene(),
	canvases = document.querySelectorAll('canvas.balls'),
	ctx=[],

	renderer = new THREE.WebGLRenderer( {alpha:true, antialias: true, canvas: window.OffscreenCanvas && new OffscreenCanvas(1,1)} ),
	camera=new THREE.PerspectiveCamera( 20, 1, .1, 100 ),
	camPos0=vec3(0,3,5);

canvases.forEach(canvas=>{ctx.push(canvas.getContext('2d'))});
hLight.position.set(1,1,0);

scene.environment = new THREE.PMREMGenerator(renderer).fromScene(new RoomEnvironment(), .05).texture;

scene.add(balls, satellites, hLight);
balls.rotation.x=-.4;//set( 3.3,0.2,0);
satellites.rotation.set( 6, -.3,0);

geometry.vertices.forEach(v=>{
	const ball=new THREE.Mesh(new THREE.IcosahedronGeometry(r,3), material);
	ball.position.copy(v);
	balls.add(ball);
})
for (var i = 0; i < 3; i++) {
	const ball=new THREE.Mesh(new THREE.IcosahedronGeometry(r/2,3), material);
	ball.position.z=.8;
	ball._axis=vec3(1,0,0).rotate(0, 0, PI*2/3*i);
	ball.position.applyAxisAngle(ball._axis, PI*2/3*i);
	satellites.add(ball);
}

let t0 = performance.now(), t=0, dMax = 80, dMin = 1000/60, camAxis=vec3(1,0,0), w0=0, bias=[], test=new THREE.Vector4();

//renderer.autoClear = false;
renderer.setAnimationLoop(function fn(){
	if (!scene) return;
	let t1 = performance.now(),
	 dt = Math.min(t1-t0, dMax);
	//if (dt<dMin) return; // !Eh || 
	t0 = t1;
	t+=dt;
	satellites.children.forEach(ball=>{
		ball.position.applyAxisAngle(ball._axis, -dt*.003)
	})
	balls.rotateY(-dt*.0005);
	balls.position.y=.1*Math.sin(t*.0017);
	balls.position.z=-balls.position.y*.4;

	if (renderer.getPixelRatio()!=devicePixelRatio) renderer.setPixelRatio(devicePixelRatio);

	renderer.domElement.transferControlToOffscreen?.();
	canvases.forEach((canvas, i)=>{
		const rect = canvas.getBoundingClientRect();
		if (rect.top>innerHeight || rect.bottom<0) return;
		if (w0 < rect.width) {
			renderer.setSize(w0=rect.width, w0, false);
		}
			renderer.setViewport(0, w0-rect.width, rect.width, rect.width)
		if (canvas.width!=renderer.getCurrentViewport(test).z || canvas.height!=test.w) {
			canvas.width=canvas.height=test.z;
		}

		let bias0=-(rect.top+rect.height-innerHeight/2)/innerHeight;
		bias[i]=Math.lerp(bias[i]||bias0, bias0, dt*.01)
		camera.position.copy(camPos0).applyAxisAngle(camAxis, bias[i]);
		canvas.style.transform=`translateY(${-bias[i]*20}%)`;
		camera.lookAt(0,0,0);

		renderer.render(scene, camera);

		ctx[i].clearRect(0, 0, canvas.width, canvas.height);
		ctx[i].drawImage(renderer.domElementtransferToImageBitmap?.() || renderer.domElement, 0, 0)
	})
})
//addEventListener('resize', e=>{w0=0})