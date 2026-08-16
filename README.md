# NPC Mode - Real-World Multiplayer AI Scavenger Hunt

NPC Mode is a real-world multiplayer scavenger game where the physical environment is your board, your smartphone camera is the controller, and **Google Gemini AI** serves as the real-time referee.

---

## 📱 How to Build the Android APK (Flutter)

### Option 1: One-Click Cloud Build (GitHub Actions)
1. Push or export this repository to **GitHub**.
2. Navigate to the **Actions** tab in your repository.
3. The workflow `.github/workflows/build_apk.yml` runs automatically and generates **`npc-mode-release-apks.zip`**.
4. Download the zip and install the `.apk` on any Android smartphone.

### Option 2: Local Flutter CLI
```bash
cd flutter_app

# 1. Fetch Flutter packages
flutter pub get

# 2. Build release APK
flutter build apk --release

# The APK file will be located at:
# flutter_app/build/app/outputs/flutter-apk/app-release.apk
```

---

## 🐍 How to Run the Django Backend

```bash
cd django_backend

# 1. Create and activate virtualenv
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# 2. Install dependencies
pip install -r requirements.txt

# 3. Set your Gemini API Key
export GEMINI_API_KEY="your_api_key_here"

# 4. Run database migrations
python manage.py migrate

# 5. Start the server
python manage.py runserver 0.0.0.0:8000
```

### Docker Deployment:
```bash
cd django_backend
docker compose up --build
```

---

## 🗂️ Project Structure

```text
├── flutter_app/                     # Complete Flutter Mobile Application (Android / iOS)
│   ├── android/                     # AndroidManifest & Gradle configuration for APK
│   │   └── app/src/main/AndroidManifest.xml
│   ├── lib/
│   │   ├── main.dart                # App Entry Point & Dark Theme Setup
│   │   ├── models/game_models.dart  # Game Room, Player, Round, & Verdict Models
│   │   ├── services/api_service.dart# HTTP & Multipart Photo Upload Client
│   │   └── screens/                 # Full Screen Flow:
│   │       ├── home_screen.dart     # Host & Join Room Entry Screen
│   │       ├── lobby_screen.dart    # Real-time Waiting Room Lobby
│   │       ├── scavenger_camera_screen.dart # Viewfinder HUD, Live Timer, AI Verification
│   │       ├── round_leaderboard_screen.dart # In-Between Round Standings
│   │       └── game_over_screen.dart # Final Match Results & Winner Podium
│   └── pubspec.yaml                 # Dependencies (camera, http, google_fonts, etc.)
│
├── django_backend/                  # Django REST Framework Backend with Gemini AI
│   ├── npc_backend/                 # Project Settings, ASGI, WSGI & Root Routing
│   ├── game/
│   │   ├── models.py                # Room, Player, Round, and Submission Models
│   │   ├── serializers.py           # REST Framework Model Serializers
│   │   ├── gemini_judge.py          # Gemini 2.5 Flash Scavenger Item Evaluation Engine
│   │   ├── views.py                 # Room Creation, Join, Live Gameplay & Photo Submission
│   │   └── consumers.py             # Channels WebSocket Consumer for Live Sync
│   ├── Dockerfile                   # Production Docker Container
│   ├── docker-compose.yml           # Multi-container Deployment
│   └── requirements.txt             # Python Dependencies
│
└── .github/workflows/build_apk.yml  # Automated GitHub Action for building the APK
```
