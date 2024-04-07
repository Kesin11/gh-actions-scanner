const arg = Deno.args[0];

let fun;
if (arg === "221") {
  console.log("import 221");
  const { sumOf } = await import(
    "https://deno.land/std@0.221.0/collections/sum_of.ts"
  );
  fun = sumOf;
} else {
  console.log("import 218");
  const { sumOf } = await import(
    "https://deno.land/std@0.218.0/collections/sum_of.ts"
  );
  fun = sumOf;
}

const foo = [{ foo: 1 }, { foo: 2 }, { foo: 3 }];
const sumCount = fun(foo, (run) => run.foo);
console.log(sumCount);
