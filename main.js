import { updateProgress } from "./updateProgress.js";
import { AudioPlayer } from "./AudioPlayer.js";
import { AudioDiskSaver } from "./AudioDiskSaver.js";
import { ButtonHandler } from "./ButtonHandler.js";

if (window.location.hostname === "localhost") {
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("./service-worker.js").then(() => {
      console.log("Service Worker registered.");
    });
  }
}

let tts_worker = new Worker(new URL("./worker.js", import.meta.url), { type: "module" });
let audioPlayer = new AudioPlayer(tts_worker);
let audioDiskSaver = new AudioDiskSaver();
let buttonHandler = new ButtonHandler(tts_worker, audioPlayer, audioDiskSaver);

function populateVoiceSelector(voices) {
  const voiceSelector = document.getElementById("voiceSelector");
  // Clear any existing options
  while (voiceSelector.options.length > 0) {
    voiceSelector.remove(0);
  }

  // Group voices by category (based on prefix) and gender
  const voiceGroups = {};
  let heartVoice = null;

  for (const [id, voice] of Object.entries(voices)) {
    if (id === "af_heart") {
      heartVoice = { id, name: voice.name, language: voice.language };
      continue;
    }
    const category = id.split('_')[0];
    const groupKey = `${category} - ${voice.gender}`;
    if (!voiceGroups[groupKey]) {
      voiceGroups[groupKey] = [];
    }
    voiceGroups[groupKey].push({ id, name: voice.name, language: voice.language });
  }

  // Sort groups alphabetically
  const sortedGroups = Object.keys(voiceGroups).sort();

  // Add optgroups and options
  for (const groupKey of sortedGroups) {
    const [category, gender] = groupKey.split(' - ');
    const optgroup = document.createElement('optgroup');
    optgroup.label = `${gender} Voices (${category.toUpperCase()})`;
    // Sort voices within the group by name
    voiceGroups[groupKey].sort((a, b) => a.name.localeCompare(b.name));
    // If this is the AF Female group, insert Heart at the top
    if (category === "af" && gender === "Female" && heartVoice) {
      const option = document.createElement('option');
      option.value = heartVoice.id;
      option.textContent = `${heartVoice.name} (${heartVoice.language})`;
      option.selected = true;
      optgroup.appendChild(option);
    }
    for (const voice of voiceGroups[groupKey]) {
      const option = document.createElement('option');
      option.value = voice.id;
      option.textContent = `${voice.name} (${voice.language})`;
      // If Heart wasn't found, select the first option
      if (!heartVoice && voiceSelector.options.length === 0) {
        option.selected = true;
      }
      optgroup.appendChild(option);
    }
    voiceSelector.appendChild(optgroup);
  }
  voiceSelector.disabled = false;
}

const onMessageReceived = async (e) => {switch (e.data.status) {
    case "loading_model_start":
      console.log(e.data);
      updateProgress(0, "Loading model...");
      break;

    case "loading_model_ready":
      buttonHandler.enableButtons();
      updateProgress(100, "Model loaded successfully");
      
      // Populate voice selector if voices are available
      if (e.data.voices) {
        populateVoiceSelector(e.data.voices);
      }
      break;

    case "loading_model_progress":
      let progress = Number(e.data.progress) * 100;
      if (isNaN(progress)) progress = 0;
      updateProgress(progress, `Loading model: ${Math.round(progress)}%`);
      break;

    case "stream_audio_data":
      if (buttonHandler.getMode() === "disk") {
        const percent = await audioDiskSaver.addAudioChunk(e.data.audio);
        updateProgress(percent, "Processing audio for saving...");
        // Update the disk button to the stop state if it's still loading
        buttonHandler.updateDiskButtonToStop();
        // Notify worker when buffer has been processed in disk mode
        tts_worker.postMessage({ type: "buffer_processed" });
      } else if (buttonHandler.getMode() === "stream") {
        // Update the stream button to the stop state if it's still loading
        buttonHandler.updateStreamButtonToStop();
        // In stream mode, the buffer_processed notification is actually handled in AudioPlayer.js.
        // as well as the updateProgress() call.
        await audioPlayer.queueAudio(e.data.audio);
      }
      break;

    case "complete":
      if (buttonHandler.getMode() === "disk") {
        try {
          updateProgress(99, "Combining audio chunks...");
          updateProgress(99.5, "Writing file to disk...");
          await audioDiskSaver.finalizeSave();
          updateProgress(100, "File saved successfully!");
        } catch (error) {
          console.error("Error combining audio chunks:", error);
          updateProgress(100, "Error saving file!");
        }
        buttonHandler.setMode("none");
        // Reset the disk button state after saving is complete
        buttonHandler.resetDiskButton();
        document.getElementById("streamAudioContext").disabled = false;
      } else if (buttonHandler.getMode() === "stream") {
        // Only reset streaming state when complete is received and we're still in streaming mode
        buttonHandler.setStreaming(false);
        buttonHandler.setMode("none");
        updateProgress(100, "Streaming complete");

        // Use resetStreamButton instead of enableButtons
        buttonHandler.resetStreamButton();
        document.getElementById("streamDisk").disabled = false;
      } else {
        // For any other mode, use the standard enableButtons function
        buttonHandler.enableButtons();
      }
      break;
  }
};

const onErrorReceived = (e) => {
  console.error("Worker error:", e);
  // Get the current mode before resetting it
  const currentMode = buttonHandler.getMode();
  buttonHandler.setStreaming(false);
  buttonHandler.setMode("none");
  updateProgress(100, "An error occurred! Please try again.");
  
  // Reset the appropriate button based on the mode we were in
  if (currentMode === "disk") {
    buttonHandler.resetDiskButton();
    document.getElementById("streamAudioContext").disabled = false;
  } else {
    buttonHandler.resetStreamButton();
    document.getElementById("streamDisk").disabled = false;
  }
};

tts_worker.addEventListener("message", onMessageReceived);
tts_worker.addEventListener("error", onErrorReceived);

document.addEventListener('DOMContentLoaded', async () => {
  updateProgress(0, "Initializing Kokoro model...");
  document.getElementById("progressContainer").style.display = "block";
  document.getElementById("ta").value = await (await fetch('./end.txt')).text();
  buttonHandler.init();
});

window.addEventListener("beforeunload", () => {
  audioPlayer.close();
});
