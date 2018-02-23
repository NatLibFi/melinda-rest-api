import app from './app';

const PORT = 8080;

const server = app.listen(PORT, () => console.log(`Application started on port ${PORT}`));

server.timeout = 1800000; // Half an hour
