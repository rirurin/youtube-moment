import axios from "axios";
import { GetServerSideProps, GetStaticPaths, GetStaticProps, InferGetServerSidePropsType } from "next";
import { useSession } from "next-auth/react";
import { YTVideo } from "../../types"
import Image from "next/image"
import Link from "next/link"
import { Icon } from "@iconify/react"
import { formatTimeSinceRelease, formatDateAsLocale, countryCodeToEmoji } from "../components/functions";

export default function videoPageContents ({ user }: InferGetServerSidePropsType<typeof getServerSideProps>) {
    const {data: session, status} = useSession()
    if (status === "loading") {
        return <>loading</>
    } else {
        return (
            <>
                <div className="channel-container">
                    <aside className="channel-channelinfo">
                        <header className="global-category-header">INFO</header>
                        <ul className="channel-channelinfo-identity">
                            <li className="channel-channelinfo-identity-pfp"><img src={user.message?.thumbnails[1].url} width={150}/></li>
                            <ul className="channel-channelinfo-identity-namesub">
                                <li className="channel-channelinfo-identity-name">{user.message?.channelName} {countryCodeToEmoji(user.message?.country)}</li>
                                <li>{user.message?.channelStatistics.subscriberCount} subscribers</li>
                            </ul>
                        </ul>
                        <ul className="channel-channelinfo-statistics">
                            <li>{user.message?.channelStatistics.viewCount} views</li>
                            <li>{user.message?.channelStatistics.videoCount} videos</li>
                        </ul>
                        <li className="channel-channelinfo-description">{user.message?.channelDescription}</li>
                    </aside>
                    <main className="channel-videolist">
                        <header className="channel-videolist-header">
                            <li><header className="global-category-header">VIDEOS</header></li>
                            <li>Sort by 
                                <select>
                                    <option value="mostrecent">Newest Upload</option>
                                    <option value="oldest">Oldest Upload</option>
                                    <option value="viewcount">Views</option>
                                    <option value="likecount">Likes</option>
                                    <option value="dislikecount">Dislikes</option>
                                    <option value="likedislikecount">Like/Dislike Ratio</option>
                                </select>
                            </li>
                            <li>{user.message?.videos.length} out of {user.message?.videos.length} videos loaded</li>
                        </header>
                        <main className="channel-videolist-videos">
                            {user.message?.videos.map((video: YTVideo) => (
                                <>
                                    <article className="videopreview-container">
                                        <ul className="videopreview-thumbnailcontainer">
                                            <Link href={`../video/${video.properties.videoId}`}>
                                                <li className="global-link"><img src={video.thumbnails[4].url} width={'100%'}/></li>
                                            </Link>
                                        </ul>
                                        <ul className="videopreview-title">
                                            <Link href={`../video/${video.properties.videoId}`}>
                                                <li className="videopreview-title-format global-link">{video.properties.videoTitle}</li>
                                            </Link>
                                            <li>{formatTimeSinceRelease(video.properties.publishDate)} ({formatDateAsLocale(video.properties.publishDate)})</li>
                                        </ul>
                                        <ul className="videopreview-statistics">
                                            <ul className="videopreview-statistics-viewcount">
                                                <li>{video.statistics.viewCount} views</li>
                                            </ul>
                                            <ul className="videopreview-statistics-likedislike">
                                                <li><Icon icon="carbon:thumbs-up-filled" inline={true} /> {video.statistics.likeCount}</li>
                                                <li><Icon icon="clarity:thumbs-down-solid" inline={true} /> {video.statistics.dislikeCount}</li>
                                            </ul>
                                        </ul>
                                    </article>
                                </>
                            ))}
                        </main>
                        <footer className="channel-videolist-pagenav">
                            {user.message?.nextPage == true && <>
                                <button>Load More</button>
                            </>}
                        </footer>
                    </main>
                </div>
            </>
        )
    }
}

export const getServerSideProps: GetServerSideProps = async (context) => {
    const id = context.params?.channel
    const { data } = await axios.get(`https://localhost:3000/api/channel/${id}`, {
        params: {
            page: 0
        }
    })
    if (!data) {
        return {
            notFound: true
        }
    }
    return {
        props: {user: data}
    }
}