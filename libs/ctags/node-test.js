const Ctags=require('./ctags.js');

Ctags['INITIAL_MEMORY']=167772160;
Ctags().then(module=>{
    console.log(module.FS);
    // module.FS.writeFile('/test.c', `
    //     #include <stdio.h>
    //     long fib(long num){
    //         if(num < 2){
    //             return 1;
    //         }
    //         return fib(num-1)+fib(num-2);
    //     }

    //     int main(int argc, char* argv[]) {
    //         long num=40;
    //         printf("fib(%ld): %ld\n", num, fib(num));
    //         return 0;
    //     }
    // `);
    // let callCtags=module.cwrap('main', 'number', ['number', 'number']);
    // let strArr = ['ctags', '/test.c'];
    // let ptrArr = module.stackAlloc(strArr.length * 4);
    // for (let i = 0; i < strArr.length; i++) {
    //     let len = strArr[i].length + 1;
    //     let ptr = module.stackAlloc(len);
    //     module.stringToUTF8(strArr[i], ptr, len);
    //     module.setValue(ptrArr + i * 4, ptr, "i32");
    // }
    // try {
    //    callCtags(strArr.length, ptrArr);
    // } catch (error) {
    //    console.log(error);  
    // }

})

