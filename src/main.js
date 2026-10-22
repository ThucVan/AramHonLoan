import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { HowlingAbyssMap } from './map.js';
import { VFXSystem } from './vfx.js';
import { PlayerChampion, EnemyBot, Structure, Minion, setupLoaders, loadDataDragonChampions } from './champion.js';
import { preloadAllModels } from './model_cache.js';
import { SkillSystem } from './skills.js';
import { sounds } from './audio.js';
import { SKILL_CATALOG, getAllSkills } from './skill_catalog.js';
import { ITEMS_CATALOG, getItemById } from './items.js';
import { ARAM_MAYHEM_AUGMENTS, getRandomMayhemAugments, getAugmentById } from './augments.js';
import { Minimap, isAtFountain } from './minimap.js';
import {
  ACTIVE_MODE,
  ARAM_ECONOMY,
  ARAM_CHAMPION_SELECT,
  MATCH_RULES,
  MATCH_STATE,
  createMatchState,
  getRespawnSeconds,
  getLevelFromXp,
  LEVEL_XP_THRESHOLDS,
  rollRandomChampion
} from './aram_rules.js';

// 1. Scene, Camera, Renderer Setup
const container = document.getElementById('canvas-container');
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x060c18);
scene.fog = new THREE.FogExp2(0x0a1628, 0.007);

const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.5, 350);
const cameraOffset = new THREE.Vector3(0, 24, 22);

const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.35;
container.appendChild(renderer.domElement);

// Setup KTX2 & Draco loaders for official League models
setupLoaders(renderer);

// Preload all 12 League 3D models into RAM for 0ms instant clones
preloadAllModels();

// Nạp chỉ số tướng chuẩn Data Dragon 14.5.1 từ Riot Games CDN
loadDataDragonChampions().then(() => {
  if (typeof player !== 'undefined' && player) {
    player.setHeroProfile(player.heroType);
    recalcPlayerStats();
  }
});

// Post-processing Bloom
const composer = new EffectComposer(renderer);
const renderPass = new RenderPass(scene, camera);
composer.addPass(renderPass);

const bloomPass = new UnrealBloomPass(
  new THREE.Vector2(window.innerWidth, window.innerHeight),
  0.75, // bloom strength
  0.4,  // radius
  0.8   // threshold
);
composer.addPass(bloomPass);

// 2. Lighting (Howling Abyss Arctic Atmosphere matching Image 2)
const ambientLight = new THREE.AmbientLight(0x93c5fd, 1.3);
scene.add(ambientLight);

const sunLight = new THREE.DirectionalLight(0xe0f2fe, 2.8);
sunLight.position.set(-25, 45, 30);
sunLight.castShadow = true;
sunLight.shadow.mapSize.width = 2048;
sunLight.shadow.mapSize.height = 2048;
sunLight.shadow.camera.near = 10;
sunLight.shadow.camera.far = 160;
const d = 55;
sunLight.shadow.camera.left = -d;
sunLight.shadow.camera.right = d;
sunLight.shadow.camera.top = d;
sunLight.shadow.camera.bottom = -d;
sunLight.shadow.bias = -0.0005;
scene.add(sunLight);

// Upward blue soul-glow from the bottom of the Howling Abyss
const abyssLight = new THREE.DirectionalLight(0x0284c7, 0.9);
abyssLight.position.set(0, -30, 0);
scene.add(abyssLight);

// 3. Map & World Entities
const map = new HowlingAbyssMap(scene);
const vfx = new VFXSystem(scene);
const player = new PlayerChampion(scene);
const skills = new SkillSystem(scene, player, vfx, sounds);
window.player = player;
window.skills = skills;
window.scene = scene;

// STRUCTURES
const blueStructures = [
  new Structure(scene, 'Trụ 1 Đồng Minh', true, 0, 24, 'outer_turret'),
  new Structure(scene, 'Trụ 2 Đồng Minh', true, 0, 46, 'inner_turret'),
  new Structure(scene, 'Trụ Nhà Lính Đồng Minh', true, 0, 68, 'inhibitor_turret'),
  new Structure(scene, 'Nhà Lính Đồng Minh', true, 0, 82, 'inhibitor'),
  new Structure(scene, 'Nhà Chính Đồng Minh', true, 0, 100, 'nexus')
];

const redStructures = [
  new Structure(scene, 'Trụ 1 Địch', false, 0, -24, 'outer_turret'),
  new Structure(scene, 'Trụ 2 Địch', false, 0, -46, 'inner_turret'),
  new Structure(scene, 'Trụ Nhà Lính Địch', false, 0, -68, 'inhibitor_turret'),
  new Structure(scene, 'Nhà Lính Địch', false, 0, -82, 'inhibitor'),
  new Structure(scene, 'Nhà Chính Địch', false, 0, -100, 'nexus')
];

// Enemy Champion Bot
const enemyBots = [
  new EnemyBot(scene, -3.5, -8, 'Bot Sát Thủ'),
  new EnemyBot(scene, 3.5, -14, 'Bot Đấu Sĩ')
];

// Expose các thực thể chính ra window để tiện debug trong DevTools.
// Ví dụ: aramDebug.redStructures[4].isDestroyed  (Nhà Chính Địch)
window.aramDebug = {
  get blueStructures() { return blueStructures; },
  get redStructures() { return redStructures; },
  get alliedMinions() { return alliedMinions; },
  get enemyMinions() { return enemyMinions; },
  get enemyBots() { return enemyBots; }
};

// ============================================================================
// ARAM MATCH STATE (Queue #2400 — ARAM: Hỗn Loạn)
// Theo dõi thời gian trận, số lần chết, điều kiện thắng/thua.
// ============================================================================
const aramMatch = createMatchState({ mode: ACTIVE_MODE });
window.aramMatch = aramMatch;

// Đồng hồ trận đấu & chỉ số K/D trên HUD
const elMatchTimer = document.getElementById('lol-match-timer');
const elMatchKda = document.getElementById('aram-match-kda'); // (không còn trong HUD mới)
const elModeName = document.getElementById('aram-mode-name');
if (elModeName) elModeName.textContent = ACTIVE_MODE.name.toUpperCase();

// Overlay chết / hồi sinh
const elDeathOverlay = document.getElementById('aram-death-overlay');
const elDeathTimer = document.getElementById('aram-death-timer');

// Overlay kết quả trận
const elResultOverlay = document.getElementById('aram-result-overlay');
const elResultTitle = document.getElementById('aram-result-title');
const elResultSub = document.getElementById('aram-result-sub');
const elResultStats = document.getElementById('aram-result-stats');

// Callback được gọi từ PlayerChampion.die()
window.onPlayerDeath = (seconds) => {
  aramMatch.playerDeaths += 1;
  if (elDeathOverlay) elDeathOverlay.classList.remove('hidden');
  if (elDeathTimer) elDeathTimer.textContent = Math.ceil(seconds);
};

// Callback mỗi frame khi đang chờ hồi sinh
window.onRespawnTick = (secondsLeft) => {
  if (elDeathTimer) elDeathTimer.textContent = Math.max(0, Math.ceil(secondsLeft));
};

// Callback khi hồi sinh xong
window.onPlayerRespawn = () => {
  if (elDeathOverlay) elDeathOverlay.classList.add('hidden');
};

// ============================================================================
// MINIMAP + BỆ ĐÁ CỔ (Fountain Gate)
// ARAM: chỉ được mua trang bị khi đứng trong vùng căn cứ quanh Nhà Chính.
// ============================================================================
const minimapCanvas = document.getElementById('minimap-canvas');
const minimap = minimapCanvas ? new Minimap(minimapCanvas) : null;

const elFountainWarning = document.getElementById('fountain-warning');
const elShopBtn = document.getElementById('btn-open-shop');
const elScoreBlue = document.getElementById('lol-score-blue');
const elScoreRed = document.getElementById('lol-score-red');

// Trạng thái hiện tại của người chơi so với Bệ Đá Cổ
let playerAtFountain = true;
let fountainWarningTimer = 0;

/** Cập nhật giao diện theo trạng thái Bệ Đá Cổ */
function updateFountainUi(atFountain) {
  const changed = atFountain !== playerAtFountain;
  playerAtFountain = atFountain;

  if (elShopBtn) {
    if (atFountain) {
      elShopBtn.classList.remove('locked');
      elShopBtn.title = 'Mở Cửa Hàng (P) — bạn đang ở Bệ Đá Cổ';
    } else {
      elShopBtn.classList.add('locked');
      elShopBtn.title = 'Cần đứng tại Bệ Đá Cổ mới mua được trang bị!';
    }
  }

  // Khi trạng thái đổi mà cửa hàng đang mở -> làm mới trạng thái nút Mua/Bán
  if (changed && typeof window.refreshShopButtons === 'function') {
    window.refreshShopButtons();
  }
}

/** Hiện cảnh báo khi cố mua đồ ngoài vùng căn cứ */
function showFountainWarning() {
  if (!elFountainWarning) return;
  elFountainWarning.classList.remove('hidden');
  fountainWarningTimer = 2.2; // tự ẩn sau 2.2s
}

