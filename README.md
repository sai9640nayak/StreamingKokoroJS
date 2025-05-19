# Streaming-KokoroJS

## About
Unlimited text-to-speech using [Kokoro-JS](https://github.com/hexgrad/kokoro), 100% local, 100% open source

## Online Demo (that does not send any user text data to any server.)
[https://rhulha.github.io/StreamingKokoroJS/](https://rhulha.github.io/StreamingKokoroJS/)

## Overview

Streaming-Kokoro is a web-based text-to-speech application that leverages the Kokoro-82M model to generate high-quality speech audio entirely in the browser. The application runs completely in the browser without requiring any server-side processing or API calls, ensuring privacy and offline functionality.

## Features

- **100% Client-Side Processing**: All text-to-speech conversion happens locally in your browser
- **WebGPU Acceleration**: Automatically uses WebGPU for faster processing when available, with WASM fallback
- **Streaming Audio Generation**: Processes text in chunks and streams audio as it's generated
- **Smart Text Chunking**: Intelligently splits text to maintain natural speech patterns
- **Multiple Voice Styles**: Supports various voice styles for different languages
- **Audio Download**: Save generated audio to disk
- **Fully Open Source**: Every component is open source and freely available

## Technical Details

- Uses the Kokoro-82M-v1.0-ONNX model (~300MB, cached after first load)
- Employs Web Workers for non-blocking UI during speech generation
- Automatically detects hardware capabilities and selects optimal processing mode:
  - WebGPU acceleration on compatible browsers/devices
  - WebAssembly (WASM) fallback on other devices
- Sample rate: 24kHz for high-quality audio output

## Getting Started

1. Clone this repository
2. Serve the files using a local web server
3. Open the application in a modern browser (Chrome/Edge recommended for WebGPU support)
4. Enter or paste text into the text area
5. Click "Play" to stream the audio or "Download" to save it to disk

## Local Model

The application can use a local model instead of downloading from HuggingFace. Example:

```
if (self.location.hostname === "localhost") {
  env.allowLocalModels = true;
  model_id = "./my_model/";
}
```

## Model Information

This project uses the [Kokoro-82M-v1.0-ONNX](https://huggingface.co/onnx-community/Kokoro-82M-v1.0-ONNX) model from Hugging Face, which provides high-quality text-to-speech capabilities in a relatively compact package suitable for browser-based applications.

## Browser Compatibility

- **Recommended**: Chromium-based browsers with WebGPU support (Chrome, Edge, etc.)
- **Compatible**: Any modern browser with WebAssembly support. (FireFox seems not to work at the moment.)

## License

This project is open source under the Apache 2 License.

## Acknowledgments

- [Kokoro](https://github.com/hexgrad/kokoro)  is an open-weight TTS model with 82 million parameters.
- [Hugging Face Transformers.js](https://huggingface.co/docs/transformers.js) for the browser-based ML framework
- [Kokoro-82M Model](https://huggingface.co/onnx-community/Kokoro-82M-v1.0-ONNX) for the TTS capabilities
