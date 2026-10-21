import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import { KTX2Loader } from 'three/addons/loaders/KTX2Loader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';
import { parseModel } from './model_cache.js';
import {
  getChampion1451Data,
  loadDataDragonChampions,
  calculateStatsAtLevel,
  LOL_RANGE_SCALE,
  BUNDLED_CHAMPION_STATS_14_5_1
} from './champion_data.js';

export { LOL_RANGE_SCALE, getChampion1451Data, loadDataDragonChampions, calculateStatsAtLevel };

// Setup Draco & GLTF Loaders
const dracoLoader = new DRACOLoader();
dracoLoader.setDecoderPath('/draco/');

export const ktx2Loader = new KTX2Loader();
ktx2Loader.setTranscoderPath('/basis/');

export const gltfLoader = new GLTFLoader();
gltfLoader.setDRACOLoader(dracoLoader);
gltfLoader.setMeshoptDecoder(MeshoptDecoder);

export function setupLoaders(renderer) {
  if (renderer) {
    try {
      ktx2Loader.detectSupport(renderer);
      gltfLoader.setKTX2Loader(ktx2Loader);
      gltfLoader.setMeshoptDecoder(MeshoptDecoder);
      console.log('✅ KTX2Loader & MeshoptDecoder initialized successfully!');
    } catch (e) {
      console.warn('KTX2Loader setup warning:', e);
    }
  }
}

// ============================================================================
// HỆ SỐ QUY ĐỔI TẦM ĐÁNH CHUẨN LIÊN MINH HUYỀN THOẠI (LOL ATTACK RANGE SYSTEM)
// Trong LMHT: Tầm đánh Trụ = 775 -> Trong game này: 20 units (Scale = 20 / 775 ≈ 0.025806)
// ============================================================================

export const CHAMPION_ATTACK_PROFILES = {
  yasuo: {
    name: 'Yasuo',
    title: 'Kẻ Bất Dung Thứ',
    rangeLol: 175, // Cận chiến LMHT
    range: +(175 * LOL_RANGE_SCALE).toFixed(2), // ~4.52
    type: 'melee',
    attackCooldownMax: +(1.0 / 0.697).toFixed(2), // ~1.43s (0.697 AS)
    projectileColor: 0x38bdf8,
    desc: 'Cận chiến (175 tầm đánh LMHT)'
  },
  darius: {
    name: 'Darius',
    title: 'Đại Tướng Noxus',
    rangeLol: 175, // Cận chiến LMHT
    range: +(175 * LOL_RANGE_SCALE).toFixed(2), // ~4.52
    type: 'melee',
    attackCooldownMax: +(1.0 / 0.625).toFixed(2), // 1.60s (0.625 AS)
    projectileColor: 0xdc2626,
    desc: 'Cận chiến (175 tầm đánh LMHT)'
  },
  zed: {
    name: 'Zed',
    title: 'Chúa Tể Bóng Tối',
    rangeLol: 125, // Cận chiến sát thủ LMHT
    range: +(125 * LOL_RANGE_SCALE).toFixed(2), // ~3.23
    type: 'melee',
    attackCooldownMax: +(1.0 / 0.651).toFixed(2), // ~1.54s (0.651 AS)
    projectileColor: 0x9333ea,
    desc: 'Cận chiến (125 tầm đánh LMHT)'
  },
  ashe: {
    name: 'Ashe',
    title: 'Cung Băng Freljord',
    rangeLol: 600, // Xạ thủ tầm xa LMHT
    range: +(600 * LOL_RANGE_SCALE).toFixed(2), // ~15.48
    type: 'ranged',
    attackCooldownMax: +(1.0 / 0.658).toFixed(2), // ~1.52s (0.658 AS)
    projectileSpeed: 30.0,
    projectileColor: 0x67e8f9,
    desc: 'Xạ thủ tầm xa (600 tầm đánh LMHT)'
  },
  jinx: {
    name: 'Jinx',
    title: 'Khẩu Pháo Nổi Loạn',
    rangeLol: 525, // Xạ thủ tầm xa LMHT (Pow-Pow)
    range: +(525 * LOL_RANGE_SCALE).toFixed(2), // ~13.55
    type: 'ranged',
    attackCooldownMax: +(1.0 / 0.625).toFixed(2), // 1.60s (0.625 AS)
    projectileSpeed: 32.0,
    projectileColor: 0xf472b6,
    desc: 'Xạ thủ tầm xa (525 tầm đánh LMHT)'
  },
  soldier: {
    name: 'Garen (Chiến Binh)',
    title: 'Sức Mạnh Demacia',
    rangeLol: 175,
    range: +(175 * LOL_RANGE_SCALE).toFixed(2), // ~4.52
    type: 'melee',
    attackCooldownMax: +(1.0 / 0.625).toFixed(2),
    projectileColor: 0xe2e8f0,
    desc: 'Cận chiến (175 tầm đánh LMHT)'
  },
  robot: {
    name: 'Blitzcrank (Người Máy)',
    title: 'Người Máy Hơi Nước',
    rangeLol: 125,
    range: +(125 * LOL_RANGE_SCALE).toFixed(2), // ~3.23
    type: 'melee',
    attackCooldownMax: +(1.0 / 0.625).toFixed(2),
    projectileColor: 0xf59e0b,
    desc: 'Cận chiến (125 tầm đánh LMHT)'
  },
  ahri: {
    name: 'Ahri',
    title: 'Hồ Ly Chín Đuôi',
    rangeLol: 550, // Pháp sư tầm xa LMHT
    range: +(550 * LOL_RANGE_SCALE).toFixed(2), // ~14.19
    type: 'ranged',
    attackCooldownMax: +(1.0 / 0.668).toFixed(2), // ~1.50s (0.668 AS)
    projectileSpeed: 30.0,
    projectileColor: 0x38bdf8,
    desc: 'Pháp sư tầm xa (550 tầm đánh LMHT)'
  }
};

