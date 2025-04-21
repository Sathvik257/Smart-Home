import Dashboard from './js/components/dashboard.js';
import Rooms from './js/components/rooms.js';

document.addEventListener('DOMContentLoaded', function() {
    // Initialize Socket.IO
    const socket = io();
    
    // Initialize components
    const dashboard = new Dashboard(socket);
    const rooms = new Rooms(socket);

    // Hamburger Menu Toggle
    const hamburger = document.getElementById('hamburger');
    const navMenu = document.getElementById('navMenu');
    
    hamburger.addEventListener('click', function() {
        this.classList.toggle('active');
        navMenu.classList.toggle('active');
    });
    
    // Navigation between sections
    const navLinks = document.querySelectorAll('.nav-menu a');
    const sections = document.querySelectorAll('.section');
    
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Remove active class from all links and sections
            navLinks.forEach(l => l.classList.remove('active'));
            sections.forEach(s => s.classList.remove('active'));
            
            // Add active class to clicked link
            this.classList.add('active');
            
            // Show corresponding section
            const target = this.getAttribute('href');
            document.querySelector(target).classList.add('active');
            
            // Close mobile menu if open
            if (navMenu.classList.contains('active')) {
                hamburger.classList.remove('active');
                navMenu.classList.remove('active');
            }
        });
    });
    
    // Voice Command Integration
    const micButton = document.getElementById('micButton');
    const voiceFeedback = document.getElementById('voiceFeedback');
    let isListening = false;
    let mediaRecorder = null;
    let audioChunks = [];
    
    // Socket.IO event handlers
    socket.on('connect', () => {
        console.log('Connected to server');
        micButton.classList.add('active');
        voiceFeedback.style.display = 'block';
        voiceFeedback.querySelector('p').textContent = 'Say "Hey Nexus" to give commands';
    });
    
    socket.on('disconnect', () => {
        console.log('Disconnected from server');
        micButton.classList.remove('active');
        voiceFeedback.style.display = 'none';
    });
    
    socket.on('device_states', (states) => {
        // Update all device states in both dashboard and rooms
        Object.entries(states).forEach(([device, value]) => {
            dashboard.updateDeviceUI(device, value);
            rooms.updateDeviceUI(device, value);
        });
    });
    
    socket.on('device_update', (data) => {
        // Update device state in both dashboard and rooms
        dashboard.updateDeviceUI(data.device, data.value);
        rooms.updateDeviceUI(data.device, data.value);
    });
    
    // Toggle microphone button
    micButton.addEventListener('click', async function() {
        if (!isListening) {
            try {
                // Start listening
                isListening = true;
                this.classList.add('listening');
                voiceFeedback.querySelector('p').textContent = 'Listening...';
                
                // Request microphone access
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                
                // Set up media recorder
                mediaRecorder = new MediaRecorder(stream);
                audioChunks = [];

                mediaRecorder.ondataavailable = (event) => {
                    audioChunks.push(event.data);
                };

                mediaRecorder.onstop = async () => {
                    // Convert audio chunks to blob
                    const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
                    
                    // Create form data
                    const formData = new FormData();
                    formData.append('audio', audioBlob);

                    try {
                        // Send audio to server for processing
                        const response = await fetch('/process_audio', {
                            method: 'POST',
                            body: formData
                        });

                        const result = await response.json();
                        if (result.command) {
                            // Emit the voice command to the server
                            socket.emit('voice_command', { command: result.command });
                        }
                    } catch (error) {
                        console.error('Error processing audio:', error);
                        voiceFeedback.querySelector('p').textContent = 'Error processing audio';
                    }
                };

                // Start recording
                mediaRecorder.start();
                
                // Stop recording after 5 seconds
                setTimeout(() => {
                    if (mediaRecorder && mediaRecorder.state === 'recording') {
                        mediaRecorder.stop();
                        isListening = false;
                        this.classList.remove('listening');
                        voiceFeedback.querySelector('p').textContent = 'Say "Hey Nexus" to give commands';
                    }
                }, 5000);

            } catch (err) {
                console.error('Error accessing microphone:', err);
                voiceFeedback.querySelector('p').textContent = 'Error accessing microphone';
                isListening = false;
                this.classList.remove('listening');
            }
        } else {
            // Stop listening
            if (mediaRecorder && mediaRecorder.state === 'recording') {
                mediaRecorder.stop();
            }
            isListening = false;
            this.classList.remove('listening');
            voiceFeedback.querySelector('p').textContent = 'Say "Hey Nexus" to give commands';
        }
    });
    
    // Toggle switches functionality
    const toggleSwitches = document.querySelectorAll('.toggle-input');
    toggleSwitches.forEach(switchEl => {
        switchEl.addEventListener('change', function() {
            const device = this.id.split('-')[0];
            const status = this.checked ? 'on' : 'off';
            console.log(`${device} turned ${status}`);
            
            // Update UI or send command to backend
            if (device === 'security') {
                const statusElement = this.closest('.card').querySelector('.security-status');
                statusElement.textContent = this.checked ? 'System Armed' : 'System Disarmed';
                statusElement.style.color = this.checked ? 'var(--success)' : 'var(--error)';
            }
            
            // Add to activity feed
            addActivity(`${device.charAt(0).toUpperCase() + device.slice(1)} turned ${status}`);
            
            // Send update to server if connected
            if (socket && socket.readyState === WebSocket.OPEN) {
                socket.send(JSON.stringify({
                    action: device,
                    value: this.checked
                }));
            }
        });
    });
    
    // Thermostat slider functionality
    const thermoSlider = document.getElementById('thermoSlider');
    const tempDisplay = document.querySelector('.temperature-display');
    
    thermoSlider.addEventListener('input', function() {
        tempDisplay.textContent = `${this.value}°C`;
    });
    
    thermoSlider.addEventListener('change', function() {
        console.log(`Thermostat set to ${this.value}°C`);
        addActivity(`Thermostat set to ${this.value}°C`);
        
        // Send update to server if connected
        if (socket && socket.readyState === WebSocket.OPEN) {
            socket.send(JSON.stringify({
                action: 'thermostat',
                value: parseInt(this.value)
            }));
        }
    });
    
    // Quick action buttons
    const actionButtons = document.querySelectorAll('.btn-action');
    actionButtons.forEach(button => {
        button.addEventListener('click', function() {
            const action = this.id;
            console.log(`Action triggered: ${action}`);
            
            // Add visual feedback
            this.classList.add('active');
            setTimeout(() => this.classList.remove('active'), 300);
            
            // Execute corresponding action
            executeQuickAction(action);
            
            // Send scene command to server if connected
            if (socket && socket.readyState === WebSocket.OPEN) {
                socket.send(JSON.stringify({
                    action: 'scene',
                    name: action
                }));
            }
        });
    });
    
    // Function to execute quick actions
    function executeQuickAction(action) {
        let message = '';
        
        switch(action) {
            case 'goodMorning':
                message = 'Good Morning scene activated';
                // Turn on lights, set thermostat, open curtains, etc.
                document.getElementById('lights-toggle').checked = true;
                document.getElementById('lights-toggle').dispatchEvent(new Event('change'));
                document.getElementById('thermoSlider').value = 22;
                document.getElementById('thermoSlider').dispatchEvent(new Event('input'));
                document.getElementById('thermoSlider').dispatchEvent(new Event('change'));
                break;
            case 'leaveHome':
                message = 'Leave Home scene activated';
                // Turn off lights, set thermostat, arm security, etc.
                document.getElementById('lights-toggle').checked = false;
                document.getElementById('lights-toggle').dispatchEvent(new Event('change'));
                document.getElementById('thermoSlider').value = 18;
                document.getElementById('thermoSlider').dispatchEvent(new Event('input'));
                document.getElementById('thermoSlider').dispatchEvent(new Event('change'));
                document.getElementById('security-toggle').checked = true;
                document.getElementById('security-toggle').dispatchEvent(new Event('change'));
                break;
            case 'goodNight':
                message = 'Good Night scene activated';
                // Dim lights, set thermostat, lock doors, etc.
                document.getElementById('lights-toggle').checked = false;
                document.getElementById('lights-toggle').dispatchEvent(new Event('change'));
                document.getElementById('thermoSlider').value = 20;
                document.getElementById('thermoSlider').dispatchEvent(new Event('input'));
                document.getElementById('thermoSlider').dispatchEvent(new Event('change'));
                document.getElementById('security-toggle').checked = true;
                document.getElementById('security-toggle').dispatchEvent(new Event('change'));
                break;
            case 'entertainment':
                message = 'Entertainment mode activated';
                // Dim lights, lower blinds, etc.
                document.getElementById('lights-toggle').checked = true;
                document.getElementById('lights-toggle').dispatchEvent(new Event('change'));
                break;
        }
        
        console.log(message);
        addActivity(message);
    }
    
    // Function to add items to activity feed
    function addActivity(text) {
        const activityFeed = document.getElementById('activityFeed');
        const now = new Date();
        const timeString = now.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
        
        const activityItem = document.createElement('div');
        activityItem.className = 'activity-item';
        activityItem.innerHTML = `
            <div class="activity-icon">
                <i class="fas fa-bell"></i>
            </div>
            <div class="activity-details">
                <p>${text}</p>
                <small class="activity-time">${timeString}</small>
            </div>
        `;
        
        activityFeed.insertBefore(activityItem, activityFeed.firstChild);
        
        // Limit to 10 items
        if (activityFeed.children.length > 10) {
            activityFeed.removeChild(activityFeed.lastChild);
        }
    }
    
    // Initialize with some sample rooms
    initializeRooms();
    
    function initializeRooms() {
        const rooms = [
            { name: 'Living Room', devices: 4, icon: 'fa-couch' },
            { name: 'Kitchen', devices: 3, icon: 'fa-utensils' },
            { name: 'Bedroom', devices: 2, icon: 'fa-bed' },
            { name: 'Bathroom', devices: 2, icon: 'fa-bath' },
            { name: 'Office', devices: 2, icon: 'fa-laptop' },
            { name: 'Garage', devices: 1, icon: 'fa-car' }
        ];
        
        const roomGrid = document.querySelector('.room-grid');
        if (!roomGrid) return;
        
        rooms.forEach(room => {
            const roomCard = document.createElement('div');
            roomCard.className = 'room-card';
            roomCard.innerHTML = `
                <div class="room-icon">
                    <i class="fas ${room.icon}"></i>
                </div>
                <h3>${room.name}</h3>
                <p>${room.devices} devices</p>
                <button class="btn-view">View Devices</button>
            `;
            
            roomGrid.appendChild(roomCard);
        });
    }
});