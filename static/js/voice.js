function handleVoiceCommand(command) {
    // Update UI to show command being processed
    updateVoiceStatus(`Processing: "${command}"`);
    
    // Send command to server
    socket.emit('voice_command', { command: command }, function(response) {
        if (response && response.success) {
            // Update device states based on response
            if (response.device && response.value !== undefined) {
                updateDeviceState(response.device, response.value);
            }
            
            // Show success message
            updateVoiceStatus(response.message || 'Command processed successfully');
            
            // Add to activity feed
            addToActivityFeed({
                type: 'voice',
                message: `Voice command: "${command}"`,
                timestamp: new Date().toISOString()
            });
        } else {
            // Show error message
            updateVoiceStatus(response.message || 'Error processing command');
        }
    });
}

function updateDeviceState(device, value) {
    // Update UI elements based on device state
    const deviceElement = document.querySelector(`[data-device="${device}"]`);
    if (deviceElement) {
        if (typeof value === 'boolean') {
            // Toggle device
            deviceElement.classList.toggle('active', value);
            const statusText = deviceElement.querySelector('.device-status');
            if (statusText) {
                statusText.textContent = value ? 'ON' : 'OFF';
            }
        } else if (typeof value === 'number' && device === 'thermostat') {
            // Update thermostat value
            const tempDisplay = deviceElement.querySelector('.temperature-display');
            if (tempDisplay) {
                tempDisplay.textContent = `${value}°C`;
            }
        }
    }
}

function updateVoiceStatus(message) {
    const statusElement = document.getElementById('voice-status');
    if (statusElement) {
        statusElement.textContent = message;
        // Clear status after 5 seconds
        setTimeout(() => {
            statusElement.textContent = 'Voice assistant ready';
        }, 5000);
    }
}

// Add event listeners for voice command button
document.addEventListener('DOMContentLoaded', function() {
    const voiceButton = document.getElementById('voice-command-btn');
    if (voiceButton) {
        voiceButton.addEventListener('click', function() {
            // Show voice command interface
            const command = prompt('Enter your voice command:');
            if (command) {
                handleVoiceCommand(command);
            }
        });
    }
    
    // Add keyboard shortcut (Ctrl+Shift+V)
    document.addEventListener('keydown', function(e) {
        if (e.ctrlKey && e.shiftKey && e.key === 'V') {
            const voiceButton = document.getElementById('voice-command-btn');
            if (voiceButton) {
                voiceButton.click();
            }
        }
    });
}); 