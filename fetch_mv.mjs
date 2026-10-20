
async function check() {
  try {
    const res = await fetch('https://modelviewer.lol/');
    console.log('Status:', res.status);
    const html = await res.text();
    console.log('Length:', html.length);
    const scripts = html.match(/src="[^"]+"/g);
    console.log('Scripts:', scripts);
  } catch(e) {
    console.error(e);
  }
}
check();
