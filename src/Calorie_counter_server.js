const https = require('https');
const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs');

var app = express();

var calorieCounters = {};

var filePath = path.join(__dirname, 'calorie_counters.txt');

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
express.json();

app.use(express.static('../public'))

app.get('/', function(req, res) {
  res.sendFile(path.join(__dirname, '../public', 'Calorie_counter.html'));
});

app.get('/calorie_counter', function(req, res) {
  fs.readFile(filePath, function read(err, data) {
    if (err) {
      throw err;
    }
    if(String(data) !== '') {
      processFile(data);
    }
  });

  function processFile(data) {
    var content = JSON.parse(data);
    res.send(content[req.query.id]);
  }
});

app.post('/setGuid', function(req, res) {
  res.set('Content-Type', 'text/plain');
  fs.stat(filePath, function(err, stat) {
    if (err == null) {
      fs.readFile(filePath, function read(err, data) {
        if (err) {
          throw err;
        }
        processFile(data);
      });

      function processFile(data) {
        if(String(data) !== '') {
          var content = JSON.parse(data);
          content[req.body.id] = req.body.calorieCounter;
        } else {
          var content = {};
          content[req.body.id] = req.body.calorieCounter;
        }
        fs.writeFile(filePath, JSON.stringify(content), function (err) {
          if (err) throw err;
        });
      }
    } else if(err.code == 'ENOENT') {
      var obj = {};
      obj[req.body.id] = req.body.calorieCounter;
      console.log('File does not exist');
      fs.writeFile(filePath, JSON.stringify(obj), function (err) {
        if (err) throw err;
        console.log('The file has been saved');
      });
    } else {
      console.log('Some other error: ', err.code);
    }
  })
  res.end();
});

app.listen(8000, function() {
  console.log('Server running at http://159.89.127.195:8000');
});
