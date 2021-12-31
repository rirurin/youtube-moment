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
  });
});
cron.schedule('* * * * *', function () {
  fetchFromDB()
})

const getYTVideoData = async (videoID, accessToken) => {
  const { data } = await axios.get(`https://youtube.googleapis.com/youtube/v3/videos?part=snippet,status%2CcontentDetails%2Cstatistics&id=${videoID}`, {
      headers: {
          Authorization: `Bearer ${accessToken}`
      }
  })
  return data.items
}

const likeDislikeRatio = (likes, dislikes) => {
  const [ likeN, dislikeN ] = [parseInt(likes), parseInt(dislikes)]
  if (dislikeN == 0) {
      return 1
  } else {
      return ((1 - 1 /(likeN / dislikeN))).toFixed(4)
  }
}

const formatImagesDatatoAPI = (input) => {
  const res = []
  for (let [key, value] of Object.entries(input)) {
      res.push({
          url: Object(value).url,
          width: Object(value).width,
          height: Object(value).height,
      })
  }
  return res
}

async function updateVideo(videoId, accessToken) {
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
    const req = await getYTVideoData(videoId, accessToken)
    // Replace /videos/ endpoint
    const reqThumb = formatImagesDatatoAPI(req[0].snippet.thumbnails)
    const res = await mongoClient.db("youtube")
    .collection("videos")
    .updateOne({
      'properties.videoId': videoId
    }, {
      $set: {
        indexedDate: new Date(),
        'properties.videoTitle': req[0].snippet.title,
        'properties.videoDescription': req[0].snippet.description,
        'properties.publishDate': req[0].snippet.publishedAt,
        'properties.channelId': req[0].snippet.channelId,
        'properties.channelTitle': req[0].snippet.channelTitle,
        thumbnails: reqThumb,
        'statistics.viewCount': Number(req[0].statistics.viewCount),
        'statistics.likeCount': Number(req[0].statistics.likeCount),
        'statistics.dislikeCount': Number(req[0].statistics.dislikeCount),
        'statistics.commentCount': Number(req[0].statistics.commentCount),
        'statistics.likeDislikeRatio': Number(likeDislikeRatio(req[0].statistics.likeCount, req[0].statistics.dislikeCount)),
        'status.privacyStatus': req[0].status.privacyStatus,
        'status.embeddable': req[0].status.embeddable,
      }
    })
   // Add to /statistics/ endpoint
   const sRes = await mongoClient.db("youtube")
    .collection("statistics")
    .updateOne({
      'videoId': videoId
    }, {
      $push: {history: {
        date: new Date(),
        viewCount: req[0].statistics.viewCount,
        likeCount: req[0].statistics.likeCount,
        dislikeCount: req[0].statistics.dislikeCount,
        commentCount: req[0].statistics.commentCount
      }}
    })
  }
}

const getOauthAccessToken = async (refreshToken) => {
  const { data } = await axios.post(`https://www.googleapis.com/oauth2/v4/token`, {
      client_id: process.env.GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
      refresh_token: refreshToken,
      grant_type: 'refresh_token'
  })
  return data
}

async function fetchFromDB() {
  try {
    await mongoClient.connect()
    console.log("[ SCHEDULER START ]: Connected to DB, channel check moment")
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
        await mongoClient.db("youtube").collection("channels").updateOne({
          'channelId': channelList[i].channelId
        }, {
          $set: {
            indexedDate: new Date()
          }
        })
        // Get account refresh token
        const userId = await mongoClient.db("youtube")
        .collection("identites")
        .findOne({channelId: channelList[i].channelId})
        const userIdEmail = await mongoClient.db("youtube")
        .collection("users")
        .findOne({email: userId.email})
        const accountOauth = await mongoClient.db("youtube")
        .collection("accounts")
        .findOne({userId: userIdEmail._id})
        // Refresh refresh token to get access token
        try {
          const getAccessToken = await getOauthAccessToken(accountOauth.refresh_token) // Access token at getAccessToken.access_token
          console.log(`[ CHANNEL ${channelList[i].channelId} ]: Token refreshed`)
          // Search through each video and see if it's old enough to get indexed
          for (let j in channelList[i].videos)  {
            await updateVideo(channelList[i].videos[j], getAccessToken.access_token)
            //await updateVideo(channelList[i].videos[j], "dummy")
          }
          console.log(`[ CHANNEL ${channelList[i].channelId} ]: ${channelList[i].channelName} is based as HELL`)
        } catch (err) {
          throw new Error(err, "Could not fetch access token")
        }
      }
    }
  } catch (err) {
    console.log(err)
  } finally {
    console.log("[ SCHEDULER END ]: Channel Check Ended")
    await mongoClient.close()
  }
}