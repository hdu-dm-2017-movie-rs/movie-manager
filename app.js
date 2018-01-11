var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var session = require('express-session');
var mysql = require('mysql');
const _ = require('lodash');
const request = require('request-promise-native')
var fs = require('fs');

var index = require('./routes/index');
var users = require('./routes/users');

const config = {
  baseUrl: 'http://localhost:5000'
}

var app = express();
var connection = mysql.createConnection({
  host  : '115.159.125.83',
  user  : 'root',
  password : 'zhjlsyjh123',
  database : 'movie',
  port:'3306',
  timeout: 1000 * 60 * 60
 });

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// uncomment after placing your favicon in /public
// app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: false
}));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
// var identityKey = 'skey';

var sess = session({
  secret: 'yjh',
  cookie: {
    maxAge: 30 * 60 * 1000
  },
  resave: false,
  saveUninitialized: false
});

if (app.get('env') === 'production') {
  app.set('trust proxy', 1); // trust first proxy
  sess.cookie.secure = true; // serve secure cookies
}

app.use(sess);

/**
 * 测试页面
 */
app.get('/test', function (req, res) {
  // 如果请求中的 cookie 存在 isVisit, 则输出 cookie
  // 否则，设置 cookie 字段 isVisit, 并设置过期时间为1分钟
  if (req.session.isVisit) {
    // console.log(req.session);
    // console.log(req.cookies)
    console.log(req.cookies['connect.sid'])
    
    res.send('再次欢迎访问');
  } else {
    req.session.isVisit = 1
    res.send('欢迎第一次访问');
    console.log(req.cookies['connect.sid'])
  }
});

/**
 * 登录界面
 */
app.get('/', function (req, res) {
  res.sendFile(__dirname + '/public' + '/login.html');
})


/**
 * 登录接口 记录会话
 */
app.post('/login', function (req, res) {
  var name = req.body.name;
  var password = req.body.password
  console.log(req.body)
  const selectSQL = 'select * from user_image where username = ? and password = ?'

  connection.query(selectSQL, [name, password], function (err, results, fields) {
    console.log('query user')
    if (err) {
      console.log(err)
      res.json(JSON.stringify({error:1}))
    }else {
      // console.log(req.cookies)
      console.log(results)
      if(results && results.length){
        req.session.isLogin = true
        req.session.username = name
        req.session.userId = results[0].userId
        console.log(name)
        console.log(results[0].userId)
        res.redirect('/main.html')
        return
      } 
    }
  });
});


/**
 * 录入看过的电影
 */
app.get('/browser', function (req, res) {
  var userId = req.session.userId
  if (userId == null) {
    res.json(JSON.stringify({error:1, message: '会话已经过期'}))
    return
  } 
  console.log('userId', userId)

  
  const selectSQL = 'select userId from user_image where username = ?'
  
  connection.query(selectSQL, [name, password], function (err, results, fields) {
    console.log('query user')
    if (err) {
      console.log(err)
      res.json(JSON.stringify({error:1}))
    }else {
      // console.log(req.cookies)
      console.log(results)
      if(results && results.length){
        req.session.isLogin = true
        req.session.username = name
        req.session.userId = results[0].userId
        console.log(name)
        console.log(results[0].userId)
        res.redirect('/main.html')
        return
      } 
    }
  });
})

/**
 * 请求movie数据
 */
app.get('/movies', function (req, res) {
  var userId = req.session.userId
  if (userId == null) {
    res.json(JSON.stringify({error:1, message: '会话已经过期'}))
    return
  } 
  console.log('userId', userId)
  let jsonData = {}

  const selectSQL1 = `select distinct m.movieId, m.movieName, m.genres, m.rank from 
  movies2 as m join user_browser as u on m.movieId = u.movieId where u.userId = ?`
  const selectSQL2 = 'select * from movies2 order by rand() LIMIT 1000'

  connection.query(selectSQL1, [userId], function (err, results, fields) {
    console.log('query broswer')
    if(err) {
      console.log(err)
      res.json(JSON.stringify({count:0, message:'查询用户数据时出错'}))
      return
    }
    // console.log(results)
    if(results && results.length) {
      jsonData.user = {count: results.length}

      jsonData.user.subjects = _.map(results, function (x) {
        return {genres:x.genres, movieId: x.movieId, rating: x.rank, userId: userId}
      });

      connection.query(selectSQL2, function (err, results, fields) {
        console.log('query recommend')
        if(err) {
          console.log(err)
          res.json(JSON.stringify({count:0, message:'查询电影时出错'}))
          return
        }
        if(results && results.length) {
          jsonData.recommend = {count: results.length}
    
          jsonData.recommend.subjects = _.map(results, function (x) {
            return {genres:x.genres, movieId: x.movieId, rank: x.rank, movieName: x.movieName}
          });
          jsonString = JSON.stringify(jsonData)

          // request.get(config.baseUrl + '/api')
          //   .promise()
          //   .then(function (data) {
          //     console.log(data.toString('utf-8'))
          //     res.json(data)              
          //   })
          //   .catch(function (err) {
          //     if (err) {
          //       console.log('request', err)
          //     }
          //   })

          request.post({
            uri: config.baseUrl + '/api',
            json:true,
            body: jsonString,
            headers: {
              'User-Agent': 'request',
              'Content-Type': 'application/json;charset=utf-8;'
            }})
            .promise()
            .then(function (data) {
              console.log(data.toString('utf-8'))
              res.json(data)              
            })
            .catch(function (err) {
              if (err) {
                console.log('request', err)
              }
            })
        } else {
          res.send(JSON.stringify({error:0, message:"query fail"}))
        }
      })
    }
  })

  
  // res.json(JSON.stringify(jsonData))
  // return
});

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  // res.render('error');
  res.send('error');
});

module.exports = app;