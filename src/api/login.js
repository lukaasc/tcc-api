import UserModel from '../models/User';
import uuidv4 from 'uuid/v4';
import {
	logger
} from '../config'

import Router from 'express';

export default () => {
	const api = Router();
	const _logPrefix = 'Login API - ';

	api.get('/', (req, res) => {
		res.json({
			UserModel
		});
	});

	api.post('/authenticate', (req, res) => {
		if (!req.body.username || !req.body.password) {
			logger.log('error', `${_logPrefix} Invalid credentials!`);
			return res.status(500).send('Credenciais inválidas');
		}
		UserModel.findOne({
			'username': req.body.username
		}, (err, user) => {

			if (err || !user) {
				logger.log('error', `${_logPrefix} User not found!`);

				return res.status(500).send('Usuário não encontrado');

			} else if (user.session.token) {
				logger.log('info', 'Sessão encontrada, retornando sessão recuperada');

				return res.json({
					username: user.username,
					email: user.email,
					token: user.session.token,
					currentQueue: user.currentQueue
				});
			}

			// if not found, create a new session
			user.session.token = uuidv4();
			user.save((err, updatedUser) => {
				if (err) {
					logger.log('error', `${_logPrefix} Error creating new session\n ${err}`)
					return res.status(500).send('Erro ao criar sessão');
				}
				res.json({
					username: updatedUser.username,
					email: updatedUser.email,
					token: updatedUser.session.token,
					currentQueue: updatedUser.currentQueue
				});
			});

		})

	});

	api.post('/register', (req, res) => {
		if (!req.body.username || !req.body.password || !req.body.email) {
			logger.log('error', `${_logPrefix} Invalid parameters!`);
			return res.status(500).send('Parâmetros inválidos');
		}
		const newUser = UserModel({
			username: req.body.username,
			password: req.body.password,
			email: req.body.email
		});

		newUser.save((err) => {
			if (err) {
				logger.log('error', `${_logPrefix} Erro ao criar usuário\n ${err}`);
				return res.status(500).send('Erro ao criar usuário');
			}
			res.json('Usuário criado');
		});

	});

	return api;
}