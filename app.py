from flask import Flask, render_template, request, jsonify
from flask_socketio import SocketIO, emit
import threading
import json
import os
from werkzeug.utils import secure_filename
from datetime import datetime
import re

app = Flask(__name__)
app.config['SECRET_KEY'] = 'secret!'
app.config['UPLOAD_FOLDER'] = 'uploads'
socketio = SocketIO(app, cors_allowed_origins="*")

# Create uploads directory if it doesn't exist
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

# Store device states
device_states = {
    'kitchen-lights': {'value': False, 'type': 'toggle'},
    'kitchen-fan': {'value': False, 'type': 'toggle'},
    'kitchen-ac': {'value': False, 'type': 'toggle', 'temperature': 24},
    'living-room-lights': {'value': False, 'type': 'toggle'},
    'living-room-fan': {'value': False, 'type': 'toggle'},
    'living-room-ac': {'value': False, 'type': 'toggle', 'temperature': 24},
    'bedroom-lights': {'value': False, 'type': 'toggle'},
    'bedroom-fan': {'value': False, 'type': 'toggle'},
    'bedroom-ac': {'value': False, 'type': 'toggle', 'temperature': 24},
    'bathroom-lights': {'value': False, 'type': 'toggle'},
    'bathroom-fan': {'value': False, 'type': 'toggle'},
    'bathroom-ac': {'value': False, 'type': 'toggle', 'temperature': 24}
}

# Store recent activity
activity_log = []

# Import the voice assistant module
from voice_assistant import device_states, broadcast, process_command, listen_command, speak, activity_log, log_activity

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/process_audio', methods=['POST'])
def process_audio():
    # For now, we'll simulate voice command processing
    # In a real app, this would process the audio file
    command = "turn on lights"  # Simulated command
    return jsonify({'command': command})

# WebSocket events
@socketio.on('connect')
def handle_connect():
    print('Client connected')
    # Send current device states to the newly connected client
    emit('device_states', device_states)
    # Send recent activity
    for activity in activity_log[-10:]:
        emit('activity_log', activity)

@socketio.on('disconnect')
def handle_disconnect():
    print('Client disconnected')

@socketio.on('device_update')
def handle_device_update(data):
    device_id = f"{data['room']}-{data['device']}"
    
    if device_id in device_states:
        if 'type' in data and data['type'] == 'temperature':
            device_states[device_id]['temperature'] = data['value']
        else:
            device_states[device_id]['value'] = data['value']
        
        # Create activity log entry
        activity = log_activity(
            f"{data['room'].title()} {data['device'].title()} {'temperature set to ' + str(data['value']) + '°C' if 'type' in data and data['type'] == 'temperature' else 'turned ' + ('ON' if data['value'] else 'OFF')}",
            'manual'
        )
        
        # Broadcast the update to all clients
        emit('device_update', {
            'device': device_id,
            'room': data['room'],
            'value': data['value'],
            'type': data.get('type', 'toggle')
        }, broadcast=True)
        
        # Broadcast the activity
        emit('activity_log', activity, broadcast=True)

@socketio.on('voice_command')
def handle_voice_command(data):
    command = data['command'].lower()
    
    # Process the command using the voice assistant module
    response = process_command(command)
    
    # Broadcast the response to all clients
    emit('voice_response', {'response': response}, broadcast=True)
    
    # If the command was processed successfully, the device states will be updated
    # and the activity log will be updated by the process_command function

def run_voice_assistant():
    """Run the voice assistant in a separate thread"""
    print("Home automation system ready")
    # We'll skip the actual voice assistant for now
    pass

if __name__ == "__main__":
    # Start voice assistant in a separate thread
    voice_thread = threading.Thread(target=run_voice_assistant, daemon=True)
    voice_thread.start()
    
    try:
        # Start the Flask app with SocketIO
        socketio.run(app, debug=True, host='127.0.0.1', port=8080)
    except OSError as e:
        if e.errno == 98 or e.errno == 10048:  # Address already in use
            print("Port 8080 is already in use. Trying port 8081...")
            socketio.run(app, host='127.0.0.1', port=8081, debug=True)
        else:
            raise e