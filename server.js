const https = require('https');
const fs = require('fs');
const path = require('path');

const options = {
  key: fs.readFileSync('path/to/your/key.pem'),
  cert: fs.readFileSync('path/to/your/cert.pem')
};

const server = https.createServer(options, (req, res) => {
  console.log('Received request for:', req.url);
  
  const filePath = path.join(__dirname, req.url);
  const extname = path.extname(filePath);
  const contentType = 'audio/mpeg';

  fs.readFile(filePath, (error, content) => {
    if (error) {
      if(error.code == 'ENOENT') {
        console.error('File not found:', filePath);
        res.writeHead(404);
        res.end('File not found');
      } else {
        console.error('Server error:', error.code);
        res.writeHead(500);
        res.end('Server error: '+error.code);
      }
    } else {
      console.log('Serving file:', filePath);
      res.writeHead(200, { 
        'Content-Type': contentType,
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Origin, X-Requested-With, Content-Type, Accept'
      });
      res.end(content, 'utf-8');
    }
  });
});

const PORT = 8443;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));