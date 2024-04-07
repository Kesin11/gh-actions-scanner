const arg = Deno.args[0];

let fun;
console.log(`import std@0.${arg}.0`);
const std = `std@0.${arg}.0`;
const { sumOf } = await import(
  `https://deno.land/${std}/collections/sum_of.ts`
);
fun = sumOf;

const foo = [{ foo: 1 }, { foo: 2 }, { foo: 3 }];
const sumCount = fun(foo, (run: any) => run.foo);
console.log(sumCount);
