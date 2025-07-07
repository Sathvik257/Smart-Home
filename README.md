# 🏠 NexusHome – Voice-Controlled Home Automation

**NexusHome** is a comprehensive smart home automation system that enables users to control various home devices using natural voice commands. It features a Python-powered voice assistant integrated with a sleek and responsive web interface built using Flask and WebSockets for real-time communication.

---

## 🚀 Features

- 🎙️ **Voice Control**: Use natural language commands to control devices.
- 🖥️ **Real-Time UI Updates**: Visual feedback for each device action.
- 💡 **Multi-Device Support**: Control lights, thermostat, fan, TV, music, curtains, and security.
- 🧠 **Scenes Support**: Predefined scenarios like:
  - *Good Morning*
  - *Good Night*
  - *Leave Home*
  - *Entertainment Mode*
- 📜 **Activity Feed**: Logs all commands and actions.
- 📱 **Responsive Design**: Works seamlessly on desktops and mobile devices.

---

## 🗣️ Sample Voice Commands

### 📟 Device Control
- "Turn on the lights"  
- "Turn off the fan"  
- "Set temperature to 22"  
- "Arm the security system"  
- "Open the curtains"  
- "Turn on the TV"  
- "Play some music"

### 🎬 Scenes
- "Good morning"  
- "Good night"  
- "Leave home"  
- "Entertainment mode"

---

## ⚙️ Setup Instructions

### ✅ Prerequisites

Ensure you have the following installed:
- Python 3.7+
- `pip` package manager

### 📦 Required Python Packages
- `Flask`
- `Flask-SocketIO`
- `SpeechRecognition`
- `pyttsx3`
- `simple-websocket`
  
---
###🧩 Troubleshooting
Issue	Solution
🎤 Microphone not working	Check hardware connection and browser permissions
🛑 Voice not recognized	Ensure internet is stable (uses Google Speech API)
🔌 WebSocket issues	Confirm Flask server is running at http://localhost:5000

📄 License
This project is licensed under the MIT License.
See the LICENSE file for more information.

🙏 Acknowledgments
🎤 Speech recognition powered by Google Speech Recognition API

🎨 Icons provided by Font Awesome

💡 UI inspired by modern smart home dashboard designs

### 🧪 Installation Steps

```bash
# Clone the repository
git clone https://github.com/Sathvik257/Smart-Home.git
cd Smart-Home

# Create and activate virtual environment
python -m venv .venv

# On Windows
.venv\Scripts\activate

# On macOS/Linux
source .venv/bin/activate

# Install dependencies
pip install flask flask-socketio speechrecognition pyttsx3 simple-websocket

# Run the application
python app.py

Now open your browser and visit:
🌐 http://localhost:5000

🧠 Usage Guide
Click the microphone icon in the bottom-right corner.

Speak a command like: 🗣️ "Turn off the fan"

The system will:

Process the command

Update the device state visually

Log the action in the activity feed

🧱 System Architecture
Component	Description
🧠 Voice Assistant	Handles voice recognition and NLP (Python + SpeechRecognition)
🌐 Web Server	Flask-based backend with WebSocket support
🎨 Web Interface	HTML/CSS/JS dashboard with real-time feedback

🛠️ Customization
➕ Adding New Devices
Update the device_states dictionary in voice_assistant.py

Add command patterns in process_command()

Add a new card in index.html

Update the JavaScript logic to handle state changes

🎭 Adding New Scenes
Add scene keywords in process_command()

Define actions in handle_scene()

Add a new button under Quick Actions in index.html




