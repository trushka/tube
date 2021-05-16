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
	canvas = document.querySelector('canvas.balls'),
	cashed=Object.assign({dpr: devicePixelRatio}, canvas.getBoundingClientRect()),

	renderer = new THREE.WebGLRenderer( {alpha:true, antialias: true, canvas:canvas} ),
	camera=new THREE.PerspectiveCamera( 20, 1, .1, 100 ),
	camPos0=vec3(0,3,5),

	cubeRenderTarget = new THREE.WebGLCubeRenderTarget( 512, {
	 format: THREE.RGBAFormat,
	 generateMipmaps: true,
	 minFilter: THREE.LinearMipmapLinearFilter,
	 type: THREE.FloatType,
	 //encoding: THREE.GammaEncoding
	} ),
	cubeCamera = new THREE.CubeCamera( 1, 100000, cubeRenderTarget ),
	bgScene=new RoomEnvironment();

console.log(renderer.capabilities.isWebGL2);

bgScene.add( cubeCamera );
cubeCamera.update( renderer, bgScene );
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

let t0 = performance.now(), t=0, dMax = 80, dMin = 1000/60, camAxis=vec3(1,0,0), y0, bias;

renderer.setAnimationLoop(function(){
	if (!scene) return;
	let t1 = performance.now(),
	 dt = Math.min(t1-t0, dMax);
	//if (dt<dMin) return; // !Eh || 
	t0 = t1;
	t+=dt;
	if (cashed.dpr!=devicePixelRatio) renderer.setPixelRatio(cashed.dpr=devicePixelRatio);
	const rect = canvas.getBoundingClientRect();
	if (rect.top>innerHeight || rect.bottom<0) return
	if (cashed.width!=rect.width) {
		renderer.setSize(cashed.w=rect.width, cashed.h=rect.height, false);
		//camera.updateProjectionMatrix();
	}
	satellites.children.forEach(ball=>{
		ball.position.applyAxisAngle(ball._axis, -dt*.003)
	})
	balls.rotateY(-dt*.0005);
	let bias0=-(rect.top+rect.height-innerHeight/2)/innerHeight;
	bias=Math.lerp(bias||bias0, bias0, dt*.01)
	camera.position.copy(camPos0).applyAxisAngle(camAxis, bias);
	canvas.style.transform=`translateY(${-bias*20}%)`;
	camera.lookAt(0,0,0);
	balls.position.y=.1*Math.sin(t*.0017);
	balls.position.z=-balls.position.y*.4
	renderer.render(scene, camera)
	//console.log('r')
})