import * as THREE from 'three';

// Procedural texture generator for Adversator-style Cobblestone & Paved Stone
function createAdversatorGroundTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 1024;
  const ctx = canvas.getContext('2d');

  // Earthy stone foundation
  ctx.fillStyle = '#2c332e';
  ctx.fillRect(0, 0, 1024, 1024);

  // Cobblestone tiles grid (matching Adversator screenshot 06)
  const tileSize = 64;
  ctx.strokeStyle = '#1b1f1c';
  ctx.lineWidth = 4;

  for (let x = 0; x < 1024; x += tileSize) {
    for (let y = 0; y < 1024; y += tileSize) {
      // Offset alternate rows for realistic stone bond
      const offsetX = (Math.floor(y / tileSize) % 2) * (tileSize / 2);
      const posX = (x + offsetX) % 1024;

      // Realistic stone variance in grey-moss tones
      const base = 75 + Math.floor(Math.sin(x * 0.05 + y * 0.08) * 15);
      const greenTint = Math.floor(Math.sin(x * 0.1) * 8);
      ctx.fillStyle = `rgb(${base - 5}, ${base + greenTint}, ${base - 10})`;
      ctx.fillRect(posX + 2, y + 2, tileSize - 4, tileSize - 4);

      // Texture noise / speckling
      for (let p = 0; p < 4; p++) {
        const nx = posX + Math.random() * (tileSize - 6) + 3;
        const ny = y + Math.random() * (tileSize - 6) + 3;
        ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
        ctx.fillRect(nx, ny, 2, 2);
      }
    }
  }

  // Ancient central rune track (Adversator style)
  ctx.strokeStyle = 'rgba(245, 158, 11, 0.4)'; // Warm golden rune line
  ctx.lineWidth = 6;
  ctx.shadowColor = '#f59e0b';
  ctx.shadowBlur = 10;
  ctx.beginPath();
  ctx.moveTo(512, 0);
  ctx.lineTo(512, 1024);
  ctx.stroke();

  // Lane separator side tracks
  ctx.strokeStyle = 'rgba(56, 189, 248, 0.35)'; // Cyan magical seam
  ctx.shadowColor = '#38bdf8';
  ctx.shadowBlur = 8;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(256, 0); ctx.lineTo(256, 1024);
  ctx.moveTo(768, 0); ctx.lineTo(768, 1024);
  ctx.stroke();

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(3, 12);
  return texture;
}

export class HowlingAbyssMap {
  constructor(scene) {
    this.scene = scene;
    this.bridgeWidth = 24;
    this.bridgeLength = 240;
    this.braziers = [];
    this.relics = [];
    this.snowParticles = null;

    this.buildMap();
    this.buildBackdrop();
    this.buildSnow();
  }

