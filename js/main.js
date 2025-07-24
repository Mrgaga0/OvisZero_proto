/**
 * Main entry point for the CEP panel
 * This file loads the React app in the CEP environment
 */

// Wait for DOM to be ready
document.addEventListener('DOMContentLoaded', function() {
    console.log('Team Ovistra CEP Panel Loading...');
    
    // Create a simple loader while React loads
    const root = document.getElementById('root');
    root.innerHTML = `
        <div style="display: flex; align-items: center; justify-content: center; height: 100vh; flex-direction: column;">
            <div style="color: #00FF88; font-size: 24px; margin-bottom: 20px;">Team Ovistra</div>
            <div style="color: #CCCCCC;">Loading...</div>
        </div>
    `;
    
    // Load React app
    loadReactApp();
});

function loadReactApp() {
    // Since we can't use ES modules directly in CEP, we'll need to transform the React components
    // For now, we'll create a simplified version that works with CEP
    
    const { createElement: h, useState, useEffect } = React;
    const { render } = ReactDOM;
    
    // Simple version of the App component for CEP
    function App() {
        const [projectStatus, setProjectStatus] = useState({
            hasSubtitles: false,
            projectName: '',
            projectPath: '',
            timeline: {
                detected: false,
                duration: ''
            },
            isReady: false
        });
        
        const [selectedChannel, setSelectedChannel] = useState(null);
        const [aiStatus, setAiStatus] = useState('idle');
        const [progress, setProgress] = useState(0);
        
        // Check project status on mount
        useEffect(() => {
            checkProjectStatus();
            
            // Listen for CEP updates
            window.addEventListener('cep-update', handleCEPUpdate);
            
            return () => {
                window.removeEventListener('cep-update', handleCEPUpdate);
            };
        }, []);
        
        async function checkProjectStatus() {
            try {
                const sequence = await window.CEPBridge.getActiveSequence();
                if (sequence && !sequence.error) {
                    setProjectStatus({
                        hasSubtitles: false,
                        projectName: sequence.name,
                        projectPath: 'Active Project',
                        timeline: {
                            detected: true,
                            duration: formatDuration(sequence.duration)
                        },
                        isReady: true
                    });
                }
            } catch (error) {
                console.error('Error checking project status:', error);
            }
        }
        
        function handleCEPUpdate(event) {
            const data = event.detail;
            // Handle updates from ExtendScript
            console.log('CEP Update:', data);
        }
        
        function formatDuration(seconds) {
            const hours = Math.floor(seconds / 3600);
            const minutes = Math.floor((seconds % 3600) / 60);
            const secs = Math.floor(seconds % 60);
            return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        }
        
        async function handleMagicButtonClick() {
            if (!selectedChannel || aiStatus === 'processing') return;
            
            setAiStatus('processing');
            setProgress(0);
            
            // Simulate progress
            const progressInterval = setInterval(() => {
                setProgress(prev => {
                    if (prev >= 90) {
                        clearInterval(progressInterval);
                        return 90;
                    }
                    return prev + 10;
                });
            }, 500);
            
            try {
                const result = await window.CEPBridge.applyAIEditing(selectedChannel.type);
                clearInterval(progressInterval);
                setProgress(100);
                setAiStatus('complete');
                
                setTimeout(() => {
                    setAiStatus('idle');
                    setProgress(0);
                }, 3000);
            } catch (error) {
                clearInterval(progressInterval);
                setAiStatus('error');
                console.error('Error applying AI editing:', error);
                
                setTimeout(() => {
                    setAiStatus('idle');
                    setProgress(0);
                }, 3000);
            }
        }
        
        // Simplified UI for CEP
        return h('div', { 
            style: { 
                padding: '20px',
                height: '100vh',
                display: 'flex',
                flexDirection: 'column',
                backgroundColor: '#1E1E1E',
                color: '#FFFFFF'
            } 
        },
            h('div', { style: { marginBottom: '20px' } },
                h('h1', { style: { fontSize: '24px', color: '#00FF88', margin: 0 } }, 'Team Ovistra'),
                h('p', { style: { fontSize: '14px', color: '#CCCCCC', margin: '5px 0' } }, 
                    'AI-Powered Video Editing Assistant')
            ),
            
            // Project Status
            h('div', { 
                style: { 
                    backgroundColor: '#252525',
                    padding: '15px',
                    borderRadius: '8px',
                    marginBottom: '20px'
                } 
            },
                h('h3', { style: { margin: '0 0 10px 0', fontSize: '16px' } }, 'Project Status'),
                projectStatus.isReady ? 
                    h('div', null,
                        h('p', { style: { margin: '5px 0', fontSize: '14px' } }, 
                            `Project: ${projectStatus.projectName}`),
                        h('p', { style: { margin: '5px 0', fontSize: '14px' } }, 
                            `Duration: ${projectStatus.timeline.duration}`)
                    ) :
                    h('p', { style: { color: '#FF6B6B', fontSize: '14px' } }, 
                        'No active sequence detected')
            ),
            
            // Channel Selection
            h('div', { 
                style: { 
                    backgroundColor: '#252525',
                    padding: '15px',
                    borderRadius: '8px',
                    marginBottom: '20px'
                } 
            },
                h('h3', { style: { margin: '0 0 10px 0', fontSize: '16px' } }, 'Select Channel'),
                h('div', { style: { display: 'flex', gap: '10px', flexWrap: 'wrap' } },
                    ['youtube', 'instagram', 'tiktok'].map(type =>
                        h('button', {
                            key: type,
                            onClick: () => setSelectedChannel({ type, name: type.charAt(0).toUpperCase() + type.slice(1) }),
                            style: {
                                padding: '8px 16px',
                                borderRadius: '6px',
                                border: selectedChannel?.type === type ? '2px solid #00FF88' : '1px solid #555',
                                backgroundColor: selectedChannel?.type === type ? '#00FF88' : '#2D2D2D',
                                color: selectedChannel?.type === type ? '#1E1E1E' : '#FFFFFF',
                                cursor: 'pointer',
                                fontSize: '14px',
                                textTransform: 'capitalize'
                            }
                        }, type)
                    )
                )
            ),
            
            // Magic Button
            h('div', { style: { flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' } },
                h('button', {
                    onClick: handleMagicButtonClick,
                    disabled: !projectStatus.isReady || !selectedChannel || aiStatus === 'processing',
                    style: {
                        width: '200px',
                        height: '200px',
                        borderRadius: '50%',
                        border: 'none',
                        backgroundColor: aiStatus === 'processing' ? '#555' : 
                                       aiStatus === 'complete' ? '#4CAF50' :
                                       aiStatus === 'error' ? '#FF6B6B' : '#00FF88',
                        color: '#1E1E1E',
                        fontSize: '18px',
                        fontWeight: 'bold',
                        cursor: (!projectStatus.isReady || !selectedChannel || aiStatus === 'processing') ? 
                                'not-allowed' : 'pointer',
                        transition: 'all 0.3s ease',
                        opacity: (!projectStatus.isReady || !selectedChannel) ? 0.5 : 1
                    }
                },
                    aiStatus === 'processing' ? `Processing... ${progress}%` :
                    aiStatus === 'complete' ? 'Complete!' :
                    aiStatus === 'error' ? 'Error!' :
                    'Apply Magic'
                )
            ),
            
            // Status Bar
            h('div', { 
                style: { 
                    backgroundColor: '#252525',
                    padding: '10px',
                    borderRadius: '6px',
                    fontSize: '12px',
                    color: '#CCCCCC',
                    textAlign: 'center'
                } 
            },
                aiStatus === 'idle' ? 'Ready to apply AI editing' :
                aiStatus === 'processing' ? 'AI is analyzing and editing...' :
                aiStatus === 'complete' ? 'AI editing completed successfully!' :
                'An error occurred during AI editing'
            )
        );
    }
    
    // Render the app
    const root = document.getElementById('root');
    render(h(App), root);
}