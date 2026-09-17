import clientPromise from "./mongodb";
import { SessionPayload } from "../auth/session";
import { ObjectId } from "mongodb";

export async function getLeadDetailForUser(
  session: SessionPayload,
  leadId: ObjectId
) {
  const client = await clientPromise;

  const db = client.db(process.env.MONGODB_DB);

  const relationshipMatch: Record<string, any> = {
    leadId,
  };

  if (session.role === "ops_admin") {
    // No lender restriction.
  } 
  
  else if (session.role === "lender_admin") {
    if (!session.lenderId) {
      throw new Error("Lender admin has no lenderId");
    }
    relationshipMatch.lenderId = session.lenderId;

  } else if (session.role === "lender_agent") {
    if (!session.lenderId) {
      throw new Error("Lender agent has no lenderId");
    }

    relationshipMatch.lenderId = session.lenderId;
    relationshipMatch.assignedAgentId = session.userId;

  } else {
    throw new Error("Invalid role");
  }

  console.log("GET LEAD DETAIL DEBUG", {
  userId: session.userId,
  email: session.email,
  role: session.role,
  lenderId: session.lenderId,
  leadId: leadId.toString(),
  relationshipMatch,
});

  const result = await db
    .collection("lead_lenders")
    .aggregate([
      {
        $match: relationshipMatch,   //Only keep the records that satisfy the rules we just created
      },

      {
        $lookup: {    //go to the leads collection and find the actual lead information
          from: "leads",
          localField: "leadId",
          foreignField: "_id",
          as: "lead",   //attach lead here
        },
      },

      {
        $unwind: "$lead",
      },

      {
        $lookup: {
          from: "loan_offers",
          let: {
            currentLeadId: "$leadId",
            currentLenderId: "$lenderId",
          },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    {
                      $eq: [
                        "$leadId",
                        "$$currentLeadId",
                      ],
                    },
                    {
                      $eq: [
                        "$lenderId",
                        "$$currentLenderId",
                      ],
                    },
                  ],
                },
              },
            },
            {
              $sort: {
                createdAt: -1,
              },
            },
          ],
          as: "offers",
        },
      },

      {
        $lookup: {
          from: "lead_events",
          let: {
            currentLeadId: "$leadId",
            currentLenderId: "$lenderId",
          },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    {
                      $eq: [
                        "$leadId",
                        "$$currentLeadId",
                      ],
                    },
                    {
                      $eq: [
                        "$lenderId",
                        "$$currentLenderId",
                      ],
                    },
                  ],
                },
              },
            },
            {
              $sort: {
                createdAt: -1,
              },
            },
          ],
          as: "history",
        },
      },

      /*
      {
      _id: "R1",
      lenderId: "ram-fincorp",
      leadId: "L1",

      lead: {
      borrowerName: "Rahul Sharma",
      phone: "9876543210",
      loanAmount: 500000
      },

      offers: [
      { amount: 500000 },
      { amount: 450000 }
      ],

      history: [
      { type: "NOTE_ADDED" },
      { type: "CALL_OUTCOME" },
      { type: "ASSIGNED" }
      ]
      }
      */

      {
        $project: {  //select in sql
          _id: 1,
          lenderId: 1,
          leadId: 1,
          eligibilityStatus: 1,
          assignmentStatus: 1,
          assignedAgentId: 1,
          status: 1,
          followUpDate: 1,
          createdAt: 1,
          updatedAt: 1,
          borrower: {
            id: "$lead._id",
            sourceLeadId:
              "$lead.sourceLeadId",
            borrowerName:
              "$lead.borrowerName",
            phone:
              "$lead.phone",
            loanAmount:
              "$lead.loanAmount",
            loanPurpose:
              "$lead.loanPurpose",
            dateOfBirth:
              "$lead.dateOfBirth",
            gender:
              "$lead.gender",
            maritalStatus:
              "$lead.maritalStatus",
            employmentType:
              "$lead.employmentType",
            income:
              "$lead.income",
            workExperience:
              "$lead.workExperience",
            creditScore:
              "$lead.creditScore",
            addressLine1:
              "$lead.addressLine1",
            addressLine2:
              "$lead.addressLine2",
            city:
              "$lead.city",
            state:
              "$lead.state",
            pincode:
              "$lead.pincode",
            createdAt:
              "$lead.createdAt",
            updatedAt:
              "$lead.updatedAt",
          },
          offers: 1,
          history: 1,
        },
      },
    ])
    .toArray();

  return result[0] ?? null;
}