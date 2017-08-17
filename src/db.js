import mongoose from 'mongoose'

const connection = mongoose.createConnection('mongodb://admin:admin@ds051848.mlab.com:51848/tcc_si');

export default connection;