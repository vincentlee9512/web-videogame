
var fs =  require('fs');
var path = require('path');
var http = require('http');
var url = require('url');
var express = require('express');
var app = express();
app.use(express.static('public'));

var port = 8014;
var public_dir = path.join(__dirname, 'public');
var assets_dir = path.join(public_dir, 'assets');
app.get('/', (req, res)=>{
    res.sendFile(path.join(public_dir, 'space.html'));
});


app.listen(port, ()=> console.log('ITS WORKING... on port: ' + port));
