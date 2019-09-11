import { Layout } from 'antd';
import React, { FC } from 'react';
import { hot } from 'react-hot-loader';

import './App.css';
import VisualEditor from './components/VisualEditor';

const App: FC = () => {
  return (
    <Layout className="App">
      <VisualEditor />
    </Layout>
  );
};

export default process.env.NODE_ENV === 'development' ? hot(module)(App) : App;
