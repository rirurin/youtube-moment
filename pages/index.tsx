import Head from 'next/head'
import Image from 'next/image'
import styles from '../styles/Home.module.css'
import { useSession, signIn, signOut, getSession } from 'next-auth/react'
import { connectToDatabase } from '../lib/mongodb'
import clientPromise from "../lib/mongodb.old"
import { GetServerSideProps, InferGetServerSidePropsType } from 'next'
import axios from "axios"
import { useEffect, useState, useRef, useCallback } from "react"
import { Session } from 'next-auth'
import { YTChannel, YTVideo } from "../types/"
import Link from "next/link"
import { Icon } from "@iconify/react"
import { formatTimeSinceRelease, formatDateAsLocale, countryCodeToEmoji } from "./components/functions"

export default function homepageContents({ recentVideos }: InferGetServerSidePropsType<typeof getServerSideProps>) {
  const { data: session, status } = useSession()
  const [channel, setChannel] = useState<YTChannel>()
  const [loading, setLoading] = useState(false)
  const [timesFetched, setTimesFetched] = useState(0)
  const [allowUnlisted, setAllowUnlisted] = useState(false)

  useEffect(() => {
    loadChannelInformation()
  }, [status])

  async function loadChannelInformation() {
    setLoading(true)
    if (session) {
      try {
        const res = await axios.post(`https://localhost:3000/api/channel/statistics/${session.user?.email}`)
        console.log(res.data.message)
        setChannel(() => {
          return res.data.message
        })
        setTimesFetched(count => count + 1)
      } catch (err) {
        console.log(err)
      }
    }
  }

  if (status === "loading") {
    return (<>loading</>)
  } else {
    if (session) {
      const uploadChannelData = async () => {
        let accessToken = session.accessToken
        const res = await axios.post(`/api/channel/own`, {
          headers: {
            Authorization: `Bearer ${accessToken}`
          }, params: {
            allowUnlisted: allowUnlisted
          }
        })
      }
      let dashboardContainer;
      if (channel) {
        dashboardContainer = (
          <>
            <aside className="dashboard-account-info-noupload">
                <ul className="dashboard-account-info-noupload-container">
                  <li><img className="dashboard-account-info-upload-image" src={`${channel.thumbnails[0].url}`}/></li>
                  <li className="dashboard-account-info-upload-name global-bold global-link"><Link href={`../channel/${channel.channelId}`}>{channel.channelName}</Link></li>
                  <li className="dashboard-account-info-upload-subcount">{channel.channelStatistics.subscriberCount} subscribers</li>
                  <li className="dashboard-account-info-upload-viewcount">{channel.channelStatistics.viewCount} views</li>
                  <li className="dashboard-account-info-upload-videos">Uploaded {channel.videos.length} videos</li>
                </ul>
              </aside>
          </>
        )
      } else {
        dashboardContainer = (
          <>
            <aside className="dashboard-account-info-noupload">
                <ul className="dashboard-account-info-noupload-container">
                  <li><img className="dashboard-account-info-noupload-image" src={`${session.user?.image}`}/></li>
                  <li className="dashboard-account-info-noupload-name">{session.user?.name}</li>
                  <li>Has not uploaded the information/statistics of their videos</li>
                </ul>
              </aside>
              <main className="dashboard-upload-information">
                <div>
                  <ul className="dashboard-upload-information-title-container">
                    <li className="dashboard-upload-information-title">Upload your video information</li>
                  </ul>
                  <ul className="dashboard-upload-information-notes">
                    <li>By selecting "Upload my video's statistics", information on your video such as it's title, description etc. along with it's statistics (including your dislike count) will get uploaded to a database which will allow others to view the dislike counts on your videos, whether through this website or through a browser extension that uses this site's data</li>
                    <li><div className="global-inline global-bold">NOTE:</div> This tool will only upload video information for public uploads. Select the checkbox if you want information on your unlisted videos uploaded (this does not apply to privated videos)</li>
                    <li>Would you like to upload the contents of your videos?</li>
                  </ul>
                  <ul className="dashboard-upload-information-checkbox">
                    <input type="checkbox" onClick={() => setAllowUnlisted(!allowUnlisted)}/> Allow information on unlisted videos to get uploaded
                  </ul>
                  <ul className="dashboard-upload-information-uploadbutton">
                    <li><button onClick={() => uploadChannelData()}>Upload Channel Data</button></li>
                  </ul>
                </div>
              </main>
          </>
        )
      }
      /*
      if (!loading) {
        loadChannelInformation()
        setLoading(true)
      }
      /*
      if (channel) {
        return (<>nice</>)
        {JSON.stringify(channel)}
      } else {*/
        return (
          <>
          <div className="dashboard-container">
            <aside className="dashboard-header-container">
              <header className="global-category-header">DASHBOARD</header>
            </aside>
            <main className="dashboard-main-container">
              {dashboardContainer}
            </main>
          </div>
          <div className="dashboard-container">
            <aside className="listchannel-header-container">
              <header className="global-category-header">RECENT VIDEOS</header>
            </aside>
            <main className="listchannel-main-container">
              {recentVideos.message.map((video: YTVideo) => {
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
            </main>
          </div>
          </>)
      //}
    } else {
      return(<>not logged in <button onClick={() => signIn("google")}>Sign in</button></>)
    }
  }
}

export const getServerSideProps: GetServerSideProps = async () => {
  const { data } = await axios.get(`https://localhost:3000/api/video/recent`)
  return {
    props: {recentVideos: data}
  }
}