import messaging from '@react-native-firebase/messaging';
import { useRouter } from 'expo-router';
import * as Notifications from 'expo-notifications';
import { useEffect } from 'react';
import { Platform } from 'react-native';
import { registerFcmToken } from '../api/notificationsPush';
import { getAccessToken } from '../storage/authStorage';

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
 * connexion citoyen réussie (OTP ou Google), et au démarrage de l'app si
 * une session citoyen existe déjà. Silencieux en cas d'échec (permission
 * refusée, pas de session, etc.) — le push est best-effort, il ne doit
 * jamais bloquer un flux de connexion.
 */
export async function registerPushToken() {
  try {
    const accessToken = await getAccessToken();
    if (!accessToken) return;

    if (Platform.OS === 'android') {
      await Notifications.requestPermissionsAsync();
    } else {
      const { status } = await Notifications.requestPermissionsAsync();
      if (status !== 'granted') return;
    }

    const authStatus = await messaging().requestPermission();
    const enabled =
      authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
      authStatus === messaging.AuthorizationStatus.PROVISIONAL;
    if (!enabled) return;

    const fcmToken = await messaging().getToken();
    if (fcmToken) {
      await registerFcmToken(fcmToken);
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
    const unsubscribeOnMessage = messaging().onMessage(async (remoteMessage) => {
      await showForegroundNotification(remoteMessage);
    });

    const unsubscribeTokenRefresh = messaging().onTokenRefresh(async (newToken) => {
      const accessToken = await getAccessToken();
      if (accessToken) {
        await registerFcmToken(newToken);
      }
    });

    // Tap sur une notification alors que l'app tournait en arrière-plan
    const unsubscribeOpenedApp = messaging().onNotificationOpenedApp((remoteMessage) => {
      openIncidentFromMessage(router, remoteMessage);
    });

    // App ouverte directement depuis une notification (était fermée)
    messaging()
      .getInitialNotification()
      .then((remoteMessage) => {
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
