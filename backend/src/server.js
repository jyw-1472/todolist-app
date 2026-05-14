'use strict';

require('./config/env');
const { connectDatabase } = require('./config/database');
const app = require('./app');

const PORT = process.env.PORT || 3000;

async function startServer() {
  await connectDatabase();
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
