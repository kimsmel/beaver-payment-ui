import React from "react";

import "./I18NMenu.css";
import I18NLogo from "../../assets/icons/i18n.svg";
import "/node_modules/flag-icons/css/flag-icons.min.css";
import { Dropdown, DropdownMenu } from "react-bootstrap";

interface I18NMenuProps {
    callback: (languageCode: string) => void;
}
interface I18NMenuState {
    languages: Language[];
    currentLanguage: Language;
}

interface Language {
    name: string;
    code: string;
    alpha2?: string;
}

class I18NMenu extends React.Component<I18NMenuProps, I18NMenuState> {
    constructor(props: I18NMenuProps) {
        const languages: Language[] = [
            { name: "English", code: "en-US", alpha2: "gb" },
            { name: "中文", code: "zh-CN", alpha2: "cn" },
            { name: "日本語", code: "ja-JP", alpha2: "jp" },
            { name: "한국어", code: "ko-KR", alpha2: "kr" },
            { name: "Español", code: "es-ES", alpha2: "es" },
            { name: "Français", code: "fr-FR", alpha2: "fr" },
            { name: "Italiano", code: "it-IT", alpha2: "it" },
            { name: "Deutsch", code: "de-DE", alpha2: "de" },
            { name: "Português", code: "pt-BR", alpha2: "br" },
            { name: "Русский", code: "ru-RU", alpha2: "ru" },
            { name: "Nederlands", code: "nl-NL", alpha2: "nl" },
            { name: "Türkçe", code: "tr-TR", alpha2: "tr" },
            { name: "Tiếng Việt", code: "vi-VN", alpha2: "vn" },
            { name: "ไทย", code: "th-TH", alpha2: "th" },
            { name: "Bahasa Indonesia", code: "id-ID", alpha2: "id" },
            { name: "Bahasa Melayu", code: "ms-MY", alpha2: "my" },
            { name: "हिन्दी", code: "hi-IN", alpha2: "in" },
        ];
        super(props);
        this.state = {
            languages: languages,
            currentLanguage: languages.find((language) => language.code === localStorage.getItem("language")) || languages[0],
        };
    }

    componentDidMount(): void {
        if (this.state.currentLanguage) {
            this._switchLanguage(this.state.currentLanguage.code);
        }
    }

    _switchLanguage(languageCode: string) {
        const language = this.state.languages.find((language) => language.code === languageCode);
        if (language) {
            this.setState({ currentLanguage: language });
        }
        
        // save to local storage
        localStorage.setItem("language", languageCode);

        if (this.props.callback) {
            this.props.callback(languageCode);
        }
    }

    render() {
        return (
            <div style={{
                marginRight: "1rem",
            }}>
                <Dropdown>
                    <Dropdown.Toggle variant="none" id="dropdown-basic">
                        {this.state.currentLanguage ?  
                            <span className={"fi fi-" + this.state.currentLanguage.alpha2} style={{
                                marginRight: "1rem",
                            }}></span>
                            : <img src={I18NLogo} alt="I18N" className="icon" />}
                    </Dropdown.Toggle>

                    <DropdownMenu>
                        {this.state.languages.map((language, index) => {
                            return (
                                <Dropdown.Item key={index} onClick={
                                    () => {
                                        this._switchLanguage(language.code);
                                    }
                                }>
                                    <span className={"fi fi-" + language.alpha2} style={{
                                        marginRight: "1rem",
                                    }}></span>
                                    {language.name}
                                </Dropdown.Item>
                            );
                        })}
                    </DropdownMenu>
                </Dropdown>
            </div>
        );
    }
}

export default I18NMenu;