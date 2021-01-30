const stream = require("stream");

// the data source not always a file, can be anything else
const readStream = stream.Readable.from("this is a test".split(""), {
  highWaterMark: 1 // control the chunk size for each read
});

const main = async () => {
  for await (const c of readStream) {
    console.log(c)
  }
};

main();
