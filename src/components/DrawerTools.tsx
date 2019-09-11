import { Drawer, Form, InputNumber } from 'antd';
import React, { FC, SyntheticEvent } from 'react';

import styles from './DrawerTools.module.scss';

const { Item } = Form;

interface Props {
  node: any;
  visible: boolean;
  onClose: () => void;
}

const DrawerTools: FC<Props> = (props) => {
  const { node, visible, onClose } = props;
  console.log(node);

  return (
    <Drawer
      mask={false}
      placement="right"
      title={node.name}
      visible={visible}
      onClose={onClose}
      className={styles.drawerTools}
    >
      <Form>
        <Item label="fx">
          <InputNumber disabled defaultValue={node.fx} placeholder="fx" />
        </Item>
        <Item label="fy">
          <InputNumber disabled defaultValue={node.fy} placeholder="fy" />
        </Item>
      </Form>
    </Drawer>
  );
};

export default DrawerTools;
