import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const AUGMENT_ICONS_DIR = path.join(__dirname, 'public', 'images', 'augments');
if (!fs.existsSync(AUGMENT_ICONS_DIR)) {
  fs.mkdirSync(AUGMENT_ICONS_DIR, { recursive: true });
}

async function downloadFile(url, destPath) {
  try {
    const res = await fetch(url);
    if (!res.ok) return false;
    const arrayBuffer = await res.arrayBuffer();
    fs.writeFileSync(destPath, Buffer.from(arrayBuffer));
    return true;
  } catch (err) {
    return false;
  }
}

function cleanHtml(str) {
  if (!str) return '';
  return str
    .replace(/<br\s*[\/]?>/gi, ' ')
    .replace(/<[^>]+>/g, '')
    .replace(/@[^@]+@/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

async function syncMayhem() {
  console.log('--- SYNCING ARAM MAYHEM AUGMENTS FROM COMMUNITYDRAGON ---');

  const [cherryRes, arenaVnRes, arenaEnRes] = await Promise.all([
    fetch('https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/vi_vn/v1/cherry-augments.json').then(r => r.json()),
    fetch('https://raw.communitydragon.org/latest/cdragon/arena/vi_vn.json').then(r => r.json()),
    fetch('https://raw.communitydragon.org/latest/cdragon/arena/en_us.json').then(r => r.json())
  ]);

  // Build lookup maps from Arena data
  const arenaMap = {};
  for (const k in arenaVnRes.augments || {}) {
    const a = arenaVnRes.augments[k];
    arenaMap[a.id] = a;
    if (a.apiName) arenaMap[a.apiName.toLowerCase()] = a;
    if (a.name) arenaMap[a.name.toLowerCase()] = a;
  }

  const arenaEnMap = {};
  for (const k in arenaEnRes.augments || {}) {
    const a = arenaEnRes.augments[k];
    arenaEnMap[a.id] = a;
    if (a.apiName) arenaEnMap[a.apiName.toLowerCase()] = a;
  }

  // Filter ARAM Mayhem Augments (those with ARAM_ prefix or iconic Cherry augments)
  const aramList = cherryRes.filter(a => a.augmentNameId && a.augmentNameId.startsWith('ARAM_'));
  console.log(`Found ${aramList.length} ARAM Mayhem Augments.`);

  const augmentsData = [];

  for (let i = 0; i < aramList.length; i++) {
    const item = aramList[i];
    const code = item.augmentNameId.replace('ARAM_', '');
    const cleanCode = code.toLowerCase();

    // Map description from Arena VN or EN
    const arenaInfo = arenaMap[item.id] || arenaMap[cleanCode] || arenaMap[item.nameTRA?.toLowerCase()] || arenaEnMap[item.id] || arenaEnMap[cleanCode] || {};
    
    let desc = cleanHtml(arenaInfo.desc || arenaInfo.tooltip || '');
    if (!desc) {
      if (item.rarity === 'kPrismatic') desc = 'Lõi Nâng Cấp Kim Cương: Cung cấp sức mạnh đột biến đặc biệt cho tướng.';
      else if (item.rarity === 'kGold') desc = 'Lõi Nâng Cấp Vàng: Cường hóa đáng kể chỉ số và cơ chế chiến đấu.';
      else desc = 'Lõi Nâng Cấp Bạc: Tăng cường các chỉ số cơ bản hữu ích trong giao tranh.';
    }

    // Determine rarity
    let rarity = 'SILVER';
    if (item.rarity === 'kPrismatic') rarity = 'PRISMATIC';
    else if (item.rarity === 'kGold') rarity = 'GOLD';

    // Download icon
    let iconFilename = `${cleanCode}.png`;
    const localIconPath = path.join(AUGMENT_ICONS_DIR, iconFilename);

    let iconUrl = '';
    if (item.augmentSmallIconPath) {
      const cleanPath = item.augmentSmallIconPath.replace('/lol-game-data/assets/', '').toLowerCase();
      iconUrl = `https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/${cleanPath}`;
    }

    let hasLocalIcon = fs.existsSync(localIconPath);
    if (!hasLocalIcon && iconUrl) {
      hasLocalIcon = await downloadFile(iconUrl, localIconPath);
    }

    // Fallback to nestable icons path if not found
    if (!hasLocalIcon) {
      const nestableUrl = `https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/assets/nestable/global/augments/icons/${cleanCode}_small.png`;
      hasLocalIcon = await downloadFile(nestableUrl, localIconPath);
    }

    const publicIconImg = hasLocalIcon ? `/images/augments/${iconFilename}` : '/images/spells/snowball.png';

    // Define gameplay stat modifiers based on augment code & name
    const stats = {};
    const n = (item.nameTRA + ' ' + code + ' ' + desc).toLowerCase();

    if (n.includes('vũ lực') || n.includes('bluntforce')) { stats.adPercent = 0.25; }
    else if (n.includes('đại pháp sư') || n.includes('archmage')) { stats.apPercent = 0.35; }
    else if (n.includes('thích ứng') || n.includes('adapt')) { stats.adaptRatio = 0.25; }
    else if (n.includes('đơn giản hóa') || n.includes('backtobasics')) { stats.rawDamageBonus = 0.35; stats.hp = 350; }
    else if (n.includes('siêu trí tuệ') || n.includes('bigbrain')) { stats.shieldOnCast = 250; }
    else if (n.includes('điệu van tử thần') || n.includes('bladewaltz')) { stats.ad = 45; stats.crit = 0.2; stats.slashWave = true; }
    else if (n.includes('bánh mỳ & bơ') || n.includes('breadandbutter')) { stats.cdrQ = 0.5; }
    else if (n.includes('bánh mỳ & mứt') || n.includes('breadandjam')) { stats.cdrW = 0.5; }
    else if (n.includes('bánh mỳ & phô-mai') || n.includes('breadandcheese')) { stats.cdrE = 0.5; }
    else if (n.includes('cơ thể thượng nhân') || n.includes('celestialbody')) { stats.hp = 800; stats.scaleModel = 1.3; }
    else if (n.includes('sao mà chạm được') || n.includes('canttouchthis')) { stats.speed = 3.5; stats.invisOnR = true; }
    else if (n.includes('nhà phát minh') || n.includes('apexinventor')) { stats.cdrAll = 0.25; }
    else if (n.includes('tàn bạo') || n.includes('brutal')) { stats.ad = 35; stats.lifesteal = 0.12; }
    else if (n.includes('khổng lồ') || n.includes('goliath')) { stats.hp = 700; stats.ad = 30; stats.ap = 45; stats.scaleModel = 1.4; }
    else if (n.includes('vampirism') || n.includes('hút máu')) { stats.lifesteal = 0.18; }
    else {
      // Default stat benefits according to rarity
      if (rarity === 'PRISMATIC') {
        stats.ad = 40;
        stats.ap = 65;
        stats.hp = 400;
        stats.speed = 1.5;
      } else if (rarity === 'GOLD') {
        stats.ad = 25;
        stats.ap = 45;
        stats.hp = 250;
        stats.crit = 0.15;
      } else {
        stats.ad = 15;
        stats.ap = 25;
        stats.hp = 150;
      }
    }

    augmentsData.push({
      id: item.id,
      code,
      name: item.nameTRA || code,
      rarity,
      desc,
      iconImg: publicIconImg,
      stats
    });

    if ((i + 1) % 25 === 0 || i === aramList.length - 1) {
      console.log(`Processed ${i + 1}/${aramList.length} augments...`);
    }
  }

  const jsContent = `// League of Legends ARAM Mayhem Augments (Được đồng bộ từ CommunityDragon)
export const ARAM_MAYHEM_AUGMENTS = ${JSON.stringify(augmentsData, null, 2)};

export function getRandomMayhemAugments(count = 3, excludeIds = []) {
  const available = ARAM_MAYHEM_AUGMENTS.filter(a => !excludeIds.includes(a.id));
  const shuffled = [...available].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

export function getAugmentById(id) {
  return ARAM_MAYHEM_AUGMENTS.find(a => a.id === id || a.code === id);
}
`;

  fs.writeFileSync(path.join(__dirname, 'src', 'augments.js'), jsContent, 'utf-8');
  console.log(`SUCCESS! Saved ${augmentsData.length} ARAM Mayhem augments to src/augments.js!`);
}

syncMayhem().catch(console.error);
