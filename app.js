import settings from './config/settings'

let createError = require('http-errors')
let express = require('express')
let path = require('path')
let bodyParser = require('body-parser')
let cookieParser = require('cookie-parser')
let session = require('express-session')
let logger = require('morgan')
let MongoStore = require('connect-mongo')(session)
let flash = require('connect-flash')
let multer = require('multer')
let fs = require('fs')

let indexRouter = require('./routes/index')
let usersRouter = require('./routes/users')

let app = express()
// view engine setup
app.set('views', path.join(__dirname, 'views'))
app.set('view engine', 'ejs')

// app.use(logger('dev'))
let accessLog = fs.createWriteStream('access.log', {flags: 'a'})
let errorLog = fs.createWriteStream('error.log', {flags: 'a'})
app.use(logger({stream: accessLog}))
app.use(express.json())
app.use(express.urlencoded({extended: false}))
app.use(express.static(path.join(__dirname, 'public')))

app.use((err, req, res, next) => {
    let meta = '[' + new Date() + '] ' + req.url + '\n'
    errorLog.write(meta + err.stack + '\n')
    next()
})

app.use(cookieParser(settings.cookieSecret))

// 设置session使用mongo存储
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

// 设置上传目录
let storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, './public/upload')
    },
    filename: (req, file, cb) => {
        cb(null, file.originalname)
    }
})

let upload = multer({storage: storage})
app.use(upload.any())

// open flash
app.use(flash())

app.use('/', indexRouter)
app.use('/users', usersRouter)

// catch 404 and forward to error handler
// app.use(function (req, res, next) {
//     next(createError(404))
// })
app.use(function (req, res) {
    res.render("404")
})

// error handler
app.use(function (err, req, res, next) {
    // set locals, only providing error in development
    res.locals.message = err.message
    res.locals.error = req.app.get('env') === 'development' ? err : {}

    // render the error page
    res.status(err.status || 500)
    res.render('error')
})

module.exports = app
