import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';

// Setup Draco & GLTF Loaders
const dracoLoader = new DRACOLoader();
dracoLoader.setDecoderPath('/draco/');

export const gltfLoader = new GLTFLoader();
gltfLoader.setDRACOLoader(dracoLoader);

// 3D Billboard Health Bar for any unit (Player, Bot, Minion, Turret, Nexus)
export function createHealthBar(color = '#22c55e', width = 2.2, height = 0.28, posY = 3.1) {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 32;
  const ctx = canvas.getContext('2d');

  const texture = new THREE.CanvasTexture(canvas);
  texture.minFilter = THREE.LinearFilter;

  const mat = new THREE.SpriteMaterial({ map: texture, transparent: true, depthTest: false });
  const sprite = new THREE.Sprite(mat);
  sprite.scale.set(width, height, 1);
  sprite.position.y = posY;

  function updateBar(currentHp, maxHp, currentMp = null, maxMp = null) {
    ctx.clearRect(0, 0, 256, 32);

    ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(2, 2, 252, 28, 4);
    ctx.fill();
    ctx.stroke();

    const hpRatio = Math.max(0, Math.min(1, currentHp / maxHp));
    ctx.fillStyle = color;
    ctx.fillRect(4, 4, Math.floor(244 * hpRatio), currentMp !== null ? 14 : 24);

    if (currentMp !== null && maxMp) {
      const mpRatio = Math.max(0, Math.min(1, currentMp / maxMp));
      ctx.fillStyle = '#0284c7';
      ctx.fillRect(4, 20, Math.floor(244 * mpRatio), 8);
    }

    texture.needsUpdate = true;
  }

  updateBar(100, 100);
  return { sprite, updateBar };
}

// Minion Class
export class Minion {
  constructor(scene, isAllied, type = 'melee', x = 0, z = 0) {
    this.scene = scene;
    this.isAllied = isAllied;
    this.type = type; // 'melee' | 'caster' | 'super'
    this.isDead = false;
    this.attackCooldown = 0;
    this.target = null;

    if (type === 'melee') {
      this.maxHp = 450;
      this.hp = 450;
      this.damage = 22;
      this.range = 2.4;
      this.speed = 7.0;
      this.mesh = this.createMeleeMesh(isAllied);
    } else if (type === 'caster') {
      this.maxHp = 280;
      this.hp = 280;
      this.damage = 35;
      this.range = 8.5;
      this.speed = 7.0;
      this.mesh = this.createCasterMesh(isAllied);
    } else { // 'super'
      this.maxHp = 1200;
      this.hp = 1200;
      this.damage = 75;
      this.range = 3.0;
      this.speed = 6.0;
      this.mesh = this.createSuperMesh(isAllied);
    }

    this.mesh.position.set(x, 0, z);
    this.scene.add(this.mesh);

    this.healthBar = createHealthBar(isAllied ? '#38bdf8' : '#ef4444', 1.4, 0.18, type === 'super' ? 2.6 : 1.7);
    this.mesh.add(this.healthBar.sprite);
    this.healthBar.updateBar(this.hp, this.maxHp);
  }

