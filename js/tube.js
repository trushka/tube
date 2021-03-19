import './three.min.js';
import './GLTFLoader.js';
//import './CSS3DRenderer.js';
import {vec3} from './threeCustom.js'; export {vec3};
import {geometries} from './geometries.js'; export {geometries};

export let camera, cameraBg, scene, sceneBg,
	container=document.querySelector('._3d'),
	canvas = document.querySelector('canvas.renderer'),
	canvasBg = document.querySelector('canvas.renderer-bg'),

	renderer = new THREE.WebGLRenderer( {alpha:true, antialias: true, canvas:canvas} ),
	rendererBg = new THREE.WebGLRenderer( {alpha:true, antialias: true, canvas:canvasBg} );

export let geometry, material, Stick, plane,
	light, light1, hLight, 
	rings=[], ringMatireal, tube, effect, pMaterial,
	particles=new THREE.Group(), figures=new THREE.Group(),
	targGeometrys=[new THREE.TetrahedronGeometry(.5), new THREE.ConeGeometry(.4, .7, 4, 1, true) ],//, new THREE.OctahedronGeometry(.6)
	targIndeces=[],
	Anim = {
		stage: 0,
		step: function(stage, cond) {
			if (this.stage!=stage-1) return false;
			if (cond) ++this.stage;// console.log('stage:', )
			return cond;
		}
	};

const resolution = 30, isolation = 40, subtract = 3, strength=1.82, pCount=80, pSize=.2,
	maxBlobs = 20, speed = 1/5000, delta=.15, amplitude = 1.1, roV = [.00046, -.00025], PI=Math.PI;
var t0 = performance.now(), dMax = 80, dMin = 1000/60, dT = 1000/50, time=0,
	blobs = [new Float32Array(maxBlobs * 3), new Float32Array(maxBlobs*3), new Float32Array(maxBlobs)],
	weights = [63,14,-120];

targGeometrys.forEach(geometry=>{
	let indeces=[];
	let wGeometry=geometry.rotateY(PI).clone();
	wGeometry.vertices.forEach((v,i)=>{v.x=i});
	let buffer=new THREE.WireframeGeometry(wGeometry).attributes.position;
	for (let i = 0; i < buffer.count/2; i++) {
		indeces.push([buffer.getX(i*2), buffer.getX(i*2+1)])
	}
	targIndeces.push(indeces)
})

function createPos() {
	return vec3(Math.sqrt(Math.random())*5, 0, 18).rotate(0, 0, Math.random()*PI*2)
}