/** Hiển thị màn hình kết thúc trận đấu */
function showMatchResult(won) {
  if (aramMatch.state !== MATCH_STATE.RUNNING) return;
  aramMatch.finish(won);

  if (elResultTitle) {
    elResultTitle.textContent = won ? 'CHIẾN THẮNG' : 'THẤT BẠI';
    elResultTitle.className = 'aram-result-title ' + (won ? 'victory' : 'defeat');
  }
  if (elResultSub) {
    elResultSub.textContent = won
      ? 'Bạn đã phá hủy Nhà Chính Địch — Vực Gió Hú thuộc về Đồng Minh!'
      : 'Nhà Chính Đồng Minh đã bị phá hủy. Hãy thử lại!';
  }
  if (elResultStats) {
    elResultStats.innerHTML =
      `⏱️ Thời gian: <b>${aramMatch.formatTime()}</b><br>` +
      `⚔️ Hạ gục: <b>${aramMatch.playerKills}</b> · Chết: <b>${aramMatch.playerDeaths}</b><br>` +
      `🏰 Trụ đã phá: <b>${aramMatch.turretsDestroyed}</b>`;
  }
  if (elResultOverlay) elResultOverlay.classList.remove('hidden');
}

// Nút chơi lại
const btnAramRestart = document.getElementById('btn-aram-restart');
if (btnAramRestart) {
  btnAramRestart.addEventListener('click', () => window.location.reload());
}

// MINIONS SYSTEM
let alliedMinions = [];
let enemyMinions = [];
let minionProjectiles = [];
let playerProjectiles = []; // Đạn đánh thường của Tướng người chơi (Ashe, Jinx)
let waveTimer = 0;
let waveCount = 0;

function spawnMinionWave(initial = false) {
  const redInhibitorDestroyed = redStructures[3].isDestroyed;
  const blueInhibitorDestroyed = blueStructures[3].isDestroyed;

  waveCount++;
  // LMHT: cứ mỗi đợt thứ 3 thì có thêm 1 lính công thành (siege) mỗi bên
  const hasSiege = !initial && waveCount % 3 === 0;

  const blueSpawnZ = initial ? 20 : 85;
  const redSpawnZ = initial ? -20 : -85;

  // Blue Wave
  for (let i = -1; i <= 1; i++) {
    alliedMinions.push(new Minion(scene, true, 'melee', i * 2.2, blueSpawnZ));
  }
  for (let i = -1; i <= 1; i++) {
    alliedMinions.push(new Minion(scene, true, 'caster', i * 2.2, blueSpawnZ + 4));
  }
  if (hasSiege) {
    alliedMinions.push(new Minion(scene, true, 'siege', 0, blueSpawnZ + 8));
  }
  if (redInhibitorDestroyed) {
    alliedMinions.push(new Minion(scene, true, 'super', 0, blueSpawnZ + 7));
  }

  // Red Wave
  for (let i = -1; i <= 1; i++) {
    enemyMinions.push(new Minion(scene, false, 'melee', i * 2.2, redSpawnZ));
  }
  for (let i = -1; i <= 1; i++) {
    enemyMinions.push(new Minion(scene, false, 'caster', i * 2.2, redSpawnZ - 4));
  }
  if (hasSiege) {
    enemyMinions.push(new Minion(scene, false, 'siege', 0, redSpawnZ - 8));
  }
  if (blueInhibitorDestroyed) {
    enemyMinions.push(new Minion(scene, false, 'super', 0, redSpawnZ - 7));
  }
}

// Initial wave spawns close so battle starts immediately!
spawnMinionWave(true);

// 4. Input & Raycasting
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
const groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
const mouseWorldPos = new THREE.Vector3();

function updateMouseGround(event) {
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
  raycaster.setFromCamera(mouse, camera);
  raycaster.ray.intersectPlane(groundPlane, mouseWorldPos);
}

// Tìm kiếm mục tiêu địch dưới con trỏ chuột (Bot địch, Lính địch, Trụ địch)
function findTargetUnderMouse() {
  const clickableObjects = [];
  const objectMap = new Map();

  for (const bot of enemyBots) {
    if (!bot.isDead) {
      clickableObjects.push(bot.mesh);
      objectMap.set(bot.mesh, bot);
    }
  }
  for (const m of enemyMinions) {
    if (!m.isDead) {
      clickableObjects.push(m.mesh);
      objectMap.set(m.mesh, m);
    }
  }
  for (const s of redStructures) {
    if (!s.isDestroyed) {
      clickableObjects.push(s.group);
      objectMap.set(s.group, s);
    }
  }

  const intersects = raycaster.intersectObjects(clickableObjects, true);
  if (intersects.length > 0) {
    let root = intersects[0].object;
    while (root && !objectMap.has(root) && root.parent) {
      root = root.parent;
    }
    if (objectMap.has(root)) {
      return objectMap.get(root);
    }
  }
  return null;
}

window.addEventListener('mousemove', (e) => {
  updateMouseGround(e);
  if (skills.activeAimSkill) {
    skills.showAim(skills.activeAimSkill, mouseWorldPos);
  }
});

let isPointerDragging = false;

window.addEventListener('pointerdown', (e) => {
  // If clicking on UI (HUD, modals, buttons, cards), ignore 3D game ground action
  if (e.target && e.target.closest && (
    e.target.closest('.lol-hud') ||
    e.target.closest('.lol-scoreboard') ||
    e.target.closest('.lol-minimap-wrapper') ||
    e.target.closest('.lol-utility-bar') ||
    e.target.closest('.skill-modal-content') ||
    e.target.closest('.skill-modal-backdrop') ||
    e.target.closest('.shop-modal-content') ||
    e.target.closest('.shop-modal-backdrop') ||
    e.target.closest('.augment-modal-content') ||
    e.target.closest('.augment-modal-backdrop') ||
    e.target.closest('.top-header') ||
    e.target.closest('button') ||
    e.target.closest('.modal-content')
  )) {
    return;
  }

  sounds.ensureContext();
  updateMouseGround(e);

  // LOGIC LIÊN MINH HUYỀN THOẠI (League of Legends Controls):
  // 1. CHUỘT PHẢI (e.button === 2): Di chuyển (Move) & Đánh thường (Auto Attack) kẻ địch
  if (e.button === 2) {
    const clickedEnemy = findTargetUnderMouse();
    if (clickedEnemy) {
      player.autoAttackTarget = clickedEnemy;
      player.targetPos = null;
      const targetPos = clickedEnemy.mesh ? clickedEnemy.mesh.position : clickedEnemy.group.position;
      vfx.spawnClickMarker(targetPos.x, targetPos.z, 'attack');
      sounds.playMove();
    } else {
      player.autoAttackTarget = null;
      isPointerDragging = true; // Cho phép giữ chuột phải để di chuyển liên tục
      player.moveTo(mouseWorldPos);
      vfx.spawnClickMarker(mouseWorldPos.x, mouseWorldPos.z, 'move');
      sounds.playMove();
    }
    return;
  }

  // 2. CHUỘT TRÁI (e.button === 0): Dùng để CHỌN (Select / UI), KHÔNG di chuyển tướng
  if (e.button === 0) {
    if (skills.activeAimSkill) {
      // Nếu đang bật ngắm kỹ năng định hướng -> Click chuột trái để xác nhận tung chiêu
      const enemies = getAllEnemies();
      skills.cast(skills.activeAimSkill, mouseWorldPos, enemies);
      skills.activeAimSkill = null;
    } else {
      // Click chuột trái vào kẻ địch -> Chọn mục tiêu để hiển thị thông tin
      const clickedEnemy = findTargetUnderMouse();
      if (clickedEnemy) {
        vfx.spawnDamageNumber('🎯 ĐÃ CHỌN', clickedEnemy.mesh ? clickedEnemy.mesh.position : clickedEnemy.group.position, 'normal');
      }
      // Click chuột trái vào mặt đất: KHÔNG di chuyển tướng (chuẩn 100% LMHT)
    }
    return;
  }
});

window.addEventListener('pointermove', (e) => {
  // Chỉ khi đang giữ chuột phải (e.buttons & 2) thì mới di chuyển liên tục theo chuột
  if (isPointerDragging && (e.buttons & 2)) {
    updateMouseGround(e);
    player.moveTo(mouseWorldPos);
  }
});

window.addEventListener('pointerup', (e) => {
  if (e.button === 2) {
    isPointerDragging = false;
  }
});

window.addEventListener('contextmenu', (e) => {
  e.preventDefault();
});

window.addEventListener('keydown', (e) => {
  sounds.ensureContext();
  const key = e.key.toUpperCase();

  if (['Q', 'W', 'E', 'R', 'D'].includes(key)) {
    castSkillSlot(key);
  } else if (key === 'P') {
    toggleShopModal();
  } else if (key === 'N') {
    openAugmentModal();
  } else if (key === 'A' || key === 'C') {
    // Phím A hoặc C: Bật / tắt vòng tầm đánh chuẩn LMHT
    const isVisible = player.toggleRangeRing();
    vfx.spawnDamageNumber(isVisible ? `🎯 TẦM ĐÁNH: ${player.rangeLol}` : 'ẨN TẦM ĐÁNH', player.mesh.position, 'heal');
  } else if (e.code === 'Space') {
    camera.position.copy(player.mesh.position).add(cameraOffset);
  }
});

