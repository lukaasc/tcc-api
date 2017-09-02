import {
    logger
} from '../config'
import HospitalModel from '../models/Hospital';
import UserModel from '../models/User';

const NOT_FOUND = 'NOT_FOUND',
    PUSH_ERROR = 'PUSH_ERROR',
    POP_ERROR = 'POP_ERROR',
    _logPrefix = '[Queue Service] -';

class QueueService {

    /**
     * Returns a list of available hospital to the user
     */
    static getAvailableHospitals(username) {
        logger.log('info', `${_logPrefix} Fetching list of available hospitals`);

        return new Promise((resolve, reject) => {
            HospitalModel.aggregate([{
                $match: {}
            }, {
                $project: {
                    hospitalCode: 1,
                    name: 1,
                    location: 1,
                    queue: {
                        $size: '$queue'
                    },
                    currentQueue: {
                        $filter: {
                            input: "$queue",
                            as: "item",
                            cond: {
                                $eq: ["$$item.username", username]
                            }
                        }
                    },
                    currentPosition: {
                        $indexOfArray: [
                            "$queue.username", username
                        ]
                    }

                }
            }, {
                $sort: {
                    queue: 1
                }
            }], (err, hospitalList) => {
                if (err) return reject(err);

                console.log(hospitalList);
                resolve(hospitalList);
            })
        });
    }
    /**
     * Pushs a new user into a specific hospital Queue
     * @param {*} hospitalCode 
     * @param {*} username 
     */
    static handlePush(hospitalCode, username) {
        logger.log('info', `${_logPrefix} Handling push operation on ${hospitalCode}`);

        return new Promise((resolve, reject) => {
            HospitalModel.findOne({
                hospitalCode
            }, async(err, hospital) => {
                if (err || !hospital) {
                    logger.log('error', `${_logPrefix} Not able to find the hospital \n${err}`);

                    return reject(NOT_FOUND);
                }

                /** Checks if user already has a queue */
                if (username) {
                    logger.log('info', `${_logPrefix} Handling [-- ${username} --] current queue`);
                    try {
                        var user = await this.changeUserCurrentQueue(username, hospital.hospitalCode);
                    } catch (err) {
                        return reject(err || '-> User not found');
                    }
                }

                hospital.queue.push({
                    username: !username ? '' : username
                })

                hospital.save((err, updatedHospital) => {
                    if (err) {
                        logger.log('error', `${_logPrefix} Error pushing new user to the queue`);
                        return reject(PUSH_ERROR);
                    }

                    if (username) {
                        user.save((err) => {
                            if (err) return reject(err)

                            return resolve(updatedHospital);
                        })
                    } else return resolve(updatedHospital);

                });
            })
        });
    }

    static changeUserCurrentQueue(username, hospitalCode) {
        return new Promise((resolve, reject) => {
            UserModel.findOne({
                username
            }, (err, user) => {
                if (err || !user) {
                    logger.log('error', `${_logPrefix} Could not find user to check current queue status`)
                    return reject(err);
                }

                if (!hospitalCode) {
                    user.currentQueue = null;
                    resolve(user);
                }
                if (user.currentQueue) return reject('User already in a Queue');

                user.currentQueue = hospitalCode

                resolve(user);
            })
        })
    }

    /**
     * Pops user from specified hospital queue
     * @param {*} hospitalCode 
     * @param {*} username 
     */
    static handlePop(hospitalCode, username) {
        logger.log('info', `${_logPrefix} Handling pop operation on ${hospitalCode}`);

        return new Promise((resolve, reject) => {
            HospitalModel.findOne({
                hospitalCode
            }, async(err, hospital) => {
                if (err || !hospital) {
                    logger.log('error', `${_logPrefix} Not able to find the hospital \n${err}`);

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

                    var user = await this.changeUserCurrentQueue(username);
                }
                hospital.save((err, updatedHospital) => {
                    if (err) {
                        logger.log('error', `${_logPrefix} Error poping user from the queue`);
                        return reject(POP_ERROR);
                    }

                    if (user) {
                        user.save(err => {
                            if (err) return reject(err)

                            return resolve(updatedHospital);
                        })
                    } else
                        return resolve(updatedHospital);
                });
            })
        });
    }
}

export default QueueService;