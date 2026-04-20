const appJson = require('./app.json');

const defaultApi = 'https://www.ibyapa.com';
const apiUrl = (process.env.EXPO_PUBLIC_API_URL || defaultApi).replace(/\/+$/, '');

module.exports = {
  expo: {
    ...appJson.expo,
    owner: 'aln.k',
    extra: {
      ...(appJson.expo?.extra ?? {}),
      apiUrl,
      eas: {
        projectId: '1b78312f-bd60-4324-bc33-50da523a04e4',
      },
    },
  },
};
