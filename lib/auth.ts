import "server-only";

import { cache } from "react";
import { prisma } from "@/lib/prisma";
import { getCurrentWalletSession } from "@/lib/session";

export const getAuthenticatedUser = cache(async function getAuthenticatedUser() {
  const session = await getCurrentWalletSession();

  if (!session) {
    return null;
  }

  const wallet = await prisma.wallet.findUnique({
    where: { address: session.address },
    include: { user: true },
  });

  if (!wallet || wallet.userId !== session.userId) {
    return null;
  }

  return {
    user: wallet.user,
    wallet,
    session,
  };
});
