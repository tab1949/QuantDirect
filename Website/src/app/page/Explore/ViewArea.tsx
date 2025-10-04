
import Overview from "./Overview";

interface ViewAreaProps {
    $content: string
}

export default function ViewArea(props: ViewAreaProps) {
    let content = null;
    switch (props.$content) {
    case 'futures-overview':
        break;
    case 'stocks-overview':
        break;
    default:
    case 'overview':
        content = <Overview/>;
        break;
    }
    return <div style={{
        userSelect: "none",
        backgroundColor: "transparent",
        position: "relative",
        width: "calc(95vw - 100px)",
        height: "100%",
        color: "white"
    }}> { content } </div>;
}