  buildMap() {
    const groundTex = createAdversatorGroundTexture();

    // 1. Main Bridge Deck
    const bridgeGeo = new THREE.BoxGeometry(this.bridgeWidth, 2, this.bridgeLength);
    const bridgeMat = new THREE.MeshStandardMaterial({
      map: groundTex,
      roughness: 0.7,
      metalness: 0.15,
      color: 0xc8d3c5
    });
    this.bridgeMesh = new THREE.Mesh(bridgeGeo, bridgeMat);
    this.bridgeMesh.position.y = -1;
    this.bridgeMesh.receiveShadow = true;
    this.scene.add(this.bridgeMesh);

    // 2. Parapets / Heavy Stone Fortress Walls (Adversator style)
    const wallGeo = new THREE.BoxGeometry(1.6, 2.2, this.bridgeLength);
    const wallMat = new THREE.MeshStandardMaterial({
      color: 0x3f453f,
      roughness: 0.85,
      metalness: 0.1
    });

    const leftWall = new THREE.Mesh(wallGeo, wallMat);
    leftWall.position.set(-this.bridgeWidth / 2 + 0.8, 0.5, 0);
    leftWall.castShadow = true;
    leftWall.receiveShadow = true;
    this.scene.add(leftWall);

    const rightWall = new THREE.Mesh(wallGeo, wallMat);
    rightWall.position.set(this.bridgeWidth / 2 - 0.8, 0.5, 0);
    rightWall.castShadow = true;
    rightWall.receiveShadow = true;
    this.scene.add(rightWall);

    // 3. Ancient Stone Pillars & Torches
    for (let z = -100; z <= 100; z += 25) {
      this.createPillar(-this.bridgeWidth / 2 - 0.6, z);
      this.createPillar(this.bridgeWidth / 2 + 0.6, z);
    }

    // 4. Abyss / Chasm Fog plane beneath bridge
    const abyssGeo = new THREE.PlaneGeometry(350, 350);
    const abyssMat = new THREE.MeshBasicMaterial({ color: 0x141014, side: THREE.DoubleSide });
    const abyss = new THREE.Mesh(abyssGeo, abyssMat);
    abyss.rotation.x = -Math.PI / 2;
    abyss.position.y = -40;
    this.scene.add(abyss);

    // 5. Giant Mountain Crags & Spikes
    const spikeGeo = new THREE.ConeGeometry(6, 50, 6);
    const spikeMat = new THREE.MeshStandardMaterial({
      color: 0x2d2b33,
      roughness: 0.7,
      emissive: 0x15121c
    });

    for (let i = 0; i < 32; i++) {
      const spike = new THREE.Mesh(spikeGeo, spikeMat);
      const side = Math.random() > 0.5 ? 1 : -1;
      const x = side * (this.bridgeWidth / 2 + 10 + Math.random() * 45);
      const z = (Math.random() - 0.5) * (this.bridgeLength + 40);
      spike.position.set(x, -25 + Math.random() * 12, z);
      spike.rotation.x = (Math.random() - 0.5) * 0.4;
      spike.rotation.z = (Math.random() - 0.5) * 0.4;
      this.scene.add(spike);
    }

    // 6. Spawn Health Relics (ARAM Holy Shrines)
    this.createHealthRelic(-this.bridgeWidth / 2 + 3.8, 0);
    this.createHealthRelic(this.bridgeWidth / 2 - 3.8, 0);
  }

  // Backdrop panorama using the Adversator official sunset mountain artwork!
  buildBackdrop() {
    const loader = new THREE.TextureLoader();
    loader.load('/adversator_bg.jpg', (tex) => {
      tex.wrapS = THREE.RepeatWrapping;
      tex.wrapT = THREE.ClampToEdgeWrapping;
      tex.repeat.set(2, 1);

      // Huge cylindrical backdrop wrapping around the arena
      const cylGeo = new THREE.CylinderGeometry(180, 180, 90, 32, 1, true);
      const cylMat = new THREE.MeshBasicMaterial({
        map: tex,
        side: THREE.BackSide,
        depthWrite: false
      });
      const backdrop = new THREE.Mesh(cylGeo, cylMat);
      backdrop.position.set(0, 20, 0);
      this.scene.add(backdrop);
    });
  }

