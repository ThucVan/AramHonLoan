// ============================================================================
// DATA DRAGON 14.5.1 CHAMPION STATS ENGINE (LEAGUE OF LEGENDS PATCH 14.5.1)
// Official URL: https://ddragon.leagueoflegends.com/cdn/14.5.1/data/en_US/champion.json
// ============================================================================

export const LOL_RANGE_SCALE = 20 / 775; // LMHT Turret (775) -> Game (20 units)
export const DDRAGON_14_5_1_URL = 'https://ddragon.leagueoflegends.com/cdn/14.5.1/data/en_US/champion.json';
export const LOCAL_CHAMPION_DATA_PATH = '/data/champion.json';

// In-memory cache of all champions from Data Dragon 14.5.1
let allChampionsData = null;
let isLoadingData = false;
const onDataLoadedCallbacks = [];

// Pre-bundled exact 14.5.1 stats for instant 0ms synchronous access
export const BUNDLED_CHAMPION_STATS_14_5_1 = {
  Yasuo: {
    id: 'Yasuo',
    name: 'Yasuo',
    title: 'Kẻ Bất Dung Thứ',
    partype: 'Flow',
    stats: {
      hp: 590,
      hpperlevel: 110,
      mp: 100,
      mpperlevel: 0,
      movespeed: 345,
      armor: 30,
      armorperlevel: 4.6,
      spellblock: 32,
      spellblockperlevel: 2.05,
      attackrange: 175,
      hpregen: 6.5,
      hpregenperlevel: 0.9,
      mpregen: 0,
      mpregenperlevel: 0,
      crit: 0,
      critperlevel: 0,
      attackdamage: 60,
      attackdamageperlevel: 3,
      attackspeedperlevel: 3.5,
      attackspeed: 0.697
    }
  },
  Jinx: {
    id: 'Jinx',
    name: 'Jinx',
    title: 'Khẩu Pháo Nổi Loạn',
    partype: 'Mana',
    stats: {
      hp: 630,
      hpperlevel: 105,
      mp: 260,
      mpperlevel: 50,
      movespeed: 325,
      armor: 26,
      armorperlevel: 4.7,
      spellblock: 30,
      spellblockperlevel: 1.3,
      attackrange: 525,
      hpregen: 3.75,
      hpregenperlevel: 0.5,
      mpregen: 6.7,
      mpregenperlevel: 1,
      crit: 0,
      critperlevel: 0,
      attackdamage: 59,
      attackdamageperlevel: 3.15,
      attackspeedperlevel: 1,
      attackspeed: 0.625
    }
  },
  Zed: {
    id: 'Zed',
    name: 'Zed',
    title: 'Chúa Tể Bóng Tối',
    partype: 'Energy',
    stats: {
      hp: 654,
      hpperlevel: 99,
      mp: 200,
      mpperlevel: 0,
      movespeed: 345,
      armor: 32,
      armorperlevel: 4.7,
      spellblock: 29,
      spellblockperlevel: 2.05,
      attackrange: 125,
      hpregen: 7,
      hpregenperlevel: 0.65,
      mpregen: 50,
      mpregenperlevel: 0,
      crit: 0,
      critperlevel: 0,
      attackdamage: 63,
      attackdamageperlevel: 3.4,
      attackspeedperlevel: 3.3,
      attackspeed: 0.651
    }
  },
  Ashe: {
    id: 'Ashe',
    name: 'Ashe',
    title: 'Cung Băng Freljord',
    partype: 'Mana',
    stats: {
      hp: 640,
      hpperlevel: 101,
      mp: 280,
      mpperlevel: 35,
      movespeed: 325,
      armor: 26,
      armorperlevel: 4.6,
      spellblock: 30,
      spellblockperlevel: 1.3,
      attackrange: 600,
      hpregen: 3.5,
      hpregenperlevel: 0.55,
      mpregen: 7,
      mpregenperlevel: 0.65,
      crit: 0,
      critperlevel: 0,
      attackdamage: 59,
      attackdamageperlevel: 2.95,
      attackspeedperlevel: 3.33,
      attackspeed: 0.658
    }
  },
  Darius: {
    id: 'Darius',
    name: 'Darius',
    title: 'Đại Tướng Noxus',
    partype: 'Mana',
    stats: {
      hp: 652,
      hpperlevel: 114,
      mp: 263,
      mpperlevel: 58,
      movespeed: 340,
      armor: 39,
      armorperlevel: 5.2,
      spellblock: 32,
      spellblockperlevel: 2.05,
      attackrange: 175,
      hpregen: 10,
      hpregenperlevel: 0.95,
      mpregen: 6.6,
      mpregenperlevel: 0.35,
      crit: 0,
      critperlevel: 0,
      attackdamage: 64,
      attackdamageperlevel: 5,
      attackspeedperlevel: 1,
      attackspeed: 0.625
    }
  },
  Ahri: {
    id: 'Ahri',
    name: 'Ahri',
    title: 'Hồ Ly Chín Đuôi',
    partype: 'Mana',
    stats: {
      hp: 590,
      hpperlevel: 104,
      mp: 418,
      mpperlevel: 25,
      movespeed: 330,
      armor: 21,
      armorperlevel: 4.7,
      spellblock: 30,
      spellblockperlevel: 1.3,
      attackrange: 550,
      hpregen: 2.5,
      hpregenperlevel: 0.6,
      mpregen: 8,
      mpregenperlevel: 0.8,
      crit: 0,
      critperlevel: 0,
      attackdamage: 53,
      attackdamageperlevel: 3,
      attackspeedperlevel: 2.2,
      attackspeed: 0.668
    }
  },
  Blitzcrank: {
    id: 'Blitzcrank',
    name: 'Blitzcrank',
    title: 'Người Máy Hơi Nước',
    partype: 'Mana',
    stats: {
      hp: 650,
      hpperlevel: 109,
      mp: 267,
      mpperlevel: 40,
      movespeed: 325,
      armor: 37,
      armorperlevel: 4.7,
      spellblock: 32,
      spellblockperlevel: 2.05,
      attackrange: 125,
      hpregen: 7.5,
      hpregenperlevel: 0.75,
      mpregen: 8.5,
      mpregenperlevel: 0.8,
      crit: 0,
      critperlevel: 0,
      attackdamage: 62,
      attackdamageperlevel: 3.5,
      attackspeedperlevel: 1.13,
      attackspeed: 0.625
    }
  },
  Garen: {
    id: 'Garen',
    name: 'Garen',
    title: 'Sức Mạnh Demacia',
    partype: 'None',
    stats: {
      hp: 690,
      hpperlevel: 98,
      mp: 0,
      mpperlevel: 0,
      movespeed: 340,
      armor: 38,
      armorperlevel: 4.2,
      spellblock: 32,
      spellblockperlevel: 1.55,
      attackrange: 175,
      hpregen: 8,
      hpregenperlevel: 0.5,
      mpregen: 0,
      mpregenperlevel: 0,
      crit: 0,
      critperlevel: 0,
      attackdamage: 69,
      attackdamageperlevel: 4.5,
      attackspeedperlevel: 3.65,
      attackspeed: 0.625
    }
  }
};

