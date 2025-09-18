import React from "react";
import Link from "next/link";
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";

interface ModuleCardProps {
    image: string;
    title: string;
    subtitle: string;
    href?: string;
}

export default function ModuleCard({ image, title, subtitle, href = "#" }: ModuleCardProps) {
    return (
        <Card className="overflow-hidden shadow-lg rounded-2xl">
            <CardContent className="p-0">
                <Link href={href} className="block">
                    {/* Big square cover image */}
                    <div className="relative w-full aspect-square">
                        <Image
                            src={image}
                            alt={title}
                            fill
                            className="object-cover"
                            sizes="100vw"
                        />
                    </div>

                    {/* Title + Subtitle */}
                    <div className="p-4 text-center bg-white">
                        <h2 className="text-lg sm:text-xl font-bold text-gray-900">
                            {title}
                        </h2>
                        <p className="text-sm text-gray-600 mt-1">{subtitle}</p>
                    </div>
                </Link>
            </CardContent>
        </Card>
    );
}
