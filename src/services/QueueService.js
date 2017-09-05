import moment from 'moment/min/moment.min';

import {
    logger
} from '../config'
import HospitalModel from '../models/Hospital';
import UserModel from '../models/User';
import HospitalAnalysisModel from '../models/HospitalAnalysis';

const NOT_FOUND = 'NOT_FOUND',
    PUSH_ERROR = 'PUSH_ERROR',
    POP_ERROR = 'POP_ERROR',
    _logPrefix = '[Queue Service] -';

class QueueService {

    /**
     * Returns a list of available hospital to the user
     * @param {String} username  @current logged user
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

                resolve(hospitalList);
            })
        });
    }

    /**
     * Calculates waiting medium time for a specific queue
     * @param {String} hospitalCode 
     */
    static calculateMediumTime(hospitalCode) {
        return new Promise((resolve, reject) => {
            //resolve('10 min' + hospitalCode);
            HospitalAnalysisModel.findByCurrentPeriod(hospitalCode, (err, recordsList) => {
                if (err) return reject(err);

                if (recordsList.length > 0) {
                    try {
                        let totalTime = 0;

                        recordsList.map(element =>
                            totalTime += Number(element.timeSpent)
                        );

                        totalTime = moment.utc(totalTime / recordsList.length).format('HH:mm:ss');

                        return resolve(totalTime);
                    } catch (err) {
                        return reject(`Error calculating medium time for ${hospitalCode} \n ${err}`);
                    }
                }
                reject(`No sufficient data to calculate medium time for ${hospitalCode}`);
            });

        });
    }
    /**
     * Pushs a new user into a specific hospital Queue
     * @param {String} hospitalCode 
     * @param {String} username 
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

    /**
     * Pops user from specified hospital queue
     * @param {String} hospitalCode 
     * @param {String} username 
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

                // keeps removed user information to handle analytics data
                let removedUser = [];

                if (!username) {
                    removedUser.push(hospital.queue.shift());
                } else {
                    const position = hospital.queue.findIndex(element => element.username === username);
                    if (position === -1) {
                        return reject(POP_ERROR);
                    }
                    removedUser = hospital.queue.splice(position, 1);
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

                            this.createAnalyticsData(removedUser, updatedHospital.hospitalCode);

                            return resolve(updatedHospital);
                        })
                    } else {
                        this.createAnalyticsData(removedUser, updatedHospital.hospitalCode);

                        return resolve(updatedHospital);
                    }
                });
            })
        });
    }

    /**
     * Changes current queue information on User Model
     * @param {String} username 
     * @param {String} hospitalCode 
     */
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

    static createAnalyticsData(removedUser, hospitalCode) {
        logger.log('info', `${_logPrefix} Calculating time spent in queue for popped user`);

        const leaveDate = moment(new Date()), // current date
            joinDate = moment(new Date(removedUser[0].joinDate)),
            timeSpent = moment.duration(leaveDate.diff(joinDate)).as('milliseconds');

        const data = new HospitalAnalysisModel({
            hospitalCode,
            joinDate,
            leaveDate,
            timeSpent
        });

        data.save(err => {
            if (err) throw err;

            logger.log('info', `${_logPrefix} Analytics data saved!`);
        })

    }
}

export default QueueService;