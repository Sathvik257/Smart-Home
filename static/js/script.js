// Voice Command Handling
let recognition = null;
let isListening = false;

function initializeVoiceRecognition() {
    if ('webkitSpeechRecognition' in window) {
        recognition = new webkitSpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';

        recognition.onstart = () => {
            isListening = true;
            updateVoiceUI();
        };

        recognition.onend = () => {
            isListening = false;
            updateVoiceUI();
        };

        recognition.onresult = (event) => {
            const transcript = Array.from(event.results)
                .map(result => result[0].transcript)
                .join('');

            processVoiceCommand(transcript.toLowerCase());
        };

        recognition.onerror = (event) => {
            console.error('Voice recognition error:', event.error);
            updateVoiceStatus(`Error: ${event.error}`);
        };
    } else {
        updateVoiceStatus('Voice recognition not supported in this browser');
    }
}

function toggleVoiceRecognition() {
    if (!recognition) {
        initializeVoiceRecognition();
    }

    if (isListening) {
        recognition.stop();
    } else {
        recognition.start();
    }
}

function updateVoiceUI() {
    const voiceBtn = document.querySelector('.voice-btn');
    const voiceStatus = document.querySelector('.voice-status');

    if (isListening) {
        voiceBtn.classList.add('listening');
        voiceBtn.innerHTML = '<i class="fas fa-microphone"></i> Stop Listening';
        voiceStatus.textContent = 'Listening...';
    } else {
        voiceBtn.classList.remove('listening');
        voiceBtn.innerHTML = '<i class="fas fa-microphone"></i> Start Voice Control';
        voiceStatus.textContent = 'Voice recognition ready';
    }
}

function processVoiceCommand(command) {
    console.log('Processing voice command:', command);

    // Turn on device
    if (command.includes('turn on')) {
        const deviceName = command.replace('turn on', '').trim();
        const device = findDeviceByName(deviceName);
        if (device) {
            toggleDevice(device.id);
        }
    }
    // Turn off device
    else if (command.includes('turn off')) {
        const deviceName = command.replace('turn off', '').trim();
        const device = findDeviceByName(deviceName);
        if (device) {
            toggleDevice(device.id);
        }
    }
    // List devices
    else if (command.includes('list devices')) {
        const devices = document.querySelectorAll('.device-card');
        let deviceList = 'Available devices: ';
        devices.forEach(device => {
            deviceList += device.querySelector('h3').textContent + ', ';
        });
        updateVoiceStatus(deviceList.slice(0, -2));
    }
}

function findDeviceByName(name) {
    const devices = document.querySelectorAll('.device-card');
    for (const device of devices) {
        const deviceName = device.querySelector('h3').textContent.toLowerCase();
        if (deviceName.includes(name.toLowerCase())) {
            return {
                id: device.dataset.deviceId,
                name: deviceName
            };
        }
    }
    return null;
}

function toggleDevice(deviceName, state) {
    // Find the device button by name
    const deviceButtons = document.querySelectorAll('.device-btn');
    for (const button of deviceButtons) {
        if (button.textContent.toLowerCase().includes(deviceName.toLowerCase())) {
            button.click();
            updateVoiceStatus(`${state ? 'Turning on' : 'Turning off'} ${deviceName}`);
            return;
        }
    }
    updateVoiceStatus(`Device "${deviceName}" not found`);
}

function listAllDevices() {
    const deviceButtons = document.querySelectorAll('.device-btn');
    const deviceList = Array.from(deviceButtons).map(btn => btn.textContent.trim()).join(', ');
    updateVoiceStatus('Available devices: ' + deviceList);
}

function updateVoiceStatus(message) {
    const voiceStatus = document.querySelector('.voice-status');
    voiceStatus.textContent = message;
}

// Initialize voice recognition when the page loads
document.addEventListener('DOMContentLoaded', () => {
    const voiceBtn = document.querySelector('.voice-btn');
    if (voiceBtn) {
        voiceBtn.addEventListener('click', toggleVoiceRecognition);
    }
}); 