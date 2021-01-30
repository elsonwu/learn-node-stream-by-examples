const obj = {
  itemIds: [1, 2]
};

const query = async (key) =>
  new Promise((resolve, _) => setTimeout(() => resolve(key), 1000));

// similarly to Symbol.iterator, there's Symbol.asyncIterator, which support async
obj[Symbol.asyncIterator] = () => {
  let i = -1;
  return {
    next: async () => {
      i++;
      const k = obj.itemIds[i];
      const v = await query(k);
      return {
        done: !k,
        value: [k, v],
      };
    },
  };
};

const main = async () => {
  for await (const s of obj) {
    console.log(s);
  }
};

main();
