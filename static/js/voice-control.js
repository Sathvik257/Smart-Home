class VoiceControl {
    constructor(socket) {
        this.socket = socket;
        this.isListening = false;
        this.lastCommand = '';
        this.lastCommandTime = 0;
        this.commandCooldown = 1000; // 1 second cooldown between commands
        
        this.initializeElements();
        this.setupVoiceRecognition();
        this.setupEventListeners();
        this.setupSocketListeners();
        this.initializeTemperatureControls();
        
        // Initialize voice control panel visibility
        this.voiceControlPanel = document.querySelector('.voice-control-section');
        this.voiceControlBtn = document.getElementById('voiceControlBtn');
        this.closeVoiceControlBtn = document.querySelector('.close-voice-control');
        this.setupVoiceControlPanel();

        // Device mappings by room and category
        this.roomDevices = {
            'living-room': {
                'lights': ['main-light', 'floor-lamp'],
                'tvs': ['tv'],
                'acs': ['ac']
            },
            'bedroom': {
                'lights': ['ceiling-light', 'bedside-lamp'],
                'fans': ['ceiling-fan'],
                'acs': ['ac']
            },
            'kitchen': {
                'lights': ['main-light', 'counter-light'],
                'fans': ['exhaust-fan'],
                'appliances': ['refrigerator', 'microwave']
            }
        };

        // Device display names for better user feedback
        this.deviceDisplayNames = {
            'main-light': 'Main Light',
            'floor-lamp': 'Floor Lamp',
            'tv': 'TV',
            'ac': 'AC',
            'ceiling-light': 'Ceiling Light',
            'bedside-lamp': 'Bedside Lamp',
            'ceiling-fan': 'Ceiling Fan',
            'counter-light': 'Counter Light',
            'exhaust-fan': 'Exhaust Fan',
            'refrigerator': 'Refrigerator',
            'microwave': 'Microwave'
        };
        
        // Command patterns for better recognition
        this.commandPatterns = {
            device: /^(turn|switch|set) (on|off) (?:the )?(.+?)(?: in (?:the )?(.+))?$/i,
            temperature: /^set (?:the )?(.+) temperature to (\d+)(?: degrees)?( celsius| fahrenheit)?(?: in (?:the )?(.+))?$/i,
            scene: /^activate (?:the )?(.+) scene$/i,
            routine: /^start (?:the )?(.+) routine$/i,
            room: /^show (?:the )?(.+) (?:room|devices)$/i,
            help: /^(help|show commands|what can you do)$/i
        };

        this.initializeDeviceControls();
        this.currentRoom = 'living-room'; // Default room
        this.cooldownTime = 1000; // 1 second cooldown

        // Update the deviceMappings object to include speaker variations
        this.deviceMappings = {
            'living-room': {
                'main light': 'main-light',
                'main-light': 'main-light',
                'floor lamp': 'floor-lamp',
                'floor-lamp': 'floor-lamp',
                'smart tv': 'tv',
                'tv': 'tv',
                'television': 'tv',
                'ac': 'ac',
                'air conditioner': 'ac',
                'air-conditioner': 'ac'
            },
            'bedroom': {
                'main light': 'main-light',
                'ceiling light': 'ceiling-light',
                'bedside lamp': 'bedside-lamp',
                'ceiling fan': 'ceiling-fan',
                'fan': 'ceiling-fan',
                'ac': 'ac',
                'air conditioner': 'ac'
            },
            'kitchen': {
                'main light': 'main-light',
                'counter light': 'counter-light',
                'exhaust fan': 'exhaust-fan',
                'fan': 'exhaust-fan',
                'refrigerator': 'refrigerator',
                'fridge': 'refrigerator',
                'microwave': 'microwave'
            }
        };
    }

    setupVoiceControlPanel() {
        // Toggle voice control panel
        this.voiceControlBtn.addEventListener('click', () => {
            this.voiceControlPanel.classList.toggle('show');
            if (this.voiceControlPanel.classList.contains('show')) {
                this.updateStatus('Voice control ready');
            }
        });

        // Close voice control panel
        this.closeVoiceControlBtn.addEventListener('click', () => {
            this.voiceControlPanel.classList.remove('show');
            if (this.isListening) {
                this.stopListening();
            }
        });
    }

    initializeElements() {
        this.startBtn = document.getElementById('startVoice');
        this.stopBtn = document.getElementById('stopVoice');
        this.statusDisplay = document.getElementById('voiceStatus');
        this.messagesContainer = document.getElementById('voiceMessages');
        this.helpSection = document.getElementById('voiceHelp');
        
        // Style the messages container
        this.messagesContainer.style.maxHeight = '300px';
        this.messagesContainer.style.overflowY = 'auto';
        this.messagesContainer.style.marginBottom = '20px';
        this.messagesContainer.style.padding = '10px';
        this.messagesContainer.style.border = '1px solid #ddd';
        this.messagesContainer.style.borderRadius = '5px';
    }

    setupVoiceRecognition() {
        if ('webkitSpeechRecognition' in window) {
            this.recognition = new webkitSpeechRecognition();
            this.recognition.continuous = true;
            this.recognition.interimResults = false;
            this.recognition.lang = 'en-US';

            this.recognition.onstart = () => {
                this.isListening = true;
                this.updateStatus('Listening...');
                this.startBtn.classList.add('active');
                this.addMessage('system', 'Voice recognition started. Speak your command.');
            };

            this.recognition.onend = () => {
                this.isListening = false;
                this.updateStatus('Voice recognition stopped');
                this.startBtn.classList.remove('active');
                // Restart recognition if it was stopped unexpectedly
                if (this.shouldBeListening) {
                    this.recognition.start();
                }
            };

            this.recognition.onresult = (event) => {
                const lastResult = event.results[event.results.length - 1];
                const command = lastResult[0].transcript.trim();
                this.addMessage('user', command);
                this.processCommand(command);
            };

            this.recognition.onerror = (event) => {
                console.error('Voice recognition error:', event.error);
                this.updateStatus('Error: ' + event.error);
                this.addMessage('system', 'Error: ' + event.error);
                // Restart recognition on error if it should be listening
                if (this.shouldBeListening) {
                    setTimeout(() => this.recognition.start(), 1000);
                }
            };
        } else {
            this.updateStatus('Voice recognition not supported in this browser');
            this.addMessage('system', 'Voice recognition not supported in this browser');
        }
    }

    setupEventListeners() {
        this.startBtn.addEventListener('click', () => {
            this.startListening();
            this.stopBtn.disabled = false;
            this.startBtn.disabled = true;
        });

        this.stopBtn.addEventListener('click', () => {
            this.stopListening();
            this.stopBtn.disabled = true;
            this.startBtn.disabled = false;
        });
    }

    setupSocketListeners() {
        // Listen for device state updates from the server
        this.socket.on('device_update', (data) => {
            console.log('Device update received:', data);
            this.updateDeviceState(data.room, data.device_id, data.state);
            this.addMessage('system', `Device ${this.deviceDisplayNames[data.device_id] || data.device_id} in ${data.room} ${data.state ? 'turned on' : 'turned off'}`);
        });

        // Listen for temperature updates from the server
        this.socket.on('temperature_update', (data) => {
            console.log('Temperature update received:', data);
            if (data.type === 'temperature') {
                this.updateTemperatureUI(data.room, data.device, data.temperature);
                this.addMessage('system', `Temperature set to ${data.temperature}°C in ${this.formatRoomName(data.room)}`);
            }
        });

        // Listen for room updates
        this.socket.on('room_update', (data) => {
            console.log('Room update received:', data);
            if (data.devices) {
                Object.entries(data.devices).forEach(([deviceId, state]) => {
                    this.updateDeviceState(data.room, deviceId, state.value);
                });
            }
        });

        this.socket.on('room_changed', (data) => {
            console.log('Room changed:', data);
            this.currentRoom = data.room;
            this.addMessage('System', `Switched to ${this.formatRoomName(this.currentRoom)}`, 'success');
            
            // Update UI to show the current room's devices
            this.updateRoomVisibility(data.room);
        });

        this.socket.on('device_state', (data) => {
            if (data.type === 'ac') {
                const roomSection = document.querySelector(`.room-devices[data-room="${data.room}"]`);
                if (roomSection) {
                    const deviceContainer = roomSection.querySelector('.device[data-device="ac"]');
                    if (deviceContainer) {
                        const toggleBtn = deviceContainer.querySelector('.toggle-input');
                        if (toggleBtn) {
                            toggleBtn.checked = data.state;
                            if (data.state) {
                                deviceContainer.classList.add('active');
                            } else {
                                deviceContainer.classList.remove('active');
                            }
                            
                            // Add animation
                            deviceContainer.classList.add('updating');
                            setTimeout(() => deviceContainer.classList.remove('updating'), 500);
                        }
                    }
                }
            }
        });
    }

    startListening() {
        if (!this.isListening && this.recognition) {
            this.shouldBeListening = true;
            this.recognition.start();
            this.addMessage('system', 'Voice recognition started. Speak your command.');
        }
    }

    stopListening() {
        if (this.isListening && this.recognition) {
            this.shouldBeListening = false;
            this.recognition.stop();
            this.addMessage('system', 'Voice recognition stopped.');
        }
    }

    updateStatus(message) {
        this.statusDisplay.textContent = message;
    }

    addMessage(type, text) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `voice-message ${type}-message`;
        
        const timestamp = new Date().toLocaleTimeString();
        messageDiv.innerHTML = `<span class="message-time">[${timestamp}]</span> ${text}`;
        
        this.messagesContainer.appendChild(messageDiv);
        this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
        
        // Fade in animation
        messageDiv.style.opacity = '0';
        messageDiv.style.transition = 'opacity 0.3s ease-in';
        setTimeout(() => messageDiv.style.opacity = '1', 10);
    }

    processCommand(command) {
        // Convert command to lowercase for easier matching
        command = command.toLowerCase().trim();

        // Room switching commands
        if (command.includes('switch to') || command.includes('go to')) {
            const roomMatch = command.match(/(?:switch|go) to (\w+)(?:\s*room)?/);
            if (roomMatch) {
                const targetRoom = this.findRoom(roomMatch[1]);
                if (targetRoom) {
                    this.navigateToRoom(targetRoom);
                    this.currentRoom = targetRoom;
                    return;
                }
            }
            this.addMessage('system', 'Please specify a valid room (Living Room, Bedroom, or Kitchen)');
            return;
        }

        // Process device commands
        if (command.includes('turn on') || command.includes('turn off')) {
            const state = command.includes('turn on');
            let deviceName = command.replace(state ? 'turn on' : 'turn off', '').trim();
            deviceName = deviceName.replace(/^(the|my)\s+/, '').trim();

            // Try to find the device in the current room
            const deviceId = this.findDeviceInCurrentRoom(deviceName);
            
            if (deviceId) {
                // Update device state
                this.toggleDevice(this.currentRoom, deviceId, state);
                return;
            } else {
                const availableDevices = this.getAvailableDevices();
                this.addMessage('system', `Device not found. Available devices in ${this.formatRoomName(this.currentRoom)}: ${availableDevices}`);
                return;
            }
        }

        // Check for AC power commands
        if (command.match(/turn (on|off) (?:the )?(ac|air conditioner)/i)) {
            const state = command.includes('turn on');
            const room = this.findRoom(command) || this.currentRoom;
            
            this.socket.emit('device_control', {
                room: room,
                device: 'ac',
                state: state,
                type: 'ac'
            });
            
            this.updateDeviceState(room, 'ac', state);
            this.addMessage('system', `${state ? 'Turning on' : 'Turning off'} Air Conditioner in ${this.formatRoomName(room)}`);
            return;
        }

        // Temperature control patterns
        const tempPatterns = [
            /(?:set|change|make|adjust|update).*(?:temperature|temp).*(?:to|at)\s*(\d+)\s*(?:degrees?|°)?/i,
            /(?:temperature|temp).*(?:to|at)\s*(\d+)\s*(?:degrees?|°)?/i
        ];

        // Check for temperature commands
        for (const pattern of tempPatterns) {
            const match = command.match(pattern);
            if (match) {
                const temperature = parseInt(match[1]);
                if (temperature >= 16 && temperature <= 30) {
                    const room = this.findRoom(command) || this.currentRoom;
                    if (room) {
                        console.log('Processing temperature command:', {
                            room,
                            temperature,
                            command
                        });

                        // Find the device container in the current room
                        const roomSection = document.querySelector(`.room-devices[data-room="${room}"]`);
                        if (roomSection) {
                            const deviceContainer = roomSection.querySelector('.device[data-device="ac"]');
                            if (deviceContainer) {
                                // Update temperature display and slider
                                const tempText = deviceContainer.querySelector('.temperature-text');
                                const tempSlider = deviceContainer.querySelector('.temperature-slider');
                                const toggleBtn = deviceContainer.querySelector('.toggle-input');
                                
                                if (tempText) tempText.textContent = `${temperature}°C`;
                                if (tempSlider) tempSlider.value = temperature;
                                if (toggleBtn) {
                                    toggleBtn.checked = true;
                                    deviceContainer.classList.add('active');
                                }
                                
                                // Add animation classes
                                deviceContainer.classList.add('updating');
                                if (tempText) tempText.classList.add('updating');
                                if (tempSlider) tempSlider.classList.add('temperature-updated');
                                
                                // Remove animation classes after animation completes
                                setTimeout(() => {
                                    deviceContainer.classList.remove('updating');
                                    if (tempText) tempText.classList.remove('updating');
                                    if (tempSlider) tempSlider.classList.remove('temperature-updated');
                                }, 500);
                            }
                        }
                        
                        // Emit the socket event
                        this.socket.emit('temperature_control', {
                            room: room,
                            device: `${room}-ac`,
                            temperature: temperature,
                            type: 'temperature'
                        });
                        
                        this.addMessage('system', `Setting temperature to ${temperature}°C in ${this.formatRoomName(room)}`);
                        return;
                    }
                } else {
                    this.addMessage('error', 'Temperature must be between 16°C and 30°C');
                    return;
                }
            }
        }

        this.addMessage('System', 'Command not recognized. Try "turn on/off [device]" or "switch to [room]"', 'error');
    }

    findRoom(roomName) {
        // Clean up room name
        roomName = roomName.toLowerCase().trim();
        
        // Handle variations of room names
        const roomMappings = {
            'living': 'living-room',
            'living room': 'living-room',
            'livingroom': 'living-room',
            'bed': 'bedroom',
            'bedroom': 'bedroom',
            'kitchen': 'kitchen'
        };
        
        return roomMappings[roomName] || null;
    }

    findDeviceInCurrentRoom(command) {
        // Clean up the command
        let cleanCommand = command
            .toLowerCase()
            .replace('turn on', '')
            .replace('turn off', '')
            .replace('switch on', '')
            .replace('switch off', '')
            .replace('the', '')
            .trim();

        // Try to match the device name
        const devices = this.deviceMappings[this.currentRoom];
        if (!devices) return null;

        // Try exact match first
        if (devices[cleanCommand]) {
            return devices[cleanCommand];
        }

        // Try partial matches
        for (let [deviceName, deviceId] of Object.entries(devices)) {
            if (cleanCommand.includes(deviceName) || deviceName.includes(cleanCommand)) {
                return deviceId;
            }
        }

        return null;
    }

    getDeviceDisplayName(deviceId) {
        const displayNames = {
            'main-light': 'Main Light',
            'floor-lamp': 'Floor Lamp',
            'smart-tv': 'Smart TV',
            'ac': 'Air Conditioner',
            'bedside-lamp': 'Bedside Lamp',
            'ceiling-fan': 'Ceiling Fan',
            'counter-light': 'Counter Light',
            'exhaust-fan': 'Exhaust Fan',
            'refrigerator': 'Refrigerator',
            'microwave': 'Microwave'
        };
        return displayNames[deviceId] || deviceId;
    }

    getAvailableDevices() {
        const deviceCategories = {
            'living-room': {
                'lights': ['Main Light', 'Floor Lamp'],
                'entertainment': ['Smart TV'],
                'climate': ['Air Conditioner']
            },
            'bedroom': {
                'lights': ['Main Light', 'Bedside Lamp'],
                'fans': ['Ceiling Fan'],
                'climate': ['Air Conditioner']
            },
            'kitchen': {
                'lights': ['Main Light', 'Counter Light'],
                'fans': ['Exhaust Fan'],
                'appliances': ['Refrigerator', 'Microwave']
            }
        };

        const categories = deviceCategories[this.currentRoom];
        if (!categories) return 'No devices available';

        return Object.entries(categories)
            .map(([category, devices]) => `${category}: ${devices.join(', ')}`)
            .join(' | ');
    }

    updateDeviceState(room, deviceId, state) {
        console.log('Updating device state:', { room, deviceId, state });
        
        // Find all relevant elements
        const selectors = [
            `.device-card[data-room="${room}"][data-device-id="${deviceId}"]`,
            `.device[data-room="${room}"][data-device="${deviceId}"]`,
            `.room-devices[data-room="${room}"] .device[data-device="${deviceId}"]`,
            `.virtual-room .device-icons .device-icon[data-device="${deviceId}"]`
        ];
        
        selectors.forEach(selector => {
            const element = document.querySelector(selector);
            if (element) {
                // Update toggle state
                const toggle = element.querySelector('.device-toggle, .toggle-input');
                if (toggle) {
                    toggle.checked = state;
                }

                // Update element state
                element.setAttribute('data-state', state ? 'on' : 'off');
                element.classList.toggle('active', state);
                
                // Force reflow and add animations
                element.classList.remove('device-updated', 'updating');
                void element.offsetHeight; // Force reflow
                element.classList.add('device-updated', 'updating');
                
                // Handle device icon
                const icon = element.querySelector('.device-icon, i');
                if (icon) {
                    icon.classList.toggle('active', state);
                    icon.classList.remove('device-updated');
                    void icon.offsetHeight; // Force reflow
                    icon.classList.add('device-updated');
                    
                    // Add device-specific animations
                    if (state) {
                        const deviceType = this.getDeviceType(deviceId);
                        switch (deviceType) {
                            case 'light':
                                icon.style.animation = 'lightGlow 2s infinite';
                                break;
                            case 'tv':
                                icon.style.animation = 'tvGlow 2s infinite';
                                break;
                            case 'ac':
                                icon.style.animation = 'acGlow 2s infinite';
                                break;
                            case 'fan':
                                icon.style.animation = 'fanSpin 2s linear infinite';
                                break;
                        }
                    } else {
                        icon.style.animation = '';
                    }
                }

                // Remove animation classes after delay
                setTimeout(() => {
                    element.classList.remove('device-updated', 'updating');
                    if (icon) {
                        icon.classList.remove('device-updated');
                    }
                }, 1000);
            }
        });

        if (deviceId === 'speaker') {
            const speakerCard = document.querySelector(`.device-card[data-device-id="speaker"][data-room="${room}"]`);
            if (speakerCard) {
                // Update toggle state
                const toggle = speakerCard.querySelector('.toggle-input');
                if (toggle) {
                    toggle.checked = state;
                }

                // Update speaker card state
                speakerCard.classList.toggle('active', state);
                
                // Update speaker icon animations
                const icon = speakerCard.querySelector('.device-icon i');
                if (icon) {
                    if (state) {
                        icon.style.animation = 'speakerWave 1.5s ease-in-out infinite';
                        icon.style.color = '#9c27b0';
                    } else {
                        icon.style.animation = '';
                        icon.style.color = '';
                    }
                }

                // Add pulse effect to the speaker card
                speakerCard.classList.add('state-changed');
                setTimeout(() => speakerCard.classList.remove('state-changed'), 500);
            }

            // Update virtual room speaker
            const virtualSpeaker = document.querySelector('.virtual-room .device-icon[data-device="speaker"]');
            if (virtualSpeaker) {
                virtualSpeaker.classList.toggle('active', state);
                const virtualIcon = virtualSpeaker.querySelector('i');
                if (virtualIcon) {
                    if (state) {
                        virtualIcon.style.animation = 'speakerWave 1.5s ease-in-out infinite';
                        virtualIcon.style.color = '#9c27b0';
                    } else {
                        virtualIcon.style.animation = '';
                        virtualIcon.style.color = '';
                    }
                }
            }
        }
    }

    updateTemperatureUI(room, deviceId, temperature) {
        console.log('Updating temperature UI:', { room, deviceId, temperature });
        
        const deviceContainer = document.querySelector(`.room-devices[data-room="${room}"] .device[data-device="ac"]`);
        if (!deviceContainer) {
            console.warn(`AC device not found in room ${room}`);
            return;
        }

        // Update temperature display with animation
        const tempText = deviceContainer.querySelector('.temperature-text');
        if (tempText) {
            tempText.textContent = `${temperature}°C`;
            tempText.classList.remove('updating');
            tempText.offsetHeight; // Force reflow
            tempText.classList.add('updating');
        }
        
        // Update slider with animation
        const slider = deviceContainer.querySelector('.temperature-slider');
        if (slider) {
            slider.value = temperature;
            slider.classList.remove('temperature-updated');
            slider.offsetHeight; // Force reflow
            slider.classList.add('temperature-updated');
            slider.style.setProperty('--value-percent', `${(temperature - 16) * 100 / 14}%`);
        }
        
        // Update AC state
        const toggleBtn = deviceContainer.querySelector('.toggle-input');
        if (toggleBtn) {
            toggleBtn.checked = true;
            deviceContainer.classList.add('active');
        }
        
        // Add container animations
        deviceContainer.classList.remove('updating', 'device-updated');
        deviceContainer.offsetHeight; // Force reflow
        deviceContainer.classList.add('updating', 'device-updated');
        
        // Update virtual room AC icon
        const virtualAC = document.querySelector('.virtual-room .device-icons .device-icon[data-device="ac"]');
        if (virtualAC) {
            virtualAC.classList.add('active');
            virtualAC.classList.remove('updating');
            virtualAC.offsetHeight; // Force reflow
            virtualAC.classList.add('updating');
            virtualAC.style.animation = 'acGlow 2s infinite';
        }
        
        // Remove animation classes after animation completes
        setTimeout(() => {
            deviceContainer.classList.remove('updating', 'device-updated');
            if (slider) slider.classList.remove('temperature-updated');
            if (tempText) tempText.classList.remove('updating');
            if (virtualAC) virtualAC.classList.remove('updating');
        }, 1000);
    }

    showHelp() {
        const helpText = `
Available commands:
- Turn on/off [device] in [room]
  Examples:
  • "Turn on lights in living room"
  • "Turn on tv in living room"
  • "Turn off main light in kitchen"
  • "Turn on bedside lamp in bedroom"

- Set [AC] temperature to [16-30] degrees in [room]
  Example: "Set AC temperature to 22 degrees in bedroom"

- Navigate to a room
  Examples:
  • "Switch to bedroom"
  • "Go to kitchen"
  • "Show living room"

- Show [room] devices
  Example: "Show kitchen devices"

Available rooms:
- Living Room
- Bedroom
- Kitchen

Available devices per room:
Living Room:
- Lights (main light, floor lamp)
- TV
- AC

Bedroom:
- Lights (ceiling light, bedside lamp)
- Ceiling Fan
- AC

Kitchen:
- Lights (main light, counter light)
- Exhaust Fan
- Refrigerator
- Microwave

Say "help" anytime to see this list again.
        `;
        
        this.addMessage('system', helpText);
    }

    toggleDevice(room, device, state) {
        console.log('Toggling device:', { room, device, state });
        
        // Emit the device control event
        this.socket.emit('device_control', {
            room: room,
            device_id: device,
            state: state,
            type: this.getDeviceType(device)
        });

        // Update the UI immediately
        this.updateDeviceState(room, device, state);
        
        // Add message with proper device name
        const displayName = this.deviceDisplayNames[device] || device;
        this.addMessage('system', `${state ? 'Turning on' : 'Turning off'} ${displayName} in ${this.formatRoomName(room)}`);
    }

    getDeviceType(deviceId) {
        if (deviceId.includes('light') || deviceId.includes('lamp')) return 'light';
        if (deviceId.includes('tv')) return 'tv';
        if (deviceId.includes('ac')) return 'ac';
        if (deviceId.includes('fan')) return 'fan';
        return 'other';
    }

    setTemperature(temperature, roomName) {
        const room = this.findRoom(roomName);
        if (!room) {
            this.addMessage('system', `Room "${roomName}" not found. Available rooms: ${Object.keys(this.roomDevices).join(', ')}`);
            return;
        }
        
        // Find an AC device in the room
        const roomDevices = this.roomDevices[room];
        if (!roomDevices || !roomDevices['acs']) {
            this.addMessage('system', `No temperature control device found in ${room}`);
            return;
        }
        
        const acDevice = roomDevices['acs'][0];
        
        // Emit the temperature control event
        this.socket.emit('temperature_control', {
            room: room,
            device_id: acDevice,
            temperature: temperature
        });

        // Update the UI immediately
        this.updateTemperatureUI(room, acDevice, temperature);
        this.addMessage('system', `Setting temperature to ${temperature}°C in ${room.replace('-', ' ')}`);
    }

    // Initialize device controls
    initializeDeviceControls() {
        // Add click listeners to all device toggles
        document.querySelectorAll('.device-toggle').forEach(toggle => {
            toggle.addEventListener('change', (e) => {
                const deviceCard = e.target.closest('.device-card');
                if (deviceCard) {
                    const room = deviceCard.dataset.room;
                    const deviceId = deviceCard.dataset.deviceId;
                    const category = deviceCard.dataset.category;
                    const state = e.target.checked;

                    this.socket.emit('device_control', {
                        room: room,
                        category: category,
                        device_id: deviceId,
                        state: state
                    });

                    this.updateDeviceState(room, deviceId, state);
                }
            });
        });

        // Add input listeners to all temperature sliders
        document.querySelectorAll('.temperature-slider').forEach(slider => {
            slider.addEventListener('input', (e) => {
                const deviceCard = e.target.closest('.device-card');
                if (deviceCard) {
                    const room = deviceCard.dataset.room;
                    const deviceId = deviceCard.dataset.deviceId;
                    const temperature = parseInt(e.target.value);

                    this.socket.emit('temperature_control', {
                        room: room,
                        device_id: deviceId,
                        temperature: temperature
                    });

                    this.updateTemperatureUI(room, deviceId, temperature);
                }
            });
        });
    }

    // Add a new method to handle room navigation
    navigateToRoom(room) {
        // Find the room button and trigger the room switch
        const roomButton = document.querySelector(`.room-nav-btn[data-room="${room}"]`);
        if (roomButton) {
            roomButton.click(); // This will trigger the room switch in RoomControl
            this.addMessage('system', `Navigating to ${room.replace('-', ' ')}`);
            
            // Update virtual room display
            const virtualRoom = document.querySelector('.virtual-room');
            if (virtualRoom) {
                virtualRoom.setAttribute('data-current-room', room);
                
                // Update room name
                const roomName = virtualRoom.querySelector('.room-name');
                if (roomName) {
                    roomName.textContent = room.split('-').map(word => 
                        word.charAt(0).toUpperCase() + word.slice(1)
                    ).join(' ');
                }

                // Update room icon
                const roomIcon = virtualRoom.querySelector('.room-icon');
                if (roomIcon) {
                    roomIcon.className = `room-icon ${room}`;
                    const iconElement = roomIcon.querySelector('i');
                    if (iconElement) {
                        switch(room) {
                            case 'living-room':
                                iconElement.className = 'fas fa-couch';
                                break;
                            case 'bedroom':
                                iconElement.className = 'fas fa-bed';
                                break;
                            case 'kitchen':
                                iconElement.className = 'fas fa-utensils';
                                break;
                        }
                    }
                }

                // Update device icons
                this.updateVirtualDevices(room);
            }
            
            // Emit a socket event to notify other clients
            this.socket.emit('room_change', { room: room });
        } else {
            this.addMessage('system', `Could not find navigation button for ${room}`);
        }
    }

    updateVirtualDevices(room) {
        const deviceContainer = document.querySelector(`.room-devices[data-room="${room}"]`);
        const virtualDeviceIcons = document.querySelector('.virtual-room .device-icons');
        
        if (!deviceContainer || !virtualDeviceIcons) return;
        
        virtualDeviceIcons.innerHTML = '';
        
        // Get all devices in the current room
        const devices = deviceContainer.querySelectorAll('.device, .device-card');
        devices.forEach(device => {
            const deviceId = device.getAttribute('data-device') || device.getAttribute('data-device-id');
            if (!deviceId) return;
            
            const toggle = device.querySelector('.toggle-input, .device-toggle');
            const isActive = toggle ? toggle.checked : false;
            
            // Create device icon
            const deviceIcon = document.createElement('div');
            deviceIcon.className = 'device-icon';
            deviceIcon.setAttribute('data-device', deviceId);
            
            // Set device type and icon
            let iconClass = '';
            let deviceType = '';
            switch(true) {
                case deviceId.includes('light') || deviceId.includes('lamp'):
                    iconClass = 'fas fa-lightbulb';
                    deviceType = 'light';
                    break;
                case deviceId.includes('tv'):
                    iconClass = 'fas fa-tv';
                    deviceType = 'tv';
                    break;
                case deviceId.includes('ac'):
                    iconClass = 'fas fa-snowflake';
                    deviceType = 'ac';
                    break;
                case deviceId.includes('fan'):
                    iconClass = 'fas fa-fan';
                    deviceType = 'fan';
                    break;
                default:
                    iconClass = 'fas fa-plug';
                    deviceType = 'other';
            }
            
            deviceIcon.setAttribute('data-type', deviceType);
            if (isActive) {
                deviceIcon.classList.add('active');
            }
            
            const icon = document.createElement('i');
            icon.className = iconClass;
            deviceIcon.appendChild(icon);
            
            virtualDeviceIcons.appendChild(deviceIcon);
        });
    }

    findACDevice(room) {
        const roomDevices = {
            'living-room': {
                'ac': 'ac'
            },
            'bedroom': {
                'ac': 'ac'
            },
            'kitchen': {
                'ac': 'ac'
            }
        };
        
        return roomDevices[room]?.ac || null;
    }

    formatRoomName(roomId) {
        return roomId.split('-')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    }

    updateRoomVisibility(room) {
        // Update room buttons
        const roomButtons = document.querySelectorAll('.room-nav-btn');
        roomButtons.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.room === room);
        });

        // Show/hide room sections
        const roomSections = document.querySelectorAll('.room-devices');
        roomSections.forEach(section => {
            section.style.display = section.dataset.room === room ? 'grid' : 'none';
        });
    }

    // Add this method to initialize temperature controls
    initializeTemperatureControls() {
        const tempSlider = document.querySelector('.temperature-slider');
        const tempDisplay = document.querySelector('.temperature-text');
        
        if (tempSlider && tempDisplay) {
            tempSlider.addEventListener('input', (e) => {
                const temperature = parseInt(e.target.value);
                tempDisplay.textContent = `${temperature}°C`;
                
                // Emit temperature change event
                this.socket.emit('temperature_control', {
                    room: this.currentRoom,
                    device: `${this.currentRoom}-ac`,
                    temperature: temperature,
                    type: 'temperature'
                });
            });
        }
    }

    // Update the current room when room is switched
    updateCurrentRoom(room) {
        this.currentRoom = room;
        console.log('Current room updated to:', room);
    }
}

// Initialize voice control when the page loads
document.addEventListener('DOMContentLoaded', () => {
    const socket = io();
    window.voiceControl = new VoiceControl(socket);
});

// Add this to your CSS styles
const style = document.createElement('style');
style.textContent = `
    .temperature-slider.temperature-updated {
        transition: all 0.3s ease-in-out;
        background: linear-gradient(to right, #4CAF50 0%, #4CAF50 var(--value-percent), #ddd var(--value-percent), #ddd 100%);
    }
    
    .temperature-text.updating {
        animation: pulse 0.5s ease-in-out;
    }
    
    .device.updating {
        animation: glow 0.5s ease-in-out;
    }
    
    .device-toggle.active {
        background-color: #4CAF50;
    }
    
    @keyframes pulse {
        0% { transform: scale(1); }
        50% { transform: scale(1.1); }
        100% { transform: scale(1); }
    }
    
    @keyframes glow {
        0% { box-shadow: 0 0 0 rgba(76, 175, 80, 0); }
        50% { box-shadow: 0 0 10px rgba(76, 175, 80, 0.5); }
        100% { box-shadow: 0 0 0 rgba(76, 175, 80, 0); }
    }
`;
document.head.appendChild(style); 