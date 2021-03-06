import axios from 'axios';
import { START_GAME_SOCKET } from '../../constants/socket';
import {
  ADD_USER_TO_GAME,
  CREATE_GAME,
  FIND_GAMES,
  FIND_USER_GAMES,
  NEXT_TURN,
  START_GAME,
} from '../types/gameTypes';

export const addGame = (owner) => {
  return {
    type: CREATE_GAME,
    payload: owner,
  };
};

export const getGames = (action) => {
  return {
    type: FIND_GAMES,
    payload: action,
  };
};
export const getUserGames = (userId) => {
  return {
    type: FIND_USER_GAMES,
    payload: userId,
  };
};
export const addUserToGame = (gameid, userid) => async (dispatch) => {
  await axios.post('http://localhost:3001/game/userInGame', { gameid, userid });
  dispatch({
    type: ADD_USER_TO_GAME,
  });
};
export const startGame = (key) => async (dispatch) => {
  await axios.post('http://localhost:3001/game/start', { key });

  dispatch({
    type: START_GAME,
  });
};
export const nextTurn = (key) => async (dispatch) => {
  await axios.post('http://localhost:3001/game/nextturn', { key });

  dispatch({
    type: NEXT_TURN,
  });
};