new THREE.GLTFLoader().load('tube.glb', function(obj){
	camera = obj.cameras[0];
	camera.parent.position.y=11;
	camera.lookAt(0,0,0);
	camera.near=2;
	camera.far=50;
	camera.updateProjectionMatrix()

	scene = obj.scene;
	scene.getObjectByName('Plane001').visible=false;

	const material=new THREE.MeshBasicMaterial({color:'#2a2e45', side:THREE.DoubleSide})

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
			figures.position.copy(tube.position);
			tube.geometry.applyMatrix4(tube.matrix);
			tube.position.set(0,0,0);
			tube.rotation.set(0,0,0);
		};
	});
	sceneBg=scene.clone();
	sceneBg.traverse(el=>{
		if (el.isCamera) cameraBg=el;
		if (!el.isMesh) return;
		el.material=material;
	});
	cameraBg.projectionMatrix=camera.projectionMatrix;

	scene.add(plane);

	// generate particles

	scene.add(particles, figures);
	let inp=document.createElement('input');
	inp.style.cssText='position:absolute; width:50%';
	//document.body.append(inp);
	inp.step=.001; inp.max=1; inp.type='range';

	for (let i = 0; i < 500; i++) {
		let pos;
		for (let n = 0; n < 18000; n++) {
			(pos=createPos().multiplyScalar(Math.random())).z+=2;
			if (!particles.children.some(el=>el.position.distanceTo(pos)<.17+pos.z*.1)) break;
			pos=0;
		}
		if (!pos) break;
		addParticle(pos);
	}
	particles.children.sort((p1,p2)=>p1.position.z-p2.position.z);

	let envMap = new THREE.TextureLoader().load('windows1.jpg');
	envMap.mapping = THREE.EquirectangularReflectionMapping;
	envMap.encoding=THREE.GammaEncoding;
	//material = new THREE.MeshPhongMaterial( { emissive: 0xffffff, envMap: envMap } );

	light = scene.getObjectByName('Sun_Orientation');
	light.intensity=.3;
	light.rotation.y=-.95;

	light1 = scene.getObjectByName('Sun001_Orientation');
	light1.intensity=4;
	light1.rotation.set(-1.47, 0.45, 0);
	//light.rotation.x=-1.07;

	scene.add(hLight=new THREE.HemisphereLight('#adf', '#fff', 3));
	hLight.groundColor.multiplyScalar(-1);
	hLight.position.set(1,1,3);

	scene.updateMatrixWorld();
	(window.onresize = function () {
		const box=canvas.getBoundingClientRect(),
		 captions=document.querySelectorAll('.captions div'),
		 box1=captions[1].getBoundingClientRect();

		renderer.setPixelRatio( window.devicePixelRatio );
		renderer.setSize( box.width, box.height, false );
		rendererBg.setPixelRatio( window.devicePixelRatio );
		rendererBg.setSize( box.width, box.height, false );
		camera.aspect = canvas.width / canvas.height;
		camera.zoom=Math.min(Math.smoothstep(camera.aspect, 1, 3)*.3+1, camera.aspect);
		camera.updateProjectionMatrix();
		rendererBg.render(sceneBg, cameraBg);

		const isNarrow=box1.width/box.height/camera.zoom>.22 || camera.aspect<1.2;
		document.querySelector('.captions')?.classList[isNarrow?'add':'remove']('narrow');
		setElPos(captions[0], 4);
		setElPos(captions[1], isNarrow?[-0.3, -.6, true]:0.1);
		setElPos(captions[2], isNarrow?-3.8:-3.4);
		setElPos(captions[3], -5, -.6, true);
	} )();

	requestAnimationFrame( animate );
	container.style.opacity=1;
});
plane=new THREE.Mesh(new THREE.PlaneBufferGeometry(), new THREE.MeshBasicMaterial({
	map: new THREE.TextureLoader().load( "img/logo.svg" ),
	transparent: true
}));
plane.matrix.fromArray([0, 0, -10, 0, 0, 1.5, 0, 0, 1.9, 0, 0, 0, 1.145, -0.7, -0.7, 1]);
plane.matrixAutoUpdate = false;

export function setElPos(el, x, y=0.6, inv) {
	if (!el) return;
	if (isNaN(x)) [x,y,inv]=x;
	let scrPos=particles.localToWorld(vec3(0, y, x)).project(camera);
	el.style.cssText=
	`${inv?'right':'left'}: ${50+scrPos.x*50*(!inv||-1)}%;
	 ${inv?'top':'bottom'}: ${50+scrPos.y*50*(!inv||-1)}%`
}

export let color0=new THREE.Color(6642505),
	color1=color0.clone();
(material=new THREE.MeshPhongMaterial({
	color: 1513239,
	emissive: color0,
	shininess: 60,
	specular: 1842204,
	onBeforeCompile: function(sh){
		sh.uniforms.emissive.needsUpdate=true;
		sh.uniforms.color1={value: color1, needsUpdate: true};

		sh.vertexShader='varying float vY;\n'+sh.vertexShader.replace('}', '	vY=position.y;\n}');
		
		sh.fragmentShader='varying float vY;\nuniform vec3 color1;\n'
		 +sh.fragmentShader.replace('= emissive;', '= mix(emissive, color1, smoothstep(0.15, 0.85, vY));');
	}
})).updateUniforms=[['emissive', color0], ['color1', color0]];

