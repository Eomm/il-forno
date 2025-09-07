import path from 'node:path'
import { fileURLToPath } from 'node:url'
import fastifyStatic from '@fastify/static'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

export function buildApp (fastify, opts) {
  fastify.register(fastifyStatic, {
    root: path.join(__dirname, '../frontend/dist'),
    prefix: '/il-forno/', // optional: default '/'
  })

  fastify.get('/il-forno', function (req, reply) {
    // index.html should never be cached
    reply.sendFile('index.html', { maxAge: 0, immutable: false })
  })

  fastify.get('/', async function (request, reply) {
    return { hello: 'world' }
  })
};
