module.exports = (function() {
var __MODS__ = {};
var __DEFINE__ = function(modId, func, req) { var m = { exports: {}, _tempexports: {} }; __MODS__[modId] = { status: 0, func: func, req: req, m: m }; };
var __REQUIRE__ = function(modId, source) { if(!__MODS__[modId]) return require(source); if(!__MODS__[modId].status) { var m = __MODS__[modId].m; m._exports = m._tempexports; var desp = Object.getOwnPropertyDescriptor(m, "exports"); if (desp && desp.configurable) Object.defineProperty(m, "exports", { set: function (val) { if(typeof val === "object" && val !== m._exports) { m._exports.__proto__ = val.__proto__; Object.keys(val).forEach(function (k) { m._exports[k] = val[k]; }); } m._tempexports = val }, get: function () { return m._tempexports; } }); __MODS__[modId].status = 1; __MODS__[modId].func(__MODS__[modId].req, m, m.exports); } return __MODS__[modId].m.exports; };
var __REQUIRE_WILDCARD__ = function(obj) { if(obj && obj.__esModule) { return obj; } else { var newObj = {}; if(obj != null) { for(var k in obj) { if (Object.prototype.hasOwnProperty.call(obj, k)) newObj[k] = obj[k]; } } newObj.default = obj; return newObj; } };
var __REQUIRE_DEFAULT__ = function(obj) { return obj && obj.__esModule ? obj.default : obj; };
__DEFINE__(1617678486078, function(require, module, exports) {
exports.encode = require('./encode');
exports.decode = require('./decode');

}, function(modId) {var map = {"./encode":1617678486079,"./decode":1617678486080}; return __REQUIRE__(map[modId], modId); })
__DEFINE__(1617678486079, function(require, module, exports) {


const MICRO_OPT_LEN = 32;

// Faster for short strings than buffer.write
function utf8Write(arr, offset, str) {
  let c = 0;
  for (let i = 0, l = str.length; i < l; i++) {
    c = str.charCodeAt(i);
    if (c < 0x80) {
      arr[offset++] = c;
    } else if (c < 0x800) {
      arr[offset++] = 0xc0 | (c >> 6);
      arr[offset++] = 0x80 | (c & 0x3f);
    } else if (c < 0xd800 || c >= 0xe000) {
      arr[offset++] = 0xe0 | (c >> 12);
      arr[offset++] = 0x80 | (c >> 6) & 0x3f;
      arr[offset++] = 0x80 | (c & 0x3f);
    } else {
      i++;
      c = 0x10000 + (((c & 0x3ff) << 10) | (str.charCodeAt(i) & 0x3ff));
      arr[offset++] = 0xf0 | (c >> 18);
      arr[offset++] = 0x80 | (c >> 12) & 0x3f;
      arr[offset++] = 0x80 | (c >> 6) & 0x3f;
      arr[offset++] = 0x80 | (c & 0x3f);
    }
  }
}

// Faster for short strings than Buffer.byteLength
function utf8Length(str) {
  let c = 0, length = 0;
  for (let i = 0, l = str.length; i < l; i++) {
    c = str.charCodeAt(i);
    if (c < 0x80) {
      length += 1;
    } else if (c < 0x800) {
      length += 2;
    } else if (c < 0xd800 || c >= 0xe000) {
      length += 3;
    } else {
      i++;
      length += 4;
    }
  }
  return length;
}

const cache = new Map();
const cacheMaxSize = process.env.NOTEPACK_ENCODE_CACHE_MAX_SIZE || 1024;

/*jshint latedef: nofunc */
function encodeKey(bytes, defers, key) {
  if (cache.has(key)) {
    const buffer = cache.get(key);
    defers.push({ bin: buffer, length: buffer.length, offset: bytes.length });
    return buffer.length;
  }
  if (cache.size > cacheMaxSize) {
    return _encode(bytes, defers, key);
  }
  const keyBytes = [];
  const size = _encode(keyBytes, [], key);
  const keyBuffer = Buffer.allocUnsafe(size);
  for (let i = 0, l = keyBytes.length; i < l; i++) {
    keyBuffer[i] = keyBytes[i];
  }
  utf8Write(keyBuffer, keyBytes.length, key);
  defers.push({ bin: keyBuffer, length: size, offset: bytes.length });
  cache.set(key, keyBuffer);
  return size;
}

function _encode(bytes, defers, value) {
  let hi = 0, lo = 0, length = 0, size = 0;

  switch (typeof value) {
    case 'string':
      if (value.length > MICRO_OPT_LEN) {
        length = Buffer.byteLength(value);
      } else {
        length = utf8Length(value);
      }

      if (length < 0x20) { // fixstr
        bytes.push(length | 0xa0);
        size = 1;
      } else if (length < 0x100) { // str 8
        bytes.push(0xd9, length);
        size = 2;
      } else if (length < 0x10000) { // str 16
        bytes.push(0xda, length >> 8, length);
        size = 3;
      } else if (length < 0x100000000) { // str 32
        bytes.push(0xdb, length >> 24, length >> 16, length >> 8, length);
        size = 5;
      } else {
        throw new Error('String too long');
      }
      defers.push({ str: value, length: length, offset: bytes.length });
      return size + length;
    case 'number':
      // TODO: encode to float 32?

      if (Math.floor(value) !== value || !isFinite(value)) { // float 64
        bytes.push(0xcb);
        defers.push({ float: value, length: 8, offset: bytes.length });
        return 9;
      }

      if (value >= 0) {
        if (value < 0x80) { // positive fixnum
          bytes.push(value);
          return 1;
        }

        if (value < 0x100) { // uint 8
          bytes.push(0xcc, value);
          return 2;
        }

        if (value < 0x10000) { // uint 16
          bytes.push(0xcd, value >> 8, value);
          return 3;
        }

        if (value < 0x100000000) { // uint 32
          bytes.push(0xce, value >> 24, value >> 16, value >> 8, value);
          return 5;
        }
        // uint 64
        hi = (value / Math.pow(2, 32)) >> 0;
        lo = value >>> 0;
        bytes.push(0xcf, hi >> 24, hi >> 16, hi >> 8, hi, lo >> 24, lo >> 16, lo >> 8, lo);
        return 9;
      } else {

        if (value >= -0x20) { // negative fixnum
          bytes.push(value);
          return 1;
        }

        if (value >= -0x80) { // int 8
          bytes.push(0xd0, value);
          return 2;
        }

        if (value >= -0x8000) { // int 16
          bytes.push(0xd1, value >> 8, value);
          return 3;
        }

        if (value >= -0x80000000) { // int 32
          bytes.push(0xd2, value >> 24, value >> 16, value >> 8, value);
          return 5;
        }
        // int 64
        hi = Math.floor(value / Math.pow(2, 32));
        lo = value >>> 0;
        bytes.push(0xd3, hi >> 24, hi >> 16, hi >> 8, hi, lo >> 24, lo >> 16, lo >> 8, lo);
        return 9;
      }
      break;
    case 'object':
      // nil
      if (value === null) {
        bytes.push(0xc0);
        return 1;
      }

      if (Array.isArray(value)) {
        length = value.length;

        if (length < 0x10) { // fixarray
          bytes.push(length | 0x90);
          size = 1;
        } else if (length < 0x10000) { // array 16
          bytes.push(0xdc, length >> 8, length);
          size = 3;
        } else if (length < 0x100000000) { // array 32
          bytes.push(0xdd, length >> 24, length >> 16, length >> 8, length);
          size = 5;
        } else {
          throw new Error('Array too large');
        }
        for (let i = 0; i < length; i++) {
          size += _encode(bytes, defers, value[i]);
        }
        return size;
      }

      if (value instanceof Date) { // fixext 8 / Date
        const time = value.getTime();
        hi = Math.floor(time / Math.pow(2, 32));
        lo = time >>> 0;
        bytes.push(0xd7, 0, hi >> 24, hi >> 16, hi >> 8, hi, lo >> 24, lo >> 16, lo >> 8, lo);
        return 10;
      }

      if (value instanceof Buffer) {
        length = value.length;

        if (length < 0x100) { // bin 8
          bytes.push(0xc4, length);
          size = 2;
        } else if (length < 0x10000) { // bin 16
          bytes.push(0xc5, length >> 8, length);
          size = 3;
        } else if (length < 0x100000000) { // bin 32
          bytes.push(0xc6, length >> 24, length >> 16, length >> 8, length);
          size = 5;
        } else {
          throw new Error('Buffer too large');
        }
        defers.push({ bin: value, length: length, offset: bytes.length });
        return size + length;
      }

      if (value instanceof ArrayBuffer || ArrayBuffer.isView(value)) {
        const arraybuffer = value.buffer || value;
        length = arraybuffer.byteLength;

        // ext 8
        if (length < 0x100) {
          bytes.push(0xc7, length, 0);
          size = 3;
        } else if (length < 0x10000) { // ext 16
          bytes.push(0xc8, length >> 8, length, 0);
          size = 4;
        } else if (length < 0x100000000) { // ext 32
          bytes.push(0xc9, length >> 24, length >> 16, length >> 8, length, 0);
          size = 6;
        } else {
          throw new Error('ArrayBuffer too large');
        }
        defers.push({ arraybuffer: arraybuffer, length: length, offset: bytes.length });
        return size + length;
      }

      if (typeof value.toJSON === 'function') {
        return _encode(bytes, defers, value.toJSON());
      }

      const keys = [], allKeys = Object.keys(value);
      let key = '';

      for (let i = 0, l = allKeys.length; i < l; i++) {
        key = allKeys[i];
        if (typeof value[key] !== 'function') {
          keys.push(key);
        }
      }
      length = keys.length;

      if (length < 0x10) { // fixmap
        bytes.push(length | 0x80);
        size = 1;
      } else if (length < 0x10000) { // map 16
        bytes.push(0xde, length >> 8, length);
        size = 3;
      } else if (length < 0x100000000) { // map 32
        bytes.push(0xdf, length >> 24, length >> 16, length >> 8, length);
        size = 5;
      } else {
        throw new Error('Object too large');
      }

      for (let i = 0; i < length; i++) {
        key = keys[i];
        size += encodeKey(bytes, defers, key);
        size += _encode(bytes, defers, value[key]);
      }
      return size;
    case 'boolean': // false/true
      bytes.push(value ? 0xc3 : 0xc2);
      return 1;
    case 'undefined': // fixext 1 / undefined
      bytes.push(0xd4, 0, 0);
      return 3;
    default:
      throw new Error('Could not encode');
  }
}

function encode(value) {
  const bytes = [], defers = [], size = _encode(bytes, defers, value);
  const buf = Buffer.allocUnsafe(size);

  let deferIndex = 0, deferWritten = 0, nextOffset = -1;
  if (defers.length > 0) {
    nextOffset = defers[0].offset;
  }

  let defer, deferLength = 0, offset = 0;
  for (let i = 0, l = bytes.length; i < l; i++) {
    buf[deferWritten + i] = bytes[i];
    while (i + 1 === nextOffset) {
      defer = defers[deferIndex];
      deferLength = defer.length;
      offset = deferWritten + nextOffset;
      if (defer.bin) {
        if (deferLength > MICRO_OPT_LEN) {
          defer.bin.copy(buf, offset, 0, deferLength);
        } else {
          const bin = defer.bin;
          for (let j = 0; j < deferLength; j++) {
            buf[offset + j] = bin[j];
          }
        }
      } else if (defer.str) {
        if (deferLength > MICRO_OPT_LEN) {
          buf.write(defer.str, offset, deferLength, 'utf8');
        } else {
          utf8Write(buf, offset, defer.str);
        }
      } else if (defer.float !== undefined) {
        buf.writeDoubleBE(defer.float, offset);
      } else if (defer.arraybuffer) {
        const arr = new Uint8Array(defer.arraybuffer);
        for (let k = 0; k < deferLength; k++) {
          buf[offset + k] = arr[k];
        }
      }
      deferIndex++;
      deferWritten += deferLength;
      if (defers[deferIndex]) {
        nextOffset = defers[deferIndex].offset;
      } else {
        break;
      }
    }
  }
  return buf;
}

module.exports = encode;

}, function(modId) { var map = {}; return __REQUIRE__(map[modId], modId); })
__DEFINE__(1617678486080, function(require, module, exports) {


const DecodeKeyCache = require('./DecodeKeyCache');
const cache = new DecodeKeyCache();

function Decoder(buffer) {
  this.offset = 0;
  this.buffer = buffer;
  this.useKeyCache = false;
}

Decoder.prototype.array = function (length) {
  const value = new Array(length);
  for (let i = 0; i < length; i++) {
    value[i] = this.parse();
  }
  return value;
};

Decoder.prototype.map = function (length) {
  let key = '', value = {};
  for (let i = 0; i < length; i++) {
    this.useKeyCache = true;
    key = this.parse(true);
    this.useKeyCache = false;
    value[key] = this.parse();
  }
  return value;
};

Decoder.prototype.str = function (length) {
  if (this.useKeyCache) {
    const valueFromCache = cache.get(this.buffer, this.offset, length);
    if (valueFromCache) {
      this.offset += length;
      return valueFromCache;
    }
  }
  const value = this.buffer.toString('utf8', this.offset, this.offset + length);
  if (this.useKeyCache) {
    cache.set(this.buffer, this.offset, length, value);
  }
  this.offset += length;
  return value;
};

Decoder.prototype.bin = function (length) {
  const value = this.buffer.slice(this.offset, this.offset + length);
  this.offset += length;
  return value;
};

Decoder.prototype.arraybuffer = function (length) {
  const buffer = new ArrayBuffer(length);
  const view = new Uint8Array(buffer);
  for (let j = 0; j < length; j++) {
    view[j] = this.buffer[this.offset + j];
  }
  this.offset += length;
  return buffer;
};

Decoder.prototype.parse = function () {
  const prefix = this.buffer[this.offset++];
  let value, length = 0, type = 0, hi = 0, lo = 0;

  if (prefix < 0xc0) {
    // positive fixint
    if (prefix < 0x80) {
      return prefix;
    }
    // fixmap
    if (prefix < 0x90) {
      return this.map(prefix & 0x0f);
    }
    // fixarray
    if (prefix < 0xa0) {
      return this.array(prefix & 0x0f);
    }
    // fixstr
    return this.str(prefix & 0x1f);
  }

  // negative fixint
  if (prefix > 0xdf) {
    return (0xff - prefix + 1) * -1;
  }

  switch (prefix) {
    // nil
    case 0xc0:
      return null;
    // false
    case 0xc2:
      return false;
    // true
    case 0xc3:
      return true;

    // bin
    case 0xc4:
      length = this.buffer.readUInt8(this.offset);
      this.offset += 1;
      return this.bin(length);
    case 0xc5:
      length = this.buffer.readUInt16BE(this.offset);
      this.offset += 2;
      return this.bin(length);
    case 0xc6:
      length = this.buffer.readUInt32BE(this.offset);
      this.offset += 4;
      return this.bin(length);

    // ext
    case 0xc7:
      length = this.buffer.readUInt8(this.offset);
      type = this.buffer.readInt8(this.offset + 1);
      this.offset += 2;
      if (type === 0) { // ArrayBuffer
        return this.arraybuffer(length);
      }
      return [type, this.bin(length)];
    case 0xc8:
      length = this.buffer.readUInt16BE(this.offset);
      type = this.buffer.readInt8(this.offset + 2);
      this.offset += 3;
      if (type === 0) { // ArrayBuffer
        return this.arraybuffer(length);
      }
      return [type, this.bin(length)];
    case 0xc9:
      length = this.buffer.readUInt32BE(this.offset);
      type = this.buffer.readInt8(this.offset + 4);
      this.offset += 5;
      if (type === 0) { // ArrayBuffer
        return this.arraybuffer(length);
      }
      return [type, this.bin(length)];

    // float
    case 0xca:
      value = this.buffer.readFloatBE(this.offset);
      this.offset += 4;
      return value;
    case 0xcb:
      value = this.buffer.readDoubleBE(this.offset);
      this.offset += 8;
      return value;

    // uint
    case 0xcc:
      value = this.buffer.readUInt8(this.offset);
      this.offset += 1;
      return value;
    case 0xcd:
      value = this.buffer.readUInt16BE(this.offset);
      this.offset += 2;
      return value;
    case 0xce:
      value = this.buffer.readUInt32BE(this.offset);
      this.offset += 4;
      return value;
    case 0xcf:
      hi = this.buffer.readUInt32BE(this.offset) * Math.pow(2, 32);
      lo = this.buffer.readUInt32BE(this.offset + 4);
      this.offset += 8;
      return hi + lo;

    // int
    case 0xd0:
      value = this.buffer.readInt8(this.offset);
      this.offset += 1;
      return value;
    case 0xd1:
      value = this.buffer.readInt16BE(this.offset);
      this.offset += 2;
      return value;
    case 0xd2:
      value = this.buffer.readInt32BE(this.offset);
      this.offset += 4;
      return value;
    case 0xd3:
      hi = this.buffer.readInt32BE(this.offset) * Math.pow(2, 32);
      lo = this.buffer.readUInt32BE(this.offset + 4);
      this.offset += 8;
      return hi + lo;

    // fixext
    case 0xd4:
      type = this.buffer.readInt8(this.offset);
      this.offset += 1;
      if (type === 0x00) {
        this.offset += 1;
        return void 0;
      }
      return [type, this.bin(1)];
    case 0xd5:
      type = this.buffer.readInt8(this.offset);
      this.offset += 1;
      return [type, this.bin(2)];
    case 0xd6:
      type = this.buffer.readInt8(this.offset);
      this.offset += 1;
      return [type, this.bin(4)];
    case 0xd7:
      type = this.buffer.readInt8(this.offset);
      this.offset += 1;
      if (type === 0x00) {
        hi = this.buffer.readInt32BE(this.offset) * Math.pow(2, 32);
        lo = this.buffer.readUInt32BE(this.offset + 4);
        this.offset += 8;
        return new Date(hi + lo);
      }
      return [type, this.bin(8)];
    case 0xd8:
      type = this.buffer.readInt8(this.offset);
      this.offset += 1;
      return [type, this.bin(16)];

    // str
    case 0xd9:
      length = this.buffer.readUInt8(this.offset);
      this.offset += 1;
      return this.str(length);
    case 0xda:
      length = this.buffer.readUInt16BE(this.offset);
      this.offset += 2;
      return this.str(length);
    case 0xdb:
      length = this.buffer.readUInt32BE(this.offset);
      this.offset += 4;
      return this.str(length);

    // array
    case 0xdc:
      length = this.buffer.readUInt16BE(this.offset);
      this.offset += 2;
      return this.array(length);
    case 0xdd:
      length = this.buffer.readUInt32BE(this.offset);
      this.offset += 4;
      return this.array(length);

    // map
    case 0xde:
      length = this.buffer.readUInt16BE(this.offset);
      this.offset += 2;
      return this.map(length);
    case 0xdf:
      length = this.buffer.readUInt32BE(this.offset);
      this.offset += 4;
      return this.map(length);
  }

  throw new Error('Could not parse');
};

function decode(buffer) {
  const decoder = new Decoder(buffer);
  const value = decoder.parse();
  if (decoder.offset !== buffer.length) {
    throw new Error((buffer.length - decoder.offset) + ' trailing bytes');
  }
  return value;
}

module.exports = decode;

}, function(modId) { var map = {"./DecodeKeyCache":1617678486081}; return __REQUIRE__(map[modId], modId); })
__DEFINE__(1617678486081, function(require, module, exports) {
const DEFAULT_MAX_SIZE = process.env.NOTEPACK_DECODE_KEY_CACHE_MAX_SIZE || 1024;
const DEFAULT_MAX_LENGTH = process.env.NOTEPACK_DECODE_KEY_CACHE_MAX_LENGTH || 16;

/**
 * Store the buffer-to-string values in a tree
 */
class DecodeKeyCache {
  constructor({ maxSize = DEFAULT_MAX_SIZE, maxLength = DEFAULT_MAX_LENGTH } = {}) {
    this.size = 0;
    this.maxSize = maxSize;
    this.maxLength = maxLength;
    this.cache = new Map();
    for (let i = 1; i <= this.maxLength; i++) {
      this.cache.set(i, new Map());
    }
  }

  get(buffer, offset, length) {
    if (length > this.maxLength) { return false; }
    let node = this.cache.get(length);
    for (let i = 0; i < length; i++) {
      const byte = buffer[offset + i];
      if (node.has(byte)) {
        node = node.get(byte);
      } else {
        return false;
      }
    }
    return node;
  }

  set(buffer, offset, length, value) {
    if (length > this.maxLength || this.size >= this.maxSize) { return; }
    this.size++;
    let node = this.cache.get(length);
    for (let i = 0; i < length; i++) {
      const byte = buffer[offset + i];
      if (i === length - 1) {
        node.set(byte, value);
      } else if (node.has(byte)) {
        node = node.get(byte);
      } else {
        const newNode = new Map();
        node.set(byte, newNode);
        node = newNode;
      }
    }
  }
}

module.exports = DecodeKeyCache;

}, function(modId) { var map = {}; return __REQUIRE__(map[modId], modId); })
return __REQUIRE__(1617678486078);
})()
//# sourceMappingURL=index.js.map