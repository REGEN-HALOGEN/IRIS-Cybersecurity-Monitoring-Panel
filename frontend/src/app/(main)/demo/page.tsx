"use client";

import { DottedSurface } from "@/components/ui/dotted-surface";
import { cn } from '@/lib/utils';
import { Card, CardContent } from "@/components/ui/card";
import { Sparkles } from "lucide-react";

export default function DemoDottedSurface() {
 return (
		<DottedSurface className="size-full">
			<div className="absolute inset-0 flex items-center justify-center">
				<div
					aria-hidden="true"
					className={cn(
						'pointer-events-none absolute -top-10 left-1/2 size-full -translate-x-1/2 rounded-full',
						'bg-[radial-gradient(ellipse_at_center,var(--foreground)_10%,transparent_50%)]',
						'blur-[30px] opacity-10',
					)}
				/>
                <Card className="z-10 shadow-2xl border-primary/20 bg-background/80 backdrop-blur-md">
                    <CardContent className="p-8 flex flex-col items-center justify-center text-center space-y-4">
                        <Sparkles className="h-12 w-12 text-primary" />
				        <h1 className="font-mono text-4xl font-bold tracking-tight">Dotted Surface</h1>
                        <p className="text-muted-foreground whitespace-nowrap">Three.js animated wave point grid</p>
                    </CardContent>
                </Card>
			</div>
		</DottedSurface>
	);
}
