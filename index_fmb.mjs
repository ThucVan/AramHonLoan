
async function check() {
  const res = await fetch('https://modelviewer.lol/_astro/index.FMB1xxwx.js');
  const text = await res.text();
  console.log(text);
}
check();
