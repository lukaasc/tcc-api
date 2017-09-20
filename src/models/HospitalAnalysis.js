import mongoose from 'mongoose';
import connection from '../db';

import moment from 'moment/min/moment.min';

const hospitalAnalyseSchema = new mongoose.Schema({
    hospitalCode: {
        type: String,
        lowercase: true,
        trim: true,
        index: true
    },
    joinDate: {
        type: Date,
        index: true
    },
    leaveDate: {
        type: Date,
        index: true
    },
    timeSpent: {
        type: Number
    }
}, {
    timestamps: true
});

hospitalAnalyseSchema.statics.findByCurrentPeriod = function (hospitalCode, callback) {
    const initialDate = moment().subtract(12, 'hours').toDate();

    return this.find({
        hospitalCode,
        createdAt: {
            $gte: initialDate
        }
    }).exec(callback);
};

hospitalAnalyseSchema.statics.aggregateStatisticData = function (hospitalCode, interval, callback) {
    const initialDate = moment().subtract(30, 'days').toDate();

    return this.aggregate(
        [{
                $match: {
                    createdAt: {
                        $gte: initialDate
                    }
                },
            },
            {
                $group: {
                    _id: {
                        day: {
                            $dateToString: {
                                format: "%d-%m-%Y",
                                date: "$joinDate"
                            }
                        }
                    },
                    mediumTime: {
                        $avg: {
                            $sum: "$timeSpent"
                        }
                    },
                    count: {
                        $sum: 1
                    }
                },
            },
            {
                $project: {
                    _id: 1,
                    mediumTime: {
                        $floor: "$mediumTime"
                    },
                    count: 1
                }
            }
        ]
    ).exec(callback);

}

const HospitalAnalysisModel = connection.model('HospitalAnalysis', hospitalAnalyseSchema);

export default HospitalAnalysisModel;