import React from "react";
import TrackClientPage from "./TrackClientPage";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function Page({ params }: PageProps) {
  const resolvedParams = await params;
  return <TrackClientPage id={resolvedParams.id} />;
}
