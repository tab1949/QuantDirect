'use client';

import { createGlobalStyle } from "styled-components";

export const GlobalStyle = createGlobalStyle`
    * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
    }

    html, body {
        height: 100%;
        width: 100%;
        background-color: #0f0f0f;
        color: #ffffff;
    }

    body {
        overflow: hidden;
    }
`;