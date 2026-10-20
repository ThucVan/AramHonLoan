
async function check() {
  const res = await fetch('https://modelviewer.lol/_astro/page.DHErIVMz.js');
  const text = await res.text();
  console.log(text.slice(0, 500));
  // Look for model url construction patterns
  const matches = text.match(/https:\/\/cdn\.modelviewer\.lol\/[^"'`\s]+/g) || [];
  console.log('CDN Matches:', matches.slice(0, 10));
}
check();