  createMeleeMesh(isAllied) {
    const group = new THREE.Group();
    const color = isAllied ? 0x2563eb : 0xd97706;

    // Body
    const body = new THREE.Mesh(
      new THREE.CylinderGeometry(0.35, 0.48, 0.85, 8),
      new THREE.MeshStandardMaterial({ color, roughness: 0.5 })
    );
    body.position.y = 0.65;
    body.castShadow = true;
    group.add(body);
    group.body = body;

    // Shield on left arm
    const shieldArm = new THREE.Group();
    shieldArm.position.set(0.45, 0.65, 0);
    const shield = new THREE.Mesh(
      new THREE.BoxGeometry(0.12, 0.65, 0.5),
      new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.8 })
    );
    shieldArm.add(shield);
    group.add(shieldArm);
    group.shieldArm = shieldArm;

    // Sword on right arm
    const swordArm = new THREE.Group();
    swordArm.position.set(-0.45, 0.65, 0);
    const sword = new THREE.Mesh(
      new THREE.BoxGeometry(0.08, 0.8, 0.18),
      new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.9 })
    );
    sword.position.y = 0.25;
    sword.position.z = 0.2;
    swordArm.add(sword);
    group.add(swordArm);
    group.swordArm = swordArm;

    // Helmet
    const helmet = new THREE.Mesh(
      new THREE.SphereGeometry(0.24, 8, 8),
      new THREE.MeshStandardMaterial({ color: isAllied ? 0x60a5fa : 0xf87171, emissive: isAllied ? 0x2563eb : 0xd97706, emissiveIntensity: 1.5 })
    );
    helmet.position.y = 1.15;
    group.add(helmet);

    // Left and Right Legs
    const legGeo = new THREE.CylinderGeometry(0.1, 0.12, 0.45, 6);
    const legMat = new THREE.MeshStandardMaterial({ color: 0x1e293b });

    const leftLeg = new THREE.Mesh(legGeo, legMat);
    leftLeg.position.set(-0.2, 0.22, 0);
    group.add(leftLeg);
    group.leftLeg = leftLeg;

    const rightLeg = new THREE.Mesh(legGeo, legMat);
    rightLeg.position.set(0.2, 0.22, 0);
    group.add(rightLeg);
    group.rightLeg = rightLeg;

    return group;
  }

  createCasterMesh(isAllied) {
    const group = new THREE.Group();
    const color = isAllied ? 0x1d4ed8 : 0xb45309;
    const robe = new THREE.Mesh(
      new THREE.ConeGeometry(0.42, 0.95, 8),
      new THREE.MeshStandardMaterial({ color, roughness: 0.6 })
    );
    robe.position.y = 0.65;
    robe.castShadow = true;
    group.add(robe);

    // Wand Arm
    const wandArm = new THREE.Group();
    wandArm.position.set(0.4, 0.65, 0);
    const wand = new THREE.Mesh(
      new THREE.CylinderGeometry(0.04, 0.04, 1.1, 6),
      new THREE.MeshStandardMaterial({ color: 0x64748b })
    );
    wand.position.y = 0.35;
    wandArm.add(wand);

    const orb = new THREE.Mesh(
      new THREE.SphereGeometry(0.15, 8, 8),
      new THREE.MeshStandardMaterial({ color: isAllied ? 0x38bdf8 : 0xf97316, emissive: isAllied ? 0x38bdf8 : 0xf97316, emissiveIntensity: 2.2 })
    );
    orb.position.y = 0.9;
    wandArm.add(orb);
    group.add(wandArm);
    group.wandArm = wandArm;

    // Legs
    const legGeo = new THREE.CylinderGeometry(0.09, 0.1, 0.45, 6);
    const legMat = new THREE.MeshStandardMaterial({ color: 0x1e293b });
    const leftLeg = new THREE.Mesh(legGeo, legMat);
    leftLeg.position.set(-0.18, 0.22, 0);
    group.add(leftLeg);
    group.leftLeg = leftLeg;

    const rightLeg = new THREE.Mesh(legGeo, legMat);
    rightLeg.position.set(0.18, 0.22, 0);
    group.add(rightLeg);
    group.rightLeg = rightLeg;

    return group;
  }

  createSuperMesh(isAllied) {
    const group = new THREE.Group();
    gltfLoader.load('/models/bear.glb', (gltf) => {
      const bear = gltf.scene;
      bear.scale.set(1.5, 1.5, 1.5);
      bear.rotation.y = isAllied ? Math.PI : 0;
      bear.traverse(c => {
        if (c.isMesh) {
          c.castShadow = true;
          c.receiveShadow = true;
          c.material = new THREE.MeshStandardMaterial({
            color: isAllied ? 0x1e40af : 0x991b1b,
            emissive: isAllied ? 0x38bdf8 : 0xef4444,
            emissiveIntensity: 0.6
          });
        }
      });
      group.add(bear);
    }, undefined, () => {
      const body = new THREE.Mesh(
        new THREE.BoxGeometry(1.2, 1.8, 1.2),
        new THREE.MeshStandardMaterial({ color: isAllied ? 0x1e40af : 0x991b1b, metalness: 0.6 })
      );
      body.position.y = 0.9;
      group.add(body);
    });
    return group;
  }

  takeDamage(amount, vfx) {
    if (this.isDead) return;
    this.hp = Math.max(0, this.hp - amount);
    this.healthBar.updateBar(this.hp, this.maxHp);
    if (this.hp <= 0) {
      this.die(vfx);
    }
  }

  die(vfx) {
    this.isDead = true;
    this.mesh.visible = false;
    vfx.spawnIceExplosion(this.mesh.position, this.isAllied ? 0x38bdf8 : 0xf97316, 12);
    setTimeout(() => {
      this.scene.remove(this.mesh);
    }, 100);
  }

  // Combat update: fight enemy minions first, then turrets/champion
  update(delta, enemyMinions, enemyTurrets, enemyChampions, vfx, sounds, projectileList) {
    if (this.isDead) return;

    this.attackCooldown = Math.max(0, this.attackCooldown - delta);

    // 1. Target acquisition: Prioritize closest opposing minion!
    if (!this.target || this.target.isDead) {
      let closest = null;
      let closestDist = 14.0; // Aggro vision range

      // Check enemy minions first!
      for (const m of enemyMinions) {
        if (m.isDead) continue;
        const d = this.mesh.position.distanceTo(m.mesh.position);
        if (d < closestDist) {
          closestDist = d;
          closest = m;
        }
      }

      // If no minion, target enemy turret
      if (!closest) {
        for (const t of enemyTurrets) {
          if (t.isDestroyed) continue;
          const d = this.mesh.position.distanceTo(t.group.position);
          if (d < 18.0) {
            closest = t;
            break;
          }
        }
      }

      // If no turret, target enemy champion
      if (!closest) {
        for (const c of enemyChampions) {
          if (c.isDead) continue;
          const d = this.mesh.position.distanceTo(c.mesh.position);
          if (d < 10.0) {
            closest = c;
            break;
          }
        }
      }

      this.target = closest;
    }

    const marchDir = this.isAllied ? -1 : 1; // Allied march to -Z, Enemy to +Z

    let isMinionWalking = false;

    if (this.target && !this.target.isDead && !this.target.isDestroyed) {
      const targetPos = this.target.mesh ? this.target.mesh.position : this.target.group.position;
      const toTarget = new THREE.Vector3().subVectors(targetPos, this.mesh.position);
      toTarget.y = 0;
      const dist = toTarget.length();

      // Look at target
      this.mesh.rotation.y = Math.atan2(toTarget.x, toTarget.z) + Math.PI;

      if (dist > this.range) {
        // Move closer
        isMinionWalking = true;
        toTarget.normalize();
        this.mesh.position.addScaledVector(toTarget, this.speed * delta);
      } else {
        // In range: ATTACK!
        if (this.attackCooldown <= 0) {
          this.attackCooldown = 1.1;

          if (this.type === 'caster') {
            this.launchCasterBolt(targetPos, this.target, projectileList, vfx, sounds);
          } else {
            this.target.takeDamage(this.damage, vfx);
            vfx.spawnIceExplosion(targetPos, this.isAllied ? 0x60a5fa : 0xf97316, 6);
          }
        }
      }
    } else {
      // March down lane
      isMinionWalking = true;
      this.mesh.position.z += marchDir * this.speed * delta;
      this.mesh.rotation.y = marchDir === -1 ? Math.PI : 0;
    }

    // Dynamic limb animation (walking & attacking)
    this.walkCycle = (this.walkCycle || 0) + (isMinionWalking ? delta * 12.0 : 0);
    if (this.mesh.leftLeg && this.mesh.rightLeg) {
      if (isMinionWalking) {
        this.mesh.leftLeg.rotation.x = Math.sin(this.walkCycle) * 0.55;
        this.mesh.rightLeg.rotation.x = -Math.sin(this.walkCycle) * 0.55;
        this.mesh.position.y = Math.abs(Math.sin(this.walkCycle)) * 0.08;
      } else {
        this.mesh.leftLeg.rotation.x = THREE.MathUtils.lerp(this.mesh.leftLeg.rotation.x, 0, 0.2);
        this.mesh.rightLeg.rotation.x = THREE.MathUtils.lerp(this.mesh.rightLeg.rotation.x, 0, 0.2);
        this.mesh.position.y = 0;
      }
    }
    if (this.mesh.swordArm) {
      if (this.attackCooldown > 0.7) {
        this.mesh.swordArm.rotation.x = THREE.MathUtils.lerp(this.mesh.swordArm.rotation.x, -1.2, 0.35);
      } else {
        this.mesh.swordArm.rotation.x = THREE.MathUtils.lerp(this.mesh.swordArm.rotation.x, isMinionWalking ? Math.sin(this.walkCycle) * 0.3 : 0, 0.2);
      }
    }
    if (this.mesh.wandArm) {
      if (this.attackCooldown > 0.7) {
        this.mesh.wandArm.rotation.x = THREE.MathUtils.lerp(this.mesh.wandArm.rotation.x, -0.9, 0.35);
      } else {
        this.mesh.wandArm.rotation.x = THREE.MathUtils.lerp(this.mesh.wandArm.rotation.x, isMinionWalking ? -Math.sin(this.walkCycle) * 0.25 : 0, 0.2);
      }
    }
  }

  launchCasterBolt(targetPos, targetRef, projectileList, vfx, sounds) {
    const orb = new THREE.Mesh(
      new THREE.SphereGeometry(0.2, 8, 8),
      new THREE.MeshBasicMaterial({ color: this.isAllied ? 0x38bdf8 : 0xf97316 })
    );
    orb.position.copy(this.mesh.position).add(new THREE.Vector3(0, 1.0, 0));
    this.scene.add(orb);

    const dir = new THREE.Vector3().subVectors(targetPos, orb.position).normalize();
    projectileList.push({
      mesh: orb,
      targetRef,
      speed: 18.0,
      damage: this.damage,
      isAllied: this.isAllied,
      vfx
    });
  }
}

