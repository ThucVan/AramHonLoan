import fs from 'fs';
import path from 'path';

const CD_BASE = 'https://raw.communitydragon.org/latest';

const CHAMPIONS = [
  { id: 157, key: 'yasuo', group: 'FIGHTERS', heroType: 'yasuo' },
  { id: 222, key: 'jinx', group: 'MARKSMEN', heroType: 'jinx' },
  { id: 238, key: 'zed', group: 'ASSASSINS', heroType: 'zed' },
  { id: 22, key: 'ashe', group: 'MARKSMEN', heroType: 'ashe' },
  { id: 122, key: 'darius', group: 'FIGHTERS', heroType: 'darius' },
  { id: 81, key: 'ezreal', group: 'MARKSMEN', heroType: 'ezreal' },
  { id: 99, key: 'lux', group: 'MAGES', heroType: 'lux' },
  { id: 103, key: 'ahri', group: 'MAGES', heroType: 'ahri' },
  { id: 54, key: 'malphite', group: 'TANKS', heroType: 'malphite' },
  { id: 111, key: 'nautilus', group: 'TANKS', heroType: 'nautilus' },
  { id: 31, key: 'chogath', group: 'TANKS', heroType: 'chogath' },
  { id: 55, key: 'katarina', group: 'ASSASSINS', heroType: 'katarina' },
  { id: 84, key: 'akali', group: 'ASSASSINS', heroType: 'akali' },
  { id: 134, key: 'syndra', group: 'MAGES', heroType: 'syndra' }
];

// Helper: chuyển abilityIconPath của CommunityDragon sang full HTTP URL
function resolveIconUrl(assetPath) {
  if (!assetPath) return null;
  let clean = assetPath.replace('/lol-game-data/assets/', '').toLowerCase();
  return `${CD_BASE}/plugins/rcp-be-lol-game-data/global/default/${clean}`;
}

