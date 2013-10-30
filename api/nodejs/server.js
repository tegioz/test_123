// test_123 API

// Server dependencies

var application_root = __dirname,
    _ = require("underscore"),
    express = require("express"),
    http = require('http'),
    fs = require('fs');

// Load base json file

var baseJSON = fs.readFileSync("../common/base.json", "utf8");

// Express app configuration

var app = express();
app.configure(function() {
    app.use(express.logger());
    app.use(express.json());
    app.use(express.urlencoded());
    app.use(app.router);
    app.use(express.static(__dirname + "/../../ui/"));
    app.use(function(err, req, res, next) {
        console.error(err.stack);
    });
});

// Validation / checks

var checkData = function(req, res, next) {
    var baseJSONObj = JSON.parse(baseJSON);
    if (_.difference(_.keys(baseJSONObj), ["shows", "regions", "show_regions"]).length === 0) {
        next();
    } else {
        res.send(503, "Data not ready. Please try again later.")
    }
};

var checkParameters = function(req, res, next) {
    if (_.has(req.query, "callback")) {
        next();
    } else {
        res.send(400, "Missing parameters");
    }
};

// Setup routes

// Test :-)
app.get("/ping", function(req, res) {
    res.send(200, "pong!");
});

// Redirect / to app (index.html)
app.get("/", function(req, res) {
    res.redirect("/index.html");
});

// Serve data to clients
app.get("/api/data", checkData, checkParameters, function(req, res) {
    var jsonpCallback = req.query.callback;
    res.send(200, jsonpCallback + "(" + baseJSON + ");");
});

// Launch server

server = http.createServer(app);
server.listen(8001, "127.0.0.1");
console.log("test_123 Node.js API listening on 127.0.0.1:8001");

