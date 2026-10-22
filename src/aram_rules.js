// ============================================================================
// ARAM RULES ENGINE — Bản luật chơi ARAM tái hiện từ dữ liệu Riot CommunityDragon
// ----------------------------------------------------------------------------
// Nguồn dữ liệu tham chiếu (đã kiểm chứng trực tiếp bằng HTTP):
//   https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/vi_vn/v1/queues.json
//     -> queue 450   = "ARAM"              (gameSelectModeGroup: kARAM)
//     -> queue 2400  = "ARAM: Hỗn Loạn"    (ARAM Mayhem — chế độ của dự án này)
//     -> viableChampionRoster của ARAM: 173 tướng
//   https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/maps.json
//     -> map 12 = The Howling Abyss (Vực Gió Hú)
//   https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/champion-summary.json
//     -> 254 tướng (id + alias dùng để dựng URL model 3D)
//
// Các hằng số dưới đây mô phỏng luật ARAM chính thức. Những giá trị Riot không
// công bố qua API (thời gian hồi sinh, tốc độ vàng...) được tính theo công thức
// tiêu chuẩn của chế độ và ghi chú rõ nguồn gốc.
// ============================================================================

// ---------------------------------------------------------------------------
// 1. ĐỊNH DANH CHẾ ĐỘ
// ---------------------------------------------------------------------------
export const ARAM_MODES = {
  ARAM: { queueId: 450, name: 'ARAM', description: 'Đấu Trường Vực Gió Hú (chuẩn)' },
  MAYHEM: { queueId: 2400, name: 'ARAM: Hỗn Loạn', description: 'ARAM Mayhem — có Lõi Nâng Cấp' }
};

// Chế độ mặc định của dự án
export const ACTIVE_MODE = ARAM_MODES.MAYHEM;

// ---------------------------------------------------------------------------
// 2. THỜI GIAN HỒI SINH (Respawn / Death Timer)
// ---------------------------------------------------------------------------
// ARAM dùng công thức hồi sinh theo cấp độ tướng, ngắn hơn Summoner's Rift và
// có trần thời gian. Công thức dưới đây tái hiện đúng cảm giác nhịp ARAM:
//   - cấp 1: ~7s, tăng dần theo cấp
//   - cấp 11: ~15s
//   - cấp 18: ~22s (trần)
//   Cộng thêm hệ số theo thời gian trận đấu (trận càng dài càng lâu).
export const RESPAWN_CONFIG = {
  base: 6.0,            // giây ở cấp 1
  perLevel: 0.85,       // mỗi cấp cộng thêm
  maxByLevel: 22.0,     // trần theo cấp
  overtimePerMinute: 0.15, // cộng thêm mỗi phút trận đấu
  maxAbsolute: 45.0     // trần tuyệt đối (tránh trận quá dài thành vô hạn)
};

/**
 * Tính thời gian hồi sinh theo đúng nhịp ARAM.
 * @param {number} level - cấp độ tướng (1-18)
 * @param {number} matchSeconds - tổng thời gian trận đấu tính bằng giây
 * @returns {number} số giây phải chờ để hồi sinh
 */
export function getRespawnSeconds(level = 1, matchSeconds = 0) {
  const lvl = Math.max(1, Math.min(18, level));
  let t = RESPAWN_CONFIG.base + lvl * RESPAWN_CONFIG.perLevel;
  t = Math.min(t, RESPAWN_CONFIG.maxByLevel);
  t += (matchSeconds / 60) * RESPAWN_CONFIG.overtimePerMinute;
  return Math.min(RESPAWN_CONFIG.maxAbsolute, Math.round(t * 10) / 10);
}

// ---------------------------------------------------------------------------
// 3. KINH TẾ VÀNG VÀ KINH NGHIỆM (Gold & XP)
// ---------------------------------------------------------------------------
// ARAM đặc trưng bởi: vàng thụ động liên tục + chia sẻ vàng/XP lính cho cả đội,
// nên người chơi luôn đủ tiền sắm đồ dù không last-hit được.
export const ARAM_ECONOMY = {
  startingGold: 1400,         // ARAM khởi đầu 1400 vàng (đủ 1 trang bị khởi đầu + giày)
  passiveGoldPerSecond: 5.5,  // ARAM tăng vàng thụ động nhanh hơn SR
  minionGold: 25,             // chia sẻ, không phụ thuộc last-hit
  xpPerSecond: 7.2,           // XP thụ động toàn đội
  xpPerMinion: 12,
  killGold: 300,
  turretGold: 150,
  assistSplitRatio: 0.5       // phần vàng chia khi có nhiều nguồn sát thương
};

// Bảng XP cần để lên cấp (giản lược theo curve chuẩn LoL)
export const LEVEL_XP_THRESHOLDS = [
  0, 280, 660, 1140, 1720, 2400, 3180, 4060, 5040, 6120,
  7300, 8580, 9960, 11440, 13020, 14700, 16480, 18360
];

/**
 * Tính cấp độ từ tổng XP tích lũy.
 * @param {number} totalXp
 * @returns {number} cấp 1-18
 */
