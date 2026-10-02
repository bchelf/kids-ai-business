import { begin, fail, structured, object, string } from "../../lib/server/ai";
import { cleanText, sanitizeWebsite } from "../../lib/business";
const schema = object({
  headline: string,
  subheadline: string,
  cta: string,
  about: string,
  productName: string,
  productDescription: string,
  price: string,
  theme: object({
    primaryColor: string,
    secondaryColor: string,
    accentColor: string,
    style: { type: "string", enum: ["playful", "modern", "bold"] },
    logoSize: { type: "string", enum: ["normal", "large"] },
  }),
  sections: { type: "array", items: object({ title: string, text: string }) },
});
export const config = {
  api: { bodyParser: { sizeLimit: "64kb" } },
  maxDuration: 180,
};
export default async function handler(req, res) {
  const business = begin(req, res);
  if (!business) return;
  if (!business.name || !business.product || !business.price)
    return res
      .status(400)
      .json({ error: "Finish your business blueprint first." });
  try {
    let current = null;
    if (req.body.website) current = sanitizeWebsite(req.body.website);
    const result = await structured(
      "business_website",
      schema,
      "Create a concise polished landing-page specification, never executable code or HTML. Respect all business decisions including the exact price. Use the brand's chosen hex colors, unless the child's edit requests a color change. Choose playful, modern or bold. Use a short headline, subheadline, CTA, about paragraph, product name and description, and 2 short supporting sections. Do not invent reviews, customer counts, credentials, contact details, guaranteed outcomes, registered domains or payment functionality. If editing, preserve other fields and follow the requested copy/design change. A CTA invites viewing the sample, not payment.",
      {
        business,
        currentWebsite: current,
        edit: cleanText(req.body.instruction, 500),
      },
    );
    res.status(200).json({ website: sanitizeWebsite(result) });
  } catch (error) {
    fail(res, error);
  }
}