// Structure Class (Turrets, Inhibitors, Nexus)
export class Structure {
  constructor(scene, name, isAllied, x, z, type = 'outer_turret') {
    this.scene = scene;
    this.name = name;
    this.isAllied = isAllied;
    this.type = type; // 'outer_turret' | 'inner_turret' | 'inhibitor_turret' | 'inhibitor' | 'nexus'
    this.isDestroyed = false;
    this.respawnTimer = 0; // for inhibitor respawn

    this.group = new THREE.Group();
    this.group.position.set(x, 0, z);

    if (type.includes('turret')) {
      this.maxHp = 2500;
      this.hp = 2500;
      this.range = 20;
      this.damage = 180;
      this.attackCooldown = 0;
      this.buildTurretMesh(isAllied);
    } else if (type === 'inhibitor') {
      this.maxHp = 2000;
      this.hp = 2000;
      this.range = 0;
      this.buildInhibitorMesh(isAllied);
    } else { // 'nexus'
      this.maxHp = 3500;
      this.hp = 3500;
      this.range = 0;
      this.buildNexusMesh(isAllied);
    }

    this.scene.add(this.group);

    // Health Bar
    const barHeight = type.includes('turret') ? 10.5 : type === 'nexus' ? 8.5 : 4.0;
    this.healthBar = createHealthBar(isAllied ? '#0284c7' : '#dc2626', 3.0, 0.35, barHeight);
    this.group.add(this.healthBar.sprite);
    this.healthBar.updateBar(this.hp, this.maxHp);
  }

