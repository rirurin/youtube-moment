const { createServer } = require("https");
const { parse } = require("url");
const next = require("next");
const cron = require("node-cron");
const fs = require("fs");
const path = require("path")
const dotenv = require("dotenv").config({path: path.resolve(__dirname+'/.env.local')})
if (dotenv.error) throw dotenv.error
const axios = require("axios")
const { MongoClient } = require("mongodb")
const mongoUri = process.env.MONGODB_URI

const dev = process.env.NODE_ENV !== "production";
process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = 0;


const app = next({ dev });
const mongoClient = new MongoClient(process.env.MONGODB_URI_SHORT)
const handle = app.getRequestHandler();
const httpsOptions = {
  key: fs.readFileSync("./certs/localhost.key"),
  cert: fs.readFileSync("./certs/localhost.crt"),
};app.prepare().then(() => {
  createServer(httpsOptions, (req, res) => {
    const parsedUrl = parse(req.url, true);
    handle(req, res, parsedUrl);
  }).listen(3000, (err) => {
    if (err) throw err;
    console.log("> Server started on https://localhost:3000");
    fetchFromDB()
  });
});
cron.schedule('* * * * *', function () {
  
})

async function updateVideo(videoId) {
  const videoResponse = await mongoClient.db("youtube")
  .collection("videos")
  .findOne({'properties.videoId': videoId})
  let videoIndexedDate = new Date(videoResponse.indexedDate)
  let videoSecondsSinceIndex = Math.floor((new Date() - videoIndexedDate) / 1000)
  let log = `[ VIDEO ${videoId} ]: ${videoSecondsSinceIndex} seconds (${Math.floor(videoSecondsSinceIndex / 3600)} hours since last index)`
  if (Math.floor(videoSecondsSinceIndex / 3600) < 24) {
    log += `: Too recent since last index, next video`
    console.log(log)
  } else {
    log += `: Indexing video...`
    console.log(log)
  }
}

async function fetchFromDB() {
  try {
    await mongoClient.connect()
    console.log("Connected to server")
    const channelList = await mongoClient.db("youtube")
    .collection("channels")
    .find({})
    .toArray()
    for (let i in channelList) {
      let indexedDate = new Date(channelList[i].indexedDate)
      let secondsSinceIndex = Math.floor((new Date() - indexedDate) / 1000)
      let log = `[ CHANNEL ${channelList[i].channelId} ]: ${secondsSinceIndex} seconds (${Math.floor(secondsSinceIndex / 3600)} hours since last index)`
      if (Math.floor(secondsSinceIndex / 3600) < 24) {
        log += `: Channel will not have it's videos reindexed`
        console.log(log)
      } else {
        log += `: Channel's videos are being reindexed`
        console.log(log)
        // Reindex youtube channel data
        for (let j in channelList[i].videos)  {
          await updateVideo(channelList[i].videos[j])
        }
        // Search through each video and see if it's old enough to get indexed
      }
    }
  } catch (err) {
    console.log(err)
  } finally {
    await mongoClient.close()
  }
}