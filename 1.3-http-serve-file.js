const http = require('http');
const fs = require("fs");

const log = () => {
  const usage = process.memoryUsage();
  const MB = 1024*1024;
  console.log(`${Math.floor(usage.rss/MB)}MB,${Math.floor(usage.arrayBuffers/MB)}MB`);
}

const logging = (ts) => {
  const id = setInterval(() => {
    log();
  }, ts);

  return () => {
    clearInterval(id);
  }
}

// Try to compare these two implement and see their memory usage.
// # Start the http service
// > node 1.3-http-serve-file.js
// 
// # Download the test-data.json file
// > curl http://localhost:8080 

// # without using stream
const requestListener = function (req, res) {
  const stop = logging(100);
  fs.readFile("./data/test-data.json", (err, data) => {
    res.write(data);
    stop();
  });
}

// # using stream
// const requestListener = function (req, res) {
//   const stop = logging(100);
//   fs.createReadStream("./data/test-data.json").pipe(res).on("finish", () => {
//     stop();
//   });
// }

http
  .createServer(requestListener)
  .listen(8080);
