import * as Network from 'expo-network';

export const getLocalIpAddress = async (): Promise<string> => {
  try {
    const ip = await Network.getIpAddressAsync();
    const networkInfo = await Network.getNetworkStateAsync();
    console.log('Network Info:', networkInfo);
    console.log('IP address:', ip);
    return ip;
  } catch (error) {
    console.error('Failed to get IP address:', error);
    return 'Unknown error fetching IP address!';
  }
};