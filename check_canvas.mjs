
async function check() {
  const res = await fetch('https://modelviewer.lol/_astro/Canvas.astro_astro_type_script_index_0_lang.bolVz7kJ.js');
  const text = await res.text();
  console.log('Canvas len:', text.length);
  const matches = text.match(/cdn\.modelviewer\.lol[^"'`\s]+/g) || [];
  console.log('CDN Matches in canvas:', matches);
  // Look for glb or model patterns
  const glbMatches = text.match(/\/[^"'`\s]+\.glb/g) || [];
  console.log('GLB Matches:', glbMatches);
}
check();
