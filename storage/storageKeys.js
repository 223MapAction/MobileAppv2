// Clés AsyncStorage utilisées à travers l'app. Valeurs inchangées par
// rapport à ce que chaque module déclarait localement avant centralisation —
// ne pas modifier une valeur ici, cela invaliderait les données déjà
// stockées sur les appareils des utilisateurs.

export const AUTH_USER_KEY = 'auth_user';
export const AUTH_TOKEN_KEY = 'auth_token';
export const TERMS_ACCEPTED_KEY = 'terms_accepted';
export const ONBOARDING_VIEWED_KEY = '@onboarding_viewed';

export const AGENT_KEY = '@MapAction:auth_agent';

export const OFFLINE_QUEUE_KEY = '@incident_offline_queue';
export const ANONYMOUS_HISTORY_KEY = '@incident_anonymous_history';
export const AGENT_OFFLINE_QUEUE_KEY = '@MapAction:agent_offline_queue';
