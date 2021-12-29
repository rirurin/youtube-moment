import NextAuth from "next-auth/next";
import GoogleProvider from "next-auth/providers/google"
import { MongoDBAdapter } from "@next-auth/mongodb-adapter"
import clientPromise from "../../../lib/mongodb.old"
import { connectToDatabase } from '../../../lib/mongodb'
import { NextApiRequest, NextApiResponse } from "next";

export default async function auth(req: NextApiRequest, res: NextApiResponse) {
    return await NextAuth(req, res, {
        adapter: MongoDBAdapter(clientPromise),
        providers: [
            GoogleProvider({
                // @ts-ignore
                clientId: process.env.GOOGLE_CLIENT_ID,
                // @ts-ignore
                clientSecret: process.env.GOOGLE_CLIENT_SECRET,
                authorization: {
                    params: {
                        prompt: "consent",
                        access_type: "offline",
                        response_type: "code",
                        scope: 'https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/youtube.readonly',
                    }
                }
            })
        ],
        session: {
            strategy: "jwt",
            maxAge: 30 * 24 * 60 * 60,
            updateAge: 24 * 60 * 60
        },
        secret: process.env.NEXTAUTH_SECRET,
        callbacks: {
            async jwt({ token, user, account, profile, isNewUser}) {
                //console.log(account)
                if (account?.access_token) {
                    token.accessToken = account.access_token
                }
                if (account?.refresh_token) {
                    token.refreshToken = account.refresh_token
                }
                return token
            },
            async session({ session, user, token}) {
                session.accessToken = token.accessToken
                session.refreshToken = token.refreshToken
                //console.log(session)
                return session
            }
        }
    })
}
/*
export default NextAuth({
    adapter: MongoDBAdapter(clientPromise),
    providers: [
        GoogleProvider({
            // @ts-ignore
            clientId: process.env.GOOGLE_CLIENT_ID,
            // @ts-ignore
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            authorization: {
                params: {
                    prompt: "consent",
                    access_type: "offline",
                    response_type: "code",
                    scope: 'https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/youtube.readonly',
                }
            }
        })
    ],
    secret: process.env.NEXTAUTH_SECRET,
    callbacks: {
        /*
        async jwt({ token, user, account, profile, isNewUser}) {
            if (account?.access_token) {
                token.accessToken = account.access_token;
            }
            return token;
        },*/
        /*
        async signIn({ user, account, profile, email, credentials }) {
            console.log(account.access_token)
            user.accessToken = account.access_token
            console.log(user.accessToken)
            return true
        },
        async session({ session, user, token }) {
            //session.accessToken = user.accessToken
            session.id = user.id
            console.log(session.id)
            return Promise.resolve(session)
            //console.log(session.accessToken)
            //return session
        }
    }

})
*/

