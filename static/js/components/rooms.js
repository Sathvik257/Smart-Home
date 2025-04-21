class Rooms {
    constructor(socket) {
        this.socket = socket;
        this.rooms = {};
        this.initializeRooms();
    }

    initializeRooms() {
        const roomGrid = document.querySelector('.room-grid');
        if (!roomGrid) return;

        // Sample room data - in a real app, this would come from the server
        this.rooms = {
            livingRoom: {
                name: 'Living Room',
                devices: ['lights', 'tv', 'thermostat'],
                icon: 'fas fa-couch'
            },
            bedroom: {
                name: 'Bedroom',
                devices: ['lights', 'thermostat', 'curtains'],
                icon: 'fas fa-bed'
            },
            kitchen: {
                name: 'Kitchen',
                devices: ['lights', 'fan'],
                icon: 'fas fa-utensils'
            },
            bathroom: {
                name: 'Bathroom',
                devices: ['lights', 'fan'],
                icon: 'fas fa-bath'
            }
        };

        // Create room cards
        Object.entries(this.rooms).forEach(([roomId, room]) => {
            const roomCard = this.createRoomCard(roomId, room);
            roomGrid.appendChild(roomCard);
        });
    }

    createRoomCard(roomId, room) {
        const card = document.createElement('div');
        card.className = 'room-card';
        card.setAttribute('data-room', roomId);

        const devices = room.devices.map(device => {
            const deviceState = this.getDeviceState(device);
            return `
                <div class="room-device" data-device="${device}">
                    <i class="fas ${this.getDeviceIcon(device)}"></i>
                    <span class="device-name">${this.formatDeviceName(device)}</span>
                    <div class="toggle-switch">
                        <input type="checkbox" id="${roomId}-${device}-toggle" 
                               class="toggle-input" ${deviceState ? 'checked' : ''}>
                        <label for="${roomId}-${device}-toggle" class="toggle-label"></label>
                    </div>
                </div>
            `;
        }).join('');

        card.innerHTML = `
            <div class="room-header">
                <i class="${room.icon}"></i>
                <h3>${room.name}</h3>
            </div>
            <div class="room-devices">
                ${devices}
            </div>
        `;

        // Add event listeners to device toggles
        card.querySelectorAll('.toggle-input').forEach(toggle => {
            toggle.addEventListener('change', (e) => {
                const device = e.target.id.split('-')[1];
                this.updateDevice(device, e.target.checked);
            });
        });

        return card;
    }

    getDeviceIcon(device) {
        const icons = {
            lights: 'fa-lightbulb',
            tv: 'fa-tv',
            thermostat: 'fa-thermometer-half',
            curtains: 'fa-blinds',
            fan: 'fa-fan'
        };
        return icons[device] || 'fa-question';
    }

    formatDeviceName(device) {
        return device.charAt(0).toUpperCase() + device.slice(1);
    }

    getDeviceState(device) {
        // In a real app, this would get the state from the server
        return false;
    }

    updateDevice(device, value) {
        // Update UI
        this.updateDeviceUI(device, value);
        
        // Send update to server
        this.socket.emit('device_update', {
            device: device,
            value: value
        });

        // Add to activity feed
        this.addActivity(`${device} ${value ? 'turned on' : 'turned off'}`);
    }

    updateDeviceUI(device, value) {
        // Update all instances of this device across room cards
        document.querySelectorAll(`[data-device="${device}"] .toggle-input`).forEach(toggle => {
            toggle.checked = value;
        });
    }

    addActivity(text) {
        const activityFeed = document.getElementById('activityFeed');
        if (activityFeed) {
            const activityItem = document.createElement('div');
            activityItem.className = 'activity-item';
            activityItem.innerHTML = `
                <span class="activity-time">${new Date().toLocaleTimeString()}</span>
                <span class="activity-text">${text}</span>
            `;
            activityFeed.insertBefore(activityItem, activityFeed.firstChild);
        }
    }
}

export default Rooms; 