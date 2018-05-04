class ToolbarButton extends React.Component {
  render () {
    var toolbarButtonStyle = {
      display: 'inline-block',
      minWidth: '24px',
      padding: '4px',
      borderRadius: '3px',
      textAlign: 'center',
      cursor: 'pointer'
    };

    if (this.props.active) {
      toolbarButtonStyle.background = '#000';
      toolbarButtonStyle.color = '#fff';
    }

    return (
      React.createElement('div', {
        style: toolbarButtonStyle,
        onClick: this.props.onClick
      }, this.props.label)
    );
  }
};

ToolbarButton.defaultProps = {
  active: false,
  label: '',
  onClick: function() {}
};

window.ToolbarButton = ToolbarButton;