const fs = require("fs");
const stream = require("stream");

// Continue to write a better function to show the progress in cli
const progress = () => {
  const newOutputRefresher = () => {
    let totalBytes = 0;

    return (size, done) => {
      process.stdout.clearLine();
      process.stdout.cursorTo(0);

      totalBytes += size;

      const display = Math.floor(totalBytes / 1024 / 1024);

      if (done) {
        process.stdout.write(`Downloaded: ${display}MB\n`);
      } else {
        process.stdout.write(`Downloaded: ${display}MB`);
      }
    }
  }

  const outputRefresher = newOutputRefresher();
  return new stream.Transform({
    final: () => {
      outputRefresher(0, true);
    },
    transform: (chunk, _encoding, next) => {
      outputRefresher(chunk.length);
      next(null, chunk);
    }
  });
}

fs.createReadStream("./data/test-data.json", {
  highWaterMark: 2<<12 
})
  .pipe(progress())
  .pipe(fs.createWriteStream("./data/new-test-data.json"));


