import styled from "styled-components";
import { useTranslation } from "react-i18next";
import { InlineT1 } from "../components/BasicLayout";

interface HomePageProps {
    $darkMode: boolean;
}

export default function HomePage(props: HomePageProps) {
    const {t} = useTranslation();
    return <div>
        <div style={{
            marginTop: '20px',
            justifySelf: 'center',
        }}><InlineT1>{t('home.welcome')}</InlineT1></div>
        
    </div>;
}