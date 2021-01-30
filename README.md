# Learning Node Stream by examples



# Why stream?

```javascript
// Are you read the whole file then parse it into json like this?
// But how about a file its size is 1TB?
JSON.parse(fileData)
```

- When handling large file, should load the data a bit by a bit instead of all at once.
- Small amount of memory can handle large file

# Basic

- Readable stream: the data source, which would be consumed by downstream.
- Writable stream: the destination, which should write the data into.
- Duplex & transform: the middleware, which is writable and readable, we'll focus on transform stream.

```javascript
// Let's compare these two

// Read the whole file into memory then process which would take a lot memory when the file size is huge.
+------------+                       +------------+                       +------------+
|            |                       |            |                       |            |
| Large File | --------------------> |   Memory   | --------------------> | destination| 
|            |                       |            |                       |            |
+------------+                       +------------+                       +------------+
  
  
// Stream (one readable + one writeable stream), read the file in chunk-based, process a bit by a bit.
+------------+                                                            +------------+  
|            |     +-----+    +-----+    +-----+    +-----+    +-----+    |            |
| Large File | --->|chunk|--->|chunk|--->|chunk|--->|chunk|--->|chunk|--->| destination| 
|            |     +-----+    +-----+    +-----+    +-----+    +-----+    |            |
+------------+                                                            +------------+
      |                                                                         |
Readable Stream                                                           Writable Stream
      
// Stream, have one or more transform streams.
+------------+                                                            +------------+  
|            |     +-----+    +-----+    +-----+    +-----+    +-----+    |            |
| Large File | --->|chunk|--->|chunk|--->|  T  |--->|chunk|--->|chunk|--->| destination| 
|            |     +-----+    +-----+    +-----+    +-----+    +-----+    |            |
+------------+                              |                             +------------+
      |                                     |                                   |
Readable Stream                       Transform Stream                    Writable Stream
  

// Think about stream is something like pipe in shell
> command1 | command2 | command3 > dump
```

# With vs without stream

```javascript
// run this command to generate the test-data.json for testing purpose.
> node generate-test-file.json
```

```javascript
// here is a simple example by serving a large file.
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
// my output
// 163MB,285MB
// 300MB,285MB
const requestListener = function (req, res) {
  const stop = logging(100);
  fs.readFile("./data/test-data.json", (err, data) => {
    res.write(data);
    stop();
  });
}

// # using stream
// my output
// 30MB,2MB
// 32MB,4MB
// ...
// const requestListener = function (req, res) {
//   const stop = logging(100);
//   fs.createReadStream("./data/test-data.json").pipe(res).on("finish", () => {
//     stop();
//   });
// }

http
  .createServer(requestListener)
  .listen(8080);
```

# Examples

## Copying file

```javascript
const fs = require("fs");

const readableFileStream = fs.createReadStream("./data/test-data.json")
const writableFileStream = fs.createWriteStream("./data/new-test-data.json")

// This is a boring example, but please note the readable stream and writable stream don't have to be file stream, it can be any stream, so means we can always use the same way to read data.
readableFileStream.pipe(writableFileStream);
```

## Download file from s3

```javascript
// It'll work just the same as the copy file above, so by using stream, we don't need to worry where the data source is.
const aws = require("aws-sdk");
const fs = require("fs");

const s3 = new aws.S3();
const readableFileStream = s3.getObject({
    // omit...
}).createReadStream();

const writableFileStream = fs.createWriteStream("the-new-file-path")
readableFileStream.pipe(writableFileStream);
```

## Compression

```javascript
const fs = require("fs");
const zlib = require("zlib");

// Only one readable and one writable stream looks not too useful 
// like the example copy file, but we can add as many "middlewares" 
// as we want in the middle, like gzip below, so when the data come 
// cross the gzip stream, it can compress the data, then pass the data
// down to the next stream, so why here when the last file stream receives
// the data which is compressed.
//
// And obviously, these kinds of stream is writable and readable.
// They're Duplex and Transform in Node
fs.createReadStream("./data/test-data.json")
  .pipe(zlib.createGzip())
  .pipe(fs.createWriteStream("./data/test-data.gz"));
```

