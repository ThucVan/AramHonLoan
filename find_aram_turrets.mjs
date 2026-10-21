import fs from 'fs';

async function main() {
  for (const alias of ['ha_ap_herotower', 'ha_ap_chaosturretshrine', 'ha_ap_bridgelanestatue', 'ha_ap_healthrelic']) {
    const res = await fetch(`https://modelviewer.lol/extras/${alias}`);
    const html = await res.text();
    console.log(`=== ${alias} ===`);
    const cardRe = /<a href="([^"]*model-viewer[^"]*)"[^>]*>([\s\S]*?)<\/a>/g;
    let m;
    while ((m = cardRe.exec(html)) !== null) {
      console.log('  ', m[2].replace(/<[^>]+>/g, '').trim(), '->', m[1]);
    }
  }
}

main().catch(console.error);
