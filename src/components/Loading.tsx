import React from 'react';
import { Row, Spin, Icon } from 'antd';

const antIcon = <Icon type="loading" style={{ fontSize: 42 }} spin />;

export default function Loading() {

  return (
    <Row type="flex" align="middle" justify="center" style={{height: '100vh'}}>    
      <Spin indicator={antIcon} />
    </Row>
  );
}