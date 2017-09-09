function socketInit(io) {
    /* eslint-disable */
    io.on('connection', socket => {
        console.log('[Socket.io] --> New connection received');

        socket.on('disconnect', () => {
            console.log('[Socket.io] --> User disconnected');
        })
    })
    /* eslint-enable */
}

export default socketInit;