  buildTurretMesh(isAllied) {
    const baseGeo = new THREE.CylinderGeometry(1.6, 2.2, 5.0, 6);
    const baseMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.7 });
    const base = new THREE.Mesh(baseGeo, baseMat);
    base.position.y = 2.5;
    base.castShadow = true;
    this.group.add(base);

    // Floating Crystal
    const crystalColor = isAllied ? 0x0ea5e9 : 0xf97316;
    const crystalMat = new THREE.MeshStandardMaterial({
      color: crystalColor,
      emissive: crystalColor,
      emissiveIntensity: 2.8,
      roughness: 0.1
    });
    this.crystal = new THREE.Mesh(new THREE.OctahedronGeometry(1.2, 0), crystalMat);
    this.crystal.position.y = 8.5;
    this.group.add(this.crystal);

    // Range Ring
    const ringMat = new THREE.MeshBasicMaterial({ color: crystalColor, side: THREE.DoubleSide, transparent: true, opacity: 0.22 });
    const rangeRing = new THREE.Mesh(new THREE.RingGeometry(this.range - 0.2, this.range, 64), ringMat);
    rangeRing.rotation.x = -Math.PI / 2;
    rangeRing.position.y = 0.05;
    this.group.add(rangeRing);

    // Laser
    const laserMat = new THREE.LineBasicMaterial({ color: isAllied ? 0x38bdf8 : 0xef4444, linewidth: 3, transparent: true, opacity: 0.85 });
    const laserGeo = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, 8.5, 0), new THREE.Vector3(0, 0, 0)]);
    this.laser = new THREE.Line(laserGeo, laserMat);
    this.laser.visible = false;
    this.group.add(this.laser);
  }

  buildInhibitorMesh(isAllied) {
    const pad = new THREE.Mesh(
      new THREE.CylinderGeometry(2.0, 2.4, 1.2, 8),
      new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.8 })
    );
    pad.position.y = 0.6;
    this.group.add(pad);

    const crystalColor = isAllied ? 0x38bdf8 : 0xf87171;
    this.crystal = new THREE.Mesh(
      new THREE.DodecahedronGeometry(1.2),
      new THREE.MeshStandardMaterial({ color: crystalColor, emissive: crystalColor, emissiveIntensity: 2.5 })
    );
    this.crystal.position.y = 2.4;
    this.group.add(this.crystal);
  }

  buildNexusMesh(isAllied) {
    const base = new THREE.Mesh(
      new THREE.CylinderGeometry(3.5, 4.5, 2.0, 8),
      new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.7 })
    );
    base.position.y = 1.0;
    this.group.add(base);

    const crystalColor = isAllied ? 0x0284c7 : 0xb91c1c;
    this.crystal = new THREE.Mesh(
      new THREE.OctahedronGeometry(2.4, 0),
      new THREE.MeshStandardMaterial({ color: crystalColor, emissive: crystalColor, emissiveIntensity: 3.2 })
    );
    this.crystal.position.y = 5.0;
    this.group.add(this.crystal);
  }

  takeDamage(amount, vfx) {
    if (this.isDestroyed) return;
    this.hp = Math.max(0, this.hp - amount);
    this.healthBar.updateBar(this.hp, this.maxHp);
    vfx.spawnDamageNumber(`-${amount}`, this.group.position, 'normal');

    if (this.hp <= 0) {
      this.destroy(vfx);
    }
  }

  destroy(vfx) {
    this.isDestroyed = true;
    this.group.visible = false;
    vfx.spawnIceExplosion(this.group.position, this.isAllied ? 0x0284c7 : 0xef4444, 40);

    // If inhibitor, respawn in 60s
    if (this.type === 'inhibitor') {
      this.respawnTimer = 60.0;
    }
  }

  // Turret AI Priority (League logic: Enemy champion attacking ally > Minions > Champion)
  updateTurret(delta, time, enemyMinions, enemyChampions, vfx, sounds) {
    if (this.isDestroyed || !this.type.includes('turret')) return;

    this.crystal.rotation.y += 0.025;
    this.crystal.position.y = 8.5 + Math.sin(time * 2.5) * 0.25;

    let target = null;

    // 1. Target closest enemy minion
    let closestMinionDist = this.range;
    for (const m of enemyMinions) {
      if (m.isDead) continue;
      const d = this.group.position.distanceTo(m.mesh.position);
      if (d < closestMinionDist) {
        closestMinionDist = d;
        target = m;
      }
    }

    // 2. If no minion, target enemy champion
    if (!target) {
      for (const c of enemyChampions) {
        if (c.isDead) continue;
        const d = this.group.position.distanceTo(c.mesh.position);
        if (d < this.range) {
          target = c;
          break;
        }
      }
    }

    if (target) {
      this.laser.visible = true;
      const targetPos = target.mesh.position.clone().add(new THREE.Vector3(0, 1.2, 0));
      const localTarget = this.group.worldToLocal(targetPos);

      const positions = this.laser.geometry.attributes.position.array;
      positions[0] = 0;
      positions[1] = this.crystal.position.y;
      positions[2] = 0;
      positions[3] = localTarget.x;
      positions[4] = localTarget.y;
      positions[5] = localTarget.z;
      this.laser.geometry.attributes.position.needsUpdate = true;

      this.attackCooldown -= delta;
      if (this.attackCooldown <= 0) {
        this.attackCooldown = 1.3;
        sounds.playTurretShot();
        target.takeDamage(this.damage, vfx);
        vfx.spawnIceExplosion(target.mesh.position, 0xef4444, 12);
      }
    } else {
      this.laser.visible = false;
    }
  }
}

