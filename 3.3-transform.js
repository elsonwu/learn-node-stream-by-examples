const fs = require("fs");
const stream = require("stream");

// here is a simple parser to show how the transform handle large file by reading a small set of data
// and this parser only works for the specific json structure like below:
// [
//    { ... },
//    { ... },
//    ...
// ]
// the basic algorithm is:
// use a simple stack to store the {, so we can tell if it's the out most or another { inside the {}
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
      // but be care in order to handle the multi-bytes language like Chinese, couldn't chunk.toString()
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
            if (!stack.length) {
              items.push(JSON.parse(Buffer.from(buffer.splice(0)).toString()));
            }

            break;
          default:
            if (stack.length) {
              buffer.push(c);
            }
        }
      }

      next(null, items.pop());
    }
  });
};

const itemStream = fs.createReadStream("./test-data.json", {
  // NOTE
  // here is a must to slow down the data stream for this simple parser
  // by default, the highWaterMark is 64kb on file
  // so it will load too many items into our parser at once, but we couldn't consume faster enough
  // then will store too many object in the items after the upper stream reached its end, then closed.
  highWaterMark: 1, 
}).pipe(objectArrayParser());

const main = async () => {
  for await (const item of itemStream) {
    console.log(`> #ID: ${item.id}`);
  }
};

main()
