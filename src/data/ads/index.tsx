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
        title: "Follow @jam.jamcode",
        description: "Konten coding kreatif dan inspirasi developer. Jangan sampai kelewatan!",
        visitUrl: "https://instagram.com/muhamadjamaludinpad",
        badge: "Instagram",
    },
    {
        id: "kodingkeliling-website",
        image: "/ads/website-kodingkeliling.png",
        title: "KodingKeliling.com",
        description: "Tutorial, artikel, dan resource coding terlengkap. Kunjungi sekarang!",
        visitUrl: "https://kodingkeliling.com",
        badge: "Website",
    },
];

/** Plans that are considered paid — ads are hidden for these users */
export const PAID_PLAN_IDS = ["premium", "eksklusif", "luxury"];