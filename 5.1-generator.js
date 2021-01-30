const stream = require("stream");

function* gen() {
  yield "1"
  yield "2"
  yield "3"
}

const main = async () => {
  // not only can be string or buffer or array, it can be generator as well
  const readStream = stream.Readable.from(gen());
  for await (const c of readStream) {
    console.log(c)
  }
};

main();
