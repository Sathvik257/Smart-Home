class RoomControl {
    constructor(socket) {
        this.socket = socket;
        this.activityFeed = document.getElementById('activityFeed');
        this.voiceStatus = document.getElementById('voiceStatus');
        this.addRoomBtn = document.getElementById('addRoomBtn');
        this.addRoomModal = document.getElementById('addRoomModal');
        this.addRoomForm = document.getElementById('addRoomForm');
        this.roomList = ['kitchen', 'living-room', 'bedroom'];
        this.currentRoom = 'living-room';
        this.virtualRoom = document.querySelector('.virtual-room');
        this.roomVisualization = document.querySelector('.room-visualization');
        this.devices = {};
        this.rooms = {};
        
        this.initializeRoomNavigation();
        this.initializeVirtualRoom();
        this.initializeDeviceControls();
        this.initializeSocketIO();
        this.initializeModals();
        this.updateRoomStatus();
        this.initializeAnimations();
        this.setupSocketListeners();

        // Set initial room visibility
        this.switchRoom('living-room');
    }

    createInitialRooms() {
        // Create initial room cards in the dashboard
        this.roomList.forEach(roomId => {
            this.createRoomCard(roomId, this.formatRoomName(roomId), this.getRoomIcon(roomId));
        });

        // Create initial room content
        this.roomList.forEach(roomId => {
            this.createRoomContent(roomId, this.formatRoomName(roomId));
        });
    }

    formatRoomName(roomId) {
        return roomId.split('-')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    }

    getRoomIcon(roomId) {
        const iconMap = {
            'kitchen': 'fa-utensils',
            'living-room': 'fa-couch',
            'bedroom': 'fa-bed',
            'bathroom': 'fa-bath'
        };
        return iconMap[roomId] || 'fa-home';
    }

    createRoomCard(roomId, name, icon) {
        // Check if room card already exists
        if (document.querySelector(`.room-card[data-room="${roomId}"]`)) {
            return;
        }

        // Create room card in dashboard
        const roomCard = document.createElement('div');
        roomCard.className = 'room-card';
        roomCard.setAttribute('data-room', roomId);
        roomCard.innerHTML = `
            <div class="room-card-header">
                <i class="fas ${icon}"></i>
                <h4>${name}</h4>
            </div>
            <div class="room-card-status">
                <div class="status-indicator"></div>
                <span class="status-text">All devices off</span>
            </div>
            <a href="#rooms" class="room-link" data-room="${roomId}">View Devices</a>
        `;
        document.querySelector('.room-cards').appendChild(roomCard);
    }

    createRoomContent(roomId, name) {
        // Check if room content already exists
        if (document.querySelector(`.room-content[data-room="${roomId}"]`)) {
            return;
        }

        // Create room content
        const roomContent = document.createElement('div');
        roomContent.className = 'room-content';
        roomContent.setAttribute('data-room', roomId);
        roomContent.innerHTML = `
            <h2>${name}</h2>
            <div class="devices-grid">
                <div class="device-card" data-device-id="${roomId}-lights" data-device-type="light" data-room="${roomId}">
                    <div class="device-icon">
                        <i class="fas fa-lightbulb"></i>
                    </div>
                    <h3>Lights</h3>
                    <div class="toggle-switch">
                        <input type="checkbox" id="${roomId}-lights-toggle" class="device-toggle">
                        <span class="toggle-slider"></span>
                    </div>
                </div>
                <div class="device-card" data-device-id="${roomId}-thermostat" data-device-type="thermostat" data-room="${roomId}">
                    <div class="device-icon">
                        <i class="fas fa-thermometer-half"></i>
                    </div>
                    <h3>Thermostat</h3>
                    <div class="temperature-control">
                        <input type="range" min="16" max="30" value="22" class="temperature-slider">
                        <div class="temperature-display">22°C</div>
                    </div>
                </div>
            </div>
        `;
        document.querySelector('.room-content-container').appendChild(roomContent);
    }

    initializeRoomNavigation() {
        const roomButtons = document.querySelectorAll('.room-nav-btn');
        roomButtons.forEach(button => {
            button.addEventListener('click', () => {
                const room = button.getAttribute('data-room');
                this.switchRoom(room);
            });
        });
    }

    initializeVirtualRoom() {
        // Initialize device click handlers in virtual room
        const virtualDevices = document.querySelectorAll('.virtual-room .device-icon');
        virtualDevices.forEach(device => {
            device.addEventListener('click', () => {
                const deviceId = device.dataset.device;
                const isActive = device.classList.contains('active');
                this.toggleDevice(this.currentRoom, deviceId, !isActive);
            });
        });
    }

    updateVirtualRoom(room) {
        const virtualRoom = document.querySelector('.virtual-room');
        virtualRoom.setAttribute('data-current-room', room);

        // Update room icon
        const roomIcon = virtualRoom.querySelector('.room-icon');
        roomIcon.className = `room-icon ${room}`;
        
        // Set room-specific icon
        const iconElement = roomIcon.querySelector('i');
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

        // Update device icons
        this.updateVirtualDeviceStates(room);
    }

    updateVirtualDeviceStates(room) {
        const deviceContainer = document.querySelector(`.room-devices[data-room="${room}"]`);
        const virtualDeviceIcons = document.querySelector('.virtual-room .device-icons');
        virtualDeviceIcons.innerHTML = '';

        if (!deviceContainer) return;

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
                case deviceId.includes('ac') || deviceId.includes('thermostat'):
                    iconClass = 'fas fa-snowflake';
                    deviceType = 'ac';
                    break;
                case deviceId.includes('fan'):
                    iconClass = 'fas fa-fan';
                    deviceType = 'fan';
                    break;
                case deviceId.includes('speaker'):
                    iconClass = 'fas fa-volume-up';
                    deviceType = 'speaker';
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
            
            // Add click handler
            deviceIcon.addEventListener('click', () => {
                const newState = !isActive;
                this.toggleDevice(room, deviceId, newState);
                
                // Add state change animation
                deviceIcon.classList.add('state-changed');
                setTimeout(() => {
                    deviceIcon.classList.remove('state-changed');
                }, 300);
            });
            
            virtualDeviceIcons.appendChild(deviceIcon);
        });
    }

    toggleDevice(room, deviceId, state) {
        // Update the actual device toggle
        const deviceCard = document.querySelector(`.device-card[data-room="${room}"][data-device-id="${deviceId}"], .device[data-device="${deviceId}"]`);
        if (deviceCard) {
            const toggle = deviceCard.querySelector('.device-toggle, .toggle-input');
            if (toggle) {
                toggle.checked = state;
                deviceCard.setAttribute('data-state', state ? 'on' : 'off');
            }
        }

        // Update virtual room device
        const virtualDevice = document.querySelector(`.virtual-room .device-icon[data-device="${deviceId}"]`);
        if (virtualDevice) {
            virtualDevice.classList.toggle('active', state);
            virtualDevice.classList.add('state-changed');
            setTimeout(() => {
                virtualDevice.classList.remove('state-changed');
            }, 300);
        }

        // Emit socket event
        this.socket.emit('device_control', {
            room: room,
            device: deviceId,
            state: state
        });

        // Update room status
        this.updateRoomStatus();
    }

    getDeviceState(room, deviceId) {
        const deviceCard = document.querySelector(`.device-card[data-room="${room}"][data-device-id="${deviceId}"]`);
        return deviceCard ? deviceCard.dataset.state : null;
    }

    setupSocketListeners() {
        this.socket.on('device_state_changed', (data) => {
            const { room, device, state } = data;
            const deviceElement = document.querySelector(`.room-devices[data-room="${room}"] .device[data-device="${device}"]`);
            if (deviceElement) {
                const toggle = deviceElement.querySelector('.toggle-input');
                toggle.checked = state;

                // Update virtual room if it's the current room
                if (room === this.currentRoom) {
                    this.updateVirtualDeviceStates(room);
                }
            }
        });

        this.socket.on('temperature_changed', (data) => {
            const { room, temperature } = data;
            const slider = document.querySelector(`.room-devices[data-room="${room}"] .temperature-slider`);
            if (slider) {
                slider.value = temperature;
                this.updateTemperatureDisplay(room, temperature);
            }
        });
    }

    initializeDeviceControls() {
        // Toggle device controls
        document.querySelectorAll('.toggle-input').forEach(toggle => {
            toggle.addEventListener('change', (e) => {
                const device = e.target.closest('.device');
                const deviceId = device.getAttribute('data-device');
                const room = device.closest('.room-devices').getAttribute('data-room');
                const isOn = e.target.checked;

                this.socket.emit('device_control', {
                    room,
                    device: deviceId,
                    state: isOn
                });

                // Update virtual room device state
                if (room === this.currentRoom) {
                    const virtualDevice = document.querySelector(`.virtual-room .device-icon[data-device="${deviceId}"]`);
                    if (virtualDevice) {
                        if (isOn) {
                            virtualDevice.classList.add('active');
                        } else {
                            virtualDevice.classList.remove('active');
                        }
                    }
                }
            });
        });

        // Temperature controls
        document.querySelectorAll('.temperature-slider').forEach(slider => {
            slider.addEventListener('input', (e) => {
                const device = e.target.closest('.device');
                const room = device.closest('.room-devices').getAttribute('data-room');
                const temperature = e.target.value;
                
                this.updateTemperatureDisplay(room, temperature);
                this.socket.emit('temperature_control', {
                    room,
                    temperature: parseInt(temperature)
                });
            });
        });
    }

    updateTemperatureDisplay(room, temperature) {
        const display = document.querySelector(`.room-devices[data-room="${room}"] .temperature-text`);
        if (display) {
            display.textContent = `${temperature}°C`;
            display.classList.add('temperature-updated');
            setTimeout(() => {
                display.classList.remove('temperature-updated');
            }, 500);
        }
    }

    initializeSocketIO() {
        this.socket.on('connect', () => {
            console.log('Connected to server');
        });

        this.socket.on('device_update', (data) => {
            this.updateDeviceUI(data.device, data.room, data.value, data.type);
            this.updateRoomStatus();
        });

        this.socket.on('device_states', (states) => {
            Object.entries(states).forEach(([device, state]) => {
                const [room, deviceName] = device.split('-');
                this.updateDeviceUI(device, room, state.value, state.type);
            });
            this.updateRoomStatus();
        });

        this.socket.on('activity_log', (activity) => {
            this.addActivityItem(activity.message, activity.source);
        });
        
        this.socket.on('voice_response', (data) => {
            if (this.voiceStatus) {
                this.voiceStatus.textContent = data.response;
                
                // Add animation to voice status
                this.voiceStatus.classList.add('voice-response');
                setTimeout(() => {
                    this.voiceStatus.classList.remove('voice-response');
                }, 2000);
            }
        });

        // Room updates
        this.socket.on('room_update', (data) => {
            this.updateRoomUI(data);
        });

        // Activity updates
        this.socket.on('activity_update', (data) => {
            this.addActivityItem(data);
        });
    }

    initializeModals() {
        // Add Room button click handlers
        this.addRoomBtn.addEventListener('click', () => this.showModal(this.addRoomModal));

        // Close modal buttons
        const closeButtons = document.querySelectorAll('.close-modal');
        closeButtons.forEach(button => {
            button.addEventListener('click', () => {
                this.hideModal(this.addRoomModal);
            });
        });

        // Add Room form submission
        this.addRoomForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const roomName = document.getElementById('roomName').value;
            const roomIcon = document.getElementById('roomIcon').value;
            this.addNewRoom(roomName, roomIcon);
            this.hideModal(this.addRoomModal);
        });

        // Close modal when clicking outside
        window.addEventListener('click', (e) => {
            if (e.target === this.addRoomModal) {
                this.hideModal(this.addRoomModal);
            }
        });
    }
    
    initializeAnimations() {
        // Add hover effects to cards
        document.addEventListener('mouseenter', (e) => {
            if (e.target.classList.contains('device-card')) {
                e.target.classList.add('card-hover');
            }
        }, true);
        
        document.addEventListener('mouseleave', (e) => {
            if (e.target.classList.contains('device-card')) {
                e.target.classList.remove('card-hover');
            }
        }, true);
        
        // Add hover effects to room cards
        document.addEventListener('mouseenter', (e) => {
            if (e.target.classList.contains('room-card')) {
                e.target.classList.add('room-card-hover');
            }
        }, true);
        
        document.addEventListener('mouseleave', (e) => {
            if (e.target.classList.contains('room-card')) {
                e.target.classList.remove('room-card-hover');
            }
        }, true);
        
        // Add hover effects to action buttons
        document.addEventListener('mouseenter', (e) => {
            if (e.target.classList.contains('btn-action')) {
                e.target.classList.add('btn-action-hover');
            }
        }, true);
        
        document.addEventListener('mouseleave', (e) => {
            if (e.target.classList.contains('btn-action')) {
                e.target.classList.remove('btn-action-hover');
            }
        }, true);
    }

    showModal(modal) {
        modal.classList.add('active');
    }

    hideModal(modal) {
        modal.classList.remove('active');
    }

    addNewRoom(name, icon) {
        // Create room ID from name
        const roomId = name.toLowerCase().replace(/\s+/g, '-');
        
        // Add room to rooms array
        this.roomList.push(roomId);
        
        // Create room navigation button
        const navButton = document.createElement('button');
        navButton.className = 'room-nav-btn';
        navButton.setAttribute('data-room', roomId);
        navButton.textContent = name;
        document.querySelector('.room-navigation').appendChild(navButton);
        
        // Create room content and card
        this.createRoomContent(roomId, name);
        this.createRoomCard(roomId, name, icon);
        
        // Initialize controls for new room
        this.initializeDeviceControls();
        
        // Add to activity feed
        this.addActivityItem(`New room "${name}" added`, 'system');
    }

    switchRoom(room) {
        // Hide all room sections first
        document.querySelectorAll('.room-devices').forEach(section => {
            section.style.display = 'none';
        });

        // Show the selected room section
        const targetRoom = document.querySelector(`.room-devices[data-room="${room}"]`);
        if (targetRoom) {
            targetRoom.style.display = 'grid';
        }

        // Update room buttons active state
        document.querySelectorAll('.room-nav-btn').forEach(button => {
            button.classList.remove('active');
            if (button.getAttribute('data-room') === room) {
                button.classList.add('active');
            }
        });

        // Update current room
        this.currentRoom = room;

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
        }

        // Update device states in virtual room
        this.updateVirtualDeviceStates(room);

        // Emit room change event
        this.socket.emit('room_changed', { room });
    }

    updateDeviceUI(device, room, value, type = 'toggle') {
        const deviceElement = document.querySelector(`[data-device-id="${device}"]`);
        if (deviceElement) {
            if (type === 'toggle') {
                const toggle = deviceElement.querySelector('.device-toggle');
                if (toggle) {
                    toggle.checked = value;
                    
                    // Add animation class
                    deviceElement.classList.add('device-updated');
                    setTimeout(() => {
                        deviceElement.classList.remove('device-updated');
                    }, 500);
                }
            } else if (type === 'temperature') {
                const slider = deviceElement.querySelector('.temperature-slider');
                const display = deviceElement.querySelector('.temperature-display');
                if (slider) {
                    slider.value = value;
                }
                if (display) {
                    display.textContent = `${value}°C`;
                    
                    // Add animation class
                    deviceElement.classList.add('device-updated');
                    setTimeout(() => {
                        deviceElement.classList.remove('device-updated');
                    }, 500);
                }
            }
        }
    }

    updateRoomStatus() {
        this.roomList.forEach(room => {
            const roomCard = document.querySelector(`.room-card[data-room="${room}"]`);
            if (roomCard) {
                const devices = document.querySelectorAll(`.device-card[data-room="${room}"]`);
                let activeCount = 0;
                
                devices.forEach(device => {
                    const toggle = device.querySelector('.device-toggle');
                    if (toggle && toggle.checked) {
                        activeCount++;
                    }
                });
                
                const statusIndicator = roomCard.querySelector('.status-indicator');
                const statusText = roomCard.querySelector('.status-text');
                
                if (activeCount > 0) {
                    statusIndicator.classList.add('active');
                    statusText.textContent = `${activeCount} device${activeCount > 1 ? 's' : ''} on`;
                } else {
                    statusIndicator.classList.remove('active');
                    statusText.textContent = 'All devices off';
                }
            }
        });
    }

    updateRoomUI(data) {
        const { room_id, devices } = data;
        const roomContent = document.querySelector(`.room-content[data-room="${room_id}"]`);
        
        if (roomContent) {
            const deviceGrid = roomContent.querySelector('.devices-grid');
            if (deviceGrid) {
                devices.forEach(device => {
                    this.updateDeviceUI(device.device_id, device.room, device.value, device.type);
                });
            }
        }
    }

    addActivityItem(message, source) {
        const now = new Date();
        const time = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        
        const activityItem = document.createElement('div');
        activityItem.className = 'activity-item';
        
        const icon = source === 'voice' ? 'fa-microphone' : 
                    source === 'system' ? 'fa-cog' : 'fa-hand-pointer';
        
        activityItem.innerHTML = `
            <div class="activity-icon">
                <i class="fas ${icon}"></i>
            </div>
            <div class="activity-details">
                <p>${message}</p>
                <span class="activity-time">${time}</span>
            </div>
        `;
        
        // Add animation class
        activityItem.classList.add('activity-fade-in');
        
        // Add to the top of the feed
        this.activityFeed.insertBefore(activityItem, this.activityFeed.firstChild);
        
        // Remove animation class after animation completes
        setTimeout(() => {
            activityItem.classList.remove('activity-fade-in');
        }, 500);
        
        // Limit the number of items in the feed
        const items = this.activityFeed.querySelectorAll('.activity-item');
        if (items.length > 10) {
            this.activityFeed.removeChild(items[items.length - 1]);
        }
    }

    formatDeviceName(deviceId) {
        // Convert device ID to a readable name
        // e.g., "kitchen-lights" -> "Kitchen Lights"
        return deviceId.split('-')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    }

    updateDeviceState(deviceId, state) {
        const deviceCard = document.querySelector(`.device-card[data-device-id="${deviceId}"]`);
        if (deviceCard) {
            // Remove previous states
            deviceCard.classList.remove('active', 'inactive');
            
            // Add new state
            if (state === 'on') {
                deviceCard.classList.add('active');
                
                // Special handling for speaker
                if (deviceId === 'speaker') {
                    deviceCard.querySelector('.device-icon').style.animation = 'speakerPulse 2s infinite';
                    deviceCard.querySelector('.device-icon i').style.animation = 'speakerWave 1.5s ease-in-out infinite';
                }
            } else {
                deviceCard.classList.add('inactive');
                
                // Reset speaker animations
                if (deviceId === 'speaker') {
                    deviceCard.querySelector('.device-icon').style.animation = 'none';
                    deviceCard.querySelector('.device-icon i').style.animation = 'none';
                }
            }
            
            // Update the toggle switch state
            const toggleInput = deviceCard.querySelector('.toggle-input');
            if (toggleInput) {
                toggleInput.checked = state === 'on';
            }
        }
    }
}

// Initialize room control when the page loads
document.addEventListener('DOMContentLoaded', () => {
    const socket = io();
    new RoomControl(socket);
}); 