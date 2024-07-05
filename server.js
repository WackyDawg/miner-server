import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { spawn } from 'child_process';
import chalk from 'chalk';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let testProcess;
const PORT = process.env.PORT || 3980;

const mimeTypes = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpg',
  '.gif': 'image/gif',
  '.wav': 'audio/wav',
  '.mp4': 'video/mp4',
  '.woff': 'application/font-woff',
  '.ttf': 'application/font-ttf',
  '.eot': 'application/vnd.ms-fontobject',
  '.otf': 'application/font-otf',
  '.svg': 'application/image/svg+xml'
};

const serveFile = (filePath, res) => {
  const extname = String(path.extname(filePath)).toLowerCase();
  const contentType = mimeTypes[extname] || 'application/octet-stream';

  fs.readFile(filePath, (err, content) => {
    if (err) {
      if (err.code === 'ENOENT') {
        fs.readFile(path.join(__dirname, 'public', '404.html'), (error, notFoundContent) => {
          res.writeHead(404, { 'Content-Type': 'text/html' });
          res.end(notFoundContent, 'utf-8');
        });
      } else {
        res.writeHead(500);
        res.end('Sorry, check with the site admin for error: ' + err.code + ' ..\n');
        res.end();
      }
    } else {
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content, 'utf-8');
    }
  });
};

const startServer = () => {
  const server = http.createServer((req, res) => {
    console.log(`Request for ${req.url} received.`);
    
    let filePath = path.join(__dirname, 'public', req.url === '/' ? 'index.html' : req.url);
    const extname = String(path.extname(filePath)).toLowerCase();
    const contentType = mimeTypes[extname] || 'application/octet-stream';

    fs.exists(filePath, (exists) => {
      if (exists) {
        serveFile(filePath, res);
      } else {
        serveFile(path.join(__dirname, 'public', '404.html'), res);
      }
    });
  });

  server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);

    testProcess = spawn('node', [path.join(__dirname, './bot.js')], {
      stdio: 'inherit'
    });

    testProcess.on('close', (code) => {
      console.log(`Bot Server process exited with code ${code}`);
    });

    setInterval(() => {
      console.log('Restarting server and bot process...');
      testProcess.kill('SIGINT');
      server.close(() => {
        server.listen(PORT, () => {
          console.log(`Server restarted on port ${PORT}`);
          testProcess = spawn('node', [path.join(__dirname, './bot.js')], {
            stdio: 'inherit'
          });

          testProcess.on('close', (code) => {
            console.log(`Bot Server process exited with code ${code}`);
          });
        });
      });
    }, 1800000);
  });
};

startServer();
