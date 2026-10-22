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
      armor: 32,
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
      attackdamageperlevel: 2.5,
      attackspeedperlevel: 3.5,
      attackspeed: 0.7
    }
  },
  Jinx: {
    id: 'Jinx',
    name: 'Jinx',
    title: 'Khẩu Pháo Nổi Loạn',
    partype: 'Mana',
    stats: {
      hp: 610,
      hpperlevel: 105,
      mp: 260,
      mpperlevel: 50,
      movespeed: 325,
      armor: 26,
      armorperlevel: 4.7,
      spellblock: 33,
      spellblockperlevel: 1.3,
      attackrange: 525,
      hpregen: 3.75,
      hpregenperlevel: 0.5,
      mpregen: 6.7,
      mpregenperlevel: 1,
      crit: 0,
      critperlevel: 0,
      attackdamage: 59,
      attackdamageperlevel: 3,
      attackspeedperlevel: 1,
      attackspeed: 0.63
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
      attackspeed: 0.65
    }
  },
  Ashe: {
    id: 'Ashe',
    name: 'Ashe',
    title: 'Cung Băng Freljord',
    partype: 'Mana',
    stats: {
      hp: 610,
      hpperlevel: 101,
      mp: 280,
      mpperlevel: 35,
      movespeed: 325,
      armor: 26,
      armorperlevel: 4.6,
      spellblock: 33,
      spellblockperlevel: 1.3,
      attackrange: 600,
      hpregen: 3.5,
      hpregenperlevel: 0.55,
      mpregen: 7,
      mpregenperlevel: 0.65,
      crit: 0,
      critperlevel: 0,
      attackdamage: 59,
      attackdamageperlevel: 3,
      attackspeedperlevel: 3,
      attackspeed: 0.66
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
      armor: 37,
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
      attackspeed: 0.63
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
      attackspeed: 0.67
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
  },
  // ---- 8 tướng bổ sung (số liệu thật từ Data Dragon 14.5.1) ----
  Ezreal: {
    id: 'Ezreal',
    name: 'Ezreal',
    title: 'Nhà Thám Hiểm',
    partype: 'Mana',
    stats: {
      hp: 600,
      hpperlevel: 102,
      mp: 375,
      mpperlevel: 70,
      movespeed: 325,
      armor: 24,
      armorperlevel: 4.7,
      spellblock: 33,
      spellblockperlevel: 1.3,
      attackrange: 550,
      hpregen: 4,
      hpregenperlevel: 0.65,
      mpregen: 8.5,
      mpregenperlevel: 1,
      crit: 0,
      critperlevel: 0,
      attackdamage: 60,
      attackdamageperlevel: 3.75,
      attackspeedperlevel: 2.5,
      attackspeed: 0.63,
    }
  },
  Lux: {
    id: 'Lux',
    name: 'Lux',
    title: 'Tiểu Thư Ánh Sáng',
    partype: 'Mana',
    stats: {
      hp: 580,
      hpperlevel: 99,
      mp: 480,
      mpperlevel: 23.5,
      movespeed: 330,
      armor: 21,
      armorperlevel: 5.2,
      spellblock: 30,
      spellblockperlevel: 1.3,
      attackrange: 550,
      hpregen: 5.5,
      hpregenperlevel: 0.55,
      mpregen: 7,
      mpregenperlevel: 0.8,
      crit: 0,
      critperlevel: 0,
      attackdamage: 54,
      attackdamageperlevel: 3.3,
      attackspeedperlevel: 3,
      attackspeed: 0.67,
    }
  },
  Malphite: {
    id: 'Malphite',
    name: 'Malphite',
    title: 'Mảnh Vỡ Núi Lửa',
    partype: 'Mana',
    stats: {
      hp: 665,
      hpperlevel: 104,
      mp: 280,
      mpperlevel: 60,
      movespeed: 335,
      armor: 40,
      armorperlevel: 4.95,
      spellblock: 28,
      spellblockperlevel: 2.05,
      attackrange: 125,
      hpregen: 7,
      hpregenperlevel: 0.55,
      mpregen: 7.3,
      mpregenperlevel: 0.55,
      crit: 0,
      critperlevel: 0,
      attackdamage: 62,
      attackdamageperlevel: 4,
      attackspeedperlevel: 3.4,
      attackspeed: 0.74,
    }
  },
  Nautilus: {
    id: 'Nautilus',
    name: 'Nautilus',
    title: 'Người Khổng Lồ Biển',
    partype: 'Mana',
    stats: {
      hp: 646,
      hpperlevel: 100,
      mp: 400,
      mpperlevel: 47,
      movespeed: 325,
      armor: 39,
      armorperlevel: 4.95,
      spellblock: 32,
      spellblockperlevel: 2.05,
      attackrange: 175,
      hpregen: 8.5,
      hpregenperlevel: 0.55,
      mpregen: 8.65,
      mpregenperlevel: 0.5,
      crit: 0,
      critperlevel: 0,
      attackdamage: 58,
      attackdamageperlevel: 3.3,
      attackspeedperlevel: 1,
      attackspeed: 0.71,
    }
  },
  Katarina: {
    id: 'Katarina',
    name: 'Katarina',
    title: 'Lưỡi Dao Bóng Đêm',
    partype: 'None',
    stats: {
      hp: 672,
      hpperlevel: 108,
      mp: 0,
      mpperlevel: 0,
      movespeed: 335,
      armor: 32,
      armorperlevel: 4.7,
      spellblock: 32,
      spellblockperlevel: 2.05,
      attackrange: 125,
      hpregen: 7.5,
      hpregenperlevel: 0.7,
      mpregen: 0,
      mpregenperlevel: 0,
      crit: 0,
      critperlevel: 0,
      attackdamage: 58,
      attackdamageperlevel: 3.2,
      attackspeedperlevel: 2.74,
      attackspeed: 0.66,
    }
  },
  Akali: {
    id: 'Akali',
    name: 'Akali',
    title: 'Sát Thủ Bóng Đêm',
    partype: 'Energy',
    stats: {
      hp: 600,
      hpperlevel: 119,
      mp: 200,
      mpperlevel: 0,
      movespeed: 345,
      armor: 23,
      armorperlevel: 4.7,
      spellblock: 37,
      spellblockperlevel: 2.05,
      attackrange: 125,
      hpregen: 9,
      hpregenperlevel: 0.9,
      mpregen: 50,
      mpregenperlevel: 0,
      crit: 0,
      critperlevel: 0,
      attackdamage: 62,
      attackdamageperlevel: 3.3,
      attackspeedperlevel: 3.2,
      attackspeed: 0.63,
    }
  },
  Syndra: {
    id: 'Syndra',
    name: 'Syndra',
    title: 'Nữ Pháp Sư Bóng Đêm',
    partype: 'Mana',
    stats: {
      hp: 583,
      hpperlevel: 100,
      mp: 480,
      mpperlevel: 40,
      movespeed: 330,
      armor: 25,
      armorperlevel: 4.6,
      spellblock: 30,
      spellblockperlevel: 1.3,
      attackrange: 550,
      hpregen: 6.5,
      hpregenperlevel: 0.6,
      mpregen: 8,
      mpregenperlevel: 0.8,
      crit: 0,
      critperlevel: 0,
      attackdamage: 54,
      attackdamageperlevel: 2.9,
      attackspeedperlevel: 2,
      attackspeed: 0.66,
    }
  },
  Chogath: {
    id: 'Chogath',
    name: 'Cho\'Gath',
    title: 'Quái Vật Hư Không',
    partype: 'Mana',
    stats: {
      hp: 644,
      hpperlevel: 94,
      mp: 270,
      mpperlevel: 60,
      movespeed: 345,
      armor: 38,
      armorperlevel: 5,
      spellblock: 32,
      spellblockperlevel: 2.05,
      attackrange: 125,
      hpregen: 9,
      hpregenperlevel: 0.85,
      mpregen: 7.2,
      mpregenperlevel: 0.45,
      crit: 0,
      critperlevel: 0,
      attackdamage: 69,
      attackdamageperlevel: 4.2,
      attackspeedperlevel: 1.44,
      attackspeed: 0.66,
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
  ezreal: 'Ezreal',
  lux: 'Lux',
  malphite: 'Malphite',
  nautilus: 'Nautilus',
  chogath: 'Chogath',
  katarina: 'Katarina',
  akali: 'Akali',
  syndra: 'Syndra',
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
  // ---------------------------------------------------------------------
  // QUY ĐỔI TỐC ĐỘ DI CHUYỂN CHUẨN LIÊN MINH
  // ---------------------------------------------------------------------
  // Cùng tỉ lệ với tầm đánh: 1 unit game = 38.75 đơn vị LoL (LOL_RANGE_SCALE
  // = 20/775). Nhờ vậy "cảm giác" di chuyển đúng bằng Liên Minh thật:
  //   Yasuo 345 MS -> 345 * 0.025806 = 8.90 units/s
  //   Ashe  325 MS ->                 = 8.39 units/s
  // (Trước đây dùng movespeed / 25 = 13.8 units/s -> NHANH GẤP 1.6 LẦN.)
  const speed = +(movespeed * LOL_RANGE_SCALE).toFixed(3);
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
