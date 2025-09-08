const prefixer = require('postcss-prefix-selector');

module.exports = {
  plugins: [
    prefixer({
      prefix: '#booking-widget',
      transform(prefix, selector, _prefixedSelector) {
        

        return selector;
      },
    }),
  ],
};