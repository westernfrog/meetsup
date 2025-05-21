"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useSocket } from "@/lib/socket";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import {
  Loader2,
  Zap,
  Target,
  Mars,
  Venus,
  Users,
  VenusAndMars,
} from "lucide-react";
import { toast } from "sonner";

export default function Home() {
  const router = useRouter();
  const { socket, isReady } = useSocket();
  const [instantSearching, setInstantSearching] = useState(false);
  const [focusedSearching, setFocusedSearching] = useState(false);
  const [ageRange, setAgeRange] = useState([18, 99]);
  const [gender, setGender] = useState("any");
  const [usePreferences, setUsePreferences] = useState(false);

  // Derived state for any kind of searching
  const isSearching = instantSearching || focusedSearching;

  useEffect(() => {
    if (!isReady || !socket) return;

    const handlePartnerFound = ({ roomId, partner }) => {
      setInstantSearching(false);
      setFocusedSearching(false);

      // Navigate to chat room
      router.push(`/c/${roomId}`);
    };

    const handleMatchedWith = ({ roomId, partner, isInstant }) => {
      // Just notify the user they were matched with someone
      // but don't navigate them anywhere
      toast.info(`${partner.name} wants to chat with you!`, {
        action: {
          label: "Join Chat",
          onClick: () => router.push(`/c/${roomId}`),
        },
      });
    };

    const handleWaitingForPartner = () => {
      // Show notification that we're waiting for a partner
      console.log("Waiting for partner...");
    };

    const handleFindPartnerCanceled = () => {
      setInstantSearching(false);
      setFocusedSearching(false);
      toast.error("Search canceled");
    };

    const handleMatchFailed = ({ reason }) => {
      setInstantSearching(false);
      setFocusedSearching(false);
      toast.error(`Match failed: ${reason}`);
    };

    // Register event listeners
    socket.on("partnerFound", handlePartnerFound);
    socket.on("matchedWith", handleMatchedWith);
    socket.on("waitingForPartner", handleWaitingForPartner);
    socket.on("findPartnerCanceled", handleFindPartnerCanceled);
    socket.on("matchFailed", handleMatchFailed);

    // Cleanup event listeners
    return () => {
      socket.off("partnerFound", handlePartnerFound);
      socket.off("matchedWith", handleMatchedWith);
      socket.off("waitingForPartner", handleWaitingForPartner);
      socket.off("findPartnerCanceled", handleFindPartnerCanceled);
      socket.off("matchFailed", handleMatchFailed);
    };
  }, [isReady, socket, router]);

  const findPartner = (useFocus = false) => {
    if (!isReady || !socket) return;

    if (useFocus) {
      setFocusedSearching(true);

      if (usePreferences) {
        socket.emit("findPartner", {
          preferences: {
            ageMin: ageRange[0],
            ageMax: ageRange[1],
            gender: gender,
          },
        });
      } else {
        socket.emit("findPartner");
      }
    } else {
      setInstantSearching(true);
      socket.emit("findPartner", { isInstantMatch: true });
    }
  };

  const cancelSearch = () => {
    if (!isReady || !socket) return;
    socket.emit("cancelFindPartner");
    setInstantSearching(false);
    setFocusedSearching(false);
  };

  return (
    <Card className="max-w-3xl mx-auto">
      <CardHeader className="pb-2">
        <CardTitle>Find a Chat Partner</CardTitle>
        <CardDescription>
          Set your preferences and start chatting
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="age-range">
              Age Range: {ageRange[0]} - {ageRange[1]}
            </Label>
          </div>
          <Slider
            id="age-range"
            min={18}
            max={99}
            step={1}
            value={ageRange}
            onValueChange={setAgeRange}
            disabled={isSearching}
            className="py-4"
          />
        </div>

        <div className="space-y-2">
          <Label>Gender Preference</Label>
          <div className="flex gap-3">
            <Button
              variant={gender === "Mars" ? "default" : "outline"}
              className="flex-1"
              onClick={() => setGender("Mars")}
              disabled={isSearching}
            >
              <Mars className="h-4 w-4 mr-2" />
              Male
            </Button>
            <Button
              variant={gender === "Venus" ? "default" : "outline"}
              className="flex-1"
              onClick={() => setGender("Venus")}
              disabled={isSearching}
            >
              <Venus className="h-4 w-4 mr-2" />
              Female
            </Button>
            <Button
              variant={gender === "any" ? "default" : "outline"}
              className="flex-1"
              onClick={() => setGender("any")}
              disabled={isSearching}
            >
              <VenusAndMars className="h-4 w-4 mr-2" />
              Both
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <Switch
              id="use-preferences"
              checked={usePreferences}
              onCheckedChange={setUsePreferences}
              disabled={isSearching}
            />
            <Label htmlFor="use-preferences">Enable preference filtering</Label>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
          <div className="bg-muted/50 rounded-lg p-4 border border-border flex flex-col h-full">
            <div className="flex-1">
              <h4 className="font-medium flex items-center mb-2 text-lg">
                <Zap className="h-5 w-5 mr-2 text-primary" />
                Instant Match
              </h4>
              <p className="text-sm text-muted-foreground mb-4">
                Connect with anyone online or offline immediately without
                considering preferences.
              </p>
            </div>
            {instantSearching ? (
              <Button
                onClick={cancelSearch}
                variant="destructive"
                className="w-full mt-2"
              >
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Cancel Search
              </Button>
            ) : (
              <Button
                onClick={() => findPartner(false)}
                disabled={!isReady || isSearching}
                className="w-full mt-2"
                variant="default"
              >
                <Zap className="mr-2 h-4 w-4" />
                Instant Match
              </Button>
            )}
          </div>

          <div className="bg-muted/50 rounded-lg p-4 border border-border flex flex-col h-full">
            <div className="flex-1">
              <h4 className="font-medium flex items-center mb-2 text-lg">
                <Target className="h-5 w-5 mr-2 text-primary" />
                Focused Match
              </h4>
              <p className="text-sm text-muted-foreground mb-4">
                Search for partners that match your age and gender preferences
                for a more tailored experience.
              </p>
            </div>
            {focusedSearching ? (
              <Button
                onClick={cancelSearch}
                variant="destructive"
                className="w-full mt-2"
              >
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Cancel Search
              </Button>
            ) : (
              <Button
                onClick={() => findPartner(true)}
                disabled={!isReady || isSearching || !usePreferences}
                className="w-full mt-2"
                variant={usePreferences ? "default" : "outline"}
              >
                <Target className="mr-2 h-4 w-4" />
                Focused Match
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
