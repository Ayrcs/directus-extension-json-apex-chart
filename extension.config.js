export default {
  plugins: [
    {
      name: 'externalize-browser-only-dependencies',
      resolveId(source) {
        if (source === 'apexcharts') {
          return {
            id: source,
            external: true,
          };
        }

        return null;
      },
    },
  ],
};
