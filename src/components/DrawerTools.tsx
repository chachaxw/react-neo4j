import { Col, Drawer, Form, InputNumber, Row } from 'antd';
import React, { FC } from 'react';

import { Node } from './types';

import styles from './DrawerTools.module.scss';

const { Item } = Form;

interface Props {
  node: Node | null;
  visible: boolean;
  onClose: () => void;
}

const DrawerTools: FC<Props> = (props) => {
  const { node, visible, onClose } = props;

  // console.log('节点', node);

  return (
    <Drawer
      mask={false}
      placement="right"
      visible={visible}
      onClose={onClose}
      title={node && node.name}
      className={styles.drawerTools}
    >
      <Form>
        <Row gutter={12}>
          <Col span={12}>
            <Item label="fx">
              <InputNumber disabled defaultValue={node ? node.fx.toFixed(2) : 0} placeholder="fx" />
            </Item>
          </Col>
          <Col span={12}>
            <Item label="fy">
              <InputNumber disabled defaultValue={node ? node.fy.toFixed(2) : 0} placeholder="fy" />
            </Item>
          </Col>
          <Col span={12}>
            <Item label="x">
              <InputNumber disabled defaultValue={node ? node.x.toFixed(2) : 0} placeholder="x" />
            </Item>
          </Col>
          <Col span={12}>
            <Item label="y">
              <InputNumber disabled defaultValue={node ? node.y.toFixed(2) : 0} placeholder="y" />
            </Item>
          </Col>
        </Row>
      </Form>
    </Drawer>
  );
};

export default DrawerTools;
