import { NextApiRequest, NextApiResponse } from "next"
import { connectToDatabase } from "../../../../lib/mongodb"

let vidId:any

export default async (req: NextApiRequest, res: NextApiResponse) => {
    try {
        let { db } = await connectToDatabase()
        vidId = req.query
        let video = await db.collection("statistics").findOne({
            videoId: vidId.videoStats
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
