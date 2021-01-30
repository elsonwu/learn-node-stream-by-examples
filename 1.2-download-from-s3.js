const aws = require("aws-sdk");
const fs = require("fs");

const s3 = new aws.S3();
const s3FileStream = s3.getObject({
  // omit
}).createReadStream()

const fileStream = fs.createWriteStream("file-from-s3");

s3FileStream.pipe(fileStream)
