import { useTranslation } from "react-i18next";
import { InlineT1 } from "../components/BasicLayout";

export default function HomePage() {
    const {t} = useTranslation();
    return <div>
        <div style={{
            marginTop: '20px',
            display: 'flex',
            justifyContent: 'center',
        }}><InlineT1>{t('home.welcome')}</InlineT1></div>
        
    </div>;
}