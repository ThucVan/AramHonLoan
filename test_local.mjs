
async function test() {
  const t0 = Date.now();
  const res = await fetch('http://localhost:3000/models/yasuo.glb');
  console.log('Status:', res.status, 'Length:', res.headers.get('content-length'));
  const buf = await res.arrayBuffer();
  console.log('Fetched in', Date.now() - t0, 'ms. Bytes:', buf.byteLength);
}
test();