  createPillar(x, z) {
    const pillarGroup = new THREE.Group();
    pillarGroup.position.set(x, 0, z);

    // Stone Pedestal
    const baseGeo = new THREE.CylinderGeometry(1.2, 1.6, 3.8, 8);
    const baseMat = new THREE.MeshStandardMaterial({ color: 0x2c332e, roughness: 0.8 });
    const base = new THREE.Mesh(baseGeo, baseMat);
    base.position.y = 1.9;
    base.castShadow = true;
    base.receiveShadow = true;
    pillarGroup.add(base);

    // Floating Golden Flame / Rune Crystal
    const crystalGeo = new THREE.OctahedronGeometry(0.7, 0);
    const crystalMat = new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      emissive: 0xf59e0b,
      emissiveIntensity: 2.5,
      roughness: 0.1,
      metalness: 0.8
    });
    const crystal = new THREE.Mesh(crystalGeo, crystalMat);
    crystal.position.y = 4.4;
    pillarGroup.add(crystal);

    // Warm Sunset Torch Light
    const light = new THREE.PointLight(0xfbbf24, 2.5, 20, 1.4);
    light.position.y = 4.4;
    pillarGroup.add(light);

    this.scene.add(pillarGroup);
    this.braziers.push(crystal);
  }

  createHealthRelic(x, z) {
    const relicGroup = new THREE.Group();
    relicGroup.position.set(x, 0.2, z);

    const pad = new THREE.Mesh(
      new THREE.CylinderGeometry(1.6, 1.8, 0.3, 16),
      new THREE.MeshStandardMaterial({ color: 0x1e2925, roughness: 0.8 })
    );
    relicGroup.add(pad);

    const crossMat = new THREE.MeshStandardMaterial({
      color: 0x10b981,
      emissive: 0x10b981,
      emissiveIntensity: 2.8
    });

    const boxV = new THREE.Mesh(new THREE.BoxGeometry(0.4, 1.4, 0.4), crossMat);
    const boxH = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.4, 0.4), crossMat);
    boxV.position.y = 1.3;
    boxH.position.y = 1.3;

    const orbGroup = new THREE.Group();
    orbGroup.add(boxV);
    orbGroup.add(boxH);
    relicGroup.add(orbGroup);

    const light = new THREE.PointLight(0x10b981, 2.2, 12, 1.8);
    light.position.y = 1.3;
    relicGroup.add(light);

    this.scene.add(relicGroup);
    this.relics.push({
      group: relicGroup,
      orb: orbGroup,
      light,
      x,
      z,
      radius: 2.0,
      available: true,
      respawnTimer: 0
    });
  }

  buildSnow() {
    const count = 2000;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    const velocities = [];

    for (let i = 0; i < count; i++) {
      positions[i * 3 + 0] = (Math.random() - 0.5) * 150;
      positions[i * 3 + 1] = Math.random() * 45 - 5;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 260;

      velocities.push({
        y: -0.06 - Math.random() * 0.1,
        x: -0.02 - Math.random() * 0.03,
        sway: Math.random() * Math.PI * 2
      });
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    // Soft glowing particle canvas
    const snowCanvas = document.createElement('canvas');
    snowCanvas.width = 32;
    snowCanvas.height = 32;
    const sCtx = snowCanvas.getContext('2d');
    const grad = sCtx.createRadialGradient(16, 16, 0, 16, 16, 16);
    grad.addColorStop(0, 'rgba(255, 255, 255, 0.95)');
    grad.addColorStop(0.3, 'rgba(254, 240, 138, 0.6)'); // Warm amber glimmer
    grad.addColorStop(1, 'rgba(254, 240, 138, 0)');
    sCtx.fillStyle = grad;
    sCtx.fillRect(0, 0, 32, 32);
    const snowTex = new THREE.CanvasTexture(snowCanvas);

    const material = new THREE.PointsMaterial({
      map: snowTex,
      color: 0xffedd5,
      size: 0.65,
      transparent: true,
      opacity: 0.8,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    });

    this.snowParticles = new THREE.Points(geometry, material);
    this.snowVelocities = velocities;
    this.scene.add(this.snowParticles);
  }

  update(delta, time) {
    this.braziers.forEach((crystal, index) => {
      crystal.rotation.y += 0.025;
      crystal.rotation.x = Math.sin(time * 2 + index) * 0.2;
    });

    this.relics.forEach((relic) => {
      if (relic.available) {
        relic.orb.rotation.y += 0.03;
        relic.orb.position.y = 1.3 + Math.sin(time * 3) * 0.2;
      } else {
        relic.respawnTimer -= delta;
        if (relic.respawnTimer <= 0) {
          relic.available = true;
          relic.orb.visible = true;
          relic.light.intensity = 2.2;
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
          positions[i * 3 + 0] = (Math.random() - 0.5) * 150;
        }
      }
      this.snowParticles.geometry.attributes.position.needsUpdate = true;
    }
  }
}
