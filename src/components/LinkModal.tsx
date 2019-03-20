import React from 'react';
import { Form, Input, Modal } from 'antd';

interface Props {
  name: string;
  visible: boolean;
  onOk: () => void;
  onCancel: (visible: boolean) => void;
  onChange: (e: any) => void;
}

export default function LinkModal(props: Props) {

  const { name, visible, onOk, onCancel, onChange } = props;
  
  return (
    <Modal
      centered
      title="编辑节点关系"
      visible={visible}
      onOk={onOk}
      onCancel={() => onCancel(false)}
    >
      <Form>
        <Form.Item label="节点关系">
          <Input required value={name} onChange={(e) => onChange(e)} />
        </Form.Item>
      </Form>
    </Modal>
  );
}