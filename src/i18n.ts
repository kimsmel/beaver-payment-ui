import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// 从本地locale文件夹中加载语言文件
import en from './locale/en.json';
import zh from './locale/zh.json';
import ja from './locale/ja.json';
import ko from './locale/ko.json';
import es from './locale/es.json';
import fr from './locale/fr.json';
import it from './locale/it.json';
import de from './locale/de.json';
import pt from './locale/pt.json';
import ru from './locale/ru.json';
import nl from './locale/nl.json';
import tr from './locale/tr.json';
import vi from './locale/vi.json';
import th from './locale/th.json';
import id from './locale/id.json';
import ms from './locale/ms.json';
import hi from './locale/hi.json';

// 初始化i18n
i18n
    .use(initReactI18next)
    .use(LanguageDetector)
    .init({
        resources: {
            en: { translation: en },
            zh: { translation: zh },
            ja: { translation: ja },
            ko: { translation: ko },
            es: { translation: es },
            fr: { translation: fr },
            it: { translation: it },
            de: { translation: de },
            pt: { translation: pt },
            ru: { translation: ru },
            nl: { translation: nl },
            tr: { translation: tr },
            vi: { translation: vi },
            th: { translation: th },
            id: { translation: id },
            ms: { translation: ms },
            hi: { translation: hi },
        },
        fallbackLng: 'en',
        debug: true,
        interpolation: {
            escapeValue: false,
        },
    });

export default i18n;
