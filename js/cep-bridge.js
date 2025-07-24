/**
 * CEP Bridge - Communication layer between React app and Premiere Pro
 */

class CEPBridge {
    constructor() {
        this.cs = new CSInterface();
        this.callbacks = new Map();
        this.callbackId = 0;
    }
    
    /**
     * Initialize the bridge
     */
    init() {
        // Set up event listeners
        this.cs.addEventListener('com.ovistra.teamovistra.update', (event) => {
            const data = JSON.parse(event.data);
            this.handleUpdate(data);
        });
        
        // Store reference globally
        window.cepBridge = this;
    }
    
    /**
     * Call ExtendScript function
     */
    callExtendScript(functionName, ...args) {
        return new Promise((resolve, reject) => {
            const callbackId = this.callbackId++;
            this.callbacks.set(callbackId, { resolve, reject });
            
            const script = `
                try {
                    var result = TeamOvistra.${functionName}(${args.map(arg => JSON.stringify(arg)).join(',')});
                    result;
                } catch(e) {
                    JSON.stringify({ error: e.toString() });
                }
            `;
            
            this.cs.evalScript(script, (result) => {
                const callback = this.callbacks.get(callbackId);
                if (callback) {
                    this.callbacks.delete(callbackId);
                    try {
                        const parsed = result ? JSON.parse(result) : null;
                        if (parsed && parsed.error) {
                            callback.reject(new Error(parsed.error));
                        } else {
                            callback.resolve(parsed);
                        }
                    } catch (e) {
                        callback.resolve(result);
                    }
                }
            });
        });
    }
    
    /**
     * Get project information
     */
    async getProjects() {
        return this.callExtendScript('getProjects');
    }
    
    /**
     * Get active sequence
     */
    async getActiveSequence() {
        return this.callExtendScript('getActiveSequence');
    }
    
    /**
     * Apply AI editing
     */
    async applyAIEditing(channelType) {
        return this.callExtendScript('applyAIEditing', channelType);
    }
    
    /**
     * Handle updates from ExtendScript
     */
    handleUpdate(data) {
        // Dispatch custom event for React app
        window.dispatchEvent(new CustomEvent('cep-update', { detail: data }));
    }
    
    /**
     * Mock functions for development when not in CEP environment
     */
    setupMockMode() {
        console.log('CEP Bridge running in mock mode');
        
        // Override methods with mock implementations
        this.getProjects = async () => {
            return [{
                name: "Sample Project",
                path: "/path/to/project.prproj",
                sequences: [
                    {
                        name: "메인 시퀀스",
                        duration: 3600,
                        frameRate: 29.97,
                        videoTracks: 3,
                        audioTracks: 4
                    }
                ]
            }];
        };
        
        this.getActiveSequence = async () => {
            return {
                name: "메인 시퀀스",
                duration: 120.5,
                frameRate: 29.97,
                width: 1920,
                height: 1080,
                videoTracks: 3,
                audioTracks: 4,
                clipCount: 25,
                markers: []
            };
        };
        
        this.applyAIEditing = async (channelType) => {
            return {
                success: true,
                message: `Mock AI editing applied for ${channelType}`,
                sequenceName: "메인 시퀀스"
            };
        };
    }
}

// Initialize bridge
const bridge = new CEPBridge();

// Check if we're in CEP environment
if (typeof CSInterface !== 'undefined' && window.__adobe_cep__) {
    bridge.init();
} else {
    // Not in CEP environment, use mock mode
    bridge.setupMockMode();
}

// Export for use in React app
window.CEPBridge = bridge;