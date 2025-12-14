import Fastify from 'fastify'
import { buildApp } from './app.js'

const server = Fastify({ logger: true })
server.register(buildApp)

const port = process.env.PORT || 3000
server.listen({ port, host: '0.0.0.0' })
