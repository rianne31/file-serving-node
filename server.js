const http = require('http');
const fs = require('fs');
const path = require('path');
const formidable = require('formidable');

const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}

const allowedFileTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf', 'text/plain'];

const mimeTypes = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'text/javascript',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.gif': 'image/gif',
  '.pdf': 'application/pdf',
  '.txt': 'text/plain'
};

const server = http.createServer((req, res) => {
  if (req.method === 'POST' && req.url === '/upload') {
    const form = new formidable.IncomingForm();
    
    form.parse(req, (err, fields, files) => {
      if (err) {
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end('An error occurred during file upload');
        return;
      }
      
      const uploadedFile = files.fileUpload;
      
      if (!allowedFileTypes.includes(uploadedFile.mimetype)) {
        res.writeHead(400, { 'Content-Type': 'text/plain' });
        res.end('File type not allowed. Please upload JPEG, PNG, GIF, PDF, or TXT files only.');
        return;
      }
      
      const timestamp = Date.now();
      const newFilename = `${timestamp}-${uploadedFile.originalFilename}`;
      const newFilePath = path.join(uploadsDir, newFilename);
      
      fs.copyFile(uploadedFile.filepath, newFilePath, (err) => {
        if (err) {
          res.writeHead(500, { 'Content-Type': 'text/plain' });
          res.end('Error saving the file');
          return;
        }
        
        res.writeHead(302, { 'Location': '/upload-success.html?file=' + encodeURIComponent(newFilename) });
        res.end();
      });
    });
    return;
  }
  
  if (req.method === 'GET') {
    let filePath = req.url === '/' 
      ? path.join(__dirname, 'public', 'index.html') 
      : path.join(__dirname, req.url.startsWith('/uploads/') ? '.' : 'public', req.url);
    
    fs.access(filePath, fs.constants.F_OK, (err) => {
      if (err) {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('404 Not Found');
        return;
      }
      
      fs.stat(filePath, (err, stats) => {
        if (err) {
          res.writeHead(500, { 'Content-Type': 'text/plain' });
          res.end('Internal Server Error');
          return;
        }
        
        if (stats.isDirectory()) {
          filePath = path.join(filePath, 'index.html');
        }
        
        fs.readFile(filePath, (err, content) => {
          if (err) {
            res.writeHead(500, { 'Content-Type': 'text/plain' });
            res.end('Internal Server Error');
            return;
          }
          
          const ext = path.extname(filePath);
          const contentType = mimeTypes[ext] || 'application/octet-stream';
          
          res.writeHead(200, { 'Content-Type': contentType });
          res.end(content);
        });
      });
    });
  }
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}/`);
});



