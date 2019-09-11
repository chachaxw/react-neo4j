import { Layout } from 'antd';
import React, { Component } from 'react';
import { hot } from 'react-hot-loader';

import VisualEditor from './components/VisualEditor';

import './App.css';
import 'antd/dist/antd.css';

class App extends Component {
  render() {
    return (
      <Layout className="App">
        <VisualEditor />
      </Layout>
    );
  }
}

export default process.env.NODE_ENV === 'development' ? hot(module)(App) : App;
