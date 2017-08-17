import UserModel from '../models/User';
import uuidv4 from 'uuid/v4';

import Router from 'express';

export default () => {
	const api = Router();

	api.get('/', (req, res) => {
		res.json({
			UserModel
		});
	});

	api.post('/authenticate', (req, res) => {

		if (req.body.userId) {
			const newUser = UserModel({
				userId: req.body.userId,
				password: req.body.password,
				session: {
					token: uuidv4()
				}
			});

			newUser.save(err => {
				if (err) throw err;
				res.send('Success');
			});
		} else {
			res.send('No userId provided');
		}
	});

	return api;
}