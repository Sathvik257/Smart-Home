# NexusHome Voice-Controlled Home Automation

A comprehensive home automation system with voice control capabilities, featuring a Python voice assistant integrated with a modern web interface.

## Features

- **Voice Control**: Control your home devices using natural language commands
- **Real-time UI Updates**: Visual feedback when devices change state
- **Multiple Device Types**: Control lights, thermostat, security, fan, TV, music, and curtains
- **Scene Support**: Pre-configured scenes like "Good Morning", "Good Night", "Leave Home", and "Entertainment"
- **Activity Feed**: Track all device changes and voice commands
- **Responsive Design**: Works on desktop and mobile devices

## Voice Commands

The system recognizes the following voice commands:

### Device Control
- "Turn on the lights"
- "Turn off the fan"
- "Set temperature to 22"
- "Arm the security system"
- "Open the curtains"
- "Turn on the TV"
- "Play some music"

### Scenes
- "Good morning"
- "Good night"
- "Leave home"
- "Entertainment mode"

## Setup Instructions

### Prerequisites
- Python 3.7+
- Flask
- Flask-SocketIO
- SpeechRecognition
- pyttsx3
- simple-websocket

### Installation

1. Clone this repository:
   ```
   git clone https://github.com/yourusername/nexushome.git
   cd nexushome
   ```

2. Create a virtual environment and activate it:
   ```
   python -m venv .venv
   # On Windows
   .venv\Scripts\activate
   # On macOS/Linux
   source .venv/bin/activate
   ```

3. Install the required packages:
   ```
   pip install flask flask-socketio speechrecognition pyttsx3 simple-websocket
   ```

4. Run the application:
   ```
   python app.py
   ```

5. Open your browser and navigate to:
   ```
   http://localhost:5000
   ```

## Usage

1. Click the microphone icon in the bottom-right corner to activate voice recognition
2. Speak a command (e.g., "Turn on the lights")
3. The system will process your command and update the UI accordingly
4. The activity feed will show your command and the resulting action

## Architecture

The system consists of three main components:

1. **Voice Assistant (Python)**: Handles speech recognition and command processing
2. **Web Server (Flask)**: Serves the web interface and manages WebSocket connections
3. **Web Interface (HTML/JS)**: Provides a user-friendly dashboard with real-time updates

## Customization

### Adding New Devices

To add a new device type:

1. Update the `device_states` dictionary in `voice_assistant.py`
2. Add command patterns in the `process_command` function
3. Add a new card in `index.html`
4. Update the JavaScript to handle the new device type

### Adding New Scenes

To add a new scene:

1. Add a new scene pattern in the `process_command` function
2. Define the scene actions in the `handle_scene` function
3. Add a new button in the Quick Actions section of `index.html`

## Troubleshooting

- **Microphone not working**: Ensure your microphone is properly connected and has the necessary permissions
- **Voice recognition issues**: Check your internet connection as the system uses Google's speech recognition service
- **WebSocket connection errors**: Make sure the Flask server is running and accessible

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Speech recognition powered by Google Speech Recognition API
- Icons provided by Font Awesome
- UI design inspired by modern home automation systems 