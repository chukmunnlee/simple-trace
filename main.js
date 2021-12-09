const morgan = require('morgan')
const express = require('express')
const { SemanticAttributes } = require('@opentelemetry/semantic-conventions')
const {SpanKind, SpanStatusCode, context} = require('@opentelemetry/api')
const fetch = require('node-fetch')

const tracer = require('./trace')('my-service', 'localhost')

const PORT = parseInt(process.env.PORT) || 3000
const OPEN_WEATHER_MAP = process.env.OPEN_WEATHER_MAP || null

const app = express()

app.use(morgan('common'))

app.get(['/', '/index.html'], (req, resp) => {

	const span = tracer.startSpan(req.url, {
		attributes: {
			[SemanticAttributes.HTTP_METHOD]: req.method,
			[SemanticAttributes.HTTP_URL]: req.url,
		},
		kind: SpanKind.SERVER
	})
	resp.on('close', () => {
		span.end()
	})

	const message = `<h1>The current time is ${new Date()}</h1>`
	resp.status(200).type('text/html')
		.send(message)

	span.setStatus({
		code: SpanStatusCode.OK,
		message
	})
})

app.get('/weather/:city', (req, resp) => {
	const span = tracer.startSpan(req.url, {
		attributes: {
			[SemanticAttributes.HTTP_METHOD]: req.method,
			[SemanticAttributes.HTTP_URL]: req.url,
		},
		kind: SpanKind.SERVER
	})
	resp.on('close', () => {
		span.end()
	})
	const city = req.param('city', 'ipoh')

	const ctx = setSpan(context.active(), span)
	context.with(ctx, getWeather, undefined, city)
})

if (!!OPEN_WEATHER_MAP)
	app.listen(PORT, () => {
		console.info(`Application started on port ${PORT} at ${new Date()}`)
	})
else
	console.error('OPEN_WEATHER_MAP key not set')

const getWeather = (city) => {
	const span = tracer.startSpan('openweathermap', {
		attributes: {
			[SemanticAttributes.HTTP_METHOD]: 'POST',
			[SemanticAttributes.HTTP_URL]: 'https://api.openweathermap.org/data/2.5/weather',
			city
		},
		kind: SpanKind.CLIENT
	})
	fetch(`https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${OPEN_WEATHER_MAP}`)
		.then(result => result.json())
		.then(result => {
			const status = { code: result.cod }
			if ('message' in result)
				status.message = result.message
			span.setStatus(result)
			return result
		})
		.catch(err => {
			span.setStatus({ 
				code: SpanStatusCode.ERROR,
				message: JSON.stringify(err)
			})
		})
		.finally(() => span.end())
}