// ---------------------------------------------------------------------------
// TẦM ĐÁNH HIỆU DỤNG (chuẩn LMHT: mép-tới-mép).
// basicAttack() đo tâm-tới-tâm nên phải cộng bán kính hai bên. Nếu chỉ dùng
// player.range trơn thì tướng phải đứng sát hơn LMHT thật mới đánh được.
// ---------------------------------------------------------------------------
function getEdgeRange(attacker, target) {
  const selfRadius = 0.9;
  let targetRadius = 0.6;
  const t = target && target.type ? String(target.type) : '';
  if (t.includes('turret')) targetRadius = 2.4;
  else if (t === 'nexus') targetRadius = 3.2;
  else if (t === 'inhibitor') targetRadius = 2.0;
  else if (target && target.mesh && target.mesh.userData && target.mesh.userData.isChampion) targetRadius = 0.9;
  return (attacker.range || 0) + selfRadius + targetRadius;
}

function getAllEnemies() {
  const list = [...enemyBots];
  for (const m of enemyMinions) {
    if (!m.isDead) list.push(m);
  }
  for (const s of redStructures) {
    if (!s.isDestroyed) {
      list.push({
        mesh: { position: s.group.position },
        takeDamage: (amt, v) => s.takeDamage(amt, v),
        isDead: s.isDestroyed
      });
    }
  }
  return list;
}

function castSkillSlot(slot) {
  const enemies = getAllEnemies();
  // Phát hoạt ảnh tung chiêu của tướng (Spell1..Spell4 trong model GLB).
  // Nếu model không có clip tương ứng thì bỏ qua, không ảnh hưởng gameplay.
  if (player && typeof player.playSpellAnimation === 'function') {
    player.playSpellAnimation(slot);
  }
  skills.cast(slot, mouseWorldPos, enemies);
}

// 5. STATS & INVENTORY SYSTEM
function recalcPlayerStats() {
  let addAd = 0;
  let addAp = 0;
  let addArmor = 0;
  let addMr = 0;
  let addSpeed = 0;
  let addLifesteal = 0;
  let addCrit = 0;
  let addHp = 0;
  let addMp = 0;

  player.inventory.forEach(item => {
    if (item.stats.ad) addAd += item.stats.ad;
    if (item.stats.ap) addAp += item.stats.ap;
    if (item.stats.armor) addArmor += item.stats.armor;
    if (item.stats.mr) addMr += item.stats.mr;
    if (item.stats.speed) addSpeed += item.stats.speed;
    if (item.stats.lifesteal) addLifesteal += item.stats.lifesteal;
    if (item.stats.crit) addCrit += item.stats.crit;
    if (item.stats.hp) addHp += item.stats.hp;
    if (item.stats.mana) addMp += item.stats.mana;
  });

  // Áp dụng chỉ số và hiệu ứng từ Lõi Nâng Cấp ARAM Mayhem
  let augAdPercent = 0;
  let augApPercent = 0;
  let augScaleModel = 1.0;

  if (player.augments && player.augments.length > 0) {
    player.augments.forEach(aug => {
      const s = aug.stats || {};
      if (s.ad) addAd += s.ad;
      if (s.ap) addAp += s.ap;
      if (s.armor) addArmor += s.armor;
      if (s.mr) addMr += s.mr;
      if (s.speed) addSpeed += s.speed;
      if (s.crit) addCrit += s.crit;
      if (s.hp) addHp += s.hp;
      if (s.lifesteal) addLifesteal += s.lifesteal;
      if (s.adPercent) augAdPercent += s.adPercent;
      if (s.apPercent) augApPercent += s.apPercent;
      if (s.scaleModel && s.scaleModel > augScaleModel) augScaleModel = s.scaleModel;
      if (s.cdrQ) skills.maxCooldowns.Q = Math.max(0.5, skills.maxCooldowns.Q * (1 - s.cdrQ));
      if (s.cdrW) skills.maxCooldowns.W = Math.max(1.0, skills.maxCooldowns.W * (1 - s.cdrW));
      if (s.cdrE) skills.maxCooldowns.E = Math.max(0.5, skills.maxCooldowns.E * (1 - s.cdrE));
      if (s.cdrAll) {
        ['Q', 'W', 'E', 'R'].forEach(k => {
          skills.maxCooldowns[k] = Math.max(1.0, skills.maxCooldowns[k] * (1 - s.cdrAll));
        });
      }
    });
  }

  player.ad = Math.round((player.baseAd + addAd) * (1 + augAdPercent));
  player.ap = Math.round((player.baseAp + addAp) * (1 + augApPercent));
  player.armor = Math.round(player.baseArmor + addArmor);
  player.mr = Math.round((player.baseMr || 30) + (addMr || 0));
  player.speed = +(player.baseSpeed + addSpeed).toFixed(2);
  player.lifesteal = player.baseLifesteal + addLifesteal;
  player.crit = addCrit;
  player.maxHp = Math.round(player.baseMaxHp + addHp);
  player.maxMp = Math.round(player.baseMaxMp + addMp);

  // Hiệu ứng phóng to mô hình tướng (Khổng Lồ Hóa / Goliath)
  if (player.modelRoot && augScaleModel > 1.0) {
    const s = 1.05 * augScaleModel;
    player.modelRoot.scale.set(s, s, s);
  }

  // Update Stats UI (Chuẩn Riot Data Dragon 14.5.1)
  const statAdEl = document.getElementById('stat-ad');
  if (statAdEl) statAdEl.textContent = player.ad;

  const statArmorEl = document.getElementById('stat-armor');
  if (statArmorEl) statArmorEl.textContent = player.armor;

  const statMrEl = document.getElementById('stat-mr');
  if (statMrEl) statMrEl.textContent = player.mr || player.baseMr || 30;

  const statApEl = document.getElementById('stat-ap');
  if (statApEl) statApEl.textContent = player.ap;

  const statAsEl = document.getElementById('stat-as');
  if (statAsEl) statAsEl.textContent = player.baseAttackSpeed || '0.65';

  const statSpdEl = document.getElementById('stat-spd');
  if (statSpdEl) statSpdEl.textContent = `${player.movespeedLol || Math.round(player.speed * 25)}`;

  const statLifestealEl = document.getElementById('stat-lifesteal');
  if (statLifestealEl) statLifestealEl.textContent = `${Math.round(player.lifesteal * 100)}%`;

  const statRangeEl = document.getElementById('stat-range');
  if (statRangeEl && player.rangeLol) {
    statRangeEl.textContent = `${player.rangeLol} (${player.attackType === 'ranged' ? 'Xa' : 'Gần'})`;
  }

  const hudLvlEl = document.getElementById('hud-level');
  if (hudLvlEl) hudLvlEl.textContent = player.level || 1;

  // Update 6 Inventory Slots UI với ảnh icon chính thức từ Riot Games
  for (let i = 0; i < 6; i++) {
    const slotEl = document.querySelector(`.lol-inv-slot[data-slot="${i}"] .lol-inv-inner`);
    if (slotEl) {
      if (player.inventory[i]) {
        const it = player.inventory[i];
        slotEl.style.backgroundImage = 'none';
        slotEl.innerHTML = `<img src="${it.iconImg}" style="width:100%;height:100%;object-fit:cover;border-radius:4px;display:block;" alt="${it.name}" />`;
        slotEl.parentElement.title = `${it.name} (Click để mở shop bán lại)`;
      } else {
        slotEl.style.backgroundImage = 'none';
        slotEl.innerHTML = '';
        slotEl.parentElement.title = `Ô ${i + 1} trống`;
      }
    }
  }

  // Update 4 Augment Slots UI
  for (let i = 0; i < 4; i++) {
    const slotEl = document.getElementById(`aug-slot-${i}`);
    if (slotEl) {
      slotEl.className = 'lol-aug-chip';
      const inner = slotEl.querySelector('.lol-aug-inner');
      if (player.augments && player.augments[i]) {
        const aug = player.augments[i];
        slotEl.classList.add(`rarity-${aug.rarity.toLowerCase()}`);
        if (inner) inner.innerHTML = `<img src="${aug.iconImg}" alt="${aug.name}" />`;
        slotEl.title = `[${aug.rarity}] ${aug.name}\n${aug.desc}`;
      } else {
        if (inner) inner.innerHTML = '';
        slotEl.title = `Ô Lõi ${i + 1} (Trống - Bấm N để chọn)`;
      }
    }
  }

  // Update Gold
  document.getElementById('hud-gold').textContent = Math.floor(player.gold);
  document.getElementById('shop-user-gold').textContent = Math.floor(player.gold);
}

