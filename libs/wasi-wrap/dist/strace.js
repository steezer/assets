export function strace(imports, no_trace) {
    return new Proxy(imports, {
        get(target, prop, receiver) {
            let f = Reflect.get(target, prop, receiver);
            if (no_trace.includes(prop)) {
                return f
            }
            return function (...args) {
                console.log(prop, "(", ...args, ")");
                let result = Reflect.apply(f, receiver, args);
                console.log(" =", result);
                return result
            }
        }
    })
}