// Helper: làm sạch HTML tags trong description của League
function cleanDescription(html) {
  if (!html) return '';
  return html
    .replace(/<br\s*\/?>/gi, ' ')
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

async function run() {
  console.log('🚀 Bắt đầu đồng bộ Assets & Kỹ năng từ CommunityDragon...');

  fs.mkdirSync('public/images/champions', { recursive: true });
  fs.mkdirSync('public/images/skills', { recursive: true });
  fs.mkdirSync('public/images/spells', { recursive: true });

  // 1. Tải icon Summoner Spells (Cầu tuyết ARAM)
  console.log('\n--- Tải Summoner Spells (Cầu Tuyết ARAM) ---');
  const markIconUrl = `${CD_BASE}/plugins/rcp-be-lol-game-data/global/default/data/spells/icons2d/summoner_mark.png`;
  const dashIconUrl = `${CD_BASE}/plugins/rcp-be-lol-game-data/global/default/data/spells/icons2d/summoner_dash.png`;
  await downloadFile(markIconUrl, 'public/images/spells/snowball.png');
  await downloadFile(dashIconUrl, 'public/images/spells/snowball_dash.png');
  console.log('✓ Đã tải Snowball (Mark/Dash) icons');

  const catalogData = {
    MARKSMEN: [],
    ASSASSINS: [],
    MAGES: [],
    TANKS: [],
    FIGHTERS: []
  };

  const championProfiles = {};

  // 2. Tải dữ liệu từng tướng
  for (const champ of CHAMPIONS) {
    console.log(`\n--- Đồng bộ tướng: ${champ.key.toUpperCase()} (ID: ${champ.id}) ---`);
    const champUrl = `${CD_BASE}/plugins/rcp-be-lol-game-data/global/vi_vn/v1/champions/${champ.id}.json`;
    
    try {
      const res = await fetch(champUrl);
      if (!res.ok) {
        console.warn(`Không thể lấy dữ liệu ${champ.key}: status ${res.status}`);
        continue;
      }
      const data = await res.json();

      // Tải Champion Icon
      const iconUrl = `${CD_BASE}/plugins/rcp-be-lol-game-data/global/default/v1/champion-icons/${champ.id}.png`;
      const iconPath = `public/images/champions/${champ.key}.png`;
      await downloadFile(iconUrl, iconPath);
      console.log(`✓ Đã tải avatar tướng: ${data.name} (${iconPath})`);

      // Lưu profile tướng
      championProfiles[champ.key] = {
        id: champ.id,
        key: champ.key,
        name: data.name,
        title: data.title,
        avatarImg: `/images/champions/${champ.key}.png`,
        passive: {
          name: data.passive?.name,
          desc: cleanDescription(data.passive?.description)
        }
      };

      // Xử lý từng Spell (Q, W, E, R)
      const spells = data.spells || [];
      const spellKeys = ['Q', 'W', 'E', 'R'];

      for (let i = 0; i < spells.length; i++) {
        const spell = spells[i];
        const keyLetter = spellKeys[i] || 'Q';
        const isUlt = keyLetter === 'R';
        const skillId = `${champ.key}_${keyLetter.toLowerCase()}`;

        // Tải Spell Icon
        const spellIconUrl = resolveIconUrl(spell.abilityIconPath);
        const spellIconLocal = `public/images/skills/${skillId}.png`;
        let hasLocalIcon = false;
        if (spellIconUrl) {
          hasLocalIcon = await downloadFile(spellIconUrl, spellIconLocal);
        }

        const cd = (spell.cooldownCoefficients && spell.cooldownCoefficients[0]) || (isUlt ? 16 : 4);
        const mana = (spell.costCoefficients && spell.costCoefficients[0]) || 0;
        const range = (spell.range && spell.range[0]) || (isUlt ? 1400 : 600);

        const skillEntry = {
          id: skillId,
          name: spell.name,
          hero: `${data.name} (${data.title})`,
          heroKey: champ.key,
          heroIcon: `/images/champions/${champ.key}.png`,
          iconImg: hasLocalIcon ? `/images/skills/${skillId}.png` : spellIconUrl,
          iconFallback: isUlt ? '⚡' : '✨',
          type: isUlt ? 'ultimate' : 'basic',
          key: keyLetter,
          cd: Math.min(25, Math.max(1.0, Number(cd.toFixed(1)))),
          mana: Math.min(150, Math.max(0, mana)),
          range: range,
          desc: cleanDescription(spell.description) || cleanDescription(spell.shortDescription)
        };

        if (catalogData[champ.group]) {
          catalogData[champ.group].push(skillEntry);
        }
        console.log(`  + Kỹ năng [${keyLetter}]: ${spell.name} | CD: ${skillEntry.cd}s | Mana: ${skillEntry.mana}`);
      }
    } catch (e) {
      console.error(`Lỗi đồng bộ tướng ${champ.key}:`, e.message);
    }
  }

  // 3. Ghi file catalog mới `src/skill_catalog.js`
  console.log('\n--- Ghi file src/skill_catalog.js ---');
  const catalogFileContent = `// League of Legends Iconic Skills Catalog (Được đồng bộ từ CommunityDragon)
export const SKILL_CATALOG = ${JSON.stringify(catalogData, null, 2)};

export function getAllSkills() {
  const all = [];
  for (const group in SKILL_CATALOG) {
    all.push(...SKILL_CATALOG[group]);
  }
  return all;
}

export function getBasicSkills() {
  return getAllSkills().filter(s => s.type === 'basic');
}

export function getUltimateSkills() {
  return getAllSkills().filter(s => s.type === 'ultimate');
}
`;

  fs.writeFileSync('src/skill_catalog.js', catalogFileContent, 'utf8');
  console.log('✓ Đã cập nhật src/skill_catalog.js với dữ liệu chuẩn Riot Games từ CommunityDragon!');

  // 4. Lưu champion_profiles.json để main.js và champion.js sử dụng
  fs.writeFileSync('src/champion_profiles.json', JSON.stringify(championProfiles, null, 2), 'utf8');
  console.log('✓ Đã tạo src/champion_profiles.json!');
}

run();
