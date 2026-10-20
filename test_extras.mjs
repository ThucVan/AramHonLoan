
async function check() {
  const res = await fetch('https://modelviewer.lol/extras');
  console.log('Extras status:', res.status);
  const html = await res.text();
  console.log('Extras length:', html.length);
  // find aliases or titles
  const matches = html.match(/\/model-viewer\?group=extras[^"']+/g) || [];
  console.log('Extras links found:', matches.slice(0, 20));
}
check();