pMaterial=material.clone();
pMaterial.morphTargets=true;
pMaterial.morphNormals=true;

export let pFigMaterial=pMaterial.clone();
pFigMaterial.updateUniforms=[['emissive', color0]];

THREE.Material.prototype.setUniform=function(uName, value){
	if (!this._uniforms) this._uniforms=renderer.properties.get(material).program.getUniforms();
	this._uniforms.setValue(gl, uName, value)
}

Stick=new THREE.Mesh(new THREE.CylinderBufferGeometry(.032, .032, 1, 6), material);
Stick.geometry.translate(0, .5, 0);

function addParticle(pos) {
	let particle=new THREE.Mesh(geometries[Math.randInt(0,3)], pMaterial);
	particle.position.copy(pos);
	particle.rotation.set(Math.random()*PI, Math.random()*PI, Math.random()*PI);
	particle.scale.setScalar(particle.size=Math.randFloat(.1, .2));

	particle.targ=vec3(0, 0, Math.randFloat(2.5, 4));
	particle.v=pos.clone().sub(particle.targ);
	if (particle.v.z<1) particle.v=vec3(0,0,Math.randFloat(.0003, .0006))
	else particle.v.setLength( Math.randFloat(.0003, .0006));
	particles.add(particle);
	particle.targ.z-=1
	return particle;
};

let targ=particles.targ=vec3(0,0,2);//3.5);
let gl=renderer.getContext();

