const morgan = require('morgan')
const express = require('express')

const tracer = require('./trace')('my-service', 'localhost')

const PORT = parseInt(process.env.PORT) || 3000

const app = express()


app.use(morgan('common'))
//app.use(pino)

app.get(['/', '/index.html'], (req, resp) => {

	const span = tracer.startSpan('/')
	resp.on('close', () => {
		span.end()
	})
	resp.status(200).type('text/html')
		.send(`<h1>The current time is ${new Date()}</h1>`)
})

app.listen(PORT, () => {
	console.info(`Application started on port ${PORT} at ${new Date()}`)
})
