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

### 6. 🔥 Cơ Chế ARAM Chuẩn (tái hiện theo dữ liệu Riot CommunityDragon)
Toàn bộ luật chơi được tách riêng trong `src/aram_rules.js` và đối chiếu với dữ liệu chính thức:

| Cơ chế | Triển khai |
| :--- | :--- |
| **Chế độ** | ARAM: Hỗn Loạn — Queue **#2400** (lấy từ `queues.json`) |
| **Bản đồ** | map **12** — The Howling Abyss (`maps.json`) |
| **Chọn tướng** | Random như ARAM thật + **2 lượt reroll** + **ô Bench** để đổi lại miễn phí |
| **Hồi sinh** | Công thức theo cấp: cấp 1 ≈ 7s → cấp 11 ≈ 15.4s → cấp 18 ≈ 21.3s, cộng dần theo thời gian trận |
| **Điều kiện thắng** | Phá hủy **Nhà Chính địch** (màn hình CHIẾN THẮNG) |
| **Điều kiện thua** | Nhà Chính Đồng Minh bị phá (màn hình THẤT BẠI) |
| **HUD trận đấu** | Đồng hồ MM:SS, chỉ số Hạ gục/Chết, màn hình đếm ngược hồi sinh |
| **Bệ Đá Cổ** | Chỉ mua/bán trang bị khi đứng trong vùng căn cứ quanh Nhà Chính (như LMHT thật) |
| **Tốc độ** | Quy đổi chuẩn LMHT: tướng Yasuo 345 MS → 8.90 units/s, lính 350 MS → 9.03 units/s |
| **Nhịp lính** | Đợt lính mỗi **25 giây** (ARAM chuẩn), lính đầu sau 30 giây |
| **Lính công thành** | Xuất hiện mỗi đợt thứ 3 (880 HP, tầm 300, AS 1.0) — đúng dữ liệu CommunityDragon |
| **Lên cấp** | XP chia toàn đội (5.5 XP/s thụ động + 12 XP/lính + 120 XP/hạ gục), tự lên cấp tới 18 |
| **Nhà Lính** | Hồi sinh sau **60 giây** sau khi bị phá |
| **Vàng khởi đầu** | **1400 vàng** (đúng chuẩn ARAM, đủ trang bị khởi đầu + giày) |
| **Tầm đánh** | Đo **mép-tới-mép** như LMHT thật (cộng bán kính tướng/trụ/lính), khoảng cách mặt phẳng |
| **Tướng** | **14 tướng** đủ model 3D + bộ kỹ năng Q/W/E/R riêng |
| **Hoạt ảnh chiêu** | Dùng clip `Spell1→Spell4` có sẵn trong model (Q/W/E/R) |
| **Bệ Đá Cổ** | Mô hình 3D đầy đủ: bậc đá, vòng năng lượng xoay, pha lê phát sáng, hào quang |
| **Vật liệu** | Chuyển `KHR_materials_unlit` → `MeshStandardMaterial` để có khối và đổ bóng |
| **Tối ưu tải** | Chỉ tải tướng đang chơi (không tải cả 14); model nền tải 2 tầng |

### 8. 🎭 Danh Sách 14 Tướng (model .glb từ modelviewer.lol)

| Tướng | Tầm đánh | Tốc chạy | Nguồn model |
|---|---|---|---|
| Yasuo | 175 | 345 | modelviewer.lol |
| Jinx | 525 | 325 | modelviewer.lol |
| Zed | 125 | 345 | modelviewer.lol |
| Ashe | 600 | 325 | modelviewer.lol |
| Darius | 175 | 340 | modelviewer.lol |
| Ahri | 550 | 330 | modelviewer.lol |
| Ezreal | 550 | 325 | modelviewer.lol |
| Lux | 550 | 330 | modelviewer.lol |
| Malphite | 125 | 335 | modelviewer.lol |
| Nautilus | 175 | 325 | modelviewer.lol |
| Cho'Gath | 125 | 345 | modelviewer.lol |
| Katarina | 125 | 335 | modelviewer.lol |
| Akali | 125 | 345 | modelviewer.lol |
| Syndra | 550 | 330 | modelviewer.lol |

Chỉ số lấy từ **Data Dragon 14.5.1**, model 3D từ **modelviewer.lol**,
bộ kỹ năng Q/W/E/R từ **CommunityDragon**.

### 7. 🎨 HUD Chuẩn Liên Minh + Minimap
Giao diện được dựng lại theo đúng bố cục Liên Minh Huyền Thoại:

- **Thanh điểm số trên cùng**: Đồng Minh | Đồng hồ trận + chế độ | Kẻ Thù
- **Cụm trái**: Chân dung tướng tròn viền vàng + cấp độ + thanh HP/MP
- **Cụm giữa**: 6 ô kỹ năng (Nội tại, Q, W, E, R, D) + thanh kinh nghiệm
- **Cụm phải**: 6 ô trang bị + ô trang bị hỗ trợ + vàng + nút Cửa Hàng/Lõi
- **Minimap góc dưới phải**: vẽ bằng Canvas mỗi frame, hiển thị đường làn, Trụ/Nhà Lính/Nhà Chính 2 phe (mờ khi bị phá), lính, Bot địch, và mũi tên vàng chỉ hướng tướng người chơi
- Bảng màu chuẩn Hextech: vàng `#c8aa6e`, nền `#010a13`, viền `#1e2328`

> Ghi chú kỹ thuật: các hằng số Riot không công bố qua API (thời gian hồi sinh, tốc độ vàng) được tính theo công thức tiêu chuẩn của chế độ và có ghi chú nguồn gốc ngay trong code.

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
│   ├── aram_rules.js          # Luật chơi ARAM (hồi sinh, chọn tướng, thắng/thua)
│   ├── augments.js            # Dữ liệu & logic Lõi Nâng Cấp ARAM Mayhem
│   ├── champion.js            # Lớp PlayerChampion, EnemyBot, Structure, Minion
│   ├── champion_data.js       # Engine tính chỉ số Riot Data Dragon 14.5.1
│   ├── items.js               # Danh mục trang bị & chỉ số cửa hàng
│   ├── main.js                # Game loop, điều khiển camera, renderer Three.js, HUD
│   ├── map.js                 # Dựng bản đồ Vực Gió Hú, tượng cổ, đèn bão tuyết
│   ├── minimap.js             # Minimap Canvas + kiểm tra vùng Bệ Đá Cổ
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
