// public/pcm-processor.js
class PCMProcessor extends AudioWorkletProcessor {
  process(inputs, outputs, parameters) {
    const input = inputs[0];
    if (input && input.length > 0) {
      const inputChannel = input[0]; // Float32 channel data

      // Convert Float32 (-1.0 to 1.0) to 16-bit PCM ArrayBuffer
      const pcm16Buffer = new ArrayBuffer(inputChannel.length * 2);
      const dataView = new DataView(pcm16Buffer);

      for (let i = 0; i < inputChannel.length; i++) {
        const s = Math.max(-1, Math.min(1, inputChannel[i]));
        dataView.setInt16(i * 2, s < 0 ? s * 0x8000 : s * 0x7fff, true);
      }

      // Send PCM buffer back to the main thread
      this.port.postMessage(pcm16Buffer, [pcm16Buffer]);
    }
    return true; // Keep processor alive
  }
}

registerProcessor('pcm-processor', PCMProcessor);
