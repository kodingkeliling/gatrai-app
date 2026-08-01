import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifyToken } from "@/api/auth";
import { COOKIE_NAME } from "@/lib/auth-cookie";
import { ConsentClientPage } from "./consent-client";

export const metadata = {
    title: "Hubungkan ke GatrAI MCP",
    description: "Izinkan Host AI untuk mengakses data GatrAI Anda."
};

interface PageProps {
    searchParams: Promise<{
        client_id?: string;
        redirect_uri?: string;
        response_type?: string;
        state?: string;
        code_challenge?: string;
        code_challenge_method?: string;
    }>;
}

export default async function Page(props: PageProps) {
    const searchParams = await props.searchParams;
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;

    const user = token ? verifyToken(token) : null;

    if (!user) {
        // Build the current URL to redirect back to
        const params = new URLSearchParams();
        if (searchParams.client_id) params.set("client_id", searchParams.client_id);
        if (searchParams.redirect_uri) params.set("redirect_uri", searchParams.redirect_uri);
        if (searchParams.response_type) params.set("response_type", searchParams.response_type);
        if (searchParams.state) params.set("state", searchParams.state);
        if (searchParams.code_challenge) params.set("code_challenge", searchParams.code_challenge);
        if (searchParams.code_challenge_method) params.set("code_challenge_method", searchParams.code_challenge_method);

        const currentPath = `/oauth/authorize?${params.toString()}`;
        redirect(`/login?redirect=${encodeURIComponent(currentPath)}`);
    }

    return (
        <ConsentClientPage 
            user={user} 
            clientId={searchParams.client_id || ""}
            redirectUri={searchParams.redirect_uri || ""}
            responseType={searchParams.response_type || ""}
            state={searchParams.state || ""}
            codeChallenge={searchParams.code_challenge || ""}
            codeChallengeMethod={searchParams.code_challenge_method || ""}
        />
    );
}
