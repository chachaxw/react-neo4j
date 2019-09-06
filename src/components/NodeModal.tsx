import { Form, Input, Modal } from 'antd';
import React, { FC } from 'react';

interface Props {
  name: string;
  title: string;
  loading: boolean;
  visible: boolean;
  onOk: () => void;
  onCancel: (visible: boolean) => void;
  onChange: (e: any) => void;
}

 export const NodeModal: FC<Props> = (props) => {
  const { name, title, visible, loading, onOk, onCancel, onChange } = props;

  return (
    <Modal
      centered
      onOk={onOk}
      title={title}
      visible={visible}
      confirmLoading={loading}
      onCancel={() => onCancel(false)}
    >
      <Form>
        <Form.Item label="Node Name">
          <Input required value={name} onChange={
            (e: React.ChangeEvent<HTMLInputElement>) => onChange(e.target.value)
          } />
        </Form.Item>
      </Form>
    </Modal>
  );
}

export default NodeModal;
