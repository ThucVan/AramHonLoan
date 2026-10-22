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
import { getRespawnSeconds, getLevelFromXp, ARAM_ECONOMY, LEVEL_XP_THRESHOLDS } from './aram_rules.js';

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
// CHUYỂN MATERIAL UNLIT -> CÓ ÁNH SÁNG
// ----------------------------------------------------------------------------
// Model GLB của Riot dùng extension KHR_materials_unlit: bề mặt không phản ứng
// với ánh sáng nên trông BẸT, thiếu khối, không giống cảm giác 3D trong game.
// Hàm này dựng lại material dựa trên chính texture gốc (giữ nguyên màu sắc,
// chỉ thêm phản xạ ánh sáng) để nhân vật có khối và đổ bóng như game thật.
// ============================================================================
function applyLitMaterials(child) {
  const mats = Array.isArray(child.material) ? child.material : [child.material];
  const out = mats.map((mat) => {
    if (!mat) return mat;
    // Chỉ chuyển những material thật sự unlit (MeshBasicMaterial) hoặc được
    // đánh dấu qua extension; material đã chuẩn thì giữ nguyên.
    const isUnlit = mat.isMeshBasicMaterial ||
      (mat.userData && mat.userData.gltfExtensions &&
        mat.userData.gltfExtensions.KHR_materials_unlit);

    if (!isUnlit) {
      // Material chuẩn: tinh chỉnh nhẹ cho phù hợp ánh sáng của scene
      if (mat.isMeshStandardMaterial) {
        mat.roughness = Math.max(0.45, mat.roughness ?? 0.5);
        mat.metalness = Math.min(0.25, mat.metalness ?? 0.1);
        mat.envMapIntensity = 1.0;
      }
      return mat;
    }

    const lit = new THREE.MeshStandardMaterial({
      name: mat.name,
      color: mat.color ? mat.color.clone() : new THREE.Color(0xffffff),
      map: mat.map || null,
      alphaMap: mat.alphaMap || null,
      transparent: mat.transparent,
      opacity: mat.opacity,
      side: mat.side,
      // LƯU Ý: KHÔNG truyền 'skinning' — Three.js r150+ đã bỏ thuộc tính này
      // (skinning tự động bật khi material dùng cho SkinnedMesh). Truyền vào
      // sẽ sinh cảnh báo và có thể làm material không được tạo đúng.
      roughness: 0.55,
      metalness: 0.08,
      emissive: new THREE.Color(0x000000),
      envMapIntensity: 1.0
    });

    // Giữ lại cờ gốc để không phá vỡ skinning/vertex color
    if (mat.vertexColors) lit.vertexColors = true;
    if (mat.map) {
      lit.map.colorSpace = THREE.SRGBColorSpace;
      lit.map.needsUpdate = true;
    }
    if (mat.alphaMap) lit.alphaMap.needsUpdate = true;
    return lit;
  });

  child.material = Array.isArray(child.material) ? out : out[0];
  return child.material;
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
    // Tốc đạn đánh thường chuẩn LoL (~1600 đơn vị LoL/s = 41.3 units/s)
    projectileSpeed: +(1600 * LOL_RANGE_SCALE).toFixed(2),
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
    // Tốc đạn đánh thường chuẩn LoL (~1600 đơn vị LoL/s = 41.3 units/s)
    projectileSpeed: +(1600 * LOL_RANGE_SCALE).toFixed(2),
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
    // Tốc đạn đánh thường chuẩn LoL (~1600 đơn vị LoL/s = 41.3 units/s)
    projectileSpeed: +(1600 * LOL_RANGE_SCALE).toFixed(2),
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

    // -----------------------------------------------------------------
    // SỐ LIỆU LÍNH ARAM — trích trực tiếp từ CommunityDragon:
    //   data/characters/ha_orderminion{melee,ranged,siege,super}/*.bin.json
    // Các giá trị dưới đây là baseValue/mBaseValue NGUYÊN BẢN của Riot,
    // KHÔNG phải số ước lượng.
    // -----------------------------------------------------------------
    if (type === 'melee') {
      // HA_OrderMinionMelee: baseHP=455, baseDamage=12, baseArmor=0
      this.maxHp = 455;
      this.hp = 455;
      this.armor = 0;
      this.damage = 12;
      this.rangeLol = 110;
      this.range = +(110 * LOL_RANGE_SCALE).toFixed(2);
      // baseMoveSpeedModifiable = 325 (KHÔNG phải 350)
      this.speed = +(325 * LOL_RANGE_SCALE).toFixed(3);
      // attackSpeedModifiable = 1.25 -> chu kỳ = 1 / 1.25 = 0.8s
      this.attackCooldownMax = +(1 / 1.25).toFixed(2);
      this.mesh = this.createMeleeMesh(isAllied);
    } else if (type === 'caster') {
      // HA_OrderMinionRanged: baseHP=290, baseDamage=23, baseArmor=0
      this.maxHp = 290;
      this.hp = 290;
      this.armor = 0;
      this.damage = 23;
      this.rangeLol = 550;
      this.range = +(550 * LOL_RANGE_SCALE).toFixed(2);
      this.speed = +(325 * LOL_RANGE_SCALE).toFixed(3);
      // attackSpeedModifiable = 0.667 -> chu kỳ = 1.5s
      this.attackCooldownMax = +(1 / 0.667).toFixed(2);
      this.mesh = this.createCasterMesh(isAllied);
    } else if (type === 'siege') {
      // HA_OrderMinionSiege: baseHP=805, baseDamage=40, baseArmor=0
      // baseMoveSpeed=325, attackRange=300, attackSpeed=1.0
      this.maxHp = 805;
      this.hp = 805;
      this.armor = 0;
      this.damage = 40;
      this.rangeLol = 300;
      this.range = +(300 * LOL_RANGE_SCALE).toFixed(2);
      this.speed = +(325 * LOL_RANGE_SCALE).toFixed(3);
      this.attackCooldownMax = +(1 / 1.0).toFixed(2);
      this.mesh = this.createCasterMesh(isAllied);
    } else { // 'super'
      // HA_OrderMinionSuper: baseHP=1500, baseDamage=306, baseArmor=60
      // baseMoveSpeed=325 (KHÔNG phải 380), attackRange=170
      this.maxHp = 1500;
      this.hp = 1500;
      this.armor = 60;
      this.damage = 306;
      this.rangeLol = 170;
      this.range = +(170 * LOL_RANGE_SCALE).toFixed(2);
      this.speed = +(325 * LOL_RANGE_SCALE).toFixed(3);
      // attackSpeedModifiable = 0.694 -> chu kỳ = 1.44s
      this.attackCooldownMax = +(1 / 0.694).toFixed(2);
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
        applyLitMaterials(child);
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
          // Chu kỳ đánh riêng theo loại lính (đúng attack speed của LoL)
          this.attackCooldown = this.attackCooldownMax || 1.1;

          // Lính phép và lính công thành đều bắn đạn (tầm đánh xa)
          if (this.type === 'caster' || this.type === 'siege') {
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
          applyLitMaterials(child);
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

    // Nhà Lính sẽ hồi lại sau 60 giây (luật ARAM/LMHT chuẩn)
    if (this.type === 'inhibitor') {
      this.respawnTimer = 60.0;
    }
  }

  // -------------------------------------------------------------------
  // ĐẾM NGƯỢC VÀ HỒI SINH NHÀ LÍNH
  // Gọi mỗi frame. Nhà Lính sống lại sau 60s, cho phép địch tiếp tục
  // đẩy lính thường thay vì lính siêu cấp vĩnh viễn.
  // -------------------------------------------------------------------
  tickRespawn(delta) {
    if (!this.isDestroyed || this.type !== 'inhibitor') return;
    if (this.respawnTimer <= 0) return;

    this.respawnTimer -= delta;
    if (this.respawnTimer > 0) return;

    // Hồi sinh Nhà Lính
    this.respawnTimer = 0;
    this.isDestroyed = false;
    this.hp = this.maxHp;
    this.group.visible = true;
    this.healthBar.sprite.visible = true;
    this.healthBar.updateBar(this.hp, this.maxHp);

    // Dọn sạch group trước khi dựng lại, tránh nhân đôi geometry
    const keep = this.healthBar ? this.healthBar.sprite : null;
    this.group.clear();
    if (keep) this.group.add(keep);

    // Dựng lại mô hình Nhà Lính
    this.fallbackPad = null;
    this.crystal = null;
    this.buildInhibitorMesh(this.isAllied);

    if (this.healthBar) {
      this.healthBar.sprite.visible = true;
      this.healthBar.updateBar(this.hp, this.maxHp);
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
    this.gold = ARAM_ECONOMY.startingGold;
    this.inventory = [];
    this.augments = [];
    this.rerollsLeft = 2;

    // ------------------------------------------------------------------
    // KINH NGHIỆM (XP) — ARAM chia XP cho cả đội, tự động lên cấp tới 18.
    // ------------------------------------------------------------------
    this.xp = 0;
    this.xpToNext = 280; // ngưỡng lên cấp 2 (bảng XP chuẩn LoL)

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
    // Đánh dấu để purgeModelObjects() biết đây là HẠ TẦNG, không phải model
    ring.userData.isInfrastructure = true;
    this.selectionRing = ring;
    this.mesh.add(ring);

    // Health & Mana Bar
    this.healthBar = createHealthBar('#22c55e', 2.2, 0.28, 3.2);
    this.healthBar.sprite.userData.isInfrastructure = true;
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
    // Hạ tầng: KHÔNG được xoá khi đổi tướng
    this.rangeRing.userData.isInfrastructure = true;
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

  // -------------------------------------------------------------------
  // CỘNG KINH NGHIỆM VÀ TỰ ĐỘNG LÊN CẤP (chuẩn ARAM)
  // ARAM chia XP cho toàn đội nên người chơi lên cấp rất nhanh dù không
  // last-hit. Cấp tối đa là 18.
  // -------------------------------------------------------------------
  gainXp(amount) {
    if (this.isDead || amount <= 0) return;
    this.xp += amount;

    // Lên cấp liên tục nếu đủ ngưỡng (có thể nhảy nhiều cấp một lúc)
    let leveled = false;
    while (this.level < 18 && this.xp >= LEVEL_XP_THRESHOLDS[this.level]) {
      this.level++;
      leveled = true;
    }

    this.xpToNext = this.level >= 18 ? 0 : LEVEL_XP_THRESHOLDS[this.level];

    if (leveled) {
      // Giữ nguyên % máu/mana hiện tại, tính lại toàn bộ chỉ số theo cấp mới
      this.setLevel(this.level);
      if (typeof this.vfx?.spawnLevelUp === 'function') {
        this.vfx.spawnLevelUp(this.mesh.position);
      }
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

    // -------------------------------------------------------------------
    // KIỂM TRA TẦM ĐÁNH (chuẩn LMHT: đo từ MÉP đến MÉP)
    // Game đo tâm-đến-tâm, nên phải cộng bán kính của cả hai bên, nếu không
    // tướng sẽ phải đứng sát hơn nhiều so với LMHT thật.
    //   - bán kính tướng  ~0.9 units
    //   - bán kính trụ    ~2.4 units (chân trụ lớn)
    //   - bán kính lính   ~0.6 units
    // -------------------------------------------------------------------
    const selfRadius = 0.9;
    let targetRadius = 0.6;
    if (target && (target.type || '').includes('turret')) targetRadius = 2.4;
    else if (target && target.type === 'nexus') targetRadius = 3.2;
    else if (target && target.type === 'inhibitor') targetRadius = 2.0;
    else if (target && target.mesh && target.mesh.userData && target.mesh.userData.isChampion) targetRadius = 0.9;

    if (dist > this.range + selfRadius + targetRadius) {
      return false;
    }

    // Đã đủ tầm đánh: Thực hiện đòn đánh!
    this.attackCooldown = this.attackCooldownMax;

    // Quay mặt nhìn về phía mục tiêu.
    // Model GLB của tướng hướng mặt theo trục +Z, nên atan2(x,z) là ĐÚNG.
    // Trước đây cộng thêm Math.PI khiến tướng quay lưng lại khi đánh.
    this.mesh.rotation.y = Math.atan2(toTarget.x, toTarget.z);

    // Chạy hoạt ảnh vung đòn đánh thường
    this.playAttackAnimation();

    // Tính toán sát thương chí mạng chuẩn LMHT (175% hoặc 215% khi có Vô Cực Kiếm)
    const isCrit = Math.random() < (this.crit || 0);
    const hasIE = this.inventory && this.inventory.some(it => it.id === 'infinity_edge');
    const critMult = isCrit ? (hasIE ? 2.15 : 1.75) : 1.0;
    const rawDamage = Math.round(this.ad * critMult);

    // -------------------------------------------------------------------
    // ASHE Q (Chú Tâm Tiễn): khi đang bật, đòn đánh thường bắn loạt 5 mũi
    // tên băng thay vì 1. Đây là cơ chế SELF-buff thật của LMHT.
    // -------------------------------------------------------------------
    if (this.heroType === 'ashe' && this.asheQActive && this.asheQStacks > 0 && this.attackType === 'ranged') {
      this.asheQStacks--;
      if (this.asheQStacks <= 0) this.asheQActive = false;
      // Bắn 5 mũi tên tản nhẹ, mỗi mũi 35% damage để tổng không vượt cân bằng
      for (let k = -2; k <= 2; k++) {
        setTimeout(() => {
          if (!target || target.isDead) return;
          const spread = k * 0.06;
          const dirV = new THREE.Vector3().subVectors(targetPos, this.mesh.position);
          dirV.y = 0;
          dirV.applyAxisAngle(new THREE.Vector3(0, 1, 0), spread);
          const p = this.mesh.position.clone().addScaledVector(dirV.normalize(), 0.8);
          this.fireBasicProjectile(p.clone().add(dirV.clone().multiplyScalar(6)), target, projectileList, vfx, sounds, Math.round(rawDamage * 0.35), isCrit);
        }, (k + 2) * 40);
      }
      if (vfx) vfx.spawnIceExplosion(this.mesh.position, 0x67e8f9, 8);
      return true;
    }

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

  // -------------------------------------------------------------------
  // DỌN SẠCH MỌI MODEL CŨ TRƯỚC KHI GẮN MODEL MỚI
  // -------------------------------------------------------------------
  // Trước đây chỉ remove modelRoot + fallbackModel, nên khi đổi tướng
  // nhiều lần các Group/Mesh cũ (model dự phòng, model load dở, mesh
  // placeholder) vẫn nằm lại trong player.mesh và CHỒNG LÊN NHAU ->
  // hiện tượng "model lỗi đè loạn lên nhau".
  // Cách xử lý đúng: giữ lại đúng những object HẠ TẦNG (thanh máu,
  // vòng chọn, sprite) và xoá toàn bộ phần model 3D còn sót.
  // -------------------------------------------------------------------
  purgeModelObjects() {
    if (!this.mesh) return;

    // Xoá mọi object KHÔNG được đánh dấu là hạ tầng.
    // Hạ tầng (vòng chọn, thanh máu) có userData.isInfrastructure = true.
    const toRemove = [];
    for (const child of this.mesh.children) {
      if (child.userData && child.userData.isInfrastructure) continue;
      if (this.modelRoot && child === this.modelRoot) { toRemove.push(child); continue; }
      if (this.fallbackModel && child === this.fallbackModel) { toRemove.push(child); continue; }
      // Group = model GLB; Mesh rời (không phải Sprite) = model dự phòng
      if (child.isGroup || (child.isMesh && !child.isSprite)) {
        toRemove.push(child);
      }
    }
    for (const obj of toRemove) {
      this.mesh.remove(obj);
      // Giải phóng geometry để tránh rò rỉ GPU khi đổi tướng nhiều lần
      obj.traverse((o) => {
        if (o.geometry && o.geometry.dispose) o.geometry.dispose();
      });
    }

    this.modelRoot = null;
    this.fallbackModel = null;
    this.mixer = null;
    this.actions = {};
    this.currentAction = null;
  }

  switchModel(modelType) {
    // Cập nhật profile và tầm tấn công chuẩn LMHT cho tướng mới
    this.setHeroProfile(modelType);

    // Dọn TOÀN BỘ model cũ (không chỉ modelRoot/fallbackModel)
    this.purgeModelObjects();

    // -------------------------------------------------------------------
    // BẢNG TRA CỨU MODEL — dùng map thay vì chuỗi if/else.
    // Trước đây chỉ 6 tướng đầu có nhánh, thêm tướng mới vào pool mà quên
    // thêm vào đây thì tướng đó biến mất khỏi màn hình (không load model).
    // Tỉ lệ scale chọn theo chiều cao thực tế của từng model GLB.
    // -------------------------------------------------------------------
    const MODEL_MAP = {
      yasuo: ['/models/yasuo.glb', 1.05],
      jinx: ['/models/jinx.glb', 1.15],
      zed: ['/models/zed.glb', 1.15],
      ashe: ['/models/ashe.glb', 1.25],
      darius: ['/models/darius.glb', 0.95],
      ahri: ['/models/ahri.glb', 1.2],
      ezreal: ['/models/ezreal.glb', 1.05],
      lux: ['/models/lux.glb', 1.1],
      malphite: ['/models/malphite.glb', 0.9],
      nautilus: ['/models/nautilus.glb', 0.85],
      chogath: ['/models/chogath.glb', 0.8],
      katarina: ['/models/katarina.glb', 1.1],
      akali: ['/models/akali.glb', 1.05],
      syndra: ['/models/syndra.glb', 1.1],
      soldier: ['/models/soldier.glb', 1.4],
      robot: ['/models/robot.glb', 1.1]
    };

    const entry = MODEL_MAP[modelType];
    if (entry) {
      this.loadModel(entry[0], entry[1]);
    } else {
      // Tướng không có model riêng: dùng model dự phòng để không bị vô hình
      console.warn('[switchModel] Không có model cho:', modelType);
      this.loadModel('/models/yasuo.glb', 1.05);
    }
  }

  loadCustomModel(gltf) {
    // Dọn sạch model cũ trước (tránh chồng chất khi nạp nhiều lần)
    this.purgeModelObjects();

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
        applyLitMaterials(child);
      }
    });

    this.mesh.add(this.modelRoot);
    this.setupAnimations(gltf.animations);
  }

  setupAnimations(animations) {
    if (!animations || animations.length === 0) return;
    this.mixer = new THREE.AnimationMixer(this.modelRoot);

    // -------------------------------------------------------------------
    // CHỌN CLIP idle / run / attack BẰNG CHẤM ĐIỂM
    // -------------------------------------------------------------------
    // Bản cũ dùng .find() + điều kiện !n.includes('in') nên đã chọn nhầm
    // "Spell1_ToIdle"/"Idle_In" — là clip CHUYỂN CẢNH, không phải tư thế
    // đứng yên. Hậu quả: tướng đứng sai tư thế và luôn ở frame cuối.
    // -------------------------------------------------------------------
    const selectClip = (pattern, opts = {}) => {
      let best = null, bestScore = -Infinity;
      for (const a of animations) {
        const n = (a.name || '').toLowerCase();
        if (!pattern.test(n)) continue;
        // Loại clip chuyển cảnh / cảm xúc / chết
        if (/_to_|_to-|_torun|_toidle|_from_|from_|_to_/.test(n)) continue;
        if (/recall|dance|joke|taunt|laugh|death|victory/.test(n)) continue;
        if (opts.exclude && opts.exclude.test(n)) continue;

        let score = 0;
        if (opts.exact && opts.exact.test(n)) score += 100;
        if (/_(in|out)$/.test(n)) score -= 40;          // clip vào/ra
        if (/variant|alt|_var\d/.test(n)) score -= 10;   // biến thể
        if (/_(-?\d+)$/.test(n)) score -= 20;           // biến thể góc
        score += Math.min(6, (a.duration || 0) * 1.5);    // ưu tiên clip đầy đủ
        if (score > bestScore) { bestScore = score; best = a; }
      }
      return best;
    };

    const idleClip = selectClip(/idle|survey/, { exact: /^idle\d*$|^idle$/ })
      || animations[0];

    const runClip = selectClip(/run|walk/, { exact: /^run\d*$|^run$/ })
      || animations[1] || animations[0];

    const attackClip = selectClip(/attack|crit/, { exact: /^attack1?$/ })
      || selectClip(/attack|crit/);

    if (idleClip) this.actions.idle = this.mixer.clipAction(idleClip);
    if (runClip) this.actions.run = this.mixer.clipAction(runClip);
    if (attackClip) this.actions.attack = this.mixer.clipAction(attackClip);

    // ------------------------------------------------------------------
    // ANIMATION CHIÊU THỨC (Spell1..Spell4 = Q/W/E/R)
    // Model Riot có sẵn các clip này nhưng trước đây game chỉ load
    // idle/run/attack nên tung chiêu không có hoạt ảnh -> trông không giống.
    // ------------------------------------------------------------------
    const spellSlots = ['Q', 'W', 'E', 'R'];
    spellSlots.forEach((slot, idx) => {
      const spellNum = idx + 1;

      // Chấm điểm từng clip ứng viên rồi chọn clip TỐT NHẤT.
      // Lý do: mỗi model Riot đặt tên khác nhau — có tướng là "Spell3",
      // có tướng chỉ có biến thể hướng như "Spell3_east"/"Spell3_North",
      // nên không thể chỉ dùng .find() lấy cái đầu tiên.
      let best = null;
      let bestScore = -Infinity;

      for (const a of animations) {
        const n = (a.name || '').toLowerCase();
        if (!n.includes(`spell${spellNum}`)) continue;

        let score = 0;

        // Loại hẳn clip chuyển cảnh / không phải động tác tung chiêu
        if (/_to_|_to-|_torun|_toidle|_from_/.test(n)) continue;
        if (/windup|channel/.test(n)) continue;
        if (/recall|dance|joke|taunt|laugh|death/.test(n)) continue;

        // Ưu tiên tên khớp CHÍNH XÁC (vd "spell3") — điểm cao nhất
        if (new RegExp(`^spell${spellNum}$`).test(n)) score += 100;
        else if (new RegExp(`^spell${spellNum}[a-z]?$`).test(n)) score += 80; // Spell1A, Spell1B
        else if (n.startsWith(`spell${spellNum}`)) score += 40;

        // Phạt các biến thể hướng/vị trí (east/north/south/west, _90, _180...)
        if (/_(east|north|south|west|left|right|top|bottom)$/.test(n)) score -= 25;
        if (/_(-?\d+)$/.test(n)) score -= 25;
        if (/variant|alt|copy/.test(n)) score -= 15;

        // Ưu tiên clip dài hơn một chút (động tác đầy đủ hơn)
        score += Math.min(5, (a.duration || 0) * 2);

        if (score > bestScore) {
          bestScore = score;
          best = a;
        }
      }

      if (best) {
        this.actions['spell' + slot] = this.mixer.clipAction(best);
      }
    });

    if (this.actions.idle) {
      this.currentAction = this.actions.idle;
      this.currentAction.play();
    }
  }

  // -------------------------------------------------------------------
  // PHÁT ANIMATION KHI TUNG CHIÊU
  // Trả về true nếu model có clip cho chiêu đó (để caller biết).
  // -------------------------------------------------------------------
  playSpellAnimation(slot) {
    const act = this.actions && this.actions['spell' + slot];
    if (!this.mixer || !act) return false;

    const prev = this.currentAction;
    act.reset();
    act.setLoop(THREE.LoopOnce, 1);
    act.clampWhenFinished = true;
    act.fadeIn(0.06).play();
    this.currentAction = act;

    const dur = Math.min(900, Math.max(250, (act.getClip().duration || 0.5) * 1000));
    setTimeout(() => {
      if (this.currentAction === act) {
        act.fadeOut(0.15);
        if (prev && prev !== act) {
          prev.reset().fadeIn(0.15).play();
          this.currentAction = prev;
        } else if (this.actions.idle) {
          this.actions.idle.reset().fadeIn(0.15).play();
          this.currentAction = this.actions.idle;
        }
      }
    }, dur);
    return true;
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
    // Ghi lại tướng đang được yêu cầu load. Nếu người chơi đổi tướng liên
    // tục, các request cũ về tới muộn sẽ bị BỎ QUA thay vì gắn chồng lên nhau.
    const requestId = (this._modelRequestId || 0) + 1;
    this._modelRequestId = requestId;

    gltfLoader.load(modelPath, (gltf) => {
      // Request lỗi thời -> không gắn vào mesh nữa
      if (requestId !== this._modelRequestId) return;

      // Dọn sạch model cũ trước khi gắn model mới
      this.purgeModelObjects();

      this.modelRoot = gltf.scene;
      this.modelRoot.scale.set(scale, scale, scale);
      this.modelRoot.traverse((child) => {
        if (child.isMesh) {
          child.castShadow = true;
          child.receiveShadow = true;
          // Model Riot dùng KHR_materials_unlit -> trông bẹt. Chuyển sang
          // material có phản ứng ánh sáng để nhân vật có khối như game thật.
          applyLitMaterials(child);
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

  // -------------------------------------------------------------------------
  // ARAM: Hồi sinh theo công thức cấp độ + thời gian trận đấu (không dùng
  // setTimeout cố định như trước). Người chơi chết -> hiện đồng hồ đếm ngược
  // -> hồi sinh tại hồi máu căn cứ Đồng Minh (z = +100), đúng luật ARAM.
  // -------------------------------------------------------------------------
  die() {
    if (this.isDead) return;
    this.isDead = true;
    this.deaths = (this.deaths || 0) + 1;

    // Xóa mọi lệnh di chuyển / mục tiêu đang dở dang
    this.targetPos = null;
    this.autoAttackTarget = null;

    // Tính thời gian hồi sinh theo đúng nhịp ARAM
    const matchSeconds = (typeof window !== 'undefined' && window.aramMatch) ? window.aramMatch.elapsed : 0;
    this.respawnTimer = getRespawnSeconds(this.level || 1, matchSeconds);
    this.respawnTimerMax = this.respawnTimer;

    // Chơi hiệu ứng chết
    if (this.actions && this.actions.death) {
      if (this.currentAction) this.currentAction.fadeOut(0.15);
      this.actions.death.reset().fadeIn(0.15).play();
    }

    // Ẩn mô hình sau khi animation chết chạy xong
    setTimeout(() => {
      if (this.isDead) this.mesh.visible = false;
    }, 900);

    if (typeof window !== 'undefined' && window.onPlayerDeath) {
      window.onPlayerDeath(this.respawnTimer);
    }
  }

  // Cập nhật đồng hồ hồi sinh (gọi mỗi frame trong update)
  updateRespawn(delta) {
    if (!this.isDead) return;
    this.respawnTimer = Math.max(0, (this.respawnTimer || 0) - delta);

    if (typeof window !== 'undefined' && window.onRespawnTick) {
      window.onRespawnTick(this.respawnTimer);
    }

    if (this.respawnTimer <= 0) {
      this.respawn();
    }
  }

  // Hồi sinh tại căn cứ Đồng Minh với đầy máu/mana
  respawn() {
    this.isDead = false;
    this.hp = this.maxHp;
    this.mp = this.maxMp;
    this.mesh.position.set(0, 0, 95); // Hồi sinh cạnh Nhà Chính Đồng Minh
    this.mesh.visible = true;
    this.targetPos = null;
    this.autoAttackTarget = null;
    this.attackCooldown = 0;

    if (this.actions) {
      if (this.actions.death) this.actions.death.stop();
      if (this.actions.idle) {
        this.currentAction = this.actions.idle;
        this.currentAction.reset().fadeIn(0.2).play();
      }
    }

    if (this.healthBar) {
      this.healthBar.updateBar(this.hp, this.maxHp, this.mp, this.maxMp);
    }

    if (typeof window !== 'undefined' && window.onPlayerRespawn) {
      window.onPlayerRespawn();
    }
  }

  update(delta, time) {
    // ARAM: khi đã chết vẫn phải chạy đồng hồ hồi sinh (trước đây return sớm
    // khiến người chơi không bao giờ hồi sinh đúng nhịp).
    if (this.isDead) {
      this.updateRespawn(delta);
      return;
    }
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
    // Bot địch di chuyển chậm hơn một chút (85%) để người chơi có thể kiting.
    // champData.speed đã là tốc độ chuẩn LoL sau khi sửa quy đổi.
    this.speed = +(champData.speed * 0.85).toFixed(3);
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

