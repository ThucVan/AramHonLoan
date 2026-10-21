# ⚔️ ARAM: MAYHEM (HỖN LOẠN - QUEUE #2400) ⚔️
### Trải Nghiệm Liên Minh Huyền Thoại 3D Trên Web - Vực Gió Hú (Howling Abyss)

[![Three.js](https://img.shields.io/badge/Three.js-r174-black?logo=three.js)](https://threejs.org/)
[![Vite](https://img.shields.io/badge/Vite-6.4-646CFF?logo=vite)](https://vitejs.dev/)
[![League of Legends Patch](https://img.shields.io/badge/LoL%20DataDragon-Patch%2014.5.1-0ea5e9?logo=riotgames)](https://ddragon.leagueoflegends.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

---

## 🌟 Giới Thiệu Dự Án

**ARAM: Mayhem** là một tựa game Web MOBA 3D tái hiện chân thực bản đồ **Vực Gió Hú (Howling Abyss)** của Liên Minh Huyền Thoại. Dự án tích hợp trực tiếp dữ liệu chỉ số bản cập nhật chính thức **Riot Data Dragon 14.5.1**, thư viện mô hình 3D nguyên bản từ Riot CommunityDragon, và hệ thống **Lõi Nâng Cấp ARAM Mayhem (Queue #2400)**.

---

## 🎮 Tính Năng Nổi Bật

### 1. Dữ Liệu Chỉ Số Tướng Chuẩn Riot Data Dragon 14.5.1
- Tích hợp trực tiếp từ Riot Games API (`https://ddragon.leagueoflegends.com/cdn/14.5.1/data/en_US/champion.json`) với cơ chế fallback offline an toàn.
- Chuẩn hóa đầy đủ các chỉ số theo công thức tăng trưởng chính thức của LMHT:
  $$f(n) = (n - 1) \times (0.7025 + 0.0175 \times (n - 1))$$
- Bảng chỉ số hiển thị thời gian thực trên HUD:
  - **Máu (HP)** & **Năng lượng (MP)**: Phân biệt dạng tài nguyên (Kiếm Khí - *Flow* của Yasuo, Nội Năng - *Energy* của Zed, Năng Lượng - *Mana* của Ashe/Jinx/Darius/Ahri, Không tốn năng lượng của Garen).
  - **Sát thương công kích (AD)**, **Giáp (Armor)**, **Kháng phép (MR)**, **Sức mạnh phép thuật (AP)**.
  - **Tốc độ đánh (AS)**, **Tốc độ di chuyển (MS)**, **Hút máu (Lifesteal)**, **Tỉ lệ chí mạng (Crit)**.

### 2. Hệ Thống Tầm Đánh Chuẩn LMHT (Attack Range System)
- Quy đổi tỉ lệ chính xác từ Liên Minh Huyền Thoại sang không gian Three.js:
  $$\text{LoL Range Scale} = \frac{20 \text{ units}}{775 \text{ (Tầm bắn trụ LMHT)}} \approx 0.025806$$
- Vòng hiển thị tầm đánh 3D (Range Indicator Ring) phản ánh đúng từng tướng:
  - **Yasuo**: 175 (Cận chiến)
  - **Zed**: 125 (Sát thủ)
  - **Darius**: 175 (Đấu sĩ)
  - **Jinx**: 525 (Xạ thủ)
  - **Ahri**: 550 (Pháp sư)
  - **Ashe**: 600 (Xạ thủ tầm xa)

### 3. Bản Đồ Vực Gió Hú 3D (Howling Abyss) Sống Động
- Mặt cầu đá chạm khắc hoa văn cổ ngữ Freljord phát quang, rãnh dẫn băng hà, tuyết phủ bờ tường thành.
- Các tháp canh đá cổ, chậu lửa Freljord đối lập với bão tuyết vùng cực Bắc.
- Đáy vực thẳm sâu hun hút với chông băng khổng lồ và hiệu ứng cực quang phương Bắc (Aurora Borealis).
- Trụ bảo vệ (Turret) Order và Chaos có laser nhắm bắn liên tục và tăng dần sát thương theo phát bắn.
- Nhà Lính (Inhibitor), Nhà Chính (Nexus), Cổng Dịch Chuyển Hextech (Hexgates) và Vua Poro.

### 4. Hệ Thống Đợt Lính & Trận Đánh Tự Động (Minions AI)
- Lính Đao cận chiến (Melee), Lính Cung phép thuật (Caster), và Lính Siêu Cấp (Super Minion).
- Tích hợp bộ giải mã bộ đệm trong RAM (`model_cache.js`) giúp clone mô hình lính với 0ms độ trễ và không bị lỗi xoay hay hỏng khung xương (skeletal rigging).

### 5. Lõi Nâng Cấp ARAM Mayhem & Cửa Hàng Trang Bị
- **Chế độ Hỗn Loạn (Queue #2400)**: Bảng chọn 3 Lõi Nâng Cấp (Bạc, Vàng, Kim Cương) mang lại sức mạnh đột biến (Khổng Lồ Hóa phóng to mô hình tướng, Giảm hồi chiêu kỹ năng, Sát thương thích ứng, v.v.).
- **Cửa hàng trang bị Adversator**: 6 ô túi đồ với đầy đủ các trang bị huyền thoại LMHT (Vô Cực Kiếm, Tam Hợp Kiếm, Mũ Phù Thủy Rabadon, Nỏ Tử Thủ, Đồng Hồ Cát Zhonya, Giáp Gai...).

---

## ⌨️ Phím Tắt & Thao Tác Điều Khiển

| Phím / Thao Tác | Chức Năng |
| :--- | :--- |
| **Chuột Phải** | Di chuyển tướng / Nhấp vào mục tiêu để tự động tấn công theo tầm |
| **Chuột Trái** | Chọn mục tiêu / Xác nhận hướng bắn chiêu thức định hướng |
| **Q, W, E, R** | Tung bộ chiêu thức tướng chuẩn LMHT |
| **Phím D** | Cầu Tuyết (Đánh dấu & Tái kích hoạt lướt tới mục tiêu) |
| **Phím A / C** | Bật / tắt vòng tròn bán kính tầm đánh tướng |
| **Phím N** | Mở bảng Chọn Lõi Nâng Cấp ARAM Mayhem |
| **Phím P** | Mở Cửa Hàng Trang Bị |
| **Phím Space** | Khóa góc nhìn camera vào nhân vật |
| **Cuộn chuột** | Thu phóng (Zoom in / Zoom out) camera chiến trường |

---

## 🛠️ Hướng Dẫn Cài Đặt & Khởi Chạy

### Yêu Cầu Hệ Thống
- [Node.js](https://nodejs.org/) phiên bản 18+ hoặc 20+.
- Trình quản lý gói [pnpm](https://pnpm.io/) (khuyến nghị) hoặc `npm` / `yarn`.

### Các Bước Cài Đặt

1. **Clone repository về máy:**
   ```bash
   git clone https://github.com/ThucVan/AramHonLoan.git
   cd AramHonLoan
   ```

2. **Cài đặt dependencies:**
   ```bash
   pnpm install
   ```

3. **Chạy máy chủ phát triển (Dev Server):**
   ```bash
   pnpm dev
   ```
   Mở trình duyệt truy cập: `http://localhost:5173/`

4. **Đóng gói dự án (Production Build):**
   ```bash
   pnpm build
   ```

---

## 📂 Cấu Trúc Dự Án

```
AramHonLoan/
├── public/
│   ├── basis/                 # Trình giải mã KTX2 transcoder
│   ├── data/
│   │   └── champion.json      # Riot Data Dragon 14.5.1 (167 tướng)
│   ├── draco/                 # Trình giải mã hình học Draco Loader
│   ├── images/                # Icon tướng, trang bị, kỹ năng, lõi nâng cấp
│   └── models/                # Mô hình 3D .glb (tướng, trụ, lính, nhà chính, poro)
├── src/
│   ├── augments.js            # Dữ liệu & logic Lõi Nâng Cấp ARAM Mayhem
│   ├── champion.js            # Lớp PlayerChampion, EnemyBot, Structure, Minion
│   ├── champion_data.js       # Engine tính chỉ số Riot Data Dragon 14.5.1
│   ├── items.js               # Danh mục trang bị & chỉ số cửa hàng
│   ├── main.js                # Game loop, điều khiển camera, renderer Three.js, HUD
│   ├── map.js                 # Dựng bản đồ Vực Gió Hú, tượng cổ, đèn bão tuyết
│   ├── model_cache.js         # Bộ nhớ đệm RAM Buffer nạp nhanh mô hình 3D
│   ├── skill_catalog.js       # Thư viện toàn bộ chiêu thức LMHT (Q, W, E, R)
│   ├── skills.js              # Hệ thống tính toán sát thương & hiệu ứng chiêu
│   ├── style.css              # Giao diện HUD MOBA, thanh máu/mana, modals
│   └── vfx.js                 # Hiệu ứng hạt tuyết, kiếm khí, nổ băng, số nhảy
├── index.html                 # Giao diện chính của game
├── package.json               # Cấu hình dự án & dependencies
└── README.md                  # Tài liệu hướng dẫn
```

---

## 📜 Bản Quyền & Tuyên Bố Miễn Trừ Trách Nhiệm

Dự án này được tạo ra cho mục đích học tập và phi thương mại. Mọi tài sản trí tuệ bao gồm mô hình 3D, âm thanh, biểu tượng và chỉ số thuộc quyền sở hữu của **Riot Games, Inc.** theo chính sách "Legal Jibber Jabber" của Riot Games.
