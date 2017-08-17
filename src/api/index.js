import Router from 'express';

/* import custom API modules */
import login from './login';

export default ({
	config
}) => {
	const api = Router();

	api.get('/', (req, res) => {
		res.json({
			entry: 'hello'
		});
	});

	// mount the login resource
	api.use('/login', login({
		config
	}));

	return api;
}