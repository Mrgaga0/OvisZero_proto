// ExtendScript for Premiere Pro
// This file runs in the Premiere Pro context and can access its API

// Get all open projects
function getProjects() {
    try {
        var projects = [];
        if (app.project) {
            var project = app.project;
            projects.push({
                name: project.name,
                path: project.path,
                sequences: getSequences()
            });
        }
        return JSON.stringify(projects);
    } catch (e) {
        return JSON.stringify({ error: e.toString() });
    }
}

// Get all sequences in the current project
function getSequences() {
    var sequences = [];
    try {
        var project = app.project;
        if (project && project.sequences) {
            for (var i = 0; i < project.sequences.numSequences; i++) {
                var seq = project.sequences[i];
                sequences.push({
                    name: seq.name,
                    duration: seq.end - seq.zero,
                    frameRate: seq.timebase,
                    videoTracks: seq.videoTracks.numTracks,
                    audioTracks: seq.audioTracks.numTracks
                });
            }
        }
    } catch (e) {
        // Handle error
    }
    return sequences;
}

// Get active sequence information
function getActiveSequence() {
    try {
        var activeSeq = app.project.activeSequence;
        if (activeSeq) {
            var info = {
                name: activeSeq.name,
                duration: (activeSeq.end - activeSeq.zero) / activeSeq.timebase,
                frameRate: activeSeq.timebase,
                width: activeSeq.frameSizeHorizontal,
                height: activeSeq.frameSizeVertical,
                videoTracks: activeSeq.videoTracks.numTracks,
                audioTracks: activeSeq.audioTracks.numTracks,
                markers: getSequenceMarkers(activeSeq)
            };
            
            // Count clips
            var clipCount = 0;
            for (var i = 0; i < activeSeq.videoTracks.numTracks; i++) {
                var track = activeSeq.videoTracks[i];
                clipCount += track.clips.numItems;
            }
            info.clipCount = clipCount;
            
            return JSON.stringify(info);
        }
        return JSON.stringify({ error: "No active sequence" });
    } catch (e) {
        return JSON.stringify({ error: e.toString() });
    }
}

// Get sequence markers
function getSequenceMarkers(sequence) {
    var markers = [];
    try {
        if (sequence.markers) {
            var marker = sequence.markers.getFirstMarker();
            while (marker) {
                markers.push({
                    time: marker.start.seconds,
                    comment: marker.comments,
                    name: marker.name,
                    type: marker.type
                });
                marker = sequence.markers.getNextMarker(marker);
            }
        }
    } catch (e) {
        // Handle error
    }
    return markers;
}

// Apply AI editing (mock implementation)
function applyAIEditing(channelType) {
    try {
        var activeSeq = app.project.activeSequence;
        if (!activeSeq) {
            return JSON.stringify({ error: "No active sequence" });
        }
        
        // This is where actual AI editing logic would go
        // For now, we'll just return a success message
        return JSON.stringify({
            success: true,
            message: "AI editing applied for " + channelType,
            sequenceName: activeSeq.name
        });
    } catch (e) {
        return JSON.stringify({ error: e.toString() });
    }
}

// Export functions to be available from CEP
var TeamOvistra = {
    getProjects: getProjects,
    getActiveSequence: getActiveSequence,
    applyAIEditing: applyAIEditing
};