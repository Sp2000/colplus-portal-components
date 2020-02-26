import React from 'react';
import { Tooltip, Icon } from 'antd';
import injectSheet from 'react-jss';

const styles = {
  tip: {
    color: 'rgba(0,0,0,.45)',
    marginLeft: '4px',
  },
  icon: {
    marginTop: '4px'
  }
};

const Help = ({ title, classes }) => {
  return (
    <React.Fragment>
      {title && <span className={classes.tip}>
        <Tooltip title={title}>
          <Icon type="question-circle-o" className={classes.icon}/>
        </Tooltip>
      </span>}
    </React.Fragment>
  );
};



export default injectSheet(styles)(Help);