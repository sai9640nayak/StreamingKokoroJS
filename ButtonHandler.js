import { updateProgress } from "./updateProgress.js";

export class ButtonHandler {
    constructor(worker, audioPlayer, audioDiskSaver) {
        this.worker = worker;
        this.audioPlayer = audioPlayer;
        this.audioDiskSaver = audioDiskSaver;
        this.mode = "none";
        this.isStreaming = false;

        // Bind methods to maintain 'this' context
        this.handleStreamButtonClick = this.handleStreamButtonClick.bind(this);
        this.handleDiskButtonClick = this.handleDiskButtonClick.bind(this);
    }

    init() {
        document.getElementById("streamAudioContext").addEventListener("click", this.handleStreamButtonClick);
        document.getElementById("streamDisk").addEventListener("click", this.handleDiskButtonClick);
    }    showButtonContent(button, contentType) {
        // Hide all content spans first
        const allContents = button.querySelectorAll('.btn-content');
        allContents.forEach(content => {
            content.style.display = 'none';
        });

        let contentClass;
        switch (contentType) {
            case 'play':
                contentClass = '.play-content';
                break;
            case 'stop':
                contentClass = '.stop-content';
                break;
            case 'loading':
                contentClass = '.loading-content';
                break;
            case 'download':
                contentClass = '.download-content';
                break;
            case 'download-loading':
                contentClass = '.download-loading-content';
                break;
            case 'stop-download':
                contentClass = '.stop-content';
                break;
            default:
                console.error('Unknown content type:', contentType);
                return;
        }

        const contentToShow = button.querySelector(contentClass);
        if (contentToShow) {
            contentToShow.style.display = 'inline-flex';
        }
    }    enableButtons() {
        const streamBtn = document.getElementById("streamAudioContext");
        const diskBtn = document.getElementById("streamDisk");

        if (this.isStreaming) {
            return;
        }
        streamBtn.disabled = false;
        diskBtn.disabled = false;

        // Remove any state classes
        streamBtn.classList.remove("loading", "stop-streaming", "has-content");
        diskBtn.classList.remove("loading", "stop-saving", "has-content");

        // Show play content, hide stop and loading content
        this.showButtonContent(streamBtn, "play");
        this.showButtonContent(diskBtn, "download");
    }

    updateStreamButtonToStop() {
        const streamBtn = document.getElementById("streamAudioContext");
        if (streamBtn.classList.contains("loading")) {
            streamBtn.disabled = false;
            streamBtn.classList.remove("loading");
            streamBtn.classList.add("stop-streaming", "has-content");
            this.showButtonContent(streamBtn, "stop");
        }
    }

    resetStreamButton() {
        const streamBtn = document.getElementById("streamAudioContext");
        streamBtn.disabled = false;
        streamBtn.classList.remove("loading", "stop-streaming", "has-content");
        // Show play content, hide stop and loading content
        this.showButtonContent(streamBtn, "play");
        // Log for debugging
        console.log("Button reset to play state");
    }

    handleStreamButtonClick() {
        if (this.isStreaming) {
            this.mode = "none";
            this.isStreaming = false;
            this.audioPlayer.stop();
            updateProgress(100, "Streaming stopped");
            // Use our dedicated function to reset the button
            setTimeout(() => {
                this.resetStreamButton();
                document.getElementById("streamDisk").disabled = false;
            }, 50); // Small delay to ensure clean state transition
            return;
        }

        const streamBtn = document.getElementById("streamAudioContext");

        streamBtn.classList.add("loading", "has-content");
        this.showButtonContent(streamBtn, "loading");

        // Only disable the disk button, but NOT the stream button
        document.getElementById("streamDisk").disabled = true;

        this.mode = "stream";
        this.isStreaming = true;
        let text = document.getElementById("ta").value;
        updateProgress(0, "Initializing audio streaming...");

        // Set estimated chunks based on text length, similar to disk mode
        this.audioPlayer.setTotalChunks(text.length / 300); // rough estimate based on chunk size

        this.worker.postMessage({ type: "generate", text: text, voice: "af" });
    }
    
    async handleDiskButtonClick() {
        // If already running a disk save, stop it
        if (this.mode === "disk") {
            this.mode = "none";
            // Send stop message to worker first
            this.worker.postMessage({ type: "stop" });
            this.audioDiskSaver.stopSave();
            updateProgress(100, "Disk save stopped");
            // Reset buttons after stopping
            setTimeout(() => {
                this.resetDiskButton();
                document.getElementById("streamAudioContext").disabled = false;
            }, 50); // Small delay to ensure clean state transition
            return;
        }

        const diskBtn = document.getElementById("streamDisk");

        // Show loading animation and disable both buttons
        diskBtn.classList.add("loading", "has-content");
        this.showButtonContent(diskBtn, "download-loading");

        document.getElementById("streamAudioContext").disabled = true;
        diskBtn.disabled = true;

        this.mode = "disk";

        try {
            updateProgress(0, "Preparing to save audio...");
            await this.audioDiskSaver.initSave();
            let text = document.getElementById("ta").value;
            // Set estimated chunks based on text length
            this.audioDiskSaver.setTotalChunks(text.length / 100); // rough estimate based on chunk size
            updateProgress(0, "Processing audio for saving...");
            this.worker.postMessage({ type: "generate", text: text, voice: "af" });
        } catch (error) {
            console.error("Error initializing disk save:", error);
            updateProgress(100, "Error initializing file save!");
            this.enableButtons();
        }
    }
    
    resetDiskButton() {
        const diskBtn = document.getElementById("streamDisk");
        diskBtn.disabled = false;
        diskBtn.classList.remove("loading", "stop-saving", "has-content");
        this.showButtonContent(diskBtn, "download");
        console.log("Disk button reset to download state");
    }
    
    updateDiskButtonToStop() {
        const diskBtn = document.getElementById("streamDisk");
        if (diskBtn.classList.contains("loading")) {
            diskBtn.disabled = false;
            diskBtn.classList.remove("loading");
            diskBtn.classList.add("stop-saving", "has-content");
            this.showButtonContent(diskBtn, "stop-download");
        }
    }

    getMode() {
        return this.mode;
    }

    setMode(newMode) {
        this.mode = newMode;
    }

    isCurrentlyStreaming() {
        return this.isStreaming;
    }

    setStreaming(state) {
        this.isStreaming = state;
    }
}
