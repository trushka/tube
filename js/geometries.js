//import './three.min.js';
export let geometries=[
	new THREE.BoxBufferGeometry(1.2,1.2,1.2, 3,3,3),
	new THREE.CylinderGeometry(.8,.8,.7,6),
	new THREE.ConeBufferGeometry(.7, 1.7, 12, 7),
	new THREE.OctahedronGeometry(1.1)
];

geometries.forEach(function sphere(g,i){
	if (!g.isBufferGeometry){
		if (i) sphere(g); //subdivide faces 2 times
		g.faceVertexUvs=[];
		var vertices=g.vertices,
			faces=g.faces, f1;
		g.faces=[];
		faces.forEach(f=>{
			//if (i<3 && f.normal.z<1) return;
			let n=vertices.length;
			let ab=vertices[f.a].clone()
			.add(vertices[f.b]).multiplyScalar(.5);
			vertices.push(ab);

			let bc=vertices[f.b].clone()
			.add(vertices[f.c]).multiplyScalar(.5);
			vertices.push(bc);

			let ca=vertices[f.a].clone()
			.add(vertices[f.c]).multiplyScalar(.5);
			vertices.push(ca);

			g.faces.push(
				new THREE.Face3(f.a, n, n+2),
				new THREE.Face3(n, n+1, n+2),
				new THREE.Face3(n, f.b, n+1),
				new THREE.Face3(n+1, f.c, n+2),
			)
		});
		if (!i) return;
		g.computeFlatVertexNormals();
		geometries[i]=g=new THREE.BufferGeometry().fromGeometry(g);
	}
	let norm=g.attributes.normal;

	g.attributes.normal=g.attributes.position.clone();
	g.normalizeNormals();

	g.morphAttributes.position=[g.attributes.normal.clone()];
	g.morphAttributes.normal=[g.attributes.normal.clone()];

	g.attributes.normal=norm;
});