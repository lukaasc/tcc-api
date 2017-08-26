import {
    logger
} from '../config'

import Router from 'express';
import QueueService from '../services/QueueService';

export default () => {
    const api = Router();
    const _logPrefix = 'Queue API - ';

    /**
     * Entry point for Queue resource
     */
    api.get('/', (req, res) => {
        res.json({
            entry: 'Queue entry point'
        });
    });

    /**
     * Inserts a new user in a specific hospital queue
     * @param req.body.hospitalCode
     * @param req.body.username
     */
    api.post('/push', (req, res) => {
        if (!req.body.hospitalCode) return res.status(500).send('Hospital code not provided');

        logger.log('info', `${_logPrefix} Going to add a new user to ${req.body.hospitalCode} hospital!`);

        QueueService.handlePush(req.body.hospitalCode, req.body.username).then(updatedHospital => res.json(updatedHospital)).catch(err => {
            logger.log('error', `Error inserting user - hospital ${err}`);
            return res.status(500).send('Erro ao inserir usuário na fila');
        });
    });

    /**
     * Removes next user in line from specified hospital queue
     * @param req.body.hospitalCode
     * @param req.body.username
     */
    api.post('/pop', (req, res) => {
        if (!req.body.hospitalCode) return res.status(500).send('Hospital code not provided');

        logger.log('info', `${_logPrefix} Going to remove next user from ${req.body.hospitalCode} hospital!`);

        QueueService.handlePop(req.body.hospitalCode, req.body.username).then(updatedHospital => res.json(updatedHospital)).catch(err => {
            logger.log('error', `Error removing user - hospital ${err}`);
            return res.status(500).send('Erro ao remover usuário da fila');
        });

    });

    return api;
}