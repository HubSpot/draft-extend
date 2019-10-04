window.ToolbarButton = function({ active, label, onClick }) {
  var toolbarButtonStyle = {
    display: 'inline-block',
    minWidth: '24px',
    padding: '4px',
    borderRadius: '3px',
    textAlign: 'center',
    cursor: 'pointer',
  };

  if (active) {
    toolbarButtonStyle.background = '#000';
    toolbarButtonStyle.color = '#fff';
  }

  return React.createElement(
    'div',
    {
      style: toolbarButtonStyle,
      onClick: onClick,
    },
    label
  );
};

ToolbarButton.defaultProps = {
  active: false,
  label: '',
  onClick: function() {},
};
