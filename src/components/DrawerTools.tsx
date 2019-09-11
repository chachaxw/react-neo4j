import { Col, Drawer, Form, InputNumber, Row } from 'antd';
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
        <Row gutter={12}>
          <Col span={12}>
            <Item label="fx">
              <InputNumber disabled defaultValue={node.fx.toFixed(2)} placeholder="fx" />
            </Item>
          </Col>
          <Col span={12}>
            <Item label="fy">
              <InputNumber disabled defaultValue={node.fy.toFixed(2)} placeholder="fy" />
            </Item>
          </Col>
        </Row>
      </Form>
    </Drawer>
  );
};

export default DrawerTools;
