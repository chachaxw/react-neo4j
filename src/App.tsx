import { Layout } from 'antd';
import React, { Component } from 'react';
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

export default App;
