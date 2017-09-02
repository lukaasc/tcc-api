import {
    logger
} from '../config'

import Router from 'express';
import QueueService from '../services/QueueService';

export default () => {
    const api = Router();
    const _logPrefix = '[Queue API] - ';

    /**
     * Entry point for Queue resource
     */
    api.get('/', (req, res) => {
        res.json({
            entry: 'Queue entry point'
        });
    });

    /**
     * Returns available hospital to the user
     */
    api.get('/availableHospitals/:username', (req, res) => {
        logger.log('info', `${_logPrefix} Going to fetch available hospital list`);

        QueueService.getAvailableHospitals(req.params.username).then(hospitalList => res.json(hospitalList)).catch(err => {
            logger.log('error', `${_logPrefix} Error fetching hospital list \n${err}`);
            return res.status(500).send('Erro ao tentar recuperar lista de hospitais disponíveis');
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
            logger.log('error', `${_logPrefix} Error inserting user - ${err}`);
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

        logger.log('info', `${_logPrefix} Going to remove next user from ${req.body.hospitalCode}!`);

        QueueService.handlePop(req.body.hospitalCode, req.body.username).then(updatedHospital => res.json(updatedHospital)).catch(err => {
            logger.log('error', `${_logPrefix} Error removing user - hospital ${err}`);
            return res.status(500).send('Erro ao remover usuário da fila');
        });

    });

    return api;
}