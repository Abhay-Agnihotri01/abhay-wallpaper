# AuraCanvas - AI Wallpaper Engine & Android App

AuraCanvas is an automated wallpaper manager web & native Android solution featuring automatic cache cleanup, configurable rotation intervals, Unsplash integration, and simulated Android background constraints.

---

## 📱 How to Download the Android APK from GitHub

You **do NOT need to install Android Studio or setup complex app development environments** on your local machine! 

This repository is configured with **GitHub Actions**. Whenever you push or upload this code to GitHub, GitHub automatically builds the Android `.apk` file for you in the cloud.

### 🚀 Step 1: Upload / Push this Repository to GitHub

If you haven't uploaded this repository to GitHub yet:

1. Open your terminal in this project directory.
2. Run the following commands:
```bash
git init
git add .
git commit -m "Configure automated GitHub Actions APK build"
git branch -M main
git remote add origin https://github.com/YOUR_GITHUB_USERNAME/YOUR_REPOSITORY_NAME.git
git push -u origin main
```

*(Replace `YOUR_GITHUB_USERNAME` and `YOUR_REPOSITORY_NAME` with your GitHub profile and repository details).*

---

### 📦 Step 2: Download the APK from GitHub Actions

1. Go to your repository page on [GitHub](https://github.com).
2. Click on the **Actions** tab at the top of the repository.
3. Under **All workflows**, click on the latest workflow run named **Build Android APK** (or **Build & Package Android APK**).
4. Once the build finishes (you will see a green checkmark `✓`), scroll down to the bottom of the page to the **Artifacts** section.
5. Click on **`AuraCanvas-APK-Debug`**.
6. GitHub will download a `.zip` file containing your **`app-debug.apk`**!
7. Extract the ZIP file and transfer `app-debug.apk` to your Android phone (or open it directly on your phone) to install the app.

---

## 🛠 Project Structure

```
├── .github/
│   └── workflows/
│       └── build-apk.yml     # GitHub Actions cloud APK builder script
├── capacitor.config.json     # Capacitor native packaging settings
├── package.json              # Dependencies & build scripts
├── src/
│   ├── components/           # React UI & Phone Simulator
│   ├── services/             # Wallpaper Engine & Unsplash API
│   └── types/                # TypeScript interfaces
└── vite.config.ts            # Vite bundler setup
```

---

## 🌐 Local Web Development

To run the web simulator locally:

```bash
npm install
npm run dev
```

Open `http://localhost:3000` in your browser.
