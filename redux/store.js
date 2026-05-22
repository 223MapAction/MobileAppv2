import { configureStore } from '@reduxjs/toolkit';

// Un reducer temporaire si tu n'as pas encore créé le tien
const userReducer = (state = { user: null, token: null }, action) => {
  switch (action.type) {
    case 'LOGIN_SUCCESS':
      return { ...state, user: action.payload.user, token: action.payload.token };
    default:
      return state;
  }
};

export const store = configureStore({
  reducer: {
    user: userReducer,
  },
});