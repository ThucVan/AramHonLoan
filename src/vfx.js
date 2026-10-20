import * as THREE from 'three';

export class VFXSystem {
  constructor(scene) {
    this.scene = scene;
    this.clickMarkers = [];
    this.particles = [];
    this.damageNumbers = [];
    this.container = document.getElementById('damage-layer');

    // Create pooled particle geometry
    this.shardGeo = new THREE.TetrahedronGeometry(0.2, 0);
    this.shardMat = new THREE.MeshBasicMaterial({
      color: 0x67e8f9,
      wireframe: false
    });
  }

  // Spawn right click green ring
  spawnClickMarker(x, z) {
    const ringGeo = new THREE.RingGeometry(0.4, 0.65, 32);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x22c55e,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.9
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = -Math.PI / 2;
    ring.position.set(x, 0.05, z);
    this.scene.add(ring);

    // Inner rune diamond
    const diamondGeo = new THREE.BufferGeometry();
    const vertices = new Float32Array([
      0, 0.05, -0.4,
      0.4, 0.05, 0,
      0, 0.05, 0.4,
      -0.4, 0.05, 0,
      0, 0.05, -0.4
    ]);
    diamondGeo.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
    const diamondMat = new THREE.LineBasicMaterial({ color: 0x4ade80, linewidth: 2 });
    const diamond = new THREE.Line(diamondGeo, diamondMat);
    diamond.position.set(x, 0.05, z);
    this.scene.add(diamond);

    this.clickMarkers.push({
      ring,
      diamond,
      scale: 1.0,
      opacity: 1.0,
      age: 0
    });
  }

  // Spawn ice explosion shards on spell impact
  spawnIceExplosion(pos, color = 0x38bdf8, count = 16) {
    for (let i = 0; i < count; i++) {
      const mat = new THREE.MeshBasicMaterial({ color, wireframe: false });
      const mesh = new THREE.Mesh(this.shardGeo, mat);
      mesh.position.copy(pos);
      mesh.scale.setScalar(0.4 + Math.random() * 0.8);

      const angle = Math.random() * Math.PI * 2;
      const speed = 4 + Math.random() * 8;
      const velocity = new THREE.Vector3(
        Math.cos(angle) * speed,
        2 + Math.random() * 6,
        Math.sin(angle) * speed
      );

      this.scene.add(mesh);
      this.particles.push({
        mesh,
        velocity,
        gravity: -18,
        rotSpeed: new THREE.Vector3(Math.random() * 10, Math.random() * 10, Math.random() * 10),
        life: 0.6 + Math.random() * 0.3,
        maxLife: 0.9
      });
    }
  }

  // Spawn floating damage text on screen
  spawnDamageNumber(text, worldPos, type = 'normal') {
    if (!this.container) return;
    const el = document.createElement('div');
    el.className = `damage-text ${type}`;
    el.textContent = text;
    this.container.appendChild(el);

    this.damageNumbers.push({
      el,
      pos: worldPos.clone().add(new THREE.Vector3((Math.random() - 0.5) * 0.8, 2.5, (Math.random() - 0.5) * 0.8)),
      offsetY: 0,
      opacity: 1,
      life: 0.9
    });
  }

  update(delta, camera) {
    // 1. Update click markers
    for (let i = this.clickMarkers.length - 1; i >= 0; i--) {
      const m = this.clickMarkers[i];
      m.age += delta;
      m.scale += delta * 1.5;
      m.opacity = Math.max(0, 1 - m.age / 0.35);

      m.ring.scale.set(m.scale, m.scale, 1);
      m.diamond.scale.set(m.scale, m.scale, 1);
      m.ring.material.opacity = m.opacity;

      if (m.age >= 0.35) {
        this.scene.remove(m.ring);
        this.scene.remove(m.diamond);
        m.ring.geometry.dispose();
        m.ring.material.dispose();
        m.diamond.geometry.dispose();
        m.diamond.material.dispose();
        this.clickMarkers.splice(i, 1);
      }
    }

    // 2. Update particle shards
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life -= delta;
      p.velocity.y += p.gravity * delta;
      p.mesh.position.addScaledVector(p.velocity, delta);

      p.mesh.rotation.x += p.rotSpeed.x * delta;
      p.mesh.rotation.y += p.rotSpeed.y * delta;
      p.mesh.scale.multiplyScalar(0.96);

      if (p.life <= 0) {
        this.scene.remove(p.mesh);
        p.mesh.material.dispose();
        this.particles.splice(i, 1);
      }
    }

    // 3. Update floating damage numbers (Project to Screen)
    if (this.damageNumbers.length > 0 && camera) {
      const tempVec = new THREE.Vector3();
      const halfW = window.innerWidth / 2;
      const halfH = window.innerHeight / 2;

      for (let i = this.damageNumbers.length - 1; i >= 0; i--) {
        const d = this.damageNumbers[i];
        d.life -= delta;
        d.offsetY += delta * 35; // float upward in px

        tempVec.copy(d.pos);
        tempVec.project(camera);

        // Check if in front of camera
        if (tempVec.z < 1) {
          const x = (tempVec.x * halfW) + halfW;
          const y = -(tempVec.y * halfH) + halfH - d.offsetY;
          d.el.style.transform = `translate(-50%, -50%) translate3d(${x}px, ${y}px, 0)`;
          d.el.style.opacity = Math.min(1, d.life / 0.3);
        }

        if (d.life <= 0) {
          d.el.remove();
          this.damageNumbers.splice(i, 1);
        }
      }
    }
  }
}
