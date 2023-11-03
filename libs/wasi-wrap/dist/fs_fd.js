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

import * as wasi from "./wasi_defs.js";
import { Directory } from "./fs_core.js";
import { Fd } from "./fd.js";

export class OpenFile extends Fd {
    fd_fdstat_get() {
        return {
            ret: 0,
            fdstat: new wasi.Fdstat(wasi.FILETYPE_REGULAR_FILE, 0)
        }
    }
    fd_read(view8, iovs) {
        let nread = 0;
        for (let iovec of iovs) {
            if (this.file_pos < this.file.data.byteLength) {
                let slice = this.file.data.slice(Number(this.file_pos), Number(this.file_pos + BigInt(iovec.buf_len)));
                view8.set(slice, iovec.buf);
                this.file_pos += BigInt(slice.length);
                nread += slice.length
            } else {
                break
            }
        }
        return {
            ret: 0,
            nread
        }
    }
    fd_seek(offset, whence) {
        let calculated_offset;
        switch (whence) {
            case wasi.WHENCE_SET:
                calculated_offset = offset;
                break;
            case wasi.WHENCE_CUR:
                calculated_offset = this.file_pos + offset;
                break;
            case wasi.WHENCE_END:
                calculated_offset = BigInt(this.file.data.byteLength) + offset;
                break;
            default:
                return {
                    ret:
                        wasi.ERRNO_INVAL,
                    offset: 0n
                }
        }
        if (calculated_offset < 0) {
            return {
                ret: wasi.ERRNO_INVAL,
                offset: 0n
            }
        }
        this.file_pos = calculated_offset;
        return {
            ret: 0,
            offset: this.file_pos
        }
    }
    fd_write(view8, iovs) {
        let nwritten = 0;
        if (this.file.readonly) return {
            ret: wasi.ERRNO_BADF,
            nwritten
        };
        for (let iovec of iovs) {
            let buffer = view8.slice(iovec.buf, iovec.buf + iovec.buf_len);
            if (this.file_pos + BigInt(buffer.byteLength) > this.file.size) {
                let old = this.file.data;
                this.file.data = new Uint8Array(Number(this.file_pos + BigInt(buffer.byteLength)));
                this.file.data.set(old)
            }
            this.file.data.set(buffer.slice(0, Number(this.file.size - this.file_pos)), Number(this.file_pos));
            this.file_pos += BigInt(buffer.byteLength);
            nwritten += iovec.buf_len
        }
        return {
            ret: 0,
            nwritten
        }
    }
    fd_filestat_get() {
        return {
            ret: 0,
            filestat: this.file.stat()
        }
    }
    constructor(file) {
        super();
        _define_property(this, "file", void 0);
        _define_property(this, "file_pos", 0n);
        this.file = file
    }
}

export class OpenSyncOPFSFile extends Fd {
    fd_fdstat_get() {
        return {
            ret: 0,
            fdstat: new wasi.Fdstat(wasi.FILETYPE_REGULAR_FILE, 0)
        }
    }
    fd_filestat_get() {
        return {
            ret: 0,
            filestat: new wasi.Filestat(wasi.FILETYPE_REGULAR_FILE, BigInt(this.file.handle.getSize()))
        }
    }
    fd_read(view8, iovs) {
        let nread = 0;
        for (let iovec of iovs) {
            if (this.position < this.file.handle.getSize()) {
                let buf = new Uint8Array(view8.buffer, iovec.buf, iovec.buf_len);
                let n = this.file.handle.read(buf, {
                    at: Number(this.position)
                });
                this.position += BigInt(n);
                nread += n
            } else {
                break
            }
        }
        return {
            ret: 0,
            nread
        }
    }
    fd_seek(offset, whence) {
        let calculated_offset;
        switch (whence) {
            case wasi.WHENCE_SET:
                calculated_offset = BigInt(offset);
                break;
            case wasi.WHENCE_CUR:
                calculated_offset = this.position + BigInt(offset);
                break;
            case wasi.WHENCE_END:
                calculated_offset = BigInt(this.file.handle.getSize()) + BigInt(offset);
                break;
            default:
                return {
                    ret:
                        wasi.ERRNO_INVAL,
                    offset: 0n
                }
        }
        if (calculated_offset < 0) {
            return {
                ret: wasi.ERRNO_INVAL,
                offset: 0n
            }
        }
        this.position = calculated_offset;
        return {
            ret: wasi.ERRNO_SUCCESS,
            offset: this.position
        }
    }
    fd_write(view8, iovs) {
        let nwritten = 0;
        if (this.file.readonly) return {
            ret: wasi.ERRNO_BADF,
            nwritten
        };
        for (let iovec of iovs) {
            let buf = new Uint8Array(view8.buffer, iovec.buf, iovec.buf_len);
            let n = this.file.handle.write(buf, {
                at: Number(this.position)
            });
            this.position += BigInt(n);
            nwritten += n
        }
        return {
            ret: wasi.ERRNO_SUCCESS,
            nwritten
        }
    }
    fd_datasync() {
        this.file.handle.flush();
        return wasi.ERRNO_SUCCESS
    }
    fd_sync() {
        return this.fd_datasync()
    }
    fd_close() {
        return wasi.ERRNO_SUCCESS
    }
    constructor(file) {
        super();
        _define_property(this, "file", void 0);
        _define_property(this, "position", 0n);
        this.file = file
    }
}

