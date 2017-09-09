import Router from 'express';

/* import custom API modules */
import login from './login';
import queue from './queue';

export default (io) => {
	const api = Router();

	api.get('/', (req, res) => {
		res.json({
			entry: 'hello'
		});
	});

	// mount the login resource
	api.use('/login', login());

	// mount the queue resource
	api.use('/queue', queue(io));

	return api;
}