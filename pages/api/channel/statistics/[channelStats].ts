import { NextApiRequest, NextApiResponse } from "next"
import { getSession } from "next-auth/react"
import { connectToDatabase } from "../../../../lib/mongodb"
import { Db, ObjectId } from "mongodb"
import { ObjectID } from "bson"
import axios from "axios"
import { YTVideo, YTImage, YTChannel, YTIdentity, YTChannelStatistics, YTVideoStatistics, YTVideoStatisticsBody } from "../../../../types"
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
            return getChannelStats(req, res)
        }
        default: {
            return getChannelStats(req, res)
        }
    }
    
}
// Default API option, will retrieve the information for a specific channel
async function getChannelStats (req: NextApiRequest, res: NextApiResponse) {
    try {
        // Connect to DB
        let { db } = await connectToDatabase()
        vidId = req.query
        // Get channel information from channels category
        let posts = await db.collection("channels").findOne({
            channelId: vidId.channelStats
        })
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