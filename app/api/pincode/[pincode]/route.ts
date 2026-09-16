import { NextRequest } from "next/server";

type PostalOffice = {
  Name?: string;
  District?: string;
  State?: string;
  Country?: string;
  Pincode?: string;
};

type PostalApiResponse = {
  Message?: string;
  Status?: string;
  PostOffice?: PostalOffice[] | null;
};

export async function GET(
  request: NextRequest,
  context: {
    params: Promise<{ pincode: string }>;
  }
) {
  try {
    const { pincode } = await context.params;

    // Pincode must contain exactly 6 digits.
    if (!/^\d{6}$/.test(pincode)) {
      return Response.json(
        {
          error: "Pincode must contain exactly 6 digits",
        },
        { status: 400 }
      );
    }

    const response = await fetch(
      `https://api.postalpincode.in/pincode/${pincode}`,
      {
        cache: "no-store",
      }
    );

    if (!response.ok) {
      return Response.json(
        {
          error: "Unable to lookup pincode",
        },
        { status: 502 }
      );
    }

    const data: PostalApiResponse[] =
      await response.json();

    const result = data?.[0];

    if (
      !result ||
      result.Status?.toLowerCase() !== "success" ||
      !result.PostOffice ||
      result.PostOffice.length === 0
    ) {
      return Response.json(
        {
          error: "Invalid or unknown pincode",
        },
        { status: 404 }
      );
    }

    const firstOffice = result.PostOffice[0];

    return Response.json({
      pincode,
      city: firstOffice.District ?? "",
      state: firstOffice.State ?? "",
      postOffice: firstOffice.Name ?? "",
    });
  } catch (error) {
    console.error(
      "GET /api/pincode/[pincode] error:",
      error
    );

    return Response.json(
      {
        error: "Failed to lookup pincode",
      },
      { status: 500 }
    );
  }
}
