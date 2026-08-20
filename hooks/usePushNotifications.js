import {
  AuthorizationStatus,
  getInitialNotification,
  getMessaging,
  getToken,
  onMessage,
  onNotificationOpenedApp,
  onTokenRefresh,
  requestPermission,
} from '@react-native-firebase/messaging';
import { useRouter } from 'expo-router';
import * as Notifications from 'expo-notifications';
import { useEffect } from 'react';
import { Platform } from 'react-native';
import { registerFcmToken } from '../api/notificationsPush';
import { getAccessToken } from '../storage/authStorage';
import { getAuthToken as getAgentAccessToken } from '../storage/authStorageAgent';

// Résout le token de la session active, citoyen ou agent de terrain — les
// deux stockages sont séparés (storage/authStorage.js vs
// storage/authStorageAgent.js), donc on tente les deux plutôt que de
// dupliquer toute la logique d'enregistrement par rôle. Exporté car
// réutilisé aussi par l'écran de notifications (api/notificationCitizen.js).
export async function getActiveAccessToken() {
  const citizenToken = await getAccessToken();
  if (citizenToken) return citizenToken;
  return getAgentAccessToken();
}

// Affiche les notifications reçues alors que l'app est au premier plan
// (sinon expo-notifications les ignore silencieusement par défaut).
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

/**
 * Demande la permission de notification, récupère le token FCM natif de
 * l'appareil et l'enregistre auprès du backend. À appeler juste après une
 * connexion réussie (citoyen OTP/Google, ou agent de terrain), et au
 * démarrage de l'app si une session existe déjà. Silencieux en cas d'échec
 * (permission refusée, pas de session, etc.) — le push est best-effort, il
 * ne doit jamais bloquer un flux de connexion.
 *
 * API modulaire (getMessaging()/onMessage()/...) — @react-native-firebase
 * v26 n'a plus d'export par défaut "namespaced" (messaging()), qui était la
 * cause de l'erreur "messaging.default is not a function".
 */
export async function registerPushToken() {
  try {
    const accessToken = await getActiveAccessToken();
    if (!accessToken) return;

    if (Platform.OS === 'android') {
      await Notifications.requestPermissionsAsync();
    } else {
      const { status } = await Notifications.requestPermissionsAsync();
      if (status !== 'granted') return;
    }

    const messagingInstance = getMessaging();
    const authStatus = await requestPermission(messagingInstance);
    const enabled =
      authStatus === AuthorizationStatus.AUTHORIZED ||
      authStatus === AuthorizationStatus.PROVISIONAL;
    if (!enabled) return;

    const fcmToken = await getToken(messagingInstance);
    if (fcmToken) {
      await registerFcmToken(fcmToken, accessToken);
    }
  } catch (error) {
    console.log('[Push] Enregistrement du token FCM impossible :', error);
  }
}

// Affiche localement une notification reçue pendant que l'app est au
// premier plan (RNFirebase ne l'affiche pas tout seul dans ce cas).
async function showForegroundNotification(remoteMessage) {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: remoteMessage.notification?.title || 'Map Action',
      body: remoteMessage.notification?.body || '',
      data: remoteMessage.data || {},
    },
    trigger: null,
  });
}

function openIncidentFromMessage(router, remoteMessage) {
  const incidentId = remoteMessage?.data?.incident_id;
  if (incidentId) {
    router.push({ pathname: '/DetailIncidentScreen', params: { id: incidentId } });
  }
}

/**
 * Écoute les événements de notification push tout au long de la vie de
 * l'app : réception au premier plan (affichage local), rafraîchissement du
 * token, et tap sur une notification (deep-link vers l'incident concerné).
 * À monter une seule fois, à la racine (app/_layout.js).
 */
export function usePushNotificationListeners() {
  const router = useRouter();

  useEffect(() => {
    const messagingInstance = getMessaging();

    const unsubscribeOnMessage = onMessage(messagingInstance, async (remoteMessage) => {
      await showForegroundNotification(remoteMessage);
    });

    const unsubscribeTokenRefresh = onTokenRefresh(messagingInstance, async (newToken) => {
      const accessToken = await getActiveAccessToken();
      if (accessToken) {
        await registerFcmToken(newToken, accessToken);
      }
    });

    // Tap sur une notification alors que l'app tournait en arrière-plan
    const unsubscribeOpenedApp = onNotificationOpenedApp(messagingInstance, (remoteMessage) => {
      openIncidentFromMessage(router, remoteMessage);
    });

    // App ouverte directement depuis une notification (était fermée)
    getInitialNotification(messagingInstance).then((remoteMessage) => {
      if (remoteMessage) openIncidentFromMessage(router, remoteMessage);
    });

    // Tap sur la notification locale affichée quand l'app était au premier plan
    const responseSub = Notifications.addNotificationResponseReceivedListener((response) => {
      const incidentId = response.notification.request.content.data?.incident_id;
      if (incidentId) {
        router.push({ pathname: '/DetailIncidentScreen', params: { id: incidentId } });
      }
    });

    return () => {
      unsubscribeOnMessage();
      unsubscribeTokenRefresh();
      unsubscribeOpenedApp();
      responseSub.remove();
    };
  }, []);
}
