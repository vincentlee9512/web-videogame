
var path = require('path');
var express = require('express');
var app = express();
app.use(express.static('public'));

var port = 8014;
var public_dir = path.join(__dirname, 'public');
app.get('/', (req, res)=>{
    res.sendFile(path.join(public_dir, 'space.html'));
});


app.listen(port, ()=> console.log('ITS WORKING... on port: ' + port));
