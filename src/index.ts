#!/usr/bin/env node
import { startup } from './startup';
import { refresh, validate, deployEnabled, listSubscriptions, inspect, deployDelete } from './protocol/api';

void (async () => {
	const token = await startup();

	// TODO: Implement the cli workflow
})();
