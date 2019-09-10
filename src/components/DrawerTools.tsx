import { Drawer, Button } from 'antd';
import React, { FC, Component, SyntheticEvent } from 'react';

interface InternalProps {
  node: any;
  visible: boolean;
}

const DrawerTools: FC<InternalProps> = (props) => {
  const { node, visible } = props;

  return <Drawer width={240} mask={false} placement="right" title={node.name} visible={visible}></Drawer>;
};

export default DrawerTools;
