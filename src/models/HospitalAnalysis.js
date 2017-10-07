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
    const initialDate = moment().subtract(5, 'days').toDate();

    return this.aggregate(
        [{
                $match: {
                    joinDate: {
                        $gte: initialDate
                    },
                    hospitalCode: {
                        $eq: hospitalCode
                    }
                },
            },
            {
                $group: {
                    _id: {
                        day: {
                            $dateToString: {
                                format: "%m-%d-%Y",
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
                    mediumTime: 1,
                    count: 1
                }
            },
            {
                $sort: {
                    _id: 1
                }
            }
        ]
    ).exec(callback);

}

hospitalAnalyseSchema.statics.aggregateRecommendedHospital = function (callback) {
    return this.aggregate(
        [{
            $group: {
                _id: "$hospitalCode",
                mediumTime: {
                    $avg: {
                        $sum: "$timeSpent"
                    }
                }
            },
        }]
    ).exec(callback);
}

const HospitalAnalysisModel = connection.model('HospitalAnalysis', hospitalAnalyseSchema);

export default HospitalAnalysisModel;