// Aliases mapping lowercase / game keys to official Data Dragon Champion IDs
export const CHAMPION_KEY_MAP = {
  yasuo: 'Yasuo',
  jinx: 'Jinx',
  zed: 'Zed',
  ashe: 'Ashe',
  darius: 'Darius',
  ahri: 'Ahri',
  soldier: 'Garen',
  robot: 'Blitzcrank',
  blitzcrank: 'Blitzcrank',
  garen: 'Garen'
};

/**
 * Fetch and parse Data Dragon 14.5.1 champion.json
 */
export async function loadDataDragonChampions() {
  if (allChampionsData) return allChampionsData;
  if (isLoadingData) {
    return new Promise((resolve) => onDataLoadedCallbacks.push(resolve));
  }

  isLoadingData = true;
  try {
    console.log(`🌐 Đang tải dữ liệu chỉ số tướng chuẩn Riot Data Dragon 14.5.1: ${DDRAGON_14_5_1_URL}...`);
    let response;
    try {
      response = await fetch(DDRAGON_14_5_1_URL);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
    } catch (netErr) {
      console.warn(`Không thể tải trực tiếp từ Riot CDN (${netErr.message}), chuyển sang file cache local: ${LOCAL_CHAMPION_DATA_PATH}`);
      response = await fetch(LOCAL_CHAMPION_DATA_PATH);
    }

    const json = await response.json();
    if (json && json.data) {
      allChampionsData = json.data;
      console.log(`✅ Đã nạp thành công ${Object.keys(allChampionsData).length} tướng chuẩn bản cập nhật 14.5.1!`);
    } else {
      throw new Error('Dữ liệu JSON không hợp lệ');
    }
  } catch (err) {
    console.error('Lỗi khi tải Data Dragon 14.5.1, sử dụng dữ liệu nén dự phòng:', err);
    allChampionsData = BUNDLED_CHAMPION_STATS_14_5_1;
  } finally {
    isLoadingData = false;
    onDataLoadedCallbacks.forEach(cb => cb(allChampionsData));
    onDataLoadedCallbacks.length = 0;
  }

  return allChampionsData;
}

