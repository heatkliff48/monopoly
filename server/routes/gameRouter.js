const router = require('express').Router();
const {
  Game,
  UserInGame,
  User,
  GameStatistic,
  sequelize,
  UserGamePanding,
  Street,
  Dohod,
  Estate,
} = require('../db/models');
const { v4: uuidv4 } = require('uuid');
const myEmitter = require('../src/ee');
const {
  CREATE_GAME_SOCKET,
  GET_GAME_USERS_SOCKET,
  DEL_GAME,
  START_GAME_SOCKET,
  ROLL_DICE_SOCKET,
  TURN_SOCKET,
  GET_CARD_USER_SOCKET,
} = require('../src/constants/event');

router.route('/').get(async (req, res) => {
  const game = await Game.findAll({
    include: [
      {
        model: User,
        as: 'UserInGamesAliase',
      },
    ],
  });

  res.json(game);
});

router.route('/checkGame').get(async (req, res) => {
  const { gameid } = req.body;
  const gameParty = await UserInGame.findAll({ where: { gameid } });
  if (gameParty.length >= 4) res.json({ game: 'fullStack' });
  res.sendStatus(200);
});

router.route('/add').post(async (req, res) => {
  const { owner } = req.body;

  const game = await Game.create({
    key: uuidv4(),
    owner,
    inprocess: false,
    turn: 1,
  });

  const userInGame = await UserInGame.create({
    gameid: game.id,
    userid: owner,
  });

  await GameStatistic.create({
    uigid: userInGame.id,
    position: 0,
    money: 5500,
    queue: 1,
  });

  myEmitter.emit(CREATE_GAME_SOCKET, game);

  res.json(game);
});

router.route('/del').post(async (req, res) => {
  const { userid, gameid } = req.body;
  await Game.destoy({ where: { gameid, userid } });

  myEmitter.emit(DEL_GAME, gameid);
  res.sendStatus(200);
});

router.route('/mygame').post(async (req, res) => {
  const { userid } = req.body;

  const myGames = await User.findAll({
    where: { id: userid },
    include: {
      model: Game,
      as: 'UserInGamesAliase',
    },
  });

  res.json(myGames[0]?.UserInGamesAliase);
});

router.route('/start').post(async (req, res) => {
  const { key } = req.body;

  const game = await Game.findOne({
    where: { key },
    include: [
      {
        model: User,
        as: 'UserInGamesAliase',
      },
    ],
  });

  game.inprocess = true;
  await game.save();
  const users = game.UserInGamesAliase;

  const [gameusers] = await sequelize.query(`
  select "Users".id, name,"GameStatistics".position, "GameStatistics".money,"GameStatistics".queue from "Users" 
  join "UserInGames" on "Users".id = "UserInGames".userid
  join "Games" on "UserInGames".gameid = "Games".id
  join "GameStatistics" on "UserInGames".id = "GameStatistics".uigid
  where "Games".key = '${key}'
   `);

  //Отправить всем игрокам в лобби статус игры

  myEmitter.emit(START_GAME_SOCKET, users, game.id);
  myEmitter.emit(TURN_SOCKET, gameusers, game.turn);
  res.json(game);
});

router.route('/add/users').post(async (req, res) => {
  const { userid, key } = req.body;

  const users = await User.findAll({});
  const notMe = users.filter((el) => el.id != userid);

  const panding = await UserGamePanding.findAll({
    where: { gamekey: key },
  });

  if (panding.length > 0) {
    const usersPandingFilter = notMe.filter(
      (user) =>
        panding.findIndex((pandingUser) => pandingUser.userid === user.id) === -1
    );

    const user = usersPandingFilter.map((el) => {
      return { id: el.id, name: el.name };
    });

    return res.json(user);
  } else {
    const user = notMe.map((el) => {
      return { id: el.id, name: el.name };
    });
    return res.json(user);
  }
});

router.route('/panding').post(async (req, res) => {
  const { pandingid, key } = req.body;

  for (let i = 0; i < pandingid.length; i++) {
    await UserGamePanding.create({ userid: pandingid[i], gamekey: key });
  }

  //Отправлять определенному юзеру приглос
  res.sendStatus(200);
});

router.route('/users').post(async (req, res) => {
  const { key } = req.body;

  const [gameusers] = await sequelize.query(`
  select "Users".id, name,"GameStatistics".position, "GameStatistics".money,"GameStatistics".queue from "Users" 
  join "UserInGames" on "Users".id = "UserInGames".userid
  join "Games" on "UserInGames".gameid = "Games".id
  join "GameStatistics" on "UserInGames".id = "GameStatistics".uigid
  where "Games".key = '${key}'
   `);

  res.json(gameusers);
});

router.route('/userInGame').post(async (req, res) => {
  const { gameid, userid } = req.body;
  const curgame = await Game.findOne({ where: { id: gameid } });
  //max 4 person proverka

  const user = await UserInGame.findAll({ where: { userid, gameid } });

  if (user.length === 0) {
    const userInGame = await UserInGame.create({
      gameid,
      userid,
    });

    const [test] = await sequelize.query(`
      select "Users".id, name, "GameStatistics".position, "GameStatistics".money,"GameStatistics".queue from "Users"
      join "UserInGames" on "Users".id = "UserInGames".userid
      join "GameStatistics" on "UserInGames".id = "GameStatistics".uigid
      where "UserInGames".gameid = ${gameid} 
       `);

    await GameStatistic.create({
      uigid: userInGame.id,
      position: 0,
      money: 5500,
      queue: test[test.length - 1].queue + 1,
    });

    const [gameusers] = await sequelize.query(`
    select "Users".id, name,"GameStatistics".position, "GameStatistics".money,"GameStatistics".queue from "Users" 
    join "UserInGames" on "Users".id = "UserInGames".userid
    join "Games" on "UserInGames".gameid = "Games".id
    join "GameStatistics" on "UserInGames".id = "GameStatistics".uigid
    where "Games".key = '${curgame.key}'
     `);
    //Отправить данные игрока всем, кто с ним в игре

    myEmitter.emit(GET_GAME_USERS_SOCKET, gameusers);
    return res.sendStatus(200);
  } else return res.sendStatus(403);
});