// 6. ADVERSATOR ITEM SHOP MODAL
const shopModal = document.getElementById('shop-modal');
const btnOpenShop = document.getElementById('btn-open-shop');
const btnCloseShop = document.getElementById('btn-close-shop');
const shopTabs = document.querySelectorAll('.shop-tab');
const shopGrid = document.getElementById('shop-items-grid');

const detailIcon = document.getElementById('detail-icon');
const detailName = document.getElementById('detail-name');
const detailCost = document.getElementById('detail-cost');
const detailStats = document.getElementById('detail-stats');
const detailDesc = document.getElementById('detail-desc');
const btnBuy = document.getElementById('btn-buy-item');
const btnSell = document.getElementById('btn-sell-item');

let currentShopCategory = 'ALL';
let selectedShopItem = ITEMS_CATALOG[0];
let selectedInventoryIndex = null;

function toggleShopModal() {
  if (shopModal.classList.contains('hidden')) {
    shopModal.classList.remove('hidden');
    renderShopGrid();
    selectShopItem(selectedShopItem);
  } else {
    shopModal.classList.add('hidden');
  }
}

btnOpenShop.addEventListener('click', toggleShopModal);
btnCloseShop.addEventListener('click', toggleShopModal);

// Click inventory slot in HUD -> opens shop to sell
document.querySelectorAll('.lol-inv-slot').forEach(slotEl => {
  slotEl.addEventListener('click', () => {
    const idx = parseInt(slotEl.dataset.slot, 10);
    if (player.inventory[idx]) {
      selectedShopItem = player.inventory[idx];
      selectedInventoryIndex = idx;
      if (shopModal.classList.contains('hidden')) {
        shopModal.classList.remove('hidden');
      }
      renderShopGrid();
      selectShopItem(selectedShopItem, idx);
    }
  });
});

shopTabs.forEach(tab => {
  tab.addEventListener('click', () => {
    shopTabs.forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    currentShopCategory = tab.dataset.cat;
    renderShopGrid();
  });
});

function renderShopGrid() {
  shopGrid.innerHTML = '';
  const filtered = currentShopCategory === 'ALL'
    ? ITEMS_CATALOG
    : ITEMS_CATALOG.filter(it => it.category === currentShopCategory);

  filtered.forEach(it => {
    const card = document.createElement('div');
    card.className = `shop-card ${selectedShopItem && selectedShopItem.id === it.id ? 'selected' : ''}`;

    card.innerHTML = `
      <div class="card-top">
        <img class="card-thumb" src="${it.iconImg}" style="width:42px;height:42px;border-radius:4px;object-fit:cover;border:1px solid #0284c7;" alt="${it.name}" />
        <div class="card-info">
          <div class="card-name">${it.name}</div>
          <div class="card-price">🪙 ${it.cost} G</div>
        </div>
      </div>
    `;

    card.addEventListener('click', () => {
      selectedInventoryIndex = null;
      selectShopItem(it);
      document.querySelectorAll('.shop-card').forEach(c => c.classList.remove('selected'));
      card.classList.add('selected');
    });

    shopGrid.appendChild(card);
  });
}

function selectShopItem(it, invIdx = null) {
  selectedShopItem = it;
  selectedInventoryIndex = invIdx;

  detailName.textContent = it.name;
  detailCost.textContent = `${it.cost} G`;

  detailIcon.style.backgroundImage = 'none';
  detailIcon.innerHTML = `<img src="${it.iconImg}" style="width:100%;height:100%;border-radius:6px;object-fit:cover;" alt="${it.name}" />`;

  // Stats text
  const statParts = [];
  if (it.stats.ad) statParts.push(`+ ${it.stats.ad} Sát thương Công Kích (AD)`);
  if (it.stats.ap) statParts.push(`+ ${it.stats.ap} Sức mạnh Phép Thuật (AP)`);
  if (it.stats.armor) statParts.push(`+ ${it.stats.armor} Giáp Vật Lý`);
  if (it.stats.hp) statParts.push(`+ ${it.stats.hp} Máu Tối Đa`);
  if (it.stats.mana) statParts.push(`+ ${it.stats.mana} Năng Lượng (Mana)`);
  if (it.stats.speed) statParts.push(`+ ${it.stats.speed} Tốc Độ Di Chuyển`);
  if (it.stats.lifesteal) statParts.push(`+ ${Math.round(it.stats.lifesteal * 100)}% Hút Máu`);
  if (it.stats.crit) statParts.push(`+ ${Math.round(it.stats.crit * 100)}% Tỉ Lệ Chí Mạng`);
  if (it.stats.hpRestore) statParts.push(`Hồi phục ${it.stats.hpRestore} Máu khi kích hoạt`);

  detailStats.innerHTML = statParts.length > 0 ? statParts.join('<br>') : 'Vật phẩm tiêu hao đặc biệt.';
  detailDesc.textContent = it.desc;

  // Buy button state — bao gồm cả điều kiện Bệ Đá Cổ
  const canAfford = player.gold >= it.cost;
  const hasSpace = it.category === 'CONSUMABLE' || player.inventory.length < 6;
  const atFountain = isAtFountain(player.mesh.position);

  if (canAfford && hasSpace && atFountain) {
    btnBuy.classList.remove('disabled');
    btnBuy.textContent = 'MUA TRANG BỊ';
  } else if (!atFountain) {
    btnBuy.classList.add('disabled');
    btnBuy.textContent = 'CẦN Ở BỆ ĐÁ CỔ';
  } else {
    btnBuy.classList.add('disabled');
    btnBuy.textContent = 'MUA TRANG BỊ';
  }

  // Sell button state
  if (invIdx !== null || player.inventory.some(owned => owned.id === it.id)) {
    btnSell.classList.remove('hidden');
    const sellPrice = Math.floor(it.cost * 0.7);
    btnSell.textContent = `BÁN LẠI (${sellPrice} G)`;
  } else {
    btnSell.classList.add('hidden');
  }
}

// Cho phép làm mới trạng thái nút Mua/Bán khi người chơi vào/ra Bệ Đá Cổ
window.refreshShopButtons = () => {
  if (selectedShopItem) selectShopItem(selectedShopItem, selectedInventoryIndex);
};

btnBuy.addEventListener('click', () => {
  if (!selectedShopItem) return;

  // ------------------------------------------------------------------
  // ARAM RULE: chỉ được mua trang bị khi đứng tại Bệ Đá Cổ.
  // ------------------------------------------------------------------
  if (!isAtFountain(player.mesh.position)) {
    showFountainWarning();
    sounds.playMove();
    return;
  }

  if (player.gold < selectedShopItem.cost) return;

  if (selectedShopItem.category === 'CONSUMABLE') {
    player.gold -= selectedShopItem.cost;
    if (selectedShopItem.stats.hpRestore) {
      player.heal(selectedShopItem.stats.hpRestore, vfx);
    } else if (selectedShopItem.stats.mana) {
      player.mp = Math.min(player.maxMp, player.mp + selectedShopItem.stats.mana);
      vfx.spawnDamageNumber(`+${selectedShopItem.stats.mana} MP`, player.mesh.position, 'heal');
    }
    sounds.playHeal();
    vfx.spawnDamageNumber(`SỬ DỤNG: ${selectedShopItem.name}`, player.mesh.position, 'heal');
  } else {
    if (player.inventory.length >= 6) {
      alert('Túi đồ đã đầy (tối đa 6 ô trang bị)!');
      return;
    }
    player.gold -= selectedShopItem.cost;
    player.inventory.push(selectedShopItem);
    sounds.playHeal();
    vfx.spawnDamageNumber(`ĐÃ MUA: ${selectedShopItem.name}!`, player.mesh.position, 'heal');
  }

  recalcPlayerStats();
  selectShopItem(selectedShopItem, selectedInventoryIndex);
});

btnSell.addEventListener('click', () => {
  if (!selectedShopItem) return;

  // ARAM RULE: chỉ bán trang bị khi đứng tại Bệ Đá Cổ.
  if (!isAtFountain(player.mesh.position)) {
    showFountainWarning();
    sounds.playMove();
    return;
  }
  const idx = selectedInventoryIndex !== null ? selectedInventoryIndex : player.inventory.findIndex(it => it.id === selectedShopItem.id);
  if (idx !== -1) {
    const sellPrice = Math.floor(player.inventory[idx].cost * 0.7);
    player.gold += sellPrice;
    player.inventory.splice(idx, 1);
    sounds.playMove();
    selectedInventoryIndex = null;
    recalcPlayerStats();
    selectShopItem(selectedShopItem);
  }
});

// 6.5 ARAM MAYHEM AUGMENTS MODAL (Official CommunityDragon Cherry Augments)
const augmentModal = document.getElementById('augment-modal');
const btnOpenAugments = document.getElementById('btn-open-augments');
const btnCloseAugModal = document.getElementById('btn-close-augment-modal');
const btnRerollAug = document.getElementById('btn-reroll-augment');
const augmentCardsContainer = document.getElementById('augment-cards-container');
const rerollCountEl = document.getElementById('reroll-count');

let currentAugmentChoices = [];

