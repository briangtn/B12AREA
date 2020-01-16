import {AreaApplication} from './application';
import {ApplicationConfig} from '@loopback/core';
import {OpenApiSpec} from "@loopback/openapi-v3";

export {AreaApplication};

export async function main(options: ApplicationConfig = {}) {
	const app = new AreaApplication(options);
	await app.boot();
	await app.start();

	const url = app.restServer.url;
	console.log(`Server is running at ${url}`);
	console.log(`Try ${url}/ping`);

	return app;
}
