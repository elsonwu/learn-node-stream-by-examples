const fs = require("fs");

const readableFileStream = fs.createReadStream("./data/test-data.json")
const writableFileStream = fs.createWriteStream("./data/new-test-data.json")

// the data comes from readable stream to writable stream, just like the water
// never load the whole file into memory, no worries how large the file in the future will become.
//
// NOTE
// This is a boring example, but please note the readable stream and writable stream don't have to be file stream
// it can be any stream, so means we always downloading file from s3 or http, or uploading file to s3.
readableFileStream.pipe(writableFileStream);
