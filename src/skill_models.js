import * as THREE from 'three';

// 1. Zed 3D Ninja Shuriken
export function create3DShuriken() {
  const group = new THREE.Group();
  
  // Center metallic hub
  const hubGeo = new THREE.CylinderGeometry(0.35, 0.35, 0.15, 8);
  const hubMat = new THREE.MeshStandardMaterial({
    color: 0x0f172a,
    metalness: 0.9,
    roughness: 0.2
  });
  const hub = new THREE.Mesh(hubGeo, hubMat);
  group.add(hub);

  // Center glowing red eye core
  const core = new THREE.Mesh(
    new THREE.SphereGeometry(0.18, 12, 12),
    new THREE.MeshStandardMaterial({
      color: 0xef4444,
      emissive: 0xef4444,
      emissiveIntensity: 3.0
    })
  );
  core.position.y = 0.08;
  group.add(core);

  // 4 curved razor blades
  const bladeMat = new THREE.MeshStandardMaterial({
    color: 0x94a3b8,
    emissive: 0xef4444,
    emissiveIntensity: 0.8,
    metalness: 0.95,
    roughness: 0.1
  });

  for (let i = 0; i < 4; i++) {
    const angle = (i * Math.PI) / 2;
    const bladeGeo = new THREE.ConeGeometry(0.28, 1.3, 4);
    bladeGeo.rotateZ(Math.PI / 2);
    const blade = new THREE.Mesh(bladeGeo, bladeMat);
    blade.position.set(Math.cos(angle) * 0.7, 0, Math.sin(angle) * 0.7);
    blade.rotation.y = -angle;
    blade.scale.set(0.7, 1.0, 0.12);
    group.add(blade);
  }

  group.scale.set(1.2, 1.2, 1.2);
  return group;
}

// 2. Darius 3D Battle Axe
export function create3DBattleAxe() {
  const group = new THREE.Group();

  // Wooden haft
  const haft = new THREE.Mesh(
    new THREE.CylinderGeometry(0.08, 0.1, 3.2, 8),
    new THREE.MeshStandardMaterial({ color: 0x543d2b, roughness: 0.8 })
  );
  haft.position.y = 1.6;
  group.add(haft);

  // Axe Blade Head (Noxian Steel)
  const bladeMat = new THREE.MeshStandardMaterial({
    color: 0x475569,
    emissive: 0xb91c1c,
    emissiveIntensity: 1.2,
    metalness: 0.9,
    roughness: 0.25
  });

  const mainBladeGeo = new THREE.BoxGeometry(0.12, 1.2, 1.0);
  const mainBlade = new THREE.Mesh(mainBladeGeo, bladeMat);
  mainBlade.position.set(0, 2.7, 0.45);
  group.add(mainBlade);

  // Curved cutting edge
  const edgeGeo = new THREE.CylinderGeometry(0.65, 0.65, 0.06, 16, 1, false, 0, Math.PI);
  edgeGeo.rotateZ(Math.PI / 2);
  const edge = new THREE.Mesh(edgeGeo, bladeMat);
  edge.position.set(0, 2.7, 0.85);
  group.add(edge);

  // Back Spike
  const spike = new THREE.Mesh(
    new THREE.ConeGeometry(0.15, 0.7, 4),
    bladeMat
  );
  spike.rotation.x = -Math.PI / 2;
  spike.position.set(0, 2.7, -0.45);
  group.add(spike);

  return group;
}

// 3. Nautilus 3D Iron Anchor
export function create3DAnchor() {
  const group = new THREE.Group();
  const ironMat = new THREE.MeshStandardMaterial({
    color: 0x334155,
    emissive: 0x0284c7,
    emissiveIntensity: 1.5,
    metalness: 0.85,
    roughness: 0.3
  });

  // Central shank
  const shank = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.14, 2.6, 8), ironMat);
  shank.position.y = 1.3;
  group.add(shank);

  // Top stock bar
  const stock = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 1.4, 8), ironMat);
  stock.rotation.z = Math.PI / 2;
  stock.position.y = 2.3;
  group.add(stock);

  // Top ring
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.25, 0.06, 8, 16), ironMat);
  ring.position.y = 2.6;
  group.add(ring);

  // Curved flukes at bottom
  const fluke = new THREE.Mesh(
    new THREE.TorusGeometry(0.85, 0.1, 8, 16, Math.PI),
    ironMat
  );
  fluke.position.y = 0.85;
  fluke.rotation.z = Math.PI;
  group.add(fluke);

  // Fluke sharp points
  for (const side of [-1, 1]) {
    const pt = new THREE.Mesh(new THREE.ConeGeometry(0.16, 0.45, 6), ironMat);
    pt.position.set(side * 0.85, 0.9, 0);
    pt.rotation.z = side * 0.4;
    group.add(pt);
  }

  group.scale.set(1.1, 1.1, 1.1);
  return group;
}

// 4. Yasuo 3D Whirling Tornado
export function create3DTornado() {
  const group = new THREE.Group();

  const numTiers = 5;
  for (let i = 0; i < numTiers; i++) {
    const radius = 0.5 + i * 0.45;
    const ringGeo = new THREE.TorusGeometry(radius, 0.08, 6, 24);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0xbae6fd,
      transparent: true,
      opacity: 0.75 - i * 0.1,
      wireframe: false
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = Math.PI / 2;
    ring.position.y = i * 0.7;
    group.add(ring);
  }

  // Inner spiraling energy core
  const coreMat = new THREE.MeshStandardMaterial({
    color: 0x38bdf8,
    emissive: 0x38bdf8,
    emissiveIntensity: 2.8,
    transparent: true,
    opacity: 0.65
  });
  const cone = new THREE.Mesh(new THREE.ConeGeometry(1.6, 3.5, 8), coreMat);
  cone.position.y = 1.75;
  group.add(cone);

  return group;
}

// 5. Ezreal 3D Mystic Lance
export function create3DMysticLance() {
  const group = new THREE.Group();

  // Energy core spear
  const coreGeo = new THREE.ConeGeometry(0.3, 2.4, 6);
  coreGeo.rotateX(Math.PI / 2);
  const coreMat = new THREE.MeshStandardMaterial({
    color: 0xfacc15,
    emissive: 0xfef08a,
    emissiveIntensity: 3.5,
    roughness: 0.1
  });
  const spear = new THREE.Mesh(coreGeo, coreMat);
  group.add(spear);

  // Orbiting diamond stabilizer wings
  const wingMat = new THREE.MeshStandardMaterial({
    color: 0x38bdf8,
    emissive: 0x38bdf8,
    emissiveIntensity: 2.5
  });

  for (let i = 0; i < 3; i++) {
    const angle = (i * Math.PI * 2) / 3;
    const wing = new THREE.Mesh(new THREE.OctahedronGeometry(0.2, 0), wingMat);
    wing.position.set(Math.cos(angle) * 0.6, Math.sin(angle) * 0.6, -0.4);
    group.add(wing);
  }

  return group;
}
