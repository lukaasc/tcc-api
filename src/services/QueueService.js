import {
    logger
} from '../config'
import HospitalModel from '../models/Hospital';

const NOT_FOUND = 'NOT_FOUND',
    PUSH_ERROR = 'PUSH_ERROR',
    POP_ERROR = 'POP_ERROR'

class QueueService {

    /**
     * Pushs a new user into a specific hospital Queue
     * @param {*} hospitalCode 
     * @param {*} username 
     */
    static handlePush(hospitalCode, username) {
        logger.log('info', `Handling push operation on ${hospitalCode}`);

        return new Promise((resolve, reject) => {
            HospitalModel.findOne({
                hospitalCode
            }, (err, hospital) => {
                if (err || !hospital) {
                    logger.log(`error', 'Not able to find the hospital \n${err}`);

                    return reject(NOT_FOUND);
                }

                hospital.queue.push({
                    username
                })

                hospital.save((err, updatedHospital) => {
                    if (err) {
                        logger.log('error', 'Error pushing new user to the queue');
                        return reject(PUSH_ERROR);
                    }

                    return resolve(updatedHospital);
                });
            })
        });
    }

    /**
     * Pops user from specified hospital queue
     * @param {*} hospitalCode 
     * @param {*} username 
     */
    static handlePop(hospitalCode, username) {
        logger.log('info', `Handling pop operation on ${hospitalCode}`);

        return new Promise((resolve, reject) => {
            HospitalModel.findOne({
                hospitalCode
            }, (err, hospital) => {
                if (err || !hospital) {
                    logger.log(`error', 'Not able to find the hospital \n${err}`);

                    return reject(NOT_FOUND);
                }

                if (!username) {
                    hospital.queue.shift();
                } else {
                    const position = hospital.queue.findIndex(element => element.username === username);
                    if (position === -1) {
                        return reject(POP_ERROR);
                    }
                    hospital.queue.splice(position, 1);
                }
                hospital.save((err, updatedHospital) => {
                    if (err) {
                        logger.log('error', 'Error poping user from the queue');
                        return reject(POP_ERROR);
                    }

                    return resolve(updatedHospital);
                });
            })
        });
    }
}

export default QueueService;