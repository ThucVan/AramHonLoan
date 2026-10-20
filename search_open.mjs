
async function search() {
  const urls = [
    'https://raw.githubusercontent.com/mrdoob/three.js/master/examples/models/gltf/Xbot.glb',
    'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Assets/main/Models/CesiumMan/glTF-Binary/CesiumMan.glb',
    'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Assets/main/Models/Fox/glTF-Binary/Fox.glb',
    'https://raw.githubusercontent.com/mrdoob/three.js/master/examples/models/gltf/LittlestTokyo.glb',
    'https://raw.githubusercontent.com/mrdoob/three.js/master/examples/models/gltf/Horse.glb'
  ];
  for (const u of urls) {
    try {
      const res = await fetch(u, { method: 'HEAD' });
      console.log(u.split('/').pop(), res.status, res.headers.get('content-length'));
    } catch(e) {}
  }
}
search();
