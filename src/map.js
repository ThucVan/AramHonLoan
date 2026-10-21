import * as THREE from 'three';
import { gltfLoader } from './champion.js';

// Procedural texture generator for authentic Howling Abyss (ARAM) Stone Paving & Freljord Runes
function createAramGroundTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 1024;
  const ctx = canvas.getContext('2d');

  // 1. Deep Arctic Stone Base
  ctx.fillStyle = '#141d28';
  ctx.fillRect(0, 0, 1024, 1024);

  // 2. Large Flagstone Paving Slabs (Staggered Nordic masonry)
  const slabWidth = 128;
  const slabHeight = 64;

  for (let y = 0; y < 1024; y += slabHeight) {
    const row = Math.floor(y / slabHeight);
    const offsetX = (row % 2) * (slabWidth / 2);

    for (let x = -slabWidth; x < 1024 + slabWidth; x += slabWidth) {
      const posX = x + offsetX;
      if (posX + slabWidth < 0 || posX > 1024) continue;

      // Subtle slate blue-grey variation
      const seed = Math.sin(posX * 0.05 + y * 0.07);
      const tone = Math.floor(38 + seed * 12);
      const blueTint = Math.floor(52 + seed * 14);
      ctx.fillStyle = `rgb(${tone - 8}, ${blueTint - 4}, ${blueTint + 12})`;
      ctx.fillRect(posX + 2, y + 2, slabWidth - 4, slabHeight - 4);

      // Slabs chisel bevel / shadow edge
      ctx.fillStyle = 'rgba(10, 15, 22, 0.45)';
      ctx.fillRect(posX + 2, y + slabHeight - 4, slabWidth - 4, 2);
      ctx.fillRect(posX + slabWidth - 4, y + 2, 2, slabHeight - 4);

      // Frost highlight on top bevel
      ctx.fillStyle = 'rgba(186, 230, 253, 0.15)';
      ctx.fillRect(posX + 2, y + 2, slabWidth - 4, 1);

      // Stone noise & micro fissures
      for (let p = 0; p < 6; p++) {
        const nx = posX + Math.random() * (slabWidth - 8) + 4;
        const ny = y + Math.random() * (slabHeight - 8) + 4;
        ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
        ctx.fillRect(nx, ny, 2, 2);
      }
    }
  }

  // 3. Central Ancient Freljord Runic Channel (Glowing Cyan Ice)
  ctx.save();
  // Outer soft cyan aura
  ctx.strokeStyle = 'rgba(56, 189, 248, 0.35)';
  ctx.shadowColor = '#38bdf8';
  ctx.shadowBlur = 18;
  ctx.lineWidth = 14;
  ctx.beginPath();
  ctx.moveTo(512, 0);
  ctx.lineTo(512, 1024);
  ctx.stroke();

  // Inner bright runic line
  ctx.strokeStyle = 'rgba(224, 242, 254, 0.85)';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(512, 0);
  ctx.lineTo(512, 1024);
  ctx.stroke();
  ctx.restore();

  // Side guide channels
  ctx.strokeStyle = 'rgba(14, 165, 233, 0.25)';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(256, 0); ctx.lineTo(256, 1024);
  ctx.moveTo(768, 0); ctx.lineTo(768, 1024);
  ctx.stroke();

  // 4. Repeated Freljordian Diamond Runes along the central channel
  const diamondInterval = 256;
  for (let cy = diamondInterval / 2; cy < 1024; cy += diamondInterval) {
    ctx.save();
    ctx.translate(512, cy);

    // Outer glow diamond
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.6)';
    ctx.shadowColor = '#0ea5e9';
    ctx.shadowBlur = 12;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(0, -32);
    ctx.lineTo(24, 0);
    ctx.lineTo(0, 32);
    ctx.lineTo(-24, 0);
    ctx.closePath();
    ctx.stroke();

    // Inner bright diamond
    ctx.strokeStyle = 'rgba(240, 249, 255, 0.9)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, -18);
    ctx.lineTo(14, 0);
    ctx.lineTo(0, 18);
    ctx.lineTo(-14, 0);
    ctx.closePath();
    ctx.stroke();

    // Central rune eye
    ctx.fillStyle = '#67e8f9';
    ctx.beginPath();
    ctx.arc(0, 0, 4, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  // 5. Snow and Frost Drifts on bridge edges
  for (let i = 0; i < 400; i++) {
    // Left edge drifts
    const lx = Math.random() * 90;
    const ly = Math.random() * 1024;
    const lr = Math.random() * 16 + 4;
    const lGrad = ctx.createRadialGradient(lx, ly, 0, lx, ly, lr);
    lGrad.addColorStop(0, 'rgba(241, 245, 249, 0.45)');
    lGrad.addColorStop(1, 'rgba(241, 245, 249, 0)');
    ctx.fillStyle = lGrad;
    ctx.beginPath();
    ctx.arc(lx, ly, lr, 0, Math.PI * 2);
    ctx.fill();

    // Right edge drifts
    const rx = 1024 - Math.random() * 90;
    const ry = Math.random() * 1024;
    const rr = Math.random() * 16 + 4;
    const rGrad = ctx.createRadialGradient(rx, ry, 0, rx, ry, rr);
    rGrad.addColorStop(0, 'rgba(241, 245, 249, 0.45)');
    rGrad.addColorStop(1, 'rgba(241, 245, 249, 0)');
    ctx.fillStyle = rGrad;
    ctx.beginPath();
    ctx.arc(rx, ry, rr, 0, Math.PI * 2);
    ctx.fill();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(3, 14);
  return texture;
}

// Procedural Panoramic Backdrop: Arctic Freljord Night Sky & Aurora Borealis
function createFreljordBackdropTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 2048;
  canvas.height = 1024;
  const ctx = canvas.getContext('2d');

  // Deep night sky gradient
  const skyGrad = ctx.createLinearGradient(0, 0, 0, 1024);
  skyGrad.addColorStop(0, '#030712');
  skyGrad.addColorStop(0.4, '#071527');
  skyGrad.addColorStop(0.75, '#0a1e38');
  skyGrad.addColorStop(1, '#050c18');
  ctx.fillStyle = skyGrad;
  ctx.fillRect(0, 0, 2048, 1024);

  // Aurora Borealis (Northern Lights / Freljord Soul Magic)
  for (let wave = 0; wave < 3; wave++) {
    ctx.save();
    const auroraGrad = ctx.createLinearGradient(0, 150 + wave * 90, 0, 450 + wave * 90);
    auroraGrad.addColorStop(0, 'rgba(34, 211, 238, 0)');
    auroraGrad.addColorStop(0.3, wave === 1 ? 'rgba(168, 85, 247, 0.22)' : 'rgba(56, 189, 248, 0.28)');
    auroraGrad.addColorStop(0.6, 'rgba(52, 211, 153, 0.25)');
    auroraGrad.addColorStop(1, 'rgba(52, 211, 153, 0)');

    ctx.fillStyle = auroraGrad;
    ctx.beginPath();
    ctx.moveTo(0, 320 + wave * 60);
    for (let x = 0; x <= 2048; x += 64) {
      const y = 300 + wave * 60 + Math.sin(x * 0.006 + wave) * 75 + Math.cos(x * 0.012) * 35;
      ctx.lineTo(x, y);
    }
    ctx.lineTo(2048, 1024);
    ctx.lineTo(0, 1024);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  // Distant Jagged Glacial Peaks Silhouette
  ctx.fillStyle = '#050f1d';
  ctx.beginPath();
  ctx.moveTo(0, 1024);
  for (let x = 0; x <= 2048; x += 32) {
    const peakY = 560 + Math.sin(x * 0.008) * 120 + Math.cos(x * 0.02) * 55;
    ctx.lineTo(x, peakY);
  }
  ctx.lineTo(2048, 1024);
  ctx.closePath();
  ctx.fill();

  // Foreground Glacial Crags
  ctx.fillStyle = '#040b15';
  ctx.beginPath();
  ctx.moveTo(0, 1024);
  for (let x = 0; x <= 2048; x += 24) {
    const peakY = 680 + Math.sin(x * 0.012 + 1) * 90 + Math.cos(x * 0.03) * 45;
    ctx.lineTo(x, peakY);
  }
  ctx.lineTo(2048, 1024);
  ctx.closePath();
  ctx.fill();

  // Distant stars
  ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
  for (let i = 0; i < 300; i++) {
    const sx = Math.random() * 2048;
    const sy = Math.random() * 450;
    const sz = Math.random() * 2 + 0.5;
    ctx.fillRect(sx, sy, sz, sz);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  return texture;
}

export class HowlingAbyssMap {
  constructor(scene) {
    this.scene = scene;
    this.bridgeWidth = 24;
    this.bridgeLength = 260;
    this.braziers = [];
    this.relics = [];
    this.statueMixers = [];
    this.snowParticles = null;

    this.buildMap();
    this.buildBackdrop();
    this.buildStatues();
    this.buildSnow();
    this.buildHexgates();
    this.buildPoros();
  }

  buildMap() {
    const groundTex = createAramGroundTexture();

    // 1. Main Bridge Deck (Howling Abyss Bridge - Mặt cầu đá phẳng chuẩn y = 0.0, dày 8m vững chắc)
    const bridgeGeo = new THREE.BoxGeometry(this.bridgeWidth, 8, this.bridgeLength);
    const bridgeMat = new THREE.MeshStandardMaterial({
      map: groundTex,
      roughness: 0.65,
      metalness: 0.18,
      color: 0xdbeafe
    });
    this.bridgeMesh = new THREE.Mesh(bridgeGeo, bridgeMat);
    this.bridgeMesh.position.y = -4.0; // Mặt trên sàn cầu chuẩn xác tại y = 0.0, độ dày 8m vững chắc
    this.bridgeMesh.receiveShadow = true;
    this.scene.add(this.bridgeMesh);

    // 2. Heavy Stone Parapets / Fortress Walls with Snow Caps
    const wallGeo = new THREE.BoxGeometry(1.6, 2.4, this.bridgeLength);
    const wallMat = new THREE.MeshStandardMaterial({
      color: 0x1b2430,
      roughness: 0.85,
      metalness: 0.15
    });

    const leftWall = new THREE.Mesh(wallGeo, wallMat);
    leftWall.position.set(-this.bridgeWidth / 2 + 0.8, 0.6, 0);
    leftWall.castShadow = true;
    leftWall.receiveShadow = true;
    this.scene.add(leftWall);

    const rightWall = new THREE.Mesh(wallGeo, wallMat);
    rightWall.position.set(this.bridgeWidth / 2 - 0.8, 0.6, 0);
    rightWall.castShadow = true;
    rightWall.receiveShadow = true;
    this.scene.add(rightWall);

    // Snow caps lining the top of the parapet walls
    const snowCapGeo = new THREE.BoxGeometry(1.8, 0.3, this.bridgeLength);
    const snowCapMat = new THREE.MeshStandardMaterial({
      color: 0xe2e8f0,
      roughness: 0.9,
      metalness: 0.05
    });

    const leftCap = new THREE.Mesh(snowCapGeo, snowCapMat);
    leftCap.position.set(-this.bridgeWidth / 2 + 0.8, 1.85, 0);
    this.scene.add(leftCap);

    const rightCap = new THREE.Mesh(snowCapGeo, snowCapMat);
    rightCap.position.set(this.bridgeWidth / 2 - 0.8, 1.85, 0);
    this.scene.add(rightCap);

    // 3. Ancient Stone Pillars & Warm Braziers (Contrasting warm flames against blue snow)
    for (let z = -100; z <= 100; z += 25) {
      this.createPillar(-this.bridgeWidth / 2 - 0.5, z);
      this.createPillar(this.bridgeWidth / 2 + 0.5, z);
    }

    // 4. Abyss / Chasm Floor beneath the bridge
    const abyssGeo = new THREE.PlaneGeometry(400, 400);
    const abyssMat = new THREE.MeshBasicMaterial({ color: 0x030813, side: THREE.DoubleSide });
    const abyss = new THREE.Mesh(abyssGeo, abyssMat);
    abyss.rotation.x = -Math.PI / 2;
    abyss.position.y = -45;
    this.scene.add(abyss);

    // 5. Giant Glacial Ice Spires & Crags protruding from the abyss
    const spikeGeo = new THREE.ConeGeometry(7, 55, 6);
    const spikeMat = new THREE.MeshStandardMaterial({
      color: 0x182c44,
      emissive: 0x081729,
      roughness: 0.45,
      metalness: 0.3
    });

    for (let i = 0; i < 36; i++) {
      const spike = new THREE.Mesh(spikeGeo, spikeMat);
      const side = Math.random() > 0.5 ? 1 : -1;
      const x = side * (this.bridgeWidth / 2 + 12 + Math.random() * 50);
      const z = (Math.random() - 0.5) * (this.bridgeLength + 40);
      spike.position.set(x, -28 + Math.random() * 14, z);
      spike.rotation.x = (Math.random() - 0.5) * 0.35;
      spike.rotation.z = (Math.random() - 0.5) * 0.35;
      this.scene.add(spike);
    }

    // 6. Spawn Health Relics (ARAM Holy Shrines)
    this.createHealthRelic(-this.bridgeWidth / 2 + 4.0, 0);
    this.createHealthRelic(this.bridgeWidth / 2 - 4.0, 0);
  }

  // Backdrop panorama: Arctic Freljord Canyon & Aurora Borealis
  buildBackdrop() {
    const backdropTex = createFreljordBackdropTexture();
    const cylGeo = new THREE.CylinderGeometry(200, 200, 110, 48, 1, true);
    const cylMat = new THREE.MeshBasicMaterial({
      map: backdropTex,
      side: THREE.BackSide,
      depthWrite: false
    });
    const backdrop = new THREE.Mesh(cylGeo, cylMat);
    backdrop.position.set(0, 25, 0);
    this.scene.add(backdrop);
  }

  // Giant Horned Freljordian Bridge Statues (aram_statue.glb) matching Image 2
  buildStatues() {
    const statueZPositions = [-75, -25, 25, 75];

    statueZPositions.forEach((z) => {
      // Left side statues facing inward (facing right: Math.PI / 2)
      gltfLoader.load('/models/aram_statue.glb', (gltf) => {
        const model = gltf.scene.clone();
        const box = new THREE.Box3().setFromObject(model);
        const size = box.getSize(new THREE.Vector3());
        const targetHeight = 10.5;
        const scale = targetHeight / (size.y || 1);
        model.scale.set(scale, scale, scale);
        box.setFromObject(model);
        model.position.set(-this.bridgeWidth / 2 - 1.8, -box.min.y, z);
        model.rotation.y = Math.PI / 2;
        model.traverse((c) => {
          if (c.isMesh) {
            c.castShadow = true;
            c.receiveShadow = true;
          }
        });
        this.scene.add(model);

        if (gltf.animations && gltf.animations.length > 0) {
          const mixer = new THREE.AnimationMixer(model);
          const clip = gltf.animations.find(a => a.name.toLowerCase().includes('idle')) || gltf.animations[0];
          if (clip) mixer.clipAction(clip).play();
          this.statueMixers.push(mixer);
        }
      });

      // Right side statues facing inward (facing left: -Math.PI / 2)
      gltfLoader.load('/models/aram_statue.glb', (gltf) => {
        const model = gltf.scene.clone();
        const box = new THREE.Box3().setFromObject(model);
        const size = box.getSize(new THREE.Vector3());
        const targetHeight = 10.5;
        const scale = targetHeight / (size.y || 1);
        model.scale.set(scale, scale, scale);
        box.setFromObject(model);
        model.position.set(this.bridgeWidth / 2 + 1.8, -box.min.y, z);
        model.rotation.y = -Math.PI / 2;
        model.traverse((c) => {
          if (c.isMesh) {
            c.castShadow = true;
            c.receiveShadow = true;
          }
        });
        this.scene.add(model);

        if (gltf.animations && gltf.animations.length > 0) {
          const mixer = new THREE.AnimationMixer(model);
          const clip = gltf.animations.find(a => a.name.toLowerCase().includes('idle')) || gltf.animations[0];
          if (clip) mixer.clipAction(clip).play();
          this.statueMixers.push(mixer);
        }
      });
    });
  }

  createPillar(x, z) {
    const pillarGroup = new THREE.Group();
    pillarGroup.position.set(x, 0, z);

    // Stone Pedestal
    const baseGeo = new THREE.CylinderGeometry(1.1, 1.5, 3.6, 8);
    const baseMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.85 });
    const base = new THREE.Mesh(baseGeo, baseMat);
    base.position.y = 1.8;
    base.castShadow = true;
    base.receiveShadow = true;
    pillarGroup.add(base);

    // Warm Flame Brazier Bowl
    const bowlGeo = new THREE.CylinderGeometry(1.2, 0.7, 0.6, 8);
    const bowlMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.7, metalness: 0.6 });
    const bowl = new THREE.Mesh(bowlGeo, bowlMat);
    bowl.position.y = 3.8;
    pillarGroup.add(bowl);

    // Floating Warm Flame Crystal (Authentic contrast against blue snow)
    const crystalGeo = new THREE.OctahedronGeometry(0.65, 0);
    const crystalMat = new THREE.MeshStandardMaterial({
      color: 0xf97316,
      emissive: 0xf97316,
      emissiveIntensity: 2.8,
      roughness: 0.1
    });
    const crystal = new THREE.Mesh(crystalGeo, crystalMat);
    crystal.position.y = 4.4;
    pillarGroup.add(crystal);

    // Warm Torch Light
    const light = new THREE.PointLight(0xf59e0b, 2.2, 18, 1.5);
    light.position.y = 4.4;
    pillarGroup.add(light);

    this.scene.add(pillarGroup);
    this.braziers.push(crystal);
  }

  createHealthRelic(x, z) {
    const relicGroup = new THREE.Group();
    relicGroup.position.set(x, 0.2, z);

    // Base Pad
    const pad = new THREE.Mesh(
      new THREE.CylinderGeometry(1.8, 2.0, 0.35, 16),
      new THREE.MeshStandardMaterial({ color: 0x111e2e, roughness: 0.75, metalness: 0.2 })
    );
    relicGroup.add(pad);

    // Floating Green Healing Relic
    const crossMat = new THREE.MeshStandardMaterial({
      color: 0x10b981,
      emissive: 0x10b981,
      emissiveIntensity: 3.0
    });

    const boxV = new THREE.Mesh(new THREE.BoxGeometry(0.4, 1.4, 0.4), crossMat);
    const boxH = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.4, 0.4), crossMat);
    boxV.position.y = 1.4;
    boxH.position.y = 1.4;

    const orbGroup = new THREE.Group();
    orbGroup.add(boxV);
    orbGroup.add(boxH);
    relicGroup.add(orbGroup);

    // Load authentic ARAM Health Relic 3D model if available
    gltfLoader.load('/models/aram_health_relic.glb', (gltf) => {
      const model = gltf.scene;
      model.scale.set(1.6, 1.6, 1.6);
      model.position.y = 0.2;
      relicGroup.add(model);
    }, undefined, () => {});

    const light = new THREE.PointLight(0x10b981, 2.5, 14, 1.8);
    light.position.y = 1.4;
    relicGroup.add(light);

    this.scene.add(relicGroup);
    this.relics.push({
      group: relicGroup,
      orb: orbGroup,
      light,
      x,
      z,
      radius: 2.2,
      available: true,
      respawnTimer: 0
    });
  }

  buildSnow() {
    const count = 2200;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    const velocities = [];

    for (let i = 0; i < count; i++) {
      positions[i * 3 + 0] = (Math.random() - 0.5) * 160;
      positions[i * 3 + 1] = Math.random() * 50 - 5;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 280;

      velocities.push({
        y: -0.07 - Math.random() * 0.12,
        x: -0.03 - Math.random() * 0.04,
        sway: Math.random() * Math.PI * 2
      });
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    // Crisp glowing ice/snow particle canvas
    const snowCanvas = document.createElement('canvas');
    snowCanvas.width = 32;
    snowCanvas.height = 32;
    const sCtx = snowCanvas.getContext('2d');
    const grad = sCtx.createRadialGradient(16, 16, 0, 16, 16, 16);
    grad.addColorStop(0, 'rgba(255, 255, 255, 1.0)');
    grad.addColorStop(0.35, 'rgba(186, 230, 253, 0.7)');
    grad.addColorStop(1, 'rgba(186, 230, 253, 0)');
    sCtx.fillStyle = grad;
    sCtx.fillRect(0, 0, 32, 32);
    const snowTex = new THREE.CanvasTexture(snowCanvas);

    const material = new THREE.PointsMaterial({
      map: snowTex,
      color: 0xe0f2fe,
      size: 0.75,
      transparent: true,
      opacity: 0.85,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    });

    this.snowParticles = new THREE.Points(geometry, material);
    this.snowVelocities = velocities;
    this.scene.add(this.snowParticles);
  }

  buildHexgates() {
    const coords = [
      { x: 8, z: 80, rotY: 0 },
      { x: -8, z: -80, rotY: Math.PI }
    ];

    coords.forEach(pos => {
      gltfLoader.load('/models/hexgate.glb', (gltf) => {
        const gate = gltf.scene;
        gate.scale.set(1.4, 1.4, 1.4);
        gate.position.set(pos.x, 0.1, pos.z);
        gate.rotation.y = pos.rotY;
        gate.traverse(c => {
          if (c.isMesh) {
            c.castShadow = true;
            c.receiveShadow = true;
          }
        });
        this.scene.add(gate);
      });
    });
  }

  buildPoros() {
    this.poros = [];
    const spawnPositions = [
      { x: -7, z: 25 },
      { x: 6, z: -15 },
      { x: -5, z: -40 },
      { x: 7, z: 50 }
    ];

    spawnPositions.forEach((pos) => {
      gltfLoader.load('/models/poro.glb', (gltf) => {
        const poro = gltf.scene;
        poro.scale.set(1.2, 1.2, 1.2);
        poro.position.set(pos.x, 0.1, pos.z);
        poro.traverse(c => {
          if (c.isMesh) {
            c.castShadow = true;
            c.receiveShadow = true;
          }
        });
        this.scene.add(poro);

        let mixer = null;
        if (gltf.animations && gltf.animations.length > 0) {
          mixer = new THREE.AnimationMixer(poro);
          const clip = gltf.animations.find(a => a.name.toLowerCase().includes('idle')) || gltf.animations[0];
          mixer.clipAction(clip).play();
        }

        this.poros.push({
          mesh: poro,
          mixer,
          basePos: new THREE.Vector3(pos.x, 0.1, pos.z)
        });
      });
    });
  }

  update(delta, time) {
    if (this.poros) {
      this.poros.forEach(p => {
        if (p.mixer) p.mixer.update(delta);
      });
    }

    if (this.statueMixers) {
      this.statueMixers.forEach(m => m.update(delta));
    }

    this.braziers.forEach((crystal, index) => {
      crystal.rotation.y += 0.025;
      crystal.rotation.x = Math.sin(time * 2 + index) * 0.2;
    });

    this.relics.forEach((relic) => {
      if (relic.available) {
        relic.orb.rotation.y += 0.03;
        relic.orb.position.y = 1.4 + Math.sin(time * 3) * 0.2;
      } else {
        relic.respawnTimer -= delta;
        if (relic.respawnTimer <= 0) {
          relic.available = true;
          relic.orb.visible = true;
          relic.light.intensity = 2.5;
        }
      }
    });

    if (this.snowParticles) {
      const positions = this.snowParticles.geometry.attributes.position.array;
      for (let i = 0; i < this.snowVelocities.length; i++) {
        const vel = this.snowVelocities[i];
        vel.sway += 0.02;
        positions[i * 3 + 1] += vel.y;
        positions[i * 3 + 0] += vel.x + Math.sin(vel.sway) * 0.02;

        if (positions[i * 3 + 1] < -25) {
          positions[i * 3 + 1] = 40;
          positions[i * 3 + 0] = (Math.random() - 0.5) * 160;
        }
      }
      this.snowParticles.geometry.attributes.position.needsUpdate = true;
    }
  }
}
