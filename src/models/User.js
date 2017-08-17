import mongoose from 'mongoose';
import connection from '../db';

const userSchema = new mongoose.Schema({
    userId: {
        type: String,
        unique: true
    },
    password: String,
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