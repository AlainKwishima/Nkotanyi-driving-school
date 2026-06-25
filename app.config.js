const defaultApi = 'https://www.ibyapa.com';
const apiUrl = (process.env.EXPO_PUBLIC_API_URL || defaultApi).replace(/\/+$/, '');

module.exports = ({ config }) => ({
  ...config,
  owner: 'aln.k',
  extra: {
    ...(config.extra ?? {}),
    apiUrl,
    eas: {
      projectId: '1b78312f-bd60-4324-bc33-50da523a04e4',
    },
  },
});
