import React from 'react';

import './Footer.css';

class Footer extends React.Component {
    render() {
        return (
            <footer className="upay-footer">
                <div className='text-left text-sm'>
                    &copy; 2024 <a href={
                        process.env.REACT_APP_LINK
                    } target='_blank' rel='noopener noreferrer'>{process.env.REACT_APP_NAME}</a>
                </div>
            </footer>
        );
    }
}


export default Footer;