// ============================================================================
// MINIMAP RENDERER — Bản đồ thu nhỏ chuẩn Liên Minh Huyền Thoại
// ----------------------------------------------------------------------------
// Vẽ bằng Canvas 2D, cập nhật mỗi frame. Thể hiện đúng thế giới 3D:
//   - Đường làn (lane) chạy dọc trục Z từ -115 (Địch) đến +115 (Đồng Minh)
//   - Trụ / Nhà Lính / Nhà Chính 2 phe (mờ đi khi bị phá)
//   - Lính 2 phe (chấm nhỏ)
//   - Tướng người chơi (mũi tên có hướng) + Bot địch
//   - Vùng Bệ Đá Cổ (bo tròn xanh) khi người chơi đứng trong căn cứ
// ============================================================================

// Giới hạn thế giới 3D mà bản đồ biểu diễn
const WORLD = {
  zMin: -120,
  zMax: 120,
  xMin: -30,
  xMax: 30,
  // Vùng căn cứ Đồng Minh (Bệ Đá Cổ) — nơi được phép mua trang bị
  fountainZMin: 85,
  fountainZMax: 120
};

export class Minimap {
  /**
   * @param {HTMLCanvasElement} canvas
   */
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.w = canvas.width;
    this.h = canvas.height;

    // Cache lớp nền tĩnh (lane + bệ đá cổ) để không phải vẽ lại mỗi frame
    this.staticLayer = document.createElement('canvas');
    this.staticLayer.width = this.w;
    this.staticLayer.height = this.h;
    this._renderStaticLayer(this.staticLayer.getContext('2d'));
  }

  /** Chuyển toạ độ thế giới 3D (x, z) sang toạ độ pixel trên minimap */
  worldToMap(x, z) {
    const px = ((x - WORLD.xMin) / (WORLD.xMax - WORLD.xMin)) * this.w;
    // Trục Z: -120 (Địch) ở TRÊN, +120 (Đồng Minh) ở DƯỚI
    const py = ((z - WORLD.zMin) / (WORLD.zMax - WORLD.zMin)) * this.h;
    return { px: px, py: py };
  }

  /** Vẽ lớp nền tĩnh: vực, đường làn, vùng căn cứ */
  _renderStaticLayer(ctx) {
    const W = this.w;
    const H = this.h;

    // Nền vực sâu Freljord
    const bg = ctx.createLinearGradient(0, 0, 0, H);
    bg.addColorStop(0, '#2a1a1a');   // Phía Địch (đỏ tối)
    bg.addColorStop(0.5, '#0b1a2a'); // Giữa sông
    bg.addColorStop(1, '#122a3a');   // Phía Đồng Minh (xanh tối)
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    // Vực thẳm hai bên đường làn
    ctx.fillStyle = 'rgba(0, 8, 18, 0.85)';
    const laneLeft = this.worldToMap(-13, 0).px;
    const laneRight = this.worldToMap(13, 0).px;
    ctx.fillRect(0, 0, laneLeft, H);
    ctx.fillRect(laneRight, 0, W - laneRight, H);

    // Mặt đường làn (cầu băng)
    const laneGrad = ctx.createLinearGradient(0, 0, 0, H);
    laneGrad.addColorStop(0, 'rgba(120, 60, 60, 0.5)');
    laneGrad.addColorStop(0.5, 'rgba(150, 190, 215, 0.42)');
    laneGrad.addColorStop(1, 'rgba(60, 110, 150, 0.5)');
    ctx.fillStyle = laneGrad;
    ctx.fillRect(laneLeft, 0, laneRight - laneLeft, H);

    // Vạch chia giữa sân
    ctx.strokeStyle = 'rgba(200, 170, 110, 0.22)';
    ctx.lineWidth = 1;
    ctx.setLineDash([3, 4]);
    ctx.beginPath();
    ctx.moveTo(0, H / 2);
    ctx.lineTo(W, H / 2);
    ctx.stroke();
    ctx.setLineDash([]);

    // Vùng Bệ Đá Cổ Đồng Minh (dưới)
    const fTop = this.worldToMap(0, WORLD.fountainZMin).py;
    ctx.fillStyle = 'rgba(56, 189, 248, 0.14)';
    ctx.fillRect(0, fTop, W, H - fTop);
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.5)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, fTop);
    ctx.lineTo(W, fTop);
    ctx.stroke();

    // Vùng căn cứ Địch (trên)
    const eBot = this.worldToMap(0, -WORLD.fountainZMin).py;
    ctx.fillStyle = 'rgba(239, 68, 68, 0.13)';
    ctx.fillRect(0, 0, W, eBot);
    ctx.strokeStyle = 'rgba(239, 68, 68, 0.5)';
    ctx.beginPath();
    ctx.moveTo(0, eBot);
    ctx.lineTo(W, eBot);
    ctx.stroke();
  }

  /** Vẽ một cấu trúc (trụ/nhà lính/nhà chính) */
  _drawStructure(ctx, x, z, isAllied, type, isDestroyed) {
    const { px, py } = this.worldToMap(x, z);
    const color = isAllied ? '#38bdf8' : '#ef4444';

    ctx.globalAlpha = isDestroyed ? 0.25 : 1;

    if (type === 'nexus') {
      // Nhà chính: hình thoi lớn
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.moveTo(px, py - 6);
      ctx.lineTo(px + 6, py);
      ctx.lineTo(px, py + 6);
      ctx.lineTo(px - 6, py);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#c8aa6e';
      ctx.lineWidth = 1.2;
      ctx.stroke();
    } else if (type === 'inhibitor') {
      // Nhà lính: hình vuông
      ctx.fillStyle = color;
      ctx.fillRect(px - 4, py - 4, 8, 8);
    } else {
      // Trụ: hình tam giác
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.moveTo(px, py - 4);
      ctx.lineTo(px + 4, py + 3);
      ctx.lineTo(px - 4, py + 3);
      ctx.closePath();
      ctx.fill();
    }

    ctx.globalAlpha = 1;
  }

  /** Vẽ chấm đơn vị (lính, bot) */
  _drawDot(ctx, x, z, color, radius) {
    const { px, py } = this.worldToMap(x, z);
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(px, py, radius, 0, Math.PI * 2);
    ctx.fill();
  }

  /** Vẽ mũi tên tướng người chơi (có hướng nhìn) */
  _drawPlayer(ctx, x, z, rotationY) {
    const { px, py } = this.worldToMap(x, z);

    // Vòng sáng bao quanh
    ctx.beginPath();
    ctx.arc(px, py, 7, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(250, 204, 21, 0.9)';
    ctx.lineWidth = 1.6;
    ctx.stroke();

    ctx.save();
    ctx.translate(px, py);
    // rotation.y trong Three: 0 = hướng +Z (xuống dưới trên minimap)
    ctx.rotate(-rotationY);

    ctx.fillStyle = '#facc15';
    ctx.beginPath();
    ctx.moveTo(0, -6);   // mũi nhọn
    ctx.lineTo(4.5, 4);
    ctx.lineTo(0, 1.5);
    ctx.lineTo(-4.5, 4);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 0.8;
    ctx.stroke();

    ctx.restore();
  }

  /**
   * Vẽ lại toàn bộ minimap.
   * @param {object} data - { player, allies, enemies, blueStructures, redStructures,
   *                          alliedMinions, enemyMinions, enemyBots }
   */
  render(data) {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.w, this.h);

    // Lớp nền tĩnh
    ctx.drawImage(this.staticLayer, 0, 0);

    // Cấu trúc 2 phe
    (data.blueStructures || []).forEach(s => {
      this._drawStructure(ctx, s.group.position.x, s.group.position.z, true, s.type, s.isDestroyed);
    });
    (data.redStructures || []).forEach(s => {
      this._drawStructure(ctx, s.group.position.x, s.group.position.z, false, s.type, s.isDestroyed);
    });

    // Lính Đồng Minh (chấm xanh nhạt)
    (data.alliedMinions || []).forEach(m => {
      if (!m.isDead && m.mesh) this._drawDot(ctx, m.mesh.position.x, m.mesh.position.z, 'rgba(56, 189, 248, 0.75)', 1.6);
    });

    // Lính Địch (chấm đỏ nhạt)
    (data.enemyMinions || []).forEach(m => {
      if (!m.isDead && m.mesh) this._drawDot(ctx, m.mesh.position.x, m.mesh.position.z, 'rgba(248, 113, 113, 0.75)', 1.6);
    });

    // Bot địch (chấm đỏ lớn hơn)
    (data.enemyBots || []).forEach(b => {
      if (!b.isDead && b.mesh) this._drawDot(ctx, b.mesh.position.x, b.mesh.position.z, '#ef4444', 4);
    });

    // Tướng người chơi (mũi tên vàng có hướng)
    const p = data.player;
    if (p && p.mesh && !p.isDead) {
      this._drawPlayer(ctx, p.mesh.position.x, p.mesh.position.z, p.mesh.rotation.y);
    }

    // Viền khung minimap
    ctx.strokeStyle = 'rgba(200, 170, 110, 0.55)';
    ctx.lineWidth = 1;
    ctx.strokeRect(0.5, 0.5, this.w - 1, this.h - 1);
  }
}

// ---------------------------------------------------------------------------
// KIỂM TRA NGƯỜI CHƠI CÓ ĐỨNG TRONG BỆ ĐÁ CỔ HAY KHÔNG
// ---------------------------------------------------------------------------
/**
 * ARAM: người chơi chỉ được mua trang bị khi đứng trong vùng căn cứ.
 * @param {THREE.Vector3} pos - vị trí hiện tại của tướng
 * @param {number} radius - bán kính vùng căn cứ quanh Nhà Chính
 * @returns {boolean}
 */
export function isAtFountain(pos, radius = 26) {
  if (!pos) return false;
  // Nhà Chính Đồng Minh ở z = +100; vùng căn cứ bao quanh nó
  const dz = pos.z - 100;
  const dx = pos.x;
  return Math.sqrt(dx * dx + dz * dz) <= radius;
}

export { WORLD as MINIMAP_WORLD };
