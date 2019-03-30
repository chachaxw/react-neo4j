import React, { Component } from 'react';
import { Button, Form, Tooltip, InputNumber } from 'antd';
import SearchBar from './SearchBar';

interface InternalProps {
  scale: number;
  restart: () => void;
  showAddNode: () => void;
}

interface InternalState {
  isFullScreen: boolean;
}

export default class TopTools extends Component<InternalProps, InternalState> {

  constructor(props: InternalProps) {
    super(props);
    this.state = {
      isFullScreen: false,
    };
  }

  public componentDidMount() {
    window.addEventListener('keydown', this.keyboardPress.bind(this));
  }

  public componentWillUnmount() {
    window.removeEventListener('keydown', this.keyboardPress.bind(this));
  }

  keyboardPress(ev: KeyboardEvent) {
    // console.log(ev);
    if (ev.key === 'Escape') {
      if (this.state.isFullScreen) {
        this.setState({ isFullScreen: false });
        document.exitFullscreen();
      }
    }
  }

  public setFullScreen() {
    const { isFullScreen } = this.state;
    const body = document.getElementsByTagName('body')[0];
    if (!isFullScreen) {
      this.setState({ isFullScreen: true });
      body.requestFullscreen();
    } else {
      this.setState({ isFullScreen: false });
      document.exitFullscreen();
    }
  }

  render() {
    const { isFullScreen } = this.state;
    const { restart, scale, showAddNode } = this.props;

    return (
      <Form layout="inline" className="visual-editor-tools">
        <Form.Item>
          <Tooltip title="Add Node" placement="bottom">
            <Button onClick={showAddNode} shape="circle" icon="plus" type="primary" />
          </Tooltip>
        </Form.Item>
        <Form.Item>
          <Tooltip title={isFullScreen ? 'Exit Full Screen' : 'Full Screen'} placement="bottom">
            <Button
              shape="circle" type="primary"
              icon={isFullScreen ? 'fullscreen-exit' : 'fullscreen'}
              onClick={() => this.setFullScreen()}
            />
          </Tooltip>
        </Form.Item>
        <Form.Item>
          <Tooltip title="Restart" placement="bottom">
            <Button onClick={restart} shape="circle" icon="reload" type="primary" />
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
            formatter={value => `${value}%`}
            parser={value => value ? Number(value.replace('%', '')) : 100}
          />
        </Form.Item>
      </Form>
    );
  }
}
