import { Form, Input, Modal } from 'antd';
import { ButtonProps } from 'antd/lib/button';
import { FormComponentProps } from 'antd/lib/form';
import React, { FC } from 'react';

import { Link } from './types';

interface Props extends FormComponentProps {
  data?: Link;
  title: string;
  visible: boolean;
  onOk: (link: Link) => void;
  onCancel: (visible: boolean) => void;
}

export const LinkModal: FC<Props> = (props) => {
  const { data, title, visible, onOk, onCancel, form } = props;
  const { getFieldDecorator, validateFields, resetFields } = form;
  const buttonProps: ButtonProps = { shape: 'round' };

  const handleOk = (e: any) => {
    e.preventDefault();

    validateFields(async (err: any, values: any) => {
      if (!err) {
        await onOk(values);
        resetFields();
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
      visible={visible}
      onOk={handleOk}
      onCancel={handleCancel}
      okButtonProps={buttonProps}
      cancelButtonProps={buttonProps}
    >
      <Form>
        <Form.Item label="Link Name">
          {getFieldDecorator('name', {
            initialValue: data ? data.name : '',
            rules: [{ required: true, message: 'Please input link name!' }],
          })(<Input placeholder="Link name" />)}
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default Form.create<Props>()(LinkModal);
