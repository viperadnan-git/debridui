"use client";

import { UploadIcon } from "lucide-react";
import type { ReactNode } from "react";
import { createContext, useContext } from "react";
import type { DropEvent, DropzoneOptions, FileRejection } from "react-dropzone";
import { useDropzone } from "react-dropzone";
import { cn, formatSize } from "@/lib/utils/index";

type DropzoneContextType = {
    src?: File[];
    accept?: DropzoneOptions["accept"];
    maxSize?: DropzoneOptions["maxSize"];
    minSize?: DropzoneOptions["minSize"];
    maxFiles?: DropzoneOptions["maxFiles"];
};

const DropzoneContext = createContext<DropzoneContextType | undefined>(undefined);

export type DropzoneProps = Omit<DropzoneOptions, "onDrop"> & {
    src?: File[];
    className?: string;
    onDrop?: (acceptedFiles: File[], fileRejections: FileRejection[], event: DropEvent) => void;
    children?: ReactNode;
};

export const Dropzone = ({
    accept,
    maxFiles = 1,
    maxSize,
    minSize,
    onDrop,
    onError,
    disabled,
    src,
    className,
    children,
    ...props
}: DropzoneProps) => {
    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        accept,
        maxFiles,
        maxSize,
        minSize,
        onError,
        disabled,
        onDrop: (acceptedFiles, fileRejections, event) => {
            if (fileRejections.length > 0) {
                const message = fileRejections.at(0)?.errors.at(0)?.message;
                onError?.(new Error(message));
                return;
            }

            onDrop?.(acceptedFiles, fileRejections, event);
        },
        ...props,
    });

    return (
        <DropzoneContext.Provider key={JSON.stringify(src)} value={{ src, accept, maxSize, minSize, maxFiles }}>
            <button
                type="button"
                disabled={disabled}
                className={cn(
                    "relative flex w-full flex-col items-center justify-center gap-2 rounded-sm border-3 border-dashed border-border/50 bg-transparent p-8 text-center outline-none transition-colors duration-300",
                    "hover:border-border hover:bg-muted/30",
                    "focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:border-ring",
                    "disabled:pointer-events-none disabled:opacity-50",
                    isDragActive && "border-primary/60 bg-primary/5",
                    className
                )}
                {...getRootProps()}>
                <input {...getInputProps()} disabled={disabled} />
                {children}
            </button>
        </DropzoneContext.Provider>
    );
};

const useDropzoneContext = () => {
    const context = useContext(DropzoneContext);

    if (!context) {
        throw new Error("useDropzoneContext must be used within a Dropzone");
    }

    return context;
};

export type DropzoneContentProps = {
    children?: ReactNode;
    className?: string;
};

const maxLabelItems = 3;

export const DropzoneContent = ({ children, className }: DropzoneContentProps) => {
    const { src } = useDropzoneContext();

    if (!src) {
        return null;
    }

    if (children) {
        return children;
    }

    return (
        <div className={cn("flex flex-col items-center justify-center gap-1", className)}>
            <UploadIcon className="size-5 text-muted-foreground" />
            <p className="w-full truncate text-sm font-medium">
                {src.length > maxLabelItems
                    ? `${new Intl.ListFormat("en").format(
                          src.slice(0, maxLabelItems).map((file) => file.name)
                      )} and ${src.length - maxLabelItems} more`
                    : new Intl.ListFormat("en").format(src.map((file) => file.name))}
            </p>
            <p className="text-xs text-muted-foreground">Drag and drop or click to replace</p>
        </div>
    );
};

export type DropzoneEmptyStateProps = {
    children?: ReactNode;
    className?: string;
};

export const DropzoneEmptyState = ({ children, className }: DropzoneEmptyStateProps) => {
    const { src, accept, maxSize, minSize, maxFiles } = useDropzoneContext();

    if (src) {
        return null;
    }

    if (children) {
        return children;
    }

    let caption = "";

    if (accept) {
        caption += "Accepts ";
        caption += new Intl.ListFormat("en").format(Object.keys(accept));
    }

    if (minSize && maxSize) {
        caption += ` between ${formatSize(minSize)} and ${formatSize(maxSize)}`;
    } else if (minSize) {
        caption += ` at least ${formatSize(minSize)}`;
    } else if (maxSize) {
        caption += ` less than ${formatSize(maxSize)}`;
    }

    return (
        <div className={cn("flex flex-col items-center justify-center gap-1", className)}>
            <UploadIcon className="size-5 text-muted-foreground" />
            <p className="text-sm font-medium">Upload {maxFiles === 1 ? "a file" : "files"}</p>
            <p className="text-xs text-muted-foreground">Drag and drop or click to upload</p>
            {caption && <p className="text-xs text-muted-foreground">{caption}.</p>}
        </div>
    );
};
