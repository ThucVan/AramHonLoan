
async function check() {
  const res = await fetch('https://modelviewer.lol/model-viewer?group=lol&id=157000');
  const html = await res.text();
  // Find script tags
  const inline = html.match(/<script[^>]*>[\s\S]*?<\/script>/g) || [];
  for (const s of inline) {
    if (s.includes('model.glb') || s.includes('cdn.modelviewer.lol') || s.includes('yasuo')) {
      console.log('Found relevant script:', s.slice(0, 400));
    }
  }
}
check();
