import React, { FC, useEffect, useState } from 'react';
import { Button, Form, Tooltip, InputNumber } from 'antd';
import SearchBar from './SearchBar';

interface Props {
  scale: number;
  showAddNode: () => void;
}

const TopTools: FC<Props> = (props) => {
  const { scale, showAddNode } = props;
  const [isFullScreen, setIsFullScreen] = useState<boolean>(false);

  useEffect(() => {
    window.addEventListener('keyup', keyboardPress);
    return window.removeEventListener('keyup', keyboardPress);
  }, []);

  const keyboardPress = (ev: KeyboardEvent) => {
    if (ev.key === 'Escape') {
      if (isFullScreen) {
        setIsFullScreen(false);
        document.exitFullscreen();
      }
    }
  };

  const setFullScreen = () => {
    const body = document.getElementsByTagName('body')[0];
    if (!isFullScreen) {
      setIsFullScreen(true);
      body.requestFullscreen();
    } else {
      setIsFullScreen(false);
      document.exitFullscreen();
    }
  };

  return (
    <Form layout="inline" className="visual-editor-tools">
      <Form.Item>
        <Tooltip title="Add Node" placement="bottom">
          <Button onClick={showAddNode} shape="circle" icon="plus" type="primary" />
        </Tooltip>
      </Form.Item>
      <Form.Item>
        <Tooltip title="Set Node Color" placement="bottom">
          <Button shape="circle" type="primary" icon="instagram" onClick={setFullScreen} />
        </Tooltip>
      </Form.Item>
      <Form.Item>
        <Tooltip title={isFullScreen ? 'Exit Full Screen' : 'Full Screen'} placement="bottom">
          <Button
            shape="circle"
            type="primary"
            icon={isFullScreen ? 'fullscreen-exit' : 'fullscreen'}
            onClick={setFullScreen}
          />
        </Tooltip>
      </Form.Item>
      <Form.Item>
        <SearchBar />
      </Form.Item>
      <Form.Item>
        <InputNumber
          min={12.5}
          max={500}
          step={15}
          value={scale}
          defaultValue={100}
          parser={(value?: string) => (value ? Number(value.replace('%', '')) : 100)}
          formatter={(value?: number | string) => `${value ? value : 100}%`}
        />
      </Form.Item>
    </Form>
  );
};

export default TopTools;