function openAugmentModal() {
  if (!augmentModal) return;
  if (!player.augments) player.augments = [];
  if (player.augments.length >= 4) {
    alert('Bạn đã sở hữu tối đa 4 Lõi Nâng Cấp ARAM Mayhem!');
    return;
  }

  if (currentAugmentChoices.length === 0) {
    const ownedIds = player.augments.map(a => a.id);
    currentAugmentChoices = getRandomMayhemAugments(3, ownedIds);
  }

  renderAugmentChoices();
  updateRerollButton();
  augmentModal.classList.remove('hidden');
  augmentModal.style.display = 'flex';
}

function closeAugmentModal() {
  if (augmentModal) {
    augmentModal.classList.add('hidden');
    augmentModal.style.display = 'none';
  }
}

function updateRerollButton() {
  if (!rerollCountEl || !btnRerollAug) return;
  rerollCountEl.textContent = player.rerollsLeft;
  if (player.rerollsLeft <= 0) {
    btnRerollAug.classList.add('disabled');
  } else {
    btnRerollAug.classList.remove('disabled');
  }
}

function rerollAugments() {
  if (player.rerollsLeft <= 0) return;
  player.rerollsLeft--;
  sounds.playMove();
  const ownedIds = (player.augments || []).map(a => a.id);
  currentAugmentChoices = getRandomMayhemAugments(3, ownedIds);
  renderAugmentChoices();
  updateRerollButton();
  vfx.spawnDamageNumber('🎲 ĐÃ ĐỔI LẠI LÕI!', player.mesh.position, 'heal');
}

function renderAugmentChoices() {
  if (!augmentCardsContainer) return;
  augmentCardsContainer.innerHTML = '';

  const rarityMap = {
    SILVER: { label: 'BẠC (SILVER)', cls: 'rarity-silver' },
    GOLD: { label: 'VÀNG (GOLD)', cls: 'rarity-gold' },
    PRISMATIC: { label: 'KIM CƯƠNG (PRISMATIC)', cls: 'rarity-prismatic' }
  };

  currentAugmentChoices.forEach(aug => {
    const info = rarityMap[aug.rarity] || rarityMap.SILVER;
    const card = document.createElement('div');
    card.className = `augment-card ${info.cls}`;

    card.innerHTML = `
      <div class="card-rarity-pill">${info.label}</div>
      <div class="augment-icon-frame">
        <img src="${aug.iconImg}" alt="${aug.name}" />
      </div>
      <div class="augment-card-name">${aug.name}</div>
      <div class="augment-card-desc">${aug.desc || 'Tăng cường sức mạnh đặc biệt trong ARAM Hỗn Loạn.'}</div>
      <button class="btn-select-aug" type="button">CHỌN NÂNG CẤP</button>
    `;

    const handleSelect = (e) => {
      if (e) {
        e.preventDefault();
        e.stopPropagation();
      }
      selectAugment(aug);
    };

    card.addEventListener('click', handleSelect);
    const selectBtn = card.querySelector('.btn-select-aug');
    if (selectBtn) {
      selectBtn.addEventListener('click', handleSelect);
    }

    augmentCardsContainer.appendChild(card);
  });
}

function selectAugment(aug) {
  if (!player.augments) player.augments = [];
  if (player.augments.length >= 4) return;

  player.augments.push(aug);
  currentAugmentChoices = [];
  closeAugmentModal();
  sounds.playKill();
  vfx.spawnDamageNumber(`✨ LÕI: ${aug.name}!`, player.mesh.position, 'crit');
  recalcPlayerStats();

  if (btnOpenAugments) {
    if (player.augments.length >= 4) {
      btnOpenAugments.textContent = '🎲 LÕI (4/4)';
    } else {
      btnOpenAugments.textContent = `🎲 CHỌN LÕI (${player.augments.length}/4)`;
    }
  }
}

if (augmentModal) {
  augmentModal.addEventListener('pointerdown', (e) => e.stopPropagation());
  augmentModal.addEventListener('click', (e) => {
    if (e.target === augmentModal) {
      closeAugmentModal();
    }
  });
}

if (btnOpenAugments) {
  btnOpenAugments.addEventListener('click', (e) => {
    e.stopPropagation();
    openAugmentModal();
  });
}
if (btnCloseAugModal) {
  btnCloseAugModal.addEventListener('click', (e) => {
    e.stopPropagation();
    closeAugmentModal();
  });
}
if (btnRerollAug) {
  btnRerollAug.addEventListener('click', (e) => {
    e.stopPropagation();
    rerollAugments();
  });
}

// Cho phép click vào các ô Lõi trên HUD để mở bảng chọn lõi
for (let i = 0; i < 4; i++) {
  const slotEl = document.getElementById(`aug-slot-${i}`);
  if (slotEl) {
    slotEl.addEventListener('click', () => {
      if (player.augments && player.augments.length < 4) {
        openAugmentModal();
      }
    });
  }
}

// Initialize stats
recalcPlayerStats();

// 7. HUD & Customizer Modal Wiring
const hudHpBar = document.getElementById('hud-hp-bar');
const hudHpText = document.getElementById('hud-hp-text');
const hudMpBar = document.getElementById('hud-mp-bar');
const hudMpText = document.getElementById('hud-mp-text');
const iconD = document.getElementById('icon-D');

const cdOverlays = {
  Q: document.getElementById('cd-Q'),
  W: document.getElementById('cd-W'),
  E: document.getElementById('cd-E'),
  R: document.getElementById('cd-R'),
  D: document.getElementById('cd-D')
};

['Q', 'W', 'E', 'R', 'D'].forEach((k) => {
  const slot = document.getElementById(`slot-${k}`);
  if (slot) {
    slot.addEventListener('click', () => castSkillSlot(k));
  }
});

function updateHudSkills() {
  ['Q', 'W', 'E', 'R'].forEach(slot => {
    const skill = skills.getSkill(slot);
    const slotEl = document.getElementById(`slot-${slot}`);
    if (skill && slotEl) {
      // HUD mới (.lol-*) dùng các class này; class cũ (.skill-icon/.skill-mana)
      // không tồn tại trong index.html nên trước đây HUD không hề cập nhật.
      const iconEl = slotEl.querySelector('.lol-ability-icon');
      const manaEl = slotEl.querySelector('.lol-mana-cost');
      if (iconEl) {
        if (skill.iconImg) {
          iconEl.innerHTML = `<img src="${skill.iconImg}" alt="${skill.name}" />`;
        } else {
          iconEl.textContent = skill.icon || skill.iconFallback || '⚡';
        }
      }
      if (manaEl) manaEl.textContent = skill.mana;
      slotEl.title = `${slot}: ${skill.name} (${skill.hero})\nHồi chiêu: ${skill.cd}s | Tiêu hao: ${skill.mana} Mana\n${skill.desc || ''}`;
    }
  });

  // Snowball (Phím D)
  if (iconD) {
    const isMarked = skills.markedEnemy;
    const dImg = isMarked ? '/images/spells/snowball_dash.png' : '/images/spells/snowball.png';
    iconD.innerHTML = `<img src="${dImg}" alt="Snowball" />`;
  }
}

// Khởi tạo bộ kỹ năng chuẩn cho tướng đầu tiên (Yasuo)
skills.equipChampionKit('yasuo');
updateHudSkills();

// Champion 3D Model Switcher (Official Riot Games CommunityDragon Data)
const btnSwitchHero = document.getElementById('btn-switch-hero');
const avatarIcon = document.getElementById('avatar-icon');
// Danh sách tướng PHẢI khớp với ARAM_CHAMPION_SELECT.pool trong aram_rules.js,
// nếu lệch thì rollRandomChampion() có thể trả về tướng không tồn tại ở đây.
const availableHeroes = [
  { type: 'yasuo', name: 'Yasuo (Kẻ Bất Dung Thứ)', avatarImg: '/images/champions/yasuo.png', icon: '🌪️' },
  { type: 'jinx', name: 'Jinx (Khẩu Pháo Nổi Loạn)', avatarImg: '/images/champions/jinx.png', icon: '🚀' },
  { type: 'zed', name: 'Zed (Chúa Tể Bóng Tối)', avatarImg: '/images/champions/zed.png', icon: '🗡️' },
  { type: 'ashe', name: 'Ashe (Cung Băng Freljord)', avatarImg: '/images/champions/ashe.png', icon: '🏹' },
  { type: 'darius', name: 'Darius (Đại Tướng Noxus)', avatarImg: '/images/champions/darius.png', icon: '🪓' },
  { type: 'ahri', name: 'Ahri (Hồ Ly Chín Đuôi)', avatarImg: '/images/champions/ahri.png', icon: '🦊' },
  { type: 'ezreal', name: 'Ezreal (Nhà Thám Hiểm)', avatarImg: '/images/champions/ezreal.png', icon: '🔮' },
  { type: 'lux', name: 'Lux (Tiểu Thư Ánh Sáng)', avatarImg: '/images/champions/lux.png', icon: '✨' },
  { type: 'malphite', name: 'Malphite (Mảnh Vỡ Núi Lửa)', avatarImg: '/images/champions/malphite.png', icon: '🪨' },
  { type: 'nautilus', name: 'Nautilus (Người Khổng Lồ Biển)', avatarImg: '/images/champions/nautilus.png', icon: '⚓' },
  { type: 'chogath', name: "Cho'Gath (Quái Vật Hư Không)", avatarImg: '/images/champions/chogath.png', icon: '👹' },
  { type: 'katarina', name: 'Katarina (Lưỡi Dao Bóng Đêm)', avatarImg: '/images/champions/katarina.png', icon: '🗡️' },
  { type: 'akali', name: 'Akali (Sát Thủ Bóng Đêm)', avatarImg: '/images/champions/akali.png', icon: '💨' },
  { type: 'syndra', name: 'Syndra (Nữ Pháp Sư Bóng Đêm)', avatarImg: '/images/champions/syndra.png', icon: '🔮' }
];
let currentHeroIndex = 0;

