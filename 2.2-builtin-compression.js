const fs = require("fs");
const zlib = require("zlib");

// Only one readable and one writable stream looks not too useful like the example copy file
// But we can add as many "middlewares" as we want in the middle, like gzip below
// so when the data come cross the gzip stream, it can compress the data, then pass the data
// down to the next stream, so why here when the last file stream receives the data which is compressed.
//
// And obviously, these kinds of stream is writable and readable.
// They're Duplex and Transform in Node
fs.createReadStream("./data/test-data.json")
  .pipe(zlib.createGzip())
  .pipe(fs.createWriteStream("./data/test-data.json.gz"));

