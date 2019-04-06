import React from 'react';
import ReactDOM from 'react-dom';

export default class OverlayWrapper extends React.Component {
  constructor(props) {
    super(props);

    const node = document.createElement('div');
    document.body.appendChild(node);

    this.state = { node };
  }

  componentDidMount() {
    this.renderOverlay();
  }

  componentDidUpdate() {
    this.renderOverlay();
  }

  componentWillUnmount() {
    ReactDOM.unmountComponentAtNode(this.state.node);
  }

  renderOverlay() {
    const child = React.Children.only(this.props.children);
    ReactDOM.render(child, this.state.node);
  }

  render() {
    return null;
  }
}
