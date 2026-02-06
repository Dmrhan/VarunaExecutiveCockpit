import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';

export function LanguageSwitcher() {
    const { i18n } = useTranslation();
    const currentLang = i18n.language;
    const isTr = currentLang === 'tr';

    const toggleLanguage = () => {
        const newLang = isTr ? 'en' : 'tr';
        i18n.changeLanguage(newLang);
    };

    return (
        <div
            className="relative w-[72px] h-[32px] bg-slate-200 dark:bg-slate-800 rounded-full cursor-pointer flex items-center justify-between px-2.5 shadow-inner transition-colors border border-slate-300 dark:border-slate-600"
            onClick={toggleLanguage}
            title={isTr ? 'Switch to English' : 'Türkçe\'ye geç'}
        >
            {/* Labels */}
            <span className={`text-[11px] font-bold z-0 transition-opacity duration-300 ${!isTr ? 'opacity-0' : 'text-slate-500'}`}>EN</span>
            <span className={`text-[11px] font-bold z-0 transition-opacity duration-300 ${isTr ? 'opacity-0' : 'text-slate-500'}`}>TR</span>

            {/* Sliding Thumb */}
            <motion.div
                className="absolute top-[1px] left-[1px] w-[28px] h-[28px] rounded-full shadow-md bg-white flex items-center justify-center overflow-hidden z-10"
                animate={{ x: isTr ? 40 : 0 }}
                transition={{ type: "spring", stiffness: 400, damping: 25 }}
            >
                {isTr ? (
                    <svg viewBox="0 0 1200 800" className="w-full h-full object-cover">
                        <rect width="1200" height="800" fill="#E30A17" />
                        <circle cx="444" cy="400" r="200" fill="#FFFFFF" />
                        <circle cx="480" cy="400" r="160" fill="#E30A17" />
                        <path fill="#FFFFFF" d="M693.4,399.9l36.1-11.4l-29.7,22.2l11.4,35.1l-29.8-21.7L651.6,446l11.4-35.1l-29.7-22.2L693.4,399.9z" transform="rotate(-10 666 400) translate(20 0)" />
                    </svg>
                ) : (
                    <svg viewBox="0 0 60 30" className="w-full h-full object-cover scale-150">
                        <clipPath id="s">
                            <path d="M0,0 v30 h60 v-30 z" />
                        </clipPath>
                        <clipPath id="t">
                            <path d="M30,15 h30 v15 z v15 h-30 z h-30 v-15 z v-15 h30 z" />
                        </clipPath>
                        <g clipPath="url(#s)">
                            <path d="M0,0 v30 h60 v-30 z" fill="#012169" />
                            <path d="M0,0 L60,30 M60,0 L0,30" stroke="#fff" strokeWidth="6" />
                            <path d="M0,0 L60,30 M60,0 L0,30" clipPath="url(#t)" stroke="#C8102E" strokeWidth="4" />
                            <path d="M30,0 v30 M0,15 h60" stroke="#fff" strokeWidth="10" />
                            <path d="M30,0 v30 M0,15 h60" stroke="#C8102E" strokeWidth="6" />
                        </g>
                    </svg>
                )}
            </motion.div>

            {/* Active text overlay for contrast if needed, but opacity fade above is simplier */}
            <div className={`absolute left-2.5 text-[11px] font-black text-slate-800 dark:text-slate-200 transition-opacity duration-300 ${!isTr ? 'opacity-100' : 'opacity-0'}`}>EN</div>
            <div className={`absolute right-2.5 text-[11px] font-black text-slate-800 dark:text-slate-200 transition-opacity duration-300 ${isTr ? 'opacity-100' : 'opacity-0'}`}>TR</div>
        </div>
    );
}
