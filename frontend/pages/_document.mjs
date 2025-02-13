// _document.mjs
import { Head, Html, Main, NextScript } from 'next/document';

export default function Document() {
    return (
        <Html>
            <Head>
                <script 
                    src="https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.min.js" 
                    async 
                    onLoad={() => {
                        if (typeof window !== 'undefined') {
                            window.mermaid.initialize({ startOnLoad: true });
                        }
                    }}
                ></script>
            </Head>
            <body>
                <Main />
                <NextScript />
            </body>
        </Html>
    );
}
