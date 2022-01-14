class DenoStdInternalError extends Error {
    constructor(message){
        super(message);
        this.name = "DenoStdInternalError";
    }
}
function assert(expr, msg = "") {
    if (!expr) {
        throw new DenoStdInternalError(msg);
    }
}
const osType = (()=>{
    const { Deno: Deno1  } = globalThis;
    if (typeof Deno1?.build?.os === "string") {
        return Deno1.build.os;
    }
    const { navigator  } = globalThis;
    if (navigator?.appVersion?.includes?.("Win") ?? false) {
        return "windows";
    }
    return "linux";
})();
const isWindows = osType === "windows";
const CHAR_FORWARD_SLASH = 47;
function assertPath(path4) {
    if (typeof path4 !== "string") {
        throw new TypeError(`Path must be a string. Received ${JSON.stringify(path4)}`);
    }
}
function isPosixPathSeparator(code) {
    return code === 47;
}
function isPathSeparator(code) {
    return isPosixPathSeparator(code) || code === 92;
}
function isWindowsDeviceRoot(code) {
    return code >= 97 && code <= 122 || code >= 65 && code <= 90;
}
function normalizeString(path5, allowAboveRoot, separator, isPathSeparator1) {
    let res = "";
    let lastSegmentLength = 0;
    let lastSlash = -1;
    let dots = 0;
    let code;
    for(let i = 0, len = path5.length; i <= len; ++i){
        if (i < len) code = path5.charCodeAt(i);
        else if (isPathSeparator1(code)) break;
        else code = CHAR_FORWARD_SLASH;
        if (isPathSeparator1(code)) {
            if (lastSlash === i - 1 || dots === 1) {} else if (lastSlash !== i - 1 && dots === 2) {
                if (res.length < 2 || lastSegmentLength !== 2 || res.charCodeAt(res.length - 1) !== 46 || res.charCodeAt(res.length - 2) !== 46) {
                    if (res.length > 2) {
                        const lastSlashIndex = res.lastIndexOf(separator);
                        if (lastSlashIndex === -1) {
                            res = "";
                            lastSegmentLength = 0;
                        } else {
                            res = res.slice(0, lastSlashIndex);
                            lastSegmentLength = res.length - 1 - res.lastIndexOf(separator);
                        }
                        lastSlash = i;
                        dots = 0;
                        continue;
                    } else if (res.length === 2 || res.length === 1) {
                        res = "";
                        lastSegmentLength = 0;
                        lastSlash = i;
                        dots = 0;
                        continue;
                    }
                }
                if (allowAboveRoot) {
                    if (res.length > 0) res += `${separator}..`;
                    else res = "..";
                    lastSegmentLength = 2;
                }
            } else {
                if (res.length > 0) res += separator + path5.slice(lastSlash + 1, i);
                else res = path5.slice(lastSlash + 1, i);
                lastSegmentLength = i - lastSlash - 1;
            }
            lastSlash = i;
            dots = 0;
        } else if (code === 46 && dots !== -1) {
            ++dots;
        } else {
            dots = -1;
        }
    }
    return res;
}
function _format(sep6, pathObject) {
    const dir = pathObject.dir || pathObject.root;
    const base = pathObject.base || (pathObject.name || "") + (pathObject.ext || "");
    if (!dir) return base;
    if (dir === pathObject.root) return dir + base;
    return dir + sep6 + base;
}
const WHITESPACE_ENCODINGS = {
    "\u0009": "%09",
    "\u000A": "%0A",
    "\u000B": "%0B",
    "\u000C": "%0C",
    "\u000D": "%0D",
    "\u0020": "%20"
};
function encodeWhitespace(string) {
    return string.replaceAll(/[\s]/g, (c)=>{
        return WHITESPACE_ENCODINGS[c] ?? c;
    });
}
const sep = "\\";
const delimiter = ";";
function resolve(...pathSegments) {
    let resolvedDevice = "";
    let resolvedTail = "";
    let resolvedAbsolute = false;
    for(let i = pathSegments.length - 1; i >= -1; i--){
        let path6;
        const { Deno: Deno2  } = globalThis;
        if (i >= 0) {
            path6 = pathSegments[i];
        } else if (!resolvedDevice) {
            if (typeof Deno2?.cwd !== "function") {
                throw new TypeError("Resolved a drive-letter-less path without a CWD.");
            }
            path6 = Deno2.cwd();
        } else {
            if (typeof Deno2?.env?.get !== "function" || typeof Deno2?.cwd !== "function") {
                throw new TypeError("Resolved a relative path without a CWD.");
            }
            path6 = Deno2.cwd();
            if (path6 === undefined || path6.slice(0, 3).toLowerCase() !== `${resolvedDevice.toLowerCase()}\\`) {
                path6 = `${resolvedDevice}\\`;
            }
        }
        assertPath(path6);
        const len = path6.length;
        if (len === 0) continue;
        let rootEnd = 0;
        let device = "";
        let isAbsolute1 = false;
        const code = path6.charCodeAt(0);
        if (len > 1) {
            if (isPathSeparator(code)) {
                isAbsolute1 = true;
                if (isPathSeparator(path6.charCodeAt(1))) {
                    let j = 2;
                    let last = j;
                    for(; j < len; ++j){
                        if (isPathSeparator(path6.charCodeAt(j))) break;
                    }
                    if (j < len && j !== last) {
                        const firstPart = path6.slice(last, j);
                        last = j;
                        for(; j < len; ++j){
                            if (!isPathSeparator(path6.charCodeAt(j))) break;
                        }
                        if (j < len && j !== last) {
                            last = j;
                            for(; j < len; ++j){
                                if (isPathSeparator(path6.charCodeAt(j))) break;
                            }
                            if (j === len) {
                                device = `\\\\${firstPart}\\${path6.slice(last)}`;
                                rootEnd = j;
                            } else if (j !== last) {
                                device = `\\\\${firstPart}\\${path6.slice(last, j)}`;
                                rootEnd = j;
                            }
                        }
                    }
                } else {
                    rootEnd = 1;
                }
            } else if (isWindowsDeviceRoot(code)) {
                if (path6.charCodeAt(1) === 58) {
                    device = path6.slice(0, 2);
                    rootEnd = 2;
                    if (len > 2) {
                        if (isPathSeparator(path6.charCodeAt(2))) {
                            isAbsolute1 = true;
                            rootEnd = 3;
                        }
                    }
                }
            }
        } else if (isPathSeparator(code)) {
            rootEnd = 1;
            isAbsolute1 = true;
        }
        if (device.length > 0 && resolvedDevice.length > 0 && device.toLowerCase() !== resolvedDevice.toLowerCase()) {
            continue;
        }
        if (resolvedDevice.length === 0 && device.length > 0) {
            resolvedDevice = device;
        }
        if (!resolvedAbsolute) {
            resolvedTail = `${path6.slice(rootEnd)}\\${resolvedTail}`;
            resolvedAbsolute = isAbsolute1;
        }
        if (resolvedAbsolute && resolvedDevice.length > 0) break;
    }
    resolvedTail = normalizeString(resolvedTail, !resolvedAbsolute, "\\", isPathSeparator);
    return resolvedDevice + (resolvedAbsolute ? "\\" : "") + resolvedTail || ".";
}
function normalize(path7) {
    assertPath(path7);
    const len = path7.length;
    if (len === 0) return ".";
    let rootEnd = 0;
    let device;
    let isAbsolute2 = false;
    const code = path7.charCodeAt(0);
    if (len > 1) {
        if (isPathSeparator(code)) {
            isAbsolute2 = true;
            if (isPathSeparator(path7.charCodeAt(1))) {
                let j = 2;
                let last = j;
                for(; j < len; ++j){
                    if (isPathSeparator(path7.charCodeAt(j))) break;
                }
                if (j < len && j !== last) {
                    const firstPart = path7.slice(last, j);
                    last = j;
                    for(; j < len; ++j){
                        if (!isPathSeparator(path7.charCodeAt(j))) break;
                    }
                    if (j < len && j !== last) {
                        last = j;
                        for(; j < len; ++j){
                            if (isPathSeparator(path7.charCodeAt(j))) break;
                        }
                        if (j === len) {
                            return `\\\\${firstPart}\\${path7.slice(last)}\\`;
                        } else if (j !== last) {
                            device = `\\\\${firstPart}\\${path7.slice(last, j)}`;
                            rootEnd = j;
                        }
                    }
                }
            } else {
                rootEnd = 1;
            }
        } else if (isWindowsDeviceRoot(code)) {
            if (path7.charCodeAt(1) === 58) {
                device = path7.slice(0, 2);
                rootEnd = 2;
                if (len > 2) {
                    if (isPathSeparator(path7.charCodeAt(2))) {
                        isAbsolute2 = true;
                        rootEnd = 3;
                    }
                }
            }
        }
    } else if (isPathSeparator(code)) {
        return "\\";
    }
    let tail;
    if (rootEnd < len) {
        tail = normalizeString(path7.slice(rootEnd), !isAbsolute2, "\\", isPathSeparator);
    } else {
        tail = "";
    }
    if (tail.length === 0 && !isAbsolute2) tail = ".";
    if (tail.length > 0 && isPathSeparator(path7.charCodeAt(len - 1))) {
        tail += "\\";
    }
    if (device === undefined) {
        if (isAbsolute2) {
            if (tail.length > 0) return `\\${tail}`;
            else return "\\";
        } else if (tail.length > 0) {
            return tail;
        } else {
            return "";
        }
    } else if (isAbsolute2) {
        if (tail.length > 0) return `${device}\\${tail}`;
        else return `${device}\\`;
    } else if (tail.length > 0) {
        return device + tail;
    } else {
        return device;
    }
}
function isAbsolute(path8) {
    assertPath(path8);
    const len = path8.length;
    if (len === 0) return false;
    const code = path8.charCodeAt(0);
    if (isPathSeparator(code)) {
        return true;
    } else if (isWindowsDeviceRoot(code)) {
        if (len > 2 && path8.charCodeAt(1) === 58) {
            if (isPathSeparator(path8.charCodeAt(2))) return true;
        }
    }
    return false;
}
function join(...paths) {
    const pathsCount = paths.length;
    if (pathsCount === 0) return ".";
    let joined;
    let firstPart = null;
    for(let i = 0; i < pathsCount; ++i){
        const path9 = paths[i];
        assertPath(path9);
        if (path9.length > 0) {
            if (joined === undefined) joined = firstPart = path9;
            else joined += `\\${path9}`;
        }
    }
    if (joined === undefined) return ".";
    let needsReplace = true;
    let slashCount = 0;
    assert(firstPart != null);
    if (isPathSeparator(firstPart.charCodeAt(0))) {
        ++slashCount;
        const firstLen = firstPart.length;
        if (firstLen > 1) {
            if (isPathSeparator(firstPart.charCodeAt(1))) {
                ++slashCount;
                if (firstLen > 2) {
                    if (isPathSeparator(firstPart.charCodeAt(2))) ++slashCount;
                    else {
                        needsReplace = false;
                    }
                }
            }
        }
    }
    if (needsReplace) {
        for(; slashCount < joined.length; ++slashCount){
            if (!isPathSeparator(joined.charCodeAt(slashCount))) break;
        }
        if (slashCount >= 2) joined = `\\${joined.slice(slashCount)}`;
    }
    return normalize(joined);
}
function relative(from, to) {
    assertPath(from);
    assertPath(to);
    if (from === to) return "";
    const fromOrig = resolve(from);
    const toOrig = resolve(to);
    if (fromOrig === toOrig) return "";
    from = fromOrig.toLowerCase();
    to = toOrig.toLowerCase();
    if (from === to) return "";
    let fromStart = 0;
    let fromEnd = from.length;
    for(; fromStart < fromEnd; ++fromStart){
        if (from.charCodeAt(fromStart) !== 92) break;
    }
    for(; fromEnd - 1 > fromStart; --fromEnd){
        if (from.charCodeAt(fromEnd - 1) !== 92) break;
    }
    const fromLen = fromEnd - fromStart;
    let toStart = 0;
    let toEnd = to.length;
    for(; toStart < toEnd; ++toStart){
        if (to.charCodeAt(toStart) !== 92) break;
    }
    for(; toEnd - 1 > toStart; --toEnd){
        if (to.charCodeAt(toEnd - 1) !== 92) break;
    }
    const toLen = toEnd - toStart;
    const length = fromLen < toLen ? fromLen : toLen;
    let lastCommonSep = -1;
    let i = 0;
    for(; i <= length; ++i){
        if (i === length) {
            if (toLen > length) {
                if (to.charCodeAt(toStart + i) === 92) {
                    return toOrig.slice(toStart + i + 1);
                } else if (i === 2) {
                    return toOrig.slice(toStart + i);
                }
            }
            if (fromLen > length) {
                if (from.charCodeAt(fromStart + i) === 92) {
                    lastCommonSep = i;
                } else if (i === 2) {
                    lastCommonSep = 3;
                }
            }
            break;
        }
        const fromCode = from.charCodeAt(fromStart + i);
        const toCode = to.charCodeAt(toStart + i);
        if (fromCode !== toCode) break;
        else if (fromCode === 92) lastCommonSep = i;
    }
    if (i !== length && lastCommonSep === -1) {
        return toOrig;
    }
    let out = "";
    if (lastCommonSep === -1) lastCommonSep = 0;
    for(i = fromStart + lastCommonSep + 1; i <= fromEnd; ++i){
        if (i === fromEnd || from.charCodeAt(i) === 92) {
            if (out.length === 0) out += "..";
            else out += "\\..";
        }
    }
    if (out.length > 0) {
        return out + toOrig.slice(toStart + lastCommonSep, toEnd);
    } else {
        toStart += lastCommonSep;
        if (toOrig.charCodeAt(toStart) === 92) ++toStart;
        return toOrig.slice(toStart, toEnd);
    }
}
function toNamespacedPath(path10) {
    if (typeof path10 !== "string") return path10;
    if (path10.length === 0) return "";
    const resolvedPath = resolve(path10);
    if (resolvedPath.length >= 3) {
        if (resolvedPath.charCodeAt(0) === 92) {
            if (resolvedPath.charCodeAt(1) === 92) {
                const code = resolvedPath.charCodeAt(2);
                if (code !== 63 && code !== 46) {
                    return `\\\\?\\UNC\\${resolvedPath.slice(2)}`;
                }
            }
        } else if (isWindowsDeviceRoot(resolvedPath.charCodeAt(0))) {
            if (resolvedPath.charCodeAt(1) === 58 && resolvedPath.charCodeAt(2) === 92) {
                return `\\\\?\\${resolvedPath}`;
            }
        }
    }
    return path10;
}
function dirname(path11) {
    assertPath(path11);
    const len = path11.length;
    if (len === 0) return ".";
    let rootEnd = -1;
    let end = -1;
    let matchedSlash = true;
    let offset = 0;
    const code = path11.charCodeAt(0);
    if (len > 1) {
        if (isPathSeparator(code)) {
            rootEnd = offset = 1;
            if (isPathSeparator(path11.charCodeAt(1))) {
                let j = 2;
                let last = j;
                for(; j < len; ++j){
                    if (isPathSeparator(path11.charCodeAt(j))) break;
                }
                if (j < len && j !== last) {
                    last = j;
                    for(; j < len; ++j){
                        if (!isPathSeparator(path11.charCodeAt(j))) break;
                    }
                    if (j < len && j !== last) {
                        last = j;
                        for(; j < len; ++j){
                            if (isPathSeparator(path11.charCodeAt(j))) break;
                        }
                        if (j === len) {
                            return path11;
                        }
                        if (j !== last) {
                            rootEnd = offset = j + 1;
                        }
                    }
                }
            }
        } else if (isWindowsDeviceRoot(code)) {
            if (path11.charCodeAt(1) === 58) {
                rootEnd = offset = 2;
                if (len > 2) {
                    if (isPathSeparator(path11.charCodeAt(2))) rootEnd = offset = 3;
                }
            }
        }
    } else if (isPathSeparator(code)) {
        return path11;
    }
    for(let i = len - 1; i >= offset; --i){
        if (isPathSeparator(path11.charCodeAt(i))) {
            if (!matchedSlash) {
                end = i;
                break;
            }
        } else {
            matchedSlash = false;
        }
    }
    if (end === -1) {
        if (rootEnd === -1) return ".";
        else end = rootEnd;
    }
    return path11.slice(0, end);
}
function basename(path12, ext = "") {
    if (ext !== undefined && typeof ext !== "string") {
        throw new TypeError('"ext" argument must be a string');
    }
    assertPath(path12);
    let start = 0;
    let end = -1;
    let matchedSlash = true;
    let i;
    if (path12.length >= 2) {
        const drive = path12.charCodeAt(0);
        if (isWindowsDeviceRoot(drive)) {
            if (path12.charCodeAt(1) === 58) start = 2;
        }
    }
    if (ext !== undefined && ext.length > 0 && ext.length <= path12.length) {
        if (ext.length === path12.length && ext === path12) return "";
        let extIdx = ext.length - 1;
        let firstNonSlashEnd = -1;
        for(i = path12.length - 1; i >= start; --i){
            const code = path12.charCodeAt(i);
            if (isPathSeparator(code)) {
                if (!matchedSlash) {
                    start = i + 1;
                    break;
                }
            } else {
                if (firstNonSlashEnd === -1) {
                    matchedSlash = false;
                    firstNonSlashEnd = i + 1;
                }
                if (extIdx >= 0) {
                    if (code === ext.charCodeAt(extIdx)) {
                        if (--extIdx === -1) {
                            end = i;
                        }
                    } else {
                        extIdx = -1;
                        end = firstNonSlashEnd;
                    }
                }
            }
        }
        if (start === end) end = firstNonSlashEnd;
        else if (end === -1) end = path12.length;
        return path12.slice(start, end);
    } else {
        for(i = path12.length - 1; i >= start; --i){
            if (isPathSeparator(path12.charCodeAt(i))) {
                if (!matchedSlash) {
                    start = i + 1;
                    break;
                }
            } else if (end === -1) {
                matchedSlash = false;
                end = i + 1;
            }
        }
        if (end === -1) return "";
        return path12.slice(start, end);
    }
}
function extname(path13) {
    assertPath(path13);
    let start = 0;
    let startDot = -1;
    let startPart = 0;
    let end = -1;
    let matchedSlash = true;
    let preDotState = 0;
    if (path13.length >= 2 && path13.charCodeAt(1) === 58 && isWindowsDeviceRoot(path13.charCodeAt(0))) {
        start = startPart = 2;
    }
    for(let i = path13.length - 1; i >= start; --i){
        const code = path13.charCodeAt(i);
        if (isPathSeparator(code)) {
            if (!matchedSlash) {
                startPart = i + 1;
                break;
            }
            continue;
        }
        if (end === -1) {
            matchedSlash = false;
            end = i + 1;
        }
        if (code === 46) {
            if (startDot === -1) startDot = i;
            else if (preDotState !== 1) preDotState = 1;
        } else if (startDot !== -1) {
            preDotState = -1;
        }
    }
    if (startDot === -1 || end === -1 || preDotState === 0 || preDotState === 1 && startDot === end - 1 && startDot === startPart + 1) {
        return "";
    }
    return path13.slice(startDot, end);
}
function format(pathObject) {
    if (pathObject === null || typeof pathObject !== "object") {
        throw new TypeError(`The "pathObject" argument must be of type Object. Received type ${typeof pathObject}`);
    }
    return _format("\\", pathObject);
}
function parse(path14) {
    assertPath(path14);
    const ret = {
        root: "",
        dir: "",
        base: "",
        ext: "",
        name: ""
    };
    const len = path14.length;
    if (len === 0) return ret;
    let rootEnd = 0;
    let code = path14.charCodeAt(0);
    if (len > 1) {
        if (isPathSeparator(code)) {
            rootEnd = 1;
            if (isPathSeparator(path14.charCodeAt(1))) {
                let j = 2;
                let last = j;
                for(; j < len; ++j){
                    if (isPathSeparator(path14.charCodeAt(j))) break;
                }
                if (j < len && j !== last) {
                    last = j;
                    for(; j < len; ++j){
                        if (!isPathSeparator(path14.charCodeAt(j))) break;
                    }
                    if (j < len && j !== last) {
                        last = j;
                        for(; j < len; ++j){
                            if (isPathSeparator(path14.charCodeAt(j))) break;
                        }
                        if (j === len) {
                            rootEnd = j;
                        } else if (j !== last) {
                            rootEnd = j + 1;
                        }
                    }
                }
            }
        } else if (isWindowsDeviceRoot(code)) {
            if (path14.charCodeAt(1) === 58) {
                rootEnd = 2;
                if (len > 2) {
                    if (isPathSeparator(path14.charCodeAt(2))) {
                        if (len === 3) {
                            ret.root = ret.dir = path14;
                            return ret;
                        }
                        rootEnd = 3;
                    }
                } else {
                    ret.root = ret.dir = path14;
                    return ret;
                }
            }
        }
    } else if (isPathSeparator(code)) {
        ret.root = ret.dir = path14;
        return ret;
    }
    if (rootEnd > 0) ret.root = path14.slice(0, rootEnd);
    let startDot = -1;
    let startPart = rootEnd;
    let end = -1;
    let matchedSlash = true;
    let i = path14.length - 1;
    let preDotState = 0;
    for(; i >= rootEnd; --i){
        code = path14.charCodeAt(i);
        if (isPathSeparator(code)) {
            if (!matchedSlash) {
                startPart = i + 1;
                break;
            }
            continue;
        }
        if (end === -1) {
            matchedSlash = false;
            end = i + 1;
        }
        if (code === 46) {
            if (startDot === -1) startDot = i;
            else if (preDotState !== 1) preDotState = 1;
        } else if (startDot !== -1) {
            preDotState = -1;
        }
    }
    if (startDot === -1 || end === -1 || preDotState === 0 || preDotState === 1 && startDot === end - 1 && startDot === startPart + 1) {
        if (end !== -1) {
            ret.base = ret.name = path14.slice(startPart, end);
        }
    } else {
        ret.name = path14.slice(startPart, startDot);
        ret.base = path14.slice(startPart, end);
        ret.ext = path14.slice(startDot, end);
    }
    if (startPart > 0 && startPart !== rootEnd) {
        ret.dir = path14.slice(0, startPart - 1);
    } else ret.dir = ret.root;
    return ret;
}
function fromFileUrl(url) {
    url = url instanceof URL ? url : new URL(url);
    if (url.protocol != "file:") {
        throw new TypeError("Must be a file URL.");
    }
    let path15 = decodeURIComponent(url.pathname.replace(/\//g, "\\").replace(/%(?![0-9A-Fa-f]{2})/g, "%25")).replace(/^\\*([A-Za-z]:)(\\|$)/, "$1\\");
    if (url.hostname != "") {
        path15 = `\\\\${url.hostname}${path15}`;
    }
    return path15;
}
function toFileUrl(path16) {
    if (!isAbsolute(path16)) {
        throw new TypeError("Must be an absolute path.");
    }
    const [, hostname, pathname] = path16.match(/^(?:[/\\]{2}([^/\\]+)(?=[/\\](?:[^/\\]|$)))?(.*)/);
    const url = new URL("file:///");
    url.pathname = encodeWhitespace(pathname.replace(/%/g, "%25"));
    if (hostname != null && hostname != "localhost") {
        url.hostname = hostname;
        if (!url.hostname) {
            throw new TypeError("Invalid hostname.");
        }
    }
    return url;
}
const mod = {
    sep: sep,
    delimiter: delimiter,
    resolve: resolve,
    normalize: normalize,
    isAbsolute: isAbsolute,
    join: join,
    relative: relative,
    toNamespacedPath: toNamespacedPath,
    dirname: dirname,
    basename: basename,
    extname: extname,
    format: format,
    parse: parse,
    fromFileUrl: fromFileUrl,
    toFileUrl: toFileUrl
};
const sep1 = "/";
const delimiter1 = ":";
function resolve1(...pathSegments) {
    let resolvedPath = "";
    let resolvedAbsolute = false;
    for(let i = pathSegments.length - 1; i >= -1 && !resolvedAbsolute; i--){
        let path17;
        if (i >= 0) path17 = pathSegments[i];
        else {
            const { Deno: Deno3  } = globalThis;
            if (typeof Deno3?.cwd !== "function") {
                throw new TypeError("Resolved a relative path without a CWD.");
            }
            path17 = Deno3.cwd();
        }
        assertPath(path17);
        if (path17.length === 0) {
            continue;
        }
        resolvedPath = `${path17}/${resolvedPath}`;
        resolvedAbsolute = path17.charCodeAt(0) === CHAR_FORWARD_SLASH;
    }
    resolvedPath = normalizeString(resolvedPath, !resolvedAbsolute, "/", isPosixPathSeparator);
    if (resolvedAbsolute) {
        if (resolvedPath.length > 0) return `/${resolvedPath}`;
        else return "/";
    } else if (resolvedPath.length > 0) return resolvedPath;
    else return ".";
}
function normalize1(path18) {
    assertPath(path18);
    if (path18.length === 0) return ".";
    const isAbsolute1 = path18.charCodeAt(0) === 47;
    const trailingSeparator = path18.charCodeAt(path18.length - 1) === 47;
    path18 = normalizeString(path18, !isAbsolute1, "/", isPosixPathSeparator);
    if (path18.length === 0 && !isAbsolute1) path18 = ".";
    if (path18.length > 0 && trailingSeparator) path18 += "/";
    if (isAbsolute1) return `/${path18}`;
    return path18;
}
function isAbsolute1(path19) {
    assertPath(path19);
    return path19.length > 0 && path19.charCodeAt(0) === 47;
}
function join1(...paths) {
    if (paths.length === 0) return ".";
    let joined;
    for(let i = 0, len = paths.length; i < len; ++i){
        const path20 = paths[i];
        assertPath(path20);
        if (path20.length > 0) {
            if (!joined) joined = path20;
            else joined += `/${path20}`;
        }
    }
    if (!joined) return ".";
    return normalize1(joined);
}
function relative1(from, to) {
    assertPath(from);
    assertPath(to);
    if (from === to) return "";
    from = resolve1(from);
    to = resolve1(to);
    if (from === to) return "";
    let fromStart = 1;
    const fromEnd = from.length;
    for(; fromStart < fromEnd; ++fromStart){
        if (from.charCodeAt(fromStart) !== 47) break;
    }
    const fromLen = fromEnd - fromStart;
    let toStart = 1;
    const toEnd = to.length;
    for(; toStart < toEnd; ++toStart){
        if (to.charCodeAt(toStart) !== 47) break;
    }
    const toLen = toEnd - toStart;
    const length = fromLen < toLen ? fromLen : toLen;
    let lastCommonSep = -1;
    let i = 0;
    for(; i <= length; ++i){
        if (i === length) {
            if (toLen > length) {
                if (to.charCodeAt(toStart + i) === 47) {
                    return to.slice(toStart + i + 1);
                } else if (i === 0) {
                    return to.slice(toStart + i);
                }
            } else if (fromLen > length) {
                if (from.charCodeAt(fromStart + i) === 47) {
                    lastCommonSep = i;
                } else if (i === 0) {
                    lastCommonSep = 0;
                }
            }
            break;
        }
        const fromCode = from.charCodeAt(fromStart + i);
        const toCode = to.charCodeAt(toStart + i);
        if (fromCode !== toCode) break;
        else if (fromCode === 47) lastCommonSep = i;
    }
    let out = "";
    for(i = fromStart + lastCommonSep + 1; i <= fromEnd; ++i){
        if (i === fromEnd || from.charCodeAt(i) === 47) {
            if (out.length === 0) out += "..";
            else out += "/..";
        }
    }
    if (out.length > 0) return out + to.slice(toStart + lastCommonSep);
    else {
        toStart += lastCommonSep;
        if (to.charCodeAt(toStart) === 47) ++toStart;
        return to.slice(toStart);
    }
}
function toNamespacedPath1(path21) {
    return path21;
}
function dirname1(path22) {
    assertPath(path22);
    if (path22.length === 0) return ".";
    const hasRoot = path22.charCodeAt(0) === 47;
    let end = -1;
    let matchedSlash = true;
    for(let i = path22.length - 1; i >= 1; --i){
        if (path22.charCodeAt(i) === 47) {
            if (!matchedSlash) {
                end = i;
                break;
            }
        } else {
            matchedSlash = false;
        }
    }
    if (end === -1) return hasRoot ? "/" : ".";
    if (hasRoot && end === 1) return "//";
    return path22.slice(0, end);
}
function basename1(path23, ext = "") {
    if (ext !== undefined && typeof ext !== "string") {
        throw new TypeError('"ext" argument must be a string');
    }
    assertPath(path23);
    let start = 0;
    let end = -1;
    let matchedSlash = true;
    let i;
    if (ext !== undefined && ext.length > 0 && ext.length <= path23.length) {
        if (ext.length === path23.length && ext === path23) return "";
        let extIdx = ext.length - 1;
        let firstNonSlashEnd = -1;
        for(i = path23.length - 1; i >= 0; --i){
            const code = path23.charCodeAt(i);
            if (code === 47) {
                if (!matchedSlash) {
                    start = i + 1;
                    break;
                }
            } else {
                if (firstNonSlashEnd === -1) {
                    matchedSlash = false;
                    firstNonSlashEnd = i + 1;
                }
                if (extIdx >= 0) {
                    if (code === ext.charCodeAt(extIdx)) {
                        if (--extIdx === -1) {
                            end = i;
                        }
                    } else {
                        extIdx = -1;
                        end = firstNonSlashEnd;
                    }
                }
            }
        }
        if (start === end) end = firstNonSlashEnd;
        else if (end === -1) end = path23.length;
        return path23.slice(start, end);
    } else {
        for(i = path23.length - 1; i >= 0; --i){
            if (path23.charCodeAt(i) === 47) {
                if (!matchedSlash) {
                    start = i + 1;
                    break;
                }
            } else if (end === -1) {
                matchedSlash = false;
                end = i + 1;
            }
        }
        if (end === -1) return "";
        return path23.slice(start, end);
    }
}
function extname1(path24) {
    assertPath(path24);
    let startDot = -1;
    let startPart = 0;
    let end = -1;
    let matchedSlash = true;
    let preDotState = 0;
    for(let i = path24.length - 1; i >= 0; --i){
        const code = path24.charCodeAt(i);
        if (code === 47) {
            if (!matchedSlash) {
                startPart = i + 1;
                break;
            }
            continue;
        }
        if (end === -1) {
            matchedSlash = false;
            end = i + 1;
        }
        if (code === 46) {
            if (startDot === -1) startDot = i;
            else if (preDotState !== 1) preDotState = 1;
        } else if (startDot !== -1) {
            preDotState = -1;
        }
    }
    if (startDot === -1 || end === -1 || preDotState === 0 || preDotState === 1 && startDot === end - 1 && startDot === startPart + 1) {
        return "";
    }
    return path24.slice(startDot, end);
}
function format1(pathObject) {
    if (pathObject === null || typeof pathObject !== "object") {
        throw new TypeError(`The "pathObject" argument must be of type Object. Received type ${typeof pathObject}`);
    }
    return _format("/", pathObject);
}
function parse1(path25) {
    assertPath(path25);
    const ret = {
        root: "",
        dir: "",
        base: "",
        ext: "",
        name: ""
    };
    if (path25.length === 0) return ret;
    const isAbsolute2 = path25.charCodeAt(0) === 47;
    let start;
    if (isAbsolute2) {
        ret.root = "/";
        start = 1;
    } else {
        start = 0;
    }
    let startDot = -1;
    let startPart = 0;
    let end = -1;
    let matchedSlash = true;
    let i = path25.length - 1;
    let preDotState = 0;
    for(; i >= start; --i){
        const code = path25.charCodeAt(i);
        if (code === 47) {
            if (!matchedSlash) {
                startPart = i + 1;
                break;
            }
            continue;
        }
        if (end === -1) {
            matchedSlash = false;
            end = i + 1;
        }
        if (code === 46) {
            if (startDot === -1) startDot = i;
            else if (preDotState !== 1) preDotState = 1;
        } else if (startDot !== -1) {
            preDotState = -1;
        }
    }
    if (startDot === -1 || end === -1 || preDotState === 0 || preDotState === 1 && startDot === end - 1 && startDot === startPart + 1) {
        if (end !== -1) {
            if (startPart === 0 && isAbsolute2) {
                ret.base = ret.name = path25.slice(1, end);
            } else {
                ret.base = ret.name = path25.slice(startPart, end);
            }
        }
    } else {
        if (startPart === 0 && isAbsolute2) {
            ret.name = path25.slice(1, startDot);
            ret.base = path25.slice(1, end);
        } else {
            ret.name = path25.slice(startPart, startDot);
            ret.base = path25.slice(startPart, end);
        }
        ret.ext = path25.slice(startDot, end);
    }
    if (startPart > 0) ret.dir = path25.slice(0, startPart - 1);
    else if (isAbsolute2) ret.dir = "/";
    return ret;
}
function fromFileUrl1(url) {
    url = url instanceof URL ? url : new URL(url);
    if (url.protocol != "file:") {
        throw new TypeError("Must be a file URL.");
    }
    return decodeURIComponent(url.pathname.replace(/%(?![0-9A-Fa-f]{2})/g, "%25"));
}
function toFileUrl1(path26) {
    if (!isAbsolute1(path26)) {
        throw new TypeError("Must be an absolute path.");
    }
    const url = new URL("file:///");
    url.pathname = encodeWhitespace(path26.replace(/%/g, "%25").replace(/\\/g, "%5C"));
    return url;
}
const mod1 = {
    sep: sep1,
    delimiter: delimiter1,
    resolve: resolve1,
    normalize: normalize1,
    isAbsolute: isAbsolute1,
    join: join1,
    relative: relative1,
    toNamespacedPath: toNamespacedPath1,
    dirname: dirname1,
    basename: basename1,
    extname: extname1,
    format: format1,
    parse: parse1,
    fromFileUrl: fromFileUrl1,
    toFileUrl: toFileUrl1
};
const path = isWindows ? mod : mod1;
const { join: join2 , normalize: normalize2  } = path;
const path1 = isWindows ? mod : mod1;
const { basename: basename2 , delimiter: delimiter2 , dirname: dirname2 , extname: extname2 , format: format2 , fromFileUrl: fromFileUrl2 , isAbsolute: isAbsolute2 , join: join3 , normalize: normalize3 , parse: parse2 , relative: relative2 , resolve: resolve2 , sep: sep2 , toFileUrl: toFileUrl2 , toNamespacedPath: toNamespacedPath2 ,  } = path1;
async function _createWalkEntry(path27) {
    path27 = normalize3(path27);
    const name = basename2(path27);
    const info = await Deno.stat(path27);
    return {
        path: path27,
        name,
        isFile: info.isFile,
        isDirectory: info.isDirectory,
        isSymlink: info.isSymlink
    };
}
function include(path28, exts, match, skip) {
    if (exts && !exts.some((ext)=>path28.endsWith(ext)
    )) {
        return false;
    }
    if (match && !match.some((pattern)=>!!path28.match(pattern)
    )) {
        return false;
    }
    if (skip && skip.some((pattern)=>!!path28.match(pattern)
    )) {
        return false;
    }
    return true;
}
function wrapErrorWithRootPath(err, root) {
    if (err instanceof Error && "root" in err) return err;
    const e = new Error();
    e.root = root;
    e.message = err instanceof Error ? `${err.message} for path "${root}"` : `[non-error thrown] for path "${root}"`;
    e.stack = err instanceof Error ? err.stack : undefined;
    e.cause = err instanceof Error ? err.cause : undefined;
    return e;
}
async function* walk(root, { maxDepth =Infinity , includeFiles =true , includeDirs =true , followSymlinks =false , exts =undefined , match =undefined , skip =undefined  } = {}) {
    if (maxDepth < 0) {
        return;
    }
    if (includeDirs && include(root, exts, match, skip)) {
        yield await _createWalkEntry(root);
    }
    if (maxDepth < 1 || !include(root, undefined, undefined, skip)) {
        return;
    }
    try {
        for await (const entry of Deno.readDir(root)){
            assert(entry.name != null);
            let path29 = join3(root, entry.name);
            let isFile = entry.isFile;
            if (entry.isSymlink) {
                if (followSymlinks) {
                    path29 = await Deno.realPath(path29);
                    isFile = await Deno.lstat(path29).then((s)=>s.isFile
                    );
                } else {
                    continue;
                }
            }
            if (isFile) {
                if (includeFiles && include(path29, exts, match, skip)) {
                    yield {
                        path: path29,
                        ...entry
                    };
                }
            } else {
                yield* walk(path29, {
                    maxDepth: maxDepth - 1,
                    includeFiles,
                    includeDirs,
                    followSymlinks,
                    exts,
                    match,
                    skip
                });
            }
        }
    } catch (err) {
        throw wrapErrorWithRootPath(err, normalize3(root));
    }
}
class Tokenizer {
    rules;
    constructor(rules = []){
        this.rules = rules;
    }
    addRule(test, fn) {
        this.rules.push({
            test,
            fn
        });
        return this;
    }
    tokenize(string, receiver = (token)=>token
    ) {
        function* generator(rules) {
            let index1 = 0;
            for (const rule of rules){
                const result = rule.test(string);
                if (result) {
                    const { value , length  } = result;
                    index1 += length;
                    string = string.slice(length);
                    const token = {
                        ...rule.fn(value),
                        index: index1
                    };
                    yield receiver(token);
                    yield* generator(rules);
                }
            }
        }
        const tokenGenerator = generator(this.rules);
        const tokens = [];
        for (const token1 of tokenGenerator){
            tokens.push(token1);
        }
        if (string.length) {
            throw new Error(`parser error: string not fully parsed! ${string.slice(0, 25)}`);
        }
        return tokens;
    }
}
function digits(value, count = 2) {
    return String(value).padStart(count, "0");
}
function createLiteralTestFunction(value) {
    return (string)=>{
        return string.startsWith(value) ? {
            value,
            length: value.length
        } : undefined;
    };
}
function createMatchTestFunction(match) {
    return (string)=>{
        const result = match.exec(string);
        if (result) return {
            value: result,
            length: result[0].length
        };
    };
}
const defaultRules = [
    {
        test: createLiteralTestFunction("yyyy"),
        fn: ()=>({
                type: "year",
                value: "numeric"
            })
    },
    {
        test: createLiteralTestFunction("yy"),
        fn: ()=>({
                type: "year",
                value: "2-digit"
            })
    },
    {
        test: createLiteralTestFunction("MM"),
        fn: ()=>({
                type: "month",
                value: "2-digit"
            })
    },
    {
        test: createLiteralTestFunction("M"),
        fn: ()=>({
                type: "month",
                value: "numeric"
            })
    },
    {
        test: createLiteralTestFunction("dd"),
        fn: ()=>({
                type: "day",
                value: "2-digit"
            })
    },
    {
        test: createLiteralTestFunction("d"),
        fn: ()=>({
                type: "day",
                value: "numeric"
            })
    },
    {
        test: createLiteralTestFunction("HH"),
        fn: ()=>({
                type: "hour",
                value: "2-digit"
            })
    },
    {
        test: createLiteralTestFunction("H"),
        fn: ()=>({
                type: "hour",
                value: "numeric"
            })
    },
    {
        test: createLiteralTestFunction("hh"),
        fn: ()=>({
                type: "hour",
                value: "2-digit",
                hour12: true
            })
    },
    {
        test: createLiteralTestFunction("h"),
        fn: ()=>({
                type: "hour",
                value: "numeric",
                hour12: true
            })
    },
    {
        test: createLiteralTestFunction("mm"),
        fn: ()=>({
                type: "minute",
                value: "2-digit"
            })
    },
    {
        test: createLiteralTestFunction("m"),
        fn: ()=>({
                type: "minute",
                value: "numeric"
            })
    },
    {
        test: createLiteralTestFunction("ss"),
        fn: ()=>({
                type: "second",
                value: "2-digit"
            })
    },
    {
        test: createLiteralTestFunction("s"),
        fn: ()=>({
                type: "second",
                value: "numeric"
            })
    },
    {
        test: createLiteralTestFunction("SSS"),
        fn: ()=>({
                type: "fractionalSecond",
                value: 3
            })
    },
    {
        test: createLiteralTestFunction("SS"),
        fn: ()=>({
                type: "fractionalSecond",
                value: 2
            })
    },
    {
        test: createLiteralTestFunction("S"),
        fn: ()=>({
                type: "fractionalSecond",
                value: 1
            })
    },
    {
        test: createLiteralTestFunction("a"),
        fn: (value)=>({
                type: "dayPeriod",
                value: value
            })
    },
    {
        test: createMatchTestFunction(/^(')(?<value>\\.|[^\']*)\1/),
        fn: (match)=>({
                type: "literal",
                value: match.groups.value
            })
    },
    {
        test: createMatchTestFunction(/^.+?\s*/),
        fn: (match)=>({
                type: "literal",
                value: match[0]
            })
    }, 
];
class DateTimeFormatter {
    #format;
    constructor(formatString, rules = defaultRules){
        const tokenizer = new Tokenizer(rules);
        this.#format = tokenizer.tokenize(formatString, ({ type , value , hour12  })=>{
            const result = {
                type,
                value
            };
            if (hour12) result.hour12 = hour12;
            return result;
        });
    }
    format(date, options = {}) {
        let string = "";
        const utc = options.timeZone === "UTC";
        for (const token of this.#format){
            const type = token.type;
            switch(type){
                case "year":
                    {
                        const value = utc ? date.getUTCFullYear() : date.getFullYear();
                        switch(token.value){
                            case "numeric":
                                {
                                    string += value;
                                    break;
                                }
                            case "2-digit":
                                {
                                    string += digits(value, 2).slice(-2);
                                    break;
                                }
                            default:
                                throw Error(`FormatterError: value "${token.value}" is not supported`);
                        }
                        break;
                    }
                case "month":
                    {
                        const value = (utc ? date.getUTCMonth() : date.getMonth()) + 1;
                        switch(token.value){
                            case "numeric":
                                {
                                    string += value;
                                    break;
                                }
                            case "2-digit":
                                {
                                    string += digits(value, 2);
                                    break;
                                }
                            default:
                                throw Error(`FormatterError: value "${token.value}" is not supported`);
                        }
                        break;
                    }
                case "day":
                    {
                        const value = utc ? date.getUTCDate() : date.getDate();
                        switch(token.value){
                            case "numeric":
                                {
                                    string += value;
                                    break;
                                }
                            case "2-digit":
                                {
                                    string += digits(value, 2);
                                    break;
                                }
                            default:
                                throw Error(`FormatterError: value "${token.value}" is not supported`);
                        }
                        break;
                    }
                case "hour":
                    {
                        let value = utc ? date.getUTCHours() : date.getHours();
                        value -= token.hour12 && date.getHours() > 12 ? 12 : 0;
                        switch(token.value){
                            case "numeric":
                                {
                                    string += value;
                                    break;
                                }
                            case "2-digit":
                                {
                                    string += digits(value, 2);
                                    break;
                                }
                            default:
                                throw Error(`FormatterError: value "${token.value}" is not supported`);
                        }
                        break;
                    }
                case "minute":
                    {
                        const value = utc ? date.getUTCMinutes() : date.getMinutes();
                        switch(token.value){
                            case "numeric":
                                {
                                    string += value;
                                    break;
                                }
                            case "2-digit":
                                {
                                    string += digits(value, 2);
                                    break;
                                }
                            default:
                                throw Error(`FormatterError: value "${token.value}" is not supported`);
                        }
                        break;
                    }
                case "second":
                    {
                        const value = utc ? date.getUTCSeconds() : date.getSeconds();
                        switch(token.value){
                            case "numeric":
                                {
                                    string += value;
                                    break;
                                }
                            case "2-digit":
                                {
                                    string += digits(value, 2);
                                    break;
                                }
                            default:
                                throw Error(`FormatterError: value "${token.value}" is not supported`);
                        }
                        break;
                    }
                case "fractionalSecond":
                    {
                        const value = utc ? date.getUTCMilliseconds() : date.getMilliseconds();
                        string += digits(value, Number(token.value));
                        break;
                    }
                case "timeZoneName":
                    {
                        break;
                    }
                case "dayPeriod":
                    {
                        string += token.value ? date.getHours() >= 12 ? "PM" : "AM" : "";
                        break;
                    }
                case "literal":
                    {
                        string += token.value;
                        break;
                    }
                default:
                    throw Error(`FormatterError: { ${token.type} ${token.value} }`);
            }
        }
        return string;
    }
    parseToParts(string) {
        const parts = [];
        for (const token of this.#format){
            const type = token.type;
            let value = "";
            switch(token.type){
                case "year":
                    {
                        switch(token.value){
                            case "numeric":
                                {
                                    value = /^\d{1,4}/.exec(string)?.[0];
                                    break;
                                }
                            case "2-digit":
                                {
                                    value = /^\d{1,2}/.exec(string)?.[0];
                                    break;
                                }
                        }
                        break;
                    }
                case "month":
                    {
                        switch(token.value){
                            case "numeric":
                                {
                                    value = /^\d{1,2}/.exec(string)?.[0];
                                    break;
                                }
                            case "2-digit":
                                {
                                    value = /^\d{2}/.exec(string)?.[0];
                                    break;
                                }
                            case "narrow":
                                {
                                    value = /^[a-zA-Z]+/.exec(string)?.[0];
                                    break;
                                }
                            case "short":
                                {
                                    value = /^[a-zA-Z]+/.exec(string)?.[0];
                                    break;
                                }
                            case "long":
                                {
                                    value = /^[a-zA-Z]+/.exec(string)?.[0];
                                    break;
                                }
                            default:
                                throw Error(`ParserError: value "${token.value}" is not supported`);
                        }
                        break;
                    }
                case "day":
                    {
                        switch(token.value){
                            case "numeric":
                                {
                                    value = /^\d{1,2}/.exec(string)?.[0];
                                    break;
                                }
                            case "2-digit":
                                {
                                    value = /^\d{2}/.exec(string)?.[0];
                                    break;
                                }
                            default:
                                throw Error(`ParserError: value "${token.value}" is not supported`);
                        }
                        break;
                    }
                case "hour":
                    {
                        switch(token.value){
                            case "numeric":
                                {
                                    value = /^\d{1,2}/.exec(string)?.[0];
                                    if (token.hour12 && parseInt(value) > 12) {
                                        console.error(`Trying to parse hour greater than 12. Use 'H' instead of 'h'.`);
                                    }
                                    break;
                                }
                            case "2-digit":
                                {
                                    value = /^\d{2}/.exec(string)?.[0];
                                    if (token.hour12 && parseInt(value) > 12) {
                                        console.error(`Trying to parse hour greater than 12. Use 'HH' instead of 'hh'.`);
                                    }
                                    break;
                                }
                            default:
                                throw Error(`ParserError: value "${token.value}" is not supported`);
                        }
                        break;
                    }
                case "minute":
                    {
                        switch(token.value){
                            case "numeric":
                                {
                                    value = /^\d{1,2}/.exec(string)?.[0];
                                    break;
                                }
                            case "2-digit":
                                {
                                    value = /^\d{2}/.exec(string)?.[0];
                                    break;
                                }
                            default:
                                throw Error(`ParserError: value "${token.value}" is not supported`);
                        }
                        break;
                    }
                case "second":
                    {
                        switch(token.value){
                            case "numeric":
                                {
                                    value = /^\d{1,2}/.exec(string)?.[0];
                                    break;
                                }
                            case "2-digit":
                                {
                                    value = /^\d{2}/.exec(string)?.[0];
                                    break;
                                }
                            default:
                                throw Error(`ParserError: value "${token.value}" is not supported`);
                        }
                        break;
                    }
                case "fractionalSecond":
                    {
                        value = new RegExp(`^\\d{${token.value}}`).exec(string)?.[0];
                        break;
                    }
                case "timeZoneName":
                    {
                        value = token.value;
                        break;
                    }
                case "dayPeriod":
                    {
                        value = /^(A|P)M/.exec(string)?.[0];
                        break;
                    }
                case "literal":
                    {
                        if (!string.startsWith(token.value)) {
                            throw Error(`Literal "${token.value}" not found "${string.slice(0, 25)}"`);
                        }
                        value = token.value;
                        break;
                    }
                default:
                    throw Error(`${token.type} ${token.value}`);
            }
            if (!value) {
                throw Error(`value not valid for token { ${type} ${value} } ${string.slice(0, 25)}`);
            }
            parts.push({
                type,
                value
            });
            string = string.slice(value.length);
        }
        if (string.length) {
            throw Error(`datetime string was not fully parsed! ${string.slice(0, 25)}`);
        }
        return parts;
    }
    sortDateTimeFormatPart(parts) {
        let result = [];
        const typeArray = [
            "year",
            "month",
            "day",
            "hour",
            "minute",
            "second",
            "fractionalSecond", 
        ];
        for (const type of typeArray){
            const current = parts.findIndex((el)=>el.type === type
            );
            if (current !== -1) {
                result = result.concat(parts.splice(current, 1));
            }
        }
        result = result.concat(parts);
        return result;
    }
    partsToDate(parts) {
        const date = new Date();
        const utc = parts.find((part)=>part.type === "timeZoneName" && part.value === "UTC"
        );
        const dayPart = parts.find((part)=>part.type === "day"
        );
        utc ? date.setUTCHours(0, 0, 0, 0) : date.setHours(0, 0, 0, 0);
        for (const part1 of parts){
            switch(part1.type){
                case "year":
                    {
                        const value = Number(part1.value.padStart(4, "20"));
                        utc ? date.setUTCFullYear(value) : date.setFullYear(value);
                        break;
                    }
                case "month":
                    {
                        const value = Number(part1.value) - 1;
                        if (dayPart) {
                            utc ? date.setUTCMonth(value, Number(dayPart.value)) : date.setMonth(value, Number(dayPart.value));
                        } else {
                            utc ? date.setUTCMonth(value) : date.setMonth(value);
                        }
                        break;
                    }
                case "day":
                    {
                        const value = Number(part1.value);
                        utc ? date.setUTCDate(value) : date.setDate(value);
                        break;
                    }
                case "hour":
                    {
                        let value = Number(part1.value);
                        const dayPeriod = parts.find((part)=>part.type === "dayPeriod"
                        );
                        if (dayPeriod?.value === "PM") value += 12;
                        utc ? date.setUTCHours(value) : date.setHours(value);
                        break;
                    }
                case "minute":
                    {
                        const value = Number(part1.value);
                        utc ? date.setUTCMinutes(value) : date.setMinutes(value);
                        break;
                    }
                case "second":
                    {
                        const value = Number(part1.value);
                        utc ? date.setUTCSeconds(value) : date.setSeconds(value);
                        break;
                    }
                case "fractionalSecond":
                    {
                        const value = Number(part1.value);
                        utc ? date.setUTCMilliseconds(value) : date.setMilliseconds(value);
                        break;
                    }
            }
        }
        return date;
    }
    parse(string) {
        const parts = this.parseToParts(string);
        const sortParts = this.sortDateTimeFormatPart(parts);
        return this.partsToDate(sortParts);
    }
}
var Day;
(function(Day1) {
    Day1[Day1["Sun"] = 0] = "Sun";
    Day1[Day1["Mon"] = 1] = "Mon";
    Day1[Day1["Tue"] = 2] = "Tue";
    Day1[Day1["Wed"] = 3] = "Wed";
    Day1[Day1["Thu"] = 4] = "Thu";
    Day1[Day1["Fri"] = 5] = "Fri";
    Day1[Day1["Sat"] = 6] = "Sat";
})(Day || (Day = {}));
function format3(date, formatString) {
    const formatter = new DateTimeFormatter(formatString);
    return formatter.format(date);
}
class DenoStdInternalError1 extends Error {
    constructor(message){
        super(message);
        this.name = "DenoStdInternalError";
    }
}
function assert1(expr, msg = "") {
    if (!expr) {
        throw new DenoStdInternalError1(msg);
    }
}
const { Deno: Deno4  } = globalThis;
typeof Deno4?.noColor === "boolean" ? Deno4.noColor : true;
new RegExp([
    "[\\u001B\\u009B][[\\]()#;?]*(?:(?:(?:[a-zA-Z\\d]*(?:;[-a-zA-Z\\d\\/#&.:=?%@~_]*)*)?\\u0007)",
    "(?:(?:\\d{1,4}(?:;\\d{0,4})*)?[\\dA-PR-TZcf-ntqry=><~]))", 
].join("|"), "g");
var DiffType;
(function(DiffType1) {
    DiffType1["removed"] = "removed";
    DiffType1["common"] = "common";
    DiffType1["added"] = "added";
})(DiffType || (DiffType = {}));
class AssertionError extends Error {
    name = "AssertionError";
    constructor(message){
        super(message);
    }
}
function unreachable() {
    throw new AssertionError("unreachable");
}
function copy(src, dst, off = 0) {
    off = Math.max(0, Math.min(off, dst.byteLength));
    const dstBytesAvailable = dst.byteLength - off;
    if (src.byteLength > dstBytesAvailable) {
        src = src.subarray(0, dstBytesAvailable);
    }
    dst.set(src, off);
    return src.byteLength;
}
const DEFAULT_BUF_SIZE = 4096;
const MIN_BUF_SIZE = 16;
const CR = "\r".charCodeAt(0);
const LF = "\n".charCodeAt(0);
class BufferFullError extends Error {
    partial;
    name = "BufferFullError";
    constructor(partial){
        super("Buffer full");
        this.partial = partial;
    }
}
class PartialReadError extends Error {
    name = "PartialReadError";
    partial;
    constructor(){
        super("Encountered UnexpectedEof, data only partially read");
    }
}
class BufReader {
    buf;
    rd;
    r = 0;
    w = 0;
    eof = false;
    static create(r, size = 4096) {
        return r instanceof BufReader ? r : new BufReader(r, size);
    }
    constructor(rd, size = 4096){
        if (size < 16) {
            size = MIN_BUF_SIZE;
        }
        this._reset(new Uint8Array(size), rd);
    }
    size() {
        return this.buf.byteLength;
    }
    buffered() {
        return this.w - this.r;
    }
    async _fill() {
        if (this.r > 0) {
            this.buf.copyWithin(0, this.r, this.w);
            this.w -= this.r;
            this.r = 0;
        }
        if (this.w >= this.buf.byteLength) {
            throw Error("bufio: tried to fill full buffer");
        }
        for(let i = 100; i > 0; i--){
            const rr = await this.rd.read(this.buf.subarray(this.w));
            if (rr === null) {
                this.eof = true;
                return;
            }
            assert1(rr >= 0, "negative read");
            this.w += rr;
            if (rr > 0) {
                return;
            }
        }
        throw new Error(`No progress after ${100} read() calls`);
    }
    reset(r) {
        this._reset(this.buf, r);
    }
    _reset(buf, rd) {
        this.buf = buf;
        this.rd = rd;
        this.eof = false;
    }
    async read(p) {
        let rr = p.byteLength;
        if (p.byteLength === 0) return rr;
        if (this.r === this.w) {
            if (p.byteLength >= this.buf.byteLength) {
                const rr = await this.rd.read(p);
                const nread = rr ?? 0;
                assert1(nread >= 0, "negative read");
                return rr;
            }
            this.r = 0;
            this.w = 0;
            rr = await this.rd.read(this.buf);
            if (rr === 0 || rr === null) return rr;
            assert1(rr >= 0, "negative read");
            this.w += rr;
        }
        const copied = copy(this.buf.subarray(this.r, this.w), p, 0);
        this.r += copied;
        return copied;
    }
    async readFull(p) {
        let bytesRead = 0;
        while(bytesRead < p.length){
            try {
                const rr = await this.read(p.subarray(bytesRead));
                if (rr === null) {
                    if (bytesRead === 0) {
                        return null;
                    } else {
                        throw new PartialReadError();
                    }
                }
                bytesRead += rr;
            } catch (err) {
                if (err instanceof PartialReadError) {
                    err.partial = p.subarray(0, bytesRead);
                } else if (err instanceof Error) {
                    const e = new PartialReadError();
                    e.partial = p.subarray(0, bytesRead);
                    e.stack = err.stack;
                    e.message = err.message;
                    e.cause = err.cause;
                    throw err;
                }
                throw err;
            }
        }
        return p;
    }
    async readByte() {
        while(this.r === this.w){
            if (this.eof) return null;
            await this._fill();
        }
        const c = this.buf[this.r];
        this.r++;
        return c;
    }
    async readString(delim) {
        if (delim.length !== 1) {
            throw new Error("Delimiter should be a single character");
        }
        const buffer = await this.readSlice(delim.charCodeAt(0));
        if (buffer === null) return null;
        return new TextDecoder().decode(buffer);
    }
    async readLine() {
        let line = null;
        try {
            line = await this.readSlice(LF);
        } catch (err) {
            if (err instanceof Deno.errors.BadResource) {
                throw err;
            }
            let partial;
            if (err instanceof PartialReadError) {
                partial = err.partial;
                assert1(partial instanceof Uint8Array, "bufio: caught error from `readSlice()` without `partial` property");
            }
            if (!(err instanceof BufferFullError)) {
                throw err;
            }
            partial = err.partial;
            if (!this.eof && partial && partial.byteLength > 0 && partial[partial.byteLength - 1] === CR) {
                assert1(this.r > 0, "bufio: tried to rewind past start of buffer");
                this.r--;
                partial = partial.subarray(0, partial.byteLength - 1);
            }
            if (partial) {
                return {
                    line: partial,
                    more: !this.eof
                };
            }
        }
        if (line === null) {
            return null;
        }
        if (line.byteLength === 0) {
            return {
                line,
                more: false
            };
        }
        if (line[line.byteLength - 1] == LF) {
            let drop = 1;
            if (line.byteLength > 1 && line[line.byteLength - 2] === CR) {
                drop = 2;
            }
            line = line.subarray(0, line.byteLength - drop);
        }
        return {
            line,
            more: false
        };
    }
    async readSlice(delim) {
        let s = 0;
        let slice;
        while(true){
            let i = this.buf.subarray(this.r + s, this.w).indexOf(delim);
            if (i >= 0) {
                i += s;
                slice = this.buf.subarray(this.r, this.r + i + 1);
                this.r += i + 1;
                break;
            }
            if (this.eof) {
                if (this.r === this.w) {
                    return null;
                }
                slice = this.buf.subarray(this.r, this.w);
                this.r = this.w;
                break;
            }
            if (this.buffered() >= this.buf.byteLength) {
                this.r = this.w;
                const oldbuf = this.buf;
                const newbuf = this.buf.slice(0);
                this.buf = newbuf;
                throw new BufferFullError(oldbuf);
            }
            s = this.w - this.r;
            try {
                await this._fill();
            } catch (err) {
                if (err instanceof PartialReadError) {
                    err.partial = slice;
                } else if (err instanceof Error) {
                    const e = new PartialReadError();
                    e.partial = slice;
                    e.stack = err.stack;
                    e.message = err.message;
                    e.cause = err.cause;
                    throw err;
                }
                throw err;
            }
        }
        return slice;
    }
    async peek(n6) {
        if (n6 < 0) {
            throw Error("negative count");
        }
        let avail = this.w - this.r;
        while(avail < n6 && avail < this.buf.byteLength && !this.eof){
            try {
                await this._fill();
            } catch (err) {
                if (err instanceof PartialReadError) {
                    err.partial = this.buf.subarray(this.r, this.w);
                } else if (err instanceof Error) {
                    const e = new PartialReadError();
                    e.partial = this.buf.subarray(this.r, this.w);
                    e.stack = err.stack;
                    e.message = err.message;
                    e.cause = err.cause;
                    throw err;
                }
                throw err;
            }
            avail = this.w - this.r;
        }
        if (avail === 0 && this.eof) {
            return null;
        } else if (avail < n6 && this.eof) {
            return this.buf.subarray(this.r, this.r + avail);
        } else if (avail < n6) {
            throw new BufferFullError(this.buf.subarray(this.r, this.w));
        }
        return this.buf.subarray(this.r, this.r + n6);
    }
}
class AbstractBufBase {
    buf;
    usedBufferBytes = 0;
    err = null;
    size() {
        return this.buf.byteLength;
    }
    available() {
        return this.buf.byteLength - this.usedBufferBytes;
    }
    buffered() {
        return this.usedBufferBytes;
    }
}
class BufWriter extends AbstractBufBase {
    writer;
    static create(writer, size = 4096) {
        return writer instanceof BufWriter ? writer : new BufWriter(writer, size);
    }
    constructor(writer, size = 4096){
        super();
        this.writer = writer;
        if (size <= 0) {
            size = DEFAULT_BUF_SIZE;
        }
        this.buf = new Uint8Array(size);
    }
    reset(w) {
        this.err = null;
        this.usedBufferBytes = 0;
        this.writer = w;
    }
    async flush() {
        if (this.err !== null) throw this.err;
        if (this.usedBufferBytes === 0) return;
        try {
            const p = this.buf.subarray(0, this.usedBufferBytes);
            let nwritten = 0;
            while(nwritten < p.length){
                nwritten += await this.writer.write(p.subarray(nwritten));
            }
        } catch (e) {
            if (e instanceof Error) {
                this.err = e;
            }
            throw e;
        }
        this.buf = new Uint8Array(this.buf.length);
        this.usedBufferBytes = 0;
    }
    async write(data) {
        if (this.err !== null) throw this.err;
        if (data.length === 0) return 0;
        let totalBytesWritten = 0;
        let numBytesWritten = 0;
        while(data.byteLength > this.available()){
            if (this.buffered() === 0) {
                try {
                    numBytesWritten = await this.writer.write(data);
                } catch (e) {
                    if (e instanceof Error) {
                        this.err = e;
                    }
                    throw e;
                }
            } else {
                numBytesWritten = copy(data, this.buf, this.usedBufferBytes);
                this.usedBufferBytes += numBytesWritten;
                await this.flush();
            }
            totalBytesWritten += numBytesWritten;
            data = data.subarray(numBytesWritten);
        }
        numBytesWritten = copy(data, this.buf, this.usedBufferBytes);
        this.usedBufferBytes += numBytesWritten;
        totalBytesWritten += numBytesWritten;
        return totalBytesWritten;
    }
}
class BufWriterSync extends AbstractBufBase {
    writer;
    static create(writer, size = 4096) {
        return writer instanceof BufWriterSync ? writer : new BufWriterSync(writer, size);
    }
    constructor(writer, size = 4096){
        super();
        this.writer = writer;
        if (size <= 0) {
            size = DEFAULT_BUF_SIZE;
        }
        this.buf = new Uint8Array(size);
    }
    reset(w) {
        this.err = null;
        this.usedBufferBytes = 0;
        this.writer = w;
    }
    flush() {
        if (this.err !== null) throw this.err;
        if (this.usedBufferBytes === 0) return;
        try {
            const p = this.buf.subarray(0, this.usedBufferBytes);
            let nwritten = 0;
            while(nwritten < p.length){
                nwritten += this.writer.writeSync(p.subarray(nwritten));
            }
        } catch (e) {
            if (e instanceof Error) {
                this.err = e;
            }
            throw e;
        }
        this.buf = new Uint8Array(this.buf.length);
        this.usedBufferBytes = 0;
    }
    writeSync(data) {
        if (this.err !== null) throw this.err;
        if (data.length === 0) return 0;
        let totalBytesWritten = 0;
        let numBytesWritten = 0;
        while(data.byteLength > this.available()){
            if (this.buffered() === 0) {
                try {
                    numBytesWritten = this.writer.writeSync(data);
                } catch (e) {
                    if (e instanceof Error) {
                        this.err = e;
                    }
                    throw e;
                }
            } else {
                numBytesWritten = copy(data, this.buf, this.usedBufferBytes);
                this.usedBufferBytes += numBytesWritten;
                this.flush();
            }
            totalBytesWritten += numBytesWritten;
            data = data.subarray(numBytesWritten);
        }
        numBytesWritten = copy(data, this.buf, this.usedBufferBytes);
        this.usedBufferBytes += numBytesWritten;
        totalBytesWritten += numBytesWritten;
        return totalBytesWritten;
    }
}
function notImplemented(msg) {
    const message = msg ? `Not implemented: ${msg}` : "Not implemented";
    throw new Error(message);
}
function makeMethodsEnumerable(klass) {
    const proto = klass.prototype;
    for (const key of Object.getOwnPropertyNames(proto)){
        const value = proto[key];
        if (typeof value === "function") {
            const desc = Reflect.getOwnPropertyDescriptor(proto, key);
            if (desc) {
                desc.enumerable = true;
                Object.defineProperty(proto, key, desc);
            }
        }
    }
}
const CHAR_FORWARD_SLASH1 = 47;
const osType1 = (()=>{
    const { Deno  } = globalThis;
    if (typeof Deno?.build?.os === "string") {
        return Deno.build.os;
    }
    const { navigator  } = globalThis;
    if (navigator?.appVersion?.includes?.("Win") ?? false) {
        return "windows";
    }
    return "linux";
})();
const isWindows1 = osType1 === "windows";
function assertPath1(path30) {
    if (typeof path30 !== "string") {
        throw new TypeError(`Path must be a string. Received ${JSON.stringify(path30)}`);
    }
}
function isPosixPathSeparator1(code) {
    return code === 47;
}
function isPathSeparator1(code) {
    return isPosixPathSeparator1(code) || code === 92;
}
function isWindowsDeviceRoot1(code) {
    return code >= 97 && code <= 122 || code >= 65 && code <= 90;
}
function normalizeString1(path31, allowAboveRoot, separator, isPathSeparator11) {
    let res = "";
    let lastSegmentLength = 0;
    let lastSlash = -1;
    let dots = 0;
    let code;
    for(let i = 0, len = path31.length; i <= len; ++i){
        if (i < len) code = path31.charCodeAt(i);
        else if (isPathSeparator11(code)) break;
        else code = CHAR_FORWARD_SLASH1;
        if (isPathSeparator11(code)) {
            if (lastSlash === i - 1 || dots === 1) {} else if (lastSlash !== i - 1 && dots === 2) {
                if (res.length < 2 || lastSegmentLength !== 2 || res.charCodeAt(res.length - 1) !== 46 || res.charCodeAt(res.length - 2) !== 46) {
                    if (res.length > 2) {
                        const lastSlashIndex = res.lastIndexOf(separator);
                        if (lastSlashIndex === -1) {
                            res = "";
                            lastSegmentLength = 0;
                        } else {
                            res = res.slice(0, lastSlashIndex);
                            lastSegmentLength = res.length - 1 - res.lastIndexOf(separator);
                        }
                        lastSlash = i;
                        dots = 0;
                        continue;
                    } else if (res.length === 2 || res.length === 1) {
                        res = "";
                        lastSegmentLength = 0;
                        lastSlash = i;
                        dots = 0;
                        continue;
                    }
                }
                if (allowAboveRoot) {
                    if (res.length > 0) res += `${separator}..`;
                    else res = "..";
                    lastSegmentLength = 2;
                }
            } else {
                if (res.length > 0) res += separator + path31.slice(lastSlash + 1, i);
                else res = path31.slice(lastSlash + 1, i);
                lastSegmentLength = i - lastSlash - 1;
            }
            lastSlash = i;
            dots = 0;
        } else if (code === 46 && dots !== -1) {
            ++dots;
        } else {
            dots = -1;
        }
    }
    return res;
}
function _format1(sep7, pathObject) {
    const dir = pathObject.dir || pathObject.root;
    const base = pathObject.base || (pathObject.name || "") + (pathObject.ext || "");
    if (!dir) return base;
    if (dir === pathObject.root) return dir + base;
    return dir + sep7 + base;
}
const WHITESPACE_ENCODINGS1 = {
    "\u0009": "%09",
    "\u000A": "%0A",
    "\u000B": "%0B",
    "\u000C": "%0C",
    "\u000D": "%0D",
    "\u0020": "%20"
};
function encodeWhitespace1(string) {
    return string.replaceAll(/[\s]/g, (c)=>{
        return WHITESPACE_ENCODINGS1[c] ?? c;
    });
}
const sep3 = "\\";
const delimiter3 = ";";
function resolve3(...pathSegments) {
    let resolvedDevice = "";
    let resolvedTail = "";
    let resolvedAbsolute = false;
    for(let i = pathSegments.length - 1; i >= -1; i--){
        let path32;
        const { Deno  } = globalThis;
        if (i >= 0) {
            path32 = pathSegments[i];
        } else if (!resolvedDevice) {
            if (typeof Deno?.cwd !== "function") {
                throw new TypeError("Resolved a drive-letter-less path without a CWD.");
            }
            path32 = Deno.cwd();
        } else {
            if (typeof Deno?.env?.get !== "function" || typeof Deno?.cwd !== "function") {
                throw new TypeError("Resolved a relative path without a CWD.");
            }
            path32 = Deno.cwd();
            if (path32 === undefined || path32.slice(0, 3).toLowerCase() !== `${resolvedDevice.toLowerCase()}\\`) {
                path32 = `${resolvedDevice}\\`;
            }
        }
        assertPath1(path32);
        const len = path32.length;
        if (len === 0) continue;
        let rootEnd = 0;
        let device = "";
        let isAbsolute11 = false;
        const code = path32.charCodeAt(0);
        if (len > 1) {
            if (isPathSeparator1(code)) {
                isAbsolute11 = true;
                if (isPathSeparator1(path32.charCodeAt(1))) {
                    let j = 2;
                    let last = j;
                    for(; j < len; ++j){
                        if (isPathSeparator1(path32.charCodeAt(j))) break;
                    }
                    if (j < len && j !== last) {
                        const firstPart = path32.slice(last, j);
                        last = j;
                        for(; j < len; ++j){
                            if (!isPathSeparator1(path32.charCodeAt(j))) break;
                        }
                        if (j < len && j !== last) {
                            last = j;
                            for(; j < len; ++j){
                                if (isPathSeparator1(path32.charCodeAt(j))) break;
                            }
                            if (j === len) {
                                device = `\\\\${firstPart}\\${path32.slice(last)}`;
                                rootEnd = j;
                            } else if (j !== last) {
                                device = `\\\\${firstPart}\\${path32.slice(last, j)}`;
                                rootEnd = j;
                            }
                        }
                    }
                } else {
                    rootEnd = 1;
                }
            } else if (isWindowsDeviceRoot1(code)) {
                if (path32.charCodeAt(1) === 58) {
                    device = path32.slice(0, 2);
                    rootEnd = 2;
                    if (len > 2) {
                        if (isPathSeparator1(path32.charCodeAt(2))) {
                            isAbsolute11 = true;
                            rootEnd = 3;
                        }
                    }
                }
            }
        } else if (isPathSeparator1(code)) {
            rootEnd = 1;
            isAbsolute11 = true;
        }
        if (device.length > 0 && resolvedDevice.length > 0 && device.toLowerCase() !== resolvedDevice.toLowerCase()) {
            continue;
        }
        if (resolvedDevice.length === 0 && device.length > 0) {
            resolvedDevice = device;
        }
        if (!resolvedAbsolute) {
            resolvedTail = `${path32.slice(rootEnd)}\\${resolvedTail}`;
            resolvedAbsolute = isAbsolute11;
        }
        if (resolvedAbsolute && resolvedDevice.length > 0) break;
    }
    resolvedTail = normalizeString1(resolvedTail, !resolvedAbsolute, "\\", isPathSeparator1);
    return resolvedDevice + (resolvedAbsolute ? "\\" : "") + resolvedTail || ".";
}
function normalize4(path33) {
    assertPath1(path33);
    const len = path33.length;
    if (len === 0) return ".";
    let rootEnd = 0;
    let device;
    let isAbsolute21 = false;
    const code = path33.charCodeAt(0);
    if (len > 1) {
        if (isPathSeparator1(code)) {
            isAbsolute21 = true;
            if (isPathSeparator1(path33.charCodeAt(1))) {
                let j = 2;
                let last = j;
                for(; j < len; ++j){
                    if (isPathSeparator1(path33.charCodeAt(j))) break;
                }
                if (j < len && j !== last) {
                    const firstPart = path33.slice(last, j);
                    last = j;
                    for(; j < len; ++j){
                        if (!isPathSeparator1(path33.charCodeAt(j))) break;
                    }
                    if (j < len && j !== last) {
                        last = j;
                        for(; j < len; ++j){
                            if (isPathSeparator1(path33.charCodeAt(j))) break;
                        }
                        if (j === len) {
                            return `\\\\${firstPart}\\${path33.slice(last)}\\`;
                        } else if (j !== last) {
                            device = `\\\\${firstPart}\\${path33.slice(last, j)}`;
                            rootEnd = j;
                        }
                    }
                }
            } else {
                rootEnd = 1;
            }
        } else if (isWindowsDeviceRoot1(code)) {
            if (path33.charCodeAt(1) === 58) {
                device = path33.slice(0, 2);
                rootEnd = 2;
                if (len > 2) {
                    if (isPathSeparator1(path33.charCodeAt(2))) {
                        isAbsolute21 = true;
                        rootEnd = 3;
                    }
                }
            }
        }
    } else if (isPathSeparator1(code)) {
        return "\\";
    }
    let tail;
    if (rootEnd < len) {
        tail = normalizeString1(path33.slice(rootEnd), !isAbsolute21, "\\", isPathSeparator1);
    } else {
        tail = "";
    }
    if (tail.length === 0 && !isAbsolute21) tail = ".";
    if (tail.length > 0 && isPathSeparator1(path33.charCodeAt(len - 1))) {
        tail += "\\";
    }
    if (device === undefined) {
        if (isAbsolute21) {
            if (tail.length > 0) return `\\${tail}`;
            else return "\\";
        } else if (tail.length > 0) {
            return tail;
        } else {
            return "";
        }
    } else if (isAbsolute21) {
        if (tail.length > 0) return `${device}\\${tail}`;
        else return `${device}\\`;
    } else if (tail.length > 0) {
        return device + tail;
    } else {
        return device;
    }
}
function isAbsolute3(path34) {
    assertPath1(path34);
    const len = path34.length;
    if (len === 0) return false;
    const code = path34.charCodeAt(0);
    if (isPathSeparator1(code)) {
        return true;
    } else if (isWindowsDeviceRoot1(code)) {
        if (len > 2 && path34.charCodeAt(1) === 58) {
            if (isPathSeparator1(path34.charCodeAt(2))) return true;
        }
    }
    return false;
}
function join4(...paths) {
    const pathsCount = paths.length;
    if (pathsCount === 0) return ".";
    let joined;
    let firstPart = null;
    for(let i = 0; i < pathsCount; ++i){
        const path35 = paths[i];
        assertPath1(path35);
        if (path35.length > 0) {
            if (joined === undefined) joined = firstPart = path35;
            else joined += `\\${path35}`;
        }
    }
    if (joined === undefined) return ".";
    let needsReplace = true;
    let slashCount = 0;
    assert1(firstPart != null);
    if (isPathSeparator1(firstPart.charCodeAt(0))) {
        ++slashCount;
        const firstLen = firstPart.length;
        if (firstLen > 1) {
            if (isPathSeparator1(firstPart.charCodeAt(1))) {
                ++slashCount;
                if (firstLen > 2) {
                    if (isPathSeparator1(firstPart.charCodeAt(2))) ++slashCount;
                    else {
                        needsReplace = false;
                    }
                }
            }
        }
    }
    if (needsReplace) {
        for(; slashCount < joined.length; ++slashCount){
            if (!isPathSeparator1(joined.charCodeAt(slashCount))) break;
        }
        if (slashCount >= 2) joined = `\\${joined.slice(slashCount)}`;
    }
    return normalize4(joined);
}
function relative3(from, to) {
    assertPath1(from);
    assertPath1(to);
    if (from === to) return "";
    const fromOrig = resolve3(from);
    const toOrig = resolve3(to);
    if (fromOrig === toOrig) return "";
    from = fromOrig.toLowerCase();
    to = toOrig.toLowerCase();
    if (from === to) return "";
    let fromStart = 0;
    let fromEnd = from.length;
    for(; fromStart < fromEnd; ++fromStart){
        if (from.charCodeAt(fromStart) !== 92) break;
    }
    for(; fromEnd - 1 > fromStart; --fromEnd){
        if (from.charCodeAt(fromEnd - 1) !== 92) break;
    }
    const fromLen = fromEnd - fromStart;
    let toStart = 0;
    let toEnd = to.length;
    for(; toStart < toEnd; ++toStart){
        if (to.charCodeAt(toStart) !== 92) break;
    }
    for(; toEnd - 1 > toStart; --toEnd){
        if (to.charCodeAt(toEnd - 1) !== 92) break;
    }
    const toLen = toEnd - toStart;
    const length = fromLen < toLen ? fromLen : toLen;
    let lastCommonSep = -1;
    let i = 0;
    for(; i <= length; ++i){
        if (i === length) {
            if (toLen > length) {
                if (to.charCodeAt(toStart + i) === 92) {
                    return toOrig.slice(toStart + i + 1);
                } else if (i === 2) {
                    return toOrig.slice(toStart + i);
                }
            }
            if (fromLen > length) {
                if (from.charCodeAt(fromStart + i) === 92) {
                    lastCommonSep = i;
                } else if (i === 2) {
                    lastCommonSep = 3;
                }
            }
            break;
        }
        const fromCode = from.charCodeAt(fromStart + i);
        const toCode = to.charCodeAt(toStart + i);
        if (fromCode !== toCode) break;
        else if (fromCode === 92) lastCommonSep = i;
    }
    if (i !== length && lastCommonSep === -1) {
        return toOrig;
    }
    let out = "";
    if (lastCommonSep === -1) lastCommonSep = 0;
    for(i = fromStart + lastCommonSep + 1; i <= fromEnd; ++i){
        if (i === fromEnd || from.charCodeAt(i) === 92) {
            if (out.length === 0) out += "..";
            else out += "\\..";
        }
    }
    if (out.length > 0) {
        return out + toOrig.slice(toStart + lastCommonSep, toEnd);
    } else {
        toStart += lastCommonSep;
        if (toOrig.charCodeAt(toStart) === 92) ++toStart;
        return toOrig.slice(toStart, toEnd);
    }
}
function toNamespacedPath3(path36) {
    if (typeof path36 !== "string") return path36;
    if (path36.length === 0) return "";
    const resolvedPath = resolve3(path36);
    if (resolvedPath.length >= 3) {
        if (resolvedPath.charCodeAt(0) === 92) {
            if (resolvedPath.charCodeAt(1) === 92) {
                const code = resolvedPath.charCodeAt(2);
                if (code !== 63 && code !== 46) {
                    return `\\\\?\\UNC\\${resolvedPath.slice(2)}`;
                }
            }
        } else if (isWindowsDeviceRoot1(resolvedPath.charCodeAt(0))) {
            if (resolvedPath.charCodeAt(1) === 58 && resolvedPath.charCodeAt(2) === 92) {
                return `\\\\?\\${resolvedPath}`;
            }
        }
    }
    return path36;
}
function dirname3(path37) {
    assertPath1(path37);
    const len = path37.length;
    if (len === 0) return ".";
    let rootEnd = -1;
    let end = -1;
    let matchedSlash = true;
    let offset = 0;
    const code = path37.charCodeAt(0);
    if (len > 1) {
        if (isPathSeparator1(code)) {
            rootEnd = offset = 1;
            if (isPathSeparator1(path37.charCodeAt(1))) {
                let j = 2;
                let last = j;
                for(; j < len; ++j){
                    if (isPathSeparator1(path37.charCodeAt(j))) break;
                }
                if (j < len && j !== last) {
                    last = j;
                    for(; j < len; ++j){
                        if (!isPathSeparator1(path37.charCodeAt(j))) break;
                    }
                    if (j < len && j !== last) {
                        last = j;
                        for(; j < len; ++j){
                            if (isPathSeparator1(path37.charCodeAt(j))) break;
                        }
                        if (j === len) {
                            return path37;
                        }
                        if (j !== last) {
                            rootEnd = offset = j + 1;
                        }
                    }
                }
            }
        } else if (isWindowsDeviceRoot1(code)) {
            if (path37.charCodeAt(1) === 58) {
                rootEnd = offset = 2;
                if (len > 2) {
                    if (isPathSeparator1(path37.charCodeAt(2))) rootEnd = offset = 3;
                }
            }
        }
    } else if (isPathSeparator1(code)) {
        return path37;
    }
    for(let i = len - 1; i >= offset; --i){
        if (isPathSeparator1(path37.charCodeAt(i))) {
            if (!matchedSlash) {
                end = i;
                break;
            }
        } else {
            matchedSlash = false;
        }
    }
    if (end === -1) {
        if (rootEnd === -1) return ".";
        else end = rootEnd;
    }
    return path37.slice(0, end);
}
function basename3(path38, ext = "") {
    if (ext !== undefined && typeof ext !== "string") {
        throw new TypeError('"ext" argument must be a string');
    }
    assertPath1(path38);
    let start = 0;
    let end = -1;
    let matchedSlash = true;
    let i;
    if (path38.length >= 2) {
        const drive = path38.charCodeAt(0);
        if (isWindowsDeviceRoot1(drive)) {
            if (path38.charCodeAt(1) === 58) start = 2;
        }
    }
    if (ext !== undefined && ext.length > 0 && ext.length <= path38.length) {
        if (ext.length === path38.length && ext === path38) return "";
        let extIdx = ext.length - 1;
        let firstNonSlashEnd = -1;
        for(i = path38.length - 1; i >= start; --i){
            const code = path38.charCodeAt(i);
            if (isPathSeparator1(code)) {
                if (!matchedSlash) {
                    start = i + 1;
                    break;
                }
            } else {
                if (firstNonSlashEnd === -1) {
                    matchedSlash = false;
                    firstNonSlashEnd = i + 1;
                }
                if (extIdx >= 0) {
                    if (code === ext.charCodeAt(extIdx)) {
                        if (--extIdx === -1) {
                            end = i;
                        }
                    } else {
                        extIdx = -1;
                        end = firstNonSlashEnd;
                    }
                }
            }
        }
        if (start === end) end = firstNonSlashEnd;
        else if (end === -1) end = path38.length;
        return path38.slice(start, end);
    } else {
        for(i = path38.length - 1; i >= start; --i){
            if (isPathSeparator1(path38.charCodeAt(i))) {
                if (!matchedSlash) {
                    start = i + 1;
                    break;
                }
            } else if (end === -1) {
                matchedSlash = false;
                end = i + 1;
            }
        }
        if (end === -1) return "";
        return path38.slice(start, end);
    }
}
function extname3(path39) {
    assertPath1(path39);
    let start = 0;
    let startDot = -1;
    let startPart = 0;
    let end = -1;
    let matchedSlash = true;
    let preDotState = 0;
    if (path39.length >= 2 && path39.charCodeAt(1) === 58 && isWindowsDeviceRoot1(path39.charCodeAt(0))) {
        start = startPart = 2;
    }
    for(let i = path39.length - 1; i >= start; --i){
        const code = path39.charCodeAt(i);
        if (isPathSeparator1(code)) {
            if (!matchedSlash) {
                startPart = i + 1;
                break;
            }
            continue;
        }
        if (end === -1) {
            matchedSlash = false;
            end = i + 1;
        }
        if (code === 46) {
            if (startDot === -1) startDot = i;
            else if (preDotState !== 1) preDotState = 1;
        } else if (startDot !== -1) {
            preDotState = -1;
        }
    }
    if (startDot === -1 || end === -1 || preDotState === 0 || preDotState === 1 && startDot === end - 1 && startDot === startPart + 1) {
        return "";
    }
    return path39.slice(startDot, end);
}
function format4(pathObject) {
    if (pathObject === null || typeof pathObject !== "object") {
        throw new TypeError(`The "pathObject" argument must be of type Object. Received type ${typeof pathObject}`);
    }
    return _format1("\\", pathObject);
}
function parse3(path40) {
    assertPath1(path40);
    const ret = {
        root: "",
        dir: "",
        base: "",
        ext: "",
        name: ""
    };
    const len = path40.length;
    if (len === 0) return ret;
    let rootEnd = 0;
    let code = path40.charCodeAt(0);
    if (len > 1) {
        if (isPathSeparator1(code)) {
            rootEnd = 1;
            if (isPathSeparator1(path40.charCodeAt(1))) {
                let j = 2;
                let last = j;
                for(; j < len; ++j){
                    if (isPathSeparator1(path40.charCodeAt(j))) break;
                }
                if (j < len && j !== last) {
                    last = j;
                    for(; j < len; ++j){
                        if (!isPathSeparator1(path40.charCodeAt(j))) break;
                    }
                    if (j < len && j !== last) {
                        last = j;
                        for(; j < len; ++j){
                            if (isPathSeparator1(path40.charCodeAt(j))) break;
                        }
                        if (j === len) {
                            rootEnd = j;
                        } else if (j !== last) {
                            rootEnd = j + 1;
                        }
                    }
                }
            }
        } else if (isWindowsDeviceRoot1(code)) {
            if (path40.charCodeAt(1) === 58) {
                rootEnd = 2;
                if (len > 2) {
                    if (isPathSeparator1(path40.charCodeAt(2))) {
                        if (len === 3) {
                            ret.root = ret.dir = path40;
                            return ret;
                        }
                        rootEnd = 3;
                    }
                } else {
                    ret.root = ret.dir = path40;
                    return ret;
                }
            }
        }
    } else if (isPathSeparator1(code)) {
        ret.root = ret.dir = path40;
        return ret;
    }
    if (rootEnd > 0) ret.root = path40.slice(0, rootEnd);
    let startDot = -1;
    let startPart = rootEnd;
    let end = -1;
    let matchedSlash = true;
    let i = path40.length - 1;
    let preDotState = 0;
    for(; i >= rootEnd; --i){
        code = path40.charCodeAt(i);
        if (isPathSeparator1(code)) {
            if (!matchedSlash) {
                startPart = i + 1;
                break;
            }
            continue;
        }
        if (end === -1) {
            matchedSlash = false;
            end = i + 1;
        }
        if (code === 46) {
            if (startDot === -1) startDot = i;
            else if (preDotState !== 1) preDotState = 1;
        } else if (startDot !== -1) {
            preDotState = -1;
        }
    }
    if (startDot === -1 || end === -1 || preDotState === 0 || preDotState === 1 && startDot === end - 1 && startDot === startPart + 1) {
        if (end !== -1) {
            ret.base = ret.name = path40.slice(startPart, end);
        }
    } else {
        ret.name = path40.slice(startPart, startDot);
        ret.base = path40.slice(startPart, end);
        ret.ext = path40.slice(startDot, end);
    }
    if (startPart > 0 && startPart !== rootEnd) {
        ret.dir = path40.slice(0, startPart - 1);
    } else ret.dir = ret.root;
    return ret;
}
function fromFileUrl3(url) {
    url = url instanceof URL ? url : new URL(url);
    if (url.protocol != "file:") {
        throw new TypeError("Must be a file URL.");
    }
    let path41 = decodeURIComponent(url.pathname.replace(/\//g, "\\").replace(/%(?![0-9A-Fa-f]{2})/g, "%25")).replace(/^\\*([A-Za-z]:)(\\|$)/, "$1\\");
    if (url.hostname != "") {
        path41 = `\\\\${url.hostname}${path41}`;
    }
    return path41;
}
function toFileUrl3(path42) {
    if (!isAbsolute3(path42)) {
        throw new TypeError("Must be an absolute path.");
    }
    const [, hostname, pathname] = path42.match(/^(?:[/\\]{2}([^/\\]+)(?=[/\\](?:[^/\\]|$)))?(.*)/);
    const url = new URL("file:///");
    url.pathname = encodeWhitespace1(pathname.replace(/%/g, "%25"));
    if (hostname != null && hostname != "localhost") {
        url.hostname = hostname;
        if (!url.hostname) {
            throw new TypeError("Invalid hostname.");
        }
    }
    return url;
}
const mod2 = {
    sep: sep3,
    delimiter: delimiter3,
    resolve: resolve3,
    normalize: normalize4,
    isAbsolute: isAbsolute3,
    join: join4,
    relative: relative3,
    toNamespacedPath: toNamespacedPath3,
    dirname: dirname3,
    basename: basename3,
    extname: extname3,
    format: format4,
    parse: parse3,
    fromFileUrl: fromFileUrl3,
    toFileUrl: toFileUrl3
};
const sep4 = "/";
const delimiter4 = ":";
function resolve4(...pathSegments) {
    let resolvedPath = "";
    let resolvedAbsolute = false;
    for(let i = pathSegments.length - 1; i >= -1 && !resolvedAbsolute; i--){
        let path43;
        if (i >= 0) path43 = pathSegments[i];
        else {
            const { Deno  } = globalThis;
            if (typeof Deno?.cwd !== "function") {
                throw new TypeError("Resolved a relative path without a CWD.");
            }
            path43 = Deno.cwd();
        }
        assertPath1(path43);
        if (path43.length === 0) {
            continue;
        }
        resolvedPath = `${path43}/${resolvedPath}`;
        resolvedAbsolute = path43.charCodeAt(0) === CHAR_FORWARD_SLASH1;
    }
    resolvedPath = normalizeString1(resolvedPath, !resolvedAbsolute, "/", isPosixPathSeparator1);
    if (resolvedAbsolute) {
        if (resolvedPath.length > 0) return `/${resolvedPath}`;
        else return "/";
    } else if (resolvedPath.length > 0) return resolvedPath;
    else return ".";
}
function normalize5(path44) {
    assertPath1(path44);
    if (path44.length === 0) return ".";
    const isAbsolute12 = path44.charCodeAt(0) === 47;
    const trailingSeparator = path44.charCodeAt(path44.length - 1) === 47;
    path44 = normalizeString1(path44, !isAbsolute12, "/", isPosixPathSeparator1);
    if (path44.length === 0 && !isAbsolute12) path44 = ".";
    if (path44.length > 0 && trailingSeparator) path44 += "/";
    if (isAbsolute12) return `/${path44}`;
    return path44;
}
function isAbsolute4(path45) {
    assertPath1(path45);
    return path45.length > 0 && path45.charCodeAt(0) === 47;
}
function join5(...paths) {
    if (paths.length === 0) return ".";
    let joined;
    for(let i = 0, len = paths.length; i < len; ++i){
        const path46 = paths[i];
        assertPath1(path46);
        if (path46.length > 0) {
            if (!joined) joined = path46;
            else joined += `/${path46}`;
        }
    }
    if (!joined) return ".";
    return normalize5(joined);
}
function relative4(from, to) {
    assertPath1(from);
    assertPath1(to);
    if (from === to) return "";
    from = resolve4(from);
    to = resolve4(to);
    if (from === to) return "";
    let fromStart = 1;
    const fromEnd = from.length;
    for(; fromStart < fromEnd; ++fromStart){
        if (from.charCodeAt(fromStart) !== 47) break;
    }
    const fromLen = fromEnd - fromStart;
    let toStart = 1;
    const toEnd = to.length;
    for(; toStart < toEnd; ++toStart){
        if (to.charCodeAt(toStart) !== 47) break;
    }
    const toLen = toEnd - toStart;
    const length = fromLen < toLen ? fromLen : toLen;
    let lastCommonSep = -1;
    let i = 0;
    for(; i <= length; ++i){
        if (i === length) {
            if (toLen > length) {
                if (to.charCodeAt(toStart + i) === 47) {
                    return to.slice(toStart + i + 1);
                } else if (i === 0) {
                    return to.slice(toStart + i);
                }
            } else if (fromLen > length) {
                if (from.charCodeAt(fromStart + i) === 47) {
                    lastCommonSep = i;
                } else if (i === 0) {
                    lastCommonSep = 0;
                }
            }
            break;
        }
        const fromCode = from.charCodeAt(fromStart + i);
        const toCode = to.charCodeAt(toStart + i);
        if (fromCode !== toCode) break;
        else if (fromCode === 47) lastCommonSep = i;
    }
    let out = "";
    for(i = fromStart + lastCommonSep + 1; i <= fromEnd; ++i){
        if (i === fromEnd || from.charCodeAt(i) === 47) {
            if (out.length === 0) out += "..";
            else out += "/..";
        }
    }
    if (out.length > 0) return out + to.slice(toStart + lastCommonSep);
    else {
        toStart += lastCommonSep;
        if (to.charCodeAt(toStart) === 47) ++toStart;
        return to.slice(toStart);
    }
}
function toNamespacedPath4(path47) {
    return path47;
}
function dirname4(path48) {
    assertPath1(path48);
    if (path48.length === 0) return ".";
    const hasRoot = path48.charCodeAt(0) === 47;
    let end = -1;
    let matchedSlash = true;
    for(let i = path48.length - 1; i >= 1; --i){
        if (path48.charCodeAt(i) === 47) {
            if (!matchedSlash) {
                end = i;
                break;
            }
        } else {
            matchedSlash = false;
        }
    }
    if (end === -1) return hasRoot ? "/" : ".";
    if (hasRoot && end === 1) return "//";
    return path48.slice(0, end);
}
function basename4(path49, ext = "") {
    if (ext !== undefined && typeof ext !== "string") {
        throw new TypeError('"ext" argument must be a string');
    }
    assertPath1(path49);
    let start = 0;
    let end = -1;
    let matchedSlash = true;
    let i;
    if (ext !== undefined && ext.length > 0 && ext.length <= path49.length) {
        if (ext.length === path49.length && ext === path49) return "";
        let extIdx = ext.length - 1;
        let firstNonSlashEnd = -1;
        for(i = path49.length - 1; i >= 0; --i){
            const code = path49.charCodeAt(i);
            if (code === 47) {
                if (!matchedSlash) {
                    start = i + 1;
                    break;
                }
            } else {
                if (firstNonSlashEnd === -1) {
                    matchedSlash = false;
                    firstNonSlashEnd = i + 1;
                }
                if (extIdx >= 0) {
                    if (code === ext.charCodeAt(extIdx)) {
                        if (--extIdx === -1) {
                            end = i;
                        }
                    } else {
                        extIdx = -1;
                        end = firstNonSlashEnd;
                    }
                }
            }
        }
        if (start === end) end = firstNonSlashEnd;
        else if (end === -1) end = path49.length;
        return path49.slice(start, end);
    } else {
        for(i = path49.length - 1; i >= 0; --i){
            if (path49.charCodeAt(i) === 47) {
                if (!matchedSlash) {
                    start = i + 1;
                    break;
                }
            } else if (end === -1) {
                matchedSlash = false;
                end = i + 1;
            }
        }
        if (end === -1) return "";
        return path49.slice(start, end);
    }
}
function extname4(path50) {
    assertPath1(path50);
    let startDot = -1;
    let startPart = 0;
    let end = -1;
    let matchedSlash = true;
    let preDotState = 0;
    for(let i = path50.length - 1; i >= 0; --i){
        const code = path50.charCodeAt(i);
        if (code === 47) {
            if (!matchedSlash) {
                startPart = i + 1;
                break;
            }
            continue;
        }
        if (end === -1) {
            matchedSlash = false;
            end = i + 1;
        }
        if (code === 46) {
            if (startDot === -1) startDot = i;
            else if (preDotState !== 1) preDotState = 1;
        } else if (startDot !== -1) {
            preDotState = -1;
        }
    }
    if (startDot === -1 || end === -1 || preDotState === 0 || preDotState === 1 && startDot === end - 1 && startDot === startPart + 1) {
        return "";
    }
    return path50.slice(startDot, end);
}
function format5(pathObject) {
    if (pathObject === null || typeof pathObject !== "object") {
        throw new TypeError(`The "pathObject" argument must be of type Object. Received type ${typeof pathObject}`);
    }
    return _format1("/", pathObject);
}
function parse4(path51) {
    assertPath1(path51);
    const ret = {
        root: "",
        dir: "",
        base: "",
        ext: "",
        name: ""
    };
    if (path51.length === 0) return ret;
    const isAbsolute22 = path51.charCodeAt(0) === 47;
    let start;
    if (isAbsolute22) {
        ret.root = "/";
        start = 1;
    } else {
        start = 0;
    }
    let startDot = -1;
    let startPart = 0;
    let end = -1;
    let matchedSlash = true;
    let i = path51.length - 1;
    let preDotState = 0;
    for(; i >= start; --i){
        const code = path51.charCodeAt(i);
        if (code === 47) {
            if (!matchedSlash) {
                startPart = i + 1;
                break;
            }
            continue;
        }
        if (end === -1) {
            matchedSlash = false;
            end = i + 1;
        }
        if (code === 46) {
            if (startDot === -1) startDot = i;
            else if (preDotState !== 1) preDotState = 1;
        } else if (startDot !== -1) {
            preDotState = -1;
        }
    }
    if (startDot === -1 || end === -1 || preDotState === 0 || preDotState === 1 && startDot === end - 1 && startDot === startPart + 1) {
        if (end !== -1) {
            if (startPart === 0 && isAbsolute22) {
                ret.base = ret.name = path51.slice(1, end);
            } else {
                ret.base = ret.name = path51.slice(startPart, end);
            }
        }
    } else {
        if (startPart === 0 && isAbsolute22) {
            ret.name = path51.slice(1, startDot);
            ret.base = path51.slice(1, end);
        } else {
            ret.name = path51.slice(startPart, startDot);
            ret.base = path51.slice(startPart, end);
        }
        ret.ext = path51.slice(startDot, end);
    }
    if (startPart > 0) ret.dir = path51.slice(0, startPart - 1);
    else if (isAbsolute22) ret.dir = "/";
    return ret;
}
function fromFileUrl4(url) {
    url = url instanceof URL ? url : new URL(url);
    if (url.protocol != "file:") {
        throw new TypeError("Must be a file URL.");
    }
    return decodeURIComponent(url.pathname.replace(/%(?![0-9A-Fa-f]{2})/g, "%25"));
}
function toFileUrl4(path52) {
    if (!isAbsolute4(path52)) {
        throw new TypeError("Must be an absolute path.");
    }
    const url = new URL("file:///");
    url.pathname = encodeWhitespace1(path52.replace(/%/g, "%25").replace(/\\/g, "%5C"));
    return url;
}
const mod3 = {
    sep: sep4,
    delimiter: delimiter4,
    resolve: resolve4,
    normalize: normalize5,
    isAbsolute: isAbsolute4,
    join: join5,
    relative: relative4,
    toNamespacedPath: toNamespacedPath4,
    dirname: dirname4,
    basename: basename4,
    extname: extname4,
    format: format5,
    parse: parse4,
    fromFileUrl: fromFileUrl4,
    toFileUrl: toFileUrl4
};
const path2 = isWindows1 ? mod2 : mod3;
const { join: join6 , normalize: normalize6  } = path2;
const path3 = isWindows1 ? mod2 : mod3;
const { basename: basename5 , delimiter: delimiter5 , dirname: dirname5 , extname: extname5 , format: format6 , fromFileUrl: fromFileUrl5 , isAbsolute: isAbsolute5 , join: join7 , normalize: normalize7 , parse: parse5 , relative: relative5 , resolve: resolve5 , sep: sep5 , toFileUrl: toFileUrl5 , toNamespacedPath: toNamespacedPath5 ,  } = path3;
const kCustomPromisifiedSymbol = Symbol.for("nodejs.util.promisify.custom");
const kCustomPromisifyArgsSymbol = Symbol.for("nodejs.util.promisify.customArgs");
class NodeInvalidArgTypeError extends TypeError {
    code = "ERR_INVALID_ARG_TYPE";
    constructor(argumentName, type, received){
        super(`The "${argumentName}" argument must be of type ${type}. Received ${typeof received}`);
    }
}
function promisify(original) {
    if (typeof original !== "function") {
        throw new NodeInvalidArgTypeError("original", "Function", original);
    }
    if (original[kCustomPromisifiedSymbol]) {
        const fn = original[kCustomPromisifiedSymbol];
        if (typeof fn !== "function") {
            throw new NodeInvalidArgTypeError("util.promisify.custom", "Function", fn);
        }
        return Object.defineProperty(fn, kCustomPromisifiedSymbol, {
            value: fn,
            enumerable: false,
            writable: false,
            configurable: true
        });
    }
    const argumentNames = original[kCustomPromisifyArgsSymbol];
    function fn(...args) {
        return new Promise((resolve6, reject)=>{
            original.call(this, ...args, (err, ...values)=>{
                if (err) {
                    return reject(err);
                }
                if (argumentNames !== undefined && values.length > 1) {
                    const obj = {};
                    for(let i = 0; i < argumentNames.length; i++){
                        obj[argumentNames[i]] = values[i];
                    }
                    resolve6(obj);
                } else {
                    resolve6(values[0]);
                }
            });
        });
    }
    Object.setPrototypeOf(fn, Object.getPrototypeOf(original));
    Object.defineProperty(fn, kCustomPromisifiedSymbol, {
        value: fn,
        enumerable: false,
        writable: false,
        configurable: true
    });
    return Object.defineProperties(fn, Object.getOwnPropertyDescriptors(original));
}
promisify.custom = kCustomPromisifiedSymbol;
Object.prototype.toString;
const codeToErrorWindows = [
    [
        -4093,
        [
            "E2BIG",
            "argument list too long"
        ]
    ],
    [
        -4092,
        [
            "EACCES",
            "permission denied"
        ]
    ],
    [
        -4091,
        [
            "EADDRINUSE",
            "address already in use"
        ]
    ],
    [
        -4090,
        [
            "EADDRNOTAVAIL",
            "address not available"
        ]
    ],
    [
        -4089,
        [
            "EAFNOSUPPORT",
            "address family not supported"
        ]
    ],
    [
        -4088,
        [
            "EAGAIN",
            "resource temporarily unavailable"
        ]
    ],
    [
        -3000,
        [
            "EAI_ADDRFAMILY",
            "address family not supported"
        ]
    ],
    [
        -3001,
        [
            "EAI_AGAIN",
            "temporary failure"
        ]
    ],
    [
        -3002,
        [
            "EAI_BADFLAGS",
            "bad ai_flags value"
        ]
    ],
    [
        -3013,
        [
            "EAI_BADHINTS",
            "invalid value for hints"
        ]
    ],
    [
        -3003,
        [
            "EAI_CANCELED",
            "request canceled"
        ]
    ],
    [
        -3004,
        [
            "EAI_FAIL",
            "permanent failure"
        ]
    ],
    [
        -3005,
        [
            "EAI_FAMILY",
            "ai_family not supported"
        ]
    ],
    [
        -3006,
        [
            "EAI_MEMORY",
            "out of memory"
        ]
    ],
    [
        -3007,
        [
            "EAI_NODATA",
            "no address"
        ]
    ],
    [
        -3008,
        [
            "EAI_NONAME",
            "unknown node or service"
        ]
    ],
    [
        -3009,
        [
            "EAI_OVERFLOW",
            "argument buffer overflow"
        ]
    ],
    [
        -3014,
        [
            "EAI_PROTOCOL",
            "resolved protocol is unknown"
        ]
    ],
    [
        -3010,
        [
            "EAI_SERVICE",
            "service not available for socket type"
        ]
    ],
    [
        -3011,
        [
            "EAI_SOCKTYPE",
            "socket type not supported"
        ]
    ],
    [
        -4084,
        [
            "EALREADY",
            "connection already in progress"
        ]
    ],
    [
        -4083,
        [
            "EBADF",
            "bad file descriptor"
        ]
    ],
    [
        -4082,
        [
            "EBUSY",
            "resource busy or locked"
        ]
    ],
    [
        -4081,
        [
            "ECANCELED",
            "operation canceled"
        ]
    ],
    [
        -4080,
        [
            "ECHARSET",
            "invalid Unicode character"
        ]
    ],
    [
        -4079,
        [
            "ECONNABORTED",
            "software caused connection abort"
        ]
    ],
    [
        -4078,
        [
            "ECONNREFUSED",
            "connection refused"
        ]
    ],
    [
        -4077,
        [
            "ECONNRESET",
            "connection reset by peer"
        ]
    ],
    [
        -4076,
        [
            "EDESTADDRREQ",
            "destination address required"
        ]
    ],
    [
        -4075,
        [
            "EEXIST",
            "file already exists"
        ]
    ],
    [
        -4074,
        [
            "EFAULT",
            "bad address in system call argument"
        ]
    ],
    [
        -4036,
        [
            "EFBIG",
            "file too large"
        ]
    ],
    [
        -4073,
        [
            "EHOSTUNREACH",
            "host is unreachable"
        ]
    ],
    [
        -4072,
        [
            "EINTR",
            "interrupted system call"
        ]
    ],
    [
        -4071,
        [
            "EINVAL",
            "invalid argument"
        ]
    ],
    [
        -4070,
        [
            "EIO",
            "i/o error"
        ]
    ],
    [
        -4069,
        [
            "EISCONN",
            "socket is already connected"
        ]
    ],
    [
        -4068,
        [
            "EISDIR",
            "illegal operation on a directory"
        ]
    ],
    [
        -4067,
        [
            "ELOOP",
            "too many symbolic links encountered"
        ]
    ],
    [
        -4066,
        [
            "EMFILE",
            "too many open files"
        ]
    ],
    [
        -4065,
        [
            "EMSGSIZE",
            "message too long"
        ]
    ],
    [
        -4064,
        [
            "ENAMETOOLONG",
            "name too long"
        ]
    ],
    [
        -4063,
        [
            "ENETDOWN",
            "network is down"
        ]
    ],
    [
        -4062,
        [
            "ENETUNREACH",
            "network is unreachable"
        ]
    ],
    [
        -4061,
        [
            "ENFILE",
            "file table overflow"
        ]
    ],
    [
        -4060,
        [
            "ENOBUFS",
            "no buffer space available"
        ]
    ],
    [
        -4059,
        [
            "ENODEV",
            "no such device"
        ]
    ],
    [
        -4058,
        [
            "ENOENT",
            "no such file or directory"
        ]
    ],
    [
        -4057,
        [
            "ENOMEM",
            "not enough memory"
        ]
    ],
    [
        -4056,
        [
            "ENONET",
            "machine is not on the network"
        ]
    ],
    [
        -4035,
        [
            "ENOPROTOOPT",
            "protocol not available"
        ]
    ],
    [
        -4055,
        [
            "ENOSPC",
            "no space left on device"
        ]
    ],
    [
        -4054,
        [
            "ENOSYS",
            "function not implemented"
        ]
    ],
    [
        -4053,
        [
            "ENOTCONN",
            "socket is not connected"
        ]
    ],
    [
        -4052,
        [
            "ENOTDIR",
            "not a directory"
        ]
    ],
    [
        -4051,
        [
            "ENOTEMPTY",
            "directory not empty"
        ]
    ],
    [
        -4050,
        [
            "ENOTSOCK",
            "socket operation on non-socket"
        ]
    ],
    [
        -4049,
        [
            "ENOTSUP",
            "operation not supported on socket"
        ]
    ],
    [
        -4048,
        [
            "EPERM",
            "operation not permitted"
        ]
    ],
    [
        -4047,
        [
            "EPIPE",
            "broken pipe"
        ]
    ],
    [
        -4046,
        [
            "EPROTO",
            "protocol error"
        ]
    ],
    [
        -4045,
        [
            "EPROTONOSUPPORT",
            "protocol not supported"
        ]
    ],
    [
        -4044,
        [
            "EPROTOTYPE",
            "protocol wrong type for socket"
        ]
    ],
    [
        -4034,
        [
            "ERANGE",
            "result too large"
        ]
    ],
    [
        -4043,
        [
            "EROFS",
            "read-only file system"
        ]
    ],
    [
        -4042,
        [
            "ESHUTDOWN",
            "cannot send after transport endpoint shutdown"
        ]
    ],
    [
        -4041,
        [
            "ESPIPE",
            "invalid seek"
        ]
    ],
    [
        -4040,
        [
            "ESRCH",
            "no such process"
        ]
    ],
    [
        -4039,
        [
            "ETIMEDOUT",
            "connection timed out"
        ]
    ],
    [
        -4038,
        [
            "ETXTBSY",
            "text file is busy"
        ]
    ],
    [
        -4037,
        [
            "EXDEV",
            "cross-device link not permitted"
        ]
    ],
    [
        -4094,
        [
            "UNKNOWN",
            "unknown error"
        ]
    ],
    [
        -4095,
        [
            "EOF",
            "end of file"
        ]
    ],
    [
        -4033,
        [
            "ENXIO",
            "no such device or address"
        ]
    ],
    [
        -4032,
        [
            "EMLINK",
            "too many links"
        ]
    ],
    [
        -4031,
        [
            "EHOSTDOWN",
            "host is down"
        ]
    ],
    [
        -4030,
        [
            "EREMOTEIO",
            "remote I/O error"
        ]
    ],
    [
        -4029,
        [
            "ENOTTY",
            "inappropriate ioctl for device"
        ]
    ],
    [
        -4028,
        [
            "EFTYPE",
            "inappropriate file type or format"
        ]
    ],
    [
        -4027,
        [
            "EILSEQ",
            "illegal byte sequence"
        ]
    ], 
];
const errorToCodeWindows = codeToErrorWindows.map(([status, [error]])=>[
        error,
        status
    ]
);
const codeToErrorDarwin = [
    [
        -7,
        [
            "E2BIG",
            "argument list too long"
        ]
    ],
    [
        -13,
        [
            "EACCES",
            "permission denied"
        ]
    ],
    [
        -48,
        [
            "EADDRINUSE",
            "address already in use"
        ]
    ],
    [
        -49,
        [
            "EADDRNOTAVAIL",
            "address not available"
        ]
    ],
    [
        -47,
        [
            "EAFNOSUPPORT",
            "address family not supported"
        ]
    ],
    [
        -35,
        [
            "EAGAIN",
            "resource temporarily unavailable"
        ]
    ],
    [
        -3000,
        [
            "EAI_ADDRFAMILY",
            "address family not supported"
        ]
    ],
    [
        -3001,
        [
            "EAI_AGAIN",
            "temporary failure"
        ]
    ],
    [
        -3002,
        [
            "EAI_BADFLAGS",
            "bad ai_flags value"
        ]
    ],
    [
        -3013,
        [
            "EAI_BADHINTS",
            "invalid value for hints"
        ]
    ],
    [
        -3003,
        [
            "EAI_CANCELED",
            "request canceled"
        ]
    ],
    [
        -3004,
        [
            "EAI_FAIL",
            "permanent failure"
        ]
    ],
    [
        -3005,
        [
            "EAI_FAMILY",
            "ai_family not supported"
        ]
    ],
    [
        -3006,
        [
            "EAI_MEMORY",
            "out of memory"
        ]
    ],
    [
        -3007,
        [
            "EAI_NODATA",
            "no address"
        ]
    ],
    [
        -3008,
        [
            "EAI_NONAME",
            "unknown node or service"
        ]
    ],
    [
        -3009,
        [
            "EAI_OVERFLOW",
            "argument buffer overflow"
        ]
    ],
    [
        -3014,
        [
            "EAI_PROTOCOL",
            "resolved protocol is unknown"
        ]
    ],
    [
        -3010,
        [
            "EAI_SERVICE",
            "service not available for socket type"
        ]
    ],
    [
        -3011,
        [
            "EAI_SOCKTYPE",
            "socket type not supported"
        ]
    ],
    [
        -37,
        [
            "EALREADY",
            "connection already in progress"
        ]
    ],
    [
        -9,
        [
            "EBADF",
            "bad file descriptor"
        ]
    ],
    [
        -16,
        [
            "EBUSY",
            "resource busy or locked"
        ]
    ],
    [
        -89,
        [
            "ECANCELED",
            "operation canceled"
        ]
    ],
    [
        -4080,
        [
            "ECHARSET",
            "invalid Unicode character"
        ]
    ],
    [
        -53,
        [
            "ECONNABORTED",
            "software caused connection abort"
        ]
    ],
    [
        -61,
        [
            "ECONNREFUSED",
            "connection refused"
        ]
    ],
    [
        -54,
        [
            "ECONNRESET",
            "connection reset by peer"
        ]
    ],
    [
        -39,
        [
            "EDESTADDRREQ",
            "destination address required"
        ]
    ],
    [
        -17,
        [
            "EEXIST",
            "file already exists"
        ]
    ],
    [
        -14,
        [
            "EFAULT",
            "bad address in system call argument"
        ]
    ],
    [
        -27,
        [
            "EFBIG",
            "file too large"
        ]
    ],
    [
        -65,
        [
            "EHOSTUNREACH",
            "host is unreachable"
        ]
    ],
    [
        -4,
        [
            "EINTR",
            "interrupted system call"
        ]
    ],
    [
        -22,
        [
            "EINVAL",
            "invalid argument"
        ]
    ],
    [
        -5,
        [
            "EIO",
            "i/o error"
        ]
    ],
    [
        -56,
        [
            "EISCONN",
            "socket is already connected"
        ]
    ],
    [
        -21,
        [
            "EISDIR",
            "illegal operation on a directory"
        ]
    ],
    [
        -62,
        [
            "ELOOP",
            "too many symbolic links encountered"
        ]
    ],
    [
        -24,
        [
            "EMFILE",
            "too many open files"
        ]
    ],
    [
        -40,
        [
            "EMSGSIZE",
            "message too long"
        ]
    ],
    [
        -63,
        [
            "ENAMETOOLONG",
            "name too long"
        ]
    ],
    [
        -50,
        [
            "ENETDOWN",
            "network is down"
        ]
    ],
    [
        -51,
        [
            "ENETUNREACH",
            "network is unreachable"
        ]
    ],
    [
        -23,
        [
            "ENFILE",
            "file table overflow"
        ]
    ],
    [
        -55,
        [
            "ENOBUFS",
            "no buffer space available"
        ]
    ],
    [
        -19,
        [
            "ENODEV",
            "no such device"
        ]
    ],
    [
        -2,
        [
            "ENOENT",
            "no such file or directory"
        ]
    ],
    [
        -12,
        [
            "ENOMEM",
            "not enough memory"
        ]
    ],
    [
        -4056,
        [
            "ENONET",
            "machine is not on the network"
        ]
    ],
    [
        -42,
        [
            "ENOPROTOOPT",
            "protocol not available"
        ]
    ],
    [
        -28,
        [
            "ENOSPC",
            "no space left on device"
        ]
    ],
    [
        -78,
        [
            "ENOSYS",
            "function not implemented"
        ]
    ],
    [
        -57,
        [
            "ENOTCONN",
            "socket is not connected"
        ]
    ],
    [
        -20,
        [
            "ENOTDIR",
            "not a directory"
        ]
    ],
    [
        -66,
        [
            "ENOTEMPTY",
            "directory not empty"
        ]
    ],
    [
        -38,
        [
            "ENOTSOCK",
            "socket operation on non-socket"
        ]
    ],
    [
        -45,
        [
            "ENOTSUP",
            "operation not supported on socket"
        ]
    ],
    [
        -1,
        [
            "EPERM",
            "operation not permitted"
        ]
    ],
    [
        -32,
        [
            "EPIPE",
            "broken pipe"
        ]
    ],
    [
        -100,
        [
            "EPROTO",
            "protocol error"
        ]
    ],
    [
        -43,
        [
            "EPROTONOSUPPORT",
            "protocol not supported"
        ]
    ],
    [
        -41,
        [
            "EPROTOTYPE",
            "protocol wrong type for socket"
        ]
    ],
    [
        -34,
        [
            "ERANGE",
            "result too large"
        ]
    ],
    [
        -30,
        [
            "EROFS",
            "read-only file system"
        ]
    ],
    [
        -58,
        [
            "ESHUTDOWN",
            "cannot send after transport endpoint shutdown"
        ]
    ],
    [
        -29,
        [
            "ESPIPE",
            "invalid seek"
        ]
    ],
    [
        -3,
        [
            "ESRCH",
            "no such process"
        ]
    ],
    [
        -60,
        [
            "ETIMEDOUT",
            "connection timed out"
        ]
    ],
    [
        -26,
        [
            "ETXTBSY",
            "text file is busy"
        ]
    ],
    [
        -18,
        [
            "EXDEV",
            "cross-device link not permitted"
        ]
    ],
    [
        -4094,
        [
            "UNKNOWN",
            "unknown error"
        ]
    ],
    [
        -4095,
        [
            "EOF",
            "end of file"
        ]
    ],
    [
        -6,
        [
            "ENXIO",
            "no such device or address"
        ]
    ],
    [
        -31,
        [
            "EMLINK",
            "too many links"
        ]
    ],
    [
        -64,
        [
            "EHOSTDOWN",
            "host is down"
        ]
    ],
    [
        -4030,
        [
            "EREMOTEIO",
            "remote I/O error"
        ]
    ],
    [
        -25,
        [
            "ENOTTY",
            "inappropriate ioctl for device"
        ]
    ],
    [
        -79,
        [
            "EFTYPE",
            "inappropriate file type or format"
        ]
    ],
    [
        -92,
        [
            "EILSEQ",
            "illegal byte sequence"
        ]
    ], 
];
const errorToCodeDarwin = codeToErrorDarwin.map(([status, [code]])=>[
        code,
        status
    ]
);
const codeToErrorLinux = [
    [
        -7,
        [
            "E2BIG",
            "argument list too long"
        ]
    ],
    [
        -13,
        [
            "EACCES",
            "permission denied"
        ]
    ],
    [
        -98,
        [
            "EADDRINUSE",
            "address already in use"
        ]
    ],
    [
        -99,
        [
            "EADDRNOTAVAIL",
            "address not available"
        ]
    ],
    [
        -97,
        [
            "EAFNOSUPPORT",
            "address family not supported"
        ]
    ],
    [
        -11,
        [
            "EAGAIN",
            "resource temporarily unavailable"
        ]
    ],
    [
        -3000,
        [
            "EAI_ADDRFAMILY",
            "address family not supported"
        ]
    ],
    [
        -3001,
        [
            "EAI_AGAIN",
            "temporary failure"
        ]
    ],
    [
        -3002,
        [
            "EAI_BADFLAGS",
            "bad ai_flags value"
        ]
    ],
    [
        -3013,
        [
            "EAI_BADHINTS",
            "invalid value for hints"
        ]
    ],
    [
        -3003,
        [
            "EAI_CANCELED",
            "request canceled"
        ]
    ],
    [
        -3004,
        [
            "EAI_FAIL",
            "permanent failure"
        ]
    ],
    [
        -3005,
        [
            "EAI_FAMILY",
            "ai_family not supported"
        ]
    ],
    [
        -3006,
        [
            "EAI_MEMORY",
            "out of memory"
        ]
    ],
    [
        -3007,
        [
            "EAI_NODATA",
            "no address"
        ]
    ],
    [
        -3008,
        [
            "EAI_NONAME",
            "unknown node or service"
        ]
    ],
    [
        -3009,
        [
            "EAI_OVERFLOW",
            "argument buffer overflow"
        ]
    ],
    [
        -3014,
        [
            "EAI_PROTOCOL",
            "resolved protocol is unknown"
        ]
    ],
    [
        -3010,
        [
            "EAI_SERVICE",
            "service not available for socket type"
        ]
    ],
    [
        -3011,
        [
            "EAI_SOCKTYPE",
            "socket type not supported"
        ]
    ],
    [
        -114,
        [
            "EALREADY",
            "connection already in progress"
        ]
    ],
    [
        -9,
        [
            "EBADF",
            "bad file descriptor"
        ]
    ],
    [
        -16,
        [
            "EBUSY",
            "resource busy or locked"
        ]
    ],
    [
        -125,
        [
            "ECANCELED",
            "operation canceled"
        ]
    ],
    [
        -4080,
        [
            "ECHARSET",
            "invalid Unicode character"
        ]
    ],
    [
        -103,
        [
            "ECONNABORTED",
            "software caused connection abort"
        ]
    ],
    [
        -111,
        [
            "ECONNREFUSED",
            "connection refused"
        ]
    ],
    [
        -104,
        [
            "ECONNRESET",
            "connection reset by peer"
        ]
    ],
    [
        -89,
        [
            "EDESTADDRREQ",
            "destination address required"
        ]
    ],
    [
        -17,
        [
            "EEXIST",
            "file already exists"
        ]
    ],
    [
        -14,
        [
            "EFAULT",
            "bad address in system call argument"
        ]
    ],
    [
        -27,
        [
            "EFBIG",
            "file too large"
        ]
    ],
    [
        -113,
        [
            "EHOSTUNREACH",
            "host is unreachable"
        ]
    ],
    [
        -4,
        [
            "EINTR",
            "interrupted system call"
        ]
    ],
    [
        -22,
        [
            "EINVAL",
            "invalid argument"
        ]
    ],
    [
        -5,
        [
            "EIO",
            "i/o error"
        ]
    ],
    [
        -106,
        [
            "EISCONN",
            "socket is already connected"
        ]
    ],
    [
        -21,
        [
            "EISDIR",
            "illegal operation on a directory"
        ]
    ],
    [
        -40,
        [
            "ELOOP",
            "too many symbolic links encountered"
        ]
    ],
    [
        -24,
        [
            "EMFILE",
            "too many open files"
        ]
    ],
    [
        -90,
        [
            "EMSGSIZE",
            "message too long"
        ]
    ],
    [
        -36,
        [
            "ENAMETOOLONG",
            "name too long"
        ]
    ],
    [
        -100,
        [
            "ENETDOWN",
            "network is down"
        ]
    ],
    [
        -101,
        [
            "ENETUNREACH",
            "network is unreachable"
        ]
    ],
    [
        -23,
        [
            "ENFILE",
            "file table overflow"
        ]
    ],
    [
        -105,
        [
            "ENOBUFS",
            "no buffer space available"
        ]
    ],
    [
        -19,
        [
            "ENODEV",
            "no such device"
        ]
    ],
    [
        -2,
        [
            "ENOENT",
            "no such file or directory"
        ]
    ],
    [
        -12,
        [
            "ENOMEM",
            "not enough memory"
        ]
    ],
    [
        -64,
        [
            "ENONET",
            "machine is not on the network"
        ]
    ],
    [
        -92,
        [
            "ENOPROTOOPT",
            "protocol not available"
        ]
    ],
    [
        -28,
        [
            "ENOSPC",
            "no space left on device"
        ]
    ],
    [
        -38,
        [
            "ENOSYS",
            "function not implemented"
        ]
    ],
    [
        -107,
        [
            "ENOTCONN",
            "socket is not connected"
        ]
    ],
    [
        -20,
        [
            "ENOTDIR",
            "not a directory"
        ]
    ],
    [
        -39,
        [
            "ENOTEMPTY",
            "directory not empty"
        ]
    ],
    [
        -88,
        [
            "ENOTSOCK",
            "socket operation on non-socket"
        ]
    ],
    [
        -95,
        [
            "ENOTSUP",
            "operation not supported on socket"
        ]
    ],
    [
        -1,
        [
            "EPERM",
            "operation not permitted"
        ]
    ],
    [
        -32,
        [
            "EPIPE",
            "broken pipe"
        ]
    ],
    [
        -71,
        [
            "EPROTO",
            "protocol error"
        ]
    ],
    [
        -93,
        [
            "EPROTONOSUPPORT",
            "protocol not supported"
        ]
    ],
    [
        -91,
        [
            "EPROTOTYPE",
            "protocol wrong type for socket"
        ]
    ],
    [
        -34,
        [
            "ERANGE",
            "result too large"
        ]
    ],
    [
        -30,
        [
            "EROFS",
            "read-only file system"
        ]
    ],
    [
        -108,
        [
            "ESHUTDOWN",
            "cannot send after transport endpoint shutdown"
        ]
    ],
    [
        -29,
        [
            "ESPIPE",
            "invalid seek"
        ]
    ],
    [
        -3,
        [
            "ESRCH",
            "no such process"
        ]
    ],
    [
        -110,
        [
            "ETIMEDOUT",
            "connection timed out"
        ]
    ],
    [
        -26,
        [
            "ETXTBSY",
            "text file is busy"
        ]
    ],
    [
        -18,
        [
            "EXDEV",
            "cross-device link not permitted"
        ]
    ],
    [
        -4094,
        [
            "UNKNOWN",
            "unknown error"
        ]
    ],
    [
        -4095,
        [
            "EOF",
            "end of file"
        ]
    ],
    [
        -6,
        [
            "ENXIO",
            "no such device or address"
        ]
    ],
    [
        -31,
        [
            "EMLINK",
            "too many links"
        ]
    ],
    [
        -112,
        [
            "EHOSTDOWN",
            "host is down"
        ]
    ],
    [
        -121,
        [
            "EREMOTEIO",
            "remote I/O error"
        ]
    ],
    [
        -25,
        [
            "ENOTTY",
            "inappropriate ioctl for device"
        ]
    ],
    [
        -4028,
        [
            "EFTYPE",
            "inappropriate file type or format"
        ]
    ],
    [
        -84,
        [
            "EILSEQ",
            "illegal byte sequence"
        ]
    ], 
];
const errorToCodeLinux = codeToErrorLinux.map(([status, [code]])=>[
        code,
        status
    ]
);
const errorMap = new Map(osType1 === "windows" ? codeToErrorWindows : osType1 === "darwin" ? codeToErrorDarwin : osType1 === "linux" ? codeToErrorLinux : unreachable());
const codeMap = new Map(osType1 === "windows" ? errorToCodeWindows : osType1 === "darwin" ? errorToCodeDarwin : osType1 === "linux" ? errorToCodeLinux : unreachable());
const classRegExp = /^([A-Z][a-z0-9]*)+$/;
const kTypes = [
    "string",
    "function",
    "number",
    "object",
    "Function",
    "Object",
    "boolean",
    "bigint",
    "symbol", 
];
const nodeInternalPrefix = "__node_internal_";
function hideStackFrames(fn) {
    const hidden = nodeInternalPrefix + fn.name;
    Object.defineProperty(fn, "name", {
        value: hidden
    });
    return fn;
}
const captureLargerStackTrace = hideStackFrames(function captureLargerStackTrace(err) {
    Error.captureStackTrace(err);
    return err;
});
hideStackFrames(function uvExceptionWithHostPort(err, syscall, address, port) {
    const { 0: code , 1: uvmsg  } = uvErrmapGet(err) || uvUnmappedError;
    const message = `${syscall} ${code}: ${uvmsg}`;
    let details = "";
    if (port && port > 0) {
        details = ` ${address}:${port}`;
    } else if (address) {
        details = ` ${address}`;
    }
    const ex = new Error(`${message}${details}`);
    ex.code = code;
    ex.errno = err;
    ex.syscall = syscall;
    ex.address = address;
    if (port) {
        ex.port = port;
    }
    return captureLargerStackTrace(ex);
});
class ERR_INVALID_ARG_TYPE extends NodeTypeError {
    constructor(name, expected, actual){
        expected = Array.isArray(expected) ? expected : [
            expected
        ];
        let msg = "The ";
        if (name.endsWith(" argument")) {
            msg += `${name} `;
        } else {
            const type = name.includes(".") ? "property" : "argument";
            msg += `"${name}" ${type} `;
        }
        msg += "must be ";
        const types = [];
        const instances = [];
        const other = [];
        for (const value of expected){
            if (kTypes.includes(value)) {
                types.push(value.toLocaleLowerCase());
            } else if (classRegExp.test(value)) {
                instances.push(value);
            } else {
                other.push(value);
            }
        }
        if (instances.length > 0) {
            const pos = types.indexOf("object");
            if (pos !== -1) {
                types.splice(pos, 1);
                instances.push("Object");
            }
        }
        if (types.length > 0) {
            if (types.length > 2) {
                const last = types.pop();
                msg += `one of type ${types.join(", ")}, or ${last}`;
            } else if (types.length === 2) {
                msg += `one of type ${types[0]} or ${types[1]}`;
            } else {
                msg += `of type ${types[0]}`;
            }
            if (instances.length > 0 || other.length > 0) {
                msg += " or ";
            }
        }
        if (instances.length > 0) {
            if (instances.length > 2) {
                const last = instances.pop();
                msg += `an instance of ${instances.join(", ")}, or ${last}`;
            } else {
                msg += `an instance of ${instances[0]}`;
                if (instances.length === 2) {
                    msg += ` or ${instances[1]}`;
                }
            }
            if (other.length > 0) {
                msg += " or ";
            }
        }
        if (other.length > 0) {
            if (other.length > 2) {
                const last = other.pop();
                msg += `one of ${other.join(", ")}, or ${last}`;
            } else if (other.length === 2) {
                msg += `one of ${other[0]} or ${other[1]}`;
            } else {
                if (other[0].toLowerCase() !== other[0]) {
                    msg += "an ";
                }
                msg += `${other[0]}`;
            }
        }
        super("ERR_INVALID_ARG_TYPE", `${msg}.${invalidArgTypeHelper(actual)}`);
    }
}
function uvErrmapGet(name) {
    return errorMap.get(name);
}
const uvUnmappedError = [
    "UNKNOWN",
    "unknown error"
];
hideStackFrames(function uvException(ctx) {
    const { 0: code , 1: uvmsg  } = uvErrmapGet(ctx.errno) || uvUnmappedError;
    let message = `${code}: ${ctx.message || uvmsg}, ${ctx.syscall}`;
    let path53;
    let dest;
    if (ctx.path) {
        path53 = ctx.path.toString();
        message += ` '${path53}'`;
    }
    if (ctx.dest) {
        dest = ctx.dest.toString();
        message += ` -> '${dest}'`;
    }
    const err = new Error(message);
    for (const prop of Object.keys(ctx)){
        if (prop === "message" || prop === "path" || prop === "dest") {
            continue;
        }
        err[prop] = ctx[prop];
    }
    err.code = code;
    if (path53) {
        err.path = path53;
    }
    if (dest) {
        err.dest = dest;
    }
    return captureLargerStackTrace(err);
});
const NumberIsSafeInteger = Number.isSafeInteger;
const DEFAULT_INSPECT_OPTIONS = {
    showHidden: false,
    depth: 2,
    colors: false,
    customInspect: true,
    showProxy: false,
    maxArrayLength: 100,
    maxStringLength: Infinity,
    breakLength: 80,
    compact: 3,
    sorted: false,
    getters: false
};
inspect.defaultOptions = DEFAULT_INSPECT_OPTIONS;
inspect.custom = Symbol.for("nodejs.util.inspect.custom");
function inspect(object, ...opts) {
    if (typeof object === "string" && !object.includes("'")) {
        return `'${object}'`;
    }
    opts = {
        ...DEFAULT_INSPECT_OPTIONS,
        ...opts
    };
    return Deno.inspect(object, {
        depth: opts.depth,
        iterableLimit: opts.maxArrayLength,
        compact: !!opts.compact,
        sorted: !!opts.sorted,
        showProxy: !!opts.showProxy
    });
}
class ERR_OUT_OF_RANGE extends RangeError {
    code = "ERR_OUT_OF_RANGE";
    constructor(str, range, received){
        super(`The value of "${str}" is out of range. It must be ${range}. Received ${received}`);
        const { name  } = this;
        this.name = `${name} [${this.code}]`;
        this.stack;
        this.name = name;
    }
}
function getSystemErrorName(code) {
    if (typeof code !== "number") {
        throw new ERR_INVALID_ARG_TYPE("err", "number", code);
    }
    if (code >= 0 || !NumberIsSafeInteger(code)) {
        throw new ERR_OUT_OF_RANGE("err", "a negative integer", code);
    }
    return errorMap.get(code)?.[0];
}
hideStackFrames(function errnoException(err, syscall, original) {
    const code = getSystemErrorName(err);
    const message = original ? `${syscall} ${code} ${original}` : `${syscall} ${code}`;
    const ex = new Error(message);
    ex.errno = err;
    ex.code = code;
    ex.syscall = syscall;
    return captureLargerStackTrace(ex);
});
hideStackFrames(function exceptionWithHostPort(err, syscall, address, port, additional) {
    const code = getSystemErrorName(err);
    let details = "";
    if (port && port > 0) {
        details = ` ${address}:${port}`;
    } else if (address) {
        details = ` ${address}`;
    }
    if (additional) {
        details += ` - Local (${additional})`;
    }
    const ex = new Error(`${syscall} ${code}${details}`);
    ex.errno = err;
    ex.code = code;
    ex.syscall = syscall;
    ex.address = address;
    if (port) {
        ex.port = port;
    }
    return captureLargerStackTrace(ex);
});
hideStackFrames(function(code, syscall, hostname) {
    let errno;
    if (typeof code === "number") {
        errno = code;
        if (code === codeMap.get("EAI_NODATA") || code === codeMap.get("EAI_NONAME")) {
            code = "ENOTFOUND";
        } else {
            code = getSystemErrorName(code);
        }
    }
    const message = `${syscall} ${code}${hostname ? ` ${hostname}` : ""}`;
    const ex = new Error(message);
    ex.errno = errno;
    ex.code = code;
    ex.syscall = syscall;
    if (hostname) {
        ex.hostname = hostname;
    }
    return captureLargerStackTrace(ex);
});
class NodeErrorAbstraction extends Error {
    code;
    constructor(name, code, message){
        super(message);
        this.code = code;
        this.name = name;
        this.stack = this.stack && `${name} [${this.code}]${this.stack.slice(20)}`;
    }
    toString() {
        return `${this.name} [${this.code}]: ${this.message}`;
    }
}
class NodeError extends NodeErrorAbstraction {
    constructor(code, message){
        super(Error.prototype.name, code, message);
    }
}
class NodeTypeError extends NodeErrorAbstraction {
    constructor(code, message){
        super(TypeError.prototype.name, code, message);
        Object.setPrototypeOf(this, TypeError.prototype);
        this.toString = function() {
            return `${this.name} [${this.code}]: ${this.message}`;
        };
    }
}
function invalidArgTypeHelper(input) {
    if (input == null) {
        return ` Received ${input}`;
    }
    if (typeof input === "function" && input.name) {
        return ` Received function ${input.name}`;
    }
    if (typeof input === "object") {
        if (input.constructor && input.constructor.name) {
            return ` Received an instance of ${input.constructor.name}`;
        }
        return ` Received ${inspect(input, {
            depth: -1
        })}`;
    }
    let inspected = inspect(input, {
        colors: false
    });
    if (inspected.length > 25) {
        inspected = `${inspected.slice(0, 25)}...`;
    }
    return ` Received type ${typeof input} (${inspected})`;
}
class ERR_UNHANDLED_ERROR extends NodeError {
    constructor(x){
        super("ERR_UNHANDLED_ERROR", `Unhandled error. (${x})`);
    }
}
function ensureArray(maybeArray) {
    return Array.isArray(maybeArray) ? maybeArray : [
        maybeArray
    ];
}
function createIterResult(value, done) {
    return {
        value,
        done
    };
}
let defaultMaxListeners = 10;
function validateMaxListeners(n, name) {
    if (!Number.isInteger(n) || Number.isNaN(n) || n < 0) {
        throw new ERR_OUT_OF_RANGE(name, "a non-negative number", inspect(n));
    }
}
function setMaxListeners(n, ...eventTargets) {
    validateMaxListeners(n, "n");
    if (eventTargets.length === 0) {
        defaultMaxListeners = n;
    } else {
        for (const target of eventTargets){
            if (target instanceof EventEmitter) {
                target.setMaxListeners(n);
            } else if (target instanceof EventTarget) {
                notImplemented("setMaxListeners currently does not support EventTarget");
            } else {
                throw new ERR_INVALID_ARG_TYPE("eventTargets", [
                    "EventEmitter",
                    "EventTarget"
                ], target);
            }
        }
    }
}
class EventEmitter {
    static captureRejectionSymbol = Symbol.for("nodejs.rejection");
    static errorMonitor = Symbol("events.errorMonitor");
    static get defaultMaxListeners() {
        return defaultMaxListeners;
    }
    static set defaultMaxListeners(value) {
        validateMaxListeners(value, "defaultMaxListeners");
        defaultMaxListeners = value;
    }
    maxListeners;
    _events;
    static  #init(emitter) {
        if (emitter._events == null || emitter._events === Object.getPrototypeOf(emitter)._events) {
            emitter._events = Object.create(null);
        }
    }
    static call = function call(thisArg) {
        EventEmitter.#init(thisArg);
    };
    constructor(){
        EventEmitter.#init(this);
    }
    addListener(eventName, listener) {
        return EventEmitter.#addListener(this, eventName, listener, false);
    }
    emit(eventName, ...args) {
        if (hasListeners(this._events, eventName)) {
            if (eventName === "error" && hasListeners(this._events, EventEmitter.errorMonitor)) {
                this.emit(EventEmitter.errorMonitor, ...args);
            }
            const listeners1 = ensureArray(this._events[eventName]).slice();
            for (const listener of listeners1){
                try {
                    listener.apply(this, args);
                } catch (err) {
                    this.emit("error", err);
                }
            }
            return true;
        } else if (eventName === "error") {
            if (hasListeners(this._events, EventEmitter.errorMonitor)) {
                this.emit(EventEmitter.errorMonitor, ...args);
            }
            let err = args.length > 0 ? args[0] : "Unhandled error.";
            if (err instanceof Error) {
                throw err;
            }
            try {
                err = inspect(err);
            } catch  {}
            throw new ERR_UNHANDLED_ERROR(err);
        }
        return false;
    }
    eventNames() {
        return Reflect.ownKeys(this._events);
    }
    getMaxListeners() {
        return EventEmitter.#getMaxListeners(this);
    }
    listenerCount(eventName) {
        return EventEmitter.#listenerCount(this, eventName);
    }
    static listenerCount(emitter1, eventName) {
        return emitter1.listenerCount(eventName);
    }
    listeners(eventName) {
        return listeners(this._events, eventName, true);
    }
    rawListeners(eventName) {
        return listeners(this._events, eventName, false);
    }
    off(eventName, listener) {}
    on(eventName, listener) {}
    once(eventName, listener) {
        const wrapped = onceWrap(this, eventName, listener);
        this.on(eventName, wrapped);
        return this;
    }
    prependListener(eventName, listener) {
        return EventEmitter.#addListener(this, eventName, listener, true);
    }
    prependOnceListener(eventName, listener) {
        const wrapped = onceWrap(this, eventName, listener);
        this.prependListener(eventName, wrapped);
        return this;
    }
    removeAllListeners(eventName1) {
        if (this._events === undefined) {
            return this;
        }
        if (eventName1) {
            if (hasListeners(this._events, eventName1)) {
                const listeners2 = ensureArray(this._events[eventName1]).slice().reverse();
                for (const listener of listeners2){
                    this.removeListener(eventName1, unwrapListener(listener));
                }
            }
        } else {
            const eventList = this.eventNames();
            eventList.forEach((eventName)=>{
                if (eventName === "removeListener") return;
                this.removeAllListeners(eventName);
            });
            this.removeAllListeners("removeListener");
        }
        return this;
    }
    removeListener(eventName, listener) {
        checkListenerArgument(listener);
        if (hasListeners(this._events, eventName)) {
            const maybeArr = this._events[eventName];
            assert1(maybeArr);
            const arr = ensureArray(maybeArr);
            let listenerIndex = -1;
            for(let i = arr.length - 1; i >= 0; i--){
                if (arr[i] == listener || arr[i] && arr[i]["listener"] == listener) {
                    listenerIndex = i;
                    break;
                }
            }
            if (listenerIndex >= 0) {
                arr.splice(listenerIndex, 1);
                if (arr.length === 0) {
                    delete this._events[eventName];
                } else if (arr.length === 1) {
                    this._events[eventName] = arr[0];
                }
                if (this._events.removeListener) {
                    this.emit("removeListener", eventName, listener);
                }
            }
        }
        return this;
    }
    setMaxListeners(n) {
        if (n !== Infinity) {
            validateMaxListeners(n, "n");
        }
        this.maxListeners = n;
        return this;
    }
    static once(emitter2, name) {
        return new Promise((resolve7, reject)=>{
            if (emitter2 instanceof EventTarget) {
                emitter2.addEventListener(name, (...args)=>{
                    resolve7(args);
                }, {
                    once: true,
                    passive: false,
                    capture: false
                });
                return;
            } else if (emitter2 instanceof EventEmitter) {
                const eventListener = (...args)=>{
                    if (errorListener !== undefined) {
                        emitter2.removeListener("error", errorListener);
                    }
                    resolve7(args);
                };
                let errorListener;
                if (name !== "error") {
                    errorListener = (err)=>{
                        emitter2.removeListener(name, eventListener);
                        reject(err);
                    };
                    emitter2.once("error", errorListener);
                }
                emitter2.once(name, eventListener);
                return;
            }
        });
    }
    static on(emitter3, event) {
        const unconsumedEventValues = [];
        const unconsumedPromises = [];
        let error = null;
        let finished = false;
        const iterator = {
            next () {
                const value = unconsumedEventValues.shift();
                if (value) {
                    return Promise.resolve(createIterResult(value, false));
                }
                if (error) {
                    const p = Promise.reject(error);
                    error = null;
                    return p;
                }
                if (finished) {
                    return Promise.resolve(createIterResult(undefined, true));
                }
                return new Promise(function(resolve8, reject) {
                    unconsumedPromises.push({
                        resolve: resolve8,
                        reject
                    });
                });
            },
            return () {
                emitter3.removeListener(event, eventHandler);
                emitter3.removeListener("error", errorHandler);
                finished = true;
                for (const promise of unconsumedPromises){
                    promise.resolve(createIterResult(undefined, true));
                }
                return Promise.resolve(createIterResult(undefined, true));
            },
            throw (err) {
                error = err;
                emitter3.removeListener(event, eventHandler);
                emitter3.removeListener("error", errorHandler);
            },
            [Symbol.asyncIterator] () {
                return this;
            }
        };
        emitter3.on(event, eventHandler);
        emitter3.on("error", errorHandler);
        return iterator;
        function eventHandler(...args) {
            const promise = unconsumedPromises.shift();
            if (promise) {
                promise.resolve(createIterResult(args, false));
            } else {
                unconsumedEventValues.push(args);
            }
        }
        function errorHandler(err) {
            finished = true;
            const toError = unconsumedPromises.shift();
            if (toError) {
                toError.reject(err);
            } else {
                error = err;
            }
            iterator.return();
        }
    }
    static  #addListener(target, eventName, listener, prepend) {
        checkListenerArgument(listener);
        let events = target._events;
        if (events == null) {
            EventEmitter.#init(target);
            events = target._events;
        }
        if (events.newListener) {
            target.emit("newListener", eventName, unwrapListener(listener));
        }
        if (hasListeners(events, eventName)) {
            let listeners = events[eventName];
            if (!Array.isArray(listeners)) {
                listeners = [
                    listeners
                ];
                events[eventName] = listeners;
            }
            if (prepend) {
                listeners.unshift(listener);
            } else {
                listeners.push(listener);
            }
        } else if (events) {
            events[eventName] = listener;
        }
        const max = EventEmitter.#getMaxListeners(target);
        if (max > 0 && EventEmitter.#listenerCount(target, eventName) > max) {
            const warning = new MaxListenersExceededWarning(target, eventName);
            EventEmitter.#warnIfNeeded(target, eventName, warning);
        }
        return target;
    }
    static  #getMaxListeners(target1) {
        return target1.maxListeners == null ? EventEmitter.defaultMaxListeners : target1.maxListeners;
    }
    static  #listenerCount(target2, eventName2) {
        if (hasListeners(target2._events, eventName2)) {
            const maybeListeners = target2._events[eventName2];
            return Array.isArray(maybeListeners) ? maybeListeners.length : 1;
        } else {
            return 0;
        }
    }
    static  #warnIfNeeded(target3, eventName3, warning) {
        const listeners = target3._events[eventName3];
        if (listeners.warned) {
            return;
        }
        listeners.warned = true;
        console.warn(warning);
        const maybeProcess = globalThis.process;
        if (maybeProcess) {
            maybeProcess.emitWarning(warning);
        }
    }
}
function checkListenerArgument(listener1) {
    if (typeof listener1 !== "function") {
        throw new ERR_INVALID_ARG_TYPE("listener", "function", listener1);
    }
}
function hasListeners(maybeEvents, eventName) {
    return maybeEvents != null && Boolean(maybeEvents[eventName]);
}
function listeners(events, eventName4, unwrap) {
    if (!hasListeners(events, eventName4)) {
        return [];
    }
    const eventListeners = events[eventName4];
    if (Array.isArray(eventListeners)) {
        return unwrap ? unwrapListeners(eventListeners) : eventListeners.slice(0);
    } else {
        return [
            unwrap ? unwrapListener(eventListeners) : eventListeners, 
        ];
    }
}
function unwrapListeners(arr) {
    const unwrappedListeners = new Array(arr.length);
    for(let i = 0; i < arr.length; i++){
        unwrappedListeners[i] = unwrapListener(arr[i]);
    }
    return unwrappedListeners;
}
function unwrapListener(listener2) {
    return listener2["listener"] ?? listener2;
}
function onceWrap(target4, eventName5, listener3) {
    checkListenerArgument(listener3);
    const wrapper = function(...args) {
        if (this.isCalled) {
            return;
        }
        this.context.removeListener(this.eventName, this.listener);
        this.isCalled = true;
        return this.listener.apply(this.context, args);
    };
    const wrapperContext = {
        eventName: eventName5,
        listener: listener3,
        rawListener: wrapper,
        context: target4
    };
    const wrapped = wrapper.bind(wrapperContext);
    wrapperContext.rawListener = wrapped;
    wrapped.listener = listener3;
    return wrapped;
}
EventEmitter.prototype.on = EventEmitter.prototype.addListener;
EventEmitter.prototype.off = EventEmitter.prototype.removeListener;
class MaxListenersExceededWarning extends Error {
    emitter;
    type;
    count;
    constructor(emitter4, type){
        const listenerCount1 = emitter4.listenerCount(type);
        const message = "Possible EventEmitter memory leak detected. " + `${listenerCount1} ${type == null ? "null" : type.toString()} listeners added to [${emitter4.constructor.name}]. ` + " Use emitter.setMaxListeners() to increase limit";
        super(message);
        this.emitter = emitter4;
        this.type = type;
        this.count = listenerCount1;
        this.name = "MaxListenersExceededWarning";
    }
}
makeMethodsEnumerable(EventEmitter);
EventEmitter.captureRejectionSymbol;
EventEmitter.errorMonitor;
EventEmitter.listenerCount;
EventEmitter.on;
EventEmitter.once;
Object.assign(EventEmitter, {
    EventEmitter,
    setMaxListeners
});
function toArr(any) {
    return any == null ? [] : Array.isArray(any) ? any : [
        any
    ];
}
function toVal(out, key, val, opts) {
    var x, old = out[key], nxt = !!~opts.string.indexOf(key) ? val == null || val === true ? "" : String(val) : typeof val === "boolean" ? val : !!~opts.boolean.indexOf(key) ? val === "false" ? false : val === "true" || (out._.push((x = +val, x * 0 === 0) ? x : val), !!val) : (x = +val, x * 0 === 0) ? x : val;
    out[key] = old == null ? nxt : Array.isArray(old) ? old.concat(nxt) : [
        old,
        nxt
    ];
}
function index(args, opts) {
    args = args || [];
    opts = opts || {};
    var k, arr, arg, name, val, out = {
        _: []
    };
    var i = 0, j = 0, idx = 0, len = args.length;
    const alibi = opts.alias !== void 0;
    const strict = opts.unknown !== void 0;
    const defaults = opts.default !== void 0;
    opts.alias = opts.alias || {};
    opts.string = toArr(opts.string);
    opts.boolean = toArr(opts.boolean);
    if (alibi) {
        for(k in opts.alias){
            arr = opts.alias[k] = toArr(opts.alias[k]);
            for(i = 0; i < arr.length; i++){
                (opts.alias[arr[i]] = arr.concat(k)).splice(i, 1);
            }
        }
    }
    for(i = opts.boolean.length; i-- > 0;){
        arr = opts.alias[opts.boolean[i]] || [];
        for(j = arr.length; j-- > 0;)opts.boolean.push(arr[j]);
    }
    for(i = opts.string.length; i-- > 0;){
        arr = opts.alias[opts.string[i]] || [];
        for(j = arr.length; j-- > 0;)opts.string.push(arr[j]);
    }
    if (defaults) {
        for(k in opts.default){
            name = typeof opts.default[k];
            arr = opts.alias[k] = opts.alias[k] || [];
            if (opts[name] !== void 0) {
                opts[name].push(k);
                for(i = 0; i < arr.length; i++){
                    opts[name].push(arr[i]);
                }
            }
        }
    }
    const keys = strict ? Object.keys(opts.alias) : [];
    for(i = 0; i < len; i++){
        arg = args[i];
        if (arg === "--") {
            out._ = out._.concat(args.slice(++i));
            break;
        }
        for(j = 0; j < arg.length; j++){
            if (arg.charCodeAt(j) !== 45) break;
        }
        if (j === 0) {
            out._.push(arg);
        } else if (arg.substring(j, j + 3) === "no-") {
            name = arg.substring(j + 3);
            if (strict && !~keys.indexOf(name)) {
                return opts.unknown(arg);
            }
            out[name] = false;
        } else {
            for(idx = j + 1; idx < arg.length; idx++){
                if (arg.charCodeAt(idx) === 61) break;
            }
            name = arg.substring(j, idx);
            val = arg.substring(++idx) || i + 1 === len || ("" + args[i + 1]).charCodeAt(0) === 45 || args[++i];
            arr = j === 2 ? [
                name
            ] : name;
            for(idx = 0; idx < arr.length; idx++){
                name = arr[idx];
                if (strict && !~keys.indexOf(name)) return opts.unknown("-".repeat(j) + name);
                toVal(out, name, idx + 1 < arr.length || val, opts);
            }
        }
    }
    if (defaults) {
        for(k in opts.default){
            if (out[k] === void 0) {
                out[k] = opts.default[k];
            }
        }
    }
    if (alibi) {
        for(k in out){
            arr = opts.alias[k] || [];
            while(arr.length > 0){
                out[arr.shift()] = out[k];
            }
        }
    }
    return out;
}
const removeBrackets = (v)=>v.replace(/[<[].+/, '').trim()
;
const findAllBrackets = (v)=>{
    const ANGLED_BRACKET_RE_GLOBAL = /<([^>]+)>/g;
    const SQUARE_BRACKET_RE_GLOBAL = /\[([^\]]+)\]/g;
    const res = [];
    const parse6 = (match)=>{
        let variadic = false;
        let value = match[1];
        if (value.startsWith('...')) {
            value = value.slice(3);
            variadic = true;
        }
        return {
            required: match[0].startsWith('<'),
            value,
            variadic
        };
    };
    let angledMatch;
    while(angledMatch = ANGLED_BRACKET_RE_GLOBAL.exec(v)){
        res.push(parse6(angledMatch));
    }
    let squareMatch;
    while(squareMatch = SQUARE_BRACKET_RE_GLOBAL.exec(v)){
        res.push(parse6(squareMatch));
    }
    return res;
};
const getMriOptions = (options)=>{
    const result = {
        alias: {},
        boolean: []
    };
    for (const [index2, option] of options.entries()){
        if (option.names.length > 1) {
            result.alias[option.names[0]] = option.names.slice(1);
        }
        if (option.isBoolean) {
            if (option.negated) {
                const hasStringTypeOption = options.some((o, i)=>{
                    return i !== index2 && o.names.some((name)=>option.names.includes(name)
                    ) && typeof o.required === 'boolean';
                });
                if (!hasStringTypeOption) {
                    result.boolean.push(option.names[0]);
                }
            } else {
                result.boolean.push(option.names[0]);
            }
        }
    }
    return result;
};
const findLongest = (arr)=>{
    return arr.sort((a, b)=>{
        return a.length > b.length ? -1 : 1;
    })[0];
};
const padRight = (str, length)=>{
    return str.length >= length ? str : `${str}${' '.repeat(length - str.length)}`;
};
const camelcase = (input)=>{
    return input.replace(/([a-z])-([a-z])/g, (_, p1, p2)=>{
        return p1 + p2.toUpperCase();
    });
};
const setDotProp = (obj, keys, val)=>{
    let i = 0;
    let length = keys.length;
    let t = obj;
    let x;
    for(; i < length; ++i){
        x = t[keys[i]];
        t = t[keys[i]] = i === length - 1 ? val : x != null ? x : !!~keys[i + 1].indexOf('.') || !(+keys[i + 1] > -1) ? {} : [];
    }
};
const setByType = (obj, transforms)=>{
    for (const key of Object.keys(transforms)){
        const transform = transforms[key];
        if (transform.shouldTransform) {
            obj[key] = Array.prototype.concat.call([], obj[key]);
            if (typeof transform.transformFunction === 'function') {
                obj[key] = obj[key].map(transform.transformFunction);
            }
        }
    }
};
const getFileName = (input)=>{
    const m = /([^\\\/]+)$/.exec(input);
    return m ? m[1] : '';
};
const camelcaseOptionName = (name)=>{
    return name.split('.').map((v, i)=>{
        return i === 0 ? camelcase(v) : v;
    }).join('.');
};
class CACError extends Error {
    constructor(message){
        super(message);
        this.name = this.constructor.name;
        if (typeof Error.captureStackTrace === 'function') {
            Error.captureStackTrace(this, this.constructor);
        } else {
            this.stack = new Error(message).stack;
        }
    }
}
class Option {
    rawName;
    description;
    name;
    names;
    isBoolean;
    required;
    config;
    negated;
    constructor(rawName, description, config){
        this.rawName = rawName;
        this.description = description;
        this.config = Object.assign({}, config);
        rawName = rawName.replace(/\.\*/g, '');
        this.negated = false;
        this.names = removeBrackets(rawName).split(',').map((v)=>{
            let name = v.trim().replace(/^-{1,2}/, '');
            if (name.startsWith('no-')) {
                this.negated = true;
                name = name.replace(/^no-/, '');
            }
            return camelcaseOptionName(name);
        }).sort((a, b)=>a.length > b.length ? 1 : -1
        );
        this.name = this.names[this.names.length - 1];
        if (this.negated && this.config.default == null) {
            this.config.default = true;
        }
        if (rawName.includes('<')) {
            this.required = true;
        } else if (rawName.includes('[')) {
            this.required = false;
        } else {
            this.isBoolean = true;
        }
    }
}
const processArgs = [
    'deno',
    'cli'
].concat(Deno.args);
const platformInfo = `${Deno.build.os}-${Deno.build.arch} deno-${Deno.version.deno}`;
class Command {
    rawName;
    description;
    config;
    cli;
    options;
    aliasNames;
    name;
    args;
    commandAction;
    usageText;
    versionNumber;
    examples;
    helpCallback;
    globalCommand;
    constructor(rawName, description, config = {}, cli1){
        this.rawName = rawName;
        this.description = description;
        this.config = config;
        this.cli = cli1;
        this.options = [];
        this.aliasNames = [];
        this.name = removeBrackets(rawName);
        this.args = findAllBrackets(rawName);
        this.examples = [];
    }
    usage(text) {
        this.usageText = text;
        return this;
    }
    allowUnknownOptions() {
        this.config.allowUnknownOptions = true;
        return this;
    }
    ignoreOptionDefaultValue() {
        this.config.ignoreOptionDefaultValue = true;
        return this;
    }
    version(version, customFlags = '-v, --version') {
        this.versionNumber = version;
        this.option(customFlags, 'Display version number');
        return this;
    }
    example(example) {
        this.examples.push(example);
        return this;
    }
    option(rawName, description, config) {
        const option = new Option(rawName, description, config);
        this.options.push(option);
        return this;
    }
    alias(name) {
        this.aliasNames.push(name);
        return this;
    }
    action(callback) {
        this.commandAction = callback;
        return this;
    }
    isMatched(name) {
        return this.name === name || this.aliasNames.includes(name);
    }
    get isDefaultCommand() {
        return this.name === '' || this.aliasNames.includes('!');
    }
    get isGlobalCommand() {
        return this instanceof GlobalCommand;
    }
    hasOption(name) {
        name = name.split('.')[0];
        return this.options.find((option)=>{
            return option.names.includes(name);
        });
    }
    outputHelp() {
        const { name , commands  } = this.cli;
        const { versionNumber , options: globalOptions , helpCallback  } = this.cli.globalCommand;
        let sections = [
            {
                body: `${name}${versionNumber ? `/${versionNumber}` : ''}`
            }
        ];
        sections.push({
            title: 'Usage',
            body: `  $ ${name} ${this.usageText || this.rawName}`
        });
        const showCommands = (this.isGlobalCommand || this.isDefaultCommand) && commands.length > 0;
        if (showCommands) {
            const longestCommandName = findLongest(commands.map((command)=>command.rawName
            ));
            sections.push({
                title: 'Commands',
                body: commands.map((command)=>{
                    return `  ${padRight(command.rawName, longestCommandName.length)}  ${command.description}`;
                }).join('\n')
            });
            sections.push({
                title: `For more info, run any command with the \`--help\` flag`,
                body: commands.map((command)=>`  $ ${name}${command.name === '' ? '' : ` ${command.name}`} --help`
                ).join('\n')
            });
        }
        let options = this.isGlobalCommand ? globalOptions : [
            ...this.options,
            ...globalOptions || []
        ];
        if (!this.isGlobalCommand && !this.isDefaultCommand) {
            options = options.filter((option)=>option.name !== 'version'
            );
        }
        if (options.length > 0) {
            const longestOptionName = findLongest(options.map((option)=>option.rawName
            ));
            sections.push({
                title: 'Options',
                body: options.map((option)=>{
                    return `  ${padRight(option.rawName, longestOptionName.length)}  ${option.description} ${option.config.default === undefined ? '' : `(default: ${option.config.default})`}`;
                }).join('\n')
            });
        }
        if (this.examples.length > 0) {
            sections.push({
                title: 'Examples',
                body: this.examples.map((example)=>{
                    if (typeof example === 'function') {
                        return example(name);
                    }
                    return example;
                }).join('\n')
            });
        }
        if (helpCallback) {
            sections = helpCallback(sections) || sections;
        }
        console.log(sections.map((section)=>{
            return section.title ? `${section.title}:\n${section.body}` : section.body;
        }).join('\n\n'));
    }
    outputVersion() {
        const { name  } = this.cli;
        const { versionNumber  } = this.cli.globalCommand;
        if (versionNumber) {
            console.log(`${name}/${versionNumber} ${platformInfo}`);
        }
    }
    checkRequiredArgs() {
        const minimalArgsCount = this.args.filter((arg)=>arg.required
        ).length;
        if (this.cli.args.length < minimalArgsCount) {
            throw new CACError(`missing required args for command \`${this.rawName}\``);
        }
    }
    checkUnknownOptions() {
        const { options , globalCommand  } = this.cli;
        if (!this.config.allowUnknownOptions) {
            for (const name of Object.keys(options)){
                if (name !== '--' && !this.hasOption(name) && !globalCommand.hasOption(name)) {
                    throw new CACError(`Unknown option \`${name.length > 1 ? `--${name}` : `-${name}`}\``);
                }
            }
        }
    }
    checkOptionValue() {
        const { options: parsedOptions , globalCommand  } = this.cli;
        const options = [
            ...globalCommand.options,
            ...this.options
        ];
        for (const option of options){
            const value = parsedOptions[option.name.split('.')[0]];
            if (option.required) {
                const hasNegated = options.some((o)=>o.negated && o.names.includes(option.name)
                );
                if (value === true || value === false && !hasNegated) {
                    throw new CACError(`option \`${option.rawName}\` value is missing`);
                }
            }
        }
    }
}
class GlobalCommand extends Command {
    constructor(cli2){
        super('@@global@@', '', {}, cli2);
    }
}
class CAC extends EventEmitter {
    name;
    commands;
    globalCommand;
    matchedCommand;
    matchedCommandName;
    rawArgs;
    args;
    options;
    showHelpOnExit;
    showVersionOnExit;
    constructor(name = ''){
        super();
        this.name = name;
        this.commands = [];
        this.rawArgs = [];
        this.args = [];
        this.options = {};
        this.globalCommand = new GlobalCommand(this);
        this.globalCommand.usage('<command> [options]');
    }
    usage(text) {
        this.globalCommand.usage(text);
        return this;
    }
    command(rawName, description, config) {
        const command = new Command(rawName, description || '', config, this);
        command.globalCommand = this.globalCommand;
        this.commands.push(command);
        return command;
    }
    option(rawName, description, config) {
        this.globalCommand.option(rawName, description, config);
        return this;
    }
    help(callback) {
        this.globalCommand.option('-h, --help', 'Display this message');
        this.globalCommand.helpCallback = callback;
        this.showHelpOnExit = true;
        return this;
    }
    version(version, customFlags = '-v, --version') {
        this.globalCommand.version(version, customFlags);
        this.showVersionOnExit = true;
        return this;
    }
    example(example) {
        this.globalCommand.example(example);
        return this;
    }
    outputHelp() {
        if (this.matchedCommand) {
            this.matchedCommand.outputHelp();
        } else {
            this.globalCommand.outputHelp();
        }
    }
    outputVersion() {
        this.globalCommand.outputVersion();
    }
    setParsedInfo({ args , options  }, matchedCommand, matchedCommandName) {
        this.args = args;
        this.options = options;
        if (matchedCommand) {
            this.matchedCommand = matchedCommand;
        }
        if (matchedCommandName) {
            this.matchedCommandName = matchedCommandName;
        }
        return this;
    }
    unsetMatchedCommand() {
        this.matchedCommand = undefined;
        this.matchedCommandName = undefined;
    }
    parse(argv = processArgs, { run =true  } = {}) {
        this.rawArgs = argv;
        if (!this.name) {
            this.name = argv[1] ? getFileName(argv[1]) : 'cli';
        }
        let shouldParse = true;
        for (const command of this.commands){
            const parsed = this.mri(argv.slice(2), command);
            const commandName = parsed.args[0];
            if (command.isMatched(commandName)) {
                shouldParse = false;
                const parsedInfo = {
                    ...parsed,
                    args: parsed.args.slice(1)
                };
                this.setParsedInfo(parsedInfo, command, commandName);
                this.emit(`command:${commandName}`, command);
            }
        }
        if (shouldParse) {
            for (const command of this.commands){
                if (command.name === '') {
                    shouldParse = false;
                    const parsed = this.mri(argv.slice(2), command);
                    this.setParsedInfo(parsed, command);
                    this.emit(`command:!`, command);
                }
            }
        }
        if (shouldParse) {
            const parsed = this.mri(argv.slice(2));
            this.setParsedInfo(parsed);
        }
        if (this.options.help && this.showHelpOnExit) {
            this.outputHelp();
            run = false;
            this.unsetMatchedCommand();
        }
        if (this.options.version && this.showVersionOnExit && this.matchedCommandName == null) {
            this.outputVersion();
            run = false;
            this.unsetMatchedCommand();
        }
        const parsedArgv = {
            args: this.args,
            options: this.options
        };
        if (run) {
            this.runMatchedCommand();
        }
        if (!this.matchedCommand && this.args[0]) {
            this.emit('command:*');
        }
        return parsedArgv;
    }
    mri(argv, command) {
        const cliOptions = [
            ...this.globalCommand.options,
            ...command ? command.options : []
        ];
        const mriOptions = getMriOptions(cliOptions);
        let argsAfterDoubleDashes = [];
        const doubleDashesIndex = argv.indexOf('--');
        if (doubleDashesIndex > -1) {
            argsAfterDoubleDashes = argv.slice(doubleDashesIndex + 1);
            argv = argv.slice(0, doubleDashesIndex);
        }
        let parsed = index(argv, mriOptions);
        parsed = Object.keys(parsed).reduce((res, name)=>{
            return {
                ...res,
                [camelcaseOptionName(name)]: parsed[name]
            };
        }, {
            _: []
        });
        const args = parsed._;
        const options = {
            '--': argsAfterDoubleDashes
        };
        const ignoreDefault = command && command.config.ignoreOptionDefaultValue ? command.config.ignoreOptionDefaultValue : this.globalCommand.config.ignoreOptionDefaultValue;
        let transforms = Object.create(null);
        for (const cliOption of cliOptions){
            if (!ignoreDefault && cliOption.config.default !== undefined) {
                for (const name of cliOption.names){
                    options[name] = cliOption.config.default;
                }
            }
            if (Array.isArray(cliOption.config.type)) {
                if (transforms[cliOption.name] === undefined) {
                    transforms[cliOption.name] = Object.create(null);
                    transforms[cliOption.name]['shouldTransform'] = true;
                    transforms[cliOption.name]['transformFunction'] = cliOption.config.type[0];
                }
            }
        }
        for (const key of Object.keys(parsed)){
            if (key !== '_') {
                const keys = key.split('.');
                setDotProp(options, keys, parsed[key]);
                setByType(options, transforms);
            }
        }
        return {
            args,
            options
        };
    }
    runMatchedCommand() {
        const { args , options , matchedCommand: command  } = this;
        if (!command || !command.commandAction) return;
        command.checkUnknownOptions();
        command.checkOptionValue();
        command.checkRequiredArgs();
        const actionArgs = [];
        command.args.forEach((arg, index3)=>{
            if (arg.variadic) {
                actionArgs.push(args.slice(index3));
            } else {
                actionArgs.push(args[index3]);
            }
        });
        actionArgs.push(options);
        return command.commandAction.apply(this, actionArgs);
    }
}
const cac = (name = '')=>new CAC(name)
;
function makeCli(args) {
    if (!args.name) {
        args.name = "update-ros-pkg-versions";
    }
    if (!args.defaultBumpType) {
        args.defaultBumpType = "patch";
    }
    if (!args.version) {
        args.version = "1.0.0";
    }
    const cli3 = cac(args.name);
    cli3.help();
    cli3.version(args.version);
    cli3.command("bump", "Update package versions in a directory").option("-d, --directory <directory>", "Directory to update", {
        default: "."
    }).option("--skip-setup-py", "Skip updating setup.py", {
        default: false
    }).option("-t, --type <type>", "patch, minor, or major", {
        default: args.defaultBumpType
    }).option("--tag", "Commit and tag the new version", {
        default: false
    }).action(async (options)=>{
        const { directory , type , tag , skipSetupPy  } = options;
        await args.bumpFn(directory, type, skipSetupPy);
        if (tag) {
            await args.tagFn(directory, skipSetupPy);
        }
        console.log(`Done!`);
    });
    cli3.command("get", "Get package versions in a directory").option("-d, --directory <directory>", "Directory to update", {
        default: "."
    }).option("--skip-setup-py", "Skip updating setup.py", {
        default: false
    }).action(async (options)=>{
        const { directory , skipSetupPy  } = options;
        await args.getFn(directory, skipSetupPy);
    });
    cli3.command("set <version>", "Set package versions in a directory").option("-d, --directory <directory>", "Directory to update", {
        default: "."
    }).option("--skip-setup-py", "Skip updating setup.py", {
        default: false
    }).option("--tag", "Commit and tag the new version", {
        default: false
    }).action(async (version, options)=>{
        const { directory , tag , skipSetupPy  } = options;
        await args.setFn(directory, version, skipSetupPy);
        if (tag) {
            await args.tagFn(directory, skipSetupPy);
        }
        console.log(`Done!`);
    });
    cli3.command("tag", "Tag a package version").option("-d, --directory <directory>", "Directory to update", {
        default: "."
    }).option("--skip-setup-py", "Skip updating setup.py", {
        default: false
    }).action(async (options)=>{
        const { directory , skipSetupPy  } = options;
        await args.tagFn(directory, skipSetupPy);
        console.log(`Done!`);
    });
    return cli3;
}
function getPackageXmlVersion(text) {
    const regex = /<version>(.*)<\/version>/;
    return getVersionFromRegexMatch(text, regex);
}
function getSetupPyVersion(text) {
    const regex = /version='(.*)'/;
    return getVersionFromRegexMatch(text, regex);
}
function getVersionFromRegexMatch(text, regex) {
    const versionMatches = text.match(regex);
    if (!versionMatches) {
        throw new Error(`Could not find version in the following text:\n\n${text}`);
    }
    const version = versionMatches[1];
    return getVersionFromString(version);
}
function setPackageXmlVersion(text, version) {
    const regex = /(<version>)(.*)(<\/version>)/;
    return setVersionInText(text, regex, version);
}
function setSetupPyVersion(text, version) {
    const regex = /(version=')(.*)(')/;
    return setVersionInText(text, regex, version);
}
function setChangeLogVersion(text, version) {
    const regex = /Forthcoming\n-----------/;
    if (text.match(regex)) {
        const heading = `${getVersionString(version)} (${format3(new Date(), "yyyy-MM-dd")})`;
        const replaceText = heading + "\n" + "-".repeat(heading.length);
        return text.replace(regex, replaceText);
    } else {
        throw new Error(`Could not set version in the following text:\n\n${text}`);
    }
}
function setVersionInText(text, regex, version) {
    if (text.match(regex)) {
        return text.replace(regex, `$1${getVersionString(version)}$3`);
    } else {
        throw new Error(`Could not set version in the following text:\n\n${text}`);
    }
}
function getVersionFromString(text) {
    const versionNumbers = text.split(".").filter((a)=>a !== ""
    ).map(Number);
    if (versionNumbers.length !== 3) {
        throw new Error(`Version string "${text}" does not have three numbers separated by dots.`);
    }
    if (!versionNumbers.every(Number.isInteger)) {
        throw new Error(`Version string "${text}" contains non-numeric characters.`);
    }
    return {
        major: versionNumbers[0],
        minor: versionNumbers[1],
        patch: versionNumbers[2]
    };
}
function getVersionString(version) {
    return `${version.major}.${version.minor}.${version.patch}`;
}
function bumpVersion(version, bumpType) {
    switch(bumpType){
        case "major":
            return {
                major: version.major + 1,
                minor: 0,
                patch: 0
            };
        case "minor":
            return {
                major: version.major,
                minor: version.minor + 1,
                patch: 0
            };
        case "patch":
            return {
                major: version.major,
                minor: version.minor,
                patch: version.patch + 1
            };
    }
}
async function getPathsToFiles(path54, match) {
    const paths = [];
    for await (const entry of walk(path54, {
        match: match
    })){
        paths.push(entry.path);
    }
    return paths;
}
async function getFileVersion(path55) {
    const fileText = await Deno.readTextFile(path55);
    if (path55.endsWith("package.xml")) {
        return getPackageXmlVersion(fileText);
    } else if (path55.endsWith("setup.py")) {
        return getSetupPyVersion(fileText);
    } else if (path55.endsWith("CHANGELOG.rst")) {
        throw new Error(`Cannot get version from CHANGELOG.rst: ${path55}`);
    } else {
        throw new Error(`Unknown file type: ${path55}`);
    }
}
async function setFileVersion(path56, version) {
    const fileText = await Deno.readTextFile(path56);
    let newFileText;
    if (path56.endsWith("package.xml")) {
        newFileText = setPackageXmlVersion(fileText, version);
    } else if (path56.endsWith("setup.py")) {
        newFileText = setSetupPyVersion(fileText, version);
    } else if (path56.endsWith("CHANGELOG.rst")) {
        newFileText = setChangeLogVersion(fileText, version);
    } else {
        throw new Error(`Unknown file type: ${path56}`);
    }
    await Deno.writeTextFile(path56, newFileText);
}
async function bumpFiles(directory, bumpType, isSkipSetupPy = false) {
    const currentVersion = await getVersion(directory, isSkipSetupPy);
    const newVersion = bumpVersion(currentVersion, bumpType);
    for (const file of (await getFilePaths(directory, {
        isIncludeChangeLog: true,
        isSkipSetupPy: isSkipSetupPy
    }))){
        try {
            await setFileVersion(file, newVersion);
        } catch (error) {
            throw new Error(`Failed to set version for ${file}: ${error}`);
        }
    }
}
async function setFiles(directory, version, isSkipSetupPy = false) {
    for (const file of (await getFilePaths(directory, {
        isIncludeChangeLog: true,
        isSkipSetupPy: isSkipSetupPy
    }))){
        await setFileVersion(file, version);
    }
}
async function getVersion(directory, isSkipSetupPy = false) {
    const versionSet = new Set();
    for (const file of (await getFilePaths(directory, {
        isIncludeChangeLog: false,
        isSkipSetupPy: isSkipSetupPy
    }))){
        let version;
        try {
            version = await getFileVersion(file);
        } catch (error) {
            throw new Error(`Failed to get version for ${file}: ${error}`);
        }
        versionSet.add(getVersionString(version));
    }
    if (versionSet.size !== 1) {
        throw new Error(`Version is not consistent - got the following versions: ${[
            ...versionSet.keys()
        ].join(", ")}`);
    }
    return getVersionFromString(versionSet.values().next().value);
}
async function getFilePaths(directory, options) {
    const matches = [];
    if (!options.isSkipPackageXml) {
        matches.push(/package.xml$/);
    }
    if (!options.isSkipSetupPy) {
        matches.push(/setup.py$/);
    }
    if (options.isIncludeChangeLog) {
        matches.push(/CHANGELOG.rst$/);
    }
    return await getPathsToFiles(directory, matches);
}
async function commitAndTag(cwd, version) {
    const commitCmd = [
        "git",
        "commit",
        "-asm",
        version
    ];
    const tagCmd = [
        "git",
        "tag",
        version
    ];
    await runCommand({
        cwd,
        cmd: commitCmd,
        error: `Failed to commit ${version}`
    });
    await runCommand({
        cwd,
        cmd: tagCmd,
        error: `Failed to tag: ${version}`
    });
}
async function runCommand(args) {
    const p = Deno.run({
        cmd: args.cmd,
        cwd: args.cwd,
        stdout: "null"
    });
    const status = await p.status();
    if (!status.success) {
        throw new Error(args.error);
    }
}
const bumpFn = async (path57, bumpType, isSkipSetupPy)=>{
    await bumpFiles(path57, bumpType, isSkipSetupPy);
};
const setFn = async (path58, version, isSkipSetupPy)=>{
    await setFiles(path58, getVersionFromString(version), isSkipSetupPy);
};
const getFn = async (path59, isSkipSetupPy)=>{
    console.log(`Current Version: ${getVersionString(await getVersion(path59, isSkipSetupPy))}`);
};
const tagFn = async (path60, isSkipSetupPy)=>{
    const version = await getVersion(path60, isSkipSetupPy);
    await commitAndTag(path60, getVersionString(version));
};
const cli = makeCli({
    name: "update-ros-pkg-versions",
    defaultBumpType: "patch",
    version: "1.0.1",
    bumpFn,
    setFn,
    getFn,
    tagFn
});
cli.parse();
