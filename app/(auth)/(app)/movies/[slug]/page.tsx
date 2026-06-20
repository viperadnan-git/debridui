"use client";

import { useParams } from "next/navigation";
import { MediaDetailView } from "@/components/mdb/media-detail-view";

export default function MoviePage() {
    const { slug } = useParams<{ slug: string }>();
    return <MediaDetailView id={slug} type="movie" />;
}
