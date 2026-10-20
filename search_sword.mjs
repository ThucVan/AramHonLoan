
async function search() {
  const urls = [
    'https://raw.githubusercontent.com/alecmce/threejs-sandbox/master/public/models/sword.glb',
    'https://raw.githubusercontent.com/pmndrs/drei-assets/master/models/sword.glb',
    'https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/models/gltf/sword.glb'
  ];
  for (const u of urls) {
    try {
      const res = await fetch(u, { method: 'HEAD' });
      console.log(u, res.status);
    } catch(e) {}
  }
}
search();
