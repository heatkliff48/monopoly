import { BUY_CARD } from '../types/cardTypes';

export const currentUserCardsReducer = (state = {}, action) => {
  const { type, payload } = action;
  switch (type) {
    
    case BUY_CARD: {
      return payload;
    }
    default:
      return state;
  }
};
