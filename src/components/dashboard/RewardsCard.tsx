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
                <div className="p-4 text-center bg-white">
                    <h2 className="text-2xl sm:text-xl font-bold text-purple-dee0">
                        {title}
                    </h2>
                    <p className="text-lg text-purple-med mt-1">{subtitle}</p>
                </div>
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
                 
                </Link>
            </CardContent>
        </Card>
    );
}