## Transform - simple log

```javascript
// the compression example is using the builtin duplex/transform, 
// but usually we have our own business logic to process the data,
// so the Transform stream is helpful.
const fs = require("fs");
const stream = require("stream");

// Transform works as a middleware, in the example below, we try to 
// log when the download is finished
const progress = () => {
  return new stream.Transform({
    final: () => {
      console.log(`finished`);
    },
    // In transform, the transform method is the main function to put 
    // our process logic.
    // the chunk is the data from upstream stream, and the next is a 
    // callback function to pass
    // the error and data to the downstream stream
    // the encoding default is UTF-8 which is good enough for us
    transform: (chunk, _encoding, next) => {
      console.log(`received data in size ${chunk.length}`);
      next(null, chunk);
    },
  });
};

fs.createReadStream("./data/test-data.json")
  .pipe(progress())
  .pipe(fs.createWriteStream("./data/new-test-data.json"));
```

## Transform - simple download progress

```javascript
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
  // This is the parameter to control the chunk size
  // set a small value here to slow down the speed and
  // see the progress
  highWaterMark: 2<<12 // 8192kb
})
  .pipe(progress())
  .pipe(fs.createWriteStream("./data/new-test-data.json"));
```

## Transform - simple object array parser

```javascript
const fs = require("fs");
const stream = require("stream");

// here is a simple parser to show how the transform parse the large file
// by reading a small set of data instead of reading it all at once.
// and this parser only works for the specific json structure like below:
// [
//    { ... },
//    { ... },
//    ...
// ]
// the basic algorithm is:
// use a simple stack to store the {, so we can tell if it's the out most 
// or another { inside the {}
// use a buffer to store the chunk income
// use an items to store all object currently found
const objectArrayParser = () => {
  const items = [];
  const buffer = [];
  const stack = [];
  return new stream.Transform({
    readableObjectMode: true,
    // writableObjectMode: true,
    transform: (chunk, _encoding, next) => {
      // here we don't care the encoding, default UTF-8 is good enough
      // but in order to handle the multi-bytes language like Chinese, 
      // we couldn't use chunk.toString() directly
      // because you couldn't sure if the chunk would cut the word in the middle
      for (const c of chunk) {
        switch (c) {
          case 123: // {
            stack.push(c);
            buffer.push(c);
            break;

          case 125: // }
            if (stack.length) {
              buffer.push(c);
            }
            stack.pop();
            
            // when the stack no more { means it's the out most } already.
            // so our buffer should be a json string.
            if (!stack.length) {
              // NOTE
              // here I use the buffer.splice(0) to pop the whole array out
              // and make the buffer become empty array again.
              items.push(JSON.parse(Buffer.from(buffer.splice(0)).toString()));
            }

            break;
          default:
            if (stack.length) {
              buffer.push(c);
            }
        }
      }

      // NOTE
      // when the chunk size is too large which contain too many items at once
      // it would make some items left even after our stream is closed.
      // so below I use a hack way by setting "highWaterMark: 1" to slow it down
      next(null, items.pop());
    }
  });
};

const itemStream = fs.createReadStream("./data/test-data.json", {
  // NOTE
  // here is a must to slow down the data stream for this simple parser
  // by default, the highWaterMark is 64kb on file
  // so it will load too many items into our parser at once, 
  // but we couldn't consume faster enough
  // then will store too many object in the items after the upper 
  // stream reached its end, then closed.
  highWaterMark: 1, 
}).pipe(objectArrayParser());

const main = async () => {
  for await (const item of itemStream) {
    console.log(`> ${item.name}: Hi, I'm from ${item.address.city}`);
  }
};

main()
```

## Readable - from string

```javascript
const stream = require("stream");

// the data source not always a file, can be anything else
const readStream = stream.Readable.from("test".split(""), {
  highWaterMark: 1 // control the chunk size for each read
});

const main = async () => {
  for await (const c of readStream) {
    console.log(c)
    // # output
    // t
    // e
    // s
    // t
  }
};

