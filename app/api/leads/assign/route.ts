import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";

import clientPromise from "@/lib/db/mongodb";
import { getSession } from "@/lib/auth/session";

import {
  evaluateLenderEligibility,
  Lender,
  Lead,
} from "@/lib/bre/lenderEligibility";

import { assignAgentRoundRobin } from "@/lib/db/assignment";
import { createLeadLenderRelationship } from "@/lib/db/leadLenders";

export async function POST(request: Request) {
  try {

    const session = await getSession();

    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    if (session.role !== "lender_admin") {
      return NextResponse.json(
        {
          error: "Only lender admins can assign leads",
        },
        { status: 403 }
      );
    }

    if (!session.lenderId) {
      return NextResponse.json(
        {
          error: "Lender admin has no lenderId",
        },
        { status: 403 }
      );
    }


    const body = await request.json();

    const leadIds = body?.leadIds;

    if (!Array.isArray(leadIds) || leadIds.length === 0) {
      return NextResponse.json(
        {
          error: "Please select at least one lead",
        },
        { status: 400 }
      );
    }

    // Remove duplicates
    const uniqueLeadIds = [
      ...new Set(
        leadIds.filter(
          (id: unknown): id is string =>
            typeof id === "string"
        )
      ),
    ];

    if (uniqueLeadIds.length === 0) {
      return NextResponse.json(
        {
          error: "No valid lead IDs were provided",
        },
        { status: 400 }
      );
    }

    const invalidIds = uniqueLeadIds.filter(
      (id) => !ObjectId.isValid(id)
    );

    if (invalidIds.length > 0) {
      return NextResponse.json(
        {
          error: "One or more lead IDs are invalid",
          invalidIds,
        },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB);

    const lender = await db.collection("lenders").findOne({
      lender_id: session.lenderId,
    });

    if (!lender) {
      return NextResponse.json(
        {
          error: "Lender not found",
        },
        { status: 404 }
      );
    }

    const lenderRules: Lender = {
      lender_id: lender.lender_id,
      name: lender.name,
      isActive: lender.isActive,
      priority: lender.priority ?? 0,

      minAge: lender.minAge ?? null,
      maxAge: lender.maxAge ?? null,

      minIncome: lender.minIncome ?? null,

      minCreditScore_exclusive:
        lender.minCreditScore_exclusive ?? null,

      maxCreditScore_inclusive:
        lender.maxCreditScore_inclusive ?? null,

      employmentTypes:
        typeof lender.employmentTypes === "string"
          ? lender.employmentTypes
          : null,

      supportedPincodes:
        typeof lender.supportedPincodes === "string"
          ? lender.supportedPincodes
          : null,
    };


    const assigned: {
      leadId: string;
      agentId: string;
    }[] = [];

    const skipped: {
      leadId: string;
      reason: string;
      reasons?: string[];
    }[] = [];

    for (const leadId of uniqueLeadIds) {
      const leadObjectId = new ObjectId(leadId);

      const lead = await db.collection("leads").findOne({
        _id: leadObjectId,
      });

      if (!lead) {
        skipped.push({
          leadId,
          reason: "Lead not found",
        });

        continue;
      }

      const existingRelationship =
        await db.collection("lead_lenders").findOne({
          leadId: leadObjectId,
          lenderId: session.lenderId,
        });

      if (existingRelationship) {
        skipped.push({
          leadId,
          reason: "Lead is already assigned to this lender",
        });

        continue;
      }

      const eligibility = evaluateLenderEligibility(
        lead as Lead,
        lenderRules
      );

      if (!eligibility.eligible) {
        skipped.push({
          leadId,
          reason: "Lead is not eligible for this lender",
          reasons: eligibility.reasons,
        });

        continue;
      }


      const agentId = await assignAgentRoundRobin(
        session.lenderId
      );

      if (!agentId) {
        skipped.push({
          leadId,
          reason:
            "No active agents available for this lender",
        });

        continue;
      }

      await createLeadLenderRelationship({
        leadId: leadObjectId,
        lenderId: session.lenderId,
        eligibilityStatus: "eligible",
        assignedAgentId: agentId,
      });

      assigned.push({
        leadId,
        agentId,
      });
    }

    return NextResponse.json(
      {
        message: "Lead assignment completed",

        summary: {
          requested: uniqueLeadIds.length,
          assigned: assigned.length,
          skipped: skipped.length,
        },

        assigned,
        skipped,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error(
      "POST /api/leads/assign error:",
      error
    );

    return NextResponse.json(
      {
        error: "Failed to assign leads",
      },
      { status: 500 }
    );
  }
}