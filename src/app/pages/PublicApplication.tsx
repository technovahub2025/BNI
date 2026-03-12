import { FormEvent, useEffect, useState } from "react";
import { useSearchParams } from "react-router";
import { Send, CheckCircle } from "lucide-react";
import { Card, CardContent } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import { Button } from "../components/ui/button";
import { apiGet, apiPost, toQuery } from "../lib/api";

type ApplicationStatusResponse = {
  submitted: boolean;
  lead: {
    _id: string;
    name: string;
    phone: string;
  } | null;
  application: {
    name?: string;
    phone?: string;
    email?: string;
    city?: string;
    notes?: string;
    submittedAt?: string;
  } | null;
};

type ApplicationSubmitResponse = {
  ok: boolean;
  lead: {
    _id: string;
    name: string;
    phone: string;
  };
  application: {
    name?: string;
    phone?: string;
    email?: string;
    city?: string;
    notes?: string;
    submittedAt?: string;
  } | null;
};

export function PublicApplicationPage() {
  const [searchParams] = useSearchParams();
  const leadId = searchParams.get("leadId") || "";
  const phoneFromQuery = searchParams.get("phone") || "";
  const [form, setForm] = useState({
    name: searchParams.get("name") || "",
    phone: phoneFromQuery,
    email: "",
    city: "",
    goals: "",
  });
  const [resolvedLeadId, setResolvedLeadId] = useState(leadId);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoadingStatus, setIsLoadingStatus] = useState(Boolean(leadId || phoneFromQuery));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function loadApplicationStatus() {
      if (!leadId && !phoneFromQuery) {
        setIsLoadingStatus(false);
        return;
      }

      try {
        const response = await apiGet<ApplicationStatusResponse>(
          `/public/application${toQuery({ leadId, phone: phoneFromQuery })}`
        );

        if (!isMounted) return;

        if (response.lead?._id) {
          setResolvedLeadId(response.lead._id);
        }

        setForm((current) => ({
          name: response.application?.name || response.lead?.name || current.name,
          phone: response.application?.phone || response.lead?.phone || current.phone,
          email: response.application?.email || current.email,
          city: response.application?.city || current.city,
          goals: response.application?.notes || current.goals,
        }));

        if (response.submitted) {
          setIsSubmitted(true);
          setStatusMessage("Form Submitted");
        }
      } catch (error) {
        if (!isMounted) return;
        setStatusMessage(error instanceof Error ? error.message : "Failed to load application status");
      } finally {
        if (isMounted) {
          setIsLoadingStatus(false);
        }
      }
    }

    loadApplicationStatus();

    return () => {
      isMounted = false;
    };
  }, [leadId, phoneFromQuery]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSubmitted || isSubmitting) return;

    setIsSubmitting(true);
    setStatusMessage("");

    let nextLeadId = resolvedLeadId;

    try {
      if (!nextLeadId) {
        const captureResponse = await apiPost<{ lead: { _id: string } }>("/public/capture", {
          name: form.name,
          phone: form.phone,
          source: "public_application",
          customFields: {
            email: form.email,
            city: form.city,
            goals: form.goals,
          },
        });
        nextLeadId = captureResponse.lead._id;
        setResolvedLeadId(nextLeadId);
      }

      const response = await apiPost<ApplicationSubmitResponse>("/public/application", {
        leadId: nextLeadId,
        name: form.name,
        phone: form.phone,
        email: form.email,
        city: form.city,
        notes: form.goals,
      });

      setResolvedLeadId(response.lead._id);
      setForm({
        name: response.application?.name || response.lead.name || form.name,
        phone: response.application?.phone || response.lead.phone || form.phone,
        email: response.application?.email || form.email,
        city: response.application?.city || form.city,
        goals: response.application?.notes || form.goals,
      });
      setIsSubmitted(true);
      setStatusMessage("Form Submitted");
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : "Failed to submit application");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.18),transparent_24%),linear-gradient(180deg,#f8fdff_0%,#f3fbff_52%,#ecf8ff_100%)] flex items-center justify-center p-6">
      <div className="max-w-6xl w-full grid grid-cols-1 lg:grid-cols-2 gap-12">
        <div className="flex flex-col justify-center">
          <div className="mb-6">
            <h1 className="text-5xl font-bold text-slate-900 mb-4">LeadOS</h1>
            <h2 className="text-3xl font-semibold text-slate-900 mb-4">
              Automation that converts replies into qualified members.
            </h2>
            <p className="text-xl text-slate-600">
              WhatsApp workflows, lead scoring, and onboarding in one place.
            </p>
          </div>

          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-cyan-100 flex items-center justify-center flex-shrink-0 shadow-[0_10px_25px_rgba(34,211,238,0.18)]">
                <CheckCircle className="w-6 h-6 text-sky-600" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-900 mb-1">Automated Workflows</h3>
                <p className="text-slate-600">
                  Set up intelligent WhatsApp message sequences that nurture leads automatically
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-cyan-100 flex items-center justify-center flex-shrink-0 shadow-[0_10px_25px_rgba(34,211,238,0.18)]">
                <CheckCircle className="w-6 h-6 text-sky-600" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-900 mb-1">Smart Lead Scoring</h3>
                <p className="text-slate-600">
                  Track engagement and automatically qualify high-intent leads
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-cyan-100 flex items-center justify-center flex-shrink-0 shadow-[0_10px_25px_rgba(34,211,238,0.18)]">
                <CheckCircle className="w-6 h-6 text-sky-600" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-900 mb-1">Seamless Onboarding</h3>
                <p className="text-slate-600">
                  Convert qualified leads into members with structured onboarding
                </p>
              </div>
            </div>
          </div>
        </div>

        <div>
          <Card className="border-sky-100 bg-white/92 shadow-[0_24px_70px_rgba(8,145,178,0.14)] backdrop-blur">
            <CardContent className="p-8">
              <div className="mb-6">
                <h2 className="text-2xl font-semibold text-slate-900 mb-2">
                  Apply for Membership
                </h2>
                <p className="text-slate-600">
                  Fill out the form below and we'll get back to you shortly
                </p>
              </div>

              {statusMessage ? (
                <div
                  className={`mb-5 rounded-lg border px-4 py-3 text-sm ${
                    isSubmitted
                      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                      : "border-amber-200 bg-amber-50 text-amber-700"
                  }`}
                >
                  {statusMessage}
                </div>
              ) : null}

              <form className="space-y-5" onSubmit={handleSubmit}>
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name *</Label>
                  <Input id="name" placeholder="Enter your full name" required value={form.name} disabled={isSubmitted || isLoadingStatus} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number *</Label>
                  <Input id="phone" type="tel" placeholder="+1 (555) 123-4567" required value={form.phone} disabled={isSubmitted || isLoadingStatus} onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email Address *</Label>
                  <Input id="email" type="email" placeholder="you@example.com" required value={form.email} disabled={isSubmitted || isLoadingStatus} onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="city">City *</Label>
                  <Input id="city" placeholder="Enter your city" required value={form.city} disabled={isSubmitted || isLoadingStatus} onChange={(event) => setForm((current) => ({ ...current, city: event.target.value }))} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="goals">What are your goals? *</Label>
                  <Textarea id="goals" rows={4} placeholder="Tell us about what you're looking to achieve..." required value={form.goals} disabled={isSubmitted || isLoadingStatus} onChange={(event) => setForm((current) => ({ ...current, goals: event.target.value }))} />
                </div>

                <Button className="h-12 w-full gap-2 bg-sky-500 text-base text-white hover:bg-sky-600 shadow-[0_14px_32px_rgba(14,165,233,0.26)]" type="submit" disabled={isSubmitted || isLoadingStatus || isSubmitting}>
                  <Send className="w-5 h-5" />
                  {isSubmitted ? "Form Submitted" : isSubmitting ? "Submitting..." : "Submit Application"}
                </Button>

                <p className="text-sm text-slate-500 text-center">
                  By submitting this form, you agree to our terms and conditions
                </p>
              </form>
            </CardContent>
          </Card>

          <div className="mt-6 text-center">
            <p className="text-sm text-slate-600">
              Already have an account?{" "}
              <a href="/" className="font-medium text-sky-600 hover:text-sky-700">
                Sign in here
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
