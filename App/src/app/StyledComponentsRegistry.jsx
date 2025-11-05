'use client';

import React from "react";
import { useState } from "react";
import { useServerInsertedHTML } from "next/navigation";
import { ServerStyleSheet, StyleSheetManager } from "styled-components";

export default function StyledComponentsRegistry({ children }) {
    const [StyledComponentsStyleSheet] = useState(() => new ServerStyleSheet());
    useServerInsertedHTML(() => {
        const styles = StyledComponentsStyleSheet.getStyleElement();
        StyledComponentsStyleSheet.instance.clearTag();
        return <>{styles}</>;
    });

    if (typeof window !== 'undefined') {
        return <>{children}</>;
    }

    return (
        <StyleSheetManager sheet={StyledComponentsStyleSheet.instance}>
            {children}
        </StyleSheetManager>
    );
}