function setAvatarUi(hero) {
  if (!avatarIcon) return;
  if (hero.avatarImg) {
    avatarIcon.innerHTML = `<img src="${hero.avatarImg}" alt="${hero.name}" />`;
  } else {
    avatarIcon.textContent = hero.icon;
  }
}
// Set initial avatar
setAvatarUi(availableHeroes[0]);

// ---------------------------------------------------------------------------
// ARAM CHAMPION SELECT: Random tướng giống ARAM thật + ô Bench/Reroll.
// Trước đây nút này xoay vòng tuần tự (không giống ARAM). ARAM thật cho người
// chơi 1 tướng random + số lượt đổi giới hạn, nên ở đây mô phỏng lại đúng vậy.
// ---------------------------------------------------------------------------
function applyHero(hero) {
  player.switchModel(hero.type);
  skills.equipChampionKit(hero.type);
  setAvatarUi(hero);
  updateHudSkills();
  renderLoadoutBar();
  recalcPlayerStats();
}

let aramRerollsLeft = ARAM_CHAMPION_SELECT.rerolls;
let aramBenchHero = null; // tướng đang giữ ở ô dự phòng (bench)

// Cập nhật tooltip mô tả trạng thái hiện tại của nút đổi tướng
function refreshSwitchHeroTitle() {
  if (!btnSwitchHero) return;
  const cur = availableHeroes[currentHeroIndex];
  const benchTxt = aramBenchHero ? ` | Bench: ${aramBenchHero.name}` : '';
  btnSwitchHero.title =
    `${cur.name} — Reroll còn ${aramRerollsLeft} lượt${benchTxt}`;
}

if (btnSwitchHero) {
  btnSwitchHero.addEventListener('click', () => {
    const cur = availableHeroes[currentHeroIndex];

    // --- 1. Có tướng ở bench: đổi chỗ qua lại giữa bench và tướng đang chơi ---
    if (aramBenchHero) {
      const target = aramBenchHero;
      aramBenchHero = cur;              // tướng vừa chơi giờ nằm ở bench
      const idx = availableHeroes.findIndex(h => h.type === target.type);
      if (idx >= 0) currentHeroIndex = idx;
      applyHero(target);
      sounds.playMove();
      vfx.spawnDamageNumber(`🔄 Đổi Bench: ${target.name.split(' ')[0]}`, player.mesh.position, 'heal');
      refreshSwitchHeroTitle();
      return;
    }

    // --- 2. Chưa có bench: reroll random (tiêu 1 lượt) ---
    if (aramRerollsLeft <= 0) {
      vfx.spawnDamageNumber('❌ ĐÃ HẾT LƯỢT ĐỔI TƯỚNG', player.mesh.position, 'crit');
      refreshSwitchHeroTitle();
      return;
    }

    // Random tướng KHÁC tướng đang chơi, có thể trùng bench cũ (nếu có)
    const exclude = [cur.type];
    const newKey = rollRandomChampion(exclude);
    const newIdx = availableHeroes.findIndex(h => h.type === newKey);
    if (newIdx < 0) return; // không có trong danh sách thì bỏ qua, không trừ lượt

    aramRerollsLeft -= 1;
    aramBenchHero = cur;               // giữ tướng cũ ở bench để đổi lại được
    currentHeroIndex = newIdx;
    const hero = availableHeroes[newIdx];
    applyHero(hero);
    sounds.playMove();
    vfx.spawnDamageNumber(`🎲 ${hero.name.split(' ')[0]} (còn ${aramRerollsLeft} lượt)`, player.mesh.position, 'heal');
    refreshSwitchHeroTitle();
  });
}

// Khởi tạo: ARAM random tướng ngay khi vào trận (không phải luôn Yasuo)
(function initAramRandomChampion() {
  const startKey = rollRandomChampion();
  const idx = availableHeroes.findIndex(h => h.type === startKey);
  if (idx >= 0) {
    currentHeroIndex = idx;
    applyHero(availableHeroes[idx]);
  }
  refreshSwitchHeroTitle();
})();

// Sketchfab 3D Model Uploader (File Button & Drag-and-Drop)
const btnUploadModel = document.getElementById('btn-upload-model');
const inputModelFile = document.getElementById('input-model-file');

if (btnUploadModel && inputModelFile) {
  btnUploadModel.addEventListener('click', () => {
    inputModelFile.click();
  });

  inputModelFile.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) handleCustomModelFile(file);
  });
}

window.addEventListener('dragover', (e) => {
  e.preventDefault();
});

window.addEventListener('drop', (e) => {
  e.preventDefault();
  if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0]) {
    handleCustomModelFile(e.dataTransfer.files[0]);
  }
});

function handleCustomModelFile(file) {
  const reader = new FileReader();
  reader.onload = (evt) => {
    const arrayBuffer = evt.target.result;
    import('./champion.js').then(({ gltfLoader }) => {
      gltfLoader.parse(arrayBuffer, '', (gltf) => {
        player.loadCustomModel(gltf);
        if (avatarIcon) avatarIcon.textContent = '⭐';
        vfx.spawnDamageNumber('ĐÃ NẠP MODEL 3D TỪ SKETCHFAB!', player.mesh.position, 'crit');
        sounds.playKill();
      }, (err) => {
        alert('Lỗi nạp file 3D: ' + err.message);
      });
    });
  };
  reader.readAsArrayBuffer(file);
}

// Skill Customizer Modal
const skillModal = document.getElementById('skill-modal');
const btnOpenCustomizer = document.getElementById('btn-open-customizer');
const btnCloseModal = document.getElementById('btn-close-modal');
const btnConfirmSkills = document.getElementById('btn-confirm-skills');
const skillsGrid = document.getElementById('skills-grid');
const filterBtns = document.querySelectorAll('.filter-btn');
const loadoutSlots = document.querySelectorAll('.loadout-slot');

let selectedSlot = 'Q';
let currentFilter = 'ALL';

btnOpenCustomizer.addEventListener('click', () => {
  skillModal.classList.remove('hidden');
  renderSkillsGrid();
  renderLoadoutBar();
});

btnCloseModal.addEventListener('click', () => {
  skillModal.classList.add('hidden');
});

btnConfirmSkills.addEventListener('click', () => {
  skillModal.classList.add('hidden');
  updateHudSkills();
});

loadoutSlots.forEach(slotEl => {
  slotEl.addEventListener('click', () => {
    loadoutSlots.forEach(s => s.classList.remove('active'));
    slotEl.classList.add('active');
    selectedSlot = slotEl.dataset.slot;
    renderSkillsGrid();
  });
});

filterBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    filterBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentFilter = btn.dataset.filter;
    renderSkillsGrid();
  });
});

function renderLoadoutBar() {
  ['Q', 'W', 'E', 'R'].forEach(slot => {
    const skill = skills.getSkill(slot);
    const previewEl = document.getElementById(`slot-preview-${slot}`);
    if (skill && previewEl) {
      const iconEl = previewEl.querySelector('.slot-icon');
      if (iconEl) {
        if (skill.iconImg) {
          iconEl.innerHTML = `<img src="${skill.iconImg}" style="width:100%;height:100%;border-radius:4px;object-fit:cover;" alt="${skill.name}" />`;
        } else {
          iconEl.textContent = skill.icon || '⚡';
        }
      }
      previewEl.querySelector('.slot-name').textContent = skill.name;
    }
  });
}

