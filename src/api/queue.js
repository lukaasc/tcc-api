import {
    logger
} from '../config'

import Router from 'express';
import QueueService from '../services/QueueService';

export default (io) => {
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
     * Returns medium time for a specific hospital
     */
    api.get('/getMediumTime/:hospitalCode', (req, res) => {
        logger.log('info', `${_logPrefix} Going to fetch queue waiting time for ${req.params.hospitalCode}`);

        QueueService.calculateMediumTime(req.params.hospitalCode).then(waitingTime => res.json(waitingTime)).catch(err => {
            logger.log('error', `${_logPrefix} Error fetching queue waiting medium time \n${err}`);

            return res.status(500).send('Erro ao tentar calcular tempo de espera médio do hospital');
        });
    });

    /**
     * Returns medium time aggregated by hospital
     */
    api.get('/getAllMediumTime', (req, res) => {
        logger.log('info', `${_logPrefix} Going to fetch queue waiting time for all hospitals`);

        QueueService.calculateAllMediumTime().then(response => res.json(response)).catch(err => {
            logger.log('error', `${_logPrefix} Error fetching queue waiting medium time for all hospitals \n${err}`);

            return res.status(500).send('Erro ao tentar calcular tempo de espera médio dos hospitais');
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

        QueueService.handlePush(req.body.hospitalCode, req.body.username, io).then(updatedHospital => res.json(updatedHospital)).catch(err => {
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

        QueueService.handlePop(req.body.hospitalCode, req.body.username, io).then(updatedHospital => res.json(updatedHospital)).catch(err => {
            logger.log('error', `${_logPrefix} Error removing user - hospital ${err}`);

            return res.status(500).send('Erro ao remover usuário da fila');
        });

    });

    /**
     * Fetchs statistic information regarding a specific hospital
     * @param hospitalCode
     * @param interval @ Time interval to aggregate information
     */
    api.get('/statistic', (req, res) => {
        if (!req.query.hospitalCode) return res.status(500).send('Hospital code not provided');

        logger.log('info', `${_logPrefix} Going to aggregate statistic data for hospital ${req.query.hospitalCode}!`);

        QueueService.getStatistic(req.query).then(data => res.json(data)).catch(err => {
            logger.log('error', `${_logPrefix} Error aggregating statistic data \n${err}`);

            return res.status(500).send('Erro ao tentar recuperar dados estatísticos');
        });

    });

    return api;
}