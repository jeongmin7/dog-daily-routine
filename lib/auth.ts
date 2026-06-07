import NextAuth from "next-auth";
import { prisma } from "@/lib/prisma";
import Credentials from "next-auth/providers/credentials";
import { verifyPassword } from "./password";

export const {handlers, signIn, signOut, auth}= NextAuth({
  pages:{signIn: "/login"},
  providers:[
    Credentials({
      credentials:{
        email:{},
        password: {}
      },
      authorize: async (credentials)=>{
        const email= credentials?.email as string| undefined;
        const password= credentials?.password as string| undefined;
        if(!email ||!password) return null

        const user = await prisma.user.findUnique({
          where:{email}
        })
        if(!user) return null

        const ok = await verifyPassword(password, user.password);
        if(!ok) return null

        return {
          id: user.id,
          email: user.email,
          name: user.name,
        }
      }
    })
  ],
  callbacks:{
    async jwt({token, user}){
      if(user)(token as {id?:string}).id= (user as {id?:string}).id
      return token
    },
    async session({session, token}){
      const id= (token as {id?: string}).id
      if(id && session.user)(session.user as{id?:string}).id =id
      return session
    }
  }
})