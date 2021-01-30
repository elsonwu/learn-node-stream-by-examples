// the compression example is using the builtin duplex/transform, but usually we have our own business logic to process the data, so the Transform stream is helpful.
const fs = require("fs");
const stream = require("stream");

// Transform works as a middleware, in the example below, we try to log when the download is finished
const progress = () => {
  return new stream.Transform({
    final: () => {
      console.log(`finished`);
    },
    // In transform, the transform method is the main function to put our process logic
    // the chunk is the data from upstream stream, and the next is a callback function to pass
    // the error and data to the downstream stream
    // the encoding default is UTF-8 which is good enough for us
    transform: (chunk, _encoding, next) => {
      console.log(`received data in size ${chunk.length}`);
      next(null, chunk);
    },
  });
};

fs.createReadStream("./data/test-data.json", {
	// this is the parameter to control the chunk size
  // set this value to slow down to see the progress
  highWaterMark: 2<<12, 
})
  .pipe(progress())
  .pipe(fs.createWriteStream("./data/new-test-data.json"));

