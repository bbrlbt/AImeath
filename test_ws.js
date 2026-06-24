const net = require('net');

console.log('=== Test WebSocket Chat ===');

const sock = new net.Socket();
let startTime = Date.now();
let pollTimer = null;

sock.connect(3001, '127.0.0.1', () => {
  console.log('[connect] TCP OK');
  const key = Buffer.from('abcdefghijklmnop').toString('base64');
  sock.write([
    'GET / HTTP/1.1',
    'Host: localhost:3001',
    'Upgrade: websocket',
    'Connection: Upgrade',
    'Sec-WebSocket-Key: ' + key,
    'Sec-WebSocket-Version: 13',
    '', ''
  ].join('\r\n'));
});

let handshakeDone = false;
let rawData = Buffer.alloc(0);

sock.on('data', (data) => {
  rawData = Buffer.concat([rawData, data]);
  const str = rawData.toString('binary');
  
  if (!handshakeDone && str.includes('\r\n\r\n') && str.includes('101')) {
    const endOfHeaders = str.indexOf('\r\n\r\n') + 4;
    const headerBytes = Buffer.from(str.substring(0, endOfHeaders), 'binary').length;
    const leftover = rawData.slice(headerBytes);
    rawData = Buffer.alloc(0);
    handshakeDone = true;
    console.log('[upgrade] WebSocket handshake OK, sending message');
    
    const payload = JSON.stringify({ text: 'hi' });
    sock.write(buildMaskedFrame(payload));
    console.log('[send] ' + payload);
    
    if (leftover.length > 0) parseFrames(leftover);
    return;
  }
  
  if (handshakeDone) {
    parseFrames(data);
  }
});

let frameBuf = Buffer.alloc(0);
let streaming = false;

function parseFrames(data) {
  frameBuf = Buffer.concat([frameBuf, data]);
  
  while (frameBuf.length >= 2) {
    const opcode = frameBuf[0] & 0x0f;
    const masked = (frameBuf[1] & 0x80) !== 0;
    let len = frameBuf[1] & 0x7f;
    let offset = 2;
    
    if (len === 126) {
      if (frameBuf.length < 4) break;
      len = frameBuf.readUInt16BE(2);
      offset = 4;
    } else if (len === 127) {
      if (frameBuf.length < 10) break;
      len = Number(frameBuf.readBigUInt64BE(2));
      offset = 10;
    }
    
    const totalLen = offset + (masked ? 4 : 0) + len;
    if (frameBuf.length < totalLen) break;
    
    const frameBytes = frameBuf.slice(0, totalLen);
    frameBuf = frameBuf.slice(totalLen);
    
    if (opcode === 1) {
      let payload = frameBytes.slice(offset);
      if (masked) {
        const key = frameBytes.slice(offset, offset + 4);
        payload = frameBytes.slice(offset + 4);
        for (let i = 0; i < payload.length; i++) payload[i] ^= key[i % 4];
      }
      try {
        const obj = JSON.parse(payload.toString());
        const t = Date.now() - startTime;
        if (obj.type === 'stream_start') {
          console.log('[recv +' + t + 'ms] stream_start (starting poll)');
          streaming = true;
          pollTimer = setInterval(() => {
            if (sock.destroyed) return;
            const msg = JSON.stringify({ action: 'poll' });
            const f = buildMaskedFrame(msg);
            sock.write(f);
          }, 50);
        } else if (obj.type === 'stream_end') {
          console.log('[recv +' + t + 'ms] stream_end' + (obj.msg ? ' msg=' + obj.msg : ''));
          streaming = false;
          if (pollTimer) clearInterval(pollTimer);
          sock.destroy();
        } else if (obj.type === 'output') {
          console.log('[recv +' + t + 'ms] output text=' + JSON.stringify(obj.text).slice(0, 80));
        } else {
          console.log('[recv +' + t + 'ms]', obj.type, JSON.stringify(obj).slice(0, 120));
        }
      } catch(e) {
        console.log('[recv text]', payload.toString().slice(0, 200));
      }
    } else if (opcode === 8) {
      const code = len >= 2 ? frameBytes.readUInt16BE(offset + (masked ? 4 : 0)) : 0;
      const reason = frameBytes.slice(offset + (masked ? 4 : 0) + 2).toString();
      console.log('[recv close] code=' + code + ' reason=' + reason.slice(0, 80));
      sock.destroy();
    } else if (opcode === 9) {
      const pong = Buffer.alloc(frameBytes.length);
      frameBytes.copy(pong);
      pong[0] = (pong[0] & 0xf0) | 0x0a;
      sock.write(pong);
    } else {
      console.log('[recv opcode=' + opcode + '] len=' + len);
    }
  }
}

function buildMaskedFrame(payload) {
  const msg = Buffer.from(payload, 'utf8');
  const header = Buffer.alloc(2);
  header[0] = 0x81;
  header[1] = msg.length | 0x80;
  const mask = Buffer.alloc(4);
  for (let i = 0; i < 4; i++) mask[i] = Math.floor(Math.random() * 256);
  const masked = Buffer.alloc(msg.length);
  for (let i = 0; i < msg.length; i++) masked[i] = msg[i] ^ mask[i % 4];
  return Buffer.concat([header, mask, masked]);
}

sock.on('error', (err) => console.log('[error]', err.message));
sock.on('close', () => {
  if (pollTimer) clearInterval(pollTimer);
  console.log('[close] elapsed=' + (Date.now() - startTime) + 'ms');
  process.exit(streaming ? 1 : 0);
});

setTimeout(() => { 
  console.log('[timeout 15s] streaming=' + streaming); 
  process.exit(1); 
}, 15000);
