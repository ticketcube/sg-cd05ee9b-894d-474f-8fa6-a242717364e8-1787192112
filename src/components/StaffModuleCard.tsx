import Link from "next/link";
import * as Icons from "lucide-react";

interface StaffModuleCardProps {
    name: string;
    slug: string;
    description: string;
    icon: string;
    color: string;
}

export default function StaffModuleCard({
    name,
    slug,
    description,
    icon,
    color,
}: StaffModuleCardProps) {
    const LucideIcon = (Icons as any)[icon] || Icons.Settings;

    return (
        <Link href={`/${slug}`} className="block group">
            <div
                className={`bg-gradient-to-r from-${color}-900/40 to-${color}-900/40 rounded-xl md:rounded-2xl p-4 md:p-6 border border-${color}-500/30 hover:border-${color}-400/50 transition-all hover:scale-[1.02] cursor-pointer backdrop-blur-sm`}
            >
                <div className="flex items-center gap-3 md:gap-6">
                    <div
                        className={`w-14 md:w-20 h-14 md:h-20 rounded-xl md:rounded-2xl bg-gradient-to-r from-${color}-500 to-${color}-500 flex items-center justify-center group-hover:from-${color}-400 group-hover:to-${color}-400 transition-all shadow-lg shadow-${color}-500/25 flex-shrink-0`}
                    >
                        <LucideIcon className="w-7 md:w-10 h-7 md:h-10 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <h3
                            className={`font-bold text-white text-lg md:text-xl group-hover:text-${color}-300 transition-colors mb-1 md:mb-2`}
                        >
                            {name}
                        </h3>
                        <p className="text-gray-300 mb-3 md:mb-4 text-sm md:text-base">
                            {description}
                        </p>
                    </div>
                </div>
            </div>
        </Link>
    );
}
