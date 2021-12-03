const { BatchSpanProcessor } = require('@opentelemetry/sdk-trace-base')
const { trace } = require('@opentelemetry/api')
const { getNodeAutoInstrumentations } = require('@opentelemetry/auto-instrumentations-node')
const { Resource } = require('@opentelemetry/resources')
const { SemanticResourceAttributes } = require('@opentelemetry/semantic-conventions')

const { NodeTracerProvider } = require('@opentelemetry/node')
const { JaegerExporter } = require('@opentelemetry/exporter-jaeger')
const { B3Propagator } = require('@opentelemetry/propagator-b3')

module.exports = (serviceName, jagerHost, logger) => {

	const provider = new NodeTracerProvider({
		resource: new Resource({
			[ SemanticResourceAttributes.SERVICE_NAME ]: serviceName,
			[ SemanticResourceAttributes.SERVICE_VERSION ]: 'v1'
		}),
		plugins: {
			http: {
				enabled: true,
				path: '@opentelemetry/plugin-http',
				ignoreIncomingPaths: [ '/health', '/healthz' ]
			},
			express: {
				enabled: true,
				path: '@opentelemetry/plugin-express'
			}
		},
		instrumentations: [ getNodeAutoInstrumentations() ]
	})

	const exporter = new JaegerExporter({
		logger: logger || require('pino')(),
		host: jagerHost,
	})

	provider.addSpanProcessor(new BatchSpanProcessor(exporter))
	provider.register({
		propagator: new B3Propagator()
	})

	trace.setGlobalTracerProvider(provider)

	return trace.getTracer(serviceName)
}