function renderSkillsGrid() {
  skillsGrid.innerHTML = '';
  const list = currentFilter === 'ALL' ? getAllSkills() : (SKILL_CATALOG[currentFilter] || []);

  list.forEach(skill => {
    const isUlt = skill.type === 'ultimate';
    const isSlotUlt = selectedSlot === 'R';
    const isMatch = isSlotUlt ? isUlt : !isUlt;

    const card = document.createElement('div');
    card.className = `skill-card ${isUlt ? 'is-ultimate' : ''} ${!isMatch ? 'opacity-50' : ''}`;

    const iconHtml = skill.iconImg 
      ? `<img src="${skill.iconImg}" class="card-skill-thumb" alt="${skill.name}" />`
      : `<span class="card-icon">${skill.icon || '⚡'}</span>`;

    const heroIconHtml = skill.heroIcon 
      ? `<img src="${skill.heroIcon}" class="card-hero-thumb" alt="${skill.heroKey || ''}" />`
      : '';

    card.innerHTML = `
      <div class="card-header">
        <div class="card-title-group">
          ${iconHtml}
          <div>
            <div class="card-title">${skill.name}</div>
            <div class="card-hero ${isUlt ? 'ult' : ''}">
              ${heroIconHtml}
              <span>${skill.hero} ${isUlt ? '⭐ (CHIÊU CUỐI)' : ''}</span>
            </div>
          </div>
        </div>
      </div>
      <div class="card-desc">${skill.desc || ''}</div>
      <div class="card-stats">
        <span>Hồi chiêu: <b>${skill.cd}s</b></span>
        <span>Tiêu hao: <b>${skill.mana} Mana</b></span>
        ${skill.range ? `<span>Tầm: <b>${skill.range}</b></span>` : ''}
      </div>
    `;

    card.addEventListener('click', () => {
      if (selectedSlot === 'R' && !isUlt) {
        alert('Ô R chỉ dành cho Chiêu Cuối (Ultimate)!');
        return;
      }
      if (selectedSlot !== 'R' && isUlt) {
        alert('Chiêu cuối (Ultimate) chỉ có thể gán vào ô phím R!');
        return;
      }

      skills.setSkill(selectedSlot, skill.id);
      renderLoadoutBar();
      updateHudSkills();

      if (selectedSlot === 'Q') selectedSlot = 'W';
      else if (selectedSlot === 'W') selectedSlot = 'E';
      else if (selectedSlot === 'E') selectedSlot = 'R';

      loadoutSlots.forEach(s => {
        if (s.dataset.slot === selectedSlot) s.classList.add('active');
        else s.classList.remove('active');
      });
      renderSkillsGrid();
    });

    skillsGrid.appendChild(card);
  });
}

// 8. GAME LOOP
const clock = new THREE.Clock();
let goldTimer = 0;

