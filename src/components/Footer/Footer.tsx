import React from 'react';

import './Footer.css';

class Footer extends React.Component {
    render() {
        return (
            <footer className="upay-footer">
                <div className='text-left text-sm'>
                    &copy; 2024 {process.env.REACT_APP_NAME}
                </div>
            </footer>
        );
    }
}


export default Footer;