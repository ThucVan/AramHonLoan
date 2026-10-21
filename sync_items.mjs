import fs from 'fs';
import path from 'path';

const CD_BASE = 'https://raw.communitydragon.org/latest';

function resolveIconUrl(assetPath) {
  if (!assetPath) return null;
  let clean = assetPath.replace('/lol-game-data/assets/', '').toLowerCase();
  return `${CD_BASE}/plugins/rcp-be-lol-game-data/global/default/${clean}`;
}

function cleanDescription(html) {
  if (!html) return '';
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/?[^>]+(>|$)/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

async function downloadFile(url, destPath) {
  try {
    const res = await fetch(url);
    if (res.ok) {
      const buf = Buffer.from(await res.arrayBuffer());
      fs.mkdirSync(path.dirname(destPath), { recursive: true });
      fs.writeFileSync(destPath, buf);
      return true;
    }
  } catch (e) {
    console.error('Download error:', url, e.message);
  }
  return false;
}

// Danh sách các trang bị tiêu biểu nhất của LMHT cần đưa vào Shop ARAM
const SELECTED_ITEM_IDS = [
  // 1. AD (Vật lý)
  { id: 3031, cat: 'AD', stats: { ad: 80, crit: 0.25 } }, // Vô Cực Kiếm
  { id: 3072, cat: 'AD', stats: { ad: 80, lifesteal: 0.18 } }, // Huyết Kiếm
  { id: 3078, cat: 'AD', stats: { ad: 45, hp: 300, speed: 1.5, crit: 0.1 } }, // Tam Hợp Kiếm
  { id: 3071, cat: 'AD', stats: { ad: 55, hp: 400, speed: 1.2 } }, // Rìu Đen
  { id: 3153, cat: 'AD', stats: { ad: 50, lifesteal: 0.10, speed: 1.0 } }, // Gươm Suy Vong
  { id: 3046, cat: 'AD', stats: { ad: 40, speed: 2.2, crit: 0.25 } }, // Ma Vũ Song Kiếm
  { id: 3036, cat: 'AD', stats: { ad: 45, crit: 0.25 } }, // Nỏ Thần Dominik
  { id: 3074, cat: 'AD', stats: { ad: 70, lifesteal: 0.12 } }, // Rìu Mãng Xà

  // 2. AP (Phép thuật)
  { id: 3089, cat: 'AP', stats: { ap: 130 } }, // Mũ Phù Thủy Rabadon
  { id: 3157, cat: 'AP', stats: { ap: 105, armor: 45 } }, // Đồng Hồ Cát Zhonya
  { id: 3116, cat: 'AP', stats: { ap: 75, hp: 400 } }, // Trượng Pha Lê Rylai
  { id: 3003, cat: 'AP', stats: { ap: 80, mana: 500 } }, // Quyền Trượng Đại Thiên Sứ
  { id: 3135, cat: 'AP', stats: { ap: 70 } }, // Trượng Hư Vô
  { id: 6653, cat: 'AP', stats: { ap: 90, mana: 600 } }, // Mặt Nạ Đọa Đày Liandry / Luden

  // 3. TANK (Phòng thủ)
  { id: 3075, cat: 'TANK', stats: { armor: 70, hp: 350 } }, // Giáp Gai
  { id: 3143, cat: 'TANK', stats: { armor: 65, hp: 400 } }, // Khiên Băng Randuin
  { id: 3065, cat: 'TANK', stats: { hp: 450, armor: 30 } }, // Giáp Tâm Linh
  { id: 3742, cat: 'TANK', stats: { hp: 300, armor: 45, speed: 2.0 } }, // Giáp Liệt Sĩ
  { id: 3068, cat: 'TANK', stats: { hp: 500, armor: 50 } }, // Áo Choàng Lửa

  // 4. BOOTS (Giày)
  { id: 3006, cat: 'BOOTS', stats: { speed: 3.5, ad: 15 } }, // Giày Cuồng Nộ
  { id: 3020, cat: 'BOOTS', stats: { speed: 3.5, ap: 25 } }, // Giày Pháp Sư
  { id: 3047, cat: 'BOOTS', stats: { speed: 3.5, armor: 25 } }, // Giày Thép Gai
  { id: 3111, cat: 'BOOTS', stats: { speed: 3.5, hp: 150 } }, // Giày Thủy Ngân

  // 5. CONSUMABLE (Dược phẩm)
  { id: 2003, cat: 'CONSUMABLE', stats: { hpRestore: 350 } }, // Bình Máu
  { id: 2140, cat: 'CONSUMABLE', stats: { ad: 30, lifesteal: 0.12 } }, // Dược Phẩm Phẫn Nộ
  { id: 2139, cat: 'CONSUMABLE', stats: { ap: 50, mana: 200 } }, // Dược Phẩm Thuật Sĩ
  { id: 2138, cat: 'CONSUMABLE', stats: { hp: 300 } } // Dược Phẩm Cứng Cáp
];

async function run() {
  console.log('🚀 Đang tải dữ liệu và icons trang bị từ CommunityDragon...');
  fs.mkdirSync('public/images/items', { recursive: true });

  const res = await fetch(`${CD_BASE}/plugins/rcp-be-lol-game-data/global/vi_vn/v1/items.json`);
  const allItems = await res.json();
  const itemsMap = new Map();
  allItems.forEach(it => itemsMap.set(it.id, it));

  const itemsCatalog = [];

  for (const itemDef of SELECTED_ITEM_IDS) {
    const raw = itemsMap.get(itemDef.id);
    if (!raw) {
      console.warn(`Không tìm thấy item id: ${itemDef.id}`);
      continue;
    }

    const iconUrl = resolveIconUrl(raw.iconPath);
    const localIcon = `public/images/items/${raw.id}.png`;
    const iconPublicPath = `/images/items/${raw.id}.png`;

    await downloadFile(iconUrl, localIcon);
    console.log(`✓ Đã tải icon: [${raw.id}] ${raw.name}`);

    itemsCatalog.push({
      id: `lol_item_${raw.id}`,
      lolId: raw.id,
      name: raw.name,
      category: itemDef.cat,
      cost: raw.priceTotal || 1000,
      iconImg: iconPublicPath,
      stats: itemDef.stats,
      desc: cleanDescription(raw.description) || cleanDescription(raw.active) || ''
    });
  }

  // Ghi vào src/items.js
  const fileContent = `// League of Legends Official Items Catalog (Được đồng bộ từ CommunityDragon)
export const ITEMS_CATALOG = ${JSON.stringify(itemsCatalog, null, 2)};
`;

  fs.writeFileSync('src/items.js', fileContent, 'utf8');
  console.log('✓ Đã cập nhật src/items.js thành công!');
}

run();
