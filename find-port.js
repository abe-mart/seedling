#!/usr/bin/env node
// Find the next available port starting from a given port number

const net = require('net');

const startPort = parseInt(process.argv[2]) || 3000;
const maxAttempts = 100;

function checkPort(port) {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    
    server.once('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        resolve(false); // Port is in use
      } else {
        reject(err);
      }
    });
    
    server.once('listening', () => {
      server.close();
      resolve(true); // Port is available
    });
    
    server.listen(port, '0.0.0.0');
  });
}

async function findAvailablePort(startPort) {
  for (let port = startPort; port < startPort + maxAttempts; port++) {
    const isAvailable = await checkPort(port);
    if (isAvailable) {
      return port;
    }
  }
  throw new Error(`No available port found between ${startPort} and ${startPort + maxAttempts}`);
}

findAvailablePort(startPort)
  .then(port => {
    console.log(port);
    process.exit(0);
  })
  .catch(err => {
    console.error('Error:', err.message);
    process.exit(1);
  });
