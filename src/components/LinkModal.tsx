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

export default function LinkModal(props: Props) {

  const { name, title, visible, onOk, onCancel, onChange } = props;

  return (
    <Modal
      centered
      title={title}
      visible={visible}
      onOk={onOk}
      onCancel={() => onCancel(false)}
    >
      <Form layout="inline">
        <Form.Item label="节点关系">
          <Input required value={name} onChange={
            (e: React.ChangeEvent<HTMLInputElement>) => onChange(e.target.value)
          } />
        </Form.Item>
      </Form>
    </Modal>
  );
}
