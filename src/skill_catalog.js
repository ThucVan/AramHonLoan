// League of Legends Iconic Skills Catalog
export const SKILL_CATALOG = {
  // 1. Xạ thủ (Marksmen) - 3 tướng có Ultimate toàn bản đồ
  MARKSMEN: [
    {
      id: 'ezreal_q',
      name: 'Phát Bắn Thần Bí',
      hero: 'Ezreal (Xạ Thủ)',
      icon: '⚡',
      type: 'basic',
      key: 'Q',
      cd: 2.2,
      mana: 35,
      desc: 'Bắn ra tia năng lượng tầm xa gây 240 sát thương và giảm 1.5s hồi mọi chiêu khác.'
    },
    {
      id: 'ezreal_e',
      name: 'Dịch Chuyển Cổ Học',
      hero: 'Ezreal (Xạ Thủ)',
      icon: '✨',
      type: 'basic',
      key: 'E',
      cd: 5.5,
      mana: 60,
      desc: 'Tức thời dịch chuyển tới vị trí chỉ định và bắn một tia năng lượng tự động tìm mục tiêu.'
    },
    {
      id: 'ezreal_r',
      name: 'Cung Ánh Sáng (Toàn Bản Đồ)',
      hero: 'Ezreal (Xạ Thủ)',
      icon: '🏹',
      type: 'ultimate',
      key: 'R',
      cd: 15.0,
      mana: 100,
      desc: 'Bắn ra một dải sóng hình cánh cung khổng lồ quét xuyên suốt toàn bộ bản đồ, gây 650 sát thương.'
    },
    {
      id: 'jinx_w',
      name: 'Giật Bắn!',
      hero: 'Jinx (Xạ Thủ)',
      icon: '🔫',
      type: 'basic',
      key: 'W',
      cd: 4.0,
      mana: 50,
      desc: 'Bắn tia điện tầm cực xa làm chậm 70% và gây 280 sát thương.'
    },
    {
      id: 'jinx_r',
      name: 'Tên Lửa Đạn Đạo (Toàn Bản Đồ)',
      hero: 'Jinx (Xạ Thủ)',
      icon: '🚀',
      type: 'ultimate',
      key: 'R',
      cd: 16.0,
      mana: 100,
      desc: 'Phóng quả tên lửa khổng lồ bay xuyên map, tăng dần tốc độ và nổ tung diện rộng gây đến 800 sát thương.'
    },
    {
      id: 'ashe_w',
      name: 'Tán Xạ Tiễn',
      hero: 'Ashe (Xạ Thủ)',
      icon: '❄️',
      type: 'basic',
      key: 'W',
      cd: 3.5,
      mana: 45,
      desc: 'Bắn ra hình nón gồm 7 mũi tên băng làm chậm và gây 220 sát thương.'
    },
    {
      id: 'ashe_r',
      name: 'Đại Băng Tiễn (Toàn Bản Đồ)',
      hero: 'Ashe (Xạ Thủ)',
      icon: '💎',
      type: 'ultimate',
      key: 'R',
      cd: 18.0,
      mana: 100,
      desc: 'Bắn một mũi tên pha lê băng khổng lồ bay toàn bản đồ, gây 700 sát thương và làm choáng diện rộng.'
    }
  ],

  // 2. Sát thủ đường giữa (Mid Assassins)
  ASSASSINS: [
    {
      id: 'zed_q',
      name: 'Phi Tiêu Sắc Lẻm',
      hero: 'Zed (Sát Thủ)',
      icon: '🗡️',
      type: 'basic',
      key: 'Q',
      cd: 3.0,
      mana: 30,
      desc: 'Phóng ra phi tiêu bóng tối xuyên phá mọi kẻ địch trên đường bay.'
    },
    {
      id: 'zed_w',
      name: 'Phân Thân Bóng Tối',
      hero: 'Zed (Sát Thủ)',
      icon: '👥',
      type: 'basic',
      key: 'W',
      cd: 6.0,
      mana: 40,
      desc: 'Tạo một phân thân bóng tối ở vị trí chỉ định và dịch chuyển tức thời tới đó.'
    },
    {
      id: 'zed_r',
      name: 'Dấu Ấn Tử Thần',
      hero: 'Zed (Sát Thủ)',
      icon: '☠️',
      type: 'ultimate',
      key: 'R',
      cd: 16.0,
      mana: 80,
      desc: 'Lướt ra sau lưng kẻ địch, khắc dấu ấn tử thần và kích nổ dồn sát thương cực lớn.'
    },
    {
      id: 'kat_e',
      name: 'Ám Sát (Shunpo)',
      hero: 'Katarina (Sát Thủ)',
      icon: '⚡',
      type: 'basic',
      key: 'E',
      cd: 3.0,
      mana: 0,
      desc: 'Tức thì dịch chuyển tới mục tiêu và chém ngay lập tức.'
    },
    {
      id: 'kat_r',
      name: 'Bông Sen Tử Thần',
      hero: 'Katarina (Sát Thủ)',
      icon: '🌪️',
      type: 'ultimate',
      key: 'R',
      cd: 14.0,
      mana: 0,
      desc: 'Xoay tròn như lốc xoáy phóng bão dao găm liên hoàn lên mọi kẻ địch xung quanh.'
    },
    {
      id: 'akali_e',
      name: 'Phóng Tinh Hoa',
      hero: 'Akali (Sát Thủ)',
      icon: '💨',
      type: 'basic',
      key: 'E',
      cd: 5.0,
      mana: 30,
      desc: 'Nhào lộn về phía sau phóng phi tiêu đánh dấu, tái kích hoạt lướt thẳng tới mục tiêu.'
    },
    {
      id: 'akali_r',
      name: 'Sát Chiêu Hoàn Hảo',
      hero: 'Akali (Sát Thủ)',
      icon: '⚔️',
      type: 'ultimate',
      key: 'R',
      cd: 15.0,
      mana: 80,
      desc: 'Lướt xuyên qua tướng địch gây sát thương kết liễu dựa trên lượng máu đã mất.'
    }
  ],

  // 3. Pháp sư đường giữa (Mid Mages)
  MAGES: [
    {
      id: 'lux_q',
      name: 'Khóa Ánh Sáng',
      hero: 'Lux (Pháp Sư)',
      icon: '✨',
      type: 'basic',
      key: 'Q',
      cd: 4.5,
      mana: 50,
      desc: 'Bắn một quả cầu ánh sáng trói chân 2 kẻ địch đầu tiên trúng phải.'
    },
    {
      id: 'lux_e',
      name: 'Quả Cầu Ánh Sáng',
      hero: 'Lux (Pháp Sư)',
      icon: '☀️',
      type: 'basic',
      key: 'E',
      cd: 5.0,
      mana: 65,
      desc: 'Thả vùng sáng làm chậm diện rộng, kích nổ gây 300 sát thương.'
    },
    {
      id: 'lux_r',
      name: 'Cầu Vồng Tối Thượng (Laser)',
      hero: 'Lux (Pháp Sư)',
      icon: '🌈',
      type: 'ultimate',
      key: 'R',
      cd: 12.0,
      mana: 100,
      desc: 'Bắn chùm tia laser ánh sáng khổng lồ xuyên qua toàn bộ kẻ địch theo một đường thẳng.'
    },
    {
      id: 'ahri_q',
      name: 'Quả Cầu Ma Thuật',
      hero: 'Ahri (Pháp Sư)',
      icon: '🔮',
      type: 'basic',
      key: 'Q',
      cd: 3.5,
      mana: 45,
      desc: 'Phóng quả cầu ma thuật bay đi và quay về, lượt về gây sát thương chuẩn.'
    },
    {
      id: 'ahri_e',
      name: 'Hôn Gió',
      hero: 'Ahri (Pháp Sư)',
      icon: '💖',
      type: 'basic',
      key: 'E',
      cd: 6.0,
      mana: 55,
      desc: 'Hôn gió phóng ra trái tim mê hoặc, khiến mục tiêu bước về phía bạn không thể tấn công.'
    },
    {
      id: 'syndra_e',
      name: 'Quét Tan Kẻ Yếu',
      hero: 'Syndra (Pháp Sư)',
      icon: '🟣',
      type: 'basic',
      key: 'E',
      cd: 6.0,
      mana: 60,
      desc: 'Đẩy lùi làn sóng năng lượng hất văng mọi kẻ địch và làm choáng.'
    }
  ],

  // 4. Đỡ đòn (Tanks)
  TANKS: [
    {
      id: 'malphite_q',
      name: 'Mảnh Vỡ Địa Chấn',
      hero: 'Malphite (Đỡ Đòn)',
      icon: '🪨',
      type: 'basic',
      key: 'Q',
      cd: 4.0,
      mana: 40,
      desc: 'Lăn một tảng đá cắp tốc độ di chuyển của địch cộng cho bản thân.'
    },
    {
      id: 'malphite_r',
      name: 'Không Thể Cản Phá (Húc Tung)',
      hero: 'Malphite (Đỡ Đòn)',
      icon: '💥',
      type: 'ultimate',
      key: 'R',
      cd: 15.0,
      mana: 100,
      desc: 'Lao tới vị trí chỉ định với tốc độ tên lửa, hất tung mọi kẻ địch trong vùng và gây 600 sát thương.'
    },
    {
      id: 'naut_q',
      name: 'Phóng Mỏ Neo',
      hero: 'Nautilus (Đỡ Đòn)',
      icon: '⚓',
      type: 'basic',
      key: 'Q',
      cd: 6.0,
      mana: 50,
      desc: 'Phóng mỏ neo khổng lồ kéo kẻ địch và bản thân áp sát lại gần nhau.'
    },
    {
      id: 'naut_w',
      name: 'Cơn Giận Của Titan',
      hero: 'Nautilus (Đỡ Đòn)',
      icon: '🛡️',
      type: 'basic',
      key: 'W',
      cd: 8.0,
      mana: 40,
      desc: 'Kích hoạt lớp giáp năng lượng bảo hộ hấp thụ 450 sát thương.'
    },
    {
      id: 'chogath_q',
      name: 'Rạn Nứt Băng Giá',
      hero: "Cho'Gath (Đỡ Đòn)",
      icon: '🌋',
      type: 'basic',
      key: 'Q',
      cd: 5.0,
      mana: 60,
      desc: 'Làm rạn nứt mặt đất hất tung kẻ địch lên không trung.'
    },
    {
      id: 'chogath_r',
      name: 'Xơi Tái',
      hero: "Cho'Gath (Đỡ Đòn)",
      icon: '🦖',
      type: 'ultimate',
      key: 'R',
      cd: 18.0,
      mana: 100,
      desc: 'Ngoạm một cú cực mạnh gây 750 sát thương chuẩn và tăng máu tối đa vĩnh viễn.'
    }
  ],

  // 5. Đấu sĩ (Fighters / Bruisers)
  FIGHTERS: [
    {
      id: 'yasuo_q',
      name: 'Bão Kiếm (Lốc Xoáy)',
      hero: 'Yasuo (Đấu Sĩ)',
      icon: '🌪️',
      type: 'basic',
      key: 'Q',
      cd: 2.0,
      mana: 0,
      desc: 'Đâm kiếm tới trước; lần đâm thứ 3 tạo cơn lốc xoáy hất tung toàn bộ kẻ địch.'
    },
    {
      id: 'yasuo_w',
      name: 'Tường Gió',
      hero: 'Yasuo (Đấu Sĩ)',
      icon: '🛡️',
      type: 'basic',
      key: 'W',
      cd: 10.0,
      mana: 0,
      desc: 'Dựng một bức tường gió ngăn chặn mọi đường đạn và kỹ năng tầm xa của kẻ địch.'
    },
    {
      id: 'yasuo_r',
      name: 'Trăn Trối',
      hero: 'Yasuo (Đấu Sĩ)',
      icon: '⚔️',
      type: 'ultimate',
      key: 'R',
      cd: 15.0,
      mana: 0,
      desc: 'Tức thời lướt tới các mục tiêu đang bị hất tung, giữ chúng trên không và chém liên hoàn.'
    },
    {
      id: 'darius_q',
      name: 'Tàn Sát',
      hero: 'Darius (Đấu Sĩ)',
      icon: '🪓',
      type: 'basic',
      key: 'Q',
      cd: 4.5,
      mana: 30,
      desc: 'Vung chiếc rìu theo vòng tròn, lưỡi rìu ngoài rìa gây sát thương lớn và hồi máu.'
    },
    {
      id: 'darius_e',
      name: 'Bắt Giữ',
      hero: 'Darius (Đấu Sĩ)',
      icon: '🪝',
      type: 'basic',
      key: 'E',
      cd: 7.0,
      mana: 40,
      desc: 'Quét lưỡi rìu kéo toàn bộ kẻ địch trước mặt về phía bạn.'
    },
    {
      id: 'darius_r',
      name: 'Máy Chém Noxus',
      hero: 'Darius (Đấu Sĩ)',
      icon: '🩸',
      type: 'ultimate',
      key: 'R',
      cd: 16.0,
      mana: 100,
      desc: 'Bật nhảy bổ thẳng rìu vào đầu đối thủ gây sát thương chuẩn khổng lồ.'
    }
  ]
};

// Flatten all basic skills and all ultimate skills
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
