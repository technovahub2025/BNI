import { useEffect, useMemo, useState } from "react";
import { CalendarCheck, PhoneCall, Video } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { apiGet, apiPatch, formatDateTime } from "../lib/api";

type Meeting = {
  _id: string;
  title: string;
  status: "requested" | "scheduled" | "completed" | "cancelled";
  channel: "zoom" | "call";
  scheduledFor?: string | null;
  joinUrl?: string;
  leadId?: {
    _id: string;
    name: string;
    phone: string;
    status: string;
    stage: string | null;
  } | null;
};

export function MeetingsPage() {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    apiGet<Meeting[]>("/meetings", controller.signal)
      .then((data) => {
        setMeetings(data);
        setLoadError(null);
      })
      .catch((error) => {
        setLoadError(error instanceof Error ? error.message : "Failed to load meetings");
      });

    return () => controller.abort();
  }, []);

  const scheduledCount = useMemo(
    () => meetings.filter((meeting) => meeting.status === "scheduled").length,
    [meetings]
  );
  const requestedCount = useMemo(
    () => meetings.filter((meeting) => meeting.status === "requested").length,
    [meetings]
  );
  const completedCount = useMemo(
    () => meetings.filter((meeting) => meeting.status === "completed").length,
    [meetings]
  );

  const updateMeeting = async (meetingId: string, updates: Partial<Meeting>) => {
    const updated = await apiPatch<Meeting>(`/meetings/${meetingId}`, updates);
    setMeetings((current) => current.map((meeting) => (meeting._id === meetingId ? updated : meeting)));
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-semibold text-slate-900">Meetings</h1>
        <p className="text-slate-500 mt-1">Track requested demos, scheduled calls, and completed sessions</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-slate-500 mb-1">Requested</p>
            <p className="text-3xl font-semibold text-amber-600">{requestedCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-slate-500 mb-1">Scheduled</p>
            <p className="text-3xl font-semibold text-sky-600">{scheduledCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-slate-500 mb-1">Completed</p>
            <p className="text-3xl font-semibold text-green-600">{completedCount}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Meeting Queue</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {loadError ? (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              Could not load meetings: {loadError}
            </div>
          ) : null}
          {meetings.length ? (
            meetings.map((meeting) => (
              <div key={meeting._id} className="rounded-xl border border-slate-200 p-4">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <h3 className="font-medium text-slate-900">{meeting.leadId?.name || "Unknown Lead"}</h3>
                      <Badge
                        variant="secondary"
                        className={
                          meeting.status === "completed"
                            ? "bg-green-100 text-green-700"
                            : meeting.status === "scheduled"
                              ? "bg-sky-100 text-sky-700"
                              : meeting.status === "cancelled"
                                ? "bg-red-100 text-red-700"
                                : "bg-amber-100 text-amber-700"
                        }
                      >
                        {meeting.status.replace(/\b\w/g, (char) => char.toUpperCase())}
                      </Badge>
                    </div>
                    <p className="text-sm text-slate-500">{meeting.title}</p>
                    <div className="flex flex-wrap items-center gap-4 text-sm text-slate-600">
                      <span className="flex items-center gap-2">
                        {meeting.channel === "call" ? <PhoneCall className="w-4 h-4" /> : <Video className="w-4 h-4" />}
                        {meeting.channel === "call" ? "Phone Call" : "Zoom Meeting"}
                      </span>
                      <span className="flex items-center gap-2">
                        <CalendarCheck className="w-4 h-4" />
                        {formatDateTime(meeting.scheduledFor)}
                      </span>
                      <span>{meeting.leadId?.phone || "-"}</span>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-3">
                    {meeting.joinUrl ? (
                      <Button variant="outline" onClick={() => window.open(meeting.joinUrl, "_blank", "noopener,noreferrer")}>
                        Open Link
                      </Button>
                    ) : null}
                    {meeting.status !== "scheduled" ? (
                      <Button className="bg-sky-500 hover:bg-sky-600" onClick={() => updateMeeting(meeting._id, { status: "scheduled" })}>
                        Mark Scheduled
                      </Button>
                    ) : null}
                    {meeting.status !== "completed" ? (
                      <Button variant="outline" onClick={() => updateMeeting(meeting._id, { status: "completed" })}>
                        Mark Completed
                      </Button>
                    ) : null}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="rounded-xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500">
              No meetings yet. Demo and call requests will appear here.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
