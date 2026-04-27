import { ApiUrl } from './apiUrl';

const apiEndPoint = ApiUrl + "/MapApi";

function makeid(length) {
    let result = '';
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (let i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
}

export const envoyerIncident = async (payload) => {
  try {
    let formdata = new FormData();
    // On extrait photo, audio ET video du payload
    const { photo, audio, video, ...data } = payload;

    // Traitement de la Photo
    if (photo) {
      let parts = photo.split("/");
      let extension = parts[parts.length - 1].split(".").pop();
      formdata.append("photo", {
        uri: photo,
        name: `${makeid(60)}.${extension}`,
        type: "multipart/form-data",
      });
    }

    // Traitement de l'Audio
    if (audio) {
       let aParts = audio.split("/");
       let aExtension = aParts[aParts.length - 1].split(".").pop();
       formdata.append("audio", {
         uri: audio,
         name: `${makeid(60)}.${aExtension}`,
         type: "multipart/form-data",
       });
    }

    // Traitement de la Vidéo
    if (video) {
       let vParts = video.split("/");
       let vExtension = vParts[vParts.length - 1].split(".").pop();
       formdata.append("video", {
         uri: video,
         name: `${makeid(60)}.${vExtension}`,
         type: "multipart/form-data", 
       });
    }

    
    Object.keys(data).forEach((k) => {
      if (data[k] !== null && data[k] !== undefined) {
        formdata.append(k, data[k]);
      }
    });

    const response = await fetch(`${apiEndPoint}/incident/`, {
      method: 'POST',
      body: formdata,
      headers: {
        'Accept': 'application/json',
      },
    });

    const responseText = await response.text();

    if (response.status === 201 || response.status === 200) {
      return { ok: true, data: JSON.parse(responseText) };
    } else {
      // console.log("Erreur Serveur Brut:", responseText);
      return { ok: false, error: responseText, status: response.status };
    }
  } catch (error) {
    // console.error("Erreur lors de l'envoi de l'incident:", error);
    return { ok: false, error };
  }
};