import { begin, fail, structured, object, string } from "../../lib/server/ai";
import { cleanText } from "../../lib/business";
const choice = object({ title: string, description: string });
const schema = object({
  choices: { type: "array", items: choice },
  tip: string,
  launchPlan: { type: "array", items: string },
});
const prompts = {
  customer:
    "Suggest exactly 3 specific customer groups for the original interest. Do not decide the product yet.",
  product:
    "Suggest exactly 3 realistic, small products or services for the chosen customer and original interest.",
  valueProposition:
    "Suggest exactly 3 short reasons the chosen customer would want the selected product. No jargon.",
  name: "Suggest exactly 5 distinctive business names reflecting the choices. No claims that trademarks or domains are available.",
  imagery:
    "Suggest exactly 4 simple logo symbols based on the selected name, product, customer and interest.",
  price:
    "Suggest exactly 3 starting prices (include currency in title), with short reasoning. Estimates only; note materials/time and guardian help. Do not guarantee profits.",
  firstCustomer:
    "Suggest exactly 3 reachable people the child knows who match their business. No strangers or requests for private contact information.",
  marketingIdea:
    "Suggest exactly 3 simple ways to tell the selected first customer about the product with guardian support.",
  launch:
    "Return 5 short concrete achievable actions for this week in launchPlan using every business decision. Include a sample, feedback and guardian help. Return empty choices.",
};
export const config = {
  api: { bodyParser: { sizeLimit: "64kb" } },
  maxDuration: 180,
};
export default async function handler(req, res) {
  const business = begin(req, res);
  if (!business) return;
  const step = req.body.step;
  if (!Object.hasOwn(prompts, step) || !business.originalIdea)
    return res
      .status(400)
      .json({ error: "Add your idea before asking the coach." });
  try {
    const result = await structured(
      "coach_choices",
      schema,
      prompts[step] +
        " Keep titles under 70 characters, descriptions under 160 characters, and tip under 180. For non-launch steps return empty launchPlan. Never select an option for the child.",
      { business, step },
    );
    const choices = Array.isArray(result.choices)
      ? result.choices
          .slice(0, 5)
          .map((c) => ({
            title: cleanText(c?.title, 80),
            description: cleanText(c?.description, 200),
          }))
          .filter((c) => c.title && c.description)
      : [];
    const launchPlan = Array.isArray(result.launchPlan)
      ? result.launchPlan
          .slice(0, 6)
          .map((s) => cleanText(s, 240))
          .filter(Boolean)
      : [];
    if (step === "launch" ? launchPlan.length < 3 : choices.length < 3)
      throw new Error("Incomplete coach response");
    res
      .status(200)
      .json({ choices, tip: cleanText(result.tip, 200), launchPlan });
  } catch (error) {
    fail(res, error);
  }
}