// Player Champion Class with real 3D GLTF Model and Animations
export class PlayerChampion {
  constructor(scene) {
    this.scene = scene;
    this.maxHp = 1200;
    this.hp = 1200;
    this.maxMp = 600;
    this.mp = 600;

    // Base stats & Item inventory
    this.gold = 500;
    this.inventory = [];
    this.baseMaxHp = 1200;
    this.baseMaxMp = 600;
    this.baseAd = 65;
    this.baseAp = 0;
    this.baseArmor = 28;
    this.baseSpeed = 13.0;
    this.baseLifesteal = 0.0;

    this.ad = 65;
    this.ap = 0;
    this.armor = 28;
    this.speed = 13.0;
    this.lifesteal = 0.0;

    this.targetPos = null;
    this.isDead = false;

    // Main 3D group container
    this.mesh = new THREE.Group();
    this.mesh.position.set(0, 0, 18);
    this.scene.add(this.mesh);

    // Selection Ring
    const ring = new THREE.Mesh(
      new THREE.RingGeometry(0.9, 1.1, 32),
      new THREE.MeshBasicMaterial({ color: 0x38bdf8, side: THREE.DoubleSide, transparent: true, opacity: 0.85 })
    );
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.04;
    this.mesh.add(ring);

    // Health & Mana Bar
    this.healthBar = createHealthBar('#22c55e', 2.2, 0.28, 3.2);
    this.mesh.add(this.healthBar.sprite);

    // Animation System
    this.mixer = null;
    this.actions = {};
    this.currentAction = null;
    this.modelRoot = null;

    // Fallback model while GLB loads
    this.fallbackModel = this.createFallbackModel(0x2563eb);
    this.mesh.add(this.fallbackModel);

    // Load official League Yasuo 3D Model by default
    this.loadModel('/models/yasuo.glb', 1.05);
  }

  createFallbackModel(colorHex) {
    const group = new THREE.Group();
    const body = new THREE.Mesh(
      new THREE.ConeGeometry(0.8, 1.8, 8),
      new THREE.MeshStandardMaterial({ color: colorHex, roughness: 0.5 })
    );
    body.position.y = 0.9;
    group.add(body);
    const head = new THREE.Mesh(
      new THREE.SphereGeometry(0.38, 16, 16),
      new THREE.MeshStandardMaterial({ color: 0x1e293b })
    );
    head.position.y = 2.1;
    group.add(head);
    return group;
  }

