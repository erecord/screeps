const logger = {
  info(message: string) {
    console.log(message);
  },
  warn(message: string) {
    console.log(`WARN: ${message}`);
    Game.notify(`WARN: ${message}`);
  },
  notify(message: string) {
    Game.notify(message);
  },
};

export default logger;
