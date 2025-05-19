const SAMPLE_RATE = 23000; // a bit slower than 24000

export class AudioDiskSaver {
  constructor() {
    this.audioContext = new AudioContext();
    this.fileStream = null;
    this.totalAudioChunks = 0;
    this.processedAudioChunks = 0;
    this.headerWritten = false;
    this.bytesWritten = 0;
    // For WAV header updates
    this.fileSize = 0;
    this.dataSize = 0;
  }

  async initSave() {
    try {
      const fileHandle = await window.showSaveFilePicker({
        suggestedName: "audio_stream.wav",
        types: [
          {
            description: "Audio Files",
            accept: { "audio/wav": [".wav"] },
          },
        ],
      });
      
      this.fileStream = await fileHandle.createWritable();
      // Write placeholder WAV header (will be updated at the end)
      await this.writeWavHeader();
      this.headerWritten = true;
    } catch (error) {
      console.error("Error initializing file save:", error);
      throw error;
    }
  }

  setTotalChunks(totalChunks) {
    this.totalAudioChunks = totalChunks;
    this.processedAudioChunks = 0;
  }

  async addAudioChunk(audioData) {
    try {
      if (!this.fileStream) {
        throw new Error("File stream not initialized");
      }
      await this.fileStream.write(audioData);
      this.dataSize += audioData.byteLength;
      this.processedAudioChunks++;
      return Math.min((this.processedAudioChunks / this.totalAudioChunks) * 100, 99);
    } catch (error) {
      console.error("Error processing audio chunk:", error);
      throw error;
    }
  }

  async finalizeSave() {
    if (!this.fileStream) {
      throw new Error("No file stream available");
    }
    try {
      // Update the WAV header with final sizes
      await this.updateWavHeader();
      await this.fileStream.close();
      this.reset();
      return true;
    } catch (error) {
      console.error("Error finalizing audio save:", error);
      if (this.fileStream) {
        await this.fileStream.close();
      }
      this.reset();
      throw error;
    }
  }
  async stopSave() {
    if (!this.fileStream) {
      console.log("No active file stream to stop");
      return;
    }
    try {
      // Give the worker a moment to process the stop message
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Update the WAV header before closing to ensure a valid WAV file
      await this.updateWavHeader();
      await this.fileStream.close();
      console.log("Disk save operation stopped");
      this.reset();
      return true;
    } catch (error) {
      console.error("Error stopping disk save:", error);
      if (this.fileStream) {
        try {
          await this.fileStream.close();
        } catch (closeError) {
          console.error("Error closing file stream:", closeError);
        }
      }
      this.reset();
      return false;
    }
  }

  reset() {
    this.fileStream = null;
    this.processedAudioChunks = 0;
    this.headerWritten = false;
    this.bytesWritten = 0;
    this.fileSize = 0;
    this.dataSize = 0;
  }

  getProgress() {
    return Math.min((this.processedAudioChunks / this.totalAudioChunks) * 100, 99);
  }

  // Write WAV header at the start
  async writeWavHeader() {
    const headerBuffer = new ArrayBuffer(44);
    const view = new DataView(headerBuffer);

    function writeString(view, offset, string) {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
      }
    }
    
    // "RIFF" chunk descriptor
    writeString(view, 0, 'RIFF');
    
    // Placeholder for file size (updated later)
    view.setUint32(4, 0, true);
    
    // "WAVE" format
    writeString(view, 8, 'WAVE');
    
    // "fmt " subchunk
    writeString(view, 12, 'fmt ');
    
    view.setUint32(16, 16, true); // Subchunk1Size (16 for PCM)
    view.setUint16(20, 3, true);  // AudioFormat (3 for float)
    view.setUint16(22, 1, true);  // NumChannels (1 for mono)
    view.setUint32(24, SAMPLE_RATE, true); // SampleRate
    view.setUint32(28, SAMPLE_RATE * 4, true); // ByteRate (SampleRate * NumChannels * BitsPerSample/8)
    view.setUint16(32, 4, true);  // BlockAlign (NumChannels * BitsPerSample/8)
    view.setUint16(34, 32, true); // BitsPerSample (32 for float)
    
    // "data" subchunk
    writeString(view, 36, 'data');
    
    // Placeholder for data size (updated later)
    view.setUint32(40, 0, true);
    
    await this.fileStream.write(headerBuffer);
    this.bytesWritten = 44; // Header size
  }

  // Update the WAV header with final sizes
  async updateWavHeader() {
    // File size = header (44) + data size
    this.fileSize = this.dataSize + 36; // 36 bytes of header info + data size
    
    // Seek to file size position (offset 4) and update
    await this.fileStream.seek(4);
    const fileSizeBuffer = new ArrayBuffer(4);
    new DataView(fileSizeBuffer).setUint32(0, this.fileSize, true);
    await this.fileStream.write(fileSizeBuffer);
    
    // Seek to data size position (offset 40) and update
    await this.fileStream.seek(40);
    const dataSizeBuffer = new ArrayBuffer(4);
    new DataView(dataSizeBuffer).setUint32(0, this.dataSize, true);
    await this.fileStream.write(dataSizeBuffer);
  }
}