export function createChampionFallbackModel(colorHex) {
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
      this.maxHp = 475;
      this.hp = 475;
      this.armor = 18;
      this.damage = 24;
      this.rangeLol = 110; // Tầm đánh cận chiến LMHT (110)
      this.range = +(110 * LOL_RANGE_SCALE).toFixed(2); // ~2.84
      this.speed = 7.0;
      this.mesh = this.createMeleeMesh(isAllied);
    } else if (type === 'caster') {
      this.maxHp = 290;
      this.hp = 290;
      this.armor = 6;
      this.damage = 36;
      this.rangeLol = 550; // Tầm đánh xạ thủ/phép thuật LMHT (550)
      this.range = +(550 * LOL_RANGE_SCALE).toFixed(2); // ~14.19
      this.speed = 7.0;
      this.mesh = this.createCasterMesh(isAllied);
    } else { // 'super'
      this.maxHp = 1500;
      this.hp = 1500;
      this.armor = 40;
      this.damage = 85;
      this.rangeLol = 170; // Tầm đánh lính siêu cấp LMHT (170)
      this.range = +(170 * LOL_RANGE_SCALE).toFixed(2); // ~4.39
      this.speed = 6.0;
      this.mesh = this.createSuperMesh(isAllied);
    }

    this.mesh.position.set(x, 0, z);
    this.scene.add(this.mesh);

    this.healthBar = createHealthBar(isAllied ? '#38bdf8' : '#ef4444', 1.4, 0.18, type === 'super' ? 2.6 : 1.7);
    this.mesh.add(this.healthBar.sprite);
    this.healthBar.updateBar(this.hp, this.maxHp);
  }

  applyMinionModel(group, gltf, targetHeight) {
    const model = gltf.scene;
    const box = new THREE.Box3().setFromObject(model);
    const size = box.getSize(new THREE.Vector3());
    const s = targetHeight / (size.y || 1);
    model.scale.set(s, s, s);
    box.setFromObject(model);
    model.position.y = -box.min.y;
    model.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });
    group.add(model);

    if (gltf.animations && gltf.animations.length > 0) {
      group.mixer = new THREE.AnimationMixer(model);
      const clip = gltf.animations.find(a => a.name.toLowerCase() === 'run' || a.name.toLowerCase().includes('run') || a.name.toLowerCase().includes('walk')) || gltf.animations[0];
      if (clip) {
        group.action = group.mixer.clipAction(clip);
        group.action.play();
      }
    }
  }

  createMeleeMesh(isAllied) {
    const group = new THREE.Group();
    const modelUrl = isAllied ? '/models/minion_melee_order.glb' : '/models/minion_melee_chaos.glb';
    parseModel(modelUrl, (gltf) => {
      this.applyMinionModel(group, gltf, 1.35);
    });
    return group;
  }

  createCasterMesh(isAllied) {
    const group = new THREE.Group();
    const modelUrl = isAllied ? '/models/minion_ranged_order.glb' : '/models/minion_ranged_chaos.glb';
    parseModel(modelUrl, (gltf) => {
      this.applyMinionModel(group, gltf, 1.35);
    });
    return group;
  }

  createSuperMesh(isAllied) {
    const group = new THREE.Group();
    const modelUrl = isAllied ? '/models/minion_super_order.glb' : '/models/minion_super_chaos.glb';
    parseModel(modelUrl, (gltf) => {
      this.applyMinionModel(group, gltf, 2.4);
    });
    return group;
  }

  takeDamage(amount, vfx) {
    if (this.isDead) return;
    const reduction = 100 / (100 + (this.armor || 0));
    const effectiveDamage = Math.max(1, Math.round(amount * reduction));
    this.hp = Math.max(0, this.hp - effectiveDamage);
    this.healthBar.updateBar(this.hp, this.maxHp);
    if (vfx) {
      vfx.spawnDamageNumber(`-${effectiveDamage}`, this.mesh.position, 'normal');
    }
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
      let closestDist = 18.0; // Aggro vision range (chuẩn tầm bao quát theo LMHT)

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
          if (d < 16.0) {
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
      this.mesh.rotation.y = Math.atan2(toTarget.x, toTarget.z);

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

    // 3D GLTF Animation Mixer update (if custom 3D model loaded)
    if (this.mesh.mixer) {
      this.mesh.mixer.update(delta);
    }

    // Dynamic limb animation (walking & attacking for fallback models)
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

    this.armor = type.includes('turret') ? 40 : (type === 'nexus' ? 30 : 20);
    this.consecutiveHits = 0;
    this.lastTarget = null;

    if (type.includes('turret')) {
      this.maxHp = 3000;
      this.hp = 3000;
      this.rangeLol = 775; // Tầm bắn Trụ chuẩn LMHT (775)
      this.range = +(775 * LOL_RANGE_SCALE).toFixed(2); // 20.0
      this.damage = 200;
      this.attackCooldown = 0;
      this.buildTurretMesh(isAllied);
    } else if (type === 'inhibitor') {
      this.maxHp = 2500;
      this.hp = 2500;
      this.range = 0;
      this.buildInhibitorMesh(isAllied);
    } else { // 'nexus'
      this.maxHp = 4000;
      this.hp = 4000;
      this.range = 0;
      this.buildNexusMesh(isAllied);
    }

    this.scene.add(this.group);

    // Health Bar
    const barHeight = type.includes('turret') ? 7.2 : type === 'nexus' ? 8.5 : 4.0;
    this.healthBar = createHealthBar(isAllied ? '#0284c7' : '#dc2626', 3.0, 0.35, barHeight);
    this.group.add(this.healthBar.sprite);
    this.healthBar.updateBar(this.hp, this.maxHp);
  }

  buildTurretMesh(isAllied) {
    const crystalColor = isAllied ? 0x0ea5e9 : 0xf97316;

    // Range Ring
    const ringMat = new THREE.MeshBasicMaterial({ color: crystalColor, side: THREE.DoubleSide, transparent: true, opacity: 0.22 });
    const rangeRing = new THREE.Mesh(new THREE.RingGeometry(this.range - 0.2, this.range, 64), ringMat);
    rangeRing.rotation.x = -Math.PI / 2;
    rangeRing.position.y = 0.05;
    this.group.add(rangeRing);

    // Laser
    const laserMat = new THREE.LineBasicMaterial({ color: isAllied ? 0x38bdf8 : 0xef4444, linewidth: 3, transparent: true, opacity: 0.85 });
    const laserGeo = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, 5.8, 0), new THREE.Vector3(0, 0, 0)]);
    this.laser = new THREE.Line(laserGeo, laserMat);
    this.laser.visible = false;
    this.group.add(this.laser);

    // Immediate Fallback Turret Base (Đảm bảo trụ luôn luôn hiển thị ngay từ frame đầu tiên)
    const baseGeo = new THREE.CylinderGeometry(1.6, 2.2, 4.0, 8);
    const baseMat = new THREE.MeshStandardMaterial({
      color: isAllied ? 0x1e3a5f : 0x3f1e1e,
      roughness: 0.7
    });
    const fallbackBase = new THREE.Mesh(baseGeo, baseMat);
    fallbackBase.position.y = 1.2;
    fallbackBase.castShadow = true;
    this.group.add(fallbackBase);
    this.fallbackBase = fallbackBase;

    // Floating Crystal
    const crystalMat = new THREE.MeshStandardMaterial({
      color: crystalColor,
      emissive: crystalColor,
      emissiveIntensity: 2.5,
      roughness: 0.1
    });
    this.crystal = new THREE.Mesh(new THREE.OctahedronGeometry(1.1, 0), crystalMat);
    this.crystal.position.y = 5.6;
    this.group.add(this.crystal);

    // Load authentic LoL Turret 3D Model (Order vs Chaos) via parseModel (0ms latency từ RAM)
    const modelUrl = isAllied ? '/models/turret_order.glb' : '/models/turret_chaos.glb';
    parseModel(modelUrl, (gltf) => {
      if (this.fallbackBase) {
        this.group.remove(this.fallbackBase);
        this.fallbackBase = null;
      }
      if (this.crystal) {
        this.group.remove(this.crystal);
        this.crystal = null;
      }

      const model = gltf.scene;

      // Filter submesh visibility cleanly (chỉ giữ lại mesh nguyên vẹn 'Base')
      model.traverse((child) => {
        if (child.isMesh) {
          child.castShadow = true;
          child.receiveShadow = true;
          if (Array.isArray(child.material)) {
            child.material.forEach((mat) => {
              if (mat.name !== 'Base') mat.visible = false;
            });
          } else if (child.material) {
            const mName = child.material.name || '';
            if (mName && mName !== 'Base' && (mName.includes('Stage') || mName.includes('Rubble') || mName.includes('Broken'))) {
              child.visible = false;
            }
          }
        }
      });

      const box = new THREE.Box3().setFromObject(model);
      const size = box.getSize(new THREE.Vector3());
      const targetHeight = 8.5;
      const scale = targetHeight / (size.y || 1);
      model.scale.set(scale, scale, scale);
      box.setFromObject(model);

      // Chìm 2.8m vào lòng sàn cầu để che nửa thân dưới trụ theo đúng yêu cầu user (không bị bay lên)
      model.position.y = -box.min.y - 2.8;
      model.rotation.y = isAllied ? Math.PI : 0;

      this.turretModel = model;
      this.group.add(model);

      if (gltf.animations && gltf.animations.length > 0) {
        this.mixer = new THREE.AnimationMixer(model);
        const clip = gltf.animations.find(a => a.name.toLowerCase() === 'idle1' || a.name.toLowerCase().includes('idle') || a.name.toLowerCase().includes('base')) || gltf.animations[0];
        if (clip) {
          this.action = this.mixer.clipAction(clip);
          this.action.play();
        }
      }
    });
  }

  buildInhibitorMesh(isAllied) {
    const pad = new THREE.Mesh(
      new THREE.CylinderGeometry(2.0, 2.4, 1.2, 8),
      new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.8 })
    );
    pad.position.y = 0.6;
    this.group.add(pad);
    this.fallbackPad = pad;

    const crystalColor = isAllied ? 0x38bdf8 : 0xf87171;
    this.crystal = new THREE.Mesh(
      new THREE.DodecahedronGeometry(1.2),
      new THREE.MeshStandardMaterial({ color: crystalColor, emissive: crystalColor, emissiveIntensity: 2.5 })
    );
    this.crystal.position.y = 2.4;
    this.group.add(this.crystal);

    const modelUrl = isAllied ? '/models/inhibitor_order.glb' : '/models/inhibitor_chaos.glb';
    parseModel(modelUrl, (gltf) => {
      if (this.fallbackPad) {
        this.group.remove(this.fallbackPad);
        this.fallbackPad = null;
      }
      if (this.crystal) {
        this.group.remove(this.crystal);
        this.crystal = null;
      }

      const model = gltf.scene;
      model.traverse((child) => {
        if (child.isMesh) {
          child.castShadow = true;
          child.receiveShadow = true;
          if (Array.isArray(child.material)) {
            child.material.forEach((mat) => {
              if (mat.name && mat.name.toLowerCase().includes('destroy')) mat.visible = false;
            });
          } else if (child.material && child.material.name && child.material.name.toLowerCase().includes('destroy')) {
            child.visible = false;
          }
        }
      });

      const box = new THREE.Box3().setFromObject(model);
      const size = box.getSize(new THREE.Vector3());
      const targetHeight = 4.5;
      const scale = targetHeight / (size.y || 1);
      model.scale.set(scale, scale, scale);
      box.setFromObject(model);
      model.position.y = -box.min.y - 0.5;
      model.rotation.y = isAllied ? 0 : Math.PI;
      this.inhibitorModel = model;
      this.group.add(model);
    });
  }

  buildNexusMesh(isAllied) {
    const crystalColor = isAllied ? 0x0284c7 : 0xb91c1c;

    const base = new THREE.Mesh(
      new THREE.CylinderGeometry(3.5, 4.5, 2.0, 8),
      new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.7 })
    );
    base.position.y = 1.0;
    this.group.add(base);
    this.fallbackBase = base;

    this.crystal = new THREE.Mesh(
      new THREE.OctahedronGeometry(2.4, 0),
      new THREE.MeshStandardMaterial({ color: crystalColor, emissive: crystalColor, emissiveIntensity: 3.2 })
    );
    this.crystal.position.y = 5.0;
    this.group.add(this.crystal);

    const modelUrl = isAllied ? '/models/nexus_order.glb' : '/models/nexus_chaos.glb';
    parseModel(modelUrl, (gltf) => {
      if (this.fallbackBase) {
        this.group.remove(this.fallbackBase);
        this.fallbackBase = null;
      }
      if (this.crystal) {
        this.group.remove(this.crystal);
        this.crystal = null;
      }

      const model = gltf.scene;
      const box = new THREE.Box3().setFromObject(model);
      const size = box.getSize(new THREE.Vector3());
      const targetHeight = 7.2;
      const scale = targetHeight / (size.y || 1);
      model.scale.set(scale, scale, scale);
      box.setFromObject(model);
      model.position.y = -box.min.y - 0.5;
      model.rotation.y = isAllied ? 0 : Math.PI;
      this.nexusModel = model;
      this.group.add(model);
    });
  }

  takeDamage(amount, vfx) {
    if (this.isDestroyed) return;
    const reduction = 100 / (100 + (this.armor || 40));
    const effectiveDamage = Math.max(1, Math.round(amount * reduction));
    this.hp = Math.max(0, this.hp - effectiveDamage);
    this.healthBar.updateBar(this.hp, this.maxHp);
    if (vfx) {
      vfx.spawnDamageNumber(`-${effectiveDamage}`, this.group.position, 'normal');
    }

    if (this.hp <= 0) {
      this.destroy(vfx);
    }
  }

  destroy(vfx) {
    this.isDestroyed = true;
    this.healthBar.sprite.visible = false;
    vfx.spawnIceExplosion(this.group.position, this.isAllied ? 0x0284c7 : 0xef4444, 40);

    if (this.type.includes('turret')) {
      if (this.turretModel) this.group.remove(this.turretModel);
      if (this.crystal) this.group.remove(this.crystal);
      gltfLoader.load('/models/turret_rubble.glb', (gltf) => {
        const rubble = gltf.scene;
        rubble.scale.set(1.5, 1.5, 1.5);
        this.group.add(rubble);
      });
    } else {
      this.group.visible = false;
    }

    // If inhibitor, respawn in 60s
    if (this.type === 'inhibitor') {
      this.respawnTimer = 60.0;
    }
  }

  // Turret AI Priority (League logic: Enemy attacking ally > Minions > Champion) + Heat-Up
  updateTurret(delta, time, enemyMinions, enemyChampions, vfx, sounds) {
    if (this.isDestroyed || !this.type.includes('turret')) return;

    if (this.mixer) {
      this.mixer.update(delta);
    }

    if (this.crystal) {
      this.crystal.rotation.y += 0.025;
      this.crystal.position.y = 5.6 + Math.sin(time * 2.5) * 0.25;
    }

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
      const targetPos = target.mesh ? target.mesh.position.clone().add(new THREE.Vector3(0, 1.2, 0)) : (target.group ? target.group.position.clone().add(new THREE.Vector3(0, 1.2, 0)) : null);
      if (!targetPos) return;

      const localTarget = this.group.worldToLocal(targetPos);

      const positions = this.laser.geometry.attributes.position.array;
      positions[0] = 0;
      positions[1] = this.crystal ? this.crystal.position.y : 5.8;
      positions[2] = 0;
      positions[3] = localTarget.x;
      positions[4] = localTarget.y;
      positions[5] = localTarget.z;
      this.laser.geometry.attributes.position.needsUpdate = true;

      this.attackCooldown -= delta;
      if (this.attackCooldown <= 0) {
        this.attackCooldown = 1.25;
        if (sounds) sounds.playTurretShot();

        let dmg = this.damage;

        if (target instanceof Minion) {
          this.consecutiveHits = 0;
          this.lastTarget = null;
          // LoL authentic chunk damage on minions:
          if (target.type === 'caster') {
            dmg = Math.round(target.maxHp * 0.7);
          } else if (target.type === 'melee') {
            dmg = Math.round(target.maxHp * 0.45);
          } else {
            dmg = Math.round(target.maxHp * 0.18 + this.damage);
          }
        } else {
          // Heat-up mechanic on Champions! (+40% per shot up to +120%)
          if (this.lastTarget === target) {
            this.consecutiveHits = Math.min(3, (this.consecutiveHits || 0) + 1);
          } else {
            this.consecutiveHits = 0;
            this.lastTarget = target;
          }
          const heatMultiplier = 1.0 + this.consecutiveHits * 0.4;
          dmg = Math.round(this.damage * heatMultiplier);
        }

        target.takeDamage(dmg, vfx);
        if (vfx) {
          vfx.spawnIceExplosion(target.mesh ? target.mesh.position : target.group.position, this.consecutiveHits > 0 ? 0xff0044 : 0xef4444, 14);
        }
      }
    } else {
      this.laser.visible = false;
      this.consecutiveHits = 0;
      this.lastTarget = null;
    }
  }
}

