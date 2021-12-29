import { NextApiRequest, NextApiResponse } from "next"
import { getSession } from "next-auth/react"
import { connectToDatabase } from "../../../lib/mongodb"
import { Db, ObjectId } from "mongodb"
import { ObjectID } from "bson"
import axios from "axios"
import { YTVideo, YTImage, YTChannel, YTIdentity, YTChannelStatistics, YTVideoStatistics, YTVideoStatisticsBody } from "../../../types"
import { Session } from "next-auth"

let accessToken:any
let vidId:any
let HTTPStatus:number
let refreshToken:any

export default async (req: NextApiRequest, res: NextApiResponse) => {
    // Switch functionality based on method received
    console.log(req.query)
    switch (req.method) {
        case "GET" : {
            return getChannel(req, res)
        }
        case "POST" : {
            return ownerUpdateChannel(req, res)
        }
        case "DELETE": {
            return ownerDeleteChannel(req, res)
        }
        default: {
            return getChannel(req, res)
        }
    }
    
}
// Default API option, will retrieve the information for a specific channel
async function getChannel (req: NextApiRequest, res: NextApiResponse) {
    try {
        // Connect to DB
        let { db } = await connectToDatabase()
        vidId = req.query
        // Get video information from videos collection
        let numReg = /^\d+$/
        if (!vidId.results) vidId.results = 10 // results per page
        if (!vidId.page) vidId.page = 0 // page (based on number of results)
        if (!vidId.sortby) vidId.sortby = "new" // sort results by
        // Exception if neither is a number
        if (numReg.test(vidId.results) === false) throw new Error(`Number of results must be a positive integer (how am I supposed to interpret getting '${vidId.results}' results?)`)
        if (numReg.test(vidId.page) === false) throw new Error(`Page number must be a positive integer (go to page '${vidId.page}' in your textbooks)`)
        let videoSort:Object = {}
        switch (vidId.sortby) {
            case "new":
                videoSort = {'properties.publishDate': -1}
                break
            case "old":
                videoSort = {'properties.publishDate': 1}
                break
            case "views":
                videoSort = {'statistics.viewCount': -1}
                break
            case "likes":
                videoSort = {'statistics.likeCount': -1}
                break
            case "dislikes":
                videoSort = {'statistics.dislikeCount': -1}
                break
            default:
                throw new Error(`Not a sorting type that exists in this API at this second`)
        }
        let posts = await db.collection("videos").find({
            'properties.channelId': vidId.channel
        }).sort(videoSort).limit(Number(vidId.results)).skip(Number(vidId.results * vidId.page)).toArray()
        if (JSON.parse(JSON.stringify(posts))) {
            // Channel found
            return res.json({
                message: JSON.parse(JSON.stringify(posts)),
                success: true
            })
        } else {
            // Channel not found
            throw new Error("This user's information isn't stored on this site (yet)")
        }
    } catch (error:any) {
        return res.json({
            message: new Error(error).message,
            success: false
        })
    }
}
// Allows the channel owner to update their details
async function ownerUpdateChannel (req: NextApiRequest, res: NextApiResponse) {
    try {
        let { db } = await connectToDatabase()
        // Authenticate with youtube:
        // Fetch access token from refresh token
        const user = await getSession({ req })
        if (user) {
            refreshToken = user.refreshToken
            try {
                // Fetch access token using the user's refresh token
                const getAccessToken = await getOauthAccessToken()
                accessToken = getAccessToken.access_token
                //accessToken = getAccessToken.accessToken

                // Check if the data exists

                let userInDB = await db.collection("identites").findOne({
                    email: user.user?.email
                })
                if (userInDB) {
                    console.log("User found")
                    // Do not update - updater in node cron will handle this
                } else {
                    console.log("User not found")
                    // Add user identity to DB
                    updateOwnUserInfo(db, user, true, "", 0)
                    // Database connected to, user's session, if the user is newly added to the DB, the next page token, page number
                }

            } catch (error:any) {
                // Could not authenticate with Google's servers
                console.log(error)
                return res.json({
                    message: new Error(error).message,
                    success: false
                })
            }
        } else {
            // User not logged in
            HTTPStatus = 403
            throw new Error("bro you're not allowed to do this unless you're logged in /ban")
        }
        return res.json({
            //message: JSON.parse(JSON.stringify(posts)),
            message: "Data successfully imported",
            //message: data,
            success: true
        })
    } catch (error:any) {
        return res.json({
            message: new Error(error).message,
            success: false
        })
    }
}
// Allows the channel owner to remove their information from the DB
async function ownerDeleteChannel(req: NextApiRequest, res: NextApiResponse) {
    try {
        let { db } = await connectToDatabase()
        await db.collection("channels").deleteOne({
            _id: new ObjectId(req.body)
        })
        return res.json({
            message: "Channel's data removed",
            success: true
        })
    }
    catch (error:any) {
        return res.json({
            message: new Error(error).message,
            success: false
        })
    }
}
const getYTVideoData:any = async (videoID:any) => {
    const { data } = await axios.get(`https://youtube.googleapis.com/youtube/v3/videos?part=snippet,status%2CcontentDetails%2Cstatistics&id=${videoID}`, {
        headers: {
            Authorization: `Bearer ${accessToken}`
        }
    })
    return data.items
}

const getYTChannelData:any = async (nextPageToken:any, maxResults:number) => {
    let reqUrl = `https://youtube.googleapis.com/youtube/v3/search?part=snippet&forMine=true&maxResults=${maxResults}&order=date&type=video&key=${process.env.GOOGLE_API_KEY}`
    if (nextPageToken) {
        reqUrl += `&pageToken=${nextPageToken}`
    }
    const { data } = await axios.get(reqUrl, {
        headers: {
            Authorization: `Bearer ${accessToken}`
        }
    })
    return data
}