  switchModel(modelType) {
    if (this.modelRoot) {
      this.mesh.remove(this.modelRoot);
      this.modelRoot = null;
    }
    this.mixer = null;
    this.actions = {};
    this.currentAction = null;

    if (modelType === 'yasuo') {
      this.loadModel('/models/yasuo.glb', 1.05);
    } else if (modelType === 'jinx') {
      this.loadModel('/models/jinx.glb', 1.15);
    } else if (modelType === 'zed') {
      this.loadModel('/models/zed.glb', 1.15);
    } else if (modelType === 'ashe') {
      this.loadModel('/models/ashe.glb', 1.25);
    } else if (modelType === 'darius') {
      this.loadModel('/models/darius.glb', 0.95);
    } else if (modelType === 'soldier') {
      this.loadModel('/models/soldier.glb', 1.4);
    } else if (modelType === 'robot') {
      this.loadModel('/models/robot.glb', 1.1);
    }
  }

  loadCustomModel(gltf) {
    if (this.modelRoot) {
      this.mesh.remove(this.modelRoot);
      this.modelRoot = null;
    }
    this.mixer = null;
    this.actions = {};
    this.currentAction = null;

    if (this.fallbackModel) {
      this.mesh.remove(this.fallbackModel);
      this.fallbackModel = null;
    }

    this.modelRoot = gltf.scene;

    const bbox = new THREE.Box3().setFromObject(this.modelRoot);
    const size = bbox.getSize(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z);
    const targetScale = maxDim > 0 ? 2.3 / maxDim : 1.0;
    this.modelRoot.scale.set(targetScale, targetScale, targetScale);

    this.modelRoot.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });

    this.mesh.add(this.modelRoot);
    this.setupAnimations(gltf.animations);
  }

  setupAnimations(animations) {
    if (!animations || animations.length === 0) return;
    this.mixer = new THREE.AnimationMixer(this.modelRoot);

    // Dynamic resolution of League animation clips
    const idleClip = animations.find(a => {
      const n = a.name.toLowerCase();
      return (n.includes('idle') || n.includes('survey')) && !n.includes('in') && !n.includes('out') && !n.includes('lead');
    }) || animations.find(a => a.name.toLowerCase().includes('idle')) || animations[0];

    const runClip = animations.find(a => {
      const n = a.name.toLowerCase();
      return (n.includes('run') || n.includes('walk')) && !n.includes('in') && !n.includes('out') && !n.includes('haste') && !n.includes('lead');
    }) || animations.find(a => a.name.toLowerCase().includes('run')) || animations[1] || animations[0];

    const attackClip = animations.find(a => a.name.toLowerCase().includes('attack1')) || animations.find(a => a.name.toLowerCase().includes('attack')) || animations.find(a => a.name.toLowerCase().includes('spell1'));

    if (idleClip) this.actions.idle = this.mixer.clipAction(idleClip);
    if (runClip) this.actions.run = this.mixer.clipAction(runClip);
    if (attackClip) this.actions.attack = this.mixer.clipAction(attackClip);

    if (this.actions.idle) {
      this.currentAction = this.actions.idle;
      this.currentAction.play();
    }
  }

  playAttackAnimation() {
    if (this.mixer && this.actions.attack) {
      this.actions.attack.reset().fadeIn(0.1).play();
      setTimeout(() => {
        if (this.actions.attack) this.actions.attack.fadeOut(0.2);
        if (this.currentAction) this.currentAction.reset().fadeIn(0.2).play();
      }, 550);
    }
  }

  loadModel(modelPath, scale = 1.05) {
    gltfLoader.load(modelPath, (gltf) => {
      if (this.fallbackModel) {
        this.mesh.remove(this.fallbackModel);
        this.fallbackModel = null;
      }

      this.modelRoot = gltf.scene;
      this.modelRoot.scale.set(scale, scale, scale);
      this.modelRoot.traverse((child) => {
        if (child.isMesh) {
          child.castShadow = true;
          child.receiveShadow = true;
        }
      });

      this.mesh.add(this.modelRoot);
      this.setupAnimations(gltf.animations);
    }, undefined, (err) => {
      console.warn('Could not load model, using fallback', err);
    });
  }

  moveTo(targetPoint) {
    if (this.isDead) return;
    this.targetPos = new THREE.Vector3(
      Math.max(-11, Math.min(11, targetPoint.x)),
      0,
      Math.max(-115, Math.min(115, targetPoint.z))
    );
  }

  takeDamage(amount, vfx) {
    if (this.isDead) return;
    const reduction = 100 / (100 + (this.armor || 0));
    const effectiveDamage = Math.max(1, Math.round(amount * reduction));

    this.hp = Math.max(0, this.hp - effectiveDamage);
    vfx.spawnDamageNumber(`-${effectiveDamage}`, this.mesh.position, 'crit');
    this.healthBar.updateBar(this.hp, this.maxHp, this.mp, this.maxMp);
    if (this.hp <= 0) this.die();
  }

  heal(amount, vfx) {
    if (this.isDead) return;
    this.hp = Math.min(this.maxHp, this.hp + amount);
    this.mp = Math.min(this.maxMp, this.mp + amount * 0.6);
    vfx.spawnDamageNumber(`+${amount}`, this.mesh.position, 'heal');
    this.healthBar.updateBar(this.hp, this.maxHp, this.mp, this.maxMp);
  }

  die() {
    this.isDead = true;
    this.mesh.visible = false;
    setTimeout(() => {
      this.isDead = false;
      this.hp = this.maxHp;
      this.mp = this.maxMp;
      this.mesh.position.set(0, 0, 75);
      this.mesh.visible = true;
      this.healthBar.updateBar(this.hp, this.maxHp, this.mp, this.maxMp);
    }, 4000);
  }

  update(delta, time) {
    if (this.isDead) return;
    this.mp = Math.min(this.maxMp, this.mp + 15 * delta);
    this.hp = Math.min(this.maxHp, this.hp + 5 * delta);
    this.healthBar.updateBar(this.hp, this.maxHp, this.mp, this.maxMp);

    let isMoving = false;
    if (this.targetPos) {
      const toTarget = new THREE.Vector3().subVectors(this.targetPos, this.mesh.position);
      toTarget.y = 0;
      const dist = toTarget.length();

      if (dist > 0.15) {
        isMoving = true;
        const dir = toTarget.clone().normalize();

        // Smooth speed deceleration when approaching destination
        const currentSpeed = dist < 1.5 ? Math.max(2.5, this.speed * (dist / 1.5)) : this.speed;
        this.mesh.position.addScaledVector(dir, currentSpeed * delta);

        // Shortest-path smooth rotational interpolation
        const targetRot = Math.atan2(dir.x, dir.z);
        let diff = (targetRot - this.mesh.rotation.y) % (Math.PI * 2);
        if (diff < -Math.PI) diff += Math.PI * 2;
        if (diff > Math.PI) diff -= Math.PI * 2;
        this.mesh.rotation.y += diff * Math.min(1.0, 16.0 * delta);
      } else {
        this.targetPos = null;
      }
    }

    // Switch between Idle and Run animations smoothly
    if (this.mixer && this.actions.idle && this.actions.run) {
      if (isMoving && this.currentAction !== this.actions.run) {
        this.currentAction.fadeOut(0.15);
        this.actions.run.reset().fadeIn(0.15).play();
        this.currentAction = this.actions.run;
      } else if (!isMoving && this.currentAction !== this.actions.idle) {
        this.currentAction.fadeOut(0.15);
        this.actions.idle.reset().fadeIn(0.15).play();
        this.currentAction = this.actions.idle;
      }
      this.mixer.update(delta);
    } else {
      // Procedural walking animation for models without skeletal animation (e.g. Ahri)
      if (isMoving) {
        this.mesh.position.y = Math.abs(Math.sin(time * 12)) * 0.16;
        this.mesh.rotation.z = Math.sin(time * 12) * 0.05;
      } else {
        this.mesh.position.y = Math.sin(time * 2.5) * 0.04;
        this.mesh.rotation.z = 0;
      }
    }
  }
}

