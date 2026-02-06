export function SectionDivider({ label }: { label: string }) {
    return (
        <div className="flex items-center gap-4">
            <div className="h-px flex-1 bg-border/50" />
            <span className="text-xs tracking-widest uppercase text-muted-foreground">{label}</span>
            <div className="h-px flex-1 bg-border/50" />
        </div>
    );
}
