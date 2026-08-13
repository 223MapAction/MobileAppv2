import { useCallback, useState } from 'react';
import { read_user } from '../api/user';

// Contrôleur de profil partagé citoyen/agent. Injecte les points qui
// divergent réellement entre les deux rôles (source de session locale,
// récupération du token, stratégie de persistance locale, logging) plutôt
// que de les deviner.
export function useProfileController({ getLocalUser, getToken, persistUser, onError }) {
  const [user, setUser] = useState(null);
  const [isLoadingUser, setIsLoadingUser] = useState(true);
  const [editForm, setEditForm] = useState({ first_name: '', last_name: '', phone: '', email: '' });

  const populateEditForm = (u) => {
    setEditForm({
      first_name: u.first_name || '',
      last_name: u.last_name || '',
      phone: u.phone || '',
      email: u.email || '',
    });
  };

  const refreshProfile = useCallback(async () => {
    try {
      const localUser = await getLocalUser().catch(() => null);

      if (localUser) {
        const id = localUser?.id || localUser?.user_id || localUser?.user?.id;
        const token = await getToken().catch(() => null);

        if (id && token) {
          const freshUserData = await read_user(id, token).catch((e) => {
            onError?.(e);
            return null;
          });

          if (freshUserData) {
            await persistUser(freshUserData, localUser).catch(() => null);
            setUser(freshUserData);
            populateEditForm(freshUserData);
            return;
          }
        }
      }

      if (localUser) {
        setUser(localUser);
        populateEditForm(localUser);
      } else {
        setUser(null);
      }
    } catch (error) {
      onError?.(error);
    }
  }, [getLocalUser, getToken, persistUser, onError]);

  return { user, setUser, isLoadingUser, setIsLoadingUser, editForm, setEditForm, refreshProfile };
}
