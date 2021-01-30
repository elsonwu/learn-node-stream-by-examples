const obj = {
  name: "Elson",
  city: "Guangzhou",
};

// continue with previous example, not only the builtin type,
// we can even implement the iterator to make something become iterable
obj[Symbol.iterator] = () => {
  let i = -1;
  const keys = Object.keys(obj);
  return {
    next: () => {
      i++;
      const k = keys[i];
      const v = obj[keys[i]];
      return {
        done: !k,
        value: v,
      };
    },
  };
};

for (const v of obj) {
  console.log(`${v}`);
}
