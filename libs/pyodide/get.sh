urls=(
https://cdn.jsdelivr.net/npm/pyodide@0.23.4/console.html
https://cdn.jsdelivr.net/npm/pyodide@0.23.4/ffi.d.ts
https://cdn.jsdelivr.net/npm/pyodide@0.23.4/package.json
https://cdn.jsdelivr.net/npm/pyodide@0.23.4/pyodide.asm.js
https://cdn.jsdelivr.net/npm/pyodide@0.23.4/pyodide.asm.wasm
https://cdn.jsdelivr.net/npm/pyodide@0.23.4/pyodide.d.ts
https://cdn.jsdelivr.net/npm/pyodide@0.23.4/pyodide.js
https://cdn.jsdelivr.net/npm/pyodide@0.23.4/pyodide.js.map
https://cdn.jsdelivr.net/npm/pyodide@0.23.4/pyodide.mjs
https://cdn.jsdelivr.net/npm/pyodide@0.23.4/pyodide.mjs.map
https://cdn.jsdelivr.net/npm/pyodide@0.23.4/python_stdlib.zip
https://cdn.jsdelivr.net/npm/pyodide@0.23.4/README.md
https://cdn.jsdelivr.net/npm/pyodide@0.23.4/repodata.json
)

for url in ${urls[@]}
do
    wget "$url"
done
