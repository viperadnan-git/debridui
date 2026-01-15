"use client";

import { useState, useRef } from "react";
import { DebridFileNode } from "@/lib/types";
import { Loader2, AlertCircle, ZoomIn, ZoomOut, Minimize2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface ImagePreviewProps {
    file: DebridFileNode;
    downloadUrl: string;
    onLoad?: () => void;
    onError?: (error: Error) => void;
}

export function ImagePreview({ file, downloadUrl, onLoad, onError }: ImagePreviewProps) {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const [scale, setScale] = useState(1);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    const containerRef = useRef<HTMLDivElement>(null);
    const imageRef = useRef<HTMLImageElement>(null);

    const MIN_SCALE = 0.5;
    const MAX_SCALE = 5;
    const SCALE_STEP = 0.5;
    const WHEEL_SCALE_STEP = 0.05; // Smaller step for smoother scroll wheel zoom

    const handleLoad = () => {
        setLoading(false);
        onLoad?.();
    };

    const handleError = () => {
        setLoading(false);
        setError(true);
        onError?.(new Error("Failed to load image"));
    };

    const handleZoomIn = () => {
        setScale((prev) => Math.min(prev + SCALE_STEP, MAX_SCALE));
    };

    const handleZoomOut = () => {
        setScale((prev) => Math.max(prev - SCALE_STEP, MIN_SCALE));
    };

    const handleReset = () => {
        setScale(1);
        setPosition({ x: 0, y: 0 });
    };

    const handleWheel = (e: React.WheelEvent) => {
        e.preventDefault();
        const delta = e.deltaY > 0 ? -WHEEL_SCALE_STEP : WHEEL_SCALE_STEP;
        setScale((prev) => Math.max(MIN_SCALE, Math.min(prev + delta, MAX_SCALE)));
    };

    const handleMouseDown = (e: React.MouseEvent) => {
        if (scale > 1) {
            setIsDragging(true);
            setDragStart({
                x: e.clientX - position.x,
                y: e.clientY - position.y,
            });
        }
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (isDragging && scale > 1) {
            setPosition({
                x: e.clientX - dragStart.x,
                y: e.clientY - dragStart.y,
            });
        }
    };

    const handleMouseUp = () => {
        setIsDragging(false);
    };

    const handleDoubleClick = () => {
        if (scale === 1) {
            setScale(2);
        } else {
            handleReset();
        }
    };

    return (
        <div
            ref={containerRef}
            className="relative w-full h-full flex items-center justify-center bg-black overflow-hidden"
            onWheel={handleWheel}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}>
            {loading && (
                <div className="absolute inset-0 flex items-center justify-center z-10">
                    <Loader2 className="h-8 w-8 animate-spin text-white" />
                </div>
            )}

            {error && (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-white z-10">
                    <AlertCircle className="h-12 w-12 mb-2" />
                    <p className="text-sm">Failed to load image</p>
                    <p className="text-xs text-white/70 mt-1">{file.name}</p>
                </div>
            )}

            {!error && (
                <>
                    <img
                        ref={imageRef}
                        src={downloadUrl}
                        alt={file.name}
                        className={cn(
                            "max-w-full max-h-full object-contain transition-opacity duration-200 select-none",
                            loading && "opacity-0",
                            scale > 1 && "cursor-move",
                            scale === 1 && "cursor-zoom-in"
                        )}
                        style={{
                            transform: `scale(${scale}) translate(${position.x / scale}px, ${position.y / scale}px)`,
                            transition: isDragging ? "none" : "transform 0.2s ease-out",
                        }}
                        onLoad={handleLoad}
                        onError={handleError}
                        onDoubleClick={handleDoubleClick}
                        draggable={false}
                    />

                    {/* Zoom Controls */}
                    {!loading && (
                        <div className="absolute bottom-4 right-4 flex flex-col gap-2 z-20">
                            <Button
                                variant="ghost"
                                size="icon"
                                className="bg-black/50 hover:bg-black/70 text-white h-9 w-9"
                                onClick={handleZoomIn}
                                disabled={scale >= MAX_SCALE}
                                title="Zoom In">
                                <ZoomIn className="h-4 w-4" />
                            </Button>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="bg-black/50 hover:bg-black/70 text-white h-9 w-9"
                                onClick={handleZoomOut}
                                disabled={scale <= MIN_SCALE}
                                title="Zoom Out">
                                <ZoomOut className="h-4 w-4" />
                            </Button>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="bg-black/50 hover:bg-black/70 text-white h-9 w-9"
                                onClick={handleReset}
                                disabled={scale === 1 && position.x === 0 && position.y === 0}
                                title="Reset Zoom">
                                <Minimize2 className="h-4 w-4" />
                            </Button>
                        </div>
                    )}

                    {/* Zoom Level Indicator */}
                    {!loading && scale !== 1 && (
                        <div className="absolute bottom-4 left-4 bg-black/50 text-white px-3 py-1.5 rounded text-sm z-20">
                            {Math.round(scale * 100)}%
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
