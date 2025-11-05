import type { Metadata } from "next";
import StyledComponentRegistry from "./StyledComponentsRegistry";
import { GlobalStyle } from "./GlobalStyle";
import I18nProvider from "./page/locales/i18n-provider"; 

export const metadata: Metadata = {
  title: "QuantDirect",
  description: "A platform and community for financial analyzing",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode; }>) {
  return (
    <html lang="en">
      <GlobalStyle></GlobalStyle>
      <StyledComponentRegistry>
        <I18nProvider>{children}</I18nProvider>
      </StyledComponentRegistry>
    </html>
  );
}
