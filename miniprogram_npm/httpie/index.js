module.exports = (function() {
var __MODS__ = {};
var __DEFINE__ = function(modId, func, req) { var m = { exports: {}, _tempexports: {} }; __MODS__[modId] = { status: 0, func: func, req: req, m: m }; };
var __REQUIRE__ = function(modId, source) { if(!__MODS__[modId]) return require(source); if(!__MODS__[modId].status) { var m = __MODS__[modId].m; m._exports = m._tempexports; var desp = Object.getOwnPropertyDescriptor(m, "exports"); if (desp && desp.configurable) Object.defineProperty(m, "exports", { set: function (val) { if(typeof val === "object" && val !== m._exports) { m._exports.__proto__ = val.__proto__; Object.keys(val).forEach(function (k) { m._exports[k] = val[k]; }); } m._tempexports = val }, get: function () { return m._tempexports; } }); __MODS__[modId].status = 1; __MODS__[modId].func(__MODS__[modId].req, m, m.exports); } return __MODS__[modId].m.exports; };
var __REQUIRE_WILDCARD__ = function(obj) { if(obj && obj.__esModule) { return obj; } else { var newObj = {}; if(obj != null) { for(var k in obj) { if (Object.prototype.hasOwnProperty.call(obj, k)) newObj[k] = obj[k]; } } newObj.default = obj; return newObj; } };
var __REQUIRE_DEFAULT__ = function(obj) { return obj && obj.__esModule ? obj.default : obj; };
__DEFINE__(1617678486077, function(require, module, exports) {
const { request } = require('https');
const { globalAgent } = require('http');
const { parse, resolve } = require('url');

function toError(rej, res, err) {
	err = err || new Error(res.statusMessage);
	err.statusMessage = res.statusMessage;
	err.statusCode = res.statusCode;
	err.headers = res.headers;
	err.data = res.data;
	rej(err);
}

function send(method, uri, opts={}) {
	return new Promise((res, rej) => {
		let req, tmp, out = '';
		let { redirect=true } = opts;
		opts.method = method;

		if (uri && !!uri.toJSON) uri = uri.toJSON();
		Object.assign(opts, typeof uri === 'string' ? parse(uri) : uri);
		opts.agent = opts.protocol === 'http:' ? globalAgent : void 0;

		req = request(opts, rr => {
			if (rr.statusCode > 300 && redirect && rr.headers.location) {
				opts.path = resolve(opts.path, rr.headers.location);
				return send(method, opts.path.startsWith('/') ? opts : opts.path, opts).then(res, rej);
			}

			rr.on('data', d => {
				out += d;
			});

			rr.on('end', () => {
				tmp = rr.headers['content-type'];
				if (tmp && out && tmp.includes('application/json')) {
					try {
						out = JSON.parse(out, opts.reviver);
					} catch (err) {
						return toError(rej, rr, err);
					}
				}
				rr.data = out;
				if (rr.statusCode >= 400) {
					toError(rej, rr);
				} else {
					res(rr);
				}
			});
		});

		req.on('timeout', req.abort);
		req.on('error', err => {
			// Node 11.x ~> boolean, else timestamp
			err.timeout = req.aborted;
			rej(err);
		});

		if (opts.body) {
			tmp = typeof opts.body === 'object' && !Buffer.isBuffer(opts.body);
			tmp && req.setHeader('content-type', 'application/json');
			tmp = tmp ? JSON.stringify(opts.body) : opts.body;

			req.setHeader('content-length', Buffer.byteLength(tmp));
			req.write(tmp);
		}

		req.end();
	});
}

const get = /*#__PURE__*/ send.bind(send, 'GET');
const post = /*#__PURE__*/ send.bind(send, 'POST');
const patch = /*#__PURE__*/ send.bind(send, 'PATCH');
const del = /*#__PURE__*/ send.bind(send, 'DELETE');
const put = /*#__PURE__*/ send.bind(send, 'PUT');

exports.del = del;
exports.get = get;
exports.patch = patch;
exports.post = post;
exports.put = put;
exports.send = send;
}, function(modId) {var map = {}; return __REQUIRE__(map[modId], modId); })
return __REQUIRE__(1617678486077);
})()
//# sourceMappingURL=index.js.map