
async function check() {
  const res = await fetch('https://modelviewer.lol/_astro/Canvas.astro_astro_type_script_index_0_lang.bolVz7kJ.js');
  const text = await res.text();
  console.log(text);
}
check();
