import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";

export async function GET() {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    if (session.role !== "super_admin") {
      return NextResponse.json(
        { error: "Forbidden" },
        { status: 403 }
      );
    }

    const { default: clientPromise } = await import(
      "@/lib/db/mongodb"
    );

    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB);

    const [
      totalLenders,
      activeLenders,
      totalUsers,
      activeUsers,
      totalLeads,
      totalLeadLenders,
      totalLoanOffers,
      totalLeadEvents,
    ] = await Promise.all([
      db.collection("lenders").countDocuments(),

      db.collection("lenders").countDocuments({
        isActive: true,
      }),

      db.collection("users").countDocuments(),

      db.collection("users").countDocuments({
        isActive: { $ne: false },
      }),

      db.collection("leads").countDocuments(),

      db.collection("lead_lenders").countDocuments(),

      db.collection("loan_offers").countDocuments(),

      db.collection("lead_events").countDocuments(),
    ]);

    const usersByRole = await db
      .collection("users")
      .aggregate([
        {
          $group: {
            _id: "$role",
            count: { $sum: 1 },
          },
        },
      ])
      .toArray();

    const roleCounts: Record<string, number> = {};

    for (const item of usersByRole) {
      roleCounts[item._id] = item.count;
    }

    return NextResponse.json({
      stats: {
        lenders: {
          total: totalLenders,
          active: activeLenders,
          inactive: totalLenders - activeLenders,
        },

        users: {
          total: totalUsers,
          active: activeUsers,
          inactive: totalUsers - activeUsers,
          byRole: roleCounts,
        },

        leads: {
          total: totalLeads,
        },

        leadLenders: {
          total: totalLeadLenders,
        },

        loanOffers: {
          total: totalLoanOffers,
        },

        leadEvents: {
          total: totalLeadEvents,
        },
      },
    });
  } catch (error) {
    console.error("Super Admin stats error:", error);

    return NextResponse.json(
      { error: "Failed to fetch platform statistics" },
      { status: 500 }
    );
  }
}