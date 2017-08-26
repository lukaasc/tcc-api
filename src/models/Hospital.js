import mongoose from 'mongoose';
import connection from '../db';

const hospitalSchema = new mongoose.Schema({
    hospitalCode: {
        type: String,
        unique: true,
        lowercase: true,
        trim: true
    },
    name: String,
    location: {
        street: String,
        latitude: {
            type: String
        },
        longitude: {
            type: String
        }
    },
    queue: [{
        username: String,
        joinDate: {
            type: Date,
            default: Date.now
        },
        leaveDate: Date
    }]
});


const HospitalModel = connection.model('Hospital', hospitalSchema);

export default HospitalModel;