import clientPromise from "./mongodb";

export async function assignAgentRoundRobin(
  lenderId: string
): Promise<string | null> {
  const client = await clientPromise;

  const db = client.db(process.env.MONGODB_DB);

  // Get active agents belonging to this lender
  const agents = await db
    .collection("users")
    .find({
      lenderId,
      role: "lender_agent",
      isActive: { $ne: false },//not equal
    })
    .sort({ _id: 1 })
    .toArray();

  // No agents available
  if (agents.length === 0) {
    return null;
  }

  const counter = await db
    .collection("assignment_counters")
    .findOneAndUpdate(
      { lenderId },
      {
        $inc: {
          nextIndex: 1,
        },
        $setOnInsert: {
          lenderId,
          createdAt: new Date(),
        },
      },
      {
        upsert: true,
        returnDocument: "before",
      }
    );

  const currentIndex =
    counter?.nextIndex ?? 0;

  const agentIndex =
    currentIndex % agents.length;

  return agents[agentIndex]._id.toString();
}