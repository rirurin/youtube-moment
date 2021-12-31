import Image from 'next/image'
import Link from "next/link"
import { useSession, signIn, signOut, getSession } from 'next-auth/react'

interface mongoProps {
    isMongoConnected: boolean
  }
  
export default function Nav(props: mongoProps) {
    const { isMongoConnected } = props
    const { data: session, status } = useSession()
    if (session && session.user?.image !== null) {
        return (
            <nav className="navbar-main">
                <ul className="navbar-sitenav">
                    <Link href={`/`}><li className='global-link global-bold'>name</li></Link>
                    <li>Search for video</li>
                </ul>
                <ul className="navbar-userinfo">
                    <li><img className="navbar-image" src={session.user?.image}/></li>
                    <li>{session.user?.name}</li>
                    <li><button onClick={() => signOut()}>Sign Out</button></li>
                </ul>
            </nav>
        )
    } else {
        return (
            <nav>
                navbar
            </nav>
        )
    }
    
}