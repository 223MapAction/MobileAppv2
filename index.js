import messaging from '@react-native-firebase/messaging';

// Doit être enregistré ici, hors de l'arbre React, avant que expo-router
// n'enregistre le composant racine — sinon les notifications reçues alors
// que l'app est tuée/en arrière-plan ne sont pas traitées côté natif.
messaging().setBackgroundMessageHandler(async () => {});

require('expo-router/entry');
