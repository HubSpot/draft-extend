window.ToolbarButton = createReactClass({
  getDefaultProps: function() {
    return {
      active: false,
      label: '',
      onClick: function() {}
    };
  },

  render: function() {
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
});