let dt,	creatFigure=1000, gIndex=0;
function animate() {

	requestAnimationFrame( animate );

	var t = performance.now();
	dt = t-t0;
	if (dt<dMin) return; // !Eh || 
	dt = Math.min(dt, dMax);
	t0 = t;

	//time += dt * speed;
	dt*=2.5;
	//updateBlobs( effect, time );

	const dist=2;
	
	let pos=createPos(), testPos, targ=vec3();

	figures.children.forEach(f=>{if (f.delete) figures.remove(f)});

	figures.traverse(p=>{
		if ('delete' in p) p.delete=true;

		let anim=p.parent.anim;
		if (p.name=='figure') {
			p.stage=4;
		}
		if (p.isTransformer) {
			let stage=p.parent.stage, z=p.position.z-p.z0;
			p.position.z-= Math.clamp((stage-.98)*.05, 0, .002)*dt
			 *Math.smoothstep(Math.abs(z+3.6)*stage/1.5,-.28, 1.6);
			if (anim.step(1, stage>.99||z<0)) creatFigure++;
			p.rotateOnAxis(p.axis0, dt*.0026*Math.min(stage, .1/(-z+.2)+.12));
			p.axis0.lerp(p.up, dt*.0003).normalize();
		}
		if (p.doTransform) p.doTransform();
		if (!p.isParticle) return;
		targ.copy(p.targ).applyMatrix4(p.targMatrix);
		let st0=p.stage;
		if (anim.stage ) p.stage+=(p.sV=Math.lerp(p.sV, .0005, 0.001*dt))*dt;
		else if (p.position.z<p.pos0.z) p.stage=Math.max(Math.mapLinear(p.position.z, p.pos0.z, targ.z, 0, 1)*1.05, p.stage)
		else p.v.z+=dt*.0000005;
		let stage=Math.min(p.stage, 1), stage2=stage*stage;
		p.parent.stage=Math.min(p.parent.stage, p.stage);

		//anim.step(3, p.position.z<-3.2);
		p.position.addScaledVector(p.v, -dt*(1-stage2)).lerp(targ, .0018*dt*(2-stage)*stage2);
		p.scale.setScalar(Math.lerp(p.size, .13, stage2));
		p.morphTargetInfluences[0] = Math.lerp(p.morphTargetInfluences[0], 1, stage);

		p.color.lerp(p.color1, Math.smoothstep(-p.position.z, 2.8, 4.6));
	});
	particles.children.forEach(p=>{
		//p.v.clone().cross()
		p.position.addScaledVector(p.v, -dt);
		let z=p.position.z, z1=p.targ.z,
			sphere=1-Math.smoothstep(z-z1, 1, 3);
		if (z<5) p.v.z+=.000001*z;

		p.morphTargetInfluences[0] = sphere;
		p.scale.setScalar(Math.lerp(p.size, .1, sphere)*Math.smoothstep(z, z1-1.5, z1+.7));

		if (!p.scale.x) particles.remove(p);
		//this.morphTargetInfluences[0]=inp.value
		testPos=testPos||(p.position.z>pos.z-dist && pos.distanceTo(p.position)<dist);
	});
	if ( creatFigure && (creatFigure+=dt)>3000) {
		gIndex+=1;
		gIndex%=targGeometrys.length;

		let figure=new THREE.Group();
		figure.name='figure';
		figure.anim=Object.create(Anim);
		figures.add(figure);
		let fig0=new THREE.Object3D();
		fig0.name='transformer';
		fig0.isTransformer=true;
		figure.transformer=fig0;
		fig0.axis0=vec3(1, Math.random()*.5, 0).rotate(0,Math.random()*PI*2,0).normalize();
		fig0.position.z=fig0.z0=-.19;
		if (!gIndex) fig0.up.set(1,1,1).normalize();
		fig0.scale.multiplyScalar(1.2);
		//fig0.add(new THREE.ArrowHelper(fig0.up));

		fig0.count=targGeometrys[gIndex].vertices.length;

		let hue0=Math.random();

		particles.children.sort((p1,p2)=>p1.position.z-p2.position.z);
		let first=particles.children.findIndex(p=>p.position.z>1.7);
		if (first&&particles.children[first].position.z>1.8) first--;
		particles.children.splice(first, fig0.count).forEach((p,i)=>{
			//console.log(i)
			figure.add(p);
			p.name='particle';
			p.targ=targGeometrys[gIndex].vertices[i].clone();
			p.pos0=p.position.clone();
			p.pos0.z=Math.min(p.pos0.z, 1.6);
			p.size=p.scale.z;
			p.targMatrix=fig0.matrix;
			p.isParticle=true;
			p.onBeforeRender=function(){
				figure.delete=false;
				pFigMaterial.updateUniforms[0][1]=p.color;
			};
			p.stage=0;
			p.sV=0;

			p.material=pFigMaterial;
			p.color=color0.clone();
			p.color1=color0.clone().offsetHSL(hue0+i/fig0.count, .8 ,.14);
			p.color1.g*=.78;
			p.color1.g*=.92;
		});
		figure.add(fig0);
		let vertices=figure.children;
		targIndeces[gIndex].forEach((ind)=> {
			let stick=Stick.clone(),
				p1=vertices[ind[0]],
				p2=vertices[ind[1]],
				a=p1.position,
				b=p2.position,
				ab=vec3();
			stick.scale.y=0;
			stick.doTransform=function() {
				let stage=(p1.stage+p2.stage+figure.stage*2)/4.12;
				let scale=+stage>1||(Math.pow(stage,15)*3+1)%2-1;
				//if (!stick.scale.y) console.log(p1.stage, p2.stage, scale);
				ab.subVectors(b,a);
				stick.scale.y=ab.length()*scale;
				stick.quaternion.setFromUnitVectors(stick.up, ab.normalize());
				stick.position.copy(scale>0?a:b)
			};
			stick.onBeforeRender=function(){
				material.updateUniforms[0][1]=p1.color;
				material.updateUniforms[1][1]=p2.color;
			}
			figure.add(stick);
		})

		creatFigure=0;
	}
	if (!testPos) addParticle(pos);

	renderer.render( scene, camera );

}
