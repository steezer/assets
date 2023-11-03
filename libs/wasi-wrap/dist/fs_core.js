function _define_property(obj, key, value) {
    if (key in obj) {
        Object.defineProperty(obj, key, {
            value: value,
            enumerable: true,
            configurable: true,
            writable: true
        })
    } else {
        obj[key] = value
    }
    return obj
}

import {
    OpenDirectory,
    OpenFile,
    OpenSyncOPFSFile
} from "./fs_fd.js";

import * as wasi from "./wasi_defs.js";

export class File {
    open(fd_flags) {
        let file = new OpenFile(this);
        if (fd_flags & wasi.FDFLAGS_APPEND) file.fd_seek(0n, wasi.WHENCE_END);
        return file
    }
    get size() {
        return BigInt(this.data.byteLength)
    }
    stat() {
        return new wasi.Filestat(wasi.FILETYPE_REGULAR_FILE, this.size)
    }
    truncate() {
        if (this.readonly) return wasi.ERRNO_PERM;
        this.data = new Uint8Array([]);
        return wasi.ERRNO_SUCCESS
    }
    constructor(data, options) {
        _define_property(this, "data", void 0);
        _define_property(this, "readonly", void 0);
        this.data = new Uint8Array(data);
        this.readonly = !!options ? options : this.readonly
    }
}
export class SyncOPFSFile {
    open(fd_flags) {
        let file = new OpenSyncOPFSFile(this);
        if (fd_flags & wasi.FDFLAGS_APPEND) file.fd_seek(0n, wasi.WHENCE_END);
        return file
    }
    get size() {
        return BigInt(this.handle.getSize())
    }
    stat() {
        return new wasi.Filestat(wasi.FILETYPE_REGULAR_FILE, this.size)
    }
    truncate() {
        if (this.readonly) return wasi.ERRNO_PERM;
        this.handle.truncate(0);
        return wasi.ERRNO_SUCCESS
    }
    constructor(handle, options) {
        _define_property(this, "handle", void 0);
        _define_property(this, "readonly", void 0);
        this.handle = handle;
        this.readonly = !!options ? options : this.readonly
    }
}
export class Directory {
    open(fd_flags) {
        return new OpenDirectory(this)
    }
    stat() {
        return new wasi.Filestat(wasi.FILETYPE_DIRECTORY, 0n)
    }
    get_entry_for_path(path) {
        let entry = this;
        for (let component of path.split("/")) {
            if (component == "") break;
            if (component == ".") continue;
            if (!(entry instanceof Directory)) {
                return null
            }
            if (entry.contents[component] != undefined) {
                entry = entry.contents[component]
            } else {
                return null
            }
        }
        return entry
    }
    create_entry_for_path(path, is_dir) {
        let entry = this;
        let components = path.split("/").filter(component => component != "/");
        for (let i = 0; i < components.length; i++) {
            let component = components[i];
            if (entry.contents[component] != undefined) {
                entry = entry.contents[component]
            } else {
                if (i == components.length - 1 && !is_dir) {
                    entry.contents[component] = new File(new ArrayBuffer(0))
                } else {
                    entry.contents[component] = new Directory({})
                }
                entry = entry.contents[component]
            }
        }
        return entry
    }

    constructor(contents) {
        _define_property(this, "contents", void 0);
        _define_property(this, "readonly", false);
        this.contents = contents
    }

}
