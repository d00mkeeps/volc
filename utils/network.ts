/**
 * Returns the local IP address of the development machine.
 * This is used for the mobile app to connect to the backend during local development.
 * Note: If your network IP changes, update this value.
 */
export const getLocalIpAddress = async (): Promise<string> => {
  return "172.20.10.14";
};
