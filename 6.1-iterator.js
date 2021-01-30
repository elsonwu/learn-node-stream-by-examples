const str = "this is a test";

// from previous example, some of you should be supriced, why the stream can use for-loop?
// actually anything only if they implement the iterator, they can be for-loop, like string
for (const s of str) {
  console.log(s)
}

// have a look at this.
// actually the string already implement the Symbol.iterator, so why it can use for-loop
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

