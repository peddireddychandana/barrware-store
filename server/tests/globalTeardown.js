module.exports = async () => {
  if (globalThis.__MMS__) await globalThis.__MMS__.stop();
};
