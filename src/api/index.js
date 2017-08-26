import Router from 'express';
import HospitalModel from '../models/Hospital';

/* import custom API modules */
import login from './login';
import queue from './queue';

export default () => {
	const api = Router();

	api.get('/', (req, res) => {
		res.json({
			entry: 'hello'
		});
	});

	// mount the login resource
	api.use('/login', login());

	// mount the queue resource
	api.use('/queue', queue());

	return api;
}