router.route('/dice').post(async (req, res) => {
  const { dice, userid, gamekey } = req.body;

  const [gameusers] = await sequelize.query(`
  select "Users".id, name,"GameStatistics".position, "GameStatistics".money,"GameStatistics".queue from "Users" 
  join "UserInGames" on "Users".id = "UserInGames".userid
  join "Games" on "UserInGames".gameid = "Games".id
  join "GameStatistics" on "UserInGames".id = "GameStatistics".uigid
  where "Games".key = '${gamekey}'
   `);

  const curgame = await Game.findOne({ where: { key: gamekey } });
  curgame.turn += 1;
  await curgame.save();
  if (curgame.turn > gameusers.length) {
    curgame.turn = 1;
    await curgame.save();
  }

  const UserInGameS = await UserInGame.findOne({
    where: { userid, gameid: curgame.id },
  });

  const blablabla = await GameStatistic.findOne({
    where: { uigid: UserInGameS.id },
  });
  blablabla.position += dice;
  await blablabla.save();

  if (blablabla.position > 39) {
    blablabla.position = blablabla.position - 40;
    await blablabla.save();
  }

  myEmitter.emit(ROLL_DICE_SOCKET, gameusers, dice, curgame.turn);
  myEmitter.emit(TURN_SOCKET, gameusers, curgame.turn);

  res.sendStatus(200);
});
router.route('/cardboard').get(async (req, res) => {
  const card = await Street.findAll();

  res.json(card);
});
router.route('/currentcard').post(async (req, res) => {
  const { boardid, userid, gamekey } = req.body;

  let isFree = false;
  let card = null;
  let cardBoardValue = null;
  const money = {};

  const user = await User.findOne({ where: { id: userid } });

  const [gameusers] = await sequelize.query(`
  select "Users".id, name,"GameStatistics".position, "GameStatistics".money,"GameStatistics".queue from "Users"
  join "UserInGames" on "Users".id = "UserInGames".userid
  join "Games" on "UserInGames".gameid = "Games".id
  join "GameStatistics" on "UserInGames".id = "GameStatistics".uigid
  where "Games".key = '${gamekey}'
   `);

  if (boardid === null) {
    card = { name: 'START' };
  } else {
    const game = await Game.findOne({ where: { key: gamekey } });

    const userInGame = await UserInGame.findOne({
      where: { userid, gameid: game.id },
    });
    card = await Street.findOne({
      where: { boardid },
    });

    const value = await Dohod.findOne({ where: { streetid: card.id } });

    const userstatistic = await GameStatistic.findOne({
      where: { uigid: userInGame.id },
    });
    const cardowner = await Estate.findAll({
      where: { streetid: card.id, gamestatisticid: userstatistic.id },
    });
    cardBoardValue = await Dohod.findOne({ where: { streetid: card.id } });
    if (cardowner.length === 0) {
      isFree = true;
    } else {
      for (let i = 0; i < gameusers.length; i++) {
        const userInGameOnwer = await UserInGame.findOne({
          where: { userid: gameusers[i].id, gameid: game.id },
        });

        const userstatisticOwner = await GameStatistic.findOne({
          where: { uigid: userInGameOnwer.id },
        });
        const cardOwner = await Estate.findAll({
          where: { streetid: card.id, gamestatisticid: userstatisticOwner.id },
        });
        if (cardOwner) {
          userstatisticOwner.money += value.value;
          userstatistic.money -= value.value;
          await userstatisticOwner.save();
          await userstatistic.save();
          money.pay = user.name;
          money.haveMoney = gameusers[i].name;
        }
      }
    }
  }

  res.json({ card, cardBoardValue, isFree, money });
});

router.route('/cardbuy').post(async (req, res) => {
  const { boardid, userid, gamekey } = req.body;

  const game = await Game.findOne({ where: { key: gamekey } });

  const userInGame = await UserInGame.findOne({
    where: { userid, gameid: game.id },
  });

  const userstatistic = await GameStatistic.findOne({
    where: { uigid: userInGame.id },
  });

  const street = await Street.findOne({ where: { boardid } });

  const dohod = await Dohod.findOne({ where: { streetid: street.id } });

  userstatistic.money -= street.cost;

  await userstatistic.save();



  const [gameusers] = await sequelize.query(`
  select "Users".id, name,"GameStatistics".position, "GameStatistics".money,"GameStatistics".queue from "Users"
  join "UserInGames" on "Users".id = "UserInGames".userid
  join "Games" on "UserInGames".gameid = "Games".id
  join "GameStatistics" on "UserInGames".id = "GameStatistics".uigid
  where "Games".key = '${gamekey}'
   `);


  await Estate.create({
    streetid:street.id,
    gamestatisticid: userstatistic.id,
    dohodid: dohod.id,
  });

  myEmitter.emit(GET_CARD_USER_SOCKET, gameusers, street);
  res.sendStatus(200);
});

module.exports = router;
