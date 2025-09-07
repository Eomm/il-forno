export function buildApp (fastify, opts) {
  fastify.get('/', async function (request, reply) {
    return { hello: 'world' }
  })
};
