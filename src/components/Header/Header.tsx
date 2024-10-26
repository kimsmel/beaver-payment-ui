import React from "react";

import "./Header.css";
// import I18NLogo from "../../assets/icons/i18n.svg";

class Header extends React.Component {
    render() {
        return (
            <div className="upay-header">
                <div className="upay-row flex justify-between align-center">
                    <div>
                        <div className="upay-header-logo">
                        </div>
                        <div className="upay-header-title">
                            UPAY
                        </div>
                    </div>
                        {/* <img src={I18NLogo} alt="I18N" className="icon"/> */}
                </div>
            </div>
        );
    }
}

export default Header;