// Enemy Bot Class with real 3D Robot GLTF Model and Animations
export class EnemyBot {
  constructor(scene, x, z, name = 'Enemy Target') {
    this.scene = scene;
    this.maxHp = 1000;
    this.hp = 1000;
    this.isDead = false;
    this.respawnTimer = 0;
    this.spawnPos = new THREE.Vector3(x, 0, z);

    this.mesh = new THREE.Group();
    this.mesh.position.copy(this.spawnPos);
    this.scene.add(this.mesh);

    // Selection Ring
    const ring = new THREE.Mesh(
      new THREE.RingGeometry(0.9, 1.1, 32),
      new THREE.MeshBasicMaterial({ color: 0xef4444, side: THREE.DoubleSide, transparent: true, opacity: 0.85 })
    );
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.04;
    this.mesh.add(ring);

    this.healthBar = createHealthBar('#ef4444', 2.2, 0.28, 3.2);
    this.mesh.add(this.healthBar.sprite);

    this.wanderTimer = 0;
    this.wanderTarget = null;

    // Animation System
    this.mixer = null;
    this.actions = {};
    this.currentAction = null;
    this.modelRoot = null;

    this.fallbackModel = new PlayerChampion(scene).createFallbackModel(0xb91c1c);
    this.mesh.add(this.fallbackModel);

    // Load real Robot GLTF model
    gltfLoader.load('/models/robot.glb', (gltf) => {
      if (this.fallbackModel) {
        this.mesh.remove(this.fallbackModel);
        this.fallbackModel = null;
      }

      this.modelRoot = gltf.scene;
      this.modelRoot.scale.set(1.1, 1.1, 1.1);
      this.modelRoot.traverse((child) => {
        if (child.isMesh) {
          child.castShadow = true;
          child.receiveShadow = true;
        }
      });
      this.mesh.add(this.modelRoot);

      if (gltf.animations && gltf.animations.length > 0) {
        this.mixer = new THREE.AnimationMixer(this.modelRoot);
        const idleClip = THREE.AnimationClip.findByName(gltf.animations, 'Idle');
        const runClip = THREE.AnimationClip.findByName(gltf.animations, 'Running');
        const deathClip = THREE.AnimationClip.findByName(gltf.animations, 'Death');

        if (idleClip) this.actions.idle = this.mixer.clipAction(idleClip);
        if (runClip) this.actions.run = this.mixer.clipAction(runClip);
        if (deathClip) this.actions.death = this.mixer.clipAction(deathClip);

        if (this.actions.idle) {
          this.currentAction = this.actions.idle;
          this.currentAction.play();
        }
      }
    });
  }

