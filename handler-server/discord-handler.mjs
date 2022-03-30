async function routes(fastify, options) {
  fastify.post("/discord", async (request, reply) => {
    return request.body;
  });
}

export default routes;
