import { SocialButton } from "@/components/base/buttons/social-button";
import { useSearchParams } from "next/navigation";

export const GoogleAuthButton = () => {
    const searchParams = useSearchParams();
    const redirectParam = searchParams.get("redirect");
    const href = redirectParam 
        ? `/api/auth/google?redirect=${encodeURIComponent(redirectParam)}` 
        : "/api/auth/google";

    return (
        <>
            <div className="flex items-center gap-3 mt-2">
                <div className="h-px flex-1 bg-secondary" />
                <span className="text-sm font-medium text-tertiary">atau</span>
                <div className="h-px flex-1 bg-secondary" />
            </div>

            <SocialButton social="google" theme="color" size="lg" href={href} className="w-full">
                Lanjutkan dengan Google
            </SocialButton>
        </>
    );
};
