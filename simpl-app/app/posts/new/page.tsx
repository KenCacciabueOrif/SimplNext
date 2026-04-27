/**
 * Last updated: 2026-04-24
 * Changes: Preserved active feed sort and geolocation query context in the back navigation link, while keeping automatic coordinate capture guidance.
 * Purpose: Render the top-level post creation page.
 */

import Link from "next/link";
import PostComposer from "@/app/components/composer/PostComposer";
import { parseSortModeValue } from "@/lib/navigation";

export default async function NewPostPage({
  searchParams,
}: {
  searchParams: Promise<{
    popularity?: string;
    date?: string;
    distance?: string;
    lat?: string;
    lng?: string;
    geo?: string;
  }>;
}) {
  const { popularity, date, distance, lat, lng, geo } = await searchParams;
  const backParams = new URLSearchParams();

  const parsedPopularity = parseSortModeValue(popularity ?? null);
  if (parsedPopularity) backParams.set("popularity", parsedPopularity);

  const parsedDate = parseSortModeValue(date ?? null);
  if (parsedDate) backParams.set("date", parsedDate);

  const parsedDistance = parseSortModeValue(distance ?? null);
  if (parsedDistance) backParams.set("distance", parsedDistance);

  if (lat && lng) {
    backParams.set("lat", lat);
    backParams.set("lng", lng);
  }

  if (geo === "on" || geo === "off") {
    backParams.set("geo", geo);
  }

  const backHref = backParams.toString() ? `/?${backParams.toString()}` : "/";

  return (
    <div className="screen-stack">
      <div className="thread-bar">
        <Link href={backHref} className="thread-bar-link">
          Retour au fil
        </Link>
        <span className="thread-bar-title">Nouveau post</span>
      </div>

      <PostComposer
        heading="Nouveau post"
        submitLabel="Publier"
        description="Ajoute un titre et un message. Les coordonnées sont récupérées automatiquement quand la localisation est active."
      />
    </div>
  );
}
