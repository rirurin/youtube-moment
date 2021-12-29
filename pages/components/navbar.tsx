import Image from 'next/image'
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
                    <li>name</li>
                    <li>Search for video</li>
                </ul>
                <ul className="navbar-userinfo">
                    <li>{session.user?.name}</li>
                    <li><img src={session.user?.image}/></li>
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