import { SocialButton } from "@/components/base/buttons/social-button";

export const GoogleAuthButton = () => {
    return (
        <>
            <div className="flex items-center gap-3 mt-2">
                <div className="h-px flex-1 bg-secondary" />
                <span className="text-sm font-medium text-tertiary">atau</span>
                <div className="h-px flex-1 bg-secondary" />
            </div>

            <SocialButton social="google" theme="color" size="lg" href="/api/auth/google" className="w-full">
                Lanjutkan dengan Google
            </SocialButton>
        </>
    );
};
