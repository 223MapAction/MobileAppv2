// 
import constants from "./constantes";

export function onLogin(payload) {
  return {
    type: constants.LOGIN,
    payload,
  };
}
export function onGetUsers(users) {
  return { type: constants.LIST, users };
}

export function onLogout() {
  return { type: constants.LOGOUT };
}