const getOauthAccessToken:any = async () => {
    const { data } = await axios.post(`https://www.googleapis.com/oauth2/v4/token`, {
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        refresh_token: refreshToken,
        grant_type: 'refresh_token'
    })
    return data
}

const getYTVideoInformation:any = async () => {
    const { data } = await axios.get(`https://youtube.googleapis.com/youtube/v3/channels?part=snippet%2CcontentDetails%2Cstatistics&mine=true&key=${process.env.GOOGLE_API_KEY}`, {
        headers: {
            Authorization: `Bearer ${accessToken}`
        }
    })
    return data.items
}

const formatVideoDataToAPI:any = (input:any, thumbnail:YTImage[]) => {
    const res:YTVideo = {
        etag: input.etag,
        indexedDate: new Date(),
        properties: {
            videoId: input.id,
            videoTitle: input.snippet.title,
            videoDescription: input.snippet.description,
            publishDate: input.snippet.publishedAt,
            channelId: input.snippet.channelId,
            channelTitle: input.snippet.channelTitle,
        },
        thumbnails: thumbnail,
        statistics: {
            viewCount: Number(input.statistics.viewCount),
            likeCount: Number(input.statistics.likeCount),
            dislikeCount: Number(input.statistics.dislikeCount),
            commentCount: Number(input.statistics.commentCount),
        },
        status: {
            privacyStatus: input.status.privacyStatus,
            embeddable: input.status.embeddable,
        }
    }
    return res
}

const formatImagesDatatoAPI:any = (input:any) => {
    const res:YTImage[] = []
    for (let [key, value] of Object.entries(input)) {
        res.push({
            url: Object(value).url,
            width: Object(value).width,
            height: Object(value).height,
        })
    }
    return res
}

const formatVideoStatisticsDatatoAPI:any = (stats:any, id:any) => {
    let vidStats:YTVideoStatistics[] = []
    vidStats.push({
        date: new Date(),
        viewCount: stats.viewCount,
        likeCount: stats.likeCount,
        dislikeCount: stats.dislikeCount,
        commentCount: stats.commentCount
    })
    const res:YTVideoStatisticsBody = {
        videoId: id,
        history: vidStats
    }
    return res
}

async function updateOwnUserInfo(mongoDatabase:any, session:Session, newUser:boolean, pageToken:string, channelPageNumber:number, feedback?:any) {
    // Fetch from channels.list (1 QUOTA POINT)
    const channelInfo = await getYTVideoInformation()

    if (newUser) {
        // new user: import their information into identity collection (private)
        if (session.user?.email !== undefined && session.user?.email !== null) {
            const userIdentity:YTIdentity = {
                email: session.user?.email,
                channelId: channelInfo[0].id
            }
            await mongoDatabase.collection("identites").insertOne(userIdentity)
        }
    }
    
    const channelImportProfilePicture:YTImage[] = []
    for (let [ key, value ] of Object.entries(channelInfo[0].snippet.thumbnails)) {
        channelImportProfilePicture.push({
            url: Object(value).url,
            width: Object(value).width,
            height: Object(value).height,
        })
    }

    // Fetch from search (100 QUOTA POINTS)
    const channelVideos = await getYTChannelData(pageToken, 50)

    //const videoIds = []
    const channelVideoList:YTVideo[] = []
    const channelVideosListShort = []
    for (let i in channelVideos.items) {
        // Fetch each video (1 QUOTA POINT PER VIDEO)
        const videoData = await getYTVideoData(channelVideos.items[i].id.videoId)
        const channelVideoThumbnail = formatImagesDatatoAPI(videoData[0].snippet.thumbnails)
        channelVideoList.push(formatVideoDataToAPI(videoData[0], channelVideoThumbnail))
        await mongoDatabase.collection("videos").insertOne(channelVideoList[Number(i)])
        const videoStatistics = formatVideoStatisticsDatatoAPI(videoData[0].statistics, videoData[0].id)
        channelVideosListShort.push(videoData[0].id)
        await mongoDatabase.collection("statistics").insertOne(videoStatistics)
        console.log(`${i}: Video ${channelVideos.items[i].id.videoId} was added to the API: Youtube owned by epic dislike counter`)
    }
    // Build channel object
    if (!pageToken) {
        // new channel request, make channel object
    } else {
        // channel already exists, add onto channel object
        /*
        await mongoDatabase.collection("channels").findOne({
            channelId: channelInfo[0].id
        })
        */
    }
    const res:YTChannel = {
        indexedDate: new Date(),
        channelName: channelInfo[0].snippet.title,
        channelId: channelInfo[0].id,
        channelDescription: channelInfo[0].snippet.description,
        thumbnails: channelImportProfilePicture,
        country: channelInfo[0].snippet.country,
        channelStatistics: {
            viewCount: Number(channelInfo[0].statistics.viewCount),
            subscriberCount: Number(channelInfo[0].statistics.subscriberCount),
            videoCount: Number(channelInfo[0].statistics.videoCount),
        },
        videos: channelVideosListShort
    }
    if (feedback) {
        res.videos = [...feedback, ...channelVideosListShort]
    }
    // Push to DB
    if (channelVideos.nextPageToken) {
        // Repeat function if the next page token exists
        updateOwnUserInfo(mongoDatabase, session, false, channelVideos.nextPageToken, channelPageNumber + 1, res.videos)
    } else {
        try {
            await mongoDatabase.collection("channels").insertOne(res)
            console.log(`Channel ${res.channelId} was added to the API. ${res.channelName} is based as hell`)
        } catch (err) {
            console.log("Unable to import data into the channel: Channel failed the vibe check")
        }
    }
}