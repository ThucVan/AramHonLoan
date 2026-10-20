
async function check() {
  const res = await fetch('https://modelviewer.lol/model-viewer?group=lol&id=157000');
  const html = await res.text();
  console.log('HTML len:', html.length);
  const scripts = html.match(/src="[^"]+"/g);
  console.log('Scripts:', scripts);
}
check();
