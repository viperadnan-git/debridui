"use client";

import {
    Pagination,
    PaginationContent,
    PaginationItem,
    PaginationLink,
    PaginationEllipsis,
} from "@/components/ui/pagination";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface PaginationProps {
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
    disabled?: boolean;
    className?: string;
}

export function ListPagination({
    currentPage,
    totalPages,
    onPageChange,
    disabled = false,
    className,
}: PaginationProps) {
    const renderPageNumbers = () => {
        const pages = [];
        const maxVisible = 3;

        if (totalPages <= maxVisible + 2) {
            for (let i = 1; i <= totalPages; i++) {
                pages.push(i);
            }
        } else {
            if (currentPage <= maxVisible) {
                for (let i = 1; i <= maxVisible + 1; i++) {
                    pages.push(i);
                }
                pages.push("ellipsis");
                pages.push(totalPages);
            } else if (currentPage >= totalPages - maxVisible + 1) {
                pages.push(1);
                pages.push("ellipsis");
                for (let i = totalPages - maxVisible; i <= totalPages; i++) {
                    pages.push(i);
                }
            } else {
                pages.push(1);
                pages.push("ellipsis");
                for (let i = currentPage - 1; i <= currentPage + 1; i++) {
                    pages.push(i);
                }
                pages.push("ellipsis");
                pages.push(totalPages);
            }
        }

        return pages;
    };

    return (
        <Pagination className={cn("mt-6", className)}>
            <PaginationContent>
                <PaginationItem>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onPageChange(1)}
                        disabled={disabled || currentPage === 1}
                        className="size-9"
                        aria-label="First page">
                        <ChevronsLeft className="size-4" />
                    </Button>
                </PaginationItem>

                <PaginationItem>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onPageChange(currentPage - 1)}
                        disabled={disabled || currentPage === 1}
                        className="size-9"
                        aria-label="Previous page">
                        <ChevronLeft className="size-4" />
                    </Button>
                </PaginationItem>

                {renderPageNumbers().map((page, index) => (
                    <PaginationItem key={index}>
                        {page === "ellipsis" ? (
                            <PaginationEllipsis />
                        ) : (
                            <PaginationLink
                                onClick={() => !disabled && onPageChange(page as number)}
                                isActive={currentPage === page}
                                className={disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer"}>
                                {page}
                            </PaginationLink>
                        )}
                    </PaginationItem>
                ))}

                <PaginationItem>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onPageChange(currentPage + 1)}
                        disabled={disabled || currentPage === totalPages}
                        className="size-9"
                        aria-label="Next page">
                        <ChevronRight className="size-4" />
                    </Button>
                </PaginationItem>

                <PaginationItem>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onPageChange(totalPages)}
                        disabled={disabled || currentPage === totalPages}
                        className="size-9"
                        aria-label="Last page">
                        <ChevronsRight className="size-4" />
                    </Button>
                </PaginationItem>
            </PaginationContent>
        </Pagination>
    );
}
