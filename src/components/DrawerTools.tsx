import { Drawer, Button } from 'antd';
import React, { Component, SyntheticEvent } from 'react';

interface InternalProps {
  node: any;
}

interface InternalState {
  visible: boolean;
}

class DrawerTools extends Component<InternalProps, InternalState> {

  state: InternalState = {
    visible: false,
  };

  public showDrawer = () => {
    this.setState({ visible: true });
  };

  public onClose = () => {
    this.setState({ visible: false });
  };

  public render() {
    const { node } = this.props;

    return (
      <Drawer
        width={240}
        placement="right"
        closable={false}
        title={node.name}
        onClose={this.onClose}
        visible={this.state.visible}
      >
      </Drawer>
    );
  }
}

export default DrawerTools;
