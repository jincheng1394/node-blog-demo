import settings from './config/settings';

let createError = require('http-errors');
let express = require('express');
let path = require('path');
let cookieParser = require('cookie-parser');
let session = require('express-session');
let logger = require('morgan');
let MongoStore = require('connect-mongo')(session);
let flash = require('connect-flash');

let indexRouter = require('./routes/index');
let usersRouter = require('./routes/users');

let app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({extended: false}));
app.use(express.static(path.join(__dirname, 'public')));

app.use(cookieParser(settings.cookieSecret))

// session mongo
app.use(session({
    secret: settings.cookieSecret,
    key: settings.db,   // cookie name
    cookie: {maxAge: 1000 * 60 * 60 * 24 * 30}, // 30 days
    proxy: true,
    resave: true,
    saveUninitialized: true,
    store: new MongoStore({
        url: `${settings.url}/${settings.db}`,
        ttl: 60 * 60 * 24 * 30 // 30 days
    })
}))

// open flash
app.use(flash());

app.use('/', indexRouter);
app.use('/users', usersRouter);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
    next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
    // set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};

    // render the error page
    res.status(err.status || 500);
    res.render('error');
});

module.exports = app;
