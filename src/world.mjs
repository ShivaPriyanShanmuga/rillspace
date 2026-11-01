import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { random, elevation, channel, interventionCell, storm } from './simulation.mjs';

const vertexShader = `attribute float depth; varying float vDepth; varying vec3 vWorld; void main(){vDepth=depth;vWorld=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`;
const fragmentShader = `precision highp float; varying float vDepth;varying vec3 vWorld;uniform float clock; void main(){if(vDepth<0.006)discard;float ripple=sin(vWorld.x*3.+clock*1.8)*sin(vWorld.z*2.-clock*2.)*.035;vec3 shallow=vec3(.16,.72,.78);vec3 deep=vec3(.035,.33,.46);vec3 color=mix(shallow,deep,clamp(vDepth*1.7,0.,.8))+ripple;gl_FragColor=vec4(color,.88);}`;
const material = (color, extra = {}) => new THREE.MeshStandardMaterial({ color, roughness: .82, ...extra });

class Island {
  constructor(world) {
    this.key = JSON.stringify(world.config); this.world = world;
    this.scene = new THREE.Scene();
    this.scene.add(new THREE.HemisphereLight(0xe5f4ec, 0x2d4152, 2.4));
    const sun = new THREE.DirectionalLight(0xfff0d2, 3.8); sun.position.set(-24, 48, 30); sun.castShadow = true;
    sun.shadow.mapSize.set(1024,1024);Object.assign(sun.shadow.camera,{left:-35,right:35,top:35,bottom:-35,near:1,far:110}); sun.shadow.bias=-.001;
    this.scene.add(sun);this.shadowDirty=true;
    const sea = new THREE.Mesh(new THREE.CircleGeometry(37, 96), new THREE.MeshStandardMaterial({ color: 0x183e4b, roughness: .35, metalness: .15, transparent: true, opacity:.85 }));
    sea.rotation.x = -Math.PI/2; sea.position.y=-4.7;sea.receiveShadow=true; this.scene.add(sea);
    const rim = new THREE.Mesh(new THREE.RingGeometry(36.9,37.1,96),new THREE.MeshBasicMaterial({color:0x53757c,transparent:true,opacity:.28,side:THREE.DoubleSide}));rim.rotation.x=-Math.PI/2;rim.position.y=-4.69;this.scene.add(rim);
    const { size:n, h, xz, region } = world, positions=[], colors=[], indices=[], base=new THREE.Color(), grass=new THREE.Color('#91a780'), forest=new THREE.Color('#547b61'), stone=new THREE.Color('#aab8a7'), pavement=new THREE.Color('#9babb4');
    for(let i=0;i<h.length;i++){
      positions.push(xz[i*2],h[i],xz[i*2+1]);
      base.copy(grass).lerp(stone,Math.max(0,(h[i]-3)/7));
      if(region[i]&&world.config.cover==='forest')base.lerp(forest,.7);
      if(region[i]&&world.config.cover==='paved')base.copy(pavement).multiplyScalar(i%3===0?.91:1);
      const dist=Math.abs(xz[i*2]-channel(xz[i*2+1],world.config.seed));
      if(dist<1.7)base.lerp(new THREE.Color('#607d75'),.72);
      if(world.barrier[i])base.set('#c6b294');
      colors.push(base.r,base.g,base.b);
    }
    for(let z=0;z<n-1;z++)for(let x=0;x<n-1;x++){const i=z*n+x;indices.push(i,i+n,i+1,i+1,i+n,i+n+1);}
    const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geometry.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));geometry.setIndex(indices);geometry.computeVertexNormals();
    const land=new THREE.Mesh(geometry,material(0xffffff,{vertexColors:true,flatShading:true}));land.castShadow=true;land.receiveShadow=true;this.scene.add(land);
    const walls=[];
    const edge=(a,b)=>{for(let j=0;j<a.length-1;j++){const i=a[j],k=a[j+1],x=xz[i*2],z=xz[i*2+1],xx=xz[k*2],zz=xz[k*2+1];walls.push(x,h[i],z,xx,h[k],zz,x,-4.4,z,xx,h[k],zz,xx,-4.4,zz,x,-4.4,z);}};
    edge(Array.from({length:n},(_,i)=>i));edge(Array.from({length:n},(_,i)=>(n-1)*n+i));edge(Array.from({length:n},(_,i)=>i*n));edge(Array.from({length:n},(_,i)=>i*n+n-1));
    const wallGeo=new THREE.BufferGeometry();wallGeo.setAttribute('position',new THREE.Float32BufferAttribute(walls,3));wallGeo.computeVertexNormals();this.scene.add(new THREE.Mesh(wallGeo,material('#556369',{side:THREE.DoubleSide,flatShading:true})));
    const rockLayer=new THREE.Mesh(new THREE.BoxGeometry(41.1,.25,41.1),material('#788079'));rockLayer.position.y=-3.7;this.scene.add(rockLayer);
    this.waterGeo=geometry.clone();this.waterGeo.setAttribute('depth',new THREE.Float32BufferAttribute(new Float32Array(h.length),1));
    this.waterMaterial=new THREE.ShaderMaterial({vertexShader,fragmentShader,uniforms:{clock:{value:0}},transparent:true,depthWrite:false,side:THREE.DoubleSide});
    this.scene.add(new THREE.Mesh(this.waterGeo,this.waterMaterial));
    this.buildTrees();this.buildVillage();this.buildClouds();
    const rng=random(world.config.seed+9),drops=new Float32Array(1000*3);
    for(let i=0;i<1000;i++){drops[i*3]=(rng()-.5)*44;drops[i*3+1]=rng()*22+2;drops[i*3+2]=(rng()-.5)*44;}
    this.rainGeo=new THREE.BufferGeometry();this.rainGeo.setAttribute('position',new THREE.BufferAttribute(drops,3));
    this.rain=new THREE.Points(this.rainGeo,new THREE.PointsMaterial({color:'#b7dce6',size:.10,transparent:true,opacity:.5}));this.scene.add(this.rain);
  }
  height(x,z){const n=this.world.size,s=this.world.spacing;return this.world.h[Math.max(0,Math.min(n-1,Math.floor((z+21)/s)))*n+Math.max(0,Math.min(n-1,Math.floor((x+21)/s)))];}
  buildTrees(){
    const {world}=this,rng=random(world.config.seed),trees=[];
    for(let i=0;i<world.h.length;i++){
      const x=world.xz[i*2]+(rng()-.5)*.5,z=world.xz[i*2+1]+(rng()-.5)*.5,roll=rng();
      const density=world.region[i]?(world.config.cover==='forest'?.52:world.config.cover==='paved'?0:.07):.08;
      if(roll>density||Math.abs(x-channel(z,world.config.seed))<2.1||Math.abs(z-9)<1.8||Math.abs(x-11)<1.2||world.barrier[i])continue;
      trees.push({x,z,y:world.h[i],scale:.65+rng()*.65});
    }
    const trunks=new THREE.InstancedMesh(new THREE.CylinderGeometry(.1,.14,.95,5),material('#665648'),trees.length);
    const leaves=new THREE.InstancedMesh(new THREE.ConeGeometry(.95,2.7,6),material('#315e4b',{flatShading:true}),trees.length),dummy=new THREE.Object3D(),c=new THREE.Color();
    trees.forEach((t,i)=>{dummy.position.set(t.x,t.y+.45*t.scale,t.z);dummy.scale.setScalar(t.scale);dummy.updateMatrix();trunks.setMatrixAt(i,dummy.matrix);dummy.position.y=t.y+1.6*t.scale;dummy.updateMatrix();leaves.setMatrixAt(i,dummy.matrix);c.set(i%3===0?'#4d7960':i%3===1?'#315a47':'#62846a');leaves.setColorAt(i,c);});
    trunks.castShadow=true;leaves.castShadow=true;leaves.receiveShadow=true;this.scene.add(trunks,leaves);
    this.treeCount=trees.length;
  }
  buildVillage(){
    const road=material('#c4b89c'), homes=[], rng=random(this.world.config.seed+4);
    for(let i=0;i<12;i++){const x=5+(i%4)*3.9,z=11+Math.floor(i/4)*3.6;if(Math.abs(x-channel(z,this.world.config.seed))<2.4)continue;homes.push({x,z,y:this.height(x,z),scale:.7+rng()*.35});}
    const boxes=new THREE.InstancedMesh(new THREE.BoxGeometry(1.7,1.25,1.8),material('#e4d4b7'),homes.length);
    const roofs=new THREE.InstancedMesh(new THREE.ConeGeometry(1.55,.85,4),material('#a85f49',{flatShading:true}),homes.length),dummy=new THREE.Object3D();
    homes.forEach((h,i)=>{dummy.position.set(h.x,h.y+.62*h.scale,h.z);dummy.rotation.set(0,0,0);dummy.scale.setScalar(h.scale);dummy.updateMatrix();boxes.setMatrixAt(i,dummy.matrix);dummy.position.y=h.y+1.55*h.scale;dummy.rotation.y=Math.PI/4;dummy.updateMatrix();roofs.setMatrixAt(i,dummy.matrix);});boxes.castShadow=true;roofs.castShadow=true;this.scene.add(boxes,roofs);
    const roadPoints=[];for(let i=0;i<=80;i++){const x=-20+i*.5;roadPoints.push(new THREE.Vector3(x,this.height(x,9)+.055,9));}
    const path=new THREE.CatmullRomCurve3(roadPoints),roadMesh=new THREE.Mesh(new THREE.TubeGeometry(path,80,.27,4,false),road);roadMesh.receiveShadow=true;this.scene.add(roadMesh);
    const bridge=new THREE.Mesh(new THREE.BoxGeometry(5.2,.22,.95),material('#c7b797'));bridge.position.set(channel(9,this.world.config.seed),this.height(channel(9,this.world.config.seed)+3,9)+.1,9);bridge.castShadow=true;this.scene.add(bridge);
    this.buildings=homes;
    if(this.world.config.dam){const dam=new THREE.Mesh(new THREE.BoxGeometry(8.4,1.9,.7),material('#bda98b'));dam.position.set(channel(2,this.world.config.seed),this.height(channel(2,this.world.config.seed),2)-.6,2);dam.castShadow=true;this.scene.add(dam);}
  }
  buildClouds(){const rng=random(this.world.config.seed+88),geo=new THREE.IcosahedronGeometry(1,1),mat=material('#d3e0dc',{flatShading:true,transparent:true,opacity:.9});this.clouds=new THREE.Group();for(let c=0;c<3;c++){const group=new THREE.Group();group.position.set(-14+c*13,16+c*.5,-12+c*5);for(let k=0;k<7;k++){const puff=new THREE.Mesh(geo,mat);puff.position.set((rng()-.5)*7,(rng()-.5)*1.4,(rng()-.5)*3.6);puff.scale.set(2+rng()*2,.7+rng(),1.3+rng());group.add(puff);}this.clouds.add(group);}this.scene.add(this.clouds);}
  update(world,time,dt){
    const positions=this.waterGeo.attributes.position, depths=this.waterGeo.attributes.depth;
    for(let i=0;i<world.water.length;i++){positions.array[i*3+1]=world.h[i]+world.water[i]+.035;depths.array[i]=world.water[i];}
    positions.needsUpdate=true;depths.needsUpdate=true;this.waterMaterial.uniforms.clock.value=time;
    const strength=storm(world.time,world.config.intensity)*24;
    this.rain.visible=strength>.01;this.rain.material.opacity=Math.min(.65,strength*.5);
    const drops=this.rainGeo.attributes.position;
    if(this.rain.visible){for(let i=0;i<drops.count;i++){drops.array[i*3+1]-=dt*(18+strength*9);if(drops.array[i*3+1]<1)drops.array[i*3+1]+=22;}drops.needsUpdate=true;}
    this.clouds.position.x=Math.sin(time*.07)*.55;
    this.clouds.children.forEach((g,i)=>{g.position.y=16+i*.5-strength*.8;});
  }
  dispose(){const geometries=new Set(),materials=new Set();this.scene.traverse(o=>{if(o.geometry)geometries.add(o.geometry);if(o.material)(Array.isArray(o.material)?o.material:[o.material]).forEach(m=>materials.add(m));o.shadow?.map?.dispose();o.shadow?.mapPass?.dispose();});geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());}
}

