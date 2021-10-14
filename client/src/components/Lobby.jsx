import { useContext, useEffect, useState, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams } from 'react-router';
import styled from 'styled-components';
import { useDiceContext } from '../contexts/DiceContext';
import { getAllUsers } from '../redux/actions/AllUsersActions';
import { startGame } from '../redux/actions/gameActions';
import { getGameUsers } from '../redux/actions/gameUsersActions';
import { Button } from './atoms/Button';
import GamePlayersList from './GamePlayersList';
import { useHistory } from 'react-router';
import { createSocketOnMessage } from '../utils/socket.message';

export const Lobby = () => {
  const { showAddUsers, setShowAddUsers, currentKey, setCurrentKey } =
    useDiceContext();

  const dispatch = useDispatch();
  const history = useHistory();
  const params = useParams();

  const user = useSelector((state) => state.user);
  const games = useSelector((state) => state.games);

  const gameUsers = useSelector((state) => state.gameUsers);

  

  useEffect(() => {
    setCurrentKey(params.id);
    dispatch(getGameUsers(params.id));
  }, []);

  
  const currGame = games.find((el) => el.key === params.id);
  if (currGame?.inprocess === true) history.push(`/game/${params.id}`);

  const addUsersHandler = () => {
    dispatch(getAllUsers(user.id, currentKey));
    setShowAddUsers(!showAddUsers);
  };
  const startGamehandler = () => {
    dispatch(startGame(params.id));
    history.push(`/game/${params.id}`);
  };
  return (
    <LobbyWrapper>
      <GroupDiv>
        <CloseButton onClick={() => history.push('/home')}>close</CloseButton>
        <GamePlayersList players={gameUsers} />
        <p>waiting for other players...</p>
        <Button text={'add Players'} onClick={() => addUsersHandler()}></Button>
      </GroupDiv>
      <div>
        <Button text={'Start Game'} onClick={() => startGamehandler()} />
      </div>
    </LobbyWrapper>
  );
};

const LobbyWrapper = styled.div`
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: space-evenly;
  align-items: center;
  padding: 40px;
  border: 3px solid black;
  background-color: white;
  width: 50%;
  height: 500px;boardid
  border-radius: 10px;
`;

const GroupDiv = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: space-evenly;
  align-items: center;
`;

const CloseButton = styled.div`
  position: absolute;
  top: 10px;
  right: 20px;
  cursor: pointer;
  background-color: rgba(168, 168, 168, 0.514);
  border-radius: 5px;
  padding: 3px;
  &:hover {
    background-color: rgba(168, 168, 168, 0.8);
  }
`;
