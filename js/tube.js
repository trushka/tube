export let camera, scene, renderer,
	canvas = document.querySelector('canvas.renderer');
export let geometry, material, mesh,
	light, light1, hLight, 
	rings=[], ringMatireal, tube, effect,
	particles, pMaterial,
	Anim = {
		stage: 0,
		step: function(stage, cond) {
			if (this.stage!=stage-1) return false;
			if (cond) ++this.stage;// console.log('stage:', )
			return cond;
		}
	};

const resolution = 30, isolation = 40, subtract = 3, strength=1.82, pCount=80, pSize=.2,
	maxBlobs = 20, speed = 3/5000, delta=.15, amplitude = 1.1, roV = [.00046, -.00025], PI=Math.PI;
var t0 = performance.now(), dMax = 80, dMin = 1000/60, dT = 1000/50, time=0,
	targGeometrys=[new THREE.TetrahedronGeometry() ],//, new THREE.OctahedronGeometry(.6)
	blobs = [new Float32Array(maxBlobs * 3), new Float32Array(maxBlobs*3), new Float32Array(maxBlobs)],
	weights = [63,14,-120];

import './three.min.js';
import './GLTFLoader.js';
import './MetaBalls.js';
import {vec3} from './threeCustom.js'; export {vec3};
import {geometries} from './geometries.js'; export {geometries};

init();

function createPos() {
	return vec3(Math.randFloat(0, 5), 0, 18).rotate(0, 0, Math.random()*Math.PI*2)
}
function init() {

	new THREE.GLTFLoader().load('tube.glb', function(obj){
		camera = obj.cameras[0];
		camera.parent.position.y=11;
		camera.lookAt(0,0,0);
		camera.near=2;
		camera.far=50;
		camera.updateProjectionMatrix()

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
				tube.updateMatrix();
				particles.position.copy(tube.position);
				tube.geometry.applyMatrix4(tube.matrix);
				tube.position.set(0,0,0);
				tube.rotation.set(0,0,0);
			};
		})

		// generate particles

		scene.add(particles);
		let inp=document.createElement('input');
		inp.style.cssText='position:absolute; width:50%';
		//document.body.append(inp);
		inp.step=.001; inp.max=1; inp.type='range';

		for (let i = 0; i < 500; i++) {
			let pos;
			for (let n = 0; n < 18000; n++) {
				(pos=createPos().multiplyScalar(Math.random())).z+=2;
				if (!particles.children.some(el=>el.position.distanceTo(pos)<.2+pos.z*.1)) break;
				pos=0;
			}
			if (!pos) break;
			let particle=new THREE.Mesh(geometries[Math.randInt(0,3)], pMaterial);
			particle.position.copy(pos);
			particle.rotation.set(Math.random()*PI, Math.random()*PI, Math.random()*PI);
			particle.scale.setScalar(particle.size=Math.randFloat(.1, .2));

			let sphere=1-Math.smoothstep(particle.position.z, 3, 6);

			particle.morphTargetInfluences[0] = sphere;
			particle.scale.setScalar(Math.lerp(particle.size, .1, sphere));
			//particle.onBeforeRender=function(){this.morphTargetInfluences[0]=inp.value}
			particles.add(particle)
		}

		let envMap = new THREE.TextureLoader().load('windows1.jpg');
		envMap.mapping = THREE.EquirectangularReflectionMapping;
		envMap.encoding=THREE.GammaEncoding;
		material = new THREE.MeshPhongMaterial( { emissive: 0xffffff, envMap: envMap } );

		effect = new THREE.MetaBalls( envMap, camera, blobs, maxBlobs, Object.assign(renderer.getDrawingBufferSize(), {w:2, h:1}) );
		// effect.position.set( -450, -450, -450 );
		effect.scale.multiplyScalar( 1.2 );
		effect.position.set(0, 0.55, -0.5);
		//scene.add( effect );

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

	pMaterial=new THREE.MeshPhongMaterial({
		color: 1513239,
		emissive: 6642505,
		shininess: 60,
		specular: 1842204,
		morphTargets: true,
		morphNormals: true
	});
	particles=new THREE.Group();
	renderer = new THREE.WebGLRenderer( {alpha:true, antialias: true, canvas:canvas} );

}
function updateBlobs( object, time0 ) {

	//object.reset();
	var n=0;
	targGeometrys.forEach(function(targGeometry, j){
		var geometry = targGeometry.clone(),
			vertices = geometry.vertices,
			numBlobs = vertices.length, //helper.attributes.position.count/2,
			time = time0;
		//var strength = 1.2 / ( ( Math.sqrt( numblobs ) - 1 ) / 4 + 1 );

		for ( var i = 0; i < numBlobs; i ++ ) {

			time+=delta;
			let i3 = (i+n) * 3;

			let phase = Math.sin(time)/2*Math.min(amplitude, time0); // + .2 + .2*Math.sin(time*2)
			phase*=Math.cos(time/2+.78);
			
			let vertex = vertices[i] //.clone() // helper.geometry.vertices[i].copy()
			 .multiplyScalar(phase)
			 .applyMatrix4(effect.matrixWorld);

			// blobs[0][i3] = vertex.x;
			// blobs[0][i3+1] = vertex.y;
			// blobs[0][i3+2] = vertex.z;

			// //helper.geometry.verticesNeedUpdate=true;
			// blobs[1][i+n]=weights[j]*weights[j];

			//object.addBall( ballx, bally, ballz, strength, subtract );
		}
		var pos=new THREE.WireframeGeometry(geometry).attributes.position.array;
		//blobs[0].set(pos);
		let n0=pos.length / 6;
		n+=n0;
		for (let i = 0; i < n0; i++) {
			let i6=i*6, i63=i6+3,
				a=new THREE.Vector3(pos[i6], pos[i6+1], pos[i6+2]),
				ab=new THREE.Vector3(pos[i6]-pos[i63], pos[i6+1]-pos[i63+1], pos[i6+2]-pos[i63+2]);
			a.toArray(blobs[0], i*3);
			ab.toArray(blobs[1], i*3);
			blobs[2][i]=ab.lengthSq();
		}

	})
	//blobs[1][0]=weights[weights.length-1]*weights[weights.length-1];			
	effect.setN(n);
}

function animate() {

	requestAnimationFrame( animate );

	var t = performance.now(), dt = t-t0;
	if (dt<dMin) return; // !Eh || 
	dt = Math.min(dt, dMax);
	t0 = t;

	time += dt * speed;
	updateBlobs( effect, time );

	//mesh.rotation.x += 0.01;
	//mesh.rotation.y += 0.02;

	renderer.render( scene, camera );

}
