export interface Ad {
    id: string;
    image: string;
    title: string;
    description: string;
    visitUrl: string;
    badge?: string;
}

export const ADS: Ad[] = [
    {
        id: "kodingkeliling-instagram",
        image: "/ads/instagram-kodingkeliling.png",
        title: "Follow @kodingkeliling",
        description: "Tips coding, project inspirasi, dan update terbaru. Follow sekarang!",
        visitUrl: "https://instagram.com/kodingkeliling",
        badge: "Instagram",
    },
    {
        id: "jamjam-instagram",
        image: "/ads/instagram-jamjam.png",
        title: "Follow @muhamadjamaludinpad",
        description: "Konten seputar Vibe Coding dan teknologi AI terkini. Yuk follow dan tetap up-to-date!",
        visitUrl: "https://instagram.com/muhamadjamaludinpad",
        badge: "Instagram",
    },
    {
        id: "kodingkeliling-website",
        image: "/ads/website-kodingkeliling.png",
        title: "KodingKeliling.com",
        description: "Jasa pembuatan website profesional, software kustom, dan aplikasi mobile terbaik untuk klien di seluruh dunia. Dirancang khusus untuk meningkatkan nilai bisnis Anda secara digital.",
        visitUrl: "https://kodingkeliling.com",
        badge: "Website",
    },
];

/** Plans that are considered paid — ads are hidden for these users */
export const PAID_PLAN_IDS = ["premium", "eksklusif", "luxury"];