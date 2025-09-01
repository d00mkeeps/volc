const { getDefaultConfig } = require('expo/metro-config');
const config = getDefaultConfig(__dirname);

// Exclude unused icon font files to reduce bundle size
config.resolver.blacklistRE = /(.*\/Fonts\/(AntDesign|Entypo|EvilIcons|Feather|FontAwesome|FontAwesome5_|FontAwesome6_|Fontisto|Foundation|MaterialCommunity|MaterialIcons|Octicons|SimpleLineIcons|Zocial)\.ttf)$/;

module.exports = config;