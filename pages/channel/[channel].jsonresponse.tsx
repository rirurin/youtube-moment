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
        return JSON.stringify(user)
    }
}

export const getServerSideProps: GetServerSideProps = async (context) => {
    const id = context.params?.channel
    const { data } = await axios.get(`https://localhost:3000/api/channel/${id}`)
    if (!data) {
        return {
            notFound: true
        }
    }
    return {
        props: {user: data}
    }
}