/**
 * Tính toán chỉ số theo cấp độ theo chuẩn công thức tăng trưởng LMHT:
 * growth(n) = (n - 1) * (0.7025 + 0.0175 * (n - 1))
 */
export function calculateStatsAtLevel(rawStats, level = 1) {
  if (!rawStats) return null;
  const lvl = Math.max(1, Math.min(18, level));
  const growth = lvl === 1 ? 0 : (lvl - 1) * (0.7025 + 0.0175 * (lvl - 1));

  const hp = Math.round(rawStats.hp + rawStats.hpperlevel * growth);
  const mp = rawStats.mp === 0 ? 0 : Math.round(rawStats.mp + rawStats.mpperlevel * growth);
  const armor = Math.round(rawStats.armor + rawStats.armorperlevel * growth);
  const spellblock = Math.round(rawStats.spellblock + rawStats.spellblockperlevel * growth);
  const attackdamage = Math.round(rawStats.attackdamage + rawStats.attackdamageperlevel * growth);
  const hpregen = +(rawStats.hpregen + rawStats.hpregenperlevel * growth).toFixed(1);
  const mpregen = +(rawStats.mpregen + rawStats.mpregenperlevel * growth).toFixed(1);
  const attackspeed = +(rawStats.attackspeed * (1 + (rawStats.attackspeedperlevel * growth) / 100)).toFixed(3);

  // Quy đổi sang toạ độ không gian 3D
  const rangeLol = rawStats.attackrange;
  const range = +(rangeLol * LOL_RANGE_SCALE).toFixed(2);
  const movespeed = rawStats.movespeed;
  const speed = +(movespeed / 25).toFixed(2); // ~13.0 - 13.8 units/s
  const attackCooldownMax = +(1.0 / attackspeed).toFixed(2);
  const type = rangeLol > 300 ? 'ranged' : 'melee';

  return {
    level: lvl,
    hp,
    maxHp: hp,
    mp,
    maxMp: mp,
    ad: attackdamage,
    armor,
    mr: spellblock,
    movespeed,
    speed,
    attackrange: rangeLol,
    rangeLol,
    range,
    attackspeed,
    attackCooldownMax,
    hpregen,
    mpregen,
    type,
    rawStats
  };
}

/**
 * Lấy dữ liệu chỉ số chuẩn 14.5.1 của tướng theo ID hoặc key (hỗ trợ cả đồng bộ và bất đồng bộ)
 */
export function getChampion1451Data(championKeyOrId, level = 1) {
  const normKey = championKeyOrId ? championKeyOrId.toString().toLowerCase().trim() : 'yasuo';
  const champId = CHAMPION_KEY_MAP[normKey] || championKeyOrId;

  let raw = null;
  if (allChampionsData && allChampionsData[champId]) {
    raw = allChampionsData[champId];
  } else if (BUNDLED_CHAMPION_STATS_14_5_1[champId]) {
    raw = BUNDLED_CHAMPION_STATS_14_5_1[champId];
  } else if (allChampionsData) {
    // Tìm kiếm không phân biệt hoa thường trong toàn bộ 167 tướng
    const foundKey = Object.keys(allChampionsData).find(k => k.toLowerCase() === normKey);
    if (foundKey) raw = allChampionsData[foundKey];
  }

  if (!raw) {
    raw = BUNDLED_CHAMPION_STATS_14_5_1.Yasuo;
  }

  const computed = calculateStatsAtLevel(raw.stats, level);
  return {
    id: raw.id,
    name: raw.name,
    title: raw.title,
    partype: raw.partype || 'Mana',
    ...computed
  };
}
