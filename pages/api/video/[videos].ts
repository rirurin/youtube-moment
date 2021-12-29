import { NextApiRequest, NextApiResponse } from "next"
import { getToken } from "next-auth/jwt"
import { getSession } from "next-auth/react"
import axios from "axios"
import { connectToDatabase } from "../../../lib/mongodb"

const secret = process.env.NEXTAUTH_SECRET
let accessToken:any
let vidId:any

export default async (req: NextApiRequest, res: NextApiResponse) => {
    try {
        let { db } = await connectToDatabase()
        vidId = req.query
        let video = await db.collection("videos").findOne({
            'properties.videoId': vidId.videos
        })
        if (JSON.parse(JSON.stringify(video))) {
            // Video found
            return res.json({
                message: JSON.parse(JSON.stringify(video)),
                success: true
            })
        } else {
            // Channel not found
            throw new Error("This video's information isn't stored on this site (yet)")
        }
    } catch (error:any) {
        return res.json({
            message: new Error(error).message,
            success: false
        })
    }
}
