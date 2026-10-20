
async function check() {
  const res = await fetch('https://modelviewer.lol/extras');
  const html = await res.text();
  const matches = html.match(/alias=([^&]+)&amp;id=([0-9]+)/g) || [];
  const unique = new Set(matches.map(m => m.replace('&amp;', '&')));
  console.log('Total extras entries:', unique.size);

  const keywords = ['minion', 'turret', 'tower', 'ha_', 'order', 'chaos', 'nexus', 'inhibitor', 'poro', 'ward'];
  const matched = Array.from(unique).filter(entry => keywords.some(k => entry.toLowerCase().includes(k)));
  console.log('Relevant matched:', matched);
}
check();
