import clientPromise from "@/lib/db/mongodb";

export type DeleteLenderResult = {
  lenderId: string;
  deleted: {
    lender: number;
    users: number;
    leadLenders: number;
    loanOffers: number;
    assignmentCounter: number;
    leadEvents: number;
  };
};

export async function deleteLenderCompletely(
  lenderId: string
): Promise<DeleteLenderResult> {
  const client = await clientPromise;
  const db = client.db(process.env.MONGODB_DB);

  const lendersCollection = db.collection("lenders");
  const usersCollection = db.collection("users");
  const leadLendersCollection =
    db.collection("lead_lenders");
  const loanOffersCollection =
    db.collection("loan_offers");
  const assignmentCountersCollection =
    db.collection("assignment_counters");
  const leadEventsCollection =
    db.collection("lead_events");

  // --------------------------------------------------
  // 1. Make sure lender exists
  // --------------------------------------------------

  const lender = await lendersCollection.findOne({
    lender_id: lenderId,
  });

  if (!lender) {
    throw new Error("LENDER_NOT_FOUND");
  }

  // --------------------------------------------------
  // 2. Find all lender users
  // --------------------------------------------------

  const lenderUsers = await usersCollection
    .find(
      { lenderId },
      { projection: { _id: 1 } }
    )
    .toArray();

  const lenderUserIds = lenderUsers.map(
    (user) => user._id
  );

  // --------------------------------------------------
  // 3. Delete lender-specific users
  // --------------------------------------------------

  const usersResult =
    await usersCollection.deleteMany({
      lenderId,
    });

  // --------------------------------------------------
  // 4. Delete lead-lender relationships
  // --------------------------------------------------

  const leadLendersResult =
    await leadLendersCollection.deleteMany({
      lenderId,
    });

  // --------------------------------------------------
  // 5. Delete lender-specific loan offers
  // --------------------------------------------------

  const loanOffersResult =
    await loanOffersCollection.deleteMany({
      lenderId,
    });

  // --------------------------------------------------
  // 6. Delete assignment counter
  // --------------------------------------------------

  const assignmentCounterResult =
    await assignmentCountersCollection.deleteOne({
      lenderId,
    });

  // --------------------------------------------------
  // 7. Delete lender-related events
  // --------------------------------------------------

  const leadEventsFilter: Record<string, unknown> = {
    lenderId,
  };

  if (lenderUserIds.length > 0) {
    leadEventsFilter.userId = {
      $in: lenderUserIds,
    };
  }

  const leadEventsResult =
    await leadEventsCollection.deleteMany(
      leadEventsFilter
    );

  // --------------------------------------------------
  // 8. Finally delete the lender
  // --------------------------------------------------

  const lenderResult =
    await lendersCollection.deleteOne({
      lender_id: lenderId,
    });

  return {
    lenderId,
    deleted: {
      lender: lenderResult.deletedCount,
      users: usersResult.deletedCount,
      leadLenders:
        leadLendersResult.deletedCount,
      loanOffers:
        loanOffersResult.deletedCount,
      assignmentCounter:
        assignmentCounterResult.deletedCount,
      leadEvents:
        leadEventsResult.deletedCount,
    },
  };
}