require=(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
function _defineProperty(obj, key, value) {
  if (key in obj) {
    Object.defineProperty(obj, key, {
      value: value,
      enumerable: true,
      configurable: true,
      writable: true
    });
  } else {
    obj[key] = value;
  }

  return obj;
}

module.exports = _defineProperty, module.exports.__esModule = true, module.exports["default"] = module.exports;
},{}],2:[function(require,module,exports){
var defineProperty = require("./defineProperty.js");

function ownKeys(object, enumerableOnly) {
  var keys = Object.keys(object);

  if (Object.getOwnPropertySymbols) {
    var symbols = Object.getOwnPropertySymbols(object);
    enumerableOnly && (symbols = symbols.filter(function (sym) {
      return Object.getOwnPropertyDescriptor(object, sym).enumerable;
    })), keys.push.apply(keys, symbols);
  }

  return keys;
}

function _objectSpread2(target) {
  for (var i = 1; i < arguments.length; i++) {
    var source = null != arguments[i] ? arguments[i] : {};
    i % 2 ? ownKeys(Object(source), !0).forEach(function (key) {
      defineProperty(target, key, source[key]);
    }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)) : ownKeys(Object(source)).forEach(function (key) {
      Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key));
    });
  }

  return target;
}

module.exports = _objectSpread2, module.exports.__esModule = true, module.exports["default"] = module.exports;
},{"./defineProperty.js":1}],3:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticate = exports.signMessage = exports.generateCredentials = void 0;
const tweetnacl_1 = require("tweetnacl");
const tweetnacl_util_1 = require("tweetnacl-util");
/** Generate secure credentials to pass to boardgame.io. */
function generateCredentials() {
    return (0, tweetnacl_util_1.encodeBase64)((0, tweetnacl_1.randomBytes)(64));
}
exports.generateCredentials = generateCredentials;
/**
 * Verify that a signed message was signed by the given public key.
 * @param message Message signed by the client’s private key encoded as a base64 string.
 * @param publicKey Client’s public key encoded as a base64 string.
 * @param playerID playerID that the message is expected to decrypt to.
 * @returns `true` if the message is valid, `false` otherwise.
 */
function verifyMessage(message, publicKey, playerID) {
    try {
        const verifedMessage = tweetnacl_1.sign.open((0, tweetnacl_util_1.decodeBase64)(message), (0, tweetnacl_util_1.decodeBase64)(publicKey));
        return verifedMessage !== null && (0, tweetnacl_util_1.encodeUTF8)(verifedMessage) === playerID;
    }
    catch (error) {
        return false;
    }
}
/**
 * Sign and encode a message string with the given private key.
 * @param message utf8 string to be signed.
 * @param privateKey base64-encoded private key to sign the message with.
 * @returns Signed message encoded as a base64 string.
 */
function signMessage(message, privateKey) {
    return (0, tweetnacl_util_1.encodeBase64)((0, tweetnacl_1.sign)((0, tweetnacl_util_1.decodeUTF8)(message), (0, tweetnacl_util_1.decodeBase64)(privateKey)));
}
exports.signMessage = signMessage;
/**
 * Authenticate a client by comparing its metadata with the credentials
 * stored in the database for the given match.
 */
function authenticate(matchID, clientMetadata, db) {
    const { playerID, credentials, message } = clientMetadata;
    const { metadata } = db.fetch(matchID);
    // Spectators provide null/undefined playerIDs and don’t need authenticating.
    if (playerID === null ||
        playerID === undefined ||
        !(+playerID in metadata.players)) {
        return true;
    }
    const existingCredentials = metadata.players[+playerID].credentials;
    const isMessageValid = credentials
        ? !!message && verifyMessage(message, credentials, playerID)
        : false;
    // If no credentials exist yet for this player, store those
    // provided by the connecting client and authenticate.
    if (!existingCredentials && isMessageValid) {
        db.setMetadata(matchID, Object.assign(Object.assign({}, metadata), { players: Object.assign(Object.assign({}, metadata.players), { [+playerID]: Object.assign(Object.assign({}, metadata.players[+playerID]), { credentials }) }) }));
        return true;
    }
    // If credentials are neither provided nor stored, authenticate.
    if (!existingCredentials && !credentials)
        return true;
    // If credentials match, authenticate.
    if (existingCredentials &&
        existingCredentials === credentials &&
        isMessageValid) {
        return true;
    }
    return false;
}
exports.authenticate = authenticate;

},{"tweetnacl":6,"tweetnacl-util":43}],4:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.P2PDB = void 0;
const internal_1 = require("boardgame.io/internal");
/**
 * In-browser storage implementation for use by P2P hosts.
 *
 * Currently a simple in-memory store, but should be improved to provide
 * persistence across sessions using IndexedDB or similar.
 */
class P2PDB extends internal_1.Sync {
    constructor() {
        super(...arguments);
        this.initialState = new Map();
        this.state = new Map();
        this.log = new Map();
        this.metadata = new Map();
    }
    connect() {
        // Required by parent class interface.
    }
    createMatch(matchID, opts) {
        this.initialState.set(matchID, opts.initialState);
        this.state.set(matchID, opts.initialState);
        this.log.set(matchID, []);
        this.metadata.set(matchID, opts.metadata);
    }
    setState(matchID, state, deltalog) {
        this.state.set(matchID, state);
        if (deltalog) {
            this.log.set(matchID, [...(this.log.get(matchID) || []), ...deltalog]);
        }
    }
    setMetadata(matchID, metadata) {
        this.metadata.set(matchID, metadata);
    }
    fetch(matchID) {
        const res = {
            initialState: this.initialState.get(matchID),
            state: this.state.get(matchID),
            log: this.log.get(matchID),
            metadata: this.metadata.get(matchID),
        };
        return res;
    }
    wipe(matchID) {
        this.initialState.delete(matchID);
        this.state.delete(matchID);
        this.log.delete(matchID);
        this.metadata.delete(matchID);
    }
    listMatches() {
        return [...this.metadata.keys()];
    }
}
exports.P2PDB = P2PDB;

},{"boardgame.io/internal":13}],5:[function(require,module,exports){
"use strict";
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.P2PHost = void 0;
const internal_1 = require("boardgame.io/internal");
const master_1 = require("boardgame.io/master");
const db_1 = require("./db");
const authentication_1 = require("./authentication");
/**
 * Peer-to-peer host class, which runs a local `Master` instance
 * and sends authoritative state updates to all connected players.
 */
class P2PHost {
    constructor({ game, numPlayers = 2, matchID, }) {
        this.clients = new Map();
        this.matchID = matchID;
        if (!game.name || game.name === "default") {
            console.error('Using "default" as your game name.\n' +
                "Please set the `name` property of your game definition " +
                "to a unique string to help avoid peer ID conflicts.");
        }
        const match = (0, internal_1.createMatch)({
            game,
            numPlayers,
            unlisted: false,
            setupData: undefined,
        });
        if ("setupDataError" in match) {
            throw new Error("setupData Error: " + match.setupDataError);
        }
        this.db = new db_1.P2PDB();
        this.db.createMatch(this.matchID, match);
        const filterPlayerView = (0, internal_1.getFilterPlayerView)(game);
        this.master = new master_1.Master(game, this.db, {
            send: (_a) => {
                var { playerID } = _a, data = __rest(_a, ["playerID"]);
                const playerView = filterPlayerView(playerID, data);
                for (const [client] of this.clients) {
                    if (client.metadata.playerID === playerID)
                        client.send(playerView);
                }
            },
            sendAll: (data) => {
                for (const [client] of this.clients) {
                    const playerView = filterPlayerView(client.metadata.playerID, data);
                    client.send(playerView);
                }
            },
        });
    }
    /**
     * Add a client to the host’s registry.
     * The host calls the `send` method on registered clients to dispatch updates to them.
     */
    registerClient(client) {
        const isAuthenticated = this.authenticateClient(client);
        // If the client failed to authenticate, don’t register it.
        if (!isAuthenticated)
            return;
        const { playerID, credentials } = client.metadata;
        this.clients.set(client, client);
        this.master.onConnectionChange(this.matchID, playerID, credentials, true);
    }
    /**
     * Store a player’s credentials on initial connection and authenticate them subsequently.
     * @param client Client to authenticate.
     * @returns `true` if the client was successfully authenticated, `false` if it wasn’t.
     */
    authenticateClient(client) {
        return (0, authentication_1.authenticate)(this.matchID, client.metadata, this.db);
    }
    /** Remove a client from the host’s registry. */
    unregisterClient(client) {
        const { credentials, playerID } = client.metadata;
        this.clients.delete(client);
        this.master.onConnectionChange(this.matchID, playerID, credentials, false);
    }
    /** Submit an action to the host to be processed and emitted to registered clients. */
    processAction(data) {
        switch (data.type) {
            case "update":
                this.master.onUpdate(...data.args);
                break;
            case "chat":
                this.master.onChatMessage(...data.args);
                break;
            case "sync":
                this.master.onSync(...data.args);
                break;
        }
    }
}
exports.P2PHost = P2PHost;

},{"./authentication":3,"./db":4,"boardgame.io/internal":13,"boardgame.io/master":15}],6:[function(require,module,exports){
(function(nacl) {
'use strict';

// Ported in 2014 by Dmitry Chestnykh and Devi Mandiri.
// Public domain.
//
// Implementation derived from TweetNaCl version 20140427.
// See for details: http://tweetnacl.cr.yp.to/

var gf = function(init) {
  var i, r = new Float64Array(16);
  if (init) for (i = 0; i < init.length; i++) r[i] = init[i];
  return r;
};

//  Pluggable, initialized in high-level API below.
var randombytes = function(/* x, n */) { throw new Error('no PRNG'); };

var _0 = new Uint8Array(16);
var _9 = new Uint8Array(32); _9[0] = 9;

var gf0 = gf(),
    gf1 = gf([1]),
    _121665 = gf([0xdb41, 1]),
    D = gf([0x78a3, 0x1359, 0x4dca, 0x75eb, 0xd8ab, 0x4141, 0x0a4d, 0x0070, 0xe898, 0x7779, 0x4079, 0x8cc7, 0xfe73, 0x2b6f, 0x6cee, 0x5203]),
    D2 = gf([0xf159, 0x26b2, 0x9b94, 0xebd6, 0xb156, 0x8283, 0x149a, 0x00e0, 0xd130, 0xeef3, 0x80f2, 0x198e, 0xfce7, 0x56df, 0xd9dc, 0x2406]),
    X = gf([0xd51a, 0x8f25, 0x2d60, 0xc956, 0xa7b2, 0x9525, 0xc760, 0x692c, 0xdc5c, 0xfdd6, 0xe231, 0xc0a4, 0x53fe, 0xcd6e, 0x36d3, 0x2169]),
    Y = gf([0x6658, 0x6666, 0x6666, 0x6666, 0x6666, 0x6666, 0x6666, 0x6666, 0x6666, 0x6666, 0x6666, 0x6666, 0x6666, 0x6666, 0x6666, 0x6666]),
    I = gf([0xa0b0, 0x4a0e, 0x1b27, 0xc4ee, 0xe478, 0xad2f, 0x1806, 0x2f43, 0xd7a7, 0x3dfb, 0x0099, 0x2b4d, 0xdf0b, 0x4fc1, 0x2480, 0x2b83]);

function ts64(x, i, h, l) {
  x[i]   = (h >> 24) & 0xff;
  x[i+1] = (h >> 16) & 0xff;
  x[i+2] = (h >>  8) & 0xff;
  x[i+3] = h & 0xff;
  x[i+4] = (l >> 24)  & 0xff;
  x[i+5] = (l >> 16)  & 0xff;
  x[i+6] = (l >>  8)  & 0xff;
  x[i+7] = l & 0xff;
}

function vn(x, xi, y, yi, n) {
  var i,d = 0;
  for (i = 0; i < n; i++) d |= x[xi+i]^y[yi+i];
  return (1 & ((d - 1) >>> 8)) - 1;
}

function crypto_verify_16(x, xi, y, yi) {
  return vn(x,xi,y,yi,16);
}

function crypto_verify_32(x, xi, y, yi) {
  return vn(x,xi,y,yi,32);
}

function core_salsa20(o, p, k, c) {
  var j0  = c[ 0] & 0xff | (c[ 1] & 0xff)<<8 | (c[ 2] & 0xff)<<16 | (c[ 3] & 0xff)<<24,
      j1  = k[ 0] & 0xff | (k[ 1] & 0xff)<<8 | (k[ 2] & 0xff)<<16 | (k[ 3] & 0xff)<<24,
      j2  = k[ 4] & 0xff | (k[ 5] & 0xff)<<8 | (k[ 6] & 0xff)<<16 | (k[ 7] & 0xff)<<24,
      j3  = k[ 8] & 0xff | (k[ 9] & 0xff)<<8 | (k[10] & 0xff)<<16 | (k[11] & 0xff)<<24,
      j4  = k[12] & 0xff | (k[13] & 0xff)<<8 | (k[14] & 0xff)<<16 | (k[15] & 0xff)<<24,
      j5  = c[ 4] & 0xff | (c[ 5] & 0xff)<<8 | (c[ 6] & 0xff)<<16 | (c[ 7] & 0xff)<<24,
      j6  = p[ 0] & 0xff | (p[ 1] & 0xff)<<8 | (p[ 2] & 0xff)<<16 | (p[ 3] & 0xff)<<24,
      j7  = p[ 4] & 0xff | (p[ 5] & 0xff)<<8 | (p[ 6] & 0xff)<<16 | (p[ 7] & 0xff)<<24,
      j8  = p[ 8] & 0xff | (p[ 9] & 0xff)<<8 | (p[10] & 0xff)<<16 | (p[11] & 0xff)<<24,
      j9  = p[12] & 0xff | (p[13] & 0xff)<<8 | (p[14] & 0xff)<<16 | (p[15] & 0xff)<<24,
      j10 = c[ 8] & 0xff | (c[ 9] & 0xff)<<8 | (c[10] & 0xff)<<16 | (c[11] & 0xff)<<24,
      j11 = k[16] & 0xff | (k[17] & 0xff)<<8 | (k[18] & 0xff)<<16 | (k[19] & 0xff)<<24,
      j12 = k[20] & 0xff | (k[21] & 0xff)<<8 | (k[22] & 0xff)<<16 | (k[23] & 0xff)<<24,
      j13 = k[24] & 0xff | (k[25] & 0xff)<<8 | (k[26] & 0xff)<<16 | (k[27] & 0xff)<<24,
      j14 = k[28] & 0xff | (k[29] & 0xff)<<8 | (k[30] & 0xff)<<16 | (k[31] & 0xff)<<24,
      j15 = c[12] & 0xff | (c[13] & 0xff)<<8 | (c[14] & 0xff)<<16 | (c[15] & 0xff)<<24;

  var x0 = j0, x1 = j1, x2 = j2, x3 = j3, x4 = j4, x5 = j5, x6 = j6, x7 = j7,
      x8 = j8, x9 = j9, x10 = j10, x11 = j11, x12 = j12, x13 = j13, x14 = j14,
      x15 = j15, u;

  for (var i = 0; i < 20; i += 2) {
    u = x0 + x12 | 0;
    x4 ^= u<<7 | u>>>(32-7);
    u = x4 + x0 | 0;
    x8 ^= u<<9 | u>>>(32-9);
    u = x8 + x4 | 0;
    x12 ^= u<<13 | u>>>(32-13);
    u = x12 + x8 | 0;
    x0 ^= u<<18 | u>>>(32-18);

    u = x5 + x1 | 0;
    x9 ^= u<<7 | u>>>(32-7);
    u = x9 + x5 | 0;
    x13 ^= u<<9 | u>>>(32-9);
    u = x13 + x9 | 0;
    x1 ^= u<<13 | u>>>(32-13);
    u = x1 + x13 | 0;
    x5 ^= u<<18 | u>>>(32-18);

    u = x10 + x6 | 0;
    x14 ^= u<<7 | u>>>(32-7);
    u = x14 + x10 | 0;
    x2 ^= u<<9 | u>>>(32-9);
    u = x2 + x14 | 0;
    x6 ^= u<<13 | u>>>(32-13);
    u = x6 + x2 | 0;
    x10 ^= u<<18 | u>>>(32-18);

    u = x15 + x11 | 0;
    x3 ^= u<<7 | u>>>(32-7);
    u = x3 + x15 | 0;
    x7 ^= u<<9 | u>>>(32-9);
    u = x7 + x3 | 0;
    x11 ^= u<<13 | u>>>(32-13);
    u = x11 + x7 | 0;
    x15 ^= u<<18 | u>>>(32-18);

    u = x0 + x3 | 0;
    x1 ^= u<<7 | u>>>(32-7);
    u = x1 + x0 | 0;
    x2 ^= u<<9 | u>>>(32-9);
    u = x2 + x1 | 0;
    x3 ^= u<<13 | u>>>(32-13);
    u = x3 + x2 | 0;
    x0 ^= u<<18 | u>>>(32-18);

    u = x5 + x4 | 0;
    x6 ^= u<<7 | u>>>(32-7);
    u = x6 + x5 | 0;
    x7 ^= u<<9 | u>>>(32-9);
    u = x7 + x6 | 0;
    x4 ^= u<<13 | u>>>(32-13);
    u = x4 + x7 | 0;
    x5 ^= u<<18 | u>>>(32-18);

    u = x10 + x9 | 0;
    x11 ^= u<<7 | u>>>(32-7);
    u = x11 + x10 | 0;
    x8 ^= u<<9 | u>>>(32-9);
    u = x8 + x11 | 0;
    x9 ^= u<<13 | u>>>(32-13);
    u = x9 + x8 | 0;
    x10 ^= u<<18 | u>>>(32-18);

    u = x15 + x14 | 0;
    x12 ^= u<<7 | u>>>(32-7);
    u = x12 + x15 | 0;
    x13 ^= u<<9 | u>>>(32-9);
    u = x13 + x12 | 0;
    x14 ^= u<<13 | u>>>(32-13);
    u = x14 + x13 | 0;
    x15 ^= u<<18 | u>>>(32-18);
  }
   x0 =  x0 +  j0 | 0;
   x1 =  x1 +  j1 | 0;
   x2 =  x2 +  j2 | 0;
   x3 =  x3 +  j3 | 0;
   x4 =  x4 +  j4 | 0;
   x5 =  x5 +  j5 | 0;
   x6 =  x6 +  j6 | 0;
   x7 =  x7 +  j7 | 0;
   x8 =  x8 +  j8 | 0;
   x9 =  x9 +  j9 | 0;
  x10 = x10 + j10 | 0;
  x11 = x11 + j11 | 0;
  x12 = x12 + j12 | 0;
  x13 = x13 + j13 | 0;
  x14 = x14 + j14 | 0;
  x15 = x15 + j15 | 0;

  o[ 0] = x0 >>>  0 & 0xff;
  o[ 1] = x0 >>>  8 & 0xff;
  o[ 2] = x0 >>> 16 & 0xff;
  o[ 3] = x0 >>> 24 & 0xff;

  o[ 4] = x1 >>>  0 & 0xff;
  o[ 5] = x1 >>>  8 & 0xff;
  o[ 6] = x1 >>> 16 & 0xff;
  o[ 7] = x1 >>> 24 & 0xff;

  o[ 8] = x2 >>>  0 & 0xff;
  o[ 9] = x2 >>>  8 & 0xff;
  o[10] = x2 >>> 16 & 0xff;
  o[11] = x2 >>> 24 & 0xff;

  o[12] = x3 >>>  0 & 0xff;
  o[13] = x3 >>>  8 & 0xff;
  o[14] = x3 >>> 16 & 0xff;
  o[15] = x3 >>> 24 & 0xff;

  o[16] = x4 >>>  0 & 0xff;
  o[17] = x4 >>>  8 & 0xff;
  o[18] = x4 >>> 16 & 0xff;
  o[19] = x4 >>> 24 & 0xff;

  o[20] = x5 >>>  0 & 0xff;
  o[21] = x5 >>>  8 & 0xff;
  o[22] = x5 >>> 16 & 0xff;
  o[23] = x5 >>> 24 & 0xff;

  o[24] = x6 >>>  0 & 0xff;
  o[25] = x6 >>>  8 & 0xff;
  o[26] = x6 >>> 16 & 0xff;
  o[27] = x6 >>> 24 & 0xff;

  o[28] = x7 >>>  0 & 0xff;
  o[29] = x7 >>>  8 & 0xff;
  o[30] = x7 >>> 16 & 0xff;
  o[31] = x7 >>> 24 & 0xff;

  o[32] = x8 >>>  0 & 0xff;
  o[33] = x8 >>>  8 & 0xff;
  o[34] = x8 >>> 16 & 0xff;
  o[35] = x8 >>> 24 & 0xff;

  o[36] = x9 >>>  0 & 0xff;
  o[37] = x9 >>>  8 & 0xff;
  o[38] = x9 >>> 16 & 0xff;
  o[39] = x9 >>> 24 & 0xff;

  o[40] = x10 >>>  0 & 0xff;
  o[41] = x10 >>>  8 & 0xff;
  o[42] = x10 >>> 16 & 0xff;
  o[43] = x10 >>> 24 & 0xff;

  o[44] = x11 >>>  0 & 0xff;
  o[45] = x11 >>>  8 & 0xff;
  o[46] = x11 >>> 16 & 0xff;
  o[47] = x11 >>> 24 & 0xff;

  o[48] = x12 >>>  0 & 0xff;
  o[49] = x12 >>>  8 & 0xff;
  o[50] = x12 >>> 16 & 0xff;
  o[51] = x12 >>> 24 & 0xff;

  o[52] = x13 >>>  0 & 0xff;
  o[53] = x13 >>>  8 & 0xff;
  o[54] = x13 >>> 16 & 0xff;
  o[55] = x13 >>> 24 & 0xff;

  o[56] = x14 >>>  0 & 0xff;
  o[57] = x14 >>>  8 & 0xff;
  o[58] = x14 >>> 16 & 0xff;
  o[59] = x14 >>> 24 & 0xff;

  o[60] = x15 >>>  0 & 0xff;
  o[61] = x15 >>>  8 & 0xff;
  o[62] = x15 >>> 16 & 0xff;
  o[63] = x15 >>> 24 & 0xff;
}

function core_hsalsa20(o,p,k,c) {
  var j0  = c[ 0] & 0xff | (c[ 1] & 0xff)<<8 | (c[ 2] & 0xff)<<16 | (c[ 3] & 0xff)<<24,
      j1  = k[ 0] & 0xff | (k[ 1] & 0xff)<<8 | (k[ 2] & 0xff)<<16 | (k[ 3] & 0xff)<<24,
      j2  = k[ 4] & 0xff | (k[ 5] & 0xff)<<8 | (k[ 6] & 0xff)<<16 | (k[ 7] & 0xff)<<24,
      j3  = k[ 8] & 0xff | (k[ 9] & 0xff)<<8 | (k[10] & 0xff)<<16 | (k[11] & 0xff)<<24,
      j4  = k[12] & 0xff | (k[13] & 0xff)<<8 | (k[14] & 0xff)<<16 | (k[15] & 0xff)<<24,
      j5  = c[ 4] & 0xff | (c[ 5] & 0xff)<<8 | (c[ 6] & 0xff)<<16 | (c[ 7] & 0xff)<<24,
      j6  = p[ 0] & 0xff | (p[ 1] & 0xff)<<8 | (p[ 2] & 0xff)<<16 | (p[ 3] & 0xff)<<24,
      j7  = p[ 4] & 0xff | (p[ 5] & 0xff)<<8 | (p[ 6] & 0xff)<<16 | (p[ 7] & 0xff)<<24,
      j8  = p[ 8] & 0xff | (p[ 9] & 0xff)<<8 | (p[10] & 0xff)<<16 | (p[11] & 0xff)<<24,
      j9  = p[12] & 0xff | (p[13] & 0xff)<<8 | (p[14] & 0xff)<<16 | (p[15] & 0xff)<<24,
      j10 = c[ 8] & 0xff | (c[ 9] & 0xff)<<8 | (c[10] & 0xff)<<16 | (c[11] & 0xff)<<24,
      j11 = k[16] & 0xff | (k[17] & 0xff)<<8 | (k[18] & 0xff)<<16 | (k[19] & 0xff)<<24,
      j12 = k[20] & 0xff | (k[21] & 0xff)<<8 | (k[22] & 0xff)<<16 | (k[23] & 0xff)<<24,
      j13 = k[24] & 0xff | (k[25] & 0xff)<<8 | (k[26] & 0xff)<<16 | (k[27] & 0xff)<<24,
      j14 = k[28] & 0xff | (k[29] & 0xff)<<8 | (k[30] & 0xff)<<16 | (k[31] & 0xff)<<24,
      j15 = c[12] & 0xff | (c[13] & 0xff)<<8 | (c[14] & 0xff)<<16 | (c[15] & 0xff)<<24;

  var x0 = j0, x1 = j1, x2 = j2, x3 = j3, x4 = j4, x5 = j5, x6 = j6, x7 = j7,
      x8 = j8, x9 = j9, x10 = j10, x11 = j11, x12 = j12, x13 = j13, x14 = j14,
      x15 = j15, u;

  for (var i = 0; i < 20; i += 2) {
    u = x0 + x12 | 0;
    x4 ^= u<<7 | u>>>(32-7);
    u = x4 + x0 | 0;
    x8 ^= u<<9 | u>>>(32-9);
    u = x8 + x4 | 0;
    x12 ^= u<<13 | u>>>(32-13);
    u = x12 + x8 | 0;
    x0 ^= u<<18 | u>>>(32-18);

    u = x5 + x1 | 0;
    x9 ^= u<<7 | u>>>(32-7);
    u = x9 + x5 | 0;
    x13 ^= u<<9 | u>>>(32-9);
    u = x13 + x9 | 0;
    x1 ^= u<<13 | u>>>(32-13);
    u = x1 + x13 | 0;
    x5 ^= u<<18 | u>>>(32-18);

    u = x10 + x6 | 0;
    x14 ^= u<<7 | u>>>(32-7);
    u = x14 + x10 | 0;
    x2 ^= u<<9 | u>>>(32-9);
    u = x2 + x14 | 0;
    x6 ^= u<<13 | u>>>(32-13);
    u = x6 + x2 | 0;
    x10 ^= u<<18 | u>>>(32-18);

    u = x15 + x11 | 0;
    x3 ^= u<<7 | u>>>(32-7);
    u = x3 + x15 | 0;
    x7 ^= u<<9 | u>>>(32-9);
    u = x7 + x3 | 0;
    x11 ^= u<<13 | u>>>(32-13);
    u = x11 + x7 | 0;
    x15 ^= u<<18 | u>>>(32-18);

    u = x0 + x3 | 0;
    x1 ^= u<<7 | u>>>(32-7);
    u = x1 + x0 | 0;
    x2 ^= u<<9 | u>>>(32-9);
    u = x2 + x1 | 0;
    x3 ^= u<<13 | u>>>(32-13);
    u = x3 + x2 | 0;
    x0 ^= u<<18 | u>>>(32-18);

    u = x5 + x4 | 0;
    x6 ^= u<<7 | u>>>(32-7);
    u = x6 + x5 | 0;
    x7 ^= u<<9 | u>>>(32-9);
    u = x7 + x6 | 0;
    x4 ^= u<<13 | u>>>(32-13);
    u = x4 + x7 | 0;
    x5 ^= u<<18 | u>>>(32-18);

    u = x10 + x9 | 0;
    x11 ^= u<<7 | u>>>(32-7);
    u = x11 + x10 | 0;
    x8 ^= u<<9 | u>>>(32-9);
    u = x8 + x11 | 0;
    x9 ^= u<<13 | u>>>(32-13);
    u = x9 + x8 | 0;
    x10 ^= u<<18 | u>>>(32-18);

    u = x15 + x14 | 0;
    x12 ^= u<<7 | u>>>(32-7);
    u = x12 + x15 | 0;
    x13 ^= u<<9 | u>>>(32-9);
    u = x13 + x12 | 0;
    x14 ^= u<<13 | u>>>(32-13);
    u = x14 + x13 | 0;
    x15 ^= u<<18 | u>>>(32-18);
  }

  o[ 0] = x0 >>>  0 & 0xff;
  o[ 1] = x0 >>>  8 & 0xff;
  o[ 2] = x0 >>> 16 & 0xff;
  o[ 3] = x0 >>> 24 & 0xff;

  o[ 4] = x5 >>>  0 & 0xff;
  o[ 5] = x5 >>>  8 & 0xff;
  o[ 6] = x5 >>> 16 & 0xff;
  o[ 7] = x5 >>> 24 & 0xff;

  o[ 8] = x10 >>>  0 & 0xff;
  o[ 9] = x10 >>>  8 & 0xff;
  o[10] = x10 >>> 16 & 0xff;
  o[11] = x10 >>> 24 & 0xff;

  o[12] = x15 >>>  0 & 0xff;
  o[13] = x15 >>>  8 & 0xff;
  o[14] = x15 >>> 16 & 0xff;
  o[15] = x15 >>> 24 & 0xff;

  o[16] = x6 >>>  0 & 0xff;
  o[17] = x6 >>>  8 & 0xff;
  o[18] = x6 >>> 16 & 0xff;
  o[19] = x6 >>> 24 & 0xff;

  o[20] = x7 >>>  0 & 0xff;
  o[21] = x7 >>>  8 & 0xff;
  o[22] = x7 >>> 16 & 0xff;
  o[23] = x7 >>> 24 & 0xff;

  o[24] = x8 >>>  0 & 0xff;
  o[25] = x8 >>>  8 & 0xff;
  o[26] = x8 >>> 16 & 0xff;
  o[27] = x8 >>> 24 & 0xff;

  o[28] = x9 >>>  0 & 0xff;
  o[29] = x9 >>>  8 & 0xff;
  o[30] = x9 >>> 16 & 0xff;
  o[31] = x9 >>> 24 & 0xff;
}

function crypto_core_salsa20(out,inp,k,c) {
  core_salsa20(out,inp,k,c);
}

function crypto_core_hsalsa20(out,inp,k,c) {
  core_hsalsa20(out,inp,k,c);
}

var sigma = new Uint8Array([101, 120, 112, 97, 110, 100, 32, 51, 50, 45, 98, 121, 116, 101, 32, 107]);
            // "expand 32-byte k"

function crypto_stream_salsa20_xor(c,cpos,m,mpos,b,n,k) {
  var z = new Uint8Array(16), x = new Uint8Array(64);
  var u, i;
  for (i = 0; i < 16; i++) z[i] = 0;
  for (i = 0; i < 8; i++) z[i] = n[i];
  while (b >= 64) {
    crypto_core_salsa20(x,z,k,sigma);
    for (i = 0; i < 64; i++) c[cpos+i] = m[mpos+i] ^ x[i];
    u = 1;
    for (i = 8; i < 16; i++) {
      u = u + (z[i] & 0xff) | 0;
      z[i] = u & 0xff;
      u >>>= 8;
    }
    b -= 64;
    cpos += 64;
    mpos += 64;
  }
  if (b > 0) {
    crypto_core_salsa20(x,z,k,sigma);
    for (i = 0; i < b; i++) c[cpos+i] = m[mpos+i] ^ x[i];
  }
  return 0;
}

function crypto_stream_salsa20(c,cpos,b,n,k) {
  var z = new Uint8Array(16), x = new Uint8Array(64);
  var u, i;
  for (i = 0; i < 16; i++) z[i] = 0;
  for (i = 0; i < 8; i++) z[i] = n[i];
  while (b >= 64) {
    crypto_core_salsa20(x,z,k,sigma);
    for (i = 0; i < 64; i++) c[cpos+i] = x[i];
    u = 1;
    for (i = 8; i < 16; i++) {
      u = u + (z[i] & 0xff) | 0;
      z[i] = u & 0xff;
      u >>>= 8;
    }
    b -= 64;
    cpos += 64;
  }
  if (b > 0) {
    crypto_core_salsa20(x,z,k,sigma);
    for (i = 0; i < b; i++) c[cpos+i] = x[i];
  }
  return 0;
}

function crypto_stream(c,cpos,d,n,k) {
  var s = new Uint8Array(32);
  crypto_core_hsalsa20(s,n,k,sigma);
  var sn = new Uint8Array(8);
  for (var i = 0; i < 8; i++) sn[i] = n[i+16];
  return crypto_stream_salsa20(c,cpos,d,sn,s);
}

function crypto_stream_xor(c,cpos,m,mpos,d,n,k) {
  var s = new Uint8Array(32);
  crypto_core_hsalsa20(s,n,k,sigma);
  var sn = new Uint8Array(8);
  for (var i = 0; i < 8; i++) sn[i] = n[i+16];
  return crypto_stream_salsa20_xor(c,cpos,m,mpos,d,sn,s);
}

/*
* Port of Andrew Moon's Poly1305-donna-16. Public domain.
* https://github.com/floodyberry/poly1305-donna
*/

var poly1305 = function(key) {
  this.buffer = new Uint8Array(16);
  this.r = new Uint16Array(10);
  this.h = new Uint16Array(10);
  this.pad = new Uint16Array(8);
  this.leftover = 0;
  this.fin = 0;

  var t0, t1, t2, t3, t4, t5, t6, t7;

  t0 = key[ 0] & 0xff | (key[ 1] & 0xff) << 8; this.r[0] = ( t0                     ) & 0x1fff;
  t1 = key[ 2] & 0xff | (key[ 3] & 0xff) << 8; this.r[1] = ((t0 >>> 13) | (t1 <<  3)) & 0x1fff;
  t2 = key[ 4] & 0xff | (key[ 5] & 0xff) << 8; this.r[2] = ((t1 >>> 10) | (t2 <<  6)) & 0x1f03;
  t3 = key[ 6] & 0xff | (key[ 7] & 0xff) << 8; this.r[3] = ((t2 >>>  7) | (t3 <<  9)) & 0x1fff;
  t4 = key[ 8] & 0xff | (key[ 9] & 0xff) << 8; this.r[4] = ((t3 >>>  4) | (t4 << 12)) & 0x00ff;
  this.r[5] = ((t4 >>>  1)) & 0x1ffe;
  t5 = key[10] & 0xff | (key[11] & 0xff) << 8; this.r[6] = ((t4 >>> 14) | (t5 <<  2)) & 0x1fff;
  t6 = key[12] & 0xff | (key[13] & 0xff) << 8; this.r[7] = ((t5 >>> 11) | (t6 <<  5)) & 0x1f81;
  t7 = key[14] & 0xff | (key[15] & 0xff) << 8; this.r[8] = ((t6 >>>  8) | (t7 <<  8)) & 0x1fff;
  this.r[9] = ((t7 >>>  5)) & 0x007f;

  this.pad[0] = key[16] & 0xff | (key[17] & 0xff) << 8;
  this.pad[1] = key[18] & 0xff | (key[19] & 0xff) << 8;
  this.pad[2] = key[20] & 0xff | (key[21] & 0xff) << 8;
  this.pad[3] = key[22] & 0xff | (key[23] & 0xff) << 8;
  this.pad[4] = key[24] & 0xff | (key[25] & 0xff) << 8;
  this.pad[5] = key[26] & 0xff | (key[27] & 0xff) << 8;
  this.pad[6] = key[28] & 0xff | (key[29] & 0xff) << 8;
  this.pad[7] = key[30] & 0xff | (key[31] & 0xff) << 8;
};

poly1305.prototype.blocks = function(m, mpos, bytes) {
  var hibit = this.fin ? 0 : (1 << 11);
  var t0, t1, t2, t3, t4, t5, t6, t7, c;
  var d0, d1, d2, d3, d4, d5, d6, d7, d8, d9;

  var h0 = this.h[0],
      h1 = this.h[1],
      h2 = this.h[2],
      h3 = this.h[3],
      h4 = this.h[4],
      h5 = this.h[5],
      h6 = this.h[6],
      h7 = this.h[7],
      h8 = this.h[8],
      h9 = this.h[9];

  var r0 = this.r[0],
      r1 = this.r[1],
      r2 = this.r[2],
      r3 = this.r[3],
      r4 = this.r[4],
      r5 = this.r[5],
      r6 = this.r[6],
      r7 = this.r[7],
      r8 = this.r[8],
      r9 = this.r[9];

  while (bytes >= 16) {
    t0 = m[mpos+ 0] & 0xff | (m[mpos+ 1] & 0xff) << 8; h0 += ( t0                     ) & 0x1fff;
    t1 = m[mpos+ 2] & 0xff | (m[mpos+ 3] & 0xff) << 8; h1 += ((t0 >>> 13) | (t1 <<  3)) & 0x1fff;
    t2 = m[mpos+ 4] & 0xff | (m[mpos+ 5] & 0xff) << 8; h2 += ((t1 >>> 10) | (t2 <<  6)) & 0x1fff;
    t3 = m[mpos+ 6] & 0xff | (m[mpos+ 7] & 0xff) << 8; h3 += ((t2 >>>  7) | (t3 <<  9)) & 0x1fff;
    t4 = m[mpos+ 8] & 0xff | (m[mpos+ 9] & 0xff) << 8; h4 += ((t3 >>>  4) | (t4 << 12)) & 0x1fff;
    h5 += ((t4 >>>  1)) & 0x1fff;
    t5 = m[mpos+10] & 0xff | (m[mpos+11] & 0xff) << 8; h6 += ((t4 >>> 14) | (t5 <<  2)) & 0x1fff;
    t6 = m[mpos+12] & 0xff | (m[mpos+13] & 0xff) << 8; h7 += ((t5 >>> 11) | (t6 <<  5)) & 0x1fff;
    t7 = m[mpos+14] & 0xff | (m[mpos+15] & 0xff) << 8; h8 += ((t6 >>>  8) | (t7 <<  8)) & 0x1fff;
    h9 += ((t7 >>> 5)) | hibit;

    c = 0;

    d0 = c;
    d0 += h0 * r0;
    d0 += h1 * (5 * r9);
    d0 += h2 * (5 * r8);
    d0 += h3 * (5 * r7);
    d0 += h4 * (5 * r6);
    c = (d0 >>> 13); d0 &= 0x1fff;
    d0 += h5 * (5 * r5);
    d0 += h6 * (5 * r4);
    d0 += h7 * (5 * r3);
    d0 += h8 * (5 * r2);
    d0 += h9 * (5 * r1);
    c += (d0 >>> 13); d0 &= 0x1fff;

    d1 = c;
    d1 += h0 * r1;
    d1 += h1 * r0;
    d1 += h2 * (5 * r9);
    d1 += h3 * (5 * r8);
    d1 += h4 * (5 * r7);
    c = (d1 >>> 13); d1 &= 0x1fff;
    d1 += h5 * (5 * r6);
    d1 += h6 * (5 * r5);
    d1 += h7 * (5 * r4);
    d1 += h8 * (5 * r3);
    d1 += h9 * (5 * r2);
    c += (d1 >>> 13); d1 &= 0x1fff;

    d2 = c;
    d2 += h0 * r2;
    d2 += h1 * r1;
    d2 += h2 * r0;
    d2 += h3 * (5 * r9);
    d2 += h4 * (5 * r8);
    c = (d2 >>> 13); d2 &= 0x1fff;
    d2 += h5 * (5 * r7);
    d2 += h6 * (5 * r6);
    d2 += h7 * (5 * r5);
    d2 += h8 * (5 * r4);
    d2 += h9 * (5 * r3);
    c += (d2 >>> 13); d2 &= 0x1fff;

    d3 = c;
    d3 += h0 * r3;
    d3 += h1 * r2;
    d3 += h2 * r1;
    d3 += h3 * r0;
    d3 += h4 * (5 * r9);
    c = (d3 >>> 13); d3 &= 0x1fff;
    d3 += h5 * (5 * r8);
    d3 += h6 * (5 * r7);
    d3 += h7 * (5 * r6);
    d3 += h8 * (5 * r5);
    d3 += h9 * (5 * r4);
    c += (d3 >>> 13); d3 &= 0x1fff;

    d4 = c;
    d4 += h0 * r4;
    d4 += h1 * r3;
    d4 += h2 * r2;
    d4 += h3 * r1;
    d4 += h4 * r0;
    c = (d4 >>> 13); d4 &= 0x1fff;
    d4 += h5 * (5 * r9);
    d4 += h6 * (5 * r8);
    d4 += h7 * (5 * r7);
    d4 += h8 * (5 * r6);
    d4 += h9 * (5 * r5);
    c += (d4 >>> 13); d4 &= 0x1fff;

    d5 = c;
    d5 += h0 * r5;
    d5 += h1 * r4;
    d5 += h2 * r3;
    d5 += h3 * r2;
    d5 += h4 * r1;
    c = (d5 >>> 13); d5 &= 0x1fff;
    d5 += h5 * r0;
    d5 += h6 * (5 * r9);
    d5 += h7 * (5 * r8);
    d5 += h8 * (5 * r7);
    d5 += h9 * (5 * r6);
    c += (d5 >>> 13); d5 &= 0x1fff;

    d6 = c;
    d6 += h0 * r6;
    d6 += h1 * r5;
    d6 += h2 * r4;
    d6 += h3 * r3;
    d6 += h4 * r2;
    c = (d6 >>> 13); d6 &= 0x1fff;
    d6 += h5 * r1;
    d6 += h6 * r0;
    d6 += h7 * (5 * r9);
    d6 += h8 * (5 * r8);
    d6 += h9 * (5 * r7);
    c += (d6 >>> 13); d6 &= 0x1fff;

    d7 = c;
    d7 += h0 * r7;
    d7 += h1 * r6;
    d7 += h2 * r5;
    d7 += h3 * r4;
    d7 += h4 * r3;
    c = (d7 >>> 13); d7 &= 0x1fff;
    d7 += h5 * r2;
    d7 += h6 * r1;
    d7 += h7 * r0;
    d7 += h8 * (5 * r9);
    d7 += h9 * (5 * r8);
    c += (d7 >>> 13); d7 &= 0x1fff;

    d8 = c;
    d8 += h0 * r8;
    d8 += h1 * r7;
    d8 += h2 * r6;
    d8 += h3 * r5;
    d8 += h4 * r4;
    c = (d8 >>> 13); d8 &= 0x1fff;
    d8 += h5 * r3;
    d8 += h6 * r2;
    d8 += h7 * r1;
    d8 += h8 * r0;
    d8 += h9 * (5 * r9);
    c += (d8 >>> 13); d8 &= 0x1fff;

    d9 = c;
    d9 += h0 * r9;
    d9 += h1 * r8;
    d9 += h2 * r7;
    d9 += h3 * r6;
    d9 += h4 * r5;
    c = (d9 >>> 13); d9 &= 0x1fff;
    d9 += h5 * r4;
    d9 += h6 * r3;
    d9 += h7 * r2;
    d9 += h8 * r1;
    d9 += h9 * r0;
    c += (d9 >>> 13); d9 &= 0x1fff;

    c = (((c << 2) + c)) | 0;
    c = (c + d0) | 0;
    d0 = c & 0x1fff;
    c = (c >>> 13);
    d1 += c;

    h0 = d0;
    h1 = d1;
    h2 = d2;
    h3 = d3;
    h4 = d4;
    h5 = d5;
    h6 = d6;
    h7 = d7;
    h8 = d8;
    h9 = d9;

    mpos += 16;
    bytes -= 16;
  }
  this.h[0] = h0;
  this.h[1] = h1;
  this.h[2] = h2;
  this.h[3] = h3;
  this.h[4] = h4;
  this.h[5] = h5;
  this.h[6] = h6;
  this.h[7] = h7;
  this.h[8] = h8;
  this.h[9] = h9;
};

poly1305.prototype.finish = function(mac, macpos) {
  var g = new Uint16Array(10);
  var c, mask, f, i;

  if (this.leftover) {
    i = this.leftover;
    this.buffer[i++] = 1;
    for (; i < 16; i++) this.buffer[i] = 0;
    this.fin = 1;
    this.blocks(this.buffer, 0, 16);
  }

  c = this.h[1] >>> 13;
  this.h[1] &= 0x1fff;
  for (i = 2; i < 10; i++) {
    this.h[i] += c;
    c = this.h[i] >>> 13;
    this.h[i] &= 0x1fff;
  }
  this.h[0] += (c * 5);
  c = this.h[0] >>> 13;
  this.h[0] &= 0x1fff;
  this.h[1] += c;
  c = this.h[1] >>> 13;
  this.h[1] &= 0x1fff;
  this.h[2] += c;

  g[0] = this.h[0] + 5;
  c = g[0] >>> 13;
  g[0] &= 0x1fff;
  for (i = 1; i < 10; i++) {
    g[i] = this.h[i] + c;
    c = g[i] >>> 13;
    g[i] &= 0x1fff;
  }
  g[9] -= (1 << 13);

  mask = (c ^ 1) - 1;
  for (i = 0; i < 10; i++) g[i] &= mask;
  mask = ~mask;
  for (i = 0; i < 10; i++) this.h[i] = (this.h[i] & mask) | g[i];

  this.h[0] = ((this.h[0]       ) | (this.h[1] << 13)                    ) & 0xffff;
  this.h[1] = ((this.h[1] >>>  3) | (this.h[2] << 10)                    ) & 0xffff;
  this.h[2] = ((this.h[2] >>>  6) | (this.h[3] <<  7)                    ) & 0xffff;
  this.h[3] = ((this.h[3] >>>  9) | (this.h[4] <<  4)                    ) & 0xffff;
  this.h[4] = ((this.h[4] >>> 12) | (this.h[5] <<  1) | (this.h[6] << 14)) & 0xffff;
  this.h[5] = ((this.h[6] >>>  2) | (this.h[7] << 11)                    ) & 0xffff;
  this.h[6] = ((this.h[7] >>>  5) | (this.h[8] <<  8)                    ) & 0xffff;
  this.h[7] = ((this.h[8] >>>  8) | (this.h[9] <<  5)                    ) & 0xffff;

  f = this.h[0] + this.pad[0];
  this.h[0] = f & 0xffff;
  for (i = 1; i < 8; i++) {
    f = (((this.h[i] + this.pad[i]) | 0) + (f >>> 16)) | 0;
    this.h[i] = f & 0xffff;
  }

  mac[macpos+ 0] = (this.h[0] >>> 0) & 0xff;
  mac[macpos+ 1] = (this.h[0] >>> 8) & 0xff;
  mac[macpos+ 2] = (this.h[1] >>> 0) & 0xff;
  mac[macpos+ 3] = (this.h[1] >>> 8) & 0xff;
  mac[macpos+ 4] = (this.h[2] >>> 0) & 0xff;
  mac[macpos+ 5] = (this.h[2] >>> 8) & 0xff;
  mac[macpos+ 6] = (this.h[3] >>> 0) & 0xff;
  mac[macpos+ 7] = (this.h[3] >>> 8) & 0xff;
  mac[macpos+ 8] = (this.h[4] >>> 0) & 0xff;
  mac[macpos+ 9] = (this.h[4] >>> 8) & 0xff;
  mac[macpos+10] = (this.h[5] >>> 0) & 0xff;
  mac[macpos+11] = (this.h[5] >>> 8) & 0xff;
  mac[macpos+12] = (this.h[6] >>> 0) & 0xff;
  mac[macpos+13] = (this.h[6] >>> 8) & 0xff;
  mac[macpos+14] = (this.h[7] >>> 0) & 0xff;
  mac[macpos+15] = (this.h[7] >>> 8) & 0xff;
};

poly1305.prototype.update = function(m, mpos, bytes) {
  var i, want;

  if (this.leftover) {
    want = (16 - this.leftover);
    if (want > bytes)
      want = bytes;
    for (i = 0; i < want; i++)
      this.buffer[this.leftover + i] = m[mpos+i];
    bytes -= want;
    mpos += want;
    this.leftover += want;
    if (this.leftover < 16)
      return;
    this.blocks(this.buffer, 0, 16);
    this.leftover = 0;
  }

  if (bytes >= 16) {
    want = bytes - (bytes % 16);
    this.blocks(m, mpos, want);
    mpos += want;
    bytes -= want;
  }

  if (bytes) {
    for (i = 0; i < bytes; i++)
      this.buffer[this.leftover + i] = m[mpos+i];
    this.leftover += bytes;
  }
};

function crypto_onetimeauth(out, outpos, m, mpos, n, k) {
  var s = new poly1305(k);
  s.update(m, mpos, n);
  s.finish(out, outpos);
  return 0;
}

function crypto_onetimeauth_verify(h, hpos, m, mpos, n, k) {
  var x = new Uint8Array(16);
  crypto_onetimeauth(x,0,m,mpos,n,k);
  return crypto_verify_16(h,hpos,x,0);
}

function crypto_secretbox(c,m,d,n,k) {
  var i;
  if (d < 32) return -1;
  crypto_stream_xor(c,0,m,0,d,n,k);
  crypto_onetimeauth(c, 16, c, 32, d - 32, c);
  for (i = 0; i < 16; i++) c[i] = 0;
  return 0;
}

function crypto_secretbox_open(m,c,d,n,k) {
  var i;
  var x = new Uint8Array(32);
  if (d < 32) return -1;
  crypto_stream(x,0,32,n,k);
  if (crypto_onetimeauth_verify(c, 16,c, 32,d - 32,x) !== 0) return -1;
  crypto_stream_xor(m,0,c,0,d,n,k);
  for (i = 0; i < 32; i++) m[i] = 0;
  return 0;
}

function set25519(r, a) {
  var i;
  for (i = 0; i < 16; i++) r[i] = a[i]|0;
}

function car25519(o) {
  var i, v, c = 1;
  for (i = 0; i < 16; i++) {
    v = o[i] + c + 65535;
    c = Math.floor(v / 65536);
    o[i] = v - c * 65536;
  }
  o[0] += c-1 + 37 * (c-1);
}

function sel25519(p, q, b) {
  var t, c = ~(b-1);
  for (var i = 0; i < 16; i++) {
    t = c & (p[i] ^ q[i]);
    p[i] ^= t;
    q[i] ^= t;
  }
}

function pack25519(o, n) {
  var i, j, b;
  var m = gf(), t = gf();
  for (i = 0; i < 16; i++) t[i] = n[i];
  car25519(t);
  car25519(t);
  car25519(t);
  for (j = 0; j < 2; j++) {
    m[0] = t[0] - 0xffed;
    for (i = 1; i < 15; i++) {
      m[i] = t[i] - 0xffff - ((m[i-1]>>16) & 1);
      m[i-1] &= 0xffff;
    }
    m[15] = t[15] - 0x7fff - ((m[14]>>16) & 1);
    b = (m[15]>>16) & 1;
    m[14] &= 0xffff;
    sel25519(t, m, 1-b);
  }
  for (i = 0; i < 16; i++) {
    o[2*i] = t[i] & 0xff;
    o[2*i+1] = t[i]>>8;
  }
}

function neq25519(a, b) {
  var c = new Uint8Array(32), d = new Uint8Array(32);
  pack25519(c, a);
  pack25519(d, b);
  return crypto_verify_32(c, 0, d, 0);
}

function par25519(a) {
  var d = new Uint8Array(32);
  pack25519(d, a);
  return d[0] & 1;
}

function unpack25519(o, n) {
  var i;
  for (i = 0; i < 16; i++) o[i] = n[2*i] + (n[2*i+1] << 8);
  o[15] &= 0x7fff;
}

function A(o, a, b) {
  for (var i = 0; i < 16; i++) o[i] = a[i] + b[i];
}

function Z(o, a, b) {
  for (var i = 0; i < 16; i++) o[i] = a[i] - b[i];
}

function M(o, a, b) {
  var v, c,
     t0 = 0,  t1 = 0,  t2 = 0,  t3 = 0,  t4 = 0,  t5 = 0,  t6 = 0,  t7 = 0,
     t8 = 0,  t9 = 0, t10 = 0, t11 = 0, t12 = 0, t13 = 0, t14 = 0, t15 = 0,
    t16 = 0, t17 = 0, t18 = 0, t19 = 0, t20 = 0, t21 = 0, t22 = 0, t23 = 0,
    t24 = 0, t25 = 0, t26 = 0, t27 = 0, t28 = 0, t29 = 0, t30 = 0,
    b0 = b[0],
    b1 = b[1],
    b2 = b[2],
    b3 = b[3],
    b4 = b[4],
    b5 = b[5],
    b6 = b[6],
    b7 = b[7],
    b8 = b[8],
    b9 = b[9],
    b10 = b[10],
    b11 = b[11],
    b12 = b[12],
    b13 = b[13],
    b14 = b[14],
    b15 = b[15];

  v = a[0];
  t0 += v * b0;
  t1 += v * b1;
  t2 += v * b2;
  t3 += v * b3;
  t4 += v * b4;
  t5 += v * b5;
  t6 += v * b6;
  t7 += v * b7;
  t8 += v * b8;
  t9 += v * b9;
  t10 += v * b10;
  t11 += v * b11;
  t12 += v * b12;
  t13 += v * b13;
  t14 += v * b14;
  t15 += v * b15;
  v = a[1];
  t1 += v * b0;
  t2 += v * b1;
  t3 += v * b2;
  t4 += v * b3;
  t5 += v * b4;
  t6 += v * b5;
  t7 += v * b6;
  t8 += v * b7;
  t9 += v * b8;
  t10 += v * b9;
  t11 += v * b10;
  t12 += v * b11;
  t13 += v * b12;
  t14 += v * b13;
  t15 += v * b14;
  t16 += v * b15;
  v = a[2];
  t2 += v * b0;
  t3 += v * b1;
  t4 += v * b2;
  t5 += v * b3;
  t6 += v * b4;
  t7 += v * b5;
  t8 += v * b6;
  t9 += v * b7;
  t10 += v * b8;
  t11 += v * b9;
  t12 += v * b10;
  t13 += v * b11;
  t14 += v * b12;
  t15 += v * b13;
  t16 += v * b14;
  t17 += v * b15;
  v = a[3];
  t3 += v * b0;
  t4 += v * b1;
  t5 += v * b2;
  t6 += v * b3;
  t7 += v * b4;
  t8 += v * b5;
  t9 += v * b6;
  t10 += v * b7;
  t11 += v * b8;
  t12 += v * b9;
  t13 += v * b10;
  t14 += v * b11;
  t15 += v * b12;
  t16 += v * b13;
  t17 += v * b14;
  t18 += v * b15;
  v = a[4];
  t4 += v * b0;
  t5 += v * b1;
  t6 += v * b2;
  t7 += v * b3;
  t8 += v * b4;
  t9 += v * b5;
  t10 += v * b6;
  t11 += v * b7;
  t12 += v * b8;
  t13 += v * b9;
  t14 += v * b10;
  t15 += v * b11;
  t16 += v * b12;
  t17 += v * b13;
  t18 += v * b14;
  t19 += v * b15;
  v = a[5];
  t5 += v * b0;
  t6 += v * b1;
  t7 += v * b2;
  t8 += v * b3;
  t9 += v * b4;
  t10 += v * b5;
  t11 += v * b6;
  t12 += v * b7;
  t13 += v * b8;
  t14 += v * b9;
  t15 += v * b10;
  t16 += v * b11;
  t17 += v * b12;
  t18 += v * b13;
  t19 += v * b14;
  t20 += v * b15;
  v = a[6];
  t6 += v * b0;
  t7 += v * b1;
  t8 += v * b2;
  t9 += v * b3;
  t10 += v * b4;
  t11 += v * b5;
  t12 += v * b6;
  t13 += v * b7;
  t14 += v * b8;
  t15 += v * b9;
  t16 += v * b10;
  t17 += v * b11;
  t18 += v * b12;
  t19 += v * b13;
  t20 += v * b14;
  t21 += v * b15;
  v = a[7];
  t7 += v * b0;
  t8 += v * b1;
  t9 += v * b2;
  t10 += v * b3;
  t11 += v * b4;
  t12 += v * b5;
  t13 += v * b6;
  t14 += v * b7;
  t15 += v * b8;
  t16 += v * b9;
  t17 += v * b10;
  t18 += v * b11;
  t19 += v * b12;
  t20 += v * b13;
  t21 += v * b14;
  t22 += v * b15;
  v = a[8];
  t8 += v * b0;
  t9 += v * b1;
  t10 += v * b2;
  t11 += v * b3;
  t12 += v * b4;
  t13 += v * b5;
  t14 += v * b6;
  t15 += v * b7;
  t16 += v * b8;
  t17 += v * b9;
  t18 += v * b10;
  t19 += v * b11;
  t20 += v * b12;
  t21 += v * b13;
  t22 += v * b14;
  t23 += v * b15;
  v = a[9];
  t9 += v * b0;
  t10 += v * b1;
  t11 += v * b2;
  t12 += v * b3;
  t13 += v * b4;
  t14 += v * b5;
  t15 += v * b6;
  t16 += v * b7;
  t17 += v * b8;
  t18 += v * b9;
  t19 += v * b10;
  t20 += v * b11;
  t21 += v * b12;
  t22 += v * b13;
  t23 += v * b14;
  t24 += v * b15;
  v = a[10];
  t10 += v * b0;
  t11 += v * b1;
  t12 += v * b2;
  t13 += v * b3;
  t14 += v * b4;
  t15 += v * b5;
  t16 += v * b6;
  t17 += v * b7;
  t18 += v * b8;
  t19 += v * b9;
  t20 += v * b10;
  t21 += v * b11;
  t22 += v * b12;
  t23 += v * b13;
  t24 += v * b14;
  t25 += v * b15;
  v = a[11];
  t11 += v * b0;
  t12 += v * b1;
  t13 += v * b2;
  t14 += v * b3;
  t15 += v * b4;
  t16 += v * b5;
  t17 += v * b6;
  t18 += v * b7;
  t19 += v * b8;
  t20 += v * b9;
  t21 += v * b10;
  t22 += v * b11;
  t23 += v * b12;
  t24 += v * b13;
  t25 += v * b14;
  t26 += v * b15;
  v = a[12];
  t12 += v * b0;
  t13 += v * b1;
  t14 += v * b2;
  t15 += v * b3;
  t16 += v * b4;
  t17 += v * b5;
  t18 += v * b6;
  t19 += v * b7;
  t20 += v * b8;
  t21 += v * b9;
  t22 += v * b10;
  t23 += v * b11;
  t24 += v * b12;
  t25 += v * b13;
  t26 += v * b14;
  t27 += v * b15;
  v = a[13];
  t13 += v * b0;
  t14 += v * b1;
  t15 += v * b2;
  t16 += v * b3;
  t17 += v * b4;
  t18 += v * b5;
  t19 += v * b6;
  t20 += v * b7;
  t21 += v * b8;
  t22 += v * b9;
  t23 += v * b10;
  t24 += v * b11;
  t25 += v * b12;
  t26 += v * b13;
  t27 += v * b14;
  t28 += v * b15;
  v = a[14];
  t14 += v * b0;
  t15 += v * b1;
  t16 += v * b2;
  t17 += v * b3;
  t18 += v * b4;
  t19 += v * b5;
  t20 += v * b6;
  t21 += v * b7;
  t22 += v * b8;
  t23 += v * b9;
  t24 += v * b10;
  t25 += v * b11;
  t26 += v * b12;
  t27 += v * b13;
  t28 += v * b14;
  t29 += v * b15;
  v = a[15];
  t15 += v * b0;
  t16 += v * b1;
  t17 += v * b2;
  t18 += v * b3;
  t19 += v * b4;
  t20 += v * b5;
  t21 += v * b6;
  t22 += v * b7;
  t23 += v * b8;
  t24 += v * b9;
  t25 += v * b10;
  t26 += v * b11;
  t27 += v * b12;
  t28 += v * b13;
  t29 += v * b14;
  t30 += v * b15;

  t0  += 38 * t16;
  t1  += 38 * t17;
  t2  += 38 * t18;
  t3  += 38 * t19;
  t4  += 38 * t20;
  t5  += 38 * t21;
  t6  += 38 * t22;
  t7  += 38 * t23;
  t8  += 38 * t24;
  t9  += 38 * t25;
  t10 += 38 * t26;
  t11 += 38 * t27;
  t12 += 38 * t28;
  t13 += 38 * t29;
  t14 += 38 * t30;
  // t15 left as is

  // first car
  c = 1;
  v =  t0 + c + 65535; c = Math.floor(v / 65536);  t0 = v - c * 65536;
  v =  t1 + c + 65535; c = Math.floor(v / 65536);  t1 = v - c * 65536;
  v =  t2 + c + 65535; c = Math.floor(v / 65536);  t2 = v - c * 65536;
  v =  t3 + c + 65535; c = Math.floor(v / 65536);  t3 = v - c * 65536;
  v =  t4 + c + 65535; c = Math.floor(v / 65536);  t4 = v - c * 65536;
  v =  t5 + c + 65535; c = Math.floor(v / 65536);  t5 = v - c * 65536;
  v =  t6 + c + 65535; c = Math.floor(v / 65536);  t6 = v - c * 65536;
  v =  t7 + c + 65535; c = Math.floor(v / 65536);  t7 = v - c * 65536;
  v =  t8 + c + 65535; c = Math.floor(v / 65536);  t8 = v - c * 65536;
  v =  t9 + c + 65535; c = Math.floor(v / 65536);  t9 = v - c * 65536;
  v = t10 + c + 65535; c = Math.floor(v / 65536); t10 = v - c * 65536;
  v = t11 + c + 65535; c = Math.floor(v / 65536); t11 = v - c * 65536;
  v = t12 + c + 65535; c = Math.floor(v / 65536); t12 = v - c * 65536;
  v = t13 + c + 65535; c = Math.floor(v / 65536); t13 = v - c * 65536;
  v = t14 + c + 65535; c = Math.floor(v / 65536); t14 = v - c * 65536;
  v = t15 + c + 65535; c = Math.floor(v / 65536); t15 = v - c * 65536;
  t0 += c-1 + 37 * (c-1);

  // second car
  c = 1;
  v =  t0 + c + 65535; c = Math.floor(v / 65536);  t0 = v - c * 65536;
  v =  t1 + c + 65535; c = Math.floor(v / 65536);  t1 = v - c * 65536;
  v =  t2 + c + 65535; c = Math.floor(v / 65536);  t2 = v - c * 65536;
  v =  t3 + c + 65535; c = Math.floor(v / 65536);  t3 = v - c * 65536;
  v =  t4 + c + 65535; c = Math.floor(v / 65536);  t4 = v - c * 65536;
  v =  t5 + c + 65535; c = Math.floor(v / 65536);  t5 = v - c * 65536;
  v =  t6 + c + 65535; c = Math.floor(v / 65536);  t6 = v - c * 65536;
  v =  t7 + c + 65535; c = Math.floor(v / 65536);  t7 = v - c * 65536;
  v =  t8 + c + 65535; c = Math.floor(v / 65536);  t8 = v - c * 65536;
  v =  t9 + c + 65535; c = Math.floor(v / 65536);  t9 = v - c * 65536;
  v = t10 + c + 65535; c = Math.floor(v / 65536); t10 = v - c * 65536;
  v = t11 + c + 65535; c = Math.floor(v / 65536); t11 = v - c * 65536;
  v = t12 + c + 65535; c = Math.floor(v / 65536); t12 = v - c * 65536;
  v = t13 + c + 65535; c = Math.floor(v / 65536); t13 = v - c * 65536;
  v = t14 + c + 65535; c = Math.floor(v / 65536); t14 = v - c * 65536;
  v = t15 + c + 65535; c = Math.floor(v / 65536); t15 = v - c * 65536;
  t0 += c-1 + 37 * (c-1);

  o[ 0] = t0;
  o[ 1] = t1;
  o[ 2] = t2;
  o[ 3] = t3;
  o[ 4] = t4;
  o[ 5] = t5;
  o[ 6] = t6;
  o[ 7] = t7;
  o[ 8] = t8;
  o[ 9] = t9;
  o[10] = t10;
  o[11] = t11;
  o[12] = t12;
  o[13] = t13;
  o[14] = t14;
  o[15] = t15;
}

function S(o, a) {
  M(o, a, a);
}

function inv25519(o, i) {
  var c = gf();
  var a;
  for (a = 0; a < 16; a++) c[a] = i[a];
  for (a = 253; a >= 0; a--) {
    S(c, c);
    if(a !== 2 && a !== 4) M(c, c, i);
  }
  for (a = 0; a < 16; a++) o[a] = c[a];
}

function pow2523(o, i) {
  var c = gf();
  var a;
  for (a = 0; a < 16; a++) c[a] = i[a];
  for (a = 250; a >= 0; a--) {
      S(c, c);
      if(a !== 1) M(c, c, i);
  }
  for (a = 0; a < 16; a++) o[a] = c[a];
}

function crypto_scalarmult(q, n, p) {
  var z = new Uint8Array(32);
  var x = new Float64Array(80), r, i;
  var a = gf(), b = gf(), c = gf(),
      d = gf(), e = gf(), f = gf();
  for (i = 0; i < 31; i++) z[i] = n[i];
  z[31]=(n[31]&127)|64;
  z[0]&=248;
  unpack25519(x,p);
  for (i = 0; i < 16; i++) {
    b[i]=x[i];
    d[i]=a[i]=c[i]=0;
  }
  a[0]=d[0]=1;
  for (i=254; i>=0; --i) {
    r=(z[i>>>3]>>>(i&7))&1;
    sel25519(a,b,r);
    sel25519(c,d,r);
    A(e,a,c);
    Z(a,a,c);
    A(c,b,d);
    Z(b,b,d);
    S(d,e);
    S(f,a);
    M(a,c,a);
    M(c,b,e);
    A(e,a,c);
    Z(a,a,c);
    S(b,a);
    Z(c,d,f);
    M(a,c,_121665);
    A(a,a,d);
    M(c,c,a);
    M(a,d,f);
    M(d,b,x);
    S(b,e);
    sel25519(a,b,r);
    sel25519(c,d,r);
  }
  for (i = 0; i < 16; i++) {
    x[i+16]=a[i];
    x[i+32]=c[i];
    x[i+48]=b[i];
    x[i+64]=d[i];
  }
  var x32 = x.subarray(32);
  var x16 = x.subarray(16);
  inv25519(x32,x32);
  M(x16,x16,x32);
  pack25519(q,x16);
  return 0;
}

function crypto_scalarmult_base(q, n) {
  return crypto_scalarmult(q, n, _9);
}

function crypto_box_keypair(y, x) {
  randombytes(x, 32);
  return crypto_scalarmult_base(y, x);
}

function crypto_box_beforenm(k, y, x) {
  var s = new Uint8Array(32);
  crypto_scalarmult(s, x, y);
  return crypto_core_hsalsa20(k, _0, s, sigma);
}

var crypto_box_afternm = crypto_secretbox;
var crypto_box_open_afternm = crypto_secretbox_open;

function crypto_box(c, m, d, n, y, x) {
  var k = new Uint8Array(32);
  crypto_box_beforenm(k, y, x);
  return crypto_box_afternm(c, m, d, n, k);
}

function crypto_box_open(m, c, d, n, y, x) {
  var k = new Uint8Array(32);
  crypto_box_beforenm(k, y, x);
  return crypto_box_open_afternm(m, c, d, n, k);
}

var K = [
  0x428a2f98, 0xd728ae22, 0x71374491, 0x23ef65cd,
  0xb5c0fbcf, 0xec4d3b2f, 0xe9b5dba5, 0x8189dbbc,
  0x3956c25b, 0xf348b538, 0x59f111f1, 0xb605d019,
  0x923f82a4, 0xaf194f9b, 0xab1c5ed5, 0xda6d8118,
  0xd807aa98, 0xa3030242, 0x12835b01, 0x45706fbe,
  0x243185be, 0x4ee4b28c, 0x550c7dc3, 0xd5ffb4e2,
  0x72be5d74, 0xf27b896f, 0x80deb1fe, 0x3b1696b1,
  0x9bdc06a7, 0x25c71235, 0xc19bf174, 0xcf692694,
  0xe49b69c1, 0x9ef14ad2, 0xefbe4786, 0x384f25e3,
  0x0fc19dc6, 0x8b8cd5b5, 0x240ca1cc, 0x77ac9c65,
  0x2de92c6f, 0x592b0275, 0x4a7484aa, 0x6ea6e483,
  0x5cb0a9dc, 0xbd41fbd4, 0x76f988da, 0x831153b5,
  0x983e5152, 0xee66dfab, 0xa831c66d, 0x2db43210,
  0xb00327c8, 0x98fb213f, 0xbf597fc7, 0xbeef0ee4,
  0xc6e00bf3, 0x3da88fc2, 0xd5a79147, 0x930aa725,
  0x06ca6351, 0xe003826f, 0x14292967, 0x0a0e6e70,
  0x27b70a85, 0x46d22ffc, 0x2e1b2138, 0x5c26c926,
  0x4d2c6dfc, 0x5ac42aed, 0x53380d13, 0x9d95b3df,
  0x650a7354, 0x8baf63de, 0x766a0abb, 0x3c77b2a8,
  0x81c2c92e, 0x47edaee6, 0x92722c85, 0x1482353b,
  0xa2bfe8a1, 0x4cf10364, 0xa81a664b, 0xbc423001,
  0xc24b8b70, 0xd0f89791, 0xc76c51a3, 0x0654be30,
  0xd192e819, 0xd6ef5218, 0xd6990624, 0x5565a910,
  0xf40e3585, 0x5771202a, 0x106aa070, 0x32bbd1b8,
  0x19a4c116, 0xb8d2d0c8, 0x1e376c08, 0x5141ab53,
  0x2748774c, 0xdf8eeb99, 0x34b0bcb5, 0xe19b48a8,
  0x391c0cb3, 0xc5c95a63, 0x4ed8aa4a, 0xe3418acb,
  0x5b9cca4f, 0x7763e373, 0x682e6ff3, 0xd6b2b8a3,
  0x748f82ee, 0x5defb2fc, 0x78a5636f, 0x43172f60,
  0x84c87814, 0xa1f0ab72, 0x8cc70208, 0x1a6439ec,
  0x90befffa, 0x23631e28, 0xa4506ceb, 0xde82bde9,
  0xbef9a3f7, 0xb2c67915, 0xc67178f2, 0xe372532b,
  0xca273ece, 0xea26619c, 0xd186b8c7, 0x21c0c207,
  0xeada7dd6, 0xcde0eb1e, 0xf57d4f7f, 0xee6ed178,
  0x06f067aa, 0x72176fba, 0x0a637dc5, 0xa2c898a6,
  0x113f9804, 0xbef90dae, 0x1b710b35, 0x131c471b,
  0x28db77f5, 0x23047d84, 0x32caab7b, 0x40c72493,
  0x3c9ebe0a, 0x15c9bebc, 0x431d67c4, 0x9c100d4c,
  0x4cc5d4be, 0xcb3e42b6, 0x597f299c, 0xfc657e2a,
  0x5fcb6fab, 0x3ad6faec, 0x6c44198c, 0x4a475817
];

function crypto_hashblocks_hl(hh, hl, m, n) {
  var wh = new Int32Array(16), wl = new Int32Array(16),
      bh0, bh1, bh2, bh3, bh4, bh5, bh6, bh7,
      bl0, bl1, bl2, bl3, bl4, bl5, bl6, bl7,
      th, tl, i, j, h, l, a, b, c, d;

  var ah0 = hh[0],
      ah1 = hh[1],
      ah2 = hh[2],
      ah3 = hh[3],
      ah4 = hh[4],
      ah5 = hh[5],
      ah6 = hh[6],
      ah7 = hh[7],

      al0 = hl[0],
      al1 = hl[1],
      al2 = hl[2],
      al3 = hl[3],
      al4 = hl[4],
      al5 = hl[5],
      al6 = hl[6],
      al7 = hl[7];

  var pos = 0;
  while (n >= 128) {
    for (i = 0; i < 16; i++) {
      j = 8 * i + pos;
      wh[i] = (m[j+0] << 24) | (m[j+1] << 16) | (m[j+2] << 8) | m[j+3];
      wl[i] = (m[j+4] << 24) | (m[j+5] << 16) | (m[j+6] << 8) | m[j+7];
    }
    for (i = 0; i < 80; i++) {
      bh0 = ah0;
      bh1 = ah1;
      bh2 = ah2;
      bh3 = ah3;
      bh4 = ah4;
      bh5 = ah5;
      bh6 = ah6;
      bh7 = ah7;

      bl0 = al0;
      bl1 = al1;
      bl2 = al2;
      bl3 = al3;
      bl4 = al4;
      bl5 = al5;
      bl6 = al6;
      bl7 = al7;

      // add
      h = ah7;
      l = al7;

      a = l & 0xffff; b = l >>> 16;
      c = h & 0xffff; d = h >>> 16;

      // Sigma1
      h = ((ah4 >>> 14) | (al4 << (32-14))) ^ ((ah4 >>> 18) | (al4 << (32-18))) ^ ((al4 >>> (41-32)) | (ah4 << (32-(41-32))));
      l = ((al4 >>> 14) | (ah4 << (32-14))) ^ ((al4 >>> 18) | (ah4 << (32-18))) ^ ((ah4 >>> (41-32)) | (al4 << (32-(41-32))));

      a += l & 0xffff; b += l >>> 16;
      c += h & 0xffff; d += h >>> 16;

      // Ch
      h = (ah4 & ah5) ^ (~ah4 & ah6);
      l = (al4 & al5) ^ (~al4 & al6);

      a += l & 0xffff; b += l >>> 16;
      c += h & 0xffff; d += h >>> 16;

      // K
      h = K[i*2];
      l = K[i*2+1];

      a += l & 0xffff; b += l >>> 16;
      c += h & 0xffff; d += h >>> 16;

      // w
      h = wh[i%16];
      l = wl[i%16];

      a += l & 0xffff; b += l >>> 16;
      c += h & 0xffff; d += h >>> 16;

      b += a >>> 16;
      c += b >>> 16;
      d += c >>> 16;

      th = c & 0xffff | d << 16;
      tl = a & 0xffff | b << 16;

      // add
      h = th;
      l = tl;

      a = l & 0xffff; b = l >>> 16;
      c = h & 0xffff; d = h >>> 16;

      // Sigma0
      h = ((ah0 >>> 28) | (al0 << (32-28))) ^ ((al0 >>> (34-32)) | (ah0 << (32-(34-32)))) ^ ((al0 >>> (39-32)) | (ah0 << (32-(39-32))));
      l = ((al0 >>> 28) | (ah0 << (32-28))) ^ ((ah0 >>> (34-32)) | (al0 << (32-(34-32)))) ^ ((ah0 >>> (39-32)) | (al0 << (32-(39-32))));

      a += l & 0xffff; b += l >>> 16;
      c += h & 0xffff; d += h >>> 16;

      // Maj
      h = (ah0 & ah1) ^ (ah0 & ah2) ^ (ah1 & ah2);
      l = (al0 & al1) ^ (al0 & al2) ^ (al1 & al2);

      a += l & 0xffff; b += l >>> 16;
      c += h & 0xffff; d += h >>> 16;

      b += a >>> 16;
      c += b >>> 16;
      d += c >>> 16;

      bh7 = (c & 0xffff) | (d << 16);
      bl7 = (a & 0xffff) | (b << 16);

      // add
      h = bh3;
      l = bl3;

      a = l & 0xffff; b = l >>> 16;
      c = h & 0xffff; d = h >>> 16;

      h = th;
      l = tl;

      a += l & 0xffff; b += l >>> 16;
      c += h & 0xffff; d += h >>> 16;

      b += a >>> 16;
      c += b >>> 16;
      d += c >>> 16;

      bh3 = (c & 0xffff) | (d << 16);
      bl3 = (a & 0xffff) | (b << 16);

      ah1 = bh0;
      ah2 = bh1;
      ah3 = bh2;
      ah4 = bh3;
      ah5 = bh4;
      ah6 = bh5;
      ah7 = bh6;
      ah0 = bh7;

      al1 = bl0;
      al2 = bl1;
      al3 = bl2;
      al4 = bl3;
      al5 = bl4;
      al6 = bl5;
      al7 = bl6;
      al0 = bl7;

      if (i%16 === 15) {
        for (j = 0; j < 16; j++) {
          // add
          h = wh[j];
          l = wl[j];

          a = l & 0xffff; b = l >>> 16;
          c = h & 0xffff; d = h >>> 16;

          h = wh[(j+9)%16];
          l = wl[(j+9)%16];

          a += l & 0xffff; b += l >>> 16;
          c += h & 0xffff; d += h >>> 16;

          // sigma0
          th = wh[(j+1)%16];
          tl = wl[(j+1)%16];
          h = ((th >>> 1) | (tl << (32-1))) ^ ((th >>> 8) | (tl << (32-8))) ^ (th >>> 7);
          l = ((tl >>> 1) | (th << (32-1))) ^ ((tl >>> 8) | (th << (32-8))) ^ ((tl >>> 7) | (th << (32-7)));

          a += l & 0xffff; b += l >>> 16;
          c += h & 0xffff; d += h >>> 16;

          // sigma1
          th = wh[(j+14)%16];
          tl = wl[(j+14)%16];
          h = ((th >>> 19) | (tl << (32-19))) ^ ((tl >>> (61-32)) | (th << (32-(61-32)))) ^ (th >>> 6);
          l = ((tl >>> 19) | (th << (32-19))) ^ ((th >>> (61-32)) | (tl << (32-(61-32)))) ^ ((tl >>> 6) | (th << (32-6)));

          a += l & 0xffff; b += l >>> 16;
          c += h & 0xffff; d += h >>> 16;

          b += a >>> 16;
          c += b >>> 16;
          d += c >>> 16;

          wh[j] = (c & 0xffff) | (d << 16);
          wl[j] = (a & 0xffff) | (b << 16);
        }
      }
    }

    // add
    h = ah0;
    l = al0;

    a = l & 0xffff; b = l >>> 16;
    c = h & 0xffff; d = h >>> 16;

    h = hh[0];
    l = hl[0];

    a += l & 0xffff; b += l >>> 16;
    c += h & 0xffff; d += h >>> 16;

    b += a >>> 16;
    c += b >>> 16;
    d += c >>> 16;

    hh[0] = ah0 = (c & 0xffff) | (d << 16);
    hl[0] = al0 = (a & 0xffff) | (b << 16);

    h = ah1;
    l = al1;

    a = l & 0xffff; b = l >>> 16;
    c = h & 0xffff; d = h >>> 16;

    h = hh[1];
    l = hl[1];

    a += l & 0xffff; b += l >>> 16;
    c += h & 0xffff; d += h >>> 16;

    b += a >>> 16;
    c += b >>> 16;
    d += c >>> 16;

    hh[1] = ah1 = (c & 0xffff) | (d << 16);
    hl[1] = al1 = (a & 0xffff) | (b << 16);

    h = ah2;
    l = al2;

    a = l & 0xffff; b = l >>> 16;
    c = h & 0xffff; d = h >>> 16;

    h = hh[2];
    l = hl[2];

    a += l & 0xffff; b += l >>> 16;
    c += h & 0xffff; d += h >>> 16;

    b += a >>> 16;
    c += b >>> 16;
    d += c >>> 16;

    hh[2] = ah2 = (c & 0xffff) | (d << 16);
    hl[2] = al2 = (a & 0xffff) | (b << 16);

    h = ah3;
    l = al3;

    a = l & 0xffff; b = l >>> 16;
    c = h & 0xffff; d = h >>> 16;

    h = hh[3];
    l = hl[3];

    a += l & 0xffff; b += l >>> 16;
    c += h & 0xffff; d += h >>> 16;

    b += a >>> 16;
    c += b >>> 16;
    d += c >>> 16;

    hh[3] = ah3 = (c & 0xffff) | (d << 16);
    hl[3] = al3 = (a & 0xffff) | (b << 16);

    h = ah4;
    l = al4;

    a = l & 0xffff; b = l >>> 16;
    c = h & 0xffff; d = h >>> 16;

    h = hh[4];
    l = hl[4];

    a += l & 0xffff; b += l >>> 16;
    c += h & 0xffff; d += h >>> 16;

    b += a >>> 16;
    c += b >>> 16;
    d += c >>> 16;

    hh[4] = ah4 = (c & 0xffff) | (d << 16);
    hl[4] = al4 = (a & 0xffff) | (b << 16);

    h = ah5;
    l = al5;

    a = l & 0xffff; b = l >>> 16;
    c = h & 0xffff; d = h >>> 16;

    h = hh[5];
    l = hl[5];

    a += l & 0xffff; b += l >>> 16;
    c += h & 0xffff; d += h >>> 16;

    b += a >>> 16;
    c += b >>> 16;
    d += c >>> 16;

    hh[5] = ah5 = (c & 0xffff) | (d << 16);
    hl[5] = al5 = (a & 0xffff) | (b << 16);

    h = ah6;
    l = al6;

    a = l & 0xffff; b = l >>> 16;
    c = h & 0xffff; d = h >>> 16;

    h = hh[6];
    l = hl[6];

    a += l & 0xffff; b += l >>> 16;
    c += h & 0xffff; d += h >>> 16;

    b += a >>> 16;
    c += b >>> 16;
    d += c >>> 16;

    hh[6] = ah6 = (c & 0xffff) | (d << 16);
    hl[6] = al6 = (a & 0xffff) | (b << 16);

    h = ah7;
    l = al7;

    a = l & 0xffff; b = l >>> 16;
    c = h & 0xffff; d = h >>> 16;

    h = hh[7];
    l = hl[7];

    a += l & 0xffff; b += l >>> 16;
    c += h & 0xffff; d += h >>> 16;

    b += a >>> 16;
    c += b >>> 16;
    d += c >>> 16;

    hh[7] = ah7 = (c & 0xffff) | (d << 16);
    hl[7] = al7 = (a & 0xffff) | (b << 16);

    pos += 128;
    n -= 128;
  }

  return n;
}

function crypto_hash(out, m, n) {
  var hh = new Int32Array(8),
      hl = new Int32Array(8),
      x = new Uint8Array(256),
      i, b = n;

  hh[0] = 0x6a09e667;
  hh[1] = 0xbb67ae85;
  hh[2] = 0x3c6ef372;
  hh[3] = 0xa54ff53a;
  hh[4] = 0x510e527f;
  hh[5] = 0x9b05688c;
  hh[6] = 0x1f83d9ab;
  hh[7] = 0x5be0cd19;

  hl[0] = 0xf3bcc908;
  hl[1] = 0x84caa73b;
  hl[2] = 0xfe94f82b;
  hl[3] = 0x5f1d36f1;
  hl[4] = 0xade682d1;
  hl[5] = 0x2b3e6c1f;
  hl[6] = 0xfb41bd6b;
  hl[7] = 0x137e2179;

  crypto_hashblocks_hl(hh, hl, m, n);
  n %= 128;

  for (i = 0; i < n; i++) x[i] = m[b-n+i];
  x[n] = 128;

  n = 256-128*(n<112?1:0);
  x[n-9] = 0;
  ts64(x, n-8,  (b / 0x20000000) | 0, b << 3);
  crypto_hashblocks_hl(hh, hl, x, n);

  for (i = 0; i < 8; i++) ts64(out, 8*i, hh[i], hl[i]);

  return 0;
}

function add(p, q) {
  var a = gf(), b = gf(), c = gf(),
      d = gf(), e = gf(), f = gf(),
      g = gf(), h = gf(), t = gf();

  Z(a, p[1], p[0]);
  Z(t, q[1], q[0]);
  M(a, a, t);
  A(b, p[0], p[1]);
  A(t, q[0], q[1]);
  M(b, b, t);
  M(c, p[3], q[3]);
  M(c, c, D2);
  M(d, p[2], q[2]);
  A(d, d, d);
  Z(e, b, a);
  Z(f, d, c);
  A(g, d, c);
  A(h, b, a);

  M(p[0], e, f);
  M(p[1], h, g);
  M(p[2], g, f);
  M(p[3], e, h);
}

function cswap(p, q, b) {
  var i;
  for (i = 0; i < 4; i++) {
    sel25519(p[i], q[i], b);
  }
}

function pack(r, p) {
  var tx = gf(), ty = gf(), zi = gf();
  inv25519(zi, p[2]);
  M(tx, p[0], zi);
  M(ty, p[1], zi);
  pack25519(r, ty);
  r[31] ^= par25519(tx) << 7;
}

function scalarmult(p, q, s) {
  var b, i;
  set25519(p[0], gf0);
  set25519(p[1], gf1);
  set25519(p[2], gf1);
  set25519(p[3], gf0);
  for (i = 255; i >= 0; --i) {
    b = (s[(i/8)|0] >> (i&7)) & 1;
    cswap(p, q, b);
    add(q, p);
    add(p, p);
    cswap(p, q, b);
  }
}

function scalarbase(p, s) {
  var q = [gf(), gf(), gf(), gf()];
  set25519(q[0], X);
  set25519(q[1], Y);
  set25519(q[2], gf1);
  M(q[3], X, Y);
  scalarmult(p, q, s);
}

function crypto_sign_keypair(pk, sk, seeded) {
  var d = new Uint8Array(64);
  var p = [gf(), gf(), gf(), gf()];
  var i;

  if (!seeded) randombytes(sk, 32);
  crypto_hash(d, sk, 32);
  d[0] &= 248;
  d[31] &= 127;
  d[31] |= 64;

  scalarbase(p, d);
  pack(pk, p);

  for (i = 0; i < 32; i++) sk[i+32] = pk[i];
  return 0;
}

var L = new Float64Array([0xed, 0xd3, 0xf5, 0x5c, 0x1a, 0x63, 0x12, 0x58, 0xd6, 0x9c, 0xf7, 0xa2, 0xde, 0xf9, 0xde, 0x14, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0x10]);

function modL(r, x) {
  var carry, i, j, k;
  for (i = 63; i >= 32; --i) {
    carry = 0;
    for (j = i - 32, k = i - 12; j < k; ++j) {
      x[j] += carry - 16 * x[i] * L[j - (i - 32)];
      carry = Math.floor((x[j] + 128) / 256);
      x[j] -= carry * 256;
    }
    x[j] += carry;
    x[i] = 0;
  }
  carry = 0;
  for (j = 0; j < 32; j++) {
    x[j] += carry - (x[31] >> 4) * L[j];
    carry = x[j] >> 8;
    x[j] &= 255;
  }
  for (j = 0; j < 32; j++) x[j] -= carry * L[j];
  for (i = 0; i < 32; i++) {
    x[i+1] += x[i] >> 8;
    r[i] = x[i] & 255;
  }
}

function reduce(r) {
  var x = new Float64Array(64), i;
  for (i = 0; i < 64; i++) x[i] = r[i];
  for (i = 0; i < 64; i++) r[i] = 0;
  modL(r, x);
}

// Note: difference from C - smlen returned, not passed as argument.
function crypto_sign(sm, m, n, sk) {
  var d = new Uint8Array(64), h = new Uint8Array(64), r = new Uint8Array(64);
  var i, j, x = new Float64Array(64);
  var p = [gf(), gf(), gf(), gf()];

  crypto_hash(d, sk, 32);
  d[0] &= 248;
  d[31] &= 127;
  d[31] |= 64;

  var smlen = n + 64;
  for (i = 0; i < n; i++) sm[64 + i] = m[i];
  for (i = 0; i < 32; i++) sm[32 + i] = d[32 + i];

  crypto_hash(r, sm.subarray(32), n+32);
  reduce(r);
  scalarbase(p, r);
  pack(sm, p);

  for (i = 32; i < 64; i++) sm[i] = sk[i];
  crypto_hash(h, sm, n + 64);
  reduce(h);

  for (i = 0; i < 64; i++) x[i] = 0;
  for (i = 0; i < 32; i++) x[i] = r[i];
  for (i = 0; i < 32; i++) {
    for (j = 0; j < 32; j++) {
      x[i+j] += h[i] * d[j];
    }
  }

  modL(sm.subarray(32), x);
  return smlen;
}

function unpackneg(r, p) {
  var t = gf(), chk = gf(), num = gf(),
      den = gf(), den2 = gf(), den4 = gf(),
      den6 = gf();

  set25519(r[2], gf1);
  unpack25519(r[1], p);
  S(num, r[1]);
  M(den, num, D);
  Z(num, num, r[2]);
  A(den, r[2], den);

  S(den2, den);
  S(den4, den2);
  M(den6, den4, den2);
  M(t, den6, num);
  M(t, t, den);

  pow2523(t, t);
  M(t, t, num);
  M(t, t, den);
  M(t, t, den);
  M(r[0], t, den);

  S(chk, r[0]);
  M(chk, chk, den);
  if (neq25519(chk, num)) M(r[0], r[0], I);

  S(chk, r[0]);
  M(chk, chk, den);
  if (neq25519(chk, num)) return -1;

  if (par25519(r[0]) === (p[31]>>7)) Z(r[0], gf0, r[0]);

  M(r[3], r[0], r[1]);
  return 0;
}

function crypto_sign_open(m, sm, n, pk) {
  var i;
  var t = new Uint8Array(32), h = new Uint8Array(64);
  var p = [gf(), gf(), gf(), gf()],
      q = [gf(), gf(), gf(), gf()];

  if (n < 64) return -1;

  if (unpackneg(q, pk)) return -1;

  for (i = 0; i < n; i++) m[i] = sm[i];
  for (i = 0; i < 32; i++) m[i+32] = pk[i];
  crypto_hash(h, m, n);
  reduce(h);
  scalarmult(p, q, h);

  scalarbase(q, sm.subarray(32));
  add(p, q);
  pack(t, p);

  n -= 64;
  if (crypto_verify_32(sm, 0, t, 0)) {
    for (i = 0; i < n; i++) m[i] = 0;
    return -1;
  }

  for (i = 0; i < n; i++) m[i] = sm[i + 64];
  return n;
}

var crypto_secretbox_KEYBYTES = 32,
    crypto_secretbox_NONCEBYTES = 24,
    crypto_secretbox_ZEROBYTES = 32,
    crypto_secretbox_BOXZEROBYTES = 16,
    crypto_scalarmult_BYTES = 32,
    crypto_scalarmult_SCALARBYTES = 32,
    crypto_box_PUBLICKEYBYTES = 32,
    crypto_box_SECRETKEYBYTES = 32,
    crypto_box_BEFORENMBYTES = 32,
    crypto_box_NONCEBYTES = crypto_secretbox_NONCEBYTES,
    crypto_box_ZEROBYTES = crypto_secretbox_ZEROBYTES,
    crypto_box_BOXZEROBYTES = crypto_secretbox_BOXZEROBYTES,
    crypto_sign_BYTES = 64,
    crypto_sign_PUBLICKEYBYTES = 32,
    crypto_sign_SECRETKEYBYTES = 64,
    crypto_sign_SEEDBYTES = 32,
    crypto_hash_BYTES = 64;

nacl.lowlevel = {
  crypto_core_hsalsa20: crypto_core_hsalsa20,
  crypto_stream_xor: crypto_stream_xor,
  crypto_stream: crypto_stream,
  crypto_stream_salsa20_xor: crypto_stream_salsa20_xor,
  crypto_stream_salsa20: crypto_stream_salsa20,
  crypto_onetimeauth: crypto_onetimeauth,
  crypto_onetimeauth_verify: crypto_onetimeauth_verify,
  crypto_verify_16: crypto_verify_16,
  crypto_verify_32: crypto_verify_32,
  crypto_secretbox: crypto_secretbox,
  crypto_secretbox_open: crypto_secretbox_open,
  crypto_scalarmult: crypto_scalarmult,
  crypto_scalarmult_base: crypto_scalarmult_base,
  crypto_box_beforenm: crypto_box_beforenm,
  crypto_box_afternm: crypto_box_afternm,
  crypto_box: crypto_box,
  crypto_box_open: crypto_box_open,
  crypto_box_keypair: crypto_box_keypair,
  crypto_hash: crypto_hash,
  crypto_sign: crypto_sign,
  crypto_sign_keypair: crypto_sign_keypair,
  crypto_sign_open: crypto_sign_open,

  crypto_secretbox_KEYBYTES: crypto_secretbox_KEYBYTES,
  crypto_secretbox_NONCEBYTES: crypto_secretbox_NONCEBYTES,
  crypto_secretbox_ZEROBYTES: crypto_secretbox_ZEROBYTES,
  crypto_secretbox_BOXZEROBYTES: crypto_secretbox_BOXZEROBYTES,
  crypto_scalarmult_BYTES: crypto_scalarmult_BYTES,
  crypto_scalarmult_SCALARBYTES: crypto_scalarmult_SCALARBYTES,
  crypto_box_PUBLICKEYBYTES: crypto_box_PUBLICKEYBYTES,
  crypto_box_SECRETKEYBYTES: crypto_box_SECRETKEYBYTES,
  crypto_box_BEFORENMBYTES: crypto_box_BEFORENMBYTES,
  crypto_box_NONCEBYTES: crypto_box_NONCEBYTES,
  crypto_box_ZEROBYTES: crypto_box_ZEROBYTES,
  crypto_box_BOXZEROBYTES: crypto_box_BOXZEROBYTES,
  crypto_sign_BYTES: crypto_sign_BYTES,
  crypto_sign_PUBLICKEYBYTES: crypto_sign_PUBLICKEYBYTES,
  crypto_sign_SECRETKEYBYTES: crypto_sign_SECRETKEYBYTES,
  crypto_sign_SEEDBYTES: crypto_sign_SEEDBYTES,
  crypto_hash_BYTES: crypto_hash_BYTES,

  gf: gf,
  D: D,
  L: L,
  pack25519: pack25519,
  unpack25519: unpack25519,
  M: M,
  A: A,
  S: S,
  Z: Z,
  pow2523: pow2523,
  add: add,
  set25519: set25519,
  modL: modL,
  scalarmult: scalarmult,
  scalarbase: scalarbase,
};

/* High-level API */

function checkLengths(k, n) {
  if (k.length !== crypto_secretbox_KEYBYTES) throw new Error('bad key size');
  if (n.length !== crypto_secretbox_NONCEBYTES) throw new Error('bad nonce size');
}

function checkBoxLengths(pk, sk) {
  if (pk.length !== crypto_box_PUBLICKEYBYTES) throw new Error('bad public key size');
  if (sk.length !== crypto_box_SECRETKEYBYTES) throw new Error('bad secret key size');
}

function checkArrayTypes() {
  for (var i = 0; i < arguments.length; i++) {
    if (!(arguments[i] instanceof Uint8Array))
      throw new TypeError('unexpected type, use Uint8Array');
  }
}

function cleanup(arr) {
  for (var i = 0; i < arr.length; i++) arr[i] = 0;
}

nacl.randomBytes = function(n) {
  var b = new Uint8Array(n);
  randombytes(b, n);
  return b;
};

nacl.secretbox = function(msg, nonce, key) {
  checkArrayTypes(msg, nonce, key);
  checkLengths(key, nonce);
  var m = new Uint8Array(crypto_secretbox_ZEROBYTES + msg.length);
  var c = new Uint8Array(m.length);
  for (var i = 0; i < msg.length; i++) m[i+crypto_secretbox_ZEROBYTES] = msg[i];
  crypto_secretbox(c, m, m.length, nonce, key);
  return c.subarray(crypto_secretbox_BOXZEROBYTES);
};

nacl.secretbox.open = function(box, nonce, key) {
  checkArrayTypes(box, nonce, key);
  checkLengths(key, nonce);
  var c = new Uint8Array(crypto_secretbox_BOXZEROBYTES + box.length);
  var m = new Uint8Array(c.length);
  for (var i = 0; i < box.length; i++) c[i+crypto_secretbox_BOXZEROBYTES] = box[i];
  if (c.length < 32) return null;
  if (crypto_secretbox_open(m, c, c.length, nonce, key) !== 0) return null;
  return m.subarray(crypto_secretbox_ZEROBYTES);
};

nacl.secretbox.keyLength = crypto_secretbox_KEYBYTES;
nacl.secretbox.nonceLength = crypto_secretbox_NONCEBYTES;
nacl.secretbox.overheadLength = crypto_secretbox_BOXZEROBYTES;

nacl.scalarMult = function(n, p) {
  checkArrayTypes(n, p);
  if (n.length !== crypto_scalarmult_SCALARBYTES) throw new Error('bad n size');
  if (p.length !== crypto_scalarmult_BYTES) throw new Error('bad p size');
  var q = new Uint8Array(crypto_scalarmult_BYTES);
  crypto_scalarmult(q, n, p);
  return q;
};

nacl.scalarMult.base = function(n) {
  checkArrayTypes(n);
  if (n.length !== crypto_scalarmult_SCALARBYTES) throw new Error('bad n size');
  var q = new Uint8Array(crypto_scalarmult_BYTES);
  crypto_scalarmult_base(q, n);
  return q;
};

nacl.scalarMult.scalarLength = crypto_scalarmult_SCALARBYTES;
nacl.scalarMult.groupElementLength = crypto_scalarmult_BYTES;

nacl.box = function(msg, nonce, publicKey, secretKey) {
  var k = nacl.box.before(publicKey, secretKey);
  return nacl.secretbox(msg, nonce, k);
};

nacl.box.before = function(publicKey, secretKey) {
  checkArrayTypes(publicKey, secretKey);
  checkBoxLengths(publicKey, secretKey);
  var k = new Uint8Array(crypto_box_BEFORENMBYTES);
  crypto_box_beforenm(k, publicKey, secretKey);
  return k;
};

nacl.box.after = nacl.secretbox;

nacl.box.open = function(msg, nonce, publicKey, secretKey) {
  var k = nacl.box.before(publicKey, secretKey);
  return nacl.secretbox.open(msg, nonce, k);
};

nacl.box.open.after = nacl.secretbox.open;

nacl.box.keyPair = function() {
  var pk = new Uint8Array(crypto_box_PUBLICKEYBYTES);
  var sk = new Uint8Array(crypto_box_SECRETKEYBYTES);
  crypto_box_keypair(pk, sk);
  return {publicKey: pk, secretKey: sk};
};

nacl.box.keyPair.fromSecretKey = function(secretKey) {
  checkArrayTypes(secretKey);
  if (secretKey.length !== crypto_box_SECRETKEYBYTES)
    throw new Error('bad secret key size');
  var pk = new Uint8Array(crypto_box_PUBLICKEYBYTES);
  crypto_scalarmult_base(pk, secretKey);
  return {publicKey: pk, secretKey: new Uint8Array(secretKey)};
};

nacl.box.publicKeyLength = crypto_box_PUBLICKEYBYTES;
nacl.box.secretKeyLength = crypto_box_SECRETKEYBYTES;
nacl.box.sharedKeyLength = crypto_box_BEFORENMBYTES;
nacl.box.nonceLength = crypto_box_NONCEBYTES;
nacl.box.overheadLength = nacl.secretbox.overheadLength;

nacl.sign = function(msg, secretKey) {
  checkArrayTypes(msg, secretKey);
  if (secretKey.length !== crypto_sign_SECRETKEYBYTES)
    throw new Error('bad secret key size');
  var signedMsg = new Uint8Array(crypto_sign_BYTES+msg.length);
  crypto_sign(signedMsg, msg, msg.length, secretKey);
  return signedMsg;
};

nacl.sign.open = function(signedMsg, publicKey) {
  checkArrayTypes(signedMsg, publicKey);
  if (publicKey.length !== crypto_sign_PUBLICKEYBYTES)
    throw new Error('bad public key size');
  var tmp = new Uint8Array(signedMsg.length);
  var mlen = crypto_sign_open(tmp, signedMsg, signedMsg.length, publicKey);
  if (mlen < 0) return null;
  var m = new Uint8Array(mlen);
  for (var i = 0; i < m.length; i++) m[i] = tmp[i];
  return m;
};

nacl.sign.detached = function(msg, secretKey) {
  var signedMsg = nacl.sign(msg, secretKey);
  var sig = new Uint8Array(crypto_sign_BYTES);
  for (var i = 0; i < sig.length; i++) sig[i] = signedMsg[i];
  return sig;
};

nacl.sign.detached.verify = function(msg, sig, publicKey) {
  checkArrayTypes(msg, sig, publicKey);
  if (sig.length !== crypto_sign_BYTES)
    throw new Error('bad signature size');
  if (publicKey.length !== crypto_sign_PUBLICKEYBYTES)
    throw new Error('bad public key size');
  var sm = new Uint8Array(crypto_sign_BYTES + msg.length);
  var m = new Uint8Array(crypto_sign_BYTES + msg.length);
  var i;
  for (i = 0; i < crypto_sign_BYTES; i++) sm[i] = sig[i];
  for (i = 0; i < msg.length; i++) sm[i+crypto_sign_BYTES] = msg[i];
  return (crypto_sign_open(m, sm, sm.length, publicKey) >= 0);
};

nacl.sign.keyPair = function() {
  var pk = new Uint8Array(crypto_sign_PUBLICKEYBYTES);
  var sk = new Uint8Array(crypto_sign_SECRETKEYBYTES);
  crypto_sign_keypair(pk, sk);
  return {publicKey: pk, secretKey: sk};
};

nacl.sign.keyPair.fromSecretKey = function(secretKey) {
  checkArrayTypes(secretKey);
  if (secretKey.length !== crypto_sign_SECRETKEYBYTES)
    throw new Error('bad secret key size');
  var pk = new Uint8Array(crypto_sign_PUBLICKEYBYTES);
  for (var i = 0; i < pk.length; i++) pk[i] = secretKey[32+i];
  return {publicKey: pk, secretKey: new Uint8Array(secretKey)};
};

nacl.sign.keyPair.fromSeed = function(seed) {
  checkArrayTypes(seed);
  if (seed.length !== crypto_sign_SEEDBYTES)
    throw new Error('bad seed size');
  var pk = new Uint8Array(crypto_sign_PUBLICKEYBYTES);
  var sk = new Uint8Array(crypto_sign_SECRETKEYBYTES);
  for (var i = 0; i < 32; i++) sk[i] = seed[i];
  crypto_sign_keypair(pk, sk, true);
  return {publicKey: pk, secretKey: sk};
};

nacl.sign.publicKeyLength = crypto_sign_PUBLICKEYBYTES;
nacl.sign.secretKeyLength = crypto_sign_SECRETKEYBYTES;
nacl.sign.seedLength = crypto_sign_SEEDBYTES;
nacl.sign.signatureLength = crypto_sign_BYTES;

nacl.hash = function(msg) {
  checkArrayTypes(msg);
  var h = new Uint8Array(crypto_hash_BYTES);
  crypto_hash(h, msg, msg.length);
  return h;
};

nacl.hash.hashLength = crypto_hash_BYTES;

nacl.verify = function(x, y) {
  checkArrayTypes(x, y);
  // Zero length arguments are considered not equal.
  if (x.length === 0 || y.length === 0) return false;
  if (x.length !== y.length) return false;
  return (vn(x, 0, y, 0, x.length) === 0) ? true : false;
};

nacl.setPRNG = function(fn) {
  randombytes = fn;
};

(function() {
  // Initialize PRNG if environment provides CSPRNG.
  // If not, methods calling randombytes will throw.
  var crypto = typeof self !== 'undefined' ? (self.crypto || self.msCrypto) : null;
  if (crypto && crypto.getRandomValues) {
    // Browsers.
    var QUOTA = 65536;
    nacl.setPRNG(function(x, n) {
      var i, v = new Uint8Array(n);
      for (i = 0; i < n; i += QUOTA) {
        crypto.getRandomValues(v.subarray(i, i + Math.min(n - i, QUOTA)));
      }
      for (i = 0; i < n; i++) x[i] = v[i];
      cleanup(v);
    });
  } else if (typeof require !== 'undefined') {
    // Node.js.
    crypto = require('crypto');
    if (crypto && crypto.randomBytes) {
      nacl.setPRNG(function(x, n) {
        var i, v = crypto.randomBytes(n);
        for (i = 0; i < n; i++) x[i] = v[i];
        cleanup(v);
      });
    }
  }
})();

})(typeof module !== 'undefined' && module.exports ? module.exports : (self.nacl = self.nacl || {}));

},{"crypto":21}],7:[function(require,module,exports){
'use strict';

var turnOrder = require('./turn-order-8e019db0.js');
var reducer = require('./reducer-943f1bac.js');
var flatted = require('flatted');
var ai = require('./ai-d0173761.js');

function noop() { }
const identity = x => x;
function assign(tar, src) {
    // @ts-ignore
    for (const k in src)
        tar[k] = src[k];
    return tar;
}
function run(fn) {
    return fn();
}
function blank_object() {
    return Object.create(null);
}
function run_all(fns) {
    fns.forEach(run);
}
function is_function(thing) {
    return typeof thing === 'function';
}
function safe_not_equal(a, b) {
    return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
}
function is_empty(obj) {
    return Object.keys(obj).length === 0;
}
function subscribe(store, ...callbacks) {
    if (store == null) {
        return noop;
    }
    const unsub = store.subscribe(...callbacks);
    return unsub.unsubscribe ? () => unsub.unsubscribe() : unsub;
}
function component_subscribe(component, store, callback) {
    component.$$.on_destroy.push(subscribe(store, callback));
}
function create_slot(definition, ctx, $$scope, fn) {
    if (definition) {
        const slot_ctx = get_slot_context(definition, ctx, $$scope, fn);
        return definition[0](slot_ctx);
    }
}
function get_slot_context(definition, ctx, $$scope, fn) {
    return definition[1] && fn
        ? assign($$scope.ctx.slice(), definition[1](fn(ctx)))
        : $$scope.ctx;
}
function get_slot_changes(definition, $$scope, dirty, fn) {
    if (definition[2] && fn) {
        const lets = definition[2](fn(dirty));
        if ($$scope.dirty === undefined) {
            return lets;
        }
        if (typeof lets === 'object') {
            const merged = [];
            const len = Math.max($$scope.dirty.length, lets.length);
            for (let i = 0; i < len; i += 1) {
                merged[i] = $$scope.dirty[i] | lets[i];
            }
            return merged;
        }
        return $$scope.dirty | lets;
    }
    return $$scope.dirty;
}
function update_slot_base(slot, slot_definition, ctx, $$scope, slot_changes, get_slot_context_fn) {
    if (slot_changes) {
        const slot_context = get_slot_context(slot_definition, ctx, $$scope, get_slot_context_fn);
        slot.p(slot_context, slot_changes);
    }
}
function get_all_dirty_from_scope($$scope) {
    if ($$scope.ctx.length > 32) {
        const dirty = [];
        const length = $$scope.ctx.length / 32;
        for (let i = 0; i < length; i++) {
            dirty[i] = -1;
        }
        return dirty;
    }
    return -1;
}
function exclude_internal_props(props) {
    const result = {};
    for (const k in props)
        if (k[0] !== '$')
            result[k] = props[k];
    return result;
}
function null_to_empty(value) {
    return value == null ? '' : value;
}

const is_client = typeof window !== 'undefined';
let now = is_client
    ? () => window.performance.now()
    : () => Date.now();
let raf = is_client ? cb => requestAnimationFrame(cb) : noop;

const tasks = new Set();
function run_tasks(now) {
    tasks.forEach(task => {
        if (!task.c(now)) {
            tasks.delete(task);
            task.f();
        }
    });
    if (tasks.size !== 0)
        raf(run_tasks);
}
/**
 * Creates a new task that runs on each raf frame
 * until it returns a falsy value or is aborted
 */
function loop(callback) {
    let task;
    if (tasks.size === 0)
        raf(run_tasks);
    return {
        promise: new Promise(fulfill => {
            tasks.add(task = { c: callback, f: fulfill });
        }),
        abort() {
            tasks.delete(task);
        }
    };
}
function append(target, node) {
    target.appendChild(node);
}
function append_styles(target, style_sheet_id, styles) {
    const append_styles_to = get_root_for_style(target);
    if (!append_styles_to.getElementById(style_sheet_id)) {
        const style = element('style');
        style.id = style_sheet_id;
        style.textContent = styles;
        append_stylesheet(append_styles_to, style);
    }
}
function get_root_for_style(node) {
    if (!node)
        return document;
    const root = node.getRootNode ? node.getRootNode() : node.ownerDocument;
    if (root.host) {
        return root;
    }
    return document;
}
function append_empty_stylesheet(node) {
    const style_element = element('style');
    append_stylesheet(get_root_for_style(node), style_element);
    return style_element;
}
function append_stylesheet(node, style) {
    append(node.head || node, style);
}
function insert(target, node, anchor) {
    target.insertBefore(node, anchor || null);
}
function detach(node) {
    node.parentNode.removeChild(node);
}
function destroy_each(iterations, detaching) {
    for (let i = 0; i < iterations.length; i += 1) {
        if (iterations[i])
            iterations[i].d(detaching);
    }
}
function element(name) {
    return document.createElement(name);
}
function svg_element(name) {
    return document.createElementNS('http://www.w3.org/2000/svg', name);
}
function text(data) {
    return document.createTextNode(data);
}
function space() {
    return text(' ');
}
function empty() {
    return text('');
}
function listen(node, event, handler, options) {
    node.addEventListener(event, handler, options);
    return () => node.removeEventListener(event, handler, options);
}
function stop_propagation(fn) {
    return function (event) {
        event.stopPropagation();
        // @ts-ignore
        return fn.call(this, event);
    };
}
function attr(node, attribute, value) {
    if (value == null)
        node.removeAttribute(attribute);
    else if (node.getAttribute(attribute) !== value)
        node.setAttribute(attribute, value);
}
function to_number(value) {
    return value === '' ? null : +value;
}
function children(element) {
    return Array.from(element.childNodes);
}
function set_data(text, data) {
    data = '' + data;
    if (text.wholeText !== data)
        text.data = data;
}
function set_input_value(input, value) {
    input.value = value == null ? '' : value;
}
function select_option(select, value) {
    for (let i = 0; i < select.options.length; i += 1) {
        const option = select.options[i];
        if (option.__value === value) {
            option.selected = true;
            return;
        }
    }
}
function select_value(select) {
    const selected_option = select.querySelector(':checked') || select.options[0];
    return selected_option && selected_option.__value;
}
function toggle_class(element, name, toggle) {
    element.classList[toggle ? 'add' : 'remove'](name);
}
function custom_event(type, detail, bubbles = false) {
    const e = document.createEvent('CustomEvent');
    e.initCustomEvent(type, bubbles, false, detail);
    return e;
}

const active_docs = new Set();
let active = 0;
// https://github.com/darkskyapp/string-hash/blob/master/index.js
function hash(str) {
    let hash = 5381;
    let i = str.length;
    while (i--)
        hash = ((hash << 5) - hash) ^ str.charCodeAt(i);
    return hash >>> 0;
}
function create_rule(node, a, b, duration, delay, ease, fn, uid = 0) {
    const step = 16.666 / duration;
    let keyframes = '{\n';
    for (let p = 0; p <= 1; p += step) {
        const t = a + (b - a) * ease(p);
        keyframes += p * 100 + `%{${fn(t, 1 - t)}}\n`;
    }
    const rule = keyframes + `100% {${fn(b, 1 - b)}}\n}`;
    const name = `__svelte_${hash(rule)}_${uid}`;
    const doc = get_root_for_style(node);
    active_docs.add(doc);
    const stylesheet = doc.__svelte_stylesheet || (doc.__svelte_stylesheet = append_empty_stylesheet(node).sheet);
    const current_rules = doc.__svelte_rules || (doc.__svelte_rules = {});
    if (!current_rules[name]) {
        current_rules[name] = true;
        stylesheet.insertRule(`@keyframes ${name} ${rule}`, stylesheet.cssRules.length);
    }
    const animation = node.style.animation || '';
    node.style.animation = `${animation ? `${animation}, ` : ''}${name} ${duration}ms linear ${delay}ms 1 both`;
    active += 1;
    return name;
}
function delete_rule(node, name) {
    const previous = (node.style.animation || '').split(', ');
    const next = previous.filter(name
        ? anim => anim.indexOf(name) < 0 // remove specific animation
        : anim => anim.indexOf('__svelte') === -1 // remove all Svelte animations
    );
    const deleted = previous.length - next.length;
    if (deleted) {
        node.style.animation = next.join(', ');
        active -= deleted;
        if (!active)
            clear_rules();
    }
}
function clear_rules() {
    raf(() => {
        if (active)
            return;
        active_docs.forEach(doc => {
            const stylesheet = doc.__svelte_stylesheet;
            let i = stylesheet.cssRules.length;
            while (i--)
                stylesheet.deleteRule(i);
            doc.__svelte_rules = {};
        });
        active_docs.clear();
    });
}

let current_component;
function set_current_component(component) {
    current_component = component;
}
function get_current_component() {
    if (!current_component)
        throw new Error('Function called outside component initialization');
    return current_component;
}
function afterUpdate(fn) {
    get_current_component().$$.after_update.push(fn);
}
function onDestroy(fn) {
    get_current_component().$$.on_destroy.push(fn);
}
function createEventDispatcher() {
    const component = get_current_component();
    return (type, detail) => {
        const callbacks = component.$$.callbacks[type];
        if (callbacks) {
            // TODO are there situations where events could be dispatched
            // in a server (non-DOM) environment?
            const event = custom_event(type, detail);
            callbacks.slice().forEach(fn => {
                fn.call(component, event);
            });
        }
    };
}
function setContext(key, context) {
    get_current_component().$$.context.set(key, context);
}
function getContext(key) {
    return get_current_component().$$.context.get(key);
}
// TODO figure out if we still want to support
// shorthand events, or if we want to implement
// a real bubbling mechanism
function bubble(component, event) {
    const callbacks = component.$$.callbacks[event.type];
    if (callbacks) {
        // @ts-ignore
        callbacks.slice().forEach(fn => fn.call(this, event));
    }
}

const dirty_components = [];
const binding_callbacks = [];
const render_callbacks = [];
const flush_callbacks = [];
const resolved_promise = Promise.resolve();
let update_scheduled = false;
function schedule_update() {
    if (!update_scheduled) {
        update_scheduled = true;
        resolved_promise.then(flush);
    }
}
function add_render_callback(fn) {
    render_callbacks.push(fn);
}
let flushing = false;
const seen_callbacks = new Set();
function flush() {
    if (flushing)
        return;
    flushing = true;
    do {
        // first, call beforeUpdate functions
        // and update components
        for (let i = 0; i < dirty_components.length; i += 1) {
            const component = dirty_components[i];
            set_current_component(component);
            update(component.$$);
        }
        set_current_component(null);
        dirty_components.length = 0;
        while (binding_callbacks.length)
            binding_callbacks.pop()();
        // then, once components are updated, call
        // afterUpdate functions. This may cause
        // subsequent updates...
        for (let i = 0; i < render_callbacks.length; i += 1) {
            const callback = render_callbacks[i];
            if (!seen_callbacks.has(callback)) {
                // ...so guard against infinite loops
                seen_callbacks.add(callback);
                callback();
            }
        }
        render_callbacks.length = 0;
    } while (dirty_components.length);
    while (flush_callbacks.length) {
        flush_callbacks.pop()();
    }
    update_scheduled = false;
    flushing = false;
    seen_callbacks.clear();
}
function update($$) {
    if ($$.fragment !== null) {
        $$.update();
        run_all($$.before_update);
        const dirty = $$.dirty;
        $$.dirty = [-1];
        $$.fragment && $$.fragment.p($$.ctx, dirty);
        $$.after_update.forEach(add_render_callback);
    }
}

let promise;
function wait() {
    if (!promise) {
        promise = Promise.resolve();
        promise.then(() => {
            promise = null;
        });
    }
    return promise;
}
function dispatch(node, direction, kind) {
    node.dispatchEvent(custom_event(`${direction ? 'intro' : 'outro'}${kind}`));
}
const outroing = new Set();
let outros;
function group_outros() {
    outros = {
        r: 0,
        c: [],
        p: outros // parent group
    };
}
function check_outros() {
    if (!outros.r) {
        run_all(outros.c);
    }
    outros = outros.p;
}
function transition_in(block, local) {
    if (block && block.i) {
        outroing.delete(block);
        block.i(local);
    }
}
function transition_out(block, local, detach, callback) {
    if (block && block.o) {
        if (outroing.has(block))
            return;
        outroing.add(block);
        outros.c.push(() => {
            outroing.delete(block);
            if (callback) {
                if (detach)
                    block.d(1);
                callback();
            }
        });
        block.o(local);
    }
}
const null_transition = { duration: 0 };
function create_in_transition(node, fn, params) {
    let config = fn(node, params);
    let running = false;
    let animation_name;
    let task;
    let uid = 0;
    function cleanup() {
        if (animation_name)
            delete_rule(node, animation_name);
    }
    function go() {
        const { delay = 0, duration = 300, easing = identity, tick = noop, css } = config || null_transition;
        if (css)
            animation_name = create_rule(node, 0, 1, duration, delay, easing, css, uid++);
        tick(0, 1);
        const start_time = now() + delay;
        const end_time = start_time + duration;
        if (task)
            task.abort();
        running = true;
        add_render_callback(() => dispatch(node, true, 'start'));
        task = loop(now => {
            if (running) {
                if (now >= end_time) {
                    tick(1, 0);
                    dispatch(node, true, 'end');
                    cleanup();
                    return running = false;
                }
                if (now >= start_time) {
                    const t = easing((now - start_time) / duration);
                    tick(t, 1 - t);
                }
            }
            return running;
        });
    }
    let started = false;
    return {
        start() {
            if (started)
                return;
            started = true;
            delete_rule(node);
            if (is_function(config)) {
                config = config();
                wait().then(go);
            }
            else {
                go();
            }
        },
        invalidate() {
            started = false;
        },
        end() {
            if (running) {
                cleanup();
                running = false;
            }
        }
    };
}
function create_out_transition(node, fn, params) {
    let config = fn(node, params);
    let running = true;
    let animation_name;
    const group = outros;
    group.r += 1;
    function go() {
        const { delay = 0, duration = 300, easing = identity, tick = noop, css } = config || null_transition;
        if (css)
            animation_name = create_rule(node, 1, 0, duration, delay, easing, css);
        const start_time = now() + delay;
        const end_time = start_time + duration;
        add_render_callback(() => dispatch(node, false, 'start'));
        loop(now => {
            if (running) {
                if (now >= end_time) {
                    tick(0, 1);
                    dispatch(node, false, 'end');
                    if (!--group.r) {
                        // this will result in `end()` being called,
                        // so we don't need to clean up here
                        run_all(group.c);
                    }
                    return false;
                }
                if (now >= start_time) {
                    const t = easing((now - start_time) / duration);
                    tick(1 - t, t);
                }
            }
            return running;
        });
    }
    if (is_function(config)) {
        wait().then(() => {
            // @ts-ignore
            config = config();
            go();
        });
    }
    else {
        go();
    }
    return {
        end(reset) {
            if (reset && config.tick) {
                config.tick(1, 0);
            }
            if (running) {
                if (animation_name)
                    delete_rule(node, animation_name);
                running = false;
            }
        }
    };
}
function create_bidirectional_transition(node, fn, params, intro) {
    let config = fn(node, params);
    let t = intro ? 0 : 1;
    let running_program = null;
    let pending_program = null;
    let animation_name = null;
    function clear_animation() {
        if (animation_name)
            delete_rule(node, animation_name);
    }
    function init(program, duration) {
        const d = (program.b - t);
        duration *= Math.abs(d);
        return {
            a: t,
            b: program.b,
            d,
            duration,
            start: program.start,
            end: program.start + duration,
            group: program.group
        };
    }
    function go(b) {
        const { delay = 0, duration = 300, easing = identity, tick = noop, css } = config || null_transition;
        const program = {
            start: now() + delay,
            b
        };
        if (!b) {
            // @ts-ignore todo: improve typings
            program.group = outros;
            outros.r += 1;
        }
        if (running_program || pending_program) {
            pending_program = program;
        }
        else {
            // if this is an intro, and there's a delay, we need to do
            // an initial tick and/or apply CSS animation immediately
            if (css) {
                clear_animation();
                animation_name = create_rule(node, t, b, duration, delay, easing, css);
            }
            if (b)
                tick(0, 1);
            running_program = init(program, duration);
            add_render_callback(() => dispatch(node, b, 'start'));
            loop(now => {
                if (pending_program && now > pending_program.start) {
                    running_program = init(pending_program, duration);
                    pending_program = null;
                    dispatch(node, running_program.b, 'start');
                    if (css) {
                        clear_animation();
                        animation_name = create_rule(node, t, running_program.b, running_program.duration, 0, easing, config.css);
                    }
                }
                if (running_program) {
                    if (now >= running_program.end) {
                        tick(t = running_program.b, 1 - t);
                        dispatch(node, running_program.b, 'end');
                        if (!pending_program) {
                            // we're done
                            if (running_program.b) {
                                // intro — we can tidy up immediately
                                clear_animation();
                            }
                            else {
                                // outro — needs to be coordinated
                                if (!--running_program.group.r)
                                    run_all(running_program.group.c);
                            }
                        }
                        running_program = null;
                    }
                    else if (now >= running_program.start) {
                        const p = now - running_program.start;
                        t = running_program.a + running_program.d * easing(p / running_program.duration);
                        tick(t, 1 - t);
                    }
                }
                return !!(running_program || pending_program);
            });
        }
    }
    return {
        run(b) {
            if (is_function(config)) {
                wait().then(() => {
                    // @ts-ignore
                    config = config();
                    go(b);
                });
            }
            else {
                go(b);
            }
        },
        end() {
            clear_animation();
            running_program = pending_program = null;
        }
    };
}

function get_spread_update(levels, updates) {
    const update = {};
    const to_null_out = {};
    const accounted_for = { $$scope: 1 };
    let i = levels.length;
    while (i--) {
        const o = levels[i];
        const n = updates[i];
        if (n) {
            for (const key in o) {
                if (!(key in n))
                    to_null_out[key] = 1;
            }
            for (const key in n) {
                if (!accounted_for[key]) {
                    update[key] = n[key];
                    accounted_for[key] = 1;
                }
            }
            levels[i] = n;
        }
        else {
            for (const key in o) {
                accounted_for[key] = 1;
            }
        }
    }
    for (const key in to_null_out) {
        if (!(key in update))
            update[key] = undefined;
    }
    return update;
}
function get_spread_object(spread_props) {
    return typeof spread_props === 'object' && spread_props !== null ? spread_props : {};
}
function create_component(block) {
    block && block.c();
}
function mount_component(component, target, anchor, customElement) {
    const { fragment, on_mount, on_destroy, after_update } = component.$$;
    fragment && fragment.m(target, anchor);
    if (!customElement) {
        // onMount happens before the initial afterUpdate
        add_render_callback(() => {
            const new_on_destroy = on_mount.map(run).filter(is_function);
            if (on_destroy) {
                on_destroy.push(...new_on_destroy);
            }
            else {
                // Edge case - component was destroyed immediately,
                // most likely as a result of a binding initialising
                run_all(new_on_destroy);
            }
            component.$$.on_mount = [];
        });
    }
    after_update.forEach(add_render_callback);
}
function destroy_component(component, detaching) {
    const $$ = component.$$;
    if ($$.fragment !== null) {
        run_all($$.on_destroy);
        $$.fragment && $$.fragment.d(detaching);
        // TODO null out other refs, including component.$$ (but need to
        // preserve final state?)
        $$.on_destroy = $$.fragment = null;
        $$.ctx = [];
    }
}
function make_dirty(component, i) {
    if (component.$$.dirty[0] === -1) {
        dirty_components.push(component);
        schedule_update();
        component.$$.dirty.fill(0);
    }
    component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
}
function init(component, options, instance, create_fragment, not_equal, props, append_styles, dirty = [-1]) {
    const parent_component = current_component;
    set_current_component(component);
    const $$ = component.$$ = {
        fragment: null,
        ctx: null,
        // state
        props,
        update: noop,
        not_equal,
        bound: blank_object(),
        // lifecycle
        on_mount: [],
        on_destroy: [],
        on_disconnect: [],
        before_update: [],
        after_update: [],
        context: new Map(parent_component ? parent_component.$$.context : options.context || []),
        // everything else
        callbacks: blank_object(),
        dirty,
        skip_bound: false,
        root: options.target || parent_component.$$.root
    };
    append_styles && append_styles($$.root);
    let ready = false;
    $$.ctx = instance
        ? instance(component, options.props || {}, (i, ret, ...rest) => {
            const value = rest.length ? rest[0] : ret;
            if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                if (!$$.skip_bound && $$.bound[i])
                    $$.bound[i](value);
                if (ready)
                    make_dirty(component, i);
            }
            return ret;
        })
        : [];
    $$.update();
    ready = true;
    run_all($$.before_update);
    // `false` as a special case of no DOM component
    $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
    if (options.target) {
        if (options.hydrate) {
            const nodes = children(options.target);
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            $$.fragment && $$.fragment.l(nodes);
            nodes.forEach(detach);
        }
        else {
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            $$.fragment && $$.fragment.c();
        }
        if (options.intro)
            transition_in(component.$$.fragment);
        mount_component(component, options.target, options.anchor, options.customElement);
        flush();
    }
    set_current_component(parent_component);
}
/**
 * Base class for Svelte components. Used when dev=false.
 */
class SvelteComponent {
    $destroy() {
        destroy_component(this, 1);
        this.$destroy = noop;
    }
    $on(type, callback) {
        const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
        callbacks.push(callback);
        return () => {
            const index = callbacks.indexOf(callback);
            if (index !== -1)
                callbacks.splice(index, 1);
        };
    }
    $set($$props) {
        if (this.$$set && !is_empty($$props)) {
            this.$$.skip_bound = true;
            this.$$set($$props);
            this.$$.skip_bound = false;
        }
    }
}

const subscriber_queue = [];
/**
 * Create a `Writable` store that allows both updating and reading by subscription.
 * @param {*=}value initial value
 * @param {StartStopNotifier=}start start and stop notifications for subscriptions
 */
function writable(value, start = noop) {
    let stop;
    const subscribers = new Set();
    function set(new_value) {
        if (safe_not_equal(value, new_value)) {
            value = new_value;
            if (stop) { // store is ready
                const run_queue = !subscriber_queue.length;
                for (const subscriber of subscribers) {
                    subscriber[1]();
                    subscriber_queue.push(subscriber, value);
                }
                if (run_queue) {
                    for (let i = 0; i < subscriber_queue.length; i += 2) {
                        subscriber_queue[i][0](subscriber_queue[i + 1]);
                    }
                    subscriber_queue.length = 0;
                }
            }
        }
    }
    function update(fn) {
        set(fn(value));
    }
    function subscribe(run, invalidate = noop) {
        const subscriber = [run, invalidate];
        subscribers.add(subscriber);
        if (subscribers.size === 1) {
            stop = start(set) || noop;
        }
        run(value);
        return () => {
            subscribers.delete(subscriber);
            if (subscribers.size === 0) {
                stop();
                stop = null;
            }
        };
    }
    return { set, update, subscribe };
}

function cubicOut(t) {
    const f = t - 1.0;
    return f * f * f + 1.0;
}

/*! *****************************************************************************
Copyright (c) Microsoft Corporation.

Permission to use, copy, modify, and/or distribute this software for any
purpose with or without fee is hereby granted.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
PERFORMANCE OF THIS SOFTWARE.
***************************************************************************** */

function __rest(s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
}
function fly(node, { delay = 0, duration = 400, easing = cubicOut, x = 0, y = 0, opacity = 0 } = {}) {
    const style = getComputedStyle(node);
    const target_opacity = +style.opacity;
    const transform = style.transform === 'none' ? '' : style.transform;
    const od = target_opacity * (1 - opacity);
    return {
        delay,
        duration,
        easing,
        css: (t, u) => `
			transform: ${transform} translate(${(1 - t) * x}px, ${(1 - t) * y}px);
			opacity: ${target_opacity - (od * u)}`
    };
}
function crossfade(_a) {
    var { fallback } = _a, defaults = __rest(_a, ["fallback"]);
    const to_receive = new Map();
    const to_send = new Map();
    function crossfade(from, node, params) {
        const { delay = 0, duration = d => Math.sqrt(d) * 30, easing = cubicOut } = assign(assign({}, defaults), params);
        const to = node.getBoundingClientRect();
        const dx = from.left - to.left;
        const dy = from.top - to.top;
        const dw = from.width / to.width;
        const dh = from.height / to.height;
        const d = Math.sqrt(dx * dx + dy * dy);
        const style = getComputedStyle(node);
        const transform = style.transform === 'none' ? '' : style.transform;
        const opacity = +style.opacity;
        return {
            delay,
            duration: is_function(duration) ? duration(d) : duration,
            easing,
            css: (t, u) => `
				opacity: ${t * opacity};
				transform-origin: top left;
				transform: ${transform} translate(${u * dx}px,${u * dy}px) scale(${t + (1 - t) * dw}, ${t + (1 - t) * dh});
			`
        };
    }
    function transition(items, counterparts, intro) {
        return (node, params) => {
            items.set(params.key, {
                rect: node.getBoundingClientRect()
            });
            return () => {
                if (counterparts.has(params.key)) {
                    const { rect } = counterparts.get(params.key);
                    counterparts.delete(params.key);
                    return crossfade(rect, node, params);
                }
                // if the node is disappearing altogether
                // (i.e. wasn't claimed by the other list)
                // then we need to supply an outro
                items.delete(params.key);
                return fallback && fallback(node, params, intro);
            };
        };
    }
    return [
        transition(to_send, to_receive, false),
        transition(to_receive, to_send, true)
    ];
}

/* node_modules/svelte-icons/components/IconBase.svelte generated by Svelte v3.41.0 */

function add_css(target) {
	append_styles(target, "svelte-c8tyih", "svg.svelte-c8tyih{stroke:currentColor;fill:currentColor;stroke-width:0;width:100%;height:auto;max-height:100%}");
}

// (18:2) {#if title}
function create_if_block(ctx) {
	let title_1;
	let t;

	return {
		c() {
			title_1 = svg_element("title");
			t = text(/*title*/ ctx[0]);
		},
		m(target, anchor) {
			insert(target, title_1, anchor);
			append(title_1, t);
		},
		p(ctx, dirty) {
			if (dirty & /*title*/ 1) set_data(t, /*title*/ ctx[0]);
		},
		d(detaching) {
			if (detaching) detach(title_1);
		}
	};
}

function create_fragment(ctx) {
	let svg;
	let if_block_anchor;
	let current;
	let if_block = /*title*/ ctx[0] && create_if_block(ctx);
	const default_slot_template = /*#slots*/ ctx[3].default;
	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[2], null);

	return {
		c() {
			svg = svg_element("svg");
			if (if_block) if_block.c();
			if_block_anchor = empty();
			if (default_slot) default_slot.c();
			attr(svg, "xmlns", "http://www.w3.org/2000/svg");
			attr(svg, "viewBox", /*viewBox*/ ctx[1]);
			attr(svg, "class", "svelte-c8tyih");
		},
		m(target, anchor) {
			insert(target, svg, anchor);
			if (if_block) if_block.m(svg, null);
			append(svg, if_block_anchor);

			if (default_slot) {
				default_slot.m(svg, null);
			}

			current = true;
		},
		p(ctx, [dirty]) {
			if (/*title*/ ctx[0]) {
				if (if_block) {
					if_block.p(ctx, dirty);
				} else {
					if_block = create_if_block(ctx);
					if_block.c();
					if_block.m(svg, if_block_anchor);
				}
			} else if (if_block) {
				if_block.d(1);
				if_block = null;
			}

			if (default_slot) {
				if (default_slot.p && (!current || dirty & /*$$scope*/ 4)) {
					update_slot_base(
						default_slot,
						default_slot_template,
						ctx,
						/*$$scope*/ ctx[2],
						!current
						? get_all_dirty_from_scope(/*$$scope*/ ctx[2])
						: get_slot_changes(default_slot_template, /*$$scope*/ ctx[2], dirty, null),
						null
					);
				}
			}

			if (!current || dirty & /*viewBox*/ 2) {
				attr(svg, "viewBox", /*viewBox*/ ctx[1]);
			}
		},
		i(local) {
			if (current) return;
			transition_in(default_slot, local);
			current = true;
		},
		o(local) {
			transition_out(default_slot, local);
			current = false;
		},
		d(detaching) {
			if (detaching) detach(svg);
			if (if_block) if_block.d();
			if (default_slot) default_slot.d(detaching);
		}
	};
}

function instance($$self, $$props, $$invalidate) {
	let { $$slots: slots = {}, $$scope } = $$props;
	let { title = null } = $$props;
	let { viewBox } = $$props;

	$$self.$$set = $$props => {
		if ('title' in $$props) $$invalidate(0, title = $$props.title);
		if ('viewBox' in $$props) $$invalidate(1, viewBox = $$props.viewBox);
		if ('$$scope' in $$props) $$invalidate(2, $$scope = $$props.$$scope);
	};

	return [title, viewBox, $$scope, slots];
}

class IconBase extends SvelteComponent {
	constructor(options) {
		super();
		init(this, options, instance, create_fragment, safe_not_equal, { title: 0, viewBox: 1 }, add_css);
	}
}

/* node_modules/svelte-icons/fa/FaChevronRight.svelte generated by Svelte v3.41.0 */

function create_default_slot(ctx) {
	let path;

	return {
		c() {
			path = svg_element("path");
			attr(path, "d", "M285.476 272.971L91.132 467.314c-9.373 9.373-24.569 9.373-33.941 0l-22.667-22.667c-9.357-9.357-9.375-24.522-.04-33.901L188.505 256 34.484 101.255c-9.335-9.379-9.317-24.544.04-33.901l22.667-22.667c9.373-9.373 24.569-9.373 33.941 0L285.475 239.03c9.373 9.372 9.373 24.568.001 33.941z");
		},
		m(target, anchor) {
			insert(target, path, anchor);
		},
		d(detaching) {
			if (detaching) detach(path);
		}
	};
}

function create_fragment$1(ctx) {
	let iconbase;
	let current;
	const iconbase_spread_levels = [{ viewBox: "0 0 320 512" }, /*$$props*/ ctx[0]];

	let iconbase_props = {
		$$slots: { default: [create_default_slot] },
		$$scope: { ctx }
	};

	for (let i = 0; i < iconbase_spread_levels.length; i += 1) {
		iconbase_props = assign(iconbase_props, iconbase_spread_levels[i]);
	}

	iconbase = new IconBase({ props: iconbase_props });

	return {
		c() {
			create_component(iconbase.$$.fragment);
		},
		m(target, anchor) {
			mount_component(iconbase, target, anchor);
			current = true;
		},
		p(ctx, [dirty]) {
			const iconbase_changes = (dirty & /*$$props*/ 1)
			? get_spread_update(iconbase_spread_levels, [iconbase_spread_levels[0], get_spread_object(/*$$props*/ ctx[0])])
			: {};

			if (dirty & /*$$scope*/ 2) {
				iconbase_changes.$$scope = { dirty, ctx };
			}

			iconbase.$set(iconbase_changes);
		},
		i(local) {
			if (current) return;
			transition_in(iconbase.$$.fragment, local);
			current = true;
		},
		o(local) {
			transition_out(iconbase.$$.fragment, local);
			current = false;
		},
		d(detaching) {
			destroy_component(iconbase, detaching);
		}
	};
}

function instance$1($$self, $$props, $$invalidate) {
	$$self.$$set = $$new_props => {
		$$invalidate(0, $$props = assign(assign({}, $$props), exclude_internal_props($$new_props)));
	};

	$$props = exclude_internal_props($$props);
	return [$$props];
}

class FaChevronRight extends SvelteComponent {
	constructor(options) {
		super();
		init(this, options, instance$1, create_fragment$1, safe_not_equal, {});
	}
}

/* src/client/debug/Menu.svelte generated by Svelte v3.41.0 */

function add_css$1(target) {
	append_styles(target, "svelte-1xg9v5h", ".menu.svelte-1xg9v5h{display:flex;margin-top:43px;flex-direction:row-reverse;border:1px solid #ccc;border-radius:5px 5px 0 0;height:25px;line-height:25px;margin-right:-500px;transform-origin:bottom right;transform:rotate(-90deg) translate(0, -500px)}.menu-item.svelte-1xg9v5h{line-height:25px;cursor:pointer;border:0;background:#fefefe;color:#555;padding-left:15px;padding-right:15px;text-align:center}.menu-item.svelte-1xg9v5h:first-child{border-radius:0 5px 0 0}.menu-item.svelte-1xg9v5h:last-child{border-radius:5px 0 0 0}.menu-item.active.svelte-1xg9v5h{cursor:default;font-weight:bold;background:#ddd;color:#555}.menu-item.svelte-1xg9v5h:hover,.menu-item.svelte-1xg9v5h:focus{background:#eee;color:#555}");
}

function get_each_context(ctx, list, i) {
	const child_ctx = ctx.slice();
	child_ctx[4] = list[i][0];
	child_ctx[5] = list[i][1].label;
	return child_ctx;
}

// (57:2) {#each Object.entries(panes) as [key, {label}
function create_each_block(ctx) {
	let button;
	let t0_value = /*label*/ ctx[5] + "";
	let t0;
	let t1;
	let mounted;
	let dispose;

	function click_handler() {
		return /*click_handler*/ ctx[3](/*key*/ ctx[4]);
	}

	return {
		c() {
			button = element("button");
			t0 = text(t0_value);
			t1 = space();
			attr(button, "class", "menu-item svelte-1xg9v5h");
			toggle_class(button, "active", /*pane*/ ctx[0] == /*key*/ ctx[4]);
		},
		m(target, anchor) {
			insert(target, button, anchor);
			append(button, t0);
			append(button, t1);

			if (!mounted) {
				dispose = listen(button, "click", click_handler);
				mounted = true;
			}
		},
		p(new_ctx, dirty) {
			ctx = new_ctx;
			if (dirty & /*panes*/ 2 && t0_value !== (t0_value = /*label*/ ctx[5] + "")) set_data(t0, t0_value);

			if (dirty & /*pane, Object, panes*/ 3) {
				toggle_class(button, "active", /*pane*/ ctx[0] == /*key*/ ctx[4]);
			}
		},
		d(detaching) {
			if (detaching) detach(button);
			mounted = false;
			dispose();
		}
	};
}

function create_fragment$2(ctx) {
	let nav;
	let each_value = Object.entries(/*panes*/ ctx[1]);
	let each_blocks = [];

	for (let i = 0; i < each_value.length; i += 1) {
		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
	}

	return {
		c() {
			nav = element("nav");

			for (let i = 0; i < each_blocks.length; i += 1) {
				each_blocks[i].c();
			}

			attr(nav, "class", "menu svelte-1xg9v5h");
		},
		m(target, anchor) {
			insert(target, nav, anchor);

			for (let i = 0; i < each_blocks.length; i += 1) {
				each_blocks[i].m(nav, null);
			}
		},
		p(ctx, [dirty]) {
			if (dirty & /*pane, Object, panes, dispatch*/ 7) {
				each_value = Object.entries(/*panes*/ ctx[1]);
				let i;

				for (i = 0; i < each_value.length; i += 1) {
					const child_ctx = get_each_context(ctx, each_value, i);

					if (each_blocks[i]) {
						each_blocks[i].p(child_ctx, dirty);
					} else {
						each_blocks[i] = create_each_block(child_ctx);
						each_blocks[i].c();
						each_blocks[i].m(nav, null);
					}
				}

				for (; i < each_blocks.length; i += 1) {
					each_blocks[i].d(1);
				}

				each_blocks.length = each_value.length;
			}
		},
		i: noop,
		o: noop,
		d(detaching) {
			if (detaching) detach(nav);
			destroy_each(each_blocks, detaching);
		}
	};
}

function instance$2($$self, $$props, $$invalidate) {
	let { pane } = $$props;
	let { panes } = $$props;
	const dispatch = createEventDispatcher();
	const click_handler = key => dispatch('change', key);

	$$self.$$set = $$props => {
		if ('pane' in $$props) $$invalidate(0, pane = $$props.pane);
		if ('panes' in $$props) $$invalidate(1, panes = $$props.panes);
	};

	return [pane, panes, dispatch, click_handler];
}

class Menu extends SvelteComponent {
	constructor(options) {
		super();
		init(this, options, instance$2, create_fragment$2, safe_not_equal, { pane: 0, panes: 1 }, add_css$1);
	}
}

var contextKey = {};

/* node_modules/svelte-json-tree-auto/src/JSONArrow.svelte generated by Svelte v3.41.0 */

function add_css$2(target) {
	append_styles(target, "svelte-1vyml86", ".container.svelte-1vyml86{display:inline-block;cursor:pointer;transform:translate(calc(0px - var(--li-identation)), -50%);position:absolute;top:50%;padding-right:100%}.arrow.svelte-1vyml86{transform-origin:25% 50%;position:relative;line-height:1.1em;font-size:0.75em;margin-left:0;transition:150ms;color:var(--arrow-sign);user-select:none;font-family:'Courier New', Courier, monospace}.expanded.svelte-1vyml86{transform:rotateZ(90deg) translateX(-3px)}");
}

function create_fragment$3(ctx) {
	let div1;
	let div0;
	let mounted;
	let dispose;

	return {
		c() {
			div1 = element("div");
			div0 = element("div");
			div0.textContent = `${'\u25B6'}`;
			attr(div0, "class", "arrow svelte-1vyml86");
			toggle_class(div0, "expanded", /*expanded*/ ctx[0]);
			attr(div1, "class", "container svelte-1vyml86");
		},
		m(target, anchor) {
			insert(target, div1, anchor);
			append(div1, div0);

			if (!mounted) {
				dispose = listen(div1, "click", /*click_handler*/ ctx[1]);
				mounted = true;
			}
		},
		p(ctx, [dirty]) {
			if (dirty & /*expanded*/ 1) {
				toggle_class(div0, "expanded", /*expanded*/ ctx[0]);
			}
		},
		i: noop,
		o: noop,
		d(detaching) {
			if (detaching) detach(div1);
			mounted = false;
			dispose();
		}
	};
}

function instance$3($$self, $$props, $$invalidate) {
	let { expanded } = $$props;

	function click_handler(event) {
		bubble.call(this, $$self, event);
	}

	$$self.$$set = $$props => {
		if ('expanded' in $$props) $$invalidate(0, expanded = $$props.expanded);
	};

	return [expanded, click_handler];
}

class JSONArrow extends SvelteComponent {
	constructor(options) {
		super();
		init(this, options, instance$3, create_fragment$3, safe_not_equal, { expanded: 0 }, add_css$2);
	}
}

/* node_modules/svelte-json-tree-auto/src/JSONKey.svelte generated by Svelte v3.41.0 */

function add_css$3(target) {
	append_styles(target, "svelte-1vlbacg", "label.svelte-1vlbacg{display:inline-block;color:var(--label-color);padding:0}.spaced.svelte-1vlbacg{padding-right:var(--li-colon-space)}");
}

// (16:0) {#if showKey && key}
function create_if_block$1(ctx) {
	let label;
	let span;
	let t0;
	let t1;
	let mounted;
	let dispose;

	return {
		c() {
			label = element("label");
			span = element("span");
			t0 = text(/*key*/ ctx[0]);
			t1 = text(/*colon*/ ctx[2]);
			attr(label, "class", "svelte-1vlbacg");
			toggle_class(label, "spaced", /*isParentExpanded*/ ctx[1]);
		},
		m(target, anchor) {
			insert(target, label, anchor);
			append(label, span);
			append(span, t0);
			append(span, t1);

			if (!mounted) {
				dispose = listen(label, "click", /*click_handler*/ ctx[5]);
				mounted = true;
			}
		},
		p(ctx, dirty) {
			if (dirty & /*key*/ 1) set_data(t0, /*key*/ ctx[0]);
			if (dirty & /*colon*/ 4) set_data(t1, /*colon*/ ctx[2]);

			if (dirty & /*isParentExpanded*/ 2) {
				toggle_class(label, "spaced", /*isParentExpanded*/ ctx[1]);
			}
		},
		d(detaching) {
			if (detaching) detach(label);
			mounted = false;
			dispose();
		}
	};
}

function create_fragment$4(ctx) {
	let if_block_anchor;
	let if_block = /*showKey*/ ctx[3] && /*key*/ ctx[0] && create_if_block$1(ctx);

	return {
		c() {
			if (if_block) if_block.c();
			if_block_anchor = empty();
		},
		m(target, anchor) {
			if (if_block) if_block.m(target, anchor);
			insert(target, if_block_anchor, anchor);
		},
		p(ctx, [dirty]) {
			if (/*showKey*/ ctx[3] && /*key*/ ctx[0]) {
				if (if_block) {
					if_block.p(ctx, dirty);
				} else {
					if_block = create_if_block$1(ctx);
					if_block.c();
					if_block.m(if_block_anchor.parentNode, if_block_anchor);
				}
			} else if (if_block) {
				if_block.d(1);
				if_block = null;
			}
		},
		i: noop,
		o: noop,
		d(detaching) {
			if (if_block) if_block.d(detaching);
			if (detaching) detach(if_block_anchor);
		}
	};
}

function instance$4($$self, $$props, $$invalidate) {
	let showKey;
	let { key, isParentExpanded, isParentArray = false, colon = ':' } = $$props;

	function click_handler(event) {
		bubble.call(this, $$self, event);
	}

	$$self.$$set = $$props => {
		if ('key' in $$props) $$invalidate(0, key = $$props.key);
		if ('isParentExpanded' in $$props) $$invalidate(1, isParentExpanded = $$props.isParentExpanded);
		if ('isParentArray' in $$props) $$invalidate(4, isParentArray = $$props.isParentArray);
		if ('colon' in $$props) $$invalidate(2, colon = $$props.colon);
	};

	$$self.$$.update = () => {
		if ($$self.$$.dirty & /*isParentExpanded, isParentArray, key*/ 19) {
			 $$invalidate(3, showKey = isParentExpanded || !isParentArray || key != +key);
		}
	};

	return [key, isParentExpanded, colon, showKey, isParentArray, click_handler];
}

class JSONKey extends SvelteComponent {
	constructor(options) {
		super();

		init(
			this,
			options,
			instance$4,
			create_fragment$4,
			safe_not_equal,
			{
				key: 0,
				isParentExpanded: 1,
				isParentArray: 4,
				colon: 2
			},
			add_css$3
		);
	}
}

/* node_modules/svelte-json-tree-auto/src/JSONNested.svelte generated by Svelte v3.41.0 */

function add_css$4(target) {
	append_styles(target, "svelte-rwxv37", "label.svelte-rwxv37{display:inline-block}.indent.svelte-rwxv37{padding-left:var(--li-identation)}.collapse.svelte-rwxv37{--li-display:inline;display:inline;font-style:italic}.comma.svelte-rwxv37{margin-left:-0.5em;margin-right:0.5em}label.svelte-rwxv37{position:relative}");
}

function get_each_context$1(ctx, list, i) {
	const child_ctx = ctx.slice();
	child_ctx[12] = list[i];
	child_ctx[20] = i;
	return child_ctx;
}

// (57:4) {#if expandable && isParentExpanded}
function create_if_block_3(ctx) {
	let jsonarrow;
	let current;
	jsonarrow = new JSONArrow({ props: { expanded: /*expanded*/ ctx[0] } });
	jsonarrow.$on("click", /*toggleExpand*/ ctx[15]);

	return {
		c() {
			create_component(jsonarrow.$$.fragment);
		},
		m(target, anchor) {
			mount_component(jsonarrow, target, anchor);
			current = true;
		},
		p(ctx, dirty) {
			const jsonarrow_changes = {};
			if (dirty & /*expanded*/ 1) jsonarrow_changes.expanded = /*expanded*/ ctx[0];
			jsonarrow.$set(jsonarrow_changes);
		},
		i(local) {
			if (current) return;
			transition_in(jsonarrow.$$.fragment, local);
			current = true;
		},
		o(local) {
			transition_out(jsonarrow.$$.fragment, local);
			current = false;
		},
		d(detaching) {
			destroy_component(jsonarrow, detaching);
		}
	};
}

// (75:4) {:else}
function create_else_block(ctx) {
	let span;

	return {
		c() {
			span = element("span");
			span.textContent = "…";
		},
		m(target, anchor) {
			insert(target, span, anchor);
		},
		p: noop,
		i: noop,
		o: noop,
		d(detaching) {
			if (detaching) detach(span);
		}
	};
}

// (63:4) {#if isParentExpanded}
function create_if_block$2(ctx) {
	let ul;
	let t;
	let current;
	let mounted;
	let dispose;
	let each_value = /*slicedKeys*/ ctx[13];
	let each_blocks = [];

	for (let i = 0; i < each_value.length; i += 1) {
		each_blocks[i] = create_each_block$1(get_each_context$1(ctx, each_value, i));
	}

	const out = i => transition_out(each_blocks[i], 1, 1, () => {
		each_blocks[i] = null;
	});

	let if_block = /*slicedKeys*/ ctx[13].length < /*previewKeys*/ ctx[7].length && create_if_block_1();

	return {
		c() {
			ul = element("ul");

			for (let i = 0; i < each_blocks.length; i += 1) {
				each_blocks[i].c();
			}

			t = space();
			if (if_block) if_block.c();
			attr(ul, "class", "svelte-rwxv37");
			toggle_class(ul, "collapse", !/*expanded*/ ctx[0]);
		},
		m(target, anchor) {
			insert(target, ul, anchor);

			for (let i = 0; i < each_blocks.length; i += 1) {
				each_blocks[i].m(ul, null);
			}

			append(ul, t);
			if (if_block) if_block.m(ul, null);
			current = true;

			if (!mounted) {
				dispose = listen(ul, "click", /*expand*/ ctx[16]);
				mounted = true;
			}
		},
		p(ctx, dirty) {
			if (dirty & /*expanded, previewKeys, getKey, slicedKeys, isArray, getValue, getPreviewValue*/ 10129) {
				each_value = /*slicedKeys*/ ctx[13];
				let i;

				for (i = 0; i < each_value.length; i += 1) {
					const child_ctx = get_each_context$1(ctx, each_value, i);

					if (each_blocks[i]) {
						each_blocks[i].p(child_ctx, dirty);
						transition_in(each_blocks[i], 1);
					} else {
						each_blocks[i] = create_each_block$1(child_ctx);
						each_blocks[i].c();
						transition_in(each_blocks[i], 1);
						each_blocks[i].m(ul, t);
					}
				}

				group_outros();

				for (i = each_value.length; i < each_blocks.length; i += 1) {
					out(i);
				}

				check_outros();
			}

			if (/*slicedKeys*/ ctx[13].length < /*previewKeys*/ ctx[7].length) {
				if (if_block) ; else {
					if_block = create_if_block_1();
					if_block.c();
					if_block.m(ul, null);
				}
			} else if (if_block) {
				if_block.d(1);
				if_block = null;
			}

			if (dirty & /*expanded*/ 1) {
				toggle_class(ul, "collapse", !/*expanded*/ ctx[0]);
			}
		},
		i(local) {
			if (current) return;

			for (let i = 0; i < each_value.length; i += 1) {
				transition_in(each_blocks[i]);
			}

			current = true;
		},
		o(local) {
			each_blocks = each_blocks.filter(Boolean);

			for (let i = 0; i < each_blocks.length; i += 1) {
				transition_out(each_blocks[i]);
			}

			current = false;
		},
		d(detaching) {
			if (detaching) detach(ul);
			destroy_each(each_blocks, detaching);
			if (if_block) if_block.d();
			mounted = false;
			dispose();
		}
	};
}

// (67:10) {#if !expanded && index < previewKeys.length - 1}
function create_if_block_2(ctx) {
	let span;

	return {
		c() {
			span = element("span");
			span.textContent = ",";
			attr(span, "class", "comma svelte-rwxv37");
		},
		m(target, anchor) {
			insert(target, span, anchor);
		},
		d(detaching) {
			if (detaching) detach(span);
		}
	};
}

// (65:8) {#each slicedKeys as key, index}
function create_each_block$1(ctx) {
	let jsonnode;
	let t;
	let if_block_anchor;
	let current;

	jsonnode = new JSONNode({
			props: {
				key: /*getKey*/ ctx[8](/*key*/ ctx[12]),
				isParentExpanded: /*expanded*/ ctx[0],
				isParentArray: /*isArray*/ ctx[4],
				value: /*expanded*/ ctx[0]
				? /*getValue*/ ctx[9](/*key*/ ctx[12])
				: /*getPreviewValue*/ ctx[10](/*key*/ ctx[12])
			}
		});

	let if_block = !/*expanded*/ ctx[0] && /*index*/ ctx[20] < /*previewKeys*/ ctx[7].length - 1 && create_if_block_2();

	return {
		c() {
			create_component(jsonnode.$$.fragment);
			t = space();
			if (if_block) if_block.c();
			if_block_anchor = empty();
		},
		m(target, anchor) {
			mount_component(jsonnode, target, anchor);
			insert(target, t, anchor);
			if (if_block) if_block.m(target, anchor);
			insert(target, if_block_anchor, anchor);
			current = true;
		},
		p(ctx, dirty) {
			const jsonnode_changes = {};
			if (dirty & /*getKey, slicedKeys*/ 8448) jsonnode_changes.key = /*getKey*/ ctx[8](/*key*/ ctx[12]);
			if (dirty & /*expanded*/ 1) jsonnode_changes.isParentExpanded = /*expanded*/ ctx[0];
			if (dirty & /*isArray*/ 16) jsonnode_changes.isParentArray = /*isArray*/ ctx[4];

			if (dirty & /*expanded, getValue, slicedKeys, getPreviewValue*/ 9729) jsonnode_changes.value = /*expanded*/ ctx[0]
			? /*getValue*/ ctx[9](/*key*/ ctx[12])
			: /*getPreviewValue*/ ctx[10](/*key*/ ctx[12]);

			jsonnode.$set(jsonnode_changes);

			if (!/*expanded*/ ctx[0] && /*index*/ ctx[20] < /*previewKeys*/ ctx[7].length - 1) {
				if (if_block) ; else {
					if_block = create_if_block_2();
					if_block.c();
					if_block.m(if_block_anchor.parentNode, if_block_anchor);
				}
			} else if (if_block) {
				if_block.d(1);
				if_block = null;
			}
		},
		i(local) {
			if (current) return;
			transition_in(jsonnode.$$.fragment, local);
			current = true;
		},
		o(local) {
			transition_out(jsonnode.$$.fragment, local);
			current = false;
		},
		d(detaching) {
			destroy_component(jsonnode, detaching);
			if (detaching) detach(t);
			if (if_block) if_block.d(detaching);
			if (detaching) detach(if_block_anchor);
		}
	};
}

// (71:8) {#if slicedKeys.length < previewKeys.length }
function create_if_block_1(ctx) {
	let span;

	return {
		c() {
			span = element("span");
			span.textContent = "…";
		},
		m(target, anchor) {
			insert(target, span, anchor);
		},
		d(detaching) {
			if (detaching) detach(span);
		}
	};
}

function create_fragment$5(ctx) {
	let li;
	let label_1;
	let t0;
	let jsonkey;
	let t1;
	let span1;
	let span0;
	let t2;
	let t3;
	let t4;
	let current_block_type_index;
	let if_block1;
	let t5;
	let span2;
	let t6;
	let current;
	let mounted;
	let dispose;
	let if_block0 = /*expandable*/ ctx[11] && /*isParentExpanded*/ ctx[2] && create_if_block_3(ctx);

	jsonkey = new JSONKey({
			props: {
				key: /*key*/ ctx[12],
				colon: /*context*/ ctx[14].colon,
				isParentExpanded: /*isParentExpanded*/ ctx[2],
				isParentArray: /*isParentArray*/ ctx[3]
			}
		});

	jsonkey.$on("click", /*toggleExpand*/ ctx[15]);
	const if_block_creators = [create_if_block$2, create_else_block];
	const if_blocks = [];

	function select_block_type(ctx, dirty) {
		if (/*isParentExpanded*/ ctx[2]) return 0;
		return 1;
	}

	current_block_type_index = select_block_type(ctx);
	if_block1 = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

	return {
		c() {
			li = element("li");
			label_1 = element("label");
			if (if_block0) if_block0.c();
			t0 = space();
			create_component(jsonkey.$$.fragment);
			t1 = space();
			span1 = element("span");
			span0 = element("span");
			t2 = text(/*label*/ ctx[1]);
			t3 = text(/*bracketOpen*/ ctx[5]);
			t4 = space();
			if_block1.c();
			t5 = space();
			span2 = element("span");
			t6 = text(/*bracketClose*/ ctx[6]);
			attr(label_1, "class", "svelte-rwxv37");
			attr(li, "class", "svelte-rwxv37");
			toggle_class(li, "indent", /*isParentExpanded*/ ctx[2]);
		},
		m(target, anchor) {
			insert(target, li, anchor);
			append(li, label_1);
			if (if_block0) if_block0.m(label_1, null);
			append(label_1, t0);
			mount_component(jsonkey, label_1, null);
			append(label_1, t1);
			append(label_1, span1);
			append(span1, span0);
			append(span0, t2);
			append(span1, t3);
			append(li, t4);
			if_blocks[current_block_type_index].m(li, null);
			append(li, t5);
			append(li, span2);
			append(span2, t6);
			current = true;

			if (!mounted) {
				dispose = listen(span1, "click", /*toggleExpand*/ ctx[15]);
				mounted = true;
			}
		},
		p(ctx, [dirty]) {
			if (/*expandable*/ ctx[11] && /*isParentExpanded*/ ctx[2]) {
				if (if_block0) {
					if_block0.p(ctx, dirty);

					if (dirty & /*expandable, isParentExpanded*/ 2052) {
						transition_in(if_block0, 1);
					}
				} else {
					if_block0 = create_if_block_3(ctx);
					if_block0.c();
					transition_in(if_block0, 1);
					if_block0.m(label_1, t0);
				}
			} else if (if_block0) {
				group_outros();

				transition_out(if_block0, 1, 1, () => {
					if_block0 = null;
				});

				check_outros();
			}

			const jsonkey_changes = {};
			if (dirty & /*key*/ 4096) jsonkey_changes.key = /*key*/ ctx[12];
			if (dirty & /*isParentExpanded*/ 4) jsonkey_changes.isParentExpanded = /*isParentExpanded*/ ctx[2];
			if (dirty & /*isParentArray*/ 8) jsonkey_changes.isParentArray = /*isParentArray*/ ctx[3];
			jsonkey.$set(jsonkey_changes);
			if (!current || dirty & /*label*/ 2) set_data(t2, /*label*/ ctx[1]);
			if (!current || dirty & /*bracketOpen*/ 32) set_data(t3, /*bracketOpen*/ ctx[5]);
			let previous_block_index = current_block_type_index;
			current_block_type_index = select_block_type(ctx);

			if (current_block_type_index === previous_block_index) {
				if_blocks[current_block_type_index].p(ctx, dirty);
			} else {
				group_outros();

				transition_out(if_blocks[previous_block_index], 1, 1, () => {
					if_blocks[previous_block_index] = null;
				});

				check_outros();
				if_block1 = if_blocks[current_block_type_index];

				if (!if_block1) {
					if_block1 = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
					if_block1.c();
				} else {
					if_block1.p(ctx, dirty);
				}

				transition_in(if_block1, 1);
				if_block1.m(li, t5);
			}

			if (!current || dirty & /*bracketClose*/ 64) set_data(t6, /*bracketClose*/ ctx[6]);

			if (dirty & /*isParentExpanded*/ 4) {
				toggle_class(li, "indent", /*isParentExpanded*/ ctx[2]);
			}
		},
		i(local) {
			if (current) return;
			transition_in(if_block0);
			transition_in(jsonkey.$$.fragment, local);
			transition_in(if_block1);
			current = true;
		},
		o(local) {
			transition_out(if_block0);
			transition_out(jsonkey.$$.fragment, local);
			transition_out(if_block1);
			current = false;
		},
		d(detaching) {
			if (detaching) detach(li);
			if (if_block0) if_block0.d();
			destroy_component(jsonkey);
			if_blocks[current_block_type_index].d();
			mounted = false;
			dispose();
		}
	};
}

function instance$5($$self, $$props, $$invalidate) {
	let slicedKeys;
	let { key, keys, colon = ':', label = '', isParentExpanded, isParentArray, isArray = false, bracketOpen, bracketClose } = $$props;
	let { previewKeys = keys } = $$props;
	let { getKey = key => key } = $$props;
	let { getValue = key => key } = $$props;
	let { getPreviewValue = getValue } = $$props;
	let { expanded = false, expandable = true } = $$props;
	const context = getContext(contextKey);
	setContext(contextKey, { ...context, colon });

	function toggleExpand() {
		$$invalidate(0, expanded = !expanded);
	}

	function expand() {
		$$invalidate(0, expanded = true);
	}

	$$self.$$set = $$props => {
		if ('key' in $$props) $$invalidate(12, key = $$props.key);
		if ('keys' in $$props) $$invalidate(17, keys = $$props.keys);
		if ('colon' in $$props) $$invalidate(18, colon = $$props.colon);
		if ('label' in $$props) $$invalidate(1, label = $$props.label);
		if ('isParentExpanded' in $$props) $$invalidate(2, isParentExpanded = $$props.isParentExpanded);
		if ('isParentArray' in $$props) $$invalidate(3, isParentArray = $$props.isParentArray);
		if ('isArray' in $$props) $$invalidate(4, isArray = $$props.isArray);
		if ('bracketOpen' in $$props) $$invalidate(5, bracketOpen = $$props.bracketOpen);
		if ('bracketClose' in $$props) $$invalidate(6, bracketClose = $$props.bracketClose);
		if ('previewKeys' in $$props) $$invalidate(7, previewKeys = $$props.previewKeys);
		if ('getKey' in $$props) $$invalidate(8, getKey = $$props.getKey);
		if ('getValue' in $$props) $$invalidate(9, getValue = $$props.getValue);
		if ('getPreviewValue' in $$props) $$invalidate(10, getPreviewValue = $$props.getPreviewValue);
		if ('expanded' in $$props) $$invalidate(0, expanded = $$props.expanded);
		if ('expandable' in $$props) $$invalidate(11, expandable = $$props.expandable);
	};

	$$self.$$.update = () => {
		if ($$self.$$.dirty & /*isParentExpanded*/ 4) {
			 if (!isParentExpanded) {
				$$invalidate(0, expanded = false);
			}
		}

		if ($$self.$$.dirty & /*expanded, keys, previewKeys*/ 131201) {
			 $$invalidate(13, slicedKeys = expanded ? keys : previewKeys.slice(0, 5));
		}
	};

	return [
		expanded,
		label,
		isParentExpanded,
		isParentArray,
		isArray,
		bracketOpen,
		bracketClose,
		previewKeys,
		getKey,
		getValue,
		getPreviewValue,
		expandable,
		key,
		slicedKeys,
		context,
		toggleExpand,
		expand,
		keys,
		colon
	];
}

class JSONNested extends SvelteComponent {
	constructor(options) {
		super();

		init(
			this,
			options,
			instance$5,
			create_fragment$5,
			safe_not_equal,
			{
				key: 12,
				keys: 17,
				colon: 18,
				label: 1,
				isParentExpanded: 2,
				isParentArray: 3,
				isArray: 4,
				bracketOpen: 5,
				bracketClose: 6,
				previewKeys: 7,
				getKey: 8,
				getValue: 9,
				getPreviewValue: 10,
				expanded: 0,
				expandable: 11
			},
			add_css$4
		);
	}
}

/* node_modules/svelte-json-tree-auto/src/JSONObjectNode.svelte generated by Svelte v3.41.0 */

function create_fragment$6(ctx) {
	let jsonnested;
	let current;

	jsonnested = new JSONNested({
			props: {
				key: /*key*/ ctx[0],
				expanded: /*expanded*/ ctx[4],
				isParentExpanded: /*isParentExpanded*/ ctx[1],
				isParentArray: /*isParentArray*/ ctx[2],
				keys: /*keys*/ ctx[5],
				previewKeys: /*keys*/ ctx[5],
				getValue: /*getValue*/ ctx[6],
				label: "" + (/*nodeType*/ ctx[3] + " "),
				bracketOpen: '{',
				bracketClose: '}'
			}
		});

	return {
		c() {
			create_component(jsonnested.$$.fragment);
		},
		m(target, anchor) {
			mount_component(jsonnested, target, anchor);
			current = true;
		},
		p(ctx, [dirty]) {
			const jsonnested_changes = {};
			if (dirty & /*key*/ 1) jsonnested_changes.key = /*key*/ ctx[0];
			if (dirty & /*expanded*/ 16) jsonnested_changes.expanded = /*expanded*/ ctx[4];
			if (dirty & /*isParentExpanded*/ 2) jsonnested_changes.isParentExpanded = /*isParentExpanded*/ ctx[1];
			if (dirty & /*isParentArray*/ 4) jsonnested_changes.isParentArray = /*isParentArray*/ ctx[2];
			if (dirty & /*keys*/ 32) jsonnested_changes.keys = /*keys*/ ctx[5];
			if (dirty & /*keys*/ 32) jsonnested_changes.previewKeys = /*keys*/ ctx[5];
			if (dirty & /*nodeType*/ 8) jsonnested_changes.label = "" + (/*nodeType*/ ctx[3] + " ");
			jsonnested.$set(jsonnested_changes);
		},
		i(local) {
			if (current) return;
			transition_in(jsonnested.$$.fragment, local);
			current = true;
		},
		o(local) {
			transition_out(jsonnested.$$.fragment, local);
			current = false;
		},
		d(detaching) {
			destroy_component(jsonnested, detaching);
		}
	};
}

function instance$6($$self, $$props, $$invalidate) {
	let keys;
	let { key, value, isParentExpanded, isParentArray, nodeType } = $$props;
	let { expanded = true } = $$props;

	function getValue(key) {
		return value[key];
	}

	$$self.$$set = $$props => {
		if ('key' in $$props) $$invalidate(0, key = $$props.key);
		if ('value' in $$props) $$invalidate(7, value = $$props.value);
		if ('isParentExpanded' in $$props) $$invalidate(1, isParentExpanded = $$props.isParentExpanded);
		if ('isParentArray' in $$props) $$invalidate(2, isParentArray = $$props.isParentArray);
		if ('nodeType' in $$props) $$invalidate(3, nodeType = $$props.nodeType);
		if ('expanded' in $$props) $$invalidate(4, expanded = $$props.expanded);
	};

	$$self.$$.update = () => {
		if ($$self.$$.dirty & /*value*/ 128) {
			 $$invalidate(5, keys = Object.getOwnPropertyNames(value));
		}
	};

	return [
		key,
		isParentExpanded,
		isParentArray,
		nodeType,
		expanded,
		keys,
		getValue,
		value
	];
}

class JSONObjectNode extends SvelteComponent {
	constructor(options) {
		super();

		init(this, options, instance$6, create_fragment$6, safe_not_equal, {
			key: 0,
			value: 7,
			isParentExpanded: 1,
			isParentArray: 2,
			nodeType: 3,
			expanded: 4
		});
	}
}

/* node_modules/svelte-json-tree-auto/src/JSONArrayNode.svelte generated by Svelte v3.41.0 */

function create_fragment$7(ctx) {
	let jsonnested;
	let current;

	jsonnested = new JSONNested({
			props: {
				key: /*key*/ ctx[0],
				expanded: /*expanded*/ ctx[4],
				isParentExpanded: /*isParentExpanded*/ ctx[2],
				isParentArray: /*isParentArray*/ ctx[3],
				isArray: true,
				keys: /*keys*/ ctx[5],
				previewKeys: /*previewKeys*/ ctx[6],
				getValue: /*getValue*/ ctx[7],
				label: "Array(" + /*value*/ ctx[1].length + ")",
				bracketOpen: "[",
				bracketClose: "]"
			}
		});

	return {
		c() {
			create_component(jsonnested.$$.fragment);
		},
		m(target, anchor) {
			mount_component(jsonnested, target, anchor);
			current = true;
		},
		p(ctx, [dirty]) {
			const jsonnested_changes = {};
			if (dirty & /*key*/ 1) jsonnested_changes.key = /*key*/ ctx[0];
			if (dirty & /*expanded*/ 16) jsonnested_changes.expanded = /*expanded*/ ctx[4];
			if (dirty & /*isParentExpanded*/ 4) jsonnested_changes.isParentExpanded = /*isParentExpanded*/ ctx[2];
			if (dirty & /*isParentArray*/ 8) jsonnested_changes.isParentArray = /*isParentArray*/ ctx[3];
			if (dirty & /*keys*/ 32) jsonnested_changes.keys = /*keys*/ ctx[5];
			if (dirty & /*previewKeys*/ 64) jsonnested_changes.previewKeys = /*previewKeys*/ ctx[6];
			if (dirty & /*value*/ 2) jsonnested_changes.label = "Array(" + /*value*/ ctx[1].length + ")";
			jsonnested.$set(jsonnested_changes);
		},
		i(local) {
			if (current) return;
			transition_in(jsonnested.$$.fragment, local);
			current = true;
		},
		o(local) {
			transition_out(jsonnested.$$.fragment, local);
			current = false;
		},
		d(detaching) {
			destroy_component(jsonnested, detaching);
		}
	};
}

function instance$7($$self, $$props, $$invalidate) {
	let keys;
	let previewKeys;
	let { key, value, isParentExpanded, isParentArray } = $$props;
	let { expanded = JSON.stringify(value).length < 1024 } = $$props;
	const filteredKey = new Set(['length']);

	function getValue(key) {
		return value[key];
	}

	$$self.$$set = $$props => {
		if ('key' in $$props) $$invalidate(0, key = $$props.key);
		if ('value' in $$props) $$invalidate(1, value = $$props.value);
		if ('isParentExpanded' in $$props) $$invalidate(2, isParentExpanded = $$props.isParentExpanded);
		if ('isParentArray' in $$props) $$invalidate(3, isParentArray = $$props.isParentArray);
		if ('expanded' in $$props) $$invalidate(4, expanded = $$props.expanded);
	};

	$$self.$$.update = () => {
		if ($$self.$$.dirty & /*value*/ 2) {
			 $$invalidate(5, keys = Object.getOwnPropertyNames(value));
		}

		if ($$self.$$.dirty & /*keys*/ 32) {
			 $$invalidate(6, previewKeys = keys.filter(key => !filteredKey.has(key)));
		}
	};

	return [
		key,
		value,
		isParentExpanded,
		isParentArray,
		expanded,
		keys,
		previewKeys,
		getValue
	];
}

class JSONArrayNode extends SvelteComponent {
	constructor(options) {
		super();

		init(this, options, instance$7, create_fragment$7, safe_not_equal, {
			key: 0,
			value: 1,
			isParentExpanded: 2,
			isParentArray: 3,
			expanded: 4
		});
	}
}

/* node_modules/svelte-json-tree-auto/src/JSONIterableArrayNode.svelte generated by Svelte v3.41.0 */

function create_fragment$8(ctx) {
	let jsonnested;
	let current;

	jsonnested = new JSONNested({
			props: {
				key: /*key*/ ctx[0],
				isParentExpanded: /*isParentExpanded*/ ctx[1],
				isParentArray: /*isParentArray*/ ctx[2],
				keys: /*keys*/ ctx[4],
				getKey,
				getValue,
				isArray: true,
				label: "" + (/*nodeType*/ ctx[3] + "(" + /*keys*/ ctx[4].length + ")"),
				bracketOpen: '{',
				bracketClose: '}'
			}
		});

	return {
		c() {
			create_component(jsonnested.$$.fragment);
		},
		m(target, anchor) {
			mount_component(jsonnested, target, anchor);
			current = true;
		},
		p(ctx, [dirty]) {
			const jsonnested_changes = {};
			if (dirty & /*key*/ 1) jsonnested_changes.key = /*key*/ ctx[0];
			if (dirty & /*isParentExpanded*/ 2) jsonnested_changes.isParentExpanded = /*isParentExpanded*/ ctx[1];
			if (dirty & /*isParentArray*/ 4) jsonnested_changes.isParentArray = /*isParentArray*/ ctx[2];
			if (dirty & /*keys*/ 16) jsonnested_changes.keys = /*keys*/ ctx[4];
			if (dirty & /*nodeType, keys*/ 24) jsonnested_changes.label = "" + (/*nodeType*/ ctx[3] + "(" + /*keys*/ ctx[4].length + ")");
			jsonnested.$set(jsonnested_changes);
		},
		i(local) {
			if (current) return;
			transition_in(jsonnested.$$.fragment, local);
			current = true;
		},
		o(local) {
			transition_out(jsonnested.$$.fragment, local);
			current = false;
		},
		d(detaching) {
			destroy_component(jsonnested, detaching);
		}
	};
}

function getKey(key) {
	return String(key[0]);
}

function getValue(key) {
	return key[1];
}

function instance$8($$self, $$props, $$invalidate) {
	let { key, value, isParentExpanded, isParentArray, nodeType } = $$props;
	let keys = [];

	$$self.$$set = $$props => {
		if ('key' in $$props) $$invalidate(0, key = $$props.key);
		if ('value' in $$props) $$invalidate(5, value = $$props.value);
		if ('isParentExpanded' in $$props) $$invalidate(1, isParentExpanded = $$props.isParentExpanded);
		if ('isParentArray' in $$props) $$invalidate(2, isParentArray = $$props.isParentArray);
		if ('nodeType' in $$props) $$invalidate(3, nodeType = $$props.nodeType);
	};

	$$self.$$.update = () => {
		if ($$self.$$.dirty & /*value*/ 32) {
			 {
				let result = [];
				let i = 0;

				for (const entry of value) {
					result.push([i++, entry]);
				}

				$$invalidate(4, keys = result);
			}
		}
	};

	return [key, isParentExpanded, isParentArray, nodeType, keys, value];
}

class JSONIterableArrayNode extends SvelteComponent {
	constructor(options) {
		super();

		init(this, options, instance$8, create_fragment$8, safe_not_equal, {
			key: 0,
			value: 5,
			isParentExpanded: 1,
			isParentArray: 2,
			nodeType: 3
		});
	}
}

class MapEntry {
  constructor(key, value) {
    this.key = key;
    this.value = value;
  }
}

/* node_modules/svelte-json-tree-auto/src/JSONIterableMapNode.svelte generated by Svelte v3.41.0 */

function create_fragment$9(ctx) {
	let jsonnested;
	let current;

	jsonnested = new JSONNested({
			props: {
				key: /*key*/ ctx[0],
				isParentExpanded: /*isParentExpanded*/ ctx[1],
				isParentArray: /*isParentArray*/ ctx[2],
				keys: /*keys*/ ctx[4],
				getKey: getKey$1,
				getValue: getValue$1,
				label: "" + (/*nodeType*/ ctx[3] + "(" + /*keys*/ ctx[4].length + ")"),
				colon: "",
				bracketOpen: '{',
				bracketClose: '}'
			}
		});

	return {
		c() {
			create_component(jsonnested.$$.fragment);
		},
		m(target, anchor) {
			mount_component(jsonnested, target, anchor);
			current = true;
		},
		p(ctx, [dirty]) {
			const jsonnested_changes = {};
			if (dirty & /*key*/ 1) jsonnested_changes.key = /*key*/ ctx[0];
			if (dirty & /*isParentExpanded*/ 2) jsonnested_changes.isParentExpanded = /*isParentExpanded*/ ctx[1];
			if (dirty & /*isParentArray*/ 4) jsonnested_changes.isParentArray = /*isParentArray*/ ctx[2];
			if (dirty & /*keys*/ 16) jsonnested_changes.keys = /*keys*/ ctx[4];
			if (dirty & /*nodeType, keys*/ 24) jsonnested_changes.label = "" + (/*nodeType*/ ctx[3] + "(" + /*keys*/ ctx[4].length + ")");
			jsonnested.$set(jsonnested_changes);
		},
		i(local) {
			if (current) return;
			transition_in(jsonnested.$$.fragment, local);
			current = true;
		},
		o(local) {
			transition_out(jsonnested.$$.fragment, local);
			current = false;
		},
		d(detaching) {
			destroy_component(jsonnested, detaching);
		}
	};
}

function getKey$1(entry) {
	return entry[0];
}

function getValue$1(entry) {
	return entry[1];
}

function instance$9($$self, $$props, $$invalidate) {
	let { key, value, isParentExpanded, isParentArray, nodeType } = $$props;
	let keys = [];

	$$self.$$set = $$props => {
		if ('key' in $$props) $$invalidate(0, key = $$props.key);
		if ('value' in $$props) $$invalidate(5, value = $$props.value);
		if ('isParentExpanded' in $$props) $$invalidate(1, isParentExpanded = $$props.isParentExpanded);
		if ('isParentArray' in $$props) $$invalidate(2, isParentArray = $$props.isParentArray);
		if ('nodeType' in $$props) $$invalidate(3, nodeType = $$props.nodeType);
	};

	$$self.$$.update = () => {
		if ($$self.$$.dirty & /*value*/ 32) {
			 {
				let result = [];
				let i = 0;

				for (const entry of value) {
					result.push([i++, new MapEntry(entry[0], entry[1])]);
				}

				$$invalidate(4, keys = result);
			}
		}
	};

	return [key, isParentExpanded, isParentArray, nodeType, keys, value];
}

class JSONIterableMapNode extends SvelteComponent {
	constructor(options) {
		super();

		init(this, options, instance$9, create_fragment$9, safe_not_equal, {
			key: 0,
			value: 5,
			isParentExpanded: 1,
			isParentArray: 2,
			nodeType: 3
		});
	}
}

/* node_modules/svelte-json-tree-auto/src/JSONMapEntryNode.svelte generated by Svelte v3.41.0 */

function create_fragment$a(ctx) {
	let jsonnested;
	let current;

	jsonnested = new JSONNested({
			props: {
				expanded: /*expanded*/ ctx[4],
				isParentExpanded: /*isParentExpanded*/ ctx[2],
				isParentArray: /*isParentArray*/ ctx[3],
				key: /*isParentExpanded*/ ctx[2]
				? String(/*key*/ ctx[0])
				: /*value*/ ctx[1].key,
				keys: /*keys*/ ctx[5],
				getValue: /*getValue*/ ctx[6],
				label: /*isParentExpanded*/ ctx[2] ? 'Entry ' : '=> ',
				bracketOpen: '{',
				bracketClose: '}'
			}
		});

	return {
		c() {
			create_component(jsonnested.$$.fragment);
		},
		m(target, anchor) {
			mount_component(jsonnested, target, anchor);
			current = true;
		},
		p(ctx, [dirty]) {
			const jsonnested_changes = {};
			if (dirty & /*expanded*/ 16) jsonnested_changes.expanded = /*expanded*/ ctx[4];
			if (dirty & /*isParentExpanded*/ 4) jsonnested_changes.isParentExpanded = /*isParentExpanded*/ ctx[2];
			if (dirty & /*isParentArray*/ 8) jsonnested_changes.isParentArray = /*isParentArray*/ ctx[3];

			if (dirty & /*isParentExpanded, key, value*/ 7) jsonnested_changes.key = /*isParentExpanded*/ ctx[2]
			? String(/*key*/ ctx[0])
			: /*value*/ ctx[1].key;

			if (dirty & /*isParentExpanded*/ 4) jsonnested_changes.label = /*isParentExpanded*/ ctx[2] ? 'Entry ' : '=> ';
			jsonnested.$set(jsonnested_changes);
		},
		i(local) {
			if (current) return;
			transition_in(jsonnested.$$.fragment, local);
			current = true;
		},
		o(local) {
			transition_out(jsonnested.$$.fragment, local);
			current = false;
		},
		d(detaching) {
			destroy_component(jsonnested, detaching);
		}
	};
}

function instance$a($$self, $$props, $$invalidate) {
	let { key, value, isParentExpanded, isParentArray } = $$props;
	let { expanded = false } = $$props;
	const keys = ['key', 'value'];

	function getValue(key) {
		return value[key];
	}

	$$self.$$set = $$props => {
		if ('key' in $$props) $$invalidate(0, key = $$props.key);
		if ('value' in $$props) $$invalidate(1, value = $$props.value);
		if ('isParentExpanded' in $$props) $$invalidate(2, isParentExpanded = $$props.isParentExpanded);
		if ('isParentArray' in $$props) $$invalidate(3, isParentArray = $$props.isParentArray);
		if ('expanded' in $$props) $$invalidate(4, expanded = $$props.expanded);
	};

	return [key, value, isParentExpanded, isParentArray, expanded, keys, getValue];
}

class JSONMapEntryNode extends SvelteComponent {
	constructor(options) {
		super();

		init(this, options, instance$a, create_fragment$a, safe_not_equal, {
			key: 0,
			value: 1,
			isParentExpanded: 2,
			isParentArray: 3,
			expanded: 4
		});
	}
}

/* node_modules/svelte-json-tree-auto/src/JSONValueNode.svelte generated by Svelte v3.41.0 */

function add_css$5(target) {
	append_styles(target, "svelte-3bjyvl", "li.svelte-3bjyvl{user-select:text;word-wrap:break-word;word-break:break-all}.indent.svelte-3bjyvl{padding-left:var(--li-identation)}.String.svelte-3bjyvl{color:var(--string-color)}.Date.svelte-3bjyvl{color:var(--date-color)}.Number.svelte-3bjyvl{color:var(--number-color)}.Boolean.svelte-3bjyvl{color:var(--boolean-color)}.Null.svelte-3bjyvl{color:var(--null-color)}.Undefined.svelte-3bjyvl{color:var(--undefined-color)}.Function.svelte-3bjyvl{color:var(--function-color);font-style:italic}.Symbol.svelte-3bjyvl{color:var(--symbol-color)}");
}

function create_fragment$b(ctx) {
	let li;
	let jsonkey;
	let t0;
	let span;

	let t1_value = (/*valueGetter*/ ctx[2]
	? /*valueGetter*/ ctx[2](/*value*/ ctx[1])
	: /*value*/ ctx[1]) + "";

	let t1;
	let span_class_value;
	let current;

	jsonkey = new JSONKey({
			props: {
				key: /*key*/ ctx[0],
				colon: /*colon*/ ctx[6],
				isParentExpanded: /*isParentExpanded*/ ctx[3],
				isParentArray: /*isParentArray*/ ctx[4]
			}
		});

	return {
		c() {
			li = element("li");
			create_component(jsonkey.$$.fragment);
			t0 = space();
			span = element("span");
			t1 = text(t1_value);
			attr(span, "class", span_class_value = "" + (null_to_empty(/*nodeType*/ ctx[5]) + " svelte-3bjyvl"));
			attr(li, "class", "svelte-3bjyvl");
			toggle_class(li, "indent", /*isParentExpanded*/ ctx[3]);
		},
		m(target, anchor) {
			insert(target, li, anchor);
			mount_component(jsonkey, li, null);
			append(li, t0);
			append(li, span);
			append(span, t1);
			current = true;
		},
		p(ctx, [dirty]) {
			const jsonkey_changes = {};
			if (dirty & /*key*/ 1) jsonkey_changes.key = /*key*/ ctx[0];
			if (dirty & /*isParentExpanded*/ 8) jsonkey_changes.isParentExpanded = /*isParentExpanded*/ ctx[3];
			if (dirty & /*isParentArray*/ 16) jsonkey_changes.isParentArray = /*isParentArray*/ ctx[4];
			jsonkey.$set(jsonkey_changes);

			if ((!current || dirty & /*valueGetter, value*/ 6) && t1_value !== (t1_value = (/*valueGetter*/ ctx[2]
			? /*valueGetter*/ ctx[2](/*value*/ ctx[1])
			: /*value*/ ctx[1]) + "")) set_data(t1, t1_value);

			if (!current || dirty & /*nodeType*/ 32 && span_class_value !== (span_class_value = "" + (null_to_empty(/*nodeType*/ ctx[5]) + " svelte-3bjyvl"))) {
				attr(span, "class", span_class_value);
			}

			if (dirty & /*isParentExpanded*/ 8) {
				toggle_class(li, "indent", /*isParentExpanded*/ ctx[3]);
			}
		},
		i(local) {
			if (current) return;
			transition_in(jsonkey.$$.fragment, local);
			current = true;
		},
		o(local) {
			transition_out(jsonkey.$$.fragment, local);
			current = false;
		},
		d(detaching) {
			if (detaching) detach(li);
			destroy_component(jsonkey);
		}
	};
}

function instance$b($$self, $$props, $$invalidate) {
	let { key, value, valueGetter = null, isParentExpanded, isParentArray, nodeType } = $$props;
	const { colon } = getContext(contextKey);

	$$self.$$set = $$props => {
		if ('key' in $$props) $$invalidate(0, key = $$props.key);
		if ('value' in $$props) $$invalidate(1, value = $$props.value);
		if ('valueGetter' in $$props) $$invalidate(2, valueGetter = $$props.valueGetter);
		if ('isParentExpanded' in $$props) $$invalidate(3, isParentExpanded = $$props.isParentExpanded);
		if ('isParentArray' in $$props) $$invalidate(4, isParentArray = $$props.isParentArray);
		if ('nodeType' in $$props) $$invalidate(5, nodeType = $$props.nodeType);
	};

	return [key, value, valueGetter, isParentExpanded, isParentArray, nodeType, colon];
}

class JSONValueNode extends SvelteComponent {
	constructor(options) {
		super();

		init(
			this,
			options,
			instance$b,
			create_fragment$b,
			safe_not_equal,
			{
				key: 0,
				value: 1,
				valueGetter: 2,
				isParentExpanded: 3,
				isParentArray: 4,
				nodeType: 5
			},
			add_css$5
		);
	}
}

/* node_modules/svelte-json-tree-auto/src/ErrorNode.svelte generated by Svelte v3.41.0 */

function add_css$6(target) {
	append_styles(target, "svelte-1ca3gb2", "li.svelte-1ca3gb2{user-select:text;word-wrap:break-word;word-break:break-all}.indent.svelte-1ca3gb2{padding-left:var(--li-identation)}.collapse.svelte-1ca3gb2{--li-display:inline;display:inline;font-style:italic}");
}

function get_each_context$2(ctx, list, i) {
	const child_ctx = ctx.slice();
	child_ctx[8] = list[i];
	child_ctx[10] = i;
	return child_ctx;
}

// (40:2) {#if isParentExpanded}
function create_if_block_2$1(ctx) {
	let jsonarrow;
	let current;
	jsonarrow = new JSONArrow({ props: { expanded: /*expanded*/ ctx[0] } });
	jsonarrow.$on("click", /*toggleExpand*/ ctx[7]);

	return {
		c() {
			create_component(jsonarrow.$$.fragment);
		},
		m(target, anchor) {
			mount_component(jsonarrow, target, anchor);
			current = true;
		},
		p(ctx, dirty) {
			const jsonarrow_changes = {};
			if (dirty & /*expanded*/ 1) jsonarrow_changes.expanded = /*expanded*/ ctx[0];
			jsonarrow.$set(jsonarrow_changes);
		},
		i(local) {
			if (current) return;
			transition_in(jsonarrow.$$.fragment, local);
			current = true;
		},
		o(local) {
			transition_out(jsonarrow.$$.fragment, local);
			current = false;
		},
		d(detaching) {
			destroy_component(jsonarrow, detaching);
		}
	};
}

// (45:2) {#if isParentExpanded}
function create_if_block$3(ctx) {
	let ul;
	let current;
	let if_block = /*expanded*/ ctx[0] && create_if_block_1$1(ctx);

	return {
		c() {
			ul = element("ul");
			if (if_block) if_block.c();
			attr(ul, "class", "svelte-1ca3gb2");
			toggle_class(ul, "collapse", !/*expanded*/ ctx[0]);
		},
		m(target, anchor) {
			insert(target, ul, anchor);
			if (if_block) if_block.m(ul, null);
			current = true;
		},
		p(ctx, dirty) {
			if (/*expanded*/ ctx[0]) {
				if (if_block) {
					if_block.p(ctx, dirty);

					if (dirty & /*expanded*/ 1) {
						transition_in(if_block, 1);
					}
				} else {
					if_block = create_if_block_1$1(ctx);
					if_block.c();
					transition_in(if_block, 1);
					if_block.m(ul, null);
				}
			} else if (if_block) {
				group_outros();

				transition_out(if_block, 1, 1, () => {
					if_block = null;
				});

				check_outros();
			}

			if (dirty & /*expanded*/ 1) {
				toggle_class(ul, "collapse", !/*expanded*/ ctx[0]);
			}
		},
		i(local) {
			if (current) return;
			transition_in(if_block);
			current = true;
		},
		o(local) {
			transition_out(if_block);
			current = false;
		},
		d(detaching) {
			if (detaching) detach(ul);
			if (if_block) if_block.d();
		}
	};
}

// (47:6) {#if expanded}
function create_if_block_1$1(ctx) {
	let jsonnode;
	let t0;
	let li;
	let jsonkey;
	let t1;
	let span;
	let current;

	jsonnode = new JSONNode({
			props: {
				key: "message",
				value: /*value*/ ctx[2].message
			}
		});

	jsonkey = new JSONKey({
			props: {
				key: "stack",
				colon: ":",
				isParentExpanded: /*isParentExpanded*/ ctx[3]
			}
		});

	let each_value = /*stack*/ ctx[5];
	let each_blocks = [];

	for (let i = 0; i < each_value.length; i += 1) {
		each_blocks[i] = create_each_block$2(get_each_context$2(ctx, each_value, i));
	}

	return {
		c() {
			create_component(jsonnode.$$.fragment);
			t0 = space();
			li = element("li");
			create_component(jsonkey.$$.fragment);
			t1 = space();
			span = element("span");

			for (let i = 0; i < each_blocks.length; i += 1) {
				each_blocks[i].c();
			}

			attr(li, "class", "svelte-1ca3gb2");
		},
		m(target, anchor) {
			mount_component(jsonnode, target, anchor);
			insert(target, t0, anchor);
			insert(target, li, anchor);
			mount_component(jsonkey, li, null);
			append(li, t1);
			append(li, span);

			for (let i = 0; i < each_blocks.length; i += 1) {
				each_blocks[i].m(span, null);
			}

			current = true;
		},
		p(ctx, dirty) {
			const jsonnode_changes = {};
			if (dirty & /*value*/ 4) jsonnode_changes.value = /*value*/ ctx[2].message;
			jsonnode.$set(jsonnode_changes);
			const jsonkey_changes = {};
			if (dirty & /*isParentExpanded*/ 8) jsonkey_changes.isParentExpanded = /*isParentExpanded*/ ctx[3];
			jsonkey.$set(jsonkey_changes);

			if (dirty & /*stack*/ 32) {
				each_value = /*stack*/ ctx[5];
				let i;

				for (i = 0; i < each_value.length; i += 1) {
					const child_ctx = get_each_context$2(ctx, each_value, i);

					if (each_blocks[i]) {
						each_blocks[i].p(child_ctx, dirty);
					} else {
						each_blocks[i] = create_each_block$2(child_ctx);
						each_blocks[i].c();
						each_blocks[i].m(span, null);
					}
				}

				for (; i < each_blocks.length; i += 1) {
					each_blocks[i].d(1);
				}

				each_blocks.length = each_value.length;
			}
		},
		i(local) {
			if (current) return;
			transition_in(jsonnode.$$.fragment, local);
			transition_in(jsonkey.$$.fragment, local);
			current = true;
		},
		o(local) {
			transition_out(jsonnode.$$.fragment, local);
			transition_out(jsonkey.$$.fragment, local);
			current = false;
		},
		d(detaching) {
			destroy_component(jsonnode, detaching);
			if (detaching) detach(t0);
			if (detaching) detach(li);
			destroy_component(jsonkey);
			destroy_each(each_blocks, detaching);
		}
	};
}

// (52:12) {#each stack as line, index}
function create_each_block$2(ctx) {
	let span;
	let t_value = /*line*/ ctx[8] + "";
	let t;
	let br;

	return {
		c() {
			span = element("span");
			t = text(t_value);
			br = element("br");
			attr(span, "class", "svelte-1ca3gb2");
			toggle_class(span, "indent", /*index*/ ctx[10] > 0);
		},
		m(target, anchor) {
			insert(target, span, anchor);
			append(span, t);
			insert(target, br, anchor);
		},
		p(ctx, dirty) {
			if (dirty & /*stack*/ 32 && t_value !== (t_value = /*line*/ ctx[8] + "")) set_data(t, t_value);
		},
		d(detaching) {
			if (detaching) detach(span);
			if (detaching) detach(br);
		}
	};
}

function create_fragment$c(ctx) {
	let li;
	let t0;
	let jsonkey;
	let t1;
	let span;
	let t2;
	let t3_value = (/*expanded*/ ctx[0] ? '' : /*value*/ ctx[2].message) + "";
	let t3;
	let t4;
	let current;
	let mounted;
	let dispose;
	let if_block0 = /*isParentExpanded*/ ctx[3] && create_if_block_2$1(ctx);

	jsonkey = new JSONKey({
			props: {
				key: /*key*/ ctx[1],
				colon: /*context*/ ctx[6].colon,
				isParentExpanded: /*isParentExpanded*/ ctx[3],
				isParentArray: /*isParentArray*/ ctx[4]
			}
		});

	let if_block1 = /*isParentExpanded*/ ctx[3] && create_if_block$3(ctx);

	return {
		c() {
			li = element("li");
			if (if_block0) if_block0.c();
			t0 = space();
			create_component(jsonkey.$$.fragment);
			t1 = space();
			span = element("span");
			t2 = text("Error: ");
			t3 = text(t3_value);
			t4 = space();
			if (if_block1) if_block1.c();
			attr(li, "class", "svelte-1ca3gb2");
			toggle_class(li, "indent", /*isParentExpanded*/ ctx[3]);
		},
		m(target, anchor) {
			insert(target, li, anchor);
			if (if_block0) if_block0.m(li, null);
			append(li, t0);
			mount_component(jsonkey, li, null);
			append(li, t1);
			append(li, span);
			append(span, t2);
			append(span, t3);
			append(li, t4);
			if (if_block1) if_block1.m(li, null);
			current = true;

			if (!mounted) {
				dispose = listen(span, "click", /*toggleExpand*/ ctx[7]);
				mounted = true;
			}
		},
		p(ctx, [dirty]) {
			if (/*isParentExpanded*/ ctx[3]) {
				if (if_block0) {
					if_block0.p(ctx, dirty);

					if (dirty & /*isParentExpanded*/ 8) {
						transition_in(if_block0, 1);
					}
				} else {
					if_block0 = create_if_block_2$1(ctx);
					if_block0.c();
					transition_in(if_block0, 1);
					if_block0.m(li, t0);
				}
			} else if (if_block0) {
				group_outros();

				transition_out(if_block0, 1, 1, () => {
					if_block0 = null;
				});

				check_outros();
			}

			const jsonkey_changes = {};
			if (dirty & /*key*/ 2) jsonkey_changes.key = /*key*/ ctx[1];
			if (dirty & /*isParentExpanded*/ 8) jsonkey_changes.isParentExpanded = /*isParentExpanded*/ ctx[3];
			if (dirty & /*isParentArray*/ 16) jsonkey_changes.isParentArray = /*isParentArray*/ ctx[4];
			jsonkey.$set(jsonkey_changes);
			if ((!current || dirty & /*expanded, value*/ 5) && t3_value !== (t3_value = (/*expanded*/ ctx[0] ? '' : /*value*/ ctx[2].message) + "")) set_data(t3, t3_value);

			if (/*isParentExpanded*/ ctx[3]) {
				if (if_block1) {
					if_block1.p(ctx, dirty);

					if (dirty & /*isParentExpanded*/ 8) {
						transition_in(if_block1, 1);
					}
				} else {
					if_block1 = create_if_block$3(ctx);
					if_block1.c();
					transition_in(if_block1, 1);
					if_block1.m(li, null);
				}
			} else if (if_block1) {
				group_outros();

				transition_out(if_block1, 1, 1, () => {
					if_block1 = null;
				});

				check_outros();
			}

			if (dirty & /*isParentExpanded*/ 8) {
				toggle_class(li, "indent", /*isParentExpanded*/ ctx[3]);
			}
		},
		i(local) {
			if (current) return;
			transition_in(if_block0);
			transition_in(jsonkey.$$.fragment, local);
			transition_in(if_block1);
			current = true;
		},
		o(local) {
			transition_out(if_block0);
			transition_out(jsonkey.$$.fragment, local);
			transition_out(if_block1);
			current = false;
		},
		d(detaching) {
			if (detaching) detach(li);
			if (if_block0) if_block0.d();
			destroy_component(jsonkey);
			if (if_block1) if_block1.d();
			mounted = false;
			dispose();
		}
	};
}

function instance$c($$self, $$props, $$invalidate) {
	let stack;
	let { key, value, isParentExpanded, isParentArray } = $$props;
	let { expanded = false } = $$props;
	const context = getContext(contextKey);
	setContext(contextKey, { ...context, colon: ':' });

	function toggleExpand() {
		$$invalidate(0, expanded = !expanded);
	}

	$$self.$$set = $$props => {
		if ('key' in $$props) $$invalidate(1, key = $$props.key);
		if ('value' in $$props) $$invalidate(2, value = $$props.value);
		if ('isParentExpanded' in $$props) $$invalidate(3, isParentExpanded = $$props.isParentExpanded);
		if ('isParentArray' in $$props) $$invalidate(4, isParentArray = $$props.isParentArray);
		if ('expanded' in $$props) $$invalidate(0, expanded = $$props.expanded);
	};

	$$self.$$.update = () => {
		if ($$self.$$.dirty & /*value*/ 4) {
			 $$invalidate(5, stack = value.stack.split('\n'));
		}

		if ($$self.$$.dirty & /*isParentExpanded*/ 8) {
			 if (!isParentExpanded) {
				$$invalidate(0, expanded = false);
			}
		}
	};

	return [
		expanded,
		key,
		value,
		isParentExpanded,
		isParentArray,
		stack,
		context,
		toggleExpand
	];
}

class ErrorNode extends SvelteComponent {
	constructor(options) {
		super();

		init(
			this,
			options,
			instance$c,
			create_fragment$c,
			safe_not_equal,
			{
				key: 1,
				value: 2,
				isParentExpanded: 3,
				isParentArray: 4,
				expanded: 0
			},
			add_css$6
		);
	}
}

function objType(obj) {
  const type = Object.prototype.toString.call(obj).slice(8, -1);
  if (type === 'Object') {
    if (typeof obj[Symbol.iterator] === 'function') {
      return 'Iterable';
    }
    return obj.constructor.name;
  }

  return type;
}

/* node_modules/svelte-json-tree-auto/src/JSONNode.svelte generated by Svelte v3.41.0 */

function create_fragment$d(ctx) {
	let switch_instance;
	let switch_instance_anchor;
	let current;
	var switch_value = /*componentType*/ ctx[6];

	function switch_props(ctx) {
		return {
			props: {
				key: /*key*/ ctx[0],
				value: /*value*/ ctx[1],
				isParentExpanded: /*isParentExpanded*/ ctx[2],
				isParentArray: /*isParentArray*/ ctx[3],
				nodeType: /*nodeType*/ ctx[4],
				valueGetter: /*valueGetter*/ ctx[5]
			}
		};
	}

	if (switch_value) {
		switch_instance = new switch_value(switch_props(ctx));
	}

	return {
		c() {
			if (switch_instance) create_component(switch_instance.$$.fragment);
			switch_instance_anchor = empty();
		},
		m(target, anchor) {
			if (switch_instance) {
				mount_component(switch_instance, target, anchor);
			}

			insert(target, switch_instance_anchor, anchor);
			current = true;
		},
		p(ctx, [dirty]) {
			const switch_instance_changes = {};
			if (dirty & /*key*/ 1) switch_instance_changes.key = /*key*/ ctx[0];
			if (dirty & /*value*/ 2) switch_instance_changes.value = /*value*/ ctx[1];
			if (dirty & /*isParentExpanded*/ 4) switch_instance_changes.isParentExpanded = /*isParentExpanded*/ ctx[2];
			if (dirty & /*isParentArray*/ 8) switch_instance_changes.isParentArray = /*isParentArray*/ ctx[3];
			if (dirty & /*nodeType*/ 16) switch_instance_changes.nodeType = /*nodeType*/ ctx[4];
			if (dirty & /*valueGetter*/ 32) switch_instance_changes.valueGetter = /*valueGetter*/ ctx[5];

			if (switch_value !== (switch_value = /*componentType*/ ctx[6])) {
				if (switch_instance) {
					group_outros();
					const old_component = switch_instance;

					transition_out(old_component.$$.fragment, 1, 0, () => {
						destroy_component(old_component, 1);
					});

					check_outros();
				}

				if (switch_value) {
					switch_instance = new switch_value(switch_props(ctx));
					create_component(switch_instance.$$.fragment);
					transition_in(switch_instance.$$.fragment, 1);
					mount_component(switch_instance, switch_instance_anchor.parentNode, switch_instance_anchor);
				} else {
					switch_instance = null;
				}
			} else if (switch_value) {
				switch_instance.$set(switch_instance_changes);
			}
		},
		i(local) {
			if (current) return;
			if (switch_instance) transition_in(switch_instance.$$.fragment, local);
			current = true;
		},
		o(local) {
			if (switch_instance) transition_out(switch_instance.$$.fragment, local);
			current = false;
		},
		d(detaching) {
			if (detaching) detach(switch_instance_anchor);
			if (switch_instance) destroy_component(switch_instance, detaching);
		}
	};
}

function instance$d($$self, $$props, $$invalidate) {
	let nodeType;
	let componentType;
	let valueGetter;
	let { key, value, isParentExpanded, isParentArray } = $$props;

	function getComponent(nodeType) {
		switch (nodeType) {
			case 'Object':
				return JSONObjectNode;
			case 'Error':
				return ErrorNode;
			case 'Array':
				return JSONArrayNode;
			case 'Iterable':
			case 'Map':
			case 'Set':
				return typeof value.set === 'function'
				? JSONIterableMapNode
				: JSONIterableArrayNode;
			case 'MapEntry':
				return JSONMapEntryNode;
			default:
				return JSONValueNode;
		}
	}

	function getValueGetter(nodeType) {
		switch (nodeType) {
			case 'Object':
			case 'Error':
			case 'Array':
			case 'Iterable':
			case 'Map':
			case 'Set':
			case 'MapEntry':
			case 'Number':
				return undefined;
			case 'String':
				return raw => `"${raw}"`;
			case 'Boolean':
				return raw => raw ? 'true' : 'false';
			case 'Date':
				return raw => raw.toISOString();
			case 'Null':
				return () => 'null';
			case 'Undefined':
				return () => 'undefined';
			case 'Function':
			case 'Symbol':
				return raw => raw.toString();
			default:
				return () => `<${nodeType}>`;
		}
	}

	$$self.$$set = $$props => {
		if ('key' in $$props) $$invalidate(0, key = $$props.key);
		if ('value' in $$props) $$invalidate(1, value = $$props.value);
		if ('isParentExpanded' in $$props) $$invalidate(2, isParentExpanded = $$props.isParentExpanded);
		if ('isParentArray' in $$props) $$invalidate(3, isParentArray = $$props.isParentArray);
	};

	$$self.$$.update = () => {
		if ($$self.$$.dirty & /*value*/ 2) {
			 $$invalidate(4, nodeType = objType(value));
		}

		if ($$self.$$.dirty & /*nodeType*/ 16) {
			 $$invalidate(6, componentType = getComponent(nodeType));
		}

		if ($$self.$$.dirty & /*nodeType*/ 16) {
			 $$invalidate(5, valueGetter = getValueGetter(nodeType));
		}
	};

	return [
		key,
		value,
		isParentExpanded,
		isParentArray,
		nodeType,
		valueGetter,
		componentType
	];
}

class JSONNode extends SvelteComponent {
	constructor(options) {
		super();

		init(this, options, instance$d, create_fragment$d, safe_not_equal, {
			key: 0,
			value: 1,
			isParentExpanded: 2,
			isParentArray: 3
		});
	}
}

/* node_modules/svelte-json-tree-auto/src/Root.svelte generated by Svelte v3.41.0 */

function add_css$7(target) {
	append_styles(target, "svelte-773n60", "ul.svelte-773n60{--string-color:var(--json-tree-string-color, #cb3f41);--symbol-color:var(--json-tree-symbol-color, #cb3f41);--boolean-color:var(--json-tree-boolean-color, #112aa7);--function-color:var(--json-tree-function-color, #112aa7);--number-color:var(--json-tree-number-color, #3029cf);--label-color:var(--json-tree-label-color, #871d8f);--arrow-color:var(--json-tree-arrow-color, #727272);--null-color:var(--json-tree-null-color, #8d8d8d);--undefined-color:var(--json-tree-undefined-color, #8d8d8d);--date-color:var(--json-tree-date-color, #8d8d8d);--li-identation:var(--json-tree-li-indentation, 1em);--li-line-height:var(--json-tree-li-line-height, 1.3);--li-colon-space:0.3em;font-size:var(--json-tree-font-size, 12px);font-family:var(--json-tree-font-family, 'Courier New', Courier, monospace)}ul.svelte-773n60 li{line-height:var(--li-line-height);display:var(--li-display, list-item);list-style:none}ul.svelte-773n60,ul.svelte-773n60 ul{padding:0;margin:0}");
}

function create_fragment$e(ctx) {
	let ul;
	let jsonnode;
	let current;

	jsonnode = new JSONNode({
			props: {
				key: /*key*/ ctx[0],
				value: /*value*/ ctx[1],
				isParentExpanded: true,
				isParentArray: false
			}
		});

	return {
		c() {
			ul = element("ul");
			create_component(jsonnode.$$.fragment);
			attr(ul, "class", "svelte-773n60");
		},
		m(target, anchor) {
			insert(target, ul, anchor);
			mount_component(jsonnode, ul, null);
			current = true;
		},
		p(ctx, [dirty]) {
			const jsonnode_changes = {};
			if (dirty & /*key*/ 1) jsonnode_changes.key = /*key*/ ctx[0];
			if (dirty & /*value*/ 2) jsonnode_changes.value = /*value*/ ctx[1];
			jsonnode.$set(jsonnode_changes);
		},
		i(local) {
			if (current) return;
			transition_in(jsonnode.$$.fragment, local);
			current = true;
		},
		o(local) {
			transition_out(jsonnode.$$.fragment, local);
			current = false;
		},
		d(detaching) {
			if (detaching) detach(ul);
			destroy_component(jsonnode);
		}
	};
}

function instance$e($$self, $$props, $$invalidate) {
	setContext(contextKey, {});
	let { key = '', value } = $$props;

	$$self.$$set = $$props => {
		if ('key' in $$props) $$invalidate(0, key = $$props.key);
		if ('value' in $$props) $$invalidate(1, value = $$props.value);
	};

	return [key, value];
}

class Root extends SvelteComponent {
	constructor(options) {
		super();
		init(this, options, instance$e, create_fragment$e, safe_not_equal, { key: 0, value: 1 }, add_css$7);
	}
}

/* src/client/debug/main/ClientSwitcher.svelte generated by Svelte v3.41.0 */

function add_css$8(target) {
	append_styles(target, "svelte-jvfq3i", ".svelte-jvfq3i{box-sizing:border-box}section.switcher.svelte-jvfq3i{position:sticky;bottom:0;transform:translateY(20px);margin:40px -20px 0;border-top:1px solid #999;padding:20px;background:#fff}label.svelte-jvfq3i{display:flex;align-items:baseline;gap:5px;font-weight:bold}select.svelte-jvfq3i{min-width:140px}");
}

function get_each_context$3(ctx, list, i) {
	const child_ctx = ctx.slice();
	child_ctx[7] = list[i];
	child_ctx[9] = i;
	return child_ctx;
}

// (42:0) {#if debuggableClients.length > 1}
function create_if_block$4(ctx) {
	let section;
	let label;
	let t;
	let select;
	let mounted;
	let dispose;
	let each_value = /*debuggableClients*/ ctx[1];
	let each_blocks = [];

	for (let i = 0; i < each_value.length; i += 1) {
		each_blocks[i] = create_each_block$3(get_each_context$3(ctx, each_value, i));
	}

	return {
		c() {
			section = element("section");
			label = element("label");
			t = text("Client\n      \n      ");
			select = element("select");

			for (let i = 0; i < each_blocks.length; i += 1) {
				each_blocks[i].c();
			}

			attr(select, "id", selectId);
			attr(select, "class", "svelte-jvfq3i");
			if (/*selected*/ ctx[2] === void 0) add_render_callback(() => /*select_change_handler*/ ctx[6].call(select));
			attr(label, "class", "svelte-jvfq3i");
			attr(section, "class", "switcher svelte-jvfq3i");
		},
		m(target, anchor) {
			insert(target, section, anchor);
			append(section, label);
			append(label, t);
			append(label, select);

			for (let i = 0; i < each_blocks.length; i += 1) {
				each_blocks[i].m(select, null);
			}

			select_option(select, /*selected*/ ctx[2]);

			if (!mounted) {
				dispose = [
					listen(select, "change", /*handleSelection*/ ctx[3]),
					listen(select, "change", /*select_change_handler*/ ctx[6])
				];

				mounted = true;
			}
		},
		p(ctx, dirty) {
			if (dirty & /*debuggableClients, JSON*/ 2) {
				each_value = /*debuggableClients*/ ctx[1];
				let i;

				for (i = 0; i < each_value.length; i += 1) {
					const child_ctx = get_each_context$3(ctx, each_value, i);

					if (each_blocks[i]) {
						each_blocks[i].p(child_ctx, dirty);
					} else {
						each_blocks[i] = create_each_block$3(child_ctx);
						each_blocks[i].c();
						each_blocks[i].m(select, null);
					}
				}

				for (; i < each_blocks.length; i += 1) {
					each_blocks[i].d(1);
				}

				each_blocks.length = each_value.length;
			}

			if (dirty & /*selected*/ 4) {
				select_option(select, /*selected*/ ctx[2]);
			}
		},
		d(detaching) {
			if (detaching) detach(section);
			destroy_each(each_blocks, detaching);
			mounted = false;
			run_all(dispose);
		}
	};
}

// (48:8) {#each debuggableClients as clientOption, index}
function create_each_block$3(ctx) {
	let option;
	let t0;
	let t1;
	let t2_value = JSON.stringify(/*clientOption*/ ctx[7].playerID) + "";
	let t2;
	let t3;
	let t4_value = JSON.stringify(/*clientOption*/ ctx[7].matchID) + "";
	let t4;
	let t5;
	let t6_value = /*clientOption*/ ctx[7].game.name + "";
	let t6;
	let t7;
	let option_value_value;

	return {
		c() {
			option = element("option");
			t0 = text(/*index*/ ctx[9]);
			t1 = text(" —\n            playerID: ");
			t2 = text(t2_value);
			t3 = text(",\n            matchID: ");
			t4 = text(t4_value);
			t5 = text("\n            (");
			t6 = text(t6_value);
			t7 = text(")\n          ");
			option.__value = option_value_value = /*index*/ ctx[9];
			option.value = option.__value;
			attr(option, "class", "svelte-jvfq3i");
		},
		m(target, anchor) {
			insert(target, option, anchor);
			append(option, t0);
			append(option, t1);
			append(option, t2);
			append(option, t3);
			append(option, t4);
			append(option, t5);
			append(option, t6);
			append(option, t7);
		},
		p(ctx, dirty) {
			if (dirty & /*debuggableClients*/ 2 && t2_value !== (t2_value = JSON.stringify(/*clientOption*/ ctx[7].playerID) + "")) set_data(t2, t2_value);
			if (dirty & /*debuggableClients*/ 2 && t4_value !== (t4_value = JSON.stringify(/*clientOption*/ ctx[7].matchID) + "")) set_data(t4, t4_value);
			if (dirty & /*debuggableClients*/ 2 && t6_value !== (t6_value = /*clientOption*/ ctx[7].game.name + "")) set_data(t6, t6_value);
		},
		d(detaching) {
			if (detaching) detach(option);
		}
	};
}

function create_fragment$f(ctx) {
	let if_block_anchor;
	let if_block = /*debuggableClients*/ ctx[1].length > 1 && create_if_block$4(ctx);

	return {
		c() {
			if (if_block) if_block.c();
			if_block_anchor = empty();
		},
		m(target, anchor) {
			if (if_block) if_block.m(target, anchor);
			insert(target, if_block_anchor, anchor);
		},
		p(ctx, [dirty]) {
			if (/*debuggableClients*/ ctx[1].length > 1) {
				if (if_block) {
					if_block.p(ctx, dirty);
				} else {
					if_block = create_if_block$4(ctx);
					if_block.c();
					if_block.m(if_block_anchor.parentNode, if_block_anchor);
				}
			} else if (if_block) {
				if_block.d(1);
				if_block = null;
			}
		},
		i: noop,
		o: noop,
		d(detaching) {
			if (if_block) if_block.d(detaching);
			if (detaching) detach(if_block_anchor);
		}
	};
}

const selectId = 'bgio-debug-select-client';

function instance$f($$self, $$props, $$invalidate) {
	let client;
	let debuggableClients;
	let selected;

	let $clientManager,
		$$unsubscribe_clientManager = noop,
		$$subscribe_clientManager = () => ($$unsubscribe_clientManager(), $$unsubscribe_clientManager = subscribe(clientManager, $$value => $$invalidate(5, $clientManager = $$value)), clientManager);

	$$self.$$.on_destroy.push(() => $$unsubscribe_clientManager());
	let { clientManager } = $$props;
	$$subscribe_clientManager();

	const handleSelection = e => {
		// Request to switch to the selected client.
		const selectedClient = debuggableClients[e.target.value];

		clientManager.switchToClient(selectedClient);

		// Maintain focus on the client select menu after switching clients.
		// Necessary because switching clients will usually trigger a mount/unmount.
		const select = document.getElementById(selectId);

		if (select) select.focus();
	};

	function select_change_handler() {
		selected = select_value(this);
		((($$invalidate(2, selected), $$invalidate(1, debuggableClients)), $$invalidate(4, client)), $$invalidate(5, $clientManager));
	}

	$$self.$$set = $$props => {
		if ('clientManager' in $$props) $$subscribe_clientManager($$invalidate(0, clientManager = $$props.clientManager));
	};

	$$self.$$.update = () => {
		if ($$self.$$.dirty & /*$clientManager*/ 32) {
			 $$invalidate(4, { client, debuggableClients } = $clientManager, client, ($$invalidate(1, debuggableClients), $$invalidate(5, $clientManager)));
		}

		if ($$self.$$.dirty & /*debuggableClients, client*/ 18) {
			 $$invalidate(2, selected = debuggableClients.indexOf(client));
		}
	};

	return [
		clientManager,
		debuggableClients,
		selected,
		handleSelection,
		client,
		$clientManager,
		select_change_handler
	];
}

class ClientSwitcher extends SvelteComponent {
	constructor(options) {
		super();
		init(this, options, instance$f, create_fragment$f, safe_not_equal, { clientManager: 0 }, add_css$8);
	}
}

/* src/client/debug/main/Hotkey.svelte generated by Svelte v3.41.0 */

function add_css$9(target) {
	append_styles(target, "svelte-1vfj1mn", ".key.svelte-1vfj1mn.svelte-1vfj1mn{display:flex;flex-direction:row;align-items:center}button.svelte-1vfj1mn.svelte-1vfj1mn{cursor:pointer;min-width:10px;padding-left:5px;padding-right:5px;height:20px;line-height:20px;text-align:center;border:1px solid #ccc;box-shadow:1px 1px 1px #888;background:#eee;color:#444}button.svelte-1vfj1mn.svelte-1vfj1mn:hover{background:#ddd}.key.active.svelte-1vfj1mn button.svelte-1vfj1mn{background:#ddd;border:1px solid #999;box-shadow:none}label.svelte-1vfj1mn.svelte-1vfj1mn{margin-left:10px}");
}

// (78:2) {#if label}
function create_if_block$5(ctx) {
	let label_1;
	let t0;
	let t1;
	let span;
	let t2_value = `(shortcut: ${/*value*/ ctx[0]})` + "";
	let t2;

	return {
		c() {
			label_1 = element("label");
			t0 = text(/*label*/ ctx[1]);
			t1 = space();
			span = element("span");
			t2 = text(t2_value);
			attr(span, "class", "screen-reader-only");
			attr(label_1, "for", /*id*/ ctx[5]);
			attr(label_1, "class", "svelte-1vfj1mn");
		},
		m(target, anchor) {
			insert(target, label_1, anchor);
			append(label_1, t0);
			append(label_1, t1);
			append(label_1, span);
			append(span, t2);
		},
		p(ctx, dirty) {
			if (dirty & /*label*/ 2) set_data(t0, /*label*/ ctx[1]);
			if (dirty & /*value*/ 1 && t2_value !== (t2_value = `(shortcut: ${/*value*/ ctx[0]})` + "")) set_data(t2, t2_value);
		},
		d(detaching) {
			if (detaching) detach(label_1);
		}
	};
}

function create_fragment$g(ctx) {
	let div;
	let button;
	let t0;
	let t1;
	let mounted;
	let dispose;
	let if_block = /*label*/ ctx[1] && create_if_block$5(ctx);

	return {
		c() {
			div = element("div");
			button = element("button");
			t0 = text(/*value*/ ctx[0]);
			t1 = space();
			if (if_block) if_block.c();
			attr(button, "id", /*id*/ ctx[5]);
			button.disabled = /*disable*/ ctx[2];
			attr(button, "class", "svelte-1vfj1mn");
			attr(div, "class", "key svelte-1vfj1mn");
			toggle_class(div, "active", /*active*/ ctx[3]);
		},
		m(target, anchor) {
			insert(target, div, anchor);
			append(div, button);
			append(button, t0);
			append(div, t1);
			if (if_block) if_block.m(div, null);

			if (!mounted) {
				dispose = [
					listen(window, "keydown", /*Keypress*/ ctx[7]),
					listen(button, "click", /*Activate*/ ctx[6])
				];

				mounted = true;
			}
		},
		p(ctx, [dirty]) {
			if (dirty & /*value*/ 1) set_data(t0, /*value*/ ctx[0]);

			if (dirty & /*disable*/ 4) {
				button.disabled = /*disable*/ ctx[2];
			}

			if (/*label*/ ctx[1]) {
				if (if_block) {
					if_block.p(ctx, dirty);
				} else {
					if_block = create_if_block$5(ctx);
					if_block.c();
					if_block.m(div, null);
				}
			} else if (if_block) {
				if_block.d(1);
				if_block = null;
			}

			if (dirty & /*active*/ 8) {
				toggle_class(div, "active", /*active*/ ctx[3]);
			}
		},
		i: noop,
		o: noop,
		d(detaching) {
			if (detaching) detach(div);
			if (if_block) if_block.d();
			mounted = false;
			run_all(dispose);
		}
	};
}

function instance$g($$self, $$props, $$invalidate) {
	let $disableHotkeys;
	let { value } = $$props;
	let { onPress = null } = $$props;
	let { label = null } = $$props;
	let { disable = false } = $$props;
	const { disableHotkeys } = getContext('hotkeys');
	component_subscribe($$self, disableHotkeys, value => $$invalidate(9, $disableHotkeys = value));
	let active = false;
	let id = `key-${value}`;

	function Deactivate() {
		$$invalidate(3, active = false);
	}

	function Activate() {
		$$invalidate(3, active = true);
		setTimeout(Deactivate, 200);

		if (onPress) {
			setTimeout(onPress, 1);
		}
	}

	function Keypress(e) {
		if (!$disableHotkeys && !disable && !e.ctrlKey && !e.metaKey && e.key == value) {
			e.preventDefault();
			Activate();
		}
	}

	$$self.$$set = $$props => {
		if ('value' in $$props) $$invalidate(0, value = $$props.value);
		if ('onPress' in $$props) $$invalidate(8, onPress = $$props.onPress);
		if ('label' in $$props) $$invalidate(1, label = $$props.label);
		if ('disable' in $$props) $$invalidate(2, disable = $$props.disable);
	};

	return [value, label, disable, active, disableHotkeys, id, Activate, Keypress, onPress];
}

class Hotkey extends SvelteComponent {
	constructor(options) {
		super();

		init(
			this,
			options,
			instance$g,
			create_fragment$g,
			safe_not_equal,
			{
				value: 0,
				onPress: 8,
				label: 1,
				disable: 2
			},
			add_css$9
		);
	}
}

/* src/client/debug/main/InteractiveFunction.svelte generated by Svelte v3.41.0 */

function add_css$a(target) {
	append_styles(target, "svelte-1mppqmp", ".move.svelte-1mppqmp{display:flex;flex-direction:row;cursor:pointer;margin-left:10px;color:#666}.move.svelte-1mppqmp:hover{color:#333}.move.active.svelte-1mppqmp{color:#111;font-weight:bold}.arg-field.svelte-1mppqmp{outline:none;font-family:monospace}");
}

function create_fragment$h(ctx) {
	let div;
	let span0;
	let t0;
	let t1;
	let span1;
	let t3;
	let span2;
	let t4;
	let span3;
	let mounted;
	let dispose;

	return {
		c() {
			div = element("div");
			span0 = element("span");
			t0 = text(/*name*/ ctx[2]);
			t1 = space();
			span1 = element("span");
			span1.textContent = "(";
			t3 = space();
			span2 = element("span");
			t4 = space();
			span3 = element("span");
			span3.textContent = ")";
			attr(span2, "class", "arg-field svelte-1mppqmp");
			attr(span2, "contenteditable", "");
			attr(div, "class", "move svelte-1mppqmp");
			toggle_class(div, "active", /*active*/ ctx[3]);
		},
		m(target, anchor) {
			insert(target, div, anchor);
			append(div, span0);
			append(span0, t0);
			append(div, t1);
			append(div, span1);
			append(div, t3);
			append(div, span2);
			/*span2_binding*/ ctx[6](span2);
			append(div, t4);
			append(div, span3);

			if (!mounted) {
				dispose = [
					listen(span2, "focus", function () {
						if (is_function(/*Activate*/ ctx[0])) /*Activate*/ ctx[0].apply(this, arguments);
					}),
					listen(span2, "blur", function () {
						if (is_function(/*Deactivate*/ ctx[1])) /*Deactivate*/ ctx[1].apply(this, arguments);
					}),
					listen(span2, "keypress", stop_propagation(keypress_handler)),
					listen(span2, "keydown", /*OnKeyDown*/ ctx[5]),
					listen(div, "click", function () {
						if (is_function(/*Activate*/ ctx[0])) /*Activate*/ ctx[0].apply(this, arguments);
					})
				];

				mounted = true;
			}
		},
		p(new_ctx, [dirty]) {
			ctx = new_ctx;
			if (dirty & /*name*/ 4) set_data(t0, /*name*/ ctx[2]);

			if (dirty & /*active*/ 8) {
				toggle_class(div, "active", /*active*/ ctx[3]);
			}
		},
		i: noop,
		o: noop,
		d(detaching) {
			if (detaching) detach(div);
			/*span2_binding*/ ctx[6](null);
			mounted = false;
			run_all(dispose);
		}
	};
}

const keypress_handler = () => {
	
};

function instance$h($$self, $$props, $$invalidate) {
	let { Activate } = $$props;
	let { Deactivate } = $$props;
	let { name } = $$props;
	let { active } = $$props;
	let span;
	const dispatch = createEventDispatcher();

	function Submit() {
		try {
			const value = span.innerText;
			let argArray = new Function(`return [${value}]`)();
			dispatch('submit', argArray);
		} catch(error) {
			dispatch('error', error);
		}

		$$invalidate(4, span.innerText = '', span);
	}

	function OnKeyDown(e) {
		if (e.key == 'Enter') {
			e.preventDefault();
			Submit();
		}

		if (e.key == 'Escape') {
			e.preventDefault();
			Deactivate();
		}
	}

	afterUpdate(() => {
		if (active) {
			span.focus();
		} else {
			span.blur();
		}
	});

	function span2_binding($$value) {
		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
			span = $$value;
			$$invalidate(4, span);
		});
	}

	$$self.$$set = $$props => {
		if ('Activate' in $$props) $$invalidate(0, Activate = $$props.Activate);
		if ('Deactivate' in $$props) $$invalidate(1, Deactivate = $$props.Deactivate);
		if ('name' in $$props) $$invalidate(2, name = $$props.name);
		if ('active' in $$props) $$invalidate(3, active = $$props.active);
	};

	return [Activate, Deactivate, name, active, span, OnKeyDown, span2_binding];
}

class InteractiveFunction extends SvelteComponent {
	constructor(options) {
		super();

		init(
			this,
			options,
			instance$h,
			create_fragment$h,
			safe_not_equal,
			{
				Activate: 0,
				Deactivate: 1,
				name: 2,
				active: 3
			},
			add_css$a
		);
	}
}

/* src/client/debug/main/Move.svelte generated by Svelte v3.41.0 */

function add_css$b(target) {
	append_styles(target, "svelte-smqssc", ".move-error.svelte-smqssc{color:#a00;font-weight:bold}.wrapper.svelte-smqssc{display:flex;flex-direction:row;align-items:center}");
}

// (65:2) {#if error}
function create_if_block$6(ctx) {
	let span;
	let t;

	return {
		c() {
			span = element("span");
			t = text(/*error*/ ctx[2]);
			attr(span, "class", "move-error svelte-smqssc");
		},
		m(target, anchor) {
			insert(target, span, anchor);
			append(span, t);
		},
		p(ctx, dirty) {
			if (dirty & /*error*/ 4) set_data(t, /*error*/ ctx[2]);
		},
		d(detaching) {
			if (detaching) detach(span);
		}
	};
}

function create_fragment$i(ctx) {
	let div1;
	let div0;
	let hotkey;
	let t0;
	let interactivefunction;
	let t1;
	let current;

	hotkey = new Hotkey({
			props: {
				value: /*shortcut*/ ctx[0],
				onPress: /*Activate*/ ctx[4]
			}
		});

	interactivefunction = new InteractiveFunction({
			props: {
				Activate: /*Activate*/ ctx[4],
				Deactivate: /*Deactivate*/ ctx[5],
				name: /*name*/ ctx[1],
				active: /*active*/ ctx[3]
			}
		});

	interactivefunction.$on("submit", /*Submit*/ ctx[6]);
	interactivefunction.$on("error", /*Error*/ ctx[7]);
	let if_block = /*error*/ ctx[2] && create_if_block$6(ctx);

	return {
		c() {
			div1 = element("div");
			div0 = element("div");
			create_component(hotkey.$$.fragment);
			t0 = space();
			create_component(interactivefunction.$$.fragment);
			t1 = space();
			if (if_block) if_block.c();
			attr(div0, "class", "wrapper svelte-smqssc");
		},
		m(target, anchor) {
			insert(target, div1, anchor);
			append(div1, div0);
			mount_component(hotkey, div0, null);
			append(div0, t0);
			mount_component(interactivefunction, div0, null);
			append(div1, t1);
			if (if_block) if_block.m(div1, null);
			current = true;
		},
		p(ctx, [dirty]) {
			const hotkey_changes = {};
			if (dirty & /*shortcut*/ 1) hotkey_changes.value = /*shortcut*/ ctx[0];
			hotkey.$set(hotkey_changes);
			const interactivefunction_changes = {};
			if (dirty & /*name*/ 2) interactivefunction_changes.name = /*name*/ ctx[1];
			if (dirty & /*active*/ 8) interactivefunction_changes.active = /*active*/ ctx[3];
			interactivefunction.$set(interactivefunction_changes);

			if (/*error*/ ctx[2]) {
				if (if_block) {
					if_block.p(ctx, dirty);
				} else {
					if_block = create_if_block$6(ctx);
					if_block.c();
					if_block.m(div1, null);
				}
			} else if (if_block) {
				if_block.d(1);
				if_block = null;
			}
		},
		i(local) {
			if (current) return;
			transition_in(hotkey.$$.fragment, local);
			transition_in(interactivefunction.$$.fragment, local);
			current = true;
		},
		o(local) {
			transition_out(hotkey.$$.fragment, local);
			transition_out(interactivefunction.$$.fragment, local);
			current = false;
		},
		d(detaching) {
			if (detaching) detach(div1);
			destroy_component(hotkey);
			destroy_component(interactivefunction);
			if (if_block) if_block.d();
		}
	};
}

function instance$i($$self, $$props, $$invalidate) {
	let { shortcut } = $$props;
	let { name } = $$props;
	let { fn } = $$props;
	const { disableHotkeys } = getContext('hotkeys');
	let error = '';
	let active = false;

	function Activate() {
		disableHotkeys.set(true);
		$$invalidate(3, active = true);
	}

	function Deactivate() {
		disableHotkeys.set(false);
		$$invalidate(2, error = '');
		$$invalidate(3, active = false);
	}

	function Submit(e) {
		$$invalidate(2, error = '');
		Deactivate();
		fn.apply(this, e.detail);
	}

	function Error(e) {
		$$invalidate(2, error = e.detail);
		turnOrder.error(e.detail);
	}

	$$self.$$set = $$props => {
		if ('shortcut' in $$props) $$invalidate(0, shortcut = $$props.shortcut);
		if ('name' in $$props) $$invalidate(1, name = $$props.name);
		if ('fn' in $$props) $$invalidate(8, fn = $$props.fn);
	};

	return [shortcut, name, error, active, Activate, Deactivate, Submit, Error, fn];
}

class Move extends SvelteComponent {
	constructor(options) {
		super();
		init(this, options, instance$i, create_fragment$i, safe_not_equal, { shortcut: 0, name: 1, fn: 8 }, add_css$b);
	}
}

/* src/client/debug/main/Controls.svelte generated by Svelte v3.41.0 */

function add_css$c(target) {
	append_styles(target, "svelte-c3lavh", "ul.svelte-c3lavh{padding-left:0}li.svelte-c3lavh{list-style:none;margin:none;margin-bottom:5px}");
}

function create_fragment$j(ctx) {
	let ul;
	let li0;
	let hotkey0;
	let t0;
	let li1;
	let hotkey1;
	let t1;
	let li2;
	let hotkey2;
	let t2;
	let li3;
	let hotkey3;
	let current;

	hotkey0 = new Hotkey({
			props: {
				value: "1",
				onPress: /*client*/ ctx[0].reset,
				label: "reset"
			}
		});

	hotkey1 = new Hotkey({
			props: {
				value: "2",
				onPress: /*Save*/ ctx[2],
				label: "save"
			}
		});

	hotkey2 = new Hotkey({
			props: {
				value: "3",
				onPress: /*Restore*/ ctx[3],
				label: "restore"
			}
		});

	hotkey3 = new Hotkey({
			props: {
				value: ".",
				onPress: /*ToggleVisibility*/ ctx[1],
				label: "hide"
			}
		});

	return {
		c() {
			ul = element("ul");
			li0 = element("li");
			create_component(hotkey0.$$.fragment);
			t0 = space();
			li1 = element("li");
			create_component(hotkey1.$$.fragment);
			t1 = space();
			li2 = element("li");
			create_component(hotkey2.$$.fragment);
			t2 = space();
			li3 = element("li");
			create_component(hotkey3.$$.fragment);
			attr(li0, "class", "svelte-c3lavh");
			attr(li1, "class", "svelte-c3lavh");
			attr(li2, "class", "svelte-c3lavh");
			attr(li3, "class", "svelte-c3lavh");
			attr(ul, "id", "debug-controls");
			attr(ul, "class", "controls svelte-c3lavh");
		},
		m(target, anchor) {
			insert(target, ul, anchor);
			append(ul, li0);
			mount_component(hotkey0, li0, null);
			append(ul, t0);
			append(ul, li1);
			mount_component(hotkey1, li1, null);
			append(ul, t1);
			append(ul, li2);
			mount_component(hotkey2, li2, null);
			append(ul, t2);
			append(ul, li3);
			mount_component(hotkey3, li3, null);
			current = true;
		},
		p(ctx, [dirty]) {
			const hotkey0_changes = {};
			if (dirty & /*client*/ 1) hotkey0_changes.onPress = /*client*/ ctx[0].reset;
			hotkey0.$set(hotkey0_changes);
			const hotkey3_changes = {};
			if (dirty & /*ToggleVisibility*/ 2) hotkey3_changes.onPress = /*ToggleVisibility*/ ctx[1];
			hotkey3.$set(hotkey3_changes);
		},
		i(local) {
			if (current) return;
			transition_in(hotkey0.$$.fragment, local);
			transition_in(hotkey1.$$.fragment, local);
			transition_in(hotkey2.$$.fragment, local);
			transition_in(hotkey3.$$.fragment, local);
			current = true;
		},
		o(local) {
			transition_out(hotkey0.$$.fragment, local);
			transition_out(hotkey1.$$.fragment, local);
			transition_out(hotkey2.$$.fragment, local);
			transition_out(hotkey3.$$.fragment, local);
			current = false;
		},
		d(detaching) {
			if (detaching) detach(ul);
			destroy_component(hotkey0);
			destroy_component(hotkey1);
			destroy_component(hotkey2);
			destroy_component(hotkey3);
		}
	};
}

function instance$j($$self, $$props, $$invalidate) {
	let { client } = $$props;
	let { ToggleVisibility } = $$props;

	function Save() {
		// get state to persist and overwrite deltalog, _undo, and _redo
		const state = client.getState();

		const json = flatted.stringify({
			...state,
			_undo: [],
			_redo: [],
			deltalog: []
		});

		window.localStorage.setItem('gamestate', json);
		window.localStorage.setItem('initialState', flatted.stringify(client.initialState));
	}

	function Restore() {
		const gamestateJSON = window.localStorage.getItem('gamestate');
		const initialStateJSON = window.localStorage.getItem('initialState');

		if (gamestateJSON !== null && initialStateJSON !== null) {
			const gamestate = flatted.parse(gamestateJSON);
			const initialState = flatted.parse(initialStateJSON);
			client.store.dispatch(turnOrder.sync({ state: gamestate, initialState }));
		}
	}

	$$self.$$set = $$props => {
		if ('client' in $$props) $$invalidate(0, client = $$props.client);
		if ('ToggleVisibility' in $$props) $$invalidate(1, ToggleVisibility = $$props.ToggleVisibility);
	};

	return [client, ToggleVisibility, Save, Restore];
}

class Controls extends SvelteComponent {
	constructor(options) {
		super();
		init(this, options, instance$j, create_fragment$j, safe_not_equal, { client: 0, ToggleVisibility: 1 }, add_css$c);
	}
}

/* src/client/debug/main/PlayerInfo.svelte generated by Svelte v3.41.0 */

function add_css$d(target) {
	append_styles(target, "svelte-19aan9p", ".player-box.svelte-19aan9p{display:flex;flex-direction:row}.player.svelte-19aan9p{cursor:pointer;text-align:center;width:30px;height:30px;line-height:30px;background:#eee;border:3px solid #fefefe;box-sizing:content-box;padding:0}.player.current.svelte-19aan9p{background:#555;color:#eee;font-weight:bold}.player.active.svelte-19aan9p{border:3px solid #ff7f50}");
}

function get_each_context$4(ctx, list, i) {
	const child_ctx = ctx.slice();
	child_ctx[7] = list[i];
	return child_ctx;
}

// (59:2) {#each players as player}
function create_each_block$4(ctx) {
	let button;
	let t0_value = /*player*/ ctx[7] + "";
	let t0;
	let t1;
	let button_aria_label_value;
	let mounted;
	let dispose;

	function click_handler() {
		return /*click_handler*/ ctx[5](/*player*/ ctx[7]);
	}

	return {
		c() {
			button = element("button");
			t0 = text(t0_value);
			t1 = space();
			attr(button, "class", "player svelte-19aan9p");
			attr(button, "aria-label", button_aria_label_value = /*playerLabel*/ ctx[4](/*player*/ ctx[7]));
			toggle_class(button, "current", /*player*/ ctx[7] == /*ctx*/ ctx[0].currentPlayer);
			toggle_class(button, "active", /*player*/ ctx[7] == /*playerID*/ ctx[1]);
		},
		m(target, anchor) {
			insert(target, button, anchor);
			append(button, t0);
			append(button, t1);

			if (!mounted) {
				dispose = listen(button, "click", click_handler);
				mounted = true;
			}
		},
		p(new_ctx, dirty) {
			ctx = new_ctx;
			if (dirty & /*players*/ 4 && t0_value !== (t0_value = /*player*/ ctx[7] + "")) set_data(t0, t0_value);

			if (dirty & /*players*/ 4 && button_aria_label_value !== (button_aria_label_value = /*playerLabel*/ ctx[4](/*player*/ ctx[7]))) {
				attr(button, "aria-label", button_aria_label_value);
			}

			if (dirty & /*players, ctx*/ 5) {
				toggle_class(button, "current", /*player*/ ctx[7] == /*ctx*/ ctx[0].currentPlayer);
			}

			if (dirty & /*players, playerID*/ 6) {
				toggle_class(button, "active", /*player*/ ctx[7] == /*playerID*/ ctx[1]);
			}
		},
		d(detaching) {
			if (detaching) detach(button);
			mounted = false;
			dispose();
		}
	};
}

function create_fragment$k(ctx) {
	let div;
	let each_value = /*players*/ ctx[2];
	let each_blocks = [];

	for (let i = 0; i < each_value.length; i += 1) {
		each_blocks[i] = create_each_block$4(get_each_context$4(ctx, each_value, i));
	}

	return {
		c() {
			div = element("div");

			for (let i = 0; i < each_blocks.length; i += 1) {
				each_blocks[i].c();
			}

			attr(div, "class", "player-box svelte-19aan9p");
		},
		m(target, anchor) {
			insert(target, div, anchor);

			for (let i = 0; i < each_blocks.length; i += 1) {
				each_blocks[i].m(div, null);
			}
		},
		p(ctx, [dirty]) {
			if (dirty & /*playerLabel, players, ctx, playerID, OnClick*/ 31) {
				each_value = /*players*/ ctx[2];
				let i;

				for (i = 0; i < each_value.length; i += 1) {
					const child_ctx = get_each_context$4(ctx, each_value, i);

					if (each_blocks[i]) {
						each_blocks[i].p(child_ctx, dirty);
					} else {
						each_blocks[i] = create_each_block$4(child_ctx);
						each_blocks[i].c();
						each_blocks[i].m(div, null);
					}
				}

				for (; i < each_blocks.length; i += 1) {
					each_blocks[i].d(1);
				}

				each_blocks.length = each_value.length;
			}
		},
		i: noop,
		o: noop,
		d(detaching) {
			if (detaching) detach(div);
			destroy_each(each_blocks, detaching);
		}
	};
}

function instance$k($$self, $$props, $$invalidate) {
	let { ctx } = $$props;
	let { playerID } = $$props;
	const dispatch = createEventDispatcher();

	function OnClick(player) {
		if (player == playerID) {
			dispatch("change", { playerID: null });
		} else {
			dispatch("change", { playerID: player });
		}
	}

	function playerLabel(player) {
		const properties = [];
		if (player == ctx.currentPlayer) properties.push('current');
		if (player == playerID) properties.push('active');
		let label = `Player ${player}`;
		if (properties.length) label += ` (${properties.join(', ')})`;
		return label;
	}

	let players;
	const click_handler = player => OnClick(player);

	$$self.$$set = $$props => {
		if ('ctx' in $$props) $$invalidate(0, ctx = $$props.ctx);
		if ('playerID' in $$props) $$invalidate(1, playerID = $$props.playerID);
	};

	$$self.$$.update = () => {
		if ($$self.$$.dirty & /*ctx*/ 1) {
			 $$invalidate(2, players = ctx
			? [...Array(ctx.numPlayers).keys()].map(i => i.toString())
			: []);
		}
	};

	return [ctx, playerID, players, OnClick, playerLabel, click_handler];
}

class PlayerInfo extends SvelteComponent {
	constructor(options) {
		super();
		init(this, options, instance$k, create_fragment$k, safe_not_equal, { ctx: 0, playerID: 1 }, add_css$d);
	}
}

function ownKeys(object, enumerableOnly) {
  var keys = Object.keys(object);

  if (Object.getOwnPropertySymbols) {
    var symbols = Object.getOwnPropertySymbols(object);

    if (enumerableOnly) {
      symbols = symbols.filter(function (sym) {
        return Object.getOwnPropertyDescriptor(object, sym).enumerable;
      });
    }

    keys.push.apply(keys, symbols);
  }

  return keys;
}

function _objectSpread2(target) {
  for (var i = 1; i < arguments.length; i++) {
    var source = arguments[i] != null ? arguments[i] : {};

    if (i % 2) {
      ownKeys(Object(source), true).forEach(function (key) {
        _defineProperty(target, key, source[key]);
      });
    } else if (Object.getOwnPropertyDescriptors) {
      Object.defineProperties(target, Object.getOwnPropertyDescriptors(source));
    } else {
      ownKeys(Object(source)).forEach(function (key) {
        Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key));
      });
    }
  }

  return target;
}

function _classCallCheck(instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError("Cannot call a class as a function");
  }
}

function _defineProperties(target, props) {
  for (var i = 0; i < props.length; i++) {
    var descriptor = props[i];
    descriptor.enumerable = descriptor.enumerable || false;
    descriptor.configurable = true;
    if ("value" in descriptor) descriptor.writable = true;
    Object.defineProperty(target, descriptor.key, descriptor);
  }
}

function _createClass(Constructor, protoProps, staticProps) {
  if (protoProps) _defineProperties(Constructor.prototype, protoProps);
  if (staticProps) _defineProperties(Constructor, staticProps);
  return Constructor;
}

function _defineProperty(obj, key, value) {
  if (key in obj) {
    Object.defineProperty(obj, key, {
      value: value,
      enumerable: true,
      configurable: true,
      writable: true
    });
  } else {
    obj[key] = value;
  }

  return obj;
}

function _inherits(subClass, superClass) {
  if (typeof superClass !== "function" && superClass !== null) {
    throw new TypeError("Super expression must either be null or a function");
  }

  subClass.prototype = Object.create(superClass && superClass.prototype, {
    constructor: {
      value: subClass,
      writable: true,
      configurable: true
    }
  });
  if (superClass) _setPrototypeOf(subClass, superClass);
}

function _getPrototypeOf(o) {
  _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf : function _getPrototypeOf(o) {
    return o.__proto__ || Object.getPrototypeOf(o);
  };
  return _getPrototypeOf(o);
}

function _setPrototypeOf(o, p) {
  _setPrototypeOf = Object.setPrototypeOf || function _setPrototypeOf(o, p) {
    o.__proto__ = p;
    return o;
  };

  return _setPrototypeOf(o, p);
}

function _isNativeReflectConstruct() {
  if (typeof Reflect === "undefined" || !Reflect.construct) return false;
  if (Reflect.construct.sham) return false;
  if (typeof Proxy === "function") return true;

  try {
    Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () {}));
    return true;
  } catch (e) {
    return false;
  }
}

function _objectWithoutPropertiesLoose(source, excluded) {
  if (source == null) return {};
  var target = {};
  var sourceKeys = Object.keys(source);
  var key, i;

  for (i = 0; i < sourceKeys.length; i++) {
    key = sourceKeys[i];
    if (excluded.indexOf(key) >= 0) continue;
    target[key] = source[key];
  }

  return target;
}

function _objectWithoutProperties(source, excluded) {
  if (source == null) return {};

  var target = _objectWithoutPropertiesLoose(source, excluded);

  var key, i;

  if (Object.getOwnPropertySymbols) {
    var sourceSymbolKeys = Object.getOwnPropertySymbols(source);

    for (i = 0; i < sourceSymbolKeys.length; i++) {
      key = sourceSymbolKeys[i];
      if (excluded.indexOf(key) >= 0) continue;
      if (!Object.prototype.propertyIsEnumerable.call(source, key)) continue;
      target[key] = source[key];
    }
  }

  return target;
}

function _assertThisInitialized(self) {
  if (self === void 0) {
    throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
  }

  return self;
}

function _possibleConstructorReturn(self, call) {
  if (call && (typeof call === "object" || typeof call === "function")) {
    return call;
  } else if (call !== void 0) {
    throw new TypeError("Derived constructors may only return object or undefined");
  }

  return _assertThisInitialized(self);
}

function _createSuper(Derived) {
  var hasNativeReflectConstruct = _isNativeReflectConstruct();

  return function _createSuperInternal() {
    var Super = _getPrototypeOf(Derived),
        result;

    if (hasNativeReflectConstruct) {
      var NewTarget = _getPrototypeOf(this).constructor;

      result = Reflect.construct(Super, arguments, NewTarget);
    } else {
      result = Super.apply(this, arguments);
    }

    return _possibleConstructorReturn(this, result);
  };
}

function _unsupportedIterableToArray(o, minLen) {
  if (!o) return;
  if (typeof o === "string") return _arrayLikeToArray(o, minLen);
  var n = Object.prototype.toString.call(o).slice(8, -1);
  if (n === "Object" && o.constructor) n = o.constructor.name;
  if (n === "Map" || n === "Set") return Array.from(o);
  if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen);
}

function _arrayLikeToArray(arr, len) {
  if (len == null || len > arr.length) len = arr.length;

  for (var i = 0, arr2 = new Array(len); i < len; i++) arr2[i] = arr[i];

  return arr2;
}

function _createForOfIteratorHelper(o, allowArrayLike) {
  var it = typeof Symbol !== "undefined" && o[Symbol.iterator] || o["@@iterator"];

  if (!it) {
    if (Array.isArray(o) || (it = _unsupportedIterableToArray(o)) || allowArrayLike && o && typeof o.length === "number") {
      if (it) o = it;
      var i = 0;

      var F = function () {};

      return {
        s: F,
        n: function () {
          if (i >= o.length) return {
            done: true
          };
          return {
            done: false,
            value: o[i++]
          };
        },
        e: function (e) {
          throw e;
        },
        f: F
      };
    }

    throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
  }

  var normalCompletion = true,
      didErr = false,
      err;
  return {
    s: function () {
      it = it.call(o);
    },
    n: function () {
      var step = it.next();
      normalCompletion = step.done;
      return step;
    },
    e: function (e) {
      didErr = true;
      err = e;
    },
    f: function () {
      try {
        if (!normalCompletion && it.return != null) it.return();
      } finally {
        if (didErr) throw err;
      }
    }
  };
}

/*
 * Copyright 2018 The boardgame.io Authors
 *
 * Use of this source code is governed by a MIT-style
 * license that can be found in the LICENSE file or at
 * https://opensource.org/licenses/MIT.
 */
function AssignShortcuts(moveNames, blacklist) {
  var shortcuts = {};
  var taken = {};

  var _iterator = _createForOfIteratorHelper(blacklist),
      _step;

  try {
    for (_iterator.s(); !(_step = _iterator.n()).done;) {
      var c = _step.value;
      taken[c] = true;
    } // Try assigning the first char of each move as the shortcut.

  } catch (err) {
    _iterator.e(err);
  } finally {
    _iterator.f();
  }

  var t = taken;
  var canUseFirstChar = true;

  for (var name in moveNames) {
    var shortcut = name[0];

    if (t[shortcut]) {
      canUseFirstChar = false;
      break;
    }

    t[shortcut] = true;
    shortcuts[name] = shortcut;
  }

  if (canUseFirstChar) {
    return shortcuts;
  } // If those aren't unique, use a-z.


  t = taken;
  var next = 97;
  shortcuts = {};

  for (var _name in moveNames) {
    var _shortcut = String.fromCharCode(next);

    while (t[_shortcut]) {
      next++;
      _shortcut = String.fromCharCode(next);
    }

    t[_shortcut] = true;
    shortcuts[_name] = _shortcut;
  }

  return shortcuts;
}

/* src/client/debug/main/Main.svelte generated by Svelte v3.41.0 */

function add_css$e(target) {
	append_styles(target, "svelte-146sq5f", ".tree.svelte-146sq5f{--json-tree-font-family:monospace;--json-tree-font-size:14px;--json-tree-null-color:#757575}.label.svelte-146sq5f{margin-bottom:0;text-transform:none}h3.svelte-146sq5f{text-transform:uppercase}ul.svelte-146sq5f{padding-left:0}li.svelte-146sq5f{list-style:none;margin:0;margin-bottom:5px}");
}

function get_each_context$5(ctx, list, i) {
	const child_ctx = ctx.slice();
	child_ctx[10] = list[i][0];
	child_ctx[11] = list[i][1];
	return child_ctx;
}

// (78:4) {#each Object.entries(moves) as [name, fn]}
function create_each_block$5(ctx) {
	let li;
	let move;
	let t;
	let current;

	move = new Move({
			props: {
				shortcut: /*shortcuts*/ ctx[8][/*name*/ ctx[10]],
				fn: /*fn*/ ctx[11],
				name: /*name*/ ctx[10]
			}
		});

	return {
		c() {
			li = element("li");
			create_component(move.$$.fragment);
			t = space();
			attr(li, "class", "svelte-146sq5f");
		},
		m(target, anchor) {
			insert(target, li, anchor);
			mount_component(move, li, null);
			append(li, t);
			current = true;
		},
		p(ctx, dirty) {
			const move_changes = {};
			if (dirty & /*moves*/ 16) move_changes.shortcut = /*shortcuts*/ ctx[8][/*name*/ ctx[10]];
			if (dirty & /*moves*/ 16) move_changes.fn = /*fn*/ ctx[11];
			if (dirty & /*moves*/ 16) move_changes.name = /*name*/ ctx[10];
			move.$set(move_changes);
		},
		i(local) {
			if (current) return;
			transition_in(move.$$.fragment, local);
			current = true;
		},
		o(local) {
			transition_out(move.$$.fragment, local);
			current = false;
		},
		d(detaching) {
			if (detaching) detach(li);
			destroy_component(move);
		}
	};
}

// (90:2) {#if ctx.activePlayers && events.endStage}
function create_if_block_2$2(ctx) {
	let li;
	let move;
	let current;

	move = new Move({
			props: {
				name: "endStage",
				shortcut: 7,
				fn: /*events*/ ctx[5].endStage
			}
		});

	return {
		c() {
			li = element("li");
			create_component(move.$$.fragment);
			attr(li, "class", "svelte-146sq5f");
		},
		m(target, anchor) {
			insert(target, li, anchor);
			mount_component(move, li, null);
			current = true;
		},
		p(ctx, dirty) {
			const move_changes = {};
			if (dirty & /*events*/ 32) move_changes.fn = /*events*/ ctx[5].endStage;
			move.$set(move_changes);
		},
		i(local) {
			if (current) return;
			transition_in(move.$$.fragment, local);
			current = true;
		},
		o(local) {
			transition_out(move.$$.fragment, local);
			current = false;
		},
		d(detaching) {
			if (detaching) detach(li);
			destroy_component(move);
		}
	};
}

// (95:2) {#if events.endTurn}
function create_if_block_1$2(ctx) {
	let li;
	let move;
	let current;

	move = new Move({
			props: {
				name: "endTurn",
				shortcut: 8,
				fn: /*events*/ ctx[5].endTurn
			}
		});

	return {
		c() {
			li = element("li");
			create_component(move.$$.fragment);
			attr(li, "class", "svelte-146sq5f");
		},
		m(target, anchor) {
			insert(target, li, anchor);
			mount_component(move, li, null);
			current = true;
		},
		p(ctx, dirty) {
			const move_changes = {};
			if (dirty & /*events*/ 32) move_changes.fn = /*events*/ ctx[5].endTurn;
			move.$set(move_changes);
		},
		i(local) {
			if (current) return;
			transition_in(move.$$.fragment, local);
			current = true;
		},
		o(local) {
			transition_out(move.$$.fragment, local);
			current = false;
		},
		d(detaching) {
			if (detaching) detach(li);
			destroy_component(move);
		}
	};
}

// (100:2) {#if ctx.phase && events.endPhase}
function create_if_block$7(ctx) {
	let li;
	let move;
	let current;

	move = new Move({
			props: {
				name: "endPhase",
				shortcut: 9,
				fn: /*events*/ ctx[5].endPhase
			}
		});

	return {
		c() {
			li = element("li");
			create_component(move.$$.fragment);
			attr(li, "class", "svelte-146sq5f");
		},
		m(target, anchor) {
			insert(target, li, anchor);
			mount_component(move, li, null);
			current = true;
		},
		p(ctx, dirty) {
			const move_changes = {};
			if (dirty & /*events*/ 32) move_changes.fn = /*events*/ ctx[5].endPhase;
			move.$set(move_changes);
		},
		i(local) {
			if (current) return;
			transition_in(move.$$.fragment, local);
			current = true;
		},
		o(local) {
			transition_out(move.$$.fragment, local);
			current = false;
		},
		d(detaching) {
			if (detaching) detach(li);
			destroy_component(move);
		}
	};
}

function create_fragment$l(ctx) {
	let section0;
	let h30;
	let t1;
	let controls;
	let t2;
	let section1;
	let h31;
	let t4;
	let playerinfo;
	let t5;
	let section2;
	let h32;
	let t7;
	let ul0;
	let t8;
	let section3;
	let h33;
	let t10;
	let ul1;
	let t11;
	let t12;
	let t13;
	let section4;
	let h34;
	let t15;
	let jsontree0;
	let t16;
	let section5;
	let h35;
	let t18;
	let jsontree1;
	let t19;
	let clientswitcher;
	let current;

	controls = new Controls({
			props: {
				client: /*client*/ ctx[0],
				ToggleVisibility: /*ToggleVisibility*/ ctx[2]
			}
		});

	playerinfo = new PlayerInfo({
			props: {
				ctx: /*ctx*/ ctx[6],
				playerID: /*playerID*/ ctx[3]
			}
		});

	playerinfo.$on("change", /*change_handler*/ ctx[9]);
	let each_value = Object.entries(/*moves*/ ctx[4]);
	let each_blocks = [];

	for (let i = 0; i < each_value.length; i += 1) {
		each_blocks[i] = create_each_block$5(get_each_context$5(ctx, each_value, i));
	}

	const out = i => transition_out(each_blocks[i], 1, 1, () => {
		each_blocks[i] = null;
	});

	let if_block0 = /*ctx*/ ctx[6].activePlayers && /*events*/ ctx[5].endStage && create_if_block_2$2(ctx);
	let if_block1 = /*events*/ ctx[5].endTurn && create_if_block_1$2(ctx);
	let if_block2 = /*ctx*/ ctx[6].phase && /*events*/ ctx[5].endPhase && create_if_block$7(ctx);
	jsontree0 = new Root({ props: { value: /*G*/ ctx[7] } });

	jsontree1 = new Root({
			props: { value: SanitizeCtx(/*ctx*/ ctx[6]) }
		});

	clientswitcher = new ClientSwitcher({
			props: { clientManager: /*clientManager*/ ctx[1] }
		});

	return {
		c() {
			section0 = element("section");
			h30 = element("h3");
			h30.textContent = "Controls";
			t1 = space();
			create_component(controls.$$.fragment);
			t2 = space();
			section1 = element("section");
			h31 = element("h3");
			h31.textContent = "Players";
			t4 = space();
			create_component(playerinfo.$$.fragment);
			t5 = space();
			section2 = element("section");
			h32 = element("h3");
			h32.textContent = "Moves";
			t7 = space();
			ul0 = element("ul");

			for (let i = 0; i < each_blocks.length; i += 1) {
				each_blocks[i].c();
			}

			t8 = space();
			section3 = element("section");
			h33 = element("h3");
			h33.textContent = "Events";
			t10 = space();
			ul1 = element("ul");
			if (if_block0) if_block0.c();
			t11 = space();
			if (if_block1) if_block1.c();
			t12 = space();
			if (if_block2) if_block2.c();
			t13 = space();
			section4 = element("section");
			h34 = element("h3");
			h34.textContent = "G";
			t15 = space();
			create_component(jsontree0.$$.fragment);
			t16 = space();
			section5 = element("section");
			h35 = element("h3");
			h35.textContent = "ctx";
			t18 = space();
			create_component(jsontree1.$$.fragment);
			t19 = space();
			create_component(clientswitcher.$$.fragment);
			attr(h30, "class", "svelte-146sq5f");
			attr(h31, "class", "svelte-146sq5f");
			attr(h32, "class", "svelte-146sq5f");
			attr(ul0, "class", "svelte-146sq5f");
			attr(h33, "class", "svelte-146sq5f");
			attr(ul1, "class", "svelte-146sq5f");
			attr(h34, "class", "label svelte-146sq5f");
			attr(section4, "class", "tree svelte-146sq5f");
			attr(h35, "class", "label svelte-146sq5f");
			attr(section5, "class", "tree svelte-146sq5f");
		},
		m(target, anchor) {
			insert(target, section0, anchor);
			append(section0, h30);
			append(section0, t1);
			mount_component(controls, section0, null);
			insert(target, t2, anchor);
			insert(target, section1, anchor);
			append(section1, h31);
			append(section1, t4);
			mount_component(playerinfo, section1, null);
			insert(target, t5, anchor);
			insert(target, section2, anchor);
			append(section2, h32);
			append(section2, t7);
			append(section2, ul0);

			for (let i = 0; i < each_blocks.length; i += 1) {
				each_blocks[i].m(ul0, null);
			}

			insert(target, t8, anchor);
			insert(target, section3, anchor);
			append(section3, h33);
			append(section3, t10);
			append(section3, ul1);
			if (if_block0) if_block0.m(ul1, null);
			append(ul1, t11);
			if (if_block1) if_block1.m(ul1, null);
			append(ul1, t12);
			if (if_block2) if_block2.m(ul1, null);
			insert(target, t13, anchor);
			insert(target, section4, anchor);
			append(section4, h34);
			append(section4, t15);
			mount_component(jsontree0, section4, null);
			insert(target, t16, anchor);
			insert(target, section5, anchor);
			append(section5, h35);
			append(section5, t18);
			mount_component(jsontree1, section5, null);
			insert(target, t19, anchor);
			mount_component(clientswitcher, target, anchor);
			current = true;
		},
		p(ctx, [dirty]) {
			const controls_changes = {};
			if (dirty & /*client*/ 1) controls_changes.client = /*client*/ ctx[0];
			if (dirty & /*ToggleVisibility*/ 4) controls_changes.ToggleVisibility = /*ToggleVisibility*/ ctx[2];
			controls.$set(controls_changes);
			const playerinfo_changes = {};
			if (dirty & /*ctx*/ 64) playerinfo_changes.ctx = /*ctx*/ ctx[6];
			if (dirty & /*playerID*/ 8) playerinfo_changes.playerID = /*playerID*/ ctx[3];
			playerinfo.$set(playerinfo_changes);

			if (dirty & /*shortcuts, Object, moves*/ 272) {
				each_value = Object.entries(/*moves*/ ctx[4]);
				let i;

				for (i = 0; i < each_value.length; i += 1) {
					const child_ctx = get_each_context$5(ctx, each_value, i);

					if (each_blocks[i]) {
						each_blocks[i].p(child_ctx, dirty);
						transition_in(each_blocks[i], 1);
					} else {
						each_blocks[i] = create_each_block$5(child_ctx);
						each_blocks[i].c();
						transition_in(each_blocks[i], 1);
						each_blocks[i].m(ul0, null);
					}
				}

				group_outros();

				for (i = each_value.length; i < each_blocks.length; i += 1) {
					out(i);
				}

				check_outros();
			}

			if (/*ctx*/ ctx[6].activePlayers && /*events*/ ctx[5].endStage) {
				if (if_block0) {
					if_block0.p(ctx, dirty);

					if (dirty & /*ctx, events*/ 96) {
						transition_in(if_block0, 1);
					}
				} else {
					if_block0 = create_if_block_2$2(ctx);
					if_block0.c();
					transition_in(if_block0, 1);
					if_block0.m(ul1, t11);
				}
			} else if (if_block0) {
				group_outros();

				transition_out(if_block0, 1, 1, () => {
					if_block0 = null;
				});

				check_outros();
			}

			if (/*events*/ ctx[5].endTurn) {
				if (if_block1) {
					if_block1.p(ctx, dirty);

					if (dirty & /*events*/ 32) {
						transition_in(if_block1, 1);
					}
				} else {
					if_block1 = create_if_block_1$2(ctx);
					if_block1.c();
					transition_in(if_block1, 1);
					if_block1.m(ul1, t12);
				}
			} else if (if_block1) {
				group_outros();

				transition_out(if_block1, 1, 1, () => {
					if_block1 = null;
				});

				check_outros();
			}

			if (/*ctx*/ ctx[6].phase && /*events*/ ctx[5].endPhase) {
				if (if_block2) {
					if_block2.p(ctx, dirty);

					if (dirty & /*ctx, events*/ 96) {
						transition_in(if_block2, 1);
					}
				} else {
					if_block2 = create_if_block$7(ctx);
					if_block2.c();
					transition_in(if_block2, 1);
					if_block2.m(ul1, null);
				}
			} else if (if_block2) {
				group_outros();

				transition_out(if_block2, 1, 1, () => {
					if_block2 = null;
				});

				check_outros();
			}

			const jsontree0_changes = {};
			if (dirty & /*G*/ 128) jsontree0_changes.value = /*G*/ ctx[7];
			jsontree0.$set(jsontree0_changes);
			const jsontree1_changes = {};
			if (dirty & /*ctx*/ 64) jsontree1_changes.value = SanitizeCtx(/*ctx*/ ctx[6]);
			jsontree1.$set(jsontree1_changes);
			const clientswitcher_changes = {};
			if (dirty & /*clientManager*/ 2) clientswitcher_changes.clientManager = /*clientManager*/ ctx[1];
			clientswitcher.$set(clientswitcher_changes);
		},
		i(local) {
			if (current) return;
			transition_in(controls.$$.fragment, local);
			transition_in(playerinfo.$$.fragment, local);

			for (let i = 0; i < each_value.length; i += 1) {
				transition_in(each_blocks[i]);
			}

			transition_in(if_block0);
			transition_in(if_block1);
			transition_in(if_block2);
			transition_in(jsontree0.$$.fragment, local);
			transition_in(jsontree1.$$.fragment, local);
			transition_in(clientswitcher.$$.fragment, local);
			current = true;
		},
		o(local) {
			transition_out(controls.$$.fragment, local);
			transition_out(playerinfo.$$.fragment, local);
			each_blocks = each_blocks.filter(Boolean);

			for (let i = 0; i < each_blocks.length; i += 1) {
				transition_out(each_blocks[i]);
			}

			transition_out(if_block0);
			transition_out(if_block1);
			transition_out(if_block2);
			transition_out(jsontree0.$$.fragment, local);
			transition_out(jsontree1.$$.fragment, local);
			transition_out(clientswitcher.$$.fragment, local);
			current = false;
		},
		d(detaching) {
			if (detaching) detach(section0);
			destroy_component(controls);
			if (detaching) detach(t2);
			if (detaching) detach(section1);
			destroy_component(playerinfo);
			if (detaching) detach(t5);
			if (detaching) detach(section2);
			destroy_each(each_blocks, detaching);
			if (detaching) detach(t8);
			if (detaching) detach(section3);
			if (if_block0) if_block0.d();
			if (if_block1) if_block1.d();
			if (if_block2) if_block2.d();
			if (detaching) detach(t13);
			if (detaching) detach(section4);
			destroy_component(jsontree0);
			if (detaching) detach(t16);
			if (detaching) detach(section5);
			destroy_component(jsontree1);
			if (detaching) detach(t19);
			destroy_component(clientswitcher, detaching);
		}
	};
}

function SanitizeCtx(ctx) {
	let r = {};

	for (const key in ctx) {
		if (!key.startsWith('_')) {
			r[key] = ctx[key];
		}
	}

	return r;
}

function instance$l($$self, $$props, $$invalidate) {
	let { client } = $$props;
	let { clientManager } = $$props;
	let { ToggleVisibility } = $$props;
	const shortcuts = AssignShortcuts(client.moves, 'mlia');
	let { playerID, moves, events } = client;
	let ctx = {};
	let G = {};

	client.subscribe(state => {
		if (state) $$invalidate(7, { G, ctx } = state, G, $$invalidate(6, ctx));
		$$invalidate(3, { playerID, moves, events } = client, playerID, $$invalidate(4, moves), $$invalidate(5, events));
	});

	const change_handler = e => clientManager.switchPlayerID(e.detail.playerID);

	$$self.$$set = $$props => {
		if ('client' in $$props) $$invalidate(0, client = $$props.client);
		if ('clientManager' in $$props) $$invalidate(1, clientManager = $$props.clientManager);
		if ('ToggleVisibility' in $$props) $$invalidate(2, ToggleVisibility = $$props.ToggleVisibility);
	};

	return [
		client,
		clientManager,
		ToggleVisibility,
		playerID,
		moves,
		events,
		ctx,
		G,
		shortcuts,
		change_handler
	];
}

class Main extends SvelteComponent {
	constructor(options) {
		super();

		init(
			this,
			options,
			instance$l,
			create_fragment$l,
			safe_not_equal,
			{
				client: 0,
				clientManager: 1,
				ToggleVisibility: 2
			},
			add_css$e
		);
	}
}

/* src/client/debug/info/Item.svelte generated by Svelte v3.41.0 */

function add_css$f(target) {
	append_styles(target, "svelte-13qih23", ".item.svelte-13qih23.svelte-13qih23{padding:10px}.item.svelte-13qih23.svelte-13qih23:not(:first-child){border-top:1px dashed #aaa}.item.svelte-13qih23 div.svelte-13qih23{float:right;text-align:right}");
}

function create_fragment$m(ctx) {
	let div1;
	let strong;
	let t0;
	let t1;
	let div0;
	let t2_value = JSON.stringify(/*value*/ ctx[1]) + "";
	let t2;

	return {
		c() {
			div1 = element("div");
			strong = element("strong");
			t0 = text(/*name*/ ctx[0]);
			t1 = space();
			div0 = element("div");
			t2 = text(t2_value);
			attr(div0, "class", "svelte-13qih23");
			attr(div1, "class", "item svelte-13qih23");
		},
		m(target, anchor) {
			insert(target, div1, anchor);
			append(div1, strong);
			append(strong, t0);
			append(div1, t1);
			append(div1, div0);
			append(div0, t2);
		},
		p(ctx, [dirty]) {
			if (dirty & /*name*/ 1) set_data(t0, /*name*/ ctx[0]);
			if (dirty & /*value*/ 2 && t2_value !== (t2_value = JSON.stringify(/*value*/ ctx[1]) + "")) set_data(t2, t2_value);
		},
		i: noop,
		o: noop,
		d(detaching) {
			if (detaching) detach(div1);
		}
	};
}

function instance$m($$self, $$props, $$invalidate) {
	let { name } = $$props;
	let { value } = $$props;

	$$self.$$set = $$props => {
		if ('name' in $$props) $$invalidate(0, name = $$props.name);
		if ('value' in $$props) $$invalidate(1, value = $$props.value);
	};

	return [name, value];
}

class Item extends SvelteComponent {
	constructor(options) {
		super();
		init(this, options, instance$m, create_fragment$m, safe_not_equal, { name: 0, value: 1 }, add_css$f);
	}
}

/* src/client/debug/info/Info.svelte generated by Svelte v3.41.0 */

function add_css$g(target) {
	append_styles(target, "svelte-1yzq5o8", ".gameinfo.svelte-1yzq5o8{padding:10px}");
}

// (19:2) {#if client.multiplayer}
function create_if_block$8(ctx) {
	let item;
	let current;

	item = new Item({
			props: {
				name: "isConnected",
				value: /*$client*/ ctx[1].isConnected
			}
		});

	return {
		c() {
			create_component(item.$$.fragment);
		},
		m(target, anchor) {
			mount_component(item, target, anchor);
			current = true;
		},
		p(ctx, dirty) {
			const item_changes = {};
			if (dirty & /*$client*/ 2) item_changes.value = /*$client*/ ctx[1].isConnected;
			item.$set(item_changes);
		},
		i(local) {
			if (current) return;
			transition_in(item.$$.fragment, local);
			current = true;
		},
		o(local) {
			transition_out(item.$$.fragment, local);
			current = false;
		},
		d(detaching) {
			destroy_component(item, detaching);
		}
	};
}

function create_fragment$n(ctx) {
	let section;
	let item0;
	let t0;
	let item1;
	let t1;
	let item2;
	let t2;
	let current;

	item0 = new Item({
			props: {
				name: "matchID",
				value: /*client*/ ctx[0].matchID
			}
		});

	item1 = new Item({
			props: {
				name: "playerID",
				value: /*client*/ ctx[0].playerID
			}
		});

	item2 = new Item({
			props: {
				name: "isActive",
				value: /*$client*/ ctx[1].isActive
			}
		});

	let if_block = /*client*/ ctx[0].multiplayer && create_if_block$8(ctx);

	return {
		c() {
			section = element("section");
			create_component(item0.$$.fragment);
			t0 = space();
			create_component(item1.$$.fragment);
			t1 = space();
			create_component(item2.$$.fragment);
			t2 = space();
			if (if_block) if_block.c();
			attr(section, "class", "gameinfo svelte-1yzq5o8");
		},
		m(target, anchor) {
			insert(target, section, anchor);
			mount_component(item0, section, null);
			append(section, t0);
			mount_component(item1, section, null);
			append(section, t1);
			mount_component(item2, section, null);
			append(section, t2);
			if (if_block) if_block.m(section, null);
			current = true;
		},
		p(ctx, [dirty]) {
			const item0_changes = {};
			if (dirty & /*client*/ 1) item0_changes.value = /*client*/ ctx[0].matchID;
			item0.$set(item0_changes);
			const item1_changes = {};
			if (dirty & /*client*/ 1) item1_changes.value = /*client*/ ctx[0].playerID;
			item1.$set(item1_changes);
			const item2_changes = {};
			if (dirty & /*$client*/ 2) item2_changes.value = /*$client*/ ctx[1].isActive;
			item2.$set(item2_changes);

			if (/*client*/ ctx[0].multiplayer) {
				if (if_block) {
					if_block.p(ctx, dirty);

					if (dirty & /*client*/ 1) {
						transition_in(if_block, 1);
					}
				} else {
					if_block = create_if_block$8(ctx);
					if_block.c();
					transition_in(if_block, 1);
					if_block.m(section, null);
				}
			} else if (if_block) {
				group_outros();

				transition_out(if_block, 1, 1, () => {
					if_block = null;
				});

				check_outros();
			}
		},
		i(local) {
			if (current) return;
			transition_in(item0.$$.fragment, local);
			transition_in(item1.$$.fragment, local);
			transition_in(item2.$$.fragment, local);
			transition_in(if_block);
			current = true;
		},
		o(local) {
			transition_out(item0.$$.fragment, local);
			transition_out(item1.$$.fragment, local);
			transition_out(item2.$$.fragment, local);
			transition_out(if_block);
			current = false;
		},
		d(detaching) {
			if (detaching) detach(section);
			destroy_component(item0);
			destroy_component(item1);
			destroy_component(item2);
			if (if_block) if_block.d();
		}
	};
}

function instance$n($$self, $$props, $$invalidate) {
	let $client,
		$$unsubscribe_client = noop,
		$$subscribe_client = () => ($$unsubscribe_client(), $$unsubscribe_client = subscribe(client, $$value => $$invalidate(1, $client = $$value)), client);

	$$self.$$.on_destroy.push(() => $$unsubscribe_client());
	let { client } = $$props;
	$$subscribe_client();
	let { clientManager } = $$props;
	let { ToggleVisibility } = $$props;

	$$self.$$set = $$props => {
		if ('client' in $$props) $$subscribe_client($$invalidate(0, client = $$props.client));
		if ('clientManager' in $$props) $$invalidate(2, clientManager = $$props.clientManager);
		if ('ToggleVisibility' in $$props) $$invalidate(3, ToggleVisibility = $$props.ToggleVisibility);
	};

	return [client, $client, clientManager, ToggleVisibility];
}

class Info extends SvelteComponent {
	constructor(options) {
		super();

		init(
			this,
			options,
			instance$n,
			create_fragment$n,
			safe_not_equal,
			{
				client: 0,
				clientManager: 2,
				ToggleVisibility: 3
			},
			add_css$g
		);
	}
}

/* src/client/debug/log/TurnMarker.svelte generated by Svelte v3.41.0 */

function add_css$h(target) {
	append_styles(target, "svelte-6eza86", ".turn-marker.svelte-6eza86{display:flex;justify-content:center;align-items:center;grid-column:1;background:#555;color:#eee;text-align:center;font-weight:bold;border:1px solid #888}");
}

function create_fragment$o(ctx) {
	let div;
	let t;

	return {
		c() {
			div = element("div");
			t = text(/*turn*/ ctx[0]);
			attr(div, "class", "turn-marker svelte-6eza86");
			attr(div, "style", /*style*/ ctx[1]);
		},
		m(target, anchor) {
			insert(target, div, anchor);
			append(div, t);
		},
		p(ctx, [dirty]) {
			if (dirty & /*turn*/ 1) set_data(t, /*turn*/ ctx[0]);
		},
		i: noop,
		o: noop,
		d(detaching) {
			if (detaching) detach(div);
		}
	};
}

function instance$o($$self, $$props, $$invalidate) {
	let { turn } = $$props;
	let { numEvents } = $$props;
	const style = `grid-row: span ${numEvents}`;

	$$self.$$set = $$props => {
		if ('turn' in $$props) $$invalidate(0, turn = $$props.turn);
		if ('numEvents' in $$props) $$invalidate(2, numEvents = $$props.numEvents);
	};

	return [turn, style, numEvents];
}

class TurnMarker extends SvelteComponent {
	constructor(options) {
		super();
		init(this, options, instance$o, create_fragment$o, safe_not_equal, { turn: 0, numEvents: 2 }, add_css$h);
	}
}

/* src/client/debug/log/PhaseMarker.svelte generated by Svelte v3.41.0 */

function add_css$i(target) {
	append_styles(target, "svelte-1t4xap", ".phase-marker.svelte-1t4xap{grid-column:3;background:#555;border:1px solid #888;color:#eee;text-align:center;font-weight:bold;padding-top:10px;padding-bottom:10px;text-orientation:sideways;writing-mode:vertical-rl;line-height:30px;width:100%}");
}

function create_fragment$p(ctx) {
	let div;
	let t_value = (/*phase*/ ctx[0] || '') + "";
	let t;

	return {
		c() {
			div = element("div");
			t = text(t_value);
			attr(div, "class", "phase-marker svelte-1t4xap");
			attr(div, "style", /*style*/ ctx[1]);
		},
		m(target, anchor) {
			insert(target, div, anchor);
			append(div, t);
		},
		p(ctx, [dirty]) {
			if (dirty & /*phase*/ 1 && t_value !== (t_value = (/*phase*/ ctx[0] || '') + "")) set_data(t, t_value);
		},
		i: noop,
		o: noop,
		d(detaching) {
			if (detaching) detach(div);
		}
	};
}

function instance$p($$self, $$props, $$invalidate) {
	let { phase } = $$props;
	let { numEvents } = $$props;
	const style = `grid-row: span ${numEvents}`;

	$$self.$$set = $$props => {
		if ('phase' in $$props) $$invalidate(0, phase = $$props.phase);
		if ('numEvents' in $$props) $$invalidate(2, numEvents = $$props.numEvents);
	};

	return [phase, style, numEvents];
}

class PhaseMarker extends SvelteComponent {
	constructor(options) {
		super();
		init(this, options, instance$p, create_fragment$p, safe_not_equal, { phase: 0, numEvents: 2 }, add_css$i);
	}
}

/* src/client/debug/log/LogMetadata.svelte generated by Svelte v3.41.0 */

function create_fragment$q(ctx) {
	let div;

	return {
		c() {
			div = element("div");
			div.textContent = `${/*renderedMetadata*/ ctx[0]}`;
		},
		m(target, anchor) {
			insert(target, div, anchor);
		},
		p: noop,
		i: noop,
		o: noop,
		d(detaching) {
			if (detaching) detach(div);
		}
	};
}

function instance$q($$self, $$props, $$invalidate) {
	let { metadata } = $$props;

	const renderedMetadata = metadata !== undefined
	? JSON.stringify(metadata, null, 4)
	: '';

	$$self.$$set = $$props => {
		if ('metadata' in $$props) $$invalidate(1, metadata = $$props.metadata);
	};

	return [renderedMetadata, metadata];
}

class LogMetadata extends SvelteComponent {
	constructor(options) {
		super();
		init(this, options, instance$q, create_fragment$q, safe_not_equal, { metadata: 1 });
	}
}

/* src/client/debug/log/LogEvent.svelte generated by Svelte v3.41.0 */

function add_css$j(target) {
	append_styles(target, "svelte-vajd9z", ".log-event.svelte-vajd9z{grid-column:2;cursor:pointer;overflow:hidden;display:flex;flex-direction:column;justify-content:center;background:#fff;border:1px dotted #ccc;border-left:5px solid #ccc;padding:5px;text-align:center;color:#666;font-size:14px;min-height:25px;line-height:25px}.log-event.svelte-vajd9z:hover,.log-event.svelte-vajd9z:focus{border-style:solid;background:#eee}.log-event.pinned.svelte-vajd9z{border-style:solid;background:#eee;opacity:1}.args.svelte-vajd9z{text-align:left;white-space:pre-wrap}.player0.svelte-vajd9z{border-left-color:#ff851b}.player1.svelte-vajd9z{border-left-color:#7fdbff}.player2.svelte-vajd9z{border-left-color:#0074d9}.player3.svelte-vajd9z{border-left-color:#39cccc}.player4.svelte-vajd9z{border-left-color:#3d9970}.player5.svelte-vajd9z{border-left-color:#2ecc40}.player6.svelte-vajd9z{border-left-color:#01ff70}.player7.svelte-vajd9z{border-left-color:#ffdc00}.player8.svelte-vajd9z{border-left-color:#001f3f}.player9.svelte-vajd9z{border-left-color:#ff4136}.player10.svelte-vajd9z{border-left-color:#85144b}.player11.svelte-vajd9z{border-left-color:#f012be}.player12.svelte-vajd9z{border-left-color:#b10dc9}.player13.svelte-vajd9z{border-left-color:#111111}.player14.svelte-vajd9z{border-left-color:#aaaaaa}.player15.svelte-vajd9z{border-left-color:#dddddd}");
}

// (146:2) {:else}
function create_else_block$1(ctx) {
	let logmetadata;
	let current;
	logmetadata = new LogMetadata({ props: { metadata: /*metadata*/ ctx[2] } });

	return {
		c() {
			create_component(logmetadata.$$.fragment);
		},
		m(target, anchor) {
			mount_component(logmetadata, target, anchor);
			current = true;
		},
		p(ctx, dirty) {
			const logmetadata_changes = {};
			if (dirty & /*metadata*/ 4) logmetadata_changes.metadata = /*metadata*/ ctx[2];
			logmetadata.$set(logmetadata_changes);
		},
		i(local) {
			if (current) return;
			transition_in(logmetadata.$$.fragment, local);
			current = true;
		},
		o(local) {
			transition_out(logmetadata.$$.fragment, local);
			current = false;
		},
		d(detaching) {
			destroy_component(logmetadata, detaching);
		}
	};
}

// (144:2) {#if metadataComponent}
function create_if_block$9(ctx) {
	let switch_instance;
	let switch_instance_anchor;
	let current;
	var switch_value = /*metadataComponent*/ ctx[3];

	function switch_props(ctx) {
		return { props: { metadata: /*metadata*/ ctx[2] } };
	}

	if (switch_value) {
		switch_instance = new switch_value(switch_props(ctx));
	}

	return {
		c() {
			if (switch_instance) create_component(switch_instance.$$.fragment);
			switch_instance_anchor = empty();
		},
		m(target, anchor) {
			if (switch_instance) {
				mount_component(switch_instance, target, anchor);
			}

			insert(target, switch_instance_anchor, anchor);
			current = true;
		},
		p(ctx, dirty) {
			const switch_instance_changes = {};
			if (dirty & /*metadata*/ 4) switch_instance_changes.metadata = /*metadata*/ ctx[2];

			if (switch_value !== (switch_value = /*metadataComponent*/ ctx[3])) {
				if (switch_instance) {
					group_outros();
					const old_component = switch_instance;

					transition_out(old_component.$$.fragment, 1, 0, () => {
						destroy_component(old_component, 1);
					});

					check_outros();
				}

				if (switch_value) {
					switch_instance = new switch_value(switch_props(ctx));
					create_component(switch_instance.$$.fragment);
					transition_in(switch_instance.$$.fragment, 1);
					mount_component(switch_instance, switch_instance_anchor.parentNode, switch_instance_anchor);
				} else {
					switch_instance = null;
				}
			} else if (switch_value) {
				switch_instance.$set(switch_instance_changes);
			}
		},
		i(local) {
			if (current) return;
			if (switch_instance) transition_in(switch_instance.$$.fragment, local);
			current = true;
		},
		o(local) {
			if (switch_instance) transition_out(switch_instance.$$.fragment, local);
			current = false;
		},
		d(detaching) {
			if (detaching) detach(switch_instance_anchor);
			if (switch_instance) destroy_component(switch_instance, detaching);
		}
	};
}

function create_fragment$r(ctx) {
	let button;
	let div;
	let t0;
	let t1;
	let t2;
	let t3;
	let t4;
	let current_block_type_index;
	let if_block;
	let button_class_value;
	let current;
	let mounted;
	let dispose;
	const if_block_creators = [create_if_block$9, create_else_block$1];
	const if_blocks = [];

	function select_block_type(ctx, dirty) {
		if (/*metadataComponent*/ ctx[3]) return 0;
		return 1;
	}

	current_block_type_index = select_block_type(ctx);
	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

	return {
		c() {
			button = element("button");
			div = element("div");
			t0 = text(/*actionType*/ ctx[4]);
			t1 = text("(");
			t2 = text(/*renderedArgs*/ ctx[6]);
			t3 = text(")");
			t4 = space();
			if_block.c();
			attr(div, "class", "args svelte-vajd9z");
			attr(button, "class", button_class_value = "log-event player" + /*playerID*/ ctx[7] + " svelte-vajd9z");
			toggle_class(button, "pinned", /*pinned*/ ctx[1]);
		},
		m(target, anchor) {
			insert(target, button, anchor);
			append(button, div);
			append(div, t0);
			append(div, t1);
			append(div, t2);
			append(div, t3);
			append(button, t4);
			if_blocks[current_block_type_index].m(button, null);
			current = true;

			if (!mounted) {
				dispose = [
					listen(button, "click", /*click_handler*/ ctx[9]),
					listen(button, "mouseenter", /*mouseenter_handler*/ ctx[10]),
					listen(button, "focus", /*focus_handler*/ ctx[11]),
					listen(button, "mouseleave", /*mouseleave_handler*/ ctx[12]),
					listen(button, "blur", /*blur_handler*/ ctx[13])
				];

				mounted = true;
			}
		},
		p(ctx, [dirty]) {
			if (!current || dirty & /*actionType*/ 16) set_data(t0, /*actionType*/ ctx[4]);
			let previous_block_index = current_block_type_index;
			current_block_type_index = select_block_type(ctx);

			if (current_block_type_index === previous_block_index) {
				if_blocks[current_block_type_index].p(ctx, dirty);
			} else {
				group_outros();

				transition_out(if_blocks[previous_block_index], 1, 1, () => {
					if_blocks[previous_block_index] = null;
				});

				check_outros();
				if_block = if_blocks[current_block_type_index];

				if (!if_block) {
					if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
					if_block.c();
				} else {
					if_block.p(ctx, dirty);
				}

				transition_in(if_block, 1);
				if_block.m(button, null);
			}

			if (dirty & /*pinned*/ 2) {
				toggle_class(button, "pinned", /*pinned*/ ctx[1]);
			}
		},
		i(local) {
			if (current) return;
			transition_in(if_block);
			current = true;
		},
		o(local) {
			transition_out(if_block);
			current = false;
		},
		d(detaching) {
			if (detaching) detach(button);
			if_blocks[current_block_type_index].d();
			mounted = false;
			run_all(dispose);
		}
	};
}

function instance$r($$self, $$props, $$invalidate) {
	let { logIndex } = $$props;
	let { action } = $$props;
	let { pinned } = $$props;
	let { metadata } = $$props;
	let { metadataComponent } = $$props;
	const dispatch = createEventDispatcher();
	const args = action.payload.args;

	const renderedArgs = Array.isArray(args)
	? args.map(arg => JSON.stringify(arg, null, 2)).join(',')
	: JSON.stringify(args, null, 2) || '';

	const playerID = action.payload.playerID;
	let actionType;

	switch (action.type) {
		case 'UNDO':
			actionType = 'undo';
			break;
		case 'REDO':
			actionType = 'redo';
		case 'GAME_EVENT':
		case 'MAKE_MOVE':
		default:
			actionType = action.payload.type;
			break;
	}

	const click_handler = () => dispatch('click', { logIndex });
	const mouseenter_handler = () => dispatch('mouseenter', { logIndex });
	const focus_handler = () => dispatch('mouseenter', { logIndex });
	const mouseleave_handler = () => dispatch('mouseleave');
	const blur_handler = () => dispatch('mouseleave');

	$$self.$$set = $$props => {
		if ('logIndex' in $$props) $$invalidate(0, logIndex = $$props.logIndex);
		if ('action' in $$props) $$invalidate(8, action = $$props.action);
		if ('pinned' in $$props) $$invalidate(1, pinned = $$props.pinned);
		if ('metadata' in $$props) $$invalidate(2, metadata = $$props.metadata);
		if ('metadataComponent' in $$props) $$invalidate(3, metadataComponent = $$props.metadataComponent);
	};

	return [
		logIndex,
		pinned,
		metadata,
		metadataComponent,
		actionType,
		dispatch,
		renderedArgs,
		playerID,
		action,
		click_handler,
		mouseenter_handler,
		focus_handler,
		mouseleave_handler,
		blur_handler
	];
}

class LogEvent extends SvelteComponent {
	constructor(options) {
		super();

		init(
			this,
			options,
			instance$r,
			create_fragment$r,
			safe_not_equal,
			{
				logIndex: 0,
				action: 8,
				pinned: 1,
				metadata: 2,
				metadataComponent: 3
			},
			add_css$j
		);
	}
}

/* node_modules/svelte-icons/fa/FaArrowAltCircleDown.svelte generated by Svelte v3.41.0 */

function create_default_slot$1(ctx) {
	let path;

	return {
		c() {
			path = svg_element("path");
			attr(path, "d", "M504 256c0 137-111 248-248 248S8 393 8 256 119 8 256 8s248 111 248 248zM212 140v116h-70.9c-10.7 0-16.1 13-8.5 20.5l114.9 114.3c4.7 4.7 12.2 4.7 16.9 0l114.9-114.3c7.6-7.6 2.2-20.5-8.5-20.5H300V140c0-6.6-5.4-12-12-12h-64c-6.6 0-12 5.4-12 12z");
		},
		m(target, anchor) {
			insert(target, path, anchor);
		},
		d(detaching) {
			if (detaching) detach(path);
		}
	};
}

function create_fragment$s(ctx) {
	let iconbase;
	let current;
	const iconbase_spread_levels = [{ viewBox: "0 0 512 512" }, /*$$props*/ ctx[0]];

	let iconbase_props = {
		$$slots: { default: [create_default_slot$1] },
		$$scope: { ctx }
	};

	for (let i = 0; i < iconbase_spread_levels.length; i += 1) {
		iconbase_props = assign(iconbase_props, iconbase_spread_levels[i]);
	}

	iconbase = new IconBase({ props: iconbase_props });

	return {
		c() {
			create_component(iconbase.$$.fragment);
		},
		m(target, anchor) {
			mount_component(iconbase, target, anchor);
			current = true;
		},
		p(ctx, [dirty]) {
			const iconbase_changes = (dirty & /*$$props*/ 1)
			? get_spread_update(iconbase_spread_levels, [iconbase_spread_levels[0], get_spread_object(/*$$props*/ ctx[0])])
			: {};

			if (dirty & /*$$scope*/ 2) {
				iconbase_changes.$$scope = { dirty, ctx };
			}

			iconbase.$set(iconbase_changes);
		},
		i(local) {
			if (current) return;
			transition_in(iconbase.$$.fragment, local);
			current = true;
		},
		o(local) {
			transition_out(iconbase.$$.fragment, local);
			current = false;
		},
		d(detaching) {
			destroy_component(iconbase, detaching);
		}
	};
}

function instance$s($$self, $$props, $$invalidate) {
	$$self.$$set = $$new_props => {
		$$invalidate(0, $$props = assign(assign({}, $$props), exclude_internal_props($$new_props)));
	};

	$$props = exclude_internal_props($$props);
	return [$$props];
}

class FaArrowAltCircleDown extends SvelteComponent {
	constructor(options) {
		super();
		init(this, options, instance$s, create_fragment$s, safe_not_equal, {});
	}
}

/* src/client/debug/mcts/Action.svelte generated by Svelte v3.41.0 */

function add_css$k(target) {
	append_styles(target, "svelte-1a7time", "div.svelte-1a7time{white-space:nowrap;text-overflow:ellipsis;overflow:hidden;max-width:500px}");
}

function create_fragment$t(ctx) {
	let div;
	let t;

	return {
		c() {
			div = element("div");
			t = text(/*text*/ ctx[0]);
			attr(div, "alt", /*text*/ ctx[0]);
			attr(div, "class", "svelte-1a7time");
		},
		m(target, anchor) {
			insert(target, div, anchor);
			append(div, t);
		},
		p(ctx, [dirty]) {
			if (dirty & /*text*/ 1) set_data(t, /*text*/ ctx[0]);

			if (dirty & /*text*/ 1) {
				attr(div, "alt", /*text*/ ctx[0]);
			}
		},
		i: noop,
		o: noop,
		d(detaching) {
			if (detaching) detach(div);
		}
	};
}

function instance$t($$self, $$props, $$invalidate) {
	let { action } = $$props;
	let text;

	$$self.$$set = $$props => {
		if ('action' in $$props) $$invalidate(1, action = $$props.action);
	};

	$$self.$$.update = () => {
		if ($$self.$$.dirty & /*action*/ 2) {
			 {
				const { type, args } = action.payload;
				const argsFormatted = (args || []).join(',');
				$$invalidate(0, text = `${type}(${argsFormatted})`);
			}
		}
	};

	return [text, action];
}

class Action extends SvelteComponent {
	constructor(options) {
		super();
		init(this, options, instance$t, create_fragment$t, safe_not_equal, { action: 1 }, add_css$k);
	}
}

/* src/client/debug/mcts/Table.svelte generated by Svelte v3.41.0 */

function add_css$l(target) {
	append_styles(target, "svelte-ztcwsu", "table.svelte-ztcwsu.svelte-ztcwsu{font-size:12px;border-collapse:collapse;border:1px solid #ddd;padding:0}tr.svelte-ztcwsu.svelte-ztcwsu{cursor:pointer}tr.svelte-ztcwsu:hover td.svelte-ztcwsu{background:#eee}tr.selected.svelte-ztcwsu td.svelte-ztcwsu{background:#eee}td.svelte-ztcwsu.svelte-ztcwsu{padding:10px;height:10px;line-height:10px;font-size:12px;border:none}th.svelte-ztcwsu.svelte-ztcwsu{background:#888;color:#fff;padding:10px;text-align:center}");
}

function get_each_context$6(ctx, list, i) {
	const child_ctx = ctx.slice();
	child_ctx[10] = list[i];
	child_ctx[12] = i;
	return child_ctx;
}

// (86:2) {#each children as child, i}
function create_each_block$6(ctx) {
	let tr;
	let td0;
	let t0_value = /*child*/ ctx[10].value + "";
	let t0;
	let t1;
	let td1;
	let t2_value = /*child*/ ctx[10].visits + "";
	let t2;
	let t3;
	let td2;
	let action;
	let t4;
	let current;
	let mounted;
	let dispose;

	action = new Action({
			props: { action: /*child*/ ctx[10].parentAction }
		});

	function click_handler() {
		return /*click_handler*/ ctx[6](/*child*/ ctx[10], /*i*/ ctx[12]);
	}

	function mouseout_handler() {
		return /*mouseout_handler*/ ctx[7](/*i*/ ctx[12]);
	}

	function mouseover_handler() {
		return /*mouseover_handler*/ ctx[8](/*child*/ ctx[10], /*i*/ ctx[12]);
	}

	return {
		c() {
			tr = element("tr");
			td0 = element("td");
			t0 = text(t0_value);
			t1 = space();
			td1 = element("td");
			t2 = text(t2_value);
			t3 = space();
			td2 = element("td");
			create_component(action.$$.fragment);
			t4 = space();
			attr(td0, "class", "svelte-ztcwsu");
			attr(td1, "class", "svelte-ztcwsu");
			attr(td2, "class", "svelte-ztcwsu");
			attr(tr, "class", "svelte-ztcwsu");
			toggle_class(tr, "clickable", /*children*/ ctx[1].length > 0);
			toggle_class(tr, "selected", /*i*/ ctx[12] === /*selectedIndex*/ ctx[0]);
		},
		m(target, anchor) {
			insert(target, tr, anchor);
			append(tr, td0);
			append(td0, t0);
			append(tr, t1);
			append(tr, td1);
			append(td1, t2);
			append(tr, t3);
			append(tr, td2);
			mount_component(action, td2, null);
			append(tr, t4);
			current = true;

			if (!mounted) {
				dispose = [
					listen(tr, "click", click_handler),
					listen(tr, "mouseout", mouseout_handler),
					listen(tr, "mouseover", mouseover_handler)
				];

				mounted = true;
			}
		},
		p(new_ctx, dirty) {
			ctx = new_ctx;
			if ((!current || dirty & /*children*/ 2) && t0_value !== (t0_value = /*child*/ ctx[10].value + "")) set_data(t0, t0_value);
			if ((!current || dirty & /*children*/ 2) && t2_value !== (t2_value = /*child*/ ctx[10].visits + "")) set_data(t2, t2_value);
			const action_changes = {};
			if (dirty & /*children*/ 2) action_changes.action = /*child*/ ctx[10].parentAction;
			action.$set(action_changes);

			if (dirty & /*children*/ 2) {
				toggle_class(tr, "clickable", /*children*/ ctx[1].length > 0);
			}

			if (dirty & /*selectedIndex*/ 1) {
				toggle_class(tr, "selected", /*i*/ ctx[12] === /*selectedIndex*/ ctx[0]);
			}
		},
		i(local) {
			if (current) return;
			transition_in(action.$$.fragment, local);
			current = true;
		},
		o(local) {
			transition_out(action.$$.fragment, local);
			current = false;
		},
		d(detaching) {
			if (detaching) detach(tr);
			destroy_component(action);
			mounted = false;
			run_all(dispose);
		}
	};
}

function create_fragment$u(ctx) {
	let table;
	let thead;
	let t5;
	let tbody;
	let current;
	let each_value = /*children*/ ctx[1];
	let each_blocks = [];

	for (let i = 0; i < each_value.length; i += 1) {
		each_blocks[i] = create_each_block$6(get_each_context$6(ctx, each_value, i));
	}

	const out = i => transition_out(each_blocks[i], 1, 1, () => {
		each_blocks[i] = null;
	});

	return {
		c() {
			table = element("table");
			thead = element("thead");

			thead.innerHTML = `<th class="svelte-ztcwsu">Value</th> 
    <th class="svelte-ztcwsu">Visits</th> 
    <th class="svelte-ztcwsu">Action</th>`;

			t5 = space();
			tbody = element("tbody");

			for (let i = 0; i < each_blocks.length; i += 1) {
				each_blocks[i].c();
			}

			attr(table, "class", "svelte-ztcwsu");
		},
		m(target, anchor) {
			insert(target, table, anchor);
			append(table, thead);
			append(table, t5);
			append(table, tbody);

			for (let i = 0; i < each_blocks.length; i += 1) {
				each_blocks[i].m(tbody, null);
			}

			current = true;
		},
		p(ctx, [dirty]) {
			if (dirty & /*children, selectedIndex, Select, Preview*/ 15) {
				each_value = /*children*/ ctx[1];
				let i;

				for (i = 0; i < each_value.length; i += 1) {
					const child_ctx = get_each_context$6(ctx, each_value, i);

					if (each_blocks[i]) {
						each_blocks[i].p(child_ctx, dirty);
						transition_in(each_blocks[i], 1);
					} else {
						each_blocks[i] = create_each_block$6(child_ctx);
						each_blocks[i].c();
						transition_in(each_blocks[i], 1);
						each_blocks[i].m(tbody, null);
					}
				}

				group_outros();

				for (i = each_value.length; i < each_blocks.length; i += 1) {
					out(i);
				}

				check_outros();
			}
		},
		i(local) {
			if (current) return;

			for (let i = 0; i < each_value.length; i += 1) {
				transition_in(each_blocks[i]);
			}

			current = true;
		},
		o(local) {
			each_blocks = each_blocks.filter(Boolean);

			for (let i = 0; i < each_blocks.length; i += 1) {
				transition_out(each_blocks[i]);
			}

			current = false;
		},
		d(detaching) {
			if (detaching) detach(table);
			destroy_each(each_blocks, detaching);
		}
	};
}

function instance$u($$self, $$props, $$invalidate) {
	let { root } = $$props;
	let { selectedIndex = null } = $$props;
	const dispatch = createEventDispatcher();
	let parents = [];
	let children = [];

	function Select(node, i) {
		dispatch('select', { node, selectedIndex: i });
	}

	function Preview(node, i) {
		if (selectedIndex === null) {
			dispatch('preview', { node });
		}
	}

	const click_handler = (child, i) => Select(child, i);
	const mouseout_handler = i => Preview(null);
	const mouseover_handler = (child, i) => Preview(child);

	$$self.$$set = $$props => {
		if ('root' in $$props) $$invalidate(4, root = $$props.root);
		if ('selectedIndex' in $$props) $$invalidate(0, selectedIndex = $$props.selectedIndex);
	};

	$$self.$$.update = () => {
		if ($$self.$$.dirty & /*root, parents*/ 48) {
			 {
				let t = root;
				$$invalidate(5, parents = []);

				while (t.parent) {
					const parent = t.parent;
					const { type, args } = t.parentAction.payload;
					const argsFormatted = (args || []).join(',');
					const arrowText = `${type}(${argsFormatted})`;
					parents.push({ parent, arrowText });
					t = parent;
				}

				parents.reverse();
				$$invalidate(1, children = [...root.children].sort((a, b) => a.visits < b.visits ? 1 : -1).slice(0, 50));
			}
		}
	};

	return [
		selectedIndex,
		children,
		Select,
		Preview,
		root,
		parents,
		click_handler,
		mouseout_handler,
		mouseover_handler
	];
}

class Table extends SvelteComponent {
	constructor(options) {
		super();
		init(this, options, instance$u, create_fragment$u, safe_not_equal, { root: 4, selectedIndex: 0 }, add_css$l);
	}
}

/* src/client/debug/mcts/MCTS.svelte generated by Svelte v3.41.0 */

function add_css$m(target) {
	append_styles(target, "svelte-1f0amz4", ".visualizer.svelte-1f0amz4{display:flex;flex-direction:column;align-items:center;padding:50px}.preview.svelte-1f0amz4{opacity:0.5}.icon.svelte-1f0amz4{color:#777;width:32px;height:32px;margin-bottom:20px}");
}

function get_each_context$7(ctx, list, i) {
	const child_ctx = ctx.slice();
	child_ctx[9] = list[i].node;
	child_ctx[10] = list[i].selectedIndex;
	child_ctx[12] = i;
	return child_ctx;
}

// (50:4) {#if i !== 0}
function create_if_block_2$3(ctx) {
	let div;
	let arrow;
	let current;
	arrow = new FaArrowAltCircleDown({});

	return {
		c() {
			div = element("div");
			create_component(arrow.$$.fragment);
			attr(div, "class", "icon svelte-1f0amz4");
		},
		m(target, anchor) {
			insert(target, div, anchor);
			mount_component(arrow, div, null);
			current = true;
		},
		i(local) {
			if (current) return;
			transition_in(arrow.$$.fragment, local);
			current = true;
		},
		o(local) {
			transition_out(arrow.$$.fragment, local);
			current = false;
		},
		d(detaching) {
			if (detaching) detach(div);
			destroy_component(arrow);
		}
	};
}

// (61:6) {:else}
function create_else_block$2(ctx) {
	let table;
	let current;

	function select_handler_1(...args) {
		return /*select_handler_1*/ ctx[7](/*i*/ ctx[12], ...args);
	}

	table = new Table({
			props: {
				root: /*node*/ ctx[9],
				selectedIndex: /*selectedIndex*/ ctx[10]
			}
		});

	table.$on("select", select_handler_1);

	return {
		c() {
			create_component(table.$$.fragment);
		},
		m(target, anchor) {
			mount_component(table, target, anchor);
			current = true;
		},
		p(new_ctx, dirty) {
			ctx = new_ctx;
			const table_changes = {};
			if (dirty & /*nodes*/ 1) table_changes.root = /*node*/ ctx[9];
			if (dirty & /*nodes*/ 1) table_changes.selectedIndex = /*selectedIndex*/ ctx[10];
			table.$set(table_changes);
		},
		i(local) {
			if (current) return;
			transition_in(table.$$.fragment, local);
			current = true;
		},
		o(local) {
			transition_out(table.$$.fragment, local);
			current = false;
		},
		d(detaching) {
			destroy_component(table, detaching);
		}
	};
}

// (57:6) {#if i === nodes.length - 1}
function create_if_block_1$3(ctx) {
	let table;
	let current;

	function select_handler(...args) {
		return /*select_handler*/ ctx[5](/*i*/ ctx[12], ...args);
	}

	function preview_handler(...args) {
		return /*preview_handler*/ ctx[6](/*i*/ ctx[12], ...args);
	}

	table = new Table({ props: { root: /*node*/ ctx[9] } });
	table.$on("select", select_handler);
	table.$on("preview", preview_handler);

	return {
		c() {
			create_component(table.$$.fragment);
		},
		m(target, anchor) {
			mount_component(table, target, anchor);
			current = true;
		},
		p(new_ctx, dirty) {
			ctx = new_ctx;
			const table_changes = {};
			if (dirty & /*nodes*/ 1) table_changes.root = /*node*/ ctx[9];
			table.$set(table_changes);
		},
		i(local) {
			if (current) return;
			transition_in(table.$$.fragment, local);
			current = true;
		},
		o(local) {
			transition_out(table.$$.fragment, local);
			current = false;
		},
		d(detaching) {
			destroy_component(table, detaching);
		}
	};
}

// (49:2) {#each nodes as { node, selectedIndex }
function create_each_block$7(ctx) {
	let t;
	let section;
	let current_block_type_index;
	let if_block1;
	let current;
	let if_block0 = /*i*/ ctx[12] !== 0 && create_if_block_2$3();
	const if_block_creators = [create_if_block_1$3, create_else_block$2];
	const if_blocks = [];

	function select_block_type(ctx, dirty) {
		if (/*i*/ ctx[12] === /*nodes*/ ctx[0].length - 1) return 0;
		return 1;
	}

	current_block_type_index = select_block_type(ctx);
	if_block1 = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

	return {
		c() {
			if (if_block0) if_block0.c();
			t = space();
			section = element("section");
			if_block1.c();
		},
		m(target, anchor) {
			if (if_block0) if_block0.m(target, anchor);
			insert(target, t, anchor);
			insert(target, section, anchor);
			if_blocks[current_block_type_index].m(section, null);
			current = true;
		},
		p(ctx, dirty) {
			let previous_block_index = current_block_type_index;
			current_block_type_index = select_block_type(ctx);

			if (current_block_type_index === previous_block_index) {
				if_blocks[current_block_type_index].p(ctx, dirty);
			} else {
				group_outros();

				transition_out(if_blocks[previous_block_index], 1, 1, () => {
					if_blocks[previous_block_index] = null;
				});

				check_outros();
				if_block1 = if_blocks[current_block_type_index];

				if (!if_block1) {
					if_block1 = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
					if_block1.c();
				} else {
					if_block1.p(ctx, dirty);
				}

				transition_in(if_block1, 1);
				if_block1.m(section, null);
			}
		},
		i(local) {
			if (current) return;
			transition_in(if_block0);
			transition_in(if_block1);
			current = true;
		},
		o(local) {
			transition_out(if_block0);
			transition_out(if_block1);
			current = false;
		},
		d(detaching) {
			if (if_block0) if_block0.d(detaching);
			if (detaching) detach(t);
			if (detaching) detach(section);
			if_blocks[current_block_type_index].d();
		}
	};
}

// (69:2) {#if preview}
function create_if_block$a(ctx) {
	let div;
	let arrow;
	let t;
	let section;
	let table;
	let current;
	arrow = new FaArrowAltCircleDown({});
	table = new Table({ props: { root: /*preview*/ ctx[1] } });

	return {
		c() {
			div = element("div");
			create_component(arrow.$$.fragment);
			t = space();
			section = element("section");
			create_component(table.$$.fragment);
			attr(div, "class", "icon svelte-1f0amz4");
			attr(section, "class", "preview svelte-1f0amz4");
		},
		m(target, anchor) {
			insert(target, div, anchor);
			mount_component(arrow, div, null);
			insert(target, t, anchor);
			insert(target, section, anchor);
			mount_component(table, section, null);
			current = true;
		},
		p(ctx, dirty) {
			const table_changes = {};
			if (dirty & /*preview*/ 2) table_changes.root = /*preview*/ ctx[1];
			table.$set(table_changes);
		},
		i(local) {
			if (current) return;
			transition_in(arrow.$$.fragment, local);
			transition_in(table.$$.fragment, local);
			current = true;
		},
		o(local) {
			transition_out(arrow.$$.fragment, local);
			transition_out(table.$$.fragment, local);
			current = false;
		},
		d(detaching) {
			if (detaching) detach(div);
			destroy_component(arrow);
			if (detaching) detach(t);
			if (detaching) detach(section);
			destroy_component(table);
		}
	};
}

function create_fragment$v(ctx) {
	let div;
	let t;
	let current;
	let each_value = /*nodes*/ ctx[0];
	let each_blocks = [];

	for (let i = 0; i < each_value.length; i += 1) {
		each_blocks[i] = create_each_block$7(get_each_context$7(ctx, each_value, i));
	}

	const out = i => transition_out(each_blocks[i], 1, 1, () => {
		each_blocks[i] = null;
	});

	let if_block = /*preview*/ ctx[1] && create_if_block$a(ctx);

	return {
		c() {
			div = element("div");

			for (let i = 0; i < each_blocks.length; i += 1) {
				each_blocks[i].c();
			}

			t = space();
			if (if_block) if_block.c();
			attr(div, "class", "visualizer svelte-1f0amz4");
		},
		m(target, anchor) {
			insert(target, div, anchor);

			for (let i = 0; i < each_blocks.length; i += 1) {
				each_blocks[i].m(div, null);
			}

			append(div, t);
			if (if_block) if_block.m(div, null);
			current = true;
		},
		p(ctx, [dirty]) {
			if (dirty & /*nodes, SelectNode, PreviewNode*/ 13) {
				each_value = /*nodes*/ ctx[0];
				let i;

				for (i = 0; i < each_value.length; i += 1) {
					const child_ctx = get_each_context$7(ctx, each_value, i);

					if (each_blocks[i]) {
						each_blocks[i].p(child_ctx, dirty);
						transition_in(each_blocks[i], 1);
					} else {
						each_blocks[i] = create_each_block$7(child_ctx);
						each_blocks[i].c();
						transition_in(each_blocks[i], 1);
						each_blocks[i].m(div, t);
					}
				}

				group_outros();

				for (i = each_value.length; i < each_blocks.length; i += 1) {
					out(i);
				}

				check_outros();
			}

			if (/*preview*/ ctx[1]) {
				if (if_block) {
					if_block.p(ctx, dirty);

					if (dirty & /*preview*/ 2) {
						transition_in(if_block, 1);
					}
				} else {
					if_block = create_if_block$a(ctx);
					if_block.c();
					transition_in(if_block, 1);
					if_block.m(div, null);
				}
			} else if (if_block) {
				group_outros();

				transition_out(if_block, 1, 1, () => {
					if_block = null;
				});

				check_outros();
			}
		},
		i(local) {
			if (current) return;

			for (let i = 0; i < each_value.length; i += 1) {
				transition_in(each_blocks[i]);
			}

			transition_in(if_block);
			current = true;
		},
		o(local) {
			each_blocks = each_blocks.filter(Boolean);

			for (let i = 0; i < each_blocks.length; i += 1) {
				transition_out(each_blocks[i]);
			}

			transition_out(if_block);
			current = false;
		},
		d(detaching) {
			if (detaching) detach(div);
			destroy_each(each_blocks, detaching);
			if (if_block) if_block.d();
		}
	};
}

function instance$v($$self, $$props, $$invalidate) {
	let { metadata } = $$props;
	let nodes = [];
	let preview = null;

	function SelectNode({ node, selectedIndex }, i) {
		$$invalidate(1, preview = null);
		$$invalidate(0, nodes[i].selectedIndex = selectedIndex, nodes);
		$$invalidate(0, nodes = [...nodes.slice(0, i + 1), { node }]);
	}

	function PreviewNode({ node }, i) {
		$$invalidate(1, preview = node);
	}

	const select_handler = (i, e) => SelectNode(e.detail, i);
	const preview_handler = (i, e) => PreviewNode(e.detail);
	const select_handler_1 = (i, e) => SelectNode(e.detail, i);

	$$self.$$set = $$props => {
		if ('metadata' in $$props) $$invalidate(4, metadata = $$props.metadata);
	};

	$$self.$$.update = () => {
		if ($$self.$$.dirty & /*metadata*/ 16) {
			 {
				$$invalidate(0, nodes = [{ node: metadata }]);
			}
		}
	};

	return [
		nodes,
		preview,
		SelectNode,
		PreviewNode,
		metadata,
		select_handler,
		preview_handler,
		select_handler_1
	];
}

class MCTS extends SvelteComponent {
	constructor(options) {
		super();
		init(this, options, instance$v, create_fragment$v, safe_not_equal, { metadata: 4 }, add_css$m);
	}
}

/* src/client/debug/log/Log.svelte generated by Svelte v3.41.0 */

function add_css$n(target) {
	append_styles(target, "svelte-1pq5e4b", ".gamelog.svelte-1pq5e4b{display:grid;grid-template-columns:30px 1fr 30px;grid-auto-rows:auto;grid-auto-flow:column}");
}

function get_each_context$8(ctx, list, i) {
	const child_ctx = ctx.slice();
	child_ctx[16] = list[i].phase;
	child_ctx[18] = i;
	return child_ctx;
}

function get_each_context_1(ctx, list, i) {
	const child_ctx = ctx.slice();
	child_ctx[19] = list[i].action;
	child_ctx[20] = list[i].metadata;
	child_ctx[18] = i;
	return child_ctx;
}

function get_each_context_2(ctx, list, i) {
	const child_ctx = ctx.slice();
	child_ctx[22] = list[i].turn;
	child_ctx[18] = i;
	return child_ctx;
}

// (136:4) {#if i in turnBoundaries}
function create_if_block_1$4(ctx) {
	let turnmarker;
	let current;

	turnmarker = new TurnMarker({
			props: {
				turn: /*turn*/ ctx[22],
				numEvents: /*turnBoundaries*/ ctx[3][/*i*/ ctx[18]]
			}
		});

	return {
		c() {
			create_component(turnmarker.$$.fragment);
		},
		m(target, anchor) {
			mount_component(turnmarker, target, anchor);
			current = true;
		},
		p(ctx, dirty) {
			const turnmarker_changes = {};
			if (dirty & /*renderedLogEntries*/ 2) turnmarker_changes.turn = /*turn*/ ctx[22];
			if (dirty & /*turnBoundaries*/ 8) turnmarker_changes.numEvents = /*turnBoundaries*/ ctx[3][/*i*/ ctx[18]];
			turnmarker.$set(turnmarker_changes);
		},
		i(local) {
			if (current) return;
			transition_in(turnmarker.$$.fragment, local);
			current = true;
		},
		o(local) {
			transition_out(turnmarker.$$.fragment, local);
			current = false;
		},
		d(detaching) {
			destroy_component(turnmarker, detaching);
		}
	};
}

// (135:2) {#each renderedLogEntries as { turn }
function create_each_block_2(ctx) {
	let if_block_anchor;
	let current;
	let if_block = /*i*/ ctx[18] in /*turnBoundaries*/ ctx[3] && create_if_block_1$4(ctx);

	return {
		c() {
			if (if_block) if_block.c();
			if_block_anchor = empty();
		},
		m(target, anchor) {
			if (if_block) if_block.m(target, anchor);
			insert(target, if_block_anchor, anchor);
			current = true;
		},
		p(ctx, dirty) {
			if (/*i*/ ctx[18] in /*turnBoundaries*/ ctx[3]) {
				if (if_block) {
					if_block.p(ctx, dirty);

					if (dirty & /*turnBoundaries*/ 8) {
						transition_in(if_block, 1);
					}
				} else {
					if_block = create_if_block_1$4(ctx);
					if_block.c();
					transition_in(if_block, 1);
					if_block.m(if_block_anchor.parentNode, if_block_anchor);
				}
			} else if (if_block) {
				group_outros();

				transition_out(if_block, 1, 1, () => {
					if_block = null;
				});

				check_outros();
			}
		},
		i(local) {
			if (current) return;
			transition_in(if_block);
			current = true;
		},
		o(local) {
			transition_out(if_block);
			current = false;
		},
		d(detaching) {
			if (if_block) if_block.d(detaching);
			if (detaching) detach(if_block_anchor);
		}
	};
}

// (141:2) {#each renderedLogEntries as { action, metadata }
function create_each_block_1(ctx) {
	let logevent;
	let current;

	logevent = new LogEvent({
			props: {
				pinned: /*i*/ ctx[18] === /*pinned*/ ctx[2],
				logIndex: /*i*/ ctx[18],
				action: /*action*/ ctx[19],
				metadata: /*metadata*/ ctx[20]
			}
		});

	logevent.$on("click", /*OnLogClick*/ ctx[5]);
	logevent.$on("mouseenter", /*OnMouseEnter*/ ctx[6]);
	logevent.$on("mouseleave", /*OnMouseLeave*/ ctx[7]);

	return {
		c() {
			create_component(logevent.$$.fragment);
		},
		m(target, anchor) {
			mount_component(logevent, target, anchor);
			current = true;
		},
		p(ctx, dirty) {
			const logevent_changes = {};
			if (dirty & /*pinned*/ 4) logevent_changes.pinned = /*i*/ ctx[18] === /*pinned*/ ctx[2];
			if (dirty & /*renderedLogEntries*/ 2) logevent_changes.action = /*action*/ ctx[19];
			if (dirty & /*renderedLogEntries*/ 2) logevent_changes.metadata = /*metadata*/ ctx[20];
			logevent.$set(logevent_changes);
		},
		i(local) {
			if (current) return;
			transition_in(logevent.$$.fragment, local);
			current = true;
		},
		o(local) {
			transition_out(logevent.$$.fragment, local);
			current = false;
		},
		d(detaching) {
			destroy_component(logevent, detaching);
		}
	};
}

// (153:4) {#if i in phaseBoundaries}
function create_if_block$b(ctx) {
	let phasemarker;
	let current;

	phasemarker = new PhaseMarker({
			props: {
				phase: /*phase*/ ctx[16],
				numEvents: /*phaseBoundaries*/ ctx[4][/*i*/ ctx[18]]
			}
		});

	return {
		c() {
			create_component(phasemarker.$$.fragment);
		},
		m(target, anchor) {
			mount_component(phasemarker, target, anchor);
			current = true;
		},
		p(ctx, dirty) {
			const phasemarker_changes = {};
			if (dirty & /*renderedLogEntries*/ 2) phasemarker_changes.phase = /*phase*/ ctx[16];
			if (dirty & /*phaseBoundaries*/ 16) phasemarker_changes.numEvents = /*phaseBoundaries*/ ctx[4][/*i*/ ctx[18]];
			phasemarker.$set(phasemarker_changes);
		},
		i(local) {
			if (current) return;
			transition_in(phasemarker.$$.fragment, local);
			current = true;
		},
		o(local) {
			transition_out(phasemarker.$$.fragment, local);
			current = false;
		},
		d(detaching) {
			destroy_component(phasemarker, detaching);
		}
	};
}

// (152:2) {#each renderedLogEntries as { phase }
function create_each_block$8(ctx) {
	let if_block_anchor;
	let current;
	let if_block = /*i*/ ctx[18] in /*phaseBoundaries*/ ctx[4] && create_if_block$b(ctx);

	return {
		c() {
			if (if_block) if_block.c();
			if_block_anchor = empty();
		},
		m(target, anchor) {
			if (if_block) if_block.m(target, anchor);
			insert(target, if_block_anchor, anchor);
			current = true;
		},
		p(ctx, dirty) {
			if (/*i*/ ctx[18] in /*phaseBoundaries*/ ctx[4]) {
				if (if_block) {
					if_block.p(ctx, dirty);

					if (dirty & /*phaseBoundaries*/ 16) {
						transition_in(if_block, 1);
					}
				} else {
					if_block = create_if_block$b(ctx);
					if_block.c();
					transition_in(if_block, 1);
					if_block.m(if_block_anchor.parentNode, if_block_anchor);
				}
			} else if (if_block) {
				group_outros();

				transition_out(if_block, 1, 1, () => {
					if_block = null;
				});

				check_outros();
			}
		},
		i(local) {
			if (current) return;
			transition_in(if_block);
			current = true;
		},
		o(local) {
			transition_out(if_block);
			current = false;
		},
		d(detaching) {
			if (if_block) if_block.d(detaching);
			if (detaching) detach(if_block_anchor);
		}
	};
}

function create_fragment$w(ctx) {
	let div;
	let t0;
	let t1;
	let current;
	let mounted;
	let dispose;
	let each_value_2 = /*renderedLogEntries*/ ctx[1];
	let each_blocks_2 = [];

	for (let i = 0; i < each_value_2.length; i += 1) {
		each_blocks_2[i] = create_each_block_2(get_each_context_2(ctx, each_value_2, i));
	}

	const out = i => transition_out(each_blocks_2[i], 1, 1, () => {
		each_blocks_2[i] = null;
	});

	let each_value_1 = /*renderedLogEntries*/ ctx[1];
	let each_blocks_1 = [];

	for (let i = 0; i < each_value_1.length; i += 1) {
		each_blocks_1[i] = create_each_block_1(get_each_context_1(ctx, each_value_1, i));
	}

	const out_1 = i => transition_out(each_blocks_1[i], 1, 1, () => {
		each_blocks_1[i] = null;
	});

	let each_value = /*renderedLogEntries*/ ctx[1];
	let each_blocks = [];

	for (let i = 0; i < each_value.length; i += 1) {
		each_blocks[i] = create_each_block$8(get_each_context$8(ctx, each_value, i));
	}

	const out_2 = i => transition_out(each_blocks[i], 1, 1, () => {
		each_blocks[i] = null;
	});

	return {
		c() {
			div = element("div");

			for (let i = 0; i < each_blocks_2.length; i += 1) {
				each_blocks_2[i].c();
			}

			t0 = space();

			for (let i = 0; i < each_blocks_1.length; i += 1) {
				each_blocks_1[i].c();
			}

			t1 = space();

			for (let i = 0; i < each_blocks.length; i += 1) {
				each_blocks[i].c();
			}

			attr(div, "class", "gamelog svelte-1pq5e4b");
			toggle_class(div, "pinned", /*pinned*/ ctx[2]);
		},
		m(target, anchor) {
			insert(target, div, anchor);

			for (let i = 0; i < each_blocks_2.length; i += 1) {
				each_blocks_2[i].m(div, null);
			}

			append(div, t0);

			for (let i = 0; i < each_blocks_1.length; i += 1) {
				each_blocks_1[i].m(div, null);
			}

			append(div, t1);

			for (let i = 0; i < each_blocks.length; i += 1) {
				each_blocks[i].m(div, null);
			}

			current = true;

			if (!mounted) {
				dispose = listen(window, "keydown", /*OnKeyDown*/ ctx[8]);
				mounted = true;
			}
		},
		p(ctx, [dirty]) {
			if (dirty & /*renderedLogEntries, turnBoundaries*/ 10) {
				each_value_2 = /*renderedLogEntries*/ ctx[1];
				let i;

				for (i = 0; i < each_value_2.length; i += 1) {
					const child_ctx = get_each_context_2(ctx, each_value_2, i);

					if (each_blocks_2[i]) {
						each_blocks_2[i].p(child_ctx, dirty);
						transition_in(each_blocks_2[i], 1);
					} else {
						each_blocks_2[i] = create_each_block_2(child_ctx);
						each_blocks_2[i].c();
						transition_in(each_blocks_2[i], 1);
						each_blocks_2[i].m(div, t0);
					}
				}

				group_outros();

				for (i = each_value_2.length; i < each_blocks_2.length; i += 1) {
					out(i);
				}

				check_outros();
			}

			if (dirty & /*pinned, renderedLogEntries, OnLogClick, OnMouseEnter, OnMouseLeave*/ 230) {
				each_value_1 = /*renderedLogEntries*/ ctx[1];
				let i;

				for (i = 0; i < each_value_1.length; i += 1) {
					const child_ctx = get_each_context_1(ctx, each_value_1, i);

					if (each_blocks_1[i]) {
						each_blocks_1[i].p(child_ctx, dirty);
						transition_in(each_blocks_1[i], 1);
					} else {
						each_blocks_1[i] = create_each_block_1(child_ctx);
						each_blocks_1[i].c();
						transition_in(each_blocks_1[i], 1);
						each_blocks_1[i].m(div, t1);
					}
				}

				group_outros();

				for (i = each_value_1.length; i < each_blocks_1.length; i += 1) {
					out_1(i);
				}

				check_outros();
			}

			if (dirty & /*renderedLogEntries, phaseBoundaries*/ 18) {
				each_value = /*renderedLogEntries*/ ctx[1];
				let i;

				for (i = 0; i < each_value.length; i += 1) {
					const child_ctx = get_each_context$8(ctx, each_value, i);

					if (each_blocks[i]) {
						each_blocks[i].p(child_ctx, dirty);
						transition_in(each_blocks[i], 1);
					} else {
						each_blocks[i] = create_each_block$8(child_ctx);
						each_blocks[i].c();
						transition_in(each_blocks[i], 1);
						each_blocks[i].m(div, null);
					}
				}

				group_outros();

				for (i = each_value.length; i < each_blocks.length; i += 1) {
					out_2(i);
				}

				check_outros();
			}

			if (dirty & /*pinned*/ 4) {
				toggle_class(div, "pinned", /*pinned*/ ctx[2]);
			}
		},
		i(local) {
			if (current) return;

			for (let i = 0; i < each_value_2.length; i += 1) {
				transition_in(each_blocks_2[i]);
			}

			for (let i = 0; i < each_value_1.length; i += 1) {
				transition_in(each_blocks_1[i]);
			}

			for (let i = 0; i < each_value.length; i += 1) {
				transition_in(each_blocks[i]);
			}

			current = true;
		},
		o(local) {
			each_blocks_2 = each_blocks_2.filter(Boolean);

			for (let i = 0; i < each_blocks_2.length; i += 1) {
				transition_out(each_blocks_2[i]);
			}

			each_blocks_1 = each_blocks_1.filter(Boolean);

			for (let i = 0; i < each_blocks_1.length; i += 1) {
				transition_out(each_blocks_1[i]);
			}

			each_blocks = each_blocks.filter(Boolean);

			for (let i = 0; i < each_blocks.length; i += 1) {
				transition_out(each_blocks[i]);
			}

			current = false;
		},
		d(detaching) {
			if (detaching) detach(div);
			destroy_each(each_blocks_2, detaching);
			destroy_each(each_blocks_1, detaching);
			destroy_each(each_blocks, detaching);
			mounted = false;
			dispose();
		}
	};
}

function instance$w($$self, $$props, $$invalidate) {
	let $client,
		$$unsubscribe_client = noop,
		$$subscribe_client = () => ($$unsubscribe_client(), $$unsubscribe_client = subscribe(client, $$value => $$invalidate(10, $client = $$value)), client);

	$$self.$$.on_destroy.push(() => $$unsubscribe_client());
	let { client } = $$props;
	$$subscribe_client();
	const { secondaryPane } = getContext('secondaryPane');
	const reducer$1 = reducer.CreateGameReducer({ game: client.game });
	const initialState = client.getInitialState();
	let { log } = $client;
	let pinned = null;

	function rewind(logIndex) {
		let state = initialState;

		for (let i = 0; i < log.length; i++) {
			const { action, automatic } = log[i];

			if (!automatic) {
				state = reducer$1(state, action);

				if (logIndex == 0) {
					break;
				}

				logIndex--;
			}
		}

		return {
			G: state.G,
			ctx: state.ctx,
			plugins: state.plugins
		};
	}

	function OnLogClick(e) {
		const { logIndex } = e.detail;
		const state = rewind(logIndex);
		const renderedLogEntries = log.filter(e => !e.automatic);
		client.overrideGameState(state);

		if (pinned == logIndex) {
			$$invalidate(2, pinned = null);
			secondaryPane.set(null);
		} else {
			$$invalidate(2, pinned = logIndex);
			const { metadata } = renderedLogEntries[logIndex].action.payload;

			if (metadata) {
				secondaryPane.set({ component: MCTS, metadata });
			}
		}
	}

	function OnMouseEnter(e) {
		const { logIndex } = e.detail;

		if (pinned === null) {
			const state = rewind(logIndex);
			client.overrideGameState(state);
		}
	}

	function OnMouseLeave() {
		if (pinned === null) {
			client.overrideGameState(null);
		}
	}

	function Reset() {
		$$invalidate(2, pinned = null);
		client.overrideGameState(null);
		secondaryPane.set(null);
	}

	onDestroy(Reset);

	function OnKeyDown(e) {
		// ESC.
		if (e.keyCode == 27) {
			Reset();
		}
	}

	let renderedLogEntries;
	let turnBoundaries = {};
	let phaseBoundaries = {};

	$$self.$$set = $$props => {
		if ('client' in $$props) $$subscribe_client($$invalidate(0, client = $$props.client));
	};

	$$self.$$.update = () => {
		if ($$self.$$.dirty & /*$client, log, renderedLogEntries*/ 1538) {
			 {
				$$invalidate(9, log = $client.log);
				$$invalidate(1, renderedLogEntries = log.filter(e => !e.automatic));
				let eventsInCurrentPhase = 0;
				let eventsInCurrentTurn = 0;
				$$invalidate(3, turnBoundaries = {});
				$$invalidate(4, phaseBoundaries = {});

				for (let i = 0; i < renderedLogEntries.length; i++) {
					const { action, payload, turn, phase } = renderedLogEntries[i];
					eventsInCurrentTurn++;
					eventsInCurrentPhase++;

					if (i == renderedLogEntries.length - 1 || renderedLogEntries[i + 1].turn != turn) {
						$$invalidate(3, turnBoundaries[i] = eventsInCurrentTurn, turnBoundaries);
						eventsInCurrentTurn = 0;
					}

					if (i == renderedLogEntries.length - 1 || renderedLogEntries[i + 1].phase != phase) {
						$$invalidate(4, phaseBoundaries[i] = eventsInCurrentPhase, phaseBoundaries);
						eventsInCurrentPhase = 0;
					}
				}
			}
		}
	};

	return [
		client,
		renderedLogEntries,
		pinned,
		turnBoundaries,
		phaseBoundaries,
		OnLogClick,
		OnMouseEnter,
		OnMouseLeave,
		OnKeyDown,
		log,
		$client
	];
}

class Log extends SvelteComponent {
	constructor(options) {
		super();
		init(this, options, instance$w, create_fragment$w, safe_not_equal, { client: 0 }, add_css$n);
	}
}

/* src/client/debug/ai/Options.svelte generated by Svelte v3.41.0 */

function add_css$o(target) {
	append_styles(target, "svelte-1fu900w", "label.svelte-1fu900w{color:#666}.option.svelte-1fu900w{margin-bottom:20px}.value.svelte-1fu900w{font-weight:bold;color:#000}input[type='checkbox'].svelte-1fu900w{vertical-align:middle}");
}

function get_each_context$9(ctx, list, i) {
	const child_ctx = ctx.slice();
	child_ctx[6] = list[i][0];
	child_ctx[7] = list[i][1];
	child_ctx[8] = list;
	child_ctx[9] = i;
	return child_ctx;
}

// (44:47) 
function create_if_block_1$5(ctx) {
	let input;
	let input_id_value;
	let mounted;
	let dispose;

	function input_change_handler() {
		/*input_change_handler*/ ctx[5].call(input, /*key*/ ctx[6]);
	}

	return {
		c() {
			input = element("input");
			attr(input, "id", input_id_value = /*makeID*/ ctx[3](/*key*/ ctx[6]));
			attr(input, "type", "checkbox");
			attr(input, "class", "svelte-1fu900w");
		},
		m(target, anchor) {
			insert(target, input, anchor);
			input.checked = /*values*/ ctx[1][/*key*/ ctx[6]];

			if (!mounted) {
				dispose = [
					listen(input, "change", input_change_handler),
					listen(input, "change", /*OnChange*/ ctx[2])
				];

				mounted = true;
			}
		},
		p(new_ctx, dirty) {
			ctx = new_ctx;

			if (dirty & /*bot*/ 1 && input_id_value !== (input_id_value = /*makeID*/ ctx[3](/*key*/ ctx[6]))) {
				attr(input, "id", input_id_value);
			}

			if (dirty & /*values, Object, bot*/ 3) {
				input.checked = /*values*/ ctx[1][/*key*/ ctx[6]];
			}
		},
		d(detaching) {
			if (detaching) detach(input);
			mounted = false;
			run_all(dispose);
		}
	};
}

// (41:4) {#if value.range}
function create_if_block$c(ctx) {
	let span;
	let t0_value = /*values*/ ctx[1][/*key*/ ctx[6]] + "";
	let t0;
	let t1;
	let input;
	let input_id_value;
	let input_min_value;
	let input_max_value;
	let mounted;
	let dispose;

	function input_change_input_handler() {
		/*input_change_input_handler*/ ctx[4].call(input, /*key*/ ctx[6]);
	}

	return {
		c() {
			span = element("span");
			t0 = text(t0_value);
			t1 = space();
			input = element("input");
			attr(span, "class", "value svelte-1fu900w");
			attr(input, "id", input_id_value = /*makeID*/ ctx[3](/*key*/ ctx[6]));
			attr(input, "type", "range");
			attr(input, "min", input_min_value = /*value*/ ctx[7].range.min);
			attr(input, "max", input_max_value = /*value*/ ctx[7].range.max);
		},
		m(target, anchor) {
			insert(target, span, anchor);
			append(span, t0);
			insert(target, t1, anchor);
			insert(target, input, anchor);
			set_input_value(input, /*values*/ ctx[1][/*key*/ ctx[6]]);

			if (!mounted) {
				dispose = [
					listen(input, "change", input_change_input_handler),
					listen(input, "input", input_change_input_handler),
					listen(input, "change", /*OnChange*/ ctx[2])
				];

				mounted = true;
			}
		},
		p(new_ctx, dirty) {
			ctx = new_ctx;
			if (dirty & /*values, bot*/ 3 && t0_value !== (t0_value = /*values*/ ctx[1][/*key*/ ctx[6]] + "")) set_data(t0, t0_value);

			if (dirty & /*bot*/ 1 && input_id_value !== (input_id_value = /*makeID*/ ctx[3](/*key*/ ctx[6]))) {
				attr(input, "id", input_id_value);
			}

			if (dirty & /*bot*/ 1 && input_min_value !== (input_min_value = /*value*/ ctx[7].range.min)) {
				attr(input, "min", input_min_value);
			}

			if (dirty & /*bot*/ 1 && input_max_value !== (input_max_value = /*value*/ ctx[7].range.max)) {
				attr(input, "max", input_max_value);
			}

			if (dirty & /*values, Object, bot*/ 3) {
				set_input_value(input, /*values*/ ctx[1][/*key*/ ctx[6]]);
			}
		},
		d(detaching) {
			if (detaching) detach(span);
			if (detaching) detach(t1);
			if (detaching) detach(input);
			mounted = false;
			run_all(dispose);
		}
	};
}

// (37:0) {#each Object.entries(bot.opts()) as [key, value]}
function create_each_block$9(ctx) {
	let div;
	let label;
	let t0_value = /*key*/ ctx[6] + "";
	let t0;
	let label_for_value;
	let t1;
	let t2;

	function select_block_type(ctx, dirty) {
		if (/*value*/ ctx[7].range) return create_if_block$c;
		if (typeof /*value*/ ctx[7].value === 'boolean') return create_if_block_1$5;
	}

	let current_block_type = select_block_type(ctx);
	let if_block = current_block_type && current_block_type(ctx);

	return {
		c() {
			div = element("div");
			label = element("label");
			t0 = text(t0_value);
			t1 = space();
			if (if_block) if_block.c();
			t2 = space();
			attr(label, "for", label_for_value = /*makeID*/ ctx[3](/*key*/ ctx[6]));
			attr(label, "class", "svelte-1fu900w");
			attr(div, "class", "option svelte-1fu900w");
		},
		m(target, anchor) {
			insert(target, div, anchor);
			append(div, label);
			append(label, t0);
			append(div, t1);
			if (if_block) if_block.m(div, null);
			append(div, t2);
		},
		p(ctx, dirty) {
			if (dirty & /*bot*/ 1 && t0_value !== (t0_value = /*key*/ ctx[6] + "")) set_data(t0, t0_value);

			if (dirty & /*bot*/ 1 && label_for_value !== (label_for_value = /*makeID*/ ctx[3](/*key*/ ctx[6]))) {
				attr(label, "for", label_for_value);
			}

			if (current_block_type === (current_block_type = select_block_type(ctx)) && if_block) {
				if_block.p(ctx, dirty);
			} else {
				if (if_block) if_block.d(1);
				if_block = current_block_type && current_block_type(ctx);

				if (if_block) {
					if_block.c();
					if_block.m(div, t2);
				}
			}
		},
		d(detaching) {
			if (detaching) detach(div);

			if (if_block) {
				if_block.d();
			}
		}
	};
}

function create_fragment$x(ctx) {
	let each_1_anchor;
	let each_value = Object.entries(/*bot*/ ctx[0].opts());
	let each_blocks = [];

	for (let i = 0; i < each_value.length; i += 1) {
		each_blocks[i] = create_each_block$9(get_each_context$9(ctx, each_value, i));
	}

	return {
		c() {
			for (let i = 0; i < each_blocks.length; i += 1) {
				each_blocks[i].c();
			}

			each_1_anchor = empty();
		},
		m(target, anchor) {
			for (let i = 0; i < each_blocks.length; i += 1) {
				each_blocks[i].m(target, anchor);
			}

			insert(target, each_1_anchor, anchor);
		},
		p(ctx, [dirty]) {
			if (dirty & /*makeID, Object, bot, values, OnChange*/ 15) {
				each_value = Object.entries(/*bot*/ ctx[0].opts());
				let i;

				for (i = 0; i < each_value.length; i += 1) {
					const child_ctx = get_each_context$9(ctx, each_value, i);

					if (each_blocks[i]) {
						each_blocks[i].p(child_ctx, dirty);
					} else {
						each_blocks[i] = create_each_block$9(child_ctx);
						each_blocks[i].c();
						each_blocks[i].m(each_1_anchor.parentNode, each_1_anchor);
					}
				}

				for (; i < each_blocks.length; i += 1) {
					each_blocks[i].d(1);
				}

				each_blocks.length = each_value.length;
			}
		},
		i: noop,
		o: noop,
		d(detaching) {
			destroy_each(each_blocks, detaching);
			if (detaching) detach(each_1_anchor);
		}
	};
}

function instance$x($$self, $$props, $$invalidate) {
	let { bot } = $$props;
	let values = {};

	for (let [key, value] of Object.entries(bot.opts())) {
		values[key] = value.value;
	}

	function OnChange() {
		for (let [key, value] of Object.entries(values)) {
			bot.setOpt(key, value);
		}
	}

	const makeID = key => 'ai-option-' + key;

	function input_change_input_handler(key) {
		values[key] = to_number(this.value);
		$$invalidate(1, values);
		$$invalidate(0, bot);
	}

	function input_change_handler(key) {
		values[key] = this.checked;
		$$invalidate(1, values);
		$$invalidate(0, bot);
	}

	$$self.$$set = $$props => {
		if ('bot' in $$props) $$invalidate(0, bot = $$props.bot);
	};

	return [
		bot,
		values,
		OnChange,
		makeID,
		input_change_input_handler,
		input_change_handler
	];
}

class Options extends SvelteComponent {
	constructor(options) {
		super();
		init(this, options, instance$x, create_fragment$x, safe_not_equal, { bot: 0 }, add_css$o);
	}
}

/* src/client/debug/ai/AI.svelte generated by Svelte v3.41.0 */

function add_css$p(target) {
	append_styles(target, "svelte-lifdi8", "ul.svelte-lifdi8{padding-left:0}li.svelte-lifdi8{list-style:none;margin:none;margin-bottom:5px}h3.svelte-lifdi8{text-transform:uppercase}label.svelte-lifdi8{color:#666}input[type='checkbox'].svelte-lifdi8{vertical-align:middle}");
}

function get_each_context$a(ctx, list, i) {
	const child_ctx = ctx.slice();
	child_ctx[7] = list[i];
	return child_ctx;
}

// (202:4) {:else}
function create_else_block$3(ctx) {
	let p0;
	let t1;
	let p1;

	return {
		c() {
			p0 = element("p");
			p0.textContent = "No bots available.";
			t1 = space();
			p1 = element("p");

			p1.innerHTML = `Follow the instructions
        <a href="https://boardgame.io/documentation/#/tutorial?id=bots" target="_blank">here</a>
        to set up bots.`;
		},
		m(target, anchor) {
			insert(target, p0, anchor);
			insert(target, t1, anchor);
			insert(target, p1, anchor);
		},
		p: noop,
		i: noop,
		o: noop,
		d(detaching) {
			if (detaching) detach(p0);
			if (detaching) detach(t1);
			if (detaching) detach(p1);
		}
	};
}

// (200:4) {#if client.multiplayer}
function create_if_block_5(ctx) {
	let p;

	return {
		c() {
			p = element("p");
			p.textContent = "The bot debugger is only available in singleplayer mode.";
		},
		m(target, anchor) {
			insert(target, p, anchor);
		},
		p: noop,
		i: noop,
		o: noop,
		d(detaching) {
			if (detaching) detach(p);
		}
	};
}

// (150:2) {#if client.game.ai && !client.multiplayer}
function create_if_block$d(ctx) {
	let section0;
	let h30;
	let t1;
	let ul;
	let li0;
	let hotkey0;
	let t2;
	let li1;
	let hotkey1;
	let t3;
	let li2;
	let hotkey2;
	let t4;
	let section1;
	let h31;
	let t6;
	let select;
	let t7;
	let show_if = Object.keys(/*bot*/ ctx[7].opts()).length;
	let t8;
	let if_block1_anchor;
	let current;
	let mounted;
	let dispose;

	hotkey0 = new Hotkey({
			props: {
				value: "1",
				onPress: /*Reset*/ ctx[13],
				label: "reset"
			}
		});

	hotkey1 = new Hotkey({
			props: {
				value: "2",
				onPress: /*Step*/ ctx[11],
				label: "play"
			}
		});

	hotkey2 = new Hotkey({
			props: {
				value: "3",
				onPress: /*Simulate*/ ctx[12],
				label: "simulate"
			}
		});

	let each_value = Object.keys(/*bots*/ ctx[8]);
	let each_blocks = [];

	for (let i = 0; i < each_value.length; i += 1) {
		each_blocks[i] = create_each_block$a(get_each_context$a(ctx, each_value, i));
	}

	let if_block0 = show_if && create_if_block_4(ctx);
	let if_block1 = (/*botAction*/ ctx[5] || /*iterationCounter*/ ctx[3]) && create_if_block_1$6(ctx);

	return {
		c() {
			section0 = element("section");
			h30 = element("h3");
			h30.textContent = "Controls";
			t1 = space();
			ul = element("ul");
			li0 = element("li");
			create_component(hotkey0.$$.fragment);
			t2 = space();
			li1 = element("li");
			create_component(hotkey1.$$.fragment);
			t3 = space();
			li2 = element("li");
			create_component(hotkey2.$$.fragment);
			t4 = space();
			section1 = element("section");
			h31 = element("h3");
			h31.textContent = "Bot";
			t6 = space();
			select = element("select");

			for (let i = 0; i < each_blocks.length; i += 1) {
				each_blocks[i].c();
			}

			t7 = space();
			if (if_block0) if_block0.c();
			t8 = space();
			if (if_block1) if_block1.c();
			if_block1_anchor = empty();
			attr(h30, "class", "svelte-lifdi8");
			attr(li0, "class", "svelte-lifdi8");
			attr(li1, "class", "svelte-lifdi8");
			attr(li2, "class", "svelte-lifdi8");
			attr(ul, "class", "svelte-lifdi8");
			attr(h31, "class", "svelte-lifdi8");
			if (/*selectedBot*/ ctx[4] === void 0) add_render_callback(() => /*select_change_handler*/ ctx[17].call(select));
		},
		m(target, anchor) {
			insert(target, section0, anchor);
			append(section0, h30);
			append(section0, t1);
			append(section0, ul);
			append(ul, li0);
			mount_component(hotkey0, li0, null);
			append(ul, t2);
			append(ul, li1);
			mount_component(hotkey1, li1, null);
			append(ul, t3);
			append(ul, li2);
			mount_component(hotkey2, li2, null);
			insert(target, t4, anchor);
			insert(target, section1, anchor);
			append(section1, h31);
			append(section1, t6);
			append(section1, select);

			for (let i = 0; i < each_blocks.length; i += 1) {
				each_blocks[i].m(select, null);
			}

			select_option(select, /*selectedBot*/ ctx[4]);
			insert(target, t7, anchor);
			if (if_block0) if_block0.m(target, anchor);
			insert(target, t8, anchor);
			if (if_block1) if_block1.m(target, anchor);
			insert(target, if_block1_anchor, anchor);
			current = true;

			if (!mounted) {
				dispose = [
					listen(select, "change", /*select_change_handler*/ ctx[17]),
					listen(select, "change", /*ChangeBot*/ ctx[10])
				];

				mounted = true;
			}
		},
		p(ctx, dirty) {
			if (dirty & /*Object, bots*/ 256) {
				each_value = Object.keys(/*bots*/ ctx[8]);
				let i;

				for (i = 0; i < each_value.length; i += 1) {
					const child_ctx = get_each_context$a(ctx, each_value, i);

					if (each_blocks[i]) {
						each_blocks[i].p(child_ctx, dirty);
					} else {
						each_blocks[i] = create_each_block$a(child_ctx);
						each_blocks[i].c();
						each_blocks[i].m(select, null);
					}
				}

				for (; i < each_blocks.length; i += 1) {
					each_blocks[i].d(1);
				}

				each_blocks.length = each_value.length;
			}

			if (dirty & /*selectedBot, Object, bots*/ 272) {
				select_option(select, /*selectedBot*/ ctx[4]);
			}

			if (dirty & /*bot*/ 128) show_if = Object.keys(/*bot*/ ctx[7].opts()).length;

			if (show_if) {
				if (if_block0) {
					if_block0.p(ctx, dirty);

					if (dirty & /*bot*/ 128) {
						transition_in(if_block0, 1);
					}
				} else {
					if_block0 = create_if_block_4(ctx);
					if_block0.c();
					transition_in(if_block0, 1);
					if_block0.m(t8.parentNode, t8);
				}
			} else if (if_block0) {
				group_outros();

				transition_out(if_block0, 1, 1, () => {
					if_block0 = null;
				});

				check_outros();
			}

			if (/*botAction*/ ctx[5] || /*iterationCounter*/ ctx[3]) {
				if (if_block1) {
					if_block1.p(ctx, dirty);
				} else {
					if_block1 = create_if_block_1$6(ctx);
					if_block1.c();
					if_block1.m(if_block1_anchor.parentNode, if_block1_anchor);
				}
			} else if (if_block1) {
				if_block1.d(1);
				if_block1 = null;
			}
		},
		i(local) {
			if (current) return;
			transition_in(hotkey0.$$.fragment, local);
			transition_in(hotkey1.$$.fragment, local);
			transition_in(hotkey2.$$.fragment, local);
			transition_in(if_block0);
			current = true;
		},
		o(local) {
			transition_out(hotkey0.$$.fragment, local);
			transition_out(hotkey1.$$.fragment, local);
			transition_out(hotkey2.$$.fragment, local);
			transition_out(if_block0);
			current = false;
		},
		d(detaching) {
			if (detaching) detach(section0);
			destroy_component(hotkey0);
			destroy_component(hotkey1);
			destroy_component(hotkey2);
			if (detaching) detach(t4);
			if (detaching) detach(section1);
			destroy_each(each_blocks, detaching);
			if (detaching) detach(t7);
			if (if_block0) if_block0.d(detaching);
			if (detaching) detach(t8);
			if (if_block1) if_block1.d(detaching);
			if (detaching) detach(if_block1_anchor);
			mounted = false;
			run_all(dispose);
		}
	};
}

// (169:8) {#each Object.keys(bots) as bot}
function create_each_block$a(ctx) {
	let option;
	let t_value = /*bot*/ ctx[7] + "";
	let t;
	let option_value_value;

	return {
		c() {
			option = element("option");
			t = text(t_value);
			option.__value = option_value_value = /*bot*/ ctx[7];
			option.value = option.__value;
		},
		m(target, anchor) {
			insert(target, option, anchor);
			append(option, t);
		},
		p: noop,
		d(detaching) {
			if (detaching) detach(option);
		}
	};
}

// (175:4) {#if Object.keys(bot.opts()).length}
function create_if_block_4(ctx) {
	let section;
	let h3;
	let t1;
	let label;
	let t3;
	let input;
	let t4;
	let options;
	let current;
	let mounted;
	let dispose;
	options = new Options({ props: { bot: /*bot*/ ctx[7] } });

	return {
		c() {
			section = element("section");
			h3 = element("h3");
			h3.textContent = "Options";
			t1 = space();
			label = element("label");
			label.textContent = "debug";
			t3 = space();
			input = element("input");
			t4 = space();
			create_component(options.$$.fragment);
			attr(h3, "class", "svelte-lifdi8");
			attr(label, "for", "ai-option-debug");
			attr(label, "class", "svelte-lifdi8");
			attr(input, "id", "ai-option-debug");
			attr(input, "type", "checkbox");
			attr(input, "class", "svelte-lifdi8");
		},
		m(target, anchor) {
			insert(target, section, anchor);
			append(section, h3);
			append(section, t1);
			append(section, label);
			append(section, t3);
			append(section, input);
			input.checked = /*debug*/ ctx[1];
			append(section, t4);
			mount_component(options, section, null);
			current = true;

			if (!mounted) {
				dispose = [
					listen(input, "change", /*input_change_handler*/ ctx[18]),
					listen(input, "change", /*OnDebug*/ ctx[9])
				];

				mounted = true;
			}
		},
		p(ctx, dirty) {
			if (dirty & /*debug*/ 2) {
				input.checked = /*debug*/ ctx[1];
			}

			const options_changes = {};
			if (dirty & /*bot*/ 128) options_changes.bot = /*bot*/ ctx[7];
			options.$set(options_changes);
		},
		i(local) {
			if (current) return;
			transition_in(options.$$.fragment, local);
			current = true;
		},
		o(local) {
			transition_out(options.$$.fragment, local);
			current = false;
		},
		d(detaching) {
			if (detaching) detach(section);
			destroy_component(options);
			mounted = false;
			run_all(dispose);
		}
	};
}

// (184:4) {#if botAction || iterationCounter}
function create_if_block_1$6(ctx) {
	let section;
	let h3;
	let t1;
	let t2;
	let if_block0 = /*progress*/ ctx[2] && /*progress*/ ctx[2] < 1.0 && create_if_block_3$1(ctx);
	let if_block1 = /*botAction*/ ctx[5] && create_if_block_2$4(ctx);

	return {
		c() {
			section = element("section");
			h3 = element("h3");
			h3.textContent = "Result";
			t1 = space();
			if (if_block0) if_block0.c();
			t2 = space();
			if (if_block1) if_block1.c();
			attr(h3, "class", "svelte-lifdi8");
		},
		m(target, anchor) {
			insert(target, section, anchor);
			append(section, h3);
			append(section, t1);
			if (if_block0) if_block0.m(section, null);
			append(section, t2);
			if (if_block1) if_block1.m(section, null);
		},
		p(ctx, dirty) {
			if (/*progress*/ ctx[2] && /*progress*/ ctx[2] < 1.0) {
				if (if_block0) {
					if_block0.p(ctx, dirty);
				} else {
					if_block0 = create_if_block_3$1(ctx);
					if_block0.c();
					if_block0.m(section, t2);
				}
			} else if (if_block0) {
				if_block0.d(1);
				if_block0 = null;
			}

			if (/*botAction*/ ctx[5]) {
				if (if_block1) {
					if_block1.p(ctx, dirty);
				} else {
					if_block1 = create_if_block_2$4(ctx);
					if_block1.c();
					if_block1.m(section, null);
				}
			} else if (if_block1) {
				if_block1.d(1);
				if_block1 = null;
			}
		},
		d(detaching) {
			if (detaching) detach(section);
			if (if_block0) if_block0.d();
			if (if_block1) if_block1.d();
		}
	};
}

// (187:6) {#if progress && progress < 1.0}
function create_if_block_3$1(ctx) {
	let progress_1;

	return {
		c() {
			progress_1 = element("progress");
			progress_1.value = /*progress*/ ctx[2];
		},
		m(target, anchor) {
			insert(target, progress_1, anchor);
		},
		p(ctx, dirty) {
			if (dirty & /*progress*/ 4) {
				progress_1.value = /*progress*/ ctx[2];
			}
		},
		d(detaching) {
			if (detaching) detach(progress_1);
		}
	};
}

// (191:6) {#if botAction}
function create_if_block_2$4(ctx) {
	let ul;
	let li0;
	let t0;
	let t1;
	let t2;
	let li1;
	let t3;
	let t4_value = JSON.stringify(/*botActionArgs*/ ctx[6]) + "";
	let t4;

	return {
		c() {
			ul = element("ul");
			li0 = element("li");
			t0 = text("Action: ");
			t1 = text(/*botAction*/ ctx[5]);
			t2 = space();
			li1 = element("li");
			t3 = text("Args: ");
			t4 = text(t4_value);
			attr(li0, "class", "svelte-lifdi8");
			attr(li1, "class", "svelte-lifdi8");
			attr(ul, "class", "svelte-lifdi8");
		},
		m(target, anchor) {
			insert(target, ul, anchor);
			append(ul, li0);
			append(li0, t0);
			append(li0, t1);
			append(ul, t2);
			append(ul, li1);
			append(li1, t3);
			append(li1, t4);
		},
		p(ctx, dirty) {
			if (dirty & /*botAction*/ 32) set_data(t1, /*botAction*/ ctx[5]);
			if (dirty & /*botActionArgs*/ 64 && t4_value !== (t4_value = JSON.stringify(/*botActionArgs*/ ctx[6]) + "")) set_data(t4, t4_value);
		},
		d(detaching) {
			if (detaching) detach(ul);
		}
	};
}

function create_fragment$y(ctx) {
	let section;
	let current_block_type_index;
	let if_block;
	let current;
	let mounted;
	let dispose;
	const if_block_creators = [create_if_block$d, create_if_block_5, create_else_block$3];
	const if_blocks = [];

	function select_block_type(ctx, dirty) {
		if (/*client*/ ctx[0].game.ai && !/*client*/ ctx[0].multiplayer) return 0;
		if (/*client*/ ctx[0].multiplayer) return 1;
		return 2;
	}

	current_block_type_index = select_block_type(ctx);
	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

	return {
		c() {
			section = element("section");
			if_block.c();
		},
		m(target, anchor) {
			insert(target, section, anchor);
			if_blocks[current_block_type_index].m(section, null);
			current = true;

			if (!mounted) {
				dispose = listen(window, "keydown", /*OnKeyDown*/ ctx[14]);
				mounted = true;
			}
		},
		p(ctx, [dirty]) {
			let previous_block_index = current_block_type_index;
			current_block_type_index = select_block_type(ctx);

			if (current_block_type_index === previous_block_index) {
				if_blocks[current_block_type_index].p(ctx, dirty);
			} else {
				group_outros();

				transition_out(if_blocks[previous_block_index], 1, 1, () => {
					if_blocks[previous_block_index] = null;
				});

				check_outros();
				if_block = if_blocks[current_block_type_index];

				if (!if_block) {
					if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
					if_block.c();
				} else {
					if_block.p(ctx, dirty);
				}

				transition_in(if_block, 1);
				if_block.m(section, null);
			}
		},
		i(local) {
			if (current) return;
			transition_in(if_block);
			current = true;
		},
		o(local) {
			transition_out(if_block);
			current = false;
		},
		d(detaching) {
			if (detaching) detach(section);
			if_blocks[current_block_type_index].d();
			mounted = false;
			dispose();
		}
	};
}

function instance$y($$self, $$props, $$invalidate) {
	let { client } = $$props;
	let { clientManager } = $$props;
	let { ToggleVisibility } = $$props;
	const { secondaryPane } = getContext('secondaryPane');
	const bots = { 'MCTS': ai.MCTSBot, 'Random': ai.RandomBot };
	let debug = false;
	let progress = null;
	let iterationCounter = 0;
	let metadata = null;

	const iterationCallback = ({ iterationCounter: c, numIterations, metadata: m }) => {
		$$invalidate(3, iterationCounter = c);
		$$invalidate(2, progress = c / numIterations);
		metadata = m;

		if (debug && metadata) {
			secondaryPane.set({ component: MCTS, metadata });
		}
	};

	function OnDebug() {
		if (debug && metadata) {
			secondaryPane.set({ component: MCTS, metadata });
		} else {
			secondaryPane.set(null);
		}
	}

	let bot;

	if (client.game.ai) {
		bot = new ai.MCTSBot({
				game: client.game,
				enumerate: client.game.ai.enumerate,
				iterationCallback
			});

		bot.setOpt('async', true);
	}

	let selectedBot;
	let botAction;
	let botActionArgs;

	function ChangeBot() {
		const botConstructor = bots[selectedBot];

		$$invalidate(7, bot = new botConstructor({
				game: client.game,
				enumerate: client.game.ai.enumerate,
				iterationCallback
			}));

		bot.setOpt('async', true);
		$$invalidate(5, botAction = null);
		metadata = null;
		secondaryPane.set(null);
		$$invalidate(3, iterationCounter = 0);
	}

	async function Step() {
		$$invalidate(5, botAction = null);
		metadata = null;
		$$invalidate(3, iterationCounter = 0);
		const t = await ai.Step(client, bot);

		if (t) {
			$$invalidate(5, botAction = t.payload.type);
			$$invalidate(6, botActionArgs = t.payload.args);
		}
	}

	function Simulate(iterations = 10000, sleepTimeout = 100) {
		$$invalidate(5, botAction = null);
		metadata = null;
		$$invalidate(3, iterationCounter = 0);

		const step = async () => {
			for (let i = 0; i < iterations; i++) {
				const action = await ai.Step(client, bot);
				if (!action) break;
				await new Promise(resolve => setTimeout(resolve, sleepTimeout));
			}
		};

		return step();
	}

	function Exit() {
		client.overrideGameState(null);
		secondaryPane.set(null);
		$$invalidate(1, debug = false);
	}

	function Reset() {
		client.reset();
		$$invalidate(5, botAction = null);
		metadata = null;
		$$invalidate(3, iterationCounter = 0);
		Exit();
	}

	function OnKeyDown(e) {
		// ESC.
		if (e.keyCode == 27) {
			Exit();
		}
	}

	onDestroy(Exit);

	function select_change_handler() {
		selectedBot = select_value(this);
		$$invalidate(4, selectedBot);
		$$invalidate(8, bots);
	}

	function input_change_handler() {
		debug = this.checked;
		$$invalidate(1, debug);
	}

	$$self.$$set = $$props => {
		if ('client' in $$props) $$invalidate(0, client = $$props.client);
		if ('clientManager' in $$props) $$invalidate(15, clientManager = $$props.clientManager);
		if ('ToggleVisibility' in $$props) $$invalidate(16, ToggleVisibility = $$props.ToggleVisibility);
	};

	return [
		client,
		debug,
		progress,
		iterationCounter,
		selectedBot,
		botAction,
		botActionArgs,
		bot,
		bots,
		OnDebug,
		ChangeBot,
		Step,
		Simulate,
		Reset,
		OnKeyDown,
		clientManager,
		ToggleVisibility,
		select_change_handler,
		input_change_handler
	];
}

class AI extends SvelteComponent {
	constructor(options) {
		super();

		init(
			this,
			options,
			instance$y,
			create_fragment$y,
			safe_not_equal,
			{
				client: 0,
				clientManager: 15,
				ToggleVisibility: 16
			},
			add_css$p
		);
	}
}

/* src/client/debug/Debug.svelte generated by Svelte v3.41.0 */

function add_css$q(target) {
	append_styles(target, "svelte-8ymctk", ".debug-panel.svelte-8ymctk.svelte-8ymctk{position:fixed;color:#555;font-family:monospace;right:0;top:0;height:100%;font-size:14px;opacity:0.9;z-index:99999}.panel.svelte-8ymctk.svelte-8ymctk{display:flex;position:relative;flex-direction:row;height:100%}.visibility-toggle.svelte-8ymctk.svelte-8ymctk{position:absolute;box-sizing:border-box;top:7px;border:1px solid #ccc;border-radius:5px;width:48px;height:48px;padding:8px;background:white;color:#555;box-shadow:0 0 5px rgba(0, 0, 0, 0.2)}.visibility-toggle.svelte-8ymctk.svelte-8ymctk:hover,.visibility-toggle.svelte-8ymctk.svelte-8ymctk:focus{background:#eee}.opener.svelte-8ymctk.svelte-8ymctk{right:10px}.closer.svelte-8ymctk.svelte-8ymctk{left:-326px}@keyframes svelte-8ymctk-rotateFromZero{from{transform:rotateZ(0deg)}to{transform:rotateZ(180deg)}}.icon.svelte-8ymctk.svelte-8ymctk{display:flex;height:100%;animation:svelte-8ymctk-rotateFromZero 0.4s cubic-bezier(0.68, -0.55, 0.27, 1.55) 0s 1\n      normal forwards}.closer.svelte-8ymctk .icon.svelte-8ymctk{animation-direction:reverse}.pane.svelte-8ymctk.svelte-8ymctk{flex-grow:2;overflow-x:hidden;overflow-y:scroll;background:#fefefe;padding:20px;border-left:1px solid #ccc;box-shadow:-1px 0 5px rgba(0, 0, 0, 0.2);box-sizing:border-box;width:280px}.secondary-pane.svelte-8ymctk.svelte-8ymctk{background:#fefefe;overflow-y:scroll}.debug-panel.svelte-8ymctk button,.debug-panel.svelte-8ymctk select{cursor:pointer;font-size:14px;font-family:monospace}.debug-panel.svelte-8ymctk select{background:#eee;border:1px solid #bbb;color:#555;padding:3px;border-radius:3px}.debug-panel.svelte-8ymctk section{margin-bottom:20px}.debug-panel.svelte-8ymctk .screen-reader-only{clip:rect(0 0 0 0);clip-path:inset(50%);height:1px;overflow:hidden;position:absolute;white-space:nowrap;width:1px}");
}

// (199:2) {:else}
function create_else_block$4(ctx) {
	let div1;
	let t0;
	let menu;
	let t1;
	let div0;
	let switch_instance;
	let t2;
	let div1_transition;
	let current;
	let if_block0 = /*showToggleButton*/ ctx[10] && create_if_block_3$2(ctx);

	menu = new Menu({
			props: {
				panes: /*panes*/ ctx[6],
				pane: /*pane*/ ctx[2]
			}
		});

	menu.$on("change", /*MenuChange*/ ctx[8]);
	var switch_value = /*panes*/ ctx[6][/*pane*/ ctx[2]].component;

	function switch_props(ctx) {
		return {
			props: {
				client: /*client*/ ctx[4],
				clientManager: /*clientManager*/ ctx[0],
				ToggleVisibility: /*ToggleVisibility*/ ctx[9]
			}
		};
	}

	if (switch_value) {
		switch_instance = new switch_value(switch_props(ctx));
	}

	let if_block1 = /*$secondaryPane*/ ctx[5] && create_if_block_2$5(ctx);

	return {
		c() {
			div1 = element("div");
			if (if_block0) if_block0.c();
			t0 = space();
			create_component(menu.$$.fragment);
			t1 = space();
			div0 = element("div");
			if (switch_instance) create_component(switch_instance.$$.fragment);
			t2 = space();
			if (if_block1) if_block1.c();
			attr(div0, "class", "pane svelte-8ymctk");
			attr(div0, "role", "region");
			attr(div0, "aria-label", /*pane*/ ctx[2]);
			attr(div0, "tabindex", "-1");
			attr(div1, "class", "panel svelte-8ymctk");
		},
		m(target, anchor) {
			insert(target, div1, anchor);
			if (if_block0) if_block0.m(div1, null);
			append(div1, t0);
			mount_component(menu, div1, null);
			append(div1, t1);
			append(div1, div0);

			if (switch_instance) {
				mount_component(switch_instance, div0, null);
			}

			/*div0_binding*/ ctx[16](div0);
			append(div1, t2);
			if (if_block1) if_block1.m(div1, null);
			current = true;
		},
		p(new_ctx, dirty) {
			ctx = new_ctx;
			if (/*showToggleButton*/ ctx[10]) if_block0.p(ctx, dirty);
			const menu_changes = {};
			if (dirty & /*pane*/ 4) menu_changes.pane = /*pane*/ ctx[2];
			menu.$set(menu_changes);
			const switch_instance_changes = {};
			if (dirty & /*client*/ 16) switch_instance_changes.client = /*client*/ ctx[4];
			if (dirty & /*clientManager*/ 1) switch_instance_changes.clientManager = /*clientManager*/ ctx[0];

			if (switch_value !== (switch_value = /*panes*/ ctx[6][/*pane*/ ctx[2]].component)) {
				if (switch_instance) {
					group_outros();
					const old_component = switch_instance;

					transition_out(old_component.$$.fragment, 1, 0, () => {
						destroy_component(old_component, 1);
					});

					check_outros();
				}

				if (switch_value) {
					switch_instance = new switch_value(switch_props(ctx));
					create_component(switch_instance.$$.fragment);
					transition_in(switch_instance.$$.fragment, 1);
					mount_component(switch_instance, div0, null);
				} else {
					switch_instance = null;
				}
			} else if (switch_value) {
				switch_instance.$set(switch_instance_changes);
			}

			if (!current || dirty & /*pane*/ 4) {
				attr(div0, "aria-label", /*pane*/ ctx[2]);
			}

			if (/*$secondaryPane*/ ctx[5]) {
				if (if_block1) {
					if_block1.p(ctx, dirty);

					if (dirty & /*$secondaryPane*/ 32) {
						transition_in(if_block1, 1);
					}
				} else {
					if_block1 = create_if_block_2$5(ctx);
					if_block1.c();
					transition_in(if_block1, 1);
					if_block1.m(div1, null);
				}
			} else if (if_block1) {
				group_outros();

				transition_out(if_block1, 1, 1, () => {
					if_block1 = null;
				});

				check_outros();
			}
		},
		i(local) {
			if (current) return;
			transition_in(if_block0);
			transition_in(menu.$$.fragment, local);
			if (switch_instance) transition_in(switch_instance.$$.fragment, local);
			transition_in(if_block1);

			add_render_callback(() => {
				if (!div1_transition) div1_transition = create_bidirectional_transition(div1, fly, { x: 400, .../*transitionOpts*/ ctx[12] }, true);
				div1_transition.run(1);
			});

			current = true;
		},
		o(local) {
			transition_out(if_block0);
			transition_out(menu.$$.fragment, local);
			if (switch_instance) transition_out(switch_instance.$$.fragment, local);
			transition_out(if_block1);
			if (!div1_transition) div1_transition = create_bidirectional_transition(div1, fly, { x: 400, .../*transitionOpts*/ ctx[12] }, false);
			div1_transition.run(0);
			current = false;
		},
		d(detaching) {
			if (detaching) detach(div1);
			if (if_block0) if_block0.d();
			destroy_component(menu);
			if (switch_instance) destroy_component(switch_instance);
			/*div0_binding*/ ctx[16](null);
			if (if_block1) if_block1.d();
			if (detaching && div1_transition) div1_transition.end();
		}
	};
}

// (185:2) {#if !visible}
function create_if_block$e(ctx) {
	let if_block_anchor;
	let current;
	let if_block = /*showToggleButton*/ ctx[10] && create_if_block_1$7(ctx);

	return {
		c() {
			if (if_block) if_block.c();
			if_block_anchor = empty();
		},
		m(target, anchor) {
			if (if_block) if_block.m(target, anchor);
			insert(target, if_block_anchor, anchor);
			current = true;
		},
		p(ctx, dirty) {
			if (/*showToggleButton*/ ctx[10]) if_block.p(ctx, dirty);
		},
		i(local) {
			if (current) return;
			transition_in(if_block);
			current = true;
		},
		o(local) {
			transition_out(if_block);
			current = false;
		},
		d(detaching) {
			if (if_block) if_block.d(detaching);
			if (detaching) detach(if_block_anchor);
		}
	};
}

// (201:6) {#if showToggleButton}
function create_if_block_3$2(ctx) {
	let button;
	let span;
	let chevron;
	let button_intro;
	let button_outro;
	let current;
	let mounted;
	let dispose;
	chevron = new FaChevronRight({});

	return {
		c() {
			button = element("button");
			span = element("span");
			create_component(chevron.$$.fragment);
			attr(span, "class", "icon svelte-8ymctk");
			attr(span, "aria-hidden", "true");
			attr(button, "class", "visibility-toggle closer svelte-8ymctk");
			attr(button, "title", "Hide Debug Panel");
		},
		m(target, anchor) {
			insert(target, button, anchor);
			append(button, span);
			mount_component(chevron, span, null);
			current = true;

			if (!mounted) {
				dispose = listen(button, "click", /*ToggleVisibility*/ ctx[9]);
				mounted = true;
			}
		},
		p: noop,
		i(local) {
			if (current) return;
			transition_in(chevron.$$.fragment, local);

			add_render_callback(() => {
				if (button_outro) button_outro.end(1);
				button_intro = create_in_transition(button, /*receive*/ ctx[14], { key: 'toggle' });
				button_intro.start();
			});

			current = true;
		},
		o(local) {
			transition_out(chevron.$$.fragment, local);
			if (button_intro) button_intro.invalidate();
			button_outro = create_out_transition(button, /*send*/ ctx[13], { key: 'toggle' });
			current = false;
		},
		d(detaching) {
			if (detaching) detach(button);
			destroy_component(chevron);
			if (detaching && button_outro) button_outro.end();
			mounted = false;
			dispose();
		}
	};
}

// (229:6) {#if $secondaryPane}
function create_if_block_2$5(ctx) {
	let div;
	let switch_instance;
	let current;
	var switch_value = /*$secondaryPane*/ ctx[5].component;

	function switch_props(ctx) {
		return {
			props: {
				metadata: /*$secondaryPane*/ ctx[5].metadata
			}
		};
	}

	if (switch_value) {
		switch_instance = new switch_value(switch_props(ctx));
	}

	return {
		c() {
			div = element("div");
			if (switch_instance) create_component(switch_instance.$$.fragment);
			attr(div, "class", "secondary-pane svelte-8ymctk");
		},
		m(target, anchor) {
			insert(target, div, anchor);

			if (switch_instance) {
				mount_component(switch_instance, div, null);
			}

			current = true;
		},
		p(ctx, dirty) {
			const switch_instance_changes = {};
			if (dirty & /*$secondaryPane*/ 32) switch_instance_changes.metadata = /*$secondaryPane*/ ctx[5].metadata;

			if (switch_value !== (switch_value = /*$secondaryPane*/ ctx[5].component)) {
				if (switch_instance) {
					group_outros();
					const old_component = switch_instance;

					transition_out(old_component.$$.fragment, 1, 0, () => {
						destroy_component(old_component, 1);
					});

					check_outros();
				}

				if (switch_value) {
					switch_instance = new switch_value(switch_props(ctx));
					create_component(switch_instance.$$.fragment);
					transition_in(switch_instance.$$.fragment, 1);
					mount_component(switch_instance, div, null);
				} else {
					switch_instance = null;
				}
			} else if (switch_value) {
				switch_instance.$set(switch_instance_changes);
			}
		},
		i(local) {
			if (current) return;
			if (switch_instance) transition_in(switch_instance.$$.fragment, local);
			current = true;
		},
		o(local) {
			if (switch_instance) transition_out(switch_instance.$$.fragment, local);
			current = false;
		},
		d(detaching) {
			if (detaching) detach(div);
			if (switch_instance) destroy_component(switch_instance);
		}
	};
}

// (186:4) {#if showToggleButton}
function create_if_block_1$7(ctx) {
	let button;
	let span;
	let chevron;
	let button_intro;
	let button_outro;
	let current;
	let mounted;
	let dispose;
	chevron = new FaChevronRight({});

	return {
		c() {
			button = element("button");
			span = element("span");
			create_component(chevron.$$.fragment);
			attr(span, "class", "icon svelte-8ymctk");
			attr(span, "aria-hidden", "true");
			attr(button, "class", "visibility-toggle opener svelte-8ymctk");
			attr(button, "title", "Show Debug Panel");
		},
		m(target, anchor) {
			insert(target, button, anchor);
			append(button, span);
			mount_component(chevron, span, null);
			current = true;

			if (!mounted) {
				dispose = listen(button, "click", /*ToggleVisibility*/ ctx[9]);
				mounted = true;
			}
		},
		p: noop,
		i(local) {
			if (current) return;
			transition_in(chevron.$$.fragment, local);

			add_render_callback(() => {
				if (button_outro) button_outro.end(1);
				button_intro = create_in_transition(button, /*receive*/ ctx[14], { key: 'toggle' });
				button_intro.start();
			});

			current = true;
		},
		o(local) {
			transition_out(chevron.$$.fragment, local);
			if (button_intro) button_intro.invalidate();
			button_outro = create_out_transition(button, /*send*/ ctx[13], { key: 'toggle' });
			current = false;
		},
		d(detaching) {
			if (detaching) detach(button);
			destroy_component(chevron);
			if (detaching && button_outro) button_outro.end();
			mounted = false;
			dispose();
		}
	};
}

function create_fragment$z(ctx) {
	let section;
	let current_block_type_index;
	let if_block;
	let current;
	let mounted;
	let dispose;
	const if_block_creators = [create_if_block$e, create_else_block$4];
	const if_blocks = [];

	function select_block_type(ctx, dirty) {
		if (!/*visible*/ ctx[3]) return 0;
		return 1;
	}

	current_block_type_index = select_block_type(ctx);
	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

	return {
		c() {
			section = element("section");
			if_block.c();
			attr(section, "aria-label", "boardgame.io Debug Panel");
			attr(section, "class", "debug-panel svelte-8ymctk");
		},
		m(target, anchor) {
			insert(target, section, anchor);
			if_blocks[current_block_type_index].m(section, null);
			current = true;

			if (!mounted) {
				dispose = listen(window, "keypress", /*Keypress*/ ctx[11]);
				mounted = true;
			}
		},
		p(ctx, [dirty]) {
			let previous_block_index = current_block_type_index;
			current_block_type_index = select_block_type(ctx);

			if (current_block_type_index === previous_block_index) {
				if_blocks[current_block_type_index].p(ctx, dirty);
			} else {
				group_outros();

				transition_out(if_blocks[previous_block_index], 1, 1, () => {
					if_blocks[previous_block_index] = null;
				});

				check_outros();
				if_block = if_blocks[current_block_type_index];

				if (!if_block) {
					if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
					if_block.c();
				} else {
					if_block.p(ctx, dirty);
				}

				transition_in(if_block, 1);
				if_block.m(section, null);
			}
		},
		i(local) {
			if (current) return;
			transition_in(if_block);
			current = true;
		},
		o(local) {
			transition_out(if_block);
			current = false;
		},
		d(detaching) {
			if (detaching) detach(section);
			if_blocks[current_block_type_index].d();
			mounted = false;
			dispose();
		}
	};
}

function instance$z($$self, $$props, $$invalidate) {
	let client;

	let $clientManager,
		$$unsubscribe_clientManager = noop,
		$$subscribe_clientManager = () => ($$unsubscribe_clientManager(), $$unsubscribe_clientManager = subscribe(clientManager, $$value => $$invalidate(15, $clientManager = $$value)), clientManager);

	let $secondaryPane;
	$$self.$$.on_destroy.push(() => $$unsubscribe_clientManager());
	let { clientManager } = $$props;
	$$subscribe_clientManager();

	const panes = {
		main: {
			label: 'Main',
			shortcut: 'm',
			component: Main
		},
		log: {
			label: 'Log',
			shortcut: 'l',
			component: Log
		},
		info: {
			label: 'Info',
			shortcut: 'i',
			component: Info
		},
		ai: {
			label: 'AI',
			shortcut: 'a',
			component: AI
		}
	};

	const disableHotkeys = writable(false);
	const secondaryPane = writable(null);
	component_subscribe($$self, secondaryPane, value => $$invalidate(5, $secondaryPane = value));
	setContext('hotkeys', { disableHotkeys });
	setContext('secondaryPane', { secondaryPane });
	let paneDiv;
	let pane = 'main';

	function MenuChange(e) {
		$$invalidate(2, pane = e.detail);
		paneDiv.focus();
	}

	// Toggle debugger visibilty
	function ToggleVisibility() {
		$$invalidate(3, visible = !visible);
	}

	const debugOpt = $clientManager.client.debugOpt;
	let visible = !debugOpt || !debugOpt.collapseOnLoad;
	const showToggleButton = !debugOpt || !debugOpt.hideToggleButton;

	function Keypress(e) {
		if (e.key == '.') {
			ToggleVisibility();
			return;
		}

		// Set displayed pane
		if (!visible) return;

		Object.entries(panes).forEach(([key, { shortcut }]) => {
			if (e.key == shortcut) {
				$$invalidate(2, pane = key);
			}
		});
	}

	const transitionOpts = { duration: 150, easing: cubicOut };
	const [send, receive] = crossfade(transitionOpts);

	function div0_binding($$value) {
		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
			paneDiv = $$value;
			$$invalidate(1, paneDiv);
		});
	}

	$$self.$$set = $$props => {
		if ('clientManager' in $$props) $$subscribe_clientManager($$invalidate(0, clientManager = $$props.clientManager));
	};

	$$self.$$.update = () => {
		if ($$self.$$.dirty & /*$clientManager*/ 32768) {
			 $$invalidate(4, client = $clientManager.client);
		}
	};

	return [
		clientManager,
		paneDiv,
		pane,
		visible,
		client,
		$secondaryPane,
		panes,
		secondaryPane,
		MenuChange,
		ToggleVisibility,
		showToggleButton,
		Keypress,
		transitionOpts,
		send,
		receive,
		$clientManager,
		div0_binding
	];
}

class Debug extends SvelteComponent {
	constructor(options) {
		super();
		init(this, options, instance$z, create_fragment$z, safe_not_equal, { clientManager: 0 }, add_css$q);
	}
}

exports.Debug = Debug;
exports._classCallCheck = _classCallCheck;
exports._createClass = _createClass;
exports._createSuper = _createSuper;
exports._defineProperty = _defineProperty;
exports._inherits = _inherits;
exports._objectSpread2 = _objectSpread2;
exports._objectWithoutProperties = _objectWithoutProperties;

},{"./ai-d0173761.js":8,"./reducer-943f1bac.js":17,"./turn-order-8e019db0.js":19,"flatted":23}],8:[function(require,module,exports){
(function (setImmediate){(function (){
'use strict';

var turnOrder = require('./turn-order-8e019db0.js');
var pluginRandom = require('./plugin-random-7425844d.js');
var reducer = require('./reducer-943f1bac.js');
require('setimmediate');

/*
 * Copyright 2018 The boardgame.io Authors
 *
 * Use of this source code is governed by a MIT-style
 * license that can be found in the LICENSE file or at
 * https://opensource.org/licenses/MIT.
 */
/**
 * Base class that bots can extend.
 */
class Bot {
    constructor({ enumerate, seed, }) {
        this.enumerateFn = enumerate;
        this.seed = seed;
        this.iterationCounter = 0;
        this._opts = {};
    }
    addOpt({ key, range, initial, }) {
        this._opts[key] = {
            range,
            value: initial,
        };
    }
    getOpt(key) {
        return this._opts[key].value;
    }
    setOpt(key, value) {
        if (key in this._opts) {
            this._opts[key].value = value;
        }
    }
    opts() {
        return this._opts;
    }
    enumerate(G, ctx, playerID) {
        const actions = this.enumerateFn(G, ctx, playerID);
        return actions.map((a) => {
            if ('payload' in a) {
                return a;
            }
            if ('move' in a) {
                return turnOrder.makeMove(a.move, a.args, playerID);
            }
            if ('event' in a) {
                return turnOrder.gameEvent(a.event, a.args, playerID);
            }
        });
    }
    random(arg) {
        let number;
        if (this.seed !== undefined) {
            const seed = this.prngstate ? '' : this.seed;
            const rand = pluginRandom.alea(seed, this.prngstate);
            number = rand();
            this.prngstate = rand.state();
        }
        else {
            number = Math.random();
        }
        if (arg) {
            if (Array.isArray(arg)) {
                const id = Math.floor(number * arg.length);
                return arg[id];
            }
            else {
                return Math.floor(number * arg);
            }
        }
        return number;
    }
}

/*
 * Copyright 2018 The boardgame.io Authors
 *
 * Use of this source code is governed by a MIT-style
 * license that can be found in the LICENSE file or at
 * https://opensource.org/licenses/MIT.
 */
/**
 * The number of iterations to run before yielding to
 * the JS event loop (in async mode).
 */
const CHUNK_SIZE = 25;
/**
 * Bot that uses Monte-Carlo Tree Search to find promising moves.
 */
class MCTSBot extends Bot {
    constructor({ enumerate, seed, objectives, game, iterations, playoutDepth, iterationCallback, }) {
        super({ enumerate, seed });
        if (objectives === undefined) {
            objectives = () => ({});
        }
        this.objectives = objectives;
        this.iterationCallback = iterationCallback || (() => { });
        this.reducer = reducer.CreateGameReducer({ game });
        this.iterations = iterations;
        this.playoutDepth = playoutDepth;
        this.addOpt({
            key: 'async',
            initial: false,
        });
        this.addOpt({
            key: 'iterations',
            initial: typeof iterations === 'number' ? iterations : 1000,
            range: { min: 1, max: 2000 },
        });
        this.addOpt({
            key: 'playoutDepth',
            initial: typeof playoutDepth === 'number' ? playoutDepth : 50,
            range: { min: 1, max: 100 },
        });
    }
    createNode({ state, parentAction, parent, playerID, }) {
        const { G, ctx } = state;
        let actions = [];
        let objectives = [];
        if (playerID !== undefined) {
            actions = this.enumerate(G, ctx, playerID);
            objectives = this.objectives(G, ctx, playerID);
        }
        else if (ctx.activePlayers) {
            for (const playerID in ctx.activePlayers) {
                actions.push(...this.enumerate(G, ctx, playerID));
                objectives.push(this.objectives(G, ctx, playerID));
            }
        }
        else {
            actions = this.enumerate(G, ctx, ctx.currentPlayer);
            objectives = this.objectives(G, ctx, ctx.currentPlayer);
        }
        return {
            state,
            parent,
            parentAction,
            actions,
            objectives,
            children: [],
            visits: 0,
            value: 0,
        };
    }
    select(node) {
        // This node has unvisited children.
        if (node.actions.length > 0) {
            return node;
        }
        // This is a terminal node.
        if (node.children.length === 0) {
            return node;
        }
        let selectedChild = null;
        let best = 0;
        for (const child of node.children) {
            const childVisits = child.visits + Number.EPSILON;
            const uct = child.value / childVisits +
                Math.sqrt((2 * Math.log(node.visits)) / childVisits);
            if (selectedChild == null || uct > best) {
                best = uct;
                selectedChild = child;
            }
        }
        return this.select(selectedChild);
    }
    expand(node) {
        const actions = node.actions;
        if (actions.length === 0 || node.state.ctx.gameover !== undefined) {
            return node;
        }
        const id = this.random(actions.length);
        const action = actions[id];
        node.actions.splice(id, 1);
        const childState = this.reducer(node.state, action);
        const childNode = this.createNode({
            state: childState,
            parentAction: action,
            parent: node,
        });
        node.children.push(childNode);
        return childNode;
    }
    playout({ state }) {
        let playoutDepth = this.getOpt('playoutDepth');
        if (typeof this.playoutDepth === 'function') {
            playoutDepth = this.playoutDepth(state.G, state.ctx);
        }
        for (let i = 0; i < playoutDepth && state.ctx.gameover === undefined; i++) {
            const { G, ctx } = state;
            let playerID = ctx.currentPlayer;
            if (ctx.activePlayers) {
                playerID = Object.keys(ctx.activePlayers)[0];
            }
            const moves = this.enumerate(G, ctx, playerID);
            // Check if any objectives are met.
            const objectives = this.objectives(G, ctx, playerID);
            const score = Object.keys(objectives).reduce((score, key) => {
                const objective = objectives[key];
                if (objective.checker(G, ctx)) {
                    return score + objective.weight;
                }
                return score;
            }, 0);
            // If so, stop and return the score.
            if (score > 0) {
                return { score };
            }
            if (!moves || moves.length === 0) {
                return undefined;
            }
            const id = this.random(moves.length);
            const childState = this.reducer(state, moves[id]);
            state = childState;
        }
        return state.ctx.gameover;
    }
    backpropagate(node, result = {}) {
        node.visits++;
        if (result.score !== undefined) {
            node.value += result.score;
        }
        if (result.draw === true) {
            node.value += 0.5;
        }
        if (node.parentAction &&
            result.winner === node.parentAction.payload.playerID) {
            node.value++;
        }
        if (node.parent) {
            this.backpropagate(node.parent, result);
        }
    }
    play(state, playerID) {
        const root = this.createNode({ state, playerID });
        let numIterations = this.getOpt('iterations');
        if (typeof this.iterations === 'function') {
            numIterations = this.iterations(state.G, state.ctx);
        }
        const getResult = () => {
            let selectedChild = null;
            for (const child of root.children) {
                if (selectedChild == null || child.visits > selectedChild.visits) {
                    selectedChild = child;
                }
            }
            const action = selectedChild && selectedChild.parentAction;
            const metadata = root;
            return { action, metadata };
        };
        return new Promise((resolve) => {
            const iteration = () => {
                for (let i = 0; i < CHUNK_SIZE && this.iterationCounter < numIterations; i++) {
                    const leaf = this.select(root);
                    const child = this.expand(leaf);
                    const result = this.playout(child);
                    this.backpropagate(child, result);
                    this.iterationCounter++;
                }
                this.iterationCallback({
                    iterationCounter: this.iterationCounter,
                    numIterations,
                    metadata: root,
                });
            };
            this.iterationCounter = 0;
            if (this.getOpt('async')) {
                const asyncIteration = () => {
                    if (this.iterationCounter < numIterations) {
                        iteration();
                        setImmediate(asyncIteration);
                    }
                    else {
                        resolve(getResult());
                    }
                };
                asyncIteration();
            }
            else {
                while (this.iterationCounter < numIterations) {
                    iteration();
                }
                resolve(getResult());
            }
        });
    }
}

/*
 * Copyright 2018 The boardgame.io Authors
 *
 * Use of this source code is governed by a MIT-style
 * license that can be found in the LICENSE file or at
 * https://opensource.org/licenses/MIT.
 */
/**
 * Bot that picks a move at random.
 */
class RandomBot extends Bot {
    play({ G, ctx }, playerID) {
        const moves = this.enumerate(G, ctx, playerID);
        return Promise.resolve({ action: this.random(moves) });
    }
}

/*
 * Copyright 2018 The boardgame.io Authors
 *
 * Use of this source code is governed by a MIT-style
 * license that can be found in the LICENSE file or at
 * https://opensource.org/licenses/MIT.
 */
/**
 * Make a single move on the client with a bot.
 *
 * @param {...object} client - The game client.
 * @param {...object} bot - The bot.
 */
async function Step(client, bot) {
    const state = client.store.getState();
    let playerID = state.ctx.currentPlayer;
    if (state.ctx.activePlayers) {
        playerID = Object.keys(state.ctx.activePlayers)[0];
    }
    const { action, metadata } = await bot.play(state, playerID);
    if (action) {
        const a = {
            ...action,
            payload: {
                ...action.payload,
                metadata,
            },
        };
        client.store.dispatch(a);
        return a;
    }
}
/**
 * Simulates the game till the end or a max depth.
 *
 * @param {...object} game - The game object.
 * @param {...object} bots - An array of bots.
 * @param {...object} state - The game state to start from.
 */
async function Simulate({ game, bots, state, depth, }) {
    if (depth === undefined)
        depth = 10000;
    const reducer$1 = reducer.CreateGameReducer({ game });
    let metadata = null;
    let iter = 0;
    while (state.ctx.gameover === undefined && iter < depth) {
        let playerID = state.ctx.currentPlayer;
        if (state.ctx.activePlayers) {
            playerID = Object.keys(state.ctx.activePlayers)[0];
        }
        const bot = bots instanceof Bot ? bots : bots[playerID];
        const t = await bot.play(state, playerID);
        if (!t.action) {
            break;
        }
        metadata = t.metadata;
        state = reducer$1(state, t.action);
        iter++;
    }
    return { state, metadata };
}

exports.Bot = Bot;
exports.MCTSBot = MCTSBot;
exports.RandomBot = RandomBot;
exports.Simulate = Simulate;
exports.Step = Step;

}).call(this)}).call(this,require("timers").setImmediate)
},{"./plugin-random-7425844d.js":16,"./reducer-943f1bac.js":17,"./turn-order-8e019db0.js":19,"setimmediate":41,"timers":42}],9:[function(require,module,exports){
'use strict';

const assertString = (str, label) => {
    if (!str || typeof str !== 'string') {
        throw new Error(`Expected ${label} string, got "${str}".`);
    }
};
const assertGameName = (name) => assertString(name, 'game name');
const assertMatchID = (id) => assertString(id, 'match ID');
const validateBody = (body, schema) => {
    if (!body)
        throw new Error(`Expected body, got “${body}”.`);
    for (const key in schema) {
        const propSchema = schema[key];
        const types = Array.isArray(propSchema) ? propSchema : [propSchema];
        const received = body[key];
        if (!types.includes(typeof received)) {
            const union = types.join('|');
            throw new TypeError(`Expected body.${key} to be of type ${union}, got “${received}”.`);
        }
    }
};
class LobbyClientError extends Error {
    constructor(message, details) {
        super(message);
        this.details = details;
    }
}
/**
 * Create a boardgame.io Lobby API client.
 * @param server The API’s base URL, e.g. `http://localhost:8000`.
 */
class LobbyClient {
    constructor({ server = '' } = {}) {
        // strip trailing slash if passed
        this.server = server.replace(/\/$/, '');
    }
    async request(route, init) {
        const response = await fetch(this.server + route, init);
        if (!response.ok) {
            let details;
            try {
                details = await response.clone().json();
            }
            catch {
                try {
                    details = await response.text();
                }
                catch (error) {
                    details = error.message;
                }
            }
            throw new LobbyClientError(`HTTP status ${response.status}`, details);
        }
        return response.json();
    }
    async post(route, opts) {
        let init = {
            method: 'post',
            body: JSON.stringify(opts.body),
            headers: { 'Content-Type': 'application/json' },
        };
        if (opts.init)
            init = {
                ...init,
                ...opts.init,
                headers: { ...init.headers, ...opts.init.headers },
            };
        return this.request(route, init);
    }
    /**
     * Get a list of the game names available on this server.
     * @param  init Optional RequestInit interface to override defaults.
     * @return Array of game names.
     *
     * @example
     * lobbyClient.listGames()
     *   .then(console.log); // => ['chess', 'tic-tac-toe']
     */
    async listGames(init) {
        return this.request('/games', init);
    }
    /**
     * Get a list of the matches for a specific game type on the server.
     * @param  gameName The game to list for, e.g. 'tic-tac-toe'.
     * @param  where    Options to filter matches by update time or gameover state
     * @param  init     Optional RequestInit interface to override defaults.
     * @return Array of match metadata objects.
     *
     * @example
     * lobbyClient.listMatches('tic-tac-toe', where: { isGameover: false })
     *   .then(data => console.log(data.matches));
     * // => [
     * //   {
     * //     matchID: 'xyz',
     * //     gameName: 'tic-tac-toe',
     * //     players: [{ id: 0, name: 'Alice' }, { id: 1 }]
     * //   },
     * //   ...
     * // ]
     */
    async listMatches(gameName, where, init) {
        assertGameName(gameName);
        let query = '';
        if (where) {
            const queries = [];
            const { isGameover, updatedBefore, updatedAfter } = where;
            if (isGameover !== undefined)
                queries.push(`isGameover=${isGameover}`);
            if (updatedBefore)
                queries.push(`updatedBefore=${updatedBefore}`);
            if (updatedAfter)
                queries.push(`updatedAfter=${updatedAfter}`);
            if (queries.length > 0)
                query = '?' + queries.join('&');
        }
        return this.request(`/games/${gameName}${query}`, init);
    }
    /**
     * Get metadata for a specific match.
     * @param  gameName The match’s game type, e.g. 'tic-tac-toe'.
     * @param  matchID  Match ID for the match to fetch.
     * @param  init     Optional RequestInit interface to override defaults.
     * @return A match metadata object.
     *
     * @example
     * lobbyClient.getMatch('tic-tac-toe', 'xyz').then(console.log);
     * // => {
     * //   matchID: 'xyz',
     * //   gameName: 'tic-tac-toe',
     * //   players: [{ id: 0, name: 'Alice' }, { id: 1 }]
     * // }
     */
    async getMatch(gameName, matchID, init) {
        assertGameName(gameName);
        assertMatchID(matchID);
        return this.request(`/games/${gameName}/${matchID}`, init);
    }
    /**
     * Create a new match for a specific game type.
     * @param  gameName The game to create a match for, e.g. 'tic-tac-toe'.
     * @param  body     Options required to configure match creation.
     * @param  init     Optional RequestInit interface to override defaults.
     * @return An object containing the created `matchID`.
     *
     * @example
     * lobbyClient.createMatch('tic-tac-toe', { numPlayers: 2 })
     *   .then(console.log);
     * // => { matchID: 'xyz' }
     */
    async createMatch(gameName, body, init) {
        assertGameName(gameName);
        validateBody(body, { numPlayers: 'number' });
        return this.post(`/games/${gameName}/create`, { body, init });
    }
    /**
     * Join a match using its matchID.
     * @param  gameName The match’s game type, e.g. 'tic-tac-toe'.
     * @param  matchID  Match ID for the match to join.
     * @param  body     Options required to join match.
     * @param  init     Optional RequestInit interface to override defaults.
     * @return Object containing `playerCredentials` for the player who joined.
     *
     * @example
     * lobbyClient.joinMatch('tic-tac-toe', 'xyz', {
     *   playerID: '1',
     *   playerName: 'Bob',
     * }).then(console.log);
     * // => { playerID: '1', playerCredentials: 'random-string' }
     */
    async joinMatch(gameName, matchID, body, init) {
        assertGameName(gameName);
        assertMatchID(matchID);
        validateBody(body, {
            playerID: ['string', 'undefined'],
            playerName: 'string',
        });
        return this.post(`/games/${gameName}/${matchID}/join`, { body, init });
    }
    /**
     * Leave a previously joined match.
     * @param  gameName The match’s game type, e.g. 'tic-tac-toe'.
     * @param  matchID  Match ID for the match to leave.
     * @param  body     Options required to leave match.
     * @param  init     Optional RequestInit interface to override defaults.
     * @return Promise resolves if successful.
     *
     * @example
     * lobbyClient.leaveMatch('tic-tac-toe', 'xyz', {
     *   playerID: '1',
     *   credentials: 'credentials-returned-when-joining',
     * })
     *   .then(() => console.log('Left match.'))
     *   .catch(error => console.error('Error leaving match', error));
     */
    async leaveMatch(gameName, matchID, body, init) {
        assertGameName(gameName);
        assertMatchID(matchID);
        validateBody(body, { playerID: 'string', credentials: 'string' });
        await this.post(`/games/${gameName}/${matchID}/leave`, { body, init });
    }
    /**
     * Update a player’s name or custom metadata.
     * @param  gameName The match’s game type, e.g. 'tic-tac-toe'.
     * @param  matchID  Match ID for the match to update.
     * @param  body     Options required to update player.
     * @param  init     Optional RequestInit interface to override defaults.
     * @return Promise resolves if successful.
     *
     * @example
     * lobbyClient.updatePlayer('tic-tac-toe', 'xyz', {
     *   playerID: '0',
     *   credentials: 'credentials-returned-when-joining',
     *   newName: 'Al',
     * })
     *   .then(() => console.log('Updated player data.'))
     *   .catch(error => console.error('Error updating data', error));
     */
    async updatePlayer(gameName, matchID, body, init) {
        assertGameName(gameName);
        assertMatchID(matchID);
        validateBody(body, { playerID: 'string', credentials: 'string' });
        await this.post(`/games/${gameName}/${matchID}/update`, { body, init });
    }
    /**
     * Create a new match based on the configuration of the current match.
     * @param  gameName The match’s game type, e.g. 'tic-tac-toe'.
     * @param  matchID  Match ID for the match to play again.
     * @param  body     Options required to configure match.
     * @param  init     Optional RequestInit interface to override defaults.
     * @return Object containing `nextMatchID`.
     *
     * @example
     * lobbyClient.playAgain('tic-tac-toe', 'xyz', {
     *   playerID: '0',
     *   credentials: 'credentials-returned-when-joining',
     * })
     *   .then(({ nextMatchID }) => {
     *     return lobbyClient.joinMatch('tic-tac-toe', nextMatchID, {
     *       playerID: '0',
     *       playerName: 'Al',
     *     })
     *   })
     *   .then({ playerCredentials } => {
     *     console.log(playerCredentials);
     *   })
     *   .catch(console.error);
     */
    async playAgain(gameName, matchID, body, init) {
        assertGameName(gameName);
        assertMatchID(matchID);
        validateBody(body, { playerID: 'string', credentials: 'string' });
        return this.post(`/games/${gameName}/${matchID}/playAgain`, { body, init });
    }
}

exports.LobbyClient = LobbyClient;
exports.LobbyClientError = LobbyClientError;

},{}],10:[function(require,module,exports){
(function (process){(function (){
'use strict';

var nonSecure = require('nanoid/non-secure');
var Debug = require('./Debug-7b0fdc7a.js');
var redux = require('redux');
var turnOrder = require('./turn-order-8e019db0.js');
var reducer = require('./reducer-943f1bac.js');
var initialize = require('./initialize-45c7e6ee.js');
var transport = require('./transport-b1874dfa.js');

/**
 * This class doesn’t do anything, but simplifies the client class by providing
 * dummy functions to call, so we don’t need to mock them in the client.
 */
class DummyImpl extends transport.Transport {
    connect() { }
    disconnect() { }
    sendAction() { }
    sendChatMessage() { }
    requestSync() { }
    updateCredentials() { }
    updateMatchID() { }
    updatePlayerID() { }
}
const DummyTransport = (opts) => new DummyImpl(opts);

/**
 * Class to manage boardgame.io clients and limit debug panel rendering.
 */
class ClientManager {
    constructor() {
        this.debugPanel = null;
        this.currentClient = null;
        this.clients = new Map();
        this.subscribers = new Map();
    }
    /**
     * Register a client with the client manager.
     */
    register(client) {
        // Add client to clients map.
        this.clients.set(client, client);
        // Mount debug for this client (no-op if another debug is already mounted).
        this.mountDebug(client);
        this.notifySubscribers();
    }
    /**
     * Unregister a client from the client manager.
     */
    unregister(client) {
        // Remove client from clients map.
        this.clients.delete(client);
        if (this.currentClient === client) {
            // If the removed client owned the debug panel, unmount it.
            this.unmountDebug();
            // Mount debug panel for next available client.
            for (const [client] of this.clients) {
                if (this.debugPanel)
                    break;
                this.mountDebug(client);
            }
        }
        this.notifySubscribers();
    }
    /**
     * Subscribe to the client manager state.
     * Calls the passed callback each time the current client changes or a client
     * registers/unregisters.
     * Returns a function to unsubscribe from the state updates.
     */
    subscribe(callback) {
        const id = Symbol();
        this.subscribers.set(id, callback);
        callback(this.getState());
        return () => {
            this.subscribers.delete(id);
        };
    }
    /**
     * Switch to a client with a matching playerID.
     */
    switchPlayerID(playerID) {
        // For multiplayer clients, try switching control to a different client
        // that is using the same transport layer.
        if (this.currentClient.multiplayer) {
            for (const [client] of this.clients) {
                if (client.playerID === playerID &&
                    client.debugOpt !== false &&
                    client.multiplayer === this.currentClient.multiplayer) {
                    this.switchToClient(client);
                    return;
                }
            }
        }
        // If no client matches, update the playerID for the current client.
        this.currentClient.updatePlayerID(playerID);
        this.notifySubscribers();
    }
    /**
     * Set the passed client as the active client for debugging.
     */
    switchToClient(client) {
        if (client === this.currentClient)
            return;
        this.unmountDebug();
        this.mountDebug(client);
        this.notifySubscribers();
    }
    /**
     * Notify all subscribers of changes to the client manager state.
     */
    notifySubscribers() {
        const arg = this.getState();
        this.subscribers.forEach((cb) => {
            cb(arg);
        });
    }
    /**
     * Get the client manager state.
     */
    getState() {
        return {
            client: this.currentClient,
            debuggableClients: this.getDebuggableClients(),
        };
    }
    /**
     * Get an array of the registered clients that haven’t disabled the debug panel.
     */
    getDebuggableClients() {
        return [...this.clients.values()].filter((client) => client.debugOpt !== false);
    }
    /**
     * Mount the debug panel using the passed client.
     */
    mountDebug(client) {
        if (client.debugOpt === false ||
            this.debugPanel !== null ||
            typeof document === 'undefined') {
            return;
        }
        let DebugImpl;
        let target = document.body;
        if (process.env.NODE_ENV !== 'production') {
            DebugImpl = Debug.Debug;
        }
        if (client.debugOpt && client.debugOpt !== true) {
            DebugImpl = client.debugOpt.impl || DebugImpl;
            target = client.debugOpt.target || target;
        }
        if (DebugImpl) {
            this.currentClient = client;
            this.debugPanel = new DebugImpl({
                target,
                props: { clientManager: this },
            });
        }
    }
    /**
     * Unmount the debug panel.
     */
    unmountDebug() {
        this.debugPanel.$destroy();
        this.debugPanel = null;
        this.currentClient = null;
    }
}

/*
 * Copyright 2017 The boardgame.io Authors
 *
 * Use of this source code is governed by a MIT-style
 * license that can be found in the LICENSE file or at
 * https://opensource.org/licenses/MIT.
 */
/**
 * Global client manager instance that all clients register with.
 */
const GlobalClientManager = new ClientManager();
/**
 * Standardise the passed playerID, using currentPlayer if appropriate.
 */
function assumedPlayerID(playerID, store, multiplayer) {
    // In singleplayer mode, if the client does not have a playerID
    // associated with it, we attach the currentPlayer as playerID.
    if (!multiplayer && (playerID === null || playerID === undefined)) {
        const state = store.getState();
        playerID = state.ctx.currentPlayer;
    }
    return playerID;
}
/**
 * createDispatchers
 *
 * Create action dispatcher wrappers with bound playerID and credentials
 */
function createDispatchers(storeActionType, innerActionNames, store, playerID, credentials, multiplayer) {
    const dispatchers = {};
    for (const name of innerActionNames) {
        dispatchers[name] = (...args) => {
            const action = turnOrder.ActionCreators[storeActionType](name, args, assumedPlayerID(playerID, store, multiplayer), credentials);
            store.dispatch(action);
        };
    }
    return dispatchers;
}
// Creates a set of dispatchers to make moves.
const createMoveDispatchers = createDispatchers.bind(null, 'makeMove');
// Creates a set of dispatchers to dispatch game flow events.
const createEventDispatchers = createDispatchers.bind(null, 'gameEvent');
// Creates a set of dispatchers to dispatch actions to plugins.
const createPluginDispatchers = createDispatchers.bind(null, 'plugin');
/**
 * Implementation of Client (see below).
 */
class _ClientImpl {
    constructor({ game, debug, numPlayers, multiplayer, matchID: matchID, playerID, credentials, enhancer, }) {
        this.game = reducer.ProcessGameConfig(game);
        this.playerID = playerID;
        this.matchID = matchID || 'default';
        this.credentials = credentials;
        this.multiplayer = multiplayer;
        this.debugOpt = debug;
        this.manager = GlobalClientManager;
        this.gameStateOverride = null;
        this.subscribers = {};
        this._running = false;
        this.reducer = reducer.CreateGameReducer({
            game: this.game,
            isClient: multiplayer !== undefined,
        });
        this.initialState = null;
        if (!multiplayer) {
            this.initialState = initialize.InitializeGame({ game: this.game, numPlayers });
        }
        this.reset = () => {
            this.store.dispatch(turnOrder.reset(this.initialState));
        };
        this.undo = () => {
            const undo = turnOrder.undo(assumedPlayerID(this.playerID, this.store, this.multiplayer), this.credentials);
            this.store.dispatch(undo);
        };
        this.redo = () => {
            const redo = turnOrder.redo(assumedPlayerID(this.playerID, this.store, this.multiplayer), this.credentials);
            this.store.dispatch(redo);
        };
        this.log = [];
        /**
         * Middleware that manages the log object.
         * Reducers generate deltalogs, which are log events
         * that are the result of application of a single action.
         * The master may also send back a deltalog or the entire
         * log depending on the type of request.
         * The middleware below takes care of all these cases while
         * managing the log object.
         */
        const LogMiddleware = (store) => (next) => (action) => {
            const result = next(action);
            const state = store.getState();
            switch (action.type) {
                case turnOrder.MAKE_MOVE:
                case turnOrder.GAME_EVENT:
                case turnOrder.UNDO:
                case turnOrder.REDO: {
                    const deltalog = state.deltalog;
                    this.log = [...this.log, ...deltalog];
                    break;
                }
                case turnOrder.RESET: {
                    this.log = [];
                    break;
                }
                case turnOrder.PATCH:
                case turnOrder.UPDATE: {
                    let id = -1;
                    if (this.log.length > 0) {
                        id = this.log[this.log.length - 1]._stateID;
                    }
                    let deltalog = action.deltalog || [];
                    // Filter out actions that are already present
                    // in the current log. This may occur when the
                    // client adds an entry to the log followed by
                    // the update from the master here.
                    deltalog = deltalog.filter((l) => l._stateID > id);
                    this.log = [...this.log, ...deltalog];
                    break;
                }
                case turnOrder.SYNC: {
                    this.initialState = action.initialState;
                    this.log = action.log || [];
                    break;
                }
            }
            return result;
        };
        /**
         * Middleware that intercepts actions and sends them to the master,
         * which keeps the authoritative version of the state.
         */
        const TransportMiddleware = (store) => (next) => (action) => {
            const baseState = store.getState();
            const result = next(action);
            if (!('clientOnly' in action) &&
                action.type !== turnOrder.STRIP_TRANSIENTS) {
                this.transport.sendAction(baseState, action);
            }
            return result;
        };
        /**
         * Middleware that intercepts actions and invokes the subscription callback.
         */
        const SubscriptionMiddleware = () => (next) => (action) => {
            const result = next(action);
            this.notifySubscribers();
            return result;
        };
        const middleware = redux.applyMiddleware(reducer.TransientHandlingMiddleware, SubscriptionMiddleware, TransportMiddleware, LogMiddleware);
        enhancer =
            enhancer !== undefined ? redux.compose(middleware, enhancer) : middleware;
        this.store = redux.createStore(this.reducer, this.initialState, enhancer);
        if (!multiplayer)
            multiplayer = DummyTransport;
        this.transport = multiplayer({
            transportDataCallback: (data) => this.receiveTransportData(data),
            gameKey: game,
            game: this.game,
            matchID,
            playerID,
            credentials,
            gameName: this.game.name,
            numPlayers,
        });
        this.createDispatchers();
        this.chatMessages = [];
        this.sendChatMessage = (payload) => {
            this.transport.sendChatMessage(this.matchID, {
                id: nonSecure.nanoid(7),
                sender: this.playerID,
                payload: payload,
            });
        };
    }
    /** Handle incoming match data from a multiplayer transport. */
    receiveMatchData(matchData) {
        this.matchData = matchData;
        this.notifySubscribers();
    }
    /** Handle an incoming chat message from a multiplayer transport. */
    receiveChatMessage(message) {
        this.chatMessages = [...this.chatMessages, message];
        this.notifySubscribers();
    }
    /** Handle all incoming updates from a multiplayer transport. */
    receiveTransportData(data) {
        const [matchID] = data.args;
        if (matchID !== this.matchID)
            return;
        switch (data.type) {
            case 'sync': {
                const [, syncInfo] = data.args;
                const action = turnOrder.sync(syncInfo);
                this.receiveMatchData(syncInfo.filteredMetadata);
                this.store.dispatch(action);
                break;
            }
            case 'update': {
                const [, state, deltalog] = data.args;
                const currentState = this.store.getState();
                if (state._stateID >= currentState._stateID) {
                    const action = turnOrder.update(state, deltalog);
                    this.store.dispatch(action);
                }
                break;
            }
            case 'patch': {
                const [, prevStateID, stateID, patch, deltalog] = data.args;
                const currentStateID = this.store.getState()._stateID;
                if (prevStateID !== currentStateID)
                    break;
                const action = turnOrder.patch(prevStateID, stateID, patch, deltalog);
                this.store.dispatch(action);
                // Emit sync if patch apply failed.
                if (this.store.getState()._stateID === currentStateID) {
                    this.transport.requestSync();
                }
                break;
            }
            case 'matchData': {
                const [, matchData] = data.args;
                this.receiveMatchData(matchData);
                break;
            }
            case 'chat': {
                const [, chatMessage] = data.args;
                this.receiveChatMessage(chatMessage);
                break;
            }
        }
    }
    notifySubscribers() {
        Object.values(this.subscribers).forEach((fn) => fn(this.getState()));
    }
    overrideGameState(state) {
        this.gameStateOverride = state;
        this.notifySubscribers();
    }
    start() {
        this.transport.connect();
        this._running = true;
        this.manager.register(this);
    }
    stop() {
        this.transport.disconnect();
        this._running = false;
        this.manager.unregister(this);
    }
    subscribe(fn) {
        const id = Object.keys(this.subscribers).length;
        this.subscribers[id] = fn;
        this.transport.subscribeToConnectionStatus(() => this.notifySubscribers());
        if (this._running || !this.multiplayer) {
            fn(this.getState());
        }
        // Return a handle that allows the caller to unsubscribe.
        return () => {
            delete this.subscribers[id];
        };
    }
    getInitialState() {
        return this.initialState;
    }
    getState() {
        let state = this.store.getState();
        if (this.gameStateOverride !== null) {
            state = this.gameStateOverride;
        }
        // This is the state before a sync with the game master.
        if (state === null) {
            return state;
        }
        // isActive.
        let isActive = true;
        const isPlayerActive = this.game.flow.isPlayerActive(state.G, state.ctx, this.playerID);
        if (this.multiplayer && !isPlayerActive) {
            isActive = false;
        }
        if (!this.multiplayer &&
            this.playerID !== null &&
            this.playerID !== undefined &&
            !isPlayerActive) {
            isActive = false;
        }
        if (state.ctx.gameover !== undefined) {
            isActive = false;
        }
        // Secrets are normally stripped on the server,
        // but we also strip them here so that game developers
        // can see their effects while prototyping.
        // Do not strip again if this is a multiplayer game
        // since the server has already stripped secret info. (issue #818)
        if (!this.multiplayer) {
            state = {
                ...state,
                G: this.game.playerView(state.G, state.ctx, this.playerID),
                plugins: turnOrder.PlayerView(state, this),
            };
        }
        // Combine into return value.
        return {
            ...state,
            log: this.log,
            isActive,
            isConnected: this.transport.isConnected,
        };
    }
    createDispatchers() {
        this.moves = createMoveDispatchers(this.game.moveNames, this.store, this.playerID, this.credentials, this.multiplayer);
        this.events = createEventDispatchers(this.game.flow.enabledEventNames, this.store, this.playerID, this.credentials, this.multiplayer);
        this.plugins = createPluginDispatchers(this.game.pluginNames, this.store, this.playerID, this.credentials, this.multiplayer);
    }
    updatePlayerID(playerID) {
        this.playerID = playerID;
        this.createDispatchers();
        this.transport.updatePlayerID(playerID);
        this.notifySubscribers();
    }
    updateMatchID(matchID) {
        this.matchID = matchID;
        this.createDispatchers();
        this.transport.updateMatchID(matchID);
        this.notifySubscribers();
    }
    updateCredentials(credentials) {
        this.credentials = credentials;
        this.createDispatchers();
        this.transport.updateCredentials(credentials);
        this.notifySubscribers();
    }
}
/**
 * Client
 *
 * boardgame.io JS client.
 *
 * @param {...object} game - The return value of `Game`.
 * @param {...object} numPlayers - The number of players.
 * @param {...object} multiplayer - Set to a falsy value or a transportFactory, e.g., SocketIO()
 * @param {...object} matchID - The matchID that you want to connect to.
 * @param {...object} playerID - The playerID associated with this client.
 * @param {...string} credentials - The authentication credentials associated with this client.
 *
 * Returns:
 *   A JS object that provides an API to interact with the
 *   game by dispatching moves and events.
 */
function Client(opts) {
    return new _ClientImpl(opts);
}

exports.Client = Client;

}).call(this)}).call(this,require('_process'))
},{"./Debug-7b0fdc7a.js":7,"./initialize-45c7e6ee.js":12,"./reducer-943f1bac.js":17,"./transport-b1874dfa.js":18,"./turn-order-8e019db0.js":19,"_process":32,"nanoid/non-secure":28,"redux":33}],11:[function(require,module,exports){
'use strict';

var turnOrder = require('./turn-order-8e019db0.js');
var rfc6902 = require('rfc6902');

const applyPlayerView = (game, playerID, state) => ({
    ...state,
    G: game.playerView(state.G, state.ctx, playerID),
    plugins: turnOrder.PlayerView(state, { playerID, game }),
    deltalog: undefined,
    _undo: [],
    _redo: [],
});
/** Gets a function that filters the TransportData for a given player and game. */
const getFilterPlayerView = (game) => (playerID, payload) => {
    switch (payload.type) {
        case 'patch': {
            const [matchID, stateID, prevState, state] = payload.args;
            const log = redactLog(state.deltalog, playerID);
            const filteredState = applyPlayerView(game, playerID, state);
            const newStateID = state._stateID;
            const prevFilteredState = applyPlayerView(game, playerID, prevState);
            const patch = rfc6902.createPatch(prevFilteredState, filteredState);
            return {
                type: 'patch',
                args: [matchID, stateID, newStateID, patch, log],
            };
        }
        case 'update': {
            const [matchID, state] = payload.args;
            const log = redactLog(state.deltalog, playerID);
            const filteredState = applyPlayerView(game, playerID, state);
            return {
                type: 'update',
                args: [matchID, filteredState, log],
            };
        }
        case 'sync': {
            const [matchID, syncInfo] = payload.args;
            const filteredState = applyPlayerView(game, playerID, syncInfo.state);
            const log = redactLog(syncInfo.log, playerID);
            const newSyncInfo = {
                ...syncInfo,
                state: filteredState,
                log,
            };
            return {
                type: 'sync',
                args: [matchID, newSyncInfo],
            };
        }
        default: {
            return payload;
        }
    }
};
/**
 * Redact the log.
 *
 * @param {Array} log - The game log (or deltalog).
 * @param {String} playerID - The playerID that this log is
 *                            to be sent to.
 */
function redactLog(log, playerID) {
    if (log === undefined) {
        return log;
    }
    return log.map((logEvent) => {
        // filter for all other players and spectators.
        if (playerID !== null && +playerID === +logEvent.action.payload.playerID) {
            return logEvent;
        }
        if (logEvent.redact !== true) {
            return logEvent;
        }
        const payload = {
            ...logEvent.action.payload,
            args: null,
        };
        const filteredEvent = {
            ...logEvent,
            action: { ...logEvent.action, payload },
        };
        const { redact, ...remaining } = filteredEvent;
        return remaining;
    });
}

exports.getFilterPlayerView = getFilterPlayerView;

},{"./turn-order-8e019db0.js":19,"rfc6902":35}],12:[function(require,module,exports){
'use strict';

var turnOrder = require('./turn-order-8e019db0.js');
var reducer = require('./reducer-943f1bac.js');

/*
 * Copyright 2020 The boardgame.io Authors
 *
 * Use of this source code is governed by a MIT-style
 * license that can be found in the LICENSE file or at
 * https://opensource.org/licenses/MIT.
 */
/**
 * Creates the initial game state.
 */
function InitializeGame({ game, numPlayers, setupData, }) {
    game = reducer.ProcessGameConfig(game);
    if (!numPlayers) {
        numPlayers = 2;
    }
    const ctx = game.flow.ctx(numPlayers);
    let state = {
        // User managed state.
        G: {},
        // Framework managed state.
        ctx,
        // Plugin related state.
        plugins: {},
    };
    // Run plugins over initial state.
    state = turnOrder.Setup(state, { game });
    state = turnOrder.Enhance(state, { game, playerID: undefined });
    const enhancedCtx = turnOrder.EnhanceCtx(state);
    state.G = game.setup(enhancedCtx, setupData);
    let initial = {
        ...state,
        // List of {G, ctx} pairs that can be undone.
        _undo: [],
        // List of {G, ctx} pairs that can be redone.
        _redo: [],
        // A monotonically non-decreasing ID to ensure that
        // state updates are only allowed from clients that
        // are at the same version that the server.
        _stateID: 0,
    };
    initial = game.flow.init(initial);
    [initial] = turnOrder.FlushAndValidate(initial, { game });
    // Initialize undo stack.
    if (!game.disableUndo) {
        initial._undo = [
            {
                G: initial.G,
                ctx: initial.ctx,
                plugins: initial.plugins,
            },
        ];
    }
    return initial;
}

exports.InitializeGame = InitializeGame;

},{"./reducer-943f1bac.js":17,"./turn-order-8e019db0.js":19}],13:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

require('./turn-order-8e019db0.js');
require('immer');
require('./plugin-random-7425844d.js');
require('lodash.isplainobject');
var reducer = require('./reducer-943f1bac.js');
require('rfc6902');
var initialize = require('./initialize-45c7e6ee.js');
var transport = require('./transport-b1874dfa.js');
var util = require('./util-047daabc.js');
var filterPlayerView = require('./filter-player-view-0fd577a7.js');



exports.CreateGameReducer = reducer.CreateGameReducer;
exports.ProcessGameConfig = reducer.ProcessGameConfig;
exports.InitializeGame = initialize.InitializeGame;
exports.Transport = transport.Transport;
exports.Async = util.Async;
exports.Sync = util.Sync;
exports.createMatch = util.createMatch;
exports.getFilterPlayerView = filterPlayerView.getFilterPlayerView;

},{"./filter-player-view-0fd577a7.js":11,"./initialize-45c7e6ee.js":12,"./plugin-random-7425844d.js":16,"./reducer-943f1bac.js":17,"./transport-b1874dfa.js":18,"./turn-order-8e019db0.js":19,"./util-047daabc.js":20,"immer":26,"lodash.isplainobject":27,"rfc6902":35}],14:[function(require,module,exports){
'use strict';

var redux = require('redux');
var turnOrder = require('./turn-order-8e019db0.js');
var reducer = require('./reducer-943f1bac.js');
var util = require('./util-047daabc.js');

/*
 * Copyright 2018 The boardgame.io Authors
 *
 * Use of this source code is governed by a MIT-style
 * license that can be found in the LICENSE file or at
 * https://opensource.org/licenses/MIT.
 */
/**
 * Filter match data to get a player metadata object with credentials stripped.
 */
const filterMatchData = (matchData) => Object.values(matchData.players).map((player) => {
    const { credentials, ...filteredData } = player;
    return filteredData;
});
/**
 * Remove player credentials from action payload
 */
const stripCredentialsFromAction = (action) => {
    const { credentials, ...payload } = action.payload;
    return { ...action, payload };
};
/**
 * Master
 *
 * Class that runs the game and maintains the authoritative state.
 * It uses the transportAPI to communicate with clients and the
 * storageAPI to communicate with the database.
 */
class Master {
    constructor(game, storageAPI, transportAPI, auth) {
        this.game = reducer.ProcessGameConfig(game);
        this.storageAPI = storageAPI;
        this.transportAPI = transportAPI;
        this.subscribeCallback = () => { };
        this.auth = auth;
    }
    subscribe(fn) {
        this.subscribeCallback = fn;
    }
    /**
     * Called on each move / event made by the client.
     * Computes the new value of the game state and returns it
     * along with a deltalog.
     */
    async onUpdate(credAction, stateID, matchID, playerID) {
        if (!credAction || !credAction.payload) {
            return { error: 'missing action or action payload' };
        }
        let metadata;
        if (util.isSynchronous(this.storageAPI)) {
            ({ metadata } = this.storageAPI.fetch(matchID, { metadata: true }));
        }
        else {
            ({ metadata } = await this.storageAPI.fetch(matchID, { metadata: true }));
        }
        if (this.auth) {
            const isAuthentic = await this.auth.authenticateCredentials({
                playerID,
                credentials: credAction.payload.credentials,
                metadata,
            });
            if (!isAuthentic) {
                return { error: 'unauthorized action' };
            }
        }
        const action = stripCredentialsFromAction(credAction);
        const key = matchID;
        let state;
        if (util.isSynchronous(this.storageAPI)) {
            ({ state } = this.storageAPI.fetch(key, { state: true }));
        }
        else {
            ({ state } = await this.storageAPI.fetch(key, { state: true }));
        }
        if (state === undefined) {
            turnOrder.error(`game not found, matchID=[${key}]`);
            return { error: 'game not found' };
        }
        if (state.ctx.gameover !== undefined) {
            turnOrder.error(`game over - matchID=[${key}] - playerID=[${playerID}]` +
                ` - action[${action.payload.type}]`);
            return;
        }
        const reducer$1 = reducer.CreateGameReducer({
            game: this.game,
        });
        const middleware = redux.applyMiddleware(reducer.TransientHandlingMiddleware);
        const store = redux.createStore(reducer$1, state, middleware);
        // Only allow UNDO / REDO if there is exactly one player
        // that can make moves right now and the person doing the
        // action is that player.
        if (action.type == turnOrder.UNDO || action.type == turnOrder.REDO) {
            const hasActivePlayers = state.ctx.activePlayers !== null;
            const isCurrentPlayer = state.ctx.currentPlayer === playerID;
            if (
            // If activePlayers is empty, non-current players can’t undo.
            (!hasActivePlayers && !isCurrentPlayer) ||
                // If player is not active or multiple players are active, can’t undo.
                (hasActivePlayers &&
                    (state.ctx.activePlayers[playerID] === undefined ||
                        Object.keys(state.ctx.activePlayers).length > 1))) {
                turnOrder.error(`playerID=[${playerID}] cannot undo / redo right now`);
                return;
            }
        }
        // Check whether the player is active.
        if (!this.game.flow.isPlayerActive(state.G, state.ctx, playerID)) {
            turnOrder.error(`player not active - playerID=[${playerID}]` +
                ` - action[${action.payload.type}]`);
            return;
        }
        // Get move for further checks
        const move = action.type == turnOrder.MAKE_MOVE
            ? this.game.flow.getMove(state.ctx, action.payload.type, playerID)
            : null;
        // Check whether the player is allowed to make the move.
        if (action.type == turnOrder.MAKE_MOVE && !move) {
            turnOrder.error(`move not processed - canPlayerMakeMove=false - playerID=[${playerID}]` +
                ` - action[${action.payload.type}]`);
            return;
        }
        // Check if action's stateID is different than store's stateID
        // and if move does not have ignoreStaleStateID truthy.
        if (state._stateID !== stateID &&
            !(move && reducer.IsLongFormMove(move) && move.ignoreStaleStateID)) {
            turnOrder.error(`invalid stateID, was=[${stateID}], expected=[${state._stateID}]` +
                ` - playerID=[${playerID}] - action[${action.payload.type}]`);
            return;
        }
        const prevState = store.getState();
        // Update server's version of the store.
        store.dispatch(action);
        state = store.getState();
        this.subscribeCallback({
            state,
            action,
            matchID,
        });
        if (this.game.deltaState) {
            this.transportAPI.sendAll({
                type: 'patch',
                args: [matchID, stateID, prevState, state],
            });
        }
        else {
            this.transportAPI.sendAll({
                type: 'update',
                args: [matchID, state],
            });
        }
        const { deltalog, ...stateWithoutDeltalog } = state;
        let newMetadata;
        if (metadata &&
            (metadata.gameover === undefined || metadata.gameover === null)) {
            newMetadata = {
                ...metadata,
                updatedAt: Date.now(),
            };
            if (state.ctx.gameover !== undefined) {
                newMetadata.gameover = state.ctx.gameover;
            }
        }
        if (util.isSynchronous(this.storageAPI)) {
            this.storageAPI.setState(key, stateWithoutDeltalog, deltalog);
            if (newMetadata)
                this.storageAPI.setMetadata(key, newMetadata);
        }
        else {
            const writes = [
                this.storageAPI.setState(key, stateWithoutDeltalog, deltalog),
            ];
            if (newMetadata) {
                writes.push(this.storageAPI.setMetadata(key, newMetadata));
            }
            await Promise.all(writes);
        }
    }
    /**
     * Called when the client connects / reconnects.
     * Returns the latest game state and the entire log.
     */
    async onSync(matchID, playerID, credentials, numPlayers = 2) {
        const key = matchID;
        const fetchOpts = {
            state: true,
            metadata: true,
            log: true,
            initialState: true,
        };
        const fetchResult = util.isSynchronous(this.storageAPI)
            ? this.storageAPI.fetch(key, fetchOpts)
            : await this.storageAPI.fetch(key, fetchOpts);
        let { state, initialState, log, metadata } = fetchResult;
        if (this.auth && playerID !== undefined && playerID !== null) {
            const isAuthentic = await this.auth.authenticateCredentials({
                playerID,
                credentials,
                metadata,
            });
            if (!isAuthentic) {
                return { error: 'unauthorized' };
            }
        }
        // If the game doesn't exist, then create one on demand.
        // TODO: Move this out of the sync call.
        if (state === undefined) {
            const match = util.createMatch({
                game: this.game,
                unlisted: true,
                numPlayers,
                setupData: undefined,
            });
            if ('setupDataError' in match) {
                return { error: 'game requires setupData' };
            }
            initialState = state = match.initialState;
            metadata = match.metadata;
            this.subscribeCallback({ state, matchID });
            if (util.isSynchronous(this.storageAPI)) {
                this.storageAPI.createMatch(key, { initialState, metadata });
            }
            else {
                await this.storageAPI.createMatch(key, { initialState, metadata });
            }
        }
        const filteredMetadata = metadata ? filterMatchData(metadata) : undefined;
        const syncInfo = {
            state,
            log,
            filteredMetadata,
            initialState,
        };
        this.transportAPI.send({
            playerID,
            type: 'sync',
            args: [matchID, syncInfo],
        });
        return;
    }
    /**
     * Called when a client connects or disconnects.
     * Updates and sends out metadata to reflect the player’s connection status.
     */
    async onConnectionChange(matchID, playerID, credentials, connected) {
        const key = matchID;
        // Ignore changes for clients without a playerID, e.g. spectators.
        if (playerID === undefined || playerID === null) {
            return;
        }
        let metadata;
        if (util.isSynchronous(this.storageAPI)) {
            ({ metadata } = this.storageAPI.fetch(key, { metadata: true }));
        }
        else {
            ({ metadata } = await this.storageAPI.fetch(key, { metadata: true }));
        }
        if (metadata === undefined) {
            turnOrder.error(`metadata not found for matchID=[${key}]`);
            return { error: 'metadata not found' };
        }
        if (metadata.players[playerID] === undefined) {
            turnOrder.error(`Player not in the match, matchID=[${key}] playerID=[${playerID}]`);
            return { error: 'player not in the match' };
        }
        if (this.auth) {
            const isAuthentic = await this.auth.authenticateCredentials({
                playerID,
                credentials,
                metadata,
            });
            if (!isAuthentic) {
                return { error: 'unauthorized' };
            }
        }
        metadata.players[playerID].isConnected = connected;
        const filteredMetadata = filterMatchData(metadata);
        this.transportAPI.sendAll({
            type: 'matchData',
            args: [matchID, filteredMetadata],
        });
        if (util.isSynchronous(this.storageAPI)) {
            this.storageAPI.setMetadata(key, metadata);
        }
        else {
            await this.storageAPI.setMetadata(key, metadata);
        }
    }
    async onChatMessage(matchID, chatMessage, credentials) {
        const key = matchID;
        if (this.auth) {
            const { metadata } = await this.storageAPI.fetch(key, {
                metadata: true,
            });
            if (!(chatMessage && typeof chatMessage.sender === 'string')) {
                return { error: 'unauthorized' };
            }
            const isAuthentic = await this.auth.authenticateCredentials({
                playerID: chatMessage.sender,
                credentials,
                metadata,
            });
            if (!isAuthentic) {
                return { error: 'unauthorized' };
            }
        }
        this.transportAPI.sendAll({
            type: 'chat',
            args: [matchID, chatMessage],
        });
    }
}

exports.Master = Master;

},{"./reducer-943f1bac.js":17,"./turn-order-8e019db0.js":19,"./util-047daabc.js":20,"redux":33}],15:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

require('redux');
require('./turn-order-8e019db0.js');
require('immer');
require('./plugin-random-7425844d.js');
require('lodash.isplainobject');
require('./reducer-943f1bac.js');
require('rfc6902');
require('./initialize-45c7e6ee.js');
require('./util-047daabc.js');
var master = require('./master-b7f3ee7a.js');



exports.Master = master.Master;

},{"./initialize-45c7e6ee.js":12,"./master-b7f3ee7a.js":14,"./plugin-random-7425844d.js":16,"./reducer-943f1bac.js":17,"./turn-order-8e019db0.js":19,"./util-047daabc.js":20,"immer":26,"lodash.isplainobject":27,"redux":33,"rfc6902":35}],16:[function(require,module,exports){
'use strict';

// Inlined version of Alea from https://github.com/davidbau/seedrandom.
// Converted to Typescript October 2020.
class Alea {
    constructor(seed) {
        const mash = Mash();
        // Apply the seeding algorithm from Baagoe.
        this.c = 1;
        this.s0 = mash(' ');
        this.s1 = mash(' ');
        this.s2 = mash(' ');
        this.s0 -= mash(seed);
        if (this.s0 < 0) {
            this.s0 += 1;
        }
        this.s1 -= mash(seed);
        if (this.s1 < 0) {
            this.s1 += 1;
        }
        this.s2 -= mash(seed);
        if (this.s2 < 0) {
            this.s2 += 1;
        }
    }
    next() {
        const t = 2091639 * this.s0 + this.c * 2.3283064365386963e-10; // 2^-32
        this.s0 = this.s1;
        this.s1 = this.s2;
        return (this.s2 = t - (this.c = Math.trunc(t)));
    }
}
function Mash() {
    let n = 0xefc8249d;
    const mash = function (data) {
        const str = data.toString();
        for (let i = 0; i < str.length; i++) {
            n += str.charCodeAt(i);
            let h = 0.02519603282416938 * n;
            n = h >>> 0;
            h -= n;
            h *= n;
            n = h >>> 0;
            h -= n;
            n += h * 0x100000000; // 2^32
        }
        return (n >>> 0) * 2.3283064365386963e-10; // 2^-32
    };
    return mash;
}
function copy(f, t) {
    t.c = f.c;
    t.s0 = f.s0;
    t.s1 = f.s1;
    t.s2 = f.s2;
    return t;
}
function alea(seed, state) {
    const xg = new Alea(seed);
    const prng = xg.next.bind(xg);
    if (state)
        copy(state, xg);
    prng.state = () => copy(xg, {});
    return prng;
}

/*
 * Copyright 2017 The boardgame.io Authors
 *
 * Use of this source code is governed by a MIT-style
 * license that can be found in the LICENSE file or at
 * https://opensource.org/licenses/MIT.
 */
/**
 * Random
 *
 * Calls that require a pseudorandom number generator.
 * Uses a seed from ctx, and also persists the PRNG
 * state in ctx so that moves can stay pure.
 */
class Random {
    /**
     * constructor
     * @param {object} ctx - The ctx object to initialize from.
     */
    constructor(state) {
        // If we are on the client, the seed is not present.
        // Just use a temporary seed to execute the move without
        // crashing it. The move state itself is discarded,
        // so the actual value doesn't matter.
        this.state = state || { seed: '0' };
        this.used = false;
    }
    /**
     * Generates a new seed from the current date / time.
     */
    static seed() {
        return Date.now().toString(36).slice(-10);
    }
    isUsed() {
        return this.used;
    }
    getState() {
        return this.state;
    }
    /**
     * Generate a random number.
     */
    _random() {
        this.used = true;
        const R = this.state;
        const seed = R.prngstate ? '' : R.seed;
        const rand = alea(seed, R.prngstate);
        const number = rand();
        this.state = {
            ...R,
            prngstate: rand.state(),
        };
        return number;
    }
    api() {
        const random = this._random.bind(this);
        const SpotValue = {
            D4: 4,
            D6: 6,
            D8: 8,
            D10: 10,
            D12: 12,
            D20: 20,
        };
        // Generate functions for predefined dice values D4 - D20.
        const predefined = {};
        for (const key in SpotValue) {
            const spotvalue = SpotValue[key];
            predefined[key] = (diceCount) => {
                return diceCount === undefined
                    ? Math.floor(random() * spotvalue) + 1
                    : Array.from({ length: diceCount }).map(() => Math.floor(random() * spotvalue) + 1);
            };
        }
        function Die(spotvalue = 6, diceCount) {
            return diceCount === undefined
                ? Math.floor(random() * spotvalue) + 1
                : Array.from({ length: diceCount }).map(() => Math.floor(random() * spotvalue) + 1);
        }
        return {
            /**
             * Similar to Die below, but with fixed spot values.
             * Supports passing a diceCount
             *    if not defined, defaults to 1 and returns the value directly.
             *    if defined, returns an array containing the random dice values.
             *
             * D4: (diceCount) => value
             * D6: (diceCount) => value
             * D8: (diceCount) => value
             * D10: (diceCount) => value
             * D12: (diceCount) => value
             * D20: (diceCount) => value
             */
            ...predefined,
            /**
             * Roll a die of specified spot value.
             *
             * @param {number} spotvalue - The die dimension (default: 6).
             * @param {number} diceCount - number of dice to throw.
             *                             if not defined, defaults to 1 and returns the value directly.
             *                             if defined, returns an array containing the random dice values.
             */
            Die,
            /**
             * Generate a random number between 0 and 1.
             */
            Number: () => {
                return random();
            },
            /**
             * Shuffle an array.
             *
             * @param {Array} deck - The array to shuffle. Does not mutate
             *                       the input, but returns the shuffled array.
             */
            Shuffle: (deck) => {
                const clone = [...deck];
                let sourceIndex = deck.length;
                let destinationIndex = 0;
                const shuffled = Array.from({ length: sourceIndex });
                while (sourceIndex) {
                    const randomIndex = Math.trunc(sourceIndex * random());
                    shuffled[destinationIndex++] = clone[randomIndex];
                    clone[randomIndex] = clone[--sourceIndex];
                }
                return shuffled;
            },
            _private: this,
        };
    }
}

/*
 * Copyright 2018 The boardgame.io Authors
 *
 * Use of this source code is governed by a MIT-style
 * license that can be found in the LICENSE file or at
 * https://opensource.org/licenses/MIT.
 */
const RandomPlugin = {
    name: 'random',
    noClient: ({ api }) => {
        return api._private.isUsed();
    },
    flush: ({ api }) => {
        return api._private.getState();
    },
    api: ({ data }) => {
        const random = new Random(data);
        return random.api();
    },
    setup: ({ game }) => {
        let { seed } = game;
        if (seed === undefined) {
            seed = Random.seed();
        }
        return { seed };
    },
    playerView: () => undefined,
};

exports.RandomPlugin = RandomPlugin;
exports.alea = alea;

},{}],17:[function(require,module,exports){
'use strict';

var turnOrder = require('./turn-order-8e019db0.js');
var rfc6902 = require('rfc6902');

/*
 * Copyright 2017 The boardgame.io Authors
 *
 * Use of this source code is governed by a MIT-style
 * license that can be found in the LICENSE file or at
 * https://opensource.org/licenses/MIT.
 */
/**
 * Flow
 *
 * Creates a reducer that updates ctx (analogous to how moves update G).
 */
function Flow({ moves, phases, endIf, onEnd, turn, events, plugins, }) {
    // Attach defaults.
    if (moves === undefined) {
        moves = {};
    }
    if (events === undefined) {
        events = {};
    }
    if (plugins === undefined) {
        plugins = [];
    }
    if (phases === undefined) {
        phases = {};
    }
    if (!endIf)
        endIf = () => undefined;
    if (!onEnd)
        onEnd = (G) => G;
    if (!turn)
        turn = {};
    const phaseMap = { ...phases };
    if ('' in phaseMap) {
        turnOrder.error('cannot specify phase with empty name');
    }
    phaseMap[''] = {};
    const moveMap = {};
    const moveNames = new Set();
    let startingPhase = null;
    Object.keys(moves).forEach((name) => moveNames.add(name));
    const HookWrapper = (hook, hookType) => {
        const withPlugins = turnOrder.FnWrap(hook, hookType, plugins);
        return (state) => {
            const ctxWithAPI = turnOrder.EnhanceCtx(state);
            return withPlugins(state.G, ctxWithAPI);
        };
    };
    const TriggerWrapper = (trigger) => {
        return (state) => {
            const ctxWithAPI = turnOrder.EnhanceCtx(state);
            return trigger(state.G, ctxWithAPI);
        };
    };
    const wrapped = {
        onEnd: HookWrapper(onEnd, turnOrder.GameMethod.GAME_ON_END),
        endIf: TriggerWrapper(endIf),
    };
    for (const phase in phaseMap) {
        const phaseConfig = phaseMap[phase];
        if (phaseConfig.start === true) {
            startingPhase = phase;
        }
        if (phaseConfig.moves !== undefined) {
            for (const move of Object.keys(phaseConfig.moves)) {
                moveMap[phase + '.' + move] = phaseConfig.moves[move];
                moveNames.add(move);
            }
        }
        if (phaseConfig.endIf === undefined) {
            phaseConfig.endIf = () => undefined;
        }
        if (phaseConfig.onBegin === undefined) {
            phaseConfig.onBegin = (G) => G;
        }
        if (phaseConfig.onEnd === undefined) {
            phaseConfig.onEnd = (G) => G;
        }
        if (phaseConfig.turn === undefined) {
            phaseConfig.turn = turn;
        }
        if (phaseConfig.turn.order === undefined) {
            phaseConfig.turn.order = turnOrder.TurnOrder.DEFAULT;
        }
        if (phaseConfig.turn.onBegin === undefined) {
            phaseConfig.turn.onBegin = (G) => G;
        }
        if (phaseConfig.turn.onEnd === undefined) {
            phaseConfig.turn.onEnd = (G) => G;
        }
        if (phaseConfig.turn.endIf === undefined) {
            phaseConfig.turn.endIf = () => false;
        }
        if (phaseConfig.turn.onMove === undefined) {
            phaseConfig.turn.onMove = (G) => G;
        }
        if (phaseConfig.turn.stages === undefined) {
            phaseConfig.turn.stages = {};
        }
        // turns previously treated moveLimit as both minMoves and maxMoves, this behaviour is kept intentionally
        turnOrder.supportDeprecatedMoveLimit(phaseConfig.turn, true);
        for (const stage in phaseConfig.turn.stages) {
            const stageConfig = phaseConfig.turn.stages[stage];
            const moves = stageConfig.moves || {};
            for (const move of Object.keys(moves)) {
                const key = phase + '.' + stage + '.' + move;
                moveMap[key] = moves[move];
                moveNames.add(move);
            }
        }
        phaseConfig.wrapped = {
            onBegin: HookWrapper(phaseConfig.onBegin, turnOrder.GameMethod.PHASE_ON_BEGIN),
            onEnd: HookWrapper(phaseConfig.onEnd, turnOrder.GameMethod.PHASE_ON_END),
            endIf: TriggerWrapper(phaseConfig.endIf),
        };
        phaseConfig.turn.wrapped = {
            onMove: HookWrapper(phaseConfig.turn.onMove, turnOrder.GameMethod.TURN_ON_MOVE),
            onBegin: HookWrapper(phaseConfig.turn.onBegin, turnOrder.GameMethod.TURN_ON_BEGIN),
            onEnd: HookWrapper(phaseConfig.turn.onEnd, turnOrder.GameMethod.TURN_ON_END),
            endIf: TriggerWrapper(phaseConfig.turn.endIf),
        };
        if (typeof phaseConfig.next !== 'function') {
            const { next } = phaseConfig;
            phaseConfig.next = () => next || null;
        }
        phaseConfig.wrapped.next = TriggerWrapper(phaseConfig.next);
    }
    function GetPhase(ctx) {
        return ctx.phase ? phaseMap[ctx.phase] : phaseMap[''];
    }
    function OnMove(s) {
        return s;
    }
    function Process(state, events) {
        const phasesEnded = new Set();
        const turnsEnded = new Set();
        for (let i = 0; i < events.length; i++) {
            const { fn, arg, ...rest } = events[i];
            // Detect a loop of EndPhase calls.
            // This could potentially even be an infinite loop
            // if the endIf condition of each phase blindly
            // returns true. The moment we detect a single
            // loop, we just bail out of all phases.
            if (fn === EndPhase) {
                turnsEnded.clear();
                const phase = state.ctx.phase;
                if (phasesEnded.has(phase)) {
                    const ctx = { ...state.ctx, phase: null };
                    return { ...state, ctx };
                }
                phasesEnded.add(phase);
            }
            // Process event.
            const next = [];
            state = fn(state, {
                ...rest,
                arg,
                next,
            });
            if (fn === EndGame) {
                break;
            }
            // Check if we should end the game.
            const shouldEndGame = ShouldEndGame(state);
            if (shouldEndGame) {
                events.push({
                    fn: EndGame,
                    arg: shouldEndGame,
                    turn: state.ctx.turn,
                    phase: state.ctx.phase,
                    automatic: true,
                });
                continue;
            }
            // Check if we should end the phase.
            const shouldEndPhase = ShouldEndPhase(state);
            if (shouldEndPhase) {
                events.push({
                    fn: EndPhase,
                    arg: shouldEndPhase,
                    turn: state.ctx.turn,
                    phase: state.ctx.phase,
                    automatic: true,
                });
                continue;
            }
            // Check if we should end the turn.
            if ([OnMove, UpdateStage, UpdateActivePlayers].includes(fn)) {
                const shouldEndTurn = ShouldEndTurn(state);
                if (shouldEndTurn) {
                    events.push({
                        fn: EndTurn,
                        arg: shouldEndTurn,
                        turn: state.ctx.turn,
                        phase: state.ctx.phase,
                        automatic: true,
                    });
                    continue;
                }
            }
            events.push(...next);
        }
        return state;
    }
    ///////////
    // Start //
    ///////////
    function StartGame(state, { next }) {
        next.push({ fn: StartPhase });
        return state;
    }
    function StartPhase(state, { next }) {
        let { G, ctx } = state;
        const phaseConfig = GetPhase(ctx);
        // Run any phase setup code provided by the user.
        G = phaseConfig.wrapped.onBegin(state);
        next.push({ fn: StartTurn });
        return { ...state, G, ctx };
    }
    function StartTurn(state, { currentPlayer }) {
        let { ctx } = state;
        const phaseConfig = GetPhase(ctx);
        // Initialize the turn order state.
        if (currentPlayer) {
            ctx = { ...ctx, currentPlayer };
            if (phaseConfig.turn.activePlayers) {
                ctx = turnOrder.SetActivePlayers(ctx, phaseConfig.turn.activePlayers);
            }
        }
        else {
            // This is only called at the beginning of the phase
            // when there is no currentPlayer yet.
            ctx = turnOrder.InitTurnOrderState(state, phaseConfig.turn);
        }
        const turn = ctx.turn + 1;
        ctx = { ...ctx, turn, numMoves: 0, _prevActivePlayers: [] };
        const G = phaseConfig.turn.wrapped.onBegin({ ...state, ctx });
        return { ...state, G, ctx, _undo: [], _redo: [] };
    }
    ////////////
    // Update //
    ////////////
    function UpdatePhase(state, { arg, next, phase }) {
        const phaseConfig = GetPhase({ phase });
        let { ctx } = state;
        if (arg && arg.next) {
            if (arg.next in phaseMap) {
                ctx = { ...ctx, phase: arg.next };
            }
            else {
                turnOrder.error('invalid phase: ' + arg.next);
                return state;
            }
        }
        else {
            ctx = { ...ctx, phase: phaseConfig.wrapped.next(state) || null };
        }
        state = { ...state, ctx };
        // Start the new phase.
        next.push({ fn: StartPhase });
        return state;
    }
    function UpdateTurn(state, { arg, currentPlayer, next }) {
        let { G, ctx } = state;
        const phaseConfig = GetPhase(ctx);
        // Update turn order state.
        const { endPhase, ctx: newCtx } = turnOrder.UpdateTurnOrderState(state, currentPlayer, phaseConfig.turn, arg);
        ctx = newCtx;
        state = { ...state, G, ctx };
        if (endPhase) {
            next.push({ fn: EndPhase, turn: ctx.turn, phase: ctx.phase });
        }
        else {
            next.push({ fn: StartTurn, currentPlayer: ctx.currentPlayer });
        }
        return state;
    }
    function UpdateStage(state, { arg, playerID }) {
        if (typeof arg === 'string' || arg === turnOrder.Stage.NULL) {
            arg = { stage: arg };
        }
        if (typeof arg !== 'object')
            return state;
        // `arg` should be of type `StageArg`, loose typing as `any` here for historic reasons
        // stages previously did not enforce minMoves, this behaviour is kept intentionally
        turnOrder.supportDeprecatedMoveLimit(arg);
        let { ctx } = state;
        let { activePlayers, _activePlayersMinMoves, _activePlayersMaxMoves, _activePlayersNumMoves, } = ctx;
        // Checking if stage is valid, even Stage.NULL
        if (arg.stage !== undefined) {
            if (activePlayers === null) {
                activePlayers = {};
            }
            activePlayers[playerID] = arg.stage;
            _activePlayersNumMoves[playerID] = 0;
            if (arg.minMoves) {
                if (_activePlayersMinMoves === null) {
                    _activePlayersMinMoves = {};
                }
                _activePlayersMinMoves[playerID] = arg.minMoves;
            }
            if (arg.maxMoves) {
                if (_activePlayersMaxMoves === null) {
                    _activePlayersMaxMoves = {};
                }
                _activePlayersMaxMoves[playerID] = arg.maxMoves;
            }
        }
        ctx = {
            ...ctx,
            activePlayers,
            _activePlayersMinMoves,
            _activePlayersMaxMoves,
            _activePlayersNumMoves,
        };
        return { ...state, ctx };
    }
    function UpdateActivePlayers(state, { arg }) {
        return { ...state, ctx: turnOrder.SetActivePlayers(state.ctx, arg) };
    }
    ///////////////
    // ShouldEnd //
    ///////////////
    function ShouldEndGame(state) {
        return wrapped.endIf(state);
    }
    function ShouldEndPhase(state) {
        const phaseConfig = GetPhase(state.ctx);
        return phaseConfig.wrapped.endIf(state);
    }
    function ShouldEndTurn(state) {
        const phaseConfig = GetPhase(state.ctx);
        // End the turn if the required number of moves has been made.
        const currentPlayerMoves = state.ctx.numMoves || 0;
        if (phaseConfig.turn.maxMoves &&
            currentPlayerMoves >= phaseConfig.turn.maxMoves) {
            return true;
        }
        return phaseConfig.turn.wrapped.endIf(state);
    }
    /////////
    // End //
    /////////
    function EndGame(state, { arg, phase }) {
        state = EndPhase(state, { phase });
        if (arg === undefined) {
            arg = true;
        }
        state = { ...state, ctx: { ...state.ctx, gameover: arg } };
        // Run game end hook.
        const G = wrapped.onEnd(state);
        return { ...state, G };
    }
    function EndPhase(state, { arg, next, turn: initialTurn, automatic }) {
        // End the turn first.
        state = EndTurn(state, { turn: initialTurn, force: true, automatic: true });
        const { phase, turn } = state.ctx;
        if (next) {
            next.push({ fn: UpdatePhase, arg, phase });
        }
        // If we aren't in a phase, there is nothing else to do.
        if (phase === null) {
            return state;
        }
        // Run any cleanup code for the phase that is about to end.
        const phaseConfig = GetPhase(state.ctx);
        const G = phaseConfig.wrapped.onEnd(state);
        // Reset the phase.
        const ctx = { ...state.ctx, phase: null };
        // Add log entry.
        const action = turnOrder.gameEvent('endPhase', arg);
        const { _stateID } = state;
        const logEntry = { action, _stateID, turn, phase };
        if (automatic)
            logEntry.automatic = true;
        const deltalog = [...(state.deltalog || []), logEntry];
        return { ...state, G, ctx, deltalog };
    }
    function EndTurn(state, { arg, next, turn: initialTurn, force, automatic, playerID }) {
        // This is not the turn that EndTurn was originally
        // called for. The turn was probably ended some other way.
        if (initialTurn !== state.ctx.turn) {
            return state;
        }
        const { currentPlayer, numMoves, phase, turn } = state.ctx;
        const phaseConfig = GetPhase(state.ctx);
        // Prevent ending the turn if minMoves haven't been reached.
        const currentPlayerMoves = numMoves || 0;
        if (!force &&
            phaseConfig.turn.minMoves &&
            currentPlayerMoves < phaseConfig.turn.minMoves) {
            turnOrder.info(`cannot end turn before making ${phaseConfig.turn.minMoves} moves`);
            return state;
        }
        // Run turn-end triggers.
        const G = phaseConfig.turn.wrapped.onEnd(state);
        if (next) {
            next.push({ fn: UpdateTurn, arg, currentPlayer });
        }
        // Reset activePlayers.
        let ctx = { ...state.ctx, activePlayers: null };
        // Remove player from playerOrder
        if (arg && arg.remove) {
            playerID = playerID || currentPlayer;
            const playOrder = ctx.playOrder.filter((i) => i != playerID);
            const playOrderPos = ctx.playOrderPos > playOrder.length - 1 ? 0 : ctx.playOrderPos;
            ctx = { ...ctx, playOrder, playOrderPos };
            if (playOrder.length === 0) {
                next.push({ fn: EndPhase, turn, phase });
                return state;
            }
        }
        // Create log entry.
        const action = turnOrder.gameEvent('endTurn', arg);
        const { _stateID } = state;
        const logEntry = { action, _stateID, turn, phase };
        if (automatic)
            logEntry.automatic = true;
        const deltalog = [...(state.deltalog || []), logEntry];
        return { ...state, G, ctx, deltalog, _undo: [], _redo: [] };
    }
    function EndStage(state, { arg, next, automatic, playerID }) {
        playerID = playerID || state.ctx.currentPlayer;
        let { ctx, _stateID } = state;
        let { activePlayers, _activePlayersNumMoves, _activePlayersMinMoves, _activePlayersMaxMoves, phase, turn, } = ctx;
        const playerInStage = activePlayers !== null && playerID in activePlayers;
        const phaseConfig = GetPhase(ctx);
        if (!arg && playerInStage) {
            const stage = phaseConfig.turn.stages[activePlayers[playerID]];
            if (stage && stage.next) {
                arg = stage.next;
            }
        }
        // Checking if arg is a valid stage, even Stage.NULL
        if (next) {
            next.push({ fn: UpdateStage, arg, playerID });
        }
        // If player isn’t in a stage, there is nothing else to do.
        if (!playerInStage)
            return state;
        // Prevent ending the stage if minMoves haven't been reached.
        const currentPlayerMoves = _activePlayersNumMoves[playerID] || 0;
        if (_activePlayersMinMoves &&
            _activePlayersMinMoves[playerID] &&
            currentPlayerMoves < _activePlayersMinMoves[playerID]) {
            turnOrder.info(`cannot end stage before making ${_activePlayersMinMoves[playerID]} moves`);
            return state;
        }
        // Remove player from activePlayers.
        activePlayers = { ...activePlayers };
        delete activePlayers[playerID];
        if (_activePlayersMinMoves) {
            // Remove player from _activePlayersMinMoves.
            _activePlayersMinMoves = { ..._activePlayersMinMoves };
            delete _activePlayersMinMoves[playerID];
        }
        if (_activePlayersMaxMoves) {
            // Remove player from _activePlayersMaxMoves.
            _activePlayersMaxMoves = { ..._activePlayersMaxMoves };
            delete _activePlayersMaxMoves[playerID];
        }
        ctx = turnOrder.UpdateActivePlayersOnceEmpty({
            ...ctx,
            activePlayers,
            _activePlayersMinMoves,
            _activePlayersMaxMoves,
        });
        // Create log entry.
        const action = turnOrder.gameEvent('endStage', arg);
        const logEntry = { action, _stateID, turn, phase };
        if (automatic)
            logEntry.automatic = true;
        const deltalog = [...(state.deltalog || []), logEntry];
        return { ...state, ctx, deltalog };
    }
    /**
     * Retrieves the relevant move that can be played by playerID.
     *
     * If ctx.activePlayers is set (i.e. one or more players are in some stage),
     * then it attempts to find the move inside the stages config for
     * that turn. If the stage for a player is '', then the player is
     * allowed to make a move (as determined by the phase config), but
     * isn't restricted to a particular set as defined in the stage config.
     *
     * If not, it then looks for the move inside the phase.
     *
     * If it doesn't find the move there, it looks at the global move definition.
     *
     * @param {object} ctx
     * @param {string} name
     * @param {string} playerID
     */
    function GetMove(ctx, name, playerID) {
        const phaseConfig = GetPhase(ctx);
        const stages = phaseConfig.turn.stages;
        const { activePlayers } = ctx;
        if (activePlayers &&
            activePlayers[playerID] !== undefined &&
            activePlayers[playerID] !== turnOrder.Stage.NULL &&
            stages[activePlayers[playerID]] !== undefined &&
            stages[activePlayers[playerID]].moves !== undefined) {
            // Check if moves are defined for the player's stage.
            const stage = stages[activePlayers[playerID]];
            const moves = stage.moves;
            if (name in moves) {
                return moves[name];
            }
        }
        else if (phaseConfig.moves) {
            // Check if moves are defined for the current phase.
            if (name in phaseConfig.moves) {
                return phaseConfig.moves[name];
            }
        }
        else if (name in moves) {
            // Check for the move globally.
            return moves[name];
        }
        return null;
    }
    function ProcessMove(state, action) {
        const { playerID, type } = action;
        const { currentPlayer, activePlayers, _activePlayersMaxMoves } = state.ctx;
        const move = GetMove(state.ctx, type, playerID);
        const shouldCount = !move || typeof move === 'function' || move.noLimit !== true;
        let { numMoves, _activePlayersNumMoves } = state.ctx;
        if (shouldCount) {
            if (playerID === currentPlayer)
                numMoves++;
            if (activePlayers)
                _activePlayersNumMoves[playerID]++;
        }
        state = {
            ...state,
            ctx: {
                ...state.ctx,
                numMoves,
                _activePlayersNumMoves,
            },
        };
        if (_activePlayersMaxMoves &&
            _activePlayersNumMoves[playerID] >= _activePlayersMaxMoves[playerID]) {
            state = EndStage(state, { playerID, automatic: true });
        }
        const phaseConfig = GetPhase(state.ctx);
        const G = phaseConfig.turn.wrapped.onMove({
            ...state,
            ctx: { ...state.ctx, playerID },
        });
        state = { ...state, G };
        const events = [{ fn: OnMove }];
        return Process(state, events);
    }
    function SetStageEvent(state, playerID, arg) {
        return Process(state, [{ fn: EndStage, arg, playerID }]);
    }
    function EndStageEvent(state, playerID) {
        return Process(state, [{ fn: EndStage, playerID }]);
    }
    function SetActivePlayersEvent(state, _playerID, arg) {
        return Process(state, [{ fn: UpdateActivePlayers, arg }]);
    }
    function SetPhaseEvent(state, _playerID, newPhase) {
        return Process(state, [
            {
                fn: EndPhase,
                phase: state.ctx.phase,
                turn: state.ctx.turn,
                arg: { next: newPhase },
            },
        ]);
    }
    function EndPhaseEvent(state) {
        return Process(state, [
            { fn: EndPhase, phase: state.ctx.phase, turn: state.ctx.turn },
        ]);
    }
    function EndTurnEvent(state, _playerID, arg) {
        return Process(state, [
            { fn: EndTurn, turn: state.ctx.turn, phase: state.ctx.phase, arg },
        ]);
    }
    function PassEvent(state, _playerID, arg) {
        return Process(state, [
            {
                fn: EndTurn,
                turn: state.ctx.turn,
                phase: state.ctx.phase,
                force: true,
                arg,
            },
        ]);
    }
    function EndGameEvent(state, _playerID, arg) {
        return Process(state, [
            { fn: EndGame, turn: state.ctx.turn, phase: state.ctx.phase, arg },
        ]);
    }
    const eventHandlers = {
        endStage: EndStageEvent,
        setStage: SetStageEvent,
        endTurn: EndTurnEvent,
        pass: PassEvent,
        endPhase: EndPhaseEvent,
        setPhase: SetPhaseEvent,
        endGame: EndGameEvent,
        setActivePlayers: SetActivePlayersEvent,
    };
    const enabledEventNames = [];
    if (events.endTurn !== false) {
        enabledEventNames.push('endTurn');
    }
    if (events.pass !== false) {
        enabledEventNames.push('pass');
    }
    if (events.endPhase !== false) {
        enabledEventNames.push('endPhase');
    }
    if (events.setPhase !== false) {
        enabledEventNames.push('setPhase');
    }
    if (events.endGame !== false) {
        enabledEventNames.push('endGame');
    }
    if (events.setActivePlayers !== false) {
        enabledEventNames.push('setActivePlayers');
    }
    if (events.endStage !== false) {
        enabledEventNames.push('endStage');
    }
    if (events.setStage !== false) {
        enabledEventNames.push('setStage');
    }
    function ProcessEvent(state, action) {
        const { type, playerID, args } = action.payload;
        if (typeof eventHandlers[type] !== 'function')
            return state;
        return eventHandlers[type](state, playerID, ...(Array.isArray(args) ? args : [args]));
    }
    function IsPlayerActive(_G, ctx, playerID) {
        if (ctx.activePlayers) {
            return playerID in ctx.activePlayers;
        }
        return ctx.currentPlayer === playerID;
    }
    return {
        ctx: (numPlayers) => ({
            numPlayers,
            turn: 0,
            currentPlayer: '0',
            playOrder: [...Array.from({ length: numPlayers })].map((_, i) => i + ''),
            playOrderPos: 0,
            phase: startingPhase,
            activePlayers: null,
        }),
        init: (state) => {
            return Process(state, [{ fn: StartGame }]);
        },
        isPlayerActive: IsPlayerActive,
        eventHandlers,
        eventNames: Object.keys(eventHandlers),
        enabledEventNames,
        moveMap,
        moveNames: [...moveNames.values()],
        processMove: ProcessMove,
        processEvent: ProcessEvent,
        getMove: GetMove,
    };
}

/*
 * Copyright 2017 The boardgame.io Authors
 *
 * Use of this source code is governed by a MIT-style
 * license that can be found in the LICENSE file or at
 * https://opensource.org/licenses/MIT.
 */
function IsProcessed(game) {
    return game.processMove !== undefined;
}
/**
 * Helper to generate the game move reducer. The returned
 * reducer has the following signature:
 *
 * (G, action, ctx) => {}
 *
 * You can roll your own if you like, or use any Redux
 * addon to generate such a reducer.
 *
 * The convention used in this framework is to
 * have action.type contain the name of the move, and
 * action.args contain any additional arguments as an
 * Array.
 */
function ProcessGameConfig(game) {
    // The Game() function has already been called on this
    // config object, so just pass it through.
    if (IsProcessed(game)) {
        return game;
    }
    if (game.name === undefined)
        game.name = 'default';
    if (game.deltaState === undefined)
        game.deltaState = false;
    if (game.disableUndo === undefined)
        game.disableUndo = false;
    if (game.setup === undefined)
        game.setup = () => ({});
    if (game.moves === undefined)
        game.moves = {};
    if (game.playerView === undefined)
        game.playerView = (G) => G;
    if (game.plugins === undefined)
        game.plugins = [];
    game.plugins.forEach((plugin) => {
        if (plugin.name === undefined) {
            throw new Error('Plugin missing name attribute');
        }
        if (plugin.name.includes(' ')) {
            throw new Error(plugin.name + ': Plugin name must not include spaces');
        }
    });
    if (game.name.includes(' ')) {
        throw new Error(game.name + ': Game name must not include spaces');
    }
    const flow = Flow(game);
    return {
        ...game,
        flow,
        moveNames: flow.moveNames,
        pluginNames: game.plugins.map((p) => p.name),
        processMove: (state, action) => {
            let moveFn = flow.getMove(state.ctx, action.type, action.playerID);
            if (IsLongFormMove(moveFn)) {
                moveFn = moveFn.move;
            }
            if (moveFn instanceof Function) {
                const fn = turnOrder.FnWrap(moveFn, turnOrder.GameMethod.MOVE, game.plugins);
                const ctxWithAPI = {
                    ...turnOrder.EnhanceCtx(state),
                    playerID: action.playerID,
                };
                let args = [];
                if (action.args !== undefined) {
                    args = Array.isArray(action.args) ? action.args : [action.args];
                }
                return fn(state.G, ctxWithAPI, ...args);
            }
            turnOrder.error(`invalid move object: ${action.type}`);
            return state.G;
        },
    };
}
function IsLongFormMove(move) {
    return move instanceof Object && move.move !== undefined;
}

/*
 * Copyright 2017 The boardgame.io Authors
 *
 * Use of this source code is governed by a MIT-style
 * license that can be found in the LICENSE file or at
 * https://opensource.org/licenses/MIT.
 */
var UpdateErrorType;
(function (UpdateErrorType) {
    // The action’s credentials were missing or invalid
    UpdateErrorType["UnauthorizedAction"] = "update/unauthorized_action";
    // The action’s matchID was not found
    UpdateErrorType["MatchNotFound"] = "update/match_not_found";
    // Could not apply Patch operation (rfc6902).
    UpdateErrorType["PatchFailed"] = "update/patch_failed";
})(UpdateErrorType || (UpdateErrorType = {}));
var ActionErrorType;
(function (ActionErrorType) {
    // The action contained a stale state ID
    ActionErrorType["StaleStateId"] = "action/stale_state_id";
    // The requested move is unknown or not currently available
    ActionErrorType["UnavailableMove"] = "action/unavailable_move";
    // The move declared it was invalid (INVALID_MOVE constant)
    ActionErrorType["InvalidMove"] = "action/invalid_move";
    // The player making the action is not currently active
    ActionErrorType["InactivePlayer"] = "action/inactive_player";
    // The game has finished
    ActionErrorType["GameOver"] = "action/gameover";
    // The requested action is disabled (e.g. undo/redo, events)
    ActionErrorType["ActionDisabled"] = "action/action_disabled";
    // The requested action is not currently possible
    ActionErrorType["ActionInvalid"] = "action/action_invalid";
    // The requested action was declared invalid by a plugin
    ActionErrorType["PluginActionInvalid"] = "action/plugin_invalid";
})(ActionErrorType || (ActionErrorType = {}));

/*
 * Copyright 2017 The boardgame.io Authors
 *
 * Use of this source code is governed by a MIT-style
 * license that can be found in the LICENSE file or at
 * https://opensource.org/licenses/MIT.
 */
/**
 * Check if the payload for the passed action contains a playerID.
 */
const actionHasPlayerID = (action) => action.payload.playerID !== null && action.payload.playerID !== undefined;
/**
 * Returns true if a move can be undone.
 */
const CanUndoMove = (G, ctx, move) => {
    function HasUndoable(move) {
        return move.undoable !== undefined;
    }
    function IsFunction(undoable) {
        return undoable instanceof Function;
    }
    if (!HasUndoable(move)) {
        return true;
    }
    if (IsFunction(move.undoable)) {
        return move.undoable(G, ctx);
    }
    return move.undoable;
};
/**
 * Update the undo and redo stacks for a move or event.
 */
function updateUndoRedoState(state, opts) {
    if (opts.game.disableUndo)
        return state;
    const undoEntry = {
        G: state.G,
        ctx: state.ctx,
        plugins: state.plugins,
        playerID: opts.action.payload.playerID || state.ctx.currentPlayer,
    };
    if (opts.action.type === 'MAKE_MOVE') {
        undoEntry.moveType = opts.action.payload.type;
    }
    return {
        ...state,
        _undo: [...state._undo, undoEntry],
        // Always reset redo stack when making a move or event
        _redo: [],
    };
}
/**
 * Process state, adding the initial deltalog for this action.
 */
function initializeDeltalog(state, action, move) {
    // Create a log entry for this action.
    const logEntry = {
        action,
        _stateID: state._stateID,
        turn: state.ctx.turn,
        phase: state.ctx.phase,
    };
    const pluginLogMetadata = state.plugins.log.data.metadata;
    if (pluginLogMetadata !== undefined) {
        logEntry.metadata = pluginLogMetadata;
    }
    if (typeof move === 'object' && move.redact === true) {
        logEntry.redact = true;
    }
    return {
        ...state,
        deltalog: [logEntry],
    };
}
/**
 * Update plugin state after move/event & check if plugins consider the action to be valid.
 * @param state Current version of state in the reducer.
 * @param oldState State to revert to in case of error.
 * @param pluginOpts Plugin configuration options.
 * @returns Tuple of the new state updated after flushing plugins and the old
 * state augmented with an error if a plugin declared the action invalid.
 */
function flushAndValidatePlugins(state, oldState, pluginOpts) {
    const [newState, isInvalid] = turnOrder.FlushAndValidate(state, pluginOpts);
    if (!isInvalid)
        return [newState];
    return [
        newState,
        WithError(oldState, ActionErrorType.PluginActionInvalid, isInvalid),
    ];
}
/**
 * ExtractTransientsFromState
 *
 * Split out transients from the a TransientState
 */
function ExtractTransients(transientState) {
    if (!transientState) {
        // We preserve null for the state for legacy callers, but the transient
        // field should be undefined if not present to be consistent with the
        // code path below.
        return [null, undefined];
    }
    const { transients, ...state } = transientState;
    return [state, transients];
}
/**
 * WithError
 *
 * Augment a State instance with transient error information.
 */
function WithError(state, errorType, payload) {
    const error = {
        type: errorType,
        payload,
    };
    return {
        ...state,
        transients: {
            error,
        },
    };
}
/**
 * Middleware for processing TransientState associated with the reducer
 * returned by CreateGameReducer.
 * This should pretty much be used everywhere you want realistic state
 * transitions and error handling.
 */
const TransientHandlingMiddleware = (store) => (next) => (action) => {
    const result = next(action);
    switch (action.type) {
        case turnOrder.STRIP_TRANSIENTS: {
            return result;
        }
        default: {
            const [, transients] = ExtractTransients(store.getState());
            if (typeof transients !== 'undefined') {
                store.dispatch(turnOrder.stripTransients());
                // Dev Note: If parent middleware needs to correlate the spawned
                // StripTransients action to the triggering action, instrument here.
                //
                // This is a bit tricky; for more details, see:
                //   https://github.com/boardgameio/boardgame.io/pull/940#discussion_r636200648
                return {
                    ...result,
                    transients,
                };
            }
            return result;
        }
    }
};
/**
 * CreateGameReducer
 *
 * Creates the main game state reducer.
 */
function CreateGameReducer({ game, isClient, }) {
    game = ProcessGameConfig(game);
    /**
     * GameReducer
     *
     * Redux reducer that maintains the overall game state.
     * @param {object} state - The state before the action.
     * @param {object} action - A Redux action.
     */
    return (stateWithTransients = null, action) => {
        let [state /*, transients */] = ExtractTransients(stateWithTransients);
        switch (action.type) {
            case turnOrder.STRIP_TRANSIENTS: {
                // This action indicates that transient metadata in the state has been
                // consumed and should now be stripped from the state..
                return state;
            }
            case turnOrder.GAME_EVENT: {
                state = { ...state, deltalog: [] };
                // Process game events only on the server.
                // These events like `endTurn` typically
                // contain code that may rely on secret state
                // and cannot be computed on the client.
                if (isClient) {
                    return state;
                }
                // Disallow events once the game is over.
                if (state.ctx.gameover !== undefined) {
                    turnOrder.error(`cannot call event after game end`);
                    return WithError(state, ActionErrorType.GameOver);
                }
                // Ignore the event if the player isn't active.
                if (actionHasPlayerID(action) &&
                    !game.flow.isPlayerActive(state.G, state.ctx, action.payload.playerID)) {
                    turnOrder.error(`disallowed event: ${action.payload.type}`);
                    return WithError(state, ActionErrorType.InactivePlayer);
                }
                // Execute plugins.
                state = turnOrder.Enhance(state, {
                    game,
                    isClient: false,
                    playerID: action.payload.playerID,
                });
                // Process event.
                let newState = game.flow.processEvent(state, action);
                // Execute plugins.
                let stateWithError;
                [newState, stateWithError] = flushAndValidatePlugins(newState, state, {
                    game,
                    isClient: false,
                });
                if (stateWithError)
                    return stateWithError;
                // Update undo / redo state.
                newState = updateUndoRedoState(newState, { game, action });
                return { ...newState, _stateID: state._stateID + 1 };
            }
            case turnOrder.MAKE_MOVE: {
                const oldState = (state = { ...state, deltalog: [] });
                // Check whether the move is allowed at this time.
                const move = game.flow.getMove(state.ctx, action.payload.type, action.payload.playerID || state.ctx.currentPlayer);
                if (move === null) {
                    turnOrder.error(`disallowed move: ${action.payload.type}`);
                    return WithError(state, ActionErrorType.UnavailableMove);
                }
                // Don't run move on client if move says so.
                if (isClient && move.client === false) {
                    return state;
                }
                // Disallow moves once the game is over.
                if (state.ctx.gameover !== undefined) {
                    turnOrder.error(`cannot make move after game end`);
                    return WithError(state, ActionErrorType.GameOver);
                }
                // Ignore the move if the player isn't active.
                if (actionHasPlayerID(action) &&
                    !game.flow.isPlayerActive(state.G, state.ctx, action.payload.playerID)) {
                    turnOrder.error(`disallowed move: ${action.payload.type}`);
                    return WithError(state, ActionErrorType.InactivePlayer);
                }
                // Execute plugins.
                state = turnOrder.Enhance(state, {
                    game,
                    isClient,
                    playerID: action.payload.playerID,
                });
                // Process the move.
                const G = game.processMove(state, action.payload);
                // The game declared the move as invalid.
                if (G === turnOrder.INVALID_MOVE) {
                    turnOrder.error(`invalid move: ${action.payload.type} args: ${action.payload.args}`);
                    // TODO(#723): Marshal a nice error payload with the processed move.
                    return WithError(state, ActionErrorType.InvalidMove);
                }
                const newState = { ...state, G };
                // Some plugin indicated that it is not suitable to be
                // materialized on the client (and must wait for the server
                // response instead).
                if (isClient && turnOrder.NoClient(newState, { game })) {
                    return state;
                }
                state = newState;
                // If we're on the client, just process the move
                // and no triggers in multiplayer mode.
                // These will be processed on the server, which
                // will send back a state update.
                if (isClient) {
                    let stateWithError;
                    [state, stateWithError] = flushAndValidatePlugins(state, oldState, {
                        game,
                        isClient: true,
                    });
                    if (stateWithError)
                        return stateWithError;
                    return {
                        ...state,
                        _stateID: state._stateID + 1,
                    };
                }
                // On the server, construct the deltalog.
                state = initializeDeltalog(state, action, move);
                // Allow the flow reducer to process any triggers that happen after moves.
                state = game.flow.processMove(state, action.payload);
                let stateWithError;
                [state, stateWithError] = flushAndValidatePlugins(state, oldState, {
                    game,
                });
                if (stateWithError)
                    return stateWithError;
                // Update undo / redo state.
                state = updateUndoRedoState(state, { game, action });
                return {
                    ...state,
                    _stateID: state._stateID + 1,
                };
            }
            case turnOrder.RESET:
            case turnOrder.UPDATE:
            case turnOrder.SYNC: {
                return action.state;
            }
            case turnOrder.UNDO: {
                state = { ...state, deltalog: [] };
                if (game.disableUndo) {
                    turnOrder.error('Undo is not enabled');
                    return WithError(state, ActionErrorType.ActionDisabled);
                }
                const { G, ctx, _undo, _redo, _stateID } = state;
                if (_undo.length < 2) {
                    turnOrder.error(`No moves to undo`);
                    return WithError(state, ActionErrorType.ActionInvalid);
                }
                const last = _undo[_undo.length - 1];
                const restore = _undo[_undo.length - 2];
                // Only allow players to undo their own moves.
                if (actionHasPlayerID(action) &&
                    action.payload.playerID !== last.playerID) {
                    turnOrder.error(`Cannot undo other players' moves`);
                    return WithError(state, ActionErrorType.ActionInvalid);
                }
                // If undoing a move, check it is undoable.
                if (last.moveType) {
                    const lastMove = game.flow.getMove(restore.ctx, last.moveType, last.playerID);
                    if (!CanUndoMove(G, ctx, lastMove)) {
                        turnOrder.error(`Move cannot be undone`);
                        return WithError(state, ActionErrorType.ActionInvalid);
                    }
                }
                state = initializeDeltalog(state, action);
                return {
                    ...state,
                    G: restore.G,
                    ctx: restore.ctx,
                    plugins: restore.plugins,
                    _stateID: _stateID + 1,
                    _undo: _undo.slice(0, -1),
                    _redo: [last, ..._redo],
                };
            }
            case turnOrder.REDO: {
                state = { ...state, deltalog: [] };
                if (game.disableUndo) {
                    turnOrder.error('Redo is not enabled');
                    return WithError(state, ActionErrorType.ActionDisabled);
                }
                const { _undo, _redo, _stateID } = state;
                if (_redo.length === 0) {
                    turnOrder.error(`No moves to redo`);
                    return WithError(state, ActionErrorType.ActionInvalid);
                }
                const first = _redo[0];
                // Only allow players to redo their own undos.
                if (actionHasPlayerID(action) &&
                    action.payload.playerID !== first.playerID) {
                    turnOrder.error(`Cannot redo other players' moves`);
                    return WithError(state, ActionErrorType.ActionInvalid);
                }
                state = initializeDeltalog(state, action);
                return {
                    ...state,
                    G: first.G,
                    ctx: first.ctx,
                    plugins: first.plugins,
                    _stateID: _stateID + 1,
                    _undo: [..._undo, first],
                    _redo: _redo.slice(1),
                };
            }
            case turnOrder.PLUGIN: {
                // TODO(#723): Expose error semantics to plugin processing.
                return turnOrder.ProcessAction(state, action, { game });
            }
            case turnOrder.PATCH: {
                const oldState = state;
                const newState = JSON.parse(JSON.stringify(oldState));
                const patchError = rfc6902.applyPatch(newState, action.patch);
                const hasError = patchError.some((entry) => entry !== null);
                if (hasError) {
                    turnOrder.error(`Patch ${JSON.stringify(action.patch)} apply failed`);
                    return WithError(oldState, UpdateErrorType.PatchFailed, patchError);
                }
                else {
                    return newState;
                }
            }
            default: {
                return state;
            }
        }
    };
}

exports.CreateGameReducer = CreateGameReducer;
exports.IsLongFormMove = IsLongFormMove;
exports.ProcessGameConfig = ProcessGameConfig;
exports.TransientHandlingMiddleware = TransientHandlingMiddleware;

},{"./turn-order-8e019db0.js":19,"rfc6902":35}],18:[function(require,module,exports){
'use strict';

/*
 * Copyright 2017 The boardgame.io Authors
 *
 * Use of this source code is governed by a MIT-style
 * license that can be found in the LICENSE file or at
 * https://opensource.org/licenses/MIT.
 */
class Transport {
    constructor({ transportDataCallback, gameName, playerID, matchID, credentials, numPlayers, }) {
        /** Callback to let the client know when the connection status has changed. */
        this.connectionStatusCallback = () => { };
        this.isConnected = false;
        this.transportDataCallback = transportDataCallback;
        this.gameName = gameName || 'default';
        this.playerID = playerID || null;
        this.matchID = matchID || 'default';
        this.credentials = credentials;
        this.numPlayers = numPlayers || 2;
    }
    /** Subscribe to connection state changes. */
    subscribeToConnectionStatus(fn) {
        this.connectionStatusCallback = fn;
    }
    /** Transport implementations should call this when they connect/disconnect. */
    setConnectionStatus(isConnected) {
        this.isConnected = isConnected;
        this.connectionStatusCallback();
    }
    /** Transport implementations should call this when they receive data from a master. */
    notifyClient(data) {
        this.transportDataCallback(data);
    }
}

exports.Transport = Transport;

},{}],19:[function(require,module,exports){
(function (process){(function (){
'use strict';

function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

var produce = _interopDefault(require('immer'));
var pluginRandom = require('./plugin-random-7425844d.js');
var isPlainObject = _interopDefault(require('lodash.isplainobject'));

/*
 * Copyright 2017 The boardgame.io Authors
 *
 * Use of this source code is governed by a MIT-style
 * license that can be found in the LICENSE file or at
 * https://opensource.org/licenses/MIT.
 */
const MAKE_MOVE = 'MAKE_MOVE';
const GAME_EVENT = 'GAME_EVENT';
const REDO = 'REDO';
const RESET = 'RESET';
const SYNC = 'SYNC';
const UNDO = 'UNDO';
const UPDATE = 'UPDATE';
const PATCH = 'PATCH';
const PLUGIN = 'PLUGIN';
const STRIP_TRANSIENTS = 'STRIP_TRANSIENTS';

/*
 * Copyright 2017 The boardgame.io Authors
 *
 * Use of this source code is governed by a MIT-style
 * license that can be found in the LICENSE file or at
 * https://opensource.org/licenses/MIT.
 */
/**
 * Generate a move to be dispatched to the game move reducer.
 *
 * @param {string} type - The move type.
 * @param {Array}  args - Additional arguments.
 * @param {string}  playerID - The ID of the player making this action.
 * @param {string}  credentials - (optional) The credentials for the player making this action.
 */
const makeMove = (type, args, playerID, credentials) => ({
    type: MAKE_MOVE,
    payload: { type, args, playerID, credentials },
});
/**
 * Generate a game event to be dispatched to the flow reducer.
 *
 * @param {string} type - The event type.
 * @param {Array}  args - Additional arguments.
 * @param {string}  playerID - The ID of the player making this action.
 * @param {string}  credentials - (optional) The credentials for the player making this action.
 */
const gameEvent = (type, args, playerID, credentials) => ({
    type: GAME_EVENT,
    payload: { type, args, playerID, credentials },
});
/**
 * Generate an automatic game event that is a side-effect of a move.
 * @param {string} type - The event type.
 * @param {Array}  args - Additional arguments.
 * @param {string}  playerID - The ID of the player making this action.
 * @param {string}  credentials - (optional) The credentials for the player making this action.
 */
const automaticGameEvent = (type, args, playerID, credentials) => ({
    type: GAME_EVENT,
    payload: { type, args, playerID, credentials },
    automatic: true,
});
const sync = (info) => ({
    type: SYNC,
    state: info.state,
    log: info.log,
    initialState: info.initialState,
    clientOnly: true,
});
/**
 * Used to update the Redux store's state with patch in response to
 * an action coming from another player.
 * @param prevStateID previous stateID
 * @param stateID stateID after this patch
 * @param {Operation[]} patch - The patch to apply.
 * @param {LogEntry[]} deltalog - A log delta.
 */
const patch = (prevStateID, stateID, patch, deltalog) => ({
    type: PATCH,
    prevStateID,
    stateID,
    patch,
    deltalog,
    clientOnly: true,
});
/**
 * Used to update the Redux store's state in response to
 * an action coming from another player.
 * @param {object} state - The state to restore.
 * @param {Array} deltalog - A log delta.
 */
const update = (state, deltalog) => ({
    type: UPDATE,
    state,
    deltalog,
    clientOnly: true,
});
/**
 * Used to reset the game state.
 * @param {object} state - The initial state.
 */
const reset = (state) => ({
    type: RESET,
    state,
    clientOnly: true,
});
/**
 * Used to undo the last move.
 * @param {string}  playerID - The ID of the player making this action.
 * @param {string}  credentials - (optional) The credentials for the player making this action.
 */
const undo = (playerID, credentials) => ({
    type: UNDO,
    payload: { type: null, args: null, playerID, credentials },
});
/**
 * Used to redo the last undone move.
 * @param {string}  playerID - The ID of the player making this action.
 * @param {string}  credentials - (optional) The credentials for the player making this action.
 */
const redo = (playerID, credentials) => ({
    type: REDO,
    payload: { type: null, args: null, playerID, credentials },
});
/**
 * Allows plugins to define their own actions and intercept them.
 */
const plugin = (type, args, playerID, credentials) => ({
    type: PLUGIN,
    payload: { type, args, playerID, credentials },
});
/**
 * Private action used to strip transient metadata (e.g. errors) from the game
 * state.
 */
const stripTransients = () => ({
    type: STRIP_TRANSIENTS,
});

var ActionCreators = /*#__PURE__*/Object.freeze({
  __proto__: null,
  makeMove: makeMove,
  gameEvent: gameEvent,
  automaticGameEvent: automaticGameEvent,
  sync: sync,
  patch: patch,
  update: update,
  reset: reset,
  undo: undo,
  redo: redo,
  plugin: plugin,
  stripTransients: stripTransients
});

/**
 * Moves can return this when they want to indicate
 * that the combination of arguments is illegal and
 * the move ought to be discarded.
 */
const INVALID_MOVE = 'INVALID_MOVE';

/*
 * Copyright 2018 The boardgame.io Authors
 *
 * Use of this source code is governed by a MIT-style
 * license that can be found in the LICENSE file or at
 * https://opensource.org/licenses/MIT.
 */
/**
 * Plugin that allows using Immer to make immutable changes
 * to G by just mutating it.
 */
const ImmerPlugin = {
    name: 'plugin-immer',
    fnWrap: (move) => (G, ctx, ...args) => {
        let isInvalid = false;
        const newG = produce(G, (G) => {
            const result = move(G, ctx, ...args);
            if (result === INVALID_MOVE) {
                isInvalid = true;
                return;
            }
            return result;
        });
        if (isInvalid)
            return INVALID_MOVE;
        return newG;
    },
};

(function (GameMethod) {
    GameMethod["MOVE"] = "MOVE";
    GameMethod["GAME_ON_END"] = "GAME_ON_END";
    GameMethod["PHASE_ON_BEGIN"] = "PHASE_ON_BEGIN";
    GameMethod["PHASE_ON_END"] = "PHASE_ON_END";
    GameMethod["TURN_ON_BEGIN"] = "TURN_ON_BEGIN";
    GameMethod["TURN_ON_MOVE"] = "TURN_ON_MOVE";
    GameMethod["TURN_ON_END"] = "TURN_ON_END";
})(exports.GameMethod || (exports.GameMethod = {}));

/*
 * Copyright 2018 The boardgame.io Authors
 *
 * Use of this source code is governed by a MIT-style
 * license that can be found in the LICENSE file or at
 * https://opensource.org/licenses/MIT.
 */
var Errors;
(function (Errors) {
    Errors["CalledOutsideHook"] = "Events must be called from moves or the `onBegin`, `onEnd`, and `onMove` hooks.\nThis error probably means you called an event from other game code, like an `endIf` trigger or one of the `turn.order` methods.";
    Errors["EndTurnInOnEnd"] = "`endTurn` is disallowed in `onEnd` hooks \u2014 the turn is already ending.";
    Errors["MaxTurnEndings"] = "Maximum number of turn endings exceeded for this update.\nThis likely means game code is triggering an infinite loop.";
    Errors["PhaseEventInOnEnd"] = "`setPhase` & `endPhase` are disallowed in a phase\u2019s `onEnd` hook \u2014 the phase is already ending.\nIf you\u2019re trying to dynamically choose the next phase when a phase ends, use the phase\u2019s `next` trigger.";
    Errors["StageEventInOnEnd"] = "`setStage`, `endStage` & `setActivePlayers` are disallowed in `onEnd` hooks.";
    Errors["StageEventInPhaseBegin"] = "`setStage`, `endStage` & `setActivePlayers` are disallowed in a phase\u2019s `onBegin` hook.\nUse `setActivePlayers` in a `turn.onBegin` hook or declare stages with `turn.activePlayers` instead.";
    Errors["StageEventInTurnBegin"] = "`setStage` & `endStage` are disallowed in `turn.onBegin`.\nUse `setActivePlayers` or declare stages with `turn.activePlayers` instead.";
})(Errors || (Errors = {}));
/**
 * Events
 */
class Events {
    constructor(flow, ctx, playerID) {
        this.flow = flow;
        this.playerID = playerID;
        this.dispatch = [];
        this.initialTurn = ctx.turn;
        this.updateTurnContext(ctx, undefined);
        // This is an arbitrarily large upper threshold, which could be made
        // configurable via a game option if the need arises.
        this.maxEndedTurnsPerAction = ctx.numPlayers * 100;
    }
    api() {
        const events = {
            _private: this,
        };
        for (const type of this.flow.eventNames) {
            events[type] = (...args) => {
                this.dispatch.push({
                    type,
                    args,
                    phase: this.currentPhase,
                    turn: this.currentTurn,
                    calledFrom: this.currentMethod,
                    // Used to capture a stack trace in case it is needed later.
                    error: new Error('Events Plugin Error'),
                });
            };
        }
        return events;
    }
    isUsed() {
        return this.dispatch.length > 0;
    }
    updateTurnContext(ctx, methodType) {
        this.currentPhase = ctx.phase;
        this.currentTurn = ctx.turn;
        this.currentMethod = methodType;
    }
    unsetCurrentMethod() {
        this.currentMethod = undefined;
    }
    /**
     * Updates ctx with the triggered events.
     * @param {object} state - The state object { G, ctx }.
     */
    update(state) {
        const initialState = state;
        const stateWithError = ({ stack }, message) => ({
            ...initialState,
            plugins: {
                ...initialState.plugins,
                events: {
                    ...initialState.plugins.events,
                    data: { error: message + '\n' + stack },
                },
            },
        });
        EventQueue: for (let i = 0; i < this.dispatch.length; i++) {
            const event = this.dispatch[i];
            const turnHasEnded = event.turn !== state.ctx.turn;
            // This protects against potential infinite loops if specific events are called on hooks.
            // The moment we exceed the defined threshold, we just bail out of all phases.
            const endedTurns = this.currentTurn - this.initialTurn;
            if (endedTurns >= this.maxEndedTurnsPerAction) {
                return stateWithError(event.error, Errors.MaxTurnEndings);
            }
            if (event.calledFrom === undefined) {
                return stateWithError(event.error, Errors.CalledOutsideHook);
            }
            // Stop processing events once the game has finished.
            if (state.ctx.gameover)
                break EventQueue;
            switch (event.type) {
                case 'endStage':
                case 'setStage':
                case 'setActivePlayers': {
                    switch (event.calledFrom) {
                        // Disallow all stage events in onEnd and phase.onBegin hooks.
                        case exports.GameMethod.TURN_ON_END:
                        case exports.GameMethod.PHASE_ON_END:
                            return stateWithError(event.error, Errors.StageEventInOnEnd);
                        case exports.GameMethod.PHASE_ON_BEGIN:
                            return stateWithError(event.error, Errors.StageEventInPhaseBegin);
                        // Disallow setStage & endStage in turn.onBegin hooks.
                        case exports.GameMethod.TURN_ON_BEGIN:
                            if (event.type === 'setActivePlayers')
                                break;
                            return stateWithError(event.error, Errors.StageEventInTurnBegin);
                    }
                    // If the turn already ended, don't try to process stage events.
                    if (turnHasEnded)
                        continue EventQueue;
                    break;
                }
                case 'endTurn': {
                    if (event.calledFrom === exports.GameMethod.TURN_ON_END ||
                        event.calledFrom === exports.GameMethod.PHASE_ON_END) {
                        return stateWithError(event.error, Errors.EndTurnInOnEnd);
                    }
                    // If the turn already ended some other way,
                    // don't try to end the turn again.
                    if (turnHasEnded)
                        continue EventQueue;
                    break;
                }
                case 'endPhase':
                case 'setPhase': {
                    if (event.calledFrom === exports.GameMethod.PHASE_ON_END) {
                        return stateWithError(event.error, Errors.PhaseEventInOnEnd);
                    }
                    // If the phase already ended some other way,
                    // don't try to end the phase again.
                    if (event.phase !== state.ctx.phase)
                        continue EventQueue;
                    break;
                }
            }
            const action = automaticGameEvent(event.type, event.args, this.playerID);
            state = this.flow.processEvent(state, action);
        }
        return state;
    }
}

/*
 * Copyright 2020 The boardgame.io Authors
 *
 * Use of this source code is governed by a MIT-style
 * license that can be found in the LICENSE file or at
 * https://opensource.org/licenses/MIT.
 */
const EventsPlugin = {
    name: 'events',
    noClient: ({ api }) => api._private.isUsed(),
    isInvalid: ({ data }) => data.error || false,
    // Update the events plugin’s internal turn context each time a move
    // or hook is called. This allows events called after turn or phase
    // endings to dispatch the current turn and phase correctly.
    fnWrap: (method, methodType) => (G, ctx, ...args) => {
        const api = ctx.events;
        if (api)
            api._private.updateTurnContext(ctx, methodType);
        G = method(G, ctx, ...args);
        if (api)
            api._private.unsetCurrentMethod();
        return G;
    },
    dangerouslyFlushRawState: ({ state, api }) => api._private.update(state),
    api: ({ game, ctx, playerID }) => new Events(game.flow, ctx, playerID).api(),
};

/*
 * Copyright 2018 The boardgame.io Authors
 *
 * Use of this source code is governed by a MIT-style
 * license that can be found in the LICENSE file or at
 * https://opensource.org/licenses/MIT.
 */
/**
 * Plugin that makes it possible to add metadata to log entries.
 * During a move, you can set metadata using ctx.log.setMetadata and it will be
 * available on the log entry for that move.
 */
const LogPlugin = {
    name: 'log',
    flush: () => ({}),
    api: ({ data }) => {
        return {
            setMetadata: (metadata) => {
                data.metadata = metadata;
            },
        };
    },
    setup: () => ({}),
};

/**
 * Check if a value can be serialized (e.g. using `JSON.stringify`).
 * Adapted from: https://stackoverflow.com/a/30712764/3829557
 */
function isSerializable(value) {
    // Primitives are OK.
    if (value === undefined ||
        value === null ||
        typeof value === 'boolean' ||
        typeof value === 'number' ||
        typeof value === 'string') {
        return true;
    }
    // A non-primitive value that is neither a POJO or an array cannot be serialized.
    if (!isPlainObject(value) && !Array.isArray(value)) {
        return false;
    }
    // Recurse entries if the value is an object or array.
    for (const key in value) {
        if (!isSerializable(value[key]))
            return false;
    }
    return true;
}
/**
 * Plugin that checks whether state is serializable, in order to avoid
 * network serialization bugs.
 */
const SerializablePlugin = {
    name: 'plugin-serializable',
    fnWrap: (move) => (G, ctx, ...args) => {
        const result = move(G, ctx, ...args);
        // Check state in non-production environments.
        if (process.env.NODE_ENV !== 'production' && !isSerializable(result)) {
            throw new Error('Move state is not JSON-serialiazable.\n' +
                'See https://boardgame.io/documentation/#/?id=state for more information.');
        }
        return result;
    },
};

/*
 * Copyright 2018 The boardgame.io Authors
 *
 * Use of this source code is governed by a MIT-style
 * license that can be found in the LICENSE file or at
 * https://opensource.org/licenses/MIT.
 */
const production = process.env.NODE_ENV === 'production';
const logfn = production ? () => { } : (...msg) => console.log(...msg);
const errorfn = (...msg) => console.error(...msg);
function info(msg) {
    logfn(`INFO: ${msg}`);
}
function error(error) {
    errorfn('ERROR:', error);
}

/*
 * Copyright 2018 The boardgame.io Authors
 *
 * Use of this source code is governed by a MIT-style
 * license that can be found in the LICENSE file or at
 * https://opensource.org/licenses/MIT.
 */
/**
 * List of plugins that are always added.
 */
const CORE_PLUGINS = [ImmerPlugin, pluginRandom.RandomPlugin, LogPlugin, SerializablePlugin];
const DEFAULT_PLUGINS = [...CORE_PLUGINS, EventsPlugin];
/**
 * Allow plugins to intercept actions and process them.
 */
const ProcessAction = (state, action, opts) => {
    // TODO(#723): Extend error handling to plugins.
    opts.game.plugins
        .filter((plugin) => plugin.action !== undefined)
        .filter((plugin) => plugin.name === action.payload.type)
        .forEach((plugin) => {
        const name = plugin.name;
        const pluginState = state.plugins[name] || { data: {} };
        const data = plugin.action(pluginState.data, action.payload);
        state = {
            ...state,
            plugins: {
                ...state.plugins,
                [name]: { ...pluginState, data },
            },
        };
    });
    return state;
};
/**
 * The API's created by various plugins are stored in the plugins
 * section of the state object:
 *
 * {
 *   G: {},
 *   ctx: {},
 *   plugins: {
 *     plugin-a: {
 *       data: {},  // this is generated by the plugin at Setup / Flush.
 *       api: {},   // this is ephemeral and generated by Enhance.
 *     }
 *   }
 * }
 *
 * This function takes these API's and stuffs them back into
 * ctx for consumption inside a move function or hook.
 */
const EnhanceCtx = (state) => {
    const ctx = { ...state.ctx };
    const plugins = state.plugins || {};
    Object.entries(plugins).forEach(([name, { api }]) => {
        ctx[name] = api;
    });
    return ctx;
};
/**
 * Applies the provided plugins to the given move / flow function.
 *
 * @param methodToWrap - The move function or hook to apply the plugins to.
 * @param methodType - The type of the move or hook being wrapped.
 * @param plugins - The list of plugins.
 */
const FnWrap = (methodToWrap, methodType, plugins) => {
    return [...CORE_PLUGINS, ...plugins, EventsPlugin]
        .filter((plugin) => plugin.fnWrap !== undefined)
        .reduce((method, { fnWrap }) => fnWrap(method, methodType), methodToWrap);
};
/**
 * Allows the plugin to generate its initial state.
 */
const Setup = (state, opts) => {
    [...DEFAULT_PLUGINS, ...opts.game.plugins]
        .filter((plugin) => plugin.setup !== undefined)
        .forEach((plugin) => {
        const name = plugin.name;
        const data = plugin.setup({
            G: state.G,
            ctx: state.ctx,
            game: opts.game,
        });
        state = {
            ...state,
            plugins: {
                ...state.plugins,
                [name]: { data },
            },
        };
    });
    return state;
};
/**
 * Invokes the plugin before a move or event.
 * The API that the plugin generates is stored inside
 * the `plugins` section of the state (which is subsequently
 * merged into ctx).
 */
const Enhance = (state, opts) => {
    [...DEFAULT_PLUGINS, ...opts.game.plugins]
        .filter((plugin) => plugin.api !== undefined)
        .forEach((plugin) => {
        const name = plugin.name;
        const pluginState = state.plugins[name] || { data: {} };
        const api = plugin.api({
            G: state.G,
            ctx: state.ctx,
            data: pluginState.data,
            game: opts.game,
            playerID: opts.playerID,
        });
        state = {
            ...state,
            plugins: {
                ...state.plugins,
                [name]: { ...pluginState, api },
            },
        };
    });
    return state;
};
/**
 * Allows plugins to update their state after a move / event.
 */
const Flush = (state, opts) => {
    // We flush the events plugin first, then custom plugins and the core plugins.
    // This means custom plugins cannot use the events API but will be available in event hooks.
    // Note that plugins are flushed in reverse, to allow custom plugins calling each other.
    [...CORE_PLUGINS, ...opts.game.plugins, EventsPlugin]
        .reverse()
        .forEach((plugin) => {
        const name = plugin.name;
        const pluginState = state.plugins[name] || { data: {} };
        if (plugin.flush) {
            const newData = plugin.flush({
                G: state.G,
                ctx: state.ctx,
                game: opts.game,
                api: pluginState.api,
                data: pluginState.data,
            });
            state = {
                ...state,
                plugins: {
                    ...state.plugins,
                    [plugin.name]: { data: newData },
                },
            };
        }
        else if (plugin.dangerouslyFlushRawState) {
            state = plugin.dangerouslyFlushRawState({
                state,
                game: opts.game,
                api: pluginState.api,
                data: pluginState.data,
            });
            // Remove everything other than data.
            const data = state.plugins[name].data;
            state = {
                ...state,
                plugins: {
                    ...state.plugins,
                    [plugin.name]: { data },
                },
            };
        }
    });
    return state;
};
/**
 * Allows plugins to indicate if they should not be materialized on the client.
 * This will cause the client to discard the state update and wait for the
 * master instead.
 */
const NoClient = (state, opts) => {
    return [...DEFAULT_PLUGINS, ...opts.game.plugins]
        .filter((plugin) => plugin.noClient !== undefined)
        .map((plugin) => {
        const name = plugin.name;
        const pluginState = state.plugins[name];
        if (pluginState) {
            return plugin.noClient({
                G: state.G,
                ctx: state.ctx,
                game: opts.game,
                api: pluginState.api,
                data: pluginState.data,
            });
        }
        return false;
    })
        .includes(true);
};
/**
 * Allows plugins to indicate if the entire action should be thrown out
 * as invalid. This will cancel the entire state update.
 */
const IsInvalid = (state, opts) => {
    const firstInvalidReturn = [...DEFAULT_PLUGINS, ...opts.game.plugins]
        .filter((plugin) => plugin.isInvalid !== undefined)
        .map((plugin) => {
        const { name } = plugin;
        const pluginState = state.plugins[name];
        const message = plugin.isInvalid({
            G: state.G,
            ctx: state.ctx,
            game: opts.game,
            data: pluginState && pluginState.data,
        });
        return message ? { plugin: name, message } : false;
    })
        .find((value) => value);
    return firstInvalidReturn || false;
};
/**
 * Update plugin state after move/event & check if plugins consider the update to be valid.
 * @returns Tuple of `[updatedState]` or `[originalState, invalidError]`.
 */
const FlushAndValidate = (state, opts) => {
    const updatedState = Flush(state, opts);
    const isInvalid = IsInvalid(updatedState, opts);
    if (!isInvalid)
        return [updatedState];
    const { plugin, message } = isInvalid;
    error(`${plugin} plugin declared action invalid:\n${message}`);
    return [state, isInvalid];
};
/**
 * Allows plugins to customize their data for specific players.
 * For example, a plugin may want to share no data with the client, or
 * want to keep some player data secret from opponents.
 */
const PlayerView = ({ G, ctx, plugins = {} }, { game, playerID }) => {
    [...DEFAULT_PLUGINS, ...game.plugins].forEach(({ name, playerView }) => {
        if (!playerView)
            return;
        const { data } = plugins[name] || { data: {} };
        const newData = playerView({ G, ctx, game, data, playerID });
        plugins = {
            ...plugins,
            [name]: { data: newData },
        };
    });
    return plugins;
};

/**
 * Adjust the given options to use the new minMoves/maxMoves if a legacy moveLimit was given
 * @param options The options object to apply backwards compatibility to
 * @param enforceMinMoves Use moveLimit to set both minMoves and maxMoves
 */
function supportDeprecatedMoveLimit(options, enforceMinMoves = false) {
    if (options.moveLimit) {
        if (enforceMinMoves) {
            options.minMoves = options.moveLimit;
        }
        options.maxMoves = options.moveLimit;
        delete options.moveLimit;
    }
}

/*
 * Copyright 2017 The boardgame.io Authors
 *
 * Use of this source code is governed by a MIT-style
 * license that can be found in the LICENSE file or at
 * https://opensource.org/licenses/MIT.
 */
function SetActivePlayers(ctx, arg) {
    let activePlayers = {};
    let _prevActivePlayers = [];
    let _nextActivePlayers = null;
    let _activePlayersMinMoves = {};
    let _activePlayersMaxMoves = {};
    if (Array.isArray(arg)) {
        // support a simple array of player IDs as active players
        const value = {};
        arg.forEach((v) => (value[v] = Stage.NULL));
        activePlayers = value;
    }
    else {
        // process active players argument object
        // stages previously did not enforce minMoves, this behaviour is kept intentionally
        supportDeprecatedMoveLimit(arg);
        if (arg.next) {
            _nextActivePlayers = arg.next;
        }
        if (arg.revert) {
            _prevActivePlayers = [
                ...ctx._prevActivePlayers,
                {
                    activePlayers: ctx.activePlayers,
                    _activePlayersMinMoves: ctx._activePlayersMinMoves,
                    _activePlayersMaxMoves: ctx._activePlayersMaxMoves,
                    _activePlayersNumMoves: ctx._activePlayersNumMoves,
                },
            ];
        }
        if (arg.currentPlayer !== undefined) {
            ApplyActivePlayerArgument(activePlayers, _activePlayersMinMoves, _activePlayersMaxMoves, ctx.currentPlayer, arg.currentPlayer);
        }
        if (arg.others !== undefined) {
            for (let i = 0; i < ctx.playOrder.length; i++) {
                const id = ctx.playOrder[i];
                if (id !== ctx.currentPlayer) {
                    ApplyActivePlayerArgument(activePlayers, _activePlayersMinMoves, _activePlayersMaxMoves, id, arg.others);
                }
            }
        }
        if (arg.all !== undefined) {
            for (let i = 0; i < ctx.playOrder.length; i++) {
                const id = ctx.playOrder[i];
                ApplyActivePlayerArgument(activePlayers, _activePlayersMinMoves, _activePlayersMaxMoves, id, arg.all);
            }
        }
        if (arg.value) {
            for (const id in arg.value) {
                ApplyActivePlayerArgument(activePlayers, _activePlayersMinMoves, _activePlayersMaxMoves, id, arg.value[id]);
            }
        }
        if (arg.minMoves) {
            for (const id in activePlayers) {
                if (_activePlayersMinMoves[id] === undefined) {
                    _activePlayersMinMoves[id] = arg.minMoves;
                }
            }
        }
        if (arg.maxMoves) {
            for (const id in activePlayers) {
                if (_activePlayersMaxMoves[id] === undefined) {
                    _activePlayersMaxMoves[id] = arg.maxMoves;
                }
            }
        }
    }
    if (Object.keys(activePlayers).length === 0) {
        activePlayers = null;
    }
    if (Object.keys(_activePlayersMinMoves).length === 0) {
        _activePlayersMinMoves = null;
    }
    if (Object.keys(_activePlayersMaxMoves).length === 0) {
        _activePlayersMaxMoves = null;
    }
    const _activePlayersNumMoves = {};
    for (const id in activePlayers) {
        _activePlayersNumMoves[id] = 0;
    }
    return {
        ...ctx,
        activePlayers,
        _activePlayersMinMoves,
        _activePlayersMaxMoves,
        _activePlayersNumMoves,
        _prevActivePlayers,
        _nextActivePlayers,
    };
}
/**
 * Update activePlayers, setting it to previous, next or null values
 * when it becomes empty.
 * @param ctx
 */
function UpdateActivePlayersOnceEmpty(ctx) {
    let { activePlayers, _activePlayersMinMoves, _activePlayersMaxMoves, _activePlayersNumMoves, _prevActivePlayers, _nextActivePlayers, } = ctx;
    if (activePlayers && Object.keys(activePlayers).length === 0) {
        if (_nextActivePlayers) {
            ctx = SetActivePlayers(ctx, _nextActivePlayers);
            ({
                activePlayers,
                _activePlayersMinMoves,
                _activePlayersMaxMoves,
                _activePlayersNumMoves,
                _prevActivePlayers,
            } = ctx);
        }
        else if (_prevActivePlayers.length > 0) {
            const lastIndex = _prevActivePlayers.length - 1;
            ({
                activePlayers,
                _activePlayersMinMoves,
                _activePlayersMaxMoves,
                _activePlayersNumMoves,
            } = _prevActivePlayers[lastIndex]);
            _prevActivePlayers = _prevActivePlayers.slice(0, lastIndex);
        }
        else {
            activePlayers = null;
            _activePlayersMinMoves = null;
            _activePlayersMaxMoves = null;
        }
    }
    return {
        ...ctx,
        activePlayers,
        _activePlayersMinMoves,
        _activePlayersMaxMoves,
        _activePlayersNumMoves,
        _prevActivePlayers,
    };
}
/**
 * Apply an active player argument to the given player ID
 * @param {Object} activePlayers
 * @param {Object} _activePlayersMinMoves
 * @param {Object} _activePlayersMaxMoves
 * @param {String} playerID The player to apply the parameter to
 * @param {(String|Object)} arg An active player argument
 */
function ApplyActivePlayerArgument(activePlayers, _activePlayersMinMoves, _activePlayersMaxMoves, playerID, arg) {
    if (typeof arg !== 'object' || arg === Stage.NULL) {
        arg = { stage: arg };
    }
    if (arg.stage !== undefined) {
        // stages previously did not enforce minMoves, this behaviour is kept intentionally
        supportDeprecatedMoveLimit(arg);
        activePlayers[playerID] = arg.stage;
        if (arg.minMoves)
            _activePlayersMinMoves[playerID] = arg.minMoves;
        if (arg.maxMoves)
            _activePlayersMaxMoves[playerID] = arg.maxMoves;
    }
}
/**
 * Converts a playOrderPos index into its value in playOrder.
 * @param {Array} playOrder - An array of player ID's.
 * @param {number} playOrderPos - An index into the above.
 */
function getCurrentPlayer(playOrder, playOrderPos) {
    // convert to string in case playOrder is set to number[]
    return playOrder[playOrderPos] + '';
}
/**
 * Called at the start of a turn to initialize turn order state.
 *
 * TODO: This is called inside StartTurn, which is called from
 * both UpdateTurn and StartPhase (so it's called at the beginning
 * of a new phase as well as between turns). We should probably
 * split it into two.
 */
function InitTurnOrderState(state, turn) {
    let { G, ctx } = state;
    const { numPlayers } = ctx;
    const ctxWithAPI = EnhanceCtx(state);
    const order = turn.order;
    let playOrder = [...Array.from({ length: numPlayers })].map((_, i) => i + '');
    if (order.playOrder !== undefined) {
        playOrder = order.playOrder(G, ctxWithAPI);
    }
    const playOrderPos = order.first(G, ctxWithAPI);
    const posType = typeof playOrderPos;
    if (posType !== 'number') {
        error(`invalid value returned by turn.order.first — expected number got ${posType} “${playOrderPos}”.`);
    }
    const currentPlayer = getCurrentPlayer(playOrder, playOrderPos);
    ctx = { ...ctx, currentPlayer, playOrderPos, playOrder };
    ctx = SetActivePlayers(ctx, turn.activePlayers || {});
    return ctx;
}
/**
 * Called at the end of each turn to update the turn order state.
 * @param {object} G - The game object G.
 * @param {object} ctx - The game object ctx.
 * @param {object} turn - A turn object for this phase.
 * @param {string} endTurnArg - An optional argument to endTurn that
                                may specify the next player.
 */
function UpdateTurnOrderState(state, currentPlayer, turn, endTurnArg) {
    const order = turn.order;
    let { G, ctx } = state;
    let playOrderPos = ctx.playOrderPos;
    let endPhase = false;
    if (endTurnArg && endTurnArg !== true) {
        if (typeof endTurnArg !== 'object') {
            error(`invalid argument to endTurn: ${endTurnArg}`);
        }
        Object.keys(endTurnArg).forEach((arg) => {
            switch (arg) {
                case 'remove':
                    currentPlayer = getCurrentPlayer(ctx.playOrder, playOrderPos);
                    break;
                case 'next':
                    playOrderPos = ctx.playOrder.indexOf(endTurnArg.next);
                    currentPlayer = endTurnArg.next;
                    break;
                default:
                    error(`invalid argument to endTurn: ${arg}`);
            }
        });
    }
    else {
        const ctxWithAPI = EnhanceCtx(state);
        const t = order.next(G, ctxWithAPI);
        const type = typeof t;
        if (t !== undefined && type !== 'number') {
            error(`invalid value returned by turn.order.next — expected number or undefined got ${type} “${t}”.`);
        }
        if (t === undefined) {
            endPhase = true;
        }
        else {
            playOrderPos = t;
            currentPlayer = getCurrentPlayer(ctx.playOrder, playOrderPos);
        }
    }
    ctx = {
        ...ctx,
        playOrderPos,
        currentPlayer,
    };
    return { endPhase, ctx };
}
/**
 * Set of different turn orders possible in a phase.
 * These are meant to be passed to the `turn` setting
 * in the flow objects.
 *
 * Each object defines the first player when the phase / game
 * begins, and also a function `next` to determine who the
 * next player is when the turn ends.
 *
 * The phase ends if next() returns undefined.
 */
const TurnOrder = {
    /**
     * DEFAULT
     *
     * The default round-robin turn order.
     */
    DEFAULT: {
        first: (G, ctx) => ctx.turn === 0
            ? ctx.playOrderPos
            : (ctx.playOrderPos + 1) % ctx.playOrder.length,
        next: (G, ctx) => (ctx.playOrderPos + 1) % ctx.playOrder.length,
    },
    /**
     * RESET
     *
     * Similar to DEFAULT, but starts from 0 each time.
     */
    RESET: {
        first: () => 0,
        next: (G, ctx) => (ctx.playOrderPos + 1) % ctx.playOrder.length,
    },
    /**
     * CONTINUE
     *
     * Similar to DEFAULT, but starts with the player who ended the last phase.
     */
    CONTINUE: {
        first: (G, ctx) => ctx.playOrderPos,
        next: (G, ctx) => (ctx.playOrderPos + 1) % ctx.playOrder.length,
    },
    /**
     * ONCE
     *
     * Another round-robin turn order, but goes around just once.
     * The phase ends after all players have played.
     */
    ONCE: {
        first: () => 0,
        next: (G, ctx) => {
            if (ctx.playOrderPos < ctx.playOrder.length - 1) {
                return ctx.playOrderPos + 1;
            }
        },
    },
    /**
     * CUSTOM
     *
     * Identical to DEFAULT, but also sets playOrder at the
     * beginning of the phase.
     *
     * @param {Array} playOrder - The play order.
     */
    CUSTOM: (playOrder) => ({
        playOrder: () => playOrder,
        first: () => 0,
        next: (G, ctx) => (ctx.playOrderPos + 1) % ctx.playOrder.length,
    }),
    /**
     * CUSTOM_FROM
     *
     * Identical to DEFAULT, but also sets playOrder at the
     * beginning of the phase to a value specified by a field
     * in G.
     *
     * @param {string} playOrderField - Field in G.
     */
    CUSTOM_FROM: (playOrderField) => ({
        playOrder: (G) => G[playOrderField],
        first: () => 0,
        next: (G, ctx) => (ctx.playOrderPos + 1) % ctx.playOrder.length,
    }),
};
const Stage = {
    NULL: null,
};
const ActivePlayers = {
    /**
     * ALL
     *
     * The turn stays with one player, but any player can play (in any order)
     * until the phase ends.
     */
    ALL: { all: Stage.NULL },
    /**
     * ALL_ONCE
     *
     * The turn stays with one player, but any player can play (once, and in any order).
     * This is typically used in a phase where you want to elicit a response
     * from every player in the game.
     */
    ALL_ONCE: { all: Stage.NULL, minMoves: 1, maxMoves: 1 },
    /**
     * OTHERS
     *
     * The turn stays with one player, and every *other* player can play (in any order)
     * until the phase ends.
     */
    OTHERS: { others: Stage.NULL },
    /**
     * OTHERS_ONCE
     *
     * The turn stays with one player, and every *other* player can play (once, and in any order).
     * This is typically used in a phase where you want to elicit a response
     * from every *other* player in the game.
     */
    OTHERS_ONCE: { others: Stage.NULL, minMoves: 1, maxMoves: 1 },
};

exports.ActionCreators = ActionCreators;
exports.ActivePlayers = ActivePlayers;
exports.Enhance = Enhance;
exports.EnhanceCtx = EnhanceCtx;
exports.FlushAndValidate = FlushAndValidate;
exports.FnWrap = FnWrap;
exports.GAME_EVENT = GAME_EVENT;
exports.INVALID_MOVE = INVALID_MOVE;
exports.InitTurnOrderState = InitTurnOrderState;
exports.MAKE_MOVE = MAKE_MOVE;
exports.NoClient = NoClient;
exports.PATCH = PATCH;
exports.PLUGIN = PLUGIN;
exports.PlayerView = PlayerView;
exports.ProcessAction = ProcessAction;
exports.REDO = REDO;
exports.RESET = RESET;
exports.STRIP_TRANSIENTS = STRIP_TRANSIENTS;
exports.SYNC = SYNC;
exports.SetActivePlayers = SetActivePlayers;
exports.Setup = Setup;
exports.Stage = Stage;
exports.TurnOrder = TurnOrder;
exports.UNDO = UNDO;
exports.UPDATE = UPDATE;
exports.UpdateActivePlayersOnceEmpty = UpdateActivePlayersOnceEmpty;
exports.UpdateTurnOrderState = UpdateTurnOrderState;
exports.error = error;
exports.gameEvent = gameEvent;
exports.info = info;
exports.makeMove = makeMove;
exports.patch = patch;
exports.redo = redo;
exports.reset = reset;
exports.stripTransients = stripTransients;
exports.supportDeprecatedMoveLimit = supportDeprecatedMoveLimit;
exports.sync = sync;
exports.undo = undo;
exports.update = update;

}).call(this)}).call(this,require('_process'))
},{"./plugin-random-7425844d.js":16,"_process":32,"immer":26,"lodash.isplainobject":27}],20:[function(require,module,exports){
'use strict';

var initialize = require('./initialize-45c7e6ee.js');

var Type;
(function (Type) {
    Type[Type["SYNC"] = 0] = "SYNC";
    Type[Type["ASYNC"] = 1] = "ASYNC";
})(Type || (Type = {}));
/**
 * Type guard that checks if a storage implementation is synchronous.
 */
function isSynchronous(storageAPI) {
    return storageAPI.type() === Type.SYNC;
}
class Async {
    /* istanbul ignore next */
    type() {
        /* istanbul ignore next */
        return Type.ASYNC;
    }
    /**
     * Create a new match.
     *
     * This might just need to call setState and setMetadata in
     * most implementations.
     *
     * However, it exists as a separate call so that the
     * implementation can provision things differently when
     * a match is created.  For example, it might stow away the
     * initial match state in a separate field for easier retrieval.
     */
    /* istanbul ignore next */
    async createMatch(matchID, opts) {
        if (this.createGame) {
            console.warn('The database connector does not implement a createMatch method.', '\nUsing the deprecated createGame method instead.');
            return this.createGame(matchID, opts);
        }
        else {
            console.error('The database connector does not implement a createMatch method.');
        }
    }
    /**
     * Return all matches.
     */
    /* istanbul ignore next */
    async listMatches(opts) {
        if (this.listGames) {
            console.warn('The database connector does not implement a listMatches method.', '\nUsing the deprecated listGames method instead.');
            return this.listGames(opts);
        }
        else {
            console.error('The database connector does not implement a listMatches method.');
        }
    }
}
class Sync {
    type() {
        return Type.SYNC;
    }
    /**
     * Connect.
     */
    connect() {
        return;
    }
    /**
     * Create a new match.
     *
     * This might just need to call setState and setMetadata in
     * most implementations.
     *
     * However, it exists as a separate call so that the
     * implementation can provision things differently when
     * a match is created.  For example, it might stow away the
     * initial match state in a separate field for easier retrieval.
     */
    /* istanbul ignore next */
    createMatch(matchID, opts) {
        if (this.createGame) {
            console.warn('The database connector does not implement a createMatch method.', '\nUsing the deprecated createGame method instead.');
            return this.createGame(matchID, opts);
        }
        else {
            console.error('The database connector does not implement a createMatch method.');
        }
    }
    /**
     * Return all matches.
     */
    /* istanbul ignore next */
    listMatches(opts) {
        if (this.listGames) {
            console.warn('The database connector does not implement a listMatches method.', '\nUsing the deprecated listGames method instead.');
            return this.listGames(opts);
        }
        else {
            console.error('The database connector does not implement a listMatches method.');
        }
    }
}

/**
 * Creates a new match metadata object.
 */
const createMetadata = ({ game, unlisted, setupData, numPlayers, }) => {
    const metadata = {
        gameName: game.name,
        unlisted: !!unlisted,
        players: {},
        createdAt: Date.now(),
        updatedAt: Date.now(),
    };
    if (setupData !== undefined)
        metadata.setupData = setupData;
    for (let playerIndex = 0; playerIndex < numPlayers; playerIndex++) {
        metadata.players[playerIndex] = { id: playerIndex };
    }
    return metadata;
};
/**
 * Creates initial state and metadata for a new match.
 * If the provided `setupData` doesn’t pass the game’s validation,
 * an error object is returned instead.
 */
const createMatch = ({ game, numPlayers, setupData, unlisted, }) => {
    if (!numPlayers || typeof numPlayers !== 'number')
        numPlayers = 2;
    const setupDataError = game.validateSetupData && game.validateSetupData(setupData, numPlayers);
    if (setupDataError !== undefined)
        return { setupDataError };
    const metadata = createMetadata({ game, numPlayers, setupData, unlisted });
    const initialState = initialize.InitializeGame({ game, numPlayers, setupData });
    return { metadata, initialState };
};

exports.Async = Async;
exports.Sync = Sync;
exports.createMatch = createMatch;
exports.isSynchronous = isSynchronous;

},{"./initialize-45c7e6ee.js":12}],21:[function(require,module,exports){

},{}],22:[function(require,module,exports){
'use strict';

var has = Object.prototype.hasOwnProperty
  , prefix = '~';

/**
 * Constructor to create a storage for our `EE` objects.
 * An `Events` instance is a plain object whose properties are event names.
 *
 * @constructor
 * @private
 */
function Events() {}

//
// We try to not inherit from `Object.prototype`. In some engines creating an
// instance in this way is faster than calling `Object.create(null)` directly.
// If `Object.create(null)` is not supported we prefix the event names with a
// character to make sure that the built-in object properties are not
// overridden or used as an attack vector.
//
if (Object.create) {
  Events.prototype = Object.create(null);

  //
  // This hack is needed because the `__proto__` property is still inherited in
  // some old browsers like Android 4, iPhone 5.1, Opera 11 and Safari 5.
  //
  if (!new Events().__proto__) prefix = false;
}

/**
 * Representation of a single event listener.
 *
 * @param {Function} fn The listener function.
 * @param {*} context The context to invoke the listener with.
 * @param {Boolean} [once=false] Specify if the listener is a one-time listener.
 * @constructor
 * @private
 */
function EE(fn, context, once) {
  this.fn = fn;
  this.context = context;
  this.once = once || false;
}

/**
 * Add a listener for a given event.
 *
 * @param {EventEmitter} emitter Reference to the `EventEmitter` instance.
 * @param {(String|Symbol)} event The event name.
 * @param {Function} fn The listener function.
 * @param {*} context The context to invoke the listener with.
 * @param {Boolean} once Specify if the listener is a one-time listener.
 * @returns {EventEmitter}
 * @private
 */
function addListener(emitter, event, fn, context, once) {
  if (typeof fn !== 'function') {
    throw new TypeError('The listener must be a function');
  }

  var listener = new EE(fn, context || emitter, once)
    , evt = prefix ? prefix + event : event;

  if (!emitter._events[evt]) emitter._events[evt] = listener, emitter._eventsCount++;
  else if (!emitter._events[evt].fn) emitter._events[evt].push(listener);
  else emitter._events[evt] = [emitter._events[evt], listener];

  return emitter;
}

/**
 * Clear event by name.
 *
 * @param {EventEmitter} emitter Reference to the `EventEmitter` instance.
 * @param {(String|Symbol)} evt The Event name.
 * @private
 */
function clearEvent(emitter, evt) {
  if (--emitter._eventsCount === 0) emitter._events = new Events();
  else delete emitter._events[evt];
}

/**
 * Minimal `EventEmitter` interface that is molded against the Node.js
 * `EventEmitter` interface.
 *
 * @constructor
 * @public
 */
function EventEmitter() {
  this._events = new Events();
  this._eventsCount = 0;
}

/**
 * Return an array listing the events for which the emitter has registered
 * listeners.
 *
 * @returns {Array}
 * @public
 */
EventEmitter.prototype.eventNames = function eventNames() {
  var names = []
    , events
    , name;

  if (this._eventsCount === 0) return names;

  for (name in (events = this._events)) {
    if (has.call(events, name)) names.push(prefix ? name.slice(1) : name);
  }

  if (Object.getOwnPropertySymbols) {
    return names.concat(Object.getOwnPropertySymbols(events));
  }

  return names;
};

/**
 * Return the listeners registered for a given event.
 *
 * @param {(String|Symbol)} event The event name.
 * @returns {Array} The registered listeners.
 * @public
 */
EventEmitter.prototype.listeners = function listeners(event) {
  var evt = prefix ? prefix + event : event
    , handlers = this._events[evt];

  if (!handlers) return [];
  if (handlers.fn) return [handlers.fn];

  for (var i = 0, l = handlers.length, ee = new Array(l); i < l; i++) {
    ee[i] = handlers[i].fn;
  }

  return ee;
};

/**
 * Return the number of listeners listening to a given event.
 *
 * @param {(String|Symbol)} event The event name.
 * @returns {Number} The number of listeners.
 * @public
 */
EventEmitter.prototype.listenerCount = function listenerCount(event) {
  var evt = prefix ? prefix + event : event
    , listeners = this._events[evt];

  if (!listeners) return 0;
  if (listeners.fn) return 1;
  return listeners.length;
};

/**
 * Calls each of the listeners registered for a given event.
 *
 * @param {(String|Symbol)} event The event name.
 * @returns {Boolean} `true` if the event had listeners, else `false`.
 * @public
 */
EventEmitter.prototype.emit = function emit(event, a1, a2, a3, a4, a5) {
  var evt = prefix ? prefix + event : event;

  if (!this._events[evt]) return false;

  var listeners = this._events[evt]
    , len = arguments.length
    , args
    , i;

  if (listeners.fn) {
    if (listeners.once) this.removeListener(event, listeners.fn, undefined, true);

    switch (len) {
      case 1: return listeners.fn.call(listeners.context), true;
      case 2: return listeners.fn.call(listeners.context, a1), true;
      case 3: return listeners.fn.call(listeners.context, a1, a2), true;
      case 4: return listeners.fn.call(listeners.context, a1, a2, a3), true;
      case 5: return listeners.fn.call(listeners.context, a1, a2, a3, a4), true;
      case 6: return listeners.fn.call(listeners.context, a1, a2, a3, a4, a5), true;
    }

    for (i = 1, args = new Array(len -1); i < len; i++) {
      args[i - 1] = arguments[i];
    }

    listeners.fn.apply(listeners.context, args);
  } else {
    var length = listeners.length
      , j;

    for (i = 0; i < length; i++) {
      if (listeners[i].once) this.removeListener(event, listeners[i].fn, undefined, true);

      switch (len) {
        case 1: listeners[i].fn.call(listeners[i].context); break;
        case 2: listeners[i].fn.call(listeners[i].context, a1); break;
        case 3: listeners[i].fn.call(listeners[i].context, a1, a2); break;
        case 4: listeners[i].fn.call(listeners[i].context, a1, a2, a3); break;
        default:
          if (!args) for (j = 1, args = new Array(len -1); j < len; j++) {
            args[j - 1] = arguments[j];
          }

          listeners[i].fn.apply(listeners[i].context, args);
      }
    }
  }

  return true;
};

/**
 * Add a listener for a given event.
 *
 * @param {(String|Symbol)} event The event name.
 * @param {Function} fn The listener function.
 * @param {*} [context=this] The context to invoke the listener with.
 * @returns {EventEmitter} `this`.
 * @public
 */
EventEmitter.prototype.on = function on(event, fn, context) {
  return addListener(this, event, fn, context, false);
};

/**
 * Add a one-time listener for a given event.
 *
 * @param {(String|Symbol)} event The event name.
 * @param {Function} fn The listener function.
 * @param {*} [context=this] The context to invoke the listener with.
 * @returns {EventEmitter} `this`.
 * @public
 */
EventEmitter.prototype.once = function once(event, fn, context) {
  return addListener(this, event, fn, context, true);
};

/**
 * Remove the listeners of a given event.
 *
 * @param {(String|Symbol)} event The event name.
 * @param {Function} fn Only remove the listeners that match this function.
 * @param {*} context Only remove the listeners that have this context.
 * @param {Boolean} once Only remove one-time listeners.
 * @returns {EventEmitter} `this`.
 * @public
 */
EventEmitter.prototype.removeListener = function removeListener(event, fn, context, once) {
  var evt = prefix ? prefix + event : event;

  if (!this._events[evt]) return this;
  if (!fn) {
    clearEvent(this, evt);
    return this;
  }

  var listeners = this._events[evt];

  if (listeners.fn) {
    if (
      listeners.fn === fn &&
      (!once || listeners.once) &&
      (!context || listeners.context === context)
    ) {
      clearEvent(this, evt);
    }
  } else {
    for (var i = 0, events = [], length = listeners.length; i < length; i++) {
      if (
        listeners[i].fn !== fn ||
        (once && !listeners[i].once) ||
        (context && listeners[i].context !== context)
      ) {
        events.push(listeners[i]);
      }
    }

    //
    // Reset the array, or remove it completely if we have no more listeners.
    //
    if (events.length) this._events[evt] = events.length === 1 ? events[0] : events;
    else clearEvent(this, evt);
  }

  return this;
};

/**
 * Remove all listeners, or those of the specified event.
 *
 * @param {(String|Symbol)} [event] The event name.
 * @returns {EventEmitter} `this`.
 * @public
 */
EventEmitter.prototype.removeAllListeners = function removeAllListeners(event) {
  var evt;

  if (event) {
    evt = prefix ? prefix + event : event;
    if (this._events[evt]) clearEvent(this, evt);
  } else {
    this._events = new Events();
    this._eventsCount = 0;
  }

  return this;
};

//
// Alias methods names because people roll like that.
//
EventEmitter.prototype.off = EventEmitter.prototype.removeListener;
EventEmitter.prototype.addListener = EventEmitter.prototype.on;

//
// Expose the prefix.
//
EventEmitter.prefixed = prefix;

//
// Allow `EventEmitter` to be imported as module namespace.
//
EventEmitter.EventEmitter = EventEmitter;

//
// Expose the module.
//
if ('undefined' !== typeof module) {
  module.exports = EventEmitter;
}

},{}],23:[function(require,module,exports){
'use strict';
/*! (c) 2020 Andrea Giammarchi */

const {parse: $parse, stringify: $stringify} = JSON;
const {keys} = Object;

const Primitive = String;   // it could be Number
const primitive = 'string'; // it could be 'number'

const ignore = {};
const object = 'object';

const noop = (_, value) => value;

const primitives = value => (
  value instanceof Primitive ? Primitive(value) : value
);

const Primitives = (_, value) => (
  typeof value === primitive ? new Primitive(value) : value
);

const revive = (input, parsed, output, $) => {
  const lazy = [];
  for (let ke = keys(output), {length} = ke, y = 0; y < length; y++) {
    const k = ke[y];
    const value = output[k];
    if (value instanceof Primitive) {
      const tmp = input[value];
      if (typeof tmp === object && !parsed.has(tmp)) {
        parsed.add(tmp);
        output[k] = ignore;
        lazy.push({k, a: [input, parsed, tmp, $]});
      }
      else
        output[k] = $.call(output, k, tmp);
    }
    else if (output[k] !== ignore)
      output[k] = $.call(output, k, value);
  }
  for (let {length} = lazy, i = 0; i < length; i++) {
    const {k, a} = lazy[i];
    output[k] = $.call(output, k, revive.apply(null, a));
  }
  return output;
};

const set = (known, input, value) => {
  const index = Primitive(input.push(value) - 1);
  known.set(value, index);
  return index;
};

const parse = (text, reviver) => {
  const input = $parse(text, Primitives).map(primitives);
  const value = input[0];
  const $ = reviver || noop;
  const tmp = typeof value === object && value ?
              revive(input, new Set, value, $) :
              value;
  return $.call({'': tmp}, '', tmp);
};
exports.parse = parse;

const stringify = (value, replacer, space) => {
  const $ = replacer && typeof replacer === object ?
            (k, v) => (k === '' || -1 < replacer.indexOf(k) ? v : void 0) :
            (replacer || noop);
  const known = new Map;
  const input = [];
  const output = [];
  let i = +set(known, input, $.call({'': value}, '', value));
  let firstRun = !i;
  while (i < input.length) {
    firstRun = true;
    output[i] = $stringify(input[i++], replace, space);
  }
  return '[' + output.join(',') + ']';
  function replace(key, value) {
    if (firstRun) {
      firstRun = !firstRun;
      return value;
    }
    const after = $.call(this, key, value);
    switch (typeof after) {
      case object:
        if (after === null) return after;
      case primitive:
        return known.get(after) || set(known, input, after);
    }
    return after;
  }
};
exports.stringify = stringify;

const toJSON = any => $parse(stringify(any));
exports.toJSON = toJSON;
const fromJSON = any => parse($stringify(any));
exports.fromJSON = fromJSON;

},{}],24:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var _ref;

// Should be no imports here!
// Some things that should be evaluated before all else...
// We only want to know if non-polyfilled symbols are available
var hasSymbol = typeof Symbol !== "undefined" && typeof
/*#__PURE__*/
Symbol("x") === "symbol";
var hasMap = typeof Map !== "undefined";
var hasSet = typeof Set !== "undefined";
var hasProxies = typeof Proxy !== "undefined" && typeof Proxy.revocable !== "undefined" && typeof Reflect !== "undefined";
/**
 * The sentinel value returned by producers to replace the draft with undefined.
 */

var NOTHING = hasSymbol ?
/*#__PURE__*/
Symbol.for("immer-nothing") : (_ref = {}, _ref["immer-nothing"] = true, _ref);
/**
 * To let Immer treat your class instances as plain immutable objects
 * (albeit with a custom prototype), you must define either an instance property
 * or a static property on each of your custom classes.
 *
 * Otherwise, your class instance will never be drafted, which means it won't be
 * safe to mutate in a produce callback.
 */

var DRAFTABLE = hasSymbol ?
/*#__PURE__*/
Symbol.for("immer-draftable") : "__$immer_draftable";
var DRAFT_STATE = hasSymbol ?
/*#__PURE__*/
Symbol.for("immer-state") : "__$immer_state"; // Even a polyfilled Symbol might provide Symbol.iterator

var iteratorSymbol = typeof Symbol != "undefined" && Symbol.iterator || "@@iterator";

var errors = {
  0: "Illegal state",
  1: "Immer drafts cannot have computed properties",
  2: "This object has been frozen and should not be mutated",
  3: function _(data) {
    return "Cannot use a proxy that has been revoked. Did you pass an object from inside an immer function to an async process? " + data;
  },
  4: "An immer producer returned a new value *and* modified its draft. Either return a new value *or* modify the draft.",
  5: "Immer forbids circular references",
  6: "The first or second argument to `produce` must be a function",
  7: "The third argument to `produce` must be a function or undefined",
  8: "First argument to `createDraft` must be a plain object, an array, or an immerable object",
  9: "First argument to `finishDraft` must be a draft returned by `createDraft`",
  10: "The given draft is already finalized",
  11: "Object.defineProperty() cannot be used on an Immer draft",
  12: "Object.setPrototypeOf() cannot be used on an Immer draft",
  13: "Immer only supports deleting array indices",
  14: "Immer only supports setting array indices and the 'length' property",
  15: function _(path) {
    return "Cannot apply patch, path doesn't resolve: " + path;
  },
  16: 'Sets cannot have "replace" patches.',
  17: function _(op) {
    return "Unsupported patch operation: " + op;
  },
  18: function _(plugin) {
    return "The plugin for '" + plugin + "' has not been loaded into Immer. To enable the plugin, import and call `enable" + plugin + "()` when initializing your application.";
  },
  20: "Cannot use proxies if Proxy, Proxy.revocable or Reflect are not available",
  21: function _(thing) {
    return "produce can only be called on things that are draftable: plain objects, arrays, Map, Set or classes that are marked with '[immerable]: true'. Got '" + thing + "'";
  },
  22: function _(thing) {
    return "'current' expects a draft, got: " + thing;
  },
  23: function _(thing) {
    return "'original' expects a draft, got: " + thing;
  },
  24: "Patching reserved attributes like __proto__, prototype and constructor is not allowed"
};
function die(error) {
  for (var _len = arguments.length, args = new Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
    args[_key - 1] = arguments[_key];
  }

  {
    var e = errors[error];
    var msg = !e ? "unknown error nr: " + error : typeof e === "function" ? e.apply(null, args) : e;
    throw new Error("[Immer] " + msg);
  }
}

/** Returns true if the given value is an Immer draft */

/*#__PURE__*/

function isDraft(value) {
  return !!value && !!value[DRAFT_STATE];
}
/** Returns true if the given value can be drafted by Immer */

/*#__PURE__*/

function isDraftable(value) {
  if (!value) return false;
  return isPlainObject(value) || Array.isArray(value) || !!value[DRAFTABLE] || !!value.constructor[DRAFTABLE] || isMap(value) || isSet(value);
}
var objectCtorString =
/*#__PURE__*/
Object.prototype.constructor.toString();
/*#__PURE__*/

function isPlainObject(value) {
  if (!value || typeof value !== "object") return false;
  var proto = Object.getPrototypeOf(value);

  if (proto === null) {
    return true;
  }

  var Ctor = Object.hasOwnProperty.call(proto, "constructor") && proto.constructor;
  if (Ctor === Object) return true;
  return typeof Ctor == "function" && Function.toString.call(Ctor) === objectCtorString;
}
function original(value) {
  if (!isDraft(value)) die(23, value);
  return value[DRAFT_STATE].base_;
}
/*#__PURE__*/

var ownKeys = typeof Reflect !== "undefined" && Reflect.ownKeys ? Reflect.ownKeys : typeof Object.getOwnPropertySymbols !== "undefined" ? function (obj) {
  return Object.getOwnPropertyNames(obj).concat(Object.getOwnPropertySymbols(obj));
} :
/* istanbul ignore next */
Object.getOwnPropertyNames;
var getOwnPropertyDescriptors = Object.getOwnPropertyDescriptors || function getOwnPropertyDescriptors(target) {
  // Polyfill needed for Hermes and IE, see https://github.com/facebook/hermes/issues/274
  var res = {};
  ownKeys(target).forEach(function (key) {
    res[key] = Object.getOwnPropertyDescriptor(target, key);
  });
  return res;
};
function each(obj, iter, enumerableOnly) {
  if (enumerableOnly === void 0) {
    enumerableOnly = false;
  }

  if (getArchtype(obj) === 0
  /* Object */
  ) {
      (enumerableOnly ? Object.keys : ownKeys)(obj).forEach(function (key) {
        if (!enumerableOnly || typeof key !== "symbol") iter(key, obj[key], obj);
      });
    } else {
    obj.forEach(function (entry, index) {
      return iter(index, entry, obj);
    });
  }
}
/*#__PURE__*/

function getArchtype(thing) {
  /* istanbul ignore next */
  var state = thing[DRAFT_STATE];
  return state ? state.type_ > 3 ? state.type_ - 4 // cause Object and Array map back from 4 and 5
  : state.type_ // others are the same
  : Array.isArray(thing) ? 1
  /* Array */
  : isMap(thing) ? 2
  /* Map */
  : isSet(thing) ? 3
  /* Set */
  : 0
  /* Object */
  ;
}
/*#__PURE__*/

function has(thing, prop) {
  return getArchtype(thing) === 2
  /* Map */
  ? thing.has(prop) : Object.prototype.hasOwnProperty.call(thing, prop);
}
/*#__PURE__*/

function get(thing, prop) {
  // @ts-ignore
  return getArchtype(thing) === 2
  /* Map */
  ? thing.get(prop) : thing[prop];
}
/*#__PURE__*/

function set(thing, propOrOldValue, value) {
  var t = getArchtype(thing);
  if (t === 2
  /* Map */
  ) thing.set(propOrOldValue, value);else if (t === 3
  /* Set */
  ) {
      thing.delete(propOrOldValue);
      thing.add(value);
    } else thing[propOrOldValue] = value;
}
/*#__PURE__*/

function is(x, y) {
  // From: https://github.com/facebook/fbjs/blob/c69904a511b900266935168223063dd8772dfc40/packages/fbjs/src/core/shallowEqual.js
  if (x === y) {
    return x !== 0 || 1 / x === 1 / y;
  } else {
    return x !== x && y !== y;
  }
}
/*#__PURE__*/

function isMap(target) {
  return hasMap && target instanceof Map;
}
/*#__PURE__*/

function isSet(target) {
  return hasSet && target instanceof Set;
}
/*#__PURE__*/

function latest(state) {
  return state.copy_ || state.base_;
}
/*#__PURE__*/

function shallowCopy(base) {
  if (Array.isArray(base)) return Array.prototype.slice.call(base);
  var descriptors = getOwnPropertyDescriptors(base);
  delete descriptors[DRAFT_STATE];
  var keys = ownKeys(descriptors);

  for (var i = 0; i < keys.length; i++) {
    var key = keys[i];
    var desc = descriptors[key];

    if (desc.writable === false) {
      desc.writable = true;
      desc.configurable = true;
    } // like object.assign, we will read any _own_, get/set accessors. This helps in dealing
    // with libraries that trap values, like mobx or vue
    // unlike object.assign, non-enumerables will be copied as well


    if (desc.get || desc.set) descriptors[key] = {
      configurable: true,
      writable: true,
      enumerable: desc.enumerable,
      value: base[key]
    };
  }

  return Object.create(Object.getPrototypeOf(base), descriptors);
}
function freeze(obj, deep) {
  if (deep === void 0) {
    deep = false;
  }

  if (isFrozen(obj) || isDraft(obj) || !isDraftable(obj)) return obj;

  if (getArchtype(obj) > 1
  /* Map or Set */
  ) {
      obj.set = obj.add = obj.clear = obj.delete = dontMutateFrozenCollections;
    }

  Object.freeze(obj);
  if (deep) each(obj, function (key, value) {
    return freeze(value, true);
  }, true);
  return obj;
}

function dontMutateFrozenCollections() {
  die(2);
}

function isFrozen(obj) {
  if (obj == null || typeof obj !== "object") return true; // See #600, IE dies on non-objects in Object.isFrozen

  return Object.isFrozen(obj);
}

/** Plugin utilities */

var plugins = {};
function getPlugin(pluginKey) {
  var plugin = plugins[pluginKey];

  if (!plugin) {
    die(18, pluginKey);
  } // @ts-ignore


  return plugin;
}
function loadPlugin(pluginKey, implementation) {
  if (!plugins[pluginKey]) plugins[pluginKey] = implementation;
}

var currentScope;
function getCurrentScope() {
  if ( !currentScope) die(0);
  return currentScope;
}

function createScope(parent_, immer_) {
  return {
    drafts_: [],
    parent_: parent_,
    immer_: immer_,
    // Whenever the modified draft contains a draft from another scope, we
    // need to prevent auto-freezing so the unowned draft can be finalized.
    canAutoFreeze_: true,
    unfinalizedDrafts_: 0
  };
}

function usePatchesInScope(scope, patchListener) {
  if (patchListener) {
    getPlugin("Patches"); // assert we have the plugin

    scope.patches_ = [];
    scope.inversePatches_ = [];
    scope.patchListener_ = patchListener;
  }
}
function revokeScope(scope) {
  leaveScope(scope);
  scope.drafts_.forEach(revokeDraft); // @ts-ignore

  scope.drafts_ = null;
}
function leaveScope(scope) {
  if (scope === currentScope) {
    currentScope = scope.parent_;
  }
}
function enterScope(immer) {
  return currentScope = createScope(currentScope, immer);
}

function revokeDraft(draft) {
  var state = draft[DRAFT_STATE];
  if (state.type_ === 0
  /* ProxyObject */
  || state.type_ === 1
  /* ProxyArray */
  ) state.revoke_();else state.revoked_ = true;
}

function processResult(result, scope) {
  scope.unfinalizedDrafts_ = scope.drafts_.length;
  var baseDraft = scope.drafts_[0];
  var isReplaced = result !== undefined && result !== baseDraft;
  if (!scope.immer_.useProxies_) getPlugin("ES5").willFinalizeES5_(scope, result, isReplaced);

  if (isReplaced) {
    if (baseDraft[DRAFT_STATE].modified_) {
      revokeScope(scope);
      die(4);
    }

    if (isDraftable(result)) {
      // Finalize the result in case it contains (or is) a subset of the draft.
      result = finalize(scope, result);
      if (!scope.parent_) maybeFreeze(scope, result);
    }

    if (scope.patches_) {
      getPlugin("Patches").generateReplacementPatches_(baseDraft[DRAFT_STATE].base_, result, scope.patches_, scope.inversePatches_);
    }
  } else {
    // Finalize the base draft.
    result = finalize(scope, baseDraft, []);
  }

  revokeScope(scope);

  if (scope.patches_) {
    scope.patchListener_(scope.patches_, scope.inversePatches_);
  }

  return result !== NOTHING ? result : undefined;
}

function finalize(rootScope, value, path) {
  // Don't recurse in tho recursive data structures
  if (isFrozen(value)) return value;
  var state = value[DRAFT_STATE]; // A plain object, might need freezing, might contain drafts

  if (!state) {
    each(value, function (key, childValue) {
      return finalizeProperty(rootScope, state, value, key, childValue, path);
    }, true // See #590, don't recurse into non-enumerable of non drafted objects
    );
    return value;
  } // Never finalize drafts owned by another scope.


  if (state.scope_ !== rootScope) return value; // Unmodified draft, return the (frozen) original

  if (!state.modified_) {
    maybeFreeze(rootScope, state.base_, true);
    return state.base_;
  } // Not finalized yet, let's do that now


  if (!state.finalized_) {
    state.finalized_ = true;
    state.scope_.unfinalizedDrafts_--;
    var result = // For ES5, create a good copy from the draft first, with added keys and without deleted keys.
    state.type_ === 4
    /* ES5Object */
    || state.type_ === 5
    /* ES5Array */
    ? state.copy_ = shallowCopy(state.draft_) : state.copy_; // Finalize all children of the copy
    // For sets we clone before iterating, otherwise we can get in endless loop due to modifying during iteration, see #628
    // Although the original test case doesn't seem valid anyway, so if this in the way we can turn the next line
    // back to each(result, ....)

    each(state.type_ === 3
    /* Set */
    ? new Set(result) : result, function (key, childValue) {
      return finalizeProperty(rootScope, state, result, key, childValue, path);
    }); // everything inside is frozen, we can freeze here

    maybeFreeze(rootScope, result, false); // first time finalizing, let's create those patches

    if (path && rootScope.patches_) {
      getPlugin("Patches").generatePatches_(state, path, rootScope.patches_, rootScope.inversePatches_);
    }
  }

  return state.copy_;
}

function finalizeProperty(rootScope, parentState, targetObject, prop, childValue, rootPath) {
  if ( childValue === targetObject) die(5);

  if (isDraft(childValue)) {
    var path = rootPath && parentState && parentState.type_ !== 3
    /* Set */
    && // Set objects are atomic since they have no keys.
    !has(parentState.assigned_, prop) // Skip deep patches for assigned keys.
    ? rootPath.concat(prop) : undefined; // Drafts owned by `scope` are finalized here.

    var res = finalize(rootScope, childValue, path);
    set(targetObject, prop, res); // Drafts from another scope must prevented to be frozen
    // if we got a draft back from finalize, we're in a nested produce and shouldn't freeze

    if (isDraft(res)) {
      rootScope.canAutoFreeze_ = false;
    } else return;
  } // Search new objects for unfinalized drafts. Frozen objects should never contain drafts.


  if (isDraftable(childValue) && !isFrozen(childValue)) {
    if (!rootScope.immer_.autoFreeze_ && rootScope.unfinalizedDrafts_ < 1) {
      // optimization: if an object is not a draft, and we don't have to
      // deepfreeze everything, and we are sure that no drafts are left in the remaining object
      // cause we saw and finalized all drafts already; we can stop visiting the rest of the tree.
      // This benefits especially adding large data tree's without further processing.
      // See add-data.js perf test
      return;
    }

    finalize(rootScope, childValue); // immer deep freezes plain objects, so if there is no parent state, we freeze as well

    if (!parentState || !parentState.scope_.parent_) maybeFreeze(rootScope, childValue);
  }
}

function maybeFreeze(scope, value, deep) {
  if (deep === void 0) {
    deep = false;
  }

  if (scope.immer_.autoFreeze_ && scope.canAutoFreeze_) {
    freeze(value, deep);
  }
}

/**
 * Returns a new draft of the `base` object.
 *
 * The second argument is the parent draft-state (used internally).
 */

function createProxyProxy(base, parent) {
  var isArray = Array.isArray(base);
  var state = {
    type_: isArray ? 1
    /* ProxyArray */
    : 0
    /* ProxyObject */
    ,
    // Track which produce call this is associated with.
    scope_: parent ? parent.scope_ : getCurrentScope(),
    // True for both shallow and deep changes.
    modified_: false,
    // Used during finalization.
    finalized_: false,
    // Track which properties have been assigned (true) or deleted (false).
    assigned_: {},
    // The parent draft state.
    parent_: parent,
    // The base state.
    base_: base,
    // The base proxy.
    draft_: null,
    // The base copy with any updated values.
    copy_: null,
    // Called by the `produce` function.
    revoke_: null,
    isManual_: false
  }; // the traps must target something, a bit like the 'real' base.
  // but also, we need to be able to determine from the target what the relevant state is
  // (to avoid creating traps per instance to capture the state in closure,
  // and to avoid creating weird hidden properties as well)
  // So the trick is to use 'state' as the actual 'target'! (and make sure we intercept everything)
  // Note that in the case of an array, we put the state in an array to have better Reflect defaults ootb

  var target = state;
  var traps = objectTraps;

  if (isArray) {
    target = [state];
    traps = arrayTraps;
  }

  var _Proxy$revocable = Proxy.revocable(target, traps),
      revoke = _Proxy$revocable.revoke,
      proxy = _Proxy$revocable.proxy;

  state.draft_ = proxy;
  state.revoke_ = revoke;
  return proxy;
}
/**
 * Object drafts
 */

var objectTraps = {
  get: function get(state, prop) {
    if (prop === DRAFT_STATE) return state;
    var source = latest(state);

    if (!has(source, prop)) {
      // non-existing or non-own property...
      return readPropFromProto(state, source, prop);
    }

    var value = source[prop];

    if (state.finalized_ || !isDraftable(value)) {
      return value;
    } // Check for existing draft in modified state.
    // Assigned values are never drafted. This catches any drafts we created, too.


    if (value === peek(state.base_, prop)) {
      prepareCopy(state);
      return state.copy_[prop] = createProxy(state.scope_.immer_, value, state);
    }

    return value;
  },
  has: function has(state, prop) {
    return prop in latest(state);
  },
  ownKeys: function ownKeys(state) {
    return Reflect.ownKeys(latest(state));
  },
  set: function set(state, prop
  /* strictly not, but helps TS */
  , value) {
    var desc = getDescriptorFromProto(latest(state), prop);

    if (desc === null || desc === void 0 ? void 0 : desc.set) {
      // special case: if this write is captured by a setter, we have
      // to trigger it with the correct context
      desc.set.call(state.draft_, value);
      return true;
    }

    if (!state.modified_) {
      // the last check is because we need to be able to distinguish setting a non-existing to undefined (which is a change)
      // from setting an existing property with value undefined to undefined (which is not a change)
      var current = peek(latest(state), prop); // special case, if we assigning the original value to a draft, we can ignore the assignment

      var currentState = current === null || current === void 0 ? void 0 : current[DRAFT_STATE];

      if (currentState && currentState.base_ === value) {
        state.copy_[prop] = value;
        state.assigned_[prop] = false;
        return true;
      }

      if (is(value, current) && (value !== undefined || has(state.base_, prop))) return true;
      prepareCopy(state);
      markChanged(state);
    }

    if (state.copy_[prop] === value && // special case: NaN
    typeof value !== "number" && ( // special case: handle new props with value 'undefined'
    value !== undefined || prop in state.copy_)) return true; // @ts-ignore

    state.copy_[prop] = value;
    state.assigned_[prop] = true;
    return true;
  },
  deleteProperty: function deleteProperty(state, prop) {
    // The `undefined` check is a fast path for pre-existing keys.
    if (peek(state.base_, prop) !== undefined || prop in state.base_) {
      state.assigned_[prop] = false;
      prepareCopy(state);
      markChanged(state);
    } else {
      // if an originally not assigned property was deleted
      delete state.assigned_[prop];
    } // @ts-ignore


    if (state.copy_) delete state.copy_[prop];
    return true;
  },
  // Note: We never coerce `desc.value` into an Immer draft, because we can't make
  // the same guarantee in ES5 mode.
  getOwnPropertyDescriptor: function getOwnPropertyDescriptor(state, prop) {
    var owner = latest(state);
    var desc = Reflect.getOwnPropertyDescriptor(owner, prop);
    if (!desc) return desc;
    return {
      writable: true,
      configurable: state.type_ !== 1
      /* ProxyArray */
      || prop !== "length",
      enumerable: desc.enumerable,
      value: owner[prop]
    };
  },
  defineProperty: function defineProperty() {
    die(11);
  },
  getPrototypeOf: function getPrototypeOf(state) {
    return Object.getPrototypeOf(state.base_);
  },
  setPrototypeOf: function setPrototypeOf() {
    die(12);
  }
};
/**
 * Array drafts
 */

var arrayTraps = {};
each(objectTraps, function (key, fn) {
  // @ts-ignore
  arrayTraps[key] = function () {
    arguments[0] = arguments[0][0];
    return fn.apply(this, arguments);
  };
});

arrayTraps.deleteProperty = function (state, prop) {
  if ( isNaN(parseInt(prop))) die(13); // @ts-ignore

  return arrayTraps.set.call(this, state, prop, undefined);
};

arrayTraps.set = function (state, prop, value) {
  if ( prop !== "length" && isNaN(parseInt(prop))) die(14);
  return objectTraps.set.call(this, state[0], prop, value, state[0]);
}; // Access a property without creating an Immer draft.


function peek(draft, prop) {
  var state = draft[DRAFT_STATE];
  var source = state ? latest(state) : draft;
  return source[prop];
}

function readPropFromProto(state, source, prop) {
  var _desc$get;

  var desc = getDescriptorFromProto(source, prop);
  return desc ? "value" in desc ? desc.value : // This is a very special case, if the prop is a getter defined by the
  // prototype, we should invoke it with the draft as context!
  (_desc$get = desc.get) === null || _desc$get === void 0 ? void 0 : _desc$get.call(state.draft_) : undefined;
}

function getDescriptorFromProto(source, prop) {
  // 'in' checks proto!
  if (!(prop in source)) return undefined;
  var proto = Object.getPrototypeOf(source);

  while (proto) {
    var desc = Object.getOwnPropertyDescriptor(proto, prop);
    if (desc) return desc;
    proto = Object.getPrototypeOf(proto);
  }

  return undefined;
}

function markChanged(state) {
  if (!state.modified_) {
    state.modified_ = true;

    if (state.parent_) {
      markChanged(state.parent_);
    }
  }
}
function prepareCopy(state) {
  if (!state.copy_) {
    state.copy_ = shallowCopy(state.base_);
  }
}

var Immer =
/*#__PURE__*/
function () {
  function Immer(config) {
    var _this = this;

    this.useProxies_ = hasProxies;
    this.autoFreeze_ = true;
    /**
     * The `produce` function takes a value and a "recipe function" (whose
     * return value often depends on the base state). The recipe function is
     * free to mutate its first argument however it wants. All mutations are
     * only ever applied to a __copy__ of the base state.
     *
     * Pass only a function to create a "curried producer" which relieves you
     * from passing the recipe function every time.
     *
     * Only plain objects and arrays are made mutable. All other objects are
     * considered uncopyable.
     *
     * Note: This function is __bound__ to its `Immer` instance.
     *
     * @param {any} base - the initial state
     * @param {Function} producer - function that receives a proxy of the base state as first argument and which can be freely modified
     * @param {Function} patchListener - optional function that will be called with all the patches produced here
     * @returns {any} a new state, or the initial state if nothing was modified
     */

    this.produce = function (base, recipe, patchListener) {
      // curried invocation
      if (typeof base === "function" && typeof recipe !== "function") {
        var defaultBase = recipe;
        recipe = base;
        var self = _this;
        return function curriedProduce(base) {
          var _this2 = this;

          if (base === void 0) {
            base = defaultBase;
          }

          for (var _len = arguments.length, args = new Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
            args[_key - 1] = arguments[_key];
          }

          return self.produce(base, function (draft) {
            var _recipe;

            return (_recipe = recipe).call.apply(_recipe, [_this2, draft].concat(args));
          }); // prettier-ignore
        };
      }

      if (typeof recipe !== "function") die(6);
      if (patchListener !== undefined && typeof patchListener !== "function") die(7);
      var result; // Only plain objects, arrays, and "immerable classes" are drafted.

      if (isDraftable(base)) {
        var scope = enterScope(_this);
        var proxy = createProxy(_this, base, undefined);
        var hasError = true;

        try {
          result = recipe(proxy);
          hasError = false;
        } finally {
          // finally instead of catch + rethrow better preserves original stack
          if (hasError) revokeScope(scope);else leaveScope(scope);
        }

        if (typeof Promise !== "undefined" && result instanceof Promise) {
          return result.then(function (result) {
            usePatchesInScope(scope, patchListener);
            return processResult(result, scope);
          }, function (error) {
            revokeScope(scope);
            throw error;
          });
        }

        usePatchesInScope(scope, patchListener);
        return processResult(result, scope);
      } else if (!base || typeof base !== "object") {
        result = recipe(base);
        if (result === undefined) result = base;
        if (result === NOTHING) result = undefined;
        if (_this.autoFreeze_) freeze(result, true);

        if (patchListener) {
          var p = [];
          var ip = [];
          getPlugin("Patches").generateReplacementPatches_(base, result, p, ip);
          patchListener(p, ip);
        }

        return result;
      } else die(21, base);
    };

    this.produceWithPatches = function (arg1, arg2, arg3) {
      if (typeof arg1 === "function") {
        return function (state) {
          for (var _len2 = arguments.length, args = new Array(_len2 > 1 ? _len2 - 1 : 0), _key2 = 1; _key2 < _len2; _key2++) {
            args[_key2 - 1] = arguments[_key2];
          }

          return _this.produceWithPatches(state, function (draft) {
            return arg1.apply(void 0, [draft].concat(args));
          });
        };
      }

      var patches, inversePatches;

      var result = _this.produce(arg1, arg2, function (p, ip) {
        patches = p;
        inversePatches = ip;
      });

      if (typeof Promise !== "undefined" && result instanceof Promise) {
        return result.then(function (nextState) {
          return [nextState, patches, inversePatches];
        });
      }

      return [result, patches, inversePatches];
    };

    if (typeof (config === null || config === void 0 ? void 0 : config.useProxies) === "boolean") this.setUseProxies(config.useProxies);
    if (typeof (config === null || config === void 0 ? void 0 : config.autoFreeze) === "boolean") this.setAutoFreeze(config.autoFreeze);
  }

  var _proto = Immer.prototype;

  _proto.createDraft = function createDraft(base) {
    if (!isDraftable(base)) die(8);
    if (isDraft(base)) base = current(base);
    var scope = enterScope(this);
    var proxy = createProxy(this, base, undefined);
    proxy[DRAFT_STATE].isManual_ = true;
    leaveScope(scope);
    return proxy;
  };

  _proto.finishDraft = function finishDraft(draft, patchListener) {
    var state = draft && draft[DRAFT_STATE];

    {
      if (!state || !state.isManual_) die(9);
      if (state.finalized_) die(10);
    }

    var scope = state.scope_;
    usePatchesInScope(scope, patchListener);
    return processResult(undefined, scope);
  }
  /**
   * Pass true to automatically freeze all copies created by Immer.
   *
   * By default, auto-freezing is enabled.
   */
  ;

  _proto.setAutoFreeze = function setAutoFreeze(value) {
    this.autoFreeze_ = value;
  }
  /**
   * Pass true to use the ES2015 `Proxy` class when creating drafts, which is
   * always faster than using ES5 proxies.
   *
   * By default, feature detection is used, so calling this is rarely necessary.
   */
  ;

  _proto.setUseProxies = function setUseProxies(value) {
    if (value && !hasProxies) {
      die(20);
    }

    this.useProxies_ = value;
  };

  _proto.applyPatches = function applyPatches(base, patches) {
    // If a patch replaces the entire state, take that replacement as base
    // before applying patches
    var i;

    for (i = patches.length - 1; i >= 0; i--) {
      var patch = patches[i];

      if (patch.path.length === 0 && patch.op === "replace") {
        base = patch.value;
        break;
      }
    } // If there was a patch that replaced the entire state, start from the
    // patch after that.


    if (i > -1) {
      patches = patches.slice(i + 1);
    }

    var applyPatchesImpl = getPlugin("Patches").applyPatches_;

    if (isDraft(base)) {
      // N.B: never hits if some patch a replacement, patches are never drafts
      return applyPatchesImpl(base, patches);
    } // Otherwise, produce a copy of the base state.


    return this.produce(base, function (draft) {
      return applyPatchesImpl(draft, patches);
    });
  };

  return Immer;
}();
function createProxy(immer, value, parent) {
  // precondition: createProxy should be guarded by isDraftable, so we know we can safely draft
  var draft = isMap(value) ? getPlugin("MapSet").proxyMap_(value, parent) : isSet(value) ? getPlugin("MapSet").proxySet_(value, parent) : immer.useProxies_ ? createProxyProxy(value, parent) : getPlugin("ES5").createES5Proxy_(value, parent);
  var scope = parent ? parent.scope_ : getCurrentScope();
  scope.drafts_.push(draft);
  return draft;
}

function current(value) {
  if (!isDraft(value)) die(22, value);
  return currentImpl(value);
}

function currentImpl(value) {
  if (!isDraftable(value)) return value;
  var state = value[DRAFT_STATE];
  var copy;
  var archType = getArchtype(value);

  if (state) {
    if (!state.modified_ && (state.type_ < 4 || !getPlugin("ES5").hasChanges_(state))) return state.base_; // Optimization: avoid generating new drafts during copying

    state.finalized_ = true;
    copy = copyHelper(value, archType);
    state.finalized_ = false;
  } else {
    copy = copyHelper(value, archType);
  }

  each(copy, function (key, childValue) {
    if (state && get(state.base_, key) === childValue) return; // no need to copy or search in something that didn't change

    set(copy, key, currentImpl(childValue));
  }); // In the future, we might consider freezing here, based on the current settings

  return archType === 3
  /* Set */
  ? new Set(copy) : copy;
}

function copyHelper(value, archType) {
  // creates a shallow copy, even if it is a map or set
  switch (archType) {
    case 2
    /* Map */
    :
      return new Map(value);

    case 3
    /* Set */
    :
      // Set will be cloned as array temporarily, so that we can replace individual items
      return Array.from(value);
  }

  return shallowCopy(value);
}

function enableES5() {
  function willFinalizeES5_(scope, result, isReplaced) {
    if (!isReplaced) {
      if (scope.patches_) {
        markChangesRecursively(scope.drafts_[0]);
      } // This is faster when we don't care about which attributes changed.


      markChangesSweep(scope.drafts_);
    } // When a child draft is returned, look for changes.
    else if (isDraft(result) && result[DRAFT_STATE].scope_ === scope) {
        markChangesSweep(scope.drafts_);
      }
  }

  function createES5Draft(isArray, base) {
    if (isArray) {
      var draft = new Array(base.length);

      for (var i = 0; i < base.length; i++) {
        Object.defineProperty(draft, "" + i, proxyProperty(i, true));
      }

      return draft;
    } else {
      var _descriptors = getOwnPropertyDescriptors(base);

      delete _descriptors[DRAFT_STATE];
      var keys = ownKeys(_descriptors);

      for (var _i = 0; _i < keys.length; _i++) {
        var key = keys[_i];
        _descriptors[key] = proxyProperty(key, isArray || !!_descriptors[key].enumerable);
      }

      return Object.create(Object.getPrototypeOf(base), _descriptors);
    }
  }

  function createES5Proxy_(base, parent) {
    var isArray = Array.isArray(base);
    var draft = createES5Draft(isArray, base);
    var state = {
      type_: isArray ? 5
      /* ES5Array */
      : 4
      /* ES5Object */
      ,
      scope_: parent ? parent.scope_ : getCurrentScope(),
      modified_: false,
      finalized_: false,
      assigned_: {},
      parent_: parent,
      // base is the object we are drafting
      base_: base,
      // draft is the draft object itself, that traps all reads and reads from either the base (if unmodified) or copy (if modified)
      draft_: draft,
      copy_: null,
      revoked_: false,
      isManual_: false
    };
    Object.defineProperty(draft, DRAFT_STATE, {
      value: state,
      // enumerable: false <- the default
      writable: true
    });
    return draft;
  } // property descriptors are recycled to make sure we don't create a get and set closure per property,
  // but share them all instead


  var descriptors = {};

  function proxyProperty(prop, enumerable) {
    var desc = descriptors[prop];

    if (desc) {
      desc.enumerable = enumerable;
    } else {
      descriptors[prop] = desc = {
        configurable: true,
        enumerable: enumerable,
        get: function get() {
          var state = this[DRAFT_STATE];
          assertUnrevoked(state); // @ts-ignore

          return objectTraps.get(state, prop);
        },
        set: function set(value) {
          var state = this[DRAFT_STATE];
          assertUnrevoked(state); // @ts-ignore

          objectTraps.set(state, prop, value);
        }
      };
    }

    return desc;
  } // This looks expensive, but only proxies are visited, and only objects without known changes are scanned.


  function markChangesSweep(drafts) {
    // The natural order of drafts in the `scope` array is based on when they
    // were accessed. By processing drafts in reverse natural order, we have a
    // better chance of processing leaf nodes first. When a leaf node is known to
    // have changed, we can avoid any traversal of its ancestor nodes.
    for (var i = drafts.length - 1; i >= 0; i--) {
      var state = drafts[i][DRAFT_STATE];

      if (!state.modified_) {
        switch (state.type_) {
          case 5
          /* ES5Array */
          :
            if (hasArrayChanges(state)) markChanged(state);
            break;

          case 4
          /* ES5Object */
          :
            if (hasObjectChanges(state)) markChanged(state);
            break;
        }
      }
    }
  }

  function markChangesRecursively(object) {
    if (!object || typeof object !== "object") return;
    var state = object[DRAFT_STATE];
    if (!state) return;
    var base_ = state.base_,
        draft_ = state.draft_,
        assigned_ = state.assigned_,
        type_ = state.type_;

    if (type_ === 4
    /* ES5Object */
    ) {
        // Look for added keys.
        // probably there is a faster way to detect changes, as sweep + recurse seems to do some
        // unnecessary work.
        // also: probably we can store the information we detect here, to speed up tree finalization!
        each(draft_, function (key) {
          if (key === DRAFT_STATE) return; // The `undefined` check is a fast path for pre-existing keys.

          if (base_[key] === undefined && !has(base_, key)) {
            assigned_[key] = true;
            markChanged(state);
          } else if (!assigned_[key]) {
            // Only untouched properties trigger recursion.
            markChangesRecursively(draft_[key]);
          }
        }); // Look for removed keys.

        each(base_, function (key) {
          // The `undefined` check is a fast path for pre-existing keys.
          if (draft_[key] === undefined && !has(draft_, key)) {
            assigned_[key] = false;
            markChanged(state);
          }
        });
      } else if (type_ === 5
    /* ES5Array */
    ) {
        if (hasArrayChanges(state)) {
          markChanged(state);
          assigned_.length = true;
        }

        if (draft_.length < base_.length) {
          for (var i = draft_.length; i < base_.length; i++) {
            assigned_[i] = false;
          }
        } else {
          for (var _i2 = base_.length; _i2 < draft_.length; _i2++) {
            assigned_[_i2] = true;
          }
        } // Minimum count is enough, the other parts has been processed.


        var min = Math.min(draft_.length, base_.length);

        for (var _i3 = 0; _i3 < min; _i3++) {
          // Only untouched indices trigger recursion.
          if (!draft_.hasOwnProperty(_i3)) {
            assigned_[_i3] = true;
          }

          if (assigned_[_i3] === undefined) markChangesRecursively(draft_[_i3]);
        }
      }
  }

  function hasObjectChanges(state) {
    var base_ = state.base_,
        draft_ = state.draft_; // Search for added keys and changed keys. Start at the back, because
    // non-numeric keys are ordered by time of definition on the object.

    var keys = ownKeys(draft_);

    for (var i = keys.length - 1; i >= 0; i--) {
      var key = keys[i];
      if (key === DRAFT_STATE) continue;
      var baseValue = base_[key]; // The `undefined` check is a fast path for pre-existing keys.

      if (baseValue === undefined && !has(base_, key)) {
        return true;
      } // Once a base key is deleted, future changes go undetected, because its
      // descriptor is erased. This branch detects any missed changes.
      else {
          var value = draft_[key];

          var _state = value && value[DRAFT_STATE];

          if (_state ? _state.base_ !== baseValue : !is(value, baseValue)) {
            return true;
          }
        }
    } // At this point, no keys were added or changed.
    // Compare key count to determine if keys were deleted.


    var baseIsDraft = !!base_[DRAFT_STATE];
    return keys.length !== ownKeys(base_).length + (baseIsDraft ? 0 : 1); // + 1 to correct for DRAFT_STATE
  }

  function hasArrayChanges(state) {
    var draft_ = state.draft_;
    if (draft_.length !== state.base_.length) return true; // See #116
    // If we first shorten the length, our array interceptors will be removed.
    // If after that new items are added, result in the same original length,
    // those last items will have no intercepting property.
    // So if there is no own descriptor on the last position, we know that items were removed and added
    // N.B.: splice, unshift, etc only shift values around, but not prop descriptors, so we only have to check
    // the last one
    // last descriptor can be not a trap, if the array was extended

    var descriptor = Object.getOwnPropertyDescriptor(draft_, draft_.length - 1); // descriptor can be null, but only for newly created sparse arrays, eg. new Array(10)

    if (descriptor && !descriptor.get) return true; // if we miss a property, it has been deleted, so array probobaly changed

    for (var i = 0; i < draft_.length; i++) {
      if (!draft_.hasOwnProperty(i)) return true;
    } // For all other cases, we don't have to compare, as they would have been picked up by the index setters


    return false;
  }

  function hasChanges_(state) {
    return state.type_ === 4
    /* ES5Object */
    ? hasObjectChanges(state) : hasArrayChanges(state);
  }

  function assertUnrevoked(state
  /*ES5State | MapState | SetState*/
  ) {
    if (state.revoked_) die(3, JSON.stringify(latest(state)));
  }

  loadPlugin("ES5", {
    createES5Proxy_: createES5Proxy_,
    willFinalizeES5_: willFinalizeES5_,
    hasChanges_: hasChanges_
  });
}

function enablePatches() {
  var REPLACE = "replace";
  var ADD = "add";
  var REMOVE = "remove";

  function generatePatches_(state, basePath, patches, inversePatches) {
    switch (state.type_) {
      case 0
      /* ProxyObject */
      :
      case 4
      /* ES5Object */
      :
      case 2
      /* Map */
      :
        return generatePatchesFromAssigned(state, basePath, patches, inversePatches);

      case 5
      /* ES5Array */
      :
      case 1
      /* ProxyArray */
      :
        return generateArrayPatches(state, basePath, patches, inversePatches);

      case 3
      /* Set */
      :
        return generateSetPatches(state, basePath, patches, inversePatches);
    }
  }

  function generateArrayPatches(state, basePath, patches, inversePatches) {
    var base_ = state.base_,
        assigned_ = state.assigned_;
    var copy_ = state.copy_; // Reduce complexity by ensuring `base` is never longer.

    if (copy_.length < base_.length) {
      var _ref = [copy_, base_];
      base_ = _ref[0];
      copy_ = _ref[1];
      var _ref2 = [inversePatches, patches];
      patches = _ref2[0];
      inversePatches = _ref2[1];
    } // Process replaced indices.


    for (var i = 0; i < base_.length; i++) {
      if (assigned_[i] && copy_[i] !== base_[i]) {
        var path = basePath.concat([i]);
        patches.push({
          op: REPLACE,
          path: path,
          // Need to maybe clone it, as it can in fact be the original value
          // due to the base/copy inversion at the start of this function
          value: clonePatchValueIfNeeded(copy_[i])
        });
        inversePatches.push({
          op: REPLACE,
          path: path,
          value: clonePatchValueIfNeeded(base_[i])
        });
      }
    } // Process added indices.


    for (var _i = base_.length; _i < copy_.length; _i++) {
      var _path = basePath.concat([_i]);

      patches.push({
        op: ADD,
        path: _path,
        // Need to maybe clone it, as it can in fact be the original value
        // due to the base/copy inversion at the start of this function
        value: clonePatchValueIfNeeded(copy_[_i])
      });
    }

    if (base_.length < copy_.length) {
      inversePatches.push({
        op: REPLACE,
        path: basePath.concat(["length"]),
        value: base_.length
      });
    }
  } // This is used for both Map objects and normal objects.


  function generatePatchesFromAssigned(state, basePath, patches, inversePatches) {
    var base_ = state.base_,
        copy_ = state.copy_;
    each(state.assigned_, function (key, assignedValue) {
      var origValue = get(base_, key);
      var value = get(copy_, key);
      var op = !assignedValue ? REMOVE : has(base_, key) ? REPLACE : ADD;
      if (origValue === value && op === REPLACE) return;
      var path = basePath.concat(key);
      patches.push(op === REMOVE ? {
        op: op,
        path: path
      } : {
        op: op,
        path: path,
        value: value
      });
      inversePatches.push(op === ADD ? {
        op: REMOVE,
        path: path
      } : op === REMOVE ? {
        op: ADD,
        path: path,
        value: clonePatchValueIfNeeded(origValue)
      } : {
        op: REPLACE,
        path: path,
        value: clonePatchValueIfNeeded(origValue)
      });
    });
  }

  function generateSetPatches(state, basePath, patches, inversePatches) {
    var base_ = state.base_,
        copy_ = state.copy_;
    var i = 0;
    base_.forEach(function (value) {
      if (!copy_.has(value)) {
        var path = basePath.concat([i]);
        patches.push({
          op: REMOVE,
          path: path,
          value: value
        });
        inversePatches.unshift({
          op: ADD,
          path: path,
          value: value
        });
      }

      i++;
    });
    i = 0;
    copy_.forEach(function (value) {
      if (!base_.has(value)) {
        var path = basePath.concat([i]);
        patches.push({
          op: ADD,
          path: path,
          value: value
        });
        inversePatches.unshift({
          op: REMOVE,
          path: path,
          value: value
        });
      }

      i++;
    });
  }

  function generateReplacementPatches_(baseValue, replacement, patches, inversePatches) {
    patches.push({
      op: REPLACE,
      path: [],
      value: replacement === NOTHING ? undefined : replacement
    });
    inversePatches.push({
      op: REPLACE,
      path: [],
      value: baseValue
    });
  }

  function applyPatches_(draft, patches) {
    patches.forEach(function (patch) {
      var path = patch.path,
          op = patch.op;
      var base = draft;

      for (var i = 0; i < path.length - 1; i++) {
        var parentType = getArchtype(base);
        var p = "" + path[i]; // See #738, avoid prototype pollution

        if ((parentType === 0
        /* Object */
        || parentType === 1
        /* Array */
        ) && (p === "__proto__" || p === "constructor")) die(24);
        if (typeof base === "function" && p === "prototype") die(24);
        base = get(base, p);
        if (typeof base !== "object") die(15, path.join("/"));
      }

      var type = getArchtype(base);
      var value = deepClonePatchValue(patch.value); // used to clone patch to ensure original patch is not modified, see #411

      var key = path[path.length - 1];

      switch (op) {
        case REPLACE:
          switch (type) {
            case 2
            /* Map */
            :
              return base.set(key, value);

            /* istanbul ignore next */

            case 3
            /* Set */
            :
              die(16);

            default:
              // if value is an object, then it's assigned by reference
              // in the following add or remove ops, the value field inside the patch will also be modifyed
              // so we use value from the cloned patch
              // @ts-ignore
              return base[key] = value;
          }

        case ADD:
          switch (type) {
            case 1
            /* Array */
            :
              return key === "-" ? base.push(value) : base.splice(key, 0, value);

            case 2
            /* Map */
            :
              return base.set(key, value);

            case 3
            /* Set */
            :
              return base.add(value);

            default:
              return base[key] = value;
          }

        case REMOVE:
          switch (type) {
            case 1
            /* Array */
            :
              return base.splice(key, 1);

            case 2
            /* Map */
            :
              return base.delete(key);

            case 3
            /* Set */
            :
              return base.delete(patch.value);

            default:
              return delete base[key];
          }

        default:
          die(17, op);
      }
    });
    return draft;
  }

  function deepClonePatchValue(obj) {
    if (!isDraftable(obj)) return obj;
    if (Array.isArray(obj)) return obj.map(deepClonePatchValue);
    if (isMap(obj)) return new Map(Array.from(obj.entries()).map(function (_ref3) {
      var k = _ref3[0],
          v = _ref3[1];
      return [k, deepClonePatchValue(v)];
    }));
    if (isSet(obj)) return new Set(Array.from(obj).map(deepClonePatchValue));
    var cloned = Object.create(Object.getPrototypeOf(obj));

    for (var key in obj) {
      cloned[key] = deepClonePatchValue(obj[key]);
    }

    if (has(obj, DRAFTABLE)) cloned[DRAFTABLE] = obj[DRAFTABLE];
    return cloned;
  }

  function clonePatchValueIfNeeded(obj) {
    if (isDraft(obj)) {
      return deepClonePatchValue(obj);
    } else return obj;
  }

  loadPlugin("Patches", {
    applyPatches_: applyPatches_,
    generatePatches_: generatePatches_,
    generateReplacementPatches_: generateReplacementPatches_
  });
}

// types only!
function enableMapSet() {
  /* istanbul ignore next */
  var _extendStatics = function extendStatics(d, b) {
    _extendStatics = Object.setPrototypeOf || {
      __proto__: []
    } instanceof Array && function (d, b) {
      d.__proto__ = b;
    } || function (d, b) {
      for (var p in b) {
        if (b.hasOwnProperty(p)) d[p] = b[p];
      }
    };

    return _extendStatics(d, b);
  }; // Ugly hack to resolve #502 and inherit built in Map / Set


  function __extends(d, b) {
    _extendStatics(d, b);

    function __() {
      this.constructor = d;
    }

    d.prototype = ( // @ts-ignore
    __.prototype = b.prototype, new __());
  }

  var DraftMap = function (_super) {
    __extends(DraftMap, _super); // Create class manually, cause #502


    function DraftMap(target, parent) {
      this[DRAFT_STATE] = {
        type_: 2
        /* Map */
        ,
        parent_: parent,
        scope_: parent ? parent.scope_ : getCurrentScope(),
        modified_: false,
        finalized_: false,
        copy_: undefined,
        assigned_: undefined,
        base_: target,
        draft_: this,
        isManual_: false,
        revoked_: false
      };
      return this;
    }

    var p = DraftMap.prototype;
    Object.defineProperty(p, "size", {
      get: function get() {
        return latest(this[DRAFT_STATE]).size;
      } // enumerable: false,
      // configurable: true

    });

    p.has = function (key) {
      return latest(this[DRAFT_STATE]).has(key);
    };

    p.set = function (key, value) {
      var state = this[DRAFT_STATE];
      assertUnrevoked(state);

      if (!latest(state).has(key) || latest(state).get(key) !== value) {
        prepareMapCopy(state);
        markChanged(state);
        state.assigned_.set(key, true);
        state.copy_.set(key, value);
        state.assigned_.set(key, true);
      }

      return this;
    };

    p.delete = function (key) {
      if (!this.has(key)) {
        return false;
      }

      var state = this[DRAFT_STATE];
      assertUnrevoked(state);
      prepareMapCopy(state);
      markChanged(state);

      if (state.base_.has(key)) {
        state.assigned_.set(key, false);
      } else {
        state.assigned_.delete(key);
      }

      state.copy_.delete(key);
      return true;
    };

    p.clear = function () {
      var state = this[DRAFT_STATE];
      assertUnrevoked(state);

      if (latest(state).size) {
        prepareMapCopy(state);
        markChanged(state);
        state.assigned_ = new Map();
        each(state.base_, function (key) {
          state.assigned_.set(key, false);
        });
        state.copy_.clear();
      }
    };

    p.forEach = function (cb, thisArg) {
      var _this = this;

      var state = this[DRAFT_STATE];
      latest(state).forEach(function (_value, key, _map) {
        cb.call(thisArg, _this.get(key), key, _this);
      });
    };

    p.get = function (key) {
      var state = this[DRAFT_STATE];
      assertUnrevoked(state);
      var value = latest(state).get(key);

      if (state.finalized_ || !isDraftable(value)) {
        return value;
      }

      if (value !== state.base_.get(key)) {
        return value; // either already drafted or reassigned
      } // despite what it looks, this creates a draft only once, see above condition


      var draft = createProxy(state.scope_.immer_, value, state);
      prepareMapCopy(state);
      state.copy_.set(key, draft);
      return draft;
    };

    p.keys = function () {
      return latest(this[DRAFT_STATE]).keys();
    };

    p.values = function () {
      var _this2 = this,
          _ref;

      var iterator = this.keys();
      return _ref = {}, _ref[iteratorSymbol] = function () {
        return _this2.values();
      }, _ref.next = function next() {
        var r = iterator.next();
        /* istanbul ignore next */

        if (r.done) return r;

        var value = _this2.get(r.value);

        return {
          done: false,
          value: value
        };
      }, _ref;
    };

    p.entries = function () {
      var _this3 = this,
          _ref2;

      var iterator = this.keys();
      return _ref2 = {}, _ref2[iteratorSymbol] = function () {
        return _this3.entries();
      }, _ref2.next = function next() {
        var r = iterator.next();
        /* istanbul ignore next */

        if (r.done) return r;

        var value = _this3.get(r.value);

        return {
          done: false,
          value: [r.value, value]
        };
      }, _ref2;
    };

    p[iteratorSymbol] = function () {
      return this.entries();
    };

    return DraftMap;
  }(Map);

  function proxyMap_(target, parent) {
    // @ts-ignore
    return new DraftMap(target, parent);
  }

  function prepareMapCopy(state) {
    if (!state.copy_) {
      state.assigned_ = new Map();
      state.copy_ = new Map(state.base_);
    }
  }

  var DraftSet = function (_super) {
    __extends(DraftSet, _super); // Create class manually, cause #502


    function DraftSet(target, parent) {
      this[DRAFT_STATE] = {
        type_: 3
        /* Set */
        ,
        parent_: parent,
        scope_: parent ? parent.scope_ : getCurrentScope(),
        modified_: false,
        finalized_: false,
        copy_: undefined,
        base_: target,
        draft_: this,
        drafts_: new Map(),
        revoked_: false,
        isManual_: false
      };
      return this;
    }

    var p = DraftSet.prototype;
    Object.defineProperty(p, "size", {
      get: function get() {
        return latest(this[DRAFT_STATE]).size;
      } // enumerable: true,

    });

    p.has = function (value) {
      var state = this[DRAFT_STATE];
      assertUnrevoked(state); // bit of trickery here, to be able to recognize both the value, and the draft of its value

      if (!state.copy_) {
        return state.base_.has(value);
      }

      if (state.copy_.has(value)) return true;
      if (state.drafts_.has(value) && state.copy_.has(state.drafts_.get(value))) return true;
      return false;
    };

    p.add = function (value) {
      var state = this[DRAFT_STATE];
      assertUnrevoked(state);

      if (!this.has(value)) {
        prepareSetCopy(state);
        markChanged(state);
        state.copy_.add(value);
      }

      return this;
    };

    p.delete = function (value) {
      if (!this.has(value)) {
        return false;
      }

      var state = this[DRAFT_STATE];
      assertUnrevoked(state);
      prepareSetCopy(state);
      markChanged(state);
      return state.copy_.delete(value) || (state.drafts_.has(value) ? state.copy_.delete(state.drafts_.get(value)) :
      /* istanbul ignore next */
      false);
    };

    p.clear = function () {
      var state = this[DRAFT_STATE];
      assertUnrevoked(state);

      if (latest(state).size) {
        prepareSetCopy(state);
        markChanged(state);
        state.copy_.clear();
      }
    };

    p.values = function () {
      var state = this[DRAFT_STATE];
      assertUnrevoked(state);
      prepareSetCopy(state);
      return state.copy_.values();
    };

    p.entries = function entries() {
      var state = this[DRAFT_STATE];
      assertUnrevoked(state);
      prepareSetCopy(state);
      return state.copy_.entries();
    };

    p.keys = function () {
      return this.values();
    };

    p[iteratorSymbol] = function () {
      return this.values();
    };

    p.forEach = function forEach(cb, thisArg) {
      var iterator = this.values();
      var result = iterator.next();

      while (!result.done) {
        cb.call(thisArg, result.value, result.value, this);
        result = iterator.next();
      }
    };

    return DraftSet;
  }(Set);

  function proxySet_(target, parent) {
    // @ts-ignore
    return new DraftSet(target, parent);
  }

  function prepareSetCopy(state) {
    if (!state.copy_) {
      // create drafts for all entries to preserve insertion order
      state.copy_ = new Set();
      state.base_.forEach(function (value) {
        if (isDraftable(value)) {
          var draft = createProxy(state.scope_.immer_, value, state);
          state.drafts_.set(value, draft);
          state.copy_.add(draft);
        } else {
          state.copy_.add(value);
        }
      });
    }
  }

  function assertUnrevoked(state
  /*ES5State | MapState | SetState*/
  ) {
    if (state.revoked_) die(3, JSON.stringify(latest(state)));
  }

  loadPlugin("MapSet", {
    proxyMap_: proxyMap_,
    proxySet_: proxySet_
  });
}

function enableAllPlugins() {
  enableES5();
  enableMapSet();
  enablePatches();
}

var immer =
/*#__PURE__*/
new Immer();
/**
 * The `produce` function takes a value and a "recipe function" (whose
 * return value often depends on the base state). The recipe function is
 * free to mutate its first argument however it wants. All mutations are
 * only ever applied to a __copy__ of the base state.
 *
 * Pass only a function to create a "curried producer" which relieves you
 * from passing the recipe function every time.
 *
 * Only plain objects and arrays are made mutable. All other objects are
 * considered uncopyable.
 *
 * Note: This function is __bound__ to its `Immer` instance.
 *
 * @param {any} base - the initial state
 * @param {Function} producer - function that receives a proxy of the base state as first argument and which can be freely modified
 * @param {Function} patchListener - optional function that will be called with all the patches produced here
 * @returns {any} a new state, or the initial state if nothing was modified
 */

var produce = immer.produce;
/**
 * Like `produce`, but `produceWithPatches` always returns a tuple
 * [nextState, patches, inversePatches] (instead of just the next state)
 */

var produceWithPatches =
/*#__PURE__*/
immer.produceWithPatches.bind(immer);
/**
 * Pass true to automatically freeze all copies created by Immer.
 *
 * Always freeze by default, even in production mode
 */

var setAutoFreeze =
/*#__PURE__*/
immer.setAutoFreeze.bind(immer);
/**
 * Pass true to use the ES2015 `Proxy` class when creating drafts, which is
 * always faster than using ES5 proxies.
 *
 * By default, feature detection is used, so calling this is rarely necessary.
 */

var setUseProxies =
/*#__PURE__*/
immer.setUseProxies.bind(immer);
/**
 * Apply an array of Immer patches to the first argument.
 *
 * This function is a producer, which means copy-on-write is in effect.
 */

var applyPatches =
/*#__PURE__*/
immer.applyPatches.bind(immer);
/**
 * Create an Immer draft from the given base state, which may be a draft itself.
 * The draft can be modified until you finalize it with the `finishDraft` function.
 */

var createDraft =
/*#__PURE__*/
immer.createDraft.bind(immer);
/**
 * Finalize an Immer draft from a `createDraft` call, returning the base state
 * (if no changes were made) or a modified copy. The draft must *not* be
 * mutated afterwards.
 *
 * Pass a function as the 2nd argument to generate Immer patches based on the
 * changes that were made.
 */

var finishDraft =
/*#__PURE__*/
immer.finishDraft.bind(immer);
/**
 * This function is actually a no-op, but can be used to cast an immutable type
 * to an draft type and make TypeScript happy
 *
 * @param value
 */

function castDraft(value) {
  return value;
}
/**
 * This function is actually a no-op, but can be used to cast a mutable type
 * to an immutable type and make TypeScript happy
 * @param value
 */

function castImmutable(value) {
  return value;
}

exports.Immer = Immer;
exports.applyPatches = applyPatches;
exports.castDraft = castDraft;
exports.castImmutable = castImmutable;
exports.createDraft = createDraft;
exports.current = current;
exports.default = produce;
exports.enableAllPlugins = enableAllPlugins;
exports.enableES5 = enableES5;
exports.enableMapSet = enableMapSet;
exports.enablePatches = enablePatches;
exports.finishDraft = finishDraft;
exports.freeze = freeze;
exports.immerable = DRAFTABLE;
exports.isDraft = isDraft;
exports.isDraftable = isDraftable;
exports.nothing = NOTHING;
exports.original = original;
exports.produce = produce;
exports.produceWithPatches = produceWithPatches;
exports.setAutoFreeze = setAutoFreeze;
exports.setUseProxies = setUseProxies;


},{}],25:[function(require,module,exports){
function n(n){for(var t=arguments.length,r=Array(t>1?t-1:0),e=1;e<t;e++)r[e-1]=arguments[e];throw Error("[Immer] minified error nr: "+n+(r.length?" "+r.map((function(n){return"'"+n+"'"})).join(","):"")+". Find the full error at: https://bit.ly/3cXEKWf")}function t(n){return!!n&&!!n[H]}function r(n){return!!n&&(function(n){if(!n||"object"!=typeof n)return!1;var t=Object.getPrototypeOf(n);if(null===t)return!0;var r=Object.hasOwnProperty.call(t,"constructor")&&t.constructor;return r===Object||"function"==typeof r&&Function.toString.call(r)===Q}(n)||Array.isArray(n)||!!n[G]||!!n.constructor[G]||c(n)||v(n))}function e(n,t,r){void 0===r&&(r=!1),0===i(n)?(r?Object.keys:T)(n).forEach((function(e){r&&"symbol"==typeof e||t(e,n[e],n)})):n.forEach((function(r,e){return t(e,r,n)}))}function i(n){var t=n[H];return t?t.t>3?t.t-4:t.t:Array.isArray(n)?1:c(n)?2:v(n)?3:0}function u(n,t){return 2===i(n)?n.has(t):Object.prototype.hasOwnProperty.call(n,t)}function o(n,t){return 2===i(n)?n.get(t):n[t]}function f(n,t,r){var e=i(n);2===e?n.set(t,r):3===e?(n.delete(t),n.add(r)):n[t]=r}function a(n,t){return n===t?0!==n||1/n==1/t:n!=n&&t!=t}function c(n){return W&&n instanceof Map}function v(n){return X&&n instanceof Set}function s(n){return n.i||n.u}function p(n){if(Array.isArray(n))return Array.prototype.slice.call(n);var t=U(n);delete t[H];for(var r=T(t),e=0;e<r.length;e++){var i=r[e],u=t[i];!1===u.writable&&(u.writable=!0,u.configurable=!0),(u.get||u.set)&&(t[i]={configurable:!0,writable:!0,enumerable:u.enumerable,value:n[i]})}return Object.create(Object.getPrototypeOf(n),t)}function l(n,u){return void 0===u&&(u=!1),h(n)||t(n)||!r(n)?n:(i(n)>1&&(n.set=n.add=n.clear=n.delete=d),Object.freeze(n),u&&e(n,(function(n,t){return l(t,!0)}),!0),n)}function d(){n(2)}function h(n){return null==n||"object"!=typeof n||Object.isFrozen(n)}function y(t){var r=V[t];return r||n(18,t),r}function _(n,t){V[n]||(V[n]=t)}function b(){return J}function m(n,t){t&&(y("Patches"),n.o=[],n.v=[],n.s=t)}function j(n){O(n),n.p.forEach(w),n.p=null}function O(n){n===J&&(J=n.l)}function x(n){return J={p:[],l:J,h:n,_:!0,m:0}}function w(n){var t=n[H];0===t.t||1===t.t?t.j():t.O=!0}function S(t,e){e.m=e.p.length;var i=e.p[0],u=void 0!==t&&t!==i;return e.h.S||y("ES5").P(e,t,u),u?(i[H].M&&(j(e),n(4)),r(t)&&(t=P(e,t),e.l||g(e,t)),e.o&&y("Patches").g(i[H].u,t,e.o,e.v)):t=P(e,i,[]),j(e),e.o&&e.s(e.o,e.v),t!==B?t:void 0}function P(n,t,r){if(h(t))return t;var i=t[H];if(!i)return e(t,(function(e,u){return M(n,i,t,e,u,r)}),!0),t;if(i.A!==n)return t;if(!i.M)return g(n,i.u,!0),i.u;if(!i.R){i.R=!0,i.A.m--;var u=4===i.t||5===i.t?i.i=p(i.k):i.i;e(3===i.t?new Set(u):u,(function(t,e){return M(n,i,u,t,e,r)})),g(n,u,!1),r&&n.o&&y("Patches").F(i,r,n.o,n.v)}return i.i}function M(n,e,i,o,a,c){if(t(a)){var v=P(n,a,c&&e&&3!==e.t&&!u(e.D,o)?c.concat(o):void 0);if(f(i,o,v),!t(v))return;n._=!1}if(r(a)&&!h(a)){if(!n.h.K&&n.m<1)return;P(n,a),e&&e.A.l||g(n,a)}}function g(n,t,r){void 0===r&&(r=!1),n.h.K&&n._&&l(t,r)}function A(n,t){var r=n[H];return(r?s(r):n)[t]}function z(n,t){if(t in n)for(var r=Object.getPrototypeOf(n);r;){var e=Object.getOwnPropertyDescriptor(r,t);if(e)return e;r=Object.getPrototypeOf(r)}}function E(n){n.M||(n.M=!0,n.l&&E(n.l))}function R(n){n.i||(n.i=p(n.u))}function k(n,t,r){var e=c(t)?y("MapSet").$(t,r):v(t)?y("MapSet").C(t,r):n.S?function(n,t){var r=Array.isArray(n),e={t:r?1:0,A:t?t.A:b(),M:!1,R:!1,D:{},l:t,u:n,k:null,i:null,j:null,I:!1},i=e,u=Y;r&&(i=[e],u=Z);var o=Proxy.revocable(i,u),f=o.revoke,a=o.proxy;return e.k=a,e.j=f,a}(t,r):y("ES5").J(t,r);return(r?r.A:b()).p.push(e),e}function F(u){return t(u)||n(22,u),function n(t){if(!r(t))return t;var u,a=t[H],c=i(t);if(a){if(!a.M&&(a.t<4||!y("ES5").N(a)))return a.u;a.R=!0,u=D(t,c),a.R=!1}else u=D(t,c);return e(u,(function(t,r){a&&o(a.u,t)===r||f(u,t,n(r))})),3===c?new Set(u):u}(u)}function D(n,t){switch(t){case 2:return new Map(n);case 3:return Array.from(n)}return p(n)}function K(){function n(n,t){var r=f[n];return r?r.enumerable=t:f[n]=r={configurable:!0,enumerable:t,get:function(){return Y.get(this[H],n)},set:function(t){Y.set(this[H],n,t)}},r}function r(n){for(var t=n.length-1;t>=0;t--){var r=n[t][H];if(!r.M)switch(r.t){case 5:o(r)&&E(r);break;case 4:i(r)&&E(r)}}}function i(n){for(var t=n.u,r=n.k,e=T(r),i=e.length-1;i>=0;i--){var o=e[i];if(o!==H){var f=t[o];if(void 0===f&&!u(t,o))return!0;var c=r[o],v=c&&c[H];if(v?v.u!==f:!a(c,f))return!0}}var s=!!t[H];return e.length!==T(t).length+(s?0:1)}function o(n){var t=n.k;if(t.length!==n.u.length)return!0;var r=Object.getOwnPropertyDescriptor(t,t.length-1);if(r&&!r.get)return!0;for(var e=0;e<t.length;e++)if(!t.hasOwnProperty(e))return!0;return!1}var f={};_("ES5",{J:function(t,r){var e=Array.isArray(t),i=function(t,r){if(t){for(var e=Array(r.length),i=0;i<r.length;i++)Object.defineProperty(e,""+i,n(i,!0));return e}var u=U(r);delete u[H];for(var o=T(u),f=0;f<o.length;f++){var a=o[f];u[a]=n(a,t||!!u[a].enumerable)}return Object.create(Object.getPrototypeOf(r),u)}(e,t),u={t:e?5:4,A:r?r.A:b(),M:!1,R:!1,D:{},l:r,u:t,k:i,i:null,O:!1,I:!1};return Object.defineProperty(i,H,{value:u,writable:!0}),i},P:function(n,i,f){f?t(i)&&i[H].A===n&&r(n.p):(n.o&&function n(t){if(t&&"object"==typeof t){var r=t[H];if(r){var i=r.u,f=r.k,a=r.D,c=r.t;if(4===c)e(f,(function(t){t!==H&&(void 0!==i[t]||u(i,t)?a[t]||n(f[t]):(a[t]=!0,E(r)))})),e(i,(function(n){void 0!==f[n]||u(f,n)||(a[n]=!1,E(r))}));else if(5===c){if(o(r)&&(E(r),a.length=!0),f.length<i.length)for(var v=f.length;v<i.length;v++)a[v]=!1;else for(var s=i.length;s<f.length;s++)a[s]=!0;for(var p=Math.min(f.length,i.length),l=0;l<p;l++)f.hasOwnProperty(l)||(a[l]=!0),void 0===a[l]&&n(f[l])}}}}(n.p[0]),r(n.p))},N:function(n){return 4===n.t?i(n):o(n)}})}function $(){function f(n){if(!r(n))return n;if(Array.isArray(n))return n.map(f);if(c(n))return new Map(Array.from(n.entries()).map((function(n){return[n[0],f(n[1])]})));if(v(n))return new Set(Array.from(n).map(f));var t=Object.create(Object.getPrototypeOf(n));for(var e in n)t[e]=f(n[e]);return u(n,G)&&(t[G]=n[G]),t}function a(n){return t(n)?f(n):n}var s="add";_("Patches",{W:function(t,r){return r.forEach((function(r){for(var e=r.path,u=r.op,a=t,c=0;c<e.length-1;c++){var v=i(a),p=""+e[c];0!==v&&1!==v||"__proto__"!==p&&"constructor"!==p||n(24),"function"==typeof a&&"prototype"===p&&n(24),"object"!=typeof(a=o(a,p))&&n(15,e.join("/"))}var l=i(a),d=f(r.value),h=e[e.length-1];switch(u){case"replace":switch(l){case 2:return a.set(h,d);case 3:n(16);default:return a[h]=d}case s:switch(l){case 1:return"-"===h?a.push(d):a.splice(h,0,d);case 2:return a.set(h,d);case 3:return a.add(d);default:return a[h]=d}case"remove":switch(l){case 1:return a.splice(h,1);case 2:return a.delete(h);case 3:return a.delete(r.value);default:return delete a[h]}default:n(17,u)}})),t},F:function(n,t,r,i){switch(n.t){case 0:case 4:case 2:return function(n,t,r,i){var f=n.u,c=n.i;e(n.D,(function(n,e){var v=o(f,n),p=o(c,n),l=e?u(f,n)?"replace":s:"remove";if(v!==p||"replace"!==l){var d=t.concat(n);r.push("remove"===l?{op:l,path:d}:{op:l,path:d,value:p}),i.push(l===s?{op:"remove",path:d}:"remove"===l?{op:s,path:d,value:a(v)}:{op:"replace",path:d,value:a(v)})}}))}(n,t,r,i);case 5:case 1:return function(n,t,r,e){var i=n.u,u=n.D,o=n.i;if(o.length<i.length){var f=[o,i];i=f[0],o=f[1];var c=[e,r];r=c[0],e=c[1]}for(var v=0;v<i.length;v++)if(u[v]&&o[v]!==i[v]){var p=t.concat([v]);r.push({op:"replace",path:p,value:a(o[v])}),e.push({op:"replace",path:p,value:a(i[v])})}for(var l=i.length;l<o.length;l++){var d=t.concat([l]);r.push({op:s,path:d,value:a(o[l])})}i.length<o.length&&e.push({op:"replace",path:t.concat(["length"]),value:i.length})}(n,t,r,i);case 3:return function(n,t,r,e){var i=n.u,u=n.i,o=0;i.forEach((function(n){if(!u.has(n)){var i=t.concat([o]);r.push({op:"remove",path:i,value:n}),e.unshift({op:s,path:i,value:n})}o++})),o=0,u.forEach((function(n){if(!i.has(n)){var u=t.concat([o]);r.push({op:s,path:u,value:n}),e.unshift({op:"remove",path:u,value:n})}o++}))}(n,t,r,i)}},g:function(n,t,r,e){r.push({op:"replace",path:[],value:t===B?void 0:t}),e.push({op:"replace",path:[],value:n})}})}function C(){function t(n,t){function r(){this.constructor=n}f(n,t),n.prototype=(r.prototype=t.prototype,new r)}function i(n){n.i||(n.D=new Map,n.i=new Map(n.u))}function u(n){n.i||(n.i=new Set,n.u.forEach((function(t){if(r(t)){var e=k(n.A.h,t,n);n.p.set(t,e),n.i.add(e)}else n.i.add(t)})))}function o(t){t.O&&n(3,JSON.stringify(s(t)))}var f=function(n,t){return(f=Object.setPrototypeOf||{__proto__:[]}instanceof Array&&function(n,t){n.__proto__=t}||function(n,t){for(var r in t)t.hasOwnProperty(r)&&(n[r]=t[r])})(n,t)},a=function(){function n(n,t){return this[H]={t:2,l:t,A:t?t.A:b(),M:!1,R:!1,i:void 0,D:void 0,u:n,k:this,I:!1,O:!1},this}t(n,Map);var u=n.prototype;return Object.defineProperty(u,"size",{get:function(){return s(this[H]).size}}),u.has=function(n){return s(this[H]).has(n)},u.set=function(n,t){var r=this[H];return o(r),s(r).has(n)&&s(r).get(n)===t||(i(r),E(r),r.D.set(n,!0),r.i.set(n,t),r.D.set(n,!0)),this},u.delete=function(n){if(!this.has(n))return!1;var t=this[H];return o(t),i(t),E(t),t.u.has(n)?t.D.set(n,!1):t.D.delete(n),t.i.delete(n),!0},u.clear=function(){var n=this[H];o(n),s(n).size&&(i(n),E(n),n.D=new Map,e(n.u,(function(t){n.D.set(t,!1)})),n.i.clear())},u.forEach=function(n,t){var r=this;s(this[H]).forEach((function(e,i){n.call(t,r.get(i),i,r)}))},u.get=function(n){var t=this[H];o(t);var e=s(t).get(n);if(t.R||!r(e))return e;if(e!==t.u.get(n))return e;var u=k(t.A.h,e,t);return i(t),t.i.set(n,u),u},u.keys=function(){return s(this[H]).keys()},u.values=function(){var n,t=this,r=this.keys();return(n={})[L]=function(){return t.values()},n.next=function(){var n=r.next();return n.done?n:{done:!1,value:t.get(n.value)}},n},u.entries=function(){var n,t=this,r=this.keys();return(n={})[L]=function(){return t.entries()},n.next=function(){var n=r.next();if(n.done)return n;var e=t.get(n.value);return{done:!1,value:[n.value,e]}},n},u[L]=function(){return this.entries()},n}(),c=function(){function n(n,t){return this[H]={t:3,l:t,A:t?t.A:b(),M:!1,R:!1,i:void 0,u:n,k:this,p:new Map,O:!1,I:!1},this}t(n,Set);var r=n.prototype;return Object.defineProperty(r,"size",{get:function(){return s(this[H]).size}}),r.has=function(n){var t=this[H];return o(t),t.i?!!t.i.has(n)||!(!t.p.has(n)||!t.i.has(t.p.get(n))):t.u.has(n)},r.add=function(n){var t=this[H];return o(t),this.has(n)||(u(t),E(t),t.i.add(n)),this},r.delete=function(n){if(!this.has(n))return!1;var t=this[H];return o(t),u(t),E(t),t.i.delete(n)||!!t.p.has(n)&&t.i.delete(t.p.get(n))},r.clear=function(){var n=this[H];o(n),s(n).size&&(u(n),E(n),n.i.clear())},r.values=function(){var n=this[H];return o(n),u(n),n.i.values()},r.entries=function(){var n=this[H];return o(n),u(n),n.i.entries()},r.keys=function(){return this.values()},r[L]=function(){return this.values()},r.forEach=function(n,t){for(var r=this.values(),e=r.next();!e.done;)n.call(t,e.value,e.value,this),e=r.next()},n}();_("MapSet",{$:function(n,t){return new a(n,t)},C:function(n,t){return new c(n,t)}})}var I;Object.defineProperty(exports,"__esModule",{value:!0});var J,N="undefined"!=typeof Symbol&&"symbol"==typeof Symbol("x"),W="undefined"!=typeof Map,X="undefined"!=typeof Set,q="undefined"!=typeof Proxy&&void 0!==Proxy.revocable&&"undefined"!=typeof Reflect,B=N?Symbol.for("immer-nothing"):((I={})["immer-nothing"]=!0,I),G=N?Symbol.for("immer-draftable"):"__$immer_draftable",H=N?Symbol.for("immer-state"):"__$immer_state",L="undefined"!=typeof Symbol&&Symbol.iterator||"@@iterator",Q=""+Object.prototype.constructor,T="undefined"!=typeof Reflect&&Reflect.ownKeys?Reflect.ownKeys:void 0!==Object.getOwnPropertySymbols?function(n){return Object.getOwnPropertyNames(n).concat(Object.getOwnPropertySymbols(n))}:Object.getOwnPropertyNames,U=Object.getOwnPropertyDescriptors||function(n){var t={};return T(n).forEach((function(r){t[r]=Object.getOwnPropertyDescriptor(n,r)})),t},V={},Y={get:function(n,t){if(t===H)return n;var e=s(n);if(!u(e,t))return function(n,t,r){var e,i=z(t,r);return i?"value"in i?i.value:null===(e=i.get)||void 0===e?void 0:e.call(n.k):void 0}(n,e,t);var i=e[t];return n.R||!r(i)?i:i===A(n.u,t)?(R(n),n.i[t]=k(n.A.h,i,n)):i},has:function(n,t){return t in s(n)},ownKeys:function(n){return Reflect.ownKeys(s(n))},set:function(n,t,r){var e=z(s(n),t);if(null==e?void 0:e.set)return e.set.call(n.k,r),!0;if(!n.M){var i=A(s(n),t),o=null==i?void 0:i[H];if(o&&o.u===r)return n.i[t]=r,n.D[t]=!1,!0;if(a(r,i)&&(void 0!==r||u(n.u,t)))return!0;R(n),E(n)}return n.i[t]===r&&"number"!=typeof r&&(void 0!==r||t in n.i)||(n.i[t]=r,n.D[t]=!0,!0)},deleteProperty:function(n,t){return void 0!==A(n.u,t)||t in n.u?(n.D[t]=!1,R(n),E(n)):delete n.D[t],n.i&&delete n.i[t],!0},getOwnPropertyDescriptor:function(n,t){var r=s(n),e=Reflect.getOwnPropertyDescriptor(r,t);return e?{writable:!0,configurable:1!==n.t||"length"!==t,enumerable:e.enumerable,value:r[t]}:e},defineProperty:function(){n(11)},getPrototypeOf:function(n){return Object.getPrototypeOf(n.u)},setPrototypeOf:function(){n(12)}},Z={};e(Y,(function(n,t){Z[n]=function(){return arguments[0]=arguments[0][0],t.apply(this,arguments)}})),Z.deleteProperty=function(n,t){return Z.set.call(this,n,t,void 0)},Z.set=function(n,t,r){return Y.set.call(this,n[0],t,r,n[0])};var nn=function(){function e(t){var e=this;this.S=q,this.K=!0,this.produce=function(t,i,u){if("function"==typeof t&&"function"!=typeof i){var o=i;i=t;var f=e;return function(n){var t=this;void 0===n&&(n=o);for(var r=arguments.length,e=Array(r>1?r-1:0),u=1;u<r;u++)e[u-1]=arguments[u];return f.produce(n,(function(n){var r;return(r=i).call.apply(r,[t,n].concat(e))}))}}var a;if("function"!=typeof i&&n(6),void 0!==u&&"function"!=typeof u&&n(7),r(t)){var c=x(e),v=k(e,t,void 0),s=!0;try{a=i(v),s=!1}finally{s?j(c):O(c)}return"undefined"!=typeof Promise&&a instanceof Promise?a.then((function(n){return m(c,u),S(n,c)}),(function(n){throw j(c),n})):(m(c,u),S(a,c))}if(!t||"object"!=typeof t){if(void 0===(a=i(t))&&(a=t),a===B&&(a=void 0),e.K&&l(a,!0),u){var p=[],d=[];y("Patches").g(t,a,p,d),u(p,d)}return a}n(21,t)},this.produceWithPatches=function(n,t){if("function"==typeof n)return function(t){for(var r=arguments.length,i=Array(r>1?r-1:0),u=1;u<r;u++)i[u-1]=arguments[u];return e.produceWithPatches(t,(function(t){return n.apply(void 0,[t].concat(i))}))};var r,i,u=e.produce(n,t,(function(n,t){r=n,i=t}));return"undefined"!=typeof Promise&&u instanceof Promise?u.then((function(n){return[n,r,i]})):[u,r,i]},"boolean"==typeof(null==t?void 0:t.useProxies)&&this.setUseProxies(t.useProxies),"boolean"==typeof(null==t?void 0:t.autoFreeze)&&this.setAutoFreeze(t.autoFreeze)}var i=e.prototype;return i.createDraft=function(e){r(e)||n(8),t(e)&&(e=F(e));var i=x(this),u=k(this,e,void 0);return u[H].I=!0,O(i),u},i.finishDraft=function(n,t){var r=(n&&n[H]).A;return m(r,t),S(void 0,r)},i.setAutoFreeze=function(n){this.K=n},i.setUseProxies=function(t){t&&!q&&n(20),this.S=t},i.applyPatches=function(n,r){var e;for(e=r.length-1;e>=0;e--){var i=r[e];if(0===i.path.length&&"replace"===i.op){n=i.value;break}}e>-1&&(r=r.slice(e+1));var u=y("Patches").W;return t(n)?u(n,r):this.produce(n,(function(n){return u(n,r)}))},e}(),tn=new nn,rn=tn.produce,en=tn.produceWithPatches.bind(tn),un=tn.setAutoFreeze.bind(tn),on=tn.setUseProxies.bind(tn),fn=tn.applyPatches.bind(tn),an=tn.createDraft.bind(tn),cn=tn.finishDraft.bind(tn);exports.Immer=nn,exports.applyPatches=fn,exports.castDraft=function(n){return n},exports.castImmutable=function(n){return n},exports.createDraft=an,exports.current=F,exports.default=rn,exports.enableAllPlugins=function(){K(),C(),$()},exports.enableES5=K,exports.enableMapSet=C,exports.enablePatches=$,exports.finishDraft=cn,exports.freeze=l,exports.immerable=G,exports.isDraft=t,exports.isDraftable=r,exports.nothing=B,exports.original=function(r){return t(r)||n(23,r),r[H].u},exports.produce=rn,exports.produceWithPatches=en,exports.setAutoFreeze=un,exports.setUseProxies=on;


},{}],26:[function(require,module,exports){
(function (process){(function (){

'use strict'

if (process.env.NODE_ENV === 'production') {
  module.exports = require('./immer.cjs.production.min.js')
} else {
  module.exports = require('./immer.cjs.development.js')
}

}).call(this)}).call(this,require('_process'))
},{"./immer.cjs.development.js":24,"./immer.cjs.production.min.js":25,"_process":32}],27:[function(require,module,exports){
/**
 * lodash (Custom Build) <https://lodash.com/>
 * Build: `lodash modularize exports="npm" -o ./`
 * Copyright jQuery Foundation and other contributors <https://jquery.org/>
 * Released under MIT license <https://lodash.com/license>
 * Based on Underscore.js 1.8.3 <http://underscorejs.org/LICENSE>
 * Copyright Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
 */

/** `Object#toString` result references. */
var objectTag = '[object Object]';

/**
 * Checks if `value` is a host object in IE < 9.
 *
 * @private
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a host object, else `false`.
 */
function isHostObject(value) {
  // Many host objects are `Object` objects that can coerce to strings
  // despite having improperly defined `toString` methods.
  var result = false;
  if (value != null && typeof value.toString != 'function') {
    try {
      result = !!(value + '');
    } catch (e) {}
  }
  return result;
}

/**
 * Creates a unary function that invokes `func` with its argument transformed.
 *
 * @private
 * @param {Function} func The function to wrap.
 * @param {Function} transform The argument transform.
 * @returns {Function} Returns the new function.
 */
function overArg(func, transform) {
  return function(arg) {
    return func(transform(arg));
  };
}

/** Used for built-in method references. */
var funcProto = Function.prototype,
    objectProto = Object.prototype;

/** Used to resolve the decompiled source of functions. */
var funcToString = funcProto.toString;

/** Used to check objects for own properties. */
var hasOwnProperty = objectProto.hasOwnProperty;

/** Used to infer the `Object` constructor. */
var objectCtorString = funcToString.call(Object);

/**
 * Used to resolve the
 * [`toStringTag`](http://ecma-international.org/ecma-262/7.0/#sec-object.prototype.tostring)
 * of values.
 */
var objectToString = objectProto.toString;

/** Built-in value references. */
var getPrototype = overArg(Object.getPrototypeOf, Object);

/**
 * Checks if `value` is object-like. A value is object-like if it's not `null`
 * and has a `typeof` result of "object".
 *
 * @static
 * @memberOf _
 * @since 4.0.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is object-like, else `false`.
 * @example
 *
 * _.isObjectLike({});
 * // => true
 *
 * _.isObjectLike([1, 2, 3]);
 * // => true
 *
 * _.isObjectLike(_.noop);
 * // => false
 *
 * _.isObjectLike(null);
 * // => false
 */
function isObjectLike(value) {
  return !!value && typeof value == 'object';
}

/**
 * Checks if `value` is a plain object, that is, an object created by the
 * `Object` constructor or one with a `[[Prototype]]` of `null`.
 *
 * @static
 * @memberOf _
 * @since 0.8.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a plain object, else `false`.
 * @example
 *
 * function Foo() {
 *   this.a = 1;
 * }
 *
 * _.isPlainObject(new Foo);
 * // => false
 *
 * _.isPlainObject([1, 2, 3]);
 * // => false
 *
 * _.isPlainObject({ 'x': 0, 'y': 0 });
 * // => true
 *
 * _.isPlainObject(Object.create(null));
 * // => true
 */
function isPlainObject(value) {
  if (!isObjectLike(value) ||
      objectToString.call(value) != objectTag || isHostObject(value)) {
    return false;
  }
  var proto = getPrototype(value);
  if (proto === null) {
    return true;
  }
  var Ctor = hasOwnProperty.call(proto, 'constructor') && proto.constructor;
  return (typeof Ctor == 'function' &&
    Ctor instanceof Ctor && funcToString.call(Ctor) == objectCtorString);
}

module.exports = isPlainObject;

},{}],28:[function(require,module,exports){
let urlAlphabet =
  'useandom-26T198340PX75pxJACKVERYMINDBUSHWOLF_GQZbfghjklqvwyzrict'
let customAlphabet = (alphabet, defaultSize = 21) => {
  return (size = defaultSize) => {
    let id = ''
    let i = size
    while (i--) {
      id += alphabet[(Math.random() * alphabet.length) | 0]
    }
    return id
  }
}
let nanoid = (size = 21) => {
  let id = ''
  let i = size
  while (i--) {
    id += urlAlphabet[(Math.random() * 64) | 0]
  }
  return id
}
module.exports = { nanoid, customAlphabet }

},{}],29:[function(require,module,exports){
var BufferBuilder = require('./bufferbuilder').BufferBuilder;
var binaryFeatures = require('./bufferbuilder').binaryFeatures;

var BinaryPack = {
  unpack: function (data) {
    var unpacker = new Unpacker(data);
    return unpacker.unpack();
  },
  pack: function (data) {
    var packer = new Packer();
    packer.pack(data);
    var buffer = packer.getBuffer();
    return buffer;
  }
};

module.exports = BinaryPack;

function Unpacker (data) {
  // Data is ArrayBuffer
  this.index = 0;
  this.dataBuffer = data;
  this.dataView = new Uint8Array(this.dataBuffer);
  this.length = this.dataBuffer.byteLength;
}

Unpacker.prototype.unpack = function () {
  var type = this.unpack_uint8();
  if (type < 0x80) {
    return type;
  } else if ((type ^ 0xe0) < 0x20) {
    return (type ^ 0xe0) - 0x20;
  }

  var size;
  if ((size = type ^ 0xa0) <= 0x0f) {
    return this.unpack_raw(size);
  } else if ((size = type ^ 0xb0) <= 0x0f) {
    return this.unpack_string(size);
  } else if ((size = type ^ 0x90) <= 0x0f) {
    return this.unpack_array(size);
  } else if ((size = type ^ 0x80) <= 0x0f) {
    return this.unpack_map(size);
  }

  switch (type) {
    case 0xc0:
      return null;
    case 0xc1:
      return undefined;
    case 0xc2:
      return false;
    case 0xc3:
      return true;
    case 0xca:
      return this.unpack_float();
    case 0xcb:
      return this.unpack_double();
    case 0xcc:
      return this.unpack_uint8();
    case 0xcd:
      return this.unpack_uint16();
    case 0xce:
      return this.unpack_uint32();
    case 0xcf:
      return this.unpack_uint64();
    case 0xd0:
      return this.unpack_int8();
    case 0xd1:
      return this.unpack_int16();
    case 0xd2:
      return this.unpack_int32();
    case 0xd3:
      return this.unpack_int64();
    case 0xd4:
      return undefined;
    case 0xd5:
      return undefined;
    case 0xd6:
      return undefined;
    case 0xd7:
      return undefined;
    case 0xd8:
      size = this.unpack_uint16();
      return this.unpack_string(size);
    case 0xd9:
      size = this.unpack_uint32();
      return this.unpack_string(size);
    case 0xda:
      size = this.unpack_uint16();
      return this.unpack_raw(size);
    case 0xdb:
      size = this.unpack_uint32();
      return this.unpack_raw(size);
    case 0xdc:
      size = this.unpack_uint16();
      return this.unpack_array(size);
    case 0xdd:
      size = this.unpack_uint32();
      return this.unpack_array(size);
    case 0xde:
      size = this.unpack_uint16();
      return this.unpack_map(size);
    case 0xdf:
      size = this.unpack_uint32();
      return this.unpack_map(size);
  }
};

Unpacker.prototype.unpack_uint8 = function () {
  var byte = this.dataView[this.index] & 0xff;
  this.index++;
  return byte;
};

Unpacker.prototype.unpack_uint16 = function () {
  var bytes = this.read(2);
  var uint16 =
    ((bytes[0] & 0xff) * 256) + (bytes[1] & 0xff);
  this.index += 2;
  return uint16;
};

Unpacker.prototype.unpack_uint32 = function () {
  var bytes = this.read(4);
  var uint32 =
    ((bytes[0] * 256 +
      bytes[1]) * 256 +
      bytes[2]) * 256 +
    bytes[3];
  this.index += 4;
  return uint32;
};

Unpacker.prototype.unpack_uint64 = function () {
  var bytes = this.read(8);
  var uint64 =
    ((((((bytes[0] * 256 +
      bytes[1]) * 256 +
      bytes[2]) * 256 +
      bytes[3]) * 256 +
      bytes[4]) * 256 +
      bytes[5]) * 256 +
      bytes[6]) * 256 +
    bytes[7];
  this.index += 8;
  return uint64;
};

Unpacker.prototype.unpack_int8 = function () {
  var uint8 = this.unpack_uint8();
  return (uint8 < 0x80) ? uint8 : uint8 - (1 << 8);
};

Unpacker.prototype.unpack_int16 = function () {
  var uint16 = this.unpack_uint16();
  return (uint16 < 0x8000) ? uint16 : uint16 - (1 << 16);
};

Unpacker.prototype.unpack_int32 = function () {
  var uint32 = this.unpack_uint32();
  return (uint32 < Math.pow(2, 31)) ? uint32
    : uint32 - Math.pow(2, 32);
};

Unpacker.prototype.unpack_int64 = function () {
  var uint64 = this.unpack_uint64();
  return (uint64 < Math.pow(2, 63)) ? uint64
    : uint64 - Math.pow(2, 64);
};

Unpacker.prototype.unpack_raw = function (size) {
  if (this.length < this.index + size) {
    throw new Error('BinaryPackFailure: index is out of range' +
      ' ' + this.index + ' ' + size + ' ' + this.length);
  }
  var buf = this.dataBuffer.slice(this.index, this.index + size);
  this.index += size;

  // buf = util.bufferToString(buf);

  return buf;
};

Unpacker.prototype.unpack_string = function (size) {
  var bytes = this.read(size);
  var i = 0;
  var str = '';
  var c;
  var code;

  while (i < size) {
    c = bytes[i];
    if (c < 128) {
      str += String.fromCharCode(c);
      i++;
    } else if ((c ^ 0xc0) < 32) {
      code = ((c ^ 0xc0) << 6) | (bytes[i + 1] & 63);
      str += String.fromCharCode(code);
      i += 2;
    } else {
      code = ((c & 15) << 12) | ((bytes[i + 1] & 63) << 6) |
        (bytes[i + 2] & 63);
      str += String.fromCharCode(code);
      i += 3;
    }
  }

  this.index += size;
  return str;
};

Unpacker.prototype.unpack_array = function (size) {
  var objects = new Array(size);
  for (var i = 0; i < size; i++) {
    objects[i] = this.unpack();
  }
  return objects;
};

Unpacker.prototype.unpack_map = function (size) {
  var map = {};
  for (var i = 0; i < size; i++) {
    var key = this.unpack();
    var value = this.unpack();
    map[key] = value;
  }
  return map;
};

Unpacker.prototype.unpack_float = function () {
  var uint32 = this.unpack_uint32();
  var sign = uint32 >> 31;
  var exp = ((uint32 >> 23) & 0xff) - 127;
  var fraction = (uint32 & 0x7fffff) | 0x800000;
  return (sign === 0 ? 1 : -1) *
    fraction * Math.pow(2, exp - 23);
};

Unpacker.prototype.unpack_double = function () {
  var h32 = this.unpack_uint32();
  var l32 = this.unpack_uint32();
  var sign = h32 >> 31;
  var exp = ((h32 >> 20) & 0x7ff) - 1023;
  var hfrac = (h32 & 0xfffff) | 0x100000;
  var frac = hfrac * Math.pow(2, exp - 20) +
    l32 * Math.pow(2, exp - 52);
  return (sign === 0 ? 1 : -1) * frac;
};

Unpacker.prototype.read = function (length) {
  var j = this.index;
  if (j + length <= this.length) {
    return this.dataView.subarray(j, j + length);
  } else {
    throw new Error('BinaryPackFailure: read index out of range');
  }
};

function Packer () {
  this.bufferBuilder = new BufferBuilder();
}

Packer.prototype.getBuffer = function () {
  return this.bufferBuilder.getBuffer();
};

Packer.prototype.pack = function (value) {
  var type = typeof (value);
  if (type === 'string') {
    this.pack_string(value);
  } else if (type === 'number') {
    if (Math.floor(value) === value) {
      this.pack_integer(value);
    } else {
      this.pack_double(value);
    }
  } else if (type === 'boolean') {
    if (value === true) {
      this.bufferBuilder.append(0xc3);
    } else if (value === false) {
      this.bufferBuilder.append(0xc2);
    }
  } else if (type === 'undefined') {
    this.bufferBuilder.append(0xc0);
  } else if (type === 'object') {
    if (value === null) {
      this.bufferBuilder.append(0xc0);
    } else {
      var constructor = value.constructor;
      if (constructor == Array) {
        this.pack_array(value);
      } else if (constructor == Blob || constructor == File || value instanceof Blob || value instanceof File) {
        this.pack_bin(value);
      } else if (constructor == ArrayBuffer) {
        if (binaryFeatures.useArrayBufferView) {
          this.pack_bin(new Uint8Array(value));
        } else {
          this.pack_bin(value);
        }
      } else if ('BYTES_PER_ELEMENT' in value) {
        if (binaryFeatures.useArrayBufferView) {
          this.pack_bin(new Uint8Array(value.buffer));
        } else {
          this.pack_bin(value.buffer);
        }
      } else if ((constructor == Object) || (constructor.toString().startsWith('class'))) {
        this.pack_object(value);
      } else if (constructor == Date) {
        this.pack_string(value.toString());
      } else if (typeof value.toBinaryPack === 'function') {
        this.bufferBuilder.append(value.toBinaryPack());
      } else {
        throw new Error('Type "' + constructor.toString() + '" not yet supported');
      }
    }
  } else {
    throw new Error('Type "' + type + '" not yet supported');
  }
  this.bufferBuilder.flush();
};

Packer.prototype.pack_bin = function (blob) {
  var length = blob.length || blob.byteLength || blob.size;
  if (length <= 0x0f) {
    this.pack_uint8(0xa0 + length);
  } else if (length <= 0xffff) {
    this.bufferBuilder.append(0xda);
    this.pack_uint16(length);
  } else if (length <= 0xffffffff) {
    this.bufferBuilder.append(0xdb);
    this.pack_uint32(length);
  } else {
    throw new Error('Invalid length');
  }
  this.bufferBuilder.append(blob);
};

Packer.prototype.pack_string = function (str) {
  var length = utf8Length(str);

  if (length <= 0x0f) {
    this.pack_uint8(0xb0 + length);
  } else if (length <= 0xffff) {
    this.bufferBuilder.append(0xd8);
    this.pack_uint16(length);
  } else if (length <= 0xffffffff) {
    this.bufferBuilder.append(0xd9);
    this.pack_uint32(length);
  } else {
    throw new Error('Invalid length');
  }
  this.bufferBuilder.append(str);
};

Packer.prototype.pack_array = function (ary) {
  var length = ary.length;
  if (length <= 0x0f) {
    this.pack_uint8(0x90 + length);
  } else if (length <= 0xffff) {
    this.bufferBuilder.append(0xdc);
    this.pack_uint16(length);
  } else if (length <= 0xffffffff) {
    this.bufferBuilder.append(0xdd);
    this.pack_uint32(length);
  } else {
    throw new Error('Invalid length');
  }
  for (var i = 0; i < length; i++) {
    this.pack(ary[i]);
  }
};

Packer.prototype.pack_integer = function (num) {
  if (num >= -0x20 && num <= 0x7f) {
    this.bufferBuilder.append(num & 0xff);
  } else if (num >= 0x00 && num <= 0xff) {
    this.bufferBuilder.append(0xcc);
    this.pack_uint8(num);
  } else if (num >= -0x80 && num <= 0x7f) {
    this.bufferBuilder.append(0xd0);
    this.pack_int8(num);
  } else if (num >= 0x0000 && num <= 0xffff) {
    this.bufferBuilder.append(0xcd);
    this.pack_uint16(num);
  } else if (num >= -0x8000 && num <= 0x7fff) {
    this.bufferBuilder.append(0xd1);
    this.pack_int16(num);
  } else if (num >= 0x00000000 && num <= 0xffffffff) {
    this.bufferBuilder.append(0xce);
    this.pack_uint32(num);
  } else if (num >= -0x80000000 && num <= 0x7fffffff) {
    this.bufferBuilder.append(0xd2);
    this.pack_int32(num);
  } else if (num >= -0x8000000000000000 && num <= 0x7FFFFFFFFFFFFFFF) {
    this.bufferBuilder.append(0xd3);
    this.pack_int64(num);
  } else if (num >= 0x0000000000000000 && num <= 0xFFFFFFFFFFFFFFFF) {
    this.bufferBuilder.append(0xcf);
    this.pack_uint64(num);
  } else {
    throw new Error('Invalid integer');
  }
};

Packer.prototype.pack_double = function (num) {
  var sign = 0;
  if (num < 0) {
    sign = 1;
    num = -num;
  }
  var exp = Math.floor(Math.log(num) / Math.LN2);
  var frac0 = num / Math.pow(2, exp) - 1;
  var frac1 = Math.floor(frac0 * Math.pow(2, 52));
  var b32 = Math.pow(2, 32);
  var h32 = (sign << 31) | ((exp + 1023) << 20) |
    (frac1 / b32) & 0x0fffff;
  var l32 = frac1 % b32;
  this.bufferBuilder.append(0xcb);
  this.pack_int32(h32);
  this.pack_int32(l32);
};

Packer.prototype.pack_object = function (obj) {
  var keys = Object.keys(obj);
  var length = keys.length;
  if (length <= 0x0f) {
    this.pack_uint8(0x80 + length);
  } else if (length <= 0xffff) {
    this.bufferBuilder.append(0xde);
    this.pack_uint16(length);
  } else if (length <= 0xffffffff) {
    this.bufferBuilder.append(0xdf);
    this.pack_uint32(length);
  } else {
    throw new Error('Invalid length');
  }
  for (var prop in obj) {
    if (obj.hasOwnProperty(prop)) {
      this.pack(prop);
      this.pack(obj[prop]);
    }
  }
};

Packer.prototype.pack_uint8 = function (num) {
  this.bufferBuilder.append(num);
};

Packer.prototype.pack_uint16 = function (num) {
  this.bufferBuilder.append(num >> 8);
  this.bufferBuilder.append(num & 0xff);
};

Packer.prototype.pack_uint32 = function (num) {
  var n = num & 0xffffffff;
  this.bufferBuilder.append((n & 0xff000000) >>> 24);
  this.bufferBuilder.append((n & 0x00ff0000) >>> 16);
  this.bufferBuilder.append((n & 0x0000ff00) >>> 8);
  this.bufferBuilder.append((n & 0x000000ff));
};

Packer.prototype.pack_uint64 = function (num) {
  var high = num / Math.pow(2, 32);
  var low = num % Math.pow(2, 32);
  this.bufferBuilder.append((high & 0xff000000) >>> 24);
  this.bufferBuilder.append((high & 0x00ff0000) >>> 16);
  this.bufferBuilder.append((high & 0x0000ff00) >>> 8);
  this.bufferBuilder.append((high & 0x000000ff));
  this.bufferBuilder.append((low & 0xff000000) >>> 24);
  this.bufferBuilder.append((low & 0x00ff0000) >>> 16);
  this.bufferBuilder.append((low & 0x0000ff00) >>> 8);
  this.bufferBuilder.append((low & 0x000000ff));
};

Packer.prototype.pack_int8 = function (num) {
  this.bufferBuilder.append(num & 0xff);
};

Packer.prototype.pack_int16 = function (num) {
  this.bufferBuilder.append((num & 0xff00) >> 8);
  this.bufferBuilder.append(num & 0xff);
};

Packer.prototype.pack_int32 = function (num) {
  this.bufferBuilder.append((num >>> 24) & 0xff);
  this.bufferBuilder.append((num & 0x00ff0000) >>> 16);
  this.bufferBuilder.append((num & 0x0000ff00) >>> 8);
  this.bufferBuilder.append((num & 0x000000ff));
};

Packer.prototype.pack_int64 = function (num) {
  var high = Math.floor(num / Math.pow(2, 32));
  var low = num % Math.pow(2, 32);
  this.bufferBuilder.append((high & 0xff000000) >>> 24);
  this.bufferBuilder.append((high & 0x00ff0000) >>> 16);
  this.bufferBuilder.append((high & 0x0000ff00) >>> 8);
  this.bufferBuilder.append((high & 0x000000ff));
  this.bufferBuilder.append((low & 0xff000000) >>> 24);
  this.bufferBuilder.append((low & 0x00ff0000) >>> 16);
  this.bufferBuilder.append((low & 0x0000ff00) >>> 8);
  this.bufferBuilder.append((low & 0x000000ff));
};

function _utf8Replace (m) {
  var code = m.charCodeAt(0);

  if (code <= 0x7ff) return '00';
  if (code <= 0xffff) return '000';
  if (code <= 0x1fffff) return '0000';
  if (code <= 0x3ffffff) return '00000';
  return '000000';
}

function utf8Length (str) {
  if (str.length > 600) {
    // Blob method faster for large strings
    return (new Blob([str])).size;
  } else {
    return str.replace(/[^\u0000-\u007F]/g, _utf8Replace).length;
  }
}

},{"./bufferbuilder":30}],30:[function(require,module,exports){
var binaryFeatures = {};
binaryFeatures.useBlobBuilder = (function () {
  try {
    new Blob([]);
    return false;
  } catch (e) {
    return true;
  }
})();

binaryFeatures.useArrayBufferView = !binaryFeatures.useBlobBuilder && (function () {
  try {
    return (new Blob([new Uint8Array([])])).size === 0;
  } catch (e) {
    return true;
  }
})();

module.exports.binaryFeatures = binaryFeatures;
var BlobBuilder = module.exports.BlobBuilder;
if (typeof window !== 'undefined') {
  BlobBuilder = module.exports.BlobBuilder = window.WebKitBlobBuilder ||
    window.MozBlobBuilder || window.MSBlobBuilder || window.BlobBuilder;
}

function BufferBuilder () {
  this._pieces = [];
  this._parts = [];
}

BufferBuilder.prototype.append = function (data) {
  if (typeof data === 'number') {
    this._pieces.push(data);
  } else {
    this.flush();
    this._parts.push(data);
  }
};

BufferBuilder.prototype.flush = function () {
  if (this._pieces.length > 0) {
    var buf = new Uint8Array(this._pieces);
    if (!binaryFeatures.useArrayBufferView) {
      buf = buf.buffer;
    }
    this._parts.push(buf);
    this._pieces = [];
  }
};

BufferBuilder.prototype.getBuffer = function () {
  this.flush();
  if (binaryFeatures.useBlobBuilder) {
    var builder = new BlobBuilder();
    for (var i = 0, ii = this._parts.length; i < ii; i++) {
      builder.append(this._parts[i]);
    }
    return builder.getBlob();
  } else {
    return new Blob(this._parts);
  }
};

module.exports.BufferBuilder = BufferBuilder;

},{}],31:[function(require,module,exports){
var $TdzfH$peerjsjsbinarypack = require("peerjs-js-binarypack");
var $TdzfH$webrtcadapter = require("webrtc-adapter");
var $TdzfH$eventemitter3 = require("eventemitter3");

function $parcel$defineInteropFlag(a) {
  Object.defineProperty(a, '__esModule', {value: true, configurable: true});
}
function $parcel$export(e, n, v, s) {
  Object.defineProperty(e, n, {get: v, set: s, enumerable: true, configurable: true});
}
function $parcel$interopDefault(a) {
  return a && a.__esModule ? a.default : a;
}

$parcel$defineInteropFlag(module.exports);

$parcel$export(module.exports, "default", () => $f1d1a6b5c376b066$export$2e2bcd8739ae039);
$parcel$export(module.exports, "Peer", () => $976f9b679211b81e$exports.Peer);
$parcel$export(module.exports, "util", () => $6c02be62bb157391$export$7debb50ef11d5e0b);


var $c2c6b21388937aac$var$webRTCAdapter = //@ts-ignore
($parcel$interopDefault($TdzfH$webrtcadapter)).default || ($parcel$interopDefault($TdzfH$webrtcadapter));
var $c2c6b21388937aac$export$25be9502477c137d = new /** @class */ (function() {
    function class_1() {
        this.isIOS = [
            "iPad",
            "iPhone",
            "iPod"
        ].includes(navigator.platform);
        this.supportedBrowsers = [
            "firefox",
            "chrome",
            "safari"
        ];
        this.minFirefoxVersion = 59;
        this.minChromeVersion = 72;
        this.minSafariVersion = 605;
    }
    class_1.prototype.isWebRTCSupported = function() {
        return typeof RTCPeerConnection !== "undefined";
    };
    class_1.prototype.isBrowserSupported = function() {
        var browser = this.getBrowser();
        var version = this.getVersion();
        var validBrowser = this.supportedBrowsers.includes(browser);
        if (!validBrowser) return false;
        if (browser === "chrome") return version >= this.minChromeVersion;
        if (browser === "firefox") return version >= this.minFirefoxVersion;
        if (browser === "safari") return !this.isIOS && version >= this.minSafariVersion;
        return false;
    };
    class_1.prototype.getBrowser = function() {
        return $c2c6b21388937aac$var$webRTCAdapter.browserDetails.browser;
    };
    class_1.prototype.getVersion = function() {
        return $c2c6b21388937aac$var$webRTCAdapter.browserDetails.version || 0;
    };
    class_1.prototype.isUnifiedPlanSupported = function() {
        var browser = this.getBrowser();
        var version = $c2c6b21388937aac$var$webRTCAdapter.browserDetails.version || 0;
        if (browser === "chrome" && version < this.minChromeVersion) return false;
        if (browser === "firefox" && version >= this.minFirefoxVersion) return true;
        if (!window.RTCRtpTransceiver || !("currentDirection" in RTCRtpTransceiver.prototype)) return false;
        var tempPc;
        var supported = false;
        try {
            tempPc = new RTCPeerConnection();
            tempPc.addTransceiver("audio");
            supported = true;
        } catch (e) {} finally{
            if (tempPc) tempPc.close();
        }
        return supported;
    };
    class_1.prototype.toString = function() {
        return "Supports:\n    browser:".concat(this.getBrowser(), "\n    version:").concat(this.getVersion(), "\n    isIOS:").concat(this.isIOS, "\n    isWebRTCSupported:").concat(this.isWebRTCSupported(), "\n    isBrowserSupported:").concat(this.isBrowserSupported(), "\n    isUnifiedPlanSupported:").concat(this.isUnifiedPlanSupported());
    };
    return class_1;
}())();


var $6c02be62bb157391$var$DEFAULT_CONFIG = {
    iceServers: [
        {
            urls: "stun:stun.l.google.com:19302"
        },
        {
            urls: [
                "turn:eu-0.turn.peerjs.com:3478",
                "turn:us-0.turn.peerjs.com:3478", 
            ],
            username: "peerjs",
            credential: "peerjsp"
        }, 
    ],
    sdpSemantics: "unified-plan"
};
var $6c02be62bb157391$var$Util = /** @class */ function() {
    function Util() {
        this.CLOUD_HOST = "0.peerjs.com";
        this.CLOUD_PORT = 443;
        // Browsers that need chunking:
        this.chunkedBrowsers = {
            Chrome: 1,
            chrome: 1
        };
        this.chunkedMTU = 16300; // The original 60000 bytes setting does not work when sending data from Firefox to Chrome, which is "cut off" after 16384 bytes and delivered individually.
        // Returns browser-agnostic default config
        this.defaultConfig = $6c02be62bb157391$var$DEFAULT_CONFIG;
        this.browser = $c2c6b21388937aac$export$25be9502477c137d.getBrowser();
        this.browserVersion = $c2c6b21388937aac$export$25be9502477c137d.getVersion();
        // Lists which features are supported
        this.supports = function() {
            var supported = {
                browser: $c2c6b21388937aac$export$25be9502477c137d.isBrowserSupported(),
                webRTC: $c2c6b21388937aac$export$25be9502477c137d.isWebRTCSupported(),
                audioVideo: false,
                data: false,
                binaryBlob: false,
                reliable: false
            };
            if (!supported.webRTC) return supported;
            var pc;
            try {
                pc = new RTCPeerConnection($6c02be62bb157391$var$DEFAULT_CONFIG);
                supported.audioVideo = true;
                var dc = void 0;
                try {
                    dc = pc.createDataChannel("_PEERJSTEST", {
                        ordered: true
                    });
                    supported.data = true;
                    supported.reliable = !!dc.ordered;
                    // Binary test
                    try {
                        dc.binaryType = "blob";
                        supported.binaryBlob = !$c2c6b21388937aac$export$25be9502477c137d.isIOS;
                    } catch (e) {}
                } catch (e) {} finally{
                    if (dc) dc.close();
                }
            } catch (e) {} finally{
                if (pc) pc.close();
            }
            return supported;
        }();
        this.pack = ($parcel$interopDefault($TdzfH$peerjsjsbinarypack)).pack;
        this.unpack = ($parcel$interopDefault($TdzfH$peerjsjsbinarypack)).unpack;
        // Binary stuff
        this._dataCount = 1;
    }
    Util.prototype.noop = function() {};
    // Ensure alphanumeric ids
    Util.prototype.validateId = function(id) {
        // Allow empty ids
        return !id || /^[A-Za-z0-9]+(?:[ _-][A-Za-z0-9]+)*$/.test(id);
    };
    Util.prototype.chunk = function(blob) {
        var chunks = [];
        var size = blob.size;
        var total = Math.ceil(size / $6c02be62bb157391$export$7debb50ef11d5e0b.chunkedMTU);
        var index = 0;
        var start = 0;
        while(start < size){
            var end = Math.min(size, start + $6c02be62bb157391$export$7debb50ef11d5e0b.chunkedMTU);
            var b = blob.slice(start, end);
            var chunk = {
                __peerData: this._dataCount,
                n: index,
                data: b,
                total: total
            };
            chunks.push(chunk);
            start = end;
            index++;
        }
        this._dataCount++;
        return chunks;
    };
    Util.prototype.blobToArrayBuffer = function(blob, cb) {
        var fr = new FileReader();
        fr.onload = function(evt) {
            if (evt.target) cb(evt.target.result);
        };
        fr.readAsArrayBuffer(blob);
        return fr;
    };
    Util.prototype.binaryStringToArrayBuffer = function(binary) {
        var byteArray = new Uint8Array(binary.length);
        for(var i = 0; i < binary.length; i++)byteArray[i] = binary.charCodeAt(i) & 0xff;
        return byteArray.buffer;
    };
    Util.prototype.randomToken = function() {
        return Math.random().toString(36).slice(2);
    };
    Util.prototype.isSecure = function() {
        return location.protocol === "https:";
    };
    return Util;
}();
var $6c02be62bb157391$export$7debb50ef11d5e0b = new $6c02be62bb157391$var$Util();


var $976f9b679211b81e$exports = {};

$parcel$export($976f9b679211b81e$exports, "Peer", () => $976f9b679211b81e$export$ecd1fc136c422448, (v) => $976f9b679211b81e$export$ecd1fc136c422448 = v);


var $c25b565240b6a41d$exports = {};

$parcel$export($c25b565240b6a41d$exports, "LogLevel", () => $c25b565240b6a41d$export$243e62d78d3b544d, (v) => $c25b565240b6a41d$export$243e62d78d3b544d = v);
$parcel$export($c25b565240b6a41d$exports, "default", () => $c25b565240b6a41d$export$2e2bcd8739ae039, (v) => $c25b565240b6a41d$export$2e2bcd8739ae039 = v);
var $c25b565240b6a41d$var$__read = undefined && undefined.__read || function(o, n) {
    var m = typeof Symbol === "function" && o[Symbol.iterator];
    if (!m) return o;
    var i = m.call(o), r, ar = [], e;
    try {
        while((n === void 0 || n-- > 0) && !(r = i.next()).done)ar.push(r.value);
    } catch (error) {
        e = {
            error: error
        };
    } finally{
        try {
            if (r && !r.done && (m = i["return"])) m.call(i);
        } finally{
            if (e) throw e.error;
        }
    }
    return ar;
};
var $c25b565240b6a41d$var$__spreadArray = undefined && undefined.__spreadArray || function(to, from, pack) {
    if (pack || arguments.length === 2) {
        for(var i = 0, l = from.length, ar; i < l; i++)if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
var $c25b565240b6a41d$var$LOG_PREFIX = "PeerJS: ";
var $c25b565240b6a41d$export$243e62d78d3b544d;
(function($c25b565240b6a41d$export$243e62d78d3b544d) {
    $c25b565240b6a41d$export$243e62d78d3b544d[$c25b565240b6a41d$export$243e62d78d3b544d["Disabled"] = 0] = "Disabled";
    $c25b565240b6a41d$export$243e62d78d3b544d[$c25b565240b6a41d$export$243e62d78d3b544d["Errors"] = 1] = "Errors";
    $c25b565240b6a41d$export$243e62d78d3b544d[$c25b565240b6a41d$export$243e62d78d3b544d["Warnings"] = 2] = "Warnings";
    $c25b565240b6a41d$export$243e62d78d3b544d[$c25b565240b6a41d$export$243e62d78d3b544d["All"] = 3] = "All";
})($c25b565240b6a41d$export$243e62d78d3b544d || ($c25b565240b6a41d$export$243e62d78d3b544d = {}));
var $c25b565240b6a41d$var$Logger = /** @class */ function() {
    function Logger() {
        this._logLevel = $c25b565240b6a41d$export$243e62d78d3b544d.Disabled;
    }
    Object.defineProperty(Logger.prototype, "logLevel", {
        get: function() {
            return this._logLevel;
        },
        set: function(logLevel) {
            this._logLevel = logLevel;
        },
        enumerable: false,
        configurable: true
    });
    Logger.prototype.log = function() {
        var args = [];
        for(var _i = 0; _i < arguments.length; _i++)args[_i] = arguments[_i];
        if (this._logLevel >= $c25b565240b6a41d$export$243e62d78d3b544d.All) this._print.apply(this, $c25b565240b6a41d$var$__spreadArray([
            $c25b565240b6a41d$export$243e62d78d3b544d.All
        ], $c25b565240b6a41d$var$__read(args), false));
    };
    Logger.prototype.warn = function() {
        var args = [];
        for(var _i = 0; _i < arguments.length; _i++)args[_i] = arguments[_i];
        if (this._logLevel >= $c25b565240b6a41d$export$243e62d78d3b544d.Warnings) this._print.apply(this, $c25b565240b6a41d$var$__spreadArray([
            $c25b565240b6a41d$export$243e62d78d3b544d.Warnings
        ], $c25b565240b6a41d$var$__read(args), false));
    };
    Logger.prototype.error = function() {
        var args = [];
        for(var _i = 0; _i < arguments.length; _i++)args[_i] = arguments[_i];
        if (this._logLevel >= $c25b565240b6a41d$export$243e62d78d3b544d.Errors) this._print.apply(this, $c25b565240b6a41d$var$__spreadArray([
            $c25b565240b6a41d$export$243e62d78d3b544d.Errors
        ], $c25b565240b6a41d$var$__read(args), false));
    };
    Logger.prototype.setLogFunction = function(fn) {
        this._print = fn;
    };
    Logger.prototype._print = function(logLevel) {
        var rest = [];
        for(var _i = 1; _i < arguments.length; _i++)rest[_i - 1] = arguments[_i];
        var copy = $c25b565240b6a41d$var$__spreadArray([
            $c25b565240b6a41d$var$LOG_PREFIX
        ], $c25b565240b6a41d$var$__read(rest), false);
        for(var i in copy)if (copy[i] instanceof Error) copy[i] = "(" + copy[i].name + ") " + copy[i].message;
        if (logLevel >= $c25b565240b6a41d$export$243e62d78d3b544d.All) console.log.apply(console, $c25b565240b6a41d$var$__spreadArray([], $c25b565240b6a41d$var$__read(copy), false));
        else if (logLevel >= $c25b565240b6a41d$export$243e62d78d3b544d.Warnings) console.warn.apply(console, $c25b565240b6a41d$var$__spreadArray([
            "WARNING"
        ], $c25b565240b6a41d$var$__read(copy), false));
        else if (logLevel >= $c25b565240b6a41d$export$243e62d78d3b544d.Errors) console.error.apply(console, $c25b565240b6a41d$var$__spreadArray([
            "ERROR"
        ], $c25b565240b6a41d$var$__read(copy), false));
    };
    return Logger;
}();
var $c25b565240b6a41d$export$2e2bcd8739ae039 = new $c25b565240b6a41d$var$Logger();


var $a86db8d850e55bcf$exports = {};

$parcel$export($a86db8d850e55bcf$exports, "Socket", () => $a86db8d850e55bcf$export$4798917dbf149b79, (v) => $a86db8d850e55bcf$export$4798917dbf149b79 = v);


var $2f2cc37b22a0b29a$export$3157d57b4135e3bc;
(function($2f2cc37b22a0b29a$export$3157d57b4135e3bc) {
    $2f2cc37b22a0b29a$export$3157d57b4135e3bc["Data"] = "data";
    $2f2cc37b22a0b29a$export$3157d57b4135e3bc["Media"] = "media";
})($2f2cc37b22a0b29a$export$3157d57b4135e3bc || ($2f2cc37b22a0b29a$export$3157d57b4135e3bc = {}));
var $2f2cc37b22a0b29a$export$9547aaa2e39030ff;
(function($2f2cc37b22a0b29a$export$9547aaa2e39030ff) {
    $2f2cc37b22a0b29a$export$9547aaa2e39030ff["BrowserIncompatible"] = "browser-incompatible";
    $2f2cc37b22a0b29a$export$9547aaa2e39030ff["Disconnected"] = "disconnected";
    $2f2cc37b22a0b29a$export$9547aaa2e39030ff["InvalidID"] = "invalid-id";
    $2f2cc37b22a0b29a$export$9547aaa2e39030ff["InvalidKey"] = "invalid-key";
    $2f2cc37b22a0b29a$export$9547aaa2e39030ff["Network"] = "network";
    $2f2cc37b22a0b29a$export$9547aaa2e39030ff["PeerUnavailable"] = "peer-unavailable";
    $2f2cc37b22a0b29a$export$9547aaa2e39030ff["SslUnavailable"] = "ssl-unavailable";
    $2f2cc37b22a0b29a$export$9547aaa2e39030ff["ServerError"] = "server-error";
    $2f2cc37b22a0b29a$export$9547aaa2e39030ff["SocketError"] = "socket-error";
    $2f2cc37b22a0b29a$export$9547aaa2e39030ff["SocketClosed"] = "socket-closed";
    $2f2cc37b22a0b29a$export$9547aaa2e39030ff["UnavailableID"] = "unavailable-id";
    $2f2cc37b22a0b29a$export$9547aaa2e39030ff["WebRTC"] = "webrtc";
})($2f2cc37b22a0b29a$export$9547aaa2e39030ff || ($2f2cc37b22a0b29a$export$9547aaa2e39030ff = {}));
var $2f2cc37b22a0b29a$export$89f507cf986a947;
(function($2f2cc37b22a0b29a$export$89f507cf986a947) {
    $2f2cc37b22a0b29a$export$89f507cf986a947["Binary"] = "binary";
    $2f2cc37b22a0b29a$export$89f507cf986a947["BinaryUTF8"] = "binary-utf8";
    $2f2cc37b22a0b29a$export$89f507cf986a947["JSON"] = "json";
})($2f2cc37b22a0b29a$export$89f507cf986a947 || ($2f2cc37b22a0b29a$export$89f507cf986a947 = {}));
var $2f2cc37b22a0b29a$export$3b5c4a4b6354f023;
(function($2f2cc37b22a0b29a$export$3b5c4a4b6354f023) {
    $2f2cc37b22a0b29a$export$3b5c4a4b6354f023["Message"] = "message";
    $2f2cc37b22a0b29a$export$3b5c4a4b6354f023["Disconnected"] = "disconnected";
    $2f2cc37b22a0b29a$export$3b5c4a4b6354f023["Error"] = "error";
    $2f2cc37b22a0b29a$export$3b5c4a4b6354f023["Close"] = "close";
})($2f2cc37b22a0b29a$export$3b5c4a4b6354f023 || ($2f2cc37b22a0b29a$export$3b5c4a4b6354f023 = {}));
var $2f2cc37b22a0b29a$export$adb4a1754da6f10d;
(function($2f2cc37b22a0b29a$export$adb4a1754da6f10d) {
    $2f2cc37b22a0b29a$export$adb4a1754da6f10d["Heartbeat"] = "HEARTBEAT";
    $2f2cc37b22a0b29a$export$adb4a1754da6f10d["Candidate"] = "CANDIDATE";
    $2f2cc37b22a0b29a$export$adb4a1754da6f10d["Offer"] = "OFFER";
    $2f2cc37b22a0b29a$export$adb4a1754da6f10d["Answer"] = "ANSWER";
    $2f2cc37b22a0b29a$export$adb4a1754da6f10d["Open"] = "OPEN";
    $2f2cc37b22a0b29a$export$adb4a1754da6f10d["Error"] = "ERROR";
    $2f2cc37b22a0b29a$export$adb4a1754da6f10d["IdTaken"] = "ID-TAKEN";
    $2f2cc37b22a0b29a$export$adb4a1754da6f10d["InvalidKey"] = "INVALID-KEY";
    $2f2cc37b22a0b29a$export$adb4a1754da6f10d["Leave"] = "LEAVE";
    $2f2cc37b22a0b29a$export$adb4a1754da6f10d["Expire"] = "EXPIRE";
})($2f2cc37b22a0b29a$export$adb4a1754da6f10d || ($2f2cc37b22a0b29a$export$adb4a1754da6f10d = {}));


var $059935620e5e661f$exports = {};
$059935620e5e661f$exports = JSON.parse("{\"name\":\"peerjs\",\"version\":\"1.4.7\",\"keywords\":[\"peerjs\",\"webrtc\",\"p2p\",\"rtc\"],\"description\":\"PeerJS client\",\"homepage\":\"https://peerjs.com\",\"bugs\":{\"url\":\"https://github.com/peers/peerjs/issues\"},\"repository\":{\"type\":\"git\",\"url\":\"https://github.com/peers/peerjs\"},\"license\":\"MIT\",\"contributors\":[\"Michelle Bu <michelle@michellebu.com>\",\"afrokick <devbyru@gmail.com>\",\"ericz <really.ez@gmail.com>\",\"Jairo <kidandcat@gmail.com>\",\"Jonas Gloning <34194370+jonasgloning@users.noreply.github.com>\",\"Jairo Caro-Accino Viciana <jairo@galax.be>\",\"Carlos Caballero <carlos.caballero.gonzalez@gmail.com>\",\"hc <hheennrryy@gmail.com>\",\"Muhammad Asif <capripio@gmail.com>\",\"PrashoonB <prashoonbhattacharjee@gmail.com>\",\"Harsh Bardhan Mishra <47351025+HarshCasper@users.noreply.github.com>\",\"akotynski <aleksanderkotbury@gmail.com>\",\"lmb <i@lmb.io>\",\"Jairooo <jairocaro@msn.com>\",\"Moritz Stückler <moritz.stueckler@gmail.com>\",\"Simon <crydotsnakegithub@gmail.com>\",\"Denis Lukov <denismassters@gmail.com>\",\"Philipp Hancke <fippo@andyet.net>\",\"Hans Oksendahl <hansoksendahl@gmail.com>\",\"Jess <jessachandler@gmail.com>\",\"khankuan <khankuan@gmail.com>\",\"DUODVK <kurmanov.work@gmail.com>\",\"XiZhao <kwang1imsa@gmail.com>\",\"Matthias Lohr <matthias@lohr.me>\",\"=frank tree <=frnktrb@googlemail.com>\",\"Andre Eckardt <aeckardt@outlook.com>\",\"Chris Cowan <agentme49@gmail.com>\",\"Alex Chuev <alex@chuev.com>\",\"alxnull <alxnull@e.mail.de>\",\"Yemel Jardi <angel.jardi@gmail.com>\",\"Ben Parnell <benjaminparnell.94@gmail.com>\",\"Benny Lichtner <bennlich@gmail.com>\",\"fresheneesz <bitetrudpublic@gmail.com>\",\"bob.barstead@exaptive.com <bob.barstead@exaptive.com>\",\"chandika <chandika@gmail.com>\",\"emersion <contact@emersion.fr>\",\"Christopher Van <cvan@users.noreply.github.com>\",\"eddieherm <edhermoso@gmail.com>\",\"Eduardo Pinho <enet4mikeenet@gmail.com>\",\"Evandro Zanatta <ezanatta@tray.net.br>\",\"Gardner Bickford <gardner@users.noreply.github.com>\",\"Gian Luca <gianluca.cecchi@cynny.com>\",\"PatrickJS <github@gdi2290.com>\",\"jonnyf <github@jonathanfoss.co.uk>\",\"Hizkia Felix <hizkifw@gmail.com>\",\"Hristo Oskov <hristo.oskov@gmail.com>\",\"Isaac Madwed <i.madwed@gmail.com>\",\"Ilya Konanykhin <ilya.konanykhin@gmail.com>\",\"jasonbarry <jasbarry@me.com>\",\"Jonathan Burke <jonathan.burke.1311@googlemail.com>\",\"Josh Hamit <josh.hamit@gmail.com>\",\"Jordan Austin <jrax86@gmail.com>\",\"Joel Wetzell <jwetzell@yahoo.com>\",\"xizhao <kevin.wang@cloudera.com>\",\"Alberto Torres <kungfoobar@gmail.com>\",\"Jonathan Mayol <mayoljonathan@gmail.com>\",\"Jefferson Felix <me@jsfelix.dev>\",\"Rolf Erik Lekang <me@rolflekang.com>\",\"Kevin Mai-Husan Chia <mhchia@users.noreply.github.com>\",\"Pepijn de Vos <pepijndevos@gmail.com>\",\"JooYoung <qkdlql@naver.com>\",\"Tobias Speicher <rootcommander@gmail.com>\",\"Steve Blaurock <sblaurock@gmail.com>\",\"Kyrylo Shegeda <shegeda@ualberta.ca>\",\"Diwank Singh Tomer <singh@diwank.name>\",\"Sören Balko <Soeren.Balko@gmail.com>\",\"Arpit Solanki <solankiarpit1997@gmail.com>\",\"Yuki Ito <yuki@gnnk.net>\",\"Artur Zayats <zag2art@gmail.com>\"],\"funding\":{\"type\":\"opencollective\",\"url\":\"https://opencollective.com/peer\"},\"collective\":{\"type\":\"opencollective\",\"url\":\"https://opencollective.com/peer\"},\"files\":[\"dist/*\"],\"sideEffects\":[\"lib/global.ts\",\"lib/supports.ts\"],\"main\":\"dist/bundler.cjs\",\"module\":\"dist/bundler.mjs\",\"browser-minified\":\"dist/peerjs.min.js\",\"browser-unminified\":\"dist/peerjs.js\",\"types\":\"dist/types.d.ts\",\"engines\":{\"node\":\">= 10\"},\"targets\":{\"types\":{\"source\":\"lib/exports.ts\"},\"main\":{\"source\":\"lib/exports.ts\",\"sourceMap\":{\"inlineSources\":true}},\"module\":{\"source\":\"lib/exports.ts\",\"includeNodeModules\":[\"eventemitter3\"],\"sourceMap\":{\"inlineSources\":true}},\"browser-minified\":{\"context\":\"browser\",\"outputFormat\":\"global\",\"optimize\":true,\"engines\":{\"browsers\":\"cover 99%, not dead\"},\"source\":\"lib/global.ts\"},\"browser-unminified\":{\"context\":\"browser\",\"outputFormat\":\"global\",\"optimize\":false,\"engines\":{\"browsers\":\"cover 99%, not dead\"},\"source\":\"lib/global.ts\"}},\"scripts\":{\"contributors\":\"git-authors-cli --print=false && prettier --write package.json && git add package.json package-lock.json && git commit -m \\\"chore(contributors): update and sort contributors list\\\"\",\"check\":\"tsc --noEmit\",\"watch\":\"parcel watch\",\"build\":\"rm -rf dist && parcel build\",\"prepublishOnly\":\"npm run build\",\"test\":\"mocha -r ts-node/register -r jsdom-global/register test/**/*.ts\",\"format\":\"prettier --write .\",\"semantic-release\":\"semantic-release\"},\"devDependencies\":{\"@parcel/config-default\":\"^2.5.0\",\"@parcel/packager-ts\":\"^2.5.0\",\"@parcel/transformer-typescript-tsc\":\"^2.5.0\",\"@parcel/transformer-typescript-types\":\"^2.5.0\",\"@semantic-release/changelog\":\"^6.0.1\",\"@semantic-release/git\":\"^10.0.1\",\"@types/chai\":\"^4.3.0\",\"@types/mocha\":\"^9.1.0\",\"@types/node\":\"^17.0.18\",\"chai\":\"^4.3.6\",\"git-authors-cli\":\"^1.0.40\",\"jsdom\":\"^19.0.0\",\"jsdom-global\":\"^3.0.2\",\"mocha\":\"^9.2.0\",\"mock-socket\":\"8.0.5\",\"parcel\":\"^2.5.0\",\"parcel-transformer-tsc-sourcemaps\":\"^1.0.2\",\"prettier\":\"^2.6.2\",\"semantic-release\":\"^19.0.2\",\"standard\":\"^16.0.4\",\"ts-node\":\"^10.5.0\",\"typescript\":\"^4.5.5\"},\"dependencies\":{\"@swc/helpers\":\"^0.3.13\",\"eventemitter3\":\"^4.0.7\",\"peerjs-js-binarypack\":\"1.0.1\",\"webrtc-adapter\":\"^7.7.1\"}}");


var $a86db8d850e55bcf$var$__extends = undefined && undefined.__extends || function() {
    var extendStatics = function(d1, b1) {
        extendStatics = Object.setPrototypeOf || ({
            __proto__: []
        }) instanceof Array && function(d, b) {
            d.__proto__ = b;
        } || function(d, b) {
            for(var p in b)if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p];
        };
        return extendStatics(d1, b1);
    };
    return function(d, b) {
        if (typeof b !== "function" && b !== null) throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() {
            this.constructor = d;
        }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
}();
var $a86db8d850e55bcf$var$__read = undefined && undefined.__read || function(o, n) {
    var m = typeof Symbol === "function" && o[Symbol.iterator];
    if (!m) return o;
    var i = m.call(o), r, ar = [], e;
    try {
        while((n === void 0 || n-- > 0) && !(r = i.next()).done)ar.push(r.value);
    } catch (error) {
        e = {
            error: error
        };
    } finally{
        try {
            if (r && !r.done && (m = i["return"])) m.call(i);
        } finally{
            if (e) throw e.error;
        }
    }
    return ar;
};
var $a86db8d850e55bcf$var$__spreadArray = undefined && undefined.__spreadArray || function(to, from, pack) {
    if (pack || arguments.length === 2) {
        for(var i = 0, l = from.length, ar; i < l; i++)if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
var $a86db8d850e55bcf$var$__values = undefined && undefined.__values || function(o) {
    var s = typeof Symbol === "function" && Symbol.iterator, m = s && o[s], i = 0;
    if (m) return m.call(o);
    if (o && typeof o.length === "number") return {
        next: function() {
            if (o && i >= o.length) o = void 0;
            return {
                value: o && o[i++],
                done: !o
            };
        }
    };
    throw new TypeError(s ? "Object is not iterable." : "Symbol.iterator is not defined.");
};
/**
 * An abstraction on top of WebSockets to provide fastest
 * possible connection for peers.
 */ var $a86db8d850e55bcf$export$4798917dbf149b79 = /** @class */ function(_super) {
    $a86db8d850e55bcf$var$__extends($a86db8d850e55bcf$export$4798917dbf149b79, _super);
    function $a86db8d850e55bcf$export$4798917dbf149b79(secure, host, port, path, key, pingInterval) {
        if (pingInterval === void 0) pingInterval = 5000;
        var _this = _super.call(this) || this;
        _this.pingInterval = pingInterval;
        _this._disconnected = true;
        _this._messagesQueue = [];
        var wsProtocol = secure ? "wss://" : "ws://";
        _this._baseUrl = wsProtocol + host + ":" + port + path + "peerjs?key=" + key;
        return _this;
    }
    $a86db8d850e55bcf$export$4798917dbf149b79.prototype.start = function(id, token) {
        var _this = this;
        this._id = id;
        var wsUrl = "".concat(this._baseUrl, "&id=").concat(id, "&token=").concat(token);
        if (!!this._socket || !this._disconnected) return;
        this._socket = new WebSocket(wsUrl + "&version=" + $059935620e5e661f$exports.version);
        this._disconnected = false;
        this._socket.onmessage = function(event) {
            var data;
            try {
                data = JSON.parse(event.data);
                $c25b565240b6a41d$exports.default.log("Server message received:", data);
            } catch (e) {
                $c25b565240b6a41d$exports.default.log("Invalid server message", event.data);
                return;
            }
            _this.emit($2f2cc37b22a0b29a$export$3b5c4a4b6354f023.Message, data);
        };
        this._socket.onclose = function(event) {
            if (_this._disconnected) return;
            $c25b565240b6a41d$exports.default.log("Socket closed.", event);
            _this._cleanup();
            _this._disconnected = true;
            _this.emit($2f2cc37b22a0b29a$export$3b5c4a4b6354f023.Disconnected);
        };
        // Take care of the queue of connections if necessary and make sure Peer knows
        // socket is open.
        this._socket.onopen = function() {
            if (_this._disconnected) return;
            _this._sendQueuedMessages();
            $c25b565240b6a41d$exports.default.log("Socket open");
            _this._scheduleHeartbeat();
        };
    };
    $a86db8d850e55bcf$export$4798917dbf149b79.prototype._scheduleHeartbeat = function() {
        var _this = this;
        this._wsPingTimer = setTimeout(function() {
            _this._sendHeartbeat();
        }, this.pingInterval);
    };
    $a86db8d850e55bcf$export$4798917dbf149b79.prototype._sendHeartbeat = function() {
        if (!this._wsOpen()) {
            $c25b565240b6a41d$exports.default.log("Cannot send heartbeat, because socket closed");
            return;
        }
        var message = JSON.stringify({
            type: $2f2cc37b22a0b29a$export$adb4a1754da6f10d.Heartbeat
        });
        this._socket.send(message);
        this._scheduleHeartbeat();
    };
    /** Is the websocket currently open? */ $a86db8d850e55bcf$export$4798917dbf149b79.prototype._wsOpen = function() {
        return !!this._socket && this._socket.readyState === 1;
    };
    /** Send queued messages. */ $a86db8d850e55bcf$export$4798917dbf149b79.prototype._sendQueuedMessages = function() {
        var e_1, _a;
        //Create copy of queue and clear it,
        //because send method push the message back to queue if smth will go wrong
        var copiedQueue = $a86db8d850e55bcf$var$__spreadArray([], $a86db8d850e55bcf$var$__read(this._messagesQueue), false);
        this._messagesQueue = [];
        try {
            for(var copiedQueue_1 = $a86db8d850e55bcf$var$__values(copiedQueue), copiedQueue_1_1 = copiedQueue_1.next(); !copiedQueue_1_1.done; copiedQueue_1_1 = copiedQueue_1.next()){
                var message = copiedQueue_1_1.value;
                this.send(message);
            }
        } catch (e_1_1) {
            e_1 = {
                error: e_1_1
            };
        } finally{
            try {
                if (copiedQueue_1_1 && !copiedQueue_1_1.done && (_a = copiedQueue_1.return)) _a.call(copiedQueue_1);
            } finally{
                if (e_1) throw e_1.error;
            }
        }
    };
    /** Exposed send for DC & Peer. */ $a86db8d850e55bcf$export$4798917dbf149b79.prototype.send = function(data) {
        if (this._disconnected) return;
        // If we didn't get an ID yet, we can't yet send anything so we should queue
        // up these messages.
        if (!this._id) {
            this._messagesQueue.push(data);
            return;
        }
        if (!data.type) {
            this.emit($2f2cc37b22a0b29a$export$3b5c4a4b6354f023.Error, "Invalid message");
            return;
        }
        if (!this._wsOpen()) return;
        var message = JSON.stringify(data);
        this._socket.send(message);
    };
    $a86db8d850e55bcf$export$4798917dbf149b79.prototype.close = function() {
        if (this._disconnected) return;
        this._cleanup();
        this._disconnected = true;
    };
    $a86db8d850e55bcf$export$4798917dbf149b79.prototype._cleanup = function() {
        if (this._socket) {
            this._socket.onopen = this._socket.onmessage = this._socket.onclose = null;
            this._socket.close();
            this._socket = undefined;
        }
        clearTimeout(this._wsPingTimer);
    };
    return $a86db8d850e55bcf$export$4798917dbf149b79;
}($TdzfH$eventemitter3.EventEmitter);


var $9b5cc8dbdd0aa809$exports = {};

$parcel$export($9b5cc8dbdd0aa809$exports, "MediaConnection", () => $9b5cc8dbdd0aa809$export$4a84e95a2324ac29, (v) => $9b5cc8dbdd0aa809$export$4a84e95a2324ac29 = v);


var $3b7b9afef381ead8$exports = {};

$parcel$export($3b7b9afef381ead8$exports, "Negotiator", () => $3b7b9afef381ead8$export$89e6bb5ad64bf4a, (v) => $3b7b9afef381ead8$export$89e6bb5ad64bf4a = v);



var $3b7b9afef381ead8$var$__assign = undefined && undefined.__assign || function() {
    $3b7b9afef381ead8$var$__assign = Object.assign || function(t) {
        for(var s, i = 1, n = arguments.length; i < n; i++){
            s = arguments[i];
            for(var p in s)if (Object.prototype.hasOwnProperty.call(s, p)) t[p] = s[p];
        }
        return t;
    };
    return $3b7b9afef381ead8$var$__assign.apply(this, arguments);
};
var $3b7b9afef381ead8$var$__awaiter = undefined && undefined.__awaiter || function(thisArg, _arguments, P, generator) {
    function adopt(value) {
        return value instanceof P ? value : new P(function(resolve) {
            resolve(value);
        });
    }
    return new (P || (P = Promise))(function(resolve, reject) {
        function fulfilled(value) {
            try {
                step(generator.next(value));
            } catch (e) {
                reject(e);
            }
        }
        function rejected(value) {
            try {
                step(generator["throw"](value));
            } catch (e) {
                reject(e);
            }
        }
        function step(result) {
            result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected);
        }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var $3b7b9afef381ead8$var$__generator = undefined && undefined.__generator || function(thisArg, body) {
    var _ = {
        label: 0,
        sent: function() {
            if (t[0] & 1) throw t[1];
            return t[1];
        },
        trys: [],
        ops: []
    }, f, y, t, g;
    return g = {
        next: verb(0),
        "throw": verb(1),
        "return": verb(2)
    }, typeof Symbol === "function" && (g[Symbol.iterator] = function() {
        return this;
    }), g;
    function verb(n) {
        return function(v) {
            return step([
                n,
                v
            ]);
        };
    }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while(_)try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [
                op[0] & 2,
                t.value
            ];
            switch(op[0]){
                case 0:
                case 1:
                    t = op;
                    break;
                case 4:
                    _.label++;
                    return {
                        value: op[1],
                        done: false
                    };
                case 5:
                    _.label++;
                    y = op[1];
                    op = [
                        0
                    ];
                    continue;
                case 7:
                    op = _.ops.pop();
                    _.trys.pop();
                    continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) {
                        _ = 0;
                        continue;
                    }
                    if (op[0] === 3 && (!t || op[1] > t[0] && op[1] < t[3])) {
                        _.label = op[1];
                        break;
                    }
                    if (op[0] === 6 && _.label < t[1]) {
                        _.label = t[1];
                        t = op;
                        break;
                    }
                    if (t && _.label < t[2]) {
                        _.label = t[2];
                        _.ops.push(op);
                        break;
                    }
                    if (t[2]) _.ops.pop();
                    _.trys.pop();
                    continue;
            }
            op = body.call(thisArg, _);
        } catch (e) {
            op = [
                6,
                e
            ];
            y = 0;
        } finally{
            f = t = 0;
        }
        if (op[0] & 5) throw op[1];
        return {
            value: op[0] ? op[1] : void 0,
            done: true
        };
    }
};
/**
 * Manages all negotiations between Peers.
 */ var $3b7b9afef381ead8$export$89e6bb5ad64bf4a = /** @class */ function() {
    function $3b7b9afef381ead8$export$89e6bb5ad64bf4a(connection) {
        this.connection = connection;
    }
    /** Returns a PeerConnection object set up correctly (for data, media). */ $3b7b9afef381ead8$export$89e6bb5ad64bf4a.prototype.startConnection = function(options) {
        var peerConnection = this._startPeerConnection();
        // Set the connection's PC.
        this.connection.peerConnection = peerConnection;
        if (this.connection.type === $2f2cc37b22a0b29a$export$3157d57b4135e3bc.Media && options._stream) this._addTracksToConnection(options._stream, peerConnection);
        // What do we need to do now?
        if (options.originator) {
            if (this.connection.type === $2f2cc37b22a0b29a$export$3157d57b4135e3bc.Data) {
                var dataConnection = this.connection;
                var config = {
                    ordered: !!options.reliable
                };
                var dataChannel = peerConnection.createDataChannel(dataConnection.label, config);
                dataConnection.initialize(dataChannel);
            }
            this._makeOffer();
        } else this.handleSDP("OFFER", options.sdp);
    };
    /** Start a PC. */ $3b7b9afef381ead8$export$89e6bb5ad64bf4a.prototype._startPeerConnection = function() {
        $c25b565240b6a41d$exports.default.log("Creating RTCPeerConnection.");
        var peerConnection = new RTCPeerConnection(this.connection.provider.options.config);
        this._setupListeners(peerConnection);
        return peerConnection;
    };
    /** Set up various WebRTC listeners. */ $3b7b9afef381ead8$export$89e6bb5ad64bf4a.prototype._setupListeners = function(peerConnection) {
        var _this = this;
        var peerId = this.connection.peer;
        var connectionId = this.connection.connectionId;
        var connectionType = this.connection.type;
        var provider = this.connection.provider;
        // ICE CANDIDATES.
        $c25b565240b6a41d$exports.default.log("Listening for ICE candidates.");
        peerConnection.onicecandidate = function(evt) {
            if (!evt.candidate || !evt.candidate.candidate) return;
            $c25b565240b6a41d$exports.default.log("Received ICE candidates for ".concat(peerId, ":"), evt.candidate);
            provider.socket.send({
                type: $2f2cc37b22a0b29a$export$adb4a1754da6f10d.Candidate,
                payload: {
                    candidate: evt.candidate,
                    type: connectionType,
                    connectionId: connectionId
                },
                dst: peerId
            });
        };
        peerConnection.oniceconnectionstatechange = function() {
            switch(peerConnection.iceConnectionState){
                case "failed":
                    $c25b565240b6a41d$exports.default.log("iceConnectionState is failed, closing connections to " + peerId);
                    _this.connection.emit("error", new Error("Negotiation of connection to " + peerId + " failed."));
                    _this.connection.close();
                    break;
                case "closed":
                    $c25b565240b6a41d$exports.default.log("iceConnectionState is closed, closing connections to " + peerId);
                    _this.connection.emit("error", new Error("Connection to " + peerId + " closed."));
                    _this.connection.close();
                    break;
                case "disconnected":
                    $c25b565240b6a41d$exports.default.log("iceConnectionState changed to disconnected on the connection with " + peerId);
                    break;
                case "completed":
                    peerConnection.onicecandidate = $6c02be62bb157391$export$7debb50ef11d5e0b.noop;
                    break;
            }
            _this.connection.emit("iceStateChanged", peerConnection.iceConnectionState);
        };
        // DATACONNECTION.
        $c25b565240b6a41d$exports.default.log("Listening for data channel");
        // Fired between offer and answer, so options should already be saved
        // in the options hash.
        peerConnection.ondatachannel = function(evt) {
            $c25b565240b6a41d$exports.default.log("Received data channel");
            var dataChannel = evt.channel;
            var connection = provider.getConnection(peerId, connectionId);
            connection.initialize(dataChannel);
        };
        // MEDIACONNECTION.
        $c25b565240b6a41d$exports.default.log("Listening for remote stream");
        peerConnection.ontrack = function(evt) {
            $c25b565240b6a41d$exports.default.log("Received remote stream");
            var stream = evt.streams[0];
            var connection = provider.getConnection(peerId, connectionId);
            if (connection.type === $2f2cc37b22a0b29a$export$3157d57b4135e3bc.Media) {
                var mediaConnection = connection;
                _this._addStreamToMediaConnection(stream, mediaConnection);
            }
        };
    };
    $3b7b9afef381ead8$export$89e6bb5ad64bf4a.prototype.cleanup = function() {
        $c25b565240b6a41d$exports.default.log("Cleaning up PeerConnection to " + this.connection.peer);
        var peerConnection = this.connection.peerConnection;
        if (!peerConnection) return;
        this.connection.peerConnection = null;
        //unsubscribe from all PeerConnection's events
        peerConnection.onicecandidate = peerConnection.oniceconnectionstatechange = peerConnection.ondatachannel = peerConnection.ontrack = function() {};
        var peerConnectionNotClosed = peerConnection.signalingState !== "closed";
        var dataChannelNotClosed = false;
        if (this.connection.type === $2f2cc37b22a0b29a$export$3157d57b4135e3bc.Data) {
            var dataConnection = this.connection;
            var dataChannel = dataConnection.dataChannel;
            if (dataChannel) dataChannelNotClosed = !!dataChannel.readyState && dataChannel.readyState !== "closed";
        }
        if (peerConnectionNotClosed || dataChannelNotClosed) peerConnection.close();
    };
    $3b7b9afef381ead8$export$89e6bb5ad64bf4a.prototype._makeOffer = function() {
        return $3b7b9afef381ead8$var$__awaiter(this, void 0, Promise, function() {
            var peerConnection, provider, offer, payload, dataConnection, err_2, err_1_1;
            return $3b7b9afef381ead8$var$__generator(this, function(_a) {
                switch(_a.label){
                    case 0:
                        peerConnection = this.connection.peerConnection;
                        provider = this.connection.provider;
                        _a.label = 1;
                    case 1:
                        _a.trys.push([
                            1,
                            7,
                            ,
                            8
                        ]);
                        return [
                            4 /*yield*/ ,
                            peerConnection.createOffer(this.connection.options.constraints)
                        ];
                    case 2:
                        offer = _a.sent();
                        $c25b565240b6a41d$exports.default.log("Created offer.");
                        if (this.connection.options.sdpTransform && typeof this.connection.options.sdpTransform === "function") offer.sdp = this.connection.options.sdpTransform(offer.sdp) || offer.sdp;
                        _a.label = 3;
                    case 3:
                        _a.trys.push([
                            3,
                            5,
                            ,
                            6
                        ]);
                        return [
                            4 /*yield*/ ,
                            peerConnection.setLocalDescription(offer)
                        ];
                    case 4:
                        _a.sent();
                        $c25b565240b6a41d$exports.default.log("Set localDescription:", offer, "for:".concat(this.connection.peer));
                        payload = {
                            sdp: offer,
                            type: this.connection.type,
                            connectionId: this.connection.connectionId,
                            metadata: this.connection.metadata,
                            browser: $6c02be62bb157391$export$7debb50ef11d5e0b.browser
                        };
                        if (this.connection.type === $2f2cc37b22a0b29a$export$3157d57b4135e3bc.Data) {
                            dataConnection = this.connection;
                            payload = $3b7b9afef381ead8$var$__assign($3b7b9afef381ead8$var$__assign({}, payload), {
                                label: dataConnection.label,
                                reliable: dataConnection.reliable,
                                serialization: dataConnection.serialization
                            });
                        }
                        provider.socket.send({
                            type: $2f2cc37b22a0b29a$export$adb4a1754da6f10d.Offer,
                            payload: payload,
                            dst: this.connection.peer
                        });
                        return [
                            3 /*break*/ ,
                            6
                        ];
                    case 5:
                        err_2 = _a.sent();
                        // TODO: investigate why _makeOffer is being called from the answer
                        if (err_2 != "OperationError: Failed to set local offer sdp: Called in wrong state: kHaveRemoteOffer") {
                            provider.emitError($2f2cc37b22a0b29a$export$9547aaa2e39030ff.WebRTC, err_2);
                            $c25b565240b6a41d$exports.default.log("Failed to setLocalDescription, ", err_2);
                        }
                        return [
                            3 /*break*/ ,
                            6
                        ];
                    case 6:
                        return [
                            3 /*break*/ ,
                            8
                        ];
                    case 7:
                        err_1_1 = _a.sent();
                        provider.emitError($2f2cc37b22a0b29a$export$9547aaa2e39030ff.WebRTC, err_1_1);
                        $c25b565240b6a41d$exports.default.log("Failed to createOffer, ", err_1_1);
                        return [
                            3 /*break*/ ,
                            8
                        ];
                    case 8:
                        return [
                            2 /*return*/ 
                        ];
                }
            });
        });
    };
    $3b7b9afef381ead8$export$89e6bb5ad64bf4a.prototype._makeAnswer = function() {
        return $3b7b9afef381ead8$var$__awaiter(this, void 0, Promise, function() {
            var peerConnection, provider, answer, err_3, err_1_2;
            return $3b7b9afef381ead8$var$__generator(this, function(_a) {
                switch(_a.label){
                    case 0:
                        peerConnection = this.connection.peerConnection;
                        provider = this.connection.provider;
                        _a.label = 1;
                    case 1:
                        _a.trys.push([
                            1,
                            7,
                            ,
                            8
                        ]);
                        return [
                            4 /*yield*/ ,
                            peerConnection.createAnswer()
                        ];
                    case 2:
                        answer = _a.sent();
                        $c25b565240b6a41d$exports.default.log("Created answer.");
                        if (this.connection.options.sdpTransform && typeof this.connection.options.sdpTransform === "function") answer.sdp = this.connection.options.sdpTransform(answer.sdp) || answer.sdp;
                        _a.label = 3;
                    case 3:
                        _a.trys.push([
                            3,
                            5,
                            ,
                            6
                        ]);
                        return [
                            4 /*yield*/ ,
                            peerConnection.setLocalDescription(answer)
                        ];
                    case 4:
                        _a.sent();
                        $c25b565240b6a41d$exports.default.log("Set localDescription:", answer, "for:".concat(this.connection.peer));
                        provider.socket.send({
                            type: $2f2cc37b22a0b29a$export$adb4a1754da6f10d.Answer,
                            payload: {
                                sdp: answer,
                                type: this.connection.type,
                                connectionId: this.connection.connectionId,
                                browser: $6c02be62bb157391$export$7debb50ef11d5e0b.browser
                            },
                            dst: this.connection.peer
                        });
                        return [
                            3 /*break*/ ,
                            6
                        ];
                    case 5:
                        err_3 = _a.sent();
                        provider.emitError($2f2cc37b22a0b29a$export$9547aaa2e39030ff.WebRTC, err_3);
                        $c25b565240b6a41d$exports.default.log("Failed to setLocalDescription, ", err_3);
                        return [
                            3 /*break*/ ,
                            6
                        ];
                    case 6:
                        return [
                            3 /*break*/ ,
                            8
                        ];
                    case 7:
                        err_1_2 = _a.sent();
                        provider.emitError($2f2cc37b22a0b29a$export$9547aaa2e39030ff.WebRTC, err_1_2);
                        $c25b565240b6a41d$exports.default.log("Failed to create answer, ", err_1_2);
                        return [
                            3 /*break*/ ,
                            8
                        ];
                    case 8:
                        return [
                            2 /*return*/ 
                        ];
                }
            });
        });
    };
    /** Handle an SDP. */ $3b7b9afef381ead8$export$89e6bb5ad64bf4a.prototype.handleSDP = function(type, sdp) {
        return $3b7b9afef381ead8$var$__awaiter(this, void 0, Promise, function() {
            var peerConnection, provider, self, err_4;
            return $3b7b9afef381ead8$var$__generator(this, function(_a) {
                switch(_a.label){
                    case 0:
                        sdp = new RTCSessionDescription(sdp);
                        peerConnection = this.connection.peerConnection;
                        provider = this.connection.provider;
                        $c25b565240b6a41d$exports.default.log("Setting remote description", sdp);
                        self = this;
                        _a.label = 1;
                    case 1:
                        _a.trys.push([
                            1,
                            5,
                            ,
                            6
                        ]);
                        return [
                            4 /*yield*/ ,
                            peerConnection.setRemoteDescription(sdp)
                        ];
                    case 2:
                        _a.sent();
                        $c25b565240b6a41d$exports.default.log("Set remoteDescription:".concat(type, " for:").concat(this.connection.peer));
                        if (!(type === "OFFER")) return [
                            3 /*break*/ ,
                            4
                        ];
                        return [
                            4 /*yield*/ ,
                            self._makeAnswer()
                        ];
                    case 3:
                        _a.sent();
                        _a.label = 4;
                    case 4:
                        return [
                            3 /*break*/ ,
                            6
                        ];
                    case 5:
                        err_4 = _a.sent();
                        provider.emitError($2f2cc37b22a0b29a$export$9547aaa2e39030ff.WebRTC, err_4);
                        $c25b565240b6a41d$exports.default.log("Failed to setRemoteDescription, ", err_4);
                        return [
                            3 /*break*/ ,
                            6
                        ];
                    case 6:
                        return [
                            2 /*return*/ 
                        ];
                }
            });
        });
    };
    /** Handle a candidate. */ $3b7b9afef381ead8$export$89e6bb5ad64bf4a.prototype.handleCandidate = function(ice) {
        return $3b7b9afef381ead8$var$__awaiter(this, void 0, Promise, function() {
            var candidate, sdpMLineIndex, sdpMid, peerConnection, provider, err_5;
            return $3b7b9afef381ead8$var$__generator(this, function(_a) {
                switch(_a.label){
                    case 0:
                        $c25b565240b6a41d$exports.default.log("handleCandidate:", ice);
                        candidate = ice.candidate;
                        sdpMLineIndex = ice.sdpMLineIndex;
                        sdpMid = ice.sdpMid;
                        peerConnection = this.connection.peerConnection;
                        provider = this.connection.provider;
                        _a.label = 1;
                    case 1:
                        _a.trys.push([
                            1,
                            3,
                            ,
                            4
                        ]);
                        return [
                            4 /*yield*/ ,
                            peerConnection.addIceCandidate(new RTCIceCandidate({
                                sdpMid: sdpMid,
                                sdpMLineIndex: sdpMLineIndex,
                                candidate: candidate
                            }))
                        ];
                    case 2:
                        _a.sent();
                        $c25b565240b6a41d$exports.default.log("Added ICE candidate for:".concat(this.connection.peer));
                        return [
                            3 /*break*/ ,
                            4
                        ];
                    case 3:
                        err_5 = _a.sent();
                        provider.emitError($2f2cc37b22a0b29a$export$9547aaa2e39030ff.WebRTC, err_5);
                        $c25b565240b6a41d$exports.default.log("Failed to handleCandidate, ", err_5);
                        return [
                            3 /*break*/ ,
                            4
                        ];
                    case 4:
                        return [
                            2 /*return*/ 
                        ];
                }
            });
        });
    };
    $3b7b9afef381ead8$export$89e6bb5ad64bf4a.prototype._addTracksToConnection = function(stream, peerConnection) {
        $c25b565240b6a41d$exports.default.log("add tracks from stream ".concat(stream.id, " to peer connection"));
        if (!peerConnection.addTrack) return $c25b565240b6a41d$exports.default.error("Your browser does't support RTCPeerConnection#addTrack. Ignored.");
        stream.getTracks().forEach(function(track) {
            peerConnection.addTrack(track, stream);
        });
    };
    $3b7b9afef381ead8$export$89e6bb5ad64bf4a.prototype._addStreamToMediaConnection = function(stream, mediaConnection) {
        $c25b565240b6a41d$exports.default.log("add stream ".concat(stream.id, " to media connection ").concat(mediaConnection.connectionId));
        mediaConnection.addStream(stream);
    };
    return $3b7b9afef381ead8$export$89e6bb5ad64bf4a;
}();



var $816db5763b2092b1$exports = {};

$parcel$export($816db5763b2092b1$exports, "BaseConnection", () => $816db5763b2092b1$export$23a2a68283c24d80, (v) => $816db5763b2092b1$export$23a2a68283c24d80 = v);

var $816db5763b2092b1$var$__extends = undefined && undefined.__extends || function() {
    var extendStatics = function(d1, b1) {
        extendStatics = Object.setPrototypeOf || ({
            __proto__: []
        }) instanceof Array && function(d, b) {
            d.__proto__ = b;
        } || function(d, b) {
            for(var p in b)if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p];
        };
        return extendStatics(d1, b1);
    };
    return function(d, b) {
        if (typeof b !== "function" && b !== null) throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() {
            this.constructor = d;
        }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
}();
var $816db5763b2092b1$export$23a2a68283c24d80 = /** @class */ function(_super) {
    $816db5763b2092b1$var$__extends($816db5763b2092b1$export$23a2a68283c24d80, _super);
    function $816db5763b2092b1$export$23a2a68283c24d80(peer, provider, options) {
        var _this = _super.call(this) || this;
        _this.peer = peer;
        _this.provider = provider;
        _this.options = options;
        _this._open = false;
        _this.metadata = options.metadata;
        return _this;
    }
    Object.defineProperty($816db5763b2092b1$export$23a2a68283c24d80.prototype, "open", {
        get: function() {
            return this._open;
        },
        enumerable: false,
        configurable: true
    });
    return $816db5763b2092b1$export$23a2a68283c24d80;
}($TdzfH$eventemitter3.EventEmitter);


var $9b5cc8dbdd0aa809$var$__extends = undefined && undefined.__extends || function() {
    var extendStatics = function(d1, b1) {
        extendStatics = Object.setPrototypeOf || ({
            __proto__: []
        }) instanceof Array && function(d, b) {
            d.__proto__ = b;
        } || function(d, b) {
            for(var p in b)if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p];
        };
        return extendStatics(d1, b1);
    };
    return function(d, b) {
        if (typeof b !== "function" && b !== null) throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() {
            this.constructor = d;
        }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
}();
var $9b5cc8dbdd0aa809$var$__assign = undefined && undefined.__assign || function() {
    $9b5cc8dbdd0aa809$var$__assign = Object.assign || function(t) {
        for(var s, i = 1, n = arguments.length; i < n; i++){
            s = arguments[i];
            for(var p in s)if (Object.prototype.hasOwnProperty.call(s, p)) t[p] = s[p];
        }
        return t;
    };
    return $9b5cc8dbdd0aa809$var$__assign.apply(this, arguments);
};
var $9b5cc8dbdd0aa809$var$__values = undefined && undefined.__values || function(o) {
    var s = typeof Symbol === "function" && Symbol.iterator, m = s && o[s], i = 0;
    if (m) return m.call(o);
    if (o && typeof o.length === "number") return {
        next: function() {
            if (o && i >= o.length) o = void 0;
            return {
                value: o && o[i++],
                done: !o
            };
        }
    };
    throw new TypeError(s ? "Object is not iterable." : "Symbol.iterator is not defined.");
};
/**
 * Wraps the streaming interface between two Peers.
 */ var $9b5cc8dbdd0aa809$export$4a84e95a2324ac29 = /** @class */ function(_super) {
    $9b5cc8dbdd0aa809$var$__extends($9b5cc8dbdd0aa809$export$4a84e95a2324ac29, _super);
    function $9b5cc8dbdd0aa809$export$4a84e95a2324ac29(peerId, provider, options) {
        var _this = _super.call(this, peerId, provider, options) || this;
        _this._localStream = _this.options._stream;
        _this.connectionId = _this.options.connectionId || $9b5cc8dbdd0aa809$export$4a84e95a2324ac29.ID_PREFIX + $6c02be62bb157391$export$7debb50ef11d5e0b.randomToken();
        _this._negotiator = new $3b7b9afef381ead8$exports.Negotiator(_this);
        if (_this._localStream) _this._negotiator.startConnection({
            _stream: _this._localStream,
            originator: true
        });
        return _this;
    }
    Object.defineProperty($9b5cc8dbdd0aa809$export$4a84e95a2324ac29.prototype, "type", {
        get: function() {
            return $2f2cc37b22a0b29a$export$3157d57b4135e3bc.Media;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty($9b5cc8dbdd0aa809$export$4a84e95a2324ac29.prototype, "localStream", {
        get: function() {
            return this._localStream;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty($9b5cc8dbdd0aa809$export$4a84e95a2324ac29.prototype, "remoteStream", {
        get: function() {
            return this._remoteStream;
        },
        enumerable: false,
        configurable: true
    });
    $9b5cc8dbdd0aa809$export$4a84e95a2324ac29.prototype.addStream = function(remoteStream) {
        $c25b565240b6a41d$exports.default.log("Receiving stream", remoteStream);
        this._remoteStream = remoteStream;
        _super.prototype.emit.call(this, "stream", remoteStream); // Should we call this `open`?
    };
    $9b5cc8dbdd0aa809$export$4a84e95a2324ac29.prototype.handleMessage = function(message) {
        var type = message.type;
        var payload = message.payload;
        switch(message.type){
            case $2f2cc37b22a0b29a$export$adb4a1754da6f10d.Answer:
                // Forward to negotiator
                this._negotiator.handleSDP(type, payload.sdp);
                this._open = true;
                break;
            case $2f2cc37b22a0b29a$export$adb4a1754da6f10d.Candidate:
                this._negotiator.handleCandidate(payload.candidate);
                break;
            default:
                $c25b565240b6a41d$exports.default.warn("Unrecognized message type:".concat(type, " from peer:").concat(this.peer));
                break;
        }
    };
    $9b5cc8dbdd0aa809$export$4a84e95a2324ac29.prototype.answer = function(stream, options) {
        var e_1, _a;
        if (options === void 0) options = {};
        if (this._localStream) {
            $c25b565240b6a41d$exports.default.warn("Local stream already exists on this MediaConnection. Are you answering a call twice?");
            return;
        }
        this._localStream = stream;
        if (options && options.sdpTransform) this.options.sdpTransform = options.sdpTransform;
        this._negotiator.startConnection($9b5cc8dbdd0aa809$var$__assign($9b5cc8dbdd0aa809$var$__assign({}, this.options._payload), {
            _stream: stream
        }));
        // Retrieve lost messages stored because PeerConnection not set up.
        var messages = this.provider._getMessages(this.connectionId);
        try {
            for(var messages_1 = $9b5cc8dbdd0aa809$var$__values(messages), messages_1_1 = messages_1.next(); !messages_1_1.done; messages_1_1 = messages_1.next()){
                var message = messages_1_1.value;
                this.handleMessage(message);
            }
        } catch (e_1_1) {
            e_1 = {
                error: e_1_1
            };
        } finally{
            try {
                if (messages_1_1 && !messages_1_1.done && (_a = messages_1.return)) _a.call(messages_1);
            } finally{
                if (e_1) throw e_1.error;
            }
        }
        this._open = true;
    };
    /**
     * Exposed functionality for users.
     */ /** Allows user to close connection. */ $9b5cc8dbdd0aa809$export$4a84e95a2324ac29.prototype.close = function() {
        if (this._negotiator) {
            this._negotiator.cleanup();
            this._negotiator = null;
        }
        this._localStream = null;
        this._remoteStream = null;
        if (this.provider) {
            this.provider._removeConnection(this);
            this.provider = null;
        }
        if (this.options && this.options._stream) this.options._stream = null;
        if (!this.open) return;
        this._open = false;
        _super.prototype.emit.call(this, "close");
    };
    $9b5cc8dbdd0aa809$export$4a84e95a2324ac29.ID_PREFIX = "mc_";
    return $9b5cc8dbdd0aa809$export$4a84e95a2324ac29;
}($816db5763b2092b1$exports.BaseConnection);


var $92db9a3ba21db2a0$exports = {};

$parcel$export($92db9a3ba21db2a0$exports, "DataConnection", () => $92db9a3ba21db2a0$export$d365f7ad9d7df9c9, (v) => $92db9a3ba21db2a0$export$d365f7ad9d7df9c9 = v);





var $3ff0aafdb373378c$exports = {};

$parcel$export($3ff0aafdb373378c$exports, "EncodingQueue", () => $3ff0aafdb373378c$export$c6913ae0ed687038, (v) => $3ff0aafdb373378c$export$c6913ae0ed687038 = v);


var $3ff0aafdb373378c$var$__extends = undefined && undefined.__extends || function() {
    var extendStatics = function(d1, b1) {
        extendStatics = Object.setPrototypeOf || ({
            __proto__: []
        }) instanceof Array && function(d, b) {
            d.__proto__ = b;
        } || function(d, b) {
            for(var p in b)if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p];
        };
        return extendStatics(d1, b1);
    };
    return function(d, b) {
        if (typeof b !== "function" && b !== null) throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() {
            this.constructor = d;
        }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
}();
var $3ff0aafdb373378c$export$c6913ae0ed687038 = /** @class */ function(_super) {
    $3ff0aafdb373378c$var$__extends($3ff0aafdb373378c$export$c6913ae0ed687038, _super);
    function $3ff0aafdb373378c$export$c6913ae0ed687038() {
        var _this = _super.call(this) || this;
        _this.fileReader = new FileReader();
        _this._queue = [];
        _this._processing = false;
        _this.fileReader.onload = function(evt) {
            _this._processing = false;
            if (evt.target) _this.emit("done", evt.target.result);
            _this.doNextTask();
        };
        _this.fileReader.onerror = function(evt) {
            $c25b565240b6a41d$exports.default.error("EncodingQueue error:", evt);
            _this._processing = false;
            _this.destroy();
            _this.emit("error", evt);
        };
        return _this;
    }
    Object.defineProperty($3ff0aafdb373378c$export$c6913ae0ed687038.prototype, "queue", {
        get: function() {
            return this._queue;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty($3ff0aafdb373378c$export$c6913ae0ed687038.prototype, "size", {
        get: function() {
            return this.queue.length;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty($3ff0aafdb373378c$export$c6913ae0ed687038.prototype, "processing", {
        get: function() {
            return this._processing;
        },
        enumerable: false,
        configurable: true
    });
    $3ff0aafdb373378c$export$c6913ae0ed687038.prototype.enque = function(blob) {
        this.queue.push(blob);
        if (this.processing) return;
        this.doNextTask();
    };
    $3ff0aafdb373378c$export$c6913ae0ed687038.prototype.destroy = function() {
        this.fileReader.abort();
        this._queue = [];
    };
    $3ff0aafdb373378c$export$c6913ae0ed687038.prototype.doNextTask = function() {
        if (this.size === 0) return;
        if (this.processing) return;
        this._processing = true;
        this.fileReader.readAsArrayBuffer(this.queue.shift());
    };
    return $3ff0aafdb373378c$export$c6913ae0ed687038;
}($TdzfH$eventemitter3.EventEmitter);


var $92db9a3ba21db2a0$var$__extends = undefined && undefined.__extends || function() {
    var extendStatics = function(d1, b1) {
        extendStatics = Object.setPrototypeOf || ({
            __proto__: []
        }) instanceof Array && function(d, b) {
            d.__proto__ = b;
        } || function(d, b) {
            for(var p in b)if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p];
        };
        return extendStatics(d1, b1);
    };
    return function(d, b) {
        if (typeof b !== "function" && b !== null) throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() {
            this.constructor = d;
        }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
}();
var $92db9a3ba21db2a0$var$__values = undefined && undefined.__values || function(o) {
    var s = typeof Symbol === "function" && Symbol.iterator, m = s && o[s], i = 0;
    if (m) return m.call(o);
    if (o && typeof o.length === "number") return {
        next: function() {
            if (o && i >= o.length) o = void 0;
            return {
                value: o && o[i++],
                done: !o
            };
        }
    };
    throw new TypeError(s ? "Object is not iterable." : "Symbol.iterator is not defined.");
};
/**
 * Wraps a DataChannel between two Peers.
 */ var $92db9a3ba21db2a0$export$d365f7ad9d7df9c9 = /** @class */ function(_super) {
    $92db9a3ba21db2a0$var$__extends($92db9a3ba21db2a0$export$d365f7ad9d7df9c9, _super);
    function $92db9a3ba21db2a0$export$d365f7ad9d7df9c9(peerId, provider, options) {
        var _this = _super.call(this, peerId, provider, options) || this;
        _this.stringify = JSON.stringify;
        _this.parse = JSON.parse;
        _this._buffer = [];
        _this._bufferSize = 0;
        _this._buffering = false;
        _this._chunkedData = {};
        _this._encodingQueue = new $3ff0aafdb373378c$exports.EncodingQueue();
        _this.connectionId = _this.options.connectionId || $92db9a3ba21db2a0$export$d365f7ad9d7df9c9.ID_PREFIX + $6c02be62bb157391$export$7debb50ef11d5e0b.randomToken();
        _this.label = _this.options.label || _this.connectionId;
        _this.serialization = _this.options.serialization || $2f2cc37b22a0b29a$export$89f507cf986a947.Binary;
        _this.reliable = !!_this.options.reliable;
        _this._encodingQueue.on("done", function(ab) {
            _this._bufferedSend(ab);
        });
        _this._encodingQueue.on("error", function() {
            $c25b565240b6a41d$exports.default.error("DC#".concat(_this.connectionId, ": Error occured in encoding from blob to arraybuffer, close DC"));
            _this.close();
        });
        _this._negotiator = new $3b7b9afef381ead8$exports.Negotiator(_this);
        _this._negotiator.startConnection(_this.options._payload || {
            originator: true
        });
        return _this;
    }
    Object.defineProperty($92db9a3ba21db2a0$export$d365f7ad9d7df9c9.prototype, "type", {
        get: function() {
            return $2f2cc37b22a0b29a$export$3157d57b4135e3bc.Data;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty($92db9a3ba21db2a0$export$d365f7ad9d7df9c9.prototype, "dataChannel", {
        get: function() {
            return this._dc;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty($92db9a3ba21db2a0$export$d365f7ad9d7df9c9.prototype, "bufferSize", {
        get: function() {
            return this._bufferSize;
        },
        enumerable: false,
        configurable: true
    });
    /** Called by the Negotiator when the DataChannel is ready. */ $92db9a3ba21db2a0$export$d365f7ad9d7df9c9.prototype.initialize = function(dc) {
        this._dc = dc;
        this._configureDataChannel();
    };
    $92db9a3ba21db2a0$export$d365f7ad9d7df9c9.prototype._configureDataChannel = function() {
        var _this = this;
        if (!$6c02be62bb157391$export$7debb50ef11d5e0b.supports.binaryBlob || $6c02be62bb157391$export$7debb50ef11d5e0b.supports.reliable) this.dataChannel.binaryType = "arraybuffer";
        this.dataChannel.onopen = function() {
            $c25b565240b6a41d$exports.default.log("DC#".concat(_this.connectionId, " dc connection success"));
            _this._open = true;
            _this.emit("open");
        };
        this.dataChannel.onmessage = function(e) {
            $c25b565240b6a41d$exports.default.log("DC#".concat(_this.connectionId, " dc onmessage:"), e.data);
            _this._handleDataMessage(e);
        };
        this.dataChannel.onclose = function() {
            $c25b565240b6a41d$exports.default.log("DC#".concat(_this.connectionId, " dc closed for:"), _this.peer);
            _this.close();
        };
    };
    // Handles a DataChannel message.
    $92db9a3ba21db2a0$export$d365f7ad9d7df9c9.prototype._handleDataMessage = function(_a) {
        var _this = this;
        var data = _a.data;
        var datatype = data.constructor;
        var isBinarySerialization = this.serialization === $2f2cc37b22a0b29a$export$89f507cf986a947.Binary || this.serialization === $2f2cc37b22a0b29a$export$89f507cf986a947.BinaryUTF8;
        var deserializedData = data;
        if (isBinarySerialization) {
            if (datatype === Blob) {
                // Datatype should never be blob
                $6c02be62bb157391$export$7debb50ef11d5e0b.blobToArrayBuffer(data, function(ab) {
                    var unpackedData = $6c02be62bb157391$export$7debb50ef11d5e0b.unpack(ab);
                    _this.emit("data", unpackedData);
                });
                return;
            } else if (datatype === ArrayBuffer) deserializedData = $6c02be62bb157391$export$7debb50ef11d5e0b.unpack(data);
            else if (datatype === String) {
                // String fallback for binary data for browsers that don't support binary yet
                var ab1 = $6c02be62bb157391$export$7debb50ef11d5e0b.binaryStringToArrayBuffer(data);
                deserializedData = $6c02be62bb157391$export$7debb50ef11d5e0b.unpack(ab1);
            }
        } else if (this.serialization === $2f2cc37b22a0b29a$export$89f507cf986a947.JSON) deserializedData = this.parse(data);
        // Check if we've chunked--if so, piece things back together.
        // We're guaranteed that this isn't 0.
        if (deserializedData.__peerData) {
            this._handleChunk(deserializedData);
            return;
        }
        _super.prototype.emit.call(this, "data", deserializedData);
    };
    $92db9a3ba21db2a0$export$d365f7ad9d7df9c9.prototype._handleChunk = function(data) {
        var id = data.__peerData;
        var chunkInfo = this._chunkedData[id] || {
            data: [],
            count: 0,
            total: data.total
        };
        chunkInfo.data[data.n] = data.data;
        chunkInfo.count++;
        this._chunkedData[id] = chunkInfo;
        if (chunkInfo.total === chunkInfo.count) {
            // Clean up before making the recursive call to `_handleDataMessage`.
            delete this._chunkedData[id];
            // We've received all the chunks--time to construct the complete data.
            var data_1 = new Blob(chunkInfo.data);
            this._handleDataMessage({
                data: data_1
            });
        }
    };
    /**
     * Exposed functionality for users.
     */ /** Allows user to close connection. */ $92db9a3ba21db2a0$export$d365f7ad9d7df9c9.prototype.close = function() {
        this._buffer = [];
        this._bufferSize = 0;
        this._chunkedData = {};
        if (this._negotiator) {
            this._negotiator.cleanup();
            this._negotiator = null;
        }
        if (this.provider) {
            this.provider._removeConnection(this);
            this.provider = null;
        }
        if (this.dataChannel) {
            this.dataChannel.onopen = null;
            this.dataChannel.onmessage = null;
            this.dataChannel.onclose = null;
            this._dc = null;
        }
        if (this._encodingQueue) {
            this._encodingQueue.destroy();
            this._encodingQueue.removeAllListeners();
            this._encodingQueue = null;
        }
        if (!this.open) return;
        this._open = false;
        _super.prototype.emit.call(this, "close");
    };
    /** Allows user to send data. */ $92db9a3ba21db2a0$export$d365f7ad9d7df9c9.prototype.send = function(data, chunked) {
        if (!this.open) {
            _super.prototype.emit.call(this, "error", new Error("Connection is not open. You should listen for the `open` event before sending messages."));
            return;
        }
        if (this.serialization === $2f2cc37b22a0b29a$export$89f507cf986a947.JSON) this._bufferedSend(this.stringify(data));
        else if (this.serialization === $2f2cc37b22a0b29a$export$89f507cf986a947.Binary || this.serialization === $2f2cc37b22a0b29a$export$89f507cf986a947.BinaryUTF8) {
            var blob = $6c02be62bb157391$export$7debb50ef11d5e0b.pack(data);
            if (!chunked && blob.size > $6c02be62bb157391$export$7debb50ef11d5e0b.chunkedMTU) {
                this._sendChunks(blob);
                return;
            }
            if (!$6c02be62bb157391$export$7debb50ef11d5e0b.supports.binaryBlob) // We only do this if we really need to (e.g. blobs are not supported),
            // because this conversion is costly.
            this._encodingQueue.enque(blob);
            else this._bufferedSend(blob);
        } else this._bufferedSend(data);
    };
    $92db9a3ba21db2a0$export$d365f7ad9d7df9c9.prototype._bufferedSend = function(msg) {
        if (this._buffering || !this._trySend(msg)) {
            this._buffer.push(msg);
            this._bufferSize = this._buffer.length;
        }
    };
    // Returns true if the send succeeds.
    $92db9a3ba21db2a0$export$d365f7ad9d7df9c9.prototype._trySend = function(msg) {
        var _this = this;
        if (!this.open) return false;
        if (this.dataChannel.bufferedAmount > $92db9a3ba21db2a0$export$d365f7ad9d7df9c9.MAX_BUFFERED_AMOUNT) {
            this._buffering = true;
            setTimeout(function() {
                _this._buffering = false;
                _this._tryBuffer();
            }, 50);
            return false;
        }
        try {
            this.dataChannel.send(msg);
        } catch (e) {
            $c25b565240b6a41d$exports.default.error("DC#:".concat(this.connectionId, " Error when sending:"), e);
            this._buffering = true;
            this.close();
            return false;
        }
        return true;
    };
    // Try to send the first message in the buffer.
    $92db9a3ba21db2a0$export$d365f7ad9d7df9c9.prototype._tryBuffer = function() {
        if (!this.open) return;
        if (this._buffer.length === 0) return;
        var msg = this._buffer[0];
        if (this._trySend(msg)) {
            this._buffer.shift();
            this._bufferSize = this._buffer.length;
            this._tryBuffer();
        }
    };
    $92db9a3ba21db2a0$export$d365f7ad9d7df9c9.prototype._sendChunks = function(blob) {
        var e_1, _a;
        var blobs = $6c02be62bb157391$export$7debb50ef11d5e0b.chunk(blob);
        $c25b565240b6a41d$exports.default.log("DC#".concat(this.connectionId, " Try to send ").concat(blobs.length, " chunks..."));
        try {
            for(var blobs_1 = $92db9a3ba21db2a0$var$__values(blobs), blobs_1_1 = blobs_1.next(); !blobs_1_1.done; blobs_1_1 = blobs_1.next()){
                var blob_1 = blobs_1_1.value;
                this.send(blob_1, true);
            }
        } catch (e_1_1) {
            e_1 = {
                error: e_1_1
            };
        } finally{
            try {
                if (blobs_1_1 && !blobs_1_1.done && (_a = blobs_1.return)) _a.call(blobs_1);
            } finally{
                if (e_1) throw e_1.error;
            }
        }
    };
    $92db9a3ba21db2a0$export$d365f7ad9d7df9c9.prototype.handleMessage = function(message) {
        var payload = message.payload;
        switch(message.type){
            case $2f2cc37b22a0b29a$export$adb4a1754da6f10d.Answer:
                this._negotiator.handleSDP(message.type, payload.sdp);
                break;
            case $2f2cc37b22a0b29a$export$adb4a1754da6f10d.Candidate:
                this._negotiator.handleCandidate(payload.candidate);
                break;
            default:
                $c25b565240b6a41d$exports.default.warn("Unrecognized message type:", message.type, "from peer:", this.peer);
                break;
        }
    };
    $92db9a3ba21db2a0$export$d365f7ad9d7df9c9.ID_PREFIX = "dc_";
    $92db9a3ba21db2a0$export$d365f7ad9d7df9c9.MAX_BUFFERED_AMOUNT = 8388608;
    return $92db9a3ba21db2a0$export$d365f7ad9d7df9c9;
}($816db5763b2092b1$exports.BaseConnection);



var $067535f02cda23a2$exports = {};

$parcel$export($067535f02cda23a2$exports, "API", () => $067535f02cda23a2$export$2c4e825dc9120f87, (v) => $067535f02cda23a2$export$2c4e825dc9120f87 = v);



var $067535f02cda23a2$var$__awaiter = undefined && undefined.__awaiter || function(thisArg, _arguments, P, generator) {
    function adopt(value) {
        return value instanceof P ? value : new P(function(resolve) {
            resolve(value);
        });
    }
    return new (P || (P = Promise))(function(resolve, reject) {
        function fulfilled(value) {
            try {
                step(generator.next(value));
            } catch (e) {
                reject(e);
            }
        }
        function rejected(value) {
            try {
                step(generator["throw"](value));
            } catch (e) {
                reject(e);
            }
        }
        function step(result) {
            result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected);
        }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var $067535f02cda23a2$var$__generator = undefined && undefined.__generator || function(thisArg, body) {
    var _ = {
        label: 0,
        sent: function() {
            if (t[0] & 1) throw t[1];
            return t[1];
        },
        trys: [],
        ops: []
    }, f, y, t, g;
    return g = {
        next: verb(0),
        "throw": verb(1),
        "return": verb(2)
    }, typeof Symbol === "function" && (g[Symbol.iterator] = function() {
        return this;
    }), g;
    function verb(n) {
        return function(v) {
            return step([
                n,
                v
            ]);
        };
    }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while(_)try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [
                op[0] & 2,
                t.value
            ];
            switch(op[0]){
                case 0:
                case 1:
                    t = op;
                    break;
                case 4:
                    _.label++;
                    return {
                        value: op[1],
                        done: false
                    };
                case 5:
                    _.label++;
                    y = op[1];
                    op = [
                        0
                    ];
                    continue;
                case 7:
                    op = _.ops.pop();
                    _.trys.pop();
                    continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) {
                        _ = 0;
                        continue;
                    }
                    if (op[0] === 3 && (!t || op[1] > t[0] && op[1] < t[3])) {
                        _.label = op[1];
                        break;
                    }
                    if (op[0] === 6 && _.label < t[1]) {
                        _.label = t[1];
                        t = op;
                        break;
                    }
                    if (t && _.label < t[2]) {
                        _.label = t[2];
                        _.ops.push(op);
                        break;
                    }
                    if (t[2]) _.ops.pop();
                    _.trys.pop();
                    continue;
            }
            op = body.call(thisArg, _);
        } catch (e) {
            op = [
                6,
                e
            ];
            y = 0;
        } finally{
            f = t = 0;
        }
        if (op[0] & 5) throw op[1];
        return {
            value: op[0] ? op[1] : void 0,
            done: true
        };
    }
};
var $067535f02cda23a2$export$2c4e825dc9120f87 = /** @class */ function() {
    function $067535f02cda23a2$export$2c4e825dc9120f87(_options) {
        this._options = _options;
    }
    $067535f02cda23a2$export$2c4e825dc9120f87.prototype._buildRequest = function(method) {
        var protocol = this._options.secure ? "https" : "http";
        var _a = this._options, host = _a.host, port = _a.port, path = _a.path, key = _a.key;
        var url = new URL("".concat(protocol, "://").concat(host, ":").concat(port).concat(path).concat(key, "/").concat(method));
        // TODO: Why timestamp, why random?
        url.searchParams.set("ts", "".concat(Date.now()).concat(Math.random()));
        url.searchParams.set("version", $059935620e5e661f$exports.version);
        return fetch(url.href, {
            referrerPolicy: this._options.referrerPolicy
        });
    };
    /** Get a unique ID from the server via XHR and initialize with it. */ $067535f02cda23a2$export$2c4e825dc9120f87.prototype.retrieveId = function() {
        return $067535f02cda23a2$var$__awaiter(this, void 0, Promise, function() {
            var response, error_1, pathError;
            return $067535f02cda23a2$var$__generator(this, function(_a) {
                switch(_a.label){
                    case 0:
                        _a.trys.push([
                            0,
                            2,
                            ,
                            3
                        ]);
                        return [
                            4 /*yield*/ ,
                            this._buildRequest("id")
                        ];
                    case 1:
                        response = _a.sent();
                        if (response.status !== 200) throw new Error("Error. Status:".concat(response.status));
                        return [
                            2 /*return*/ ,
                            response.text()
                        ];
                    case 2:
                        error_1 = _a.sent();
                        $c25b565240b6a41d$exports.default.error("Error retrieving ID", error_1);
                        pathError = "";
                        if (this._options.path === "/" && this._options.host !== $6c02be62bb157391$export$7debb50ef11d5e0b.CLOUD_HOST) pathError = " If you passed in a `path` to your self-hosted PeerServer, you'll also need to pass in that same path when creating a new Peer.";
                        throw new Error("Could not get an ID from the server." + pathError);
                    case 3:
                        return [
                            2 /*return*/ 
                        ];
                }
            });
        });
    };
    /** @deprecated */ $067535f02cda23a2$export$2c4e825dc9120f87.prototype.listAllPeers = function() {
        return $067535f02cda23a2$var$__awaiter(this, void 0, Promise, function() {
            var response, helpfulError, error_2;
            return $067535f02cda23a2$var$__generator(this, function(_a) {
                switch(_a.label){
                    case 0:
                        _a.trys.push([
                            0,
                            2,
                            ,
                            3
                        ]);
                        return [
                            4 /*yield*/ ,
                            this._buildRequest("peers")
                        ];
                    case 1:
                        response = _a.sent();
                        if (response.status !== 200) {
                            if (response.status === 401) {
                                helpfulError = "";
                                if (this._options.host === $6c02be62bb157391$export$7debb50ef11d5e0b.CLOUD_HOST) helpfulError = "It looks like you're using the cloud server. You can email team@peerjs.com to enable peer listing for your API key.";
                                else helpfulError = "You need to enable `allow_discovery` on your self-hosted PeerServer to use this feature.";
                                throw new Error("It doesn't look like you have permission to list peers IDs. " + helpfulError);
                            }
                            throw new Error("Error. Status:".concat(response.status));
                        }
                        return [
                            2 /*return*/ ,
                            response.json()
                        ];
                    case 2:
                        error_2 = _a.sent();
                        $c25b565240b6a41d$exports.default.error("Error retrieving list peers", error_2);
                        throw new Error("Could not get list peers from the server." + error_2);
                    case 3:
                        return [
                            2 /*return*/ 
                        ];
                }
            });
        });
    };
    return $067535f02cda23a2$export$2c4e825dc9120f87;
}();


var $976f9b679211b81e$var$__extends = undefined && undefined.__extends || function() {
    var extendStatics = function(d1, b1) {
        extendStatics = Object.setPrototypeOf || ({
            __proto__: []
        }) instanceof Array && function(d, b) {
            d.__proto__ = b;
        } || function(d, b) {
            for(var p in b)if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p];
        };
        return extendStatics(d1, b1);
    };
    return function(d, b) {
        if (typeof b !== "function" && b !== null) throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() {
            this.constructor = d;
        }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
}();
var $976f9b679211b81e$var$__assign = undefined && undefined.__assign || function() {
    $976f9b679211b81e$var$__assign = Object.assign || function(t) {
        for(var s, i = 1, n = arguments.length; i < n; i++){
            s = arguments[i];
            for(var p in s)if (Object.prototype.hasOwnProperty.call(s, p)) t[p] = s[p];
        }
        return t;
    };
    return $976f9b679211b81e$var$__assign.apply(this, arguments);
};
var $976f9b679211b81e$var$__values = undefined && undefined.__values || function(o) {
    var s = typeof Symbol === "function" && Symbol.iterator, m = s && o[s], i = 0;
    if (m) return m.call(o);
    if (o && typeof o.length === "number") return {
        next: function() {
            if (o && i >= o.length) o = void 0;
            return {
                value: o && o[i++],
                done: !o
            };
        }
    };
    throw new TypeError(s ? "Object is not iterable." : "Symbol.iterator is not defined.");
};
var $976f9b679211b81e$var$__read = undefined && undefined.__read || function(o, n) {
    var m = typeof Symbol === "function" && o[Symbol.iterator];
    if (!m) return o;
    var i = m.call(o), r, ar = [], e;
    try {
        while((n === void 0 || n-- > 0) && !(r = i.next()).done)ar.push(r.value);
    } catch (error) {
        e = {
            error: error
        };
    } finally{
        try {
            if (r && !r.done && (m = i["return"])) m.call(i);
        } finally{
            if (e) throw e.error;
        }
    }
    return ar;
};
var $976f9b679211b81e$var$PeerOptions = /** @class */ function() {
    function PeerOptions() {}
    return PeerOptions;
}();
/**
 * A peer who can initiate connections with other peers.
 */ var $976f9b679211b81e$export$ecd1fc136c422448 = /** @class */ function(_super) {
    $976f9b679211b81e$var$__extends($976f9b679211b81e$export$ecd1fc136c422448, _super);
    function $976f9b679211b81e$export$ecd1fc136c422448(id1, options) {
        var _this = _super.call(this) || this;
        _this._id = null;
        _this._lastServerId = null;
        // States.
        _this._destroyed = false; // Connections have been killed
        _this._disconnected = false; // Connection to PeerServer killed but P2P connections still active
        _this._open = false; // Sockets and such are not yet open.
        _this._connections = new Map(); // All connections for this peer.
        _this._lostMessages = new Map(); // src => [list of messages]
        var userId;
        // Deal with overloading
        if (id1 && id1.constructor == Object) options = id1;
        else if (id1) userId = id1.toString();
        // Configurize options
        options = $976f9b679211b81e$var$__assign({
            debug: 0,
            host: $6c02be62bb157391$export$7debb50ef11d5e0b.CLOUD_HOST,
            port: $6c02be62bb157391$export$7debb50ef11d5e0b.CLOUD_PORT,
            path: "/",
            key: $976f9b679211b81e$export$ecd1fc136c422448.DEFAULT_KEY,
            token: $6c02be62bb157391$export$7debb50ef11d5e0b.randomToken(),
            config: $6c02be62bb157391$export$7debb50ef11d5e0b.defaultConfig,
            referrerPolicy: "strict-origin-when-cross-origin"
        }, options);
        _this._options = options;
        // Detect relative URL host.
        if (_this._options.host === "/") _this._options.host = window.location.hostname;
        // Set path correctly.
        if (_this._options.path) {
            if (_this._options.path[0] !== "/") _this._options.path = "/" + _this._options.path;
            if (_this._options.path[_this._options.path.length - 1] !== "/") _this._options.path += "/";
        }
        // Set whether we use SSL to same as current host
        if (_this._options.secure === undefined && _this._options.host !== $6c02be62bb157391$export$7debb50ef11d5e0b.CLOUD_HOST) _this._options.secure = $6c02be62bb157391$export$7debb50ef11d5e0b.isSecure();
        else if (_this._options.host == $6c02be62bb157391$export$7debb50ef11d5e0b.CLOUD_HOST) _this._options.secure = true;
        // Set a custom log function if present
        if (_this._options.logFunction) $c25b565240b6a41d$exports.default.setLogFunction(_this._options.logFunction);
        $c25b565240b6a41d$exports.default.logLevel = _this._options.debug || 0;
        _this._api = new $067535f02cda23a2$exports.API(options);
        _this._socket = _this._createServerConnection();
        // Sanity checks
        // Ensure WebRTC supported
        if (!$6c02be62bb157391$export$7debb50ef11d5e0b.supports.audioVideo && !$6c02be62bb157391$export$7debb50ef11d5e0b.supports.data) {
            _this._delayedAbort($2f2cc37b22a0b29a$export$9547aaa2e39030ff.BrowserIncompatible, "The current browser does not support WebRTC");
            return _this;
        }
        // Ensure alphanumeric id
        if (!!userId && !$6c02be62bb157391$export$7debb50ef11d5e0b.validateId(userId)) {
            _this._delayedAbort($2f2cc37b22a0b29a$export$9547aaa2e39030ff.InvalidID, "ID \"".concat(userId, "\" is invalid"));
            return _this;
        }
        if (userId) _this._initialize(userId);
        else _this._api.retrieveId().then(function(id) {
            return _this._initialize(id);
        }).catch(function(error) {
            return _this._abort($2f2cc37b22a0b29a$export$9547aaa2e39030ff.ServerError, error);
        });
        return _this;
    }
    Object.defineProperty($976f9b679211b81e$export$ecd1fc136c422448.prototype, "id", {
        /**
         * The brokering ID of this peer
         */ get: function() {
            return this._id;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty($976f9b679211b81e$export$ecd1fc136c422448.prototype, "options", {
        get: function() {
            return this._options;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty($976f9b679211b81e$export$ecd1fc136c422448.prototype, "open", {
        get: function() {
            return this._open;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty($976f9b679211b81e$export$ecd1fc136c422448.prototype, "socket", {
        get: function() {
            return this._socket;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty($976f9b679211b81e$export$ecd1fc136c422448.prototype, "connections", {
        /**
         * A hash of all connections associated with this peer, keyed by the remote peer's ID.
         * @deprecated
         * Return type will change from Object to Map<string,[]>
         */ get: function() {
            var e_1, _a;
            var plainConnections = Object.create(null);
            try {
                for(var _b = $976f9b679211b81e$var$__values(this._connections), _c = _b.next(); !_c.done; _c = _b.next()){
                    var _d = $976f9b679211b81e$var$__read(_c.value, 2), k = _d[0], v = _d[1];
                    plainConnections[k] = v;
                }
            } catch (e_1_1) {
                e_1 = {
                    error: e_1_1
                };
            } finally{
                try {
                    if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
                } finally{
                    if (e_1) throw e_1.error;
                }
            }
            return plainConnections;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty($976f9b679211b81e$export$ecd1fc136c422448.prototype, "destroyed", {
        /**
         * true if this peer and all of its connections can no longer be used.
         */ get: function() {
            return this._destroyed;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty($976f9b679211b81e$export$ecd1fc136c422448.prototype, "disconnected", {
        /**
         * false if there is an active connection to the PeerServer.
         */ get: function() {
            return this._disconnected;
        },
        enumerable: false,
        configurable: true
    });
    $976f9b679211b81e$export$ecd1fc136c422448.prototype._createServerConnection = function() {
        var _this = this;
        var socket = new $a86db8d850e55bcf$exports.Socket(this._options.secure, this._options.host, this._options.port, this._options.path, this._options.key, this._options.pingInterval);
        socket.on($2f2cc37b22a0b29a$export$3b5c4a4b6354f023.Message, function(data) {
            _this._handleMessage(data);
        });
        socket.on($2f2cc37b22a0b29a$export$3b5c4a4b6354f023.Error, function(error) {
            _this._abort($2f2cc37b22a0b29a$export$9547aaa2e39030ff.SocketError, error);
        });
        socket.on($2f2cc37b22a0b29a$export$3b5c4a4b6354f023.Disconnected, function() {
            if (_this.disconnected) return;
            _this.emitError($2f2cc37b22a0b29a$export$9547aaa2e39030ff.Network, "Lost connection to server.");
            _this.disconnect();
        });
        socket.on($2f2cc37b22a0b29a$export$3b5c4a4b6354f023.Close, function() {
            if (_this.disconnected) return;
            _this._abort($2f2cc37b22a0b29a$export$9547aaa2e39030ff.SocketClosed, "Underlying socket is already closed.");
        });
        return socket;
    };
    /** Initialize a connection with the server. */ $976f9b679211b81e$export$ecd1fc136c422448.prototype._initialize = function(id) {
        this._id = id;
        this.socket.start(id, this._options.token);
    };
    /** Handles messages from the server. */ $976f9b679211b81e$export$ecd1fc136c422448.prototype._handleMessage = function(message) {
        var e_2, _a;
        var type = message.type;
        var payload = message.payload;
        var peerId = message.src;
        switch(type){
            case $2f2cc37b22a0b29a$export$adb4a1754da6f10d.Open:
                this._lastServerId = this.id;
                this._open = true;
                this.emit("open", this.id);
                break;
            case $2f2cc37b22a0b29a$export$adb4a1754da6f10d.Error:
                this._abort($2f2cc37b22a0b29a$export$9547aaa2e39030ff.ServerError, payload.msg);
                break;
            case $2f2cc37b22a0b29a$export$adb4a1754da6f10d.IdTaken:
                this._abort($2f2cc37b22a0b29a$export$9547aaa2e39030ff.UnavailableID, "ID \"".concat(this.id, "\" is taken"));
                break;
            case $2f2cc37b22a0b29a$export$adb4a1754da6f10d.InvalidKey:
                this._abort($2f2cc37b22a0b29a$export$9547aaa2e39030ff.InvalidKey, "API KEY \"".concat(this._options.key, "\" is invalid"));
                break;
            case $2f2cc37b22a0b29a$export$adb4a1754da6f10d.Leave:
                $c25b565240b6a41d$exports.default.log("Received leave message from ".concat(peerId));
                this._cleanupPeer(peerId);
                this._connections.delete(peerId);
                break;
            case $2f2cc37b22a0b29a$export$adb4a1754da6f10d.Expire:
                this.emitError($2f2cc37b22a0b29a$export$9547aaa2e39030ff.PeerUnavailable, "Could not connect to peer ".concat(peerId));
                break;
            case $2f2cc37b22a0b29a$export$adb4a1754da6f10d.Offer:
                // we should consider switching this to CALL/CONNECT, but this is the least breaking option.
                var connectionId = payload.connectionId;
                var connection = this.getConnection(peerId, connectionId);
                if (connection) {
                    connection.close();
                    $c25b565240b6a41d$exports.default.warn("Offer received for existing Connection ID:".concat(connectionId));
                }
                // Create a new connection.
                if (payload.type === $2f2cc37b22a0b29a$export$3157d57b4135e3bc.Media) {
                    var mediaConnection = new $9b5cc8dbdd0aa809$exports.MediaConnection(peerId, this, {
                        connectionId: connectionId,
                        _payload: payload,
                        metadata: payload.metadata
                    });
                    connection = mediaConnection;
                    this._addConnection(peerId, connection);
                    this.emit("call", mediaConnection);
                } else if (payload.type === $2f2cc37b22a0b29a$export$3157d57b4135e3bc.Data) {
                    var dataConnection = new $92db9a3ba21db2a0$exports.DataConnection(peerId, this, {
                        connectionId: connectionId,
                        _payload: payload,
                        metadata: payload.metadata,
                        label: payload.label,
                        serialization: payload.serialization,
                        reliable: payload.reliable
                    });
                    connection = dataConnection;
                    this._addConnection(peerId, connection);
                    this.emit("connection", dataConnection);
                } else {
                    $c25b565240b6a41d$exports.default.warn("Received malformed connection type:".concat(payload.type));
                    return;
                }
                // Find messages.
                var messages = this._getMessages(connectionId);
                try {
                    for(var messages_1 = $976f9b679211b81e$var$__values(messages), messages_1_1 = messages_1.next(); !messages_1_1.done; messages_1_1 = messages_1.next()){
                        var message_1 = messages_1_1.value;
                        connection.handleMessage(message_1);
                    }
                } catch (e_2_1) {
                    e_2 = {
                        error: e_2_1
                    };
                } finally{
                    try {
                        if (messages_1_1 && !messages_1_1.done && (_a = messages_1.return)) _a.call(messages_1);
                    } finally{
                        if (e_2) throw e_2.error;
                    }
                }
                break;
            default:
                if (!payload) {
                    $c25b565240b6a41d$exports.default.warn("You received a malformed message from ".concat(peerId, " of type ").concat(type));
                    return;
                }
                var connectionId = payload.connectionId;
                var connection = this.getConnection(peerId, connectionId);
                if (connection && connection.peerConnection) // Pass it on.
                connection.handleMessage(message);
                else if (connectionId) // Store for possible later use
                this._storeMessage(connectionId, message);
                else $c25b565240b6a41d$exports.default.warn("You received an unrecognized message:", message);
                break;
        }
    };
    /** Stores messages without a set up connection, to be claimed later. */ $976f9b679211b81e$export$ecd1fc136c422448.prototype._storeMessage = function(connectionId, message) {
        if (!this._lostMessages.has(connectionId)) this._lostMessages.set(connectionId, []);
        this._lostMessages.get(connectionId).push(message);
    };
    /** Retrieve messages from lost message store */ //TODO Change it to private
    $976f9b679211b81e$export$ecd1fc136c422448.prototype._getMessages = function(connectionId) {
        var messages = this._lostMessages.get(connectionId);
        if (messages) {
            this._lostMessages.delete(connectionId);
            return messages;
        }
        return [];
    };
    /**
     * Connects to the remote peer specified by id and returns a data connection.
     * @param peer The brokering ID of the remote peer (their peer.id).
     * @param options for specifying details about Peer Connection
     */ $976f9b679211b81e$export$ecd1fc136c422448.prototype.connect = function(peer, options) {
        if (options === void 0) options = {};
        if (this.disconnected) {
            $c25b565240b6a41d$exports.default.warn("You cannot connect to a new Peer because you called .disconnect() on this Peer and ended your connection with the server. You can create a new Peer to reconnect, or call reconnect on this peer if you believe its ID to still be available.");
            this.emitError($2f2cc37b22a0b29a$export$9547aaa2e39030ff.Disconnected, "Cannot connect to new Peer after disconnecting from server.");
            return;
        }
        var dataConnection = new $92db9a3ba21db2a0$exports.DataConnection(peer, this, options);
        this._addConnection(peer, dataConnection);
        return dataConnection;
    };
    /**
     * Calls the remote peer specified by id and returns a media connection.
     * @param peer The brokering ID of the remote peer (their peer.id).
     * @param stream The caller's media stream
     * @param options Metadata associated with the connection, passed in by whoever initiated the connection.
     */ $976f9b679211b81e$export$ecd1fc136c422448.prototype.call = function(peer, stream, options) {
        if (options === void 0) options = {};
        if (this.disconnected) {
            $c25b565240b6a41d$exports.default.warn("You cannot connect to a new Peer because you called .disconnect() on this Peer and ended your connection with the server. You can create a new Peer to reconnect.");
            this.emitError($2f2cc37b22a0b29a$export$9547aaa2e39030ff.Disconnected, "Cannot connect to new Peer after disconnecting from server.");
            return;
        }
        if (!stream) {
            $c25b565240b6a41d$exports.default.error("To call a peer, you must provide a stream from your browser's `getUserMedia`.");
            return;
        }
        var mediaConnection = new $9b5cc8dbdd0aa809$exports.MediaConnection(peer, this, $976f9b679211b81e$var$__assign($976f9b679211b81e$var$__assign({}, options), {
            _stream: stream
        }));
        this._addConnection(peer, mediaConnection);
        return mediaConnection;
    };
    /** Add a data/media connection to this peer. */ $976f9b679211b81e$export$ecd1fc136c422448.prototype._addConnection = function(peerId, connection) {
        $c25b565240b6a41d$exports.default.log("add connection ".concat(connection.type, ":").concat(connection.connectionId, " to peerId:").concat(peerId));
        if (!this._connections.has(peerId)) this._connections.set(peerId, []);
        this._connections.get(peerId).push(connection);
    };
    //TODO should be private
    $976f9b679211b81e$export$ecd1fc136c422448.prototype._removeConnection = function(connection) {
        var connections = this._connections.get(connection.peer);
        if (connections) {
            var index = connections.indexOf(connection);
            if (index !== -1) connections.splice(index, 1);
        }
        //remove from lost messages
        this._lostMessages.delete(connection.connectionId);
    };
    /** Retrieve a data/media connection for this peer. */ $976f9b679211b81e$export$ecd1fc136c422448.prototype.getConnection = function(peerId, connectionId) {
        var e_3, _a;
        var connections = this._connections.get(peerId);
        if (!connections) return null;
        try {
            for(var connections_1 = $976f9b679211b81e$var$__values(connections), connections_1_1 = connections_1.next(); !connections_1_1.done; connections_1_1 = connections_1.next()){
                var connection = connections_1_1.value;
                if (connection.connectionId === connectionId) return connection;
            }
        } catch (e_3_1) {
            e_3 = {
                error: e_3_1
            };
        } finally{
            try {
                if (connections_1_1 && !connections_1_1.done && (_a = connections_1.return)) _a.call(connections_1);
            } finally{
                if (e_3) throw e_3.error;
            }
        }
        return null;
    };
    $976f9b679211b81e$export$ecd1fc136c422448.prototype._delayedAbort = function(type, message) {
        var _this = this;
        setTimeout(function() {
            _this._abort(type, message);
        }, 0);
    };
    /**
     * Emits an error message and destroys the Peer.
     * The Peer is not destroyed if it's in a disconnected state, in which case
     * it retains its disconnected state and its existing connections.
     */ $976f9b679211b81e$export$ecd1fc136c422448.prototype._abort = function(type, message) {
        $c25b565240b6a41d$exports.default.error("Aborting!");
        this.emitError(type, message);
        if (!this._lastServerId) this.destroy();
        else this.disconnect();
    };
    /** Emits a typed error message. */ $976f9b679211b81e$export$ecd1fc136c422448.prototype.emitError = function(type, err) {
        $c25b565240b6a41d$exports.default.error("Error:", err);
        var error;
        if (typeof err === "string") error = new Error(err);
        else error = err;
        error.type = type;
        this.emit("error", error);
    };
    /**
     * Destroys the Peer: closes all active connections as well as the connection
     *  to the server.
     * Warning: The peer can no longer create or accept connections after being
     *  destroyed.
     */ $976f9b679211b81e$export$ecd1fc136c422448.prototype.destroy = function() {
        if (this.destroyed) return;
        $c25b565240b6a41d$exports.default.log("Destroy peer with ID:".concat(this.id));
        this.disconnect();
        this._cleanup();
        this._destroyed = true;
        this.emit("close");
    };
    /** Disconnects every connection on this peer. */ $976f9b679211b81e$export$ecd1fc136c422448.prototype._cleanup = function() {
        var e_4, _a;
        try {
            for(var _b = $976f9b679211b81e$var$__values(this._connections.keys()), _c = _b.next(); !_c.done; _c = _b.next()){
                var peerId = _c.value;
                this._cleanupPeer(peerId);
                this._connections.delete(peerId);
            }
        } catch (e_4_1) {
            e_4 = {
                error: e_4_1
            };
        } finally{
            try {
                if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
            } finally{
                if (e_4) throw e_4.error;
            }
        }
        this.socket.removeAllListeners();
    };
    /** Closes all connections to this peer. */ $976f9b679211b81e$export$ecd1fc136c422448.prototype._cleanupPeer = function(peerId) {
        var e_5, _a;
        var connections = this._connections.get(peerId);
        if (!connections) return;
        try {
            for(var connections_2 = $976f9b679211b81e$var$__values(connections), connections_2_1 = connections_2.next(); !connections_2_1.done; connections_2_1 = connections_2.next()){
                var connection = connections_2_1.value;
                connection.close();
            }
        } catch (e_5_1) {
            e_5 = {
                error: e_5_1
            };
        } finally{
            try {
                if (connections_2_1 && !connections_2_1.done && (_a = connections_2.return)) _a.call(connections_2);
            } finally{
                if (e_5) throw e_5.error;
            }
        }
    };
    /**
     * Disconnects the Peer's connection to the PeerServer. Does not close any
     *  active connections.
     * Warning: The peer can no longer create or accept connections after being
     *  disconnected. It also cannot reconnect to the server.
     */ $976f9b679211b81e$export$ecd1fc136c422448.prototype.disconnect = function() {
        if (this.disconnected) return;
        var currentId = this.id;
        $c25b565240b6a41d$exports.default.log("Disconnect peer with ID:".concat(currentId));
        this._disconnected = true;
        this._open = false;
        this.socket.close();
        this._lastServerId = currentId;
        this._id = null;
        this.emit("disconnected", currentId);
    };
    /** Attempts to reconnect with the same ID. */ $976f9b679211b81e$export$ecd1fc136c422448.prototype.reconnect = function() {
        if (this.disconnected && !this.destroyed) {
            $c25b565240b6a41d$exports.default.log("Attempting reconnection to server with ID ".concat(this._lastServerId));
            this._disconnected = false;
            this._initialize(this._lastServerId);
        } else if (this.destroyed) throw new Error("This peer cannot reconnect to the server. It has already been destroyed.");
        else if (!this.disconnected && !this.open) // Do nothing. We're still connecting the first time.
        $c25b565240b6a41d$exports.default.error("In a hurry? We're still trying to make the initial connection!");
        else throw new Error("Peer ".concat(this.id, " cannot reconnect because it is not disconnected from the server!"));
    };
    /**
     * Get a list of available peer IDs. If you're running your own server, you'll
     * want to set allow_discovery: true in the PeerServer options. If you're using
     * the cloud server, email team@peerjs.com to get the functionality enabled for
     * your key.
     */ $976f9b679211b81e$export$ecd1fc136c422448.prototype.listAllPeers = function(cb) {
        var _this = this;
        if (cb === void 0) cb = function(_) {};
        this._api.listAllPeers().then(function(peers) {
            return cb(peers);
        }).catch(function(error) {
            return _this._abort($2f2cc37b22a0b29a$export$9547aaa2e39030ff.ServerError, error);
        });
    };
    $976f9b679211b81e$export$ecd1fc136c422448.DEFAULT_KEY = "peerjs";
    return $976f9b679211b81e$export$ecd1fc136c422448;
}($TdzfH$eventemitter3.EventEmitter);


var $f1d1a6b5c376b066$export$2e2bcd8739ae039 = $976f9b679211b81e$exports.Peer;




},{"eventemitter3":22,"peerjs-js-binarypack":29,"webrtc-adapter":44}],32:[function(require,module,exports){
// shim for using process in browser
var process = module.exports = {};

// cached from whatever global is present so that test runners that stub it
// don't break things.  But we need to wrap it in a try catch in case it is
// wrapped in strict mode code which doesn't define any globals.  It's inside a
// function because try/catches deoptimize in certain engines.

var cachedSetTimeout;
var cachedClearTimeout;

function defaultSetTimout() {
    throw new Error('setTimeout has not been defined');
}
function defaultClearTimeout () {
    throw new Error('clearTimeout has not been defined');
}
(function () {
    try {
        if (typeof setTimeout === 'function') {
            cachedSetTimeout = setTimeout;
        } else {
            cachedSetTimeout = defaultSetTimout;
        }
    } catch (e) {
        cachedSetTimeout = defaultSetTimout;
    }
    try {
        if (typeof clearTimeout === 'function') {
            cachedClearTimeout = clearTimeout;
        } else {
            cachedClearTimeout = defaultClearTimeout;
        }
    } catch (e) {
        cachedClearTimeout = defaultClearTimeout;
    }
} ())
function runTimeout(fun) {
    if (cachedSetTimeout === setTimeout) {
        //normal enviroments in sane situations
        return setTimeout(fun, 0);
    }
    // if setTimeout wasn't available but was latter defined
    if ((cachedSetTimeout === defaultSetTimout || !cachedSetTimeout) && setTimeout) {
        cachedSetTimeout = setTimeout;
        return setTimeout(fun, 0);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedSetTimeout(fun, 0);
    } catch(e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't trust the global object when called normally
            return cachedSetTimeout.call(null, fun, 0);
        } catch(e){
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error
            return cachedSetTimeout.call(this, fun, 0);
        }
    }


}
function runClearTimeout(marker) {
    if (cachedClearTimeout === clearTimeout) {
        //normal enviroments in sane situations
        return clearTimeout(marker);
    }
    // if clearTimeout wasn't available but was latter defined
    if ((cachedClearTimeout === defaultClearTimeout || !cachedClearTimeout) && clearTimeout) {
        cachedClearTimeout = clearTimeout;
        return clearTimeout(marker);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedClearTimeout(marker);
    } catch (e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't  trust the global object when called normally
            return cachedClearTimeout.call(null, marker);
        } catch (e){
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error.
            // Some versions of I.E. have different rules for clearTimeout vs setTimeout
            return cachedClearTimeout.call(this, marker);
        }
    }



}
var queue = [];
var draining = false;
var currentQueue;
var queueIndex = -1;

function cleanUpNextTick() {
    if (!draining || !currentQueue) {
        return;
    }
    draining = false;
    if (currentQueue.length) {
        queue = currentQueue.concat(queue);
    } else {
        queueIndex = -1;
    }
    if (queue.length) {
        drainQueue();
    }
}

function drainQueue() {
    if (draining) {
        return;
    }
    var timeout = runTimeout(cleanUpNextTick);
    draining = true;

    var len = queue.length;
    while(len) {
        currentQueue = queue;
        queue = [];
        while (++queueIndex < len) {
            if (currentQueue) {
                currentQueue[queueIndex].run();
            }
        }
        queueIndex = -1;
        len = queue.length;
    }
    currentQueue = null;
    draining = false;
    runClearTimeout(timeout);
}

process.nextTick = function (fun) {
    var args = new Array(arguments.length - 1);
    if (arguments.length > 1) {
        for (var i = 1; i < arguments.length; i++) {
            args[i - 1] = arguments[i];
        }
    }
    queue.push(new Item(fun, args));
    if (queue.length === 1 && !draining) {
        runTimeout(drainQueue);
    }
};

// v8 likes predictible objects
function Item(fun, array) {
    this.fun = fun;
    this.array = array;
}
Item.prototype.run = function () {
    this.fun.apply(null, this.array);
};
process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];
process.version = ''; // empty string to avoid regexp issues
process.versions = {};

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;
process.prependListener = noop;
process.prependOnceListener = noop;

process.listeners = function (name) { return [] }

process.binding = function (name) {
    throw new Error('process.binding is not supported');
};

process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};
process.umask = function() { return 0; };

},{}],33:[function(require,module,exports){
(function (process){(function (){
'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var _objectSpread = require('@babel/runtime/helpers/objectSpread2');

function _interopDefaultLegacy (e) { return e && typeof e === 'object' && 'default' in e ? e : { 'default': e }; }

var _objectSpread__default = /*#__PURE__*/_interopDefaultLegacy(_objectSpread);

/**
 * Adapted from React: https://github.com/facebook/react/blob/master/packages/shared/formatProdErrorMessage.js
 *
 * Do not require this module directly! Use normal throw error calls. These messages will be replaced with error codes
 * during build.
 * @param {number} code
 */
function formatProdErrorMessage(code) {
  return "Minified Redux error #" + code + "; visit https://redux.js.org/Errors?code=" + code + " for the full message or " + 'use the non-minified dev environment for full errors. ';
}

// Inlined version of the `symbol-observable` polyfill
var $$observable = (function () {
  return typeof Symbol === 'function' && Symbol.observable || '@@observable';
})();

/**
 * These are private action types reserved by Redux.
 * For any unknown actions, you must return the current state.
 * If the current state is undefined, you must return the initial state.
 * Do not reference these action types directly in your code.
 */
var randomString = function randomString() {
  return Math.random().toString(36).substring(7).split('').join('.');
};

var ActionTypes = {
  INIT: "@@redux/INIT" + randomString(),
  REPLACE: "@@redux/REPLACE" + randomString(),
  PROBE_UNKNOWN_ACTION: function PROBE_UNKNOWN_ACTION() {
    return "@@redux/PROBE_UNKNOWN_ACTION" + randomString();
  }
};

/**
 * @param {any} obj The object to inspect.
 * @returns {boolean} True if the argument appears to be a plain object.
 */
function isPlainObject(obj) {
  if (typeof obj !== 'object' || obj === null) return false;
  var proto = obj;

  while (Object.getPrototypeOf(proto) !== null) {
    proto = Object.getPrototypeOf(proto);
  }

  return Object.getPrototypeOf(obj) === proto;
}

// Inlined / shortened version of `kindOf` from https://github.com/jonschlinkert/kind-of
function miniKindOf(val) {
  if (val === void 0) return 'undefined';
  if (val === null) return 'null';
  var type = typeof val;

  switch (type) {
    case 'boolean':
    case 'string':
    case 'number':
    case 'symbol':
    case 'function':
      {
        return type;
      }
  }

  if (Array.isArray(val)) return 'array';
  if (isDate(val)) return 'date';
  if (isError(val)) return 'error';
  var constructorName = ctorName(val);

  switch (constructorName) {
    case 'Symbol':
    case 'Promise':
    case 'WeakMap':
    case 'WeakSet':
    case 'Map':
    case 'Set':
      return constructorName;
  } // other


  return type.slice(8, -1).toLowerCase().replace(/\s/g, '');
}

function ctorName(val) {
  return typeof val.constructor === 'function' ? val.constructor.name : null;
}

function isError(val) {
  return val instanceof Error || typeof val.message === 'string' && val.constructor && typeof val.constructor.stackTraceLimit === 'number';
}

function isDate(val) {
  if (val instanceof Date) return true;
  return typeof val.toDateString === 'function' && typeof val.getDate === 'function' && typeof val.setDate === 'function';
}

function kindOf(val) {
  var typeOfVal = typeof val;

  if (process.env.NODE_ENV !== 'production') {
    typeOfVal = miniKindOf(val);
  }

  return typeOfVal;
}

/**
 * @deprecated
 *
 * **We recommend using the `configureStore` method
 * of the `@reduxjs/toolkit` package**, which replaces `createStore`.
 *
 * Redux Toolkit is our recommended approach for writing Redux logic today,
 * including store setup, reducers, data fetching, and more.
 *
 * **For more details, please read this Redux docs page:**
 * **https://redux.js.org/introduction/why-rtk-is-redux-today**
 *
 * `configureStore` from Redux Toolkit is an improved version of `createStore` that
 * simplifies setup and helps avoid common bugs.
 *
 * You should not be using the `redux` core package by itself today, except for learning purposes.
 * The `createStore` method from the core `redux` package will not be removed, but we encourage
 * all users to migrate to using Redux Toolkit for all Redux code.
 *
 * If you want to use `createStore` without this visual deprecation warning, use
 * the `legacy_createStore` import instead:
 *
 * `import { legacy_createStore as createStore} from 'redux'`
 *
 */

function createStore(reducer, preloadedState, enhancer) {
  var _ref2;

  if (typeof preloadedState === 'function' && typeof enhancer === 'function' || typeof enhancer === 'function' && typeof arguments[3] === 'function') {
    throw new Error(process.env.NODE_ENV === "production" ? formatProdErrorMessage(0) : 'It looks like you are passing several store enhancers to ' + 'createStore(). This is not supported. Instead, compose them ' + 'together to a single function. See https://redux.js.org/tutorials/fundamentals/part-4-store#creating-a-store-with-enhancers for an example.');
  }

  if (typeof preloadedState === 'function' && typeof enhancer === 'undefined') {
    enhancer = preloadedState;
    preloadedState = undefined;
  }

  if (typeof enhancer !== 'undefined') {
    if (typeof enhancer !== 'function') {
      throw new Error(process.env.NODE_ENV === "production" ? formatProdErrorMessage(1) : "Expected the enhancer to be a function. Instead, received: '" + kindOf(enhancer) + "'");
    }

    return enhancer(createStore)(reducer, preloadedState);
  }

  if (typeof reducer !== 'function') {
    throw new Error(process.env.NODE_ENV === "production" ? formatProdErrorMessage(2) : "Expected the root reducer to be a function. Instead, received: '" + kindOf(reducer) + "'");
  }

  var currentReducer = reducer;
  var currentState = preloadedState;
  var currentListeners = [];
  var nextListeners = currentListeners;
  var isDispatching = false;
  /**
   * This makes a shallow copy of currentListeners so we can use
   * nextListeners as a temporary list while dispatching.
   *
   * This prevents any bugs around consumers calling
   * subscribe/unsubscribe in the middle of a dispatch.
   */

  function ensureCanMutateNextListeners() {
    if (nextListeners === currentListeners) {
      nextListeners = currentListeners.slice();
    }
  }
  /**
   * Reads the state tree managed by the store.
   *
   * @returns {any} The current state tree of your application.
   */


  function getState() {
    if (isDispatching) {
      throw new Error(process.env.NODE_ENV === "production" ? formatProdErrorMessage(3) : 'You may not call store.getState() while the reducer is executing. ' + 'The reducer has already received the state as an argument. ' + 'Pass it down from the top reducer instead of reading it from the store.');
    }

    return currentState;
  }
  /**
   * Adds a change listener. It will be called any time an action is dispatched,
   * and some part of the state tree may potentially have changed. You may then
   * call `getState()` to read the current state tree inside the callback.
   *
   * You may call `dispatch()` from a change listener, with the following
   * caveats:
   *
   * 1. The subscriptions are snapshotted just before every `dispatch()` call.
   * If you subscribe or unsubscribe while the listeners are being invoked, this
   * will not have any effect on the `dispatch()` that is currently in progress.
   * However, the next `dispatch()` call, whether nested or not, will use a more
   * recent snapshot of the subscription list.
   *
   * 2. The listener should not expect to see all state changes, as the state
   * might have been updated multiple times during a nested `dispatch()` before
   * the listener is called. It is, however, guaranteed that all subscribers
   * registered before the `dispatch()` started will be called with the latest
   * state by the time it exits.
   *
   * @param {Function} listener A callback to be invoked on every dispatch.
   * @returns {Function} A function to remove this change listener.
   */


  function subscribe(listener) {
    if (typeof listener !== 'function') {
      throw new Error(process.env.NODE_ENV === "production" ? formatProdErrorMessage(4) : "Expected the listener to be a function. Instead, received: '" + kindOf(listener) + "'");
    }

    if (isDispatching) {
      throw new Error(process.env.NODE_ENV === "production" ? formatProdErrorMessage(5) : 'You may not call store.subscribe() while the reducer is executing. ' + 'If you would like to be notified after the store has been updated, subscribe from a ' + 'component and invoke store.getState() in the callback to access the latest state. ' + 'See https://redux.js.org/api/store#subscribelistener for more details.');
    }

    var isSubscribed = true;
    ensureCanMutateNextListeners();
    nextListeners.push(listener);
    return function unsubscribe() {
      if (!isSubscribed) {
        return;
      }

      if (isDispatching) {
        throw new Error(process.env.NODE_ENV === "production" ? formatProdErrorMessage(6) : 'You may not unsubscribe from a store listener while the reducer is executing. ' + 'See https://redux.js.org/api/store#subscribelistener for more details.');
      }

      isSubscribed = false;
      ensureCanMutateNextListeners();
      var index = nextListeners.indexOf(listener);
      nextListeners.splice(index, 1);
      currentListeners = null;
    };
  }
  /**
   * Dispatches an action. It is the only way to trigger a state change.
   *
   * The `reducer` function, used to create the store, will be called with the
   * current state tree and the given `action`. Its return value will
   * be considered the **next** state of the tree, and the change listeners
   * will be notified.
   *
   * The base implementation only supports plain object actions. If you want to
   * dispatch a Promise, an Observable, a thunk, or something else, you need to
   * wrap your store creating function into the corresponding middleware. For
   * example, see the documentation for the `redux-thunk` package. Even the
   * middleware will eventually dispatch plain object actions using this method.
   *
   * @param {Object} action A plain object representing “what changed”. It is
   * a good idea to keep actions serializable so you can record and replay user
   * sessions, or use the time travelling `redux-devtools`. An action must have
   * a `type` property which may not be `undefined`. It is a good idea to use
   * string constants for action types.
   *
   * @returns {Object} For convenience, the same action object you dispatched.
   *
   * Note that, if you use a custom middleware, it may wrap `dispatch()` to
   * return something else (for example, a Promise you can await).
   */


  function dispatch(action) {
    if (!isPlainObject(action)) {
      throw new Error(process.env.NODE_ENV === "production" ? formatProdErrorMessage(7) : "Actions must be plain objects. Instead, the actual type was: '" + kindOf(action) + "'. You may need to add middleware to your store setup to handle dispatching other values, such as 'redux-thunk' to handle dispatching functions. See https://redux.js.org/tutorials/fundamentals/part-4-store#middleware and https://redux.js.org/tutorials/fundamentals/part-6-async-logic#using-the-redux-thunk-middleware for examples.");
    }

    if (typeof action.type === 'undefined') {
      throw new Error(process.env.NODE_ENV === "production" ? formatProdErrorMessage(8) : 'Actions may not have an undefined "type" property. You may have misspelled an action type string constant.');
    }

    if (isDispatching) {
      throw new Error(process.env.NODE_ENV === "production" ? formatProdErrorMessage(9) : 'Reducers may not dispatch actions.');
    }

    try {
      isDispatching = true;
      currentState = currentReducer(currentState, action);
    } finally {
      isDispatching = false;
    }

    var listeners = currentListeners = nextListeners;

    for (var i = 0; i < listeners.length; i++) {
      var listener = listeners[i];
      listener();
    }

    return action;
  }
  /**
   * Replaces the reducer currently used by the store to calculate the state.
   *
   * You might need this if your app implements code splitting and you want to
   * load some of the reducers dynamically. You might also need this if you
   * implement a hot reloading mechanism for Redux.
   *
   * @param {Function} nextReducer The reducer for the store to use instead.
   * @returns {void}
   */


  function replaceReducer(nextReducer) {
    if (typeof nextReducer !== 'function') {
      throw new Error(process.env.NODE_ENV === "production" ? formatProdErrorMessage(10) : "Expected the nextReducer to be a function. Instead, received: '" + kindOf(nextReducer));
    }

    currentReducer = nextReducer; // This action has a similiar effect to ActionTypes.INIT.
    // Any reducers that existed in both the new and old rootReducer
    // will receive the previous state. This effectively populates
    // the new state tree with any relevant data from the old one.

    dispatch({
      type: ActionTypes.REPLACE
    });
  }
  /**
   * Interoperability point for observable/reactive libraries.
   * @returns {observable} A minimal observable of state changes.
   * For more information, see the observable proposal:
   * https://github.com/tc39/proposal-observable
   */


  function observable() {
    var _ref;

    var outerSubscribe = subscribe;
    return _ref = {
      /**
       * The minimal observable subscription method.
       * @param {Object} observer Any object that can be used as an observer.
       * The observer object should have a `next` method.
       * @returns {subscription} An object with an `unsubscribe` method that can
       * be used to unsubscribe the observable from the store, and prevent further
       * emission of values from the observable.
       */
      subscribe: function subscribe(observer) {
        if (typeof observer !== 'object' || observer === null) {
          throw new Error(process.env.NODE_ENV === "production" ? formatProdErrorMessage(11) : "Expected the observer to be an object. Instead, received: '" + kindOf(observer) + "'");
        }

        function observeState() {
          if (observer.next) {
            observer.next(getState());
          }
        }

        observeState();
        var unsubscribe = outerSubscribe(observeState);
        return {
          unsubscribe: unsubscribe
        };
      }
    }, _ref[$$observable] = function () {
      return this;
    }, _ref;
  } // When a store is created, an "INIT" action is dispatched so that every
  // reducer returns their initial state. This effectively populates
  // the initial state tree.


  dispatch({
    type: ActionTypes.INIT
  });
  return _ref2 = {
    dispatch: dispatch,
    subscribe: subscribe,
    getState: getState,
    replaceReducer: replaceReducer
  }, _ref2[$$observable] = observable, _ref2;
}
/**
 * Creates a Redux store that holds the state tree.
 *
 * **We recommend using `configureStore` from the
 * `@reduxjs/toolkit` package**, which replaces `createStore`:
 * **https://redux.js.org/introduction/why-rtk-is-redux-today**
 *
 * The only way to change the data in the store is to call `dispatch()` on it.
 *
 * There should only be a single store in your app. To specify how different
 * parts of the state tree respond to actions, you may combine several reducers
 * into a single reducer function by using `combineReducers`.
 *
 * @param {Function} reducer A function that returns the next state tree, given
 * the current state tree and the action to handle.
 *
 * @param {any} [preloadedState] The initial state. You may optionally specify it
 * to hydrate the state from the server in universal apps, or to restore a
 * previously serialized user session.
 * If you use `combineReducers` to produce the root reducer function, this must be
 * an object with the same shape as `combineReducers` keys.
 *
 * @param {Function} [enhancer] The store enhancer. You may optionally specify it
 * to enhance the store with third-party capabilities such as middleware,
 * time travel, persistence, etc. The only store enhancer that ships with Redux
 * is `applyMiddleware()`.
 *
 * @returns {Store} A Redux store that lets you read the state, dispatch actions
 * and subscribe to changes.
 */

var legacy_createStore = createStore;

/**
 * Prints a warning in the console if it exists.
 *
 * @param {String} message The warning message.
 * @returns {void}
 */
function warning(message) {
  /* eslint-disable no-console */
  if (typeof console !== 'undefined' && typeof console.error === 'function') {
    console.error(message);
  }
  /* eslint-enable no-console */


  try {
    // This error was thrown as a convenience so that if you enable
    // "break on all exceptions" in your console,
    // it would pause the execution at this line.
    throw new Error(message);
  } catch (e) {} // eslint-disable-line no-empty

}

function getUnexpectedStateShapeWarningMessage(inputState, reducers, action, unexpectedKeyCache) {
  var reducerKeys = Object.keys(reducers);
  var argumentName = action && action.type === ActionTypes.INIT ? 'preloadedState argument passed to createStore' : 'previous state received by the reducer';

  if (reducerKeys.length === 0) {
    return 'Store does not have a valid reducer. Make sure the argument passed ' + 'to combineReducers is an object whose values are reducers.';
  }

  if (!isPlainObject(inputState)) {
    return "The " + argumentName + " has unexpected type of \"" + kindOf(inputState) + "\". Expected argument to be an object with the following " + ("keys: \"" + reducerKeys.join('", "') + "\"");
  }

  var unexpectedKeys = Object.keys(inputState).filter(function (key) {
    return !reducers.hasOwnProperty(key) && !unexpectedKeyCache[key];
  });
  unexpectedKeys.forEach(function (key) {
    unexpectedKeyCache[key] = true;
  });
  if (action && action.type === ActionTypes.REPLACE) return;

  if (unexpectedKeys.length > 0) {
    return "Unexpected " + (unexpectedKeys.length > 1 ? 'keys' : 'key') + " " + ("\"" + unexpectedKeys.join('", "') + "\" found in " + argumentName + ". ") + "Expected to find one of the known reducer keys instead: " + ("\"" + reducerKeys.join('", "') + "\". Unexpected keys will be ignored.");
  }
}

function assertReducerShape(reducers) {
  Object.keys(reducers).forEach(function (key) {
    var reducer = reducers[key];
    var initialState = reducer(undefined, {
      type: ActionTypes.INIT
    });

    if (typeof initialState === 'undefined') {
      throw new Error(process.env.NODE_ENV === "production" ? formatProdErrorMessage(12) : "The slice reducer for key \"" + key + "\" returned undefined during initialization. " + "If the state passed to the reducer is undefined, you must " + "explicitly return the initial state. The initial state may " + "not be undefined. If you don't want to set a value for this reducer, " + "you can use null instead of undefined.");
    }

    if (typeof reducer(undefined, {
      type: ActionTypes.PROBE_UNKNOWN_ACTION()
    }) === 'undefined') {
      throw new Error(process.env.NODE_ENV === "production" ? formatProdErrorMessage(13) : "The slice reducer for key \"" + key + "\" returned undefined when probed with a random type. " + ("Don't try to handle '" + ActionTypes.INIT + "' or other actions in \"redux/*\" ") + "namespace. They are considered private. Instead, you must return the " + "current state for any unknown actions, unless it is undefined, " + "in which case you must return the initial state, regardless of the " + "action type. The initial state may not be undefined, but can be null.");
    }
  });
}
/**
 * Turns an object whose values are different reducer functions, into a single
 * reducer function. It will call every child reducer, and gather their results
 * into a single state object, whose keys correspond to the keys of the passed
 * reducer functions.
 *
 * @param {Object} reducers An object whose values correspond to different
 * reducer functions that need to be combined into one. One handy way to obtain
 * it is to use ES6 `import * as reducers` syntax. The reducers may never return
 * undefined for any action. Instead, they should return their initial state
 * if the state passed to them was undefined, and the current state for any
 * unrecognized action.
 *
 * @returns {Function} A reducer function that invokes every reducer inside the
 * passed object, and builds a state object with the same shape.
 */


function combineReducers(reducers) {
  var reducerKeys = Object.keys(reducers);
  var finalReducers = {};

  for (var i = 0; i < reducerKeys.length; i++) {
    var key = reducerKeys[i];

    if (process.env.NODE_ENV !== 'production') {
      if (typeof reducers[key] === 'undefined') {
        warning("No reducer provided for key \"" + key + "\"");
      }
    }

    if (typeof reducers[key] === 'function') {
      finalReducers[key] = reducers[key];
    }
  }

  var finalReducerKeys = Object.keys(finalReducers); // This is used to make sure we don't warn about the same
  // keys multiple times.

  var unexpectedKeyCache;

  if (process.env.NODE_ENV !== 'production') {
    unexpectedKeyCache = {};
  }

  var shapeAssertionError;

  try {
    assertReducerShape(finalReducers);
  } catch (e) {
    shapeAssertionError = e;
  }

  return function combination(state, action) {
    if (state === void 0) {
      state = {};
    }

    if (shapeAssertionError) {
      throw shapeAssertionError;
    }

    if (process.env.NODE_ENV !== 'production') {
      var warningMessage = getUnexpectedStateShapeWarningMessage(state, finalReducers, action, unexpectedKeyCache);

      if (warningMessage) {
        warning(warningMessage);
      }
    }

    var hasChanged = false;
    var nextState = {};

    for (var _i = 0; _i < finalReducerKeys.length; _i++) {
      var _key = finalReducerKeys[_i];
      var reducer = finalReducers[_key];
      var previousStateForKey = state[_key];
      var nextStateForKey = reducer(previousStateForKey, action);

      if (typeof nextStateForKey === 'undefined') {
        var actionType = action && action.type;
        throw new Error(process.env.NODE_ENV === "production" ? formatProdErrorMessage(14) : "When called with an action of type " + (actionType ? "\"" + String(actionType) + "\"" : '(unknown type)') + ", the slice reducer for key \"" + _key + "\" returned undefined. " + "To ignore an action, you must explicitly return the previous state. " + "If you want this reducer to hold no value, you can return null instead of undefined.");
      }

      nextState[_key] = nextStateForKey;
      hasChanged = hasChanged || nextStateForKey !== previousStateForKey;
    }

    hasChanged = hasChanged || finalReducerKeys.length !== Object.keys(state).length;
    return hasChanged ? nextState : state;
  };
}

function bindActionCreator(actionCreator, dispatch) {
  return function () {
    return dispatch(actionCreator.apply(this, arguments));
  };
}
/**
 * Turns an object whose values are action creators, into an object with the
 * same keys, but with every function wrapped into a `dispatch` call so they
 * may be invoked directly. This is just a convenience method, as you can call
 * `store.dispatch(MyActionCreators.doSomething())` yourself just fine.
 *
 * For convenience, you can also pass an action creator as the first argument,
 * and get a dispatch wrapped function in return.
 *
 * @param {Function|Object} actionCreators An object whose values are action
 * creator functions. One handy way to obtain it is to use ES6 `import * as`
 * syntax. You may also pass a single function.
 *
 * @param {Function} dispatch The `dispatch` function available on your Redux
 * store.
 *
 * @returns {Function|Object} The object mimicking the original object, but with
 * every action creator wrapped into the `dispatch` call. If you passed a
 * function as `actionCreators`, the return value will also be a single
 * function.
 */


function bindActionCreators(actionCreators, dispatch) {
  if (typeof actionCreators === 'function') {
    return bindActionCreator(actionCreators, dispatch);
  }

  if (typeof actionCreators !== 'object' || actionCreators === null) {
    throw new Error(process.env.NODE_ENV === "production" ? formatProdErrorMessage(16) : "bindActionCreators expected an object or a function, but instead received: '" + kindOf(actionCreators) + "'. " + "Did you write \"import ActionCreators from\" instead of \"import * as ActionCreators from\"?");
  }

  var boundActionCreators = {};

  for (var key in actionCreators) {
    var actionCreator = actionCreators[key];

    if (typeof actionCreator === 'function') {
      boundActionCreators[key] = bindActionCreator(actionCreator, dispatch);
    }
  }

  return boundActionCreators;
}

/**
 * Composes single-argument functions from right to left. The rightmost
 * function can take multiple arguments as it provides the signature for
 * the resulting composite function.
 *
 * @param {...Function} funcs The functions to compose.
 * @returns {Function} A function obtained by composing the argument functions
 * from right to left. For example, compose(f, g, h) is identical to doing
 * (...args) => f(g(h(...args))).
 */
function compose() {
  for (var _len = arguments.length, funcs = new Array(_len), _key = 0; _key < _len; _key++) {
    funcs[_key] = arguments[_key];
  }

  if (funcs.length === 0) {
    return function (arg) {
      return arg;
    };
  }

  if (funcs.length === 1) {
    return funcs[0];
  }

  return funcs.reduce(function (a, b) {
    return function () {
      return a(b.apply(void 0, arguments));
    };
  });
}

/**
 * Creates a store enhancer that applies middleware to the dispatch method
 * of the Redux store. This is handy for a variety of tasks, such as expressing
 * asynchronous actions in a concise manner, or logging every action payload.
 *
 * See `redux-thunk` package as an example of the Redux middleware.
 *
 * Because middleware is potentially asynchronous, this should be the first
 * store enhancer in the composition chain.
 *
 * Note that each middleware will be given the `dispatch` and `getState` functions
 * as named arguments.
 *
 * @param {...Function} middlewares The middleware chain to be applied.
 * @returns {Function} A store enhancer applying the middleware.
 */

function applyMiddleware() {
  for (var _len = arguments.length, middlewares = new Array(_len), _key = 0; _key < _len; _key++) {
    middlewares[_key] = arguments[_key];
  }

  return function (createStore) {
    return function () {
      var store = createStore.apply(void 0, arguments);

      var _dispatch = function dispatch() {
        throw new Error(process.env.NODE_ENV === "production" ? formatProdErrorMessage(15) : 'Dispatching while constructing your middleware is not allowed. ' + 'Other middleware would not be applied to this dispatch.');
      };

      var middlewareAPI = {
        getState: store.getState,
        dispatch: function dispatch() {
          return _dispatch.apply(void 0, arguments);
        }
      };
      var chain = middlewares.map(function (middleware) {
        return middleware(middlewareAPI);
      });
      _dispatch = compose.apply(void 0, chain)(store.dispatch);
      return _objectSpread__default['default'](_objectSpread__default['default']({}, store), {}, {
        dispatch: _dispatch
      });
    };
  };
}

/*
 * This is a dummy function to check if the function name has been altered by minification.
 * If the function has been minified and NODE_ENV !== 'production', warn the user.
 */

function isCrushed() {}

if (process.env.NODE_ENV !== 'production' && typeof isCrushed.name === 'string' && isCrushed.name !== 'isCrushed') {
  warning('You are currently using minified code outside of NODE_ENV === "production". ' + 'This means that you are running a slower development build of Redux. ' + 'You can use loose-envify (https://github.com/zertosh/loose-envify) for browserify ' + 'or setting mode to production in webpack (https://webpack.js.org/concepts/mode/) ' + 'to ensure you have the correct code for your production build.');
}

exports.__DO_NOT_USE__ActionTypes = ActionTypes;
exports.applyMiddleware = applyMiddleware;
exports.bindActionCreators = bindActionCreators;
exports.combineReducers = combineReducers;
exports.compose = compose;
exports.createStore = createStore;
exports.legacy_createStore = legacy_createStore;

}).call(this)}).call(this,require('_process'))
},{"@babel/runtime/helpers/objectSpread2":2,"_process":32}],34:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.diffAny = exports.diffObjects = exports.diffArrays = exports.intersection = exports.subtract = exports.isDestructive = void 0;
var util_1 = require("./util");
function isDestructive(_a) {
    var op = _a.op;
    return op === 'remove' || op === 'replace' || op === 'copy' || op === 'move';
}
exports.isDestructive = isDestructive;
/**
List the keys in `minuend` that are not in `subtrahend`.

A key is only considered if it is both 1) an own-property (o.hasOwnProperty(k))
of the object, and 2) has a value that is not undefined. This is to match JSON
semantics, where JSON object serialization drops keys with undefined values.

@param minuend Object of interest
@param subtrahend Object of comparison
@returns Array of keys that are in `minuend` but not in `subtrahend`.
*/
function subtract(minuend, subtrahend) {
    // initialize empty object; we only care about the keys, the values can be anything
    var obj = {};
    // build up obj with all the properties of minuend
    for (var add_key in minuend) {
        if (util_1.hasOwnProperty.call(minuend, add_key) && minuend[add_key] !== undefined) {
            obj[add_key] = 1;
        }
    }
    // now delete all the properties of subtrahend from obj
    // (deleting a missing key has no effect)
    for (var del_key in subtrahend) {
        if (util_1.hasOwnProperty.call(subtrahend, del_key) && subtrahend[del_key] !== undefined) {
            delete obj[del_key];
        }
    }
    // finally, extract whatever keys remain in obj
    return Object.keys(obj);
}
exports.subtract = subtract;
/**
List the keys that shared by all `objects`.

The semantics of what constitutes a "key" is described in {@link subtract}.

@param objects Array of objects to compare
@returns Array of keys that are in ("own-properties" of) every object in `objects`.
*/
function intersection(objects) {
    var length = objects.length;
    // prepare empty counter to keep track of how many objects each key occurred in
    var counter = {};
    // go through each object and increment the counter for each key in that object
    for (var i = 0; i < length; i++) {
        var object = objects[i];
        for (var key in object) {
            if (util_1.hasOwnProperty.call(object, key) && object[key] !== undefined) {
                counter[key] = (counter[key] || 0) + 1;
            }
        }
    }
    // now delete all keys from the counter that were not seen in every object
    for (var key in counter) {
        if (counter[key] < length) {
            delete counter[key];
        }
    }
    // finally, extract whatever keys remain in the counter
    return Object.keys(counter);
}
exports.intersection = intersection;
function isArrayAdd(array_operation) {
    return array_operation.op === 'add';
}
function isArrayRemove(array_operation) {
    return array_operation.op === 'remove';
}
function appendArrayOperation(base, operation) {
    return {
        // the new operation must be pushed on the end
        operations: base.operations.concat(operation),
        cost: base.cost + 1,
    };
}
/**
Calculate the shortest sequence of operations to get from `input` to `output`,
using a dynamic programming implementation of the Levenshtein distance algorithm.

To get from the input ABC to the output AZ we could just delete all the input
and say "insert A, insert Z" and be done with it. That's what we do if the
input is empty. But we can be smarter.

          output
               A   Z
               -   -
          [0]  1   2
input A |  1  [0]  1
      B |  2  [1]  1
      C |  3   2  [2]

1) start at 0,0 (+0)
2) keep A (+0)
3) remove B (+1)
4) replace C with Z (+1)

If the `input` (source) is empty, they'll all be in the top row, resulting in an
array of 'add' operations.
If the `output` (target) is empty, everything will be in the left column,
resulting in an array of 'remove' operations.

@returns A list of add/remove/replace operations.
*/
function diffArrays(input, output, ptr, diff) {
    if (diff === void 0) { diff = diffAny; }
    // set up cost matrix (very simple initialization: just a map)
    var memo = {
        '0,0': { operations: [], cost: 0 },
    };
    /**
    Calculate the cheapest sequence of operations required to get from
    input.slice(0, i) to output.slice(0, j).
    There may be other valid sequences with the same cost, but none cheaper.
  
    @param i The row in the layout above
    @param j The column in the layout above
    @returns An object containing a list of operations, along with the total cost
             of applying them (+1 for each add/remove/replace operation)
    */
    function dist(i, j) {
        // memoized
        var memo_key = i + "," + j;
        var memoized = memo[memo_key];
        if (memoized === undefined) {
            // TODO: this !diff(...).length usage could/should be lazy
            if (i > 0 && j > 0 && !diff(input[i - 1], output[j - 1], ptr.add(String(i - 1))).length) {
                // equal (no operations => no cost)
                memoized = dist(i - 1, j - 1);
            }
            else {
                var alternatives = [];
                if (i > 0) {
                    // NOT topmost row
                    var remove_base = dist(i - 1, j);
                    var remove_operation = {
                        op: 'remove',
                        index: i - 1,
                    };
                    alternatives.push(appendArrayOperation(remove_base, remove_operation));
                }
                if (j > 0) {
                    // NOT leftmost column
                    var add_base = dist(i, j - 1);
                    var add_operation = {
                        op: 'add',
                        index: i - 1,
                        value: output[j - 1],
                    };
                    alternatives.push(appendArrayOperation(add_base, add_operation));
                }
                if (i > 0 && j > 0) {
                    // TABLE MIDDLE
                    // supposing we replaced it, compute the rest of the costs:
                    var replace_base = dist(i - 1, j - 1);
                    // okay, the general plan is to replace it, but we can be smarter,
                    // recursing into the structure and replacing only part of it if
                    // possible, but to do so we'll need the original value
                    var replace_operation = {
                        op: 'replace',
                        index: i - 1,
                        original: input[i - 1],
                        value: output[j - 1],
                    };
                    alternatives.push(appendArrayOperation(replace_base, replace_operation));
                }
                // the only other case, i === 0 && j === 0, has already been memoized
                // the meat of the algorithm:
                // sort by cost to find the lowest one (might be several ties for lowest)
                // [4, 6, 7, 1, 2].sort((a, b) => a - b) -> [ 1, 2, 4, 6, 7 ]
                var best = alternatives.sort(function (a, b) { return a.cost - b.cost; })[0];
                memoized = best;
            }
            memo[memo_key] = memoized;
        }
        return memoized;
    }
    // handle weird objects masquerading as Arrays that don't have proper length
    // properties by using 0 for everything but positive numbers
    var input_length = (isNaN(input.length) || input.length <= 0) ? 0 : input.length;
    var output_length = (isNaN(output.length) || output.length <= 0) ? 0 : output.length;
    var array_operations = dist(input_length, output_length).operations;
    var padded_operations = array_operations.reduce(function (_a, array_operation) {
        var operations = _a[0], padding = _a[1];
        if (isArrayAdd(array_operation)) {
            var padded_index = array_operation.index + 1 + padding;
            var index_token = padded_index < (input_length + padding) ? String(padded_index) : '-';
            var operation = {
                op: array_operation.op,
                path: ptr.add(index_token).toString(),
                value: array_operation.value,
            };
            // padding++ // maybe only if array_operation.index > -1 ?
            return [operations.concat(operation), padding + 1];
        }
        else if (isArrayRemove(array_operation)) {
            var operation = {
                op: array_operation.op,
                path: ptr.add(String(array_operation.index + padding)).toString(),
            };
            // padding--
            return [operations.concat(operation), padding - 1];
        }
        else { // replace
            var replace_ptr = ptr.add(String(array_operation.index + padding));
            var replace_operations = diff(array_operation.original, array_operation.value, replace_ptr);
            return [operations.concat.apply(operations, replace_operations), padding];
        }
    }, [[], 0])[0];
    return padded_operations;
}
exports.diffArrays = diffArrays;
function diffObjects(input, output, ptr, diff) {
    if (diff === void 0) { diff = diffAny; }
    // if a key is in input but not output -> remove it
    var operations = [];
    subtract(input, output).forEach(function (key) {
        operations.push({ op: 'remove', path: ptr.add(key).toString() });
    });
    // if a key is in output but not input -> add it
    subtract(output, input).forEach(function (key) {
        operations.push({ op: 'add', path: ptr.add(key).toString(), value: output[key] });
    });
    // if a key is in both, diff it recursively
    intersection([input, output]).forEach(function (key) {
        operations.push.apply(operations, diff(input[key], output[key], ptr.add(key)));
    });
    return operations;
}
exports.diffObjects = diffObjects;
/**
`diffAny()` returns an empty array if `input` and `output` are materially equal
(i.e., would produce equivalent JSON); otherwise it produces an array of patches
that would transform `input` into `output`.

> Here, "equal" means that the value at the target location and the
> value conveyed by "value" are of the same JSON type, and that they
> are considered equal by the following rules for that type:
> o  strings: are considered equal if they contain the same number of
>    Unicode characters and their code points are byte-by-byte equal.
> o  numbers: are considered equal if their values are numerically
>    equal.
> o  arrays: are considered equal if they contain the same number of
>    values, and if each value can be considered equal to the value at
>    the corresponding position in the other array, using this list of
>    type-specific rules.
> o  objects: are considered equal if they contain the same number of
>    members, and if each member can be considered equal to a member in
>    the other object, by comparing their keys (as strings) and their
>    values (using this list of type-specific rules).
> o  literals (false, true, and null): are considered equal if they are
>    the same.
*/
function diffAny(input, output, ptr, diff) {
    if (diff === void 0) { diff = diffAny; }
    // strict equality handles literals, numbers, and strings (a sufficient but not necessary cause)
    if (input === output) {
        return [];
    }
    var input_type = util_1.objectType(input);
    var output_type = util_1.objectType(output);
    if (input_type == 'array' && output_type == 'array') {
        return diffArrays(input, output, ptr, diff);
    }
    if (input_type == 'object' && output_type == 'object') {
        return diffObjects(input, output, ptr, diff);
    }
    // at this point we know that input and output are materially different;
    // could be array -> object, object -> array, boolean -> undefined,
    // number -> string, or some other combination, but nothing that can be split
    // up into multiple patches: so `output` must replace `input` wholesale.
    return [{ op: 'replace', path: ptr.toString(), value: output }];
}
exports.diffAny = diffAny;

},{"./util":38}],35:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createTests = exports.createPatch = exports.applyPatch = void 0;
var pointer_1 = require("./pointer");
var patch_1 = require("./patch");
var diff_1 = require("./diff");
/**
Apply a 'application/json-patch+json'-type patch to an object.

`patch` *must* be an array of operations.

> Operation objects MUST have exactly one "op" member, whose value
> indicates the operation to perform.  Its value MUST be one of "add",
> "remove", "replace", "move", "copy", or "test"; other values are
> errors.

This method mutates the target object in-place.

@returns list of results, one for each operation: `null` indicated success,
         otherwise, the result will be an instance of one of the Error classes:
         MissingError, InvalidOperationError, or TestError.
*/
function applyPatch(object, patch) {
    return patch.map(function (operation) { return patch_1.apply(object, operation); });
}
exports.applyPatch = applyPatch;
function wrapVoidableDiff(diff) {
    function wrappedDiff(input, output, ptr) {
        var custom_patch = diff(input, output, ptr);
        // ensure an array is always returned
        return Array.isArray(custom_patch) ? custom_patch : diff_1.diffAny(input, output, ptr, wrappedDiff);
    }
    return wrappedDiff;
}
/**
Produce a 'application/json-patch+json'-type patch to get from one object to
another.

This does not alter `input` or `output` unless they have a property getter with
side-effects (which is not a good idea anyway).

`diff` is called on each pair of comparable non-primitive nodes in the
`input`/`output` object trees, producing nested patches. Return `undefined`
to fall back to default behaviour.

Returns list of operations to perform on `input` to produce `output`.
*/
function createPatch(input, output, diff) {
    var ptr = new pointer_1.Pointer();
    // a new Pointer gets a default path of [''] if not specified
    return (diff ? wrapVoidableDiff(diff) : diff_1.diffAny)(input, output, ptr);
}
exports.createPatch = createPatch;
/**
Create a test operation based on `input`'s current evaluation of the JSON
Pointer `path`; if such a pointer cannot be resolved, returns undefined.
*/
function createTest(input, path) {
    var endpoint = pointer_1.Pointer.fromJSON(path).evaluate(input);
    if (endpoint !== undefined) {
        return { op: 'test', path: path, value: endpoint.value };
    }
}
/**
Produce an 'application/json-patch+json'-type list of tests, to verify that
existing values in an object are identical to the those captured at some
checkpoint (whenever this function is called).

This does not alter `input` or `output` unless they have a property getter with
side-effects (which is not a good idea anyway).

Returns list of test operations.
*/
function createTests(input, patch) {
    var tests = new Array();
    patch.filter(diff_1.isDestructive).forEach(function (operation) {
        var pathTest = createTest(input, operation.path);
        if (pathTest)
            tests.push(pathTest);
        if ('from' in operation) {
            var fromTest = createTest(input, operation.from);
            if (fromTest)
                tests.push(fromTest);
        }
    });
    return tests;
}
exports.createTests = createTests;

},{"./diff":34,"./patch":36,"./pointer":37}],36:[function(require,module,exports){
"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.apply = exports.InvalidOperationError = exports.test = exports.copy = exports.move = exports.replace = exports.remove = exports.add = exports.TestError = exports.MissingError = void 0;
var pointer_1 = require("./pointer");
var util_1 = require("./util");
var diff_1 = require("./diff");
var MissingError = /** @class */ (function (_super) {
    __extends(MissingError, _super);
    function MissingError(path) {
        var _this = _super.call(this, "Value required at path: " + path) || this;
        _this.path = path;
        _this.name = 'MissingError';
        return _this;
    }
    return MissingError;
}(Error));
exports.MissingError = MissingError;
var TestError = /** @class */ (function (_super) {
    __extends(TestError, _super);
    function TestError(actual, expected) {
        var _this = _super.call(this, "Test failed: " + actual + " != " + expected) || this;
        _this.actual = actual;
        _this.expected = expected;
        _this.name = 'TestError';
        return _this;
    }
    return TestError;
}(Error));
exports.TestError = TestError;
function _add(object, key, value) {
    if (Array.isArray(object)) {
        // `key` must be an index
        if (key == '-') {
            object.push(value);
        }
        else {
            var index = parseInt(key, 10);
            object.splice(index, 0, value);
        }
    }
    else {
        object[key] = value;
    }
}
function _remove(object, key) {
    if (Array.isArray(object)) {
        // '-' syntax doesn't make sense when removing
        var index = parseInt(key, 10);
        object.splice(index, 1);
    }
    else {
        // not sure what the proper behavior is when path = ''
        delete object[key];
    }
}
/**
>  o  If the target location specifies an array index, a new value is
>     inserted into the array at the specified index.
>  o  If the target location specifies an object member that does not
>     already exist, a new member is added to the object.
>  o  If the target location specifies an object member that does exist,
>     that member's value is replaced.
*/
function add(object, operation) {
    var endpoint = pointer_1.Pointer.fromJSON(operation.path).evaluate(object);
    // it's not exactly a "MissingError" in the same way that `remove` is -- more like a MissingParent, or something
    if (endpoint.parent === undefined) {
        return new MissingError(operation.path);
    }
    _add(endpoint.parent, endpoint.key, util_1.clone(operation.value));
    return null;
}
exports.add = add;
/**
> The "remove" operation removes the value at the target location.
> The target location MUST exist for the operation to be successful.
*/
function remove(object, operation) {
    // endpoint has parent, key, and value properties
    var endpoint = pointer_1.Pointer.fromJSON(operation.path).evaluate(object);
    if (endpoint.value === undefined) {
        return new MissingError(operation.path);
    }
    // not sure what the proper behavior is when path = ''
    _remove(endpoint.parent, endpoint.key);
    return null;
}
exports.remove = remove;
/**
> The "replace" operation replaces the value at the target location
> with a new value.  The operation object MUST contain a "value" member
> whose content specifies the replacement value.
> The target location MUST exist for the operation to be successful.

> This operation is functionally identical to a "remove" operation for
> a value, followed immediately by an "add" operation at the same
> location with the replacement value.

Even more simply, it's like the add operation with an existence check.
*/
function replace(object, operation) {
    var endpoint = pointer_1.Pointer.fromJSON(operation.path).evaluate(object);
    if (endpoint.parent === null) {
        return new MissingError(operation.path);
    }
    // this existence check treats arrays as a special case
    if (Array.isArray(endpoint.parent)) {
        if (parseInt(endpoint.key, 10) >= endpoint.parent.length) {
            return new MissingError(operation.path);
        }
    }
    else if (endpoint.value === undefined) {
        return new MissingError(operation.path);
    }
    endpoint.parent[endpoint.key] = operation.value;
    return null;
}
exports.replace = replace;
/**
> The "move" operation removes the value at a specified location and
> adds it to the target location.
> The operation object MUST contain a "from" member, which is a string
> containing a JSON Pointer value that references the location in the
> target document to move the value from.
> This operation is functionally identical to a "remove" operation on
> the "from" location, followed immediately by an "add" operation at
> the target location with the value that was just removed.

> The "from" location MUST NOT be a proper prefix of the "path"
> location; i.e., a location cannot be moved into one of its children.

TODO: throw if the check described in the previous paragraph fails.
*/
function move(object, operation) {
    var from_endpoint = pointer_1.Pointer.fromJSON(operation.from).evaluate(object);
    if (from_endpoint.value === undefined) {
        return new MissingError(operation.from);
    }
    var endpoint = pointer_1.Pointer.fromJSON(operation.path).evaluate(object);
    if (endpoint.parent === undefined) {
        return new MissingError(operation.path);
    }
    _remove(from_endpoint.parent, from_endpoint.key);
    _add(endpoint.parent, endpoint.key, from_endpoint.value);
    return null;
}
exports.move = move;
/**
> The "copy" operation copies the value at a specified location to the
> target location.
> The operation object MUST contain a "from" member, which is a string
> containing a JSON Pointer value that references the location in the
> target document to copy the value from.
> The "from" location MUST exist for the operation to be successful.

> This operation is functionally identical to an "add" operation at the
> target location using the value specified in the "from" member.

Alternatively, it's like 'move' without the 'remove'.
*/
function copy(object, operation) {
    var from_endpoint = pointer_1.Pointer.fromJSON(operation.from).evaluate(object);
    if (from_endpoint.value === undefined) {
        return new MissingError(operation.from);
    }
    var endpoint = pointer_1.Pointer.fromJSON(operation.path).evaluate(object);
    if (endpoint.parent === undefined) {
        return new MissingError(operation.path);
    }
    _add(endpoint.parent, endpoint.key, util_1.clone(from_endpoint.value));
    return null;
}
exports.copy = copy;
/**
> The "test" operation tests that a value at the target location is
> equal to a specified value.
> The operation object MUST contain a "value" member that conveys the
> value to be compared to the target location's value.
> The target location MUST be equal to the "value" value for the
> operation to be considered successful.
*/
function test(object, operation) {
    var endpoint = pointer_1.Pointer.fromJSON(operation.path).evaluate(object);
    // TODO: this diffAny(...).length usage could/should be lazy
    if (diff_1.diffAny(endpoint.value, operation.value, new pointer_1.Pointer()).length) {
        return new TestError(endpoint.value, operation.value);
    }
    return null;
}
exports.test = test;
var InvalidOperationError = /** @class */ (function (_super) {
    __extends(InvalidOperationError, _super);
    function InvalidOperationError(operation) {
        var _this = _super.call(this, "Invalid operation: " + operation.op) || this;
        _this.operation = operation;
        _this.name = 'InvalidOperationError';
        return _this;
    }
    return InvalidOperationError;
}(Error));
exports.InvalidOperationError = InvalidOperationError;
/**
Switch on `operation.op`, applying the corresponding patch function for each
case to `object`.
*/
function apply(object, operation) {
    // not sure why TypeScript can't infer typesafety of:
    //   {add, remove, replace, move, copy, test}[operation.op](object, operation)
    // (seems like a bug)
    switch (operation.op) {
        case 'add': return add(object, operation);
        case 'remove': return remove(object, operation);
        case 'replace': return replace(object, operation);
        case 'move': return move(object, operation);
        case 'copy': return copy(object, operation);
        case 'test': return test(object, operation);
    }
    return new InvalidOperationError(operation);
}
exports.apply = apply;

},{"./diff":34,"./pointer":37,"./util":38}],37:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Pointer = void 0;
/**
Unescape token part of a JSON Pointer string

`token` should *not* contain any '/' characters.

> Evaluation of each reference token begins by decoding any escaped
> character sequence.  This is performed by first transforming any
> occurrence of the sequence '~1' to '/', and then transforming any
> occurrence of the sequence '~0' to '~'.  By performing the
> substitutions in this order, an implementation avoids the error of
> turning '~01' first into '~1' and then into '/', which would be
> incorrect (the string '~01' correctly becomes '~1' after
> transformation).

Here's my take:

~1 is unescaped with higher priority than ~0 because it is a lower-order escape character.
I say "lower order" because '/' needs escaping due to the JSON Pointer serialization technique.
Whereas, '~' is escaped because escaping '/' uses the '~' character.
*/
function unescape(token) {
    return token.replace(/~1/g, '/').replace(/~0/g, '~');
}
/** Escape token part of a JSON Pointer string

> '~' needs to be encoded as '~0' and '/'
> needs to be encoded as '~1' when these characters appear in a
> reference token.

This is the exact inverse of `unescape()`, so the reverse replacements must take place in reverse order.
*/
function escape(token) {
    return token.replace(/~/g, '~0').replace(/\//g, '~1');
}
/**
JSON Pointer representation
*/
var Pointer = /** @class */ (function () {
    function Pointer(tokens) {
        if (tokens === void 0) { tokens = ['']; }
        this.tokens = tokens;
    }
    /**
    `path` *must* be a properly escaped string.
    */
    Pointer.fromJSON = function (path) {
        var tokens = path.split('/').map(unescape);
        if (tokens[0] !== '')
            throw new Error("Invalid JSON Pointer: " + path);
        return new Pointer(tokens);
    };
    Pointer.prototype.toString = function () {
        return this.tokens.map(escape).join('/');
    };
    /**
    Returns an object with 'parent', 'key', and 'value' properties.
    In the special case that this Pointer's path == "",
    this object will be {parent: null, key: '', value: object}.
    Otherwise, parent and key will have the property such that parent[key] == value.
    */
    Pointer.prototype.evaluate = function (object) {
        var parent = null;
        var key = '';
        var value = object;
        for (var i = 1, l = this.tokens.length; i < l; i++) {
            parent = value;
            key = this.tokens[i];
            if (key == '__proto__' || key == 'constructor' || key == 'prototype') {
                continue;
            }
            // not sure if this the best way to handle non-existant paths...
            value = (parent || {})[key];
        }
        return { parent: parent, key: key, value: value };
    };
    Pointer.prototype.get = function (object) {
        return this.evaluate(object).value;
    };
    Pointer.prototype.set = function (object, value) {
        var cursor = object;
        for (var i = 1, l = this.tokens.length - 1, token = this.tokens[i]; i < l; i++) {
            // not sure if this the best way to handle non-existant paths...
            cursor = (cursor || {})[token];
        }
        if (cursor) {
            cursor[this.tokens[this.tokens.length - 1]] = value;
        }
    };
    Pointer.prototype.push = function (token) {
        // mutable
        this.tokens.push(token);
    };
    /**
    `token` should be a String. It'll be coerced to one anyway.
  
    immutable (shallowly)
    */
    Pointer.prototype.add = function (token) {
        var tokens = this.tokens.concat(String(token));
        return new Pointer(tokens);
    };
    return Pointer;
}());
exports.Pointer = Pointer;

},{}],38:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.clone = exports.objectType = exports.hasOwnProperty = void 0;
exports.hasOwnProperty = Object.prototype.hasOwnProperty;
function objectType(object) {
    if (object === undefined) {
        return 'undefined';
    }
    if (object === null) {
        return 'null';
    }
    if (Array.isArray(object)) {
        return 'array';
    }
    return typeof object;
}
exports.objectType = objectType;
function isNonPrimitive(value) {
    // loose-equality checking for null is faster than strict checking for each of null/undefined/true/false
    // checking null first, then calling typeof, is faster than vice-versa
    return value != null && typeof value == 'object';
}
/**
Recursively copy a value.

@param source - should be a JavaScript primitive, Array, Date, or (plain old) Object.
@returns copy of source where every Array and Object have been recursively
         reconstructed from their constituent elements
*/
function clone(source) {
    if (!isNonPrimitive(source)) {
        // short-circuiting is faster than a single return
        return source;
    }
    // x.constructor == Array is the fastest way to check if x is an Array
    if (source.constructor == Array) {
        // construction via imperative for-loop is faster than source.map(arrayVsObject)
        var length_1 = source.length;
        // setting the Array length during construction is faster than just `[]` or `new Array()`
        var arrayTarget = new Array(length_1);
        for (var i = 0; i < length_1; i++) {
            arrayTarget[i] = clone(source[i]);
        }
        return arrayTarget;
    }
    // Date
    if (source.constructor == Date) {
        var dateTarget = new Date(+source);
        return dateTarget;
    }
    // Object
    var objectTarget = {};
    // declaring the variable (with const) inside the loop is faster
    for (var key in source) {
        // hasOwnProperty costs a bit of performance, but it's semantically necessary
        // using a global helper is MUCH faster than calling source.hasOwnProperty(key)
        if (exports.hasOwnProperty.call(source, key)) {
            objectTarget[key] = clone(source[key]);
        }
    }
    return objectTarget;
}
exports.clone = clone;

},{}],39:[function(require,module,exports){
/*
 *  Copyright (c) 2017 The WebRTC project authors. All Rights Reserved.
 *
 *  Use of this source code is governed by a BSD-style license
 *  that can be found in the LICENSE file in the root of the source
 *  tree.
 */
 /* eslint-env node */
'use strict';

var SDPUtils = require('sdp');

function fixStatsType(stat) {
  return {
    inboundrtp: 'inbound-rtp',
    outboundrtp: 'outbound-rtp',
    candidatepair: 'candidate-pair',
    localcandidate: 'local-candidate',
    remotecandidate: 'remote-candidate'
  }[stat.type] || stat.type;
}

function writeMediaSection(transceiver, caps, type, stream, dtlsRole) {
  var sdp = SDPUtils.writeRtpDescription(transceiver.kind, caps);

  // Map ICE parameters (ufrag, pwd) to SDP.
  sdp += SDPUtils.writeIceParameters(
      transceiver.iceGatherer.getLocalParameters());

  // Map DTLS parameters to SDP.
  sdp += SDPUtils.writeDtlsParameters(
      transceiver.dtlsTransport.getLocalParameters(),
      type === 'offer' ? 'actpass' : dtlsRole || 'active');

  sdp += 'a=mid:' + transceiver.mid + '\r\n';

  if (transceiver.rtpSender && transceiver.rtpReceiver) {
    sdp += 'a=sendrecv\r\n';
  } else if (transceiver.rtpSender) {
    sdp += 'a=sendonly\r\n';
  } else if (transceiver.rtpReceiver) {
    sdp += 'a=recvonly\r\n';
  } else {
    sdp += 'a=inactive\r\n';
  }

  if (transceiver.rtpSender) {
    var trackId = transceiver.rtpSender._initialTrackId ||
        transceiver.rtpSender.track.id;
    transceiver.rtpSender._initialTrackId = trackId;
    // spec.
    var msid = 'msid:' + (stream ? stream.id : '-') + ' ' +
        trackId + '\r\n';
    sdp += 'a=' + msid;
    // for Chrome. Legacy should no longer be required.
    sdp += 'a=ssrc:' + transceiver.sendEncodingParameters[0].ssrc +
        ' ' + msid;

    // RTX
    if (transceiver.sendEncodingParameters[0].rtx) {
      sdp += 'a=ssrc:' + transceiver.sendEncodingParameters[0].rtx.ssrc +
          ' ' + msid;
      sdp += 'a=ssrc-group:FID ' +
          transceiver.sendEncodingParameters[0].ssrc + ' ' +
          transceiver.sendEncodingParameters[0].rtx.ssrc +
          '\r\n';
    }
  }
  // FIXME: this should be written by writeRtpDescription.
  sdp += 'a=ssrc:' + transceiver.sendEncodingParameters[0].ssrc +
      ' cname:' + SDPUtils.localCName + '\r\n';
  if (transceiver.rtpSender && transceiver.sendEncodingParameters[0].rtx) {
    sdp += 'a=ssrc:' + transceiver.sendEncodingParameters[0].rtx.ssrc +
        ' cname:' + SDPUtils.localCName + '\r\n';
  }
  return sdp;
}

// Edge does not like
// 1) stun: filtered after 14393 unless ?transport=udp is present
// 2) turn: that does not have all of turn:host:port?transport=udp
// 3) turn: with ipv6 addresses
// 4) turn: occurring muliple times
function filterIceServers(iceServers, edgeVersion) {
  var hasTurn = false;
  iceServers = JSON.parse(JSON.stringify(iceServers));
  return iceServers.filter(function(server) {
    if (server && (server.urls || server.url)) {
      var urls = server.urls || server.url;
      if (server.url && !server.urls) {
        console.warn('RTCIceServer.url is deprecated! Use urls instead.');
      }
      var isString = typeof urls === 'string';
      if (isString) {
        urls = [urls];
      }
      urls = urls.filter(function(url) {
        var validTurn = url.indexOf('turn:') === 0 &&
            url.indexOf('transport=udp') !== -1 &&
            url.indexOf('turn:[') === -1 &&
            !hasTurn;

        if (validTurn) {
          hasTurn = true;
          return true;
        }
        return url.indexOf('stun:') === 0 && edgeVersion >= 14393 &&
            url.indexOf('?transport=udp') === -1;
      });

      delete server.url;
      server.urls = isString ? urls[0] : urls;
      return !!urls.length;
    }
  });
}

// Determines the intersection of local and remote capabilities.
function getCommonCapabilities(localCapabilities, remoteCapabilities) {
  var commonCapabilities = {
    codecs: [],
    headerExtensions: [],
    fecMechanisms: []
  };

  var findCodecByPayloadType = function(pt, codecs) {
    pt = parseInt(pt, 10);
    for (var i = 0; i < codecs.length; i++) {
      if (codecs[i].payloadType === pt ||
          codecs[i].preferredPayloadType === pt) {
        return codecs[i];
      }
    }
  };

  var rtxCapabilityMatches = function(lRtx, rRtx, lCodecs, rCodecs) {
    var lCodec = findCodecByPayloadType(lRtx.parameters.apt, lCodecs);
    var rCodec = findCodecByPayloadType(rRtx.parameters.apt, rCodecs);
    return lCodec && rCodec &&
        lCodec.name.toLowerCase() === rCodec.name.toLowerCase();
  };

  localCapabilities.codecs.forEach(function(lCodec) {
    for (var i = 0; i < remoteCapabilities.codecs.length; i++) {
      var rCodec = remoteCapabilities.codecs[i];
      if (lCodec.name.toLowerCase() === rCodec.name.toLowerCase() &&
          lCodec.clockRate === rCodec.clockRate) {
        if (lCodec.name.toLowerCase() === 'rtx' &&
            lCodec.parameters && rCodec.parameters.apt) {
          // for RTX we need to find the local rtx that has a apt
          // which points to the same local codec as the remote one.
          if (!rtxCapabilityMatches(lCodec, rCodec,
              localCapabilities.codecs, remoteCapabilities.codecs)) {
            continue;
          }
        }
        rCodec = JSON.parse(JSON.stringify(rCodec)); // deepcopy
        // number of channels is the highest common number of channels
        rCodec.numChannels = Math.min(lCodec.numChannels,
            rCodec.numChannels);
        // push rCodec so we reply with offerer payload type
        commonCapabilities.codecs.push(rCodec);

        // determine common feedback mechanisms
        rCodec.rtcpFeedback = rCodec.rtcpFeedback.filter(function(fb) {
          for (var j = 0; j < lCodec.rtcpFeedback.length; j++) {
            if (lCodec.rtcpFeedback[j].type === fb.type &&
                lCodec.rtcpFeedback[j].parameter === fb.parameter) {
              return true;
            }
          }
          return false;
        });
        // FIXME: also need to determine .parameters
        //  see https://github.com/openpeer/ortc/issues/569
        break;
      }
    }
  });

  localCapabilities.headerExtensions.forEach(function(lHeaderExtension) {
    for (var i = 0; i < remoteCapabilities.headerExtensions.length;
         i++) {
      var rHeaderExtension = remoteCapabilities.headerExtensions[i];
      if (lHeaderExtension.uri === rHeaderExtension.uri) {
        commonCapabilities.headerExtensions.push(rHeaderExtension);
        break;
      }
    }
  });

  // FIXME: fecMechanisms
  return commonCapabilities;
}

// is action=setLocalDescription with type allowed in signalingState
function isActionAllowedInSignalingState(action, type, signalingState) {
  return {
    offer: {
      setLocalDescription: ['stable', 'have-local-offer'],
      setRemoteDescription: ['stable', 'have-remote-offer']
    },
    answer: {
      setLocalDescription: ['have-remote-offer', 'have-local-pranswer'],
      setRemoteDescription: ['have-local-offer', 'have-remote-pranswer']
    }
  }[type][action].indexOf(signalingState) !== -1;
}

function maybeAddCandidate(iceTransport, candidate) {
  // Edge's internal representation adds some fields therefore
  // not all fieldѕ are taken into account.
  var alreadyAdded = iceTransport.getRemoteCandidates()
      .find(function(remoteCandidate) {
        return candidate.foundation === remoteCandidate.foundation &&
            candidate.ip === remoteCandidate.ip &&
            candidate.port === remoteCandidate.port &&
            candidate.priority === remoteCandidate.priority &&
            candidate.protocol === remoteCandidate.protocol &&
            candidate.type === remoteCandidate.type;
      });
  if (!alreadyAdded) {
    iceTransport.addRemoteCandidate(candidate);
  }
  return !alreadyAdded;
}


function makeError(name, description) {
  var e = new Error(description);
  e.name = name;
  // legacy error codes from https://heycam.github.io/webidl/#idl-DOMException-error-names
  e.code = {
    NotSupportedError: 9,
    InvalidStateError: 11,
    InvalidAccessError: 15,
    TypeError: undefined,
    OperationError: undefined
  }[name];
  return e;
}

module.exports = function(window, edgeVersion) {
  // https://w3c.github.io/mediacapture-main/#mediastream
  // Helper function to add the track to the stream and
  // dispatch the event ourselves.
  function addTrackToStreamAndFireEvent(track, stream) {
    stream.addTrack(track);
    stream.dispatchEvent(new window.MediaStreamTrackEvent('addtrack',
        {track: track}));
  }

  function removeTrackFromStreamAndFireEvent(track, stream) {
    stream.removeTrack(track);
    stream.dispatchEvent(new window.MediaStreamTrackEvent('removetrack',
        {track: track}));
  }

  function fireAddTrack(pc, track, receiver, streams) {
    var trackEvent = new Event('track');
    trackEvent.track = track;
    trackEvent.receiver = receiver;
    trackEvent.transceiver = {receiver: receiver};
    trackEvent.streams = streams;
    window.setTimeout(function() {
      pc._dispatchEvent('track', trackEvent);
    });
  }

  var RTCPeerConnection = function(config) {
    var pc = this;

    var _eventTarget = document.createDocumentFragment();
    ['addEventListener', 'removeEventListener', 'dispatchEvent']
        .forEach(function(method) {
          pc[method] = _eventTarget[method].bind(_eventTarget);
        });

    this.canTrickleIceCandidates = null;

    this.needNegotiation = false;

    this.localStreams = [];
    this.remoteStreams = [];

    this._localDescription = null;
    this._remoteDescription = null;

    this.signalingState = 'stable';
    this.iceConnectionState = 'new';
    this.connectionState = 'new';
    this.iceGatheringState = 'new';

    config = JSON.parse(JSON.stringify(config || {}));

    this.usingBundle = config.bundlePolicy === 'max-bundle';
    if (config.rtcpMuxPolicy === 'negotiate') {
      throw(makeError('NotSupportedError',
          'rtcpMuxPolicy \'negotiate\' is not supported'));
    } else if (!config.rtcpMuxPolicy) {
      config.rtcpMuxPolicy = 'require';
    }

    switch (config.iceTransportPolicy) {
      case 'all':
      case 'relay':
        break;
      default:
        config.iceTransportPolicy = 'all';
        break;
    }

    switch (config.bundlePolicy) {
      case 'balanced':
      case 'max-compat':
      case 'max-bundle':
        break;
      default:
        config.bundlePolicy = 'balanced';
        break;
    }

    config.iceServers = filterIceServers(config.iceServers || [], edgeVersion);

    this._iceGatherers = [];
    if (config.iceCandidatePoolSize) {
      for (var i = config.iceCandidatePoolSize; i > 0; i--) {
        this._iceGatherers.push(new window.RTCIceGatherer({
          iceServers: config.iceServers,
          gatherPolicy: config.iceTransportPolicy
        }));
      }
    } else {
      config.iceCandidatePoolSize = 0;
    }

    this._config = config;

    // per-track iceGathers, iceTransports, dtlsTransports, rtpSenders, ...
    // everything that is needed to describe a SDP m-line.
    this.transceivers = [];

    this._sdpSessionId = SDPUtils.generateSessionId();
    this._sdpSessionVersion = 0;

    this._dtlsRole = undefined; // role for a=setup to use in answers.

    this._isClosed = false;
  };

  Object.defineProperty(RTCPeerConnection.prototype, 'localDescription', {
    configurable: true,
    get: function() {
      return this._localDescription;
    }
  });
  Object.defineProperty(RTCPeerConnection.prototype, 'remoteDescription', {
    configurable: true,
    get: function() {
      return this._remoteDescription;
    }
  });

  // set up event handlers on prototype
  RTCPeerConnection.prototype.onicecandidate = null;
  RTCPeerConnection.prototype.onaddstream = null;
  RTCPeerConnection.prototype.ontrack = null;
  RTCPeerConnection.prototype.onremovestream = null;
  RTCPeerConnection.prototype.onsignalingstatechange = null;
  RTCPeerConnection.prototype.oniceconnectionstatechange = null;
  RTCPeerConnection.prototype.onconnectionstatechange = null;
  RTCPeerConnection.prototype.onicegatheringstatechange = null;
  RTCPeerConnection.prototype.onnegotiationneeded = null;
  RTCPeerConnection.prototype.ondatachannel = null;

  RTCPeerConnection.prototype._dispatchEvent = function(name, event) {
    if (this._isClosed) {
      return;
    }
    this.dispatchEvent(event);
    if (typeof this['on' + name] === 'function') {
      this['on' + name](event);
    }
  };

  RTCPeerConnection.prototype._emitGatheringStateChange = function() {
    var event = new Event('icegatheringstatechange');
    this._dispatchEvent('icegatheringstatechange', event);
  };

  RTCPeerConnection.prototype.getConfiguration = function() {
    return this._config;
  };

  RTCPeerConnection.prototype.getLocalStreams = function() {
    return this.localStreams;
  };

  RTCPeerConnection.prototype.getRemoteStreams = function() {
    return this.remoteStreams;
  };

  // internal helper to create a transceiver object.
  // (which is not yet the same as the WebRTC 1.0 transceiver)
  RTCPeerConnection.prototype._createTransceiver = function(kind, doNotAdd) {
    var hasBundleTransport = this.transceivers.length > 0;
    var transceiver = {
      track: null,
      iceGatherer: null,
      iceTransport: null,
      dtlsTransport: null,
      localCapabilities: null,
      remoteCapabilities: null,
      rtpSender: null,
      rtpReceiver: null,
      kind: kind,
      mid: null,
      sendEncodingParameters: null,
      recvEncodingParameters: null,
      stream: null,
      associatedRemoteMediaStreams: [],
      wantReceive: true
    };
    if (this.usingBundle && hasBundleTransport) {
      transceiver.iceTransport = this.transceivers[0].iceTransport;
      transceiver.dtlsTransport = this.transceivers[0].dtlsTransport;
    } else {
      var transports = this._createIceAndDtlsTransports();
      transceiver.iceTransport = transports.iceTransport;
      transceiver.dtlsTransport = transports.dtlsTransport;
    }
    if (!doNotAdd) {
      this.transceivers.push(transceiver);
    }
    return transceiver;
  };

  RTCPeerConnection.prototype.addTrack = function(track, stream) {
    if (this._isClosed) {
      throw makeError('InvalidStateError',
          'Attempted to call addTrack on a closed peerconnection.');
    }

    var alreadyExists = this.transceivers.find(function(s) {
      return s.track === track;
    });

    if (alreadyExists) {
      throw makeError('InvalidAccessError', 'Track already exists.');
    }

    var transceiver;
    for (var i = 0; i < this.transceivers.length; i++) {
      if (!this.transceivers[i].track &&
          this.transceivers[i].kind === track.kind) {
        transceiver = this.transceivers[i];
      }
    }
    if (!transceiver) {
      transceiver = this._createTransceiver(track.kind);
    }

    this._maybeFireNegotiationNeeded();

    if (this.localStreams.indexOf(stream) === -1) {
      this.localStreams.push(stream);
    }

    transceiver.track = track;
    transceiver.stream = stream;
    transceiver.rtpSender = new window.RTCRtpSender(track,
        transceiver.dtlsTransport);
    return transceiver.rtpSender;
  };

  RTCPeerConnection.prototype.addStream = function(stream) {
    var pc = this;
    if (edgeVersion >= 15025) {
      stream.getTracks().forEach(function(track) {
        pc.addTrack(track, stream);
      });
    } else {
      // Clone is necessary for local demos mostly, attaching directly
      // to two different senders does not work (build 10547).
      // Fixed in 15025 (or earlier)
      var clonedStream = stream.clone();
      stream.getTracks().forEach(function(track, idx) {
        var clonedTrack = clonedStream.getTracks()[idx];
        track.addEventListener('enabled', function(event) {
          clonedTrack.enabled = event.enabled;
        });
      });
      clonedStream.getTracks().forEach(function(track) {
        pc.addTrack(track, clonedStream);
      });
    }
  };

  RTCPeerConnection.prototype.removeTrack = function(sender) {
    if (this._isClosed) {
      throw makeError('InvalidStateError',
          'Attempted to call removeTrack on a closed peerconnection.');
    }

    if (!(sender instanceof window.RTCRtpSender)) {
      throw new TypeError('Argument 1 of RTCPeerConnection.removeTrack ' +
          'does not implement interface RTCRtpSender.');
    }

    var transceiver = this.transceivers.find(function(t) {
      return t.rtpSender === sender;
    });

    if (!transceiver) {
      throw makeError('InvalidAccessError',
          'Sender was not created by this connection.');
    }
    var stream = transceiver.stream;

    transceiver.rtpSender.stop();
    transceiver.rtpSender = null;
    transceiver.track = null;
    transceiver.stream = null;

    // remove the stream from the set of local streams
    var localStreams = this.transceivers.map(function(t) {
      return t.stream;
    });
    if (localStreams.indexOf(stream) === -1 &&
        this.localStreams.indexOf(stream) > -1) {
      this.localStreams.splice(this.localStreams.indexOf(stream), 1);
    }

    this._maybeFireNegotiationNeeded();
  };

  RTCPeerConnection.prototype.removeStream = function(stream) {
    var pc = this;
    stream.getTracks().forEach(function(track) {
      var sender = pc.getSenders().find(function(s) {
        return s.track === track;
      });
      if (sender) {
        pc.removeTrack(sender);
      }
    });
  };

  RTCPeerConnection.prototype.getSenders = function() {
    return this.transceivers.filter(function(transceiver) {
      return !!transceiver.rtpSender;
    })
    .map(function(transceiver) {
      return transceiver.rtpSender;
    });
  };

  RTCPeerConnection.prototype.getReceivers = function() {
    return this.transceivers.filter(function(transceiver) {
      return !!transceiver.rtpReceiver;
    })
    .map(function(transceiver) {
      return transceiver.rtpReceiver;
    });
  };


  RTCPeerConnection.prototype._createIceGatherer = function(sdpMLineIndex,
      usingBundle) {
    var pc = this;
    if (usingBundle && sdpMLineIndex > 0) {
      return this.transceivers[0].iceGatherer;
    } else if (this._iceGatherers.length) {
      return this._iceGatherers.shift();
    }
    var iceGatherer = new window.RTCIceGatherer({
      iceServers: this._config.iceServers,
      gatherPolicy: this._config.iceTransportPolicy
    });
    Object.defineProperty(iceGatherer, 'state',
        {value: 'new', writable: true}
    );

    this.transceivers[sdpMLineIndex].bufferedCandidateEvents = [];
    this.transceivers[sdpMLineIndex].bufferCandidates = function(event) {
      var end = !event.candidate || Object.keys(event.candidate).length === 0;
      // polyfill since RTCIceGatherer.state is not implemented in
      // Edge 10547 yet.
      iceGatherer.state = end ? 'completed' : 'gathering';
      if (pc.transceivers[sdpMLineIndex].bufferedCandidateEvents !== null) {
        pc.transceivers[sdpMLineIndex].bufferedCandidateEvents.push(event);
      }
    };
    iceGatherer.addEventListener('localcandidate',
      this.transceivers[sdpMLineIndex].bufferCandidates);
    return iceGatherer;
  };

  // start gathering from an RTCIceGatherer.
  RTCPeerConnection.prototype._gather = function(mid, sdpMLineIndex) {
    var pc = this;
    var iceGatherer = this.transceivers[sdpMLineIndex].iceGatherer;
    if (iceGatherer.onlocalcandidate) {
      return;
    }
    var bufferedCandidateEvents =
      this.transceivers[sdpMLineIndex].bufferedCandidateEvents;
    this.transceivers[sdpMLineIndex].bufferedCandidateEvents = null;
    iceGatherer.removeEventListener('localcandidate',
      this.transceivers[sdpMLineIndex].bufferCandidates);
    iceGatherer.onlocalcandidate = function(evt) {
      if (pc.usingBundle && sdpMLineIndex > 0) {
        // if we know that we use bundle we can drop candidates with
        // ѕdpMLineIndex > 0. If we don't do this then our state gets
        // confused since we dispose the extra ice gatherer.
        return;
      }
      var event = new Event('icecandidate');
      event.candidate = {sdpMid: mid, sdpMLineIndex: sdpMLineIndex};

      var cand = evt.candidate;
      // Edge emits an empty object for RTCIceCandidateComplete‥
      var end = !cand || Object.keys(cand).length === 0;
      if (end) {
        // polyfill since RTCIceGatherer.state is not implemented in
        // Edge 10547 yet.
        if (iceGatherer.state === 'new' || iceGatherer.state === 'gathering') {
          iceGatherer.state = 'completed';
        }
      } else {
        if (iceGatherer.state === 'new') {
          iceGatherer.state = 'gathering';
        }
        // RTCIceCandidate doesn't have a component, needs to be added
        cand.component = 1;
        // also the usernameFragment. TODO: update SDP to take both variants.
        cand.ufrag = iceGatherer.getLocalParameters().usernameFragment;

        var serializedCandidate = SDPUtils.writeCandidate(cand);
        event.candidate = Object.assign(event.candidate,
            SDPUtils.parseCandidate(serializedCandidate));

        event.candidate.candidate = serializedCandidate;
        event.candidate.toJSON = function() {
          return {
            candidate: event.candidate.candidate,
            sdpMid: event.candidate.sdpMid,
            sdpMLineIndex: event.candidate.sdpMLineIndex,
            usernameFragment: event.candidate.usernameFragment
          };
        };
      }

      // update local description.
      var sections = SDPUtils.getMediaSections(pc._localDescription.sdp);
      if (!end) {
        sections[event.candidate.sdpMLineIndex] +=
            'a=' + event.candidate.candidate + '\r\n';
      } else {
        sections[event.candidate.sdpMLineIndex] +=
            'a=end-of-candidates\r\n';
      }
      pc._localDescription.sdp =
          SDPUtils.getDescription(pc._localDescription.sdp) +
          sections.join('');
      var complete = pc.transceivers.every(function(transceiver) {
        return transceiver.iceGatherer &&
            transceiver.iceGatherer.state === 'completed';
      });

      if (pc.iceGatheringState !== 'gathering') {
        pc.iceGatheringState = 'gathering';
        pc._emitGatheringStateChange();
      }

      // Emit candidate. Also emit null candidate when all gatherers are
      // complete.
      if (!end) {
        pc._dispatchEvent('icecandidate', event);
      }
      if (complete) {
        pc._dispatchEvent('icecandidate', new Event('icecandidate'));
        pc.iceGatheringState = 'complete';
        pc._emitGatheringStateChange();
      }
    };

    // emit already gathered candidates.
    window.setTimeout(function() {
      bufferedCandidateEvents.forEach(function(e) {
        iceGatherer.onlocalcandidate(e);
      });
    }, 0);
  };

  // Create ICE transport and DTLS transport.
  RTCPeerConnection.prototype._createIceAndDtlsTransports = function() {
    var pc = this;
    var iceTransport = new window.RTCIceTransport(null);
    iceTransport.onicestatechange = function() {
      pc._updateIceConnectionState();
      pc._updateConnectionState();
    };

    var dtlsTransport = new window.RTCDtlsTransport(iceTransport);
    dtlsTransport.ondtlsstatechange = function() {
      pc._updateConnectionState();
    };
    dtlsTransport.onerror = function() {
      // onerror does not set state to failed by itself.
      Object.defineProperty(dtlsTransport, 'state',
          {value: 'failed', writable: true});
      pc._updateConnectionState();
    };

    return {
      iceTransport: iceTransport,
      dtlsTransport: dtlsTransport
    };
  };

  // Destroy ICE gatherer, ICE transport and DTLS transport.
  // Without triggering the callbacks.
  RTCPeerConnection.prototype._disposeIceAndDtlsTransports = function(
      sdpMLineIndex) {
    var iceGatherer = this.transceivers[sdpMLineIndex].iceGatherer;
    if (iceGatherer) {
      delete iceGatherer.onlocalcandidate;
      delete this.transceivers[sdpMLineIndex].iceGatherer;
    }
    var iceTransport = this.transceivers[sdpMLineIndex].iceTransport;
    if (iceTransport) {
      delete iceTransport.onicestatechange;
      delete this.transceivers[sdpMLineIndex].iceTransport;
    }
    var dtlsTransport = this.transceivers[sdpMLineIndex].dtlsTransport;
    if (dtlsTransport) {
      delete dtlsTransport.ondtlsstatechange;
      delete dtlsTransport.onerror;
      delete this.transceivers[sdpMLineIndex].dtlsTransport;
    }
  };

  // Start the RTP Sender and Receiver for a transceiver.
  RTCPeerConnection.prototype._transceive = function(transceiver,
      send, recv) {
    var params = getCommonCapabilities(transceiver.localCapabilities,
        transceiver.remoteCapabilities);
    if (send && transceiver.rtpSender) {
      params.encodings = transceiver.sendEncodingParameters;
      params.rtcp = {
        cname: SDPUtils.localCName,
        compound: transceiver.rtcpParameters.compound
      };
      if (transceiver.recvEncodingParameters.length) {
        params.rtcp.ssrc = transceiver.recvEncodingParameters[0].ssrc;
      }
      transceiver.rtpSender.send(params);
    }
    if (recv && transceiver.rtpReceiver && params.codecs.length > 0) {
      // remove RTX field in Edge 14942
      if (transceiver.kind === 'video'
          && transceiver.recvEncodingParameters
          && edgeVersion < 15019) {
        transceiver.recvEncodingParameters.forEach(function(p) {
          delete p.rtx;
        });
      }
      if (transceiver.recvEncodingParameters.length) {
        params.encodings = transceiver.recvEncodingParameters;
      } else {
        params.encodings = [{}];
      }
      params.rtcp = {
        compound: transceiver.rtcpParameters.compound
      };
      if (transceiver.rtcpParameters.cname) {
        params.rtcp.cname = transceiver.rtcpParameters.cname;
      }
      if (transceiver.sendEncodingParameters.length) {
        params.rtcp.ssrc = transceiver.sendEncodingParameters[0].ssrc;
      }
      transceiver.rtpReceiver.receive(params);
    }
  };

  RTCPeerConnection.prototype.setLocalDescription = function(description) {
    var pc = this;

    // Note: pranswer is not supported.
    if (['offer', 'answer'].indexOf(description.type) === -1) {
      return Promise.reject(makeError('TypeError',
          'Unsupported type "' + description.type + '"'));
    }

    if (!isActionAllowedInSignalingState('setLocalDescription',
        description.type, pc.signalingState) || pc._isClosed) {
      return Promise.reject(makeError('InvalidStateError',
          'Can not set local ' + description.type +
          ' in state ' + pc.signalingState));
    }

    var sections;
    var sessionpart;
    if (description.type === 'offer') {
      // VERY limited support for SDP munging. Limited to:
      // * changing the order of codecs
      sections = SDPUtils.splitSections(description.sdp);
      sessionpart = sections.shift();
      sections.forEach(function(mediaSection, sdpMLineIndex) {
        var caps = SDPUtils.parseRtpParameters(mediaSection);
        pc.transceivers[sdpMLineIndex].localCapabilities = caps;
      });

      pc.transceivers.forEach(function(transceiver, sdpMLineIndex) {
        pc._gather(transceiver.mid, sdpMLineIndex);
      });
    } else if (description.type === 'answer') {
      sections = SDPUtils.splitSections(pc._remoteDescription.sdp);
      sessionpart = sections.shift();
      var isIceLite = SDPUtils.matchPrefix(sessionpart,
          'a=ice-lite').length > 0;
      sections.forEach(function(mediaSection, sdpMLineIndex) {
        var transceiver = pc.transceivers[sdpMLineIndex];
        var iceGatherer = transceiver.iceGatherer;
        var iceTransport = transceiver.iceTransport;
        var dtlsTransport = transceiver.dtlsTransport;
        var localCapabilities = transceiver.localCapabilities;
        var remoteCapabilities = transceiver.remoteCapabilities;

        // treat bundle-only as not-rejected.
        var rejected = SDPUtils.isRejected(mediaSection) &&
            SDPUtils.matchPrefix(mediaSection, 'a=bundle-only').length === 0;

        if (!rejected && !transceiver.rejected) {
          var remoteIceParameters = SDPUtils.getIceParameters(
              mediaSection, sessionpart);
          var remoteDtlsParameters = SDPUtils.getDtlsParameters(
              mediaSection, sessionpart);
          if (isIceLite) {
            remoteDtlsParameters.role = 'server';
          }

          if (!pc.usingBundle || sdpMLineIndex === 0) {
            pc._gather(transceiver.mid, sdpMLineIndex);
            if (iceTransport.state === 'new') {
              iceTransport.start(iceGatherer, remoteIceParameters,
                  isIceLite ? 'controlling' : 'controlled');
            }
            if (dtlsTransport.state === 'new') {
              dtlsTransport.start(remoteDtlsParameters);
            }
          }

          // Calculate intersection of capabilities.
          var params = getCommonCapabilities(localCapabilities,
              remoteCapabilities);

          // Start the RTCRtpSender. The RTCRtpReceiver for this
          // transceiver has already been started in setRemoteDescription.
          pc._transceive(transceiver,
              params.codecs.length > 0,
              false);
        }
      });
    }

    pc._localDescription = {
      type: description.type,
      sdp: description.sdp
    };
    if (description.type === 'offer') {
      pc._updateSignalingState('have-local-offer');
    } else {
      pc._updateSignalingState('stable');
    }

    return Promise.resolve();
  };

  RTCPeerConnection.prototype.setRemoteDescription = function(description) {
    var pc = this;

    // Note: pranswer is not supported.
    if (['offer', 'answer'].indexOf(description.type) === -1) {
      return Promise.reject(makeError('TypeError',
          'Unsupported type "' + description.type + '"'));
    }

    if (!isActionAllowedInSignalingState('setRemoteDescription',
        description.type, pc.signalingState) || pc._isClosed) {
      return Promise.reject(makeError('InvalidStateError',
          'Can not set remote ' + description.type +
          ' in state ' + pc.signalingState));
    }

    var streams = {};
    pc.remoteStreams.forEach(function(stream) {
      streams[stream.id] = stream;
    });
    var receiverList = [];
    var sections = SDPUtils.splitSections(description.sdp);
    var sessionpart = sections.shift();
    var isIceLite = SDPUtils.matchPrefix(sessionpart,
        'a=ice-lite').length > 0;
    var usingBundle = SDPUtils.matchPrefix(sessionpart,
        'a=group:BUNDLE ').length > 0;
    pc.usingBundle = usingBundle;
    var iceOptions = SDPUtils.matchPrefix(sessionpart,
        'a=ice-options:')[0];
    if (iceOptions) {
      pc.canTrickleIceCandidates = iceOptions.substr(14).split(' ')
          .indexOf('trickle') >= 0;
    } else {
      pc.canTrickleIceCandidates = false;
    }

    sections.forEach(function(mediaSection, sdpMLineIndex) {
      var lines = SDPUtils.splitLines(mediaSection);
      var kind = SDPUtils.getKind(mediaSection);
      // treat bundle-only as not-rejected.
      var rejected = SDPUtils.isRejected(mediaSection) &&
          SDPUtils.matchPrefix(mediaSection, 'a=bundle-only').length === 0;
      var protocol = lines[0].substr(2).split(' ')[2];

      var direction = SDPUtils.getDirection(mediaSection, sessionpart);
      var remoteMsid = SDPUtils.parseMsid(mediaSection);

      var mid = SDPUtils.getMid(mediaSection) || SDPUtils.generateIdentifier();

      // Reject datachannels which are not implemented yet.
      if (rejected || (kind === 'application' && (protocol === 'DTLS/SCTP' ||
          protocol === 'UDP/DTLS/SCTP'))) {
        // TODO: this is dangerous in the case where a non-rejected m-line
        //     becomes rejected.
        pc.transceivers[sdpMLineIndex] = {
          mid: mid,
          kind: kind,
          protocol: protocol,
          rejected: true
        };
        return;
      }

      if (!rejected && pc.transceivers[sdpMLineIndex] &&
          pc.transceivers[sdpMLineIndex].rejected) {
        // recycle a rejected transceiver.
        pc.transceivers[sdpMLineIndex] = pc._createTransceiver(kind, true);
      }

      var transceiver;
      var iceGatherer;
      var iceTransport;
      var dtlsTransport;
      var rtpReceiver;
      var sendEncodingParameters;
      var recvEncodingParameters;
      var localCapabilities;

      var track;
      // FIXME: ensure the mediaSection has rtcp-mux set.
      var remoteCapabilities = SDPUtils.parseRtpParameters(mediaSection);
      var remoteIceParameters;
      var remoteDtlsParameters;
      if (!rejected) {
        remoteIceParameters = SDPUtils.getIceParameters(mediaSection,
            sessionpart);
        remoteDtlsParameters = SDPUtils.getDtlsParameters(mediaSection,
            sessionpart);
        remoteDtlsParameters.role = 'client';
      }
      recvEncodingParameters =
          SDPUtils.parseRtpEncodingParameters(mediaSection);

      var rtcpParameters = SDPUtils.parseRtcpParameters(mediaSection);

      var isComplete = SDPUtils.matchPrefix(mediaSection,
          'a=end-of-candidates', sessionpart).length > 0;
      var cands = SDPUtils.matchPrefix(mediaSection, 'a=candidate:')
          .map(function(cand) {
            return SDPUtils.parseCandidate(cand);
          })
          .filter(function(cand) {
            return cand.component === 1;
          });

      // Check if we can use BUNDLE and dispose transports.
      if ((description.type === 'offer' || description.type === 'answer') &&
          !rejected && usingBundle && sdpMLineIndex > 0 &&
          pc.transceivers[sdpMLineIndex]) {
        pc._disposeIceAndDtlsTransports(sdpMLineIndex);
        pc.transceivers[sdpMLineIndex].iceGatherer =
            pc.transceivers[0].iceGatherer;
        pc.transceivers[sdpMLineIndex].iceTransport =
            pc.transceivers[0].iceTransport;
        pc.transceivers[sdpMLineIndex].dtlsTransport =
            pc.transceivers[0].dtlsTransport;
        if (pc.transceivers[sdpMLineIndex].rtpSender) {
          pc.transceivers[sdpMLineIndex].rtpSender.setTransport(
              pc.transceivers[0].dtlsTransport);
        }
        if (pc.transceivers[sdpMLineIndex].rtpReceiver) {
          pc.transceivers[sdpMLineIndex].rtpReceiver.setTransport(
              pc.transceivers[0].dtlsTransport);
        }
      }
      if (description.type === 'offer' && !rejected) {
        transceiver = pc.transceivers[sdpMLineIndex] ||
            pc._createTransceiver(kind);
        transceiver.mid = mid;

        if (!transceiver.iceGatherer) {
          transceiver.iceGatherer = pc._createIceGatherer(sdpMLineIndex,
              usingBundle);
        }

        if (cands.length && transceiver.iceTransport.state === 'new') {
          if (isComplete && (!usingBundle || sdpMLineIndex === 0)) {
            transceiver.iceTransport.setRemoteCandidates(cands);
          } else {
            cands.forEach(function(candidate) {
              maybeAddCandidate(transceiver.iceTransport, candidate);
            });
          }
        }

        localCapabilities = window.RTCRtpReceiver.getCapabilities(kind);

        // filter RTX until additional stuff needed for RTX is implemented
        // in adapter.js
        if (edgeVersion < 15019) {
          localCapabilities.codecs = localCapabilities.codecs.filter(
              function(codec) {
                return codec.name !== 'rtx';
              });
        }

        sendEncodingParameters = transceiver.sendEncodingParameters || [{
          ssrc: (2 * sdpMLineIndex + 2) * 1001
        }];

        // TODO: rewrite to use http://w3c.github.io/webrtc-pc/#set-associated-remote-streams
        var isNewTrack = false;
        if (direction === 'sendrecv' || direction === 'sendonly') {
          isNewTrack = !transceiver.rtpReceiver;
          rtpReceiver = transceiver.rtpReceiver ||
              new window.RTCRtpReceiver(transceiver.dtlsTransport, kind);

          if (isNewTrack) {
            var stream;
            track = rtpReceiver.track;
            // FIXME: does not work with Plan B.
            if (remoteMsid && remoteMsid.stream === '-') {
              // no-op. a stream id of '-' means: no associated stream.
            } else if (remoteMsid) {
              if (!streams[remoteMsid.stream]) {
                streams[remoteMsid.stream] = new window.MediaStream();
                Object.defineProperty(streams[remoteMsid.stream], 'id', {
                  get: function() {
                    return remoteMsid.stream;
                  }
                });
              }
              Object.defineProperty(track, 'id', {
                get: function() {
                  return remoteMsid.track;
                }
              });
              stream = streams[remoteMsid.stream];
            } else {
              if (!streams.default) {
                streams.default = new window.MediaStream();
              }
              stream = streams.default;
            }
            if (stream) {
              addTrackToStreamAndFireEvent(track, stream);
              transceiver.associatedRemoteMediaStreams.push(stream);
            }
            receiverList.push([track, rtpReceiver, stream]);
          }
        } else if (transceiver.rtpReceiver && transceiver.rtpReceiver.track) {
          transceiver.associatedRemoteMediaStreams.forEach(function(s) {
            var nativeTrack = s.getTracks().find(function(t) {
              return t.id === transceiver.rtpReceiver.track.id;
            });
            if (nativeTrack) {
              removeTrackFromStreamAndFireEvent(nativeTrack, s);
            }
          });
          transceiver.associatedRemoteMediaStreams = [];
        }

        transceiver.localCapabilities = localCapabilities;
        transceiver.remoteCapabilities = remoteCapabilities;
        transceiver.rtpReceiver = rtpReceiver;
        transceiver.rtcpParameters = rtcpParameters;
        transceiver.sendEncodingParameters = sendEncodingParameters;
        transceiver.recvEncodingParameters = recvEncodingParameters;

        // Start the RTCRtpReceiver now. The RTPSender is started in
        // setLocalDescription.
        pc._transceive(pc.transceivers[sdpMLineIndex],
            false,
            isNewTrack);
      } else if (description.type === 'answer' && !rejected) {
        transceiver = pc.transceivers[sdpMLineIndex];
        iceGatherer = transceiver.iceGatherer;
        iceTransport = transceiver.iceTransport;
        dtlsTransport = transceiver.dtlsTransport;
        rtpReceiver = transceiver.rtpReceiver;
        sendEncodingParameters = transceiver.sendEncodingParameters;
        localCapabilities = transceiver.localCapabilities;

        pc.transceivers[sdpMLineIndex].recvEncodingParameters =
            recvEncodingParameters;
        pc.transceivers[sdpMLineIndex].remoteCapabilities =
            remoteCapabilities;
        pc.transceivers[sdpMLineIndex].rtcpParameters = rtcpParameters;

        if (cands.length && iceTransport.state === 'new') {
          if ((isIceLite || isComplete) &&
              (!usingBundle || sdpMLineIndex === 0)) {
            iceTransport.setRemoteCandidates(cands);
          } else {
            cands.forEach(function(candidate) {
              maybeAddCandidate(transceiver.iceTransport, candidate);
            });
          }
        }

        if (!usingBundle || sdpMLineIndex === 0) {
          if (iceTransport.state === 'new') {
            iceTransport.start(iceGatherer, remoteIceParameters,
                'controlling');
          }
          if (dtlsTransport.state === 'new') {
            dtlsTransport.start(remoteDtlsParameters);
          }
        }

        // If the offer contained RTX but the answer did not,
        // remove RTX from sendEncodingParameters.
        var commonCapabilities = getCommonCapabilities(
          transceiver.localCapabilities,
          transceiver.remoteCapabilities);

        var hasRtx = commonCapabilities.codecs.filter(function(c) {
          return c.name.toLowerCase() === 'rtx';
        }).length;
        if (!hasRtx && transceiver.sendEncodingParameters[0].rtx) {
          delete transceiver.sendEncodingParameters[0].rtx;
        }

        pc._transceive(transceiver,
            direction === 'sendrecv' || direction === 'recvonly',
            direction === 'sendrecv' || direction === 'sendonly');

        // TODO: rewrite to use http://w3c.github.io/webrtc-pc/#set-associated-remote-streams
        if (rtpReceiver &&
            (direction === 'sendrecv' || direction === 'sendonly')) {
          track = rtpReceiver.track;
          if (remoteMsid) {
            if (!streams[remoteMsid.stream]) {
              streams[remoteMsid.stream] = new window.MediaStream();
            }
            addTrackToStreamAndFireEvent(track, streams[remoteMsid.stream]);
            receiverList.push([track, rtpReceiver, streams[remoteMsid.stream]]);
          } else {
            if (!streams.default) {
              streams.default = new window.MediaStream();
            }
            addTrackToStreamAndFireEvent(track, streams.default);
            receiverList.push([track, rtpReceiver, streams.default]);
          }
        } else {
          // FIXME: actually the receiver should be created later.
          delete transceiver.rtpReceiver;
        }
      }
    });

    if (pc._dtlsRole === undefined) {
      pc._dtlsRole = description.type === 'offer' ? 'active' : 'passive';
    }

    pc._remoteDescription = {
      type: description.type,
      sdp: description.sdp
    };
    if (description.type === 'offer') {
      pc._updateSignalingState('have-remote-offer');
    } else {
      pc._updateSignalingState('stable');
    }
    Object.keys(streams).forEach(function(sid) {
      var stream = streams[sid];
      if (stream.getTracks().length) {
        if (pc.remoteStreams.indexOf(stream) === -1) {
          pc.remoteStreams.push(stream);
          var event = new Event('addstream');
          event.stream = stream;
          window.setTimeout(function() {
            pc._dispatchEvent('addstream', event);
          });
        }

        receiverList.forEach(function(item) {
          var track = item[0];
          var receiver = item[1];
          if (stream.id !== item[2].id) {
            return;
          }
          fireAddTrack(pc, track, receiver, [stream]);
        });
      }
    });
    receiverList.forEach(function(item) {
      if (item[2]) {
        return;
      }
      fireAddTrack(pc, item[0], item[1], []);
    });

    // check whether addIceCandidate({}) was called within four seconds after
    // setRemoteDescription.
    window.setTimeout(function() {
      if (!(pc && pc.transceivers)) {
        return;
      }
      pc.transceivers.forEach(function(transceiver) {
        if (transceiver.iceTransport &&
            transceiver.iceTransport.state === 'new' &&
            transceiver.iceTransport.getRemoteCandidates().length > 0) {
          console.warn('Timeout for addRemoteCandidate. Consider sending ' +
              'an end-of-candidates notification');
          transceiver.iceTransport.addRemoteCandidate({});
        }
      });
    }, 4000);

    return Promise.resolve();
  };

  RTCPeerConnection.prototype.close = function() {
    this.transceivers.forEach(function(transceiver) {
      /* not yet
      if (transceiver.iceGatherer) {
        transceiver.iceGatherer.close();
      }
      */
      if (transceiver.iceTransport) {
        transceiver.iceTransport.stop();
      }
      if (transceiver.dtlsTransport) {
        transceiver.dtlsTransport.stop();
      }
      if (transceiver.rtpSender) {
        transceiver.rtpSender.stop();
      }
      if (transceiver.rtpReceiver) {
        transceiver.rtpReceiver.stop();
      }
    });
    // FIXME: clean up tracks, local streams, remote streams, etc
    this._isClosed = true;
    this._updateSignalingState('closed');
  };

  // Update the signaling state.
  RTCPeerConnection.prototype._updateSignalingState = function(newState) {
    this.signalingState = newState;
    var event = new Event('signalingstatechange');
    this._dispatchEvent('signalingstatechange', event);
  };

  // Determine whether to fire the negotiationneeded event.
  RTCPeerConnection.prototype._maybeFireNegotiationNeeded = function() {
    var pc = this;
    if (this.signalingState !== 'stable' || this.needNegotiation === true) {
      return;
    }
    this.needNegotiation = true;
    window.setTimeout(function() {
      if (pc.needNegotiation) {
        pc.needNegotiation = false;
        var event = new Event('negotiationneeded');
        pc._dispatchEvent('negotiationneeded', event);
      }
    }, 0);
  };

  // Update the ice connection state.
  RTCPeerConnection.prototype._updateIceConnectionState = function() {
    var newState;
    var states = {
      'new': 0,
      closed: 0,
      checking: 0,
      connected: 0,
      completed: 0,
      disconnected: 0,
      failed: 0
    };
    this.transceivers.forEach(function(transceiver) {
      if (transceiver.iceTransport && !transceiver.rejected) {
        states[transceiver.iceTransport.state]++;
      }
    });

    newState = 'new';
    if (states.failed > 0) {
      newState = 'failed';
    } else if (states.checking > 0) {
      newState = 'checking';
    } else if (states.disconnected > 0) {
      newState = 'disconnected';
    } else if (states.new > 0) {
      newState = 'new';
    } else if (states.connected > 0) {
      newState = 'connected';
    } else if (states.completed > 0) {
      newState = 'completed';
    }

    if (newState !== this.iceConnectionState) {
      this.iceConnectionState = newState;
      var event = new Event('iceconnectionstatechange');
      this._dispatchEvent('iceconnectionstatechange', event);
    }
  };

  // Update the connection state.
  RTCPeerConnection.prototype._updateConnectionState = function() {
    var newState;
    var states = {
      'new': 0,
      closed: 0,
      connecting: 0,
      connected: 0,
      completed: 0,
      disconnected: 0,
      failed: 0
    };
    this.transceivers.forEach(function(transceiver) {
      if (transceiver.iceTransport && transceiver.dtlsTransport &&
          !transceiver.rejected) {
        states[transceiver.iceTransport.state]++;
        states[transceiver.dtlsTransport.state]++;
      }
    });
    // ICETransport.completed and connected are the same for this purpose.
    states.connected += states.completed;

    newState = 'new';
    if (states.failed > 0) {
      newState = 'failed';
    } else if (states.connecting > 0) {
      newState = 'connecting';
    } else if (states.disconnected > 0) {
      newState = 'disconnected';
    } else if (states.new > 0) {
      newState = 'new';
    } else if (states.connected > 0) {
      newState = 'connected';
    }

    if (newState !== this.connectionState) {
      this.connectionState = newState;
      var event = new Event('connectionstatechange');
      this._dispatchEvent('connectionstatechange', event);
    }
  };

  RTCPeerConnection.prototype.createOffer = function() {
    var pc = this;

    if (pc._isClosed) {
      return Promise.reject(makeError('InvalidStateError',
          'Can not call createOffer after close'));
    }

    var numAudioTracks = pc.transceivers.filter(function(t) {
      return t.kind === 'audio';
    }).length;
    var numVideoTracks = pc.transceivers.filter(function(t) {
      return t.kind === 'video';
    }).length;

    // Determine number of audio and video tracks we need to send/recv.
    var offerOptions = arguments[0];
    if (offerOptions) {
      // Reject Chrome legacy constraints.
      if (offerOptions.mandatory || offerOptions.optional) {
        throw new TypeError(
            'Legacy mandatory/optional constraints not supported.');
      }
      if (offerOptions.offerToReceiveAudio !== undefined) {
        if (offerOptions.offerToReceiveAudio === true) {
          numAudioTracks = 1;
        } else if (offerOptions.offerToReceiveAudio === false) {
          numAudioTracks = 0;
        } else {
          numAudioTracks = offerOptions.offerToReceiveAudio;
        }
      }
      if (offerOptions.offerToReceiveVideo !== undefined) {
        if (offerOptions.offerToReceiveVideo === true) {
          numVideoTracks = 1;
        } else if (offerOptions.offerToReceiveVideo === false) {
          numVideoTracks = 0;
        } else {
          numVideoTracks = offerOptions.offerToReceiveVideo;
        }
      }
    }

    pc.transceivers.forEach(function(transceiver) {
      if (transceiver.kind === 'audio') {
        numAudioTracks--;
        if (numAudioTracks < 0) {
          transceiver.wantReceive = false;
        }
      } else if (transceiver.kind === 'video') {
        numVideoTracks--;
        if (numVideoTracks < 0) {
          transceiver.wantReceive = false;
        }
      }
    });

    // Create M-lines for recvonly streams.
    while (numAudioTracks > 0 || numVideoTracks > 0) {
      if (numAudioTracks > 0) {
        pc._createTransceiver('audio');
        numAudioTracks--;
      }
      if (numVideoTracks > 0) {
        pc._createTransceiver('video');
        numVideoTracks--;
      }
    }

    var sdp = SDPUtils.writeSessionBoilerplate(pc._sdpSessionId,
        pc._sdpSessionVersion++);
    pc.transceivers.forEach(function(transceiver, sdpMLineIndex) {
      // For each track, create an ice gatherer, ice transport,
      // dtls transport, potentially rtpsender and rtpreceiver.
      var track = transceiver.track;
      var kind = transceiver.kind;
      var mid = transceiver.mid || SDPUtils.generateIdentifier();
      transceiver.mid = mid;

      if (!transceiver.iceGatherer) {
        transceiver.iceGatherer = pc._createIceGatherer(sdpMLineIndex,
            pc.usingBundle);
      }

      var localCapabilities = window.RTCRtpSender.getCapabilities(kind);
      // filter RTX until additional stuff needed for RTX is implemented
      // in adapter.js
      if (edgeVersion < 15019) {
        localCapabilities.codecs = localCapabilities.codecs.filter(
            function(codec) {
              return codec.name !== 'rtx';
            });
      }
      localCapabilities.codecs.forEach(function(codec) {
        // work around https://bugs.chromium.org/p/webrtc/issues/detail?id=6552
        // by adding level-asymmetry-allowed=1
        if (codec.name === 'H264' &&
            codec.parameters['level-asymmetry-allowed'] === undefined) {
          codec.parameters['level-asymmetry-allowed'] = '1';
        }

        // for subsequent offers, we might have to re-use the payload
        // type of the last offer.
        if (transceiver.remoteCapabilities &&
            transceiver.remoteCapabilities.codecs) {
          transceiver.remoteCapabilities.codecs.forEach(function(remoteCodec) {
            if (codec.name.toLowerCase() === remoteCodec.name.toLowerCase() &&
                codec.clockRate === remoteCodec.clockRate) {
              codec.preferredPayloadType = remoteCodec.payloadType;
            }
          });
        }
      });
      localCapabilities.headerExtensions.forEach(function(hdrExt) {
        var remoteExtensions = transceiver.remoteCapabilities &&
            transceiver.remoteCapabilities.headerExtensions || [];
        remoteExtensions.forEach(function(rHdrExt) {
          if (hdrExt.uri === rHdrExt.uri) {
            hdrExt.id = rHdrExt.id;
          }
        });
      });

      // generate an ssrc now, to be used later in rtpSender.send
      var sendEncodingParameters = transceiver.sendEncodingParameters || [{
        ssrc: (2 * sdpMLineIndex + 1) * 1001
      }];
      if (track) {
        // add RTX
        if (edgeVersion >= 15019 && kind === 'video' &&
            !sendEncodingParameters[0].rtx) {
          sendEncodingParameters[0].rtx = {
            ssrc: sendEncodingParameters[0].ssrc + 1
          };
        }
      }

      if (transceiver.wantReceive) {
        transceiver.rtpReceiver = new window.RTCRtpReceiver(
            transceiver.dtlsTransport, kind);
      }

      transceiver.localCapabilities = localCapabilities;
      transceiver.sendEncodingParameters = sendEncodingParameters;
    });

    // always offer BUNDLE and dispose on return if not supported.
    if (pc._config.bundlePolicy !== 'max-compat') {
      sdp += 'a=group:BUNDLE ' + pc.transceivers.map(function(t) {
        return t.mid;
      }).join(' ') + '\r\n';
    }
    sdp += 'a=ice-options:trickle\r\n';

    pc.transceivers.forEach(function(transceiver, sdpMLineIndex) {
      sdp += writeMediaSection(transceiver, transceiver.localCapabilities,
          'offer', transceiver.stream, pc._dtlsRole);
      sdp += 'a=rtcp-rsize\r\n';

      if (transceiver.iceGatherer && pc.iceGatheringState !== 'new' &&
          (sdpMLineIndex === 0 || !pc.usingBundle)) {
        transceiver.iceGatherer.getLocalCandidates().forEach(function(cand) {
          cand.component = 1;
          sdp += 'a=' + SDPUtils.writeCandidate(cand) + '\r\n';
        });

        if (transceiver.iceGatherer.state === 'completed') {
          sdp += 'a=end-of-candidates\r\n';
        }
      }
    });

    var desc = new window.RTCSessionDescription({
      type: 'offer',
      sdp: sdp
    });
    return Promise.resolve(desc);
  };

  RTCPeerConnection.prototype.createAnswer = function() {
    var pc = this;

    if (pc._isClosed) {
      return Promise.reject(makeError('InvalidStateError',
          'Can not call createAnswer after close'));
    }

    if (!(pc.signalingState === 'have-remote-offer' ||
        pc.signalingState === 'have-local-pranswer')) {
      return Promise.reject(makeError('InvalidStateError',
          'Can not call createAnswer in signalingState ' + pc.signalingState));
    }

    var sdp = SDPUtils.writeSessionBoilerplate(pc._sdpSessionId,
        pc._sdpSessionVersion++);
    if (pc.usingBundle) {
      sdp += 'a=group:BUNDLE ' + pc.transceivers.map(function(t) {
        return t.mid;
      }).join(' ') + '\r\n';
    }
    sdp += 'a=ice-options:trickle\r\n';

    var mediaSectionsInOffer = SDPUtils.getMediaSections(
        pc._remoteDescription.sdp).length;
    pc.transceivers.forEach(function(transceiver, sdpMLineIndex) {
      if (sdpMLineIndex + 1 > mediaSectionsInOffer) {
        return;
      }
      if (transceiver.rejected) {
        if (transceiver.kind === 'application') {
          if (transceiver.protocol === 'DTLS/SCTP') { // legacy fmt
            sdp += 'm=application 0 DTLS/SCTP 5000\r\n';
          } else {
            sdp += 'm=application 0 ' + transceiver.protocol +
                ' webrtc-datachannel\r\n';
          }
        } else if (transceiver.kind === 'audio') {
          sdp += 'm=audio 0 UDP/TLS/RTP/SAVPF 0\r\n' +
              'a=rtpmap:0 PCMU/8000\r\n';
        } else if (transceiver.kind === 'video') {
          sdp += 'm=video 0 UDP/TLS/RTP/SAVPF 120\r\n' +
              'a=rtpmap:120 VP8/90000\r\n';
        }
        sdp += 'c=IN IP4 0.0.0.0\r\n' +
            'a=inactive\r\n' +
            'a=mid:' + transceiver.mid + '\r\n';
        return;
      }

      // FIXME: look at direction.
      if (transceiver.stream) {
        var localTrack;
        if (transceiver.kind === 'audio') {
          localTrack = transceiver.stream.getAudioTracks()[0];
        } else if (transceiver.kind === 'video') {
          localTrack = transceiver.stream.getVideoTracks()[0];
        }
        if (localTrack) {
          // add RTX
          if (edgeVersion >= 15019 && transceiver.kind === 'video' &&
              !transceiver.sendEncodingParameters[0].rtx) {
            transceiver.sendEncodingParameters[0].rtx = {
              ssrc: transceiver.sendEncodingParameters[0].ssrc + 1
            };
          }
        }
      }

      // Calculate intersection of capabilities.
      var commonCapabilities = getCommonCapabilities(
          transceiver.localCapabilities,
          transceiver.remoteCapabilities);

      var hasRtx = commonCapabilities.codecs.filter(function(c) {
        return c.name.toLowerCase() === 'rtx';
      }).length;
      if (!hasRtx && transceiver.sendEncodingParameters[0].rtx) {
        delete transceiver.sendEncodingParameters[0].rtx;
      }

      sdp += writeMediaSection(transceiver, commonCapabilities,
          'answer', transceiver.stream, pc._dtlsRole);
      if (transceiver.rtcpParameters &&
          transceiver.rtcpParameters.reducedSize) {
        sdp += 'a=rtcp-rsize\r\n';
      }
    });

    var desc = new window.RTCSessionDescription({
      type: 'answer',
      sdp: sdp
    });
    return Promise.resolve(desc);
  };

  RTCPeerConnection.prototype.addIceCandidate = function(candidate) {
    var pc = this;
    var sections;
    if (candidate && !(candidate.sdpMLineIndex !== undefined ||
        candidate.sdpMid)) {
      return Promise.reject(new TypeError('sdpMLineIndex or sdpMid required'));
    }

    // TODO: needs to go into ops queue.
    return new Promise(function(resolve, reject) {
      if (!pc._remoteDescription) {
        return reject(makeError('InvalidStateError',
            'Can not add ICE candidate without a remote description'));
      } else if (!candidate || candidate.candidate === '') {
        for (var j = 0; j < pc.transceivers.length; j++) {
          if (pc.transceivers[j].rejected) {
            continue;
          }
          pc.transceivers[j].iceTransport.addRemoteCandidate({});
          sections = SDPUtils.getMediaSections(pc._remoteDescription.sdp);
          sections[j] += 'a=end-of-candidates\r\n';
          pc._remoteDescription.sdp =
              SDPUtils.getDescription(pc._remoteDescription.sdp) +
              sections.join('');
          if (pc.usingBundle) {
            break;
          }
        }
      } else {
        var sdpMLineIndex = candidate.sdpMLineIndex;
        if (candidate.sdpMid) {
          for (var i = 0; i < pc.transceivers.length; i++) {
            if (pc.transceivers[i].mid === candidate.sdpMid) {
              sdpMLineIndex = i;
              break;
            }
          }
        }
        var transceiver = pc.transceivers[sdpMLineIndex];
        if (transceiver) {
          if (transceiver.rejected) {
            return resolve();
          }
          var cand = Object.keys(candidate.candidate).length > 0 ?
              SDPUtils.parseCandidate(candidate.candidate) : {};
          // Ignore Chrome's invalid candidates since Edge does not like them.
          if (cand.protocol === 'tcp' && (cand.port === 0 || cand.port === 9)) {
            return resolve();
          }
          // Ignore RTCP candidates, we assume RTCP-MUX.
          if (cand.component && cand.component !== 1) {
            return resolve();
          }
          // when using bundle, avoid adding candidates to the wrong
          // ice transport. And avoid adding candidates added in the SDP.
          if (sdpMLineIndex === 0 || (sdpMLineIndex > 0 &&
              transceiver.iceTransport !== pc.transceivers[0].iceTransport)) {
            if (!maybeAddCandidate(transceiver.iceTransport, cand)) {
              return reject(makeError('OperationError',
                  'Can not add ICE candidate'));
            }
          }

          // update the remoteDescription.
          var candidateString = candidate.candidate.trim();
          if (candidateString.indexOf('a=') === 0) {
            candidateString = candidateString.substr(2);
          }
          sections = SDPUtils.getMediaSections(pc._remoteDescription.sdp);
          sections[sdpMLineIndex] += 'a=' +
              (cand.type ? candidateString : 'end-of-candidates')
              + '\r\n';
          pc._remoteDescription.sdp =
              SDPUtils.getDescription(pc._remoteDescription.sdp) +
              sections.join('');
        } else {
          return reject(makeError('OperationError',
              'Can not add ICE candidate'));
        }
      }
      resolve();
    });
  };

  RTCPeerConnection.prototype.getStats = function(selector) {
    if (selector && selector instanceof window.MediaStreamTrack) {
      var senderOrReceiver = null;
      this.transceivers.forEach(function(transceiver) {
        if (transceiver.rtpSender &&
            transceiver.rtpSender.track === selector) {
          senderOrReceiver = transceiver.rtpSender;
        } else if (transceiver.rtpReceiver &&
            transceiver.rtpReceiver.track === selector) {
          senderOrReceiver = transceiver.rtpReceiver;
        }
      });
      if (!senderOrReceiver) {
        throw makeError('InvalidAccessError', 'Invalid selector.');
      }
      return senderOrReceiver.getStats();
    }

    var promises = [];
    this.transceivers.forEach(function(transceiver) {
      ['rtpSender', 'rtpReceiver', 'iceGatherer', 'iceTransport',
          'dtlsTransport'].forEach(function(method) {
            if (transceiver[method]) {
              promises.push(transceiver[method].getStats());
            }
          });
    });
    return Promise.all(promises).then(function(allStats) {
      var results = new Map();
      allStats.forEach(function(stats) {
        stats.forEach(function(stat) {
          results.set(stat.id, stat);
        });
      });
      return results;
    });
  };

  // fix low-level stat names and return Map instead of object.
  var ortcObjects = ['RTCRtpSender', 'RTCRtpReceiver', 'RTCIceGatherer',
    'RTCIceTransport', 'RTCDtlsTransport'];
  ortcObjects.forEach(function(ortcObjectName) {
    var obj = window[ortcObjectName];
    if (obj && obj.prototype && obj.prototype.getStats) {
      var nativeGetstats = obj.prototype.getStats;
      obj.prototype.getStats = function() {
        return nativeGetstats.apply(this)
        .then(function(nativeStats) {
          var mapStats = new Map();
          Object.keys(nativeStats).forEach(function(id) {
            nativeStats[id].type = fixStatsType(nativeStats[id]);
            mapStats.set(id, nativeStats[id]);
          });
          return mapStats;
        });
      };
    }
  });

  // legacy callback shims. Should be moved to adapter.js some days.
  var methods = ['createOffer', 'createAnswer'];
  methods.forEach(function(method) {
    var nativeMethod = RTCPeerConnection.prototype[method];
    RTCPeerConnection.prototype[method] = function() {
      var args = arguments;
      if (typeof args[0] === 'function' ||
          typeof args[1] === 'function') { // legacy
        return nativeMethod.apply(this, [arguments[2]])
        .then(function(description) {
          if (typeof args[0] === 'function') {
            args[0].apply(null, [description]);
          }
        }, function(error) {
          if (typeof args[1] === 'function') {
            args[1].apply(null, [error]);
          }
        });
      }
      return nativeMethod.apply(this, arguments);
    };
  });

  methods = ['setLocalDescription', 'setRemoteDescription', 'addIceCandidate'];
  methods.forEach(function(method) {
    var nativeMethod = RTCPeerConnection.prototype[method];
    RTCPeerConnection.prototype[method] = function() {
      var args = arguments;
      if (typeof args[1] === 'function' ||
          typeof args[2] === 'function') { // legacy
        return nativeMethod.apply(this, arguments)
        .then(function() {
          if (typeof args[1] === 'function') {
            args[1].apply(null);
          }
        }, function(error) {
          if (typeof args[2] === 'function') {
            args[2].apply(null, [error]);
          }
        });
      }
      return nativeMethod.apply(this, arguments);
    };
  });

  // getStats is special. It doesn't have a spec legacy method yet we support
  // getStats(something, cb) without error callbacks.
  ['getStats'].forEach(function(method) {
    var nativeMethod = RTCPeerConnection.prototype[method];
    RTCPeerConnection.prototype[method] = function() {
      var args = arguments;
      if (typeof args[1] === 'function') {
        return nativeMethod.apply(this, arguments)
        .then(function() {
          if (typeof args[1] === 'function') {
            args[1].apply(null);
          }
        });
      }
      return nativeMethod.apply(this, arguments);
    };
  });

  return RTCPeerConnection;
};

},{"sdp":40}],40:[function(require,module,exports){
/* eslint-env node */
'use strict';

// SDP helpers.
var SDPUtils = {};

// Generate an alphanumeric identifier for cname or mids.
// TODO: use UUIDs instead? https://gist.github.com/jed/982883
SDPUtils.generateIdentifier = function() {
  return Math.random().toString(36).substr(2, 10);
};

// The RTCP CNAME used by all peerconnections from the same JS.
SDPUtils.localCName = SDPUtils.generateIdentifier();

// Splits SDP into lines, dealing with both CRLF and LF.
SDPUtils.splitLines = function(blob) {
  return blob.trim().split('\n').map(function(line) {
    return line.trim();
  });
};
// Splits SDP into sessionpart and mediasections. Ensures CRLF.
SDPUtils.splitSections = function(blob) {
  var parts = blob.split('\nm=');
  return parts.map(function(part, index) {
    return (index > 0 ? 'm=' + part : part).trim() + '\r\n';
  });
};

// returns the session description.
SDPUtils.getDescription = function(blob) {
  var sections = SDPUtils.splitSections(blob);
  return sections && sections[0];
};

// returns the individual media sections.
SDPUtils.getMediaSections = function(blob) {
  var sections = SDPUtils.splitSections(blob);
  sections.shift();
  return sections;
};

// Returns lines that start with a certain prefix.
SDPUtils.matchPrefix = function(blob, prefix) {
  return SDPUtils.splitLines(blob).filter(function(line) {
    return line.indexOf(prefix) === 0;
  });
};

// Parses an ICE candidate line. Sample input:
// candidate:702786350 2 udp 41819902 8.8.8.8 60769 typ relay raddr 8.8.8.8
// rport 55996"
SDPUtils.parseCandidate = function(line) {
  var parts;
  // Parse both variants.
  if (line.indexOf('a=candidate:') === 0) {
    parts = line.substring(12).split(' ');
  } else {
    parts = line.substring(10).split(' ');
  }

  var candidate = {
    foundation: parts[0],
    component: parseInt(parts[1], 10),
    protocol: parts[2].toLowerCase(),
    priority: parseInt(parts[3], 10),
    ip: parts[4],
    address: parts[4], // address is an alias for ip.
    port: parseInt(parts[5], 10),
    // skip parts[6] == 'typ'
    type: parts[7]
  };

  for (var i = 8; i < parts.length; i += 2) {
    switch (parts[i]) {
      case 'raddr':
        candidate.relatedAddress = parts[i + 1];
        break;
      case 'rport':
        candidate.relatedPort = parseInt(parts[i + 1], 10);
        break;
      case 'tcptype':
        candidate.tcpType = parts[i + 1];
        break;
      case 'ufrag':
        candidate.ufrag = parts[i + 1]; // for backward compability.
        candidate.usernameFragment = parts[i + 1];
        break;
      default: // extension handling, in particular ufrag
        candidate[parts[i]] = parts[i + 1];
        break;
    }
  }
  return candidate;
};

// Translates a candidate object into SDP candidate attribute.
SDPUtils.writeCandidate = function(candidate) {
  var sdp = [];
  sdp.push(candidate.foundation);
  sdp.push(candidate.component);
  sdp.push(candidate.protocol.toUpperCase());
  sdp.push(candidate.priority);
  sdp.push(candidate.address || candidate.ip);
  sdp.push(candidate.port);

  var type = candidate.type;
  sdp.push('typ');
  sdp.push(type);
  if (type !== 'host' && candidate.relatedAddress &&
      candidate.relatedPort) {
    sdp.push('raddr');
    sdp.push(candidate.relatedAddress);
    sdp.push('rport');
    sdp.push(candidate.relatedPort);
  }
  if (candidate.tcpType && candidate.protocol.toLowerCase() === 'tcp') {
    sdp.push('tcptype');
    sdp.push(candidate.tcpType);
  }
  if (candidate.usernameFragment || candidate.ufrag) {
    sdp.push('ufrag');
    sdp.push(candidate.usernameFragment || candidate.ufrag);
  }
  return 'candidate:' + sdp.join(' ');
};

// Parses an ice-options line, returns an array of option tags.
// a=ice-options:foo bar
SDPUtils.parseIceOptions = function(line) {
  return line.substr(14).split(' ');
};

// Parses an rtpmap line, returns RTCRtpCoddecParameters. Sample input:
// a=rtpmap:111 opus/48000/2
SDPUtils.parseRtpMap = function(line) {
  var parts = line.substr(9).split(' ');
  var parsed = {
    payloadType: parseInt(parts.shift(), 10) // was: id
  };

  parts = parts[0].split('/');

  parsed.name = parts[0];
  parsed.clockRate = parseInt(parts[1], 10); // was: clockrate
  parsed.channels = parts.length === 3 ? parseInt(parts[2], 10) : 1;
  // legacy alias, got renamed back to channels in ORTC.
  parsed.numChannels = parsed.channels;
  return parsed;
};

// Generate an a=rtpmap line from RTCRtpCodecCapability or
// RTCRtpCodecParameters.
SDPUtils.writeRtpMap = function(codec) {
  var pt = codec.payloadType;
  if (codec.preferredPayloadType !== undefined) {
    pt = codec.preferredPayloadType;
  }
  var channels = codec.channels || codec.numChannels || 1;
  return 'a=rtpmap:' + pt + ' ' + codec.name + '/' + codec.clockRate +
      (channels !== 1 ? '/' + channels : '') + '\r\n';
};

// Parses an a=extmap line (headerextension from RFC 5285). Sample input:
// a=extmap:2 urn:ietf:params:rtp-hdrext:toffset
// a=extmap:2/sendonly urn:ietf:params:rtp-hdrext:toffset
SDPUtils.parseExtmap = function(line) {
  var parts = line.substr(9).split(' ');
  return {
    id: parseInt(parts[0], 10),
    direction: parts[0].indexOf('/') > 0 ? parts[0].split('/')[1] : 'sendrecv',
    uri: parts[1]
  };
};

// Generates a=extmap line from RTCRtpHeaderExtensionParameters or
// RTCRtpHeaderExtension.
SDPUtils.writeExtmap = function(headerExtension) {
  return 'a=extmap:' + (headerExtension.id || headerExtension.preferredId) +
      (headerExtension.direction && headerExtension.direction !== 'sendrecv'
        ? '/' + headerExtension.direction
        : '') +
      ' ' + headerExtension.uri + '\r\n';
};

// Parses an ftmp line, returns dictionary. Sample input:
// a=fmtp:96 vbr=on;cng=on
// Also deals with vbr=on; cng=on
SDPUtils.parseFmtp = function(line) {
  var parsed = {};
  var kv;
  var parts = line.substr(line.indexOf(' ') + 1).split(';');
  for (var j = 0; j < parts.length; j++) {
    kv = parts[j].trim().split('=');
    parsed[kv[0].trim()] = kv[1];
  }
  return parsed;
};

// Generates an a=ftmp line from RTCRtpCodecCapability or RTCRtpCodecParameters.
SDPUtils.writeFmtp = function(codec) {
  var line = '';
  var pt = codec.payloadType;
  if (codec.preferredPayloadType !== undefined) {
    pt = codec.preferredPayloadType;
  }
  if (codec.parameters && Object.keys(codec.parameters).length) {
    var params = [];
    Object.keys(codec.parameters).forEach(function(param) {
      if (codec.parameters[param]) {
        params.push(param + '=' + codec.parameters[param]);
      } else {
        params.push(param);
      }
    });
    line += 'a=fmtp:' + pt + ' ' + params.join(';') + '\r\n';
  }
  return line;
};

// Parses an rtcp-fb line, returns RTCPRtcpFeedback object. Sample input:
// a=rtcp-fb:98 nack rpsi
SDPUtils.parseRtcpFb = function(line) {
  var parts = line.substr(line.indexOf(' ') + 1).split(' ');
  return {
    type: parts.shift(),
    parameter: parts.join(' ')
  };
};
// Generate a=rtcp-fb lines from RTCRtpCodecCapability or RTCRtpCodecParameters.
SDPUtils.writeRtcpFb = function(codec) {
  var lines = '';
  var pt = codec.payloadType;
  if (codec.preferredPayloadType !== undefined) {
    pt = codec.preferredPayloadType;
  }
  if (codec.rtcpFeedback && codec.rtcpFeedback.length) {
    // FIXME: special handling for trr-int?
    codec.rtcpFeedback.forEach(function(fb) {
      lines += 'a=rtcp-fb:' + pt + ' ' + fb.type +
      (fb.parameter && fb.parameter.length ? ' ' + fb.parameter : '') +
          '\r\n';
    });
  }
  return lines;
};

// Parses an RFC 5576 ssrc media attribute. Sample input:
// a=ssrc:3735928559 cname:something
SDPUtils.parseSsrcMedia = function(line) {
  var sp = line.indexOf(' ');
  var parts = {
    ssrc: parseInt(line.substr(7, sp - 7), 10)
  };
  var colon = line.indexOf(':', sp);
  if (colon > -1) {
    parts.attribute = line.substr(sp + 1, colon - sp - 1);
    parts.value = line.substr(colon + 1);
  } else {
    parts.attribute = line.substr(sp + 1);
  }
  return parts;
};

SDPUtils.parseSsrcGroup = function(line) {
  var parts = line.substr(13).split(' ');
  return {
    semantics: parts.shift(),
    ssrcs: parts.map(function(ssrc) {
      return parseInt(ssrc, 10);
    })
  };
};

// Extracts the MID (RFC 5888) from a media section.
// returns the MID or undefined if no mid line was found.
SDPUtils.getMid = function(mediaSection) {
  var mid = SDPUtils.matchPrefix(mediaSection, 'a=mid:')[0];
  if (mid) {
    return mid.substr(6);
  }
};

SDPUtils.parseFingerprint = function(line) {
  var parts = line.substr(14).split(' ');
  return {
    algorithm: parts[0].toLowerCase(), // algorithm is case-sensitive in Edge.
    value: parts[1]
  };
};

// Extracts DTLS parameters from SDP media section or sessionpart.
// FIXME: for consistency with other functions this should only
//   get the fingerprint line as input. See also getIceParameters.
SDPUtils.getDtlsParameters = function(mediaSection, sessionpart) {
  var lines = SDPUtils.matchPrefix(mediaSection + sessionpart,
    'a=fingerprint:');
  // Note: a=setup line is ignored since we use the 'auto' role.
  // Note2: 'algorithm' is not case sensitive except in Edge.
  return {
    role: 'auto',
    fingerprints: lines.map(SDPUtils.parseFingerprint)
  };
};

// Serializes DTLS parameters to SDP.
SDPUtils.writeDtlsParameters = function(params, setupType) {
  var sdp = 'a=setup:' + setupType + '\r\n';
  params.fingerprints.forEach(function(fp) {
    sdp += 'a=fingerprint:' + fp.algorithm + ' ' + fp.value + '\r\n';
  });
  return sdp;
};

// Parses a=crypto lines into
//   https://rawgit.com/aboba/edgertc/master/msortc-rs4.html#dictionary-rtcsrtpsdesparameters-members
SDPUtils.parseCryptoLine = function(line) {
  var parts = line.substr(9).split(' ');
  return {
    tag: parseInt(parts[0], 10),
    cryptoSuite: parts[1],
    keyParams: parts[2],
    sessionParams: parts.slice(3),
  };
};

SDPUtils.writeCryptoLine = function(parameters) {
  return 'a=crypto:' + parameters.tag + ' ' +
    parameters.cryptoSuite + ' ' +
    (typeof parameters.keyParams === 'object'
      ? SDPUtils.writeCryptoKeyParams(parameters.keyParams)
      : parameters.keyParams) +
    (parameters.sessionParams ? ' ' + parameters.sessionParams.join(' ') : '') +
    '\r\n';
};

// Parses the crypto key parameters into
//   https://rawgit.com/aboba/edgertc/master/msortc-rs4.html#rtcsrtpkeyparam*
SDPUtils.parseCryptoKeyParams = function(keyParams) {
  if (keyParams.indexOf('inline:') !== 0) {
    return null;
  }
  var parts = keyParams.substr(7).split('|');
  return {
    keyMethod: 'inline',
    keySalt: parts[0],
    lifeTime: parts[1],
    mkiValue: parts[2] ? parts[2].split(':')[0] : undefined,
    mkiLength: parts[2] ? parts[2].split(':')[1] : undefined,
  };
};

SDPUtils.writeCryptoKeyParams = function(keyParams) {
  return keyParams.keyMethod + ':'
    + keyParams.keySalt +
    (keyParams.lifeTime ? '|' + keyParams.lifeTime : '') +
    (keyParams.mkiValue && keyParams.mkiLength
      ? '|' + keyParams.mkiValue + ':' + keyParams.mkiLength
      : '');
};

// Extracts all SDES paramters.
SDPUtils.getCryptoParameters = function(mediaSection, sessionpart) {
  var lines = SDPUtils.matchPrefix(mediaSection + sessionpart,
    'a=crypto:');
  return lines.map(SDPUtils.parseCryptoLine);
};

// Parses ICE information from SDP media section or sessionpart.
// FIXME: for consistency with other functions this should only
//   get the ice-ufrag and ice-pwd lines as input.
SDPUtils.getIceParameters = function(mediaSection, sessionpart) {
  var ufrag = SDPUtils.matchPrefix(mediaSection + sessionpart,
    'a=ice-ufrag:')[0];
  var pwd = SDPUtils.matchPrefix(mediaSection + sessionpart,
    'a=ice-pwd:')[0];
  if (!(ufrag && pwd)) {
    return null;
  }
  return {
    usernameFragment: ufrag.substr(12),
    password: pwd.substr(10),
  };
};

// Serializes ICE parameters to SDP.
SDPUtils.writeIceParameters = function(params) {
  return 'a=ice-ufrag:' + params.usernameFragment + '\r\n' +
      'a=ice-pwd:' + params.password + '\r\n';
};

// Parses the SDP media section and returns RTCRtpParameters.
SDPUtils.parseRtpParameters = function(mediaSection) {
  var description = {
    codecs: [],
    headerExtensions: [],
    fecMechanisms: [],
    rtcp: []
  };
  var lines = SDPUtils.splitLines(mediaSection);
  var mline = lines[0].split(' ');
  for (var i = 3; i < mline.length; i++) { // find all codecs from mline[3..]
    var pt = mline[i];
    var rtpmapline = SDPUtils.matchPrefix(
      mediaSection, 'a=rtpmap:' + pt + ' ')[0];
    if (rtpmapline) {
      var codec = SDPUtils.parseRtpMap(rtpmapline);
      var fmtps = SDPUtils.matchPrefix(
        mediaSection, 'a=fmtp:' + pt + ' ');
      // Only the first a=fmtp:<pt> is considered.
      codec.parameters = fmtps.length ? SDPUtils.parseFmtp(fmtps[0]) : {};
      codec.rtcpFeedback = SDPUtils.matchPrefix(
        mediaSection, 'a=rtcp-fb:' + pt + ' ')
        .map(SDPUtils.parseRtcpFb);
      description.codecs.push(codec);
      // parse FEC mechanisms from rtpmap lines.
      switch (codec.name.toUpperCase()) {
        case 'RED':
        case 'ULPFEC':
          description.fecMechanisms.push(codec.name.toUpperCase());
          break;
        default: // only RED and ULPFEC are recognized as FEC mechanisms.
          break;
      }
    }
  }
  SDPUtils.matchPrefix(mediaSection, 'a=extmap:').forEach(function(line) {
    description.headerExtensions.push(SDPUtils.parseExtmap(line));
  });
  // FIXME: parse rtcp.
  return description;
};

// Generates parts of the SDP media section describing the capabilities /
// parameters.
SDPUtils.writeRtpDescription = function(kind, caps) {
  var sdp = '';

  // Build the mline.
  sdp += 'm=' + kind + ' ';
  sdp += caps.codecs.length > 0 ? '9' : '0'; // reject if no codecs.
  sdp += ' UDP/TLS/RTP/SAVPF ';
  sdp += caps.codecs.map(function(codec) {
    if (codec.preferredPayloadType !== undefined) {
      return codec.preferredPayloadType;
    }
    return codec.payloadType;
  }).join(' ') + '\r\n';

  sdp += 'c=IN IP4 0.0.0.0\r\n';
  sdp += 'a=rtcp:9 IN IP4 0.0.0.0\r\n';

  // Add a=rtpmap lines for each codec. Also fmtp and rtcp-fb.
  caps.codecs.forEach(function(codec) {
    sdp += SDPUtils.writeRtpMap(codec);
    sdp += SDPUtils.writeFmtp(codec);
    sdp += SDPUtils.writeRtcpFb(codec);
  });
  var maxptime = 0;
  caps.codecs.forEach(function(codec) {
    if (codec.maxptime > maxptime) {
      maxptime = codec.maxptime;
    }
  });
  if (maxptime > 0) {
    sdp += 'a=maxptime:' + maxptime + '\r\n';
  }
  sdp += 'a=rtcp-mux\r\n';

  if (caps.headerExtensions) {
    caps.headerExtensions.forEach(function(extension) {
      sdp += SDPUtils.writeExtmap(extension);
    });
  }
  // FIXME: write fecMechanisms.
  return sdp;
};

// Parses the SDP media section and returns an array of
// RTCRtpEncodingParameters.
SDPUtils.parseRtpEncodingParameters = function(mediaSection) {
  var encodingParameters = [];
  var description = SDPUtils.parseRtpParameters(mediaSection);
  var hasRed = description.fecMechanisms.indexOf('RED') !== -1;
  var hasUlpfec = description.fecMechanisms.indexOf('ULPFEC') !== -1;

  // filter a=ssrc:... cname:, ignore PlanB-msid
  var ssrcs = SDPUtils.matchPrefix(mediaSection, 'a=ssrc:')
    .map(function(line) {
      return SDPUtils.parseSsrcMedia(line);
    })
    .filter(function(parts) {
      return parts.attribute === 'cname';
    });
  var primarySsrc = ssrcs.length > 0 && ssrcs[0].ssrc;
  var secondarySsrc;

  var flows = SDPUtils.matchPrefix(mediaSection, 'a=ssrc-group:FID')
    .map(function(line) {
      var parts = line.substr(17).split(' ');
      return parts.map(function(part) {
        return parseInt(part, 10);
      });
    });
  if (flows.length > 0 && flows[0].length > 1 && flows[0][0] === primarySsrc) {
    secondarySsrc = flows[0][1];
  }

  description.codecs.forEach(function(codec) {
    if (codec.name.toUpperCase() === 'RTX' && codec.parameters.apt) {
      var encParam = {
        ssrc: primarySsrc,
        codecPayloadType: parseInt(codec.parameters.apt, 10)
      };
      if (primarySsrc && secondarySsrc) {
        encParam.rtx = {ssrc: secondarySsrc};
      }
      encodingParameters.push(encParam);
      if (hasRed) {
        encParam = JSON.parse(JSON.stringify(encParam));
        encParam.fec = {
          ssrc: primarySsrc,
          mechanism: hasUlpfec ? 'red+ulpfec' : 'red'
        };
        encodingParameters.push(encParam);
      }
    }
  });
  if (encodingParameters.length === 0 && primarySsrc) {
    encodingParameters.push({
      ssrc: primarySsrc
    });
  }

  // we support both b=AS and b=TIAS but interpret AS as TIAS.
  var bandwidth = SDPUtils.matchPrefix(mediaSection, 'b=');
  if (bandwidth.length) {
    if (bandwidth[0].indexOf('b=TIAS:') === 0) {
      bandwidth = parseInt(bandwidth[0].substr(7), 10);
    } else if (bandwidth[0].indexOf('b=AS:') === 0) {
      // use formula from JSEP to convert b=AS to TIAS value.
      bandwidth = parseInt(bandwidth[0].substr(5), 10) * 1000 * 0.95
          - (50 * 40 * 8);
    } else {
      bandwidth = undefined;
    }
    encodingParameters.forEach(function(params) {
      params.maxBitrate = bandwidth;
    });
  }
  return encodingParameters;
};

// parses http://draft.ortc.org/#rtcrtcpparameters*
SDPUtils.parseRtcpParameters = function(mediaSection) {
  var rtcpParameters = {};

  // Gets the first SSRC. Note tha with RTX there might be multiple
  // SSRCs.
  var remoteSsrc = SDPUtils.matchPrefix(mediaSection, 'a=ssrc:')
    .map(function(line) {
      return SDPUtils.parseSsrcMedia(line);
    })
    .filter(function(obj) {
      return obj.attribute === 'cname';
    })[0];
  if (remoteSsrc) {
    rtcpParameters.cname = remoteSsrc.value;
    rtcpParameters.ssrc = remoteSsrc.ssrc;
  }

  // Edge uses the compound attribute instead of reducedSize
  // compound is !reducedSize
  var rsize = SDPUtils.matchPrefix(mediaSection, 'a=rtcp-rsize');
  rtcpParameters.reducedSize = rsize.length > 0;
  rtcpParameters.compound = rsize.length === 0;

  // parses the rtcp-mux attrіbute.
  // Note that Edge does not support unmuxed RTCP.
  var mux = SDPUtils.matchPrefix(mediaSection, 'a=rtcp-mux');
  rtcpParameters.mux = mux.length > 0;

  return rtcpParameters;
};

// parses either a=msid: or a=ssrc:... msid lines and returns
// the id of the MediaStream and MediaStreamTrack.
SDPUtils.parseMsid = function(mediaSection) {
  var parts;
  var spec = SDPUtils.matchPrefix(mediaSection, 'a=msid:');
  if (spec.length === 1) {
    parts = spec[0].substr(7).split(' ');
    return {stream: parts[0], track: parts[1]};
  }
  var planB = SDPUtils.matchPrefix(mediaSection, 'a=ssrc:')
    .map(function(line) {
      return SDPUtils.parseSsrcMedia(line);
    })
    .filter(function(msidParts) {
      return msidParts.attribute === 'msid';
    });
  if (planB.length > 0) {
    parts = planB[0].value.split(' ');
    return {stream: parts[0], track: parts[1]};
  }
};

// SCTP
// parses draft-ietf-mmusic-sctp-sdp-26 first and falls back
// to draft-ietf-mmusic-sctp-sdp-05
SDPUtils.parseSctpDescription = function(mediaSection) {
  var mline = SDPUtils.parseMLine(mediaSection);
  var maxSizeLine = SDPUtils.matchPrefix(mediaSection, 'a=max-message-size:');
  var maxMessageSize;
  if (maxSizeLine.length > 0) {
    maxMessageSize = parseInt(maxSizeLine[0].substr(19), 10);
  }
  if (isNaN(maxMessageSize)) {
    maxMessageSize = 65536;
  }
  var sctpPort = SDPUtils.matchPrefix(mediaSection, 'a=sctp-port:');
  if (sctpPort.length > 0) {
    return {
      port: parseInt(sctpPort[0].substr(12), 10),
      protocol: mline.fmt,
      maxMessageSize: maxMessageSize
    };
  }
  var sctpMapLines = SDPUtils.matchPrefix(mediaSection, 'a=sctpmap:');
  if (sctpMapLines.length > 0) {
    var parts = SDPUtils.matchPrefix(mediaSection, 'a=sctpmap:')[0]
      .substr(10)
      .split(' ');
    return {
      port: parseInt(parts[0], 10),
      protocol: parts[1],
      maxMessageSize: maxMessageSize
    };
  }
};

// SCTP
// outputs the draft-ietf-mmusic-sctp-sdp-26 version that all browsers
// support by now receiving in this format, unless we originally parsed
// as the draft-ietf-mmusic-sctp-sdp-05 format (indicated by the m-line
// protocol of DTLS/SCTP -- without UDP/ or TCP/)
SDPUtils.writeSctpDescription = function(media, sctp) {
  var output = [];
  if (media.protocol !== 'DTLS/SCTP') {
    output = [
      'm=' + media.kind + ' 9 ' + media.protocol + ' ' + sctp.protocol + '\r\n',
      'c=IN IP4 0.0.0.0\r\n',
      'a=sctp-port:' + sctp.port + '\r\n'
    ];
  } else {
    output = [
      'm=' + media.kind + ' 9 ' + media.protocol + ' ' + sctp.port + '\r\n',
      'c=IN IP4 0.0.0.0\r\n',
      'a=sctpmap:' + sctp.port + ' ' + sctp.protocol + ' 65535\r\n'
    ];
  }
  if (sctp.maxMessageSize !== undefined) {
    output.push('a=max-message-size:' + sctp.maxMessageSize + '\r\n');
  }
  return output.join('');
};

// Generate a session ID for SDP.
// https://tools.ietf.org/html/draft-ietf-rtcweb-jsep-20#section-5.2.1
// recommends using a cryptographically random +ve 64-bit value
// but right now this should be acceptable and within the right range
SDPUtils.generateSessionId = function() {
  return Math.random().toString().substr(2, 21);
};

// Write boilder plate for start of SDP
// sessId argument is optional - if not supplied it will
// be generated randomly
// sessVersion is optional and defaults to 2
// sessUser is optional and defaults to 'thisisadapterortc'
SDPUtils.writeSessionBoilerplate = function(sessId, sessVer, sessUser) {
  var sessionId;
  var version = sessVer !== undefined ? sessVer : 2;
  if (sessId) {
    sessionId = sessId;
  } else {
    sessionId = SDPUtils.generateSessionId();
  }
  var user = sessUser || 'thisisadapterortc';
  // FIXME: sess-id should be an NTP timestamp.
  return 'v=0\r\n' +
      'o=' + user + ' ' + sessionId + ' ' + version +
        ' IN IP4 127.0.0.1\r\n' +
      's=-\r\n' +
      't=0 0\r\n';
};

SDPUtils.writeMediaSection = function(transceiver, caps, type, stream) {
  var sdp = SDPUtils.writeRtpDescription(transceiver.kind, caps);

  // Map ICE parameters (ufrag, pwd) to SDP.
  sdp += SDPUtils.writeIceParameters(
    transceiver.iceGatherer.getLocalParameters());

  // Map DTLS parameters to SDP.
  sdp += SDPUtils.writeDtlsParameters(
    transceiver.dtlsTransport.getLocalParameters(),
    type === 'offer' ? 'actpass' : 'active');

  sdp += 'a=mid:' + transceiver.mid + '\r\n';

  if (transceiver.direction) {
    sdp += 'a=' + transceiver.direction + '\r\n';
  } else if (transceiver.rtpSender && transceiver.rtpReceiver) {
    sdp += 'a=sendrecv\r\n';
  } else if (transceiver.rtpSender) {
    sdp += 'a=sendonly\r\n';
  } else if (transceiver.rtpReceiver) {
    sdp += 'a=recvonly\r\n';
  } else {
    sdp += 'a=inactive\r\n';
  }

  if (transceiver.rtpSender) {
    // spec.
    var msid = 'msid:' + stream.id + ' ' +
        transceiver.rtpSender.track.id + '\r\n';
    sdp += 'a=' + msid;

    // for Chrome.
    sdp += 'a=ssrc:' + transceiver.sendEncodingParameters[0].ssrc +
        ' ' + msid;
    if (transceiver.sendEncodingParameters[0].rtx) {
      sdp += 'a=ssrc:' + transceiver.sendEncodingParameters[0].rtx.ssrc +
          ' ' + msid;
      sdp += 'a=ssrc-group:FID ' +
          transceiver.sendEncodingParameters[0].ssrc + ' ' +
          transceiver.sendEncodingParameters[0].rtx.ssrc +
          '\r\n';
    }
  }
  // FIXME: this should be written by writeRtpDescription.
  sdp += 'a=ssrc:' + transceiver.sendEncodingParameters[0].ssrc +
      ' cname:' + SDPUtils.localCName + '\r\n';
  if (transceiver.rtpSender && transceiver.sendEncodingParameters[0].rtx) {
    sdp += 'a=ssrc:' + transceiver.sendEncodingParameters[0].rtx.ssrc +
        ' cname:' + SDPUtils.localCName + '\r\n';
  }
  return sdp;
};

// Gets the direction from the mediaSection or the sessionpart.
SDPUtils.getDirection = function(mediaSection, sessionpart) {
  // Look for sendrecv, sendonly, recvonly, inactive, default to sendrecv.
  var lines = SDPUtils.splitLines(mediaSection);
  for (var i = 0; i < lines.length; i++) {
    switch (lines[i]) {
      case 'a=sendrecv':
      case 'a=sendonly':
      case 'a=recvonly':
      case 'a=inactive':
        return lines[i].substr(2);
      default:
        // FIXME: What should happen here?
    }
  }
  if (sessionpart) {
    return SDPUtils.getDirection(sessionpart);
  }
  return 'sendrecv';
};

SDPUtils.getKind = function(mediaSection) {
  var lines = SDPUtils.splitLines(mediaSection);
  var mline = lines[0].split(' ');
  return mline[0].substr(2);
};

SDPUtils.isRejected = function(mediaSection) {
  return mediaSection.split(' ', 2)[1] === '0';
};

SDPUtils.parseMLine = function(mediaSection) {
  var lines = SDPUtils.splitLines(mediaSection);
  var parts = lines[0].substr(2).split(' ');
  return {
    kind: parts[0],
    port: parseInt(parts[1], 10),
    protocol: parts[2],
    fmt: parts.slice(3).join(' ')
  };
};

SDPUtils.parseOLine = function(mediaSection) {
  var line = SDPUtils.matchPrefix(mediaSection, 'o=')[0];
  var parts = line.substr(2).split(' ');
  return {
    username: parts[0],
    sessionId: parts[1],
    sessionVersion: parseInt(parts[2], 10),
    netType: parts[3],
    addressType: parts[4],
    address: parts[5]
  };
};

// a very naive interpretation of a valid SDP.
SDPUtils.isValidSDP = function(blob) {
  if (typeof blob !== 'string' || blob.length === 0) {
    return false;
  }
  var lines = SDPUtils.splitLines(blob);
  for (var i = 0; i < lines.length; i++) {
    if (lines[i].length < 2 || lines[i].charAt(1) !== '=') {
      return false;
    }
    // TODO: check the modifier a bit more.
  }
  return true;
};

// Expose public methods.
if (typeof module === 'object') {
  module.exports = SDPUtils;
}

},{}],41:[function(require,module,exports){
(function (process,global){(function (){
(function (global, undefined) {
    "use strict";

    if (global.setImmediate) {
        return;
    }

    var nextHandle = 1; // Spec says greater than zero
    var tasksByHandle = {};
    var currentlyRunningATask = false;
    var doc = global.document;
    var registerImmediate;

    function setImmediate(callback) {
      // Callback can either be a function or a string
      if (typeof callback !== "function") {
        callback = new Function("" + callback);
      }
      // Copy function arguments
      var args = new Array(arguments.length - 1);
      for (var i = 0; i < args.length; i++) {
          args[i] = arguments[i + 1];
      }
      // Store and register the task
      var task = { callback: callback, args: args };
      tasksByHandle[nextHandle] = task;
      registerImmediate(nextHandle);
      return nextHandle++;
    }

    function clearImmediate(handle) {
        delete tasksByHandle[handle];
    }

    function run(task) {
        var callback = task.callback;
        var args = task.args;
        switch (args.length) {
        case 0:
            callback();
            break;
        case 1:
            callback(args[0]);
            break;
        case 2:
            callback(args[0], args[1]);
            break;
        case 3:
            callback(args[0], args[1], args[2]);
            break;
        default:
            callback.apply(undefined, args);
            break;
        }
    }

    function runIfPresent(handle) {
        // From the spec: "Wait until any invocations of this algorithm started before this one have completed."
        // So if we're currently running a task, we'll need to delay this invocation.
        if (currentlyRunningATask) {
            // Delay by doing a setTimeout. setImmediate was tried instead, but in Firefox 7 it generated a
            // "too much recursion" error.
            setTimeout(runIfPresent, 0, handle);
        } else {
            var task = tasksByHandle[handle];
            if (task) {
                currentlyRunningATask = true;
                try {
                    run(task);
                } finally {
                    clearImmediate(handle);
                    currentlyRunningATask = false;
                }
            }
        }
    }

    function installNextTickImplementation() {
        registerImmediate = function(handle) {
            process.nextTick(function () { runIfPresent(handle); });
        };
    }

    function canUsePostMessage() {
        // The test against `importScripts` prevents this implementation from being installed inside a web worker,
        // where `global.postMessage` means something completely different and can't be used for this purpose.
        if (global.postMessage && !global.importScripts) {
            var postMessageIsAsynchronous = true;
            var oldOnMessage = global.onmessage;
            global.onmessage = function() {
                postMessageIsAsynchronous = false;
            };
            global.postMessage("", "*");
            global.onmessage = oldOnMessage;
            return postMessageIsAsynchronous;
        }
    }

    function installPostMessageImplementation() {
        // Installs an event handler on `global` for the `message` event: see
        // * https://developer.mozilla.org/en/DOM/window.postMessage
        // * http://www.whatwg.org/specs/web-apps/current-work/multipage/comms.html#crossDocumentMessages

        var messagePrefix = "setImmediate$" + Math.random() + "$";
        var onGlobalMessage = function(event) {
            if (event.source === global &&
                typeof event.data === "string" &&
                event.data.indexOf(messagePrefix) === 0) {
                runIfPresent(+event.data.slice(messagePrefix.length));
            }
        };

        if (global.addEventListener) {
            global.addEventListener("message", onGlobalMessage, false);
        } else {
            global.attachEvent("onmessage", onGlobalMessage);
        }

        registerImmediate = function(handle) {
            global.postMessage(messagePrefix + handle, "*");
        };
    }

    function installMessageChannelImplementation() {
        var channel = new MessageChannel();
        channel.port1.onmessage = function(event) {
            var handle = event.data;
            runIfPresent(handle);
        };

        registerImmediate = function(handle) {
            channel.port2.postMessage(handle);
        };
    }

    function installReadyStateChangeImplementation() {
        var html = doc.documentElement;
        registerImmediate = function(handle) {
            // Create a <script> element; its readystatechange event will be fired asynchronously once it is inserted
            // into the document. Do so, thus queuing up the task. Remember to clean up once it's been called.
            var script = doc.createElement("script");
            script.onreadystatechange = function () {
                runIfPresent(handle);
                script.onreadystatechange = null;
                html.removeChild(script);
                script = null;
            };
            html.appendChild(script);
        };
    }

    function installSetTimeoutImplementation() {
        registerImmediate = function(handle) {
            setTimeout(runIfPresent, 0, handle);
        };
    }

    // If supported, we should attach to the prototype of global, since that is where setTimeout et al. live.
    var attachTo = Object.getPrototypeOf && Object.getPrototypeOf(global);
    attachTo = attachTo && attachTo.setTimeout ? attachTo : global;

    // Don't get fooled by e.g. browserify environments.
    if ({}.toString.call(global.process) === "[object process]") {
        // For Node.js before 0.9
        installNextTickImplementation();

    } else if (canUsePostMessage()) {
        // For non-IE10 modern browsers
        installPostMessageImplementation();

    } else if (global.MessageChannel) {
        // For web workers, where supported
        installMessageChannelImplementation();

    } else if (doc && "onreadystatechange" in doc.createElement("script")) {
        // For IE 6–8
        installReadyStateChangeImplementation();

    } else {
        // For older browsers
        installSetTimeoutImplementation();
    }

    attachTo.setImmediate = setImmediate;
    attachTo.clearImmediate = clearImmediate;
}(typeof self === "undefined" ? typeof global === "undefined" ? this : global : self));

}).call(this)}).call(this,require('_process'),typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"_process":32}],42:[function(require,module,exports){
(function (setImmediate,clearImmediate){(function (){
var nextTick = require('process/browser.js').nextTick;
var apply = Function.prototype.apply;
var slice = Array.prototype.slice;
var immediateIds = {};
var nextImmediateId = 0;

// DOM APIs, for completeness

exports.setTimeout = function() {
  return new Timeout(apply.call(setTimeout, window, arguments), clearTimeout);
};
exports.setInterval = function() {
  return new Timeout(apply.call(setInterval, window, arguments), clearInterval);
};
exports.clearTimeout =
exports.clearInterval = function(timeout) { timeout.close(); };

function Timeout(id, clearFn) {
  this._id = id;
  this._clearFn = clearFn;
}
Timeout.prototype.unref = Timeout.prototype.ref = function() {};
Timeout.prototype.close = function() {
  this._clearFn.call(window, this._id);
};

// Does not start the time, just sets up the members needed.
exports.enroll = function(item, msecs) {
  clearTimeout(item._idleTimeoutId);
  item._idleTimeout = msecs;
};

exports.unenroll = function(item) {
  clearTimeout(item._idleTimeoutId);
  item._idleTimeout = -1;
};

exports._unrefActive = exports.active = function(item) {
  clearTimeout(item._idleTimeoutId);

  var msecs = item._idleTimeout;
  if (msecs >= 0) {
    item._idleTimeoutId = setTimeout(function onTimeout() {
      if (item._onTimeout)
        item._onTimeout();
    }, msecs);
  }
};

// That's not how node.js implements it but the exposed api is the same.
exports.setImmediate = typeof setImmediate === "function" ? setImmediate : function(fn) {
  var id = nextImmediateId++;
  var args = arguments.length < 2 ? false : slice.call(arguments, 1);

  immediateIds[id] = true;

  nextTick(function onNextTick() {
    if (immediateIds[id]) {
      // fn.call() is faster so we optimize for the common use-case
      // @see http://jsperf.com/call-apply-segu
      if (args) {
        fn.apply(null, args);
      } else {
        fn.call(null);
      }
      // Prevent ids from leaking
      exports.clearImmediate(id);
    }
  });

  return id;
};

exports.clearImmediate = typeof clearImmediate === "function" ? clearImmediate : function(id) {
  delete immediateIds[id];
};
}).call(this)}).call(this,require("timers").setImmediate,require("timers").clearImmediate)
},{"process/browser.js":32,"timers":42}],43:[function(require,module,exports){
(function (Buffer){(function (){
// Written in 2014-2016 by Dmitry Chestnykh and Devi Mandiri.
// Public domain.
(function(root, f) {
  'use strict';
  if (typeof module !== 'undefined' && module.exports) module.exports = f();
  else if (root.nacl) root.nacl.util = f();
  else {
    root.nacl = {};
    root.nacl.util = f();
  }
}(this, function() {
  'use strict';

  var util = {};

  function validateBase64(s) {
    if (!(/^(?:[A-Za-z0-9+\/]{2}[A-Za-z0-9+\/]{2})*(?:[A-Za-z0-9+\/]{2}==|[A-Za-z0-9+\/]{3}=)?$/.test(s))) {
      throw new TypeError('invalid encoding');
    }
  }

  util.decodeUTF8 = function(s) {
    if (typeof s !== 'string') throw new TypeError('expected string');
    var i, d = unescape(encodeURIComponent(s)), b = new Uint8Array(d.length);
    for (i = 0; i < d.length; i++) b[i] = d.charCodeAt(i);
    return b;
  };

  util.encodeUTF8 = function(arr) {
    var i, s = [];
    for (i = 0; i < arr.length; i++) s.push(String.fromCharCode(arr[i]));
    return decodeURIComponent(escape(s.join('')));
  };

  if (typeof atob === 'undefined') {
    // Node.js

    if (typeof Buffer.from !== 'undefined') {
       // Node v6 and later
      util.encodeBase64 = function (arr) { // v6 and later
          return Buffer.from(arr).toString('base64');
      };

      util.decodeBase64 = function (s) {
        validateBase64(s);
        return new Uint8Array(Array.prototype.slice.call(Buffer.from(s, 'base64'), 0));
      };

    } else {
      // Node earlier than v6
      util.encodeBase64 = function (arr) { // v6 and later
        return (new Buffer(arr)).toString('base64');
      };

      util.decodeBase64 = function(s) {
        validateBase64(s);
        return new Uint8Array(Array.prototype.slice.call(new Buffer(s, 'base64'), 0));
      };
    }

  } else {
    // Browsers

    util.encodeBase64 = function(arr) {
      var i, s = [], len = arr.length;
      for (i = 0; i < len; i++) s.push(String.fromCharCode(arr[i]));
      return btoa(s.join(''));
    };

    util.decodeBase64 = function(s) {
      validateBase64(s);
      var i, d = atob(s), b = new Uint8Array(d.length);
      for (i = 0; i < d.length; i++) b[i] = d.charCodeAt(i);
      return b;
    };

  }

  return util;

}));

}).call(this)}).call(this,require("buffer").Buffer)
},{"buffer":21}],44:[function(require,module,exports){
/*
 *  Copyright (c) 2016 The WebRTC project authors. All Rights Reserved.
 *
 *  Use of this source code is governed by a BSD-style license
 *  that can be found in the LICENSE file in the root of the source
 *  tree.
 */
/* eslint-env node */

'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _adapter_factory = require('./adapter_factory.js');

var adapter = (0, _adapter_factory.adapterFactory)({ window: typeof window === 'undefined' ? undefined : window });
exports.default = adapter;

},{"./adapter_factory.js":45}],45:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.adapterFactory = adapterFactory;

var _utils = require('./utils');

var utils = _interopRequireWildcard(_utils);

var _chrome_shim = require('./chrome/chrome_shim');

var chromeShim = _interopRequireWildcard(_chrome_shim);

var _edge_shim = require('./edge/edge_shim');

var edgeShim = _interopRequireWildcard(_edge_shim);

var _firefox_shim = require('./firefox/firefox_shim');

var firefoxShim = _interopRequireWildcard(_firefox_shim);

var _safari_shim = require('./safari/safari_shim');

var safariShim = _interopRequireWildcard(_safari_shim);

var _common_shim = require('./common_shim');

var commonShim = _interopRequireWildcard(_common_shim);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

// Shimming starts here.
/*
 *  Copyright (c) 2016 The WebRTC project authors. All Rights Reserved.
 *
 *  Use of this source code is governed by a BSD-style license
 *  that can be found in the LICENSE file in the root of the source
 *  tree.
 */
function adapterFactory() {
  var _ref = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {},
      window = _ref.window;

  var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {
    shimChrome: true,
    shimFirefox: true,
    shimEdge: true,
    shimSafari: true
  };

  // Utils.
  var logging = utils.log;
  var browserDetails = utils.detectBrowser(window);

  var adapter = {
    browserDetails: browserDetails,
    commonShim: commonShim,
    extractVersion: utils.extractVersion,
    disableLog: utils.disableLog,
    disableWarnings: utils.disableWarnings
  };

  // Shim browser if found.
  switch (browserDetails.browser) {
    case 'chrome':
      if (!chromeShim || !chromeShim.shimPeerConnection || !options.shimChrome) {
        logging('Chrome shim is not included in this adapter release.');
        return adapter;
      }
      if (browserDetails.version === null) {
        logging('Chrome shim can not determine version, not shimming.');
        return adapter;
      }
      logging('adapter.js shimming chrome.');
      // Export to the adapter global object visible in the browser.
      adapter.browserShim = chromeShim;

      // Must be called before shimPeerConnection.
      commonShim.shimAddIceCandidateNullOrEmpty(window, browserDetails);

      chromeShim.shimGetUserMedia(window, browserDetails);
      chromeShim.shimMediaStream(window, browserDetails);
      chromeShim.shimPeerConnection(window, browserDetails);
      chromeShim.shimOnTrack(window, browserDetails);
      chromeShim.shimAddTrackRemoveTrack(window, browserDetails);
      chromeShim.shimGetSendersWithDtmf(window, browserDetails);
      chromeShim.shimGetStats(window, browserDetails);
      chromeShim.shimSenderReceiverGetStats(window, browserDetails);
      chromeShim.fixNegotiationNeeded(window, browserDetails);

      commonShim.shimRTCIceCandidate(window, browserDetails);
      commonShim.shimConnectionState(window, browserDetails);
      commonShim.shimMaxMessageSize(window, browserDetails);
      commonShim.shimSendThrowTypeError(window, browserDetails);
      commonShim.removeExtmapAllowMixed(window, browserDetails);
      break;
    case 'firefox':
      if (!firefoxShim || !firefoxShim.shimPeerConnection || !options.shimFirefox) {
        logging('Firefox shim is not included in this adapter release.');
        return adapter;
      }
      logging('adapter.js shimming firefox.');
      // Export to the adapter global object visible in the browser.
      adapter.browserShim = firefoxShim;

      // Must be called before shimPeerConnection.
      commonShim.shimAddIceCandidateNullOrEmpty(window, browserDetails);

      firefoxShim.shimGetUserMedia(window, browserDetails);
      firefoxShim.shimPeerConnection(window, browserDetails);
      firefoxShim.shimOnTrack(window, browserDetails);
      firefoxShim.shimRemoveStream(window, browserDetails);
      firefoxShim.shimSenderGetStats(window, browserDetails);
      firefoxShim.shimReceiverGetStats(window, browserDetails);
      firefoxShim.shimRTCDataChannel(window, browserDetails);
      firefoxShim.shimAddTransceiver(window, browserDetails);
      firefoxShim.shimGetParameters(window, browserDetails);
      firefoxShim.shimCreateOffer(window, browserDetails);
      firefoxShim.shimCreateAnswer(window, browserDetails);

      commonShim.shimRTCIceCandidate(window, browserDetails);
      commonShim.shimConnectionState(window, browserDetails);
      commonShim.shimMaxMessageSize(window, browserDetails);
      commonShim.shimSendThrowTypeError(window, browserDetails);
      break;
    case 'edge':
      if (!edgeShim || !edgeShim.shimPeerConnection || !options.shimEdge) {
        logging('MS edge shim is not included in this adapter release.');
        return adapter;
      }
      logging('adapter.js shimming edge.');
      // Export to the adapter global object visible in the browser.
      adapter.browserShim = edgeShim;

      edgeShim.shimGetUserMedia(window, browserDetails);
      edgeShim.shimGetDisplayMedia(window, browserDetails);
      edgeShim.shimPeerConnection(window, browserDetails);
      edgeShim.shimReplaceTrack(window, browserDetails);

      // the edge shim implements the full RTCIceCandidate object.

      commonShim.shimMaxMessageSize(window, browserDetails);
      commonShim.shimSendThrowTypeError(window, browserDetails);
      break;
    case 'safari':
      if (!safariShim || !options.shimSafari) {
        logging('Safari shim is not included in this adapter release.');
        return adapter;
      }
      logging('adapter.js shimming safari.');
      // Export to the adapter global object visible in the browser.
      adapter.browserShim = safariShim;

      // Must be called before shimCallbackAPI.
      commonShim.shimAddIceCandidateNullOrEmpty(window, browserDetails);

      safariShim.shimRTCIceServerUrls(window, browserDetails);
      safariShim.shimCreateOfferLegacy(window, browserDetails);
      safariShim.shimCallbacksAPI(window, browserDetails);
      safariShim.shimLocalStreamsAPI(window, browserDetails);
      safariShim.shimRemoteStreamsAPI(window, browserDetails);
      safariShim.shimTrackEventTransceiver(window, browserDetails);
      safariShim.shimGetUserMedia(window, browserDetails);
      safariShim.shimAudioContext(window, browserDetails);

      commonShim.shimRTCIceCandidate(window, browserDetails);
      commonShim.shimMaxMessageSize(window, browserDetails);
      commonShim.shimSendThrowTypeError(window, browserDetails);
      commonShim.removeExtmapAllowMixed(window, browserDetails);
      break;
    default:
      logging('Unsupported browser!');
      break;
  }

  return adapter;
}

// Browser shims.

},{"./chrome/chrome_shim":46,"./common_shim":49,"./edge/edge_shim":50,"./firefox/firefox_shim":54,"./safari/safari_shim":57,"./utils":58}],46:[function(require,module,exports){
/*
 *  Copyright (c) 2016 The WebRTC project authors. All Rights Reserved.
 *
 *  Use of this source code is governed by a BSD-style license
 *  that can be found in the LICENSE file in the root of the source
 *  tree.
 */
/* eslint-env node */
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.shimGetDisplayMedia = exports.shimGetUserMedia = undefined;

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var _getusermedia = require('./getusermedia');

Object.defineProperty(exports, 'shimGetUserMedia', {
  enumerable: true,
  get: function get() {
    return _getusermedia.shimGetUserMedia;
  }
});

var _getdisplaymedia = require('./getdisplaymedia');

Object.defineProperty(exports, 'shimGetDisplayMedia', {
  enumerable: true,
  get: function get() {
    return _getdisplaymedia.shimGetDisplayMedia;
  }
});
exports.shimMediaStream = shimMediaStream;
exports.shimOnTrack = shimOnTrack;
exports.shimGetSendersWithDtmf = shimGetSendersWithDtmf;
exports.shimGetStats = shimGetStats;
exports.shimSenderReceiverGetStats = shimSenderReceiverGetStats;
exports.shimAddTrackRemoveTrackWithNative = shimAddTrackRemoveTrackWithNative;
exports.shimAddTrackRemoveTrack = shimAddTrackRemoveTrack;
exports.shimPeerConnection = shimPeerConnection;
exports.fixNegotiationNeeded = fixNegotiationNeeded;

var _utils = require('../utils.js');

var utils = _interopRequireWildcard(_utils);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function shimMediaStream(window) {
  window.MediaStream = window.MediaStream || window.webkitMediaStream;
}

function shimOnTrack(window) {
  if ((typeof window === 'undefined' ? 'undefined' : _typeof(window)) === 'object' && window.RTCPeerConnection && !('ontrack' in window.RTCPeerConnection.prototype)) {
    Object.defineProperty(window.RTCPeerConnection.prototype, 'ontrack', {
      get: function get() {
        return this._ontrack;
      },
      set: function set(f) {
        if (this._ontrack) {
          this.removeEventListener('track', this._ontrack);
        }
        this.addEventListener('track', this._ontrack = f);
      },

      enumerable: true,
      configurable: true
    });
    var origSetRemoteDescription = window.RTCPeerConnection.prototype.setRemoteDescription;
    window.RTCPeerConnection.prototype.setRemoteDescription = function setRemoteDescription() {
      var _this = this;

      if (!this._ontrackpoly) {
        this._ontrackpoly = function (e) {
          // onaddstream does not fire when a track is added to an existing
          // stream. But stream.onaddtrack is implemented so we use that.
          e.stream.addEventListener('addtrack', function (te) {
            var receiver = void 0;
            if (window.RTCPeerConnection.prototype.getReceivers) {
              receiver = _this.getReceivers().find(function (r) {
                return r.track && r.track.id === te.track.id;
              });
            } else {
              receiver = { track: te.track };
            }

            var event = new Event('track');
            event.track = te.track;
            event.receiver = receiver;
            event.transceiver = { receiver: receiver };
            event.streams = [e.stream];
            _this.dispatchEvent(event);
          });
          e.stream.getTracks().forEach(function (track) {
            var receiver = void 0;
            if (window.RTCPeerConnection.prototype.getReceivers) {
              receiver = _this.getReceivers().find(function (r) {
                return r.track && r.track.id === track.id;
              });
            } else {
              receiver = { track: track };
            }
            var event = new Event('track');
            event.track = track;
            event.receiver = receiver;
            event.transceiver = { receiver: receiver };
            event.streams = [e.stream];
            _this.dispatchEvent(event);
          });
        };
        this.addEventListener('addstream', this._ontrackpoly);
      }
      return origSetRemoteDescription.apply(this, arguments);
    };
  } else {
    // even if RTCRtpTransceiver is in window, it is only used and
    // emitted in unified-plan. Unfortunately this means we need
    // to unconditionally wrap the event.
    utils.wrapPeerConnectionEvent(window, 'track', function (e) {
      if (!e.transceiver) {
        Object.defineProperty(e, 'transceiver', { value: { receiver: e.receiver } });
      }
      return e;
    });
  }
}

function shimGetSendersWithDtmf(window) {
  // Overrides addTrack/removeTrack, depends on shimAddTrackRemoveTrack.
  if ((typeof window === 'undefined' ? 'undefined' : _typeof(window)) === 'object' && window.RTCPeerConnection && !('getSenders' in window.RTCPeerConnection.prototype) && 'createDTMFSender' in window.RTCPeerConnection.prototype) {
    var shimSenderWithDtmf = function shimSenderWithDtmf(pc, track) {
      return {
        track: track,
        get dtmf() {
          if (this._dtmf === undefined) {
            if (track.kind === 'audio') {
              this._dtmf = pc.createDTMFSender(track);
            } else {
              this._dtmf = null;
            }
          }
          return this._dtmf;
        },
        _pc: pc
      };
    };

    // augment addTrack when getSenders is not available.
    if (!window.RTCPeerConnection.prototype.getSenders) {
      window.RTCPeerConnection.prototype.getSenders = function getSenders() {
        this._senders = this._senders || [];
        return this._senders.slice(); // return a copy of the internal state.
      };
      var origAddTrack = window.RTCPeerConnection.prototype.addTrack;
      window.RTCPeerConnection.prototype.addTrack = function addTrack(track, stream) {
        var sender = origAddTrack.apply(this, arguments);
        if (!sender) {
          sender = shimSenderWithDtmf(this, track);
          this._senders.push(sender);
        }
        return sender;
      };

      var origRemoveTrack = window.RTCPeerConnection.prototype.removeTrack;
      window.RTCPeerConnection.prototype.removeTrack = function removeTrack(sender) {
        origRemoveTrack.apply(this, arguments);
        var idx = this._senders.indexOf(sender);
        if (idx !== -1) {
          this._senders.splice(idx, 1);
        }
      };
    }
    var origAddStream = window.RTCPeerConnection.prototype.addStream;
    window.RTCPeerConnection.prototype.addStream = function addStream(stream) {
      var _this2 = this;

      this._senders = this._senders || [];
      origAddStream.apply(this, [stream]);
      stream.getTracks().forEach(function (track) {
        _this2._senders.push(shimSenderWithDtmf(_this2, track));
      });
    };

    var origRemoveStream = window.RTCPeerConnection.prototype.removeStream;
    window.RTCPeerConnection.prototype.removeStream = function removeStream(stream) {
      var _this3 = this;

      this._senders = this._senders || [];
      origRemoveStream.apply(this, [stream]);

      stream.getTracks().forEach(function (track) {
        var sender = _this3._senders.find(function (s) {
          return s.track === track;
        });
        if (sender) {
          // remove sender
          _this3._senders.splice(_this3._senders.indexOf(sender), 1);
        }
      });
    };
  } else if ((typeof window === 'undefined' ? 'undefined' : _typeof(window)) === 'object' && window.RTCPeerConnection && 'getSenders' in window.RTCPeerConnection.prototype && 'createDTMFSender' in window.RTCPeerConnection.prototype && window.RTCRtpSender && !('dtmf' in window.RTCRtpSender.prototype)) {
    var origGetSenders = window.RTCPeerConnection.prototype.getSenders;
    window.RTCPeerConnection.prototype.getSenders = function getSenders() {
      var _this4 = this;

      var senders = origGetSenders.apply(this, []);
      senders.forEach(function (sender) {
        return sender._pc = _this4;
      });
      return senders;
    };

    Object.defineProperty(window.RTCRtpSender.prototype, 'dtmf', {
      get: function get() {
        if (this._dtmf === undefined) {
          if (this.track.kind === 'audio') {
            this._dtmf = this._pc.createDTMFSender(this.track);
          } else {
            this._dtmf = null;
          }
        }
        return this._dtmf;
      }
    });
  }
}

function shimGetStats(window) {
  if (!window.RTCPeerConnection) {
    return;
  }

  var origGetStats = window.RTCPeerConnection.prototype.getStats;
  window.RTCPeerConnection.prototype.getStats = function getStats() {
    var _this5 = this;

    var _arguments = Array.prototype.slice.call(arguments),
        selector = _arguments[0],
        onSucc = _arguments[1],
        onErr = _arguments[2];

    // If selector is a function then we are in the old style stats so just
    // pass back the original getStats format to avoid breaking old users.


    if (arguments.length > 0 && typeof selector === 'function') {
      return origGetStats.apply(this, arguments);
    }

    // When spec-style getStats is supported, return those when called with
    // either no arguments or the selector argument is null.
    if (origGetStats.length === 0 && (arguments.length === 0 || typeof selector !== 'function')) {
      return origGetStats.apply(this, []);
    }

    var fixChromeStats_ = function fixChromeStats_(response) {
      var standardReport = {};
      var reports = response.result();
      reports.forEach(function (report) {
        var standardStats = {
          id: report.id,
          timestamp: report.timestamp,
          type: {
            localcandidate: 'local-candidate',
            remotecandidate: 'remote-candidate'
          }[report.type] || report.type
        };
        report.names().forEach(function (name) {
          standardStats[name] = report.stat(name);
        });
        standardReport[standardStats.id] = standardStats;
      });

      return standardReport;
    };

    // shim getStats with maplike support
    var makeMapStats = function makeMapStats(stats) {
      return new Map(Object.keys(stats).map(function (key) {
        return [key, stats[key]];
      }));
    };

    if (arguments.length >= 2) {
      var successCallbackWrapper_ = function successCallbackWrapper_(response) {
        onSucc(makeMapStats(fixChromeStats_(response)));
      };

      return origGetStats.apply(this, [successCallbackWrapper_, selector]);
    }

    // promise-support
    return new Promise(function (resolve, reject) {
      origGetStats.apply(_this5, [function (response) {
        resolve(makeMapStats(fixChromeStats_(response)));
      }, reject]);
    }).then(onSucc, onErr);
  };
}

function shimSenderReceiverGetStats(window) {
  if (!((typeof window === 'undefined' ? 'undefined' : _typeof(window)) === 'object' && window.RTCPeerConnection && window.RTCRtpSender && window.RTCRtpReceiver)) {
    return;
  }

  // shim sender stats.
  if (!('getStats' in window.RTCRtpSender.prototype)) {
    var origGetSenders = window.RTCPeerConnection.prototype.getSenders;
    if (origGetSenders) {
      window.RTCPeerConnection.prototype.getSenders = function getSenders() {
        var _this6 = this;

        var senders = origGetSenders.apply(this, []);
        senders.forEach(function (sender) {
          return sender._pc = _this6;
        });
        return senders;
      };
    }

    var origAddTrack = window.RTCPeerConnection.prototype.addTrack;
    if (origAddTrack) {
      window.RTCPeerConnection.prototype.addTrack = function addTrack() {
        var sender = origAddTrack.apply(this, arguments);
        sender._pc = this;
        return sender;
      };
    }
    window.RTCRtpSender.prototype.getStats = function getStats() {
      var sender = this;
      return this._pc.getStats().then(function (result) {
        return (
          /* Note: this will include stats of all senders that
           *   send a track with the same id as sender.track as
           *   it is not possible to identify the RTCRtpSender.
           */
          utils.filterStats(result, sender.track, true)
        );
      });
    };
  }

  // shim receiver stats.
  if (!('getStats' in window.RTCRtpReceiver.prototype)) {
    var origGetReceivers = window.RTCPeerConnection.prototype.getReceivers;
    if (origGetReceivers) {
      window.RTCPeerConnection.prototype.getReceivers = function getReceivers() {
        var _this7 = this;

        var receivers = origGetReceivers.apply(this, []);
        receivers.forEach(function (receiver) {
          return receiver._pc = _this7;
        });
        return receivers;
      };
    }
    utils.wrapPeerConnectionEvent(window, 'track', function (e) {
      e.receiver._pc = e.srcElement;
      return e;
    });
    window.RTCRtpReceiver.prototype.getStats = function getStats() {
      var receiver = this;
      return this._pc.getStats().then(function (result) {
        return utils.filterStats(result, receiver.track, false);
      });
    };
  }

  if (!('getStats' in window.RTCRtpSender.prototype && 'getStats' in window.RTCRtpReceiver.prototype)) {
    return;
  }

  // shim RTCPeerConnection.getStats(track).
  var origGetStats = window.RTCPeerConnection.prototype.getStats;
  window.RTCPeerConnection.prototype.getStats = function getStats() {
    if (arguments.length > 0 && arguments[0] instanceof window.MediaStreamTrack) {
      var track = arguments[0];
      var sender = void 0;
      var receiver = void 0;
      var err = void 0;
      this.getSenders().forEach(function (s) {
        if (s.track === track) {
          if (sender) {
            err = true;
          } else {
            sender = s;
          }
        }
      });
      this.getReceivers().forEach(function (r) {
        if (r.track === track) {
          if (receiver) {
            err = true;
          } else {
            receiver = r;
          }
        }
        return r.track === track;
      });
      if (err || sender && receiver) {
        return Promise.reject(new DOMException('There are more than one sender or receiver for the track.', 'InvalidAccessError'));
      } else if (sender) {
        return sender.getStats();
      } else if (receiver) {
        return receiver.getStats();
      }
      return Promise.reject(new DOMException('There is no sender or receiver for the track.', 'InvalidAccessError'));
    }
    return origGetStats.apply(this, arguments);
  };
}

function shimAddTrackRemoveTrackWithNative(window) {
  // shim addTrack/removeTrack with native variants in order to make
  // the interactions with legacy getLocalStreams behave as in other browsers.
  // Keeps a mapping stream.id => [stream, rtpsenders...]
  window.RTCPeerConnection.prototype.getLocalStreams = function getLocalStreams() {
    var _this8 = this;

    this._shimmedLocalStreams = this._shimmedLocalStreams || {};
    return Object.keys(this._shimmedLocalStreams).map(function (streamId) {
      return _this8._shimmedLocalStreams[streamId][0];
    });
  };

  var origAddTrack = window.RTCPeerConnection.prototype.addTrack;
  window.RTCPeerConnection.prototype.addTrack = function addTrack(track, stream) {
    if (!stream) {
      return origAddTrack.apply(this, arguments);
    }
    this._shimmedLocalStreams = this._shimmedLocalStreams || {};

    var sender = origAddTrack.apply(this, arguments);
    if (!this._shimmedLocalStreams[stream.id]) {
      this._shimmedLocalStreams[stream.id] = [stream, sender];
    } else if (this._shimmedLocalStreams[stream.id].indexOf(sender) === -1) {
      this._shimmedLocalStreams[stream.id].push(sender);
    }
    return sender;
  };

  var origAddStream = window.RTCPeerConnection.prototype.addStream;
  window.RTCPeerConnection.prototype.addStream = function addStream(stream) {
    var _this9 = this;

    this._shimmedLocalStreams = this._shimmedLocalStreams || {};

    stream.getTracks().forEach(function (track) {
      var alreadyExists = _this9.getSenders().find(function (s) {
        return s.track === track;
      });
      if (alreadyExists) {
        throw new DOMException('Track already exists.', 'InvalidAccessError');
      }
    });
    var existingSenders = this.getSenders();
    origAddStream.apply(this, arguments);
    var newSenders = this.getSenders().filter(function (newSender) {
      return existingSenders.indexOf(newSender) === -1;
    });
    this._shimmedLocalStreams[stream.id] = [stream].concat(newSenders);
  };

  var origRemoveStream = window.RTCPeerConnection.prototype.removeStream;
  window.RTCPeerConnection.prototype.removeStream = function removeStream(stream) {
    this._shimmedLocalStreams = this._shimmedLocalStreams || {};
    delete this._shimmedLocalStreams[stream.id];
    return origRemoveStream.apply(this, arguments);
  };

  var origRemoveTrack = window.RTCPeerConnection.prototype.removeTrack;
  window.RTCPeerConnection.prototype.removeTrack = function removeTrack(sender) {
    var _this10 = this;

    this._shimmedLocalStreams = this._shimmedLocalStreams || {};
    if (sender) {
      Object.keys(this._shimmedLocalStreams).forEach(function (streamId) {
        var idx = _this10._shimmedLocalStreams[streamId].indexOf(sender);
        if (idx !== -1) {
          _this10._shimmedLocalStreams[streamId].splice(idx, 1);
        }
        if (_this10._shimmedLocalStreams[streamId].length === 1) {
          delete _this10._shimmedLocalStreams[streamId];
        }
      });
    }
    return origRemoveTrack.apply(this, arguments);
  };
}

function shimAddTrackRemoveTrack(window, browserDetails) {
  if (!window.RTCPeerConnection) {
    return;
  }
  // shim addTrack and removeTrack.
  if (window.RTCPeerConnection.prototype.addTrack && browserDetails.version >= 65) {
    return shimAddTrackRemoveTrackWithNative(window);
  }

  // also shim pc.getLocalStreams when addTrack is shimmed
  // to return the original streams.
  var origGetLocalStreams = window.RTCPeerConnection.prototype.getLocalStreams;
  window.RTCPeerConnection.prototype.getLocalStreams = function getLocalStreams() {
    var _this11 = this;

    var nativeStreams = origGetLocalStreams.apply(this);
    this._reverseStreams = this._reverseStreams || {};
    return nativeStreams.map(function (stream) {
      return _this11._reverseStreams[stream.id];
    });
  };

  var origAddStream = window.RTCPeerConnection.prototype.addStream;
  window.RTCPeerConnection.prototype.addStream = function addStream(stream) {
    var _this12 = this;

    this._streams = this._streams || {};
    this._reverseStreams = this._reverseStreams || {};

    stream.getTracks().forEach(function (track) {
      var alreadyExists = _this12.getSenders().find(function (s) {
        return s.track === track;
      });
      if (alreadyExists) {
        throw new DOMException('Track already exists.', 'InvalidAccessError');
      }
    });
    // Add identity mapping for consistency with addTrack.
    // Unless this is being used with a stream from addTrack.
    if (!this._reverseStreams[stream.id]) {
      var newStream = new window.MediaStream(stream.getTracks());
      this._streams[stream.id] = newStream;
      this._reverseStreams[newStream.id] = stream;
      stream = newStream;
    }
    origAddStream.apply(this, [stream]);
  };

  var origRemoveStream = window.RTCPeerConnection.prototype.removeStream;
  window.RTCPeerConnection.prototype.removeStream = function removeStream(stream) {
    this._streams = this._streams || {};
    this._reverseStreams = this._reverseStreams || {};

    origRemoveStream.apply(this, [this._streams[stream.id] || stream]);
    delete this._reverseStreams[this._streams[stream.id] ? this._streams[stream.id].id : stream.id];
    delete this._streams[stream.id];
  };

  window.RTCPeerConnection.prototype.addTrack = function addTrack(track, stream) {
    var _this13 = this;

    if (this.signalingState === 'closed') {
      throw new DOMException('The RTCPeerConnection\'s signalingState is \'closed\'.', 'InvalidStateError');
    }
    var streams = [].slice.call(arguments, 1);
    if (streams.length !== 1 || !streams[0].getTracks().find(function (t) {
      return t === track;
    })) {
      // this is not fully correct but all we can manage without
      // [[associated MediaStreams]] internal slot.
      throw new DOMException('The adapter.js addTrack polyfill only supports a single ' + ' stream which is associated with the specified track.', 'NotSupportedError');
    }

    var alreadyExists = this.getSenders().find(function (s) {
      return s.track === track;
    });
    if (alreadyExists) {
      throw new DOMException('Track already exists.', 'InvalidAccessError');
    }

    this._streams = this._streams || {};
    this._reverseStreams = this._reverseStreams || {};
    var oldStream = this._streams[stream.id];
    if (oldStream) {
      // this is using odd Chrome behaviour, use with caution:
      // https://bugs.chromium.org/p/webrtc/issues/detail?id=7815
      // Note: we rely on the high-level addTrack/dtmf shim to
      // create the sender with a dtmf sender.
      oldStream.addTrack(track);

      // Trigger ONN async.
      Promise.resolve().then(function () {
        _this13.dispatchEvent(new Event('negotiationneeded'));
      });
    } else {
      var newStream = new window.MediaStream([track]);
      this._streams[stream.id] = newStream;
      this._reverseStreams[newStream.id] = stream;
      this.addStream(newStream);
    }
    return this.getSenders().find(function (s) {
      return s.track === track;
    });
  };

  // replace the internal stream id with the external one and
  // vice versa.
  function replaceInternalStreamId(pc, description) {
    var sdp = description.sdp;
    Object.keys(pc._reverseStreams || []).forEach(function (internalId) {
      var externalStream = pc._reverseStreams[internalId];
      var internalStream = pc._streams[externalStream.id];
      sdp = sdp.replace(new RegExp(internalStream.id, 'g'), externalStream.id);
    });
    return new RTCSessionDescription({
      type: description.type,
      sdp: sdp
    });
  }
  function replaceExternalStreamId(pc, description) {
    var sdp = description.sdp;
    Object.keys(pc._reverseStreams || []).forEach(function (internalId) {
      var externalStream = pc._reverseStreams[internalId];
      var internalStream = pc._streams[externalStream.id];
      sdp = sdp.replace(new RegExp(externalStream.id, 'g'), internalStream.id);
    });
    return new RTCSessionDescription({
      type: description.type,
      sdp: sdp
    });
  }
  ['createOffer', 'createAnswer'].forEach(function (method) {
    var nativeMethod = window.RTCPeerConnection.prototype[method];
    var methodObj = _defineProperty({}, method, function () {
      var _this14 = this;

      var args = arguments;
      var isLegacyCall = arguments.length && typeof arguments[0] === 'function';
      if (isLegacyCall) {
        return nativeMethod.apply(this, [function (description) {
          var desc = replaceInternalStreamId(_this14, description);
          args[0].apply(null, [desc]);
        }, function (err) {
          if (args[1]) {
            args[1].apply(null, err);
          }
        }, arguments[2]]);
      }
      return nativeMethod.apply(this, arguments).then(function (description) {
        return replaceInternalStreamId(_this14, description);
      });
    });
    window.RTCPeerConnection.prototype[method] = methodObj[method];
  });

  var origSetLocalDescription = window.RTCPeerConnection.prototype.setLocalDescription;
  window.RTCPeerConnection.prototype.setLocalDescription = function setLocalDescription() {
    if (!arguments.length || !arguments[0].type) {
      return origSetLocalDescription.apply(this, arguments);
    }
    arguments[0] = replaceExternalStreamId(this, arguments[0]);
    return origSetLocalDescription.apply(this, arguments);
  };

  // TODO: mangle getStats: https://w3c.github.io/webrtc-stats/#dom-rtcmediastreamstats-streamidentifier

  var origLocalDescription = Object.getOwnPropertyDescriptor(window.RTCPeerConnection.prototype, 'localDescription');
  Object.defineProperty(window.RTCPeerConnection.prototype, 'localDescription', {
    get: function get() {
      var description = origLocalDescription.get.apply(this);
      if (description.type === '') {
        return description;
      }
      return replaceInternalStreamId(this, description);
    }
  });

  window.RTCPeerConnection.prototype.removeTrack = function removeTrack(sender) {
    var _this15 = this;

    if (this.signalingState === 'closed') {
      throw new DOMException('The RTCPeerConnection\'s signalingState is \'closed\'.', 'InvalidStateError');
    }
    // We can not yet check for sender instanceof RTCRtpSender
    // since we shim RTPSender. So we check if sender._pc is set.
    if (!sender._pc) {
      throw new DOMException('Argument 1 of RTCPeerConnection.removeTrack ' + 'does not implement interface RTCRtpSender.', 'TypeError');
    }
    var isLocal = sender._pc === this;
    if (!isLocal) {
      throw new DOMException('Sender was not created by this connection.', 'InvalidAccessError');
    }

    // Search for the native stream the senders track belongs to.
    this._streams = this._streams || {};
    var stream = void 0;
    Object.keys(this._streams).forEach(function (streamid) {
      var hasTrack = _this15._streams[streamid].getTracks().find(function (track) {
        return sender.track === track;
      });
      if (hasTrack) {
        stream = _this15._streams[streamid];
      }
    });

    if (stream) {
      if (stream.getTracks().length === 1) {
        // if this is the last track of the stream, remove the stream. This
        // takes care of any shimmed _senders.
        this.removeStream(this._reverseStreams[stream.id]);
      } else {
        // relying on the same odd chrome behaviour as above.
        stream.removeTrack(sender.track);
      }
      this.dispatchEvent(new Event('negotiationneeded'));
    }
  };
}

function shimPeerConnection(window, browserDetails) {
  if (!window.RTCPeerConnection && window.webkitRTCPeerConnection) {
    // very basic support for old versions.
    window.RTCPeerConnection = window.webkitRTCPeerConnection;
  }
  if (!window.RTCPeerConnection) {
    return;
  }

  // shim implicit creation of RTCSessionDescription/RTCIceCandidate
  if (browserDetails.version < 53) {
    ['setLocalDescription', 'setRemoteDescription', 'addIceCandidate'].forEach(function (method) {
      var nativeMethod = window.RTCPeerConnection.prototype[method];
      var methodObj = _defineProperty({}, method, function () {
        arguments[0] = new (method === 'addIceCandidate' ? window.RTCIceCandidate : window.RTCSessionDescription)(arguments[0]);
        return nativeMethod.apply(this, arguments);
      });
      window.RTCPeerConnection.prototype[method] = methodObj[method];
    });
  }
}

// Attempt to fix ONN in plan-b mode.
function fixNegotiationNeeded(window, browserDetails) {
  utils.wrapPeerConnectionEvent(window, 'negotiationneeded', function (e) {
    var pc = e.target;
    if (browserDetails.version < 72 || pc.getConfiguration && pc.getConfiguration().sdpSemantics === 'plan-b') {
      if (pc.signalingState !== 'stable') {
        return;
      }
    }
    return e;
  });
}

},{"../utils.js":58,"./getdisplaymedia":47,"./getusermedia":48}],47:[function(require,module,exports){
/*
 *  Copyright (c) 2018 The adapter.js project authors. All Rights Reserved.
 *
 *  Use of this source code is governed by a BSD-style license
 *  that can be found in the LICENSE file in the root of the source
 *  tree.
 */
/* eslint-env node */
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.shimGetDisplayMedia = shimGetDisplayMedia;
function shimGetDisplayMedia(window, getSourceId) {
  if (window.navigator.mediaDevices && 'getDisplayMedia' in window.navigator.mediaDevices) {
    return;
  }
  if (!window.navigator.mediaDevices) {
    return;
  }
  // getSourceId is a function that returns a promise resolving with
  // the sourceId of the screen/window/tab to be shared.
  if (typeof getSourceId !== 'function') {
    console.error('shimGetDisplayMedia: getSourceId argument is not ' + 'a function');
    return;
  }
  window.navigator.mediaDevices.getDisplayMedia = function getDisplayMedia(constraints) {
    return getSourceId(constraints).then(function (sourceId) {
      var widthSpecified = constraints.video && constraints.video.width;
      var heightSpecified = constraints.video && constraints.video.height;
      var frameRateSpecified = constraints.video && constraints.video.frameRate;
      constraints.video = {
        mandatory: {
          chromeMediaSource: 'desktop',
          chromeMediaSourceId: sourceId,
          maxFrameRate: frameRateSpecified || 3
        }
      };
      if (widthSpecified) {
        constraints.video.mandatory.maxWidth = widthSpecified;
      }
      if (heightSpecified) {
        constraints.video.mandatory.maxHeight = heightSpecified;
      }
      return window.navigator.mediaDevices.getUserMedia(constraints);
    });
  };
}

},{}],48:[function(require,module,exports){
/*
 *  Copyright (c) 2016 The WebRTC project authors. All Rights Reserved.
 *
 *  Use of this source code is governed by a BSD-style license
 *  that can be found in the LICENSE file in the root of the source
 *  tree.
 */
/* eslint-env node */
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

exports.shimGetUserMedia = shimGetUserMedia;

var _utils = require('../utils.js');

var utils = _interopRequireWildcard(_utils);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

var logging = utils.log;

function shimGetUserMedia(window, browserDetails) {
  var navigator = window && window.navigator;

  if (!navigator.mediaDevices) {
    return;
  }

  var constraintsToChrome_ = function constraintsToChrome_(c) {
    if ((typeof c === 'undefined' ? 'undefined' : _typeof(c)) !== 'object' || c.mandatory || c.optional) {
      return c;
    }
    var cc = {};
    Object.keys(c).forEach(function (key) {
      if (key === 'require' || key === 'advanced' || key === 'mediaSource') {
        return;
      }
      var r = _typeof(c[key]) === 'object' ? c[key] : { ideal: c[key] };
      if (r.exact !== undefined && typeof r.exact === 'number') {
        r.min = r.max = r.exact;
      }
      var oldname_ = function oldname_(prefix, name) {
        if (prefix) {
          return prefix + name.charAt(0).toUpperCase() + name.slice(1);
        }
        return name === 'deviceId' ? 'sourceId' : name;
      };
      if (r.ideal !== undefined) {
        cc.optional = cc.optional || [];
        var oc = {};
        if (typeof r.ideal === 'number') {
          oc[oldname_('min', key)] = r.ideal;
          cc.optional.push(oc);
          oc = {};
          oc[oldname_('max', key)] = r.ideal;
          cc.optional.push(oc);
        } else {
          oc[oldname_('', key)] = r.ideal;
          cc.optional.push(oc);
        }
      }
      if (r.exact !== undefined && typeof r.exact !== 'number') {
        cc.mandatory = cc.mandatory || {};
        cc.mandatory[oldname_('', key)] = r.exact;
      } else {
        ['min', 'max'].forEach(function (mix) {
          if (r[mix] !== undefined) {
            cc.mandatory = cc.mandatory || {};
            cc.mandatory[oldname_(mix, key)] = r[mix];
          }
        });
      }
    });
    if (c.advanced) {
      cc.optional = (cc.optional || []).concat(c.advanced);
    }
    return cc;
  };

  var shimConstraints_ = function shimConstraints_(constraints, func) {
    if (browserDetails.version >= 61) {
      return func(constraints);
    }
    constraints = JSON.parse(JSON.stringify(constraints));
    if (constraints && _typeof(constraints.audio) === 'object') {
      var remap = function remap(obj, a, b) {
        if (a in obj && !(b in obj)) {
          obj[b] = obj[a];
          delete obj[a];
        }
      };
      constraints = JSON.parse(JSON.stringify(constraints));
      remap(constraints.audio, 'autoGainControl', 'googAutoGainControl');
      remap(constraints.audio, 'noiseSuppression', 'googNoiseSuppression');
      constraints.audio = constraintsToChrome_(constraints.audio);
    }
    if (constraints && _typeof(constraints.video) === 'object') {
      // Shim facingMode for mobile & surface pro.
      var face = constraints.video.facingMode;
      face = face && ((typeof face === 'undefined' ? 'undefined' : _typeof(face)) === 'object' ? face : { ideal: face });
      var getSupportedFacingModeLies = browserDetails.version < 66;

      if (face && (face.exact === 'user' || face.exact === 'environment' || face.ideal === 'user' || face.ideal === 'environment') && !(navigator.mediaDevices.getSupportedConstraints && navigator.mediaDevices.getSupportedConstraints().facingMode && !getSupportedFacingModeLies)) {
        delete constraints.video.facingMode;
        var matches = void 0;
        if (face.exact === 'environment' || face.ideal === 'environment') {
          matches = ['back', 'rear'];
        } else if (face.exact === 'user' || face.ideal === 'user') {
          matches = ['front'];
        }
        if (matches) {
          // Look for matches in label, or use last cam for back (typical).
          return navigator.mediaDevices.enumerateDevices().then(function (devices) {
            devices = devices.filter(function (d) {
              return d.kind === 'videoinput';
            });
            var dev = devices.find(function (d) {
              return matches.some(function (match) {
                return d.label.toLowerCase().includes(match);
              });
            });
            if (!dev && devices.length && matches.includes('back')) {
              dev = devices[devices.length - 1]; // more likely the back cam
            }
            if (dev) {
              constraints.video.deviceId = face.exact ? { exact: dev.deviceId } : { ideal: dev.deviceId };
            }
            constraints.video = constraintsToChrome_(constraints.video);
            logging('chrome: ' + JSON.stringify(constraints));
            return func(constraints);
          });
        }
      }
      constraints.video = constraintsToChrome_(constraints.video);
    }
    logging('chrome: ' + JSON.stringify(constraints));
    return func(constraints);
  };

  var shimError_ = function shimError_(e) {
    if (browserDetails.version >= 64) {
      return e;
    }
    return {
      name: {
        PermissionDeniedError: 'NotAllowedError',
        PermissionDismissedError: 'NotAllowedError',
        InvalidStateError: 'NotAllowedError',
        DevicesNotFoundError: 'NotFoundError',
        ConstraintNotSatisfiedError: 'OverconstrainedError',
        TrackStartError: 'NotReadableError',
        MediaDeviceFailedDueToShutdown: 'NotAllowedError',
        MediaDeviceKillSwitchOn: 'NotAllowedError',
        TabCaptureError: 'AbortError',
        ScreenCaptureError: 'AbortError',
        DeviceCaptureError: 'AbortError'
      }[e.name] || e.name,
      message: e.message,
      constraint: e.constraint || e.constraintName,
      toString: function toString() {
        return this.name + (this.message && ': ') + this.message;
      }
    };
  };

  var getUserMedia_ = function getUserMedia_(constraints, onSuccess, onError) {
    shimConstraints_(constraints, function (c) {
      navigator.webkitGetUserMedia(c, onSuccess, function (e) {
        if (onError) {
          onError(shimError_(e));
        }
      });
    });
  };
  navigator.getUserMedia = getUserMedia_.bind(navigator);

  // Even though Chrome 45 has navigator.mediaDevices and a getUserMedia
  // function which returns a Promise, it does not accept spec-style
  // constraints.
  if (navigator.mediaDevices.getUserMedia) {
    var origGetUserMedia = navigator.mediaDevices.getUserMedia.bind(navigator.mediaDevices);
    navigator.mediaDevices.getUserMedia = function (cs) {
      return shimConstraints_(cs, function (c) {
        return origGetUserMedia(c).then(function (stream) {
          if (c.audio && !stream.getAudioTracks().length || c.video && !stream.getVideoTracks().length) {
            stream.getTracks().forEach(function (track) {
              track.stop();
            });
            throw new DOMException('', 'NotFoundError');
          }
          return stream;
        }, function (e) {
          return Promise.reject(shimError_(e));
        });
      });
    };
  }
}

},{"../utils.js":58}],49:[function(require,module,exports){
/*
 *  Copyright (c) 2017 The WebRTC project authors. All Rights Reserved.
 *
 *  Use of this source code is governed by a BSD-style license
 *  that can be found in the LICENSE file in the root of the source
 *  tree.
 */
/* eslint-env node */
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

exports.shimRTCIceCandidate = shimRTCIceCandidate;
exports.shimMaxMessageSize = shimMaxMessageSize;
exports.shimSendThrowTypeError = shimSendThrowTypeError;
exports.shimConnectionState = shimConnectionState;
exports.removeExtmapAllowMixed = removeExtmapAllowMixed;
exports.shimAddIceCandidateNullOrEmpty = shimAddIceCandidateNullOrEmpty;

var _sdp = require('sdp');

var _sdp2 = _interopRequireDefault(_sdp);

var _utils = require('./utils');

var utils = _interopRequireWildcard(_utils);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function shimRTCIceCandidate(window) {
  // foundation is arbitrarily chosen as an indicator for full support for
  // https://w3c.github.io/webrtc-pc/#rtcicecandidate-interface
  if (!window.RTCIceCandidate || window.RTCIceCandidate && 'foundation' in window.RTCIceCandidate.prototype) {
    return;
  }

  var NativeRTCIceCandidate = window.RTCIceCandidate;
  window.RTCIceCandidate = function RTCIceCandidate(args) {
    // Remove the a= which shouldn't be part of the candidate string.
    if ((typeof args === 'undefined' ? 'undefined' : _typeof(args)) === 'object' && args.candidate && args.candidate.indexOf('a=') === 0) {
      args = JSON.parse(JSON.stringify(args));
      args.candidate = args.candidate.substr(2);
    }

    if (args.candidate && args.candidate.length) {
      // Augment the native candidate with the parsed fields.
      var nativeCandidate = new NativeRTCIceCandidate(args);
      var parsedCandidate = _sdp2.default.parseCandidate(args.candidate);
      var augmentedCandidate = Object.assign(nativeCandidate, parsedCandidate);

      // Add a serializer that does not serialize the extra attributes.
      augmentedCandidate.toJSON = function toJSON() {
        return {
          candidate: augmentedCandidate.candidate,
          sdpMid: augmentedCandidate.sdpMid,
          sdpMLineIndex: augmentedCandidate.sdpMLineIndex,
          usernameFragment: augmentedCandidate.usernameFragment
        };
      };
      return augmentedCandidate;
    }
    return new NativeRTCIceCandidate(args);
  };
  window.RTCIceCandidate.prototype = NativeRTCIceCandidate.prototype;

  // Hook up the augmented candidate in onicecandidate and
  // addEventListener('icecandidate', ...)
  utils.wrapPeerConnectionEvent(window, 'icecandidate', function (e) {
    if (e.candidate) {
      Object.defineProperty(e, 'candidate', {
        value: new window.RTCIceCandidate(e.candidate),
        writable: 'false'
      });
    }
    return e;
  });
}

function shimMaxMessageSize(window, browserDetails) {
  if (!window.RTCPeerConnection) {
    return;
  }

  if (!('sctp' in window.RTCPeerConnection.prototype)) {
    Object.defineProperty(window.RTCPeerConnection.prototype, 'sctp', {
      get: function get() {
        return typeof this._sctp === 'undefined' ? null : this._sctp;
      }
    });
  }

  var sctpInDescription = function sctpInDescription(description) {
    if (!description || !description.sdp) {
      return false;
    }
    var sections = _sdp2.default.splitSections(description.sdp);
    sections.shift();
    return sections.some(function (mediaSection) {
      var mLine = _sdp2.default.parseMLine(mediaSection);
      return mLine && mLine.kind === 'application' && mLine.protocol.indexOf('SCTP') !== -1;
    });
  };

  var getRemoteFirefoxVersion = function getRemoteFirefoxVersion(description) {
    // TODO: Is there a better solution for detecting Firefox?
    var match = description.sdp.match(/mozilla...THIS_IS_SDPARTA-(\d+)/);
    if (match === null || match.length < 2) {
      return -1;
    }
    var version = parseInt(match[1], 10);
    // Test for NaN (yes, this is ugly)
    return version !== version ? -1 : version;
  };

  var getCanSendMaxMessageSize = function getCanSendMaxMessageSize(remoteIsFirefox) {
    // Every implementation we know can send at least 64 KiB.
    // Note: Although Chrome is technically able to send up to 256 KiB, the
    //       data does not reach the other peer reliably.
    //       See: https://bugs.chromium.org/p/webrtc/issues/detail?id=8419
    var canSendMaxMessageSize = 65536;
    if (browserDetails.browser === 'firefox') {
      if (browserDetails.version < 57) {
        if (remoteIsFirefox === -1) {
          // FF < 57 will send in 16 KiB chunks using the deprecated PPID
          // fragmentation.
          canSendMaxMessageSize = 16384;
        } else {
          // However, other FF (and RAWRTC) can reassemble PPID-fragmented
          // messages. Thus, supporting ~2 GiB when sending.
          canSendMaxMessageSize = 2147483637;
        }
      } else if (browserDetails.version < 60) {
        // Currently, all FF >= 57 will reset the remote maximum message size
        // to the default value when a data channel is created at a later
        // stage. :(
        // See: https://bugzilla.mozilla.org/show_bug.cgi?id=1426831
        canSendMaxMessageSize = browserDetails.version === 57 ? 65535 : 65536;
      } else {
        // FF >= 60 supports sending ~2 GiB
        canSendMaxMessageSize = 2147483637;
      }
    }
    return canSendMaxMessageSize;
  };

  var getMaxMessageSize = function getMaxMessageSize(description, remoteIsFirefox) {
    // Note: 65536 bytes is the default value from the SDP spec. Also,
    //       every implementation we know supports receiving 65536 bytes.
    var maxMessageSize = 65536;

    // FF 57 has a slightly incorrect default remote max message size, so
    // we need to adjust it here to avoid a failure when sending.
    // See: https://bugzilla.mozilla.org/show_bug.cgi?id=1425697
    if (browserDetails.browser === 'firefox' && browserDetails.version === 57) {
      maxMessageSize = 65535;
    }

    var match = _sdp2.default.matchPrefix(description.sdp, 'a=max-message-size:');
    if (match.length > 0) {
      maxMessageSize = parseInt(match[0].substr(19), 10);
    } else if (browserDetails.browser === 'firefox' && remoteIsFirefox !== -1) {
      // If the maximum message size is not present in the remote SDP and
      // both local and remote are Firefox, the remote peer can receive
      // ~2 GiB.
      maxMessageSize = 2147483637;
    }
    return maxMessageSize;
  };

  var origSetRemoteDescription = window.RTCPeerConnection.prototype.setRemoteDescription;
  window.RTCPeerConnection.prototype.setRemoteDescription = function setRemoteDescription() {
    this._sctp = null;
    // Chrome decided to not expose .sctp in plan-b mode.
    // As usual, adapter.js has to do an 'ugly worakaround'
    // to cover up the mess.
    if (browserDetails.browser === 'chrome' && browserDetails.version >= 76) {
      var _getConfiguration = this.getConfiguration(),
          sdpSemantics = _getConfiguration.sdpSemantics;

      if (sdpSemantics === 'plan-b') {
        Object.defineProperty(this, 'sctp', {
          get: function get() {
            return typeof this._sctp === 'undefined' ? null : this._sctp;
          },

          enumerable: true,
          configurable: true
        });
      }
    }

    if (sctpInDescription(arguments[0])) {
      // Check if the remote is FF.
      var isFirefox = getRemoteFirefoxVersion(arguments[0]);

      // Get the maximum message size the local peer is capable of sending
      var canSendMMS = getCanSendMaxMessageSize(isFirefox);

      // Get the maximum message size of the remote peer.
      var remoteMMS = getMaxMessageSize(arguments[0], isFirefox);

      // Determine final maximum message size
      var maxMessageSize = void 0;
      if (canSendMMS === 0 && remoteMMS === 0) {
        maxMessageSize = Number.POSITIVE_INFINITY;
      } else if (canSendMMS === 0 || remoteMMS === 0) {
        maxMessageSize = Math.max(canSendMMS, remoteMMS);
      } else {
        maxMessageSize = Math.min(canSendMMS, remoteMMS);
      }

      // Create a dummy RTCSctpTransport object and the 'maxMessageSize'
      // attribute.
      var sctp = {};
      Object.defineProperty(sctp, 'maxMessageSize', {
        get: function get() {
          return maxMessageSize;
        }
      });
      this._sctp = sctp;
    }

    return origSetRemoteDescription.apply(this, arguments);
  };
}

function shimSendThrowTypeError(window) {
  if (!(window.RTCPeerConnection && 'createDataChannel' in window.RTCPeerConnection.prototype)) {
    return;
  }

  // Note: Although Firefox >= 57 has a native implementation, the maximum
  //       message size can be reset for all data channels at a later stage.
  //       See: https://bugzilla.mozilla.org/show_bug.cgi?id=1426831

  function wrapDcSend(dc, pc) {
    var origDataChannelSend = dc.send;
    dc.send = function send() {
      var data = arguments[0];
      var length = data.length || data.size || data.byteLength;
      if (dc.readyState === 'open' && pc.sctp && length > pc.sctp.maxMessageSize) {
        throw new TypeError('Message too large (can send a maximum of ' + pc.sctp.maxMessageSize + ' bytes)');
      }
      return origDataChannelSend.apply(dc, arguments);
    };
  }
  var origCreateDataChannel = window.RTCPeerConnection.prototype.createDataChannel;
  window.RTCPeerConnection.prototype.createDataChannel = function createDataChannel() {
    var dataChannel = origCreateDataChannel.apply(this, arguments);
    wrapDcSend(dataChannel, this);
    return dataChannel;
  };
  utils.wrapPeerConnectionEvent(window, 'datachannel', function (e) {
    wrapDcSend(e.channel, e.target);
    return e;
  });
}

/* shims RTCConnectionState by pretending it is the same as iceConnectionState.
 * See https://bugs.chromium.org/p/webrtc/issues/detail?id=6145#c12
 * for why this is a valid hack in Chrome. In Firefox it is slightly incorrect
 * since DTLS failures would be hidden. See
 * https://bugzilla.mozilla.org/show_bug.cgi?id=1265827
 * for the Firefox tracking bug.
 */
function shimConnectionState(window) {
  if (!window.RTCPeerConnection || 'connectionState' in window.RTCPeerConnection.prototype) {
    return;
  }
  var proto = window.RTCPeerConnection.prototype;
  Object.defineProperty(proto, 'connectionState', {
    get: function get() {
      return {
        completed: 'connected',
        checking: 'connecting'
      }[this.iceConnectionState] || this.iceConnectionState;
    },

    enumerable: true,
    configurable: true
  });
  Object.defineProperty(proto, 'onconnectionstatechange', {
    get: function get() {
      return this._onconnectionstatechange || null;
    },
    set: function set(cb) {
      if (this._onconnectionstatechange) {
        this.removeEventListener('connectionstatechange', this._onconnectionstatechange);
        delete this._onconnectionstatechange;
      }
      if (cb) {
        this.addEventListener('connectionstatechange', this._onconnectionstatechange = cb);
      }
    },

    enumerable: true,
    configurable: true
  });

  ['setLocalDescription', 'setRemoteDescription'].forEach(function (method) {
    var origMethod = proto[method];
    proto[method] = function () {
      if (!this._connectionstatechangepoly) {
        this._connectionstatechangepoly = function (e) {
          var pc = e.target;
          if (pc._lastConnectionState !== pc.connectionState) {
            pc._lastConnectionState = pc.connectionState;
            var newEvent = new Event('connectionstatechange', e);
            pc.dispatchEvent(newEvent);
          }
          return e;
        };
        this.addEventListener('iceconnectionstatechange', this._connectionstatechangepoly);
      }
      return origMethod.apply(this, arguments);
    };
  });
}

function removeExtmapAllowMixed(window, browserDetails) {
  /* remove a=extmap-allow-mixed for webrtc.org < M71 */
  if (!window.RTCPeerConnection) {
    return;
  }
  if (browserDetails.browser === 'chrome' && browserDetails.version >= 71) {
    return;
  }
  if (browserDetails.browser === 'safari' && browserDetails.version >= 605) {
    return;
  }
  var nativeSRD = window.RTCPeerConnection.prototype.setRemoteDescription;
  window.RTCPeerConnection.prototype.setRemoteDescription = function setRemoteDescription(desc) {
    if (desc && desc.sdp && desc.sdp.indexOf('\na=extmap-allow-mixed') !== -1) {
      var sdp = desc.sdp.split('\n').filter(function (line) {
        return line.trim() !== 'a=extmap-allow-mixed';
      }).join('\n');
      // Safari enforces read-only-ness of RTCSessionDescription fields.
      if (window.RTCSessionDescription && desc instanceof window.RTCSessionDescription) {
        arguments[0] = new window.RTCSessionDescription({
          type: desc.type,
          sdp: sdp
        });
      } else {
        desc.sdp = sdp;
      }
    }
    return nativeSRD.apply(this, arguments);
  };
}

function shimAddIceCandidateNullOrEmpty(window, browserDetails) {
  // Support for addIceCandidate(null or undefined)
  // as well as addIceCandidate({candidate: "", ...})
  // https://bugs.chromium.org/p/chromium/issues/detail?id=978582
  // Note: must be called before other polyfills which change the signature.
  if (!(window.RTCPeerConnection && window.RTCPeerConnection.prototype)) {
    return;
  }
  var nativeAddIceCandidate = window.RTCPeerConnection.prototype.addIceCandidate;
  if (!nativeAddIceCandidate || nativeAddIceCandidate.length === 0) {
    return;
  }
  window.RTCPeerConnection.prototype.addIceCandidate = function addIceCandidate() {
    if (!arguments[0]) {
      if (arguments[1]) {
        arguments[1].apply(null);
      }
      return Promise.resolve();
    }
    // Firefox 68+ emits and processes {candidate: "", ...}, ignore
    // in older versions.
    // Native support for ignoring exists for Chrome M77+.
    // Safari ignores as well, exact version unknown but works in the same
    // version that also ignores addIceCandidate(null).
    if ((browserDetails.browser === 'chrome' && browserDetails.version < 78 || browserDetails.browser === 'firefox' && browserDetails.version < 68 || browserDetails.browser === 'safari') && arguments[0] && arguments[0].candidate === '') {
      return Promise.resolve();
    }
    return nativeAddIceCandidate.apply(this, arguments);
  };
}

},{"./utils":58,"sdp":40}],50:[function(require,module,exports){
/*
 *  Copyright (c) 2016 The WebRTC project authors. All Rights Reserved.
 *
 *  Use of this source code is governed by a BSD-style license
 *  that can be found in the LICENSE file in the root of the source
 *  tree.
 */
/* eslint-env node */
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.shimGetDisplayMedia = exports.shimGetUserMedia = undefined;

var _getusermedia = require('./getusermedia');

Object.defineProperty(exports, 'shimGetUserMedia', {
  enumerable: true,
  get: function get() {
    return _getusermedia.shimGetUserMedia;
  }
});

var _getdisplaymedia = require('./getdisplaymedia');

Object.defineProperty(exports, 'shimGetDisplayMedia', {
  enumerable: true,
  get: function get() {
    return _getdisplaymedia.shimGetDisplayMedia;
  }
});
exports.shimPeerConnection = shimPeerConnection;
exports.shimReplaceTrack = shimReplaceTrack;

var _utils = require('../utils');

var utils = _interopRequireWildcard(_utils);

var _filtericeservers = require('./filtericeservers');

var _rtcpeerconnectionShim = require('rtcpeerconnection-shim');

var _rtcpeerconnectionShim2 = _interopRequireDefault(_rtcpeerconnectionShim);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function shimPeerConnection(window, browserDetails) {
  if (window.RTCIceGatherer) {
    if (!window.RTCIceCandidate) {
      window.RTCIceCandidate = function RTCIceCandidate(args) {
        return args;
      };
    }
    if (!window.RTCSessionDescription) {
      window.RTCSessionDescription = function RTCSessionDescription(args) {
        return args;
      };
    }
    // this adds an additional event listener to MediaStrackTrack that signals
    // when a tracks enabled property was changed. Workaround for a bug in
    // addStream, see below. No longer required in 15025+
    if (browserDetails.version < 15025) {
      var origMSTEnabled = Object.getOwnPropertyDescriptor(window.MediaStreamTrack.prototype, 'enabled');
      Object.defineProperty(window.MediaStreamTrack.prototype, 'enabled', {
        set: function set(value) {
          origMSTEnabled.set.call(this, value);
          var ev = new Event('enabled');
          ev.enabled = value;
          this.dispatchEvent(ev);
        }
      });
    }
  }

  // ORTC defines the DTMF sender a bit different.
  // https://github.com/w3c/ortc/issues/714
  if (window.RTCRtpSender && !('dtmf' in window.RTCRtpSender.prototype)) {
    Object.defineProperty(window.RTCRtpSender.prototype, 'dtmf', {
      get: function get() {
        if (this._dtmf === undefined) {
          if (this.track.kind === 'audio') {
            this._dtmf = new window.RTCDtmfSender(this);
          } else if (this.track.kind === 'video') {
            this._dtmf = null;
          }
        }
        return this._dtmf;
      }
    });
  }
  // Edge currently only implements the RTCDtmfSender, not the
  // RTCDTMFSender alias. See http://draft.ortc.org/#rtcdtmfsender2*
  if (window.RTCDtmfSender && !window.RTCDTMFSender) {
    window.RTCDTMFSender = window.RTCDtmfSender;
  }

  var RTCPeerConnectionShim = (0, _rtcpeerconnectionShim2.default)(window, browserDetails.version);
  window.RTCPeerConnection = function RTCPeerConnection(config) {
    if (config && config.iceServers) {
      config.iceServers = (0, _filtericeservers.filterIceServers)(config.iceServers, browserDetails.version);
      utils.log('ICE servers after filtering:', config.iceServers);
    }
    return new RTCPeerConnectionShim(config);
  };
  window.RTCPeerConnection.prototype = RTCPeerConnectionShim.prototype;
}

function shimReplaceTrack(window) {
  // ORTC has replaceTrack -- https://github.com/w3c/ortc/issues/614
  if (window.RTCRtpSender && !('replaceTrack' in window.RTCRtpSender.prototype)) {
    window.RTCRtpSender.prototype.replaceTrack = window.RTCRtpSender.prototype.setTrack;
  }
}

},{"../utils":58,"./filtericeservers":51,"./getdisplaymedia":52,"./getusermedia":53,"rtcpeerconnection-shim":39}],51:[function(require,module,exports){
/*
 *  Copyright (c) 2018 The WebRTC project authors. All Rights Reserved.
 *
 *  Use of this source code is governed by a BSD-style license
 *  that can be found in the LICENSE file in the root of the source
 *  tree.
 */
/* eslint-env node */
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.filterIceServers = filterIceServers;

var _utils = require('../utils');

var utils = _interopRequireWildcard(_utils);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

// Edge does not like
// 1) stun: filtered after 14393 unless ?transport=udp is present
// 2) turn: that does not have all of turn:host:port?transport=udp
// 3) turn: with ipv6 addresses
// 4) turn: occurring muliple times
function filterIceServers(iceServers, edgeVersion) {
  var hasTurn = false;
  iceServers = JSON.parse(JSON.stringify(iceServers));
  return iceServers.filter(function (server) {
    if (server && (server.urls || server.url)) {
      var urls = server.urls || server.url;
      if (server.url && !server.urls) {
        utils.deprecated('RTCIceServer.url', 'RTCIceServer.urls');
      }
      var isString = typeof urls === 'string';
      if (isString) {
        urls = [urls];
      }
      urls = urls.filter(function (url) {
        // filter STUN unconditionally.
        if (url.indexOf('stun:') === 0) {
          return false;
        }

        var validTurn = url.startsWith('turn') && !url.startsWith('turn:[') && url.includes('transport=udp');
        if (validTurn && !hasTurn) {
          hasTurn = true;
          return true;
        }
        return validTurn && !hasTurn;
      });

      delete server.url;
      server.urls = isString ? urls[0] : urls;
      return !!urls.length;
    }
  });
}

},{"../utils":58}],52:[function(require,module,exports){
/*
 *  Copyright (c) 2018 The adapter.js project authors. All Rights Reserved.
 *
 *  Use of this source code is governed by a BSD-style license
 *  that can be found in the LICENSE file in the root of the source
 *  tree.
 */
/* eslint-env node */
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.shimGetDisplayMedia = shimGetDisplayMedia;
function shimGetDisplayMedia(window) {
  if (!('getDisplayMedia' in window.navigator)) {
    return;
  }
  if (!window.navigator.mediaDevices) {
    return;
  }
  if (window.navigator.mediaDevices && 'getDisplayMedia' in window.navigator.mediaDevices) {
    return;
  }
  window.navigator.mediaDevices.getDisplayMedia = window.navigator.getDisplayMedia.bind(window.navigator);
}

},{}],53:[function(require,module,exports){
/*
 *  Copyright (c) 2016 The WebRTC project authors. All Rights Reserved.
 *
 *  Use of this source code is governed by a BSD-style license
 *  that can be found in the LICENSE file in the root of the source
 *  tree.
 */
/* eslint-env node */
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.shimGetUserMedia = shimGetUserMedia;
function shimGetUserMedia(window) {
  var navigator = window && window.navigator;

  var shimError_ = function shimError_(e) {
    return {
      name: { PermissionDeniedError: 'NotAllowedError' }[e.name] || e.name,
      message: e.message,
      constraint: e.constraint,
      toString: function toString() {
        return this.name;
      }
    };
  };

  // getUserMedia error shim.
  var origGetUserMedia = navigator.mediaDevices.getUserMedia.bind(navigator.mediaDevices);
  navigator.mediaDevices.getUserMedia = function (c) {
    return origGetUserMedia(c).catch(function (e) {
      return Promise.reject(shimError_(e));
    });
  };
}

},{}],54:[function(require,module,exports){
/*
 *  Copyright (c) 2016 The WebRTC project authors. All Rights Reserved.
 *
 *  Use of this source code is governed by a BSD-style license
 *  that can be found in the LICENSE file in the root of the source
 *  tree.
 */
/* eslint-env node */
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.shimGetDisplayMedia = exports.shimGetUserMedia = undefined;

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var _getusermedia = require('./getusermedia');

Object.defineProperty(exports, 'shimGetUserMedia', {
  enumerable: true,
  get: function get() {
    return _getusermedia.shimGetUserMedia;
  }
});

var _getdisplaymedia = require('./getdisplaymedia');

Object.defineProperty(exports, 'shimGetDisplayMedia', {
  enumerable: true,
  get: function get() {
    return _getdisplaymedia.shimGetDisplayMedia;
  }
});
exports.shimOnTrack = shimOnTrack;
exports.shimPeerConnection = shimPeerConnection;
exports.shimSenderGetStats = shimSenderGetStats;
exports.shimReceiverGetStats = shimReceiverGetStats;
exports.shimRemoveStream = shimRemoveStream;
exports.shimRTCDataChannel = shimRTCDataChannel;
exports.shimAddTransceiver = shimAddTransceiver;
exports.shimGetParameters = shimGetParameters;
exports.shimCreateOffer = shimCreateOffer;
exports.shimCreateAnswer = shimCreateAnswer;

var _utils = require('../utils');

var utils = _interopRequireWildcard(_utils);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function shimOnTrack(window) {
  if ((typeof window === 'undefined' ? 'undefined' : _typeof(window)) === 'object' && window.RTCTrackEvent && 'receiver' in window.RTCTrackEvent.prototype && !('transceiver' in window.RTCTrackEvent.prototype)) {
    Object.defineProperty(window.RTCTrackEvent.prototype, 'transceiver', {
      get: function get() {
        return { receiver: this.receiver };
      }
    });
  }
}

function shimPeerConnection(window, browserDetails) {
  if ((typeof window === 'undefined' ? 'undefined' : _typeof(window)) !== 'object' || !(window.RTCPeerConnection || window.mozRTCPeerConnection)) {
    return; // probably media.peerconnection.enabled=false in about:config
  }
  if (!window.RTCPeerConnection && window.mozRTCPeerConnection) {
    // very basic support for old versions.
    window.RTCPeerConnection = window.mozRTCPeerConnection;
  }

  if (browserDetails.version < 53) {
    // shim away need for obsolete RTCIceCandidate/RTCSessionDescription.
    ['setLocalDescription', 'setRemoteDescription', 'addIceCandidate'].forEach(function (method) {
      var nativeMethod = window.RTCPeerConnection.prototype[method];
      var methodObj = _defineProperty({}, method, function () {
        arguments[0] = new (method === 'addIceCandidate' ? window.RTCIceCandidate : window.RTCSessionDescription)(arguments[0]);
        return nativeMethod.apply(this, arguments);
      });
      window.RTCPeerConnection.prototype[method] = methodObj[method];
    });
  }

  var modernStatsTypes = {
    inboundrtp: 'inbound-rtp',
    outboundrtp: 'outbound-rtp',
    candidatepair: 'candidate-pair',
    localcandidate: 'local-candidate',
    remotecandidate: 'remote-candidate'
  };

  var nativeGetStats = window.RTCPeerConnection.prototype.getStats;
  window.RTCPeerConnection.prototype.getStats = function getStats() {
    var _arguments = Array.prototype.slice.call(arguments),
        selector = _arguments[0],
        onSucc = _arguments[1],
        onErr = _arguments[2];

    return nativeGetStats.apply(this, [selector || null]).then(function (stats) {
      if (browserDetails.version < 53 && !onSucc) {
        // Shim only promise getStats with spec-hyphens in type names
        // Leave callback version alone; misc old uses of forEach before Map
        try {
          stats.forEach(function (stat) {
            stat.type = modernStatsTypes[stat.type] || stat.type;
          });
        } catch (e) {
          if (e.name !== 'TypeError') {
            throw e;
          }
          // Avoid TypeError: "type" is read-only, in old versions. 34-43ish
          stats.forEach(function (stat, i) {
            stats.set(i, Object.assign({}, stat, {
              type: modernStatsTypes[stat.type] || stat.type
            }));
          });
        }
      }
      return stats;
    }).then(onSucc, onErr);
  };
}

function shimSenderGetStats(window) {
  if (!((typeof window === 'undefined' ? 'undefined' : _typeof(window)) === 'object' && window.RTCPeerConnection && window.RTCRtpSender)) {
    return;
  }
  if (window.RTCRtpSender && 'getStats' in window.RTCRtpSender.prototype) {
    return;
  }
  var origGetSenders = window.RTCPeerConnection.prototype.getSenders;
  if (origGetSenders) {
    window.RTCPeerConnection.prototype.getSenders = function getSenders() {
      var _this = this;

      var senders = origGetSenders.apply(this, []);
      senders.forEach(function (sender) {
        return sender._pc = _this;
      });
      return senders;
    };
  }

  var origAddTrack = window.RTCPeerConnection.prototype.addTrack;
  if (origAddTrack) {
    window.RTCPeerConnection.prototype.addTrack = function addTrack() {
      var sender = origAddTrack.apply(this, arguments);
      sender._pc = this;
      return sender;
    };
  }
  window.RTCRtpSender.prototype.getStats = function getStats() {
    return this.track ? this._pc.getStats(this.track) : Promise.resolve(new Map());
  };
}

function shimReceiverGetStats(window) {
  if (!((typeof window === 'undefined' ? 'undefined' : _typeof(window)) === 'object' && window.RTCPeerConnection && window.RTCRtpSender)) {
    return;
  }
  if (window.RTCRtpSender && 'getStats' in window.RTCRtpReceiver.prototype) {
    return;
  }
  var origGetReceivers = window.RTCPeerConnection.prototype.getReceivers;
  if (origGetReceivers) {
    window.RTCPeerConnection.prototype.getReceivers = function getReceivers() {
      var _this2 = this;

      var receivers = origGetReceivers.apply(this, []);
      receivers.forEach(function (receiver) {
        return receiver._pc = _this2;
      });
      return receivers;
    };
  }
  utils.wrapPeerConnectionEvent(window, 'track', function (e) {
    e.receiver._pc = e.srcElement;
    return e;
  });
  window.RTCRtpReceiver.prototype.getStats = function getStats() {
    return this._pc.getStats(this.track);
  };
}

function shimRemoveStream(window) {
  if (!window.RTCPeerConnection || 'removeStream' in window.RTCPeerConnection.prototype) {
    return;
  }
  window.RTCPeerConnection.prototype.removeStream = function removeStream(stream) {
    var _this3 = this;

    utils.deprecated('removeStream', 'removeTrack');
    this.getSenders().forEach(function (sender) {
      if (sender.track && stream.getTracks().includes(sender.track)) {
        _this3.removeTrack(sender);
      }
    });
  };
}

function shimRTCDataChannel(window) {
  // rename DataChannel to RTCDataChannel (native fix in FF60):
  // https://bugzilla.mozilla.org/show_bug.cgi?id=1173851
  if (window.DataChannel && !window.RTCDataChannel) {
    window.RTCDataChannel = window.DataChannel;
  }
}

function shimAddTransceiver(window) {
  // https://github.com/webrtcHacks/adapter/issues/998#issuecomment-516921647
  // Firefox ignores the init sendEncodings options passed to addTransceiver
  // https://bugzilla.mozilla.org/show_bug.cgi?id=1396918
  if (!((typeof window === 'undefined' ? 'undefined' : _typeof(window)) === 'object' && window.RTCPeerConnection)) {
    return;
  }
  var origAddTransceiver = window.RTCPeerConnection.prototype.addTransceiver;
  if (origAddTransceiver) {
    window.RTCPeerConnection.prototype.addTransceiver = function addTransceiver() {
      this.setParametersPromises = [];
      var initParameters = arguments[1];
      var shouldPerformCheck = initParameters && 'sendEncodings' in initParameters;
      if (shouldPerformCheck) {
        // If sendEncodings params are provided, validate grammar
        initParameters.sendEncodings.forEach(function (encodingParam) {
          if ('rid' in encodingParam) {
            var ridRegex = /^[a-z0-9]{0,16}$/i;
            if (!ridRegex.test(encodingParam.rid)) {
              throw new TypeError('Invalid RID value provided.');
            }
          }
          if ('scaleResolutionDownBy' in encodingParam) {
            if (!(parseFloat(encodingParam.scaleResolutionDownBy) >= 1.0)) {
              throw new RangeError('scale_resolution_down_by must be >= 1.0');
            }
          }
          if ('maxFramerate' in encodingParam) {
            if (!(parseFloat(encodingParam.maxFramerate) >= 0)) {
              throw new RangeError('max_framerate must be >= 0.0');
            }
          }
        });
      }
      var transceiver = origAddTransceiver.apply(this, arguments);
      if (shouldPerformCheck) {
        // Check if the init options were applied. If not we do this in an
        // asynchronous way and save the promise reference in a global object.
        // This is an ugly hack, but at the same time is way more robust than
        // checking the sender parameters before and after the createOffer
        // Also note that after the createoffer we are not 100% sure that
        // the params were asynchronously applied so we might miss the
        // opportunity to recreate offer.
        var sender = transceiver.sender;

        var params = sender.getParameters();
        if (!('encodings' in params) ||
        // Avoid being fooled by patched getParameters() below.
        params.encodings.length === 1 && Object.keys(params.encodings[0]).length === 0) {
          params.encodings = initParameters.sendEncodings;
          sender.sendEncodings = initParameters.sendEncodings;
          this.setParametersPromises.push(sender.setParameters(params).then(function () {
            delete sender.sendEncodings;
          }).catch(function () {
            delete sender.sendEncodings;
          }));
        }
      }
      return transceiver;
    };
  }
}

function shimGetParameters(window) {
  if (!((typeof window === 'undefined' ? 'undefined' : _typeof(window)) === 'object' && window.RTCRtpSender)) {
    return;
  }
  var origGetParameters = window.RTCRtpSender.prototype.getParameters;
  if (origGetParameters) {
    window.RTCRtpSender.prototype.getParameters = function getParameters() {
      var params = origGetParameters.apply(this, arguments);
      if (!('encodings' in params)) {
        params.encodings = [].concat(this.sendEncodings || [{}]);
      }
      return params;
    };
  }
}

function shimCreateOffer(window) {
  // https://github.com/webrtcHacks/adapter/issues/998#issuecomment-516921647
  // Firefox ignores the init sendEncodings options passed to addTransceiver
  // https://bugzilla.mozilla.org/show_bug.cgi?id=1396918
  if (!((typeof window === 'undefined' ? 'undefined' : _typeof(window)) === 'object' && window.RTCPeerConnection)) {
    return;
  }
  var origCreateOffer = window.RTCPeerConnection.prototype.createOffer;
  window.RTCPeerConnection.prototype.createOffer = function createOffer() {
    var _this4 = this,
        _arguments2 = arguments;

    if (this.setParametersPromises && this.setParametersPromises.length) {
      return Promise.all(this.setParametersPromises).then(function () {
        return origCreateOffer.apply(_this4, _arguments2);
      }).finally(function () {
        _this4.setParametersPromises = [];
      });
    }
    return origCreateOffer.apply(this, arguments);
  };
}

function shimCreateAnswer(window) {
  // https://github.com/webrtcHacks/adapter/issues/998#issuecomment-516921647
  // Firefox ignores the init sendEncodings options passed to addTransceiver
  // https://bugzilla.mozilla.org/show_bug.cgi?id=1396918
  if (!((typeof window === 'undefined' ? 'undefined' : _typeof(window)) === 'object' && window.RTCPeerConnection)) {
    return;
  }
  var origCreateAnswer = window.RTCPeerConnection.prototype.createAnswer;
  window.RTCPeerConnection.prototype.createAnswer = function createAnswer() {
    var _this5 = this,
        _arguments3 = arguments;

    if (this.setParametersPromises && this.setParametersPromises.length) {
      return Promise.all(this.setParametersPromises).then(function () {
        return origCreateAnswer.apply(_this5, _arguments3);
      }).finally(function () {
        _this5.setParametersPromises = [];
      });
    }
    return origCreateAnswer.apply(this, arguments);
  };
}

},{"../utils":58,"./getdisplaymedia":55,"./getusermedia":56}],55:[function(require,module,exports){
/*
 *  Copyright (c) 2018 The adapter.js project authors. All Rights Reserved.
 *
 *  Use of this source code is governed by a BSD-style license
 *  that can be found in the LICENSE file in the root of the source
 *  tree.
 */
/* eslint-env node */
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.shimGetDisplayMedia = shimGetDisplayMedia;
function shimGetDisplayMedia(window, preferredMediaSource) {
  if (window.navigator.mediaDevices && 'getDisplayMedia' in window.navigator.mediaDevices) {
    return;
  }
  if (!window.navigator.mediaDevices) {
    return;
  }
  window.navigator.mediaDevices.getDisplayMedia = function getDisplayMedia(constraints) {
    if (!(constraints && constraints.video)) {
      var err = new DOMException('getDisplayMedia without video ' + 'constraints is undefined');
      err.name = 'NotFoundError';
      // from https://heycam.github.io/webidl/#idl-DOMException-error-names
      err.code = 8;
      return Promise.reject(err);
    }
    if (constraints.video === true) {
      constraints.video = { mediaSource: preferredMediaSource };
    } else {
      constraints.video.mediaSource = preferredMediaSource;
    }
    return window.navigator.mediaDevices.getUserMedia(constraints);
  };
}

},{}],56:[function(require,module,exports){
/*
 *  Copyright (c) 2016 The WebRTC project authors. All Rights Reserved.
 *
 *  Use of this source code is governed by a BSD-style license
 *  that can be found in the LICENSE file in the root of the source
 *  tree.
 */
/* eslint-env node */
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

exports.shimGetUserMedia = shimGetUserMedia;

var _utils = require('../utils');

var utils = _interopRequireWildcard(_utils);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function shimGetUserMedia(window, browserDetails) {
  var navigator = window && window.navigator;
  var MediaStreamTrack = window && window.MediaStreamTrack;

  navigator.getUserMedia = function (constraints, onSuccess, onError) {
    // Replace Firefox 44+'s deprecation warning with unprefixed version.
    utils.deprecated('navigator.getUserMedia', 'navigator.mediaDevices.getUserMedia');
    navigator.mediaDevices.getUserMedia(constraints).then(onSuccess, onError);
  };

  if (!(browserDetails.version > 55 && 'autoGainControl' in navigator.mediaDevices.getSupportedConstraints())) {
    var remap = function remap(obj, a, b) {
      if (a in obj && !(b in obj)) {
        obj[b] = obj[a];
        delete obj[a];
      }
    };

    var nativeGetUserMedia = navigator.mediaDevices.getUserMedia.bind(navigator.mediaDevices);
    navigator.mediaDevices.getUserMedia = function (c) {
      if ((typeof c === 'undefined' ? 'undefined' : _typeof(c)) === 'object' && _typeof(c.audio) === 'object') {
        c = JSON.parse(JSON.stringify(c));
        remap(c.audio, 'autoGainControl', 'mozAutoGainControl');
        remap(c.audio, 'noiseSuppression', 'mozNoiseSuppression');
      }
      return nativeGetUserMedia(c);
    };

    if (MediaStreamTrack && MediaStreamTrack.prototype.getSettings) {
      var nativeGetSettings = MediaStreamTrack.prototype.getSettings;
      MediaStreamTrack.prototype.getSettings = function () {
        var obj = nativeGetSettings.apply(this, arguments);
        remap(obj, 'mozAutoGainControl', 'autoGainControl');
        remap(obj, 'mozNoiseSuppression', 'noiseSuppression');
        return obj;
      };
    }

    if (MediaStreamTrack && MediaStreamTrack.prototype.applyConstraints) {
      var nativeApplyConstraints = MediaStreamTrack.prototype.applyConstraints;
      MediaStreamTrack.prototype.applyConstraints = function (c) {
        if (this.kind === 'audio' && (typeof c === 'undefined' ? 'undefined' : _typeof(c)) === 'object') {
          c = JSON.parse(JSON.stringify(c));
          remap(c, 'autoGainControl', 'mozAutoGainControl');
          remap(c, 'noiseSuppression', 'mozNoiseSuppression');
        }
        return nativeApplyConstraints.apply(this, [c]);
      };
    }
  }
}

},{"../utils":58}],57:[function(require,module,exports){
/*
 *  Copyright (c) 2016 The WebRTC project authors. All Rights Reserved.
 *
 *  Use of this source code is governed by a BSD-style license
 *  that can be found in the LICENSE file in the root of the source
 *  tree.
 */
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

exports.shimLocalStreamsAPI = shimLocalStreamsAPI;
exports.shimRemoteStreamsAPI = shimRemoteStreamsAPI;
exports.shimCallbacksAPI = shimCallbacksAPI;
exports.shimGetUserMedia = shimGetUserMedia;
exports.shimConstraints = shimConstraints;
exports.shimRTCIceServerUrls = shimRTCIceServerUrls;
exports.shimTrackEventTransceiver = shimTrackEventTransceiver;
exports.shimCreateOfferLegacy = shimCreateOfferLegacy;
exports.shimAudioContext = shimAudioContext;

var _utils = require('../utils');

var utils = _interopRequireWildcard(_utils);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function shimLocalStreamsAPI(window) {
  if ((typeof window === 'undefined' ? 'undefined' : _typeof(window)) !== 'object' || !window.RTCPeerConnection) {
    return;
  }
  if (!('getLocalStreams' in window.RTCPeerConnection.prototype)) {
    window.RTCPeerConnection.prototype.getLocalStreams = function getLocalStreams() {
      if (!this._localStreams) {
        this._localStreams = [];
      }
      return this._localStreams;
    };
  }
  if (!('addStream' in window.RTCPeerConnection.prototype)) {
    var _addTrack = window.RTCPeerConnection.prototype.addTrack;
    window.RTCPeerConnection.prototype.addStream = function addStream(stream) {
      var _this = this;

      if (!this._localStreams) {
        this._localStreams = [];
      }
      if (!this._localStreams.includes(stream)) {
        this._localStreams.push(stream);
      }
      // Try to emulate Chrome's behaviour of adding in audio-video order.
      // Safari orders by track id.
      stream.getAudioTracks().forEach(function (track) {
        return _addTrack.call(_this, track, stream);
      });
      stream.getVideoTracks().forEach(function (track) {
        return _addTrack.call(_this, track, stream);
      });
    };

    window.RTCPeerConnection.prototype.addTrack = function addTrack(track) {
      var _this2 = this;

      for (var _len = arguments.length, streams = Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
        streams[_key - 1] = arguments[_key];
      }

      if (streams) {
        streams.forEach(function (stream) {
          if (!_this2._localStreams) {
            _this2._localStreams = [stream];
          } else if (!_this2._localStreams.includes(stream)) {
            _this2._localStreams.push(stream);
          }
        });
      }
      return _addTrack.apply(this, arguments);
    };
  }
  if (!('removeStream' in window.RTCPeerConnection.prototype)) {
    window.RTCPeerConnection.prototype.removeStream = function removeStream(stream) {
      var _this3 = this;

      if (!this._localStreams) {
        this._localStreams = [];
      }
      var index = this._localStreams.indexOf(stream);
      if (index === -1) {
        return;
      }
      this._localStreams.splice(index, 1);
      var tracks = stream.getTracks();
      this.getSenders().forEach(function (sender) {
        if (tracks.includes(sender.track)) {
          _this3.removeTrack(sender);
        }
      });
    };
  }
}

function shimRemoteStreamsAPI(window) {
  if ((typeof window === 'undefined' ? 'undefined' : _typeof(window)) !== 'object' || !window.RTCPeerConnection) {
    return;
  }
  if (!('getRemoteStreams' in window.RTCPeerConnection.prototype)) {
    window.RTCPeerConnection.prototype.getRemoteStreams = function getRemoteStreams() {
      return this._remoteStreams ? this._remoteStreams : [];
    };
  }
  if (!('onaddstream' in window.RTCPeerConnection.prototype)) {
    Object.defineProperty(window.RTCPeerConnection.prototype, 'onaddstream', {
      get: function get() {
        return this._onaddstream;
      },
      set: function set(f) {
        var _this4 = this;

        if (this._onaddstream) {
          this.removeEventListener('addstream', this._onaddstream);
          this.removeEventListener('track', this._onaddstreampoly);
        }
        this.addEventListener('addstream', this._onaddstream = f);
        this.addEventListener('track', this._onaddstreampoly = function (e) {
          e.streams.forEach(function (stream) {
            if (!_this4._remoteStreams) {
              _this4._remoteStreams = [];
            }
            if (_this4._remoteStreams.includes(stream)) {
              return;
            }
            _this4._remoteStreams.push(stream);
            var event = new Event('addstream');
            event.stream = stream;
            _this4.dispatchEvent(event);
          });
        });
      }
    });
    var origSetRemoteDescription = window.RTCPeerConnection.prototype.setRemoteDescription;
    window.RTCPeerConnection.prototype.setRemoteDescription = function setRemoteDescription() {
      var pc = this;
      if (!this._onaddstreampoly) {
        this.addEventListener('track', this._onaddstreampoly = function (e) {
          e.streams.forEach(function (stream) {
            if (!pc._remoteStreams) {
              pc._remoteStreams = [];
            }
            if (pc._remoteStreams.indexOf(stream) >= 0) {
              return;
            }
            pc._remoteStreams.push(stream);
            var event = new Event('addstream');
            event.stream = stream;
            pc.dispatchEvent(event);
          });
        });
      }
      return origSetRemoteDescription.apply(pc, arguments);
    };
  }
}

function shimCallbacksAPI(window) {
  if ((typeof window === 'undefined' ? 'undefined' : _typeof(window)) !== 'object' || !window.RTCPeerConnection) {
    return;
  }
  var prototype = window.RTCPeerConnection.prototype;
  var origCreateOffer = prototype.createOffer;
  var origCreateAnswer = prototype.createAnswer;
  var setLocalDescription = prototype.setLocalDescription;
  var setRemoteDescription = prototype.setRemoteDescription;
  var addIceCandidate = prototype.addIceCandidate;

  prototype.createOffer = function createOffer(successCallback, failureCallback) {
    var options = arguments.length >= 2 ? arguments[2] : arguments[0];
    var promise = origCreateOffer.apply(this, [options]);
    if (!failureCallback) {
      return promise;
    }
    promise.then(successCallback, failureCallback);
    return Promise.resolve();
  };

  prototype.createAnswer = function createAnswer(successCallback, failureCallback) {
    var options = arguments.length >= 2 ? arguments[2] : arguments[0];
    var promise = origCreateAnswer.apply(this, [options]);
    if (!failureCallback) {
      return promise;
    }
    promise.then(successCallback, failureCallback);
    return Promise.resolve();
  };

  var withCallback = function withCallback(description, successCallback, failureCallback) {
    var promise = setLocalDescription.apply(this, [description]);
    if (!failureCallback) {
      return promise;
    }
    promise.then(successCallback, failureCallback);
    return Promise.resolve();
  };
  prototype.setLocalDescription = withCallback;

  withCallback = function withCallback(description, successCallback, failureCallback) {
    var promise = setRemoteDescription.apply(this, [description]);
    if (!failureCallback) {
      return promise;
    }
    promise.then(successCallback, failureCallback);
    return Promise.resolve();
  };
  prototype.setRemoteDescription = withCallback;

  withCallback = function withCallback(candidate, successCallback, failureCallback) {
    var promise = addIceCandidate.apply(this, [candidate]);
    if (!failureCallback) {
      return promise;
    }
    promise.then(successCallback, failureCallback);
    return Promise.resolve();
  };
  prototype.addIceCandidate = withCallback;
}

function shimGetUserMedia(window) {
  var navigator = window && window.navigator;

  if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
    // shim not needed in Safari 12.1
    var mediaDevices = navigator.mediaDevices;
    var _getUserMedia = mediaDevices.getUserMedia.bind(mediaDevices);
    navigator.mediaDevices.getUserMedia = function (constraints) {
      return _getUserMedia(shimConstraints(constraints));
    };
  }

  if (!navigator.getUserMedia && navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
    navigator.getUserMedia = function getUserMedia(constraints, cb, errcb) {
      navigator.mediaDevices.getUserMedia(constraints).then(cb, errcb);
    }.bind(navigator);
  }
}

function shimConstraints(constraints) {
  if (constraints && constraints.video !== undefined) {
    return Object.assign({}, constraints, { video: utils.compactObject(constraints.video) });
  }

  return constraints;
}

function shimRTCIceServerUrls(window) {
  if (!window.RTCPeerConnection) {
    return;
  }
  // migrate from non-spec RTCIceServer.url to RTCIceServer.urls
  var OrigPeerConnection = window.RTCPeerConnection;
  window.RTCPeerConnection = function RTCPeerConnection(pcConfig, pcConstraints) {
    if (pcConfig && pcConfig.iceServers) {
      var newIceServers = [];
      for (var i = 0; i < pcConfig.iceServers.length; i++) {
        var server = pcConfig.iceServers[i];
        if (!server.hasOwnProperty('urls') && server.hasOwnProperty('url')) {
          utils.deprecated('RTCIceServer.url', 'RTCIceServer.urls');
          server = JSON.parse(JSON.stringify(server));
          server.urls = server.url;
          delete server.url;
          newIceServers.push(server);
        } else {
          newIceServers.push(pcConfig.iceServers[i]);
        }
      }
      pcConfig.iceServers = newIceServers;
    }
    return new OrigPeerConnection(pcConfig, pcConstraints);
  };
  window.RTCPeerConnection.prototype = OrigPeerConnection.prototype;
  // wrap static methods. Currently just generateCertificate.
  if ('generateCertificate' in OrigPeerConnection) {
    Object.defineProperty(window.RTCPeerConnection, 'generateCertificate', {
      get: function get() {
        return OrigPeerConnection.generateCertificate;
      }
    });
  }
}

function shimTrackEventTransceiver(window) {
  // Add event.transceiver member over deprecated event.receiver
  if ((typeof window === 'undefined' ? 'undefined' : _typeof(window)) === 'object' && window.RTCTrackEvent && 'receiver' in window.RTCTrackEvent.prototype && !('transceiver' in window.RTCTrackEvent.prototype)) {
    Object.defineProperty(window.RTCTrackEvent.prototype, 'transceiver', {
      get: function get() {
        return { receiver: this.receiver };
      }
    });
  }
}

function shimCreateOfferLegacy(window) {
  var origCreateOffer = window.RTCPeerConnection.prototype.createOffer;
  window.RTCPeerConnection.prototype.createOffer = function createOffer(offerOptions) {
    if (offerOptions) {
      if (typeof offerOptions.offerToReceiveAudio !== 'undefined') {
        // support bit values
        offerOptions.offerToReceiveAudio = !!offerOptions.offerToReceiveAudio;
      }
      var audioTransceiver = this.getTransceivers().find(function (transceiver) {
        return transceiver.receiver.track.kind === 'audio';
      });
      if (offerOptions.offerToReceiveAudio === false && audioTransceiver) {
        if (audioTransceiver.direction === 'sendrecv') {
          if (audioTransceiver.setDirection) {
            audioTransceiver.setDirection('sendonly');
          } else {
            audioTransceiver.direction = 'sendonly';
          }
        } else if (audioTransceiver.direction === 'recvonly') {
          if (audioTransceiver.setDirection) {
            audioTransceiver.setDirection('inactive');
          } else {
            audioTransceiver.direction = 'inactive';
          }
        }
      } else if (offerOptions.offerToReceiveAudio === true && !audioTransceiver) {
        this.addTransceiver('audio');
      }

      if (typeof offerOptions.offerToReceiveVideo !== 'undefined') {
        // support bit values
        offerOptions.offerToReceiveVideo = !!offerOptions.offerToReceiveVideo;
      }
      var videoTransceiver = this.getTransceivers().find(function (transceiver) {
        return transceiver.receiver.track.kind === 'video';
      });
      if (offerOptions.offerToReceiveVideo === false && videoTransceiver) {
        if (videoTransceiver.direction === 'sendrecv') {
          if (videoTransceiver.setDirection) {
            videoTransceiver.setDirection('sendonly');
          } else {
            videoTransceiver.direction = 'sendonly';
          }
        } else if (videoTransceiver.direction === 'recvonly') {
          if (videoTransceiver.setDirection) {
            videoTransceiver.setDirection('inactive');
          } else {
            videoTransceiver.direction = 'inactive';
          }
        }
      } else if (offerOptions.offerToReceiveVideo === true && !videoTransceiver) {
        this.addTransceiver('video');
      }
    }
    return origCreateOffer.apply(this, arguments);
  };
}

function shimAudioContext(window) {
  if ((typeof window === 'undefined' ? 'undefined' : _typeof(window)) !== 'object' || window.AudioContext) {
    return;
  }
  window.AudioContext = window.webkitAudioContext;
}

},{"../utils":58}],58:[function(require,module,exports){
/*
 *  Copyright (c) 2016 The WebRTC project authors. All Rights Reserved.
 *
 *  Use of this source code is governed by a BSD-style license
 *  that can be found in the LICENSE file in the root of the source
 *  tree.
 */
/* eslint-env node */
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

exports.extractVersion = extractVersion;
exports.wrapPeerConnectionEvent = wrapPeerConnectionEvent;
exports.disableLog = disableLog;
exports.disableWarnings = disableWarnings;
exports.log = log;
exports.deprecated = deprecated;
exports.detectBrowser = detectBrowser;
exports.compactObject = compactObject;
exports.walkStats = walkStats;
exports.filterStats = filterStats;

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

var logDisabled_ = true;
var deprecationWarnings_ = true;

/**
 * Extract browser version out of the provided user agent string.
 *
 * @param {!string} uastring userAgent string.
 * @param {!string} expr Regular expression used as match criteria.
 * @param {!number} pos position in the version string to be returned.
 * @return {!number} browser version.
 */
function extractVersion(uastring, expr, pos) {
  var match = uastring.match(expr);
  return match && match.length >= pos && parseInt(match[pos], 10);
}

// Wraps the peerconnection event eventNameToWrap in a function
// which returns the modified event object (or false to prevent
// the event).
function wrapPeerConnectionEvent(window, eventNameToWrap, wrapper) {
  if (!window.RTCPeerConnection) {
    return;
  }
  var proto = window.RTCPeerConnection.prototype;
  var nativeAddEventListener = proto.addEventListener;
  proto.addEventListener = function (nativeEventName, cb) {
    if (nativeEventName !== eventNameToWrap) {
      return nativeAddEventListener.apply(this, arguments);
    }
    var wrappedCallback = function wrappedCallback(e) {
      var modifiedEvent = wrapper(e);
      if (modifiedEvent) {
        if (cb.handleEvent) {
          cb.handleEvent(modifiedEvent);
        } else {
          cb(modifiedEvent);
        }
      }
    };
    this._eventMap = this._eventMap || {};
    if (!this._eventMap[eventNameToWrap]) {
      this._eventMap[eventNameToWrap] = new Map();
    }
    this._eventMap[eventNameToWrap].set(cb, wrappedCallback);
    return nativeAddEventListener.apply(this, [nativeEventName, wrappedCallback]);
  };

  var nativeRemoveEventListener = proto.removeEventListener;
  proto.removeEventListener = function (nativeEventName, cb) {
    if (nativeEventName !== eventNameToWrap || !this._eventMap || !this._eventMap[eventNameToWrap]) {
      return nativeRemoveEventListener.apply(this, arguments);
    }
    if (!this._eventMap[eventNameToWrap].has(cb)) {
      return nativeRemoveEventListener.apply(this, arguments);
    }
    var unwrappedCb = this._eventMap[eventNameToWrap].get(cb);
    this._eventMap[eventNameToWrap].delete(cb);
    if (this._eventMap[eventNameToWrap].size === 0) {
      delete this._eventMap[eventNameToWrap];
    }
    if (Object.keys(this._eventMap).length === 0) {
      delete this._eventMap;
    }
    return nativeRemoveEventListener.apply(this, [nativeEventName, unwrappedCb]);
  };

  Object.defineProperty(proto, 'on' + eventNameToWrap, {
    get: function get() {
      return this['_on' + eventNameToWrap];
    },
    set: function set(cb) {
      if (this['_on' + eventNameToWrap]) {
        this.removeEventListener(eventNameToWrap, this['_on' + eventNameToWrap]);
        delete this['_on' + eventNameToWrap];
      }
      if (cb) {
        this.addEventListener(eventNameToWrap, this['_on' + eventNameToWrap] = cb);
      }
    },

    enumerable: true,
    configurable: true
  });
}

function disableLog(bool) {
  if (typeof bool !== 'boolean') {
    return new Error('Argument type: ' + (typeof bool === 'undefined' ? 'undefined' : _typeof(bool)) + '. Please use a boolean.');
  }
  logDisabled_ = bool;
  return bool ? 'adapter.js logging disabled' : 'adapter.js logging enabled';
}

/**
 * Disable or enable deprecation warnings
 * @param {!boolean} bool set to true to disable warnings.
 */
function disableWarnings(bool) {
  if (typeof bool !== 'boolean') {
    return new Error('Argument type: ' + (typeof bool === 'undefined' ? 'undefined' : _typeof(bool)) + '. Please use a boolean.');
  }
  deprecationWarnings_ = !bool;
  return 'adapter.js deprecation warnings ' + (bool ? 'disabled' : 'enabled');
}

function log() {
  if ((typeof window === 'undefined' ? 'undefined' : _typeof(window)) === 'object') {
    if (logDisabled_) {
      return;
    }
    if (typeof console !== 'undefined' && typeof console.log === 'function') {
      console.log.apply(console, arguments);
    }
  }
}

/**
 * Shows a deprecation warning suggesting the modern and spec-compatible API.
 */
function deprecated(oldMethod, newMethod) {
  if (!deprecationWarnings_) {
    return;
  }
  console.warn(oldMethod + ' is deprecated, please use ' + newMethod + ' instead.');
}

/**
 * Browser detector.
 *
 * @return {object} result containing browser and version
 *     properties.
 */
function detectBrowser(window) {
  // Returned result object.
  var result = { browser: null, version: null };

  // Fail early if it's not a browser
  if (typeof window === 'undefined' || !window.navigator) {
    result.browser = 'Not a browser.';
    return result;
  }

  var navigator = window.navigator;


  if (navigator.mozGetUserMedia) {
    // Firefox.
    result.browser = 'firefox';
    result.version = extractVersion(navigator.userAgent, /Firefox\/(\d+)\./, 1);
  } else if (navigator.webkitGetUserMedia || window.isSecureContext === false && window.webkitRTCPeerConnection && !window.RTCIceGatherer) {
    // Chrome, Chromium, Webview, Opera.
    // Version matches Chrome/WebRTC version.
    // Chrome 74 removed webkitGetUserMedia on http as well so we need the
    // more complicated fallback to webkitRTCPeerConnection.
    result.browser = 'chrome';
    result.version = extractVersion(navigator.userAgent, /Chrom(e|ium)\/(\d+)\./, 2);
  } else if (navigator.mediaDevices && navigator.userAgent.match(/Edge\/(\d+).(\d+)$/)) {
    // Edge.
    result.browser = 'edge';
    result.version = extractVersion(navigator.userAgent, /Edge\/(\d+).(\d+)$/, 2);
  } else if (window.RTCPeerConnection && navigator.userAgent.match(/AppleWebKit\/(\d+)\./)) {
    // Safari.
    result.browser = 'safari';
    result.version = extractVersion(navigator.userAgent, /AppleWebKit\/(\d+)\./, 1);
    result.supportsUnifiedPlan = window.RTCRtpTransceiver && 'currentDirection' in window.RTCRtpTransceiver.prototype;
  } else {
    // Default fallthrough: not supported.
    result.browser = 'Not a supported browser.';
    return result;
  }

  return result;
}

/**
 * Checks if something is an object.
 *
 * @param {*} val The something you want to check.
 * @return true if val is an object, false otherwise.
 */
function isObject(val) {
  return Object.prototype.toString.call(val) === '[object Object]';
}

/**
 * Remove all empty objects and undefined values
 * from a nested object -- an enhanced and vanilla version
 * of Lodash's `compact`.
 */
function compactObject(data) {
  if (!isObject(data)) {
    return data;
  }

  return Object.keys(data).reduce(function (accumulator, key) {
    var isObj = isObject(data[key]);
    var value = isObj ? compactObject(data[key]) : data[key];
    var isEmptyObject = isObj && !Object.keys(value).length;
    if (value === undefined || isEmptyObject) {
      return accumulator;
    }
    return Object.assign(accumulator, _defineProperty({}, key, value));
  }, {});
}

/* iterates the stats graph recursively. */
function walkStats(stats, base, resultSet) {
  if (!base || resultSet.has(base.id)) {
    return;
  }
  resultSet.set(base.id, base);
  Object.keys(base).forEach(function (name) {
    if (name.endsWith('Id')) {
      walkStats(stats, stats.get(base[name]), resultSet);
    } else if (name.endsWith('Ids')) {
      base[name].forEach(function (id) {
        walkStats(stats, stats.get(id), resultSet);
      });
    }
  });
}

/* filter getStats for a sender/receiver track. */
function filterStats(result, track, outbound) {
  var streamStatsType = outbound ? 'outbound-rtp' : 'inbound-rtp';
  var filteredResult = new Map();
  if (track === null) {
    return filteredResult;
  }
  var trackStats = [];
  result.forEach(function (value) {
    if (value.type === 'track' && value.trackIdentifier === track.id) {
      trackStats.push(value);
    }
  });
  trackStats.forEach(function (trackStat) {
    result.forEach(function (stats) {
      if (stats.type === streamStatsType && stats.trackId === trackStat.id) {
        walkStats(result, stats, filteredResult);
      }
    });
  });
  return filteredResult;
}

},{}],"@boardgame.io/p2p":[function(require,module,exports){
"use strict";
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.P2P = exports.generateCredentials = void 0;
const peerjs_1 = __importDefault(require("peerjs"));
const tweetnacl_1 = require("tweetnacl");
const tweetnacl_util_1 = require("tweetnacl-util");
const internal_1 = require("boardgame.io/internal");
const host_1 = require("./host");
const authentication_1 = require("./authentication");
var authentication_2 = require("./authentication");
Object.defineProperty(exports, "generateCredentials", { enumerable: true, get: function () { return authentication_2.generateCredentials; } });
/**
 * Abstraction around `setTimeout`/`clearTimeout` that doubles the timeout
 * interval each time it is run until reaches a maximum interval length.
 */
class BackoffScheduler {
    constructor() {
        this.initialInterval = 500;
        this.maxInterval = 32000;
        this.interval = this.initialInterval;
    }
    cancelTask() {
        if (this.taskID) {
            clearTimeout(this.taskID);
            delete this.taskID;
        }
    }
    schedule(task) {
        this.cancelTask();
        this.taskID = setTimeout(() => {
            if (this.interval < this.maxInterval)
                this.interval *= 2;
            task();
        }, this.interval);
    }
    clear() {
        this.cancelTask();
        this.interval = this.initialInterval;
    }
}
class P2PTransport extends internal_1.Transport {
    constructor(_a) {
        var { isHost, 
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        onError = () => { }, peerOptions = {} } = _a, opts = __rest(_a, ["isHost", "onError", "peerOptions"]);
        super(opts);
        this.peer = null;
        this.isHost = Boolean(isHost);
        this.onError = onError;
        this.peerOptions = peerOptions;
        this.game = opts.game;
        this.retryHandler = new BackoffScheduler();
        this.setCredentials(opts.credentials);
    }
    /** Synthesized peer ID for looking up this match’s host. */
    get hostID() {
        if (!this.matchID)
            throw new Error("matchID must be provided");
        // Sanitize host ID for PeerJS: remove any non-alphanumeric characters, trim
        // leading/trailing hyphens/underscores and collapse consecutive hyphens/underscores.
        return `boardgameio-${this.gameName}-matchid-${this.matchID}`.replace(/([^A-Za-z0-9_-]|^[_-]+|[_-]+$|(?<=[_-])[_-]+)/g, "");
    }
    /** Keep credentials and encryption keys in sync. */
    setCredentials(credentials) {
        if (!credentials) {
            this.privateKey = this.credentials = undefined;
            return;
        }
        // TODO: implement a real sha256 not just sha512 and cut of the end!
        const seed = (0, tweetnacl_1.hash)((0, tweetnacl_util_1.decodeUTF8)(credentials)).slice(0, 32);
        const { publicKey, secretKey } = tweetnacl_1.sign.keyPair.fromSeed(seed);
        this.credentials = (0, tweetnacl_util_1.encodeBase64)(publicKey);
        this.privateKey = (0, tweetnacl_util_1.encodeBase64)(secretKey);
    }
    /** Client metadata for this client instance. */
    get metadata() {
        return {
            playerID: this.playerID,
            credentials: this.credentials,
            message: this.playerID && this.privateKey
                ? (0, authentication_1.signMessage)(this.playerID, this.privateKey)
                : undefined,
        };
    }
    connect() {
        this.peer = new peerjs_1.default(this.isHost ? this.hostID : undefined, this.peerOptions);
        if (this.isHost) {
            const host = new host_1.P2PHost({
                game: this.game,
                numPlayers: this.numPlayers,
                matchID: this.matchID,
            });
            // Process actions locally.
            this.emit = (action) => void host.processAction(action);
            // Register a local client for the host that applies updates directly to itself.
            host.registerClient({
                send: (data) => void this.notifyClient(data),
                metadata: this.metadata,
            });
            // When a peer connects to the host, register it and set up event handlers.
            this.peer.on("connection", (client) => {
                host.registerClient(client);
                client.on("data", (data) => void host.processAction(data));
                client.on("close", () => void host.unregisterClient(client));
            });
            this.peer.on("error", this.onError);
            this.onConnect();
        }
        else {
            this.peer.on("open", () => void this.connectToHost());
            this.peer.on("error", (error) => {
                if (error.type === "network" || error.type === "peer-unavailable") {
                    this.retryHandler.schedule(() => void this.connectToHost());
                }
                else {
                    this.onError(error);
                }
            });
        }
    }
    /** Establish a connection to a remote host from a peer client. */
    connectToHost() {
        if (!this.peer)
            return;
        const host = this.peer.connect(this.hostID, { metadata: this.metadata });
        // Forward actions to the host.
        this.emit = (action) => void host.send(action);
        // Emit sync action when a connection to the host is established.
        host.on("open", () => void this.onConnect());
        // Apply updates received from the host.
        host.on("data", (data) => void this.notifyClient(data));
    }
    /** Execute tasks once the connection to a remote or local host has been established. */
    onConnect() {
        this.retryHandler.clear();
        this.setConnectionStatus(true);
        this.requestSync();
    }
    disconnect() {
        if (this.peer)
            this.peer.destroy();
        this.peer = null;
        this.retryHandler.clear();
        this.setConnectionStatus(false);
    }
    requestSync() {
        if (!this.emit)
            return;
        this.emit({
            type: "sync",
            args: [this.matchID, this.playerID, this.credentials, this.numPlayers],
        });
    }
    sendAction(state, action) {
        if (!this.emit)
            return;
        this.emit({
            type: "update",
            args: [action, state._stateID, this.matchID, this.playerID],
        });
    }
    sendChatMessage(matchID, chatMessage) {
        if (!this.emit)
            return;
        this.emit({ type: "chat", args: [matchID, chatMessage, this.credentials] });
    }
    reconnect() {
        this.disconnect();
        this.connect();
    }
    updateMatchID(id) {
        this.matchID = id;
        this.reconnect();
    }
    updatePlayerID(id) {
        this.playerID = id;
        this.reconnect();
    }
    updateCredentials(credentials) {
        this.setCredentials(credentials);
        this.reconnect();
    }
}
/**
 * Experimental peer-to-peer multiplayer transport for boardgame.io.
 *
 * @param p2pOpts Transport configuration options.
 * @param p2pOpts.isHost Boolean flag to indicate if this client is responsible for the authoritative game state.
 * @param p2pOpts.onError Error callback.
 * @param p2pOpts.peerOptions Options to pass when instantiating a new PeerJS `Peer`.
 * @returns A transport factory for use by a boardgame.io client.
 * @example
 * import { Client } from 'boardgame.io/client';
 * import { P2P } from '@boardgame.io/p2p';
 * import { MyGame } from './game';
 *
 * const matchID = 'random-id-string';
 *
 * // Host clients maintain the authoritative game state and manage
 * // communication between all other peers.
 * const hostClient = Client({
 *   game: MyGame,
 *   matchID,
 *   playerID: '0',
 *   credentials: 'string-to-protect-playerID-zero',
 *   multiplayer: P2P({ isHost: true }),
 * });
 *
 * // Peer clients look up a host using the `matchID` and communicate
 * // with the host much like they would with a server.
 * const peerClient = Client({
 *   game: MyGame,
 *   matchID,
 *   playerID: '1',
 *   credentials: 'string-to-protect-playerID-one',
 *   multiplayer: P2P(),
 * });
 */
const P2P = (p2pOpts = {}) => (transportOpts) => new P2PTransport(Object.assign(Object.assign({}, transportOpts), p2pOpts));
exports.P2P = P2P;

},{"./authentication":3,"./host":5,"boardgame.io/internal":13,"peerjs":31,"tweetnacl":6,"tweetnacl-util":43}],"boardgame.io/ai":[function(require,module,exports){
'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

require('./turn-order-8e019db0.js');
require('immer');
require('./plugin-random-7425844d.js');
require('lodash.isplainobject');
require('./reducer-943f1bac.js');
require('rfc6902');
require('setimmediate');
var ai = require('./ai-d0173761.js');



exports.Bot = ai.Bot;
exports.MCTSBot = ai.MCTSBot;
exports.RandomBot = ai.RandomBot;
exports.Simulate = ai.Simulate;
exports.Step = ai.Step;

},{"./ai-d0173761.js":8,"./plugin-random-7425844d.js":16,"./reducer-943f1bac.js":17,"./turn-order-8e019db0.js":19,"immer":26,"lodash.isplainobject":27,"rfc6902":35,"setimmediate":41}],"boardgame.io/client":[function(require,module,exports){
'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

require('nanoid/non-secure');
require('./Debug-7b0fdc7a.js');
require('redux');
require('./turn-order-8e019db0.js');
require('immer');
require('./plugin-random-7425844d.js');
require('lodash.isplainobject');
require('./reducer-943f1bac.js');
require('rfc6902');
require('./initialize-45c7e6ee.js');
require('./transport-b1874dfa.js');
var client = require('./client-9782c171.js');
require('flatted');
require('setimmediate');
require('./ai-d0173761.js');
var client$1 = require('./client-76dec77b.js');



exports.Client = client.Client;
exports.LobbyClient = client$1.LobbyClient;
exports.LobbyClientError = client$1.LobbyClientError;

},{"./Debug-7b0fdc7a.js":7,"./ai-d0173761.js":8,"./client-76dec77b.js":9,"./client-9782c171.js":10,"./initialize-45c7e6ee.js":12,"./plugin-random-7425844d.js":16,"./reducer-943f1bac.js":17,"./transport-b1874dfa.js":18,"./turn-order-8e019db0.js":19,"flatted":23,"immer":26,"lodash.isplainobject":27,"nanoid/non-secure":28,"redux":33,"rfc6902":35,"setimmediate":41}],"boardgame.io/debug":[function(require,module,exports){
'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var Debug = require('./Debug-7b0fdc7a.js');
require('./turn-order-8e019db0.js');
require('immer');
require('./plugin-random-7425844d.js');
require('lodash.isplainobject');
require('./reducer-943f1bac.js');
require('rfc6902');
require('flatted');
require('setimmediate');
require('./ai-d0173761.js');



exports.Debug = Debug.Debug;

},{"./Debug-7b0fdc7a.js":7,"./ai-d0173761.js":8,"./plugin-random-7425844d.js":16,"./reducer-943f1bac.js":17,"./turn-order-8e019db0.js":19,"flatted":23,"immer":26,"lodash.isplainobject":27,"rfc6902":35,"setimmediate":41}]},{},[]);
