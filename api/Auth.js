import { ApiUrl } from './apiUrl';

const apiEndPoint = ApiUrl + "/MapApi";

/**
 * Envoie une demande d'OTP au serveur
 * @param {string} phoneNumber - Le numéro au format +223XXXXXXXX
 */
export const requestOtp = async (phoneNumber) => {
  try {
    const response = await fetch(`${apiEndPoint}/verify_otp/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        phone_number: phoneNumber, // Assure-toi que la clé correspond à ce qu'attend ton lead (souvent phone_number ou tel)
      }),
    });

    const data = await response.json();

    if (response.status === 201 || response.status === 200) {
      return { ok: true, data: data };
    } else {
      console.log("Erreur API OTP:", data);
      return { ok: false, error: data, status: response.status };
    }
  } catch (error) {
    console.error("Erreur réseau lors de l'OTP:", error);
    return { ok: false, error: error.message };
  }
};

/**
 * Vérifie le code OTP saisi par l'utilisateur
 * @param {string} phoneNumber 
 * @param {string} code 
 */
export const verifyOtpCode = async (phoneNumber, code) => {
  try {
    const response = await fetch(`${apiEndPoint}/verify_otp/`, { // Ajuste l'URL selon ton backend
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        phone_number: phoneNumber,
        otp_code: code,
      }),
    });

    const data = await response.json();

    if (response.ok) {
      return { ok: true, data: data };
    } else {
      return { ok: false, error: data };
    }
  } catch (error) {
    console.error("Erreur validation OTP:", error);
    return { ok: false, error: error.message };
  }
};