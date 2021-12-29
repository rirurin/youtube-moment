import { NextApiRequest, NextApiResponse } from "next"
export default async (req: NextApiRequest, res: NextApiResponse) => {
    const links = [
        "https://cdn.discordapp.com/attachments/759068976923017267/924294928031424512/v09044g40000c71nc5rc77u0mbgfq2s0.mp4",
        "https://cdn.discordapp.com/attachments/759068976923017267/924295000680972318/14697592040008908811.mp4",
        "https://cdn.discordapp.com/attachments/759068976923017267/924295155819888741/first_aid-1.mp4",
        "https://cdn.discordapp.com/attachments/759068976923017267/924295274099265566/52yDSW6_f-iGshxY.mp4",
        "https://cdn.discordapp.com/attachments/759068976923017267/924295483684425728/credits.mp4",
        "https://cdn.discordapp.com/attachments/759068976923017267/924295522255261756/1HzvtFiA4fmll1Xi.mp4",
        "https://cdn.discordapp.com/attachments/759068976923017267/924295574231068712/gwzHjkEic1o7Mic-.mp4",
        "https://cdn.discordapp.com/attachments/759068976923017267/924295997050470400/9jHtDPZ7hcF5ph-j.mp4",
        "https://cdn.discordapp.com/attachments/759068976923017267/924296545380237362/cirno_whatsapp_2.webm"
    ]
    const random = Math.round(Math.random() * links.length)
    return res.status(200).json({message: links[random]})
}