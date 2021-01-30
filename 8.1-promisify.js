// we get used to 
const stream = require("stream");
const util = require("util");

const dataItem = stream.Readable.from("this is a test");

const trans = stream.Transform({
  transform: (chunk, encoding, next) => {
    next("Test error")
  }
})

const pipeline = util.promisify(stream.pipeline);
const main = async () => {
  try {
    await pipeline(
      dataItem,
      trans
    )
  } catch (err) {
    console.log("# ERROR", err)
  }
}

main();
