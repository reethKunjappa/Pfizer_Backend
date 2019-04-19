let express = require('express')
let app = express();
require('dotenv').config();
const { DB_URL, NODE_PORT, NODE_ENV } = require('./config/appConfig');

console.log('##########################################')
console.log(DB_URL);

var port = process.env.PORT || NODE_PORT || 5555; // Setup server port
var appConfig = require('./config/appConfig');
app.use(appConfig.DOCUMENT_VIEW_PATH, express.static(appConfig.FS_PATH));
var bodyParser = require('body-parser');
app.use(bodyParser.json({ limit: "50mb" }));
app.use(bodyParser.urlencoded({ limit: "50mb", extended: true, parameterLimit: 50000 }));
// Import Mongoose and create connection
let mongoose = require('mongoose');
var config = require('./config/database');


mongoose.Promise = global.Promise;
mongoose.connect(DB_URL, { useNewUrlParser: true })
    .then(() => console.log('connection succesful'))
    .catch((err) => console.error(err));


app.use(function (req, res, next) {
    req.setTimeout(0);
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});

let apiRoutes = require("./routes/api-routes")
app.use('/api', apiRoutes)

// Launch app to listen to specified port
var server = app.listen(port, function () {
    console.log("Running RDOP Server on port " + port);
});

module.exports = server