// Player Champion Class with real 3D GLTF Model and Animations
export class PlayerChampion {
  constructor(scene) {
    this.scene = scene;
    this.level = 1;

    // Base stats & Item inventory
    this.gold = 500;
    this.inventory = [];
    this.augments = [];
    this.rerollsLeft = 2;

    this.baseAp = 0;
    this.baseLifesteal = 0.0;
    this.baseCrit = 0.0;
    this.lifesteal = 0.0;
    this.crit = 0.0;

    this.targetPos = null;
    this.autoAttackTarget = null;
    this.isDead = false;

    // Main 3D group container
    this.mesh = new THREE.Group();
    this.mesh.position.set(0, 0, 18);
    this.scene.add(this.mesh);

    // Selection Ring (vòng tròn chân nhân vật)
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
    this.fallbackModel = createChampionFallbackModel(0x2563eb);
    this.mesh.add(this.fallbackModel);

    // Cài đặt profile và nạp toàn bộ chỉ số Data Dragon 14.5.1 cho tướng khởi đầu
    this.setHeroProfile('yasuo');

    // Load official League Yasuo 3D Model by default
    this.loadModel('/models/yasuo.glb', 1.05);
  }

  // Khởi tạo vòng hiển thị bán kính tầm tấn công LMHT quanh tướng
  createRangeRing() {
    this.rangeRingMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.28,
      depthWrite: false
    });
    this.rangeRing = new THREE.Mesh(
      new THREE.RingGeometry(Math.max(0.1, (this.range || 4.5) - 0.22), this.range || 4.5, 64),
      this.rangeRingMat
    );
    this.rangeRing.rotation.x = -Math.PI / 2;
    this.rangeRing.position.y = 0.05;
    this.rangeRing.visible = true; // Luôn hiển thị rõ tầm đánh như LMHT
    this.mesh.add(this.rangeRing);
  }

  // Cập nhật lại hình học và bán kính vòng tầm đánh khi đổi tướng hoặc tăng tầm
  updateRangeRing() {
    if (!this.rangeRing) {
      this.createRangeRing();
      return;
    }
    this.rangeRing.geometry.dispose();
    this.rangeRing.geometry = new THREE.RingGeometry(Math.max(0.1, this.range - 0.22), this.range, 64);
    if (this.attackType === 'ranged') {
      this.rangeRingMat.color.setHex(0x67e8f9); // Xanh ngọc cho xạ thủ tầm xa
      this.rangeRingMat.opacity = 0.25;
    } else {
      this.rangeRingMat.color.setHex(0x38bdf8); // Xanh dương cho đấu sĩ/sát thủ cận chiến
      this.rangeRingMat.opacity = 0.35;
    }
  }

  // Bật/tắt hiển thị vòng tầm đánh (Phím A hoặc C)
  toggleRangeRing() {
    if (this.rangeRing) {
      this.rangeRing.visible = !this.rangeRing.visible;
      return this.rangeRing.visible;
    }
    return false;
  }

  // Cập nhật toàn bộ chỉ số chuẩn LMHT 14.5.1 từ Riot Data Dragon
  setHeroProfile(heroType) {
    this.heroType = heroType;
    const champData = getChampion1451Data(heroType, this.level || 1);
    this.championData = champData;

    this.championName = champData.name;
    this.championTitle = champData.title;
    this.partype = champData.partype || 'Mana';

    // Official Data Dragon 14.5.1 Base Stats
    this.baseMaxHp = champData.maxHp;
    this.baseMaxMp = champData.maxMp;
    this.baseAd = champData.ad;
    this.baseAp = 0;
    this.baseArmor = champData.armor;
    this.baseMr = champData.mr;
    this.baseSpeed = champData.speed;
    this.movespeedLol = champData.movespeed;
    this.baseAttackSpeed = champData.attackspeed;
    this.hpregen = champData.hpregen;
    this.mpregen = champData.mpregen;

    this.ad = this.baseAd;
    this.ap = 0;
    this.armor = this.baseArmor;
    this.mr = this.baseMr;
    this.speed = this.baseSpeed;
    this.lifesteal = 0.0;
    this.crit = 0.0;

    this.rangeLol = champData.rangeLol;
    this.range = champData.range;
    this.attackType = champData.type;
    this.attackCooldownMax = champData.attackCooldownMax;
    this.attackCooldown = 0;

    const profile = CHAMPION_ATTACK_PROFILES[heroType] || CHAMPION_ATTACK_PROFILES.yasuo;
    this.projectileSpeed = profile.projectileSpeed || 28.0;
    this.projectileColor = profile.projectileColor || 0x38bdf8;

    this.maxHp = this.baseMaxHp;
    this.hp = this.baseMaxHp;
    this.maxMp = this.baseMaxMp;
    this.mp = this.baseMaxMp;

    this.updateRangeRing();
    if (this.healthBar) {
      this.healthBar.updateBar(this.hp, this.maxHp, this.maxMp > 0 ? this.mp : null, this.maxMp);
    }
  }

  // Tăng/Đổi cấp độ và tự động tính toán lại chỉ số theo hệ số tăng trưởng LMHT 14.5.1
  setLevel(lvl) {
    this.level = Math.max(1, Math.min(18, lvl));
    const champData = getChampion1451Data(this.heroType, this.level);
    this.championData = champData;

    const hpPercent = this.maxHp > 0 ? (this.hp / this.maxHp) : 1.0;
    const mpPercent = this.maxMp > 0 ? (this.mp / this.maxMp) : 1.0;

    this.baseMaxHp = champData.maxHp;
    this.baseMaxMp = champData.maxMp;
    this.baseAd = champData.ad;
    this.baseArmor = champData.armor;
    this.baseMr = champData.mr;
    this.baseSpeed = champData.speed;
    this.movespeedLol = champData.movespeed;
    this.baseAttackSpeed = champData.attackspeed;
    this.attackCooldownMax = champData.attackCooldownMax;
    this.hpregen = champData.hpregen;
    this.mpregen = champData.mpregen;

    this.maxHp = this.baseMaxHp;
    this.maxMp = this.baseMaxMp;
    this.hp = Math.round(this.maxHp * hpPercent);
    this.mp = Math.round(this.maxMp * mpPercent);

    if (this.healthBar) {
      this.healthBar.updateBar(this.hp, this.maxHp, this.maxMp > 0 ? this.mp : null, this.maxMp);
    }
  }

  // Đòn đánh thường chuẩn LMHT (Melee chém kiếm/rìu, Ranged bắn tên/đạn pháo)
  basicAttack(target, vfx, sounds, projectileList) {
    if (this.isDead || this.attackCooldown > 0 || !target) return false;
    const targetPos = target.mesh ? target.mesh.position : (target.group ? target.group.position : null);
    if (!targetPos) return false;

    const toTarget = new THREE.Vector3().subVectors(targetPos, this.mesh.position);
    toTarget.y = 0;
    const dist = toTarget.length();

    // Kiểm tra cự ly có nằm trong tầm đánh hay không
    if (dist > this.range + 0.35) {
      return false;
    }

    // Đã đủ tầm đánh: Thực hiện đòn đánh!
    this.attackCooldown = this.attackCooldownMax;

    // Quay mặt nhìn về phía mục tiêu
    this.mesh.rotation.y = Math.atan2(toTarget.x, toTarget.z) + Math.PI;

    // Chạy hoạt ảnh vung đòn đánh thường
    this.playAttackAnimation();

    // Tính toán sát thương chí mạng chuẩn LMHT (175% hoặc 215% khi có Vô Cực Kiếm)
    const isCrit = Math.random() < (this.crit || 0);
    const hasIE = this.inventory && this.inventory.some(it => it.id === 'infinity_edge');
    const critMult = isCrit ? (hasIE ? 2.15 : 1.75) : 1.0;
    const rawDamage = Math.round(this.ad * critMult);

    if (this.attackType === 'ranged') {
      // Xạ thủ tầm xa (Ashe, Jinx): Phóng đường đạn bay thẳng đến đối phương
      this.fireBasicProjectile(targetPos, target, projectileList, vfx, sounds, rawDamage, isCrit);
    } else {
      // Cận chiến (Yasuo, Darius, Zed): Chém chớp nhoáng với hiệu ứng kiếm khí
      setTimeout(() => {
        if (target.isDead || target.isDestroyed) return;
        target.takeDamage(rawDamage, vfx);
        sounds.playHit();
        vfx.spawnIceExplosion(targetPos, isCrit ? 0xf59e0b : (this.projectileColor || 0x38bdf8), isCrit ? 14 : 8);
        if (isCrit) {
          vfx.spawnDamageNumber(`CHÍ MẠNG! -${rawDamage}`, targetPos, 'crit');
        }

        // Hồi phục hút máu nếu có trang bị
        if (this.lifesteal > 0) {
          const healAmt = Math.round(rawDamage * this.lifesteal);
          if (healAmt > 0) this.heal(healAmt, vfx);
        }
      }, 160);
    }

    return true;
  }

  // Bắn đạn / tên thường cho tướng tầm xa (Ashe, Jinx)
  fireBasicProjectile(targetPos, targetRef, projectileList, vfx, sounds, rawDamage = null, isCrit = false) {
    const isAshe = this.heroType === 'ashe';
    const orb = new THREE.Mesh(
      isAshe ? new THREE.ConeGeometry(0.18, 1.0, 6) : new THREE.SphereGeometry(0.24, 8, 8),
      new THREE.MeshBasicMaterial({
        color: isCrit ? 0xf59e0b : this.projectileColor
      })
    );
    if (isAshe) {
      orb.rotation.x = Math.PI / 2;
    }
    orb.position.copy(this.mesh.position).add(new THREE.Vector3(0, 1.2, 0));
    this.scene.add(orb);

    sounds.playCastQ();

    projectileList.push({
      mesh: orb,
      targetRef,
      speed: this.projectileSpeed || 28.0,
      damage: rawDamage || Math.round(this.ad),
      isCrit,
      isPlayer: true,
      heroType: this.heroType,
      color: isCrit ? 0xf59e0b : this.projectileColor,
      lifesteal: this.lifesteal,
      vfx,
      sounds
    });
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
    // Cập nhật profile và tầm tấn công chuẩn LMHT cho tướng mới
    this.setHeroProfile(modelType);

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
    } else if (modelType === 'ahri') {
      this.loadModel('/models/ahri.glb', 1.2);
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
    this.attackCooldown = Math.max(0, this.attackCooldown - delta);
    // Hồi phục chuẩn LMHT (hpregen / mpregen mỗi 5s)
    const hpRegenRate = (this.hpregen || 5) / 5;
    const mpRegenRate = (this.mpregen || 10) / 5;
    this.hp = Math.min(this.maxHp, this.hp + hpRegenRate * delta);
    if (this.maxMp > 0 && this.partype !== 'Flow') {
      this.mp = Math.min(this.maxMp, this.mp + mpRegenRate * delta);
    }
    this.healthBar.updateBar(this.hp, this.maxHp, this.maxMp > 0 ? this.mp : null, this.maxMp);

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
    this.name = name;
    this.isDead = false;
    this.respawnTimer = 0;
    this.spawnPos = new THREE.Vector3(x, 0, z);
    this.level = 1;

    // Thiết lập chỉ số chuẩn Data Dragon 14.5.1 cho Bot
    const isAssassin = name.includes('Sát Thủ');
    const heroKey = isAssassin ? 'zed' : 'darius';
    this.heroKey = heroKey;
    const champData = getChampion1451Data(heroKey, this.level);

    this.maxHp = champData.maxHp;
    this.hp = champData.maxHp;
    this.maxMp = champData.maxMp;
    this.mp = champData.maxMp;
    this.rangeLol = champData.rangeLol;
    this.range = champData.range;
    this.damage = champData.ad;
    this.armor = champData.armor;
    this.mr = champData.mr;
    this.movespeed = champData.movespeed;
    this.speed = +(champData.speed * 0.55).toFixed(2);
    this.attackCooldown = 0;
    this.attackCooldownMax = champData.attackCooldownMax;

    this.mesh = new THREE.Group();
    this.mesh.position.copy(this.spawnPos);
    this.scene.add(this.mesh);

    // Selection Ring (Vòng tròn đỏ dưới chân)
    const ring = new THREE.Mesh(
      new THREE.RingGeometry(0.9, 1.1, 32),
      new THREE.MeshBasicMaterial({ color: 0xef4444, side: THREE.DoubleSide, transparent: true, opacity: 0.85 })
    );
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.04;
    this.mesh.add(ring);

    // Bot Attack Range Indicator Ring (Vòng tầm tấn công LMHT của Bot)
    const botRangeRing = new THREE.Mesh(
      new THREE.RingGeometry(Math.max(0.1, this.range - 0.2), this.range, 48),
      new THREE.MeshBasicMaterial({ color: 0xf43f5e, side: THREE.DoubleSide, transparent: true, opacity: 0.22, depthWrite: false })
    );
    botRangeRing.rotation.x = -Math.PI / 2;
    botRangeRing.position.y = 0.045;
    this.mesh.add(botRangeRing);

    this.healthBar = createHealthBar('#ef4444', 2.2, 0.28, 3.2);
    this.mesh.add(this.healthBar.sprite);

    this.wanderTimer = 0;
    this.wanderTarget = null;
    this.target = null;

    // Animation System
    this.mixer = null;
    this.actions = {};
    this.currentAction = null;
    this.modelRoot = null;

    this.fallbackModel = createChampionFallbackModel(0xb91c1c);
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
    const reduction = 100 / (100 + (this.armor || 0));
    const effectiveDamage = Math.max(1, Math.round(amount * reduction));
    this.hp = Math.max(0, this.hp - effectiveDamage);
    if (vfx) {
      vfx.spawnDamageNumber(`-${effectiveDamage}`, this.mesh.position, 'normal');
    }
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

  update(delta, time, vfx, enemyTargets = [], sounds = null) {
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

    this.attackCooldown = Math.max(0, this.attackCooldown - delta);

    // AI phát hiện mục tiêu theo tầm nhìn và tầm tấn công chuẩn LMHT
    let closestTarget = null;
    let closestDist = 15.0; // Aggro range

    if (enemyTargets && enemyTargets.length > 0) {
      for (const t of enemyTargets) {
        if (!t || t.isDead) continue;
        const tPos = t.mesh ? t.mesh.position : (t.group ? t.group.position : null);
        if (!tPos) continue;
        const d = this.mesh.position.distanceTo(tPos);
        if (d < closestDist) {
          closestDist = d;
          closestTarget = t;
        }
      }
    }

    let isMoving = false;

    if (closestTarget) {
      const targetPos = closestTarget.mesh ? closestTarget.mesh.position : closestTarget.group.position;
      const toTarget = new THREE.Vector3().subVectors(targetPos, this.mesh.position);
      toTarget.y = 0;
      const dist = toTarget.length();

      // Quay mặt về phía đối thủ
      const targetRot = Math.atan2(toTarget.x, toTarget.z);
      let diff = (targetRot - this.mesh.rotation.y) % (Math.PI * 2);
      if (diff < -Math.PI) diff += Math.PI * 2;
      if (diff > Math.PI) diff -= Math.PI * 2;
      this.mesh.rotation.y += diff * Math.min(1.0, 16.0 * delta);

      if (dist > this.range) {
        // Chưa tới tầm đánh: Di chuyển lại gần mục tiêu
        isMoving = true;
        toTarget.normalize();
        this.mesh.position.addScaledVector(toTarget, 5.2 * delta);
      } else {
        // Đã vào trong tầm đánh: Tấn công mục tiêu!
        if (this.attackCooldown <= 0) {
          this.attackCooldown = this.attackCooldownMax;
          closestTarget.takeDamage(this.damage, vfx);
          if (sounds) sounds.playHit();
          vfx.spawnIceExplosion(targetPos, 0xef4444, 8);
        }
      }
    } else {
      // Khi không có kẻ địch ở gần: Đi tuần tra (wander)
      this.wanderTimer -= delta;
      if (this.wanderTimer <= 0) {
        this.wanderTimer = 2.5 + Math.random() * 2;
        this.wanderTarget = new THREE.Vector3(
          this.spawnPos.x + (Math.random() - 0.5) * 8,
          0,
          this.spawnPos.z + (Math.random() - 0.5) * 6
        );
      }

      if (this.wanderTarget) {
        const dir = new THREE.Vector3().subVectors(this.wanderTarget, this.mesh.position);
        dir.y = 0;
        const dist = dir.length();
        if (dist > 0.2) {
          isMoving = true;
          dir.normalize();
          this.mesh.position.addScaledVector(dir, 4.0 * delta);

          const targetRot = Math.atan2(dir.x, dir.z);
          let diff = (targetRot - this.mesh.rotation.y) % (Math.PI * 2);
          if (diff < -Math.PI) diff += Math.PI * 2;
          if (diff > Math.PI) diff -= Math.PI * 2;
          this.mesh.rotation.y += diff * Math.min(1.0, 10.0 * delta);
        }
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

