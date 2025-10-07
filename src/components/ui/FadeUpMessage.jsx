import PropTypes from 'prop-types';

const FadeUpMessage = ({ children }) => {
  return (
    <div className="animate-floatUp">
      {children}
    </div>
  );
};

FadeUpMessage.propTypes = {
  children: PropTypes.node.isRequired,
};

export default FadeUpMessage;
