import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { HowlingAbyssMap } from './map.js';
import { VFXSystem } from './vfx.js';
import { PlayerChampion, EnemyBot, Structure, Minion } from './champion.js';
import { SkillSystem } from './skills.js';
import { sounds } from './audio.js';
import { SKILL_CATALOG, getAllSkills } from './skill_catalog.js';
import { ITEMS_CATALOG, getItemById } from './items.js';

// 1. Scene, Camera, Renderer Setup
const container = document.getElementById('canvas-container');
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x1a1518);
scene.fog = new THREE.FogExp2(0x271f24, 0.008);

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

// 2. Lighting (Adversator Sunset Atmosphere)
const ambientLight = new THREE.AmbientLight(0x64748b, 1.4);
scene.add(ambientLight);

const sunLight = new THREE.DirectionalLight(0xfff2d6, 2.5);
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

// MINIONS SYSTEM
let alliedMinions = [];
let enemyMinions = [];
let minionProjectiles = [];
let waveTimer = 0;

function spawnMinionWave(initial = false) {
  const redInhibitorDestroyed = redStructures[3].isDestroyed;
  const blueInhibitorDestroyed = blueStructures[3].isDestroyed;

  const blueSpawnZ = initial ? 20 : 85;
  const redSpawnZ = initial ? -20 : -85;

  // Blue Wave
  for (let i = -1; i <= 1; i++) {
    alliedMinions.push(new Minion(scene, true, 'melee', i * 2.2, blueSpawnZ));
  }
  for (let i = -1; i <= 1; i++) {
    alliedMinions.push(new Minion(scene, true, 'caster', i * 2.2, blueSpawnZ + 4));
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

window.addEventListener('mousemove', (e) => {
  updateMouseGround(e);
  if (skills.activeAimSkill) {
    skills.showAim(skills.activeAimSkill, mouseWorldPos);
  }
});

let isPointerDragging = false;

window.addEventListener('pointerdown', (e) => {
  // If clicking on UI (HUD, modals, buttons), ignore game ground move
  if (e.target && e.target.closest && (e.target.closest('.moba-hud') || e.target.closest('.skill-modal-content') || e.target.closest('.shop-modal-content') || e.target.closest('.top-header'))) {
    return;
  }

  // Right-click OR Left-click (when not aiming a skillshot)
  if (e.button === 2 || (e.button === 0 && !skills.activeAimSkill)) {
    isPointerDragging = true;
    sounds.ensureContext();
    updateMouseGround(e);
    player.moveTo(mouseWorldPos);
    vfx.spawnClickMarker(mouseWorldPos.x, mouseWorldPos.z);
    sounds.playMove();
  }
});

window.addEventListener('pointermove', (e) => {
  if (isPointerDragging) {
    updateMouseGround(e);
    player.moveTo(mouseWorldPos);
  }
});

window.addEventListener('pointerup', () => {
  isPointerDragging = false;
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
  } else if (e.code === 'Space') {
    camera.position.copy(player.mesh.position).add(cameraOffset);
  }
});

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
  skills.cast(slot, mouseWorldPos, enemies);
}