export class OpenDirectory extends Fd {
    fd_fdstat_get() {
        return {
            ret: 0,
            fdstat: new wasi.Fdstat(wasi.FILETYPE_DIRECTORY, 0)
        }
    }
    fd_readdir_single(cookie) {
        if (cookie >= BigInt(Object.keys(this.dir.contents).length)) {
            return {
                ret: 0,
                dirent: null
            }
        }
        let name = Object.keys(this.dir.contents)[Number(cookie)];
        let entry = this.dir.contents[name];
        let encoded_name = new TextEncoder("utf-8").encode(name);
        return {
            ret: 0,
            dirent: new wasi.Dirent(cookie + 1n, name, entry.stat().filetype)
        }
    }
    path_filestat_get(flags, path) {
        let entry = this.dir.get_entry_for_path(path);
        if (entry == null) {
            return {
                ret: wasi.ERRNO_EXIST,
                filestat: null
            }
        }
        return {
            ret: 0,
            filestat: entry.stat()
        }
    }
    path_open(dirflags, path, oflags, fs_rights_base, fs_rights_inheriting, fd_flags) {
        let entry = this.dir.get_entry_for_path(path);
        if (entry == null) {
            if ((oflags & wasi.OFLAGS_CREAT) == wasi.OFLAGS_CREAT) {
                entry = this.dir.create_entry_for_path(path, (oflags & wasi.OFLAGS_DIRECTORY) == wasi.OFLAGS_DIRECTORY)
            } else {
                return {
                    ret: wasi.ERRNO_NOENT,
                    fd_obj: null
                }
            }
        } else if ((oflags & wasi.OFLAGS_EXCL) == wasi.OFLAGS_EXCL) {
            return {
                ret: wasi.ERRNO_EXIST,
                fd_obj: null
            }
        }
        if ((oflags & wasi.OFLAGS_DIRECTORY) == wasi.OFLAGS_DIRECTORY && entry.stat().filetype != wasi.FILETYPE_DIRECTORY) {
            return {
                ret: wasi.ERRNO_ISDIR,
                fd_obj: null
            }
        }
        if (entry.readonly && (fs_rights_base & BigInt(wasi.RIGHTS_FD_WRITE)) == BigInt(wasi.RIGHTS_FD_WRITE)) {
            return {
                ret: wasi.ERRNO_PERM,
                fd_obj: null
            }
        }
        if (!(entry instanceof Directory) && (oflags & wasi.OFLAGS_TRUNC) == wasi.OFLAGS_TRUNC) {
            let ret = entry.truncate();
            if (ret != wasi.ERRNO_SUCCESS) return {
                ret,
                fd_obj: null
            }
        }
        return {
            ret: wasi.ERRNO_SUCCESS,
            fd_obj: entry.open(fd_flags)
        }
    }
    path_create_directory(path) {
        return this.path_open(0, path, wasi.OFLAGS_CREAT | wasi.OFLAGS_DIRECTORY, 0n, 0n, 0).ret
    }
    constructor(dir) {
        super();
        _define_property(this, "dir", void 0);
        this.dir = dir
    }
}

export class PreopenDirectory extends OpenDirectory {
    fd_prestat_get() {
        return {
            ret: 0,
            prestat: wasi.Prestat.dir(this.prestat_name.length)
        }
    }
    fd_prestat_dir_name() {
        return {
            ret: 0,
            prestat_dir_name: this.prestat_name
        }
    }
    constructor(name, contents) {
        super(new Directory(contents));
        _define_property(this, "prestat_name", void 0);
        this.prestat_name = new TextEncoder("utf-8").encode(name)
    }
}
