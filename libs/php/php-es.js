import pako from '../zlib/pako-es.js';

var PHP = (function() {
    var _scriptDir = typeof document !== 'undefined' && document.currentScript ? document.currentScript.src : undefined;
    
    return (function(PHP) {
        PHP = PHP || {};
        var Module = typeof PHP !== "undefined" ? PHP : {};
        if (!Module.expectedDataFileDownloads) {
            Module.expectedDataFileDownloads = 0;
            Module.finishedDataFileDownloads = 0
        }
        Module.expectedDataFileDownloads++;


        var moduleOverrides = {};
        var key;
        for (key in Module) {
            if (Module.hasOwnProperty(key)) {
                moduleOverrides[key] = Module[key]
            }
        }
        var arguments_ = [];
        var thisProgram = "./this.program";
        var quit_ = function(status, toThrow) {
            throw toThrow
        };
        var ENVIRONMENT_IS_WEB = true;
        var ENVIRONMENT_IS_WORKER = false;
        var ENVIRONMENT_IS_NODE = false;
        var scriptDirectory = "";

        function locateFile(path) {
            if (Module["locateFile"]) {
                return Module["locateFile"](path, scriptDirectory)
            }
            return scriptDirectory + path
        }

        var read_, readAsync, readBinary, setWindowTitle;
        if (ENVIRONMENT_IS_WEB || ENVIRONMENT_IS_WORKER) {
            if (ENVIRONMENT_IS_WORKER) {
                scriptDirectory = self.location.href
            } else if (typeof(document)=='object' && document.currentScript) {
                scriptDirectory = document.currentScript.src
            }else if(
                typeof(import.meta)=='object' && 
                import.meta.url!==undefined && 
                import.meta.url!==''
            ){
                scriptDirectory=import.meta.url;
            }

            if (_scriptDir) {
                scriptDirectory = _scriptDir
            }
            if (scriptDirectory.indexOf("blob:") !== 0) {
                scriptDirectory = scriptDirectory.substr(0, scriptDirectory.lastIndexOf("/") + 1)
            } else {
                scriptDirectory = ""
            } {
                read_ = function shell_read(url) {
                    var xhr = new XMLHttpRequest;
                    xhr.open("GET", url, false);
                    xhr.send(null);
                    return xhr.responseText
                };
                if (ENVIRONMENT_IS_WORKER) {
                    readBinary = function readBinary(url) {
                        var xhr = new XMLHttpRequest;
                        xhr.open("GET", url, false);
                        xhr.responseType = "arraybuffer";
                        xhr.send(null);
                        return new Uint8Array(xhr.response)
                    }
                }
                readAsync = function readAsync(url, onload, onerror) {
                    var xhr = new XMLHttpRequest;
                    xhr.open("GET", url, true);
                    xhr.responseType = "arraybuffer";
                    xhr.onload = function xhr_onload() {
                        if (xhr.status == 200 || xhr.status == 0 && xhr.response) {
                            onload(xhr.response);
                            return
                        }
                        onerror()
                    };
                    xhr.onerror = onerror;
                    xhr.send(null)
                }
            }
            setWindowTitle = function(title) {
                document.title = title
            }
        } else {}


        (function() {
            var loadPackage = function(metadata) {

                var PACKAGE_PATH;
                if (typeof window === "object") {
                    PACKAGE_PATH = window["encodeURIComponent"](window.location.pathname.toString().substring(0, window.location.pathname.toString().lastIndexOf("/")) + "/")
                } else if (typeof location !== "undefined") {
                    PACKAGE_PATH = encodeURIComponent(location.pathname.toString().substring(0, location.pathname.toString().lastIndexOf("/")) + "/")
                } else {
                    throw "using preloaded data can only be done on a web page or in a web worker"
                }

                var PACKAGE_NAME = "out/php.data";
                var REMOTE_PACKAGE_BASE = "php.data";
                if (typeof Module["locateFilePackage"] === "function" && !Module["locateFile"]) {
                    Module["locateFile"] = Module["locateFilePackage"];
                    err("warning: you defined Module.locateFilePackage, that has been renamed to Module.locateFile (using your locateFilePackage for now)")
                }

                var REMOTE_PACKAGE_NAME = Module["locateFile"] ? Module["locateFile"](REMOTE_PACKAGE_BASE, "") : locateFile(REMOTE_PACKAGE_BASE);
                var REMOTE_PACKAGE_SIZE = metadata.remote_package_size;
                var PACKAGE_UUID = metadata.package_uuid;

                function fetchRemotePackage(packageName, packageSize, callback, errback) {
                    var xhr = new XMLHttpRequest;
                    xhr.open("GET", packageName, true);
                    xhr.responseType = "arraybuffer";
                    xhr.onprogress = function(event) {
                        var url = packageName;
                        var size = packageSize;
                        if (event.total) size = event.total;
                        if (event.loaded) {
                            if (!xhr.addedTotal) {
                                xhr.addedTotal = true;
                                if (!Module.dataFileDownloads) Module.dataFileDownloads = {};
                                Module.dataFileDownloads[url] = {
                                    loaded: event.loaded,
                                    total: size
                                }
                            } else {
                                Module.dataFileDownloads[url].loaded = event.loaded
                            }
                            var total = 0;
                            var loaded = 0;
                            var num = 0;
                            for (var download in Module.dataFileDownloads) {
                                var data = Module.dataFileDownloads[download];
                                total += data.total;
                                loaded += data.loaded;
                                num++
                            }
                            total = Math.ceil(total * Module.expectedDataFileDownloads / num);
                            if (Module["setStatus"]) Module["setStatus"]("Downloading data... (" + loaded + "/" + total + ")")
                        } else if (!Module.dataFileDownloads) {
                            if (Module["setStatus"]) Module["setStatus"]("Downloading data...")
                        }
                    };
                    xhr.onerror = function(event) {
                        throw new Error("NetworkError for: " + packageName)
                    };
                    xhr.onload = function(event) {
                        if (xhr.status == 200 || xhr.status == 304 || xhr.status == 206 || xhr.status == 0 && xhr.response) {
                            var packageData = xhr.response;
                            callback(packageData)
                        } else {
                            throw new Error(xhr.statusText + " : " + xhr.responseURL)
                        }
                    };
                    xhr.send(null)
                }

                function handleError(error) {
                    console.error("package error:", error)
                }

                var fetchedCallback = null;
                var fetched = Module["getPreloadedPackage"] ? Module["getPreloadedPackage"](REMOTE_PACKAGE_NAME, REMOTE_PACKAGE_SIZE) : null;
                if (!fetched) fetchRemotePackage(REMOTE_PACKAGE_NAME, REMOTE_PACKAGE_SIZE, function(data) {
                    if (fetchedCallback) {
                        fetchedCallback(data);
                        fetchedCallback = null
                    } else {
                        fetched = data
                    }
                }, handleError);

                function runWithFS() {
                    function assert(check, msg) {
                        if (!check) throw msg + (new Error).stack
                    }
                    Module["FS_createPath"]("/", "Zend", true, true);

                    function DataRequest(start, end, audio) {
                        this.start = start;
                        this.end = end;
                        this.audio = audio
                    }

                    DataRequest.prototype = {
                        requests: {},
                        open: function(mode, name) {
                            this.name = name;
                            this.requests[name] = this;
                            Module["addRunDependency"]("fp " + this.name)
                        },
                        send: function() {},
                        onload: function() {
                            var byteArray = this.byteArray.subarray(this.start, this.end);
                            this.finish(byteArray)
                        },
                        finish: function(byteArray) {
                            var that = this;
                            Module["FS_createDataFile"](this.name, null, byteArray, true, true, true);
                            Module["removeRunDependency"]("fp " + that.name);
                            this.requests[this.name] = null
                        }
                    };

                    var files = metadata.files;
                    for (var i = 0; i < files.length; ++i) {
                        new DataRequest(files[i].start, files[i].end, files[i].audio).open("GET", files[i].filename)
                    }

                    function processPackageData(arrayBuffer) {
                        Module.finishedDataFileDownloads++;
                        assert(arrayBuffer, "Loading data file failed.");
                        assert(arrayBuffer instanceof ArrayBuffer, "bad input to processPackageData");
                        var byteArray = new Uint8Array(arrayBuffer);
                        var ptr = Module["getMemory"](byteArray.length);
                        Module["HEAPU8"].set(byteArray, ptr);
                        DataRequest.prototype.byteArray = Module["HEAPU8"].subarray(ptr, ptr + byteArray.length);
                        var files = metadata.files;
                        for (var i = 0; i < files.length; ++i) {
                            DataRequest.prototype.requests[files[i].filename].onload()
                        }
                        Module["removeRunDependency"]("datafile_out/php.data")
                    }

                    Module["addRunDependency"]("datafile_out/php.data");
                    if (!Module.preloadResults) Module.preloadResults = {};
                    Module.preloadResults[PACKAGE_NAME] = {
                        fromCache: false
                    };

                    if (fetched) {
                        processPackageData(fetched);
                        fetched = null
                    } else {
                        fetchedCallback = processPackageData
                    }
                    
                }

                if (Module["calledRun"]) {
                    runWithFS()
                } else {
                    if (!Module["preRun"]) Module["preRun"] = [];
                    Module["preRun"].push(runWithFS)
                }

            };
            loadPackage({
                "files": [{
                    "start": 0,
                    "audio": 0,
                    "end": 7634,
                    "filename": "/Zend/bench.php"
                }],
                "remote_package_size": 7634,
                "package_uuid": "3c51cf13-3925-466e-b484-7964c8526502"
            })
        })();

        var out = Module["print"] || console.log.bind(console);
        var err = Module["printErr"] || console.warn.bind(console);
        for (key in moduleOverrides) {
            if (moduleOverrides.hasOwnProperty(key)) {
                Module[key] = moduleOverrides[key]
            }
        }
        moduleOverrides = null;
        if (Module["arguments"]) arguments_ = Module["arguments"];
        if (Module["thisProgram"]) thisProgram = Module["thisProgram"];
        if (Module["quit"]) quit_ = Module["quit"];

        function dynamicAlloc(size) {
            var ret = HEAP32[DYNAMICTOP_PTR >> 2];
            var end = ret + size + 15 & -16;
            if (end > _emscripten_get_heap_size()) {
                abort()
            }
            HEAP32[DYNAMICTOP_PTR >> 2] = end;
            return ret
        }

        function getNativeTypeSize(type) {
            switch (type) {
                case "i1":
                case "i8":
                    return 1;
                case "i16":
                    return 2;
                case "i32":
                    return 4;
                case "i64":
                    return 8;
                case "float":
                    return 4;
                case "double":
                    return 8;
                default:
                    {
                        if (type[type.length - 1] === "*") {
                            return 4
                        } else if (type[0] === "i") {
                            var bits = parseInt(type.substr(1));
                            assert(bits % 8 === 0, "getNativeTypeSize invalid bits " + bits + ", type " + type);
                            return bits / 8
                        } else {
                            return 0
                        }
                    }
            }
        }
        var asm2wasmImports = {
            "f64-rem": function(x, y) {
                return x % y
            },
            "debugger": function() {}
        };
        var functionPointers = new Array(0);
        var tempRet0 = 0;
        var setTempRet0 = function(value) {
            tempRet0 = value
        };
        var getTempRet0 = function() {
            return tempRet0
        };
        var wasmBinary;
        if (Module["wasmBinary"]) wasmBinary = Module["wasmBinary"];
        var noExitRuntime;
        if (Module["noExitRuntime"]) noExitRuntime = Module["noExitRuntime"];
        if (typeof WebAssembly !== "object") {
            err("no native wasm support detected")
        }

        function setValue(ptr, value, type, noSafe) {
            type = type || "i8";
            if (type.charAt(type.length - 1) === "*") type = "i32";
            switch (type) {
                case "i1":
                    HEAP8[ptr >> 0] = value;
                    break;
                case "i8":
                    HEAP8[ptr >> 0] = value;
                    break;
                case "i16":
                    HEAP16[ptr >> 1] = value;
                    break;
                case "i32":
                    HEAP32[ptr >> 2] = value;
                    break;
                case "i64":
                    tempI64 = [value >>> 0, (tempDouble = value, +Math_abs(tempDouble) >= 1 ? tempDouble > 0 ? (Math_min(+Math_floor(tempDouble / 4294967296), 4294967295) | 0) >>> 0 : ~~+Math_ceil((tempDouble - +(~~tempDouble >>> 0)) / 4294967296) >>> 0 : 0)], HEAP32[ptr >> 2] = tempI64[0], HEAP32[ptr + 4 >> 2] = tempI64[1];
                    break;
                case "float":
                    HEAPF32[ptr >> 2] = value;
                    break;
                case "double":
                    HEAPF64[ptr >> 3] = value;
                    break;
                default:
                    abort("invalid type for setValue: " + type)
            }
        }
        var wasmMemory;
        var wasmTable = new WebAssembly.Table({
            "initial": 5295,
            "maximum": 5295,
            "element": "anyfunc"
        });
        var ABORT = false;
        var EXITSTATUS = 0;

        function assert(condition, text) {
            if (!condition) {
                abort("Assertion failed: " + text)
            }
        }

        function getCFunc(ident) {
            var func = Module["_" + ident];
            assert(func, "Cannot call unknown function " + ident + ", make sure it is exported");
            return func
        }

        function ccall(ident, returnType, argTypes, args, opts) {
            var toC = {
                "string": function(str) {
                    var ret = 0;
                    if (str !== null && str !== undefined && str !== 0) {
                        var len = (str.length << 2) + 1;
                        ret = stackAlloc(len);
                        stringToUTF8(str, ret, len)
                    }
                    return ret
                },
                "array": function(arr) {
                    var ret = stackAlloc(arr.length);
                    writeArrayToMemory(arr, ret);
                    return ret
                }
            };

            function convertReturnValue(ret) {
                if (returnType === "string") return UTF8ToString(ret);
                if (returnType === "boolean") return Boolean(ret);
                return ret
            }
            var func = getCFunc(ident);
            var cArgs = [];
            var stack = 0;
            if (args) {
                for (var i = 0; i < args.length; i++) {
                    var converter = toC[argTypes[i]];
                    if (converter) {
                        if (stack === 0) stack = stackSave();
                        cArgs[i] = converter(args[i])
                    } else {
                        cArgs[i] = args[i]
                    }
                }
            }
            var ret = func.apply(null, cArgs);
            ret = convertReturnValue(ret);
            if (stack !== 0) stackRestore(stack);
            return ret
        }
        var ALLOC_NORMAL = 0;
        var ALLOC_STACK = 1;
        var ALLOC_NONE = 3;

        function allocate(slab, types, allocator, ptr) {
            var zeroinit, size;
            if (typeof slab === "number") {
                zeroinit = true;
                size = slab
            } else {
                zeroinit = false;
                size = slab.length
            }
            var singleType = typeof types === "string" ? types : null;
            var ret;
            if (allocator == ALLOC_NONE) {
                ret = ptr
            } else {
                ret = [_malloc, stackAlloc, dynamicAlloc][allocator](Math.max(size, singleType ? 1 : types.length))
            }
            if (zeroinit) {
                var stop;
                ptr = ret;
                assert((ret & 3) == 0);
                stop = ret + (size & ~3);
                for (; ptr < stop; ptr += 4) {
                    HEAP32[ptr >> 2] = 0
                }
                stop = ret + size;
                while (ptr < stop) {
                    HEAP8[ptr++ >> 0] = 0
                }
                return ret
            }
            if (singleType === "i8") {
                if (slab.subarray || slab.slice) {
                    HEAPU8.set(slab, ret)
                } else {
                    HEAPU8.set(new Uint8Array(slab), ret)
                }
                return ret
            }
            var i = 0,
                type, typeSize, previousType;
            while (i < size) {
                var curr = slab[i];
                type = singleType || types[i];
                if (type === 0) {
                    i++;
                    continue
                }
                if (type == "i64") type = "i32";
                setValue(ret + i, curr, type);
                if (previousType !== type) {
                    typeSize = getNativeTypeSize(type);
                    previousType = type
                }
                i += typeSize
            }
            return ret
        }

        function getMemory(size) {
            if (!runtimeInitialized) return dynamicAlloc(size);
            return _malloc(size)
        }
        var UTF8Decoder = typeof TextDecoder !== "undefined" ? new TextDecoder("utf8") : undefined;

        function UTF8ArrayToString(u8Array, idx, maxBytesToRead) {
            var endIdx = idx + maxBytesToRead;
            var endPtr = idx;
            while (u8Array[endPtr] && !(endPtr >= endIdx)) ++endPtr;
            if (endPtr - idx > 16 && u8Array.subarray && UTF8Decoder) {
                return UTF8Decoder.decode(u8Array.subarray(idx, endPtr))
            } else {
                var str = "";
                while (idx < endPtr) {
                    var u0 = u8Array[idx++];
                    if (!(u0 & 128)) {
                        str += String.fromCharCode(u0);
                        continue
                    }
                    var u1 = u8Array[idx++] & 63;
                    if ((u0 & 224) == 192) {
                        str += String.fromCharCode((u0 & 31) << 6 | u1);
                        continue
                    }
                    var u2 = u8Array[idx++] & 63;
                    if ((u0 & 240) == 224) {
                        u0 = (u0 & 15) << 12 | u1 << 6 | u2
                    } else {
                        u0 = (u0 & 7) << 18 | u1 << 12 | u2 << 6 | u8Array[idx++] & 63
                    }
                    if (u0 < 65536) {
                        str += String.fromCharCode(u0)
                    } else {
                        var ch = u0 - 65536;
                        str += String.fromCharCode(55296 | ch >> 10, 56320 | ch & 1023)
                    }
                }
            }
            return str
        }

        function UTF8ToString(ptr, maxBytesToRead) {
            return ptr ? UTF8ArrayToString(HEAPU8, ptr, maxBytesToRead) : ""
        }

        function stringToUTF8Array(str, outU8Array, outIdx, maxBytesToWrite) {
            if (!(maxBytesToWrite > 0)) return 0;
            var startIdx = outIdx;
            var endIdx = outIdx + maxBytesToWrite - 1;
            for (var i = 0; i < str.length; ++i) {
                var u = str.charCodeAt(i);
                if (u >= 55296 && u <= 57343) {
                    var u1 = str.charCodeAt(++i);
                    u = 65536 + ((u & 1023) << 10) | u1 & 1023
                }
                if (u <= 127) {
                    if (outIdx >= endIdx) break;
                    outU8Array[outIdx++] = u
                } else if (u <= 2047) {
                    if (outIdx + 1 >= endIdx) break;
                    outU8Array[outIdx++] = 192 | u >> 6;
                    outU8Array[outIdx++] = 128 | u & 63
                } else if (u <= 65535) {
                    if (outIdx + 2 >= endIdx) break;
                    outU8Array[outIdx++] = 224 | u >> 12;
                    outU8Array[outIdx++] = 128 | u >> 6 & 63;
                    outU8Array[outIdx++] = 128 | u & 63
                } else {
                    if (outIdx + 3 >= endIdx) break;
                    outU8Array[outIdx++] = 240 | u >> 18;
                    outU8Array[outIdx++] = 128 | u >> 12 & 63;
                    outU8Array[outIdx++] = 128 | u >> 6 & 63;
                    outU8Array[outIdx++] = 128 | u & 63
                }
            }
            outU8Array[outIdx] = 0;
            return outIdx - startIdx
        }

        function stringToUTF8(str, outPtr, maxBytesToWrite) {
            return stringToUTF8Array(str, HEAPU8, outPtr, maxBytesToWrite)
        }

        function lengthBytesUTF8(str) {
            var len = 0;
            for (var i = 0; i < str.length; ++i) {
                var u = str.charCodeAt(i);
                if (u >= 55296 && u <= 57343) u = 65536 + ((u & 1023) << 10) | str.charCodeAt(++i) & 1023;
                if (u <= 127) ++len;
                else if (u <= 2047) len += 2;
                else if (u <= 65535) len += 3;
                else len += 4
            }
            return len
        }
        var UTF16Decoder = typeof TextDecoder !== "undefined" ? new TextDecoder("utf-16le") : undefined;

        function allocateUTF8(str) {
            var size = lengthBytesUTF8(str) + 1;
            var ret = _malloc(size);
            if (ret) stringToUTF8Array(str, HEAP8, ret, size);
            return ret
        }

        function writeArrayToMemory(array, buffer) {
            HEAP8.set(array, buffer)
        }

        function writeAsciiToMemory(str, buffer, dontAddNull) {
            for (var i = 0; i < str.length; ++i) {
                HEAP8[buffer++ >> 0] = str.charCodeAt(i)
            }
            if (!dontAddNull) HEAP8[buffer >> 0] = 0
        }
        var PAGE_SIZE = 16384;
        var WASM_PAGE_SIZE = 65536;
        var buffer, HEAP8, HEAPU8, HEAP16, HEAPU16, HEAP32, HEAPU32, HEAPF32, HEAPF64;

        function updateGlobalBufferAndViews(buf) {
            buffer = buf;
            Module["HEAP8"] = HEAP8 = new Int8Array(buf);
            Module["HEAP16"] = HEAP16 = new Int16Array(buf);
            Module["HEAP32"] = HEAP32 = new Int32Array(buf);
            Module["HEAPU8"] = HEAPU8 = new Uint8Array(buf);
            Module["HEAPU16"] = HEAPU16 = new Uint16Array(buf);
            Module["HEAPU32"] = HEAPU32 = new Uint32Array(buf);
            Module["HEAPF32"] = HEAPF32 = new Float32Array(buf);
            Module["HEAPF64"] = HEAPF64 = new Float64Array(buf)
        }
        var DYNAMIC_BASE = 7449232,
            DYNAMICTOP_PTR = 2206160;
        var INITIAL_TOTAL_MEMORY = Module["TOTAL_MEMORY"] || 134217728;
        if (Module["wasmMemory"]) {
            wasmMemory = Module["wasmMemory"]
        } else {
            wasmMemory = new WebAssembly.Memory({
                "initial": INITIAL_TOTAL_MEMORY / WASM_PAGE_SIZE,
                "maximum": INITIAL_TOTAL_MEMORY / WASM_PAGE_SIZE
            })
        }
        if (wasmMemory) {
            buffer = wasmMemory.buffer
        }
        INITIAL_TOTAL_MEMORY = buffer.byteLength;
        updateGlobalBufferAndViews(buffer);
        HEAP32[DYNAMICTOP_PTR >> 2] = DYNAMIC_BASE;

        function callRuntimeCallbacks(callbacks) {
            while (callbacks.length > 0) {
                var callback = callbacks.shift();
                if (typeof callback == "function") {
                    callback();
                    continue
                }
                var func = callback.func;
                if (typeof func === "number") {
                    if (callback.arg === undefined) {
                        Module["dynCall_v"](func)
                    } else {
                        Module["dynCall_vi"](func, callback.arg)
                    }
                } else {
                    func(callback.arg === undefined ? null : callback.arg)
                }
            }
        }
        var __ATPRERUN__ = [];
        var __ATINIT__ = [];
        var __ATMAIN__ = [];
        var __ATPOSTRUN__ = [];
        var runtimeInitialized = false;
        var runtimeExited = false;

        function preRun() {
            if (Module["preRun"]) {
                if (typeof Module["preRun"] == "function") Module["preRun"] = [Module["preRun"]];
                while (Module["preRun"].length) {
                    addOnPreRun(Module["preRun"].shift())
                }
            }
            callRuntimeCallbacks(__ATPRERUN__)
        }

        function initRuntime() {
            runtimeInitialized = true;
            if (!Module["noFSInit"] && !FS.init.initialized) FS.init();
            TTY.init();
            SOCKFS.root = FS.mount(SOCKFS, {}, null);
            PIPEFS.root = FS.mount(PIPEFS, {}, null);
            callRuntimeCallbacks(__ATINIT__)
        }

        function preMain() {
            FS.ignorePermissions = false;
            callRuntimeCallbacks(__ATMAIN__)
        }

        function exitRuntime() {
            runtimeExited = true
        }

        function postRun() {
            if (Module["postRun"]) {
                if (typeof Module["postRun"] == "function") Module["postRun"] = [Module["postRun"]];
                while (Module["postRun"].length) {
                    addOnPostRun(Module["postRun"].shift())
                }
            }
            callRuntimeCallbacks(__ATPOSTRUN__)
        }

        function addOnPreRun(cb) {
            __ATPRERUN__.unshift(cb)
        }

        function addOnPostRun(cb) {
            __ATPOSTRUN__.unshift(cb)
        }
        var Math_abs = Math.abs;
        var Math_ceil = Math.ceil;
        var Math_floor = Math.floor;
        var Math_min = Math.min;
        var runDependencies = 0;
        var runDependencyWatcher = null;
        var dependenciesFulfilled = null;

        function getUniqueRunDependency(id) {
            return id
        }

        function addRunDependency(id) {
            runDependencies++;
            if (Module["monitorRunDependencies"]) {
                Module["monitorRunDependencies"](runDependencies)
            }
        }

        function removeRunDependency(id) {
            runDependencies--;
            if (Module["monitorRunDependencies"]) {
                Module["monitorRunDependencies"](runDependencies)
            }
            if (runDependencies == 0) {
                if (runDependencyWatcher !== null) {
                    clearInterval(runDependencyWatcher);
                    runDependencyWatcher = null
                }
                if (dependenciesFulfilled) {
                    var callback = dependenciesFulfilled;
                    dependenciesFulfilled = null;
                    callback()
                }
            }
        }
        Module["preloadedImages"] = {};
        Module["preloadedAudios"] = {};

        function abort(what) {
            if (Module["onAbort"]) {
                Module["onAbort"](what)
            }
            what += "";
            out(what);
            err(what);
            ABORT = true;
            EXITSTATUS = 1;
            what = "abort(" + what + "). Build with -s ASSERTIONS=1 for more info.";
            throw new WebAssembly.RuntimeError(what)
        }
        var dataURIPrefix = "data:application/octet-stream;base64,";

        function isDataURI(filename) {
            return String.prototype.startsWith ? filename.startsWith(dataURIPrefix) : filename.indexOf(dataURIPrefix) === 0
        }
        var wasmBinaryFile = "php.wasm.tar.z";
        if (!isDataURI(wasmBinaryFile)) {
            wasmBinaryFile = locateFile(wasmBinaryFile)
        }

        function getBinary() {
            try {
                if (wasmBinary) {
                    return new Uint8Array(wasmBinary)
                }
                if (readBinary) {
                    return readBinary(wasmBinaryFile)
                } else {
                    throw "both async and sync fetching of the wasm failed"
                }
            } catch (err) {
                abort(err)
            }
        }

        function getBinaryPromise() {
            if (!wasmBinary && (ENVIRONMENT_IS_WEB || ENVIRONMENT_IS_WORKER) && typeof fetch === "function") {
                return fetch(wasmBinaryFile, {
                    credentials: "same-origin"
                }).then(function(response) {
                    if (!response["ok"]) {
                        throw "failed to load wasm binary file at '" + wasmBinaryFile + "'"
                    }
                    return response.arrayBuffer()
                }).catch(function() {
                    return getBinary()
                })
            }
            return new Promise(function(resolve, reject) {
                resolve(getBinary())
            })
        }

        function createWasm() {
            var info = {
                "env": asmLibraryArg,
                "wasi_unstable": asmLibraryArg,
                "global": {
                    "NaN": NaN,
                    Infinity: Infinity
                },
                "global.Math": Math,
                "asm2wasm": asm2wasmImports
            };

            function receiveInstance(instance, module) {
                var exports = instance.exports;
                Module["asm"] = exports;
                removeRunDependency("wasm-instantiate")
            }
            addRunDependency("wasm-instantiate");

            function receiveInstantiatedSource(output) {
                receiveInstance(output["instance"])
            }

            function instantiateArrayBuffer(receiver) {
                return getBinaryPromise().then(function(binary) {
                    return WebAssembly.instantiate(pako.inflate(binary), info);
                }).then(receiver, function(reason) {
                    err("failed to asynchronously prepare wasm: " + reason);
                    abort(reason)
                })
            }

            function instantiateAsync() {
                // if (!wasmBinary && typeof WebAssembly.instantiateStreaming === "function" && !isDataURI(wasmBinaryFile) && typeof fetch === "function") {
                //     fetch(wasmBinaryFile, {
                //         credentials: "same-origin"
                //     }).then(function(response) {
                //         var result = WebAssembly.instantiateStreaming(response, info);
                //         return result.then(receiveInstantiatedSource, function(reason) {
                //             err("wasm streaming compile failed: " + reason);
                //             err("falling back to ArrayBuffer instantiation");
                //             instantiateArrayBuffer(receiveInstantiatedSource)
                //         })
                //     })
                // } else {
                //     return instantiateArrayBuffer(receiveInstantiatedSource)
                // }
                return instantiateArrayBuffer(receiveInstantiatedSource);
            }
            if (Module["instantiateWasm"]) {
                try {
                    var exports = Module["instantiateWasm"](info, receiveInstance);
                    return exports
                } catch (e) {
                    err("Module.instantiateWasm callback failed with error: " + e);
                    return false
                }
            }
            instantiateAsync();
            return {}
        }
        Module["asm"] = createWasm;
        var tempDouble;
        var tempI64;
        __ATINIT__.push({
            func: function() {
                ___emscripten_environ_constructor()
            }
        });

        function demangle(func) {
            return func
        }

        function demangleAll(text) {
            var regex = /\b__Z[\w\d_]+/g;
            return text.replace(regex, function(x) {
                var y = demangle(x);
                return x === y ? x : y + " [" + x + "]"
            })
        }

        function jsStackTrace() {
            var err = new Error;
            if (!err.stack) {
                try {
                    throw new Error(0)
                } catch (e) {
                    err = e
                }
                if (!err.stack) {
                    return "(no stack trace available)"
                }
            }
            return err.stack.toString()
        }

        function stackTrace() {
            var js = jsStackTrace();
            if (Module["extraStackTrace"]) js += "\n" + Module["extraStackTrace"]();
            return demangleAll(js)
        }

        function ___assert_fail(condition, filename, line, func) {
            abort("Assertion failed: " + UTF8ToString(condition) + ", at: " + [filename ? UTF8ToString(filename) : "unknown filename", line, func ? UTF8ToString(func) : "unknown function"])
        }
        var ENV = {};

        function ___buildEnvironment(environ) {
            var MAX_ENV_VALUES = 64;
            var TOTAL_ENV_SIZE = 1024;
            var poolPtr;
            var envPtr;
            if (!___buildEnvironment.called) {
                ___buildEnvironment.called = true;
                ENV["USER"] = "web_user";
                ENV["LOGNAME"] = "web_user";
                ENV["PATH"] = "/";
                ENV["PWD"] = "/";
                ENV["HOME"] = "/home/web_user";
                ENV["LANG"] = (typeof navigator === "object" && navigator.languages && navigator.languages[0] || "C").replace("-", "_") + ".UTF-8";
                ENV["_"] = thisProgram;
                poolPtr = getMemory(TOTAL_ENV_SIZE);
                envPtr = getMemory(MAX_ENV_VALUES * 4);
                HEAP32[envPtr >> 2] = poolPtr;
                HEAP32[environ >> 2] = envPtr
            } else {
                envPtr = HEAP32[environ >> 2];
                poolPtr = HEAP32[envPtr >> 2]
            }
            var strings = [];
            var totalSize = 0;
            for (var key in ENV) {
                if (typeof ENV[key] === "string") {
                    var line = key + "=" + ENV[key];
                    strings.push(line);
                    totalSize += line.length
                }
            }
            if (totalSize > TOTAL_ENV_SIZE) {
                throw new Error("Environment size exceeded TOTAL_ENV_SIZE!")
            }
            var ptrSize = 4;
            for (var i = 0; i < strings.length; i++) {
                var line = strings[i];
                writeAsciiToMemory(line, poolPtr);
                HEAP32[envPtr + i * ptrSize >> 2] = poolPtr;
                poolPtr += line.length + 1
            }
            HEAP32[envPtr + strings.length * ptrSize >> 2] = 0
        }

        function _emscripten_get_now() {
            abort()
        }

        function _emscripten_get_now_is_monotonic() {
            return 0 || typeof performance === "object" && performance && typeof performance["now"] === "function"
        }

        function ___setErrNo(value) {
            if (Module["___errno_location"]) HEAP32[Module["___errno_location"]() >> 2] = value;
            return value
        }

        function _clock_gettime(clk_id, tp) {
            var now;
            if (clk_id === 0) {
                now = Date.now()
            } else if (clk_id === 1 && _emscripten_get_now_is_monotonic()) {
                now = _emscripten_get_now()
            } else {
                ___setErrNo(28);
                return -1
            }
            HEAP32[tp >> 2] = now / 1e3 | 0;
            HEAP32[tp + 4 >> 2] = now % 1e3 * 1e3 * 1e3 | 0;
            return 0
        }

        function ___clock_gettime(a0, a1) {
            return _clock_gettime(a0, a1)
        }

        function ___lock() {}

        function ___map_file(pathname, size) {
            ___setErrNo(63);
            return -1
        }
        var PATH = {
            splitPath: function(filename) {
                var splitPathRe = /^(\/?|)([\s\S]*?)((?:\.{1,2}|[^\/]+?|)(\.[^.\/]*|))(?:[\/]*)$/;
                return splitPathRe.exec(filename).slice(1)
            },
            normalizeArray: function(parts, allowAboveRoot) {
                var up = 0;
                for (var i = parts.length - 1; i >= 0; i--) {
                    var last = parts[i];
                    if (last === ".") {
                        parts.splice(i, 1)
                    } else if (last === "..") {
                        parts.splice(i, 1);
                        up++
                    } else if (up) {
                        parts.splice(i, 1);
                        up--
                    }
                }
                if (allowAboveRoot) {
                    for (; up; up--) {
                        parts.unshift("..")
                    }
                }
                return parts
            },
            normalize: function(path) {
                var isAbsolute = path.charAt(0) === "/",
                    trailingSlash = path.substr(-1) === "/";
                path = PATH.normalizeArray(path.split("/").filter(function(p) {
                    return !!p
                }), !isAbsolute).join("/");
                if (!path && !isAbsolute) {
                    path = "."
                }
                if (path && trailingSlash) {
                    path += "/"
                }
                return (isAbsolute ? "/" : "") + path
            },
            dirname: function(path) {
                var result = PATH.splitPath(path),
                    root = result[0],
                    dir = result[1];
                if (!root && !dir) {
                    return "."
                }
                if (dir) {
                    dir = dir.substr(0, dir.length - 1)
                }
                return root + dir
            },
            basename: function(path) {
                if (path === "/") return "/";
                var lastSlash = path.lastIndexOf("/");
                if (lastSlash === -1) return path;
                return path.substr(lastSlash + 1)
            },
            extname: function(path) {
                return PATH.splitPath(path)[3]
            },
            join: function() {
                var paths = Array.prototype.slice.call(arguments, 0);
                return PATH.normalize(paths.join("/"))
            },
            join2: function(l, r) {
                return PATH.normalize(l + "/" + r)
            }
        };
        var PATH_FS = {
            resolve: function() {
                var resolvedPath = "",
                    resolvedAbsolute = false;
                for (var i = arguments.length - 1; i >= -1 && !resolvedAbsolute; i--) {
                    var path = i >= 0 ? arguments[i] : FS.cwd();
                    if (typeof path !== "string") {
                        throw new TypeError("Arguments to path.resolve must be strings")
                    } else if (!path) {
                        return ""
                    }
                    resolvedPath = path + "/" + resolvedPath;
                    resolvedAbsolute = path.charAt(0) === "/"
                }
                resolvedPath = PATH.normalizeArray(resolvedPath.split("/").filter(function(p) {
                    return !!p
                }), !resolvedAbsolute).join("/");
                return (resolvedAbsolute ? "/" : "") + resolvedPath || "."
            },
            relative: function(from, to) {
                from = PATH_FS.resolve(from).substr(1);
                to = PATH_FS.resolve(to).substr(1);

                function trim(arr) {
                    var start = 0;
                    for (; start < arr.length; start++) {
                        if (arr[start] !== "") break
                    }
                    var end = arr.length - 1;
                    for (; end >= 0; end--) {
                        if (arr[end] !== "") break
                    }
                    if (start > end) return [];
                    return arr.slice(start, end - start + 1)
                }
                var fromParts = trim(from.split("/"));
                var toParts = trim(to.split("/"));
                var length = Math.min(fromParts.length, toParts.length);
                var samePartsLength = length;
                for (var i = 0; i < length; i++) {
                    if (fromParts[i] !== toParts[i]) {
                        samePartsLength = i;
                        break
                    }
                }
                var outputParts = [];
                for (var i = samePartsLength; i < fromParts.length; i++) {
                    outputParts.push("..")
                }
                outputParts = outputParts.concat(toParts.slice(samePartsLength));
                return outputParts.join("/")
            }
        };
        var TTY = {
            ttys: [],
            init: function() {},
            shutdown: function() {},
            register: function(dev, ops) {
                TTY.ttys[dev] = {
                    input: [],
                    output: [],
                    ops: ops
                };
                FS.registerDevice(dev, TTY.stream_ops)
            },
            stream_ops: {
                open: function(stream) {
                    var tty = TTY.ttys[stream.node.rdev];
                    if (!tty) {
                        throw new FS.ErrnoError(43)
                    }
                    stream.tty = tty;
                    stream.seekable = false
                },
                close: function(stream) {
                    stream.tty.ops.flush(stream.tty)
                },
                flush: function(stream) {
                    stream.tty.ops.flush(stream.tty)
                },
                read: function(stream, buffer, offset, length, pos) {
                    if (!stream.tty || !stream.tty.ops.get_char) {
                        throw new FS.ErrnoError(60)
                    }
                    var bytesRead = 0;
                    for (var i = 0; i < length; i++) {
                        var result;
                        try {
                            result = stream.tty.ops.get_char(stream.tty)
                        } catch (e) {
                            throw new FS.ErrnoError(29)
                        }
                        if (result === undefined && bytesRead === 0) {
                            throw new FS.ErrnoError(6)
                        }
                        if (result === null || result === undefined) break;
                        bytesRead++;
                        buffer[offset + i] = result
                    }
                    if (bytesRead) {
                        stream.node.timestamp = Date.now()
                    }
                    return bytesRead
                },
                write: function(stream, buffer, offset, length, pos) {
                    if (!stream.tty || !stream.tty.ops.put_char) {
                        throw new FS.ErrnoError(60)
                    }
                    try {
                        for (var i = 0; i < length; i++) {
                            stream.tty.ops.put_char(stream.tty, buffer[offset + i])
                        }
                    } catch (e) {
                        throw new FS.ErrnoError(29)
                    }
                    if (length) {
                        stream.node.timestamp = Date.now()
                    }
                    return i
                }
            },
            default_tty_ops: {
                get_char: function(tty) {
                    if (!tty.input.length) {
                        var result = null;
                        if (typeof window != "undefined" && typeof window.prompt == "function") {
                            result = window.prompt("Input: ");
                            if (result !== null) {
                                result += "\n"
                            }
                        } else if (typeof readline == "function") {
                            result = readline();
                            if (result !== null) {
                                result += "\n"
                            }
                        }
                        if (!result) {
                            return null
                        }
                        tty.input = intArrayFromString(result, true)
                    }
                    return tty.input.shift()
                },
                put_char: function(tty, val) {
                    if (val === null || val === 10) {
                        out(UTF8ArrayToString(tty.output, 0));
                        tty.output = []
                    } else {
                        if (val != 0) tty.output.push(val)
                    }
                },
                flush: function(tty) {
                    if (tty.output && tty.output.length > 0) {
                        out(UTF8ArrayToString(tty.output, 0));
                        tty.output = []
                    }
                }
            },
            default_tty1_ops: {
                put_char: function(tty, val) {
                    if (val === null || val === 10) {
                        err(UTF8ArrayToString(tty.output, 0));
                        tty.output = []
                    } else {
                        if (val != 0) tty.output.push(val)
                    }
                },
                flush: function(tty) {
                    if (tty.output && tty.output.length > 0) {
                        err(UTF8ArrayToString(tty.output, 0));
                        tty.output = []
                    }
                }
            }
        };
        var MEMFS = {
            ops_table: null,
            mount: function(mount) {
                return MEMFS.createNode(null, "/", 16384 | 511, 0)
            },
            createNode: function(parent, name, mode, dev) {
                if (FS.isBlkdev(mode) || FS.isFIFO(mode)) {
                    throw new FS.ErrnoError(63)
                }
                if (!MEMFS.ops_table) {
                    MEMFS.ops_table = {
                        dir: {
                            node: {
                                getattr: MEMFS.node_ops.getattr,
                                setattr: MEMFS.node_ops.setattr,
                                lookup: MEMFS.node_ops.lookup,
                                mknod: MEMFS.node_ops.mknod,
                                rename: MEMFS.node_ops.rename,
                                unlink: MEMFS.node_ops.unlink,
                                rmdir: MEMFS.node_ops.rmdir,
                                readdir: MEMFS.node_ops.readdir,
                                symlink: MEMFS.node_ops.symlink
                            },
                            stream: {
                                llseek: MEMFS.stream_ops.llseek
                            }
                        },
                        file: {
                            node: {
                                getattr: MEMFS.node_ops.getattr,
                                setattr: MEMFS.node_ops.setattr
                            },
                            stream: {
                                llseek: MEMFS.stream_ops.llseek,
                                read: MEMFS.stream_ops.read,
                                write: MEMFS.stream_ops.write,
                                allocate: MEMFS.stream_ops.allocate,
                                mmap: MEMFS.stream_ops.mmap,
                                msync: MEMFS.stream_ops.msync
                            }
                        },
                        link: {
                            node: {
                                getattr: MEMFS.node_ops.getattr,
                                setattr: MEMFS.node_ops.setattr,
                                readlink: MEMFS.node_ops.readlink
                            },
                            stream: {}
                        },
                        chrdev: {
                            node: {
                                getattr: MEMFS.node_ops.getattr,
                                setattr: MEMFS.node_ops.setattr
                            },
                            stream: FS.chrdev_stream_ops
                        }
                    }
                }
                var node = FS.createNode(parent, name, mode, dev);
                if (FS.isDir(node.mode)) {
                    node.node_ops = MEMFS.ops_table.dir.node;
                    node.stream_ops = MEMFS.ops_table.dir.stream;
                    node.contents = {}
                } else if (FS.isFile(node.mode)) {
                    node.node_ops = MEMFS.ops_table.file.node;
                    node.stream_ops = MEMFS.ops_table.file.stream;
                    node.usedBytes = 0;
                    node.contents = null
                } else if (FS.isLink(node.mode)) {
                    node.node_ops = MEMFS.ops_table.link.node;
                    node.stream_ops = MEMFS.ops_table.link.stream
                } else if (FS.isChrdev(node.mode)) {
                    node.node_ops = MEMFS.ops_table.chrdev.node;
                    node.stream_ops = MEMFS.ops_table.chrdev.stream
                }
                node.timestamp = Date.now();
                if (parent) {
                    parent.contents[name] = node
                }
                return node
            },
            getFileDataAsRegularArray: function(node) {
                if (node.contents && node.contents.subarray) {
                    var arr = [];
                    for (var i = 0; i < node.usedBytes; ++i) arr.push(node.contents[i]);
                    return arr
                }
                return node.contents
            },
            getFileDataAsTypedArray: function(node) {
                if (!node.contents) return new Uint8Array;
                if (node.contents.subarray) return node.contents.subarray(0, node.usedBytes);
                return new Uint8Array(node.contents)
            },
            expandFileStorage: function(node, newCapacity) {
                var prevCapacity = node.contents ? node.contents.length : 0;
                if (prevCapacity >= newCapacity) return;
                var CAPACITY_DOUBLING_MAX = 1024 * 1024;
                newCapacity = Math.max(newCapacity, prevCapacity * (prevCapacity < CAPACITY_DOUBLING_MAX ? 2 : 1.125) | 0);
                if (prevCapacity != 0) newCapacity = Math.max(newCapacity, 256);
                var oldContents = node.contents;
                node.contents = new Uint8Array(newCapacity);
                if (node.usedBytes > 0) node.contents.set(oldContents.subarray(0, node.usedBytes), 0);
                return
            },
            resizeFileStorage: function(node, newSize) {
                if (node.usedBytes == newSize) return;
                if (newSize == 0) {
                    node.contents = null;
                    node.usedBytes = 0;
                    return
                }
                if (!node.contents || node.contents.subarray) {
                    var oldContents = node.contents;
                    node.contents = new Uint8Array(new ArrayBuffer(newSize));
                    if (oldContents) {
                        node.contents.set(oldContents.subarray(0, Math.min(newSize, node.usedBytes)))
                    }
                    node.usedBytes = newSize;
                    return
                }
                if (!node.contents) node.contents = [];
                if (node.contents.length > newSize) node.contents.length = newSize;
                else
                    while (node.contents.length < newSize) node.contents.push(0);
                node.usedBytes = newSize
            },
            node_ops: {
                getattr: function(node) {
                    var attr = {};
                    attr.dev = FS.isChrdev(node.mode) ? node.id : 1;
                    attr.ino = node.id;
                    attr.mode = node.mode;
                    attr.nlink = 1;
                    attr.uid = 0;
                    attr.gid = 0;
                    attr.rdev = node.rdev;
                    if (FS.isDir(node.mode)) {
                        attr.size = 4096
                    } else if (FS.isFile(node.mode)) {
                        attr.size = node.usedBytes
                    } else if (FS.isLink(node.mode)) {
                        attr.size = node.link.length
                    } else {
                        attr.size = 0
                    }
                    attr.atime = new Date(node.timestamp);
                    attr.mtime = new Date(node.timestamp);
                    attr.ctime = new Date(node.timestamp);
                    attr.blksize = 4096;
                    attr.blocks = Math.ceil(attr.size / attr.blksize);
                    return attr
                },
                setattr: function(node, attr) {
                    if (attr.mode !== undefined) {
                        node.mode = attr.mode
                    }
                    if (attr.timestamp !== undefined) {
                        node.timestamp = attr.timestamp
                    }
                    if (attr.size !== undefined) {
                        MEMFS.resizeFileStorage(node, attr.size)
                    }
                },
                lookup: function(parent, name) {
                    throw FS.genericErrors[44]
                },
                mknod: function(parent, name, mode, dev) {
                    return MEMFS.createNode(parent, name, mode, dev)
                },
                rename: function(old_node, new_dir, new_name) {
                    if (FS.isDir(old_node.mode)) {
                        var new_node;
                        try {
                            new_node = FS.lookupNode(new_dir, new_name)
                        } catch (e) {}
                        if (new_node) {
                            for (var i in new_node.contents) {
                                throw new FS.ErrnoError(55)
                            }
                        }
                    }
                    delete old_node.parent.contents[old_node.name];
                    old_node.name = new_name;
                    new_dir.contents[new_name] = old_node;
                    old_node.parent = new_dir
                },
                unlink: function(parent, name) {
                    delete parent.contents[name]
                },
                rmdir: function(parent, name) {
                    var node = FS.lookupNode(parent, name);
                    for (var i in node.contents) {
                        throw new FS.ErrnoError(55)
                    }
                    delete parent.contents[name]
                },
                readdir: function(node) {
                    var entries = [".", ".."];
                    for (var key in node.contents) {
                        if (!node.contents.hasOwnProperty(key)) {
                            continue
                        }
                        entries.push(key)
                    }
                    return entries
                },
                symlink: function(parent, newname, oldpath) {
                    var node = MEMFS.createNode(parent, newname, 511 | 40960, 0);
                    node.link = oldpath;
                    return node
                },
                readlink: function(node) {
                    if (!FS.isLink(node.mode)) {
                        throw new FS.ErrnoError(28)
                    }
                    return node.link
                }
            },
            stream_ops: {
                read: function(stream, buffer, offset, length, position) {
                    var contents = stream.node.contents;
                    if (position >= stream.node.usedBytes) return 0;
                    var size = Math.min(stream.node.usedBytes - position, length);
                    if (size > 8 && contents.subarray) {
                        buffer.set(contents.subarray(position, position + size), offset)
                    } else {
                        for (var i = 0; i < size; i++) buffer[offset + i] = contents[position + i]
                    }
                    return size
                },
                write: function(stream, buffer, offset, length, position, canOwn) {
                    if (!length) return 0;
                    var node = stream.node;
                    node.timestamp = Date.now();
                    if (buffer.subarray && (!node.contents || node.contents.subarray)) {
                        if (canOwn) {
                            node.contents = buffer.subarray(offset, offset + length);
                            node.usedBytes = length;
                            return length
                        } else if (node.usedBytes === 0 && position === 0) {
                            node.contents = new Uint8Array(buffer.subarray(offset, offset + length));
                            node.usedBytes = length;
                            return length
                        } else if (position + length <= node.usedBytes) {
                            node.contents.set(buffer.subarray(offset, offset + length), position);
                            return length
                        }
                    }
                    MEMFS.expandFileStorage(node, position + length);
                    if (node.contents.subarray && buffer.subarray) node.contents.set(buffer.subarray(offset, offset + length), position);
                    else {
                        for (var i = 0; i < length; i++) {
                            node.contents[position + i] = buffer[offset + i]
                        }
                    }
                    node.usedBytes = Math.max(node.usedBytes, position + length);
                    return length
                },
                llseek: function(stream, offset, whence) {
                    var position = offset;
                    if (whence === 1) {
                        position += stream.position
                    } else if (whence === 2) {
                        if (FS.isFile(stream.node.mode)) {
                            position += stream.node.usedBytes
                        }
                    }
                    if (position < 0) {
                        throw new FS.ErrnoError(28)
                    }
                    return position
                },
                allocate: function(stream, offset, length) {
                    MEMFS.expandFileStorage(stream.node, offset + length);
                    stream.node.usedBytes = Math.max(stream.node.usedBytes, offset + length)
                },
                mmap: function(stream, buffer, offset, length, position, prot, flags) {
                    if (!FS.isFile(stream.node.mode)) {
                        throw new FS.ErrnoError(43)
                    }
                    var ptr;
                    var allocated;
                    var contents = stream.node.contents;
                    if (!(flags & 2) && contents.buffer === buffer.buffer) {
                        allocated = false;
                        ptr = contents.byteOffset
                    } else {
                        if (position > 0 || position + length < stream.node.usedBytes) {
                            if (contents.subarray) {
                                contents = contents.subarray(position, position + length)
                            } else {
                                contents = Array.prototype.slice.call(contents, position, position + length)
                            }
                        }
                        allocated = true;
                        var fromHeap = buffer.buffer == HEAP8.buffer;
                        ptr = _malloc(length);
                        if (!ptr) {
                            throw new FS.ErrnoError(48)
                        }(fromHeap ? HEAP8 : buffer).set(contents, ptr)
                    }
                    return {
                        ptr: ptr,
                        allocated: allocated
                    }
                },
                msync: function(stream, buffer, offset, length, mmapFlags) {
                    if (!FS.isFile(stream.node.mode)) {
                        throw new FS.ErrnoError(43)
                    }
                    if (mmapFlags & 2) {
                        return 0
                    }
                    var bytesWritten = MEMFS.stream_ops.write(stream, buffer, 0, length, offset, false);
                    return 0
                }
            }
        };
        var FS = {
            root: null,
            mounts: [],
            devices: {},
            streams: [],
            nextInode: 1,
            nameTable: null,
            currentPath: "/",
            initialized: false,
            ignorePermissions: true,
            trackingDelegate: {},
            tracking: {
                openFlags: {
                    READ: 1,
                    WRITE: 2
                }
            },
            ErrnoError: null,
            genericErrors: {},
            filesystems: null,
            syncFSRequests: 0,
            handleFSError: function(e) {
                if (!(e instanceof FS.ErrnoError)) throw e + " : " + stackTrace();
                return ___setErrNo(e.errno)
            },
            lookupPath: function(path, opts) {
                path = PATH_FS.resolve(FS.cwd(), path);
                opts = opts || {};
                if (!path) return {
                    path: "",
                    node: null
                };
                var defaults = {
                    follow_mount: true,
                    recurse_count: 0
                };
                for (var key in defaults) {
                    if (opts[key] === undefined) {
                        opts[key] = defaults[key]
                    }
                }
                if (opts.recurse_count > 8) {
                    throw new FS.ErrnoError(32)
                }
                var parts = PATH.normalizeArray(path.split("/").filter(function(p) {
                    return !!p
                }), false);
                var current = FS.root;
                var current_path = "/";
                for (var i = 0; i < parts.length; i++) {
                    var islast = i === parts.length - 1;
                    if (islast && opts.parent) {
                        break
                    }
                    current = FS.lookupNode(current, parts[i]);
                    current_path = PATH.join2(current_path, parts[i]);
                    if (FS.isMountpoint(current)) {
                        if (!islast || islast && opts.follow_mount) {
                            current = current.mounted.root
                        }
                    }
                    if (!islast || opts.follow) {
                        var count = 0;
                        while (FS.isLink(current.mode)) {
                            var link = FS.readlink(current_path);
                            current_path = PATH_FS.resolve(PATH.dirname(current_path), link);
                            var lookup = FS.lookupPath(current_path, {
                                recurse_count: opts.recurse_count
                            });
                            current = lookup.node;
                            if (count++ > 40) {
                                throw new FS.ErrnoError(32)
                            }
                        }
                    }
                }
                return {
                    path: current_path,
                    node: current
                }
            },
            getPath: function(node) {
                var path;
                while (true) {
                    if (FS.isRoot(node)) {
                        var mount = node.mount.mountpoint;
                        if (!path) return mount;
                        return mount[mount.length - 1] !== "/" ? mount + "/" + path : mount + path
                    }
                    path = path ? node.name + "/" + path : node.name;
                    node = node.parent
                }
            },
            hashName: function(parentid, name) {
                var hash = 0;
                for (var i = 0; i < name.length; i++) {
                    hash = (hash << 5) - hash + name.charCodeAt(i) | 0
                }
                return (parentid + hash >>> 0) % FS.nameTable.length
            },
            hashAddNode: function(node) {
                var hash = FS.hashName(node.parent.id, node.name);
                node.name_next = FS.nameTable[hash];
                FS.nameTable[hash] = node
            },
            hashRemoveNode: function(node) {
                var hash = FS.hashName(node.parent.id, node.name);
                if (FS.nameTable[hash] === node) {
                    FS.nameTable[hash] = node.name_next
                } else {
                    var current = FS.nameTable[hash];
                    while (current) {
                        if (current.name_next === node) {
                            current.name_next = node.name_next;
                            break
                        }
                        current = current.name_next
                    }
                }
            },
            lookupNode: function(parent, name) {
                var err = FS.mayLookup(parent);
                if (err) {
                    throw new FS.ErrnoError(err, parent)
                }
                var hash = FS.hashName(parent.id, name);
                for (var node = FS.nameTable[hash]; node; node = node.name_next) {
                    var nodeName = node.name;
                    if (node.parent.id === parent.id && nodeName === name) {
                        return node
                    }
                }
                return FS.lookup(parent, name)
            },
            createNode: function(parent, name, mode, rdev) {
                if (!FS.FSNode) {
                    FS.FSNode = function(parent, name, mode, rdev) {
                        if (!parent) {
                            parent = this
                        }
                        this.parent = parent;
                        this.mount = parent.mount;
                        this.mounted = null;
                        this.id = FS.nextInode++;
                        this.name = name;
                        this.mode = mode;
                        this.node_ops = {};
                        this.stream_ops = {};
                        this.rdev = rdev
                    };
                    FS.FSNode.prototype = {};
                    var readMode = 292 | 73;
                    var writeMode = 146;
                    Object.defineProperties(FS.FSNode.prototype, {
                        read: {
                            get: function() {
                                return (this.mode & readMode) === readMode
                            },
                            set: function(val) {
                                val ? this.mode |= readMode : this.mode &= ~readMode
                            }
                        },
                        write: {
                            get: function() {
                                return (this.mode & writeMode) === writeMode
                            },
                            set: function(val) {
                                val ? this.mode |= writeMode : this.mode &= ~writeMode
                            }
                        },
                        isFolder: {
                            get: function() {
                                return FS.isDir(this.mode)
                            }
                        },
                        isDevice: {
                            get: function() {
                                return FS.isChrdev(this.mode)
                            }
                        }
                    })
                }
                var node = new FS.FSNode(parent, name, mode, rdev);
                FS.hashAddNode(node);
                return node
            },
            destroyNode: function(node) {
                FS.hashRemoveNode(node)
            },
            isRoot: function(node) {
                return node === node.parent
            },
            isMountpoint: function(node) {
                return !!node.mounted
            },
            isFile: function(mode) {
                return (mode & 61440) === 32768
            },
            isDir: function(mode) {
                return (mode & 61440) === 16384
            },
            isLink: function(mode) {
                return (mode & 61440) === 40960
            },
            isChrdev: function(mode) {
                return (mode & 61440) === 8192
            },
            isBlkdev: function(mode) {
                return (mode & 61440) === 24576
            },
            isFIFO: function(mode) {
                return (mode & 61440) === 4096
            },
            isSocket: function(mode) {
                return (mode & 49152) === 49152
            },
            flagModes: {
                "r": 0,
                "rs": 1052672,
                "r+": 2,
                "w": 577,
                "wx": 705,
                "xw": 705,
                "w+": 578,
                "wx+": 706,
                "xw+": 706,
                "a": 1089,
                "ax": 1217,
                "xa": 1217,
                "a+": 1090,
                "ax+": 1218,
                "xa+": 1218
            },
            modeStringToFlags: function(str) {
                var flags = FS.flagModes[str];
                if (typeof flags === "undefined") {
                    throw new Error("Unknown file open mode: " + str)
                }
                return flags
            },
            flagsToPermissionString: function(flag) {
                var perms = ["r", "w", "rw"][flag & 3];
                if (flag & 512) {
                    perms += "w"
                }
                return perms
            },
            nodePermissions: function(node, perms) {
                if (FS.ignorePermissions) {
                    return 0
                }
                if (perms.indexOf("r") !== -1 && !(node.mode & 292)) {
                    return 2
                } else if (perms.indexOf("w") !== -1 && !(node.mode & 146)) {
                    return 2
                } else if (perms.indexOf("x") !== -1 && !(node.mode & 73)) {
                    return 2
                }
                return 0
            },
            mayLookup: function(dir) {
                var err = FS.nodePermissions(dir, "x");
                if (err) return err;
                if (!dir.node_ops.lookup) return 2;
                return 0
            },
            mayCreate: function(dir, name) {
                try {
                    var node = FS.lookupNode(dir, name);
                    return 20
                } catch (e) {}
                return FS.nodePermissions(dir, "wx")
            },
            mayDelete: function(dir, name, isdir) {
                var node;
                try {
                    node = FS.lookupNode(dir, name)
                } catch (e) {
                    return e.errno
                }
                var err = FS.nodePermissions(dir, "wx");
                if (err) {
                    return err
                }
                if (isdir) {
                    if (!FS.isDir(node.mode)) {
                        return 54
                    }
                    if (FS.isRoot(node) || FS.getPath(node) === FS.cwd()) {
                        return 10
                    }
                } else {
                    if (FS.isDir(node.mode)) {
                        return 31
                    }
                }
                return 0
            },
            mayOpen: function(node, flags) {
                if (!node) {
                    return 44
                }
                if (FS.isLink(node.mode)) {
                    return 32
                } else if (FS.isDir(node.mode)) {
                    if (FS.flagsToPermissionString(flags) !== "r" || flags & 512) {
                        return 31
                    }
                }
                return FS.nodePermissions(node, FS.flagsToPermissionString(flags))
            },
            MAX_OPEN_FDS: 4096,
            nextfd: function(fd_start, fd_end) {
                fd_start = fd_start || 0;
                fd_end = fd_end || FS.MAX_OPEN_FDS;
                for (var fd = fd_start; fd <= fd_end; fd++) {
                    if (!FS.streams[fd]) {
                        return fd
                    }
                }
                throw new FS.ErrnoError(33)
            },
            getStream: function(fd) {
                return FS.streams[fd]
            },
            createStream: function(stream, fd_start, fd_end) {
                if (!FS.FSStream) {
                    FS.FSStream = function() {};
                    FS.FSStream.prototype = {};
                    Object.defineProperties(FS.FSStream.prototype, {
                        object: {
                            get: function() {
                                return this.node
                            },
                            set: function(val) {
                                this.node = val
                            }
                        },
                        isRead: {
                            get: function() {
                                return (this.flags & 2097155) !== 1
                            }
                        },
                        isWrite: {
                            get: function() {
                                return (this.flags & 2097155) !== 0
                            }
                        },
                        isAppend: {
                            get: function() {
                                return this.flags & 1024
                            }
                        }
                    })
                }
                var newStream = new FS.FSStream;
                for (var p in stream) {
                    newStream[p] = stream[p]
                }
                stream = newStream;
                var fd = FS.nextfd(fd_start, fd_end);
                stream.fd = fd;
                FS.streams[fd] = stream;
                return stream
            },
            closeStream: function(fd) {
                FS.streams[fd] = null
            },
            chrdev_stream_ops: {
                open: function(stream) {
                    var device = FS.getDevice(stream.node.rdev);
                    stream.stream_ops = device.stream_ops;
                    if (stream.stream_ops.open) {
                        stream.stream_ops.open(stream)
                    }
                },
                llseek: function() {
                    throw new FS.ErrnoError(70)
                }
            },
            major: function(dev) {
                return dev >> 8
            },
            minor: function(dev) {
                return dev & 255
            },
            makedev: function(ma, mi) {
                return ma << 8 | mi
            },
            registerDevice: function(dev, ops) {
                FS.devices[dev] = {
                    stream_ops: ops
                }
            },
            getDevice: function(dev) {
                return FS.devices[dev]
            },
            getMounts: function(mount) {
                var mounts = [];
                var check = [mount];
                while (check.length) {
                    var m = check.pop();
                    mounts.push(m);
                    check.push.apply(check, m.mounts)
                }
                return mounts
            },
            syncfs: function(populate, callback) {
                if (typeof populate === "function") {
                    callback = populate;
                    populate = false
                }
                FS.syncFSRequests++;
                if (FS.syncFSRequests > 1) {
                    console.log("warning: " + FS.syncFSRequests + " FS.syncfs operations in flight at once, probably just doing extra work")
                }
                var mounts = FS.getMounts(FS.root.mount);
                var completed = 0;

                function doCallback(err) {
                    FS.syncFSRequests--;
                    return callback(err)
                }

                function done(err) {
                    if (err) {
                        if (!done.errored) {
                            done.errored = true;
                            return doCallback(err)
                        }
                        return
                    }
                    if (++completed >= mounts.length) {
                        doCallback(null)
                    }
                }
                mounts.forEach(function(mount) {
                    if (!mount.type.syncfs) {
                        return done(null)
                    }
                    mount.type.syncfs(mount, populate, done)
                })
            },
            mount: function(type, opts, mountpoint) {
                var root = mountpoint === "/";
                var pseudo = !mountpoint;
                var node;
                if (root && FS.root) {
                    throw new FS.ErrnoError(10)
                } else if (!root && !pseudo) {
                    var lookup = FS.lookupPath(mountpoint, {
                        follow_mount: false
                    });
                    mountpoint = lookup.path;
                    node = lookup.node;
                    if (FS.isMountpoint(node)) {
                        throw new FS.ErrnoError(10)
                    }
                    if (!FS.isDir(node.mode)) {
                        throw new FS.ErrnoError(54)
                    }
                }
                var mount = {
                    type: type,
                    opts: opts,
                    mountpoint: mountpoint,
                    mounts: []
                };
                var mountRoot = type.mount(mount);
                mountRoot.mount = mount;
                mount.root = mountRoot;
                if (root) {
                    FS.root = mountRoot
                } else if (node) {
                    node.mounted = mount;
                    if (node.mount) {
                        node.mount.mounts.push(mount)
                    }
                }
                return mountRoot
            },
            unmount: function(mountpoint) {
                var lookup = FS.lookupPath(mountpoint, {
                    follow_mount: false
                });
                if (!FS.isMountpoint(lookup.node)) {
                    throw new FS.ErrnoError(28)
                }
                var node = lookup.node;
                var mount = node.mounted;
                var mounts = FS.getMounts(mount);
                Object.keys(FS.nameTable).forEach(function(hash) {
                    var current = FS.nameTable[hash];
                    while (current) {
                        var next = current.name_next;
                        if (mounts.indexOf(current.mount) !== -1) {
                            FS.destroyNode(current)
                        }
                        current = next
                    }
                });
                node.mounted = null;
                var idx = node.mount.mounts.indexOf(mount);
                node.mount.mounts.splice(idx, 1)
            },
            lookup: function(parent, name) {
                return parent.node_ops.lookup(parent, name)
            },
            mknod: function(path, mode, dev) {
                var lookup = FS.lookupPath(path, {
                    parent: true
                });
                var parent = lookup.node;
                var name = PATH.basename(path);
                if (!name || name === "." || name === "..") {
                    throw new FS.ErrnoError(28)
                }
                var err = FS.mayCreate(parent, name);
                if (err) {
                    throw new FS.ErrnoError(err)
                }
                if (!parent.node_ops.mknod) {
                    throw new FS.ErrnoError(63)
                }
                return parent.node_ops.mknod(parent, name, mode, dev)
            },
            create: function(path, mode) {
                mode = mode !== undefined ? mode : 438;
                mode &= 4095;
                mode |= 32768;
                return FS.mknod(path, mode, 0)
            },
            mkdir: function(path, mode) {
                mode = mode !== undefined ? mode : 511;
                mode &= 511 | 512;
                mode |= 16384;
                return FS.mknod(path, mode, 0)
            },
            mkdirTree: function(path, mode) {
                var dirs = path.split("/");
                var d = "";
                for (var i = 0; i < dirs.length; ++i) {
                    if (!dirs[i]) continue;
                    d += "/" + dirs[i];
                    try {
                        FS.mkdir(d, mode)
                    } catch (e) {
                        if (e.errno != 20) throw e
                    }
                }
            },
            mkdev: function(path, mode, dev) {
                if (typeof dev === "undefined") {
                    dev = mode;
                    mode = 438
                }
                mode |= 8192;
                return FS.mknod(path, mode, dev)
            },
            symlink: function(oldpath, newpath) {
                if (!PATH_FS.resolve(oldpath)) {
                    throw new FS.ErrnoError(44)
                }
                var lookup = FS.lookupPath(newpath, {
                    parent: true
                });
                var parent = lookup.node;
                if (!parent) {
                    throw new FS.ErrnoError(44)
                }
                var newname = PATH.basename(newpath);
                var err = FS.mayCreate(parent, newname);
                if (err) {
                    throw new FS.ErrnoError(err)
                }
                if (!parent.node_ops.symlink) {
                    throw new FS.ErrnoError(63)
                }
                return parent.node_ops.symlink(parent, newname, oldpath)
            },
            rename: function(old_path, new_path) {
                var old_dirname = PATH.dirname(old_path);
                var new_dirname = PATH.dirname(new_path);
                var old_name = PATH.basename(old_path);
                var new_name = PATH.basename(new_path);
                var lookup, old_dir, new_dir;
                try {
                    lookup = FS.lookupPath(old_path, {
                        parent: true
                    });
                    old_dir = lookup.node;
                    lookup = FS.lookupPath(new_path, {
                        parent: true
                    });
                    new_dir = lookup.node
                } catch (e) {
                    throw new FS.ErrnoError(10)
                }
                if (!old_dir || !new_dir) throw new FS.ErrnoError(44);
                if (old_dir.mount !== new_dir.mount) {
                    throw new FS.ErrnoError(75)
                }
                var old_node = FS.lookupNode(old_dir, old_name);
                var relative = PATH_FS.relative(old_path, new_dirname);
                if (relative.charAt(0) !== ".") {
                    throw new FS.ErrnoError(28)
                }
                relative = PATH_FS.relative(new_path, old_dirname);
                if (relative.charAt(0) !== ".") {
                    throw new FS.ErrnoError(55)
                }
                var new_node;
                try {
                    new_node = FS.lookupNode(new_dir, new_name)
                } catch (e) {}
                if (old_node === new_node) {
                    return
                }
                var isdir = FS.isDir(old_node.mode);
                var err = FS.mayDelete(old_dir, old_name, isdir);
                if (err) {
                    throw new FS.ErrnoError(err)
                }
                err = new_node ? FS.mayDelete(new_dir, new_name, isdir) : FS.mayCreate(new_dir, new_name);
                if (err) {
                    throw new FS.ErrnoError(err)
                }
                if (!old_dir.node_ops.rename) {
                    throw new FS.ErrnoError(63)
                }
                if (FS.isMountpoint(old_node) || new_node && FS.isMountpoint(new_node)) {
                    throw new FS.ErrnoError(10)
                }
                if (new_dir !== old_dir) {
                    err = FS.nodePermissions(old_dir, "w");
                    if (err) {
                        throw new FS.ErrnoError(err)
                    }
                }
                try {
                    if (FS.trackingDelegate["willMovePath"]) {
                        FS.trackingDelegate["willMovePath"](old_path, new_path)
                    }
                } catch (e) {
                    console.log("FS.trackingDelegate['willMovePath']('" + old_path + "', '" + new_path + "') threw an exception: " + e.message)
                }
                FS.hashRemoveNode(old_node);
                try {
                    old_dir.node_ops.rename(old_node, new_dir, new_name)
                } catch (e) {
                    throw e
                } finally {
                    FS.hashAddNode(old_node)
                }
                try {
                    if (FS.trackingDelegate["onMovePath"]) FS.trackingDelegate["onMovePath"](old_path, new_path)
                } catch (e) {
                    console.log("FS.trackingDelegate['onMovePath']('" + old_path + "', '" + new_path + "') threw an exception: " + e.message)
                }
            },
            rmdir: function(path) {
                var lookup = FS.lookupPath(path, {
                    parent: true
                });
                var parent = lookup.node;
                var name = PATH.basename(path);
                var node = FS.lookupNode(parent, name);
                var err = FS.mayDelete(parent, name, true);
                if (err) {
                    throw new FS.ErrnoError(err)
                }
                if (!parent.node_ops.rmdir) {
                    throw new FS.ErrnoError(63)
                }
                if (FS.isMountpoint(node)) {
                    throw new FS.ErrnoError(10)
                }
                try {
                    if (FS.trackingDelegate["willDeletePath"]) {
                        FS.trackingDelegate["willDeletePath"](path)
                    }
                } catch (e) {
                    console.log("FS.trackingDelegate['willDeletePath']('" + path + "') threw an exception: " + e.message)
                }
                parent.node_ops.rmdir(parent, name);
                FS.destroyNode(node);
                try {
                    if (FS.trackingDelegate["onDeletePath"]) FS.trackingDelegate["onDeletePath"](path)
                } catch (e) {
                    console.log("FS.trackingDelegate['onDeletePath']('" + path + "') threw an exception: " + e.message)
                }
            },
            readdir: function(path) {
                var lookup = FS.lookupPath(path, {
                    follow: true
                });
                var node = lookup.node;
                if (!node.node_ops.readdir) {
                    throw new FS.ErrnoError(54)
                }
                return node.node_ops.readdir(node)
            },
            unlink: function(path) {
                var lookup = FS.lookupPath(path, {
                    parent: true
                });
                var parent = lookup.node;
                var name = PATH.basename(path);
                var node = FS.lookupNode(parent, name);
                var err = FS.mayDelete(parent, name, false);
                if (err) {
                    throw new FS.ErrnoError(err)
                }
                if (!parent.node_ops.unlink) {
                    throw new FS.ErrnoError(63)
                }
                if (FS.isMountpoint(node)) {
                    throw new FS.ErrnoError(10)
                }
                try {
                    if (FS.trackingDelegate["willDeletePath"]) {
                        FS.trackingDelegate["willDeletePath"](path)
                    }
                } catch (e) {
                    console.log("FS.trackingDelegate['willDeletePath']('" + path + "') threw an exception: " + e.message)
                }
                parent.node_ops.unlink(parent, name);
                FS.destroyNode(node);
                try {
                    if (FS.trackingDelegate["onDeletePath"]) FS.trackingDelegate["onDeletePath"](path)
                } catch (e) {
                    console.log("FS.trackingDelegate['onDeletePath']('" + path + "') threw an exception: " + e.message)
                }
            },
            readlink: function(path) {
                var lookup = FS.lookupPath(path);
                var link = lookup.node;
                if (!link) {
                    throw new FS.ErrnoError(44)
                }
                if (!link.node_ops.readlink) {
                    throw new FS.ErrnoError(28)
                }
                return PATH_FS.resolve(FS.getPath(link.parent), link.node_ops.readlink(link))
            },
            stat: function(path, dontFollow) {
                var lookup = FS.lookupPath(path, {
                    follow: !dontFollow
                });
                var node = lookup.node;
                if (!node) {
                    throw new FS.ErrnoError(44)
                }
                if (!node.node_ops.getattr) {
                    throw new FS.ErrnoError(63)
                }
                return node.node_ops.getattr(node)
            },
            lstat: function(path) {
                return FS.stat(path, true)
            },
            chmod: function(path, mode, dontFollow) {
                var node;
                if (typeof path === "string") {
                    var lookup = FS.lookupPath(path, {
                        follow: !dontFollow
                    });
                    node = lookup.node
                } else {
                    node = path
                }
                if (!node.node_ops.setattr) {
                    throw new FS.ErrnoError(63)
                }
                node.node_ops.setattr(node, {
                    mode: mode & 4095 | node.mode & ~4095,
                    timestamp: Date.now()
                })
            },
            lchmod: function(path, mode) {
                FS.chmod(path, mode, true)
            },
            fchmod: function(fd, mode) {
                var stream = FS.getStream(fd);
                if (!stream) {
                    throw new FS.ErrnoError(8)
                }
                FS.chmod(stream.node, mode)
            },
            chown: function(path, uid, gid, dontFollow) {
                var node;
                if (typeof path === "string") {
                    var lookup = FS.lookupPath(path, {
                        follow: !dontFollow
                    });
                    node = lookup.node
                } else {
                    node = path
                }
                if (!node.node_ops.setattr) {
                    throw new FS.ErrnoError(63)
                }
                node.node_ops.setattr(node, {
                    timestamp: Date.now()
                })
            },
            lchown: function(path, uid, gid) {
                FS.chown(path, uid, gid, true)
            },
            fchown: function(fd, uid, gid) {
                var stream = FS.getStream(fd);
                if (!stream) {
                    throw new FS.ErrnoError(8)
                }
                FS.chown(stream.node, uid, gid)
            },
            truncate: function(path, len) {
                if (len < 0) {
                    throw new FS.ErrnoError(28)
                }
                var node;
                if (typeof path === "string") {
                    var lookup = FS.lookupPath(path, {
                        follow: true
                    });
                    node = lookup.node
                } else {
                    node = path
                }
                if (!node.node_ops.setattr) {
                    throw new FS.ErrnoError(63)
                }
                if (FS.isDir(node.mode)) {
                    throw new FS.ErrnoError(31)
                }
                if (!FS.isFile(node.mode)) {
                    throw new FS.ErrnoError(28)
                }
                var err = FS.nodePermissions(node, "w");
                if (err) {
                    throw new FS.ErrnoError(err)
                }
                node.node_ops.setattr(node, {
                    size: len,
                    timestamp: Date.now()
                })
            },
            ftruncate: function(fd, len) {
                var stream = FS.getStream(fd);
                if (!stream) {
                    throw new FS.ErrnoError(8)
                }
                if ((stream.flags & 2097155) === 0) {
                    throw new FS.ErrnoError(28)
                }
                FS.truncate(stream.node, len)
            },
            utime: function(path, atime, mtime) {
                var lookup = FS.lookupPath(path, {
                    follow: true
                });
                var node = lookup.node;
                node.node_ops.setattr(node, {
                    timestamp: Math.max(atime, mtime)
                })
            },
            open: function(path, flags, mode, fd_start, fd_end) {
                if (path === "") {
                    throw new FS.ErrnoError(44)
                }
                flags = typeof flags === "string" ? FS.modeStringToFlags(flags) : flags;
                mode = typeof mode === "undefined" ? 438 : mode;
                if (flags & 64) {
                    mode = mode & 4095 | 32768
                } else {
                    mode = 0
                }
                var node;
                if (typeof path === "object") {
                    node = path
                } else {
                    path = PATH.normalize(path);
                    try {
                        var lookup = FS.lookupPath(path, {
                            follow: !(flags & 131072)
                        });
                        node = lookup.node
                    } catch (e) {}
                }
                var created = false;
                if (flags & 64) {
                    if (node) {
                        if (flags & 128) {
                            throw new FS.ErrnoError(20)
                        }
                    } else {
                        node = FS.mknod(path, mode, 0);
                        created = true
                    }
                }
                if (!node) {
                    throw new FS.ErrnoError(44)
                }
                if (FS.isChrdev(node.mode)) {
                    flags &= ~512
                }
                if (flags & 65536 && !FS.isDir(node.mode)) {
                    throw new FS.ErrnoError(54)
                }
                if (!created) {
                    var err = FS.mayOpen(node, flags);
                    if (err) {
                        throw new FS.ErrnoError(err)
                    }
                }
                if (flags & 512) {
                    FS.truncate(node, 0)
                }
                flags &= ~(128 | 512);
                var stream = FS.createStream({
                    node: node,
                    path: FS.getPath(node),
                    flags: flags,
                    seekable: true,
                    position: 0,
                    stream_ops: node.stream_ops,
                    ungotten: [],
                    error: false
                }, fd_start, fd_end);
                if (stream.stream_ops.open) {
                    stream.stream_ops.open(stream)
                }
                if (Module["logReadFiles"] && !(flags & 1)) {
                    if (!FS.readFiles) FS.readFiles = {};
                    if (!(path in FS.readFiles)) {
                        FS.readFiles[path] = 1;
                        console.log("FS.trackingDelegate error on read file: " + path)
                    }
                }
                try {
                    if (FS.trackingDelegate["onOpenFile"]) {
                        var trackingFlags = 0;
                        if ((flags & 2097155) !== 1) {
                            trackingFlags |= FS.tracking.openFlags.READ
                        }
                        if ((flags & 2097155) !== 0) {
                            trackingFlags |= FS.tracking.openFlags.WRITE
                        }
                        FS.trackingDelegate["onOpenFile"](path, trackingFlags)
                    }
                } catch (e) {
                    console.log("FS.trackingDelegate['onOpenFile']('" + path + "', flags) threw an exception: " + e.message)
                }
                return stream
            },
            close: function(stream) {
                if (FS.isClosed(stream)) {
                    throw new FS.ErrnoError(8)
                }
                if (stream.getdents) stream.getdents = null;
                try {
                    if (stream.stream_ops.close) {
                        stream.stream_ops.close(stream)
                    }
                } catch (e) {
                    throw e
                } finally {
                    FS.closeStream(stream.fd)
                }
                stream.fd = null
            },
            isClosed: function(stream) {
                return stream.fd === null
            },
            llseek: function(stream, offset, whence) {
                if (FS.isClosed(stream)) {
                    throw new FS.ErrnoError(8)
                }
                if (!stream.seekable || !stream.stream_ops.llseek) {
                    throw new FS.ErrnoError(70)
                }
                if (whence != 0 && whence != 1 && whence != 2) {
                    throw new FS.ErrnoError(28)
                }
                stream.position = stream.stream_ops.llseek(stream, offset, whence);
                stream.ungotten = [];
                return stream.position
            },
            read: function(stream, buffer, offset, length, position) {
                if (length < 0 || position < 0) {
                    throw new FS.ErrnoError(28)
                }
                if (FS.isClosed(stream)) {
                    throw new FS.ErrnoError(8)
                }
                if ((stream.flags & 2097155) === 1) {
                    throw new FS.ErrnoError(8)
                }
                if (FS.isDir(stream.node.mode)) {
                    throw new FS.ErrnoError(31)
                }
                if (!stream.stream_ops.read) {
                    throw new FS.ErrnoError(28)
                }
                var seeking = typeof position !== "undefined";
                if (!seeking) {
                    position = stream.position
                } else if (!stream.seekable) {
                    throw new FS.ErrnoError(70)
                }
                var bytesRead = stream.stream_ops.read(stream, buffer, offset, length, position);
                if (!seeking) stream.position += bytesRead;
                return bytesRead
            },
            write: function(stream, buffer, offset, length, position, canOwn) {
                if (length < 0 || position < 0) {
                    throw new FS.ErrnoError(28)
                }
                if (FS.isClosed(stream)) {
                    throw new FS.ErrnoError(8)
                }
                if ((stream.flags & 2097155) === 0) {
                    throw new FS.ErrnoError(8)
                }
                if (FS.isDir(stream.node.mode)) {
                    throw new FS.ErrnoError(31)
                }
                if (!stream.stream_ops.write) {
                    throw new FS.ErrnoError(28)
                }
                if (stream.flags & 1024) {
                    FS.llseek(stream, 0, 2)
                }
                var seeking = typeof position !== "undefined";
                if (!seeking) {
                    position = stream.position
                } else if (!stream.seekable) {
                    throw new FS.ErrnoError(70)
                }
                var bytesWritten = stream.stream_ops.write(stream, buffer, offset, length, position, canOwn);
                if (!seeking) stream.position += bytesWritten;
                try {
                    if (stream.path && FS.trackingDelegate["onWriteToFile"]) FS.trackingDelegate["onWriteToFile"](stream.path)
                } catch (e) {
                    console.log("FS.trackingDelegate['onWriteToFile']('" + stream.path + "') threw an exception: " + e.message)
                }
                return bytesWritten
            },
            allocate: function(stream, offset, length) {
                if (FS.isClosed(stream)) {
                    throw new FS.ErrnoError(8)
                }
                if (offset < 0 || length <= 0) {
                    throw new FS.ErrnoError(28)
                }
                if ((stream.flags & 2097155) === 0) {
                    throw new FS.ErrnoError(8)
                }
                if (!FS.isFile(stream.node.mode) && !FS.isDir(stream.node.mode)) {
                    throw new FS.ErrnoError(43)
                }
                if (!stream.stream_ops.allocate) {
                    throw new FS.ErrnoError(138)
                }
                stream.stream_ops.allocate(stream, offset, length)
            },
            mmap: function(stream, buffer, offset, length, position, prot, flags) {
                if ((prot & 2) !== 0 && (flags & 2) === 0 && (stream.flags & 2097155) !== 2) {
                    throw new FS.ErrnoError(2)
                }
                if ((stream.flags & 2097155) === 1) {
                    throw new FS.ErrnoError(2)
                }
                if (!stream.stream_ops.mmap) {
                    throw new FS.ErrnoError(43)
                }
                return stream.stream_ops.mmap(stream, buffer, offset, length, position, prot, flags)
            },
            msync: function(stream, buffer, offset, length, mmapFlags) {
                if (!stream || !stream.stream_ops.msync) {
                    return 0
                }
                return stream.stream_ops.msync(stream, buffer, offset, length, mmapFlags)
            },
            munmap: function(stream) {
                return 0
            },
            ioctl: function(stream, cmd, arg) {
                if (!stream.stream_ops.ioctl) {
                    throw new FS.ErrnoError(59)
                }
                return stream.stream_ops.ioctl(stream, cmd, arg)
            },
            readFile: function(path, opts) {
                opts = opts || {};
                opts.flags = opts.flags || "r";
                opts.encoding = opts.encoding || "binary";
                if (opts.encoding !== "utf8" && opts.encoding !== "binary") {
                    throw new Error('Invalid encoding type "' + opts.encoding + '"')
                }
                var ret;
                var stream = FS.open(path, opts.flags);
                var stat = FS.stat(path);
                var length = stat.size;
                var buf = new Uint8Array(length);
                FS.read(stream, buf, 0, length, 0);
                if (opts.encoding === "utf8") {
                    ret = UTF8ArrayToString(buf, 0)
                } else if (opts.encoding === "binary") {
                    ret = buf
                }
                FS.close(stream);
                return ret
            },
            writeFile: function(path, data, opts) {
                opts = opts || {};
                opts.flags = opts.flags || "w";
                var stream = FS.open(path, opts.flags, opts.mode);
                if (typeof data === "string") {
                    var buf = new Uint8Array(lengthBytesUTF8(data) + 1);
                    var actualNumBytes = stringToUTF8Array(data, buf, 0, buf.length);
                    FS.write(stream, buf, 0, actualNumBytes, undefined, opts.canOwn)
                } else if (ArrayBuffer.isView(data)) {
                    FS.write(stream, data, 0, data.byteLength, undefined, opts.canOwn)
                } else {
                    throw new Error("Unsupported data type")
                }
                FS.close(stream)
            },
            cwd: function() {
                return FS.currentPath
            },
            chdir: function(path) {
                var lookup = FS.lookupPath(path, {
                    follow: true
                });
                if (lookup.node === null) {
                    throw new FS.ErrnoError(44)
                }
                if (!FS.isDir(lookup.node.mode)) {
                    throw new FS.ErrnoError(54)
                }
                var err = FS.nodePermissions(lookup.node, "x");
                if (err) {
                    throw new FS.ErrnoError(err)
                }
                FS.currentPath = lookup.path
            },
            createDefaultDirectories: function() {
                FS.mkdir("/tmp");
                FS.mkdir("/home");
                FS.mkdir("/home/web_user")
            },
            createDefaultDevices: function() {
                FS.mkdir("/dev");
                FS.registerDevice(FS.makedev(1, 3), {
                    read: function() {
                        return 0
                    },
                    write: function(stream, buffer, offset, length, pos) {
                        return length
                    }
                });
                FS.mkdev("/dev/null", FS.makedev(1, 3));
                TTY.register(FS.makedev(5, 0), TTY.default_tty_ops);
                TTY.register(FS.makedev(6, 0), TTY.default_tty1_ops);
                FS.mkdev("/dev/tty", FS.makedev(5, 0));
                FS.mkdev("/dev/tty1", FS.makedev(6, 0));
                var random_device;
                if (typeof crypto === "object" && typeof crypto["getRandomValues"] === "function") {
                    var randomBuffer = new Uint8Array(1);
                    random_device = function() {
                        crypto.getRandomValues(randomBuffer);
                        return randomBuffer[0]
                    }
                } else {}
                if (!random_device) {
                    random_device = function() {
                        abort("random_device")
                    }
                }
                FS.createDevice("/dev", "random", random_device);
                FS.createDevice("/dev", "urandom", random_device);
                FS.mkdir("/dev/shm");
                FS.mkdir("/dev/shm/tmp")
            },
            createSpecialDirectories: function() {
                FS.mkdir("/proc");
                FS.mkdir("/proc/self");
                FS.mkdir("/proc/self/fd");
                FS.mount({
                    mount: function() {
                        var node = FS.createNode("/proc/self", "fd", 16384 | 511, 73);
                        node.node_ops = {
                            lookup: function(parent, name) {
                                var fd = +name;
                                var stream = FS.getStream(fd);
                                if (!stream) throw new FS.ErrnoError(8);
                                var ret = {
                                    parent: null,
                                    mount: {
                                        mountpoint: "fake"
                                    },
                                    node_ops: {
                                        readlink: function() {
                                            return stream.path
                                        }
                                    }
                                };
                                ret.parent = ret;
                                return ret
                            }
                        };
                        return node
                    }
                }, {}, "/proc/self/fd")
            },
            createStandardStreams: function() {
                if (Module["stdin"]) {
                    FS.createDevice("/dev", "stdin", Module["stdin"])
                } else {
                    FS.symlink("/dev/tty", "/dev/stdin")
                }
                if (Module["stdout"]) {
                    FS.createDevice("/dev", "stdout", null, Module["stdout"])
                } else {
                    FS.symlink("/dev/tty", "/dev/stdout")
                }
                if (Module["stderr"]) {
                    FS.createDevice("/dev", "stderr", null, Module["stderr"])
                } else {
                    FS.symlink("/dev/tty1", "/dev/stderr")
                }
                var stdin = FS.open("/dev/stdin", "r");
                var stdout = FS.open("/dev/stdout", "w");
                var stderr = FS.open("/dev/stderr", "w")
            },
            ensureErrnoError: function() {
                if (FS.ErrnoError) return;
                FS.ErrnoError = function ErrnoError(errno, node) {
                    this.node = node;
                    this.setErrno = function(errno) {
                        this.errno = errno
                    };
                    this.setErrno(errno);
                    this.message = "FS error"
                };
                FS.ErrnoError.prototype = new Error;
                FS.ErrnoError.prototype.constructor = FS.ErrnoError;
                [44].forEach(function(code) {
                    FS.genericErrors[code] = new FS.ErrnoError(code);
                    FS.genericErrors[code].stack = "<generic error, no stack>"
                })
            },
            staticInit: function() {
                FS.ensureErrnoError();
                FS.nameTable = new Array(4096);
                FS.mount(MEMFS, {}, "/");
                FS.createDefaultDirectories();
                FS.createDefaultDevices();
                FS.createSpecialDirectories();
                FS.filesystems = {
                    "MEMFS": MEMFS
                }
            },
            init: function(input, output, error) {
                FS.init.initialized = true;
                FS.ensureErrnoError();
                Module["stdin"] = input || Module["stdin"];
                Module["stdout"] = output || Module["stdout"];
                Module["stderr"] = error || Module["stderr"];
                FS.createStandardStreams()
            },
            quit: function() {
                FS.init.initialized = false;
                var fflush = Module["_fflush"];
                if (fflush) fflush(0);
                for (var i = 0; i < FS.streams.length; i++) {
                    var stream = FS.streams[i];
                    if (!stream) {
                        continue
                    }
                    FS.close(stream)
                }
            },
            getMode: function(canRead, canWrite) {
                var mode = 0;
                if (canRead) mode |= 292 | 73;
                if (canWrite) mode |= 146;
                return mode
            },
            joinPath: function(parts, forceRelative) {
                var path = PATH.join.apply(null, parts);
                if (forceRelative && path[0] == "/") path = path.substr(1);
                return path
            },
            absolutePath: function(relative, base) {
                return PATH_FS.resolve(base, relative)
            },
            standardizePath: function(path) {
                return PATH.normalize(path)
            },
            findObject: function(path, dontResolveLastLink) {
                var ret = FS.analyzePath(path, dontResolveLastLink);
                if (ret.exists) {
                    return ret.object
                } else {
                    ___setErrNo(ret.error);
                    return null
                }
            },
            analyzePath: function(path, dontResolveLastLink) {
                try {
                    var lookup = FS.lookupPath(path, {
                        follow: !dontResolveLastLink
                    });
                    path = lookup.path
                } catch (e) {}
                var ret = {
                    isRoot: false,
                    exists: false,
                    error: 0,
                    name: null,
                    path: null,
                    object: null,
                    parentExists: false,
                    parentPath: null,
                    parentObject: null
                };
                try {
                    var lookup = FS.lookupPath(path, {
                        parent: true
                    });
                    ret.parentExists = true;
                    ret.parentPath = lookup.path;
                    ret.parentObject = lookup.node;
                    ret.name = PATH.basename(path);
                    lookup = FS.lookupPath(path, {
                        follow: !dontResolveLastLink
                    });
                    ret.exists = true;
                    ret.path = lookup.path;
                    ret.object = lookup.node;
                    ret.name = lookup.node.name;
                    ret.isRoot = lookup.path === "/"
                } catch (e) {
                    ret.error = e.errno
                }
                return ret
            },
            createFolder: function(parent, name, canRead, canWrite) {
                var path = PATH.join2(typeof parent === "string" ? parent : FS.getPath(parent), name);
                var mode = FS.getMode(canRead, canWrite);
                return FS.mkdir(path, mode)
            },
            createPath: function(parent, path, canRead, canWrite) {
                parent = typeof parent === "string" ? parent : FS.getPath(parent);
                var parts = path.split("/").reverse();
                while (parts.length) {
                    var part = parts.pop();
                    if (!part) continue;
                    var current = PATH.join2(parent, part);
                    try {
                        FS.mkdir(current)
                    } catch (e) {}
                    parent = current
                }
                return current
            },
            createFile: function(parent, name, properties, canRead, canWrite) {
                var path = PATH.join2(typeof parent === "string" ? parent : FS.getPath(parent), name);
                var mode = FS.getMode(canRead, canWrite);
                return FS.create(path, mode)
            },
            createDataFile: function(parent, name, data, canRead, canWrite, canOwn) {
                var path = name ? PATH.join2(typeof parent === "string" ? parent : FS.getPath(parent), name) : parent;
                var mode = FS.getMode(canRead, canWrite);
                var node = FS.create(path, mode);
                if (data) {
                    if (typeof data === "string") {
                        var arr = new Array(data.length);
                        for (var i = 0, len = data.length; i < len; ++i) arr[i] = data.charCodeAt(i);
                        data = arr
                    }
                    FS.chmod(node, mode | 146);
                    var stream = FS.open(node, "w");
                    FS.write(stream, data, 0, data.length, 0, canOwn);
                    FS.close(stream);
                    FS.chmod(node, mode)
                }
                return node
            },
            createDevice: function(parent, name, input, output) {
                var path = PATH.join2(typeof parent === "string" ? parent : FS.getPath(parent), name);
                var mode = FS.getMode(!!input, !!output);
                if (!FS.createDevice.major) FS.createDevice.major = 64;
                var dev = FS.makedev(FS.createDevice.major++, 0);
                FS.registerDevice(dev, {
                    open: function(stream) {
                        stream.seekable = false
                    },
                    close: function(stream) {
                        if (output && output.buffer && output.buffer.length) {
                            output(10)
                        }
                    },
                    read: function(stream, buffer, offset, length, pos) {
                        var bytesRead = 0;
                        for (var i = 0; i < length; i++) {
                            var result;
                            try {
                                result = input()
                            } catch (e) {
                                throw new FS.ErrnoError(29)
                            }
                            if (result === undefined && bytesRead === 0) {
                                throw new FS.ErrnoError(6)
                            }
                            if (result === null || result === undefined) break;
                            bytesRead++;
                            buffer[offset + i] = result
                        }
                        if (bytesRead) {
                            stream.node.timestamp = Date.now()
                        }
                        return bytesRead
                    },
                    write: function(stream, buffer, offset, length, pos) {
                        for (var i = 0; i < length; i++) {
                            try {
                                output(buffer[offset + i])
                            } catch (e) {
                                throw new FS.ErrnoError(29)
                            }
                        }
                        if (length) {
                            stream.node.timestamp = Date.now()
                        }
                        return i
                    }
                });
                return FS.mkdev(path, mode, dev)
            },
            createLink: function(parent, name, target, canRead, canWrite) {
                var path = PATH.join2(typeof parent === "string" ? parent : FS.getPath(parent), name);
                return FS.symlink(target, path)
            },
            forceLoadFile: function(obj) {
                if (obj.isDevice || obj.isFolder || obj.link || obj.contents) return true;
                var success = true;
                if (typeof XMLHttpRequest !== "undefined") {
                    throw new Error("Lazy loading should have been performed (contents set) in createLazyFile, but it was not. Lazy loading only works in web workers. Use --embed-file or --preload-file in emcc on the main thread.")
                } else if (read_) {
                    try {
                        obj.contents = intArrayFromString(read_(obj.url), true);
                        obj.usedBytes = obj.contents.length
                    } catch (e) {
                        success = false
                    }
                } else {
                    throw new Error("Cannot load without read() or XMLHttpRequest.")
                }
                if (!success) ___setErrNo(29);
                return success
            },
            createLazyFile: function(parent, name, url, canRead, canWrite) {
                function LazyUint8Array() {
                    this.lengthKnown = false;
                    this.chunks = []
                }
                LazyUint8Array.prototype.get = function LazyUint8Array_get(idx) {
                    if (idx > this.length - 1 || idx < 0) {
                        return undefined
                    }
                    var chunkOffset = idx % this.chunkSize;
                    var chunkNum = idx / this.chunkSize | 0;
                    return this.getter(chunkNum)[chunkOffset]
                };
                LazyUint8Array.prototype.setDataGetter = function LazyUint8Array_setDataGetter(getter) {
                    this.getter = getter
                };
                LazyUint8Array.prototype.cacheLength = function LazyUint8Array_cacheLength() {
                    var xhr = new XMLHttpRequest;
                    xhr.open("HEAD", url, false);
                    xhr.send(null);
                    if (!(xhr.status >= 200 && xhr.status < 300 || xhr.status === 304)) throw new Error("Couldn't load " + url + ". Status: " + xhr.status);
                    var datalength = Number(xhr.getResponseHeader("Content-length"));
                    var header;
                    var hasByteServing = (header = xhr.getResponseHeader("Accept-Ranges")) && header === "bytes";
                    var usesGzip = (header = xhr.getResponseHeader("Content-Encoding")) && header === "gzip";
                    var chunkSize = 1024 * 1024;
                    if (!hasByteServing) chunkSize = datalength;
                    var doXHR = function(from, to) {
                        if (from > to) throw new Error("invalid range (" + from + ", " + to + ") or no bytes requested!");
                        if (to > datalength - 1) throw new Error("only " + datalength + " bytes available! programmer error!");
                        var xhr = new XMLHttpRequest;
                        xhr.open("GET", url, false);
                        if (datalength !== chunkSize) xhr.setRequestHeader("Range", "bytes=" + from + "-" + to);
                        if (typeof Uint8Array != "undefined") xhr.responseType = "arraybuffer";
                        if (xhr.overrideMimeType) {
                            xhr.overrideMimeType("text/plain; charset=x-user-defined")
                        }
                        xhr.send(null);
                        if (!(xhr.status >= 200 && xhr.status < 300 || xhr.status === 304)) throw new Error("Couldn't load " + url + ". Status: " + xhr.status);
                        if (xhr.response !== undefined) {
                            return new Uint8Array(xhr.response || [])
                        } else {
                            return intArrayFromString(xhr.responseText || "", true)
                        }
                    };
                    var lazyArray = this;
                    lazyArray.setDataGetter(function(chunkNum) {
                        var start = chunkNum * chunkSize;
                        var end = (chunkNum + 1) * chunkSize - 1;
                        end = Math.min(end, datalength - 1);
                        if (typeof lazyArray.chunks[chunkNum] === "undefined") {
                            lazyArray.chunks[chunkNum] = doXHR(start, end)
                        }
                        if (typeof lazyArray.chunks[chunkNum] === "undefined") throw new Error("doXHR failed!");
                        return lazyArray.chunks[chunkNum]
                    });
                    if (usesGzip || !datalength) {
                        chunkSize = datalength = 1;
                        datalength = this.getter(0).length;
                        chunkSize = datalength;
                        console.log("LazyFiles on gzip forces download of the whole file when length is accessed")
                    }
                    this._length = datalength;
                    this._chunkSize = chunkSize;
                    this.lengthKnown = true
                };
                if (typeof XMLHttpRequest !== "undefined") {
                    if (!ENVIRONMENT_IS_WORKER) throw "Cannot do synchronous binary XHRs outside webworkers in modern browsers. Use --embed-file or --preload-file in emcc";
                    var lazyArray = new LazyUint8Array;
                    Object.defineProperties(lazyArray, {
                        length: {
                            get: function() {
                                if (!this.lengthKnown) {
                                    this.cacheLength()
                                }
                                return this._length
                            }
                        },
                        chunkSize: {
                            get: function() {
                                if (!this.lengthKnown) {
                                    this.cacheLength()
                                }
                                return this._chunkSize
                            }
                        }
                    });
                    var properties = {
                        isDevice: false,
                        contents: lazyArray
                    }
                } else {
                    var properties = {
                        isDevice: false,
                        url: url
                    }
                }
                var node = FS.createFile(parent, name, properties, canRead, canWrite);
                if (properties.contents) {
                    node.contents = properties.contents
                } else if (properties.url) {
                    node.contents = null;
                    node.url = properties.url
                }
                Object.defineProperties(node, {
                    usedBytes: {
                        get: function() {
                            return this.contents.length
                        }
                    }
                });
                var stream_ops = {};
                var keys = Object.keys(node.stream_ops);
                keys.forEach(function(key) {
                    var fn = node.stream_ops[key];
                    stream_ops[key] = function forceLoadLazyFile() {
                        if (!FS.forceLoadFile(node)) {
                            throw new FS.ErrnoError(29)
                        }
                        return fn.apply(null, arguments)
                    }
                });
                stream_ops.read = function stream_ops_read(stream, buffer, offset, length, position) {
                    if (!FS.forceLoadFile(node)) {
                        throw new FS.ErrnoError(29)
                    }
                    var contents = stream.node.contents;
                    if (position >= contents.length) return 0;
                    var size = Math.min(contents.length - position, length);
                    if (contents.slice) {
                        for (var i = 0; i < size; i++) {
                            buffer[offset + i] = contents[position + i]
                        }
                    } else {
                        for (var i = 0; i < size; i++) {
                            buffer[offset + i] = contents.get(position + i)
                        }
                    }
                    return size
                };
                node.stream_ops = stream_ops;
                return node
            },
            createPreloadedFile: function(parent, name, url, canRead, canWrite, onload, onerror, dontCreateFile, canOwn, preFinish) {
                Browser.init();
                var fullname = name ? PATH_FS.resolve(PATH.join2(parent, name)) : parent;
                var dep = getUniqueRunDependency("cp " + fullname);

                function processData(byteArray) {
                    function finish(byteArray) {
                        if (preFinish) preFinish();
                        if (!dontCreateFile) {
                            FS.createDataFile(parent, name, byteArray, canRead, canWrite, canOwn)
                        }
                        if (onload) onload();
                        removeRunDependency(dep)
                    }
                    var handled = false;
                    Module["preloadPlugins"].forEach(function(plugin) {
                        if (handled) return;
                        if (plugin["canHandle"](fullname)) {
                            plugin["handle"](byteArray, fullname, finish, function() {
                                if (onerror) onerror();
                                removeRunDependency(dep)
                            });
                            handled = true
                        }
                    });
                    if (!handled) finish(byteArray)
                }
                addRunDependency(dep);
                if (typeof url == "string") {
                    Browser.asyncLoad(url, function(byteArray) {
                        processData(byteArray)
                    }, onerror)
                } else {
                    processData(url)
                }
            },
            indexedDB: function() {
                return window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB
            },
            DB_NAME: function() {
                return "EM_FS_" + window.location.pathname
            },
            DB_VERSION: 20,
            DB_STORE_NAME: "FILE_DATA",
            saveFilesToDB: function(paths, onload, onerror) {
                onload = onload || function() {};
                onerror = onerror || function() {};
                var indexedDB = FS.indexedDB();
                try {
                    var openRequest = indexedDB.open(FS.DB_NAME(), FS.DB_VERSION)
                } catch (e) {
                    return onerror(e)
                }
                openRequest.onupgradeneeded = function openRequest_onupgradeneeded() {
                    console.log("creating db");
                    var db = openRequest.result;
                    db.createObjectStore(FS.DB_STORE_NAME)
                };
                openRequest.onsuccess = function openRequest_onsuccess() {
                    var db = openRequest.result;
                    var transaction = db.transaction([FS.DB_STORE_NAME], "readwrite");
                    var files = transaction.objectStore(FS.DB_STORE_NAME);
                    var ok = 0,
                        fail = 0,
                        total = paths.length;

                    function finish() {
                        if (fail == 0) onload();
                        else onerror()
                    }
                    paths.forEach(function(path) {
                        var putRequest = files.put(FS.analyzePath(path).object.contents, path);
                        putRequest.onsuccess = function putRequest_onsuccess() {
                            ok++;
                            if (ok + fail == total) finish()
                        };
                        putRequest.onerror = function putRequest_onerror() {
                            fail++;
                            if (ok + fail == total) finish()
                        }
                    });
                    transaction.onerror = onerror
                };
                openRequest.onerror = onerror
            },
            loadFilesFromDB: function(paths, onload, onerror) {
                onload = onload || function() {};
                onerror = onerror || function() {};
                var indexedDB = FS.indexedDB();
                try {
                    var openRequest = indexedDB.open(FS.DB_NAME(), FS.DB_VERSION)
                } catch (e) {
                    return onerror(e)
                }
                openRequest.onupgradeneeded = onerror;
                openRequest.onsuccess = function openRequest_onsuccess() {
                    var db = openRequest.result;
                    try {
                        var transaction = db.transaction([FS.DB_STORE_NAME], "readonly")
                    } catch (e) {
                        onerror(e);
                        return
                    }
                    var files = transaction.objectStore(FS.DB_STORE_NAME);
                    var ok = 0,
                        fail = 0,
                        total = paths.length;

                    function finish() {
                        if (fail == 0) onload();
                        else onerror()
                    }
                    paths.forEach(function(path) {
                        var getRequest = files.get(path);
                        getRequest.onsuccess = function getRequest_onsuccess() {
                            if (FS.analyzePath(path).exists) {
                                FS.unlink(path)
                            }
                            FS.createDataFile(PATH.dirname(path), PATH.basename(path), getRequest.result, true, true, true);
                            ok++;
                            if (ok + fail == total) finish()
                        };
                        getRequest.onerror = function getRequest_onerror() {
                            fail++;
                            if (ok + fail == total) finish()
                        }
                    });
                    transaction.onerror = onerror
                };
                openRequest.onerror = onerror
            }
        };
        var SYSCALLS = {
            DEFAULT_POLLMASK: 5,
            mappings: {},
            umask: 511,
            calculateAt: function(dirfd, path) {
                if (path[0] !== "/") {
                    var dir;
                    if (dirfd === -100) {
                        dir = FS.cwd()
                    } else {
                        var dirstream = FS.getStream(dirfd);
                        if (!dirstream) throw new FS.ErrnoError(8);
                        dir = dirstream.path
                    }
                    path = PATH.join2(dir, path)
                }
                return path
            },
            doStat: function(func, path, buf) {
                try {
                    var stat = func(path)
                } catch (e) {
                    if (e && e.node && PATH.normalize(path) !== PATH.normalize(FS.getPath(e.node))) {
                        return -54
                    }
                    throw e
                }
                HEAP32[buf >> 2] = stat.dev;
                HEAP32[buf + 4 >> 2] = 0;
                HEAP32[buf + 8 >> 2] = stat.ino;
                HEAP32[buf + 12 >> 2] = stat.mode;
                HEAP32[buf + 16 >> 2] = stat.nlink;
                HEAP32[buf + 20 >> 2] = stat.uid;
                HEAP32[buf + 24 >> 2] = stat.gid;
                HEAP32[buf + 28 >> 2] = stat.rdev;
                HEAP32[buf + 32 >> 2] = 0;
                tempI64 = [stat.size >>> 0, (tempDouble = stat.size, +Math_abs(tempDouble) >= 1 ? tempDouble > 0 ? (Math_min(+Math_floor(tempDouble / 4294967296), 4294967295) | 0) >>> 0 : ~~+Math_ceil((tempDouble - +(~~tempDouble >>> 0)) / 4294967296) >>> 0 : 0)], HEAP32[buf + 40 >> 2] = tempI64[0], HEAP32[buf + 44 >> 2] = tempI64[1];
                HEAP32[buf + 48 >> 2] = 4096;
                HEAP32[buf + 52 >> 2] = stat.blocks;
                HEAP32[buf + 56 >> 2] = stat.atime.getTime() / 1e3 | 0;
                HEAP32[buf + 60 >> 2] = 0;
                HEAP32[buf + 64 >> 2] = stat.mtime.getTime() / 1e3 | 0;
                HEAP32[buf + 68 >> 2] = 0;
                HEAP32[buf + 72 >> 2] = stat.ctime.getTime() / 1e3 | 0;
                HEAP32[buf + 76 >> 2] = 0;
                tempI64 = [stat.ino >>> 0, (tempDouble = stat.ino, +Math_abs(tempDouble) >= 1 ? tempDouble > 0 ? (Math_min(+Math_floor(tempDouble / 4294967296), 4294967295) | 0) >>> 0 : ~~+Math_ceil((tempDouble - +(~~tempDouble >>> 0)) / 4294967296) >>> 0 : 0)], HEAP32[buf + 80 >> 2] = tempI64[0], HEAP32[buf + 84 >> 2] = tempI64[1];
                return 0
            },
            doMsync: function(addr, stream, len, flags) {
                var buffer = new Uint8Array(HEAPU8.subarray(addr, addr + len));
                FS.msync(stream, buffer, 0, len, flags)
            },
            doMkdir: function(path, mode) {
                path = PATH.normalize(path);
                if (path[path.length - 1] === "/") path = path.substr(0, path.length - 1);
                FS.mkdir(path, mode, 0);
                return 0
            },
            doMknod: function(path, mode, dev) {
                switch (mode & 61440) {
                    case 32768:
                    case 8192:
                    case 24576:
                    case 4096:
                    case 49152:
                        break;
                    default:
                        return -28
                }
                FS.mknod(path, mode, dev);
                return 0
            },
            doReadlink: function(path, buf, bufsize) {
                if (bufsize <= 0) return -28;
                var ret = FS.readlink(path);
                var len = Math.min(bufsize, lengthBytesUTF8(ret));
                var endChar = HEAP8[buf + len];
                stringToUTF8(ret, buf, bufsize + 1);
                HEAP8[buf + len] = endChar;
                return len
            },
            doAccess: function(path, amode) {
                if (amode & ~7) {
                    return -28
                }
                var node;
                var lookup = FS.lookupPath(path, {
                    follow: true
                });
                node = lookup.node;
                if (!node) {
                    return -44
                }
                var perms = "";
                if (amode & 4) perms += "r";
                if (amode & 2) perms += "w";
                if (amode & 1) perms += "x";
                if (perms && FS.nodePermissions(node, perms)) {
                    return -2
                }
                return 0
            },
            doDup: function(path, flags, suggestFD) {
                var suggest = FS.getStream(suggestFD);
                if (suggest) FS.close(suggest);
                return FS.open(path, flags, 0, suggestFD, suggestFD).fd
            },
            doReadv: function(stream, iov, iovcnt, offset) {
                var ret = 0;
                for (var i = 0; i < iovcnt; i++) {
                    var ptr = HEAP32[iov + i * 8 >> 2];
                    var len = HEAP32[iov + (i * 8 + 4) >> 2];
                    var curr = FS.read(stream, HEAP8, ptr, len, offset);
                    if (curr < 0) return -1;
                    ret += curr;
                    if (curr < len) break
                }
                return ret
            },
            doWritev: function(stream, iov, iovcnt, offset) {
                var ret = 0;
                for (var i = 0; i < iovcnt; i++) {
                    var ptr = HEAP32[iov + i * 8 >> 2];
                    var len = HEAP32[iov + (i * 8 + 4) >> 2];
                    var curr = FS.write(stream, HEAP8, ptr, len, offset);
                    if (curr < 0) return -1;
                    ret += curr
                }
                return ret
            },
            varargs: 0,
            get: function(varargs) {
                SYSCALLS.varargs += 4;
                var ret = HEAP32[SYSCALLS.varargs - 4 >> 2];
                return ret
            },
            getStr: function() {
                var ret = UTF8ToString(SYSCALLS.get());
                return ret
            },
            getStreamFromFD: function(fd) {
                if (fd === undefined) fd = SYSCALLS.get();
                var stream = FS.getStream(fd);
                if (!stream) throw new FS.ErrnoError(8);
                return stream
            },
            get64: function() {
                var low = SYSCALLS.get(),
                    high = SYSCALLS.get();
                return low
            },
            getZero: function() {
                SYSCALLS.get()
            }
        };

        function ___syscall10(which, varargs) {
            SYSCALLS.varargs = varargs;
            try {
                var path = SYSCALLS.getStr();
                FS.unlink(path);
                return 0
            } catch (e) {
                if (typeof FS === "undefined" || !(e instanceof FS.ErrnoError)) abort(e);
                return -e.errno
            }
        }
        var ERRNO_CODES = {
            EPERM: 63,
            ENOENT: 44,
            ESRCH: 71,
            EINTR: 27,
            EIO: 29,
            ENXIO: 60,
            E2BIG: 1,
            ENOEXEC: 45,
            EBADF: 8,
            ECHILD: 12,
            EAGAIN: 6,
            EWOULDBLOCK: 6,
            ENOMEM: 48,
            EACCES: 2,
            EFAULT: 21,
            ENOTBLK: 105,
            EBUSY: 10,
            EEXIST: 20,
            EXDEV: 75,
            ENODEV: 43,
            ENOTDIR: 54,
            EISDIR: 31,
            EINVAL: 28,
            ENFILE: 41,
            EMFILE: 33,
            ENOTTY: 59,
            ETXTBSY: 74,
            EFBIG: 22,
            ENOSPC: 51,
            ESPIPE: 70,
            EROFS: 69,
            EMLINK: 34,
            EPIPE: 64,
            EDOM: 18,
            ERANGE: 68,
            ENOMSG: 49,
            EIDRM: 24,
            ECHRNG: 106,
            EL2NSYNC: 156,
            EL3HLT: 107,
            EL3RST: 108,
            ELNRNG: 109,
            EUNATCH: 110,
            ENOCSI: 111,
            EL2HLT: 112,
            EDEADLK: 16,
            ENOLCK: 46,
            EBADE: 113,
            EBADR: 114,
            EXFULL: 115,
            ENOANO: 104,
            EBADRQC: 103,
            EBADSLT: 102,
            EDEADLOCK: 16,
            EBFONT: 101,
            ENOSTR: 100,
            ENODATA: 116,
            ETIME: 117,
            ENOSR: 118,
            ENONET: 119,
            ENOPKG: 120,
            EREMOTE: 121,
            ENOLINK: 47,
            EADV: 122,
            ESRMNT: 123,
            ECOMM: 124,
            EPROTO: 65,
            EMULTIHOP: 36,
            EDOTDOT: 125,
            EBADMSG: 9,
            ENOTUNIQ: 126,
            EBADFD: 127,
            EREMCHG: 128,
            ELIBACC: 129,
            ELIBBAD: 130,
            ELIBSCN: 131,
            ELIBMAX: 132,
            ELIBEXEC: 133,
            ENOSYS: 52,
            ENOTEMPTY: 55,
            ENAMETOOLONG: 37,
            ELOOP: 32,
            EOPNOTSUPP: 138,
            EPFNOSUPPORT: 139,
            ECONNRESET: 15,
            ENOBUFS: 42,
            EAFNOSUPPORT: 5,
            EPROTOTYPE: 67,
            ENOTSOCK: 57,
            ENOPROTOOPT: 50,
            ESHUTDOWN: 140,
            ECONNREFUSED: 14,
            EADDRINUSE: 3,
            ECONNABORTED: 13,
            ENETUNREACH: 40,
            ENETDOWN: 38,
            ETIMEDOUT: 73,
            EHOSTDOWN: 142,
            EHOSTUNREACH: 23,
            EINPROGRESS: 26,
            EALREADY: 7,
            EDESTADDRREQ: 17,
            EMSGSIZE: 35,
            EPROTONOSUPPORT: 66,
            ESOCKTNOSUPPORT: 137,
            EADDRNOTAVAIL: 4,
            ENETRESET: 39,
            EISCONN: 30,
            ENOTCONN: 53,
            ETOOMANYREFS: 141,
            EUSERS: 136,
            EDQUOT: 19,
            ESTALE: 72,
            ENOTSUP: 138,
            ENOMEDIUM: 148,
            EILSEQ: 25,
            EOVERFLOW: 61,
            ECANCELED: 11,
            ENOTRECOVERABLE: 56,
            EOWNERDEAD: 62,
            ESTRPIPE: 135
        };
        var SOCKFS = {
            mount: function(mount) {
                Module["websocket"] = Module["websocket"] && "object" === typeof Module["websocket"] ? Module["websocket"] : {};
                Module["websocket"]._callbacks = {};
                Module["websocket"]["on"] = function(event, callback) {
                    if ("function" === typeof callback) {
                        this._callbacks[event] = callback
                    }
                    return this
                };
                Module["websocket"].emit = function(event, param) {
                    if ("function" === typeof this._callbacks[event]) {
                        this._callbacks[event].call(this, param)
                    }
                };
                return FS.createNode(null, "/", 16384 | 511, 0)
            },
            createSocket: function(family, type, protocol) {
                var streaming = type == 1;
                if (protocol) {
                    assert(streaming == (protocol == 6))
                }
                var sock = {
                    family: family,
                    type: type,
                    protocol: protocol,
                    server: null,
                    error: null,
                    peers: {},
                    pending: [],
                    recv_queue: [],
                    sock_ops: SOCKFS.websocket_sock_ops
                };
                var name = SOCKFS.nextname();
                var node = FS.createNode(SOCKFS.root, name, 49152, 0);
                node.sock = sock;
                var stream = FS.createStream({
                    path: name,
                    node: node,
                    flags: FS.modeStringToFlags("r+"),
                    seekable: false,
                    stream_ops: SOCKFS.stream_ops
                });
                sock.stream = stream;
                return sock
            },
            getSocket: function(fd) {
                var stream = FS.getStream(fd);
                if (!stream || !FS.isSocket(stream.node.mode)) {
                    return null
                }
                return stream.node.sock
            },
            stream_ops: {
                poll: function(stream) {
                    var sock = stream.node.sock;
                    return sock.sock_ops.poll(sock)
                },
                ioctl: function(stream, request, varargs) {
                    var sock = stream.node.sock;
                    return sock.sock_ops.ioctl(sock, request, varargs)
                },
                read: function(stream, buffer, offset, length, position) {
                    var sock = stream.node.sock;
                    var msg = sock.sock_ops.recvmsg(sock, length);
                    if (!msg) {
                        return 0
                    }
                    buffer.set(msg.buffer, offset);
                    return msg.buffer.length
                },
                write: function(stream, buffer, offset, length, position) {
                    var sock = stream.node.sock;
                    return sock.sock_ops.sendmsg(sock, buffer, offset, length)
                },
                close: function(stream) {
                    var sock = stream.node.sock;
                    sock.sock_ops.close(sock)
                }
            },
            nextname: function() {
                if (!SOCKFS.nextname.current) {
                    SOCKFS.nextname.current = 0
                }
                return "socket[" + SOCKFS.nextname.current++ + "]"
            },
            websocket_sock_ops: {
                createPeer: function(sock, addr, port) {
                    var ws;
                    if (typeof addr === "object") {
                        ws = addr;
                        addr = null;
                        port = null
                    }
                    if (ws) {
                        if (ws._socket) {
                            addr = ws._socket.remoteAddress;
                            port = ws._socket.remotePort
                        } else {
                            var result = /ws[s]?:\/\/([^:]+):(\d+)/.exec(ws.url);
                            if (!result) {
                                throw new Error("WebSocket URL must be in the format ws(s)://address:port")
                            }
                            addr = result[1];
                            port = parseInt(result[2], 10)
                        }
                    } else {
                        try {
                            var runtimeConfig = Module["websocket"] && "object" === typeof Module["websocket"];
                            var url = "ws:#".replace("#", "//");
                            if (runtimeConfig) {
                                if ("string" === typeof Module["websocket"]["url"]) {
                                    url = Module["websocket"]["url"]
                                }
                            }
                            if (url === "ws://" || url === "wss://") {
                                var parts = addr.split("/");
                                url = url + parts[0] + ":" + port + "/" + parts.slice(1).join("/")
                            }
                            var subProtocols = "binary";
                            if (runtimeConfig) {
                                if ("string" === typeof Module["websocket"]["subprotocol"]) {
                                    subProtocols = Module["websocket"]["subprotocol"]
                                }
                            }
                            var opts = undefined;
                            if (subProtocols !== "null") {
                                subProtocols = subProtocols.replace(/^ +| +$/g, "").split(/ *, */);
                                opts = ENVIRONMENT_IS_NODE ? {
                                    "protocol": subProtocols.toString()
                                } : subProtocols
                            }
                            if (runtimeConfig && null === Module["websocket"]["subprotocol"]) {
                                subProtocols = "null";
                                opts = undefined
                            }
                            var WebSocketConstructor;
                            if (ENVIRONMENT_IS_WEB) {
                                WebSocketConstructor = window["WebSocket"]
                            } else {
                                WebSocketConstructor = WebSocket
                            }
                            ws = new WebSocketConstructor(url, opts);
                            ws.binaryType = "arraybuffer"
                        } catch (e) {
                            throw new FS.ErrnoError(ERRNO_CODES.EHOSTUNREACH)
                        }
                    }
                    var peer = {
                        addr: addr,
                        port: port,
                        socket: ws,
                        dgram_send_queue: []
                    };
                    SOCKFS.websocket_sock_ops.addPeer(sock, peer);
                    SOCKFS.websocket_sock_ops.handlePeerEvents(sock, peer);
                    if (sock.type === 2 && typeof sock.sport !== "undefined") {
                        peer.dgram_send_queue.push(new Uint8Array([255, 255, 255, 255, "p".charCodeAt(0), "o".charCodeAt(0), "r".charCodeAt(0), "t".charCodeAt(0), (sock.sport & 65280) >> 8, sock.sport & 255]))
                    }
                    return peer
                },
                getPeer: function(sock, addr, port) {
                    return sock.peers[addr + ":" + port]
                },
                addPeer: function(sock, peer) {
                    sock.peers[peer.addr + ":" + peer.port] = peer
                },
                removePeer: function(sock, peer) {
                    delete sock.peers[peer.addr + ":" + peer.port]
                },
                handlePeerEvents: function(sock, peer) {
                    var first = true;
                    var handleOpen = function() {
                        Module["websocket"].emit("open", sock.stream.fd);
                        try {
                            var queued = peer.dgram_send_queue.shift();
                            while (queued) {
                                peer.socket.send(queued);
                                queued = peer.dgram_send_queue.shift()
                            }
                        } catch (e) {
                            peer.socket.close()
                        }
                    };

                    function handleMessage(data) {
                        if (typeof data === "string") {
                            var encoder = new TextEncoder;
                            data = encoder.encode(data)
                        } else {
                            assert(data.byteLength !== undefined);
                            if (data.byteLength == 0) {
                                return
                            } else {
                                data = new Uint8Array(data)
                            }
                        }
                        var wasfirst = first;
                        first = false;
                        if (wasfirst && data.length === 10 && data[0] === 255 && data[1] === 255 && data[2] === 255 && data[3] === 255 && data[4] === "p".charCodeAt(0) && data[5] === "o".charCodeAt(0) && data[6] === "r".charCodeAt(0) && data[7] === "t".charCodeAt(0)) {
                            var newport = data[8] << 8 | data[9];
                            SOCKFS.websocket_sock_ops.removePeer(sock, peer);
                            peer.port = newport;
                            SOCKFS.websocket_sock_ops.addPeer(sock, peer);
                            return
                        }
                        sock.recv_queue.push({
                            addr: peer.addr,
                            port: peer.port,
                            data: data
                        });
                        Module["websocket"].emit("message", sock.stream.fd)
                    }
                    if (ENVIRONMENT_IS_NODE) {
                        peer.socket.on("open", handleOpen);
                        peer.socket.on("message", function(data, flags) {
                            if (!flags.binary) {
                                return
                            }
                            handleMessage(new Uint8Array(data).buffer)
                        });
                        peer.socket.on("close", function() {
                            Module["websocket"].emit("close", sock.stream.fd)
                        });
                        peer.socket.on("error", function(error) {
                            sock.error = ERRNO_CODES.ECONNREFUSED;
                            Module["websocket"].emit("error", [sock.stream.fd, sock.error, "ECONNREFUSED: Connection refused"])
                        })
                    } else {
                        peer.socket.onopen = handleOpen;
                        peer.socket.onclose = function() {
                            Module["websocket"].emit("close", sock.stream.fd)
                        };
                        peer.socket.onmessage = function peer_socket_onmessage(event) {
                            handleMessage(event.data)
                        };
                        peer.socket.onerror = function(error) {
                            sock.error = ERRNO_CODES.ECONNREFUSED;
                            Module["websocket"].emit("error", [sock.stream.fd, sock.error, "ECONNREFUSED: Connection refused"])
                        }
                    }
                },
                poll: function(sock) {
                    if (sock.type === 1 && sock.server) {
                        return sock.pending.length ? 64 | 1 : 0
                    }
                    var mask = 0;
                    var dest = sock.type === 1 ? SOCKFS.websocket_sock_ops.getPeer(sock, sock.daddr, sock.dport) : null;
                    if (sock.recv_queue.length || !dest || dest && dest.socket.readyState === dest.socket.CLOSING || dest && dest.socket.readyState === dest.socket.CLOSED) {
                        mask |= 64 | 1
                    }
                    if (!dest || dest && dest.socket.readyState === dest.socket.OPEN) {
                        mask |= 4
                    }
                    if (dest && dest.socket.readyState === dest.socket.CLOSING || dest && dest.socket.readyState === dest.socket.CLOSED) {
                        mask |= 16
                    }
                    return mask
                },
                ioctl: function(sock, request, arg) {
                    switch (request) {
                        case 21531:
                            var bytes = 0;
                            if (sock.recv_queue.length) {
                                bytes = sock.recv_queue[0].data.length
                            }
                            HEAP32[arg >> 2] = bytes;
                            return 0;
                        default:
                            return ERRNO_CODES.EINVAL
                    }
                },
                close: function(sock) {
                    if (sock.server) {
                        try {
                            sock.server.close()
                        } catch (e) {}
                        sock.server = null
                    }
                    var peers = Object.keys(sock.peers);
                    for (var i = 0; i < peers.length; i++) {
                        var peer = sock.peers[peers[i]];
                        try {
                            peer.socket.close()
                        } catch (e) {}
                        SOCKFS.websocket_sock_ops.removePeer(sock, peer)
                    }
                    return 0
                },
                bind: function(sock, addr, port) {
                    if (typeof sock.saddr !== "undefined" || typeof sock.sport !== "undefined") {
                        throw new FS.ErrnoError(ERRNO_CODES.EINVAL)
                    }
                    sock.saddr = addr;
                    sock.sport = port;
                    if (sock.type === 2) {
                        if (sock.server) {
                            sock.server.close();
                            sock.server = null
                        }
                        try {
                            sock.sock_ops.listen(sock, 0)
                        } catch (e) {
                            if (!(e instanceof FS.ErrnoError)) throw e;
                            if (e.errno !== ERRNO_CODES.EOPNOTSUPP) throw e
                        }
                    }
                },
                connect: function(sock, addr, port) {
                    if (sock.server) {
                        throw new FS.ErrnoError(ERRNO_CODES.EOPNOTSUPP)
                    }
                    if (typeof sock.daddr !== "undefined" && typeof sock.dport !== "undefined") {
                        var dest = SOCKFS.websocket_sock_ops.getPeer(sock, sock.daddr, sock.dport);
                        if (dest) {
                            if (dest.socket.readyState === dest.socket.CONNECTING) {
                                throw new FS.ErrnoError(ERRNO_CODES.EALREADY)
                            } else {
                                throw new FS.ErrnoError(ERRNO_CODES.EISCONN)
                            }
                        }
                    }
                    var peer = SOCKFS.websocket_sock_ops.createPeer(sock, addr, port);
                    sock.daddr = peer.addr;
                    sock.dport = peer.port;
                    throw new FS.ErrnoError(ERRNO_CODES.EINPROGRESS)
                },
                listen: function(sock, backlog) {
                    if (!ENVIRONMENT_IS_NODE) {
                        throw new FS.ErrnoError(ERRNO_CODES.EOPNOTSUPP)
                    }
                },
                accept: function(listensock) {
                    if (!listensock.server) {
                        throw new FS.ErrnoError(ERRNO_CODES.EINVAL)
                    }
                    var newsock = listensock.pending.shift();
                    newsock.stream.flags = listensock.stream.flags;
                    return newsock
                },
                getname: function(sock, peer) {
                    var addr, port;
                    if (peer) {
                        if (sock.daddr === undefined || sock.dport === undefined) {
                            throw new FS.ErrnoError(ERRNO_CODES.ENOTCONN)
                        }
                        addr = sock.daddr;
                        port = sock.dport
                    } else {
                        addr = sock.saddr || 0;
                        port = sock.sport || 0
                    }
                    return {
                        addr: addr,
                        port: port
                    }
                },
                sendmsg: function(sock, buffer, offset, length, addr, port) {
                    if (sock.type === 2) {
                        if (addr === undefined || port === undefined) {
                            addr = sock.daddr;
                            port = sock.dport
                        }
                        if (addr === undefined || port === undefined) {
                            throw new FS.ErrnoError(ERRNO_CODES.EDESTADDRREQ)
                        }
                    } else {
                        addr = sock.daddr;
                        port = sock.dport
                    }
                    var dest = SOCKFS.websocket_sock_ops.getPeer(sock, addr, port);
                    if (sock.type === 1) {
                        if (!dest || dest.socket.readyState === dest.socket.CLOSING || dest.socket.readyState === dest.socket.CLOSED) {
                            throw new FS.ErrnoError(ERRNO_CODES.ENOTCONN)
                        } else if (dest.socket.readyState === dest.socket.CONNECTING) {
                            throw new FS.ErrnoError(ERRNO_CODES.EAGAIN)
                        }
                    }
                    if (ArrayBuffer.isView(buffer)) {
                        offset += buffer.byteOffset;
                        buffer = buffer.buffer
                    }
                    var data;
                    data = buffer.slice(offset, offset + length);
                    if (sock.type === 2) {
                        if (!dest || dest.socket.readyState !== dest.socket.OPEN) {
                            if (!dest || dest.socket.readyState === dest.socket.CLOSING || dest.socket.readyState === dest.socket.CLOSED) {
                                dest = SOCKFS.websocket_sock_ops.createPeer(sock, addr, port)
                            }
                            dest.dgram_send_queue.push(data);
                            return length
                        }
                    }
                    try {
                        dest.socket.send(data);
                        return length
                    } catch (e) {
                        throw new FS.ErrnoError(ERRNO_CODES.EINVAL)
                    }
                },
                recvmsg: function(sock, length) {
                    if (sock.type === 1 && sock.server) {
                        throw new FS.ErrnoError(ERRNO_CODES.ENOTCONN)
                    }
                    var queued = sock.recv_queue.shift();
                    if (!queued) {
                        if (sock.type === 1) {
                            var dest = SOCKFS.websocket_sock_ops.getPeer(sock, sock.daddr, sock.dport);
                            if (!dest) {
                                throw new FS.ErrnoError(ERRNO_CODES.ENOTCONN)
                            } else if (dest.socket.readyState === dest.socket.CLOSING || dest.socket.readyState === dest.socket.CLOSED) {
                                return null
                            } else {
                                throw new FS.ErrnoError(ERRNO_CODES.EAGAIN)
                            }
                        } else {
                            throw new FS.ErrnoError(ERRNO_CODES.EAGAIN)
                        }
                    }
                    var queuedLength = queued.data.byteLength || queued.data.length;
                    var queuedOffset = queued.data.byteOffset || 0;
                    var queuedBuffer = queued.data.buffer || queued.data;
                    var bytesRead = Math.min(length, queuedLength);
                    var res = {
                        buffer: new Uint8Array(queuedBuffer, queuedOffset, bytesRead),
                        addr: queued.addr,
                        port: queued.port
                    };
                    if (sock.type === 1 && bytesRead < queuedLength) {
                        var bytesRemaining = queuedLength - bytesRead;
                        queued.data = new Uint8Array(queuedBuffer, queuedOffset + bytesRead, bytesRemaining);
                        sock.recv_queue.unshift(queued)
                    }
                    return res
                }
            }
        };

        function __inet_pton4_raw(str) {
            var b = str.split(".");
            for (var i = 0; i < 4; i++) {
                var tmp = Number(b[i]);
                if (isNaN(tmp)) return null;
                b[i] = tmp
            }
            return (b[0] | b[1] << 8 | b[2] << 16 | b[3] << 24) >>> 0
        }

        function __inet_pton6_raw(str) {
            var words;
            var w, offset, z;
            var valid6regx = /^((?=.*::)(?!.*::.+::)(::)?([\dA-F]{1,4}:(:|\b)|){5}|([\dA-F]{1,4}:){6})((([\dA-F]{1,4}((?!\3)::|:\b|$))|(?!\2\3)){2}|(((2[0-4]|1\d|[1-9])?\d|25[0-5])\.?\b){4})$/i;
            var parts = [];
            if (!valid6regx.test(str)) {
                return null
            }
            if (str === "::") {
                return [0, 0, 0, 0, 0, 0, 0, 0]
            }
            if (str.indexOf("::") === 0) {
                str = str.replace("::", "Z:")
            } else {
                str = str.replace("::", ":Z:")
            }
            if (str.indexOf(".") > 0) {
                str = str.replace(new RegExp("[.]", "g"), ":");
                words = str.split(":");
                words[words.length - 4] = parseInt(words[words.length - 4]) + parseInt(words[words.length - 3]) * 256;
                words[words.length - 3] = parseInt(words[words.length - 2]) + parseInt(words[words.length - 1]) * 256;
                words = words.slice(0, words.length - 2)
            } else {
                words = str.split(":")
            }
            offset = 0;
            z = 0;
            for (w = 0; w < words.length; w++) {
                if (typeof words[w] === "string") {
                    if (words[w] === "Z") {
                        for (z = 0; z < 8 - words.length + 1; z++) {
                            parts[w + z] = 0
                        }
                        offset = z - 1
                    } else {
                        parts[w + offset] = _htons(parseInt(words[w], 16))
                    }
                } else {
                    parts[w + offset] = words[w]
                }
            }
            return [parts[1] << 16 | parts[0], parts[3] << 16 | parts[2], parts[5] << 16 | parts[4], parts[7] << 16 | parts[6]]
        }
        var DNS = {
            address_map: {
                id: 1,
                addrs: {},
                names: {}
            },
            lookup_name: function(name) {
                var res = __inet_pton4_raw(name);
                if (res !== null) {
                    return name
                }
                res = __inet_pton6_raw(name);
                if (res !== null) {
                    return name
                }
                var addr;
                if (DNS.address_map.addrs[name]) {
                    addr = DNS.address_map.addrs[name]
                } else {
                    var id = DNS.address_map.id++;
                    assert(id < 65535, "exceeded max address mappings of 65535");
                    addr = "172.29." + (id & 255) + "." + (id & 65280);
                    DNS.address_map.names[addr] = name;
                    DNS.address_map.addrs[name] = addr
                }
                return addr
            },
            lookup_addr: function(addr) {
                if (DNS.address_map.names[addr]) {
                    return DNS.address_map.names[addr]
                }
                return null
            }
        };

        function __inet_ntop4_raw(addr) {
            return (addr & 255) + "." + (addr >> 8 & 255) + "." + (addr >> 16 & 255) + "." + (addr >> 24 & 255)
        }

        function __inet_ntop6_raw(ints) {
            var str = "";
            var word = 0;
            var longest = 0;
            var lastzero = 0;
            var zstart = 0;
            var len = 0;
            var i = 0;
            var parts = [ints[0] & 65535, ints[0] >> 16, ints[1] & 65535, ints[1] >> 16, ints[2] & 65535, ints[2] >> 16, ints[3] & 65535, ints[3] >> 16];
            var hasipv4 = true;
            var v4part = "";
            for (i = 0; i < 5; i++) {
                if (parts[i] !== 0) {
                    hasipv4 = false;
                    break
                }
            }
            if (hasipv4) {
                v4part = __inet_ntop4_raw(parts[6] | parts[7] << 16);
                if (parts[5] === -1) {
                    str = "::ffff:";
                    str += v4part;
                    return str
                }
                if (parts[5] === 0) {
                    str = "::";
                    if (v4part === "0.0.0.0") v4part = "";
                    if (v4part === "0.0.0.1") v4part = "1";
                    str += v4part;
                    return str
                }
            }
            for (word = 0; word < 8; word++) {
                if (parts[word] === 0) {
                    if (word - lastzero > 1) {
                        len = 0
                    }
                    lastzero = word;
                    len++
                }
                if (len > longest) {
                    longest = len;
                    zstart = word - longest + 1
                }
            }
            for (word = 0; word < 8; word++) {
                if (longest > 1) {
                    if (parts[word] === 0 && word >= zstart && word < zstart + longest) {
                        if (word === zstart) {
                            str += ":";
                            if (zstart === 0) str += ":"
                        }
                        continue
                    }
                }
                str += Number(_ntohs(parts[word] & 65535)).toString(16);
                str += word < 7 ? ":" : ""
            }
            return str
        }

        function __read_sockaddr(sa, salen) {
            var family = HEAP16[sa >> 1];
            var port = _ntohs(HEAPU16[sa + 2 >> 1]);
            var addr;
            switch (family) {
                case 2:
                    if (salen !== 16) {
                        return {
                            errno: 28
                        }
                    }
                    addr = HEAP32[sa + 4 >> 2];
                    addr = __inet_ntop4_raw(addr);
                    break;
                case 10:
                    if (salen !== 28) {
                        return {
                            errno: 28
                        }
                    }
                    addr = [HEAP32[sa + 8 >> 2], HEAP32[sa + 12 >> 2], HEAP32[sa + 16 >> 2], HEAP32[sa + 20 >> 2]];
                    addr = __inet_ntop6_raw(addr);
                    break;
                default:
                    return {
                        errno: 5
                    }
            }
            return {
                family: family,
                addr: addr,
                port: port
            }
        }

        function __write_sockaddr(sa, family, addr, port) {
            switch (family) {
                case 2:
                    addr = __inet_pton4_raw(addr);
                    HEAP16[sa >> 1] = family;
                    HEAP32[sa + 4 >> 2] = addr;
                    HEAP16[sa + 2 >> 1] = _htons(port);
                    break;
                case 10:
                    addr = __inet_pton6_raw(addr);
                    HEAP32[sa >> 2] = family;
                    HEAP32[sa + 8 >> 2] = addr[0];
                    HEAP32[sa + 12 >> 2] = addr[1];
                    HEAP32[sa + 16 >> 2] = addr[2];
                    HEAP32[sa + 20 >> 2] = addr[3];
                    HEAP16[sa + 2 >> 1] = _htons(port);
                    HEAP32[sa + 4 >> 2] = 0;
                    HEAP32[sa + 24 >> 2] = 0;
                    break;
                default:
                    return {
                        errno: 5
                    }
            }
            return {}
        }

        function ___syscall102(which, varargs) {
            SYSCALLS.varargs = varargs;
            try {
                var call = SYSCALLS.get(),
                    socketvararg = SYSCALLS.get();
                SYSCALLS.varargs = socketvararg;
                var getSocketFromFD = function() {
                    var socket = SOCKFS.getSocket(SYSCALLS.get());
                    if (!socket) throw new FS.ErrnoError(8);
                    return socket
                };
                var getSocketAddress = function(allowNull) {
                    var addrp = SYSCALLS.get(),
                        addrlen = SYSCALLS.get();
                    if (allowNull && addrp === 0) return null;
                    var info = __read_sockaddr(addrp, addrlen);
                    if (info.errno) throw new FS.ErrnoError(info.errno);
                    info.addr = DNS.lookup_addr(info.addr) || info.addr;
                    return info
                };
                switch (call) {
                    case 1:
                        {
                            var domain = SYSCALLS.get(),
                                type = SYSCALLS.get(),
                                protocol = SYSCALLS.get();
                            var sock = SOCKFS.createSocket(domain, type, protocol);
                            return sock.stream.fd
                        }
                    case 2:
                        {
                            var sock = getSocketFromFD(),
                                info = getSocketAddress();sock.sock_ops.bind(sock, info.addr, info.port);
                            return 0
                        }
                    case 3:
                        {
                            var sock = getSocketFromFD(),
                                info = getSocketAddress();sock.sock_ops.connect(sock, info.addr, info.port);
                            return 0
                        }
                    case 4:
                        {
                            var sock = getSocketFromFD(),
                                backlog = SYSCALLS.get();sock.sock_ops.listen(sock, backlog);
                            return 0
                        }
                    case 5:
                        {
                            var sock = getSocketFromFD(),
                                addr = SYSCALLS.get(),
                                addrlen = SYSCALLS.get();
                            var newsock = sock.sock_ops.accept(sock);
                            if (addr) {
                                var res = __write_sockaddr(addr, newsock.family, DNS.lookup_name(newsock.daddr), newsock.dport)
                            }
                            return newsock.stream.fd
                        }
                    case 6:
                        {
                            var sock = getSocketFromFD(),
                                addr = SYSCALLS.get(),
                                addrlen = SYSCALLS.get();
                            var res = __write_sockaddr(addr, sock.family, DNS.lookup_name(sock.saddr || "0.0.0.0"), sock.sport);
                            return 0
                        }
                    case 7:
                        {
                            var sock = getSocketFromFD(),
                                addr = SYSCALLS.get(),
                                addrlen = SYSCALLS.get();
                            if (!sock.daddr) {
                                return -53
                            }
                            var res = __write_sockaddr(addr, sock.family, DNS.lookup_name(sock.daddr), sock.dport);
                            return 0
                        }
                    case 11:
                        {
                            var sock = getSocketFromFD(),
                                message = SYSCALLS.get(),
                                length = SYSCALLS.get(),
                                flags = SYSCALLS.get(),
                                dest = getSocketAddress(true);
                            if (!dest) {
                                return FS.write(sock.stream, HEAP8, message, length)
                            } else {
                                return sock.sock_ops.sendmsg(sock, HEAP8, message, length, dest.addr, dest.port)
                            }
                        }
                    case 12:
                        {
                            var sock = getSocketFromFD(),
                                buf = SYSCALLS.get(),
                                len = SYSCALLS.get(),
                                flags = SYSCALLS.get(),
                                addr = SYSCALLS.get(),
                                addrlen = SYSCALLS.get();
                            var msg = sock.sock_ops.recvmsg(sock, len);
                            if (!msg) return 0;
                            if (addr) {
                                var res = __write_sockaddr(addr, sock.family, DNS.lookup_name(msg.addr), msg.port)
                            }
                            HEAPU8.set(msg.buffer, buf);
                            return msg.buffer.byteLength
                        }
                    case 14:
                        {
                            return -50
                        }
                    case 15:
                        {
                            var sock = getSocketFromFD(),
                                level = SYSCALLS.get(),
                                optname = SYSCALLS.get(),
                                optval = SYSCALLS.get(),
                                optlen = SYSCALLS.get();
                            if (level === 1) {
                                if (optname === 4) {
                                    HEAP32[optval >> 2] = sock.error;
                                    HEAP32[optlen >> 2] = 4;
                                    sock.error = null;
                                    return 0
                                }
                            }
                            return -50
                        }
                    case 16:
                        {
                            var sock = getSocketFromFD(),
                                message = SYSCALLS.get(),
                                flags = SYSCALLS.get();
                            var iov = HEAP32[message + 8 >> 2];
                            var num = HEAP32[message + 12 >> 2];
                            var addr, port;
                            var name = HEAP32[message >> 2];
                            var namelen = HEAP32[message + 4 >> 2];
                            if (name) {
                                var info = __read_sockaddr(name, namelen);
                                if (info.errno) return -info.errno;
                                port = info.port;
                                addr = DNS.lookup_addr(info.addr) || info.addr
                            }
                            var total = 0;
                            for (var i = 0; i < num; i++) {
                                total += HEAP32[iov + (8 * i + 4) >> 2]
                            }
                            var view = new Uint8Array(total);
                            var offset = 0;
                            for (var i = 0; i < num; i++) {
                                var iovbase = HEAP32[iov + (8 * i + 0) >> 2];
                                var iovlen = HEAP32[iov + (8 * i + 4) >> 2];
                                for (var j = 0; j < iovlen; j++) {
                                    view[offset++] = HEAP8[iovbase + j >> 0]
                                }
                            }
                            return sock.sock_ops.sendmsg(sock, view, 0, total, addr, port)
                        }
                    case 17:
                        {
                            var sock = getSocketFromFD(),
                                message = SYSCALLS.get(),
                                flags = SYSCALLS.get();
                            var iov = HEAP32[message + 8 >> 2];
                            var num = HEAP32[message + 12 >> 2];
                            var total = 0;
                            for (var i = 0; i < num; i++) {
                                total += HEAP32[iov + (8 * i + 4) >> 2]
                            }
                            var msg = sock.sock_ops.recvmsg(sock, total);
                            if (!msg) return 0;
                            var name = HEAP32[message >> 2];
                            if (name) {
                                var res = __write_sockaddr(name, sock.family, DNS.lookup_name(msg.addr), msg.port)
                            }
                            var bytesRead = 0;
                            var bytesRemaining = msg.buffer.byteLength;
                            for (var i = 0; bytesRemaining > 0 && i < num; i++) {
                                var iovbase = HEAP32[iov + (8 * i + 0) >> 2];
                                var iovlen = HEAP32[iov + (8 * i + 4) >> 2];
                                if (!iovlen) {
                                    continue
                                }
                                var length = Math.min(iovlen, bytesRemaining);
                                var buf = msg.buffer.subarray(bytesRead, bytesRead + length);
                                HEAPU8.set(buf, iovbase + bytesRead);
                                bytesRead += length;
                                bytesRemaining -= length
                            }
                            return bytesRead
                        }
                    default:
                        {
                            return -52
                        }
                }
            } catch (e) {
                if (typeof FS === "undefined" || !(e instanceof FS.ErrnoError)) abort(e);
                return -e.errno
            }
        }

        function ___syscall114(which, varargs) {
            SYSCALLS.varargs = varargs;
            try {
                abort("cannot wait on child processes")
            } catch (e) {
                if (typeof FS === "undefined" || !(e instanceof FS.ErrnoError)) abort(e);
                return -e.errno
            }
        }

        function ___syscall12(which, varargs) {
            SYSCALLS.varargs = varargs;
            try {
                var path = SYSCALLS.getStr();
                FS.chdir(path);
                return 0
            } catch (e) {
                if (typeof FS === "undefined" || !(e instanceof FS.ErrnoError)) abort(e);
                return -e.errno
            }
        }

        function ___syscall122(which, varargs) {
            SYSCALLS.varargs = varargs;
            try {
                var buf = SYSCALLS.get();
                if (!buf) return -21;
                var layout = {
                    "sysname": 0,
                    "nodename": 65,
                    "domainname": 325,
                    "machine": 260,
                    "version": 195,
                    "release": 130,
                    "__size__": 390
                };
                var copyString = function(element, value) {
                    var offset = layout[element];
                    writeAsciiToMemory(value, buf + offset)
                };
                copyString("sysname", "Emscripten");
                copyString("nodename", "emscripten");
                copyString("release", "1.0");
                copyString("version", "#1");
                copyString("machine", "x86-JS");
                return 0
            } catch (e) {
                if (typeof FS === "undefined" || !(e instanceof FS.ErrnoError)) abort(e);
                return -e.errno
            }
        }

        function ___syscall142(which, varargs) {
            SYSCALLS.varargs = varargs;
            try {
                var nfds = SYSCALLS.get(),
                    readfds = SYSCALLS.get(),
                    writefds = SYSCALLS.get(),
                    exceptfds = SYSCALLS.get(),
                    timeout = SYSCALLS.get();
                var total = 0;
                var srcReadLow = readfds ? HEAP32[readfds >> 2] : 0,
                    srcReadHigh = readfds ? HEAP32[readfds + 4 >> 2] : 0;
                var srcWriteLow = writefds ? HEAP32[writefds >> 2] : 0,
                    srcWriteHigh = writefds ? HEAP32[writefds + 4 >> 2] : 0;
                var srcExceptLow = exceptfds ? HEAP32[exceptfds >> 2] : 0,
                    srcExceptHigh = exceptfds ? HEAP32[exceptfds + 4 >> 2] : 0;
                var dstReadLow = 0,
                    dstReadHigh = 0;
                var dstWriteLow = 0,
                    dstWriteHigh = 0;
                var dstExceptLow = 0,
                    dstExceptHigh = 0;
                var allLow = (readfds ? HEAP32[readfds >> 2] : 0) | (writefds ? HEAP32[writefds >> 2] : 0) | (exceptfds ? HEAP32[exceptfds >> 2] : 0);
                var allHigh = (readfds ? HEAP32[readfds + 4 >> 2] : 0) | (writefds ? HEAP32[writefds + 4 >> 2] : 0) | (exceptfds ? HEAP32[exceptfds + 4 >> 2] : 0);
                var check = function(fd, low, high, val) {
                    return fd < 32 ? low & val : high & val
                };
                for (var fd = 0; fd < nfds; fd++) {
                    var mask = 1 << fd % 32;
                    if (!check(fd, allLow, allHigh, mask)) {
                        continue
                    }
                    var stream = FS.getStream(fd);
                    if (!stream) throw new FS.ErrnoError(8);
                    var flags = SYSCALLS.DEFAULT_POLLMASK;
                    if (stream.stream_ops.poll) {
                        flags = stream.stream_ops.poll(stream)
                    }
                    if (flags & 1 && check(fd, srcReadLow, srcReadHigh, mask)) {
                        fd < 32 ? dstReadLow = dstReadLow | mask : dstReadHigh = dstReadHigh | mask;
                        total++
                    }
                    if (flags & 4 && check(fd, srcWriteLow, srcWriteHigh, mask)) {
                        fd < 32 ? dstWriteLow = dstWriteLow | mask : dstWriteHigh = dstWriteHigh | mask;
                        total++
                    }
                    if (flags & 2 && check(fd, srcExceptLow, srcExceptHigh, mask)) {
                        fd < 32 ? dstExceptLow = dstExceptLow | mask : dstExceptHigh = dstExceptHigh | mask;
                        total++
                    }
                }
                if (readfds) {
                    HEAP32[readfds >> 2] = dstReadLow;
                    HEAP32[readfds + 4 >> 2] = dstReadHigh
                }
                if (writefds) {
                    HEAP32[writefds >> 2] = dstWriteLow;
                    HEAP32[writefds + 4 >> 2] = dstWriteHigh
                }
                if (exceptfds) {
                    HEAP32[exceptfds >> 2] = dstExceptLow;
                    HEAP32[exceptfds + 4 >> 2] = dstExceptHigh
                }
                return total
            } catch (e) {
                if (typeof FS === "undefined" || !(e instanceof FS.ErrnoError)) abort(e);
                return -e.errno
            }
        }

        function ___syscall15(which, varargs) {
            SYSCALLS.varargs = varargs;
            try {
                var path = SYSCALLS.getStr(),
                    mode = SYSCALLS.get();
                FS.chmod(path, mode);
                return 0
            } catch (e) {
                if (typeof FS === "undefined" || !(e instanceof FS.ErrnoError)) abort(e);
                return -e.errno
            }
        }

        function ___syscall168(which, varargs) {
            SYSCALLS.varargs = varargs;
            try {
                var fds = SYSCALLS.get(),
                    nfds = SYSCALLS.get(),
                    timeout = SYSCALLS.get();
                var nonzero = 0;
                for (var i = 0; i < nfds; i++) {
                    var pollfd = fds + 8 * i;
                    var fd = HEAP32[pollfd >> 2];
                    var events = HEAP16[pollfd + 4 >> 1];
                    var mask = 32;
                    var stream = FS.getStream(fd);
                    if (stream) {
                        mask = SYSCALLS.DEFAULT_POLLMASK;
                        if (stream.stream_ops.poll) {
                            mask = stream.stream_ops.poll(stream)
                        }
                    }
                    mask &= events | 8 | 16;
                    if (mask) nonzero++;
                    HEAP16[pollfd + 6 >> 1] = mask
                }
                return nonzero
            } catch (e) {
                if (typeof FS === "undefined" || !(e instanceof FS.ErrnoError)) abort(e);
                return -e.errno
            }
        }

        function ___syscall183(which, varargs) {
            SYSCALLS.varargs = varargs;
            try {
                var buf = SYSCALLS.get(),
                    size = SYSCALLS.get();
                if (size === 0) return -28;
                var cwd = FS.cwd();
                var cwdLengthInBytes = lengthBytesUTF8(cwd);
                if (size < cwdLengthInBytes + 1) return -68;
                stringToUTF8(cwd, buf, size);
                return buf
            } catch (e) {
                if (typeof FS === "undefined" || !(e instanceof FS.ErrnoError)) abort(e);
                return -e.errno
            }
        }

        function __emscripten_syscall_mmap2(addr, len, prot, flags, fd, off) {
            off <<= 12;
            var ptr;
            var allocated = false;
            if ((flags & 16) !== 0 && addr % PAGE_SIZE !== 0) {
                return -28
            }
            if ((flags & 32) !== 0) {
                ptr = _memalign(PAGE_SIZE, len);
                if (!ptr) return -48;
                _memset(ptr, 0, len);
                allocated = true
            } else {
                var info = FS.getStream(fd);
                if (!info) return -8;
                var res = FS.mmap(info, HEAPU8, addr, len, off, prot, flags);
                ptr = res.ptr;
                allocated = res.allocated
            }
            SYSCALLS.mappings[ptr] = {
                malloc: ptr,
                len: len,
                allocated: allocated,
                fd: fd,
                flags: flags
            };
            return ptr
        }

        function ___syscall192(which, varargs) {
            SYSCALLS.varargs = varargs;
            try {
                var addr = SYSCALLS.get(),
                    len = SYSCALLS.get(),
                    prot = SYSCALLS.get(),
                    flags = SYSCALLS.get(),
                    fd = SYSCALLS.get(),
                    off = SYSCALLS.get();
                return __emscripten_syscall_mmap2(addr, len, prot, flags, fd, off)
            } catch (e) {
                if (typeof FS === "undefined" || !(e instanceof FS.ErrnoError)) abort(e);
                return -e.errno
            }
        }

        function ___syscall194(which, varargs) {
            SYSCALLS.varargs = varargs;
            try {
                var fd = SYSCALLS.get(),
                    zero = SYSCALLS.getZero(),
                    length = SYSCALLS.get64();
                FS.ftruncate(fd, length);
                return 0
            } catch (e) {
                if (typeof FS === "undefined" || !(e instanceof FS.ErrnoError)) abort(e);
                return -e.errno
            }
        }

        function ___syscall195(which, varargs) {
            SYSCALLS.varargs = varargs;
            try {
                var path = SYSCALLS.getStr(),
                    buf = SYSCALLS.get();
                return SYSCALLS.doStat(FS.stat, path, buf)
            } catch (e) {
                if (typeof FS === "undefined" || !(e instanceof FS.ErrnoError)) abort(e);
                return -e.errno
            }
        }

        function ___syscall196(which, varargs) {
            SYSCALLS.varargs = varargs;
            try {
                var path = SYSCALLS.getStr(),
                    buf = SYSCALLS.get();
                return SYSCALLS.doStat(FS.lstat, path, buf)
            } catch (e) {
                if (typeof FS === "undefined" || !(e instanceof FS.ErrnoError)) abort(e);
                return -e.errno
            }
        }

        function ___syscall197(which, varargs) {
            SYSCALLS.varargs = varargs;
            try {
                var stream = SYSCALLS.getStreamFromFD(),
                    buf = SYSCALLS.get();
                return SYSCALLS.doStat(FS.stat, stream.path, buf)
            } catch (e) {
                if (typeof FS === "undefined" || !(e instanceof FS.ErrnoError)) abort(e);
                return -e.errno
            }
        }

        function ___syscall198(which, varargs) {
            SYSCALLS.varargs = varargs;
            try {
                var path = SYSCALLS.getStr(),
                    owner = SYSCALLS.get(),
                    group = SYSCALLS.get();
                FS.chown(path, owner, group);
                return 0
            } catch (e) {
                if (typeof FS === "undefined" || !(e instanceof FS.ErrnoError)) abort(e);
                return -e.errno
            }
        }

        function ___syscall202(which, varargs) {
            SYSCALLS.varargs = varargs;
            try {
                return 0
            } catch (e) {
                if (typeof FS === "undefined" || !(e instanceof FS.ErrnoError)) abort(e);
                return -e.errno
            }
        }

        function ___syscall199(a0, a1) {
            return ___syscall202(a0, a1)
        }
        var PROCINFO = {
            ppid: 1,
            pid: 42,
            sid: 42,
            pgid: 42
        };

        function ___syscall20(which, varargs) {
            SYSCALLS.varargs = varargs;
            try {
                return PROCINFO.pid
            } catch (e) {
                if (typeof FS === "undefined" || !(e instanceof FS.ErrnoError)) abort(e);
                return -e.errno
            }
        }

        function ___syscall200(a0, a1) {
            return ___syscall202(a0, a1)
        }

        function ___syscall205(which, varargs) {
            SYSCALLS.varargs = varargs;
            try {
                var size = SYSCALLS.get(),
                    list = SYSCALLS.get();
                if (size < 1) return -28;
                HEAP32[list >> 2] = 0;
                return 1
            } catch (e) {
                if (typeof FS === "undefined" || !(e instanceof FS.ErrnoError)) abort(e);
                return -e.errno
            }
        }

        function ___syscall212(which, varargs) {
            SYSCALLS.varargs = varargs;
            try {
                var path = SYSCALLS.getStr(),
                    owner = SYSCALLS.get(),
                    group = SYSCALLS.get();
                FS.chown(path, owner, group);
                return 0
            } catch (e) {
                if (typeof FS === "undefined" || !(e instanceof FS.ErrnoError)) abort(e);
                return -e.errno
            }
        }

        function ___syscall219(which, varargs) {
            SYSCALLS.varargs = varargs;
            try {
                return 0
            } catch (e) {
                if (typeof FS === "undefined" || !(e instanceof FS.ErrnoError)) abort(e);
                return -e.errno
            }
        }

        function ___syscall220(which, varargs) {
            SYSCALLS.varargs = varargs;
            try {
                var stream = SYSCALLS.getStreamFromFD(),
                    dirp = SYSCALLS.get(),
                    count = SYSCALLS.get();
                if (!stream.getdents) {
                    stream.getdents = FS.readdir(stream.path)
                }
                var struct_size = 280;
                var pos = 0;
                var off = FS.llseek(stream, 0, 1);
                var idx = Math.floor(off / struct_size);
                while (idx < stream.getdents.length && pos + struct_size <= count) {
                    var id;
                    var type;
                    var name = stream.getdents[idx];
                    if (name[0] === ".") {
                        id = 1;
                        type = 4
                    } else {
                        var child = FS.lookupNode(stream.node, name);
                        id = child.id;
                        type = FS.isChrdev(child.mode) ? 2 : FS.isDir(child.mode) ? 4 : FS.isLink(child.mode) ? 10 : 8
                    }
                    tempI64 = [id >>> 0, (tempDouble = id, +Math_abs(tempDouble) >= 1 ? tempDouble > 0 ? (Math_min(+Math_floor(tempDouble / 4294967296), 4294967295) | 0) >>> 0 : ~~+Math_ceil((tempDouble - +(~~tempDouble >>> 0)) / 4294967296) >>> 0 : 0)], HEAP32[dirp + pos >> 2] = tempI64[0], HEAP32[dirp + pos + 4 >> 2] = tempI64[1];
                    tempI64 = [(idx + 1) * struct_size >>> 0, (tempDouble = (idx + 1) * struct_size, +Math_abs(tempDouble) >= 1 ? tempDouble > 0 ? (Math_min(+Math_floor(tempDouble / 4294967296), 4294967295) | 0) >>> 0 : ~~+Math_ceil((tempDouble - +(~~tempDouble >>> 0)) / 4294967296) >>> 0 : 0)], HEAP32[dirp + pos + 8 >> 2] = tempI64[0], HEAP32[dirp + pos + 12 >> 2] = tempI64[1];
                    HEAP16[dirp + pos + 16 >> 1] = 280;
                    HEAP8[dirp + pos + 18 >> 0] = type;
                    stringToUTF8(name, dirp + pos + 19, 256);
                    pos += struct_size;
                    idx += 1
                }
                FS.llseek(stream, idx * struct_size, 0);
                return pos
            } catch (e) {
                if (typeof FS === "undefined" || !(e instanceof FS.ErrnoError)) abort(e);
                return -e.errno
            }
        }

        function ___syscall221(which, varargs) {
            SYSCALLS.varargs = varargs;
            try {
                var stream = SYSCALLS.getStreamFromFD(),
                    cmd = SYSCALLS.get();
                switch (cmd) {
                    case 0:
                        {
                            var arg = SYSCALLS.get();
                            if (arg < 0) {
                                return -28
                            }
                            var newStream;newStream = FS.open(stream.path, stream.flags, 0, arg);
                            return newStream.fd
                        }
                    case 1:
                    case 2:
                        return 0;
                    case 3:
                        return stream.flags;
                    case 4:
                        {
                            var arg = SYSCALLS.get();stream.flags |= arg;
                            return 0
                        }
                    case 12:
                        {
                            var arg = SYSCALLS.get();
                            var offset = 0;HEAP16[arg + offset >> 1] = 2;
                            return 0
                        }
                    case 13:
                    case 14:
                        return 0;
                    case 16:
                    case 8:
                        return -28;
                    case 9:
                        ___setErrNo(28);
                        return -1;
                    default:
                        {
                            return -28
                        }
                }
            } catch (e) {
                if (typeof FS === "undefined" || !(e instanceof FS.ErrnoError)) abort(e);
                return -e.errno
            }
        }

        function ___syscall268(which, varargs) {
            SYSCALLS.varargs = varargs;
            try {
                var path = SYSCALLS.getStr(),
                    size = SYSCALLS.get(),
                    buf = SYSCALLS.get();
                HEAP32[buf + 4 >> 2] = 4096;
                HEAP32[buf + 40 >> 2] = 4096;
                HEAP32[buf + 8 >> 2] = 1e6;
                HEAP32[buf + 12 >> 2] = 5e5;
                HEAP32[buf + 16 >> 2] = 5e5;
                HEAP32[buf + 20 >> 2] = FS.nextInode;
                HEAP32[buf + 24 >> 2] = 1e6;
                HEAP32[buf + 28 >> 2] = 42;
                HEAP32[buf + 44 >> 2] = 2;
                HEAP32[buf + 36 >> 2] = 255;
                return 0
            } catch (e) {
                if (typeof FS === "undefined" || !(e instanceof FS.ErrnoError)) abort(e);
                return -e.errno
            }
        }

        function ___syscall3(which, varargs) {
            SYSCALLS.varargs = varargs;
            try {
                var stream = SYSCALLS.getStreamFromFD(),
                    buf = SYSCALLS.get(),
                    count = SYSCALLS.get();
                return FS.read(stream, HEAP8, buf, count)
            } catch (e) {
                if (typeof FS === "undefined" || !(e instanceof FS.ErrnoError)) abort(e);
                return -e.errno
            }
        }

        function ___syscall33(which, varargs) {
            SYSCALLS.varargs = varargs;
            try {
                var path = SYSCALLS.getStr(),
                    amode = SYSCALLS.get();
                return SYSCALLS.doAccess(path, amode)
            } catch (e) {
                if (typeof FS === "undefined" || !(e instanceof FS.ErrnoError)) abort(e);
                return -e.errno
            }
        }

        function ___syscall34(which, varargs) {
            SYSCALLS.varargs = varargs;
            try {
                var inc = SYSCALLS.get();
                return -63
            } catch (e) {
                if (typeof FS === "undefined" || !(e instanceof FS.ErrnoError)) abort(e);
                return -e.errno
            }
        }

        function ___syscall38(which, varargs) {
            SYSCALLS.varargs = varargs;
            try {
                var old_path = SYSCALLS.getStr(),
                    new_path = SYSCALLS.getStr();
                FS.rename(old_path, new_path);
                return 0
            } catch (e) {
                if (typeof FS === "undefined" || !(e instanceof FS.ErrnoError)) abort(e);
                return -e.errno
            }
        }

        function ___syscall39(which, varargs) {
            SYSCALLS.varargs = varargs;
            try {
                var path = SYSCALLS.getStr(),
                    mode = SYSCALLS.get();
                return SYSCALLS.doMkdir(path, mode)
            } catch (e) {
                if (typeof FS === "undefined" || !(e instanceof FS.ErrnoError)) abort(e);
                return -e.errno
            }
        }

        function ___syscall4(which, varargs) {
            SYSCALLS.varargs = varargs;
            try {
                var stream = SYSCALLS.getStreamFromFD(),
                    buf = SYSCALLS.get(),
                    count = SYSCALLS.get();
                return FS.write(stream, HEAP8, buf, count)
            } catch (e) {
                if (typeof FS === "undefined" || !(e instanceof FS.ErrnoError)) abort(e);
                return -e.errno
            }
        }

        function ___syscall40(which, varargs) {
            SYSCALLS.varargs = varargs;
            try {
                var path = SYSCALLS.getStr();
                FS.rmdir(path);
                return 0
            } catch (e) {
                if (typeof FS === "undefined" || !(e instanceof FS.ErrnoError)) abort(e);
                return -e.errno
            }
        }

        function ___syscall41(which, varargs) {
            SYSCALLS.varargs = varargs;
            try {
                var old = SYSCALLS.getStreamFromFD();
                return FS.open(old.path, old.flags, 0).fd
            } catch (e) {
                if (typeof FS === "undefined" || !(e instanceof FS.ErrnoError)) abort(e);
                return -e.errno
            }
        }
        var PIPEFS = {
            BUCKET_BUFFER_SIZE: 8192,
            mount: function(mount) {
                return FS.createNode(null, "/", 16384 | 511, 0)
            },
            createPipe: function() {
                var pipe = {
                    buckets: []
                };
                pipe.buckets.push({
                    buffer: new Uint8Array(PIPEFS.BUCKET_BUFFER_SIZE),
                    offset: 0,
                    roffset: 0
                });
                var rName = PIPEFS.nextname();
                var wName = PIPEFS.nextname();
                var rNode = FS.createNode(PIPEFS.root, rName, 4096, 0);
                var wNode = FS.createNode(PIPEFS.root, wName, 4096, 0);
                rNode.pipe = pipe;
                wNode.pipe = pipe;
                var readableStream = FS.createStream({
                    path: rName,
                    node: rNode,
                    flags: FS.modeStringToFlags("r"),
                    seekable: false,
                    stream_ops: PIPEFS.stream_ops
                });
                rNode.stream = readableStream;
                var writableStream = FS.createStream({
                    path: wName,
                    node: wNode,
                    flags: FS.modeStringToFlags("w"),
                    seekable: false,
                    stream_ops: PIPEFS.stream_ops
                });
                wNode.stream = writableStream;
                return {
                    readable_fd: readableStream.fd,
                    writable_fd: writableStream.fd
                }
            },
            stream_ops: {
                poll: function(stream) {
                    var pipe = stream.node.pipe;
                    if ((stream.flags & 2097155) === 1) {
                        return 256 | 4
                    } else {
                        if (pipe.buckets.length > 0) {
                            for (var i = 0; i < pipe.buckets.length; i++) {
                                var bucket = pipe.buckets[i];
                                if (bucket.offset - bucket.roffset > 0) {
                                    return 64 | 1
                                }
                            }
                        }
                    }
                    return 0
                },
                ioctl: function(stream, request, varargs) {
                    return ERRNO_CODES.EINVAL
                },
                fsync: function(stream) {
                    return ERRNO_CODES.EINVAL
                },
                read: function(stream, buffer, offset, length, position) {
                    var pipe = stream.node.pipe;
                    var currentLength = 0;
                    for (var i = 0; i < pipe.buckets.length; i++) {
                        var bucket = pipe.buckets[i];
                        currentLength += bucket.offset - bucket.roffset
                    }
                    assert(buffer instanceof ArrayBuffer || ArrayBuffer.isView(buffer));
                    var data = buffer.subarray(offset, offset + length);
                    if (length <= 0) {
                        return 0
                    }
                    if (currentLength == 0) {
                        throw new FS.ErrnoError(ERRNO_CODES.EAGAIN)
                    }
                    var toRead = Math.min(currentLength, length);
                    var totalRead = toRead;
                    var toRemove = 0;
                    for (var i = 0; i < pipe.buckets.length; i++) {
                        var currBucket = pipe.buckets[i];
                        var bucketSize = currBucket.offset - currBucket.roffset;
                        if (toRead <= bucketSize) {
                            var tmpSlice = currBucket.buffer.subarray(currBucket.roffset, currBucket.offset);
                            if (toRead < bucketSize) {
                                tmpSlice = tmpSlice.subarray(0, toRead);
                                currBucket.roffset += toRead
                            } else {
                                toRemove++
                            }
                            data.set(tmpSlice);
                            break
                        } else {
                            var tmpSlice = currBucket.buffer.subarray(currBucket.roffset, currBucket.offset);
                            data.set(tmpSlice);
                            data = data.subarray(tmpSlice.byteLength);
                            toRead -= tmpSlice.byteLength;
                            toRemove++
                        }
                    }
                    if (toRemove && toRemove == pipe.buckets.length) {
                        toRemove--;
                        pipe.buckets[toRemove].offset = 0;
                        pipe.buckets[toRemove].roffset = 0
                    }
                    pipe.buckets.splice(0, toRemove);
                    return totalRead
                },
                write: function(stream, buffer, offset, length, position) {
                    var pipe = stream.node.pipe;
                    assert(buffer instanceof ArrayBuffer || ArrayBuffer.isView(buffer));
                    var data = buffer.subarray(offset, offset + length);
                    var dataLen = data.byteLength;
                    if (dataLen <= 0) {
                        return 0
                    }
                    var currBucket = null;
                    if (pipe.buckets.length == 0) {
                        currBucket = {
                            buffer: new Uint8Array(PIPEFS.BUCKET_BUFFER_SIZE),
                            offset: 0,
                            roffset: 0
                        };
                        pipe.buckets.push(currBucket)
                    } else {
                        currBucket = pipe.buckets[pipe.buckets.length - 1]
                    }
                    assert(currBucket.offset <= PIPEFS.BUCKET_BUFFER_SIZE);
                    var freeBytesInCurrBuffer = PIPEFS.BUCKET_BUFFER_SIZE - currBucket.offset;
                    if (freeBytesInCurrBuffer >= dataLen) {
                        currBucket.buffer.set(data, currBucket.offset);
                        currBucket.offset += dataLen;
                        return dataLen
                    } else if (freeBytesInCurrBuffer > 0) {
                        currBucket.buffer.set(data.subarray(0, freeBytesInCurrBuffer), currBucket.offset);
                        currBucket.offset += freeBytesInCurrBuffer;
                        data = data.subarray(freeBytesInCurrBuffer, data.byteLength)
                    }
                    var numBuckets = data.byteLength / PIPEFS.BUCKET_BUFFER_SIZE | 0;
                    var remElements = data.byteLength % PIPEFS.BUCKET_BUFFER_SIZE;
                    for (var i = 0; i < numBuckets; i++) {
                        var newBucket = {
                            buffer: new Uint8Array(PIPEFS.BUCKET_BUFFER_SIZE),
                            offset: PIPEFS.BUCKET_BUFFER_SIZE,
                            roffset: 0
                        };
                        pipe.buckets.push(newBucket);
                        newBucket.buffer.set(data.subarray(0, PIPEFS.BUCKET_BUFFER_SIZE));
                        data = data.subarray(PIPEFS.BUCKET_BUFFER_SIZE, data.byteLength)
                    }
                    if (remElements > 0) {
                        var newBucket = {
                            buffer: new Uint8Array(PIPEFS.BUCKET_BUFFER_SIZE),
                            offset: data.byteLength,
                            roffset: 0
                        };
                        pipe.buckets.push(newBucket);
                        newBucket.buffer.set(data)
                    }
                    return dataLen
                },
                close: function(stream) {
                    var pipe = stream.node.pipe;
                    pipe.buckets = null
                }
            },
            nextname: function() {
                if (!PIPEFS.nextname.current) {
                    PIPEFS.nextname.current = 0
                }
                return "pipe[" + PIPEFS.nextname.current++ + "]"
            }
        };

        function ___syscall42(which, varargs) {
            SYSCALLS.varargs = varargs;
            try {
                var fdPtr = SYSCALLS.get();
                if (fdPtr == 0) {
                    throw new FS.ErrnoError(21)
                }
                var res = PIPEFS.createPipe();
                HEAP32[fdPtr >> 2] = res.readable_fd;
                HEAP32[fdPtr + 4 >> 2] = res.writable_fd;
                return 0
            } catch (e) {
                if (typeof FS === "undefined" || !(e instanceof FS.ErrnoError)) abort(e);
                return -e.errno
            }
        }

        function ___syscall5(which, varargs) {
            SYSCALLS.varargs = varargs;
            try {
                var pathname = SYSCALLS.getStr(),
                    flags = SYSCALLS.get(),
                    mode = SYSCALLS.get();
                var stream = FS.open(pathname, flags, mode);
                return stream.fd
            } catch (e) {
                if (typeof FS === "undefined" || !(e instanceof FS.ErrnoError)) abort(e);
                return -e.errno
            }
        }

        function ___syscall54(which, varargs) {
            SYSCALLS.varargs = varargs;
            try {
                var stream = SYSCALLS.getStreamFromFD(),
                    op = SYSCALLS.get();
                switch (op) {
                    case 21509:
                    case 21505:
                        {
                            if (!stream.tty) return -59;
                            return 0
                        }
                    case 21510:
                    case 21511:
                    case 21512:
                    case 21506:
                    case 21507:
                    case 21508:
                        {
                            if (!stream.tty) return -59;
                            return 0
                        }
                    case 21519:
                        {
                            if (!stream.tty) return -59;
                            var argp = SYSCALLS.get();HEAP32[argp >> 2] = 0;
                            return 0
                        }
                    case 21520:
                        {
                            if (!stream.tty) return -59;
                            return -28
                        }
                    case 21531:
                        {
                            var argp = SYSCALLS.get();
                            return FS.ioctl(stream, op, argp)
                        }
                    case 21523:
                        {
                            if (!stream.tty) return -59;
                            return 0
                        }
                    case 21524:
                        {
                            if (!stream.tty) return -59;
                            return 0
                        }
                    default:
                        abort("bad ioctl syscall " + op)
                }
            } catch (e) {
                if (typeof FS === "undefined" || !(e instanceof FS.ErrnoError)) abort(e);
                return -e.errno
            }
        }

        function ___syscall60(which, varargs) {
            SYSCALLS.varargs = varargs;
            try {
                var mask = SYSCALLS.get();
                var old = SYSCALLS.umask;
                SYSCALLS.umask = mask;
                return old
            } catch (e) {
                if (typeof FS === "undefined" || !(e instanceof FS.ErrnoError)) abort(e);
                return -e.errno
            }
        }

        function ___syscall63(which, varargs) {
            SYSCALLS.varargs = varargs;
            try {
                var old = SYSCALLS.getStreamFromFD(),
                    suggestFD = SYSCALLS.get();
                if (old.fd === suggestFD) return suggestFD;
                return SYSCALLS.doDup(old.path, old.flags, suggestFD)
            } catch (e) {
                if (typeof FS === "undefined" || !(e instanceof FS.ErrnoError)) abort(e);
                return -e.errno
            }
        }

        function ___syscall77(which, varargs) {
            SYSCALLS.varargs = varargs;
            try {
                var who = SYSCALLS.get(),
                    usage = SYSCALLS.get();
                _memset(usage, 0, 136);
                HEAP32[usage >> 2] = 1;
                HEAP32[usage + 4 >> 2] = 2;
                HEAP32[usage + 8 >> 2] = 3;
                HEAP32[usage + 12 >> 2] = 4;
                return 0
            } catch (e) {
                if (typeof FS === "undefined" || !(e instanceof FS.ErrnoError)) abort(e);
                return -e.errno
            }
        }

        function ___syscall83(which, varargs) {
            SYSCALLS.varargs = varargs;
            try {
                var target = SYSCALLS.getStr(),
                    linkpath = SYSCALLS.getStr();
                FS.symlink(target, linkpath);
                return 0
            } catch (e) {
                if (typeof FS === "undefined" || !(e instanceof FS.ErrnoError)) abort(e);
                return -e.errno
            }
        }

        function ___syscall85(which, varargs) {
            SYSCALLS.varargs = varargs;
            try {
                var path = SYSCALLS.getStr(),
                    buf = SYSCALLS.get(),
                    bufsize = SYSCALLS.get();
                return SYSCALLS.doReadlink(path, buf, bufsize)
            } catch (e) {
                if (typeof FS === "undefined" || !(e instanceof FS.ErrnoError)) abort(e);
                return -e.errno
            }
        }

        function ___syscall9(which, varargs) {
            SYSCALLS.varargs = varargs;
            try {
                var oldpath = SYSCALLS.get(),
                    newpath = SYSCALLS.get();
                return -34
            } catch (e) {
                if (typeof FS === "undefined" || !(e instanceof FS.ErrnoError)) abort(e);
                return -e.errno
            }
        }

        function __emscripten_syscall_munmap(addr, len) {
            if (addr === -1 || len === 0) {
                return -28
            }
            var info = SYSCALLS.mappings[addr];
            if (!info) return 0;
            if (len === info.len) {
                var stream = FS.getStream(info.fd);
                SYSCALLS.doMsync(addr, stream, len, info.flags);
                FS.munmap(stream);
                SYSCALLS.mappings[addr] = null;
                if (info.allocated) {
                    _free(info.malloc)
                }
            }
            return 0
        }

        function ___syscall91(which, varargs) {
            SYSCALLS.varargs = varargs;
            try {
                var addr = SYSCALLS.get(),
                    len = SYSCALLS.get();
                return __emscripten_syscall_munmap(addr, len)
            } catch (e) {
                if (typeof FS === "undefined" || !(e instanceof FS.ErrnoError)) abort(e);
                return -e.errno
            }
        }

        function ___unlock() {}

        function _fd_close(fd) {
            try {
                var stream = SYSCALLS.getStreamFromFD(fd);
                FS.close(stream);
                return 0
            } catch (e) {
                if (typeof FS === "undefined" || !(e instanceof FS.ErrnoError)) abort(e);
                return e.errno
            }
        }

        function ___wasi_fd_close() {
            return _fd_close.apply(null, arguments)
        }

        function _fd_fdstat_get(fd, pbuf) {
            try {
                var stream = SYSCALLS.getStreamFromFD(fd);
                var type = stream.tty ? 2 : FS.isDir(stream.mode) ? 3 : FS.isLink(stream.mode) ? 7 : 4;
                HEAP8[pbuf >> 0] = type;
                return 0
            } catch (e) {
                if (typeof FS === "undefined" || !(e instanceof FS.ErrnoError)) abort(e);
                return e.errno
            }
        }

        function ___wasi_fd_fdstat_get() {
            return _fd_fdstat_get.apply(null, arguments)
        }

        function _fd_read(fd, iov, iovcnt, pnum) {
            try {
                var stream = SYSCALLS.getStreamFromFD(fd);
                var num = SYSCALLS.doReadv(stream, iov, iovcnt);
                HEAP32[pnum >> 2] = num;
                return 0
            } catch (e) {
                if (typeof FS === "undefined" || !(e instanceof FS.ErrnoError)) abort(e);
                return e.errno
            }
        }

        function ___wasi_fd_read() {
            return _fd_read.apply(null, arguments)
        }

        function _fd_seek(fd, offset_low, offset_high, whence, newOffset) {
            try {
                var stream = SYSCALLS.getStreamFromFD(fd);
                var HIGH_OFFSET = 4294967296;
                var offset = offset_high * HIGH_OFFSET + (offset_low >>> 0);
                var DOUBLE_LIMIT = 9007199254740992;
                if (offset <= -DOUBLE_LIMIT || offset >= DOUBLE_LIMIT) {
                    return -61
                }
                FS.llseek(stream, offset, whence);
                tempI64 = [stream.position >>> 0, (tempDouble = stream.position, +Math_abs(tempDouble) >= 1 ? tempDouble > 0 ? (Math_min(+Math_floor(tempDouble / 4294967296), 4294967295) | 0) >>> 0 : ~~+Math_ceil((tempDouble - +(~~tempDouble >>> 0)) / 4294967296) >>> 0 : 0)], HEAP32[newOffset >> 2] = tempI64[0], HEAP32[newOffset + 4 >> 2] = tempI64[1];
                if (stream.getdents && offset === 0 && whence === 0) stream.getdents = null;
                return 0
            } catch (e) {
                if (typeof FS === "undefined" || !(e instanceof FS.ErrnoError)) abort(e);
                return e.errno
            }
        }

        function ___wasi_fd_seek() {
            return _fd_seek.apply(null, arguments)
        }

        function _fd_write(fd, iov, iovcnt, pnum) {
            try {
                var stream = SYSCALLS.getStreamFromFD(fd);
                var num = SYSCALLS.doWritev(stream, iov, iovcnt);
                HEAP32[pnum >> 2] = num;
                return 0
            } catch (e) {
                if (typeof FS === "undefined" || !(e instanceof FS.ErrnoError)) abort(e);
                return e.errno
            }
        }

        function ___wasi_fd_write() {
            return _fd_write.apply(null, arguments)
        }

        function _exit(status) {
            exit(status)
        }

        function __exit(a0) {
            return _exit(a0)
        }

        function _abort() {
            abort()
        }

        function _tzset() {
            if (_tzset.called) return;
            _tzset.called = true;
            HEAP32[__get_timezone() >> 2] = (new Date).getTimezoneOffset() * 60;
            var currentYear = (new Date).getFullYear();
            var winter = new Date(currentYear, 0, 1);
            var summer = new Date(currentYear, 6, 1);
            HEAP32[__get_daylight() >> 2] = Number(winter.getTimezoneOffset() != summer.getTimezoneOffset());

            function extractZone(date) {
                var match = date.toTimeString().match(/\(([A-Za-z ]+)\)$/);
                return match ? match[1] : "GMT"
            }
            var winterName = extractZone(winter);
            var summerName = extractZone(summer);
            var winterNamePtr = allocate(intArrayFromString(winterName), "i8", ALLOC_NORMAL);
            var summerNamePtr = allocate(intArrayFromString(summerName), "i8", ALLOC_NORMAL);
            if (summer.getTimezoneOffset() < winter.getTimezoneOffset()) {
                HEAP32[__get_tzname() >> 2] = winterNamePtr;
                HEAP32[__get_tzname() + 4 >> 2] = summerNamePtr
            } else {
                HEAP32[__get_tzname() >> 2] = summerNamePtr;
                HEAP32[__get_tzname() + 4 >> 2] = winterNamePtr
            }
        }

        function _mktime(tmPtr) {
            _tzset();
            var date = new Date(HEAP32[tmPtr + 20 >> 2] + 1900, HEAP32[tmPtr + 16 >> 2], HEAP32[tmPtr + 12 >> 2], HEAP32[tmPtr + 8 >> 2], HEAP32[tmPtr + 4 >> 2], HEAP32[tmPtr >> 2], 0);
            var dst = HEAP32[tmPtr + 32 >> 2];
            var guessedOffset = date.getTimezoneOffset();
            var start = new Date(date.getFullYear(), 0, 1);
            var summerOffset = new Date(date.getFullYear(), 6, 1).getTimezoneOffset();
            var winterOffset = start.getTimezoneOffset();
            var dstOffset = Math.min(winterOffset, summerOffset);
            if (dst < 0) {
                HEAP32[tmPtr + 32 >> 2] = Number(summerOffset != winterOffset && dstOffset == guessedOffset)
            } else if (dst > 0 != (dstOffset == guessedOffset)) {
                var nonDstOffset = Math.max(winterOffset, summerOffset);
                var trueOffset = dst > 0 ? dstOffset : nonDstOffset;
                date.setTime(date.getTime() + (trueOffset - guessedOffset) * 6e4)
            }
            HEAP32[tmPtr + 24 >> 2] = date.getDay();
            var yday = (date.getTime() - start.getTime()) / (1e3 * 60 * 60 * 24) | 0;
            HEAP32[tmPtr + 28 >> 2] = yday;
            return date.getTime() / 1e3 | 0
        }

        function _asctime_r(tmPtr, buf) {
            var date = {
                tm_sec: HEAP32[tmPtr >> 2],
                tm_min: HEAP32[tmPtr + 4 >> 2],
                tm_hour: HEAP32[tmPtr + 8 >> 2],
                tm_mday: HEAP32[tmPtr + 12 >> 2],
                tm_mon: HEAP32[tmPtr + 16 >> 2],
                tm_year: HEAP32[tmPtr + 20 >> 2],
                tm_wday: HEAP32[tmPtr + 24 >> 2]
            };
            var days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
            var months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
            var s = days[date.tm_wday] + " " + months[date.tm_mon] + (date.tm_mday < 10 ? "  " : " ") + date.tm_mday + (date.tm_hour < 10 ? " 0" : " ") + date.tm_hour + (date.tm_min < 10 ? ":0" : ":") + date.tm_min + (date.tm_sec < 10 ? ":0" : ":") + date.tm_sec + " " + (1900 + date.tm_year) + "\n";
            stringToUTF8(s, buf, 26);
            return buf
        }

        function _chroot(path) {
            ___setErrNo(2);
            return -1
        }

        function _difftime(time1, time0) {
            return time1 - time0
        }

        function _dlopen() {
            abort("To use dlopen, you need to use Emscripten's linking support, see https://github.com/emscripten-core/emscripten/wiki/Linking")
        }

        function _dlclose() {
            return _dlopen.apply(null, arguments)
        }

        function _dlerror() {
            return _dlopen.apply(null, arguments)
        }

        function _dlsym() {
            return _dlopen.apply(null, arguments)
        }

        function _emscripten_get_heap_size() {
            return HEAP8.length
        }

        function abortOnCannotGrowMemory(requestedSize) {
            abort("OOM")
        }

        function _emscripten_resize_heap(requestedSize) {
            abortOnCannotGrowMemory(requestedSize)
        }

        function _execl() {
            ___setErrNo(45);
            return -1
        }

        function _execle() {
            return _execl.apply(null, arguments)
        }

        function _execvp() {
            return _execl.apply(null, arguments)
        }

        function _flock(fd, operation) {
            return 0
        }

        function _fork() {
            ___setErrNo(6);
            return -1
        }

        function _getdtablesize() {
            err("missing function: getdtablesize");
            abort(-1)
        }

        function _getenv(name) {
            if (name === 0) return 0;
            name = UTF8ToString(name);
            if (!ENV.hasOwnProperty(name)) return 0;
            if (_getenv.ret) _free(_getenv.ret);
            _getenv.ret = allocateUTF8(ENV[name]);
            return _getenv.ret
        }

        function _getgrnam() {
            err("missing function: getgrnam");
            abort(-1)
        }

        function _gethostbyname(name) {
            name = UTF8ToString(name);
            var ret = _malloc(20);
            var nameBuf = _malloc(name.length + 1);
            stringToUTF8(name, nameBuf, name.length + 1);
            HEAP32[ret >> 2] = nameBuf;
            var aliasesBuf = _malloc(4);
            HEAP32[aliasesBuf >> 2] = 0;
            HEAP32[ret + 4 >> 2] = aliasesBuf;
            var afinet = 2;
            HEAP32[ret + 8 >> 2] = afinet;
            HEAP32[ret + 12 >> 2] = 4;
            var addrListBuf = _malloc(12);
            HEAP32[addrListBuf >> 2] = addrListBuf + 8;
            HEAP32[addrListBuf + 4 >> 2] = 0;
            HEAP32[addrListBuf + 8 >> 2] = __inet_pton4_raw(DNS.lookup_name(name));
            HEAP32[ret + 16 >> 2] = addrListBuf;
            return ret
        }

        function _gethostbyaddr(addr, addrlen, type) {
            if (type !== 2) {
                ___setErrNo(5);
                return null
            }
            addr = HEAP32[addr >> 2];
            var host = __inet_ntop4_raw(addr);
            var lookup = DNS.lookup_addr(host);
            if (lookup) {
                host = lookup
            }
            var hostp = allocate(intArrayFromString(host), "i8", ALLOC_STACK);
            return _gethostbyname(hostp)
        }

        function _gethostbyname_r(name, ret, buf, buflen, out, err) {
            var data = _gethostbyname(name);
            _memcpy(ret, data, 20);
            _free(data);
            HEAP32[err >> 2] = 0;
            HEAP32[out >> 2] = ret;
            return 0
        }

        function _getloadavg(loadavg, nelem) {
            var limit = Math.min(nelem, 3);
            var doubleSize = 8;
            for (var i = 0; i < limit; i++) {
                HEAPF64[loadavg + i * doubleSize >> 3] = .1
            }
            return limit
        }
        var Protocols = {
            list: [],
            map: {}
        };

        function _setprotoent(stayopen) {
            function allocprotoent(name, proto, aliases) {
                var nameBuf = _malloc(name.length + 1);
                writeAsciiToMemory(name, nameBuf);
                var j = 0;
                var length = aliases.length;
                var aliasListBuf = _malloc((length + 1) * 4);
                for (var i = 0; i < length; i++, j += 4) {
                    var alias = aliases[i];
                    var aliasBuf = _malloc(alias.length + 1);
                    writeAsciiToMemory(alias, aliasBuf);
                    HEAP32[aliasListBuf + j >> 2] = aliasBuf
                }
                HEAP32[aliasListBuf + j >> 2] = 0;
                var pe = _malloc(12);
                HEAP32[pe >> 2] = nameBuf;
                HEAP32[pe + 4 >> 2] = aliasListBuf;
                HEAP32[pe + 8 >> 2] = proto;
                return pe
            }
            var list = Protocols.list;
            var map = Protocols.map;
            if (list.length === 0) {
                var entry = allocprotoent("tcp", 6, ["TCP"]);
                list.push(entry);
                map["tcp"] = map["6"] = entry;
                entry = allocprotoent("udp", 17, ["UDP"]);
                list.push(entry);
                map["udp"] = map["17"] = entry
            }
            _setprotoent.index = 0
        }

        function _getprotobyname(name) {
            name = UTF8ToString(name);
            _setprotoent(true);
            var result = Protocols.map[name];
            return result
        }

        function _getprotobynumber(number) {
            _setprotoent(true);
            var result = Protocols.map[number];
            return result
        }

        function _getpwnam() {
            throw "getpwnam: TODO"
        }

        function _getpwuid(uid) {
            return 0
        }

        function _gettimeofday(ptr) {
            var now = Date.now();
            HEAP32[ptr >> 2] = now / 1e3 | 0;
            HEAP32[ptr + 4 >> 2] = now % 1e3 * 1e3 | 0;
            return 0
        }
        var ___tm_timezone = (stringToUTF8("GMT", 2206240, 4), 2206240);

        function _gmtime_r(time, tmPtr) {
            var date = new Date(HEAP32[time >> 2] * 1e3);
            HEAP32[tmPtr >> 2] = date.getUTCSeconds();
            HEAP32[tmPtr + 4 >> 2] = date.getUTCMinutes();
            HEAP32[tmPtr + 8 >> 2] = date.getUTCHours();
            HEAP32[tmPtr + 12 >> 2] = date.getUTCDate();
            HEAP32[tmPtr + 16 >> 2] = date.getUTCMonth();
            HEAP32[tmPtr + 20 >> 2] = date.getUTCFullYear() - 1900;
            HEAP32[tmPtr + 24 >> 2] = date.getUTCDay();
            HEAP32[tmPtr + 36 >> 2] = 0;
            HEAP32[tmPtr + 32 >> 2] = 0;
            var start = Date.UTC(date.getUTCFullYear(), 0, 1, 0, 0, 0, 0);
            var yday = (date.getTime() - start) / (1e3 * 60 * 60 * 24) | 0;
            HEAP32[tmPtr + 28 >> 2] = yday;
            HEAP32[tmPtr + 40 >> 2] = ___tm_timezone;
            return tmPtr
        }

        function _kill(pid, sig) {
            ___setErrNo(ERRNO_CODES.EPERM);
            return -1
        }

        function _llvm_bswap_i64(l, h) {
            var retl = _llvm_bswap_i32(h) >>> 0;
            var reth = _llvm_bswap_i32(l) >>> 0;
            return (setTempRet0(reth), retl) | 0
        }

        function _llvm_log10_f32(x) {
            return Math.log(x) / Math.LN10
        }

        function _llvm_log10_f64(a0) {
            return _llvm_log10_f32(a0)
        }

        function _llvm_stackrestore(p) {
            var self = _llvm_stacksave;
            var ret = self.LLVM_SAVEDSTACKS[p];
            self.LLVM_SAVEDSTACKS.splice(p, 1);
            stackRestore(ret)
        }

        function _llvm_stacksave() {
            var self = _llvm_stacksave;
            if (!self.LLVM_SAVEDSTACKS) {
                self.LLVM_SAVEDSTACKS = []
            }
            self.LLVM_SAVEDSTACKS.push(stackSave());
            return self.LLVM_SAVEDSTACKS.length - 1
        }

        function _localtime_r(time, tmPtr) {
            _tzset();
            var date = new Date(HEAP32[time >> 2] * 1e3);
            HEAP32[tmPtr >> 2] = date.getSeconds();
            HEAP32[tmPtr + 4 >> 2] = date.getMinutes();
            HEAP32[tmPtr + 8 >> 2] = date.getHours();
            HEAP32[tmPtr + 12 >> 2] = date.getDate();
            HEAP32[tmPtr + 16 >> 2] = date.getMonth();
            HEAP32[tmPtr + 20 >> 2] = date.getFullYear() - 1900;
            HEAP32[tmPtr + 24 >> 2] = date.getDay();
            var start = new Date(date.getFullYear(), 0, 1);
            var yday = (date.getTime() - start.getTime()) / (1e3 * 60 * 60 * 24) | 0;
            HEAP32[tmPtr + 28 >> 2] = yday;
            HEAP32[tmPtr + 36 >> 2] = -(date.getTimezoneOffset() * 60);
            var summerOffset = new Date(date.getFullYear(), 6, 1).getTimezoneOffset();
            var winterOffset = start.getTimezoneOffset();
            var dst = (summerOffset != winterOffset && date.getTimezoneOffset() == Math.min(winterOffset, summerOffset)) | 0;
            HEAP32[tmPtr + 32 >> 2] = dst;
            var zonePtr = HEAP32[__get_tzname() + (dst ? 4 : 0) >> 2];
            HEAP32[tmPtr + 40 >> 2] = zonePtr;
            return tmPtr
        }

        function _longjmp(env, value) {
            _setThrew(env, value || 1);
            throw "longjmp"
        }

        function _emscripten_memcpy_big(dest, src, num) {
            HEAPU8.set(HEAPU8.subarray(src, src + num), dest)
        }

        function _usleep(useconds) {
            var msec = useconds / 1e3;
            if ((ENVIRONMENT_IS_WEB || ENVIRONMENT_IS_WORKER) && self["performance"] && self["performance"]["now"]) {
                var start = self["performance"]["now"]();
                while (self["performance"]["now"]() - start < msec) {}
            } else {
                var start = Date.now();
                while (Date.now() - start < msec) {}
            }
            return 0
        }
        Module["_usleep"] = _usleep;

        function _nanosleep(rqtp, rmtp) {
            if (rqtp === 0) {
                ___setErrNo(28);
                return -1
            }
            var seconds = HEAP32[rqtp >> 2];
            var nanoseconds = HEAP32[rqtp + 4 >> 2];
            if (nanoseconds < 0 || nanoseconds > 999999999 || seconds < 0) {
                ___setErrNo(28);
                return -1
            }
            if (rmtp !== 0) {
                HEAP32[rmtp >> 2] = 0;
                HEAP32[rmtp + 4 >> 2] = 0
            }
            return _usleep(seconds * 1e6 + nanoseconds / 1e3)
        }

        function _popen() {
            err("missing function: popen");
            abort(-1)
        }

        function _pthread_setcancelstate() {
            return 0
        }

        function _putenv(string) {
            if (string === 0) {
                ___setErrNo(28);
                return -1
            }
            string = UTF8ToString(string);
            var splitPoint = string.indexOf("=");
            if (string === "" || string.indexOf("=") === -1) {
                ___setErrNo(28);
                return -1
            }
            var name = string.slice(0, splitPoint);
            var value = string.slice(splitPoint + 1);
            if (!(name in ENV) || ENV[name] !== value) {
                ENV[name] = value;
                ___buildEnvironment(__get_environ())
            }
            return 0
        }

        function _setitimer() {
            throw "setitimer() is not implemented yet"
        }

        function _sigaction(signum, act, oldact) {
            return 0
        }

        function _sigaddset(set, signum) {
            HEAP32[set >> 2] = HEAP32[set >> 2] | 1 << signum - 1;
            return 0
        }

        function _sigdelset(set, signum) {
            HEAP32[set >> 2] = HEAP32[set >> 2] & ~(1 << signum - 1);
            return 0
        }

        function _sigemptyset(set) {
            HEAP32[set >> 2] = 0;
            return 0
        }

        function _sigfillset(set) {
            HEAP32[set >> 2] = -1 >>> 0;
            return 0
        }
        var __sigalrm_handler = 0;

        function _signal(sig, func) {
            if (sig == 14) {
                __sigalrm_handler = func
            } else {}
            return 0
        }

        function _sigprocmask() {
            return 0
        }

        function __isLeapYear(year) {
            return year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0)
        }

        function __arraySum(array, index) {
            var sum = 0;
            for (var i = 0; i <= index; sum += array[i++]);
            return sum
        }
        var __MONTH_DAYS_LEAP = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
        var __MONTH_DAYS_REGULAR = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

        function __addDays(date, days) {
            var newDate = new Date(date.getTime());
            while (days > 0) {
                var leap = __isLeapYear(newDate.getFullYear());
                var currentMonth = newDate.getMonth();
                var daysInCurrentMonth = (leap ? __MONTH_DAYS_LEAP : __MONTH_DAYS_REGULAR)[currentMonth];
                if (days > daysInCurrentMonth - newDate.getDate()) {
                    days -= daysInCurrentMonth - newDate.getDate() + 1;
                    newDate.setDate(1);
                    if (currentMonth < 11) {
                        newDate.setMonth(currentMonth + 1)
                    } else {
                        newDate.setMonth(0);
                        newDate.setFullYear(newDate.getFullYear() + 1)
                    }
                } else {
                    newDate.setDate(newDate.getDate() + days);
                    return newDate
                }
            }
            return newDate
        }

        function _strftime(s, maxsize, format, tm) {
            var tm_zone = HEAP32[tm + 40 >> 2];
            var date = {
                tm_sec: HEAP32[tm >> 2],
                tm_min: HEAP32[tm + 4 >> 2],
                tm_hour: HEAP32[tm + 8 >> 2],
                tm_mday: HEAP32[tm + 12 >> 2],
                tm_mon: HEAP32[tm + 16 >> 2],
                tm_year: HEAP32[tm + 20 >> 2],
                tm_wday: HEAP32[tm + 24 >> 2],
                tm_yday: HEAP32[tm + 28 >> 2],
                tm_isdst: HEAP32[tm + 32 >> 2],
                tm_gmtoff: HEAP32[tm + 36 >> 2],
                tm_zone: tm_zone ? UTF8ToString(tm_zone) : ""
            };
            var pattern = UTF8ToString(format);
            var EXPANSION_RULES_1 = {
                "%c": "%a %b %d %H:%M:%S %Y",
                "%D": "%m/%d/%y",
                "%F": "%Y-%m-%d",
                "%h": "%b",
                "%r": "%I:%M:%S %p",
                "%R": "%H:%M",
                "%T": "%H:%M:%S",
                "%x": "%m/%d/%y",
                "%X": "%H:%M:%S",
                "%Ec": "%c",
                "%EC": "%C",
                "%Ex": "%m/%d/%y",
                "%EX": "%H:%M:%S",
                "%Ey": "%y",
                "%EY": "%Y",
                "%Od": "%d",
                "%Oe": "%e",
                "%OH": "%H",
                "%OI": "%I",
                "%Om": "%m",
                "%OM": "%M",
                "%OS": "%S",
                "%Ou": "%u",
                "%OU": "%U",
                "%OV": "%V",
                "%Ow": "%w",
                "%OW": "%W",
                "%Oy": "%y"
            };
            for (var rule in EXPANSION_RULES_1) {
                pattern = pattern.replace(new RegExp(rule, "g"), EXPANSION_RULES_1[rule])
            }
            var WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
            var MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

            function leadingSomething(value, digits, character) {
                var str = typeof value === "number" ? value.toString() : value || "";
                while (str.length < digits) {
                    str = character[0] + str
                }
                return str
            }

            function leadingNulls(value, digits) {
                return leadingSomething(value, digits, "0")
            }

            function compareByDay(date1, date2) {
                function sgn(value) {
                    return value < 0 ? -1 : value > 0 ? 1 : 0
                }
                var compare;
                if ((compare = sgn(date1.getFullYear() - date2.getFullYear())) === 0) {
                    if ((compare = sgn(date1.getMonth() - date2.getMonth())) === 0) {
                        compare = sgn(date1.getDate() - date2.getDate())
                    }
                }
                return compare
            }

            function getFirstWeekStartDate(janFourth) {
                switch (janFourth.getDay()) {
                    case 0:
                        return new Date(janFourth.getFullYear() - 1, 11, 29);
                    case 1:
                        return janFourth;
                    case 2:
                        return new Date(janFourth.getFullYear(), 0, 3);
                    case 3:
                        return new Date(janFourth.getFullYear(), 0, 2);
                    case 4:
                        return new Date(janFourth.getFullYear(), 0, 1);
                    case 5:
                        return new Date(janFourth.getFullYear() - 1, 11, 31);
                    case 6:
                        return new Date(janFourth.getFullYear() - 1, 11, 30)
                }
            }

            function getWeekBasedYear(date) {
                var thisDate = __addDays(new Date(date.tm_year + 1900, 0, 1), date.tm_yday);
                var janFourthThisYear = new Date(thisDate.getFullYear(), 0, 4);
                var janFourthNextYear = new Date(thisDate.getFullYear() + 1, 0, 4);
                var firstWeekStartThisYear = getFirstWeekStartDate(janFourthThisYear);
                var firstWeekStartNextYear = getFirstWeekStartDate(janFourthNextYear);
                if (compareByDay(firstWeekStartThisYear, thisDate) <= 0) {
                    if (compareByDay(firstWeekStartNextYear, thisDate) <= 0) {
                        return thisDate.getFullYear() + 1
                    } else {
                        return thisDate.getFullYear()
                    }
                } else {
                    return thisDate.getFullYear() - 1
                }
            }
            var EXPANSION_RULES_2 = {
                "%a": function(date) {
                    return WEEKDAYS[date.tm_wday].substring(0, 3)
                },
                "%A": function(date) {
                    return WEEKDAYS[date.tm_wday]
                },
                "%b": function(date) {
                    return MONTHS[date.tm_mon].substring(0, 3)
                },
                "%B": function(date) {
                    return MONTHS[date.tm_mon]
                },
                "%C": function(date) {
                    var year = date.tm_year + 1900;
                    return leadingNulls(year / 100 | 0, 2)
                },
                "%d": function(date) {
                    return leadingNulls(date.tm_mday, 2)
                },
                "%e": function(date) {
                    return leadingSomething(date.tm_mday, 2, " ")
                },
                "%g": function(date) {
                    return getWeekBasedYear(date).toString().substring(2)
                },
                "%G": function(date) {
                    return getWeekBasedYear(date)
                },
                "%H": function(date) {
                    return leadingNulls(date.tm_hour, 2)
                },
                "%I": function(date) {
                    var twelveHour = date.tm_hour;
                    if (twelveHour == 0) twelveHour = 12;
                    else if (twelveHour > 12) twelveHour -= 12;
                    return leadingNulls(twelveHour, 2)
                },
                "%j": function(date) {
                    return leadingNulls(date.tm_mday + __arraySum(__isLeapYear(date.tm_year + 1900) ? __MONTH_DAYS_LEAP : __MONTH_DAYS_REGULAR, date.tm_mon - 1), 3)
                },
                "%m": function(date) {
                    return leadingNulls(date.tm_mon + 1, 2)
                },
                "%M": function(date) {
                    return leadingNulls(date.tm_min, 2)
                },
                "%n": function() {
                    return "\n"
                },
                "%p": function(date) {
                    if (date.tm_hour >= 0 && date.tm_hour < 12) {
                        return "AM"
                    } else {
                        return "PM"
                    }
                },
                "%S": function(date) {
                    return leadingNulls(date.tm_sec, 2)
                },
                "%t": function() {
                    return "\t"
                },
                "%u": function(date) {
                    return date.tm_wday || 7
                },
                "%U": function(date) {
                    var janFirst = new Date(date.tm_year + 1900, 0, 1);
                    var firstSunday = janFirst.getDay() === 0 ? janFirst : __addDays(janFirst, 7 - janFirst.getDay());
                    var endDate = new Date(date.tm_year + 1900, date.tm_mon, date.tm_mday);
                    if (compareByDay(firstSunday, endDate) < 0) {
                        var februaryFirstUntilEndMonth = __arraySum(__isLeapYear(endDate.getFullYear()) ? __MONTH_DAYS_LEAP : __MONTH_DAYS_REGULAR, endDate.getMonth() - 1) - 31;
                        var firstSundayUntilEndJanuary = 31 - firstSunday.getDate();
                        var days = firstSundayUntilEndJanuary + februaryFirstUntilEndMonth + endDate.getDate();
                        return leadingNulls(Math.ceil(days / 7), 2)
                    }
                    return compareByDay(firstSunday, janFirst) === 0 ? "01" : "00"
                },
                "%V": function(date) {
                    var janFourthThisYear = new Date(date.tm_year + 1900, 0, 4);
                    var janFourthNextYear = new Date(date.tm_year + 1901, 0, 4);
                    var firstWeekStartThisYear = getFirstWeekStartDate(janFourthThisYear);
                    var firstWeekStartNextYear = getFirstWeekStartDate(janFourthNextYear);
                    var endDate = __addDays(new Date(date.tm_year + 1900, 0, 1), date.tm_yday);
                    if (compareByDay(endDate, firstWeekStartThisYear) < 0) {
                        return "53"
                    }
                    if (compareByDay(firstWeekStartNextYear, endDate) <= 0) {
                        return "01"
                    }
                    var daysDifference;
                    if (firstWeekStartThisYear.getFullYear() < date.tm_year + 1900) {
                        daysDifference = date.tm_yday + 32 - firstWeekStartThisYear.getDate()
                    } else {
                        daysDifference = date.tm_yday + 1 - firstWeekStartThisYear.getDate()
                    }
                    return leadingNulls(Math.ceil(daysDifference / 7), 2)
                },
                "%w": function(date) {
                    return date.tm_wday
                },
                "%W": function(date) {
                    var janFirst = new Date(date.tm_year, 0, 1);
                    var firstMonday = janFirst.getDay() === 1 ? janFirst : __addDays(janFirst, janFirst.getDay() === 0 ? 1 : 7 - janFirst.getDay() + 1);
                    var endDate = new Date(date.tm_year + 1900, date.tm_mon, date.tm_mday);
                    if (compareByDay(firstMonday, endDate) < 0) {
                        var februaryFirstUntilEndMonth = __arraySum(__isLeapYear(endDate.getFullYear()) ? __MONTH_DAYS_LEAP : __MONTH_DAYS_REGULAR, endDate.getMonth() - 1) - 31;
                        var firstMondayUntilEndJanuary = 31 - firstMonday.getDate();
                        var days = firstMondayUntilEndJanuary + februaryFirstUntilEndMonth + endDate.getDate();
                        return leadingNulls(Math.ceil(days / 7), 2)
                    }
                    return compareByDay(firstMonday, janFirst) === 0 ? "01" : "00"
                },
                "%y": function(date) {
                    return (date.tm_year + 1900).toString().substring(2)
                },
                "%Y": function(date) {
                    return date.tm_year + 1900
                },
                "%z": function(date) {
                    var off = date.tm_gmtoff;
                    var ahead = off >= 0;
                    off = Math.abs(off) / 60;
                    off = off / 60 * 100 + off % 60;
                    return (ahead ? "+" : "-") + String("0000" + off).slice(-4)
                },
                "%Z": function(date) {
                    return date.tm_zone
                },
                "%%": function() {
                    return "%"
                }
            };
            for (var rule in EXPANSION_RULES_2) {
                if (pattern.indexOf(rule) >= 0) {
                    pattern = pattern.replace(new RegExp(rule, "g"), EXPANSION_RULES_2[rule](date))
                }
            }
            var bytes = intArrayFromString(pattern, false);
            if (bytes.length > maxsize) {
                return 0
            }
            writeArrayToMemory(bytes, s);
            return bytes.length - 1
        }

        function _strptime(buf, format, tm) {
            var pattern = UTF8ToString(format);
            var SPECIAL_CHARS = "\\!@#$^&*()+=-[]/{}|:<>?,.";
            for (var i = 0, ii = SPECIAL_CHARS.length; i < ii; ++i) {
                pattern = pattern.replace(new RegExp("\\" + SPECIAL_CHARS[i], "g"), "\\" + SPECIAL_CHARS[i])
            }
            var EQUIVALENT_MATCHERS = {
                "%A": "%a",
                "%B": "%b",
                "%c": "%a %b %d %H:%M:%S %Y",
                "%D": "%m\\/%d\\/%y",
                "%e": "%d",
                "%F": "%Y-%m-%d",
                "%h": "%b",
                "%R": "%H\\:%M",
                "%r": "%I\\:%M\\:%S\\s%p",
                "%T": "%H\\:%M\\:%S",
                "%x": "%m\\/%d\\/(?:%y|%Y)",
                "%X": "%H\\:%M\\:%S"
            };
            for (var matcher in EQUIVALENT_MATCHERS) {
                pattern = pattern.replace(matcher, EQUIVALENT_MATCHERS[matcher])
            }
            var DATE_PATTERNS = {
                "%a": "(?:Sun(?:day)?)|(?:Mon(?:day)?)|(?:Tue(?:sday)?)|(?:Wed(?:nesday)?)|(?:Thu(?:rsday)?)|(?:Fri(?:day)?)|(?:Sat(?:urday)?)",
                "%b": "(?:Jan(?:uary)?)|(?:Feb(?:ruary)?)|(?:Mar(?:ch)?)|(?:Apr(?:il)?)|May|(?:Jun(?:e)?)|(?:Jul(?:y)?)|(?:Aug(?:ust)?)|(?:Sep(?:tember)?)|(?:Oct(?:ober)?)|(?:Nov(?:ember)?)|(?:Dec(?:ember)?)",
                "%C": "\\d\\d",
                "%d": "0[1-9]|[1-9](?!\\d)|1\\d|2\\d|30|31",
                "%H": "\\d(?!\\d)|[0,1]\\d|20|21|22|23",
                "%I": "\\d(?!\\d)|0\\d|10|11|12",
                "%j": "00[1-9]|0?[1-9](?!\\d)|0?[1-9]\\d(?!\\d)|[1,2]\\d\\d|3[0-6]\\d",
                "%m": "0[1-9]|[1-9](?!\\d)|10|11|12",
                "%M": "0\\d|\\d(?!\\d)|[1-5]\\d",
                "%n": "\\s",
                "%p": "AM|am|PM|pm|A\\.M\\.|a\\.m\\.|P\\.M\\.|p\\.m\\.",
                "%S": "0\\d|\\d(?!\\d)|[1-5]\\d|60",
                "%U": "0\\d|\\d(?!\\d)|[1-4]\\d|50|51|52|53",
                "%W": "0\\d|\\d(?!\\d)|[1-4]\\d|50|51|52|53",
                "%w": "[0-6]",
                "%y": "\\d\\d",
                "%Y": "\\d\\d\\d\\d",
                "%%": "%",
                "%t": "\\s"
            };
            var MONTH_NUMBERS = {
                JAN: 0,
                FEB: 1,
                MAR: 2,
                APR: 3,
                MAY: 4,
                JUN: 5,
                JUL: 6,
                AUG: 7,
                SEP: 8,
                OCT: 9,
                NOV: 10,
                DEC: 11
            };
            var DAY_NUMBERS_SUN_FIRST = {
                SUN: 0,
                MON: 1,
                TUE: 2,
                WED: 3,
                THU: 4,
                FRI: 5,
                SAT: 6
            };
            var DAY_NUMBERS_MON_FIRST = {
                MON: 0,
                TUE: 1,
                WED: 2,
                THU: 3,
                FRI: 4,
                SAT: 5,
                SUN: 6
            };
            for (var datePattern in DATE_PATTERNS) {
                pattern = pattern.replace(datePattern, "(" + datePattern + DATE_PATTERNS[datePattern] + ")")
            }
            var capture = [];
            for (var i = pattern.indexOf("%"); i >= 0; i = pattern.indexOf("%")) {
                capture.push(pattern[i + 1]);
                pattern = pattern.replace(new RegExp("\\%" + pattern[i + 1], "g"), "")
            }
            var matches = new RegExp("^" + pattern, "i").exec(UTF8ToString(buf));

            function initDate() {
                function fixup(value, min, max) {
                    return typeof value !== "number" || isNaN(value) ? min : value >= min ? value <= max ? value : max : min
                }
                return {
                    year: fixup(HEAP32[tm + 20 >> 2] + 1900, 1970, 9999),
                    month: fixup(HEAP32[tm + 16 >> 2], 0, 11),
                    day: fixup(HEAP32[tm + 12 >> 2], 1, 31),
                    hour: fixup(HEAP32[tm + 8 >> 2], 0, 23),
                    min: fixup(HEAP32[tm + 4 >> 2], 0, 59),
                    sec: fixup(HEAP32[tm >> 2], 0, 59)
                }
            }
            if (matches) {
                var date = initDate();
                var value;
                var getMatch = function(symbol) {
                    var pos = capture.indexOf(symbol);
                    if (pos >= 0) {
                        return matches[pos + 1]
                    }
                    return
                };
                if (value = getMatch("S")) {
                    date.sec = parseInt(value)
                }
                if (value = getMatch("M")) {
                    date.min = parseInt(value)
                }
                if (value = getMatch("H")) {
                    date.hour = parseInt(value)
                } else if (value = getMatch("I")) {
                    var hour = parseInt(value);
                    if (value = getMatch("p")) {
                        hour += value.toUpperCase()[0] === "P" ? 12 : 0
                    }
                    date.hour = hour
                }
                if (value = getMatch("Y")) {
                    date.year = parseInt(value)
                } else if (value = getMatch("y")) {
                    var year = parseInt(value);
                    if (value = getMatch("C")) {
                        year += parseInt(value) * 100
                    } else {
                        year += year < 69 ? 2e3 : 1900
                    }
                    date.year = year
                }
                if (value = getMatch("m")) {
                    date.month = parseInt(value) - 1
                } else if (value = getMatch("b")) {
                    date.month = MONTH_NUMBERS[value.substring(0, 3).toUpperCase()] || 0
                }
                if (value = getMatch("d")) {
                    date.day = parseInt(value)
                } else if (value = getMatch("j")) {
                    var day = parseInt(value);
                    var leapYear = __isLeapYear(date.year);
                    for (var month = 0; month < 12; ++month) {
                        var daysUntilMonth = __arraySum(leapYear ? __MONTH_DAYS_LEAP : __MONTH_DAYS_REGULAR, month - 1);
                        if (day <= daysUntilMonth + (leapYear ? __MONTH_DAYS_LEAP : __MONTH_DAYS_REGULAR)[month]) {
                            date.day = day - daysUntilMonth
                        }
                    }
                } else if (value = getMatch("a")) {
                    var weekDay = value.substring(0, 3).toUpperCase();
                    if (value = getMatch("U")) {
                        var weekDayNumber = DAY_NUMBERS_SUN_FIRST[weekDay];
                        var weekNumber = parseInt(value);
                        var janFirst = new Date(date.year, 0, 1);
                        var endDate;
                        if (janFirst.getDay() === 0) {
                            endDate = __addDays(janFirst, weekDayNumber + 7 * (weekNumber - 1))
                        } else {
                            endDate = __addDays(janFirst, 7 - janFirst.getDay() + weekDayNumber + 7 * (weekNumber - 1))
                        }
                        date.day = endDate.getDate();
                        date.month = endDate.getMonth()
                    } else if (value = getMatch("W")) {
                        var weekDayNumber = DAY_NUMBERS_MON_FIRST[weekDay];
                        var weekNumber = parseInt(value);
                        var janFirst = new Date(date.year, 0, 1);
                        var endDate;
                        if (janFirst.getDay() === 1) {
                            endDate = __addDays(janFirst, weekDayNumber + 7 * (weekNumber - 1))
                        } else {
                            endDate = __addDays(janFirst, 7 - janFirst.getDay() + 1 + weekDayNumber + 7 * (weekNumber - 1))
                        }
                        date.day = endDate.getDate();
                        date.month = endDate.getMonth()
                    }
                }
                var fullDate = new Date(date.year, date.month, date.day, date.hour, date.min, date.sec, 0);
                HEAP32[tm >> 2] = fullDate.getSeconds();
                HEAP32[tm + 4 >> 2] = fullDate.getMinutes();
                HEAP32[tm + 8 >> 2] = fullDate.getHours();
                HEAP32[tm + 12 >> 2] = fullDate.getDate();
                HEAP32[tm + 16 >> 2] = fullDate.getMonth();
                HEAP32[tm + 20 >> 2] = fullDate.getFullYear() - 1900;
                HEAP32[tm + 24 >> 2] = fullDate.getDay();
                HEAP32[tm + 28 >> 2] = __arraySum(__isLeapYear(fullDate.getFullYear()) ? __MONTH_DAYS_LEAP : __MONTH_DAYS_REGULAR, fullDate.getMonth() - 1) + fullDate.getDate() - 1;
                HEAP32[tm + 32 >> 2] = 0;
                return buf + intArrayFromString(matches[0]).length - 1
            }
            return 0
        }

        function _sysconf(name) {
            switch (name) {
                case 30:
                    return PAGE_SIZE;
                case 85:
                    var maxHeapSize = 2 * 1024 * 1024 * 1024 - 65536;
                    maxHeapSize = HEAPU8.length;
                    return maxHeapSize / PAGE_SIZE;
                case 132:
                case 133:
                case 12:
                case 137:
                case 138:
                case 15:
                case 235:
                case 16:
                case 17:
                case 18:
                case 19:
                case 20:
                case 149:
                case 13:
                case 10:
                case 236:
                case 153:
                case 9:
                case 21:
                case 22:
                case 159:
                case 154:
                case 14:
                case 77:
                case 78:
                case 139:
                case 80:
                case 81:
                case 82:
                case 68:
                case 67:
                case 164:
                case 11:
                case 29:
                case 47:
                case 48:
                case 95:
                case 52:
                case 51:
                case 46:
                    return 200809;
                case 79:
                    return 0;
                case 27:
                case 246:
                case 127:
                case 128:
                case 23:
                case 24:
                case 160:
                case 161:
                case 181:
                case 182:
                case 242:
                case 183:
                case 184:
                case 243:
                case 244:
                case 245:
                case 165:
                case 178:
                case 179:
                case 49:
                case 50:
                case 168:
                case 169:
                case 175:
                case 170:
                case 171:
                case 172:
                case 97:
                case 76:
                case 32:
                case 173:
                case 35:
                    return -1;
                case 176:
                case 177:
                case 7:
                case 155:
                case 8:
                case 157:
                case 125:
                case 126:
                case 92:
                case 93:
                case 129:
                case 130:
                case 131:
                case 94:
                case 91:
                    return 1;
                case 74:
                case 60:
                case 69:
                case 70:
                case 4:
                    return 1024;
                case 31:
                case 42:
                case 72:
                    return 32;
                case 87:
                case 26:
                case 33:
                    return 2147483647;
                case 34:
                case 1:
                    return 47839;
                case 38:
                case 36:
                    return 99;
                case 43:
                case 37:
                    return 2048;
                case 0:
                    return 2097152;
                case 3:
                    return 65536;
                case 28:
                    return 32768;
                case 44:
                    return 32767;
                case 75:
                    return 16384;
                case 39:
                    return 1e3;
                case 89:
                    return 700;
                case 71:
                    return 256;
                case 40:
                    return 255;
                case 2:
                    return 100;
                case 180:
                    return 64;
                case 25:
                    return 20;
                case 5:
                    return 16;
                case 6:
                    return 6;
                case 73:
                    return 4;
                case 84:
                    {
                        if (typeof navigator === "object") return navigator["hardwareConcurrency"] || 1;
                        return 1
                    }
            }
            ___setErrNo(28);
            return -1
        }

        function _time(ptr) {
            var ret = Date.now() / 1e3 | 0;
            if (ptr) {
                HEAP32[ptr >> 2] = ret
            }
            return ret
        }

        function _unsetenv(name) {
            if (name === 0) {
                ___setErrNo(28);
                return -1
            }
            name = UTF8ToString(name);
            if (name === "" || name.indexOf("=") !== -1) {
                ___setErrNo(28);
                return -1
            }
            if (ENV.hasOwnProperty(name)) {
                delete ENV[name];
                ___buildEnvironment(__get_environ())
            }
            return 0
        }

        function _utime(path, times) {
            var time;
            if (times) {
                var offset = 4;
                time = HEAP32[times + offset >> 2];
                time *= 1e3
            } else {
                time = Date.now()
            }
            path = UTF8ToString(path);
            try {
                FS.utime(path, time, time);
                return 0
            } catch (e) {
                FS.handleFSError(e);
                return -1
            }
        }

        function _wait(stat_loc) {
            ___setErrNo(12);
            return -1
        }

        function _waitpid() {
            return _wait.apply(null, arguments)
        }
        if (typeof dateNow !== "undefined") {
            _emscripten_get_now = dateNow
        } else if (typeof performance === "object" && performance && typeof performance["now"] === "function") {
            _emscripten_get_now = function() {
                return performance["now"]()
            }
        } else {
            _emscripten_get_now = Date.now
        }
        FS.staticInit();
        Module["FS_createFolder"] = FS.createFolder;
        Module["FS_createPath"] = FS.createPath;
        Module["FS_createDataFile"] = FS.createDataFile;
        Module["FS_createPreloadedFile"] = FS.createPreloadedFile;
        Module["FS_createLazyFile"] = FS.createLazyFile;
        Module["FS_createLink"] = FS.createLink;
        Module["FS_createDevice"] = FS.createDevice;
        Module["FS_unlink"] = FS.unlink;

        function intArrayFromString(stringy, dontAddNull, length) {
            var len = length > 0 ? length : lengthBytesUTF8(stringy) + 1;
            var u8array = new Array(len);
            var numBytesWritten = stringToUTF8Array(stringy, u8array, 0, u8array.length);
            if (dontAddNull) u8array.length = numBytesWritten;
            return u8array
        }

        function invoke_i(index) {
            var sp = stackSave();
            try {
                return dynCall_i(index)
            } catch (e) {
                stackRestore(sp);
                if (e !== e + 0 && e !== "longjmp") throw e;
                _setThrew(1, 0)
            }
        }

        function invoke_ii(index, a1) {
            var sp = stackSave();
            try {
                return dynCall_ii(index, a1)
            } catch (e) {
                stackRestore(sp);
                if (e !== e + 0 && e !== "longjmp") throw e;
                _setThrew(1, 0)
            }
        }

        function invoke_iii(index, a1, a2) {
            var sp = stackSave();
            try {
                return dynCall_iii(index, a1, a2)
            } catch (e) {
                stackRestore(sp);
                if (e !== e + 0 && e !== "longjmp") throw e;
                _setThrew(1, 0)
            }
        }

        function invoke_iiii(index, a1, a2, a3) {
            var sp = stackSave();
            try {
                return dynCall_iiii(index, a1, a2, a3)
            } catch (e) {
                stackRestore(sp);
                if (e !== e + 0 && e !== "longjmp") throw e;
                _setThrew(1, 0)
            }
        }

        function invoke_iiiii(index, a1, a2, a3, a4) {
            var sp = stackSave();
            try {
                return dynCall_iiiii(index, a1, a2, a3, a4)
            } catch (e) {
                stackRestore(sp);
                if (e !== e + 0 && e !== "longjmp") throw e;
                _setThrew(1, 0)
            }
        }

        function invoke_iiiiii(index, a1, a2, a3, a4, a5) {
            var sp = stackSave();
            try {
                return dynCall_iiiiii(index, a1, a2, a3, a4, a5)
            } catch (e) {
                stackRestore(sp);
                if (e !== e + 0 && e !== "longjmp") throw e;
                _setThrew(1, 0)
            }
        }

        function invoke_iiiiiii(index, a1, a2, a3, a4, a5, a6) {
            var sp = stackSave();
            try {
                return dynCall_iiiiiii(index, a1, a2, a3, a4, a5, a6)
            } catch (e) {
                stackRestore(sp);
                if (e !== e + 0 && e !== "longjmp") throw e;
                _setThrew(1, 0)
            }
        }

        function invoke_v(index) {
            var sp = stackSave();
            try {
                dynCall_v(index)
            } catch (e) {
                stackRestore(sp);
                if (e !== e + 0 && e !== "longjmp") throw e;
                _setThrew(1, 0)
            }
        }

        function invoke_vi(index, a1) {
            var sp = stackSave();
            try {
                dynCall_vi(index, a1)
            } catch (e) {
                stackRestore(sp);
                if (e !== e + 0 && e !== "longjmp") throw e;
                _setThrew(1, 0)
            }
        }

        function invoke_vii(index, a1, a2) {
            var sp = stackSave();
            try {
                dynCall_vii(index, a1, a2)
            } catch (e) {
                stackRestore(sp);
                if (e !== e + 0 && e !== "longjmp") throw e;
                _setThrew(1, 0)
            }
        }

        function invoke_viii(index, a1, a2, a3) {
            var sp = stackSave();
            try {
                dynCall_viii(index, a1, a2, a3)
            } catch (e) {
                stackRestore(sp);
                if (e !== e + 0 && e !== "longjmp") throw e;
                _setThrew(1, 0)
            }
        }

        function invoke_viiii(index, a1, a2, a3, a4) {
            var sp = stackSave();
            try {
                dynCall_viiii(index, a1, a2, a3, a4)
            } catch (e) {
                stackRestore(sp);
                if (e !== e + 0 && e !== "longjmp") throw e;
                _setThrew(1, 0)
            }
        }
        var asmGlobalArg = {};
        var asmLibraryArg = {
            "D": ___assert_fail,
            "nb": ___buildEnvironment,
            "mb": ___clock_gettime,
            "s": ___lock,
            "lb": ___map_file,
            "kb": ___syscall10,
            "o": ___syscall102,
            "jb": ___syscall114,
            "ib": ___syscall12,
            "hb": ___syscall122,
            "gb": ___syscall142,
            "fb": ___syscall15,
            "eb": ___syscall168,
            "db": ___syscall183,
            "cb": ___syscall192,
            "bb": ___syscall194,
            "ba": ___syscall195,
            "ab": ___syscall196,
            "$a": ___syscall197,
            "_a": ___syscall198,
            "Za": ___syscall199,
            "Ya": ___syscall20,
            "Xa": ___syscall200,
            "Wa": ___syscall205,
            "Va": ___syscall212,
            "Ua": ___syscall219,
            "Ta": ___syscall220,
            "n": ___syscall221,
            "Sa": ___syscall268,
            "Ra": ___syscall3,
            "Qa": ___syscall33,
            "Pa": ___syscall34,
            "Oa": ___syscall38,
            "Na": ___syscall39,
            "Ma": ___syscall4,
            "La": ___syscall40,
            "Ka": ___syscall41,
            "Ja": ___syscall42,
            "Q": ___syscall5,
            "Ia": ___syscall54,
            "Ha": ___syscall60,
            "Ga": ___syscall63,
            "Fa": ___syscall77,
            "Ea": ___syscall83,
            "Da": ___syscall85,
            "Ca": ___syscall9,
            "Ba": ___syscall91,
            "p": ___unlock,
            "C": ___wasi_fd_close,
            "aa": ___wasi_fd_fdstat_get,
            "Aa": ___wasi_fd_read,
            "pb": ___wasi_fd_seek,
            "za": ___wasi_fd_write,
            "J": __exit,
            "__memory_base": 1024,
            "__table_base": 0,
            "$": _abort,
            "ya": _asctime_r,
            "xa": _chroot,
            "wa": _clock_gettime,
            "va": _difftime,
            "y": _dlclose,
            "t": _dlerror,
            "B": _dlopen,
            "u": _dlsym,
            "x": _emscripten_get_heap_size,
            "ua": _emscripten_memcpy_big,
            "w": _emscripten_resize_heap,
            "sa": _execl,
            "ra": _execle,
            "qa": _execvp,
            "A": _exit,
            "pa": _flock,
            "oa": _fork,
            "na": _getdtablesize,
            "m": _getenv,
            "_": _getgrnam,
            "Z": _gethostbyaddr,
            "Y": _gethostbyname_r,
            "la": _getloadavg,
            "ka": _getprotobyname,
            "ja": _getprotobynumber,
            "X": _getpwnam,
            "ia": _getpwuid,
            "j": _gettimeofday,
            "W": _gmtime_r,
            "V": _kill,
            "ob": _llvm_bswap_i64,
            "P": _llvm_log10_f64,
            "H": _llvm_stackrestore,
            "O": _llvm_stacksave,
            "ha": _localtime_r,
            "c": _longjmp,
            "ga": _mktime,
            "N": _nanosleep,
            "G": _popen,
            "z": _pthread_setcancelstate,
            "U": _putenv,
            "F": _setitimer,
            "i": _sigaction,
            "M": _sigaddset,
            "q": _sigdelset,
            "E": _sigemptyset,
            "tb": _sigfillset,
            "sb": _signal,
            "L": _sigprocmask,
            "T": _strftime,
            "rb": _strptime,
            "S": _sysconf,
            "k": _time,
            "R": _tzset,
            "fa": _unsetenv,
            "qb": _usleep,
            "ea": _utime,
            "da": _waitpid,
            "l": abort,
            "a": getTempRet0,
            "K": invoke_i,
            "e": invoke_ii,
            "h": invoke_iii,
            "f": invoke_iiii,
            "I": invoke_iiiii,
            "ta": invoke_iiiiii,
            "ma": invoke_iiiiiii,
            "g": invoke_v,
            "d": invoke_vi,
            "r": invoke_vii,
            "v": invoke_viii,
            "ca": invoke_viiii,
            "memory": wasmMemory,
            "b": setTempRet0,
            "table": wasmTable
        };
        var asm = Module["asm"](asmGlobalArg, asmLibraryArg, buffer);
        Module["asm"] = asm;
        var ___emscripten_environ_constructor = Module["___emscripten_environ_constructor"] = function() {
            return Module["asm"]["ub"].apply(null, arguments)
        };
        var ___errno_location = Module["___errno_location"] = function() {
            return Module["asm"]["vb"].apply(null, arguments)
        };
        var __get_daylight = Module["__get_daylight"] = function() {
            return Module["asm"]["wb"].apply(null, arguments)
        };
        var __get_environ = Module["__get_environ"] = function() {
            return Module["asm"]["xb"].apply(null, arguments)
        };
        var __get_timezone = Module["__get_timezone"] = function() {
            return Module["asm"]["yb"].apply(null, arguments)
        };
        var __get_tzname = Module["__get_tzname"] = function() {
            return Module["asm"]["zb"].apply(null, arguments)
        };
        var _free = Module["_free"] = function() {
            return Module["asm"]["Ab"].apply(null, arguments)
        };
        var _htons = Module["_htons"] = function() {
            return Module["asm"]["Bb"].apply(null, arguments)
        };
        var _llvm_bswap_i32 = Module["_llvm_bswap_i32"] = function() {
            return Module["asm"]["Cb"].apply(null, arguments)
        };
        var _malloc = Module["_malloc"] = function() {
            return Module["asm"]["Db"].apply(null, arguments)
        };
        var _memalign = Module["_memalign"] = function() {
            return Module["asm"]["Eb"].apply(null, arguments)
        };
        var _memcpy = Module["_memcpy"] = function() {
            return Module["asm"]["Fb"].apply(null, arguments)
        };
        var _memset = Module["_memset"] = function() {
            return Module["asm"]["Gb"].apply(null, arguments)
        };
        var _ntohs = Module["_ntohs"] = function() {
            return Module["asm"]["Hb"].apply(null, arguments)
        };
        var _php_embed_init = Module["_php_embed_init"] = function() {
            return Module["asm"]["Ib"].apply(null, arguments)
        };
        var _php_embed_shutdown = Module["_php_embed_shutdown"] = function() {
            return Module["asm"]["Jb"].apply(null, arguments)
        };
        var _pib_eval = Module["_pib_eval"] = function() {
            return Module["asm"]["Kb"].apply(null, arguments)
        };
        var _setThrew = Module["_setThrew"] = function() {
            return Module["asm"]["Lb"].apply(null, arguments)
        };
        var _zend_eval_string = Module["_zend_eval_string"] = function() {
            return Module["asm"]["Mb"].apply(null, arguments)
        };
        var stackAlloc = Module["stackAlloc"] = function() {
            return Module["asm"]["Zb"].apply(null, arguments)
        };
        var stackRestore = Module["stackRestore"] = function() {
            return Module["asm"]["_b"].apply(null, arguments)
        };
        var stackSave = Module["stackSave"] = function() {
            return Module["asm"]["$b"].apply(null, arguments)
        };
        var dynCall_i = Module["dynCall_i"] = function() {
            return Module["asm"]["Nb"].apply(null, arguments)
        };
        var dynCall_ii = Module["dynCall_ii"] = function() {
            return Module["asm"]["Ob"].apply(null, arguments)
        };
        var dynCall_iii = Module["dynCall_iii"] = function() {
            return Module["asm"]["Pb"].apply(null, arguments)
        };
        var dynCall_iiii = Module["dynCall_iiii"] = function() {
            return Module["asm"]["Qb"].apply(null, arguments)
        };
        var dynCall_iiiii = Module["dynCall_iiiii"] = function() {
            return Module["asm"]["Rb"].apply(null, arguments)
        };
        var dynCall_iiiiii = Module["dynCall_iiiiii"] = function() {
            return Module["asm"]["Sb"].apply(null, arguments)
        };
        var dynCall_iiiiiii = Module["dynCall_iiiiiii"] = function() {
            return Module["asm"]["Tb"].apply(null, arguments)
        };
        var dynCall_v = Module["dynCall_v"] = function() {
            return Module["asm"]["Ub"].apply(null, arguments)
        };
        var dynCall_vi = Module["dynCall_vi"] = function() {
            return Module["asm"]["Vb"].apply(null, arguments)
        };
        var dynCall_vii = Module["dynCall_vii"] = function() {
            return Module["asm"]["Wb"].apply(null, arguments)
        };
        var dynCall_viii = Module["dynCall_viii"] = function() {
            return Module["asm"]["Xb"].apply(null, arguments)
        };
        var dynCall_viiii = Module["dynCall_viiii"] = function() {
            return Module["asm"]["Yb"].apply(null, arguments)
        };
        Module["asm"] = asm;
        Module["ccall"] = ccall;
        Module["getMemory"] = getMemory;
        Module["addRunDependency"] = addRunDependency;
        Module["removeRunDependency"] = removeRunDependency;
        Module["FS_createFolder"] = FS.createFolder;
        Module["FS_createPath"] = FS.createPath;
        Module["FS_createDataFile"] = FS.createDataFile;
        Module["FS_createPreloadedFile"] = FS.createPreloadedFile;
        Module["FS_createLazyFile"] = FS.createLazyFile;
        Module["FS_createLink"] = FS.createLink;
        Module["FS_createDevice"] = FS.createDevice;
        Module["FS_unlink"] = FS.unlink;
        Module["calledRun"] = calledRun;
        var calledRun;
        Module["then"] = function(func) {
            if (calledRun) {
                func(Module)
            } else {
                var old = Module["onRuntimeInitialized"];
                Module["onRuntimeInitialized"] = function() {
                    if (old) old();
                    func(Module)
                }
            }
            return Module
        };

        function ExitStatus(status) {
            this.name = "ExitStatus";
            this.message = "Program terminated with exit(" + status + ")";
            this.status = status
        }
        dependenciesFulfilled = function runCaller() {
            if (!calledRun) run();
            if (!calledRun) dependenciesFulfilled = runCaller
        };

        function run(args) {
            args = args || arguments_;
            if (runDependencies > 0) {
                return
            }
            preRun();
            if (runDependencies > 0) return;

            function doRun() {
                if (calledRun) return;
                calledRun = true;
                Module["calledRun"] = true;
                if (ABORT) return;
                initRuntime();
                preMain();
                if (Module["onRuntimeInitialized"]) Module["onRuntimeInitialized"]();
                postRun()
            }
            if (Module["setStatus"]) {
                Module["setStatus"]("Running...");
                setTimeout(function() {
                    setTimeout(function() {
                        Module["setStatus"]("")
                    }, 1);
                    doRun()
                }, 1)
            } else {
                doRun()
            }
        }
        Module["run"] = run;

        function exit(status, implicit) {
            if (implicit && noExitRuntime && status === 0) {
                return
            }
            if (noExitRuntime) {} else {
                ABORT = true;
                EXITSTATUS = status;
                exitRuntime();
                if (Module["onExit"]) Module["onExit"](status)
            }
            quit_(status, new ExitStatus(status))
        }
        if (Module["preInit"]) {
            if (typeof Module["preInit"] == "function") Module["preInit"] = [Module["preInit"]];
            while (Module["preInit"].length > 0) {
                Module["preInit"].pop()()
            }
        }
        noExitRuntime = true;
        run();
        return PHP
    });
})();

export {
    PHP
};
