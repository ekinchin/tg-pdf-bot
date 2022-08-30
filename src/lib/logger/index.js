/* eslint-disable no-console */
class Logger {
  /**
   *
   * @param {import('./index').LogMessage} param0
   */
  static log({ message }) {
    console.log(new Date().toUTCString() + ': ' + message);
  }
}

export default Logger;
