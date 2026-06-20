"use client";

import { useParams } from "next/navigation";
import { MediaDetailView } from "@/components/mdb/media-detail-view";

export default function TitlePage() {
    const { imdbId } = useParams<{ imdbId: string }>();
    return <MediaDetailView id={imdbId} idType="imdb" />;
}
