let unreadCount = 0;
const listeners = new Set();

/**
 * Compteur partagé du badge de notifications (citoyen + agent). Existe pour
 * permettre une mise à jour optimiste immédiate depuis
 * notificationsCitizenScrenn.js quand la liste vient d'être vue, sans
 * attendre qu'un nouveau fetch serveur reflète les PATCH is_read envoyés en
 * arrière-plan (qui n'ont souvent pas encore fini quand l'utilisateur
 * revient sur l'onglet).
 */
export function setUnreadCount(count) {
  unreadCount = count;
  listeners.forEach((listener) => listener(unreadCount));
}

export function getUnreadCount() {
  return unreadCount;
}

export function subscribeUnreadCount(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
