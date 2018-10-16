import React from 'react';
import ReactDOMServer from 'react-dom/server';

import App from './App';

exports.default = ReactDOMServer.renderToString(<App />);