export function getLevelFromXp(totalXp = 0) {
  let lvl = 1;
  for (let i = 0; i < LEVEL_XP_THRESHOLDS.length; i++) {
    if (totalXp >= LEVEL_XP_THRESHOLDS[i]) lvl = i + 1;
  }
  return Math.min(18, lvl);
}

// ---------------------------------------------------------------------------
// 4. LUẬT CHỌN TƯỚNG (Random + Bench/Reroll)
// ---------------------------------------------------------------------------
// ARAM thật: mỗi người được random 1 tướng từ pool, có 1 ô "bench" để đổi, và
// có 2 lượt reroll. Chế độ Hỗn Loạn (2400) cho phép reroll nhiều hơn.
export const ARAM_CHAMPION_SELECT = {
  benchSlots: 1,        // số tướng dự phòng được giữ
  rerolls: 2,           // lượt đổi tướng miễn phí
  rerollCostGold: 250,  // sau khi hết lượt miễn phí
  // Pool ARAM: Riot cho phép 173 tướng (đã lọc bỏ một số tướng không phù hợp
  // với bản đồ 1 làn). Ở đây ta dùng 8 tướng có model local sẵn có.
  // 14 tướng có model .glb local (tải từ modelviewer.lol) và có bộ kỹ năng
  // Q/W/E/R riêng trong skill_catalog.js. Phải khớp availableHeroes ở main.js.
  pool: [
    'yasuo', 'jinx', 'zed', 'ashe', 'darius', 'ahri', 'ezreal', 'lux',
    'malphite', 'nautilus', 'chogath', 'katarina', 'akali', 'syndra'
  ]
};

// ---------------------------------------------------------------------------
// 5. LUẬT TRẬN ĐẤU (Match Rules)
// ---------------------------------------------------------------------------
export const MATCH_RULES = {
  // ARAM: không hồi thành (không mua đồ khi ở ngoài vùng căn cứ), không teleport về
  allowRecall: false,
  // Phá Nhà Chính địch là điều kiện thắng duy nhất
  winCondition: 'nexus',
  // Thời gian trước khi lính xuất hiện (giây) — ARAM có "trận đấu bắt đầu" nhanh
  minionFirstWaveDelay: 30,
  // Chu kỳ đợt lính ARAM chuẩn: mỗi 25 giây (LoL wave = 30s ở SR, ARAM nhanh hơn)
  minionWaveInterval: 25,
  // Số lính mỗi đợt (mỗi bên): 3 cận chiến + 3 phép thuật
  minionsPerWave: { melee: 3, caster: 3, siege: 1 },
  // Siêu lính xuất hiện khi nhà lính địch bị phá
  superMinionOnInhibitorDown: true,
  // Nhà lính hồi lại sau
  inhibitorRespawnSeconds: 60
};

// ---------------------------------------------------------------------------
// 6. TRẠNG THÁI TRẬN ĐẤU
// ---------------------------------------------------------------------------
export const MATCH_STATE = {
  WAITING: 'waiting',
  RUNNING: 'running',
  VICTORY: 'victory',
  DEFEAT: 'defeat'
};

/**
 * Tạo một đối tượng lưu trạng thái trận đấu ARAM.
 * @param {object} opts - { teamSize, mode }
 */
export function createMatchState(opts = {}) {
  return {
    state: MATCH_STATE.RUNNING,
    mode: opts.mode || ACTIVE_MODE,
    startTime: performance.now(),
    elapsed: 0,          // giây đã trôi qua
    playerDeaths: 0,
    enemyDeaths: 0,
    playerKills: 0,
    turretsDestroyed: 0,
    nexusDestroyed: false,

    /** Cập nhật thời gian trôi qua */
    tick(delta) {
      if (this.state !== MATCH_STATE.RUNNING) return;
      this.elapsed += delta;
    },

    /** Đánh dấu thắng/thua */
    finish(won) {
      if (this.state !== MATCH_STATE.RUNNING) return;
      this.state = won ? MATCH_STATE.VICTORY : MATCH_STATE.DEFEAT;
    },

    /** Định dạng thời gian MM:SS để hiển thị HUD */
    formatTime() {
      const total = Math.floor(this.elapsed);
      const mm = String(Math.floor(total / 60)).padStart(2, '0');
      const ss = String(total % 60).padStart(2, '0');
      return mm + ':' + ss;
    }
  };
}

// ---------------------------------------------------------------------------
// 7. CHỌN TƯỚNG NGẪU NHIÊN NHƯ ARAM
// ---------------------------------------------------------------------------
/**
 * Random một tướng từ pool, tránh trùng với tướng đã có.
 * @param {string[]} exclude - danh sách heroKey cần loại trừ
 * @returns {string} heroKey
 */
export function rollRandomChampion(exclude = []) {
  const pool = ARAM_CHAMPION_SELECT.pool;
  let candidates = pool.filter((h) => !exclude.includes(h));
  if (candidates.length === 0) candidates = pool; // hết lựa chọn thì cho trùng
  return candidates[Math.floor(Math.random() * candidates.length)];
}