  takeDamage(amount, vfx) {
    if (this.isDead) return;
    this.hp = Math.max(0, this.hp - amount);
    vfx.spawnDamageNumber(`-${amount}`, this.mesh.position, 'normal');
    this.healthBar.updateBar(this.hp, this.maxHp);
    if (this.hp <= 0) this.die(vfx);
  }

  die(vfx) {
    this.isDead = true;
    if (this.actions.death) {
      if (this.currentAction) this.currentAction.fadeOut(0.15);
      this.actions.death.reset().fadeIn(0.15).play();
    }
    vfx.spawnIceExplosion(this.mesh.position, 0xef4444, 25);
    this.respawnTimer = 4.0;
    setTimeout(() => {
      this.mesh.visible = false;
    }, 1200);
  }

  update(delta, time, vfx) {
    if (this.isDead) {
      this.respawnTimer -= delta;
      if (this.respawnTimer <= 0) {
        this.isDead = false;
        this.hp = this.maxHp;
        this.mesh.visible = true;
        this.mesh.position.copy(this.spawnPos);
        this.healthBar.updateBar(this.hp, this.maxHp);
        if (this.actions.idle) {
          if (this.actions.death) this.actions.death.stop();
          this.currentAction = this.actions.idle;
          this.currentAction.play();
        }
      }
      if (this.mixer) this.mixer.update(delta);
      return;
    }

    this.wanderTimer -= delta;
    if (this.wanderTimer <= 0) {
      this.wanderTimer = 2.5 + Math.random() * 2;
      this.wanderTarget = new THREE.Vector3(
        this.spawnPos.x + (Math.random() - 0.5) * 8,
        0,
        this.spawnPos.z + (Math.random() - 0.5) * 6
      );
    }

    let isMoving = false;
    if (this.wanderTarget) {
      const dir = new THREE.Vector3().subVectors(this.wanderTarget, this.mesh.position);
      dir.y = 0;
      const dist = dir.length();
      if (dist > 0.2) {
        isMoving = true;
        dir.normalize();
        this.mesh.position.addScaledVector(dir, 4.0 * delta);

        // Smooth bot turning
        const targetRot = Math.atan2(dir.x, dir.z);
        let diff = (targetRot - this.mesh.rotation.y) % (Math.PI * 2);
        if (diff < -Math.PI) diff += Math.PI * 2;
        if (diff > Math.PI) diff -= Math.PI * 2;
        this.mesh.rotation.y += diff * Math.min(1.0, 10.0 * delta);
      }
    }

    if (this.mixer && this.actions.idle && this.actions.run) {
      if (isMoving && this.currentAction !== this.actions.run) {
        this.currentAction.fadeOut(0.2);
        this.actions.run.reset().fadeIn(0.2).play();
        this.currentAction = this.actions.run;
      } else if (!isMoving && this.currentAction !== this.actions.idle) {
        this.currentAction.fadeOut(0.2);
        this.actions.idle.reset().fadeIn(0.2).play();
        this.currentAction = this.actions.idle;
      }
    }

    if (this.mixer) this.mixer.update(delta);
  }
}

