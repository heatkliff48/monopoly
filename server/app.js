require('dotenv').config();
const express = require('express');
const morgan = require('morgan');
const cors = require('cors');
const redis = require('redis');
const redisClient = redis.createClient();
const session = require('express-session');
const RedisStore = require('connect-redis')(session);
const http = require('http');
const WebSocket = require('ws');
const passport = require('passport');
require('./passportSetup');

const registerWsEmitter = require('./src/ws/wsEmitter');

const userRouter = require('./routes/userRouter');
const gameRouter = require('./routes/gameRouter');
const googleRouter = require('./routes/googleRouter');

// session
const PORT = 3001;
const app = express();
const map = new Map();

app.use(express.urlencoded({ extended: true }));
app.use(cors({ credentials: true, origin: process.env.ORIGIN }));
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const sessionParser = session({
  name: 'sesid',
  store: new RedisStore({ client: redisClient }),
  saveUninitialized: false,
  secret: process.env.SECRET,
  resave: false,
  cookie: {
    expries: 24 * 60 * 60e3,
    httpOnly: true,
  },
});
app.use(sessionParser);

app.use(passport.initialize());
app.use(passport.session());

// // Auth middleware that checks if the user is logged in
// const isLoggedIn = (req, res, next) => {
//   if (req.user) {
//     console.log('====>>>> name', req.user.displayName, '====>>>>> email', req.user.emails[0].value, '=====>>>>', req.user.photos[0].value)
//     next();
//   } else {
//     res.sendStatus(401);
//   }
// }

app.use((req, res, next) => {
  res.locals.token = process.env.API;
  if (req.session.user) {
    res.locals.user = req.session.user;
  }
  next();
});

const server = http.createServer(app);
const wss = new WebSocket.Server({ clientTracking: false, noServer: true });

app.use('/google', googleRouter);
app.use('/user', userRouter);
app.use('/game', gameRouter);

//1
server.on('upgrade', function (request, socket, head) {
  console.log('Parsing session from request...');

  sessionParser(request, {}, () => {
    if (!request.session?.user?.id) {
      socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
      socket.destroy();
      return;
    }

    console.log('Session is parsed!');

    wss.handleUpgrade(request, socket, head, function (ws) {
      wss.emit('connection', ws, request);
    });
  });
});

registerWsEmitter(map);

//2
wss.on('connection', function (ws, request) {
  const userId = request.session.user.id;
  map.set(userId, ws);

  // registerWsMessages(map, ws);
  // console.log(registerWsMessages(map, ws));

  ws.on('close', function () {
    map.delete(userId);
  });
});

server.listen(PORT, (req, res) => {
  console.log('Server start on port ', PORT);
});