// 5. STATS & INVENTORY SYSTEM
function recalcPlayerStats() {
  let addAd = 0;
  let addAp = 0;
  let addArmor = 0;
  let addSpeed = 0;
  let addLifesteal = 0;
  let addHp = 0;
  let addMp = 0;

  player.inventory.forEach(item => {
    if (item.stats.ad) addAd += item.stats.ad;
    if (item.stats.ap) addAp += item.stats.ap;
    if (item.stats.armor) addArmor += item.stats.armor;
    if (item.stats.speed) addSpeed += item.stats.speed;
    if (item.stats.lifesteal) addLifesteal += item.stats.lifesteal;
    if (item.stats.hp) addHp += item.stats.hp;
    if (item.stats.mana) addMp += item.stats.mana;
  });

  player.ad = player.baseAd + addAd;
  player.ap = player.baseAp + addAp;
  player.armor = player.baseArmor + addArmor;
  player.speed = player.baseSpeed + addSpeed;
  player.lifesteal = player.baseLifesteal + addLifesteal;
  player.maxHp = player.baseMaxHp + addHp;
  player.maxMp = player.baseMaxMp + addMp;

  // Update Stats UI
  document.getElementById('stat-ad').textContent = player.ad;
  document.getElementById('stat-armor').textContent = player.armor;
  document.getElementById('stat-ap').textContent = player.ap;
  document.getElementById('stat-spd').textContent = player.speed.toFixed(1);
  document.getElementById('stat-lifesteal').textContent = `${Math.round(player.lifesteal * 100)}%`;

  // Update 6 Inventory Slots UI
  for (let i = 0; i < 6; i++) {
    const slotEl = document.querySelector(`.inv-slot[data-slot="${i}"] .inv-inner`);
    if (slotEl) {
      if (player.inventory[i]) {
        const it = player.inventory[i];
        slotEl.style.backgroundImage = "url('/items.jpg')";
        slotEl.style.backgroundSize = '900% 400%';
        slotEl.style.backgroundPosition = `${(it.iconCol * 100) / 8}% ${(it.iconRow * 100) / 3}%`;
        slotEl.parentElement.title = `${it.name} (Click để mở shop bán lại)`;
      } else {
        slotEl.style.backgroundImage = 'none';
        slotEl.parentElement.title = `Ô ${i + 1} trống`;
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
document.querySelectorAll('.inv-slot').forEach(slotEl => {
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
        <div class="card-thumb" style="background-image: url('/items.jpg'); background-size: 900% 400%; background-position: ${(it.iconCol * 100) / 8}% ${(it.iconRow * 100) / 3}%;"></div>
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

  detailIcon.style.backgroundImage = "url('/items.jpg')";
  detailIcon.style.backgroundSize = '900% 400%';
  detailIcon.style.backgroundPosition = `${(it.iconCol * 100) / 8}% ${(it.iconRow * 100) / 3}%`;

  // Stats text
  const statParts = [];
  if (it.stats.ad) statParts.push(`+ ${it.stats.ad} Sát thương Vật Lý`);
  if (it.stats.ap) statParts.push(`+ ${it.stats.ap} Sức mạnh Phép Thuật`);
  if (it.stats.armor) statParts.push(`+ ${it.stats.armor} Giáp Vật Lý`);
  if (it.stats.hp) statParts.push(`+ ${it.stats.hp} Máu Tối Đa`);
  if (it.stats.mana) statParts.push(`+ ${it.stats.mana} Mana Tối Đa`);
  if (it.stats.speed) statParts.push(`+ ${it.stats.speed} Tốc Độ Chạy`);
  if (it.stats.lifesteal) statParts.push(`+ ${Math.round(it.stats.lifesteal * 100)}% Hút Máu`);

  detailStats.innerHTML = statParts.length > 0 ? statParts.join('<br>') : 'Không có chỉ số vĩnh viễn (Vật phẩm tiêu hao).';
  detailDesc.textContent = it.desc;

  // Buy button state
  const canAfford = player.gold >= it.cost;
  const hasSpace = it.category === 'CONSUMABLE' || player.inventory.length < 6;

  if (canAfford && hasSpace) {
    btnBuy.classList.remove('disabled');
  } else {
    btnBuy.classList.add('disabled');
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

btnBuy.addEventListener('click', () => {
  if (!selectedShopItem) return;
  if (player.gold < selectedShopItem.cost) return;

  if (selectedShopItem.category === 'CONSUMABLE') {
    player.gold -= selectedShopItem.cost;
    if (selectedShopItem.id === 'health_potion') {
      player.heal(350, vfx);
    } else if (selectedShopItem.id === 'mana_potion') {
      player.mp = Math.min(player.maxMp, player.mp + 250);
      vfx.spawnDamageNumber('+250 MP', player.mesh.position, 'heal');
    }
    sounds.playHeal();
  } else {
    if (player.inventory.length >= 6) {
      alert('Túi đồ đã đầy (tối đa 6 ô trang bị)!');
      return;
    }
    player.gold -= selectedShopItem.cost;
    player.inventory.push(selectedShopItem);
    sounds.playHeal();
  }

  recalcPlayerStats();
  selectShopItem(selectedShopItem, selectedInventoryIndex);
});

btnSell.addEventListener('click', () => {
  if (!selectedShopItem) return;
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
      const iconEl = slotEl.querySelector('.skill-icon');
      const manaEl = slotEl.querySelector('.skill-mana');
      if (iconEl) iconEl.textContent = skill.icon;
      if (manaEl) manaEl.textContent = skill.mana;
      slotEl.title = `${slot}: ${skill.name} (${skill.hero})`;
    }
  });
}
updateHudSkills();

// Champion 3D Model Switcher
const btnSwitchHero = document.getElementById('btn-switch-hero');
const avatarIcon = document.getElementById('avatar-icon');
const availableHeroes = [
  { type: 'yasuo', name: 'Yasuo (Kẻ Bất Dung Thứ - LMHT)', icon: '🌪️' },
  { type: 'jinx', name: 'Jinx (Khẩu Pháo Nổi Loạn - LMHT)', icon: '🚀' },
  { type: 'zed', name: 'Zed (Chúa Tể Bóng Tối - LMHT)', icon: '🗡️' },
  { type: 'ashe', name: 'Ashe (Cung Băng Freljord - LMHT)', icon: '🏹' },
  { type: 'darius', name: 'Darius (Đại Tướng Noxus - LMHT)', icon: '🪓' }
];
let currentHeroIndex = 0;

if (btnSwitchHero) {
  btnSwitchHero.addEventListener('click', () => {
    currentHeroIndex = (currentHeroIndex + 1) % availableHeroes.length;
    const hero = availableHeroes[currentHeroIndex];
    player.switchModel(hero.type);
    if (avatarIcon) avatarIcon.textContent = hero.icon;
    btnSwitchHero.title = `Đang chọn: ${hero.name}. Click để đổi tiếp.`;
    sounds.playMove();
  });
}

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
      previewEl.querySelector('.slot-icon').textContent = skill.icon;
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

    card.innerHTML = `
      <div class="card-header">
        <div class="card-title-group">
          <span class="card-icon">${skill.icon}</span>
          <div>
            <div class="card-title">${skill.name}</div>
            <div class="card-hero ${isUlt ? 'ult' : ''}">${skill.hero} ${isUlt ? '⭐ (CHIÊU CUỐI)' : ''}</div>
          </div>
        </div>
      </div>
      <div class="card-desc">${skill.desc}</div>
      <div class="card-stats">
        <span>Hồi chiêu: <b>${skill.cd}s</b></span>
        <span>Tiêu hao: <b>${skill.mana} Mana</b></span>
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

  // Passive Gold (+3 Gold every second)
  goldTimer += delta;
  if (goldTimer >= 1.0) {
    goldTimer = 0;
    player.gold += 3;
    document.getElementById('hud-gold').textContent = Math.floor(player.gold);
    document.getElementById('shop-user-gold').textContent = Math.floor(player.gold);
  }

  // 1. Map Update
  map.update(delta, time);

  // 2. Player Update
  player.update(delta, time);

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

  // 4. Enemy Bots Update & Gold Reward
  enemyBots.forEach((bot) => {
    const wasDead = bot.isDead;
    bot.update(delta, time, vfx);
    if (!wasDead && bot.isDead) {
      // Player kill reward!
      player.gold += 300;
      vfx.spawnDamageNumber('+300 🪙 FIRST BLOOD!', bot.mesh.position, 'crit');
      sounds.playKill();
      recalcPlayerStats();
    }
  });

  // 5. Minion Wave Loop
  waveTimer += delta;
  if (waveTimer >= 20.0) {
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
      player.gold += 25;
      vfx.spawnDamageNumber('+25 🪙', m.mesh.position, 'normal');
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
  blueStructures.forEach(s => s.updateTurret(delta, time, enemyMinions, enemyBots, vfx, sounds));
  redStructures.forEach(s => {
    const wasDestroyed = s.isDestroyed;
    s.updateTurret(delta, time, alliedMinions, [player], vfx, sounds);
    if (!wasDestroyed && s.isDestroyed) {
      player.gold += 150;
      vfx.spawnDamageNumber('+150 🪙 TRỤ SỤP ĐỔ!', s.group.position, 'crit');
      recalcPlayerStats();
    }
  });

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
  hudHpBar.style.width = `${(player.hp / player.maxHp) * 100}%`;
  hudHpText.textContent = `${Math.round(player.hp)} / ${player.maxHp}`;
  hudMpBar.style.width = `${(player.mp / player.maxMp) * 100}%`;
  hudMpText.textContent = `${Math.round(player.mp)} / ${player.maxMp}`;

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
    iconD.textContent = '⚡';
    cdOverlays.D.classList.remove('active');
    cdOverlays.D.textContent = '';
  } else {
    iconD.textContent = '⚪';
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
