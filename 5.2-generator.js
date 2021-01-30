const stream = require("stream");

const sleep = async (ts) => new Promise((resolve, _) => setTimeout(resolve, ts));

// not only the simple generator, but also async generator is working fine with stream
async function* gen() {
  await sleep(1000);
  yield Promise.resolve("1");
  await sleep(1000);
  yield Promise.resolve("2");
  await sleep(1000);
  yield Promise.resolve("3");
}

const readStream = stream.Readable.from(gen());

const main = async () => {
  // without the need to know the data source, only if it's stream
  // we can keep always using the same way to consume the stream
  // which is really cool
  for await (const c of readStream) {
    console.log(c)
  }
};

main();
