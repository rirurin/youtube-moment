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
                if (account?.refresh_token) {
                    token.refreshToken = account.refresh_token
                }
                return token
            },
            async session({ session, user, token}) {
                session.refreshToken = token.refreshToken
                return session
            }
        }
    })
}

