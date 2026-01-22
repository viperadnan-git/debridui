import { LoginForm } from "@/components/login-form";
import Image from "next/image";
import Link from "next/link";

export default function LoginPage() {
    return (
        <div className="bg-background flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10">
            <div className="w-full max-w-sm">
                <div className="flex flex-col items-center gap-2 mb-6">
                    <Link href="/" className="flex flex-col items-center gap-2 font-medium">
                        <div className="flex size-12 items-center justify-center">
                            <Image
                                src="/icon.svg"
                                alt="DebridUI"
                                width={48}
                                height={48}
                                className="invert dark:invert-0"
                            />
                        </div>
                        <span className="sr-only">DebridUI</span>
                    </Link>
                    <h1 className="text-xl font-bold">Welcome to DebridUI</h1>
                </div>
                <LoginForm />
            </div>
        </div>
    );
}
