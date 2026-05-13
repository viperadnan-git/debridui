"use client";

import { useLayoutEffect, useRef, useState } from "react";

const VISIBLE_LINES = 3;

export function MediaOverview({ text }: { text: string }) {
    const [expanded, setExpanded] = useState(false);
    const [collapsed, setCollapsed] = useState(0);
    const [full, setFull] = useState(0);
    const ref = useRef<HTMLParagraphElement>(null);

    useLayoutEffect(() => {
        const el = ref.current;
        if (!el) return;
        const measure = () => {
            const lh = parseFloat(getComputedStyle(el).lineHeight);
            setCollapsed(lh * VISIBLE_LINES);
            setFull(el.scrollHeight);
        };
        measure();
        const ro = new ResizeObserver(measure);
        ro.observe(el);
        return () => ro.disconnect();
    }, []);

    const isClamped = full > collapsed + 1;
    const height = collapsed === 0 ? undefined : expanded || !isClamped ? full : collapsed;

    return (
        <div className="max-w-2xl">
            <button
                type="button"
                onClick={() => setExpanded((v) => !v)}
                disabled={!isClamped}
                aria-expanded={expanded}
                className="block text-left w-full relative overflow-hidden transition-[height] duration-300 ease-out disabled:cursor-default cursor-pointer"
                style={{ height }}>
                <p ref={ref} className="text-sm md:text-base text-foreground/80 leading-relaxed">
                    {text}
                </p>
                {!expanded && isClamped && (
                    <div className="absolute inset-x-0 bottom-0 h-6 bg-linear-to-t from-background to-transparent pointer-events-none" />
                )}
            </button>
            {isClamped && (
                <button
                    type="button"
                    onClick={() => setExpanded((v) => !v)}
                    className="mt-2 text-[11px] tracking-[0.2em] uppercase text-muted-foreground hover:text-foreground transition-colors">
                    {expanded ? "Less" : "Read more"}
                </button>
            )}
        </div>
    );
}
