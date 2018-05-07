const path = require('path');
const express = require('express');
const app = express();
app.use(express.static('public'));

const port = 8014;
const public_dir = path.join(__dirname, 'public');
app.get('/', (req, res)=>{
    res.sendFile(path.join(public_dir, 'space.html'));
});


app.listen(port, ()=> console.log('ITS WORKING... on port: ' + port));