function animate() {
  requestAnimationFrame(animate);

  const delta = Math.min(clock.getDelta(), 0.1);
  const time = clock.getElapsedTime();

  // ARAM: cập nhật đồng hồ trận đấu
  aramMatch.tick(delta);
  if (elMatchTimer) elMatchTimer.textContent = aramMatch.formatTime();

  // ARAM: kiểm tra Bệ Đá Cổ (chỉ mua đồ khi đứng trong vùng căn cứ)
  updateFountainUi(isAtFountain(player.mesh.position));

  // Thanh XP + cấp độ: cập nhật MỖI FRAME vì XP tăng liên tục
  const hudLvlEl = document.getElementById('hud-level');
  if (hudLvlEl) hudLvlEl.textContent = player.level || 1;

  const xpFillEl = document.getElementById('lol-xp-fill');
  if (xpFillEl) {
    let pct = 100;
    if (player.level < 18) {
      const floorXp = LEVEL_XP_THRESHOLDS[player.level - 1] || 0;
      const ceilXp = LEVEL_XP_THRESHOLDS[player.level] || 1;
      pct = ((player.xp - floorXp) / (ceilXp - floorXp)) * 100;
    }
    xpFillEl.style.width = `${Math.max(0, Math.min(100, pct))}%`;
  }

  // Tự ẩn cảnh báo Bệ Đá Cổ sau thời gian
  if (fountainWarningTimer > 0) {
    fountainWarningTimer -= delta;
    if (fountainWarningTimer <= 0 && elFountainWarning) {
      elFountainWarning.classList.add('hidden');
    }
  }

  // Cập nhật điểm số 2 đội trên thanh scoreboard
  if (elScoreBlue) elScoreBlue.textContent = aramMatch.playerKills;
  if (elScoreRed) elScoreRed.textContent = aramMatch.playerDeaths;

  // Passive Gold — ARAM tăng vàng thụ động nhanh hơn SR (lấy từ aram_rules.js)
  goldTimer += delta;
  if (goldTimer >= 1.0) {
    goldTimer = 0;
    player.gold += ARAM_ECONOMY.passiveGoldPerSecond;
    // ARAM cũng tăng XP thụ động đều đặn cho cả đội
    player.gainXp(ARAM_ECONOMY.xpPerSecond);
    document.getElementById('hud-gold').textContent = Math.floor(player.gold);
    document.getElementById('shop-user-gold').textContent = Math.floor(player.gold);
  }

  // 1. Map Update
  map.update(delta, time);

  // 2. Player Update & Auto-Attack Combat
  player.update(delta, time);

  // Xử lý đòn đánh thường chuẩn tầm đánh LMHT
  if (!player.isDead) {
    if (player.autoAttackTarget) {
      if (player.autoAttackTarget.isDead || player.autoAttackTarget.isDestroyed) {
        player.autoAttackTarget = null;
      } else {
        const tPos = player.autoAttackTarget.mesh ? player.autoAttackTarget.mesh.position : player.autoAttackTarget.group.position;
        // Khoảng cách MẶT PHẲNG (bỏ trục Y). distanceTo() 3D cộng cả độ cao
        // của trụ/nhà chính khiến tầm đánh bị hụt so với LMHT thật.
        const distToTarget = Math.hypot(
          tPos.x - player.mesh.position.x,
          tPos.z - player.mesh.position.z
        );

        if (distToTarget > getEdgeRange(player, player.autoAttackTarget)) {
          // Chưa tới tầm đánh: Di chuyển lại gần mục tiêu
          player.moveTo(tPos);
        } else {
          // Đã vào tầm đánh chuẩn: Dừng di chuyển và tung đòn đánh thường
          player.targetPos = null;
          player.basicAttack(player.autoAttackTarget, vfx, sounds, playerProjectiles);
        }
      }
    } else if (!player.targetPos && player.attackCooldown <= 0) {
      // Khi đứng yên (không có lệnh di chuyển): Tự động tấn công mục tiêu lọt vào tầm đánh (LMHT Auto Attack)
      let nearestTarget = null;
      let nearestDist = Infinity;
      for (const enemy of getAllEnemies()) {
        if (!enemy.isDead && !enemy.isDestroyed) {
          const ePos = enemy.mesh ? enemy.mesh.position : enemy.group?.position;
          if (ePos) {
            // Cùng lý do: dùng khoảng cách mặt phẳng + tầm mép-tới-mép
            const d = Math.hypot(
              ePos.x - player.mesh.position.x,
              ePos.z - player.mesh.position.z
            );
            if (d <= getEdgeRange(player, enemy) && d < nearestDist) {
              nearestDist = d;
              nearestTarget = enemy;
            }
          }
        }
      }
      if (nearestTarget) {
        player.basicAttack(nearestTarget, vfx, sounds, playerProjectiles);
      }
    }
  }

  // Cập nhật đường bay của đạn đánh thường từ Tướng người chơi (Ashe, Jinx)
  for (let i = playerProjectiles.length - 1; i >= 0; i--) {
    const p = playerProjectiles[i];
    if (!p.targetRef || p.targetRef.isDead || p.targetRef.isDestroyed) {
      scene.remove(p.mesh);
      playerProjectiles.splice(i, 1);
      continue;
    }

    const targetPos = p.targetRef.mesh ? p.targetRef.mesh.position : p.targetRef.group.position;
    const toTarget = new THREE.Vector3().subVectors(targetPos.clone().add(new THREE.Vector3(0, 0.9, 0)), p.mesh.position);
    const dist = toTarget.length();

    if (dist < 0.9) {
      p.targetRef.takeDamage(p.damage, p.vfx);
      if (p.sounds) p.sounds.playHit();
      p.vfx.spawnIceExplosion(targetPos, p.isCrit ? 0xf59e0b : (p.color || 0x67e8f9), p.isCrit ? 14 : 10);
      if (p.isCrit) {
        p.vfx.spawnDamageNumber(`CHÍ MẠNG! -${p.damage}`, targetPos, 'crit');
      }
      if (p.lifesteal > 0 && player) {
        const healAmt = Math.round(p.damage * p.lifesteal);
        if (healAmt > 0) player.heal(healAmt, p.vfx);
      }
      scene.remove(p.mesh);
      playerProjectiles.splice(i, 1);
    } else {
      toTarget.normalize();
      p.mesh.position.addScaledVector(toTarget, p.speed * delta);
    }
  }

  // 3. Health Relic Pickup
  map.relics.forEach((relic) => {
    if (relic.available && !player.isDead) {
      const dist = new THREE.Vector2(player.mesh.position.x - relic.x, player.mesh.position.z - relic.z).length();
      if (dist < relic.radius) {
        relic.available = false;
        relic.orb.visible = false;
        relic.light.intensity = 0.2;
        relic.respawnTimer = 15.0;
        player.heal(350, vfx);
        sounds.playHeal();
      }
    }
  });

  // 4. Enemy Bots Update & Gold Reward (Tấn công theo tầm đánh chuẩn LMHT)
  enemyBots.forEach((bot) => {
    const wasDead = bot.isDead;
    bot.update(delta, time, vfx, [player, ...alliedMinions], sounds);
    if (!wasDead && bot.isDead) {
      // Player kill reward!
      aramMatch.playerKills += 1;
      aramMatch.enemyDeaths += 1;
      player.gold += ARAM_ECONOMY.killGold;
  // Hạ gục tướng địch thưởng XP lớn
  player.gainXp(120);
      vfx.spawnDamageNumber(`+${ARAM_ECONOMY.killGold} 🪙 HẠ GỤC!`, bot.mesh.position, 'crit');
      sounds.playKill();
      recalcPlayerStats();
      if (elMatchKda) {
        elMatchKda.textContent = `${aramMatch.playerKills} / ${aramMatch.playerDeaths}`;
      }
    }
  });

  // 5. Minion Wave Loop
  waveTimer += delta;
  if (waveTimer >= MATCH_RULES.minionWaveInterval) {
    waveTimer = 0;
    spawnMinionWave();
  }

  // 6. Minions Combat Loop
  for (let i = alliedMinions.length - 1; i >= 0; i--) {
    const m = alliedMinions[i];
    if (m.isDead) {
      alliedMinions.splice(i, 1);
      continue;
    }
    m.update(delta, enemyMinions, redStructures, enemyBots, vfx, sounds, minionProjectiles);
  }

  for (let i = enemyMinions.length - 1; i >= 0; i--) {
    const m = enemyMinions[i];
    if (m.isDead) {
      player.gold += ARAM_ECONOMY.minionGold;
      // ARAM chia XP toàn đội khi lính chết — không cần last-hit
      player.gainXp(ARAM_ECONOMY.xpPerMinion);
      vfx.spawnDamageNumber(`+${ARAM_ECONOMY.minionGold} 🪙`, m.mesh.position, 'normal');
      enemyMinions.splice(i, 1);
      recalcPlayerStats();
      continue;
    }
    m.update(delta, alliedMinions, blueStructures, [player], vfx, sounds, minionProjectiles);
  }

  // Update Minion Projectiles
  for (let i = minionProjectiles.length - 1; i >= 0; i--) {
    const p = minionProjectiles[i];
    if (!p.targetRef || p.targetRef.isDead || p.targetRef.isDestroyed) {
      scene.remove(p.mesh);
      minionProjectiles.splice(i, 1);
      continue;
    }

    // Kiểm tra xem đạn lính có bị Tường Gió (Yasuo Windwall) chặn hay không
    let blockedByWindwall = false;
    for (const wall of skills.windWalls) {
      if (p.mesh.position.distanceTo(wall.mesh.position) < 3.8) {
        blockedByWindwall = true;
        vfx.spawnIceExplosion(p.mesh.position, 0x38bdf8, 8);
        break;
      }
    }
    if (blockedByWindwall) {
      scene.remove(p.mesh);
      minionProjectiles.splice(i, 1);
      continue;
    }

    const targetPos = p.targetRef.mesh ? p.targetRef.mesh.position : p.targetRef.group.position;
    const toTarget = new THREE.Vector3().subVectors(targetPos.clone().add(new THREE.Vector3(0, 0.8, 0)), p.mesh.position);
    const dist = toTarget.length();

    if (dist < 0.8) {
      p.targetRef.takeDamage(p.damage, p.vfx);
      scene.remove(p.mesh);
      minionProjectiles.splice(i, 1);
    } else {
      toTarget.normalize();
      p.mesh.position.addScaledVector(toTarget, p.speed * delta);
    }
  }

  // 7. Structures Update
  // Hồi sinh Nhà Lính sau 60s (luật ARAM) — phải tick mỗi frame
  blueStructures.forEach(s => s.tickRespawn(delta));

  blueStructures.forEach(s => s.updateTurret(delta, time, enemyMinions, enemyBots, vfx, sounds));
  // Hồi sinh Nhà Lính phe đỏ sau 60s
  redStructures.forEach(s => s.tickRespawn(delta));

  redStructures.forEach(s => {
    const wasDestroyed = s.isDestroyed;
    s.updateTurret(delta, time, alliedMinions, [player], vfx, sounds);
    if (!wasDestroyed && s.isDestroyed) {
      aramMatch.turretsDestroyed += 1;
      player.gold += ARAM_ECONOMY.turretGold;
      vfx.spawnDamageNumber(`+${ARAM_ECONOMY.turretGold} 🪙 TRỤ SỤP ĐỔ!`, s.group.position, 'crit');
      sounds.playKill();
      recalcPlayerStats();

      // ARAM: phá Nhà Chính địch = THẮNG TRẬN
      if (s.type === 'nexus') {
        showMatchResult(true);
      }
    }
  });

  // ARAM: kiểm tra điều kiện thắng/thua dựa trên TRẠNG THÁI Nhà Chính.
  // (Không chỉ dựa vào "transition" vì Nhà Chính có thể bị phá bởi lính/AI hoặc
  //  bất kỳ nguồn sát thương nào ngoài vòng lặp này.)
  if (aramMatch.state === MATCH_STATE.RUNNING) {
    const redNexus = redStructures.find(s => s.type === 'nexus');
    const blueNexus = blueStructures.find(s => s.type === 'nexus');

    if (redNexus && redNexus.isDestroyed) {
      showMatchResult(true);   // Phá Nhà Chính Địch -> THẮNG
    } else if (blueNexus && blueNexus.isDestroyed) {
      showMatchResult(false);  // Nhà Chính Đồng Minh bị phá -> THUA
    }
  }

  // Dừng cập nhật chiến đấu khi trận đã kết thúc
  if (aramMatch.state !== MATCH_STATE.RUNNING) {
    vfx.update(delta, camera);
    camera.position.lerp(player.mesh.position.clone().add(cameraOffset), 1 - Math.exp(-10.0 * delta));
    camera.lookAt(player.mesh.position.x, 1.2, player.mesh.position.z - 1.5);
    composer.render();
    return;
  }

  // 8. Player Skills Update
  const currentEnemies = getAllEnemies();
  skills.update(delta, currentEnemies);

  // 9. VFX Update
  vfx.update(delta, camera);

  // 10. Smooth Camera Follow (Frame-Rate Independent)
  const targetCamPos = player.mesh.position.clone().add(cameraOffset);
  camera.position.lerp(targetCamPos, 1 - Math.exp(-10.0 * delta));
  camera.lookAt(player.mesh.position.x, 1.2, player.mesh.position.z - 1.5);

  // 11. HUD Update
  hudHpBar.style.width = `${Math.max(0, Math.min(100, (player.hp / player.maxHp) * 100))}%`;
  hudHpText.textContent = `${Math.round(player.hp)} / ${player.maxHp}`;
  if (player.partype === 'None') {
    hudMpBar.style.width = '0%';
    hudMpText.textContent = 'Không có Năng lượng';
  } else {
    hudMpBar.style.width = `${Math.max(0, Math.min(100, (player.mp / player.maxMp) * 100))}%`;
    hudMpText.textContent = `${Math.round(player.mp)} / ${player.maxMp}`;
    if (player.partype === 'Flow') {
      hudMpBar.style.background = 'linear-gradient(90deg, #38bdf8, #e2e8f0)';
    } else if (player.partype === 'Energy') {
      hudMpBar.style.background = 'linear-gradient(90deg, #d97706, #fbbf24)';
    } else {
      hudMpBar.style.background = 'linear-gradient(90deg, #0284c7, #38bdf8)';
    }
  }

  for (const k in skills.cooldowns) {
    const cd = skills.cooldowns[k];
    const overlay = cdOverlays[k];
    if (overlay) {
      if (cd > 0) {
        overlay.classList.add('active');
        overlay.textContent = cd.toFixed(1);
      } else {
        overlay.classList.remove('active');
        overlay.textContent = '';
      }
    }
  }

  if (skills.markedEnemy) {
    if (iconD && iconD.dataset.state !== 'dash') {
      iconD.dataset.state = 'dash';
      iconD.innerHTML = '<img src="/images/spells/snowball_dash.png" alt="Dash" />';
    }
    cdOverlays.D.classList.remove('active');
    cdOverlays.D.textContent = '';
  } else {
    if (iconD && iconD.dataset.state !== 'mark') {
      iconD.dataset.state = 'mark';
      iconD.innerHTML = '<img src="/images/spells/snowball.png" alt="Mark" />';
    }
  }

  // ===== MINIMAP: vẽ lại bản đồ thu nhỏ =====
  if (minimap) {
    minimap.render({
      player,
      blueStructures,
      redStructures,
      alliedMinions,
      enemyMinions,
      enemyBots
    });
  }

  composer.render();
}

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  composer.setSize(window.innerWidth, window.innerHeight);
});

window.addEventListener('wheel', (e) => {
  const zoomFactor = e.deltaY > 0 ? 1.08 : 0.92;
  const newY = cameraOffset.y * zoomFactor;
  const newZ = cameraOffset.z * zoomFactor;
  if (newY >= 14 && newY <= 45) {
    cameraOffset.y = newY;
    cameraOffset.z = newZ;
  }
});

animate();
