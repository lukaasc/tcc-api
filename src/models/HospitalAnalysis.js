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
    timeSpent: {
        type: String
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

const HospitalAnalysisModel = connection.model('HospitalAnalysis', hospitalAnalyseSchema);

export default HospitalAnalysisModel;