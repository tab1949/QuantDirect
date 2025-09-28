import styled from "styled-components";
import { useTranslation } from "react-i18next";

const Title1 = styled.h1`
    color: var(--theme-font-color-content);
    font-size: 50px;
`;

interface HomePageProps {
    $darkMode: boolean;
}

export default function HomePage(props: HomePageProps) {
    const {t} = useTranslation();
    return <div>
        <div style={{
            marginTop: '20px',
            justifySelf: 'center',
        }}><Title1>{t('home.welcome')}</Title1></div>
        
    </div>;
}