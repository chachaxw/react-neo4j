import { Form, Input, Modal } from 'antd';
import React, { FC } from 'react';

interface Props {
  name: string;
  title: string;
  visible: boolean;
  onOk: () => void;
  onCancel: (visible: boolean) => void;
  onChange: (e: any) => void;
}

export const LinkModal: FC<Props> = (props) => {

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
        <Form.Item label="Link Name">
          <Input required value={name} onChange={
            (e: React.ChangeEvent<HTMLInputElement>) => onChange(e.target.value)
          } />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default LinkModal;
