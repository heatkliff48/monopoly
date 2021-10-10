
import styled from 'styled-components';
import { useDiceContext } from '../contexts/DiceContext';
import Player from './Player';

const CardBack = styled('div')`
  position: relative;
  box-sizing: content-box;
  width: ${(props) => (props.isCorner ? '100px' : '60px')};
  height: 100px;
  margin: 10px 0px;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  align-items: center;
  border: 1.5px solid black;
  margin: -1px;
  background-color: rgb(208, 252, 242); ;
`;
const CardHead = styled('div')`
  display: flex;
  justify-content: space-around;
  width: 100%;
  height: 20px;
  border-bottom: 1px solid black;
  background-color: ${(props) => props.mpColor};
`;

const CardText = styled('div')`
  display: flex;
  padding: 5px;
  font-size: 8pt;
  justify-content: center;
  padding: 10px;
  ${(props) => !props.mpColor && 'margin-top: 40%'};
`;

function Card({ name, mpColor, isCorner, cardId }) {
  const { userPosition, players } = useDiceContext();

  return (
    <>
      <CardBack isCorner={isCorner}>
        {players.map(
          (el) => userPosition[el.id - 1] === cardId && <Player id={el.id} />
        )}
        {mpColor && <CardHead mpColor={mpColor}></CardHead>}
        <CardText mpColor={mpColor}>{name}</CardText>
      </CardBack>
    </>
  );
}

export default Card;