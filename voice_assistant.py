import json
import time
import random
import re
from datetime import datetime

# Initialize device states with room-based structure
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

# Activity log
activity_log = []

def broadcast(message):
    """Broadcast a message to all connected clients"""
    print(f"Broadcast: {message}")

def process_command(command):
    """Process voice commands with improved room and device recognition"""
    command = command.lower().strip()
    
    # Define room and device mappings for fuzzy matching
    room_mappings = {
        'kitchen': 'kitchen',
        'living room': 'living-room',
        'livingroom': 'living-room',
        'bedroom': 'bedroom',
        'bed room': 'bedroom',
        'bathroom': 'bathroom',
        'bath room': 'bathroom'
    }
    
    device_mappings = {
        'light': 'lights',
        'lights': 'lights',
        'lamp': 'lights',
        'lamps': 'lights',
        'fan': 'fan',
        'fans': 'fan',
        'air conditioning': 'ac',
        'ac': 'ac',
        'air conditioner': 'ac',
        'thermostat': 'ac',
        'temperature': 'ac',
        'heat': 'ac',
        'cooling': 'ac',
        'tv': 'tv',
        'television': 'tv',
        'heater': 'heater'
    }
    
    # Extract room and device from command
    room = None
    device = None
    
    # Find room in command
    for room_name, room_id in room_mappings.items():
        if room_name in command:
            room = room_id
            break
    
    # Find device in command
    for device_name, device_id in device_mappings.items():
        if device_name in command:
            device = device_id
            break
    
    # Process the command based on extracted room and device
    if room and device:
        device_id = f"{room}-{device}"
        
        if device_id in device_states:
            if 'turn on' in command or 'switch on' in command or 'activate' in command:
                device_states[device_id]['value'] = True
                log_activity(f"{room.replace('-', ' ').title()} {device.title()} turned ON", 'voice')
                return f"Turned on {device} in {room.replace('-', ' ')}"
            elif 'turn off' in command or 'switch off' in command or 'deactivate' in command:
                device_states[device_id]['value'] = False
                log_activity(f"{room.replace('-', ' ').title()} {device.title()} turned OFF", 'voice')
                return f"Turned off {device} in {room.replace('-', ' ')}"
            elif 'set temperature' in command or 'set to' in command:
                try:
                    # Extract temperature value using regex
                    temp_match = re.search(r'(\d+)\s*(?:degrees?|c|celcius|fahrenheit)?', command)
                    if temp_match:
                        temp = int(temp_match.group(1))
                        if 15 <= temp <= 30:
                            device_states[device_id]['temperature'] = temp
                            device_states[device_id]['value'] = True
                            log_activity(f"{room.replace('-', ' ').title()} {device.title()} temperature set to {temp}°C", 'voice')
                            return f"Set {device} temperature to {temp}°C in {room.replace('-', ' ')}"
                except ValueError:
                    pass
    
    # Handle list commands
    if 'list devices' in command:
        devices = [f"{room.replace('-', ' ').title()} {device.title()}" for room, device in [key.split('-') for key in device_states.keys()]]
        return f"Available devices: {', '.join(devices)}"
    elif 'list rooms' in command:
        rooms = list(set([room.replace('-', ' ').title() for room, _ in [key.split('-') for key in device_states.keys()]]))
        return f"Available rooms: {', '.join(rooms)}"
    
    return "Command not recognized"

def listen_command():
    """Listen for voice commands"""
    # This is a placeholder for actual voice recognition
    # In a real implementation, this would use a speech recognition library
    return None

def speak(text):
    """Speak the given text"""
    # This is a placeholder for text-to-speech
    # In a real implementation, this would use a TTS library
    print(f"Assistant: {text}")

def log_activity(message, source='system'):
    """Log an activity with timestamp"""
    activity = {
        'message': message,
        'source': source,
        'timestamp': datetime.now().isoformat()
    }
    activity_log.append(activity)
    if len(activity_log) > 50:  # Keep only last 50 activities
        activity_log.pop(0)
    return activity