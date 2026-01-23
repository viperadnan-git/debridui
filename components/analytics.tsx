export function Analytics() {
    const scriptTag = process.env.NEXT_PUBLIC_ANALYTICS_SCRIPT;

    if (!scriptTag) {
        return null;
    }

    return <div dangerouslySetInnerHTML={{ __html: scriptTag }} />;
}
