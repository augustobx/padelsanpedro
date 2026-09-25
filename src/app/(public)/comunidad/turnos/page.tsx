import { getOpenMatches, getUserUpcomingBookings } from "@/actions/community-matches";
import { getUserSession } from "@/actions/user-auth";
import OpenMatchesClient from "@/components/community/OpenMatchesClient";

export const metadata = {
  title: "Partidos Abiertos — Padel San Pedro",
  description: "Búsqueda y convocatoria de compañeros para partidos en canchas de San Pedro.",
};

export default async function TurnosArmadosPage() {
  const [session, openMatchesRes, userBookingsRes] = await Promise.all([
    getUserSession(),
    getOpenMatches(),
    getUserUpcomingBookings(),
  ]);

  return (
    <OpenMatchesClient
      initialMatches={openMatchesRes?.matches || []}
      currentUserId={session?.id || null}
      userBookings={userBookingsRes?.bookings || []}
    />
  );
}

