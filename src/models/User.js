import mongoose from 'mongoose';
import connection from '../db';

const userSchema = new mongoose.Schema({
    userId: {
        type: String,
        unique: true,
        lowercase: true,
        trim: true
    },
    password: String,
    email: {
        type: String,
        unique: true
    },
    session: {
        token: {
            type: String
        },
        date: {
            type: Date,
            default: Date.now
        }

    }
});

const UserModel = connection.model('User', userSchema);

export default UserModel;