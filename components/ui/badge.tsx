import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
    "inline-flex items-center justify-center rounded-sm border px-1.5 py-0 h-5 text-[10px] font-medium tracking-wide w-fit whitespace-nowrap shrink-0 [&>svg]:size-2.5 gap-1 [&>svg]:pointer-events-none transition-colors duration-300 overflow-hidden",
    {
        variants: {
            variant: {
                default: "border-transparent bg-primary text-primary-foreground [a&]:hover:bg-primary/90",
                secondary: "border-transparent bg-secondary text-secondary-foreground [a&]:hover:bg-secondary/90",
                destructive:
                    "border-transparent bg-destructive text-white [a&]:hover:bg-destructive/90 dark:bg-destructive/60",
                outline: "border-border/50 text-foreground [a&]:hover:bg-muted/50",
            },
        },
        defaultVariants: {
            variant: "outline",
        },
    }
);

function Badge({
    className,
    variant,
    asChild = false,
    ...props
}: React.ComponentProps<"span"> & VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
    const Comp = asChild ? Slot : "span";

    return <Comp data-slot="badge" className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
