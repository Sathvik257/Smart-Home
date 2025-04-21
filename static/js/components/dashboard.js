class Dashboard {
    constructor(socket) {
        this.socket = socket;
        this.initializeDeviceControls();
        this.initializeQuickActions();
    }

    initializeDeviceControls() {
        // Initialize toggle switches
        const toggleSwitches = document.querySelectorAll('.toggle-input');
        toggleSwitches.forEach(switchEl => {
            switchEl.addEventListener('change', (e) => {
                const device = e.target.id.split('-')[0];
                const value = e.target.checked;
                this.updateDevice(device, value);
            });
        });

        // Initialize thermostat
        const thermoSlider = document.getElementById('thermoSlider');
        if (thermoSlider) {
            thermoSlider.addEventListener('change', (e) => {
                this.updateDevice('thermostat', parseInt(e.target.value));
            });
        }
    }

    initializeQuickActions() {
        const actionButtons = document.querySelectorAll('.btn-action');
        actionButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                const action = e.target.id;
                this.executeQuickAction(action);
            });
        });
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
        const toggleElement = document.getElementById(`${device}-toggle`);
        if (toggleElement) {
            toggleElement.checked = value;
        }

        // Special handling for specific devices
        if (device === 'thermostat') {
            const tempDisplay = document.querySelector('.temperature-display');
            if (tempDisplay) {
                tempDisplay.textContent = `${value}°C`;
            }
        } else if (device === 'security') {
            const statusElement = document.querySelector('.security-status');
            if (statusElement) {
                statusElement.textContent = value ? 'System Armed' : 'System Disarmed';
                statusElement.style.color = value ? 'var(--success)' : 'var(--error)';
            }
        }
    }

    executeQuickAction(action) {
        const scenes = {
            goodMorning: {
                lights: true,
                thermostat: 22,
                curtains: true
            },
            leaveHome: {
                lights: false,
                security: true,
                thermostat: 18
            },
            goodNight: {
                lights: false,
                security: true,
                thermostat: 20,
                curtains: false
            },
            entertainment: {
                lights: true,
                tv: true,
                music: true
            }
        };

        if (scenes[action]) {
            Object.entries(scenes[action]).forEach(([device, value]) => {
                this.updateDevice(device, value);
            });
            this.addActivity(`Scene activated: ${action.replace(/([A-Z])/g, ' $1').trim()}`);
        }
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

export default Dashboard; 