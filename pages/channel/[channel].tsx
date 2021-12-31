import axios from "axios"
import { GetServerSideProps, GetStaticPaths, GetStaticProps, InferGetServerSidePropsType } from "next"
import { useSession } from "next-auth/react"
import { YTVideo } from "../../types"
import Image from "next/image"
import Link from "next/link"
import { Icon } from "@iconify/react"
import { formatTimeSinceRelease, formatDateAsLocale, countryCodeToEmoji } from "../components/functions"
import { useEffect, useState, useRef, useCallback } from "react"

export default function videoPageContents ({ user }: InferGetServerSidePropsType<typeof getServerSideProps>) {
    const [videos, setVideos] = useState<YTVideo[]>([])
    const [loading, setLoading] = useState(false)
    const [loadMore, setLoadMore] = useState(true)
    const [page, setPage] = useState(0)
    const [order, setOrder] = useState("new")
    
    useEffect(() => {
        loadVideos()
      }, []);
      
    async function loadVideos() {
        setLoading(true)
        try {
            const res = await axios.get(`https://localhost:3000/api/channel/UC3cofiENUCa7zYBGFXg7wyQ`, {
                params: {
                    results: 20, page: page, sortby: order
                }
            })
            setVideos((prevTitles:any) => {
                return [...prevTitles, ...Array.from(res.data.message)]
            })
            setPage(prevPage => prevPage + 1)
            setLoadMore(res.data.message.length > 0)
        } catch (error) {
            console.log(error)
        }
        setLoading(false)
    }
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
                                <option value="mostrecent" onClick={function(e:any){setVideos([]); setPage(0); setLoadMore(true); setOrder("new")}}>Newest Upload</option>
                                <option value="oldest" onClick={function(e:any){setVideos([]); setPage(0); setLoadMore(true); setOrder("old")}}>Oldest Upload</option>
                                <option value="viewcount" onClick={function(e:any){setVideos([]); setPage(0); setLoadMore(true); setOrder("views")}}>Views</option>
                                <option value="likecount" onClick={function(e:any){setVideos([]); setPage(0); setLoadMore(true); setOrder("likes")}}>Likes</option>
                                <option value="dislikecount" onClick={function(e:any){setVideos([]); setPage(0); setLoadMore(true); setOrder("dislikes")}}>Dislikes</option>
                                <option value="likedislikecount" onClick={function(e:any){setVideos([]); setPage(0); setLoadMore(true); setOrder("ratio")}}>Like/Dislike Ratio</option>
                            </select>
                        </li>
                        <li>{videos.length} out of {user.message?.videos.length} videos loaded</li>
                    </header>
                    <main className="channel-videolist-videos">
                        {videos.map((video: YTVideo) => {
                            return (
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
                            )
                        })}
                        {loading && <>loading</>}
                    </main>
                    <footer className="channel-videolist-pagenav">
                        {!loading && loadMore && user.message?.videos.length != videos.length && <button onClick={loadVideos}>Load more videos</button>}
                    </footer>
                </main>
            </div>
        </>
    )
}
export const getServerSideProps: GetServerSideProps = async (context) => {
    const id = context.params?.channel
    const { data } = await axios.get(`https://localhost:3000/api/channel/statistics/${id}`)
    if (!data) {
        return {
            notFound: true
        }
    }
    return {
        props: {user: data}
    }
}