import React from 'react';
import './Divider.css';

interface DivderProps {
  title : string;
}

class Divider extends React.Component <DivderProps>{
  render() {
    return (
      <div className='divider'>
        <hr />
        <p>
          <span>{this.props.title}</span>
        </p>
        <hr />
      </div>
    );
  }
}

export default Divider;