main();
```

## Readable - from generator

```javascript
const stream = require("stream");

// this generator can be async too
// async function* gen
function* gen() {
  yield "t"
  yield "e"
  yield "s"
  yield "t"
}

const main = async () => {
  // not only can be string or buffer or array, it can be generator as well
  const readStream = stream.Readable.from(gen());
  for await (const c of readStream) {
    console.log(c)
    // # output
    // t
    // e
    // s
    // t
  }
};

main();
```

## Iterator - for-loop string

```javascript
// From the examples above, we can always for-loop the stream, but why?
// that's because not only array can be for-loop, but anything else in js
// only if implement the Symbol.iterator or Symbol.asyncIterator
// e.g. string
const str = "this is a test";

// from previous example, some of you should be supriced, why the 
// stream can use for-loop? actually anything only if they implement 
// the asyncIterator, they can be for-loop, like string
for (const s of str) {
  console.log(s)
}

// have a look here.
// actually the string already implement the Symbol.iterator, so 
// why it can use for-loop
console.log(str[Symbol.iterator])

// all the iterator follow the same standard
// they must have a next() function, so underlying you can loop
// the string in this way.
const iter = str[Symbol.iterator]();
let s = iter.next();
while(!s.done) {
  console.log(s)
  s = iter.next();
}
```

## Iterator - for-loop object

```javascript
// by default an object couldn't be for-loop
// > Uncaught TypeError: obj is not iterable
// but we can implement the iterator to make it become iterable.
const obj = {
  name: "Elson",
  city: "Guangzhou"
};

// continue with previous example, not only the builtin type,
// we can even implement the iterator to make something become iterable
obj[Symbol.iterator] = () => {
  let i = -1;
  const keys = Object.keys(obj);
  return {
    // the iterator function must return an object with at least next method
    // {
    //    "next": () => ({done: boolean, value: <value>})
    // }
    next: () => {
      i++;
      const k = keys[i];
      const v = obj[keys[i]];
      return {
        done: !k,
        value: v,
      };
    },
  };
};

for (const v of obj) {
  console.log(`${v}`);
}
```

## asyncIterator - for-loop object

```javascript
const obj = {
  itemIds: [1, 2]
};

const query = async (key) =>
  new Promise((resolve, _) => setTimeout(() => resolve(key), 1000));

// similarly to Symbol.iterator, there's Symbol.asyncIterator, which support async
obj[Symbol.asyncIterator] = () => {
  let i = -1;
  return {
    next: async () => {
      i++;
      const k = obj.itemIds[i];
      // simulating the query from API or db.
      const v = await query(k);
      return {
        done: !k,
        value: [k, v],
      };
    },
  };
};

const main = async () => {
  for await (const s of obj) {
    console.log(s);
  }
};

main();

```

## Error handling

```javascript
const stream = require("stream");
const dataItem = stream.Readable.from("this is a test");

// Option 1
// listen to the error even one by one
const trans1 = stream.Transform({
  transform: (chunk, encoding, next) => {
    next(null, chunk)
  }
})

trans1.on("error", (err) => {
  console.log("error from trans1:", err)
})

const trans2 = stream.Transform({
  transform: (chunk, encoding, next) => {
    next("Test error 2")
  }
})

trans2.on("error", (err) => {
  console.log("error from trans2:", err)
})

dataItem.pipe(trans1).pipe(trans2);

// Option 2
// By using stream.pipeline, then listen to all streams' error event at once
// stream.pipeline(
//   dataItem,
//   trans1,
//   trans2,
//   (err) => {
//     console.log("err from pipeline", err)
//   }
// )

```

## Promisify

```javascript
// As we all get used to use async/await instead of 
// event listener or the error-first function
// so we can use the util.promisify to convert the 
// callback event to a promise, so that we can use await
const stream = require("stream");
const util = require("util");

const dataItem = stream.Readable.from("this is a test");

const trans = stream.Transform({
  transform: (chunk, encoding, next) => {
    // simulate any error happens
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
```

# Concolution

- When handling large data set or file, should consider to use stream.
- To simplify the data processing and the business logic, should consider stream or generator.
