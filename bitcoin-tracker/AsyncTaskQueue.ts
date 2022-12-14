export class AsyncTaskQueue {
  queue: (() => Promise<void>)[] = [];
  running = false;

  async run() {
    if (this.running) {
      return;
    }
    this.running = true;
    while (this.queue.length > 0) {
      const task = this.queue.shift();
      if (task) {
        await task();
      }
    }
    this.running = false;
  }

  addTask(task: () => Promise<void>) {
    this.queue.push(task);
    this.run();
  }
}
