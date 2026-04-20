[![forthebadge](https://forthebadge.com/images/badges/made-with-javascript.svg)](https://forthebadge.com)
# Map Action Mobile App

🚀 **Map Action Mobile** 
 is an application used by citizens to report incidents. Users can capture a photo of the incident and, if they wish, provide a title, description, a 5-second video, and an audio recording. Geolocation is enabled in real-time.

Upon reporting, our AI-powered prediction model is immediately activated to detect the type of incident, its potential impact, context, and possible solutions for resolution.

Citizens can track the progress of their reported incidents through the mobile app

## 📚 Developer Documentation

Access the complete project documentation here: [Developer Documentation](https://223mapaction.github.io/Map-Action-Mobile-App/)

---

## ⚙️ Tech Stack

This app leverages a modern tech stack for performance and efficiency:

- **React Native** for mobile app development.
- **Expo** for managing native features easily.
- **Django REST Framework** for backend APIs.
- **PostgreSQL** as the database.

![Tech Stack](https://github.com/223MapAction/Map-Action-Mobile-App/assets/64170643/7c9ecee1-e40f-4549-9877-444187df5e69)

---

## 🌍 How It Works

1. **Incident Capture:** Take a photo of the incident directly from the app.
2. **Add Content:** Add a voice note to describe the situation and attach an explanatory video.
3. **Automatic Geolocation:** Incidents are geolocated automatically for precise documentation.
4. **Collaboration:** Multiple users or organizations can collaborate on the same incident.

![How It Works](https://github.com/223MapAction/Map-Action-Mobile-App/assets/64170643/d532162c-1800-4e63-9855-e389fe5d0fed)

---

## 🛠️ Requirements

Before getting started, make sure you have the following:

- **Node.js v18** or later (use `nvm` to manage Node.js versions).
- **Expo CLI** for handling native features.

---

## ⚡ Installation & Setup

### 1. Clone the project:
```bash
git clone https://github.com/223MapAction/Map-Action-Mobile-App.git
```
### 2. Install dependencies:

- **Using npm:**
```bash
npm install
```

- **Using Yarn/Expo:**
```bash
yarn upgrade
# or
npx expo install
```
### 3. Install dependencies:
Ensure you have your <code>.env</code> files set up correctly to manage API keys and environment variables.

## 🚀 Running the Development Server
#### Android or iOS:
- **Using npm:**
```bash
npm run android
npm run ios
```
- **Using expo:**
```bash
npx expo start
# or
npx expo run:android
# or
npx expo run:ios
```
---

## 🛠️ Recommended Editor & Settings
We recommend using **Visual Studio Code** with the following extensions:

- ESLint for real-time code analysis.
- Prettier for automatic code formatting
---

## License

This project is licensed under the GNU General Public License v3.0 - see the [LICENSE](LICENSE) file for details.

--- 

## Contribute to the project

Map Action is an open source project. Fell free to fork the source and contribute with your features. Please follow our [contribution guidelines](CONTRIBUTING.md).

