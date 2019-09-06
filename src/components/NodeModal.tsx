import { Form, Input, Modal } from 'antd';
import { FormComponentProps } from 'antd/lib/form';
import React, { FC } from 'react';

import { Node } from './types';

interface Props extends FormComponentProps {
  name: string;
  title: string;
  loading: boolean;
  visible: boolean;
  onOk: (node: Node) => void;
  onCancel: (visible: boolean) => void;
}

 export const NodeModal: FC<Props> = (props) => {
  const { name, title, visible, loading, onOk, onCancel, form } = props;
  const { getFieldDecorator, validateFields, resetFields } = form;

  const handleOk = (e: any) => {
    e.preventDefault();

    validateFields((err: any, values: any) => {
      if (!err) {
        onOk(values);
      }
    });
  };

  const handleCancel = () => {
    resetFields();
    onCancel(false);
  };

  return (
    <Modal
      centered
      title={title}
      onOk={handleOk}
      visible={visible}
      confirmLoading={loading}
      onCancel={handleCancel}
    >
      <Form>
        <Form.Item label="Node Name">
          {getFieldDecorator('name', {
            initialValue: name,
            rules: [
              { required: true, message: 'Please input node name!' },
            ],
          })(
            <Input placeholder="Node name" />
          )}
        </Form.Item>
      </Form>
    </Modal>
  );
}

export default Form.create()(NodeModal);
