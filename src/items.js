// Adversator MOBA Items Catalog
export const ITEMS_CATALOG = [
  // 1. SÁT THƯƠNG VẬT LÝ (Attack Damage / AD)
  {
    id: 'iron_fox',
    name: 'Mặt Nạ Huyết Hồ (Iron Fox)',
    category: 'AD',
    cost: 1700,
    stats: { ad: 45, lifesteal: 0.20, speed: 1.5 },
    iconCol: 7, iconRow: 1, // Laughing wolf/fox mask
    desc: '+45 Sát thương, +20% Hút máu từ đòn đánh và kỹ năng. Cho khả năng hồi phục cực mạnh trong giao tranh.'
  },
  {
    id: 'runic_sword',
    name: 'Kiếm Cổ Runic (Runic Blade)',
    category: 'AD',
    cost: 2100,
    stats: { ad: 65, ap: 25 },
    iconCol: 2, iconRow: 3, // Glowing blue runic sword
    desc: '+65 Sát thương, +25 Sức mạnh phép. Đòn đánh và kỹ năng gây thêm sát thương xuyên thấu.'
  },
  {
    id: 'warhammer',
    name: 'Búa Chiến Gai Thép (Spiked Hammer)',
    category: 'AD',
    cost: 1500,
    stats: { ad: 40, hp: 200 },
    iconCol: 8, iconRow: 2, // Heavy spiked warhammer
    desc: '+40 Sát thương, +200 Máu tối đa. Tăng uy lực đập nát công trình và giáp đối thủ.'
  },
  {
    id: 'feather_wand',
    name: 'Huyết Kiếm Đoản Đao (Blood Dagger)',
    category: 'AD',
    cost: 1300,
    stats: { ad: 35, speed: 2.0 },
    iconCol: 5, iconRow: 3, // Red ribbon ceremonial blade
    desc: '+35 Sát thương, +2.0 Tốc độ chạy. Tăng độ cơ động khi truy đuổi đối thủ.'
  },

  // 2. SỨC MẠNH PHÉP THUẬT (Ability Power / AP)
  {
    id: 'golden_mask',
    name: 'Mặt Nạ Hoàng Kim (Golden Totem)',
    category: 'AP',
    cost: 2200,
    stats: { ap: 85, hp: 300, mana: 300 },
    iconCol: 8, iconRow: 1, // Golden Inca-style mask
    desc: '+85 Sức mạnh phép, +300 Máu, +300 Mana. Cường hóa toàn bộ chiêu thức phép thuật gây sát thương bùng nổ.'
  },
  {
    id: 'serpent_staff',
    name: 'Trượng Rắn Độc (Venom Staff)',
    category: 'AP',
    cost: 1800,
    stats: { ap: 65, lifesteal: 0.12 },
    iconCol: 1, iconRow: 3, // Golden snake head staff
    desc: '+65 Sức mạnh phép, +12% Hút máu phép. Kỹ năng trúng đích hồi lại lượng lớn sinh lực.'
  },
  {
    id: 'purple_prism',
    name: 'Pha Lê Cổ Học (Arcane Prism)',
    category: 'AP',
    cost: 1600,
    stats: { ap: 60, mana: 400 },
    iconCol: 7, iconRow: 0, // Glowing purple diamond relic
    desc: '+60 Sức mạnh phép, +400 Mana tối đa. Cung cấp nguồn năng lượng dồi dào để xả chiêu liên tục.'
  },
  {
    id: 'skull_amulet',
    name: 'Dây Chuyền Đầu Lâu (Skull Relic)',
    category: 'AP',
    cost: 1400,
    stats: { ap: 50, speed: 1.5 },
    iconCol: 2, iconRow: 2, // Dark purple skull collar
    desc: '+50 Sức mạnh phép, +1.5 Tốc độ di chuyển.'
  },

  // 3. PHÒNG THỦ & ĐỠ ĐÒN (Defense / Tank)
  {
    id: 'sun_shield',
    name: 'Khiên Mặt Trời Rực Cháy (Sun Aegis)',
    category: 'TANK',
    cost: 2000,
    stats: { hp: 550, armor: 45 },
    iconCol: 6, iconRow: 1, // Glowing sun medallion
    desc: '+550 Máu tối đa, +45 Giáp vật lý. Giảm mạnh sát thương nhận vào từ lính và trụ.'
  },
  {
    id: 'storm_shield',
    name: 'Khiên Lôi Thần (Storm Bulwark)',
    category: 'TANK',
    cost: 1900,
    stats: { hp: 450, armor: 50, mana: 250 },
    iconCol: 3, iconRow: 3, // Electric blue circular shield
    desc: '+450 Máu, +50 Giáp, +250 Mana. Biến bạn thành bức tường thành vững chắc trước hỏa lực địch.'
  },
  {
    id: 'gladiator_helm',
    name: 'Mũ Giáp Đấu Sĩ (Gladiator Helm)',
    category: 'TANK',
    cost: 1500,
    stats: { hp: 400, armor: 35 },
    iconCol: 8, iconRow: 3, // Golden spiked helmet
    desc: '+400 Máu, +35 Giáp. Bảo vệ vùng đầu trước các đòn chí mạng.'
  },
  {
    id: 'dragon_belt',
    name: 'Thắt Lưng Cự Long (Dragon Girdle)',
    category: 'TANK',
    cost: 1200,
    stats: { hp: 450 },
    iconCol: 3, iconRow: 2, // Ornate leather buckle
    desc: '+450 Máu tối đa. Gia tăng thể lực trực tiếp.'
  },

  // 4. GIÀY & CƠ ĐỘNG (Boots)
  {
    id: 'leather_boots',
    name: 'Giày Da Lữ Khách (Traveler Boots)',
    category: 'BOOTS',
    cost: 400,
    stats: { speed: 3.5 },
    iconCol: 5, iconRow: 1, // Leather lace boots
    desc: '+3.5 Tốc độ di chuyển cơ bản. Trang bị đầu game thiết yếu để đảo lane.'
  },
  {
    id: 'heavy_greaves',
    name: 'Ủng Sắt Thiết Giáp (Armored Greaves)',
    category: 'BOOTS',
    cost: 1100,
    stats: { speed: 5.0, armor: 25 },
    iconCol: 6, iconRow: 2, // High iron plate greaves
    desc: '+5.0 Tốc độ di chuyển, +25 Giáp. Lướt đi như gió và chống chịu tốt hơn.'
  },

  // 5. NGUYÊN TỐ & TIÊU HAO (Consumables)
  {
    id: 'health_potion',
    name: 'Bình Máu Thánh (Health Elixir)',
    category: 'CONSUMABLE',
    cost: 120,
    stats: {},
    iconCol: 1, iconRow: 1, // Green potion jar
    desc: 'Hồi phục 350 Máu lập tức. Có thể mua nhiều bình để duy trì trụ lane.'
  },
  {
    id: 'mana_potion',
    name: 'Bình Năng Lượng (Mana Elixir)',
    category: 'CONSUMABLE',
    cost: 100,
    stats: {},
    iconCol: 2, iconRow: 1, // Blue potion jar
    desc: 'Hồi phục 250 Mana lập tức. Phục hồi năng lượng khẩn cấp trong giao tranh.'
  }
];

export function getItemById(id) {
  return ITEMS_CATALOG.find(it => it.id === id);
}
