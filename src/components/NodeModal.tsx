import React from 'react';
import { Form, Input, Modal } from 'antd';

interface Props {
  name: string;
  title: string;
  visible: boolean;
  onOk: () => void;
  onCancel: (visible: boolean) => void;
  onChange: (e: any) => void;
}

export default function NodeModal(props: Props) {

  const { name, title, visible, onOk, onCancel, onChange } = props;
  
  return (
    <Modal
      centered
      title={title}
      visible={visible}
      onOk={onOk}
      onCancel={() => onCancel(false)}
    >
      <Form>
        <Form.Item label="节点名称">
          <Input required value={name} onChange={(e) => onChange(e)} />
        </Form.Item>
      </Form>
    </Modal>
  );
}