import React from "react";

import "./Header.css";
import I18NMenu from "../I18NMenu/I18NMenu";

interface HeaderProps {
    i18n: any;
    t: any;
}

class Header extends React.Component<HeaderProps> {

    setLanguage = (languageCode: string) => {
        this.props.i18n.changeLanguage(languageCode);
    }

    render() {
        return (
            <div className="upay-header">
                <div className="upay-row flex justify-between align-center">
                    <div className="flex align-center">
                        <img src="logo192.png" alt="UPAY" className="icon" />
                        <div className="upay-header-title">
                            {
                                // env
                                process.env.REACT_APP_NAME
                            }
                        </div>
                    </div>
                    <I18NMenu callback={
                        this.setLanguage
                    }/>
                </div>
            </div>
        );
    }
}

export default Header;