const process = require('process')
const opentelemetry = require('@opentelemetry/sdk-node')
const { ConsoleSpanExporter } = require('@opentelemetry/sdk-trace-base')
const { getNodeAutoInstrumentations } = require('@opentelemetry/auto-instrumentations-node')
const { Resource } = require('@opentelemetry/resources')
const { SemanticResourceAttributes } = require('@opentelemetry/semantic-conventions')

const traceExporter = new ConsoleSpanExporter()
const sdk = new opentelemetry.NodeSDK({
	resource: new Resource({
		[ SemanticResourceAttributes.SERVICE_NAME ]: 'my-app',
		[ SemanticResourceAttributes.SERVICE_VERSION ]: 'v1'
	}),
	traceExporter,
	instrumentations: [ getNodeAutoInstrumentations() ]
})

sdk.start()
	.then(() => console.info('Tracing started'))
	.catch(error => console.error('Cannot start tracing... ', error))

process.on('SIGTERM', () => {
	sdk.shutdown()
		.then(() => console.log('Tracing terminate'))
		.catch(error => console.error('Error terminating trace: ', error))
		.finally(() => process.exit(0))
})
