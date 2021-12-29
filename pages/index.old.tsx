import Head from 'next/head'
import Image from 'next/image'
import styles from '../styles/Home.module.css'
import { useSession, signIn, signOut, getSession } from 'next-auth/react'
import clientPromise from '../lib/mongodb.old'
import { GetServerSideProps } from 'next'

interface mongoProps {
  isMongoConnected: boolean
}

export default function homepageContents(props: mongoProps) {
  const { isMongoConnected } = props
  const { data: session, status } = useSession()
  if (status === "loading") {
    return (<>loading</>)
  } else {
    if (session) {
      return(<><pre>{JSON.stringify(session)}</pre><button onClick={() => signOut()}>Sign out</button> {isMongoConnected ? (<>mongo</>) : (<>no mongo</>)}</>)
    } else {
      return(<>not logged in <button onClick={() => signIn("google")}>Sign in</button> {isMongoConnected ? (<>mongo</>) : (<>no mongo</>)}</>)
    }
  }
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  try {
    // client.db() will be the default database passed in the MONGODB_URI
    // You can change the database by calling the client.db() function and specifying a database like:
    // const db = client.db("myDatabase");
    // Then you can execute queries against your database like so:
    // db.find({}) or any of the MongoDB Node Driver commands
    await clientPromise
    console.log(clientPromise)
    return {
      props: { isMongoConnected: true },
    }
  } catch (e) {
    console.error(e)
    return {
      props: { isMongoConnected: false },
    }
  }
}