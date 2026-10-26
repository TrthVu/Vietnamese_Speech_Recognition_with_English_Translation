class AudioChunker extends AudioWorkletProcessor {
  constructor(options) {
    super();
    this.chunkSize = options.processorOptions.chunkSize;
    this.samples = new Float32Array(this.chunkSize);
    this.offset = 0;
  }

  process(inputs, outputs) {
    const input = inputs[0] || [];
    const output = outputs[0] || [];
    const frames = input[0]?.length || 0;

    // Keep the captured tab audible while forwarding its mono audio.
    for (let channel = 0; channel < output.length; channel += 1) {
      const destination = output[channel];
      const source = input[Math.min(channel, input.length - 1)];
      if (source) destination.set(source);
      else destination.fill(0);
    }

    if (!frames) return true;
    const channelCount = input.length;
    for (let frame = 0; frame < frames; frame += 1) {
      let mono = 0;
      for (let channel = 0; channel < channelCount; channel += 1) mono += input[channel][frame];
      this.samples[this.offset] = mono / channelCount;
      this.offset += 1;

      if (this.offset === this.chunkSize) {
        const chunk = this.samples;
        this.port.postMessage(chunk.buffer, [chunk.buffer]);
        this.samples = new Float32Array(this.chunkSize);
        this.offset = 0;
      }
    }
    return true;
  }
}

registerProcessor("audio-chunker", AudioChunker);
