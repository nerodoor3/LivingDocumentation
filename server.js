/// <reference path="typings/node/node.d.ts" />
/// <reference path="typings/express/express.d.ts" />
require('source-map-support').install();
var express = require('express');
var http = require('http');
var path = require('path');
var config = require('./config');
var app = express();
app.set('port', config.port.toString());
var logger = require('morgan');
app.use(logger('dev'));
app.use(express.static(path.join(__dirname, 'app')));
app.use(function (err, req, res, next) {
    console.error(err);
    next(err);
});
http.createServer(app).listen(app.get('port'), function () {
    console.log('Express server listening on port ' + app.get('port'));
});
//# sourceMappingURL=server.js.map