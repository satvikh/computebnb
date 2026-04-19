export class LogBuffer {
  private value = "";
  private bytes = 0;
  private didTruncate = false;

  constructor(private readonly maxBytes: number) {}

  append(chunk: string) {
    const chunkBytes = Buffer.byteLength(chunk);

    if (this.bytes + chunkBytes <= this.maxBytes) {
      this.value += chunk;
      this.bytes += chunkBytes;
      return;
    }

    this.didTruncate = true;
    const remaining = Math.max(0, this.maxBytes - this.bytes);
    if (remaining > 0) {
      this.value += Buffer.from(chunk).subarray(0, remaining).toString();
      this.bytes = this.maxBytes;
    }
  }

  toString() {
    return this.value;
  }

  get truncated() {
    return this.didTruncate;
  }
}
