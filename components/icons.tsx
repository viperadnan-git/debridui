import { SVGProps } from "react";

/**
 * Centralized icon exports to reduce bundle size
 * Only export icons that are used in multiple places
 */
export {
    Loader2,
    ChevronRight,
    ChevronDown,
    Copy,
    Download,
    CirclePlay,
    X,
    Plus,
    Trash2,
    Search,
    Settings,
    User,
    LogOut,
    Menu,
    Home,
    Film,
    Tv,
    FileText,
    Folder,
    FolderOpen,
    Check,
    ExternalLink,
} from "lucide-react";

// Custom brand icons
export function GitHubIcon(props: SVGProps<SVGSVGElement>) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24" {...props}>
            {/* Icon from Simple Icons by Simple Icons Collaborators - https://github.com/simple-icons/simple-icons/blob/develop/LICENSE.md */}
            <path
                fill="currentColor"
                d="M12 .297c-6.63 0-12 5.373-12 12c0 5.303 3.438 9.8 8.205 11.385c.6.113.82-.258.82-.577c0-.285-.01-1.04-.015-2.04c-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729c1.205.084 1.838 1.236 1.838 1.236c1.07 1.835 2.809 1.305 3.495.998c.108-.776.417-1.305.76-1.605c-2.665-.3-5.466-1.332-5.466-5.93c0-1.31.465-2.38 1.235-3.22c-.135-.303-.54-1.523.105-3.176c0 0 1.005-.322 3.3 1.23c.96-.267 1.98-.399 3-.405c1.02.006 2.04.138 3 .405c2.28-1.552 3.285-1.23 3.285-1.23c.645 1.653.24 2.873.12 3.176c.765.84 1.23 1.91 1.23 3.22c0 4.61-2.805 5.625-5.475 5.92c.42.36.81 1.096.81 2.22c0 1.606-.015 2.896-.015 3.286c0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"
            />
        </svg>
    );
}

export function ImdbIcon(props: SVGProps<SVGSVGElement>) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width={24} height={24} viewBox="0 0 24 24" {...props}>
            <path
                fill="currentColor"
                fillRule="evenodd"
                d="M5 1a4 4 0 0 0-4 4v14a4 4 0 0 0 4 4h14a4 4 0 0 0 4-4V5a4 4 0 0 0-4-4zM4 14.91V9.09h1.455v5.82zm2.182 0V9.09H8L8.727 12l.728-2.91h1.818v5.82H9.818v-2.546l-.727 2.545h-.727l-.728-2.545v2.545zm5.818 0h2.182c.803 0 1.454-.652 1.454-1.455v-2.91c0-.803-.65-1.454-1.454-1.454H12v5.818Zm1.454-4.728h.364c.201 0 .364.163.364.364v2.909c0 .2-.163.363-.364.363h-.364zm2.91-1.091h1.454v1.783c.243-.177.603-.329 1.091-.329c.873 0 1.091.485 1.091.728v2.909c0 .242-.218.727-1.09.727c-.49 0-.849-.152-1.092-.328v.328h-1.454zm2.181 4.364V12a.364.364 0 0 0-.727 0v1.455a.364.364 0 0 0 .727 0"
                clipRule="evenodd"
            />
        </svg>
    );
}
