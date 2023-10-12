import http from 'node:http'

const server = http.createServer(async (req, reply) => {
  const { method, url } = req

  await json(req, reply)


  
})

server.listen(3333)