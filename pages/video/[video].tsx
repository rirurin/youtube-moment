import axios from "axios";
import { GetServerSideProps, GetStaticPaths, GetStaticProps, InferGetServerSidePropsType } from "next";
import { useSession } from "next-auth/react";
import { formatTimeSinceRelease, formatDateAsLocale, likeDislikeRatio } from "../components/functions";
import { Icon } from "@iconify/react"
import Link from "next/link"

export default function videoPageContents ({ user, stats }: InferGetServerSidePropsType<typeof getServerSideProps>) {
    const {data: session, status} = useSession()
    if (status === "loading") {
        return <>loading</>
    } else {
        return (
            <div className="video-container">
                <main className="video-main-container">
                    <ul className="video-main-container-format">
                        <li>
                        <div className="video-videoembed-container">
                            this site seems to have some issue with the embed atm so it's disabled for now
                        </div>
                        </li>
                        <li className="video-main-title-format">{user.message?.properties.videoTitle}</li>
                        <ul className="video-main-ownerinfo">
                            <li>Published by <Link href={`../channel/${user.message?.properties.channelId}`}><div className="global-link global-inline global-bold">{user.message?.properties.channelTitle}</div></Link></li>
                            <li>{user.message?.status.privacyStatus}</li>
                            <li className="video-main-ownerinfo-date">Released {formatDateAsLocale(user.message?.properties.publishDate)}</li>
                        </ul>
                        <ul className="video-main-statistics">
                            <ul className="video-main-statistics-left">
                                <li>{user.message?.statistics.viewCount} views</li>
                                <li>{user.message?.statistics.commentCount} comments</li>
                            </ul>
                            <ul className="video-main-statistics-right">
                                <li><Icon icon="carbon:thumbs-up-filled" inline={true} /> {user.message?.statistics.likeCount}</li>
                                <li><Icon icon="carbon:thumbs-down-filled" inline={true} /> {user.message?.statistics.dislikeCount}</li>
                                <li>
                                    <Icon icon="carbon:chart-pie" inline={true} /> 
                                    {Number(likeDislikeRatio(user.message?.statistics.likeCount, user.message?.statistics.dislikeCount)) * 100}%
                                </li>
                                <div className="video-main-statistics-ratiobar-container">
                                    <div className="video-main-statistics-ratiobar-likes" style={{width: (Number(likeDislikeRatio(user.message?.statistics.likeCount, user.message?.statistics.dislikeCount)) * 100) + "%"}}></div>
                                </div>
                            </ul>
                        </ul>
                        <li>{user.message?.properties.videoDescription}</li>
                    </ul>
                </main>
                <aside className="video-sidebar-container">
                    misc statistics go here
                </aside>
            </div>
        )
    }
}

export const getServerSideProps: GetServerSideProps = async (context) => {
    const id = context.params?.video
    const { data } = await axios.get(`https://localhost:3000/api/video/${id}`)
    if (data.success === false) {
        return {
            notFound: true
        }
    }
    return {
        props: {user: data}
    }
}

const YTEmbed = (embedId:string) => {
    <div className="video-videoembed-container">
        <iframe
            width={850}
            height={480}
            src={`https://youtube.com/embed/${embedId}`}
            frameBorder={0}
        />
    </div>
}