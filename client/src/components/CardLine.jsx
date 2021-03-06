import styled from 'styled-components';
import Card from './Card';

const POSITION_FACTORS = {
  down: 'none',
  left: 'rotate(90deg)',
  up: 'rotate(180deg)',
  right: 'rotate(-90deg)',
};

const Wrapper = styled('div')`
  display: flex;
  flex-direction: row-reverse;
  border-left: 1px solid black;
  -webkit-transform: ${(prop) => POSITION_FACTORS[prop.position]};
`;

function CardLine({ position, db }) {
  return (
    <>
      <Wrapper position={position}>
        {db?.map((el) => (
          <Card
            key={el.id}
            name={el.name}
            color={el.color}
            isCorner={el.corner}
            cardId={el.boardid}
            special={el.special}
          ></Card>
        ))}
      </Wrapper>
    </>
  );
}

export default CardLine;
