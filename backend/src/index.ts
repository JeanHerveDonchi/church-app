import 'dotenv/config'
import { Elysia } from 'elysia'
import { node } from '@elysiajs/node'
import { cors } from '@elysiajs/cors'
import { accountsRoutes } from './routes/accounts'
import { commentsRoutes } from './routes/comments'
import { lifecycleRoutes } from './routes/lifecycle'
import { postsRoutes } from './routes/posts'
import { profilesRoutes } from './routes/profiles'

const PORT = Number(process.env.PORT) || 3000

const app = new Elysia({ adapter: node() })
  .use(
    cors({
      // In production, restrict this to your frontend domain
      origin: process.env.FRONTEND_URL ?? true,
      credentials: true,
    }),
  )
  .use(accountsRoutes)
  .use(commentsRoutes)
  .use(lifecycleRoutes)
  .use(postsRoutes)
  .use(profilesRoutes)
  .get('/health', () => ({ ok: true }))
  .listen(PORT)

console.log(`Backend running on http://localhost:${PORT}`)
