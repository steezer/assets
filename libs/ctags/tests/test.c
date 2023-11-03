#include <stdio.h>

int years=0;

long fib(long num){
    if(num < 2){
        return 1;
    }
    return fib(num-1)+fib(num-2);
}

int main(int argc, char* argv[]) {
    long num=40;
    
    printf("%d\n", years);
    printf("fib(%ld): %ld\\n", num, fib(num));
    return 0;
}
