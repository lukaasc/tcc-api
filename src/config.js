import winston from 'winston';

const logger = new(winston.Logger)({
    transports: [
        new(winston.transports.Console)(),
        new(winston.transports.File)({
            filename: 'application.log'
        })
    ]
});

export {
    logger
};

export default {
    'port': 8080,
    'bodyLimit': '100kb',
    'corsHeaders': ['Link']
}