export class WorldView {
  constructor(canvas){
    this.canvas=canvas;this.renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:true,preserveDrawingBuffer:true,powerPreference:'high-performance'});
    this.renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));this.renderer.shadowMap.enabled=true;this.renderer.shadowMap.type=THREE.PCFShadowMap;this.renderer.shadowMap.autoUpdate=false;
    this.renderer.outputColorSpace=THREE.SRGBColorSpace;this.renderer.toneMapping=THREE.ACESFilmicToneMapping;this.renderer.toneMappingExposure=1.15;
    this.camera=new THREE.OrthographicCamera(-36,36,25,-25,.1,250);this.camera.position.set(45,34,48);this.camera.lookAt(0,2,0);
    this.controls=new OrbitControls(this.camera,canvas);this.controls.target.set(0,2,0);this.controls.enableDamping=true;this.controls.enablePan=false;this.controls.minPolarAngle=.35;this.controls.maxPolarAngle=1.25;this.controls.minZoom=.75;this.controls.maxZoom=1.9;this.controls.update();
    this.islands=[];this.observer=new ResizeObserver(()=>this.resize());this.observer.observe(canvas.parentElement);this.resize();
    canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();canvas.dispatchEvent(new CustomEvent('view-error',{detail:'Graphics paused. Reload to restore the 3D view.'}));});
  }
  resize(){const r=this.canvas.parentElement.getBoundingClientRect();this.width=Math.max(1,r.width);this.height=Math.max(1,r.height);this.renderer.setSize(this.width,this.height,false);}
  reset(){this.camera.position.set(45,34,48);this.camera.zoom=1;this.controls.target.set(0,2,0);this.camera.updateProjectionMatrix();this.controls.update();}
  render(baseline,future,compare,time,dt){
    const worlds=compare?[baseline,future]:[future];
    for(let i=0;i<worlds.length;i++){const key=JSON.stringify(worlds[i].config);if(this.islands[i]?.key!==key){this.islands[i]?.dispose();this.islands[i]=new Island(worlds[i]);}this.islands[i].update(worlds[i],time,dt);}
    this.controls.update();this.renderer.setScissorTest(false);this.renderer.setViewport(0,0,this.width,this.height);this.renderer.clear();this.renderer.setScissorTest(true);
    const stacked=compare&&this.width<640,w=stacked?this.width:this.width/worlds.length,h=stacked?this.height/2:this.height;
    worlds.forEach((_,i)=>{const x=stacked?0:i*w,y=stacked?(1-i)*h:0;this.renderer.setViewport(x,y,w,h);this.renderer.setScissor(x,y,w,h);const aspect=w/h,span=Math.max(68,52*aspect);this.camera.left=-span/2;this.camera.right=span/2;this.camera.top=span/2/aspect;this.camera.bottom=-span/2/aspect;this.camera.updateProjectionMatrix();if(this.islands[i].shadowDirty)this.renderer.shadowMap.needsUpdate=true;this.renderer.render(this.islands[i].scene,this.camera);this.islands[i].shadowDirty=false;});
    this.renderer.setScissorTest(false);
  }
  image(){return this.canvas.toDataURL('image/png');}
  dispose(){this.observer.disconnect();this.controls.dispose();this.islands.forEach(i=>i.dispose());this.renderer.dispose();}
}
