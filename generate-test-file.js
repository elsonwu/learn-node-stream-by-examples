const fs = require("fs");
const stream = require("stream");
const util = require("util");

// @param n number, how many records in the json file
function* gen(n = 10000) {
  yield "[\n";

  let i = 1;
  while (i <= n - 1) {
    yield `  { "id": "# test ${i}" },\n`;
    i++;
  }

  yield `  { "id": "# test ${n}" }\n`;

  yield "]";
}

const progress = () => {
  const createLogger = (base=100000, dotN=7) => {
    let logN = 1;
    return (total, done) => {
      const remainder = total % base;
      if (remainder !== 0 && !done) {
        return;
      }

      logN++;
      process.stdout.clearLine();
      process.stdout.cursorTo(0);

      if (done) {
        process.stdout.write(`done\n`);
      } else {
        process.stdout.write(`generating${new Array(logN % dotN).join(".")}`);
      }
    };
  };

  let total = 0;
  const log = createLogger();

  return stream.Transform({
    final: err => {
      log(total, true);
    },
    transform: (chunk, _encoding, next) => {
      total++;
      log(total, false);
      next(null, chunk);
    }
  });
};

const dataStream = stream.Readable.from(gen(10000000));

const fileStream = fs.createWriteStream("./data/test-data.json");

const pipeline = util.promisify(stream.pipeline);

const main = async () => {
  console.log("generating test file");
  await pipeline(dataStream, progress(), fileStream);
  console.log("done");
};

main();
